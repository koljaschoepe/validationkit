'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SettingsLayout — Phase Nova-2 P5.
 *
 * Linear-style sidebar settings: 240 px sidebar on the left, content
 * area capped at 720 px so forms read on a single column. Sections are
 * grouped (e.g. "Workspace", "Account") with a small mono-uppercase
 * group-heading.
 *
 * Active-state derives from `usePathname()` — bold + left-bar
 * indicator. Mobile (<768px) collapses sidebar to top-tabs (handled by
 * css: lg:flex below; on mobile we just stack).
 */

export interface SettingsSection {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

export interface SettingsGroup {
  label: string;
  sections: SettingsSection[];
}

export function SettingsLayout({
  groups,
  backHref,
  backLabel = 'Back to galaxy',
  children,
}: {
  groups: SettingsGroup[];
  /** Optional `← Back to …` link above the sidebar. */
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 sm:py-16 lg:flex-row lg:gap-12">
      <aside className="w-full shrink-0 lg:w-60">
        {backHref ? (
          <Link
            href={backHref as never}
            className="mb-4 inline-flex items-center gap-1 font-mono type-mono-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-3.5" aria-hidden />
            {backLabel}
          </Link>
        ) : null}

        <nav aria-label="Settings sections" className="space-y-5">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-2 font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.sections.map((section) => {
                  const isActive =
                    pathname === section.href ||
                    pathname.startsWith(`${section.href}/`);
                  return (
                    <li key={section.href}>
                      <Link
                        href={section.href as never}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-secondary/60 font-medium text-foreground before:absolute before:-left-0.5 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-foreground'
                            : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground',
                        )}
                      >
                        <section.icon className="size-3.5" aria-hidden />
                        {section.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="max-w-[720px] space-y-8">{children}</div>
      </div>
    </div>
  );
}
