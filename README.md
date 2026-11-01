# SmartChama

A savings group management app using Next.js 16, React 19, TypeScript, Tailwind CSS 4, Convex, and Convex Auth.

## Current status

Implemented: email/password registration and login, required email verification, password recovery, logout, backend session validation, chama creation, and membership authorization. The financial modules are placeholders; their backend workflows and M-Pesa integration are not implemented yet.

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

This configures `JWT_PRIVATE_KEY` and `JWKS` in your selected Convex deployment. Set the site URL to `http://localhost:3000` when prompted. Do not commit or share private keys.

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

The public homepage is `/`. It follows the SmartChama design reference with a green hero, interactive sample dashboard, setup steps, mobile product previews, member perspectives, and FAQs. Its sample figures never read or write real chama data. The demo cycles through four snapshots every 30 seconds; visitors can select one-minute updates or pause and resume it. The timers are cleaned up on navigation.

“Log in” opens `/sign-in`. “Create your chama” opens `/sign-in?flow=signUp`, which starts with the registration form. The real authenticated workspace remains at `/dashboard`.

## Backend access rules

Every application query and mutation calls `requireUser` or `requireMembership` from `convex/lib/auth.ts`. Authentication requires a valid Convex Auth identity, a matching unexpired session still present in the database, and a verified email. Never trust a role, user ID, or chama ID supplied by the browser without a backend check.

Roles belong to a membership in a particular chama, not globally to the user:

| Operation | Backend requirement |
| --- | --- |
| Read own profile or list own active groups | Authenticated, verified user |
| Create a group | Authenticated, verified user; becomes admin only of the new group |
| Read a group | Active membership in that active group |
| List member profiles | Admin, treasurer, or secretary in that group |
| Add members, change roles, deactivate/reactivate members | Admin in that group |

Admins add existing verified users by email using `members.add`. Memberships cannot be duplicated. `members.updateAccess` prevents removing or demoting the last active admin. Role changes and deactivation take effect on the next backend request. Registration alone grants no access to existing groups. Member-management UI is deferred; these operations are currently backend APIs.

The Next.js proxy protects application routes, and the dashboard layout also calls the backend. These redirects improve navigation; backend guards enforce authorization even for direct API calls. Future finance, contribution, loan, report, and payment functions must use these guards and check that every referenced record belongs to the authorized chama.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Backend tests use `convex-test` with isolated in-memory data. They cover unauthenticated calls, email verification, group isolation, roles, session revocation and expiry, deactivated membership, and last-admin protection. A real deployment and configured email service are required to test actual email delivery and browser sessions end to end.

## Deployment

Configure a separate production Convex deployment, initialize its auth keys, set its email credentials and production `SITE_URL`, and deploy the backend. Configure the matching public Convex cloud/site URLs in your Next.js hosting environment before building. Convex Auth's Next.js server integration is experimental; see the [official setup guide](https://labs.convex.dev/auth/setup).

The schema now links memberships with `userId: Id<"users">` instead of `workosUserId` and types chama `createdBy` as a Convex user ID. Existing WorkOS-backed data needs an explicit migration before this schema can be deployed; this checkout has no configured deployment or migration source.
