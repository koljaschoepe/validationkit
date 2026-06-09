import { redirect } from 'next/navigation';

export default async function SettingsRoot({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  // Bundle D: land on Members (a real section) — the old `general` default is a
  // not-yet-backed stub and is now hidden from the settings nav.
  redirect(`/${workspace}/settings/members` as never);
}
