# SmartChama guide implementation

Source: `docs/smart Chama.pdf`, all six pages, plus the requested eleven sections, Analytics, officer invitations, and responsive layouts.

The guide's Python/SQL/REST deployment example is a reference architecture. This project retains the previously selected Next.js and Convex Auth/Convex database stack. The guide's workflows are implemented as authenticated Convex queries, mutations, and actions.

## Workspace

Open a group at `/dashboard/<chamaId>`. Its shared sidebar contains:

| Section | Implemented behavior |
| --- | --- |
| Dashboard | Live balance, collected contributions, members, arrears, loan exposure, six-month cash-flow chart, recent transactions, alerts, voting |
| Members | Directory, officer contact editing, admin role changes and activation/deactivation, invitation creation/history/revocation |
| Contributions | Open/close cycles, notify members, record full/partial payments, calculate arrears, waive obligations, apply configured late fees, send in-app reminders |
| Loans | Member applications, backend-calculated flat monthly interest, independent admin review, disbursement records, repayment records, instalment schedules |
| Finance | Income/outflow overview, categorized expenses, actual-versus-ledger reconciliation history |
| Reports | Date-filtered group statements, personal member statements, loan statements, Excel `.xlsx` and CSV downloads, browser print/save-as-PDF |
| Transactions | M-Pesa/bank/cash records with references and running balances |
| Investments | Record investments, update valuations, record proceeds, show profit/loss, record equal dividend payouts from realized profits |
| Analytics | Six-month inflow/outflow chart, monetary contribution collection rate, arrears, outstanding loans, portfolio returns, member contribution performance |
| Admin | Group votes and results, officer audit trail, invitations; role changes are under Members and loan approvals under Loans |
| Notifications | Per-member notifications, read status, officer announcements |
| Settings | Own name/phone, group rules, cycle defaults, contribution amount, monthly loan rate, default loan term, late contribution fee |

Ordinary members see only their own contribution/loan/dividend details and member statement. Group aggregate figures, the shared cash ledger, investments, expenses, and voting results are visible for transparency. Other members' email addresses and phone numbers are hidden from ordinary members.

## Authorization and accounting

- `admin` represents the existing chairperson/admin role; an explicit `chairperson` role is also supported.
- Admin/chairperson, treasurer, and secretary can invite members. Admin/chairperson controls roles and activation. The last active admin/chairperson cannot be removed.
- Admin/chairperson and treasurer can record payments, expenses, repayments, disbursements, and valuations. Admin/chairperson approves loans and records investments/dividend payouts.
- Borrowers cannot approve their own loans. Approval and disbursement are separate steps.
- Every record reference is checked against the authorized group. The browser's group selection never grants permission.
- Financial writes, balance changes, notifications, and audit records are atomic. Debit entries cannot overdraw the group. Supplied payment references cannot be recorded twice within a group.
- Contributions support partial payments; receipts, obligations, and ledger entries are separate. Overpayments and excess loan repayments are rejected.
- Reconciliation records a discrepancy without silently changing the ledger.
- Dividend records are explicitly equal payouts, including cent-level remainder allocation. Payouts cannot exceed the investment's undistributed realized profit and must be backed by available group cash.
- Poll voting is single-choice, one vote per active member, and closes at its deadline. Only aggregated results and the current member's own choice are returned.

## Invitation flow

1. An officer opens Members and chooses Email (recipient email required) or WhatsApp (recipient phone required). Admin/chairperson may assign member, chairperson, secretary, or treasurer; treasurers and secretaries can invite ordinary members only.
2. A cryptographically random 256-bit token produces a single-use `/join/<token>` link. It expires in seven days and can be revoked.
3. Email delivery uses `AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM` in the Convex deployment. If delivery fails, the officer can copy/share the created link. Clicking Share on WhatsApp opens WhatsApp with the link; it does not automatically send a message.
4. The recipient signs in or creates/verifies an account and returns to the invitation. The return URL accepts only an internal join-token route.
5. After signing in, the recipient completes their full name and phone. Account email and the inviter-assigned role are read-only. Acceptance validates status, expiry, verified email for email invitations, the entered recipient phone for WhatsApp invitations, verified session, active group, current inviter authority, and existing membership. The role is read from the invitation on the backend, never from form input. It cannot reactivate an inactive membership or change an existing member’s access.
6. Successful acceptance atomically creates the membership and consumes the invitation; even the same account cannot accept it twice. Invalid form submissions do not consume the link. Old WhatsApp links without a recipient number must be reissued.
7. Phone ownership is **not verified**. Per the chosen no-OTP approach, WhatsApp links are bearer invitations: someone with both the link and recipient number could use it first. Keep these links private. A phone check is for consistent contact data, not proof of identity; strict phone-only access would require an OTP provider. No SMS service is configured or required.

Set Convex `SITE_URL` to the reachable frontend origin before sharing links to other devices. `http://localhost:3000` works only on the device opening that address. Resend's test sender can deliver only to the Resend account's own address; configure a verified domain for other recipients.

## Responsive behavior and deployment

- Desktop: persistent sidebar, multi-column cards and forms.
- Tablet: compact workspace, horizontal navigation below 760px; landing navigation collapses below 950px.
- Phone: single-column forms at narrow widths, horizontally scrollable tables and navigation, fluid cards and contained charts. Print styles remove navigation and form controls from statements.
- Geist fonts are served locally from `src/app/fonts`, including their SIL Open Font License, so builds do not depend on Google Fonts availability.

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Apply the added tables and backend functions with `npx convex dev --once` for the selected development deployment. Use a separate production deployment and its environment variables when publishing.

## External integrations and future work

Payment entry records money already received or paid. This implementation does not initiate M-Pesa STK pushes, bank transfers, investment trades, or actual dividend transfers. Daraja provider credentials, webhook verification, payment reconciliation, and live payment testing remain necessary before enabling automated payments. Never treat a manually entered receipt as provider confirmation.

Notifications are in-app, with email used for authentication and invitations. SMS, native mobile apps, AI insights, credit scoring, and automated dividend distribution remain future enhancements as listed in the guide. Backup policies must be configured in the Convex deployment/hosting account; no backup schedule is claimed to be provisioned by this code.


## Deployment operator administrator setup

`adminAccess.prepare` is an internal mutation available only to deployment operators. It prepares a seven-day, email-bound grant for an explicit list of active group IDs. A verified existing account activates immediately; otherwise the grant is consumed in Convex Auth’s `beforeSessionCreation` callback only after email verification. Activation creates/promotes active memberships to admin and records audit events. It never grants access to future groups automatically, restores an inactive membership, or reapplies a consumed grant after a later demotion.

`adminAccess.createDeveloperAccount` additionally creates a password account using Convex Auth’s password hashing and returns a server-generated password once. It does not mark the email verified, cannot replace an existing account’s password, and is not callable by browser clients. `adminAccess.revokePending` cancels unclaimed grants; existing admin memberships are managed under Members.
