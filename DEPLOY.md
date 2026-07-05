# Deploying ApnaSite AI

This guide gets ApnaSite from your laptop onto the internet. Two paths, from
simplest-to-scale to cheapest-to-run:

- **Path A — Vercel + Neon Postgres** (free to start, zero server maintenance)
- **Path B — a cheap VPS with SQLite as-is** (₹350–700/month, everything on one box)

Both assume the repo is pushed to GitHub and that `npm run build` + `npm start`
work locally (they are verified as part of this repo's checks — the app has no
dev-only assumptions).

> **Before you deploy — the login-code catch:** login codes (OTPs) are
> currently printed to the **server console**, not emailed
> (`lib/auth.ts:requestOtp`). In production that means *you* can log in by
> reading the server logs, but real users can't. Wire up a real email sender
> first — see the "Swap console-OTP for real email" recipe in
> [CUSTOMIZING.md](./CUSTOMIZING.md). Everything else deploys fine without it.

## Environment variables

The complete list. "Without it" is what actually breaks — anything not
marked **required** degrades gracefully.

| Variable            | Required | What it is | Without it |
| ------------------- | -------- | ---------- | ---------- |
| `DATABASE_URL`      | yes      | Prisma connection string. SQLite: `file:./dev.db` · Postgres: `postgresql://user:pass@host/db`. Use an **absolute** file path when running the standalone server (see Path B, Step 4). | App won't start. |
| `RESEND_API_KEY`    | prod: yes | Resend API key for login-code emails. | Production login **fails closed** (503 on code request) — no stranger can log in. Dev falls back to console codes. |
| `EMAIL_FROM`        | no       | Verified sender, e.g. `ApnaSite AI <login@yourdomain.in>`. | Falls back to Resend's shared test sender (`onboarding@resend.dev`), which only delivers to your own Resend account inbox. |
| `ANTHROPIC_API_KEY` | no       | Claude API key for site generation. | **Sample mode**: every generation returns placeholder content; the rest of the product works. |
| `UPLOADS_DIR`       | no       | Directory for uploaded product photos. Defaults to `./uploads` next to the app. Set a persistent path on a VPS. | Photos land in `./uploads`, which is wiped on redeploy on most hosts. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | no | Razorpay API keys (test or live). | Billing page honestly shows checkout disabled; free plan limits still enforced. |
| `RAZORPAY_WEBHOOK_SECRET` | with payments | Secret entered when registering the webhook in the Razorpay dashboard. | Webhook events are rejected → renewals/cancellations never sync; only needed once payments are live. |
| `ALLOW_CONSOLE_OTP_IN_PRODUCTION` | no | Escape hatch: `true` prints login codes to the server console in production. | Nothing — leave it unset except for a one-off production smoke test before email is configured. |
| `PORT`              | no       | Port for `next start` / the standalone server. | Defaults to 3000. |

## Email OTP: Resend setup (SPF/DKIM)

Login codes are sent with [Resend](https://resend.com) (free tier: 100
emails/day — plenty for launch).

1. Create a Resend account and an API key → set `RESEND_API_KEY`.
2. **Verify your sending domain** (Resend dashboard → Domains → Add
   Domain). Resend shows you 2–3 DNS records to add at your DNS host:
   a TXT record for SPF and a `resend._domainkey` TXT record for DKIM
   (plus an optional DMARC record — add it). Propagation is usually
   minutes; the dashboard flips to **Verified**.
3. Set `EMAIL_FROM` to a sender on that domain, display-name included:
   `ApnaSite AI <login@yourdomain.in>`.
4. Until the domain is verified you can leave `EMAIL_FROM` unset — codes
   go out from Resend's shared test sender, but **only to the email of
   your own Resend account**, so it's for smoke-testing only.

---

## Path A: Vercel + Neon (recommended free tier)

Vercel hosts the Next.js app; [Neon](https://neon.tech) provides a free
serverless Postgres database. Neon's free tier (no credit card, ~0.5 GB) is the
best fit here because Vercel's serverless functions open/close database
connections constantly, and Neon is built for exactly that.

SQLite **cannot** be used on Vercel — the filesystem is wiped on every deploy
and is read-only at runtime. Switching to Postgres is a two-line change
(step 3).

### Step 1 — Push to GitHub

```bash
git remote add origin https://github.com/<you>/apnasite-ai.git
git push -u origin main
```

### Step 2 — Create the Neon database

1. Sign up at https://neon.tech (free tier).
2. Create a project (pick a region near your users, e.g. `ap-southeast-1`).
3. Copy the **connection string** it shows you — looks like
   `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.

### Step 3 — Switch Prisma from SQLite to Postgres

In `prisma/schema.prisma` change one word:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then create the tables on Neon from your laptop:

```bash
DATABASE_URL="postgresql://...your-neon-string..." npx prisma db push
```

Commit and push the schema change.

### Step 4 — Import into Vercel

1. Sign up at https://vercel.com with your GitHub account.
2. "Add New → Project" → pick the `apnasite-ai` repo. Vercel detects Next.js;
   keep all build defaults.
3. Under **Environment Variables** add:
   - `DATABASE_URL` = the Neon connection string
   - `ANTHROPIC_API_KEY` = your key (or leave unset for sample mode)
4. Deploy. Your app is at `https://<project>.vercel.app`.

### Step 5 — Fix product-photo uploads (required on Vercel)

Local-disk uploads **do not work on Vercel**: functions get a read-only
filesystem and every instance is thrown away after the request. Uploading will
return an error.

The fix is [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (free
tier: 1 GB), and the code is already structured so **only one file changes** —
`app/api/upload/route.ts`:

1. In the Vercel dashboard: Storage → Create → Blob. This auto-adds the
   `BLOB_READ_WRITE_TOKEN` env var to your project.
2. `npm install @vercel/blob`
3. In `app/api/upload/route.ts`, replace the two disk lines
   (`await mkdir(...)` / `await writeFile(...)`) with:

   ```ts
   import { put } from "@vercel/blob";
   // ...
   const blob = await put(name, buf, { access: "public", contentType: file.type });
   return NextResponse.json({ url: blob.url }, { status: 201 });
   ```

4. **Extend the image allowlist.** Published pages and the save-validation
   only accept image paths matching `/uploads/<name>` (`UPLOAD_PATH_RE` in
   `lib/types.ts` and `lib/renderSite.ts` — a hardening measure so saved
   site data can't inject arbitrary URLs). Blob returns absolute
   `https://….public.blob.vercel-storage.com/…` URLs, so add that host to
   both regexes or photos will be silently dropped from published sites.

(`app/uploads/[name]/route.ts`, which serves local-disk photos, simply stops
being used.)

### Vercel fine print

- **Rate limiting** (`lib/rateLimit.ts`) is in-memory per serverless instance,
  so limits are "per warm instance" rather than global. Fine at small scale;
  swap for a database-backed counter if abuse ever shows up.
- **OTP codes** appear in Vercel → Project → Logs until real email is wired.

---

## Path B: a cheap VPS with SQLite as-is

One small VM (Hetzner CX22 ≈ €4, DigitalOcean ≈ $6, or any Indian provider)
runs everything: Node, the SQLite file, and the uploaded photos on the same
disk. No code changes at all.

### Step 1 — Server basics

Any Ubuntu 22.04+ VPS. Install Node 20+:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2 — Get the app onto the server

```bash
sudo mkdir -p /srv/apnasite && sudo chown $USER /srv/apnasite
git clone https://github.com/<you>/apnasite-ai.git /srv/apnasite
cd /srv/apnasite
npm ci
```

### Step 3 — Configure

Create `/srv/apnasite/.env`:

```bash
DATABASE_URL="file:/var/lib/apnasite/apnasite.db"
UPLOADS_DIR="/var/lib/apnasite/uploads"
```

and `/srv/apnasite/.env.local` for the secret:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Putting the database and uploads under `/var/lib/apnasite` (not inside the repo
checkout) means `git pull` redeploys can never clobber your data:

```bash
sudo mkdir -p /var/lib/apnasite/uploads && sudo chown -R $USER /var/lib/apnasite
npx prisma db push          # creates the SQLite file + tables
```

### Step 4 — Build and run

```bash
npm run build
npm start                    # listens on port 3000
```

The build also produces a self-contained server in `.next/standalone`
(`output: "standalone"` in next.config.js) — same app, no `npm`/full
`node_modules` needed at runtime, which makes for a leaner service:

```bash
cp -r .next/static .next/standalone/.next/   # once per build
node .next/standalone/server.js
```

**Standalone caveat:** keep `DATABASE_URL` **absolute**
(`file:/var/lib/apnasite/apnasite.db`, as in Step 3). A relative
`file:./dev.db` resolves inside the standalone bundle, and the server
will quietly run against a fresh, empty database.

Keep it alive across reboots with a systemd unit,
`/etc/systemd/system/apnasite.service`:

```ini
[Unit]
Description=ApnaSite AI
After=network.target

[Service]
WorkingDirectory=/srv/apnasite
ExecStart=/usr/bin/npm start
Restart=always
User=youruser
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now apnasite
```

### Step 5 — HTTPS with Caddy (two lines)

```bash
sudo apt-get install -y caddy
```

`/etc/caddy/Caddyfile`:

```
yourdomain.in {
    reverse_proxy localhost:3000
}
```

`sudo systemctl reload caddy` — Caddy fetches and renews the TLS certificate
automatically. Point your domain's A record at the server IP first.

### Step 6 — Backups

Everything that matters is two things on disk. A nightly cron line covers it:

```bash
0 3 * * * tar czf /root/backup-$(date +\%u).tar.gz /var/lib/apnasite
```

### VPS fine print

- Login codes appear in `journalctl -u apnasite -f` until real email is wired.
- SQLite happily handles thousands of shops on one box; when you outgrow it,
  the "Swap SQLite for Postgres" recipe in [CUSTOMIZING.md](./CUSTOMIZING.md)
  is a one-word schema change plus one migration run.
