import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { UserIcon, KeyIcon, Trash2Icon } from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { SettingsLayout, type SettingsGroup } from '@/components/ui-vk';

export const dynamic = 'force-dynamic';

/**
 * Account-scope settings layout — Phase Nova-2 P5.
 *
 * URL-split mirrors Linear / Vercel: `/account/settings/*` for user-scope
 * (profile, sessions, personal notifications, OAuth connections, delete-account),
 * `/[workspace]/settings/*` for workspace-scope. Skip-link target inside.
 */

// Bundle D: `notifications` + `connections` were "Coming soon" stubs — hidden
// from the nav until their backend lands (routes still resolve by direct URL).
// Profile stays (it shows read-only account info), Sessions + Delete are real.
const GROUPS: SettingsGroup[] = [
  {
    label: 'You',
    sections: [
      { href: '/account/settings/profile', label: 'Profile', icon: UserIcon },
      { href: '/account/settings/sessions', label: 'Sessions', icon: KeyIcon },
    ],
  },
  {
    label: 'Danger',
    sections: [
      {
        href: '/account/settings/delete',
        label: 'Delete account',
        icon: Trash2Icon,
      },
    ],
  },
];

export default async function AccountSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account/settings/profile');

  return (
    <main id="main-content" className="min-h-screen">
      <SettingsLayout groups={GROUPS} backHref="/dashboard" backLabel="Back to dashboard">
        {children}
      </SettingsLayout>
    </main>
  );
}
