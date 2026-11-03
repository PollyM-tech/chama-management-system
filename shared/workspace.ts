export const WORKSPACE_SECTIONS = [
  "dashboard",
  "members",
  "contributions",
  "loans",
  "finance",
  "reports",
  "transactions",
  "investments",
  "analytics",
  "admin",
  "notifications",
  "settings",
] as const;
export type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number];
export const OFFICERS = [
  "admin",
  "chairperson",
  "treasurer",
  "secretary",
] as const;
export const FINANCE_ROLES = ["admin", "chairperson", "treasurer"] as const;
export const ADMIN_ROLES = ["admin", "chairperson"] as const;
export const SECTION_LABELS: Record<WorkspaceSection, string> = {
  dashboard: "Dashboard",
  members: "Members",
  contributions: "Contributions",
  loans: "Loans",
  finance: "Finance",
  reports: "Reports",
  transactions: "Transactions",
  investments: "Investments",
  analytics: "Analytics",
  admin: "Admin",
  notifications: "Notifications",
  settings: "Settings",
};
export function roleLabel(role: string) {
  return role === "admin"
    ? "Chairperson / Admin"
    : role[0].toUpperCase() + role.slice(1);
}
export function safeReturnPath(value: string | null) {
  return value && /^\/join\/[a-f0-9]{64}$/.test(value) ? value : "/dashboard";
}
