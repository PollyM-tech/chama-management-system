# Pamoja Chama System
### A modern Chama (Savings Group) Management Platform

Built with **Next.js 15** · **TypeScript** · **Tailwind CSS** · **Convex** · **WorkOS** · **M-Pesa** *(Planned)*

---

## Progress Overview

| Step | Description | Status |
|------|-------------|--------|
| 1 | Prerequisites | ✅ Complete |
| 2 | Project Initialization | ✅ Complete |
| 3 | Project Structure | ✅ Complete |
| 4 | Environment Configuration | ✅ Complete |
| 5 | Convex Database Schema | 🔜 Next |
| 6 | WorkOS Authentication Setup | ⏳ Pending |
| 7 | Convex + WorkOS Integration | ⏳ Pending |
| 8 | Core Backend Functions | ⏳ Pending |
| 9 | Dashboard UI | ⏳ Pending |
| 10 | M-Pesa Integration | ⏳ Pending |

---

## Step 1 — Prerequisites ✅

The development environment was verified before project creation.

### Required Tools

```bash
node --version    # v22.22.2 ✅
npm --version     # v10.9.7  ✅
```

Recommended minimums:
- Node.js v18+
- npm v9+

### External Services

The project will use:

| Service | Purpose |
|---------|---------|
| [Convex](https://convex.dev) | Backend + Database |
| [WorkOS](https://workos.com) | Authentication |
| [Vercel](https://vercel.com) | Deployment |
| [Safaricom Daraja API](https://developer.safaricom.co.ke) | M-Pesa Payments |

---

## Step 2 — Project Initialization ✅

The Next.js application was created using the App Router and TypeScript.

### Create Project

```bash
npx create-next-app@latest chama-system \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd chama-system
```

### Installed Packages

**Core Backend**
```bash
npm install convex
```

**Authentication**
```bash
npm install @workos-inc/authkit-nextjs
npm install @convex-dev/workos
```

**Utility Packages**
```bash
npm install zod date-fns lucide-react clsx tailwind-merge
npm install -D @types/node
```

### Verification

```bash
npm run dev
```

Application successfully runs locally on:
```
http://localhost:3000
```

---

## Step 3 — Project Structure ✅

The application structure was created following a feature-based architecture.

### Dashboard Modules (V1)

```
Dashboard
Members
Contributions
Loans
Finance
Reports
Transactions
Investments
Admin
Notifications
Settings
```

### Authentication Routes

```
src/app/(auth)/
├── callback/
└── sign-in/
```

### Dashboard Routes

```
src/app/(dashboard)/
├── admin/
├── contributions/
│   └── record/
├── dashboard/
├── finance/
├── investments/
├── loans/
│   ├── apply/
│   └── [id]/
├── members/
│   └── [id]/
├── notifications/
├── reports/
├── settings/
└── transactions/
```

### Backend Structure

```
convex/
├── auth.config.ts
├── chamas.ts
├── contributions.ts
├── loans.ts
├── members.ts
├── notifications.ts
├── schema.ts
└── transactions.ts
```

### Components Structure

```
src/components/
├── ui/                        # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── modal.tsx
│   └── data-table.tsx
├── layout/
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   └── page-wrapper.tsx
├── members/
│   ├── member-card.tsx
│   ├── member-form.tsx
│   └── member-table.tsx
├── contributions/
│   ├── contribution-form.tsx
│   ├── contribution-table.tsx
│   └── cycle-progress.tsx
├── loans/
│   ├── loan-application.tsx
│   ├── loan-card.tsx
│   └── repayment-schedule.tsx
└── dashboard/
    ├── metric-card.tsx
    ├── contribution-chart.tsx
    └── recent-transactions.tsx
```

### Lib & Hooks

```
src/lib/
├── convex.ts              # ConvexProvider client setup
├── workos.ts              # WorkOS client singleton
├── mpesa.ts               # M-Pesa Daraja API helpers
├── utils.ts               # cn() helper (clsx + tailwind-merge)
└── formatters.ts          # KSh currency, date formatters

src/hooks/
├── use-chama.ts           # Current chama context hook
├── use-member.ts          # Current member profile hook
└── use-permissions.ts     # Role-based permission checks

src/types/
├── chama.ts               # Shared TypeScript types
└── mpesa.ts               # M-Pesa response types
```

### Features Deferred to V2

The following modules were intentionally removed from V1 scope:

```
Voting & Poll Management
Vote Tracking
Dividends
Expense Management
```

> These will be added after the core financial workflows are stable and tested.

---

## Step 4 — Environment Configuration ✅

### Environment Files Created

```
.env
.env.local
.env.example
```

### Required Variables

```env
# ─── Convex ─────────────────────────────────────────
NEXT_PUBLIC_CONVEX_URL=

# ─── WorkOS ─────────────────────────────────────────
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=

# ─── App ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

### Generate Cookie Password

```bash
openssl rand -base64 32
```

Paste the output into `.env.local`:

```env
WORKOS_COOKIE_PASSWORD=<paste-generated-value-here>
```

> **Note:** `NEXT_PUBLIC_CONVEX_URL` and WorkOS credentials will be filled in during Steps 5 and 6 after the services are configured.

> **Never commit `.env` or `.env.local` to git.** Only `.env.example` (with empty values) should be version-controlled.

---

## Step 5 — Convex Database Schema 🔜

### Initialise Convex

```bash
# Login to Convex (first time only)
npx convex login

# Start Convex dev server — outputs your NEXT_PUBLIC_CONVEX_URL
npx convex dev
```

Add the printed URL to `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Schema — `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ── Chama groups ──────────────────────────────────
  chamas: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    contributionAmount: v.number(),       // KSh per cycle
    contributionCycle: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    totalPool: v.number(),
    createdBy: v.string(),               // WorkOS user ID
    createdAt: v.number(),
    isActive: v.boolean(),
  }),

  // ── Members ───────────────────────────────────────
  members: defineTable({
    chamaId: v.id("chamas"),
    workosUserId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),                   // Format: 254XXXXXXXXX
    role: v.union(
      v.literal("admin"),
      v.literal("treasurer"),
      v.literal("secretary"),
      v.literal("member")
    ),
    joinedAt: v.number(),
    isActive: v.boolean(),
    nationalId: v.optional(v.string()),
    mpesaNumber: v.optional(v.string()),
  })
    .index("by_chama", ["chamaId"])
    .index("by_workos_user", ["workosUserId"])
    .index("by_email", ["email"]),

  // ── Contribution cycles ───────────────────────────
  cycles: defineTable({
    chamaId: v.id("chamas"),
    name: v.string(),                    // e.g. "May 2026"
    startDate: v.number(),
    dueDate: v.number(),
    contributionAmount: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("pending")
    ),
  }).index("by_chama", ["chamaId"]),

  // ── Contributions ─────────────────────────────────
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
      v.literal("waived")
    ),
    paymentMethod: v.optional(v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("cash")
    )),
    mpesaTransactionId: v.optional(v.string()),
    recordedBy: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_chama", ["chamaId"])
    .index("by_member", ["memberId"])
    .index("by_cycle", ["cycleId"])
    .index("by_member_cycle", ["memberId", "cycleId"]),

  // ── Loans ─────────────────────────────────────────
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
      v.literal("rejected")
    ),
    approvedBy: v.optional(v.string()),
    rejectedReason: v.optional(v.string()),
    guarantors: v.optional(v.array(v.id("members"))),
  })
    .index("by_chama", ["chamaId"])
    .index("by_member", ["memberId"])
    .index("by_status", ["status"]),

  // ── Loan repayments ───────────────────────────────
  loanRepayments: defineTable({
    loanId: v.id("loans"),
    memberId: v.id("members"),
    amount: v.number(),
    paidAt: v.number(),
    paymentMethod: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("cash")
    ),
    mpesaTransactionId: v.optional(v.string()),
    recordedBy: v.string(),
  })
    .index("by_loan", ["loanId"])
    .index("by_member", ["memberId"]),

  // ── Transactions (audit log) ──────────────────────
  transactions: defineTable({
    chamaId: v.id("chamas"),
    type: v.union(
      v.literal("contribution"),
      v.literal("loan_disbursement"),
      v.literal("loan_repayment"),
      v.literal("investment"),
      v.literal("withdrawal"),
      v.literal("penalty"),
      v.literal("interest_earned")
    ),
    amount: v.number(),
    direction: v.union(v.literal("credit"), v.literal("debit")),
    referenceId: v.optional(v.string()),
    description: v.string(),
    performedBy: v.string(),
    createdAt: v.number(),
    balance: v.number(),
  })
    .index("by_chama", ["chamaId"])
    .index("by_chama_date", ["chamaId", "createdAt"]),

  // ── Investments ───────────────────────────────────
  investments: defineTable({
    chamaId: v.id("chamas"),
    name: v.string(),
    type: v.union(
      v.literal("tbill"),
      v.literal("mmf"),
      v.literal("sacco"),
      v.literal("real_estate"),
      v.literal("stocks"),
      v.literal("other")
    ),
    principalAmount: v.number(),
    currentValue: v.number(),
    returnRate: v.number(),
    startDate: v.number(),
    maturityDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("matured"),
      v.literal("withdrawn")
    ),
    notes: v.optional(v.string()),
  }).index("by_chama", ["chamaId"]),

  // ── Notifications ─────────────────────────────────
  notifications: defineTable({
    chamaId: v.id("chamas"),
    memberId: v.id("members"),
    type: v.union(
      v.literal("contribution_due"),
      v.literal("contribution_overdue"),
      v.literal("loan_approved"),
      v.literal("loan_due"),
      v.literal("meeting_reminder"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_member_unread", ["memberId", "isRead"]),
});
```

---

## Step 6 — WorkOS Authentication Setup ⏳

### WorkOS Dashboard

1. Go to [dashboard.workos.com](https://dashboard.workos.com)
2. Create a new application → name it **Pamoja Chama**
3. Under **Redirects**, add: `http://localhost:3000/callback`
4. Under **Authentication**, enable **Google OAuth**
5. Enable **MFA** for admin and treasurer roles
6. Copy your **Client ID** and **API Key** into `.env.local`

### Middleware — `middleware.ts`

```typescript
import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/sign-in"],
  },
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Sign-in Page — `src/app/(auth)/sign-in/page.tsx`

```typescript
import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
}
```

### Callback Handler — `src/app/(auth)/callback/route.ts`

```typescript
import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth({
  returnPathname: "/dashboard",
});
```

---

## Step 7 — Convex + WorkOS Integration ⏳

### Auth Config — `convex/auth.config.ts`

```typescript
export default {
  providers: [
    {
      domain: "https://api.workos.com",
      applicationID: process.env.WORKOS_CLIENT_ID!,
    },
  ],
};
```

### Convex Provider — `src/lib/convex.ts`

```typescript
"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuthFromWorkOS() {
  const { user, getAccessToken } = useAuth();
  return {
    isLoading: user === undefined,
    isAuthenticated: !!user,
    fetchAccessToken: async () => getAccessToken(),
  };
}

export function ConvexWithWorkOS({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromWorkOS}>
      {children}
    </ConvexProviderWithAuth>
  );
}
```

### Root Layout — `src/app/layout.tsx`

```typescript
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { ConvexWithWorkOS } from "@/lib/convex";
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>
          <ConvexWithWorkOS>
            {children}
          </ConvexWithWorkOS>
        </AuthKitProvider>
      </body>
    </html>
  );
}
```

---

## Step 8 — Core Backend Functions ⏳

### Members — `convex/members.ts`

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByChama = query({
  args: { chamaId: v.id("chamas") },
  handler: async (ctx, { chamaId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return ctx.db
      .query("members")
      .withIndex("by_chama", (q) => q.eq("chamaId", chamaId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addMember = mutation({
  args: {
    chamaId: v.id("chamas"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("treasurer"),
      v.literal("secretary"),
      v.literal("member")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return ctx.db.insert("members", {
      ...args,
      workosUserId: identity.subject,
      joinedAt: Date.now(),
      isActive: true,
    });
  },
});
```

### Contributions — `convex/contributions.ts`

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCycleContributions = query({
  args: {
    chamaId: v.id("chamas"),
    cycleId: v.id("cycles"),
  },
  handler: async (ctx, { chamaId, cycleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
      .collect();
    return Promise.all(
      contributions.map(async (c) => {
        const member = await ctx.db.get(c.memberId);
        return { ...c, memberName: member?.name };
      })
    );
  },
});

export const recordContribution = mutation({
  args: {
    memberId: v.id("members"),
    cycleId: v.id("cycles"),
    chamaId: v.id("chamas"),
    amount: v.number(),
    paymentMethod: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("cash")
    ),
    mpesaTransactionId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const now = Date.now();

    const contributionId = await ctx.db.insert("contributions", {
      ...args,
      dueDate: now,
      paidAt: now,
      status: "paid",
      recordedBy: identity.subject,
    });

    const chama = await ctx.db.get(args.chamaId);
    const newBalance = (chama?.totalPool ?? 0) + args.amount;

    await ctx.db.insert("transactions", {
      chamaId: args.chamaId,
      type: "contribution",
      amount: args.amount,
      direction: "credit",
      referenceId: contributionId,
      description: "Contribution recorded",
      performedBy: identity.subject,
      createdAt: now,
      balance: newBalance,
    });

    await ctx.db.patch(args.chamaId, { totalPool: newBalance });
    return contributionId;
  },
});
```

---

## Step 9 — Dashboard UI ⏳

### Utility Helpers

**`src/lib/utils.ts`**
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**`src/lib/formatters.ts`**
```typescript
export function formatKSh(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function calculateLoanRepayable(
  principal: number,
  interestRate: number
): number {
  return principal + (principal * interestRate) / 100;
}

export function daysUntil(timestamp: number): number {
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}
```

---

## Step 10 — M-Pesa Integration ⏳

### M-Pesa Webhook — `src/app/api/mpesa/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = body?.Body?.stkCallback;

  if (!result) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (result.ResultCode !== 0) {
    console.log("M-Pesa payment failed:", result.ResultDesc);
    return NextResponse.json({ received: true });
  }

  const metadata = result.CallbackMetadata?.Item ?? [];
  const get = (name: string) =>
    metadata.find((i: { Name: string }) => i.Name === name)?.Value;

  const transactionId = get("MpesaReceiptNumber") as string;
  const amount = get("Amount") as number;
  const phone = get("PhoneNumber") as string;

  // TODO: Match phone to member and record contribution
  console.log("M-Pesa payment received:", { transactionId, amount, phone });

  return NextResponse.json({ received: true });
}
```

### Environment Variables (M-Pesa)

```env
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

> Use shortcode `174379` for sandbox testing.

---

## Deployment

```bash
npm i -g vercel
vercel
```

Update WorkOS redirect URI to production URL:
```
https://your-chama-app.vercel.app/callback
```

---

## V2 Roadmap

| Feature | Notes |
|---------|-------|
| Voting & Poll Management | Member decision making |
| Vote Tracking | Audit trail for votes |
| Dividends | Annual profit distribution |
| Expense Management | Operational costs tracking |
| SMS Reminders | Africa's Talking API |
| PDF Statements | Monthly reports per member |
| Multi-chama Support | One user, multiple groups |
| Merry-go-round Tracker | Rotating payout schedule |

---

*Pamoja Chama System · Next.js 15 · TypeScript · Convex · WorkOS · M-Pesa*# chama-management-system
