/**
 * Barrel-export for the VK Design-System layout primitives.
 * Phase Nova-2 Foundation, 2026-05-20 — slimmed 2026-05-21 to real-used set
 * (siehe docs/audits/2026-05/dead-code-apps-web.md).
 *
 * For composer-style components (Card, Button, Form, etc.) use shadcn/ui via
 * `@/components/ui/*`. ui-vk hält Layout-Primitives spezifisch für das VK-Repo.
 */

export { PageShell } from './PageShell';
export { PageHeader } from './PageHeader';
export { EmptyState } from './EmptyState';
export { PageSkeleton } from './PageSkeleton';
export {
  SettingsLayout,
  type SettingsSection,
  type SettingsGroup,
} from './SettingsLayout';
