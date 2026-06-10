'use client';

import { useRouter } from 'next/navigation';
import { SolarListView } from './SolarListView';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { ActivationChecklist } from './ActivationChecklist';
import type { GalaxieData, OnboardingState } from '@/lib/galaxie/types';
import type { MockWorkspace } from '@/lib/galaxie/mock-workspaces';

/**
 * The authenticated workspace surface — the triage CONSOLE (SolarListView) plus
 * the two chrome pieces that used to live only inside the now-retired Pixi
 * galaxie: the WorkspaceSwitcher (in-app workspace navigation) and the
 * ActivationChecklist (first-run onboarding). Replaces `GalaxieRoot` as the
 * workspace mount point after the galaxie retirement (2026-06-10): no Pixi, no
 * Map-tab, no reduced-motion SVG fallback — the console is keyboard-/
 * screenreader-native for every user.
 */
export interface WorkspaceConsoleProps {
  initialData?: GalaxieData;
  initialWorkspaceSlug?: string;
  workspaces?: MockWorkspace[];
  onboarding?: OnboardingState;
  readOnly?: boolean;
}

export default function WorkspaceConsole({
  initialData,
  initialWorkspaceSlug,
  workspaces,
  onboarding,
  readOnly,
}: WorkspaceConsoleProps) {
  const router = useRouter();

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {initialWorkspaceSlug ? (
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <WorkspaceSwitcher
            current={initialWorkspaceSlug}
            onChange={(slug) => router.push(`/${slug}`)}
            workspaces={workspaces}
          />
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <SolarListView
          initialData={initialData}
          readOnly={readOnly}
          workspaceSlug={initialWorkspaceSlug}
        />
        {onboarding ? (
          <ActivationChecklist
            state={{
              workspaceId: onboarding.workspaceId,
              customerCount: onboarding.customerCount,
              repoCount: onboarding.repoCount,
              scanCount: onboarding.scanCount,
              applyCount: onboarding.applyCount ?? 0,
              memberCount: onboarding.memberCount ?? 0,
              gitHubAppConfigured: onboarding.gitHubAppConfigured,
            }}
            workspaceSlug={initialWorkspaceSlug ?? ''}
          />
        ) : null}
      </div>
    </div>
  );
}
