import { InvitationAcceptance } from "@/components/workspace/invitation-acceptance";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationAcceptance token={token} />;
}
