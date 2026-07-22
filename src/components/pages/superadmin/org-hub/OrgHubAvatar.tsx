import { useState } from 'react';

export function OrgHubAvatar({
  logoPath,
  displayName,
}: {
  logoPath?: string;
  displayName: string;
}) {
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
