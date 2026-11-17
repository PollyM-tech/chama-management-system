/** Safe, actionable messages for email failures; never display raw provider errors. */
export function authEmailError(cause: unknown): string | null {
  const message = cause instanceof Error ? cause.message : "";
  if (/AUTH_EMAIL_NOT_CONFIGURED|AUTH_EMAIL_SENDER_REJECTED/.test(message))
    return "We couldn’t send your verification email because the email service is not configured correctly. Contact your administrator, then sign in to request a new code.";
  if (message.includes("AUTH_EMAIL_RATE_LIMITED"))
    return "The email service is busy. Wait a few minutes, then sign in to request a new verification code.";
  if (message.includes("AUTH_EMAIL_DELIVERY_FAILED"))
    return "We couldn’t deliver your verification email. Try signing in to request a new code.";
  return null;
}
