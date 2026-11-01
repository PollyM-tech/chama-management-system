import Resend from "@auth/core/providers/resend";
import { BRAND_NAME } from "../../shared/brand";

export function emailCodeProvider(id: string, purpose: string) {
  return Resend({
    id,
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 10 * 60,
    generateVerificationToken() {
      let code = "";
      // Rejection sampling keeps each digit equally likely.
      while (code.length < 8) {
        for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
          if (byte < 250 && code.length < 8) code += String(byte % 10);
        }
      }
      return Promise.resolve(code);
    },
    async sendVerificationRequest({ identifier, token, provider }) {
      const from = process.env.AUTH_EMAIL_FROM;
      if (!provider.apiKey || !from)
        throw new Error("Email delivery is not configured");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [identifier],
          subject: `${purpose} — ${BRAND_NAME}`,
          text: `Your ${BRAND_NAME} code is ${token}. It expires in 10 minutes. If you did not request this, ignore this email.`,
        }),
      });
      if (!response.ok) throw new Error("Unable to send authentication email");
    },
  });
}
