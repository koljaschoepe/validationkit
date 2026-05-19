import { redirect } from 'next/navigation';

export default async function SettingsRoot({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  redirect(`/${workspace}/settings/user` as never);
}
