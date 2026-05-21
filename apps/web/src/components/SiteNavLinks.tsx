'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Client-side nav-links with active-state. Linear-style: bold + underline
 * for the current route. Extracted so the parent SiteNav can stay server
 * (it reads the session).
 */

const NAV_ITEMS = [
  { href: '/', label: 'Audit' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/trust', label: 'Trust' },
] as const;

export function SiteNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative rounded px-2 py-1 transition-colors',
              isActive
                ? 'font-medium text-foreground after:absolute after:bottom-[-15px] after:left-2 after:right-2 after:h-px after:bg-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
