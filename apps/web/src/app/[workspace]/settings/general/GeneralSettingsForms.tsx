'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  renameWorkspace,
  transferOwnership,
} from '@/lib/workspace-actions';

interface MemberOption {
  userId: string;
  label: string;
}

export function GeneralSettingsForms({
  workspaceId,
  workspaceSlug,
  currentName,
  canRename,
  isOwner,
  members,
}: {
  workspaceId: string;
  workspaceSlug: string;
  currentName: string;
  canRename: boolean;
  isOwner: boolean;
  members: MemberOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [target, setTarget] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onRename(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await renameWorkspace(workspaceId, name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Workspace umbenannt.');
      router.refresh();
    });
  }

  function doTransfer() {
    if (!target) return;
    startTransition(async () => {
      const res = await transferOwnership(workspaceId, target);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Inhaberschaft übergeben.');
      router.refresh();
    });
  }

  const targetLabel = members.find((m) => m.userId === target)?.label ?? '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace-Name</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onRename} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                disabled={!canRename}
              />
              <p className="text-xs text-muted-foreground">
                Slug{' '}
                <code className="font-mono">{workspaceSlug}</code> bleibt
                unverändert (URLs sollen nicht brechen).
              </p>
            </div>
            {canRename ? (
              <Button
                type="submit"
                size="sm"
                disabled={pending || name.trim() === currentName.trim()}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Speichere…
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nur Owner/Admins können umbenennen.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Inhaberschaft übergeben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine anderen aktiven Mitglieder. Lade jemanden ein, bevor du
                die Inhaberschaft übergibst.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Das neue Mitglied wird Owner; du wirst Admin. Notwendig, bevor
                  du deinen Account löschen kannst, falls du Allein-Owner bist.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="transfer-target">Neuer Owner</Label>
                    <select
                      id="transfer-target"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="rounded-md border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="">— Mitglied wählen —</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!target || pending}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Übergeben
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inhaberschaft übergeben?</AlertDialogTitle>
            <AlertDialogDescription>
              „{targetLabel}" wird Owner dieses Workspace, du wirst zum Admin.
              Das lässt sich nur durch eine erneute Übergabe rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                doTransfer();
              }}
            >
              Übergeben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
