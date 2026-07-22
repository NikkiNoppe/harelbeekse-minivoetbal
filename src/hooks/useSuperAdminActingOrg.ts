import { useEffect, useState } from 'react';
import {
  getSuperAdminActingOrg,
  SUPER_ADMIN_ACTING_ORG_CHANGED_EVENT,
  type SuperAdminActingOrg,
} from '@/lib/superAdminOrg';

/** Reactieve lezing van de SuperAdmin acting tenant (localStorage + sync-event). */
export function useSuperAdminActingOrg(): SuperAdminActingOrg | null {
  const [actingOrg, setActingOrg] = useState<SuperAdminActingOrg | null>(() =>
    getSuperAdminActingOrg(),
  );

  useEffect(() => {
    const sync = () => setActingOrg(getSuperAdminActingOrg());
    window.addEventListener(SUPER_ADMIN_ACTING_ORG_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SUPER_ADMIN_ACTING_ORG_CHANGED_EVENT, sync);
  }, []);

  return actingOrg;
}
