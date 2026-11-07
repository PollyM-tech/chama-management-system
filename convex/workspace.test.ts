/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const users = await Promise.all(
      [
        "admin",
        "treasurer",
        "secretary",
        "member",
        "candidate",
        "outsider",
      ].map((name) =>
        ctx.db.insert("users", {
          name,
          email: `${name}@example.com`,
          emailVerificationTime: Date.now(),
        }),
      ),
    );
    const sessions = await Promise.all(
      users.map((userId) =>
        ctx.db.insert("authSessions", {
          userId,
          expirationTime: Date.now() + 3600000,
        }),
      ),
    );
    const chamaId = await ctx.db.insert("chamas", {
      name: "Pamoja",
      createdBy: users[0],
      createdAt: Date.now(),
      isActive: true,
      totalPool: 0,
      contributionAmount: 10000,
      contributionCycle: "monthly",
      interestRate: 1,
    });
    const memberIds = [];
    for (let i = 0; i < 4; i++)
      memberIds.push(
        await ctx.db.insert("members", {
          chamaId,
          userId: users[i],
          name: ["Admin", "Treasurer", "Secretary", "Member"][i],
          email: `${["admin", "treasurer", "secretary", "member"][i]}@example.com`,
          phone: "",
          role: (["admin", "treasurer", "secretary", "member"] as const)[i],
          isActive: true,
          joinedAt: Date.now(),
        }),
      );
    const otherChama = await ctx.db.insert("chamas", {
      name: "Other",
      createdBy: users[5],
      createdAt: Date.now(),
      isActive: true,
      totalPool: 5000,
      contributionAmount: 1000,
      contributionCycle: "monthly",
    });
    return { users, sessions, chamaId, memberIds, otherChama };
  });
  const clients = ids.users.map((user, i) =>
    t.withIdentity({ subject: `${user}|${ids.sessions[i]}` }),
  );
  return {
    t,
    ids,
    admin: clients[0],
    treasurer: clients[1],
    secretary: clients[2],
    member: clients[3],
    candidate: clients[4],
    outsider: clients[5],
  };
}
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("partial contributions update obligations and the ledger atomically; duplicate references roll back", async () => {
  const { ids, admin, treasurer, member } = await setup();
  await admin.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "create_cycle",
    input: { name: "November", amount: 10000, dueDate: Date.now() + 86400000 },
  });
  const cycle = (await admin.query(api.workspace.get, { chamaId: ids.chamaId }))
    .cycles[0];
  const record = (amount: number, reference: string) =>
    treasurer.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "record_contribution",
      input: {
        memberId: ids.memberIds[3],
        cycleId: cycle._id,
        amount,
        method: "mpesa",
        reference,
      },
    });
  await record(2500, "PAYMENT-ONE");
  let state = await member.query(api.workspace.get, { chamaId: ids.chamaId });
  expect(state.chama.totalPool).toBe(2500);
  expect(state.contributions[0].paid).toBe(2500);
  expect(state.contributions[0].status).toBe("pending");
  expect(state.stats.collected).toBe(2500);
  expect(state.contributions).toHaveLength(1);
  await expect(record(2500, "PAYMENT-ONE")).rejects.toThrow(
    "PAYMENT_REFERENCE_ALREADY_RECORDED",
  );
  expect(
    (await admin.query(api.workspace.get, { chamaId: ids.chamaId })).chama
      .totalPool,
  ).toBe(2500);
  await record(7500, "PAYMENT-TWO");
  state = await member.query(api.workspace.get, { chamaId: ids.chamaId });
  expect(state.contributions[0].status).toBe("paid");
  expect(state.chama.totalPool).toBe(10000);
  await expect(record(1, "EXCESS")).rejects.toThrow(
    "PAYMENT_EXCEEDS_AMOUNT_DUE",
  );
});

test("ordinary members cannot record money or change rules and outsiders cannot read or write group records", async () => {
  const { ids, member, outsider } = await setup();
  await expect(
    member.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "record_expense",
      input: {
        description: "Bus",
        category: "Travel",
        amount: 100,
        method: "cash",
      },
    }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    member.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "update_settings",
      input: {},
    }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    outsider.query(api.workspace.get, { chamaId: ids.chamaId }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    outsider.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "create_cycle",
      input: {},
    }),
  ).rejects.toThrow("FORBIDDEN");
});

test("loan lifecycle enforces approval, available funds, repayment limits, and self-approval protection", async () => {
  const { t, ids, admin, treasurer, member } = await setup();
  await t.run(async (ctx) => {
    await ctx.db.patch(ids.chamaId, { totalPool: 10000 });
  });
  await member.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "apply_loan",
    input: { amount: 5000, months: 2, purpose: "Business stock" },
  });
  const loan = (await member.query(api.workspace.get, { chamaId: ids.chamaId }))
    .loans[0];
  expect(loan.totalRepayable).toBe(5100);
  await expect(
    treasurer.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "disburse_loan",
      input: { id: loan._id },
    }),
  ).rejects.toThrow("LOAN_NOT_APPROVED");
  await admin.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "approve_loan",
    input: { id: loan._id },
  });
  await treasurer.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "disburse_loan",
    input: { id: loan._id },
  });
  expect(
    (await admin.query(api.workspace.get, { chamaId: ids.chamaId })).chama
      .totalPool,
  ).toBe(5000);
  await expect(
    treasurer.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "repay_loan",
      input: { id: loan._id, amount: 5200, method: "cash" },
    }),
  ).rejects.toThrow("REPAYMENT_EXCEEDS_BALANCE");
  await treasurer.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "repay_loan",
    input: { id: loan._id, amount: 5100, method: "cash" },
  });
  const final = await member.query(api.workspace.get, { chamaId: ids.chamaId });
  expect(final.loans[0].status).toBe("repaid");
  expect(final.chama.totalPool).toBe(10100);
  await admin.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "apply_loan",
    input: { amount: 1000, months: 1, purpose: "Personal" },
  });
  const own = (
    await admin.query(api.workspace.get, { chamaId: ids.chamaId })
  ).loans.find((l) => l.memberId === ids.memberIds[0])!;
  await expect(
    admin.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "approve_loan",
      input: { id: own._id },
    }),
  ).rejects.toThrow("ANOTHER_CHAIRPERSON_MUST_REVIEW_YOUR_LOAN");
});

test("expenses cannot overdraw; reconciliations record differences without altering balances", async () => {
  const { t, ids, treasurer } = await setup();
  await t.run((ctx) => ctx.db.patch(ids.chamaId, { totalPool: 500 }));
  await expect(
    treasurer.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "record_expense",
      input: {
        description: "Transport",
        category: "Travel",
        amount: 600,
        method: "cash",
      },
    }),
  ).rejects.toThrow("INSUFFICIENT_GROUP_FUNDS");
  await treasurer.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "reconcile",
    input: { amount: 450, notes: "Bank statement check" },
  });
  const state = await treasurer.query(api.workspace.get, {
    chamaId: ids.chamaId,
  });
  expect(state.expenses).toHaveLength(0);
  expect(state.chama.totalPool).toBe(500);
  expect(state.reconciliations[0].difference).toBe(-50);
});

test("polls prevent duplicate and expired votes and reveal only aggregated results", async () => {
  const { t, ids, secretary, member } = await setup();
  await secretary.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "create_poll",
    input: {
      question: "Meeting day?",
      options: "Saturday\nSunday",
      endsAt: Date.now() + 86400000,
    },
  });
  const poll = (await member.query(api.workspace.get, { chamaId: ids.chamaId }))
    .polls[0];
  await member.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "vote",
    input: { id: poll._id, choice: 1 },
  });
  await expect(
    member.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "vote",
      input: { id: poll._id, choice: 0 },
    }),
  ).rejects.toThrow("ALREADY_VOTED");
  expect(
    (await member.query(api.workspace.get, { chamaId: ids.chamaId })).polls[0]
      .counts,
  ).toEqual([0, 1]);
  await t.run((ctx) => ctx.db.patch(poll._id, { endsAt: Date.now() - 1 }));
  await expect(
    secretary.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "vote",
      input: { id: poll._id, choice: 0 },
    }),
  ).rejects.toThrow("POLL_CLOSED_OR_INVALID_CHOICE");
});

test("investment proceeds and dividends preserve cash and restrict payouts to realized profit", async () => {
  const { t, ids, admin, treasurer } = await setup();
  await t.run((ctx) => ctx.db.patch(ids.chamaId, { totalPool: 10000 }));
  await admin.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "add_investment",
    input: { name: "Fund", type: "mmf", amount: 5000, returnRate: 10 },
  });
  const investment = (
    await admin.query(api.workspace.get, { chamaId: ids.chamaId })
  ).investments[0];
  await expect(
    admin.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "record_dividends",
      input: { id: investment._id, amount: 100 },
    }),
  ).rejects.toThrow("REALIZE_INVESTMENT_FIRST");
  await treasurer.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "value_investment",
    input: { id: investment._id, amount: 5500 },
  });
  await treasurer.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "close_investment",
    input: { id: investment._id },
  });
  await expect(
    admin.mutation(api.workspace.execute, {
      chamaId: ids.chamaId,
      operation: "record_dividends",
      input: { id: investment._id, amount: 501 },
    }),
  ).rejects.toThrow("DIVIDENDS_EXCEED_REALIZED_PROFIT");
  await admin.mutation(api.workspace.execute, {
    chamaId: ids.chamaId,
    operation: "record_dividends",
    input: { id: investment._id, amount: 500 },
  });
  const state = await admin.query(api.workspace.get, { chamaId: ids.chamaId });
  expect(state.chama.totalPool).toBe(10000);
  expect(state.dividends.reduce((s, d) => s + d.amount, 0)).toBe(500);
  expect(state.dividends).toHaveLength(4);
});

test("officers can create email-bound or WhatsApp invitations; ordinary members cannot", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  const { ids, secretary, treasurer, member } = await setup();
  const one = await secretary.action(api.invitations.create, {
    chamaId: ids.chamaId,
    channel: "whatsapp",
    phone: "+254712345678",
    email: "candidate@example.com",
  });
  expect(one.url).toMatch(/^https:\/\/smartchama.example\/join\/[a-f0-9]{64}$/);
  const two = await treasurer.action(api.invitations.create, {
    chamaId: ids.chamaId,
    channel: "whatsapp",
    phone: "+254712345678",
  });
  expect(two.url).not.toBe(one.url);
  await expect(
    member.action(api.invitations.create, {
      chamaId: ids.chamaId,
      channel: "whatsapp",
    phone: "+254712345678",
    }),
  ).rejects.toThrow("FORBIDDEN");
});

test("WhatsApp invitations work without email configuration or a recipient email", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  vi.stubEnv("AUTH_RESEND_KEY", "");
  vi.stubEnv("AUTH_EMAIL_FROM", "");
  const delivery = vi.fn();
  vi.stubGlobal("fetch", delivery);
  const { ids, secretary, candidate } = await setup();
  const result = await secretary.action(api.invitations.create, {
    chamaId: ids.chamaId,
    channel: "whatsapp",
    phone: "+254712345678",
  });
  expect(result.emailSent).toBe(false);
  expect(result.emailError).toBeNull();
  expect(delivery).not.toHaveBeenCalled();
  const token = result.url.split("/").at(-1)!;
  expect(await candidate.query(api.invitations.preview, { token })).toMatchObject({
    emailRestricted: false,
  });
  expect(await candidate.mutation(api.invitations.accept, { token, name: "Candidate Member", phone: "0712345678" })).toBe(ids.chamaId);
});

test("invitation acceptance requires the invited email, grants only member access, and cannot be reused by someone else", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  const { ids, secretary, candidate, outsider } = await setup();
  const { url } = await secretary.action(api.invitations.create, {
    chamaId: ids.chamaId,
    channel: "email",
    email: "candidate@example.com",
  });
  const token = url.split("/").pop()!;
  await expect(
    outsider.mutation(api.invitations.accept, { token, name: "Candidate Member", phone: "0712345678" }),
  ).rejects.toThrow("SIGN_IN_WITH_THE_INVITED_EMAIL");
  expect(await candidate.mutation(api.invitations.accept, { token, name: "Candidate Member", phone: "0712345678" })).toBe(
    ids.chamaId,
  );
  expect(
    (await candidate.query(api.workspace.get, { chamaId: ids.chamaId })).member
      .role,
  ).toBe("member");
  await expect(candidate.mutation(api.invitations.accept, { token, name: "Candidate Member", phone: "0712345678" })).rejects.toThrow("INVITATION_ALREADY_USED");
  await expect(
    outsider.mutation(api.invitations.accept, { token, name: "Candidate Member", phone: "0712345678" }),
  ).rejects.toThrow("INVITATION_ALREADY_USED");
});

test("expired and revoked invitation links cannot create memberships", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  const { t, ids, secretary, candidate } = await setup();
  for (const status of ["expired", "revoked"]) {
    const { url } = await secretary.action(api.invitations.create, {
      chamaId: ids.chamaId,
      channel: "whatsapp",
    phone: "+254712345678",
    });
    const token = url.split("/").pop()!;
    await t.run(async (ctx) => {
      const invite = await ctx.db
        .query("invitations")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
      await ctx.db.patch(
        invite!._id,
        status === "expired" ? { expiresAt: 1 } : { status: "revoked" },
      );
    });
    expect(
      await candidate.query(api.invitations.preview, { token }),
    ).toBeNull();
    await expect(
      candidate.mutation(api.invitations.accept, { token, name: "Candidate Member", phone: "0712345678" }),
    ).rejects.toThrow("INVITATION_INVALID_OR_EXPIRED");
  }
});

test("email invitations send a single-use join link and retain a shareable fallback if delivery fails", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
  vi.stubEnv("AUTH_EMAIL_FROM", "SmartChama <auth@example.com>");
  const { ids, secretary } = await setup();
  const send = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(JSON.stringify({ id: "test" }), { status: 200 }),
    );
  const result = await secretary.action(api.invitations.create, {
    chamaId: ids.chamaId,
    channel: "email",
    email: "candidate@example.com",
  });
  expect(result.emailSent).toBe(true);
  const request = JSON.parse(String(send.mock.calls[0][1]?.body));
  expect(request.to).toEqual(["candidate@example.com"]);
  expect(request.text).toContain(result.url);
  expect(request.text).toContain("7 days");
  send.mockResolvedValue(new Response("Sender not verified", { status: 403 }));
  const fallback = await secretary.action(api.invitations.create, {
    chamaId: ids.chamaId,
    channel: "email",
    email: "candidate@example.com",
  });
  expect(fallback.emailSent).toBe(false);
  expect(fallback.emailError).toContain("could not be delivered");
  expect(fallback.url).toContain("/join/");
});

test("inviter-assigned roles and completed details are enforced by the backend", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  const { ids, admin, secretary, candidate } = await setup();
  await expect(secretary.action(api.invitations.create, {
    chamaId: ids.chamaId, channel: "whatsapp", phone: "0712345678", role: "treasurer",
  })).rejects.toThrow("ONLY_CHAIRPERSON_CAN_ASSIGN_OFFICER_ROLES");
  const { url } = await admin.action(api.invitations.create, {
    chamaId: ids.chamaId, channel: "whatsapp", phone: "0712345678", role: "treasurer",
  });
  const token = url.split("/").at(-1)!;
  expect(await candidate.query(api.invitations.preview, { token })).toMatchObject({ role: "treasurer", phoneHint: "••••5678" });
  await expect(candidate.mutation(api.invitations.accept, { token, name: "Candidate", phone: "+254711111111" })).rejects.toThrow("USE_THE_INVITED_PHONE_NUMBER");
  await expect(candidate.mutation(api.invitations.accept, { token, name: " ", phone: "0712345678" })).rejects.toThrow();
  await candidate.mutation(api.invitations.accept, { token, name: "Candidate Full Name", phone: "0712345678" });
  const state = await candidate.query(api.workspace.get, { chamaId: ids.chamaId });
  expect(state.member).toMatchObject({ role: "treasurer", name: "Candidate Full Name", phone: "+254712345678", email: "candidate@example.com" });
  expect(await candidate.query(api.invitations.preview, { token })).toBeNull();
});

test("a single-use WhatsApp link cannot add two users even with concurrent acceptance", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  const { ids, secretary, candidate, outsider } = await setup();
  const { url } = await secretary.action(api.invitations.create, {
    chamaId: ids.chamaId, channel: "whatsapp", phone: "0712345678",
  });
  const token = url.split("/").at(-1)!;
  const outcomes = await Promise.allSettled([candidate, outsider].map(client =>
    client.mutation(api.invitations.accept, { token, name: "Applicant", phone: "0712345678" })
  ));
  expect(outcomes.filter(result => result.status === "fulfilled")).toHaveLength(1);
  expect(outcomes.filter(result => result.status === "rejected")).toHaveLength(1);
});

test("legacy unrestricted links and invitations from inactive officers cannot grant membership", async () => {
  vi.stubEnv("SITE_URL", "https://smartchama.example");
  const { t, ids, secretary, candidate } = await setup();
  const token = "a".repeat(64);
  await t.run(async ctx => {
    await ctx.db.insert("invitations", { chamaId: ids.chamaId, token, channel: "whatsapp", createdBy: ids.users[2], createdAt: Date.now(), expiresAt: Date.now() + 100000, status: "pending" });
  });
  await expect(candidate.mutation(api.invitations.accept, { token, name: "Candidate", phone: "0712345678" })).rejects.toThrow("INVITATION_NEEDS_REISSUE");
  const { url } = await secretary.action(api.invitations.create, { chamaId: ids.chamaId, channel: "whatsapp", phone: "0712345678" });
  await t.run(ctx => ctx.db.patch(ids.memberIds[2], { isActive: false }));
  await expect(candidate.mutation(api.invitations.accept, { token: url.split("/").at(-1)!, name: "Candidate", phone: "0712345678" })).rejects.toThrow("INVITATION_NEEDS_REISSUE");
});
