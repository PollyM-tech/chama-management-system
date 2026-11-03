import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  chamas: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    contributionAmount: v.number(),
    contributionCycle: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
    ),
    totalPool: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    isActive: v.boolean(),
    interestRate: v.optional(v.number()),
    lateFee: v.optional(v.number()),
    loanTermMonths: v.optional(v.number()),
    rules: v.optional(v.string()),
  }),

  members: defineTable({
    chamaId: v.id("chamas"),
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("chairperson"),
      v.literal("treasurer"),
      v.literal("secretary"),
      v.literal("member"),
    ),
    joinedAt: v.number(),
    isActive: v.boolean(),
    nationalId: v.optional(v.string()),
    mpesaNumber: v.optional(v.string()),
  })
    .index("by_chama", ["chamaId"])
    .index("by_user", ["userId"])
    .index("by_chama_user", ["chamaId", "userId"])
    .index("by_email", ["email"]),

  cycles: defineTable({
    chamaId: v.id("chamas"),
    name: v.string(),
    startDate: v.number(),
    dueDate: v.number(),
    contributionAmount: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("pending"),
    ),
  }).index("by_chama", ["chamaId"]),

  contributions: defineTable({
    chamaId: v.id("chamas"),
    cycleId: v.id("cycles"),
    memberId: v.id("members"),
    amount: v.number(),
    paidAt: v.optional(v.number()),
    dueDate: v.number(),
    status: v.union(
      v.literal("paid"),
      v.literal("pending"),
      v.literal("overdue"),
      v.literal("waived"),
    ),
    paymentMethod: v.optional(
      v.union(v.literal("mpesa"), v.literal("bank"), v.literal("cash")),
    ),
    mpesaTransactionId: v.optional(v.string()),
    recordedBy: v.string(),
    notes: v.optional(v.string()),
    expectedAmount: v.optional(v.number()),
  })
    .index("by_chama", ["chamaId"])
    .index("by_member", ["memberId"])
    .index("by_cycle", ["cycleId"])
    .index("by_member_cycle", ["memberId", "cycleId"]),

  loans: defineTable({
    chamaId: v.id("chamas"),
    memberId: v.id("members"),
    principalAmount: v.number(),
    interestRate: v.number(),
    totalRepayable: v.number(),
    amountRepaid: v.number(),
    disbursedAt: v.optional(v.number()),
    dueDate: v.number(),
    purpose: v.string(),
    status: v.union(
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("disbursed"),
      v.literal("active"),
      v.literal("repaid"),
      v.literal("defaulted"),
      v.literal("rejected"),
    ),
    approvedBy: v.optional(v.string()),
    rejectedReason: v.optional(v.string()),
    guarantors: v.optional(v.array(v.id("members"))),
    termMonths: v.optional(v.number()),
  })
    .index("by_chama", ["chamaId"])
    .index("by_member", ["memberId"])
    .index("by_status", ["status"]),

  loanRepayments: defineTable({
    loanId: v.id("loans"),
    memberId: v.id("members"),
    amount: v.number(),
    paidAt: v.number(),
    paymentMethod: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("cash"),
    ),
    mpesaTransactionId: v.optional(v.string()),
    recordedBy: v.string(),
  })
    .index("by_loan", ["loanId"])
    .index("by_member", ["memberId"]),

  transactions: defineTable({
    chamaId: v.id("chamas"),
    type: v.union(
      v.literal("contribution"),
      v.literal("loan_disbursement"),
      v.literal("loan_repayment"),
      v.literal("investment"),
      v.literal("withdrawal"),
      v.literal("penalty"),
      v.literal("interest_earned"),
    ),
    amount: v.number(),
    direction: v.union(v.literal("credit"), v.literal("debit")),
    referenceId: v.optional(v.string()),
    description: v.string(),
    performedBy: v.string(),
    createdAt: v.number(),
    balance: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
  })
    .index("by_chama", ["chamaId"])
    .index("by_chama_reference", ["chamaId", "paymentReference"])
    .index("by_chama_date", ["chamaId", "createdAt"]),

  investments: defineTable({
    chamaId: v.id("chamas"),
    name: v.string(),
    type: v.union(
      v.literal("tbill"),
      v.literal("mmf"),
      v.literal("sacco"),
      v.literal("real_estate"),
      v.literal("stocks"),
      v.literal("other"),
    ),
    principalAmount: v.number(),
    currentValue: v.number(),
    returnRate: v.number(),
    startDate: v.number(),
    maturityDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("matured"),
      v.literal("withdrawn"),
    ),
    notes: v.optional(v.string()),
  }).index("by_chama", ["chamaId"]),

  notifications: defineTable({
    chamaId: v.id("chamas"),
    memberId: v.id("members"),
    type: v.union(
      v.literal("contribution_due"),
      v.literal("contribution_overdue"),
      v.literal("loan_approved"),
      v.literal("loan_due"),
      v.literal("meeting_reminder"),
      v.literal("general"),
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
    referenceKey: v.optional(v.string()),
  })
    .index("by_member", ["memberId"])
    .index("by_member_unread", ["memberId", "isRead"]),
  contributionPayments: defineTable({
    chamaId: v.id("chamas"),
    memberId: v.id("members"),
    cycleId: v.id("cycles"),
    amount: v.number(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
    recordedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_chama", ["chamaId"]),
  invitations: defineTable({
    chamaId: v.id("chamas"),
    token: v.string(),
    email: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
    ),
    acceptedBy: v.optional(v.id("users")),
    channel: v.union(v.literal("email"), v.literal("whatsapp")),
  })
    .index("by_token", ["token"])
    .index("by_chama", ["chamaId"]),
  expenses: defineTable({
    chamaId: v.id("chamas"),
    description: v.string(),
    category: v.string(),
    amount: v.number(),
    recordedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_chama", ["chamaId"]),
  reconciliations: defineTable({
    chamaId: v.id("chamas"),
    ledgerBalance: v.number(),
    actualBalance: v.number(),
    difference: v.number(),
    notes: v.string(),
    recordedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_chama", ["chamaId"]),
  polls: defineTable({
    chamaId: v.id("chamas"),
    question: v.string(),
    options: v.array(v.string()),
    endsAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_chama", ["chamaId"]),
  votes: defineTable({
    pollId: v.id("polls"),
    memberId: v.id("members"),
    choice: v.number(),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_member", ["pollId", "memberId"]),
  dividends: defineTable({
    chamaId: v.id("chamas"),
    investmentId: v.id("investments"),
    memberId: v.id("members"),
    amount: v.number(),
    recordedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_chama", ["chamaId"])
    .index("by_investment", ["investmentId"]),
  auditEvents: defineTable({
    chamaId: v.id("chamas"),
    actorId: v.id("users"),
    actorName: v.string(),
    action: v.string(),
    createdAt: v.number(),
  }).index("by_chama", ["chamaId"]),
});
