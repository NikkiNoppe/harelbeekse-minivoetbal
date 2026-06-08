// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { requireSession } from "../_shared/auth.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

interface DeleteUserRequest {
  userId: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const auth = await requireSession(req, supabase, { adminOnly: true });
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { userId }: DeleteUserRequest = await req.json();
    if (!userId || typeof userId !== 'number' || userId < 1) {
      return new Response(JSON.stringify({ error: 'Invalid userId' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const updates = [
      supabase.from('financial_settings').update({ updated_by: null }).eq('updated_by', userId),
      supabase.from('team_transactions').update({ created_by: null }).eq('created_by', userId),
      supabase.from('cost_setting_audit_log').update({ changed_by: null }).eq('changed_by', userId),
    ];

    for (const op of updates) {
      const { error } = await op;
      if (error) {
        console.warn('Warning during FK nullification:', error.message);
      }
    }

    const { error: tuErr } = await supabase.from('team_users').delete().eq('user_id', userId);
    if (tuErr) console.warn('Warning deleting team_users:', tuErr.message);

    const { error: prtErr } = await supabase.from('password_reset_tokens').delete().eq('user_id', userId);
    if (prtErr) console.warn('Warning deleting password_reset_tokens:', prtErr.message);

    await supabase.from('user_sessions').delete().eq('user_id', userId);

    const { error: userErr } = await supabase.from('users').delete().eq('user_id', userId);
    if (userErr) {
      return new Response(JSON.stringify({ error: userErr.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (e) {
    console.error('delete-user error:', e);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
