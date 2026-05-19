export interface MockWorkspace {
  slug: string;
  label: string;
  plan: 'solo' | 'team' | 'agency';
}

export const MOCK_WORKSPACES: MockWorkspace[] = [
  { slug: 'acme-consulting', label: 'Acme Consulting', plan: 'agency' },
  { slug: 'kolja-solo', label: 'Kolja (Solo)', plan: 'solo' },
  { slug: 'globex-labs', label: 'Globex Labs', plan: 'team' },
];

export const DEFAULT_WORKSPACE_SLUG = MOCK_WORKSPACES[0]!.slug;
