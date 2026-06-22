'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateAccountProfile } from '@/lib/account-actions';

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAccountProfile(name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Profil gespeichert.');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Anzeigename</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          maxLength={200}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={pending || name.trim() === initialName.trim()}
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
    </form>
  );
}
