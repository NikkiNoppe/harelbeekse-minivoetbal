import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { SectionIcon } from '@/components/layout/section-icon';

export function OrgHubFormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-dark flex items-center gap-2">
          {icon ? <SectionIcon icon={icon} variant="compact" /> : null}
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
