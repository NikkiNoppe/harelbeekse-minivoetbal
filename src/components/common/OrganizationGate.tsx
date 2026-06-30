import React from 'react';
import { useOrganization } from '@/hooks/useOrganization';

/**
 * Blokkeert de app bij onbekende hostname (geen stille Harelbeke-fallback).
 */
export const OrganizationGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    isOrganizationLoading,
    isUnknownHostname,
    organizationError,
    hostname,
    refetchOrganization,
  } = useOrganization();

  if (isOrganizationLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Organisatie laden…</p>
      </div>
    );
  }

  if (isUnknownHostname || organizationError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-700)]">
          Site niet gevonden
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {isUnknownHostname
            ? `Er is geen organisatie gekoppeld aan "${hostname}".`
            : organizationError?.message ?? 'Organisatie kon niet geladen worden.'}
        </p>
        <button
          type="button"
          className="rounded-md bg-[var(--color-600)] px-4 py-2 text-sm text-white min-h-[44px]"
          onClick={() => refetchOrganization()}
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
