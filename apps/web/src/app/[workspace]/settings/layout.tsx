import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  SettingsIcon,
  UsersIcon,
  CreditCardIcon,
  PuzzleIcon,
  ShieldAlertIcon,
  BrainIcon,
  KeyRoundIcon,
  WebhookIcon,
  BellIcon,
} from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { SettingsLayout, type SettingsGroup } from '@/components/ui-vk';

export const dynamic = 'force-dynamic';

/**
 * Workspace settings layout — Phase Nova-2 P5 restructure.
 *
 * Bundle D (Launch-Verify): the not-yet-backed sections were "Coming soon"
 * stub routes hidden from the nav so a paying user didn't click through
 * dead-ends. Block C landed the backing for API Keys, Notifications and
 * Webhooks — all three are now live + back in the nav. Still hidden: general +
 * audit-apply (the routes resolve by direct URL until they're backed). (The
 * galaxie settings route was removed with the galaxie retirement, 2026-06-10.)
 */

function buildGroups(workspace: string): SettingsGroup[] {
  const ws = `/${workspace}/settings`;
  return [
    {
      label: 'General',
      sections: [
        { href: `${ws}/general`, label: 'General', icon: SettingsIcon },
        { href: `${ws}/members`, label: 'Members', icon: UsersIcon },
        { href: `${ws}/billing`, label: 'Billing', icon: CreditCardIcon },
      ],
    },
    {
      label: 'Operations',
      sections: [
        { href: `${ws}/integrations`, label: 'Integrations', icon: PuzzleIcon },
        { href: `${ws}/ai`, label: 'AI', icon: BrainIcon },
        { href: `${ws}/api-keys`, label: 'API Keys', icon: KeyRoundIcon },
        { href: `${ws}/webhooks`, label: 'Webhooks', icon: WebhookIcon },
        {
          href: `${ws}/notifications`,
          label: 'Notifications',
          icon: BellIcon,
        },
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
