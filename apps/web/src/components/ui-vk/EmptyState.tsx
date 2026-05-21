import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * EmptyState — centered no-content placeholder with icon + title + description
 * + optional CTA. Used app-wide for empty lists, no-results, first-run states.
 *
 * Replaces ~14 custom implementations across the app (audit Agent 4 finding).
 */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'default',
}: {
  /** Lucide icon component. */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'compact' | 'default' | 'large';
}) {
  const paddingClass =
    size === 'compact' ? 'py-8' :
    size === 'large' ? 'py-20' :
    'py-12 sm:py-16';

  const iconSize =
    size === 'compact' ? 'size-6' :
    size === 'large' ? 'size-12' :
    'size-10';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        paddingClass,
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn('text-muted-foreground/60', iconSize)}
          aria-hidden
        />
      ) : null}
      <div className="space-y-1.5 max-w-md">
        <h3 className="type-h2 font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="type-body text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
