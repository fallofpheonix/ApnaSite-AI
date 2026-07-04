# VoxSite AI — Architecture Guide

This document explains how the whole app fits together: what every folder and
file does, and how data travels from a shop owner speaking into the mic all
the way to a public website their customers can visit. It's written for
someone who is **not** an experienced web developer — jargon is explained the
first time it appears.

---

## The one-paragraph version

VoxSite AI is a [Next.js](https://nextjs.org) app. Next.js is a framework
that lets one project contain both the **pages people see in the browser**
(the "frontend") and the **code that runs on the server** (the "backend" —
things like talking to the database or calling the Claude AI). A shop owner
logs in with an email code, describes their shop by voice or text, Claude
turns that description into structured website content, the owner edits it in
a live preview, saves it, and publishes it. Published sites are stored in a
small database file and served to the public at `/s/<site-name>`.

---

## The big picture: how data flows

```
 Shop owner's voice/typing
        │
        ▼
 [Browser] app/page.tsx + components/VoiceTextCapture.tsx
        │   The browser's built-in speech recognition turns speech into text.
        │   The owner reviews/fixes the transcript, picks a language, clicks
        │   "Generate My Website".
        ▼
 POST /api/generate  (app/api/generate/route.ts)   ← requires login + rate-limited
        │   Checks the session cookie, counts the request against rate
        │   limits, then calls lib/anthropic.ts.
        ▼
 lib/anthropic.ts → Claude API
        │   Sends the raw description to Claude with a JSON "schema" (a
        │   contract describing exactly which fields to return: shopName,
        │   tagline, products, hours...). Claude fills in the schema.
        │   ⚠ If no ANTHROPIC_API_KEY is set, this step is skipped and
        │   lib/sampleData.ts returns hand-written placeholder content
        │   instead ("sample mode"), so the rest of the app stays testable.
        ▼
 [Browser] components/StorefrontPreview.tsx
        │   Shows the site as it will look, using the theme picked by
        │   lib/theme.ts based on the shop's category. Every piece of text
        │   is click-to-edit (components/EditableText.tsx).
        ▼
 "Save draft" → POST /api/sites          (creates a Site row in the database)
 "Publish"    → POST /api/sites/:id/publish
        │   Picks a unique URL slug (lib/slug.ts) and flips published=true.
        │   Nothing is written to disk — the HTML is rendered on demand.
        ▼
 Public visitor opens /s/<slug>  (app/s/[slug]/route.ts)
        │   Looks the site up in the database, and if it's published,
        │   renders it to a full standalone HTML page with
        │   lib/renderSite.ts and returns it. No login needed — this is
        │   the page customers see.
```

---

## Folder-by-folder tour

### Root files

| File | What it is |
|---|---|
| `package.json` | The project's "ingredients list": which libraries it uses (Next.js, React, Prisma, the Anthropic SDK) and the commands you can run (`npm run dev`, `npm run build`, `npm run db:push`). |
| `.env` | Non-secret configuration, safe to commit. Currently just `DATABASE_URL`, which tells Prisma where the SQLite database file lives. |
| `.env.local` | **Secrets** (the Anthropic API key). Gitignored — never committed. Copy `.env.local.example` to create it. |
| `next.config.js`, `tsconfig.json`, `postcss.config.js`, `tailwind.config.ts` | Standard configuration for Next.js, TypeScript, and Tailwind CSS (the utility-class styling system used by the app's own UI). `tailwind.config.ts` also defines the app's brand colors (paper, ink, marigold, teal, brick). |
| `Idea.md` | The original product pitch document. |

### `prisma/` — the database

| File | What it is |
|---|---|
| `schema.prisma` | The database blueprint. Prisma reads this file and (a) creates/updates the actual database tables, (b) generates a type-safe client the code uses to query them. |
| `dev.db` | The SQLite database itself — one ordinary file on disk (gitignored). SQLite needs no server, which is why it's perfect for now. Swapping to Postgres later means changing two lines in `schema.prisma` and the `DATABASE_URL`. |

The four tables:

- **User** — one row per shop owner, identified by email. Created
  automatically the first time an email verifies a login code.
- **OtpCode** — outstanding 6-digit login codes. Stored *hashed* (a one-way
  fingerprint), valid 10 minutes, max 5 wrong guesses.
- **Session** — one row per logged-in browser. The row's token is what lives
  inside the user's cookie; deleting the row logs that browser out.
- **Site** — a saved website. Holds the owner (`userId`), the full content as
  a JSON string (`data`), the public URL segment (`slug`), and a `published`
  flag.

Useful commands: `npm run db:push` (apply schema changes to the database),
`npm run db:studio` (opens a visual database browser).

### `lib/` — shared server & logic code ("the brains")

| File | What it does |
|---|---|
| `types.ts` | The central definition of `StorefrontData` — the shape of a website's content (shopName, tagline, category, products, hours, contact info, language). Almost every other file imports this. Also `validStorefront()`, a safety check run on any site data sent by a browser before it's trusted. |
| `anthropic.ts` | The only file that talks to Claude. Builds the system prompt (including per-language writing instructions for English / Hindi / Hinglish), sends the owner's description, and demands the reply match `STOREFRONT_SCHEMA` so it always comes back as clean, parseable data. |
| `sampleData.ts` | Hand-written stand-in content used when no API key is configured, one sample per language. It still runs the description through the category matcher so every theme can be previewed without a key. Responses are flagged `sampleMode: true` so the UI can say so. |
| `theme.ts` | The design engine. 15 themes, each a deliberate palette + typeface pairing for a shop category (bakery, salon, hardware, restaurant, grocery, pharmacy, clothing, **sweets/mithai, kirana, tailor, jewellery, gym, tuition, electronics**, and a general fallback). `resolveTheme(category)` matches the AI-returned category against keyword patterns; order matters — specific categories (kirana) sit above broad ones (grocery). `themeForSite(data)` is the entry point everything uses: an explicit owner pick (`data.themeOverride`, set by the theme switcher) beats the keyword match. |
| `fonts.ts` | Loads every typeface once via Next.js's font system for the live preview, and builds the Google Fonts link used by exported/public pages. Every font stack ends with a Devanagari fallback font so Hindi text never renders as empty boxes. |
| `renderSite.ts` | Turns a `StorefrontData` object into one complete, standalone HTML page — the actual site customers see. It escapes all text (so nobody can inject code through a shop description) and inlines the theme colors as CSS. |
| `slug.ts` | Makes URL-safe names ("Iron House Gym" → `iron-house-gym`). Devanagari-only names get a random `my-site-xxxxxx` fallback. `uniqueSlugFor()` checks the database and appends `-2`, `-3`… on collisions; a site that already owns a slug keeps it forever, so republishing never changes a live URL. |
| `db.ts` | Creates the single shared Prisma database client. The odd-looking global caching exists because Next.js dev mode reloads code constantly and would otherwise open a new database connection each time. |
| `auth.ts` | All login logic: create + hash OTP codes, verify them, create session rows, read the session cookie back into a user (`getSessionUser`), and set/clear the cookie. The cookie is `httpOnly` (JavaScript in the page can't read it — protects against script-injection stealing logins). In dev, the OTP is printed to the server console instead of being emailed. |
| `plans.ts` | **The one file for pricing.** Free (1 published site, badge) and Pro (₹199/mo, 5 sites, no badge) plan definitions, plus `planForUser()` which maps a user's Subscription row to their effective plan. |
| `razorpay.ts` | Razorpay REST calls (plan + subscription creation via fetch, no SDK) and both signature verifiers: checkout callback HMAC and webhook HMAC over the raw body. Without test keys in env, `razorpayConfigured()` is false and checkout is disabled — never faked. |
| `uploads.ts` | Where uploaded photos live on disk (`UPLOADS_DIR`) and the name allowlist used by the serving route. |
| `rateLimit.ts` | A small in-memory counter: "no more than N hits per time window per key". Used on generation (costs money) and OTP requests (could spam inboxes). **Limitation:** counters live in the server process's memory, so they reset on restart and aren't shared if you ever run multiple server instances — swap for a database/Redis counter then. |

### `app/` — pages and API endpoints

In Next.js, the `app/` folder *is* the URL structure: `app/login/page.tsx`
is the page at `/login`; `app/api/sites/route.ts` is the API endpoint at
`/api/sites`. Files named `page.tsx` are visible pages; files named
`route.ts` are backend endpoints that receive/return JSON (or HTML).

**Pages (what people see):**

| Path | File | What it shows |
|---|---|---|
| `/` | `app/page.tsx` | The builder. Mic + textarea capture → loading → editable preview → published confirmation. Also handles `/?site=<id>` to re-open a saved site for editing. |
| `/login` | `app/login/page.tsx` | Two-step login: enter email → enter the 6-digit code. Supports `?next=/somewhere` to return you where you were heading. |
| `/dashboard` | `app/dashboard/page.tsx` | "My Sites": every saved site with its status (Draft/Live), public link, and Edit / Publish / Unpublish / Delete buttons. |
| `/billing` | `app/billing/page.tsx` | Plans & Billing: current plan, perks, Razorpay Checkout upgrade button (disabled with a notice when test keys are absent), and subscription status. |
| `/terms`, `/privacy` | `app/terms/page.tsx`, `app/privacy/page.tsx` | Plain-language legal drafts (marked as drafts), linked from login and /billing. |
| `/s/<slug>` | `app/s/[slug]/route.ts` | **The public site.** The only unauthenticated route besides login itself. Renders the site's HTML straight from the database. |
| (all pages) | `app/layout.tsx`, `app/globals.css` | The shared HTML shell, font variables, and global styles. |

**API endpoints (what the browser calls behind the scenes):**

| Endpoint | File | Auth? | What it does |
|---|---|---|---|
| `POST /api/auth/request-otp` | `app/api/auth/request-otp/route.ts` | public, rate-limited | Creates a login code for an email. Dev: prints it to the server console. |
| `POST /api/auth/verify-otp` | `app/api/auth/verify-otp/route.ts` | public, rate-limited | Checks the code; on success creates the user + session and sets the cookie. |
| `POST /api/auth/logout` | `app/api/auth/logout/route.ts` | — | Deletes the session row and clears the cookie. |
| `GET /api/auth/me` | `app/api/auth/me/route.ts` | — | Tells the page who's logged in (or `null`). |
| `POST /api/generate` | `app/api/generate/route.ts` | **login required**, rate-limited per user *and* per IP | Description → Claude (or sample data) → `StorefrontData`. |
| `GET/POST /api/sites` | `app/api/sites/route.ts` | login required | List my sites / save a new one. |
| `GET/PUT/DELETE /api/sites/:id` | `app/api/sites/[id]/route.ts` | login required, **owner only** | Open, update, or delete one site. Non-owners get the same 404 as nonexistent sites, so site IDs can't be probed. |
| `POST /api/sites/:id/publish` | `.../publish/route.ts` | owner only | Claims a unique slug (first time) and sets `published=true`. |
| `POST /api/sites/:id/unpublish` | `.../unpublish/route.ts` | owner only | Sets `published=false`; the slug stays reserved. |
| `POST /api/upload` | `app/api/upload/route.ts` | login required, rate-limited | Product photo upload: validates type (JPG/PNG/WebP by magic bytes) + size (≤4 MB), writes to `UPLOADS_DIR` (default `./uploads`), returns the `/uploads/<name>` URL. The single file to change for S3/R2/Vercel Blob. |
| `GET /uploads/:name` | `app/uploads/[name]/route.ts` | public | Serves uploaded photos from disk. Exists because `next start` won't serve files added to `public/` after build. Strict name allowlist (no path traversal). |
| `GET /api/billing` | `app/api/billing/route.ts` | login required | Current plan, published-site count, subscription status, and whether checkout is configured. |
| `POST /api/billing/subscribe` | `.../subscribe/route.ts` | login required, rate-limited | Creates a Razorpay subscription (test mode) and returns its id for Checkout. 503 when keys are absent. |
| `POST /api/billing/verify` | `.../verify/route.ts` | login required | Verifies the checkout success signature (HMAC of `payment_id|subscription_id`) and activates the user's subscription. |
| `POST /api/billing/webhook` | `.../webhook/route.ts` | **signature only** (no session — Razorpay calls it) | HMAC-verified over the raw body. Maps `subscription.*` events onto the Subscription row: activated/charged → active, halted, cancelled, expired. The authoritative record of paid status. |

### `components/` — reusable frontend pieces

| File | What it does |
|---|---|
| `VoiceTextCapture.tsx` | The mic button + textarea + language picker. Uses the browser's built-in Web Speech API (Chrome/Edge/Safari; gracefully hides the mic elsewhere). Speech lands in the textarea for review before generating, because transcripts are often imperfect. |
| `StorefrontPreview.tsx` | The live, themed, editable preview of the generated site. Mirrors the sections of the final page (hero, about, hours, products, contact) and lets you add/remove products. |
| `EditableText.tsx` | The click-to-edit building block used everywhere in the preview (a `contentEditable` element that reports changes on blur). |
| `AppHeader.tsx` | The top bar: logo, "My Sites", email, Log in / Log out. |
| `useAuthUser.ts` | A small React hook every page uses to ask "who's logged in?" once, and to provide the logout action. |

---

## Key design decisions (and how to change them later)

**Why SQLite + Prisma?** Zero setup — the database is one file. Prisma is the
translation layer, and it speaks Postgres too: when you outgrow SQLite,
change `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`,
point `DATABASE_URL` at a Postgres server, change `Site.data` from `String`
to `Json`, and run `npm run db:push`.

**Why OTP instead of passwords?** Shop owners forget passwords; email codes
need nothing to remember and nothing for us to leak. Adding real email
delivery later = replace the single `console.log` in `lib/auth.ts` →
`requestOtp()` with a call to an email provider (Resend, SES, ...).

**Why render published sites on demand instead of saving HTML files?**
The database is the single source of truth — edits go live on the next
request (there's a 60-second browser cache), unpublish works instantly, and
there are no orphaned files to clean up. If traffic ever demands it, add
caching in front rather than going back to files.

**Why is the rate limiter in memory?** It's one `Map` — the simplest thing
that satisfies "every public endpoint gets rate limiting from day one". Its
counters are per-process (reset on restart, not shared across dev-mode
recompiles or multiple servers). The upgrade path is a `RateLimit` table in
SQLite or Redis, keeping the same `rateLimit(key, limit, window)` signature.

**Where does security actually happen?** Four places to know about:
1. `getSessionUser()` at the top of every protected endpoint — no valid
   cookie, no service.
2. Ownership checks (`site.userId !== user.id → 404`) on every site
   operation.
3. `esc()` in `renderSite.ts` — everything a user typed is HTML-escaped
   before being put on a public page.
4. `validStorefront()` — site data arriving from a browser is shape-checked
   before it's stored.

---

## Running it

```bash
npm install          # once
npm run db:push      # once (creates prisma/dev.db)
npm run dev          # start at http://localhost:3000
```

Log in with any email — the 6-digit code appears in the terminal running
`npm run dev`. Without an `ANTHROPIC_API_KEY` in `.env.local`, generation
returns clearly-labelled sample content; everything else works for real.
