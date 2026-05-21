import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageShell — page-level layout primitive. Provides consistent padding,
 * max-width, and vertical rhythm across all VK app pages.
 *
 * Use as the *outermost* wrapper inside a route's `<main>`:
 *   <PageShell>
 *     <PageHeader title="…" />
 *     <YourContent />
 *   </PageShell>
 *
 * Phase Nova-2 Foundation. shadcn-agnostic; consumes VK semantic tokens.
 */

export function PageShell({
  children,
  className,
  size = 'default',
  as: Component = 'div',
  id,
}: {
  children: ReactNode;
  className?: string;
  /** Controls max-width. `default` = 7xl (80rem); `narrow` for read-heavy pages. */
  size?: 'default' | 'narrow' | 'wide';
  as?: 'div' | 'section' | 'article' | 'main';
  /** Forwarded to the underlying element — used for skip-link targets. */
  id?: string;
}) {
  const maxWidthClass =
    size === 'narrow' ? 'max-w-3xl' :
    size === 'wide' ? 'max-w-[1800px]' :
    'max-w-7xl';

  return (
    <Component
      id={id}
      className={cn(
        'mx-auto w-full px-6 py-10 sm:px-8 sm:py-12 lg:py-16',
        maxWidthClass,
        className,
      )}
    >
      {children}
    </Component>
  );
}
