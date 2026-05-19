import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  UserIcon,
  UsersIcon,
  CreditCardIcon,
  PuzzleIcon,
  ChevronLeftIcon,
} from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SECTIONS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { slug: 'user', label: 'Account', icon: UserIcon },
  { slug: 'members', label: 'Members', icon: UsersIcon },
  { slug: 'billing', label: 'Billing', icon: CreditCardIcon },
  { slug: 'integrations', label: 'Integrations', icon: PuzzleIcon },
];

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { workspace } = await params;
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <aside className="hidden w-48 shrink-0 space-y-1 md:block">
        <Link
          href={`/${workspace}` as never}
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
          Back to galaxy
        </Link>
        <nav className="space-y-0.5 text-sm">
          {SECTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/${workspace}/settings/${s.slug}` as never}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <s.icon className="size-3.5" />
              {s.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 space-y-6">{children}</div>
    </main>
  );
}
