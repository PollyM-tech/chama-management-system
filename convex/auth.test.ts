/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const admin = await ctx.db.insert("users", {
      email: "admin@example.com",
      name: "Admin",
      emailVerificationTime: Date.now(),
    });
    const member = await ctx.db.insert("users", {
      email: "member@example.com",
      emailVerificationTime: Date.now(),
    });
    const outsider = await ctx.db.insert("users", {
      email: "outsider@example.com",
      emailVerificationTime: Date.now(),
    });
    const unverified = await ctx.db.insert("users", {
      email: "unverified@example.com",
    });
    const sessions = await Promise.all(
      [admin, member, outsider, unverified].map((userId) =>
        ctx.db.insert("authSessions", {
          userId,
          expirationTime: Date.now() + 60_000,
        }),
      ),
    );
    const chama = await ctx.db.insert("chamas", {
      name: "Group A",
      contributionAmount: 1000,
      contributionCycle: "monthly",
      totalPool: 0,
      createdBy: admin,
      createdAt: Date.now(),
      isActive: true,
    });
    const otherChama = await ctx.db.insert("chamas", {
      name: "Group B",
      contributionAmount: 1000,
      contributionCycle: "monthly",
      totalPool: 0,
      createdBy: outsider,
      createdAt: Date.now(),
      isActive: true,
    });
    const adminMember = await ctx.db.insert("members", {
      chamaId: chama,
      userId: admin,
      name: "Admin",
      email: "admin@example.com",
      phone: "",
      role: "admin",
      joinedAt: Date.now(),
      isActive: true,
    });
    const regularMember = await ctx.db.insert("members", {
      chamaId: chama,
      userId: member,
      name: "Member",
      email: "member@example.com",
      phone: "",
      role: "member",
      joinedAt: Date.now(),
      isActive: true,
    });
    return {
      admin,
      member,
      outsider,
      unverified,
      sessions,
      chama,
      otherChama,
      adminMember,
      regularMember,
    };
  });
  return {
    t,
    ids,
    admin: t.withIdentity({ subject: `${ids.admin}|${ids.sessions[0]}` }),
    member: t.withIdentity({ subject: `${ids.member}|${ids.sessions[1]}` }),
    outsider: t.withIdentity({ subject: `${ids.outsider}|${ids.sessions[2]}` }),
    unverified: t.withIdentity({
      subject: `${ids.unverified}|${ids.sessions[3]}`,
    }),
  };
}

describe("backend authentication and authorization", () => {
  test("group dashboard uses only authorized group records and paid contributions", async () => {
    const { t, admin, ids } = await fixture();
    await t.run(async (ctx) => {
      const cycleId = await ctx.db.insert("cycles", {
        chamaId: ids.chama,
        name: "Current cycle",
        startDate: 1,
        dueDate: 2,
        contributionAmount: 1000,
        status: "open",
      });
      for (const status of ["paid", "pending"] as const)
        await ctx.db.insert("contributions", {
          chamaId: ids.chama,
          cycleId,
          memberId: ids.regularMember,
          amount: 1000,
          dueDate: 2,
          status,
          recordedBy: ids.admin,
        });
      await ctx.db.insert("transactions", {
        chamaId: ids.chama,
        type: "contribution",
        amount: 1000,
        direction: "credit",
        description: "Our group payment",
        performedBy: ids.admin,
        createdAt: 2,
        balance: 1000,
      });
      await ctx.db.insert("transactions", {
        chamaId: ids.otherChama,
        type: "contribution",
        amount: 9000,
        direction: "credit",
        description: "Another group payment",
        performedBy: ids.outsider,
        createdAt: 3,
        balance: 9000,
      });
    });
    const dashboard = await admin.query(api.chamas.dashboard, {
      chamaId: ids.chama,
    });
    expect(dashboard.chama.name).toBe("Group A");
    expect(dashboard.role).toBe("admin");
    expect(dashboard.memberCount).toBe(2);
    expect(dashboard.contributionsTotal).toBe(1000);
    expect(dashboard.recentActivity.map((item) => item.description)).toEqual([
      "Our group payment",
    ]);
  });

  test("group dashboards reject anonymous users, nonmembers, and invalid IDs", async () => {
    const { t, outsider, admin, ids } = await fixture();
    await expect(
      t.query(api.chamas.dashboard, { chamaId: ids.chama }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      outsider.query(api.chamas.dashboard, { chamaId: ids.chama }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      admin.query(api.chamas.dashboard, { chamaId: "not-a-group-id" }),
    ).rejects.toThrow("FORBIDDEN");
  });
  test("rejects unauthenticated queries and mutations", async () => {
    const { t, ids } = await fixture();
    await expect(t.query(api.users.current, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t.query(api.members.list, { chamaId: ids.chama }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t.mutation(api.chamas.create, {
        name: "Stolen",
        contributionAmount: 10,
        contributionCycle: "monthly",
      }),
    ).rejects.toThrow("UNAUTHENTICATED");
  });

  test("requires verified email even for an otherwise valid session", async () => {
    const { unverified } = await fixture();
    await expect(unverified.query(api.users.current, {})).rejects.toThrow(
      "EMAIL_NOT_VERIFIED",
    );
    expect(await unverified.query(api.auth.isAuthenticated, {})).toBe(false);
  });

  test("blocks cross-chama reads and writes, including admins of another chama", async () => {
    const { admin, outsider, ids } = await fixture();
    await expect(
      admin.query(api.chamas.get, { chamaId: ids.otherChama }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      outsider.query(api.chamas.get, { chamaId: ids.chama }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      admin.mutation(api.members.add, {
        chamaId: ids.otherChama,
        email: "member@example.com",
        role: "admin",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      outsider.mutation(api.members.updateAccess, {
        memberId: ids.regularMember,
        role: "admin",
        isActive: true,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  test("members can read their chama but cannot list sensitive profiles or promote themselves", async () => {
    const { member, ids } = await fixture();
    expect(
      (await member.query(api.chamas.get, { chamaId: ids.chama })).name,
    ).toBe("Group A");
    await expect(
      member.query(api.members.list, { chamaId: ids.chama }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      member.mutation(api.members.updateAccess, {
        memberId: ids.regularMember,
        role: "admin",
        isActive: true,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      member.mutation(api.members.add, {
        chamaId: ids.chama,
        email: "outsider@example.com",
        role: "admin",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  test("admins manage verified memberships, prevent duplicates and preserve a last admin", async () => {
    const { admin, ids } = await fixture();
    const added = await admin.mutation(api.members.add, {
      chamaId: ids.chama,
      email: " OUTSIDER@EXAMPLE.COM ",
      role: "treasurer",
    });
    expect(added).toBeTruthy();
    await expect(
      admin.mutation(api.members.add, {
        chamaId: ids.chama,
        email: "outsider@example.com",
        role: "member",
      }),
    ).rejects.toThrow("MEMBERSHIP_ALREADY_EXISTS");
    await expect(
      admin.mutation(api.members.add, {
        chamaId: ids.chama,
        email: "unverified@example.com",
        role: "member",
      }),
    ).rejects.toThrow("VERIFIED_USER_REQUIRED");
    await expect(
      admin.mutation(api.members.updateAccess, {
        memberId: ids.adminMember,
        role: "member",
        isActive: true,
      }),
    ).rejects.toThrow("LAST_ADMIN_REQUIRED");
    await expect(
      admin.mutation(api.members.updateAccess, {
        memberId: ids.adminMember,
        role: "admin",
        isActive: false,
      }),
    ).rejects.toThrow("LAST_ADMIN_REQUIRED");
  });

  test("role changes and deactivation take effect on subsequent requests", async () => {
    const { admin, member, ids } = await fixture();
    await admin.mutation(api.members.updateAccess, {
      memberId: ids.regularMember,
      role: "treasurer",
      isActive: true,
    });
    expect(
      await member.query(api.members.list, { chamaId: ids.chama }),
    ).toHaveLength(2);
    await admin.mutation(api.members.updateAccess, {
      memberId: ids.regularMember,
      role: "member",
      isActive: false,
    });
    await expect(
      member.query(api.chamas.get, { chamaId: ids.chama }),
    ).rejects.toThrow("FORBIDDEN");
    expect(await member.query(api.chamas.listMine, {})).toEqual([]);
  });

  test("revoked, expired and mismatched sessions are rejected with an issued identity", async () => {
    const { t, admin, member, ids } = await fixture();
    await t.run(async (ctx) => {
      await ctx.db.delete(ids.sessions[0]);
      await ctx.db.patch(ids.sessions[1], { expirationTime: Date.now() - 1 });
    });
    await expect(admin.query(api.users.current, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(member.query(api.users.current, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    const mismatch = t.withIdentity({
      subject: `${ids.admin}|${ids.sessions[2]}`,
    });
    await expect(mismatch.query(api.users.current, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    expect(await admin.query(api.auth.isAuthenticated, {})).toBe(false);
  });

  test("creating a chama grants admin only in the new group", async () => {
    const { outsider, ids } = await fixture();
    const chamaId = await outsider.mutation(api.chamas.create, {
      name: "New Group",
      contributionAmount: 500,
      contributionCycle: "weekly",
    });
    expect(
      (await outsider.query(api.chamas.listMine, {})).map((c) => ({
        name: c.name,
        role: c.role,
      })),
    ).toEqual([{ name: "New Group", role: "admin" }]);
    expect(await outsider.query(api.members.list, { chamaId })).toHaveLength(1);
    await expect(
      outsider.query(api.chamas.get, { chamaId: ids.chama }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
