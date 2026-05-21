import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  SettingsIcon,
  UsersIcon,
  CreditCardIcon,
  PuzzleIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  BellIcon,
  WebhookIcon,
  GlobeIcon,
  SparklesIcon,
} from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { SettingsLayout, type SettingsGroup } from '@/components/ui-vk';

export const dynamic = 'force-dynamic';

/**
 * Workspace settings layout — Phase Nova-2 P5 restructure.
 *
 * 10 sections grouped into General / Operations / Notifications / Danger.
 * The 6 NEW sections (General, API-Keys, Audit & Apply, Galaxie, Notifications,
 * Webhooks, Danger) ship as functional UI shells; their DB backing lives in
 * the follow-up sub-plan `nova-2-settings-backend.md`.
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
        { href: `${ws}/api-keys`, label: 'API Keys', icon: KeyRoundIcon },
        { href: `${ws}/audit-apply`, label: 'Audit & Apply', icon: SparklesIcon },
        { href: `${ws}/galaxie`, label: 'Galaxie', icon: GlobeIcon },
      ],
    },
    {
      label: 'Communication',
      sections: [
        { href: `${ws}/notifications`, label: 'Notifications', icon: BellIcon },
        { href: `${ws}/webhooks`, label: 'Webhooks', icon: WebhookIcon },
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
