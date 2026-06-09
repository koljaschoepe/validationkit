import { describe, expect, it } from 'vitest';
import { AGENT_FILE_KINDS, KIND_META, folderRole } from '@vk/core';
import {
  fileDisplayName,
  fileSubtitle,
  fileVendor,
  folderDisplayName,
  folderSubtitle,
} from './humanize';
import type { FileNode, FolderNode } from './types';

const file = (over: Partial<FileNode> & Pick<FileNode, 'path'>): FileNode => ({
  id: 'f',
  repoId: 'r',
  customerId: 'c',
  severity: 'Mid',
  findingSnippet: '',
  findings: [],
  ...over,
});

const folder = (name: string): FolderNode => ({
  id: `r::folder::${name}`,
  repoId: 'r',
  customerId: 'c',
  name,
  fileCount: 1,
  fileIds: ['f'],
  aggregateSeverity: 'Mid',
});

describe('KIND_META', () => {
  it('covers every AgentFileKind with a non-empty label/purpose/vendor', () => {
    for (const kind of AGENT_FILE_KINDS) {
      const meta = KIND_META[kind];
      expect(meta, kind).toBeDefined();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.purpose.length).toBeGreaterThan(0);
      expect(meta.vendor.length).toBeGreaterThan(0);
      expect(['primary', 'vendor']).toContain(meta.tier);
    }
  });
});

describe('fileDisplayName', () => {
  it('uses the kind label for context-root config files', () => {
    expect(
      fileDisplayName(file({ path: '.claude/CLAUDE.md', kind: 'claude-md' })),
    ).toBe('Project Guidance');
    expect(fileDisplayName(file({ path: 'AGENTS.md', kind: 'agents-md' }))).toBe(
      'Agent Guidance',
    );
  });

  it('uses the file own name for named kinds (subagents etc.)', () => {
    expect(
      fileDisplayName(
        file({ path: '.claude/agents/researcher.md', kind: 'claude-agent' }),
      ),
    ).toBe('researcher');
    expect(
      fileDisplayName(
        file({ path: '.cursor/rules/typescript.mdc', kind: 'cursor-rule-mdc' }),
      ),
    ).toBe('typescript');
  });

  it('keeps dotfiles intact for named kinds', () => {
    expect(
      fileDisplayName(file({ path: '.clinerules', kind: 'cline-rule' })),
    ).toBe('.clinerules');
  });

  it('falls back to label then basename for unclassified files', () => {
    expect(fileDisplayName(file({ path: 'x/y.md', label: 'Prose title' }))).toBe(
      'Prose title',
    );
    expect(fileDisplayName(file({ path: 'x/notes.md' }))).toBe('notes');
  });
});

describe('fileSubtitle + fileVendor', () => {
  it('returns the purpose + vendor for a classified file', () => {
    const f = file({ path: '.claude/CLAUDE.md', kind: 'claude-md' });
    expect(fileSubtitle(f)).toBe('Repo-wide instructions for Claude');
    expect(fileVendor(f)).toBe('Claude Code');
  });

  it('returns null for an unclassified file', () => {
    const f = file({ path: 'x.md' });
    expect(fileSubtitle(f)).toBeNull();
    expect(fileVendor(f)).toBeNull();
  });
});

describe('folderDisplayName + folderSubtitle', () => {
  it('maps known folder roles', () => {
    expect(folderDisplayName(folder('.claude'))).toBe('Claude Code config');
    expect(folderDisplayName(folder('.claude/agents'))).toBe('Subagents');
    expect(folderSubtitle(folder('.claude/agents'))).toBe(
      'Specialised agent definitions',
    );
  });

  it('falls back to the last segment for unmapped folders', () => {
    expect(folderDisplayName(folder('apps/web/src/lib'))).toBe('lib');
    expect(folderSubtitle(folder('apps/web/src/lib'))).toBe(
      'Context files governing apps/web/src/lib/',
    );
  });
});

describe('folderRole (core)', () => {
  it('maps .claude and returns null for unknown', () => {
    expect(folderRole('.claude')?.label).toBe('Claude Code config');
    expect(folderRole('totally/unknown')).toBeNull();
  });
});
