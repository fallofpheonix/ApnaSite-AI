# Deploying VoxSite AI

This guide gets VoxSite from your laptop onto the internet. Two paths, from
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

| Variable            | Required | What it is                                                                                            |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | yes      | Prisma connection string. SQLite: `file:./dev.db` · Postgres: `postgresql://user:pass@host/db`         |
| `ANTHROPIC_API_KEY` | no       | Claude API key. Without it the app runs in **sample mode** (placeholder content instead of real AI).   |
| `UPLOADS_DIR`       | no       | Directory for uploaded product photos. Defaults to `./uploads` next to the app. Set it to a persistent path on a VPS. |

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
git remote add origin https://github.com/<you>/voxsite-ai.git
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
2. "Add New → Project" → pick the `voxsite-ai` repo. Vercel detects Next.js;
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

That's it — the editor and the published sites treat the photo URL as opaque,
so blob URLs flow through unchanged. (`app/uploads/[name]/route.ts`, which
serves local-disk photos, simply stops being used.)

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
sudo mkdir -p /srv/voxsite && sudo chown $USER /srv/voxsite
git clone https://github.com/<you>/voxsite-ai.git /srv/voxsite
cd /srv/voxsite
npm ci
```

### Step 3 — Configure

Create `/srv/voxsite/.env`:

```bash
DATABASE_URL="file:/var/lib/voxsite/voxsite.db"
UPLOADS_DIR="/var/lib/voxsite/uploads"
```

and `/srv/voxsite/.env.local` for the secret:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Putting the database and uploads under `/var/lib/voxsite` (not inside the repo
checkout) means `git pull` redeploys can never clobber your data:

```bash
sudo mkdir -p /var/lib/voxsite/uploads && sudo chown -R $USER /var/lib/voxsite
npx prisma db push          # creates the SQLite file + tables
```

### Step 4 — Build and run

```bash
npm run build
npm start                    # listens on port 3000
```

Keep it alive across reboots with a systemd unit,
`/etc/systemd/system/voxsite.service`:

```ini
[Unit]
Description=VoxSite AI
After=network.target

[Service]
WorkingDirectory=/srv/voxsite
ExecStart=/usr/bin/npm start
Restart=always
User=youruser
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now voxsite
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
0 3 * * * tar czf /root/backup-$(date +\%u).tar.gz /var/lib/voxsite
```

### VPS fine print

- Login codes appear in `journalctl -u voxsite -f` until real email is wired.
- SQLite happily handles thousands of shops on one box; when you outgrow it,
  the "Swap SQLite for Postgres" recipe in [CUSTOMIZING.md](./CUSTOMIZING.md)
  is a one-word schema change plus one migration run.
