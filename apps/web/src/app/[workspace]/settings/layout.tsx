import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  UsersIcon,
  CreditCardIcon,
  PuzzleIcon,
  ShieldAlertIcon,
  BrainIcon,
} from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { SettingsLayout, type SettingsGroup } from '@/components/ui-vk';

export const dynamic = 'force-dynamic';

/**
 * Workspace settings layout — Phase Nova-2 P5 restructure.
 *
 * Bundle D (Launch-Verify): the 6 not-yet-backed sections (general, api-keys,
 * audit-apply, galaxie, notifications, webhooks) were full "Coming soon" stub
 * routes wired into the nav, so a paying user clicked through a sidebar full of
 * dead-ends. They're hidden from the nav until `nova-2-settings-backend.md`
 * lands the DB backing (the routes still resolve by direct URL). Only shipped,
 * load-bearing sections remain.
 */

function buildGroups(workspace: string): SettingsGroup[] {
  const ws = `/${workspace}/settings`;
  return [
    {
      label: 'General',
      sections: [
        { href: `${ws}/members`, label: 'Members', icon: UsersIcon },
        { href: `${ws}/billing`, label: 'Billing', icon: CreditCardIcon },
      ],
    },
    {
      label: 'Operations',
      sections: [
        { href: `${ws}/integrations`, label: 'Integrations', icon: PuzzleIcon },
        { href: `${ws}/ai`, label: 'AI', icon: BrainIcon },
      ],
    },
    {
      label: 'Danger',
      sections: [
        { href: `${ws}/danger`, label: 'Danger Zone', icon: ShieldAlertIcon },
      ],
    },
  ];
}

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
  const groups = buildGroups(workspace);

  return (
    <main id="main-content" className="min-h-screen">
      <SettingsLayout groups={groups} backHref={`/${workspace}`}>
        {children}
      </SettingsLayout>
    </main>
  );
}
