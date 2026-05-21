import { redirect } from 'next/navigation';

export default async function SettingsRoot({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  // Phase Nova-2: `/[workspace]/settings/user/` is gone — user-scope lives
  // under `/account/settings/profile`. Land on the workspace General-section.
  redirect(`/${workspace}/settings/general` as never);
}
