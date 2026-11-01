/// <reference types="vite/client" />
import { generateKeyPairSync } from "node:crypto";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const password = "a-long-test-password";
let deliveredCode = "";

beforeEach(() => {
  vi.stubEnv(
    "JWT_PRIVATE_KEY",
    privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  );
  vi.stubEnv("CONVEX_SITE_URL", "https://auth-test.convex.site");
  vi.stubEnv("SITE_URL", "http://localhost:3000");
  vi.stubEnv("AUTH_RESEND_KEY", "test-key");
  vi.stubEnv("AUTH_EMAIL_FROM", "SmartChama <auth@example.com>");
  deliveredCode = "";
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
    expect(url).toBe("https://api.resend.com/emails");
    const email = JSON.parse(String(options?.body));
    deliveredCode = email.text.match(/code is (\d{8})/)[1];
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test("password registration requires email verification; login and logout run in Convex", async () => {
  const t = convexTest(schema, modules);
  const registration = await t.action(api.auth.signIn, {
    provider: "password",
    params: {
      flow: "signUp",
      email: "  TEST@EXAMPLE.COM ",
      password,
      name: "Test User",
      role: "admin",
    },
  });
  expect(registration.tokens).toBeNull();
  expect(deliveredCode).toMatch(/^\d{8}$/);
  await t.run(async (ctx) => {
    const user = await ctx.db.query("users").unique();
    expect(user?.email).toBe("test@example.com");
    expect(user?.emailVerificationTime).toBeUndefined();
    expect(await ctx.db.query("members").collect()).toEqual([]);
    const account = await ctx.db.query("authAccounts").unique();
    expect(account?.secret).toBeTruthy();
    expect(account?.secret).not.toBe(password);
  });
  const verification = await t.action(api.auth.signIn, {
    provider: "password",
    params: {
      flow: "email-verification",
      email: "test@example.com",
      code: deliveredCode,
    },
  });
  expect(verification.tokens?.token).toBeTruthy();
  await expect(
    t.action(api.auth.signIn, {
      provider: "password",
      params: {
        flow: "email-verification",
        email: "test@example.com",
        code: deliveredCode,
      },
    }),
  ).rejects.toThrow();
  await expect(
    t.action(api.auth.signIn, {
      provider: "password",
      params: {
        flow: "signIn",
        email: "test@example.com",
        password: "wrong-password",
      },
    }),
  ).rejects.toThrow();
  const login = await t.action(api.auth.signIn, {
    provider: "password",
    params: { flow: "signIn", email: "TEST@example.com", password },
  });
  expect(login.tokens?.token).toBeTruthy();
  const claims = JSON.parse(
    Buffer.from(login.tokens!.token.split(".")[1], "base64url").toString(),
  );
  const signedIn = t.withIdentity({ subject: claims.sub });
  expect((await signedIn.query(api.users.current, {})).email).toBe(
    "test@example.com",
  );
  await signedIn.action(api.auth.signOut, {});
  await expect(signedIn.query(api.users.current, {})).rejects.toThrow(
    "UNAUTHENTICATED",
  );
});

test("recovery codes change the password and revoke existing sessions", async () => {
  const t = convexTest(schema, modules);
  await t.action(api.auth.signIn, {
    provider: "password",
    params: {
      flow: "signUp",
      email: "test@example.com",
      password,
      name: "Test",
    },
  });
  const verified = await t.action(api.auth.signIn, {
    provider: "password",
    params: {
      flow: "email-verification",
      email: "test@example.com",
      code: deliveredCode,
    },
  });
  const claims = JSON.parse(
    Buffer.from(verified.tokens!.token.split(".")[1], "base64url").toString(),
  );
  const previousSession = t.withIdentity({ subject: claims.sub });
  await t.action(api.auth.signIn, {
    provider: "password",
    params: { flow: "reset", email: "test@example.com" },
  });
  await expect(
    t.action(api.auth.signIn, {
      provider: "password",
      params: {
        flow: "reset-verification",
        email: "test@example.com",
        code: "bad-code",
        newPassword: "my-new-long-password",
      },
    }),
  ).rejects.toThrow();
  const reset = await t.action(api.auth.signIn, {
    provider: "password",
    params: {
      flow: "reset-verification",
      email: "test@example.com",
      code: deliveredCode,
      newPassword: "my-new-long-password",
    },
  });
  expect(reset.tokens?.token).toBeTruthy();
  await expect(previousSession.query(api.users.current, {})).rejects.toThrow(
    "UNAUTHENTICATED",
  );
  await expect(
    t.action(api.auth.signIn, {
      provider: "password",
      params: { flow: "signIn", email: "test@example.com", password },
    }),
  ).rejects.toThrow();
  expect(
    (
      await t.action(api.auth.signIn, {
        provider: "password",
        params: {
          flow: "signIn",
          email: "test@example.com",
          password: "my-new-long-password",
        },
      })
    ).tokens?.token,
  ).toBeTruthy();
});

test("backend rejects weak passwords and invalid email without creating accounts", async () => {
  const t = convexTest(schema, modules);
  for (const params of [
    {
      flow: "signUp",
      email: "test@example.com",
      password: "short",
      name: "Test",
    },
    { flow: "signUp", email: "not-an-email", password, name: "Test" },
  ])
    await expect(
      t.action(api.auth.signIn, { provider: "password", params }),
    ).rejects.toThrow();
  await t.run(async (ctx) => {
    expect(await ctx.db.query("users").collect()).toEqual([]);
  });
});
