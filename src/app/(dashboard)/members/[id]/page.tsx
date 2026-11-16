import { redirectLegacyRecord } from "@/lib/legacy-navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return redirectLegacyRecord("members", id);
}
