'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon, KeyRoundIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * ApiKeyModal — Reveal-Once-pattern dialog for API-key generation. Modeled
 * after Resend / Stripe / GitHub: the plaintext token is shown exactly once,
 * after which only a SHA-256(token)-prefix is stored. Users who lose the
 * value must revoke + regenerate.
 *
 * Phase Nova-2 P5: standalone UI with onCreate-callback. Backend wiring
 * lands in nova-2-settings-backend (api_key table + create-route).
 */

export interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Async create — returns the plaintext token exactly once. */
  onCreate?: (name: string, scope: string) => Promise<{ token: string }>;
}

const SCOPES = [
  { value: 'read', label: 'Read' },
  { value: 'apply', label: 'Read + Apply' },
  { value: 'admin', label: 'Admin (full)' },
] as const;

export function ApiKeyModal({ open, onOpenChange, onCreate }: ApiKeyModalProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<string>('read');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset state when the dialog closes.
      setName('');
      setScope('read');
      setError(null);
      setToken(null);
      setCopied(false);
    }
  }, [open]);

  async function handleCreate() {
    if (!onCreate || !name) return;
    setSubmitting(true);
    setError(null);
    try {
      const { token } = await onCreate(name, scope);
      setToken(token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-muted-foreground" aria-hidden />
            <DialogTitle>
              {token ? 'Save your API key' : 'Create API key'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {token
              ? 'This is the only time the token is shown. Save it somewhere safe — we only keep a fingerprint.'
              : 'Name + scope. You can rename later; scope is fixed.'}
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="api-key-token" className="font-mono type-mono-sm">
                Token
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-key-token"
                  value={token}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button type="button" size="icon" variant="outline" onClick={copyToken}>
                  {copied ? (
                    <CheckIcon className="size-4 text-[var(--color-sev-exceptional)]" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <Alert>
              <AlertTitle>Stored hashed only</AlertTitle>
              <AlertDescription>
                We keep <code>SHA-256(token)[0..7]</code> as the visible identifier.
                Lose the token → revoke + regenerate.
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              I&apos;ve saved it
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="api-key-name">Name</Label>
              <Input
                id="api-key-name"
                placeholder="ci-deploy-token"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-key-scope">Scope</Label>
              <select
                id="api-key-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
              >
                {SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="button"
              className="w-full"
              disabled={!name || submitting || !onCreate}
              onClick={handleCreate}
            >
              {submitting ? 'Creating…' : 'Create key'}
            </Button>
            {!onCreate ? (
              <p className="font-mono type-mono-sm text-muted-foreground">
                Backend wiring pending (nova-2-settings-backend).
              </p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
