import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders as baseCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireSession } from "../_shared/auth.ts";

const corsHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-token",
};

const BUCKET = "organization-branding";
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

type AssetType = "logo" | "logo-icon" | "favicon";

function extensionFor(file: File, assetType: AssetType): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["png", "jpg", "jpeg", "webp", "svg", "ico"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/svg+xml") return "svg";
  if (file.type.includes("icon")) return "ico";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/jpeg") return "jpg";
  return assetType === "favicon" ? "ico" : "png";
}

function storagePath(organizationId: number, assetType: AssetType, ext: string): string {
  return `org-${organizationId}/${assetType}.${ext}`;
}

function publicAssetUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const auth = await requireSession(req, supabase);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (auth.userId !== -1) {
    return new Response(JSON.stringify({ error: "SuperAdmin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const file = formData.get("file");
  const organizationIdRaw = formData.get("organizationId");
  const assetTypeRaw = formData.get("assetType");

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Bestand is verplicht" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const organizationId = Number.parseInt(String(organizationIdRaw ?? ""), 10);
  if (!Number.isFinite(organizationId) || organizationId < 1) {
    return new Response(JSON.stringify({ error: "Ongeldig organizationId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const assetType = String(assetTypeRaw ?? "") as AssetType;
  if (!["logo", "logo-icon", "favicon"].includes(assetType)) {
    return new Response(JSON.stringify({ error: "Ongeldig assetType" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "Bestand te groot (max. 5 MB)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return new Response(JSON.stringify({ error: "Bestandstype niet toegestaan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ext = extensionFor(file, assetType);
  const path = storagePath(organizationId, assetType, ext);
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.error("Branding asset upload failed:", uploadError);
    return new Response(JSON.stringify({ error: "Upload mislukt" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const publicUrl = publicAssetUrl(supabaseUrl, path);

  return new Response(
    JSON.stringify({
      success: true,
      publicUrl,
      path,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
