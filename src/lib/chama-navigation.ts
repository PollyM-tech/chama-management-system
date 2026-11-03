export const ACTIVE_CHAMA_KEY = "smartchama.activeChamaId";

export function groupDashboardPath(chamaId: string) {
  return `/dashboard/${encodeURIComponent(chamaId)}`;
}

export function preferredChamaId(
  groups: readonly { _id: string }[],
  savedId: string | null,
) {
  const saved = groups.find((group) => group._id === savedId);
  return saved?._id ?? (groups.length === 1 ? groups[0]._id : null);
}
