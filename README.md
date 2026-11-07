# SmartChama

A savings group management app using Next.js 16, React 19, TypeScript, Tailwind CSS 4, Convex, and Convex Auth.

## Current status

Implemented: authentication, group memberships, the twelve-section responsive workspace, analytics, contribution cycles and partial payments, loan review/disbursement/repayment records, expenses, reconciliation, investments, dividends, voting, reporting, and officer email/WhatsApp invitations. Live M-Pesa/bank transfer execution is not enabled. See [the guide implementation matrix](docs/implementation.md) for behavior, permissions, deployment, and external-service requirements.

Authentication runs in Convex Auth. WorkOS is no longer used. Next.js handles the login interface and auth cookie proxy; Convex validates credentials, issues sessions, and checks access to application data.

## Local setup

Use Node.js 22+ and install dependencies:

```sh
npm ci
cp .env.example .env.local
npx convex dev
```

Connect your Convex project when prompted. The CLI sets `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`. Set `NEXT_PUBLIC_CONVEX_SITE_URL` to the deployment's HTTP actions URL (`https://<deployment>.convex.site`). Keep `npx convex dev` running to deploy backend functions and regenerate their types.

In another terminal, initialize Convex Auth:

```sh
npx @convex-dev/auth
```

This configures `JWT_PRIVATE_KEY` and `JWKS` in your selected Convex deployment. Do not commit or share private keys.

For manual key generation, `npm run auth:keys` writes an ignored `.env.auth-keys` file with the correct dotenv quoting. Upload it with `npx convex env set --from-file .env.auth-keys --force`, then delete the file. Regenerate keys only when intentionally rotating them. `JWKS` must be valid JSON; do not escape its JSON quotes when entering it in the Convex dashboard.

Set the required website URL explicitly in that same Convex deployment:

```sh
npx convex env set SITE_URL http://localhost:3000
```

`SITE_URL` must be the frontend address, not the Convex cloud or HTTP actions URL. It is required for email verification and recovery, including when users sign in with passwords. Adding it only to Next.js `.env.local` does not configure the Convex backend. Use your deployed frontend URL for production.

Email verification and recovery use Resend. Create a Resend API key and verify a sending domain, then set these **in the Convex deployment's environment variables**, not in client code:

```text
AUTH_RESEND_KEY=<your Resend API key>
AUTH_EMAIL_FROM=SmartChama <auth@your-verified-domain.com>
SITE_URL=http://localhost:3000
```

`CONVEX_SITE_URL` is supplied by Convex itself. Never prefix private keys or email credentials with `NEXT_PUBLIC_`. Missing email credentials fail closed: unverified accounts cannot access app data.

Start Next.js:

```sh
npm run dev
```

Visit `/sign-in`. Create an account with a 12–128 character password, then enter the eight-digit email verification code. Codes expire after 10 minutes. Use “Forgot password?” for recovery; successful password reset invalidates previous sessions. No email is sent by the test suite.

## Public landing page

The public homepage is `/`. It follows the SmartChama design reference with a green hero, interactive sample dashboard, setup steps, mobile product previews, member perspectives, and FAQs. Its sample figures never read or write real chama data. The demo cycles through four snapshots automatically every 30 seconds without visible refresh controls. The timers are cleaned up on navigation.

“Log in” opens `/sign-in`. “Create your chama” opens `/sign-in?flow=signUp`, which starts with the registration form. After authentication, `/dashboard` opens the last selected active membership, opens a sole membership directly, or shows the group picker when a choice is needed. Group cards open `/dashboard/<chamaId>`, a live dashboard backed by authorized Convex records. “Switch savings group” opens `/dashboard?choose=1` to bypass automatic selection. The browser remembers a group ID only as a navigation preference; the backend still checks every membership. New groups open their dashboard immediately after creation.

## Backend access rules

Every application query and mutation calls `requireUser` or `requireMembership` from `convex/lib/auth.ts`. Authentication requires a valid Convex Auth identity, a matching unexpired session still present in the database, and a verified email. Never trust a role, user ID, or chama ID supplied by the browser without a backend check.

Roles belong to a membership in a particular chama, not globally to the user:

| Operation | Backend requirement |
| --- | --- |
| Read own profile or list own active groups | Authenticated, verified user |
| Create a group | Authenticated, verified user; becomes admin only of the new group |
| Read a group | Active membership in that active group |
| Read member contacts | Admin/chairperson, treasurer, or secretary in that group |
| Create or revoke invitations | Admin/chairperson, treasurer, or secretary in that group |
| Change roles, deactivate/reactivate members | Admin/chairperson in that group |
| Record payments, expenses, repayments, and reconciliation | Admin/chairperson or treasurer in that group |

Members join through an email or WhatsApp invitation created in the Members section. Links expire in seven days, can be revoked, and are consumed once when the recipient submits their details. Email invites require the matching verified account. Admin/chairperson can preassign officer roles; treasurers and secretaries invite ordinary members. WhatsApp invites require a recipient number but, without OTP, do not prove phone ownership; keep links private. Memberships cannot be duplicated. `members.updateAccess` prevents removing or demoting the last active admin/chairperson. Role changes and deactivation take effect on the next backend request. Registration alone grants no access to existing groups.

The Next.js proxy protects application routes, and the workspace layout also calls the backend. These redirects improve navigation; backend guards enforce authorization even for direct API calls. Financial and membership mutations check every referenced record's group. See `docs/implementation.md` for the complete permission matrix and accounting behavior.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Backend tests use `convex-test` with isolated in-memory data. They cover authentication, group isolation, roles, session revocation, last-admin protection, partial and duplicate payments, loan approvals/repayments, expenses, reconciliation, dividends, voting, and invitation creation/acceptance/expiry. Resend delivery is mocked in tests. A real deployment and configured email service are required for end-to-end delivery and browser-session testing.

## Deployment

Configure a separate production Convex deployment, initialize its auth keys, set its email credentials and production `SITE_URL`, and deploy the backend. Configure the matching public Convex cloud/site URLs in your Next.js hosting environment before building. Convex Auth's Next.js server integration is experimental; see the [official setup guide](https://labs.convex.dev/auth/setup).

The schema links memberships with `userId: Id<"users">` instead of `workosUserId` and types chama `createdBy` as a Convex user ID. Existing WorkOS-backed data needs an explicit migration before using this schema. The added workspace tables are applied by `npx convex dev --once` to the selected development deployment.
