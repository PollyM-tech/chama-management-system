"use client";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  ClipboardList,
  FileChartColumn,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { ACTIVE_CHAMA_KEY } from "@/lib/chama-navigation";
import {
  WORKSPACE_SECTIONS,
  SECTION_LABELS,
  roleLabel,
} from "../../../shared/workspace";
import "./workspace.css";

export type WorkspaceData = FunctionReturnType<typeof api.workspace.get>;
const WorkspaceContext = createContext<WorkspaceData | null>(null);
export function useWorkspace() {
  const data = useContext(WorkspaceContext);
  if (!data) throw new Error("Workspace provider missing");
  return data;
}
const icons = {
  dashboard: LayoutDashboard,
  members: Users,
  contributions: HandCoins,
  loans: ClipboardList,
  finance: Landmark,
  reports: FileChartColumn,
  transactions: Activity,
  investments: Sprout,
  analytics: ChartNoAxesCombined,
  admin: ShieldCheck,
  notifications: Bell,
  settings: Settings,
};

export function WorkspaceShell({
  preloaded,
  children,
}: {
  preloaded: Preloaded<typeof api.workspace.get>;
  children: ReactNode;
}) {
  const data = usePreloadedQuery(preloaded);
  const path = usePathname();
  const root = `/dashboard/${data.chama._id}`;
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_CHAMA_KEY, data.chama._id);
    } catch {}
  }, [data.chama._id]);
  const unread = data.notifications.filter((n) => !n.isRead).length;
  return (
    <WorkspaceContext.Provider value={data}>
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <div className="workspace-group-heading">
            <span>YOUR SAVINGS GROUP</span>
            <h2>{data.chama.name}</h2>
            <small>
              <ShieldCheck size={12} />
              {roleLabel(data.member.role)}
            </small>
          </div>
          <nav aria-label="Savings group sections">
            {WORKSPACE_SECTIONS.map((section) => {
              const Icon = icons[section];
              const href =
                section === "dashboard" ? root : `${root}/${section}`;
              const active = path === href;
              return (
                <Link
                  key={section}
                  href={href}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{SECTION_LABELS[section]}</span>
                  {section === "notifications" && unread > 0 && <b>{unread}</b>}
                </Link>
              );
            })}
          </nav>
          <Link href="/dashboard?choose=1" className="workspace-switch">
            <ArrowLeftRight size={15} />
            Switch savings group
          </Link>
        </aside>
        <div className="workspace-content">
          <div className="workspace-topline">
            <span>Welcome, {data.member.name.split(" ")[0]}</span>
            <span className="workspace-live">
              <i /> Live group records
            </span>
          </div>
          {children}
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
