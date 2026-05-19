import { notFound, redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listUserWorkspaces } from '@/lib/dal/galaxie';
import { listMembers } from '@/lib/membership';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function SettingsMembersPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { workspace } = await params;
  const accessible = await listUserWorkspaces(user.id);
  const ws = accessible.find((w) => w.slug === workspace);
  if (!ws) notFound();

  const members = await listMembers(ws.id);

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Who can see this workspace. Sprint G6 ships read-only view; invite flow
          is on /requests until G7 polish.
        </p>
      </header>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead className="w-28">Role</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">
                    {m.email ?? m.userId ?? m.invitedEmail ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{m.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
