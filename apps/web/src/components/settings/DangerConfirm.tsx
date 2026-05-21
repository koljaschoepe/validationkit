'use client';

import { useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * DangerConfirm — typed-confirmation primitive for irreversible workspace
 * actions (transfer-ownership, delete-workspace). The user must type the
 * workspace name exactly before the action button enables.
 *
 * GitHub / Stripe / Linear all share this pattern — typed-confirm is the
 * "are you really sure?" that survives muscle-memory accidents.
 */

export interface DangerConfirmProps {
  variant: 'transfer' | 'delete';
  /** Exact workspace name to type. */
  workspaceName: string;
  /** Disables the action button regardless of typed-state (for stub pages). */
  disabled?: boolean;
  /** Called when typed-confirm matches AND user clicks the button. */
  onConfirm?: () => Promise<void> | void;
}

const COPY = {
  transfer: {
    title: 'Transfer this workspace',
    actionLabel: 'Transfer ownership',
    inputLabel: 'Type the workspace name to confirm transfer',
    alertVariant: undefined,
  },
  delete: {
    title: 'Permanently delete this workspace',
    actionLabel: 'Delete workspace',
    inputLabel: 'Type the workspace name to confirm deletion',
    alertVariant: 'destructive' as const,
  },
};

export function DangerConfirm({
  variant,
  workspaceName,
  disabled,
  onConfirm,
}: DangerConfirmProps) {
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const matches = typed === workspaceName;
  const copy = COPY[variant];

  async function handleClick() {
    if (!matches || !onConfirm || disabled) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Alert variant={copy.alertVariant}>
        <AlertTriangleIcon className="size-4" />
        <AlertTitle>{copy.title}</AlertTitle>
        <AlertDescription>
          This action cannot be undone via the UI. Audit-trail keeps the
          decision but the workspace data is gone.
        </AlertDescription>
      </Alert>

      <div className="space-y-1.5">
        <Label
          htmlFor={`danger-confirm-${variant}`}
          className="font-mono type-mono-sm"
        >
          {copy.inputLabel}
        </Label>
        <Input
          id={`danger-confirm-${variant}`}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={workspaceName}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
      </div>

      <Button
        type="button"
        variant={variant === 'delete' ? 'destructive' : 'default'}
        disabled={!matches || disabled || submitting}
        onClick={handleClick}
      >
        {submitting ? 'Working…' : copy.actionLabel}
      </Button>
    </div>
  );
}
