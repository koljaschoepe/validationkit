'use client';

import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GalaxieSettings } from './RepoGalaxie';

/**
 * GalaxieSettingsPopover — top-right control panel for the Galaxie-Hero.
 *
 * Toggles three visual/interaction options:
 *   - Pulse-Animation on/off
 *   - Zoom-speed (slow / standard / fast)
 *   - Reduced-motion override (auto / forced-on / forced-off)
 *
 * State is owned by the parent (HeroSection); this is a controlled component.
 */

export function GalaxieSettingsPopover({
  settings,
  onChange,
}: {
  settings: GalaxieSettings;
  onChange: (settings: GalaxieSettings) => void;
}) {
  const update = <K extends keyof GalaxieSettings>(key: K, value: GalaxieSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Galaxie-Einstellungen"
          className="h-8 w-8 border border-border bg-background/70 backdrop-blur hover:bg-background/90"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 space-y-4 p-4"
      >
        <div className="space-y-1.5">
          <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
            Galaxie-Settings
          </p>
          <p className="type-mono-sm text-foreground/65">
            Visual + Interaction-Tuning für die Demo.
          </p>
        </div>

        <SettingRow label="Pulse-Animation">
          <ToggleGroup
            value={settings.pulseOn ? 'on' : 'off'}
            options={[
              { value: 'on', label: 'On' },
              { value: 'off', label: 'Off' },
            ]}
            onChange={(v) => update('pulseOn', v === 'on')}
          />
        </SettingRow>

        <SettingRow label="Zoom-Speed">
          <ToggleGroup
            value={settings.zoomSpeed}
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'standard', label: 'Std' },
              { value: 'fast', label: 'Fast' },
            ]}
            onChange={(v) => update('zoomSpeed', v as GalaxieSettings['zoomSpeed'])}
          />
        </SettingRow>

        <SettingRow label="Reduced-Motion">
          <ToggleGroup
            value={settings.reducedMotionMode}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'on', label: 'On' },
              { value: 'off', label: 'Off' },
            ]}
            onChange={(v) => update('reducedMotionMode', v as GalaxieSettings['reducedMotionMode'])}
          />
        </SettingRow>
      </PopoverContent>
    </Popover>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono type-mono-sm text-foreground/85">{label}</span>
      {children}
    </div>
  );
}

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
      style={{ borderRadius: 'var(--vk-radius-sm)' }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'min-w-12 rounded px-2 py-0.5 font-mono text-[11px] transition-colors',
              selected
                ? 'bg-foreground/10 text-foreground'
                : 'text-foreground/60 hover:text-foreground/85',
            )}
            style={{ borderRadius: 'var(--vk-radius-sm)' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
