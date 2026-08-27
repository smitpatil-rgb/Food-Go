# Food.Go

Food.Go is a restaurant ordering application starter built with Next.js App Router, strict TypeScript, PostgreSQL, Prisma and Zod. It preserves the supplied food and chef imagery and adds customer ordering and staff operations workflows.

> This is a demonstration/application starter, not a production-readiness guarantee. Payments are cash or UPI on delivery; no online payment gateway is connected.

## Upload to GitHub

Follow [GITHUB_UPLOAD.md](GITHUB_UPLOAD.md). Upload the extracted project files, not just the ZIP. The active app is in `src/`; obsolete static HTML/CSS and duplicate root images were omitted from this GitHub edition. The original project remains separate.

Publishing the source is not the same as deploying a working site. [GitHub Pages hosts static files](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), so it cannot run this app's server routes or PostgreSQL-backed ordering system. A live site needs a Next.js-capable host and PostgreSQL.

## Architecture

- **Next.js App Router:** React Server Components render data-led entry pages; client components own interactive menu, cart, checkout, tracking and operations controls.
- **PostgreSQL + Prisma:** canonical persistence for staff, categories, menu items, orders and status events, reviews, support messages, settings and admin audit logs.
- **Route handlers:** all mutations cross a validated server boundary. Order prices and totals are loaded and calculated on the server using integer minor currency units.
- **Staff authentication:** individual database-backed staff accounts, bcrypt password hashes, signed short-lived HttpOnly session cookies and server-side authorization on every staff operation.
- **CSS token system:** a restrained near-black, neon-green editorial system in `src/app/globals.css`, with responsive layouts, visible focus states and reduced-motion support.
- **Isolated demo/test adapter:** `FOODGO_DATA_MODE=memory` supports local demonstrations and browser tests without a database. It must never be enabled on a public deployment; data disappears on restart.

## Requirements

- Node.js 24 or newer and npm (`.nvmrc` selects Node 24)
- PostgreSQL 16 or newer (or Docker)

## Local setup

1. Open a terminal in the folder containing `package.json`. Install the locked dependencies: `npm ci`.
2. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell, or `cp .env.example .env` on macOS/Linux). Set your own `ADMIN_PASSWORD` and a random `AUTH_SECRET`.
3. Start PostgreSQL: `docker compose up -d postgres`. If you already have a database, skip Docker and set `DATABASE_URL` to your own empty development database.
4. Generate the Prisma client: `npm run db:generate`.
5. Apply committed migrations: `npm run db:deploy`. Use `npm run db:migrate` only when developing new schema changes.
6. Seed the menu and first owner account: `npm run db:seed`.
7. Start Food.Go: `npm run dev`.

Open <http://localhost:3000>. Staff sign-in is at <http://localhost:3000/admin/login> using the credentials you put in `.env`.

The seed command explicitly loads `.env` and refuses to run unless `ADMIN_PASSWORD` is at least 12 characters. It creates/updates the owner password and menu, so do not casually rerun it on live data. No production admin password is committed. Keep configuration in `.env` for the CLI setup commands; environment variables supplied by your host/CI take precedence.

Generate a signing secret locally, then paste its output into `AUTH_SECRET` in `.env`:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The Docker credentials are for a loopback-only local database, not public deployment. `docker compose stop` stops the container without deleting its data.

### Local demo without PostgreSQL

After installing dependencies and configuring your own credentials in `.env`, set `FOODGO_DATA_MODE=memory`, run `npm run db:generate`, and then `npm run dev`. No Docker, migration, or seed is needed. Use only dummy customer information: all orders, messages and staff changes disappear on restart. Never publish this mode as a live service.

## Environment variables

| Variable              | Required          | Purpose                                                     |
| --------------------- | ----------------- | ----------------------------------------------------------- |
| `DATABASE_URL`        | Yes               | PostgreSQL connection string                                |
| `AUTH_SECRET`         | Yes               | At least 32 random characters for signing staff sessions    |
| `NEXT_PUBLIC_APP_URL` | Yes in production | Trusted canonical origin for metadata                       |
| `ADMIN_EMAIL`         | Seed only         | Email for the initial owner account                         |
| `ADMIN_PASSWORD`      | Seed only         | Initial owner password; rotate after provisioning           |
| `FOODGO_DATA_MODE`    | Yes               | `prisma` for real data; `memory` only for local demos/tests |

## Quality commands

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run build
npm run test:e2e
```

`npm run verify` runs formatting, lint, type checks, unit tests and smoke checks together. `typecheck` generates Next.js route types first so a fresh clone does not depend on a previous build. `npm run db:validate` validates the Prisma schema once `DATABASE_URL` is configured.

Tooling note: npm currently warns that ESLint 9 is deprecated. It is retained because the React lint plugin used by this Next.js configuration declares compatibility through ESLint 9, not 10. Upgrade that toolchain together once compatible; this warning does not prevent installation or linting.

Install Chromium with `npx playwright install chromium` before the first browser run. `test:e2e` creates a production build and starts its own server on **127.0.0.1:3100** using temporary memory data by default; it never reuses a developer's existing server. Keep that port free. Run it from a separate project copy if you are serving another production build from the same `.next` directory.

### GitHub Actions

The included workflow runs on pushes and pull requests: clean dependency installation, Prisma generation/validation, migrations and seeding in a disposable PostgreSQL service, quality checks, production build and database-backed browser tests. No production secrets are required. Check the actual Actions result after your first push; a workflow file alone is not evidence of a passing GitHub run.

To run PostgreSQL browser tests locally, export a **disposable test** `DATABASE_URL`, initialize it using the test credentials from `.github/workflows/ci.yml`, and set `FOODGO_E2E_DATA_MODE=prisma` before running `npm run test:e2e`. These tests create and change records; never use a live database.

## Customer flows

- Discover the Food.Go promise and kitchen story.
- Browse database-backed menu items, search and filter, inspect dietary labels, rating, price and preparation time.
- Add, increment, decrement and remove items in a cart persisted across reloads.
- Review estimated subtotal, delivery, tax and total; securely create an idempotent COD or UPI-on-delivery order.
- Receive a human-readable order ID and track status using that ID plus the original phone number.
- Submit moderated reviews and persisted support messages.

## Staff flows

- Sign in with an individual staff account.
- View daily metrics, recent orders and details.
- Move orders through validated status transitions; customer tracking reads the same status history.
- Create and edit menu items, feature them, and deactivate them without breaking historical order references.
- Approve or reject reviews and inspect the support inbox.
- Record login, status, menu and moderation actions in `AdminAuditLog`.

## Security notes

- No card fields or simulated card collection are present. Supported methods are COD and UPI on delivery.
- Order totals ignore client estimates and are recomputed from active database menu records.
- Zod validates and normalizes external input; React renders text without user-controlled HTML injection.
- Staff mutations require a valid HttpOnly, `SameSite=Lax` signed session and same-origin checks.
- Login, order, tracking, review and contact endpoints have in-process rate limits. In multi-instance production, replace the limiter with Redis or another shared atomic store.
- Security headers disable framing, MIME sniffing and unnecessary browser capabilities.
- Internal errors are not exposed to customers.

## Production considerations

- Use `FOODGO_DATA_MODE=prisma`, private credentials and HTTPS. Generate Prisma, run `npm run build`, apply migrations with `npm run db:deploy` as a controlled release step, and run `npm start`.
- Homepage delivery/rating statistics and initial reviews are demonstration content, not measured business claims. Replace them with verified information before public use.
- Staff role-specific permissions and immediate session revocation need further hardening before a multi-role production deployment.
- Replace the in-process rate limiter with a shared service before horizontal scaling.
- Put the application behind TLS and a trusted reverse proxy, add structured logging/alerting and automate database backups.
- Review the licensing/provenance of the supplied legacy images before commercial deployment.
- Add transactional email/SMS delivery if customers need proactive status notifications.
- Run migrations in a controlled release step and provision staff accounts through a secure owner-only workflow.
- If prepaid cards are later required, add Stripe test mode first with server-created PaymentIntents and verified webhooks; never add raw card inputs.

See [SECURITY.md](SECURITY.md) for security reporting and [ASSET_NOTES.md](ASSET_NOTES.md) for image-rights limitations. No open-source license has been selected or granted by this preparation; choose one only after confirming ownership and redistribution rights.
