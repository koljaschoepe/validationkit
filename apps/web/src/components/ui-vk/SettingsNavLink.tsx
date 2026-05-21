'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

/**
 * Client-only active-state for one settings-sidebar entry.
 * Split out of SettingsLayout so the layout shell can stay a Server-Component.
 */
export function SettingsNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href as never}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-secondary/60 font-medium text-foreground before:absolute before:-left-0.5 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-foreground'
          : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
