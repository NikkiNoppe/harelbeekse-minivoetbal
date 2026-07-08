import React, { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isLoginError } from '@/lib/loginErrors';
import { cn } from '@/lib/utils';
import { isTenantDebugPanelEnabled } from '@/components/admin/TenantDebugPanel';
import { useDevDebugContext } from '@/context/DevDebugContext';
import {
  DEV_PERSONA_LABELS,
  DEV_PERSONA_ORDER,
  DEV_SUPERADMIN,
  resolveDevPersonaCredentials,
  type DevLoginPersonaId,
  type DevPersonaId,
} from '@/config/devAuthPersonas';

function getActivePersona(
  isAuthenticated: boolean,
  isSuperAdmin: boolean,
  role?: string,
): DevPersonaId {
  if (!isAuthenticated) return 'guest';
  if (isSuperAdmin) return 'superadmin';
  if (role === 'referee') return 'referee';
  if (role === 'player_manager') return 'player_manager';
  if (role === 'admin') return 'admin';
  return 'guest';
}

function isLoginPersona(persona: DevPersonaId): persona is DevLoginPersonaId {
  return persona !== 'guest' && persona !== 'superadmin';
}

interface DevRoleSwitchButtonsProps {
  organizationSlug: string;
  className?: string;
}

export const DevRoleSwitchButtons: React.FC<DevRoleSwitchButtonsProps> = ({
  organizationSlug,
  className,
}) => {
  const { user, isAuthenticated, isSuperAdmin, login, logout } = useAuth();
  const { toast } = useToast();
  const [switching, setSwitching] = useState<DevPersonaId | null>(null);

  const activePersona = useMemo(
    () => getActivePersona(isAuthenticated, isSuperAdmin, user?.role),
    [isAuthenticated, isSuperAdmin, user?.role],
  );

  const isPersonaDisabled = (persona: DevPersonaId): boolean => {
    if (persona === 'guest' || persona === 'superadmin') return false;
    return resolveDevPersonaCredentials(organizationSlug, persona) === null;
  };

  const getDisabledTitle = (persona: DevPersonaId): string | undefined => {
    if (persona === 'guest' || persona === 'superadmin') return undefined;
    if (resolveDevPersonaCredentials(organizationSlug, persona)) return undefined;
    return `Geen ${DEV_PERSONA_LABELS[persona].toLowerCase()}-account in ${organizationSlug}`;
  };

  const handleSwitch = async (persona: DevPersonaId) => {
    if (persona === activePersona || switching) return;
    if (isPersonaDisabled(persona)) return;

    setSwitching(persona);
    try {
      if (persona === 'guest') {
        await logout();
        return;
      }

      if (persona === 'superadmin') {
        await login(DEV_SUPERADMIN.username, DEV_SUPERADMIN.password);
        return;
      }

      if (!isLoginPersona(persona)) return;

      const creds = resolveDevPersonaCredentials(organizationSlug, persona);
      if (!creds) {
        toast({
          title: 'Dev-login niet geconfigureerd',
          description: `Geen credentials voor ${DEV_PERSONA_LABELS[persona]} in ${organizationSlug}.`,
          variant: 'destructive',
        });
        return;
      }

      await login(creds.username, creds.password);
    } catch (error) {
      const description = isLoginError(error)
        ? error.message
        : 'Kon niet wisselen van rol.';
      toast({
        title: 'Dev-login mislukt',
        description,
        variant: 'destructive',
      });
      console.error('Dev role switch:', description, error);
    } finally {
      setSwitching(null);
    }
  };

  const devDebug = useDevDebugContext();
  const hideGuestPersona =
    isTenantDebugPanelEnabled() && (devDebug?.matchFormModalCount ?? 0) > 0;
  const visiblePersonas = hideGuestPersona
    ? DEV_PERSONA_ORDER.filter((persona) => persona !== 'guest')
    : DEV_PERSONA_ORDER;

  return (
    <div
      className={cn('flex flex-nowrap items-center justify-end gap-2', className)}
      role="group"
      aria-label="Wissel gebruikersrol (dev)"
    >
      <span className="font-medium text-amber-900">Rol:</span>
      {visiblePersonas.map((persona) => {
        const isActive = activePersona === persona;
        const disabled = isPersonaDisabled(persona) || switching !== null;
        const title = getDisabledTitle(persona);

        return (
          <button
            key={persona}
            type="button"
            disabled={disabled && !isActive}
            title={title}
            onClick={() => void handleSwitch(persona)}
            aria-pressed={isActive}
            aria-busy={switching === persona}
            className={cn(
              'min-h-[44px] shrink-0 whitespace-nowrap rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-45',
              isActive
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-amber-400 bg-white text-amber-950 hover:bg-amber-100',
            )}
          >
            {switching === persona ? '…' : DEV_PERSONA_LABELS[persona]}
          </button>
        );
      })}
    </div>
  );
};
