import { redirect } from 'next/navigation';

export default function AccountSettingsRoot() {
  redirect('/account/settings/profile' as never);
}
