# Launch Checklist

Everything between "works on localhost" and "a stranger can use it",
in order. Tags: **[You]** = account/admin work only you can do,
**[Code]** = a coding session, **[Both]** = mixed. Estimates are
first-time honest, not best-case.

The two hard blockers for strangers are **№2 (email OTP)** — today login
codes print to the server console, so no stranger can ever log in — and
**№1 (real API key)** — without it every generated site is the same
sample content.

---

## Phase 1 — unblock the product (before any deploy)

### 1. Real Anthropic API key + live quality validation — [Both] · ~2h
- **[You]** Create the key at console.anthropic.com, put it in `.env.local`
  (10 min). Note: generation uses claude-opus-4-8; expect a few paise per
  site — set a spend limit in the console.
- **[Code]** The parked validation session: one real generation each in
  English / Hindi / Hinglish with messy-transcript input, judge the copy,
  tune `lib/anthropic.ts` if Hinglish reads stiff, verify category→theme
  mapping and error paths. (This also unblocks the parked refinement-chat
  feature, but that's post-launch.)

### 2. Swap console-OTP for real email — [You] · ~45 min  ← hard blocker
**Code done** ✅ — Resend integration is live in `lib/auth.ts`/`lib/email.ts`
and env-gated: set `RESEND_API_KEY` and codes go out as branded emails;
unset, dev keeps console codes and production stays fail-closed.
Remaining is account work:
- Create a Resend account (free: 100 emails/day), verify your sending
  domain — SPF/DKIM steps are in DEPLOY.md §"Email OTP" (needs №3 first,
  or start with their test sender, which only delivers to your own inbox).
- Set `RESEND_API_KEY` + `EMAIL_FROM` in the host env, request a real
  code on the live URL, check it lands (and check spam the first time).

### 3. Domain — [You] · ~1h
Buy the domain (₹800–1500/yr), decide the public name. Needed by №2
(email sending domain) and №4 (DNS). Until then everything else can run
on a temporary URL.

## Phase 2 — first deploy

### 4. Deploy per DEPLOY.md — [Both] · 2–4h first time
Pick the path (recommendation: **Vercel + Neon** to start — zero server
maintenance; move to a VPS later only if costs/control demand it).
- **[You]** Create the Neon + Vercel accounts, click through the imports,
  point DNS at Vercel.
- **[Code]** The Postgres provider switch (one word + `prisma db push`)
  and the Vercel Blob swap for photo uploads (one file,
  `app/api/upload/route.ts` — exact diff is in DEPLOY.md). If VPS
  instead: systemd unit + Caddy, and set `UPLOADS_DIR` to a persistent
  path.

### 5. Production environment variables — [You] · 30 min
Set in the host's dashboard (never commit them):

| Var | Needed | From |
|---|---|---|
| `DATABASE_URL` | yes | Neon (or SQLite path on VPS) |
| `ANTHROPIC_API_KEY` | yes | №1 |
| `RESEND_API_KEY` | yes | №2 |
| `UPLOADS_DIR` | VPS only | persistent path |
| `BLOB_READ_WRITE_TOKEN` | Vercel only | auto-added by Blob store |
| `RAZORPAY_KEY_ID/SECRET`, `RAZORPAY_WEBHOOK_SECRET` | only when payments go live (№8) | Razorpay dashboard |

### 6. Post-deploy smoke check — [Code] · 30 min
On the live URL: OTP email arrives → login → generate (live AI) → edit →
photo upload → publish → public site loads with photos → wa.me/tel links
work from an actual phone → paste the /s/ link into WhatsApp and confirm
the og-preview card renders.

## Phase 3 — trust & money (can trail the launch by days)

### 7. Legal pages out of draft — [You] · ~1h
Fill the two `[contact email — to be added]` placeholders in
`app/terms/page.tsx` and `app/privacy/page.tsx`, read both drafts as the
owner and adjust, then remove the "Draft" banner (delete the banner block
in `components/LegalPage.tsx`). They're plain-language drafts, not legal
advice — a professional pass is worth it before real payments.

### 8. Razorpay: decide free-only vs paid launch — [You] · KYC takes days
Launching free-only is fine: without keys the plans page honestly shows
checkout disabled, and free limits are enforced. For paid: complete
Razorpay KYC (days, start early), then add live keys + register the
webhook URL (dashboard → Settings → Webhooks → `/api/billing/webhook`,
same secret in env). **[Code]** 30 min to verify the flow with test keys
first (`CUSTOMIZING.md §6` explains the three-request flow).

### 9. Backups + basic monitoring — [Both] · ~1h
Neon has point-in-time restore built in (check it's on); VPS = the cron
line in DEPLOY.md §6. Add a free uptime ping (e.g. UptimeRobot) on `/`
and `/s/demo-bakery`, and check host error logs after day 1. ~~**[Code]**
optional: a `/api/health` route if the pinger needs one.~~ ✅ Done —
`/api/health` exists; point the pinger at it.

## Phase 4 — first 10 users

### 10. Smoke-test plan — [You] · an afternoon
Recruit 5–10 real shop owners (family, neighbourhood, WhatsApp groups).
For each: watch them (don't help) go describe → generate → edit → photo
→ publish → share on WhatsApp — on **their** phone, not yours.

Watch for: does voice input work in their language mix? Do they
understand "Publish"? Does the og-preview look right in their WhatsApp?
Do they find the theme strip on their own?

Log per user: phone model, language chosen, where they got stuck, the
generated copy quality (screenshot it). Fix list after user 3 and user
10 — not after every user.

Keep: a WhatsApp number as the feedback channel (you already talk to
these users there), and check the server logs for 4xx/5xx spikes daily
in week 1.

---

## Not needed for launch (deliberately)

- Refinement chat (parked on №1's key, post-launch feature)
- Custom domains per shop, analytics, email marketing

## Deferred infrastructure — and the trigger that un-defers each

Skipped on purpose; each has a concrete signal that says "now". Until the
signal appears, adding these is pure overhead.

- **Postgres** — the moment `SQLITE_BUSY` shows up in the logs (write
  contention has outgrown SQLite). One-word provider switch, see №4.
- **Redis (rate limiting / sessions)** — the moment the app runs on more
  than one instance; in-memory state is correct until then.
- **CDN / object storage for uploads** — when deploying to a serverless
  host (no persistent disk — Vercel Blob diff is in DEPLOY.md) or at the
  first traffic spike that makes `./uploads` the bottleneck.
- **Error/uptime monitoring (Sentry-class)** — at the first paying user;
  before that, the UptimeRobot ping (№9) plus host logs are enough.
