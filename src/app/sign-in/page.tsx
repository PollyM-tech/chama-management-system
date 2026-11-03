"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { api } from "../../../convex/_generated/api";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_TAGLINE } from "../../../shared/brand";
import { safeReturnPath } from "../../../shared/workspace";

type Step =
  | "signIn"
  | "signUp"
  | "email-verification"
  | "reset"
  | "reset-verification";

const titles: Record<Step, string> = {
  signIn: "Welcome back",
  signUp: "Create your account",
  "email-verification": "Verify your email",
  reset: "Reset your password",
  "reset-verification": "Choose a new password",
};

function SignInForm() {
  const searchParams = useSearchParams();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const sessionValid = useQuery(
    api.auth.isAuthenticated,
    isAuthenticated ? {} : "skip",
  );
  const [step, setStep] = useState<Step>(
    searchParams.get("flow") === "signUp" ? "signUp" : "signIn",
  );
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load the authenticated server layout with fresh cookies after login,
    // verification, or recovery, instead of reusing prefetched route state.
    if (sessionValid)
      window.location.replace(safeReturnPath(searchParams.get("next")));
  }, [sessionValid, searchParams]);

  function changeStep(next: Step) {
    setError("");
    setStep(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    data.set("email", email.trim().toLowerCase());
    data.set("flow", step);
    try {
      const result = await signIn("password", data);
      if (step === "reset") setStep("reset-verification");
      else if ((step === "signIn" || step === "signUp") && !result.signingIn)
        setStep("email-verification");
    } catch (cause) {
      if (step === "reset") {
        // Do not reveal whether this address has an account.
        setStep("reset-verification");
      } else {
        setError(
          step === "signIn"
            ? "Unable to sign in. Check your email and password and try again."
            : step === "signUp"
              ? cause instanceof Error &&
                /\baccount\b[^\n]*\balready exists\b/i.test(cause.message)
                ? "An account with this email already exists. Sign in, or use Forgot password to recover your account."
                : "Unable to create your account. Check your details, or try signing in."
              : "Unable to verify the code. It may have expired. Try again or start over.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const codeStep =
    step === "email-verification" || step === "reset-verification";
  const passwordStep =
    step === "signIn" || step === "signUp" || step === "reset-verification";
  const inputClass =
    "mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 focus:outline-emerald-700";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="large" />
        </div>
        <h1 className="text-2xl font-semibold">{titles[step]}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {codeStep
            ? `Enter the eight-digit code sent to ${email}. Codes expire after 10 minutes.`
            : step === "reset"
              ? "If you have an account, we’ll send you a recovery code."
              : BRAND_TAGLINE}
        </p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          {step === "signUp" && (
            <label className="block text-sm font-medium">
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                className={inputClass}
              />
            </label>
          )}
          {!codeStep && (
            <label className="block text-sm font-medium">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
          )}
          {codeStep && (
            <label className="block text-sm font-medium">
              Verification code
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{8}"
                maxLength={8}
                required
                className={inputClass}
              />
            </label>
          )}
          {passwordStep && (
            <label className="block text-sm font-medium">
              {step === "reset-verification" ? "New password" : "Password"}
              <input
                name={
                  step === "reset-verification" ? "newPassword" : "password"
                }
                type="password"
                autoComplete={
                  step === "signIn" ? "current-password" : "new-password"
                }
                required
                minLength={step === "signIn" ? undefined : 12}
                maxLength={128}
                className={inputClass}
              />
              {step !== "signIn" && (
                <span className="mt-2 block text-xs text-zinc-500">
                  Use between 12 and 128 characters.
                </span>
              )}
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {busy
              ? "Please wait…"
              : step === "signIn"
                ? "Sign in"
                : step === "signUp"
                  ? "Create account"
                  : step === "reset"
                    ? "Send recovery code"
                    : "Continue"}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap justify-between gap-4 text-sm text-emerald-800">
          <button
            disabled={busy}
            onClick={() => changeStep(step === "signIn" ? "signUp" : "signIn")}
          >
            {step === "signIn" ? "Create an account" : "Back to sign in"}
          </button>
          {step === "signIn" && (
            <button disabled={busy} onClick={() => changeStep("reset")}>
              Forgot password?
            </button>
          )}
          {step === "email-verification" && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await signIn("password", {
                    flow: "email-verification",
                    email: email.trim().toLowerCase(),
                  });
                } catch {
                  setError(
                    "Unable to resend the code. Please try again later.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Resend code
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-700"
          role="status"
        >
          Loading your account…
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
