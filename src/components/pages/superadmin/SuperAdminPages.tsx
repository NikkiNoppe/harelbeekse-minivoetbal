import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, ExternalLink, Settings, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ADMIN_ROUTES, PUBLIC_ROUTES, SUPERADMIN_ROUTES } from '@/config/routes';
import {
  SUPER_ADMIN_TENANTS,
  withOrgSearchParam,
  type SuperAdminTenantSlug,
} from '@/config/superAdminTenants';
import { setSuperAdminActingOrg } from '@/lib/superAdminOrg';
import { setSuperAdminActingOrganization } from '@/services/organization/superAdminOrganizationService';
import { cn } from '@/lib/utils';

const superAdminPasswordSchema = z.object({
  password: z.string().min(1, 'Wachtwoord is verplicht'),
});

type SuperAdminPasswordForm = z.infer<typeof superAdminPasswordSchema>;

interface SuperAdminTenantPageProps {
  tenantSlug: SuperAdminTenantSlug;
}

async function activateTenant(organizationId: number, slug: SuperAdminTenantSlug) {
  const applied = await setSuperAdminActingOrganization(organizationId);
  if (!applied) {
    return false;
  }
  setSuperAdminActingOrg({ organizationId, slug });
  return true;
}

/**
 * SuperAdmin inlog- en toegangspagina per tenant (Harelbeke id=1, Kuurne id=2).
 */
export const SuperAdminTenantPage: React.FC<SuperAdminTenantPageProps> = ({
  tenantSlug,
}) => {
  const tenant = SUPER_ADMIN_TENANTS.find((t) => t.slug === tenantSlug)!;
  const { isAuthenticated, isSuperAdmin, login, logout, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const form = useForm<SuperAdminPasswordForm>({
    resolver: zodResolver(superAdminPasswordSchema),
    defaultValues: { password: '' },
  });

  const handleLogin = async (data: SuperAdminPasswordForm) => {
    setIsSubmitting(true);
    try {
      const success = await login('superadmin', data.password);
      if (!success) {
        toast({
          title: 'Inloggen mislukt',
          description: 'Controleer het SuperAdmin-wachtwoord.',
          variant: 'destructive',
        });
        return;
      }

      const activated = await activateTenant(tenant.id, tenant.slug);
      if (!activated) {
        toast({
          title: 'Tenant niet geactiveerd',
          description: 'Kon organisatie niet koppelen aan je sessie.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const enterAsTenant = async (target: 'site' | 'admin') => {
    setIsEntering(true);
    try {
      const activated = await activateTenant(tenant.id, tenant.slug);
      if (!activated) {
        toast({
          title: 'Tenant niet geactiveerd',
          description: 'Kon organisatie niet koppelen aan je sessie.',
          variant: 'destructive',
        });
        return;
      }

      const path =
        target === 'admin'
          ? withOrgSearchParam(ADMIN_ROUTES.settings, tenant.slug)
          : withOrgSearchParam(PUBLIC_ROUTES.algemeen, tenant.slug);

      navigate(path);
    } finally {
      setIsEntering(false);
    }
  };

  const loggedInAsSuperAdmin = isAuthenticated && isSuperAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 safe-area-bottom">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
            <Shield className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            SuperAdmin · org id={tenant.id}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tenant.description}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          {loggedInAsSuperAdmin ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingelogd als <span className="font-medium text-foreground">{user?.username}</span>.
                Kies waar je naartoe wilt.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  className="min-h-[44px] w-full justify-start gap-2"
                  disabled={isEntering}
                  onClick={() => void enterAsTenant('site')}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Publieke site bekijken
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] w-full justify-start gap-2"
                  disabled={isEntering}
                  onClick={() => void enterAsTenant('admin')}
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  Admin openen
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  asChild
                >
                  <Link to={SUPERADMIN_ROUTES.beheer}>Organisaties beheren</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  asChild
                >
                  <Link to={SUPERADMIN_ROUTES.platform}>Alle organisaties</Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[44px] gap-2"
                  onClick={() => void logout()}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Uitloggen
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Log in met het SuperAdmin-wachtwoord om deze organisatie te beheren.
                </p>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="superadmin-password">Wachtwoord</Label>
                      <FormControl>
                        <Input
                          id="superadmin-password"
                          type="password"
                          autoComplete="current-password"
                          className="min-h-[44px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="min-h-[44px] w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Bezig…' : 'Inloggen als SuperAdmin'}
                </Button>
              </form>
            </Form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link
            to={SUPERADMIN_ROUTES.platform}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Terug naar platform-overzicht
          </Link>
        </p>
      </div>
    </div>
  );
};

interface TenantCardProps {
  tenant: (typeof SUPER_ADMIN_TENANTS)[number];
}

const TenantCard: React.FC<TenantCardProps> = ({ tenant }) => (
  <Link
    to={`/superadmin/${tenant.slug}`}
    className={cn(
      'block rounded-xl border bg-white p-5 shadow-sm transition-colors',
      'hover:border-brand-500 hover:bg-brand-50/40',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
      'min-h-[44px]',
    )}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Organisatie id={tenant.id}
    </p>
    <h2 className="mt-1 text-lg font-semibold text-slate-900">{tenant.name}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{tenant.description}</p>
    <p className="mt-3 text-sm font-medium text-brand-700">Openen →</p>
  </Link>
);

/**
 * SuperAdmin hub — kies Harelbeke of Kuurne.
 */
export const SuperAdminPlatformPage: React.FC = () => {
  const { isAuthenticated, isSuperAdmin } = useAuth();

  return (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 safe-area-bottom">
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
          <Shield className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">SuperAdmin platform</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kies een organisatie om in te loggen en te beheren.
        </p>
      </div>

      {isAuthenticated && isSuperAdmin && (
        <Link
          to={SUPERADMIN_ROUTES.beheer}
          className={cn(
            'mb-6 flex items-center gap-3 rounded-xl border border-brand-300 bg-white p-4 shadow-sm',
            'hover:border-brand-500 hover:bg-brand-50/50 transition-colors min-h-[44px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
          )}
        >
          <Building2 className="h-8 w-8 text-brand-600 shrink-0" aria-hidden />
          <div className="text-left">
            <p className="font-semibold text-slate-900">Organisaties beheren</p>
            <p className="text-sm text-muted-foreground">
              Harelbeke & Kuurne — branding, content, links en hostnames
            </p>
          </div>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {SUPER_ADMIN_TENANTS.map((tenant) => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>
    </div>
  </div>
  );
};
