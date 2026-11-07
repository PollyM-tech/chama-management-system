/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { activateAdminAccess } from "./lib/admin_access";
const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const owner = await ctx.db.insert("users", { email: "owner@example.com", emailVerificationTime: Date.now() });
    const developer = await ctx.db.insert("users", { email: "developer@example.com", name: "Developer" });
    const other = await ctx.db.insert("users", { email: "other@example.com", emailVerificationTime: Date.now() });
    const groups = await Promise.all(["One", "Two"].map(name => ctx.db.insert("chamas", {
      name, createdBy: owner, createdAt: Date.now(), isActive: true,
      contributionAmount: 1000, contributionCycle: "monthly", totalPool: 0,
    })));
    return { developer, other, groups };
  });
  return { t, ...ids };
}

test("prepared admin access requires the matching verified email and is consumed once", async () => {
  const { t, developer, other, groups } = await setup();
  const prepared = await t.mutation(internal.adminAccess.prepare, { email: "  Developer@Example.com ", chamaIds: groups });
  expect(prepared.status).toBe("pending_email_verification");
  expect(await t.run(ctx => activateAdminAccess(ctx, developer))).toBe(0);
  expect(await t.run(ctx => activateAdminAccess(ctx, other))).toBe(0);
  await t.run(ctx => ctx.db.patch(developer, { emailVerificationTime: Date.now() }));
  expect(await t.run(ctx => activateAdminAccess(ctx, developer))).toBe(2);
  const memberships = await t.run(ctx => ctx.db.query("members").withIndex("by_user", q => q.eq("userId", developer)).collect());
  expect(memberships.map(m => m.role)).toEqual(["admin", "admin"]);
  await t.run(ctx => ctx.db.patch(memberships[0]._id, { role: "member" }));
  expect(await t.run(ctx => activateAdminAccess(ctx, developer))).toBe(0);
  expect((await t.run(ctx => ctx.db.get(memberships[0]._id)))?.role).toBe("member");
});

test("expired or revoked pending grants cannot activate administrator access", async () => {
  for (const state of ["expired", "revoked"]) {
    const { t, developer, groups } = await setup();
    await t.mutation(internal.adminAccess.prepare, { email: "developer@example.com", chamaIds: groups });
    if (state === "revoked") {
      await t.mutation(internal.adminAccess.revokePending, { email: "developer@example.com" });
    } else {
      await t.run(async ctx => {
        const grant = await ctx.db.query("adminAccessGrants").first();
        await ctx.db.patch(grant!._id, { expiresAt: Date.now() - 1 });
      });
    }
    await t.run(ctx => ctx.db.patch(developer, { emailVerificationTime: Date.now() }));
    expect(await t.run(ctx => activateAdminAccess(ctx, developer))).toBe(0);
  }
});

test("existing verified accounts activate immediately and inactive memberships stay revoked", async () => {
  const { t, developer, groups } = await setup();
  await t.run(ctx => ctx.db.patch(developer, { emailVerificationTime: Date.now() }));
  const prepared = await t.mutation(internal.adminAccess.prepare, { email: "developer@example.com", chamaIds: groups });
  expect(prepared.activatedGroups).toBe(2);
  await t.run(async ctx => {
    const member = await ctx.db.query("members").withIndex("by_user", q => q.eq("userId", developer)).first();
    await ctx.db.patch(member!._id, { isActive: false });
  });
  await expect(t.mutation(internal.adminAccess.prepare, { email: "developer@example.com", chamaIds: groups })).rejects.toThrow("INACTIVE_MEMBERSHIP_REQUIRES_EXPLICIT_REACTIVATION");
});

test("developer account setup hashes the generated credential and still requires verification", async () => {
  const { t, groups } = await setup();
  const result = await t.action(internal.adminAccess.createDeveloperAccount, {
    email: "new-developer@example.com", chamaIds: groups,
  });
  expect(result.password.length).toBeGreaterThanOrEqual(32);
  expect(result.emailVerificationRequired).toBe(true);
  const stored = await t.run(async ctx => {
    const user = await ctx.db.query("users").withIndex("email", q => q.eq("email", "new-developer@example.com")).unique();
    const account = await ctx.db.query("authAccounts").withIndex("providerAndAccountId", q => q.eq("provider", "password").eq("providerAccountId", "new-developer@example.com")).unique();
    return { user, secret: account?.secret };
  });
  expect(stored.user?.emailVerificationTime).toBeUndefined();
  expect(stored.secret).toBeTruthy();
  expect(stored.secret).not.toBe(result.password);
  expect(await t.run(ctx => activateAdminAccess(ctx, stored.user!._id))).toBe(0);
});
