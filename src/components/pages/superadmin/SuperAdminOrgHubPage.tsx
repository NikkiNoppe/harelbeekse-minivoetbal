import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  Link2,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PageHeader,
  PUBLIC_CARD_CLASS,
  PUBLIC_PAGE_CLASS,
} from '@/components/layout';
import { ADMIN_ROUTES, PUBLIC_ROUTES, SUPERADMIN_ROUTES } from '@/config/routes';
import { withOrgSearchParam } from '@/config/superAdminTenants';
import { fetchAllOrganizations } from '@/services/organization/organizationService';
import {
  upsertOrganizationForSuperAdmin,
  setSuperAdminActingOrganization,
} from '@/services/organization/superAdminOrganizationService';
import {
  getSuperAdminActingOrg,
  setSuperAdminActingOrg,
  type SuperAdminActingOrg,
} from '@/lib/superAdminOrg';
import {
  createEmptyOrgFormState,
  formStateToBrandingSettings,
  organizationToFormState,
  type SuperAdminOrgFormState,
} from '@/lib/superAdminOrgForm';
import { parseBrandingSettings } from '@/types/branding';
import { cn } from '@/lib/utils';

const PLATFORM_CARD_CLASS = cn(
  PUBLIC_CARD_CLASS,
  'rounded-xl border bg-card overflow-hidden',
);

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-primary/15 bg-background/60 p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-dark flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PlatformPageSkeleton() {
  return (
    <div className={PUBLIC_PAGE_CLASS}>
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className={cn(PLATFORM_CARD_CLASS, 'p-4 space-y-3')}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgQuickLinks({
  slug,
  onActivate,
  isActivating,
  isActive,
}: {
  slug: string;
  onActivate: () => void;
  isActivating: boolean;
  isActive: boolean;
}) {
  return (
    <div className="rounded-lg border border-primary/15 bg-brand-50/40 p-3 sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
        Snelle acties
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant={isActive ? 'secondary' : 'default'}
          size="sm"
          className="min-h-[44px] w-full sm:w-auto"
          disabled={isActivating || isActive}
          onClick={onActivate}
        >
          {isActivating ? (
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : isActive ? (
            <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          )}
          {isActivating ? 'Activeren…' : isActive ? 'Actieve tenant' : 'Actief maken'}
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-h-[44px] w-full sm:w-auto" asChild>
          <a
            href={withOrgSearchParam(PUBLIC_ROUTES.algemeen, slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center"
          >
            <Globe className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            Publieke site
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-h-[44px] w-full sm:w-auto" asChild>
          <Link
            to={withOrgSearchParam(ADMIN_ROUTES.settings, slug)}
            className="inline-flex items-center justify-center"
          >
            <Settings className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            Admin-instellingen
          </Link>
        </Button>
      </div>
    </div>
  );
}

function OrgEditorForm({
  form,
  onChange,
  isNew,
}: {
  form: SuperAdminOrgFormState;
  onChange: (next: SuperAdminOrgFormState) => void;
  isNew?: boolean;
}) {
  const update = <K extends keyof SuperAdminOrgFormState>(
    key: K,
    value: SuperAdminOrgFormState[K],
  ) => onChange({ ...form, [key]: value });

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const links = [...form.externalLinks];
    links[index] = { ...links[index], [field]: value };
    update('externalLinks', links);
  };

  const addLink = () => {
    update('externalLinks', [...form.externalLinks, { label: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    update(
      'externalLinks',
      form.externalLinks.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-4">
      <FormSection
        title="Identiteit"
        description="Technische sleutels voor routing en database."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`org-id-${form.organizationId}`}>Organisatie ID</Label>
            <Input
              id={`org-id-${form.organizationId}`}
              type="number"
              min={1}
              disabled={!isNew}
              className="min-h-[44px]"
              value={form.organizationId}
              onChange={(e) =>
                update('organizationId', Number.parseInt(e.target.value, 10) || 1)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`slug-${form.organizationId}`}>Slug</Label>
            <Input
              id={`slug-${form.organizationId}`}
              className="min-h-[44px]"
              placeholder="harelbeke"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`name-${form.organizationId}`}>Interne naam</Label>
            <Input
              id={`name-${form.organizationId}`}
              className="min-h-[44px]"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Website & branding"
        description="Zichtbare naam, logo's en hostnames per tenant."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Sitenaam (zichtbaar)</Label>
            <Input
              className="min-h-[44px]"
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Korte naam</Label>
            <Input
              className="min-h-[44px]"
              value={form.shortName}
              onChange={(e) => update('shortName', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Website URL</Label>
            <Input
              className="min-h-[44px]"
              type="url"
              placeholder="https://…"
              value={form.siteUrl}
              onChange={(e) => update('siteUrl', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Hostnames (één per regel)</Label>
            <Textarea
              rows={3}
              className="min-h-[88px] resize-y"
              placeholder={'harelbekeminivoetbal.be\nkuurneminivoetbal.nikkinoppe.be'}
              value={form.hostnamesText}
              onChange={(e) => update('hostnamesText', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo pad</Label>
            <Input
              className="min-h-[44px]"
              value={form.logoPath}
              onChange={(e) => update('logoPath', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo icoon pad</Label>
            <Input
              className="min-h-[44px]"
              value={form.logoIconPath}
              onChange={(e) => update('logoIconPath', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Favicon pad</Label>
            <Input
              className="min-h-[44px]"
              value={form.faviconPath}
              onChange={(e) => update('faviconPath', e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="SEO" description="Standaard titel en beschrijving voor zoekmachines.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Paginatitel (default)</Label>
            <Input
              className="min-h-[44px]"
              value={form.metaTitle}
              onChange={(e) => update('metaTitle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Meta beschrijving</Label>
            <Textarea
              rows={2}
              className="resize-y"
              value={form.metaDescription}
              onChange={(e) => update('metaDescription', e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Publieke content"
        description="Teksten op de pagina Algemeen en in de footer."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input
              className="min-h-[44px]"
              value={form.algemeenTitle}
              onChange={(e) => update('algemeenTitle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ondertitel</Label>
            <Input
              className="min-h-[44px]"
              value={form.algemeenSubtitle}
              onChange={(e) => update('algemeenSubtitle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Over-tekst</Label>
            <Textarea
              rows={4}
              className="resize-y"
              value={form.algemeenAbout}
              onChange={(e) => update('algemeenAbout', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Footer tagline</Label>
            <Input
              className="min-h-[44px]"
              value={form.footerTagline}
              onChange={(e) => update('footerTagline', e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Externe links" icon={Link2}>
        <div className="flex items-center justify-end gap-2 -mt-2 mb-1">
          <Button type="button" variant="outline" size="sm" className="min-h-[44px]" onClick={addLink}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Link toevoegen
          </Button>
        </div>
        {form.externalLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-md border border-dashed border-primary/20 px-4 py-6 text-center">
            Nog geen links — voeg bv. Facebook of een verenigingswebsite toe.
          </p>
        ) : (
          <div className="space-y-3">
            {form.externalLinks.map((link, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-primary/10 bg-background p-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <Label>Label</Label>
                  <Input
                    className="min-h-[44px]"
                    value={link.label}
                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                  />
                </div>
                <div className="flex-[2] space-y-2 min-w-0">
                  <Label>URL</Label>
                  <Input
                    className="min-h-[44px]"
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] shrink-0 text-destructive hover:text-destructive"
                  aria-label="Link verwijderen"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}

function OrgAvatar({ logoPath, displayName }: { logoPath?: string; displayName: string }) {
  const [failed, setFailed] = useState(false);

  if (logoPath && !failed) {
    return (
      <img
        src={logoPath}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-primary/15 bg-white object-contain p-1"
        onError={() => setFailed(true)}
      />
    );
  }

  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-brand-100 text-sm font-semibold text-brand-dark"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export const SuperAdminOrgHubPage: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<Record<number, SuperAdminOrgFormState>>({});
  const [newOrgForm, setNewOrgForm] = useState<SuperAdminOrgFormState | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [actingOrg, setActingOrg] = useState<SuperAdminActingOrg | null>(() =>
    getSuperAdminActingOrg(),
  );

  const orgsQuery = useQuery({
    queryKey: ['superadmin', 'organizations'],
    queryFn: fetchAllOrganizations,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!orgsQuery.data) return;
    const next: Record<number, SuperAdminOrgFormState> = {};
    for (const org of orgsQuery.data) {
      next[org.id] = organizationToFormState(org);
    }
    setForms(next);
  }, [orgsQuery.data]);

  const nextOrgId = useMemo(() => {
    const ids = orgsQuery.data?.map((o) => o.id) ?? [];
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }, [orgsQuery.data]);

  const orgCount = orgsQuery.data?.length ?? 0;

  const saveMutation = useMutation({
    mutationFn: async ({
      form,
      existingBranding,
    }: {
      form: SuperAdminOrgFormState;
      existingBranding: Record<string, unknown>;
    }) => {
      const brandingSettings = formStateToBrandingSettings(form, existingBranding);
      return upsertOrganizationForSuperAdmin({
        organizationId: form.organizationId,
        name: form.name,
        slug: form.slug,
        brandingSettings,
      });
    },
    onSuccess: async (result, variables) => {
      if (!result.success) {
        toast({
          title: 'Opslaan mislukt',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Organisatie opgeslagen' });
      setNewOrgForm(null);
      await queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizations'] });
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
      if (variables.form.organizationId) {
        setForms((prev) => ({
          ...prev,
          [variables.form.organizationId]: variables.form,
        }));
      }
    },
    onError: () => {
      toast({
        title: 'Opslaan mislukt',
        description: 'Er ging iets mis bij het opslaan.',
        variant: 'destructive',
      });
    },
    onSettled: () => setSavingId(null),
  });

  const handleSave = (form: SuperAdminOrgFormState, isNew = false) => {
    const existing =
      orgsQuery.data?.find((o) => o.id === form.organizationId)?.brandingSettings ?? {};
    setSavingId(isNew ? 'new' : form.organizationId);
    saveMutation.mutate({ form, existingBranding: existing });
  };

  const handleActivate = async (form: SuperAdminOrgFormState) => {
    setActivatingId(form.organizationId);
    try {
      const applied = await setSuperAdminActingOrganization(form.organizationId);
      if (!applied) {
        toast({
          title: 'Activeren mislukt',
          variant: 'destructive',
        });
        return;
      }
      const next: SuperAdminActingOrg = {
        organizationId: form.organizationId,
        slug: form.slug,
      };
      setSuperAdminActingOrg(next);
      setActingOrg(next);
      toast({
        title: `${form.displayName || form.name} actief`,
        description: 'Admin-acties gelden nu voor deze organisatie.',
      });
    } finally {
      setActivatingId(null);
    }
  };

  const pageWrapperClass = cn(
    PUBLIC_PAGE_CLASS,
    embedded ? 'w-full max-w-7xl mx-auto' : 'min-h-screen px-4 py-6 sm:px-6 safe-area-bottom',
  );

  if (orgsQuery.isLoading && !orgsQuery.data) {
    return (
      <div className={pageWrapperClass}>
        <PlatformPageSkeleton />
      </div>
    );
  }

  if (orgsQuery.isError) {
    return (
      <div className={cn(pageWrapperClass, 'flex flex-col items-center justify-center min-h-[40vh]')}>
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Kon organisaties niet laden</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3">
            <p>Controleer je verbinding en probeer opnieuw.</p>
            <Button type="button" className="min-h-[44px] w-full sm:w-auto" onClick={() => void orgsQuery.refetch()}>
              Opnieuw proberen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={pageWrapperClass}>
      {!embedded && (
        <Link
          to={SUPERADMIN_ROUTES.platform}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Terug naar platform
        </Link>
      )}

      <PageHeader
        title="Platform beheer"
        subtitle="Beheer tenants, branding, hostnames en publieke content voor alle organisaties op het platform."
        rightAction={
          <Badge variant="outline" className="min-h-[28px] px-3 text-xs font-medium">
            {orgCount} {orgCount === 1 ? 'organisatie' : 'organisaties'}
          </Badge>
        }
      />

      {orgsQuery.isFetching && orgsQuery.data ? (
        <p className="text-xs text-muted-foreground -mt-4 mb-2 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Vernieuwen…
        </p>
      ) : null}

      {actingOrg ? (
        <Alert className="border-primary/25">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <AlertTitle>Actieve tenant</AlertTitle>
          <AlertDescription>
            Admin-wijzigingen gelden voor{' '}
            <strong className="font-medium text-foreground">
              {forms[actingOrg.organizationId]?.displayName ?? actingOrg.slug}
            </strong>{' '}
            (id {actingOrg.organizationId}).
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" aria-hidden />
          <AlertTitle>Geen actieve tenant</AlertTitle>
          <AlertDescription>
            Kies <strong>Actief maken</strong> bij een organisatie vóór je instellingen of
            competitiedata wijzigt.
          </AlertDescription>
        </Alert>
      )}

      <Accordion
        type="multiple"
        defaultValue={(orgsQuery.data ?? []).map((o) => `org-${o.id}`)}
        className="space-y-3"
      >
        {(orgsQuery.data ?? []).map((org) => {
          const form = forms[org.id];
          if (!form) return null;
          const branding = parseBrandingSettings(org.brandingSettings);
          const displayName = branding.displayName || org.name;
          const logoPath = form.logoPath || branding.logoPath;
          const isActive = actingOrg?.organizationId === org.id;
          const isSaving = savingId === org.id;

          return (
            <AccordionItem
              key={org.id}
              value={`org-${org.id}`}
              className={cn(PLATFORM_CARD_CLASS, 'border px-0')}
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
                <div className="flex flex-1 items-center gap-3 pr-2 text-left">
                  <OrgAvatar logoPath={logoPath} displayName={displayName} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="block font-semibold text-brand-dark truncate">
                      {displayName}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">
                        id {org.id}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs">
                        {org.slug}
                      </Badge>
                      {isActive ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs">
                          Actief
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 sm:px-5">
                <div className="space-y-4">
                  <OrgQuickLinks
                    slug={org.slug}
                    isActivating={activatingId === org.id}
                    isActive={isActive}
                    onActivate={() => void handleActivate(form)}
                  />
                  <OrgEditorForm
                    form={form}
                    onChange={(next) =>
                      setForms((prev) => ({ ...prev, [org.id]: next }))
                    }
                  />
                  <Separator />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Wijzigingen worden per organisatie opgeslagen in de database.
                    </p>
                    <Button
                      type="button"
                      className="min-h-[44px] w-full sm:w-auto shrink-0"
                      disabled={isSaving}
                      onClick={() => handleSave(form)}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Save className="mr-2 h-4 w-4" aria-hidden />
                      )}
                      {isSaving ? 'Opslaan…' : 'Wijzigingen opslaan'}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Card className={PLATFORM_CARD_CLASS}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-brand-dark flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
            Nieuwe organisatie
          </CardTitle>
          <CardDescription>
            Voeg een extra tenant toe met een nieuw id en slug. Competitiedata en database-migraties
            blijven apart nodig.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {!newOrgForm ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto"
              onClick={() => setNewOrgForm(createEmptyOrgFormState(nextOrgId))}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Organisatie toevoegen (id {nextOrgId})
            </Button>
          ) : (
            <div className="space-y-4">
              <OrgEditorForm form={newOrgForm} isNew onChange={setNewOrgForm} />
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="min-h-[44px] w-full sm:w-auto"
                  disabled={savingId === 'new'}
                  onClick={() => handleSave(newOrgForm, true)}
                >
                  {savingId === 'new' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {savingId === 'new' ? 'Aanmaken…' : 'Organisatie aanmaken'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => setNewOrgForm(null)}
                >
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
