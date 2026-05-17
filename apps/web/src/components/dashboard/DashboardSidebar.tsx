import Link from "next/link";
import { GitBranch, Plus, Settings, CreditCard, LogOut, Home } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export interface RepoNavEntry {
  scanId: string;
  rootPath: string;
  shortName: string;
}

export function DashboardSidebar({ repos }: { repos: RepoNavEntry[] }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5 font-mono text-sm font-bold tracking-tight"
        >
          <span className="text-primary">▸</span>
          <span>ValidationKit</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <Home className="size-4" />
                    All scans
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard?severity=Kill">
                    <GitBranch className="size-4" />
                    Critical only
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {repos.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              Recent repos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {repos.map((r) => (
                  <SidebarMenuItem key={r.scanId}>
                    <SidebarMenuButton asChild size="sm">
                      <Link href={`/scans/${r.scanId}`}>
                        <span className="truncate font-mono text-xs">{r.shortName}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Plus className="size-4" />
                    New audit
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/trust">
                <Settings className="size-4" />
                Trust & Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <CreditCard className="size-4" />
              Billing (Sprint 0.13)
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/api/auth/sign-out">
                <LogOut className="size-4" />
                Sign out
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
