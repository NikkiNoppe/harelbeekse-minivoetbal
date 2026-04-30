import React from 'react';
import { Check, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'done' | 'current' | 'todo' | 'locked';

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  onClick?: () => void;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  className?: string;
}

/**
 * Compacte 4-stappen stepper voor de scheidsrechter-flow:
 * (1) Poll aanmaken → (2) Antwoorden verzamelen → (3) Toewijzen → (4) Bevestigd
 *
 * Volledig token-based — leest paars-tinten via primary/success/warning/muted.
 */
export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ steps, className }) => {
  return (
    <ol
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border border-[hsl(var(--color-200))] bg-card p-3 sm:flex-row sm:items-stretch sm:gap-0 sm:p-2',
        className,
      )}
      aria-label="Workflow scheidsrechtersbeheer"
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const clickable = !!step.onClick && step.status !== 'locked';

        // Token-based styling
        const circleClasses = (() => {
          switch (step.status) {
            case 'done':
              return 'bg-success text-white border-success';
            case 'current':
              return 'bg-primary text-white border-primary ring-2 ring-primary/20';
            case 'locked':
              return 'bg-muted text-muted-foreground border-[hsl(var(--color-200))]';
            default:
              return 'bg-card text-[hsl(var(--color-600))] border-[hsl(var(--color-300))]';
          }
        })();

        const labelClasses = (() => {
          switch (step.status) {
            case 'done':
              return 'text-[hsl(var(--color-700))]';
            case 'current':
              return 'text-[hsl(var(--color-700))] font-semibold';
            case 'locked':
              return 'text-muted-foreground';
            default:
              return 'text-[hsl(var(--color-600))]';
          }
        })();

        const Icon =
          step.status === 'done' ? Check : step.status === 'locked' ? Lock : step.status === 'current' ? Clock : null;

        const content = (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all',
                circleClasses,
              )}
              aria-hidden
            >
              {Icon ? <Icon className="h-4 w-4" strokeWidth={2.5} /> : idx + 1}
            </div>
            <div className="min-w-0">
              <div className={cn('text-sm leading-tight', labelClasses)}>{step.label}</div>
              {step.description && (
                <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );

        return (
          <li
            key={step.id}
            className={cn(
              'flex items-center sm:flex-1 sm:px-2',
              !isLast && 'sm:border-r sm:border-[hsl(var(--color-200))]',
            )}
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            {clickable ? (
              <button
                type="button"
                onClick={step.onClick}
                className={cn(
                  'flex w-full items-center rounded-md px-2 py-1.5 text-left transition-colors',
                  'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                )}
              >
                {content}
              </button>
            ) : (
              <div className="flex w-full items-center px-2 py-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default WorkflowStepper;
