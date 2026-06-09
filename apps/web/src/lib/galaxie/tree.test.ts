import { describe, expect, it } from 'vitest';
import { buildGalaxieTree } from './tree';
import { computeSolarLayout } from './solar-layout';
import { generateMockGalaxieData } from './mock-data';
import { folderDisplayName } from './humanize';
import type { FileNode, GalaxieData } from './types';

const file = (
  over: Partial<FileNode> & Pick<FileNode, 'id' | 'path' | 'severity'>,
): FileNode => ({
  repoId: 'r1',
  customerId: 'c1',
  findingSnippet: '',
  findings: [],
  ...over,
});

const dataWith = (files: FileNode[]): GalaxieData => ({
  customers: [{ id: 'c1', slug: 'acme', label: 'Acme', aggregateSeverity: 'Mid' }],
  repos: [{ id: 'r1', customerId: 'c1', slug: 'r1', label: 'Repo', aggregateSeverity: 'Mid' }],
  files,
});

describe('buildGalaxieTree', () => {
  it('nests files under their owning folder and lists repo-root files separately', () => {
    const tree = buildGalaxieTree(
      dataWith([
        file({ id: 'f1', path: '.claude/CLAUDE.md', severity: 'Kill', kind: 'claude-md' }),
        file({ id: 'f2', path: '.claude/agents/researcher.md', severity: 'Mid', kind: 'claude-agent' }),
        file({ id: 'f3', path: 'README.md', severity: 'Strong' }),
      ]),
    );
    expect(tree).toHaveLength(1);
    const repo = tree[0]!;
    const folderNames = repo.folders.map((f) => f.folder.name);
    expect(new Set(folderNames)).toEqual(new Set(['.claude', '.claude/agents']));
    const claude = repo.folders.find((f) => f.folder.name === '.claude')!;
    expect(claude.files.map((f) => f.id)).toEqual(['f1']);
    expect(claude.folder.nucleus?.kind).toBe('claude-md');
    expect(repo.rootFiles.map((f) => f.id)).toEqual(['f3']);
  });

  it('sorts files worst-severity-first within a folder', () => {
    const tree = buildGalaxieTree(
      dataWith([
        file({ id: 'a', path: 'docs/a.md', severity: 'Strong' }),
        file({ id: 'b', path: 'docs/b.md', severity: 'Kill' }),
        file({ id: 'c', path: 'docs/c.md', severity: 'Mid' }),
      ]),
    );
    const docs = tree[0]!.folders.find((f) => f.folder.name === 'docs')!;
    expect(docs.files.map((f) => f.severity)).toEqual(['Kill', 'Mid', 'Strong']);
  });
});

// G.3 — parity: the List's tree must use the exact same folder derivation as the
// Pixi + SVG renderers (which both consume computeSolarLayout), so the three
// views never disagree on folder count / names / nucleus / labels.
describe('renderer parity (tree ≡ computeSolarLayout)', () => {
  it('the tree folders match computeSolarLayout folders 1:1 on the mock data', () => {
    const data = generateMockGalaxieData();
    const tree = buildGalaxieTree(data);
    const layout = computeSolarLayout(data);

    const treeFolderIds = tree.flatMap((r) => r.folders.map((f) => f.folder.id)).sort();
    const layoutFolderIds = layout.folders.map((f) => f.id).sort();
    expect(treeFolderIds).toEqual(layoutFolderIds);

    // Nucleus + humanized label are derived identically (same FolderNode object source).
    const layoutById = new Map(layout.folders.map((f) => [f.id, f]));
    for (const r of tree) {
      for (const { folder } of r.folders) {
        const fromLayout = layoutById.get(folder.id)!;
        expect(folder.nucleus?.fileId).toBe(fromLayout.nucleus?.fileId);
        expect(folderDisplayName(folder)).toBe(folderDisplayName(fromLayout));
      }
    }
  });

  it('every file appears exactly once (foldered or root) across the tree', () => {
    const data = generateMockGalaxieData();
    const tree = buildGalaxieTree(data);
    const seen = new Set<string>();
    for (const r of tree) {
      for (const { files } of r.folders) for (const f of files) seen.add(f.id);
      for (const f of r.rootFiles) seen.add(f.id);
    }
    expect(seen.size).toBe(data.files.length);
  });
});
