export const INVITATION_ROLES = ["member", "chairperson", "secretary", "treasurer"] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

export function normalizePhone(value: string) {
  let phone = value.trim().replace(/[\s()-]/g, "");
  if (/^0[17]\d{8}$/.test(phone)) phone = `+254${phone.slice(1)}`;
  if (/^254[17]\d{8}$/.test(phone)) phone = `+${phone}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("INVALID_PHONE_NUMBER");
  return phone;
}
