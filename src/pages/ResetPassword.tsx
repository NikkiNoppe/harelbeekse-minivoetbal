import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import { useOrganization } from "@/hooks/useOrganization";
import { DEFAULT_ORGANIZATION_SLUG } from "@/config/organization";
import {
  getOrgSlugQueryParam,
  navigateToTenantHomeAfterAuth,
} from "@/config/organizationHosts";
import { PUBLIC_ROUTES } from "@/config/routes";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Wachtwoord moet minimaal 6 karakters bevatten"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"]
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const branding = useBranding();
  const { organizationSlug } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const token = searchParams.get("token");
  const mode = searchParams.get("mode");
  const isSetupMode = mode === "setup";
  const tenantSlug =
    getOrgSlugQueryParam() || organizationSlug || DEFAULT_ORGANIZATION_SLUG;

  const copy = useMemo(() => ({
    title: isSetupMode ? "Wachtwoord instellen" : "Wachtwoord resetten",
    description: isSetupMode
      ? "Stel een persoonlijk wachtwoord in om je account te activeren."
      : "Voer je nieuwe wachtwoord in om je account te beveiligen.",
    submitLabel: isSetupMode ? "Wachtwoord instellen" : "Wachtwoord resetten",
    successTitle: isSetupMode ? "Account geactiveerd" : "Wachtwoord gereset",
    successDescription: isSetupMode
      ? "Je wachtwoord is ingesteld. Je wordt doorgestuurd naar de website."
      : "Je wachtwoord is succesvol gewijzigd. Je wordt doorgestuurd naar de website.",
    loadingLabel: isSetupMode ? "Instellen..." : "Resetten...",
  }), [isSetupMode]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  const goToTenantHome = useCallback(() => {
    navigateToTenantHomeAfterAuth({
      organizationSlug: tenantSlug,
      homePath: PUBLIC_ROUTES.algemeen,
      navigate,
      siteUrl: branding.siteUrl,
    });
  }, [navigate, tenantSlug, branding.siteUrl]);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Ongeldige link",
        description: "De link is ongeldig of verlopen.",
        variant: "destructive"
      });
      goToTenantHome();
      return;
    }

    setTokenValid(true);
  }, [token, goToTenantHome, toast]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('reset_password_with_token', {
        p_token: token,
        p_new_password: data.password
      });

      if (error) {
        toast({
          title: "Fout",
          description: `Er is een fout opgetreden: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if ((result as { success?: boolean })?.success) {
        toast({
          title: copy.successTitle,
          description: copy.successDescription
        });
        goToTenantHome();
      } else {
        toast({
          title: isSetupMode ? "Activeren mislukt" : "Reset mislukt",
          description: (result as { error?: string })?.error || "Er is een fout opgetreden bij het wijzigen van je wachtwoord.",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Onverwachte fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-100 p-4">
        <div className="text-muted-foreground">Laden…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100 p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="space-y-2 border-b border-primary/10 bg-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {branding.shortName}
          </p>
          <CardTitle className="text-brand-dark">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isSetupMode ? "Wachtwoord" : "Nieuw wachtwoord"}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isSetupMode ? "Kies een wachtwoord" : "Voer je nieuwe wachtwoord in"}
                        className="min-h-[44px]"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bevestig wachtwoord</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Bevestig je wachtwoord"
                        className="min-h-[44px]"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-h-[44px] flex-1"
                >
                  {isLoading ? copy.loadingLabel : copy.submitLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToTenantHome}
                  className="min-h-[44px] flex-1"
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
