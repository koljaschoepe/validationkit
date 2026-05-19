import { describe, expect, it } from 'vitest';
import { galaxieWorkspaceTag, userWorkspacesTag } from './cache-tags';

// These tests are refactor-guards: production code revalidateTag() calls must
// match the read-side unstable_cache tags. If you change the format, also
// update every revalidateTag callsite.
describe('cache-tags', () => {
  it('galaxieWorkspaceTag includes the workspace id', () => {
    const t = galaxieWorkspaceTag('ws-abc-123');
    expect(t).toBe('galaxie:workspace:ws-abc-123');
  });

  it('userWorkspacesTag includes the user id', () => {
    const t = userWorkspacesTag('u-42');
    expect(t).toBe('user:u-42:workspaces');
  });

  it('different ids produce different tags', () => {
    expect(galaxieWorkspaceTag('a')).not.toBe(galaxieWorkspaceTag('b'));
    expect(userWorkspacesTag('a')).not.toBe(userWorkspacesTag('b'));
  });
});
