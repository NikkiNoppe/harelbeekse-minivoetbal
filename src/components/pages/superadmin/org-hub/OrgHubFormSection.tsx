import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function OrgHubFormSection({
  title,
  description,
  icon: Icon,
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
