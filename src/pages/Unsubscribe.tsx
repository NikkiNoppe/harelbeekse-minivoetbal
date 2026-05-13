import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const SUPABASE_URL = "https://kuyviionmstyvkvglizh.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Status = "validating" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("validating");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("invalid");
          setErrorMsg(data?.error || "Ongeldige of verlopen link.");
          return;
        }
        if (data?.alreadyUnsubscribed) {
          setEmail(data?.email || null);
          setStatus("already");
        } else {
          setEmail(data?.email || null);
          setStatus("valid");
        }
      } catch (e) {
        setStatus("invalid");
        setErrorMsg("Kon de uitschrijving niet valideren.");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setEmail(data?.email || email);
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Er ging iets mis.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Uitschrijven</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "validating" && <LoadingSpinner />}
          {status === "valid" && (
            <>
              <p>
                Wil je <strong>{email}</strong> uitschrijven van e-mails van Harelbeekse Minivoetbal?
              </p>
              <Button onClick={confirm} className="w-full">Uitschrijving bevestigen</Button>
            </>
          )}
          {status === "submitting" && <LoadingSpinner />}
          {status === "done" && (
            <p>Je bent uitgeschreven{email ? ` (${email})` : ""}. Je ontvangt geen e-mails meer.</p>
          )}
          {status === "already" && (
            <p>Dit adres{email ? ` (${email})` : ""} is reeds uitgeschreven.</p>
          )}
          {(status === "invalid" || status === "error") && (
            <p className="text-destructive">{errorMsg || "Ongeldige link."}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
