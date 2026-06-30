import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Link2,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_ROUTES, PUBLIC_ROUTES, SUPERADMIN_ROUTES } from '@/config/routes';
import { withOrgSearchParam } from '@/config/superAdminTenants';
import { fetchAllOrganizations } from '@/services/organization/organizationService';
import { upsertOrganizationForSuperAdmin, setSuperAdminActingOrganization } from '@/services/organization/superAdminOrganizationService';
import { setSuperAdminActingOrg } from '@/lib/superAdminOrg';
import {
  createEmptyOrgFormState,
  formStateToBrandingSettings,
  organizationToFormState,
  type SuperAdminOrgFormState,
} from '@/lib/superAdminOrgForm';
import { parseBrandingSettings } from '@/types/branding';
import { cn } from '@/lib/utils';

function OrgQuickLinks({
  slug,
  onActivate,
  isActivating,
}: {
  slug: string;
  onActivate: () => void;
  isActivating: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" className="min-h-[44px]" asChild>
        <a
          href={withOrgSearchParam(PUBLIC_ROUTES.algemeen, slug)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Globe className="mr-2 h-4 w-4" aria-hidden />
          Publieke site
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" className="min-h-[44px]" asChild>
        <a href={withOrgSearchParam(ADMIN_ROUTES.settings, slug)}>
          <Settings className="mr-2 h-4 w-4" aria-hidden />
          Admin
        </a>
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-[44px]"
        disabled={isActivating}
        onClick={onActivate}
      >
        <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
        {isActivating ? 'Activeren…' : 'Actief maken'}
      </Button>
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
    <div className="space-y-6">
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

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Website & branding</h3>
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
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">SEO</h3>
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
              value={form.metaDescription}
              onChange={(e) => update('metaDescription', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Publieke content (Algemeen)</h3>
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
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4" aria-hidden />
            Externe links
          </h3>
          <Button type="button" variant="outline" size="sm" className="min-h-[44px]" onClick={addLink}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Link
          </Button>
        </div>
        {form.externalLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen links — voeg bv. Facebook of verenigingswebsite toe.</p>
        ) : (
          <div className="space-y-3">
            {form.externalLinks.map((link, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label>Label</Label>
                  <Input
                    className="min-h-[44px]"
                    value={link.label}
                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                  />
                </div>
                <div className="flex-[2] space-y-2">
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
                  className="min-h-[44px] min-w-[44px] shrink-0 text-destructive"
                  aria-label="Link verwijderen"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export const SuperAdminOrgHubPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<Record<number, SuperAdminOrgFormState>>({});
  const [newOrgForm, setNewOrgForm] = useState<SuperAdminOrgFormState | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

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
      setSuperAdminActingOrg({
        organizationId: form.organizationId,
        slug: form.slug as 'harelbeke' | 'kuurne',
      });
      toast({
        title: `${form.displayName || form.name} actief`,
        description: 'Admin-acties gelden nu voor deze organisatie.',
      });
    } finally {
      setActivatingId(null);
    }
  };

  if (orgsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Organisaties laden…
      </div>
    );
  }

  if (orgsQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-destructive">Kon organisaties niet laden.</p>
        <Button type="button" onClick={() => void orgsQuery.refetch()}>
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-6 safe-area-bottom">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3">
          <Link
            to={SUPERADMIN_ROUTES.platform}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Terug naar platform
          </Link>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Organisaties beheren</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Overzicht en wijzigingen voor Harelbeke, Kuurne en toekomstige tenants — branding,
                content, hostnames en links.
              </p>
            </div>
          </div>
        </header>

        <Accordion type="multiple" defaultValue={['org-1', 'org-2']} className="space-y-3">
          {(orgsQuery.data ?? []).map((org) => {
            const form = forms[org.id];
            if (!form) return null;
            const branding = parseBrandingSettings(org.brandingSettings);

            return (
              <AccordionItem
                key={org.id}
                value={`org-${org.id}`}
                className="overflow-hidden rounded-xl border bg-white px-4 shadow-sm"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-semibold text-foreground">
                      {branding.displayName || org.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      id={org.id} · slug={org.slug}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <OrgQuickLinks
                    slug={org.slug}
                    isActivating={activatingId === org.id}
                    onActivate={() => void handleActivate(form)}
                  />
                  <OrgEditorForm
                    form={form}
                    onChange={(next) =>
                      setForms((prev) => ({ ...prev, [org.id]: next }))
                    }
                  />
                  <Button
                    type="button"
                    className="min-h-[44px] w-full sm:w-auto"
                    disabled={savingId === org.id}
                    onClick={() => handleSave(form)}
                  >
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                    {savingId === org.id ? 'Opslaan…' : 'Wijzigingen opslaan'}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nieuwe organisatie</CardTitle>
            <CardDescription>
              Voeg een extra tenant toe (nieuw id, slug en basisgegevens). Competitiedata en
              migraties blijven apart nodig.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!newOrgForm ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setNewOrgForm(createEmptyOrgFormState(nextOrgId))}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Organisatie toevoegen (id {nextOrgId})
              </Button>
            ) : (
              <>
                <OrgEditorForm
                  form={newOrgForm}
                  isNew
                  onChange={setNewOrgForm}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="min-h-[44px]"
                    disabled={savingId === 'new'}
                    onClick={() => handleSave(newOrgForm, true)}
                  >
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                    {savingId === 'new' ? 'Aanmaken…' : 'Organisatie aanmaken'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[44px]"
                    onClick={() => setNewOrgForm(null)}
                  >
                    Annuleren
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className={cn('text-center text-xs text-muted-foreground pb-4')}>
          Tip: gebruik <strong>Actief maken</strong> vóór je admin-instellingen (kleuren, competities)
          voor die tenant wijzigt.
        </p>
      </div>
    </div>
  );
};
