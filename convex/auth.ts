import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { z } from "zod";
import { emailCodeProvider } from "./lib/email";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { ConvexError } from "convex/values";
import { activateAdminAccess } from "./lib/admin_access";
import type { MutationCtx } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
  callbacks: {
    async beforeSessionCreation(ctx, { userId }) {
      await activateAdminAccess(ctx as MutationCtx, userId);
    },
  },
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = z
          .email()
          .parse(
            typeof params.email === "string"
              ? params.email.trim().toLowerCase()
              : params.email,
          );
        // Password forwards params to verification/recovery providers. Normalize
        // that shared input too, keeping account IDs and code identifiers equal.
        params.email = email;
        if (params.flow === "signUp")
          return {
            email,
            name: z.string().trim().min(1).max(100).parse(params.name),
          };
        return { email };
      },
      validatePasswordRequirements(password) {
        z.string().min(12).max(128).parse(password);
      },
      verify: emailCodeProvider("email-verification", "Verify your email"),
      reset: emailCodeProvider("password-reset", "Reset your password"),
    }),
  ],
});

// Next.js calls this query for route redirects. Match the backend's stricter
// session and verification requirements rather than trusting a JWT alone.
export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireUser(ctx);
      return true;
    } catch (error) {
      if (error instanceof ConvexError) return false;
      throw error;
    }
  },
});
