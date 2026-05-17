"use client";

import { useDashboardEvents } from "@/hooks/use-dashboard-events";

export function DashboardEventBus() {
  useDashboardEvents();
  return null;
}
