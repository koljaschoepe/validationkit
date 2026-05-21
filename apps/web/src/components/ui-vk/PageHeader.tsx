import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — top of a page section. Display H1 + optional subline +
 * optional breadcrumb + optional right-side actions.
 *
 * Mirrors Linear's page-header pattern: tight typography (type-display
 * with negative tracking), generous bottom margin, optional eyebrow text.
 */

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 border-b border-border pb-6 mb-8 lg:mb-10',
        className,
      )}
    >
      {breadcrumb ? <div>{breadcrumb}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-1.5 min-w-0">
          {eyebrow ? (
            <span className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="type-display font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="type-body text-muted-foreground max-w-2xl">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
