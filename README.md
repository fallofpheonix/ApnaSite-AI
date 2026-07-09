# ApnaSite AI

AI-powered website builder for Indian small businesses. Describe your shop in plain language (English, Hindi, or Hinglish) and get a complete, publishable website in seconds.

**Live demo:** Try it without login — click "Skip login — try demo site" on the homepage.

---

## Quick Start (any laptop)

### Prerequisites

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| **Node.js** | 22+ | `node -v` | `brew install node@22` (macOS) or [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | `npm -v` | Comes with Node.js |
| **Git** | any | `git --version` | `brew install git` or [git-scm.com](https://git-scm.com) |

### 1. Clone & install

```bash
git clone https://github.com/fallofpheonix/ApnaSite-AI.git
cd ApnaSite-AI
npm install
```

### 2. Set up database

```bash
npx prisma generate
npx prisma db push
```

This creates a local SQLite database at `prisma/dev.db`. No external database needed for development.

### 3. Configure API keys (optional)

Copy the example env file and add your keys:

```bash
cp .env .env.local
```

Edit `.env.local`:

```ini
# Required for AI site generation (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Required for email OTP login (get from https://resend.com)
RESEND_API_KEY=re_...

# Required for payments (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

**No keys? No problem.** The app works without any API keys:
- Use **"Skip login — try demo site"** to explore the editor instantly
- Use **"Start from Template"** to pick from 6 pre-built designs
- AI generation falls back to sample data when no Claude key is set

### 4. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## What You Can Do

### Without login (no API keys needed)
- Browse the UI and landing page
- Use the **demo mode** to load a sample storefront
- Pick from **6 templates** (bakery, restaurant, salon, cafe, grocery, clothing)
- Edit content in the visual editor
- Switch themes, undo/redo changes
- Publish sites (local only)

### With login (needs RESEND_API_KEY for OTP)
- Save multiple sites to your account
- Manage sites from the dashboard
- Edit sites after publishing
- View analytics, reviews, bookings, orders

### With full API keys
- AI-powered site generation from natural language
- Prompt-based editing ("change the tagline to...")
- AI marketing content (ad copy, email campaigns, social posts)
- Custom domain management

---

## Project Structure

```
apnasite-ai/
├── app/
│   ├── page.tsx                 # Home page + editor
│   ├── login/                   # Email OTP login
│   ├── billing/                 # Subscription management
│   ├── dashboard/               # Site management dashboard
│   ├── s/[slug]/                # Published site viewer
│   ├── api/
│   │   ├── generate/            # AI site generation
│   │   ├── prompt/              # AI prompt-based editing
│   │   ├── marketing/           # AI marketing content
│   │   ├── sites/               # CRUD for sites
│   │   ├── upload/              # Photo uploads
│   │   ├── reviews/             # Customer reviews
│   │   ├── appointments/        # Booking system
│   │   ├── orders/              # Order management
│   │   ├── contact/             # Contact form
│   │   ├── analytics/           # Pageview tracking
│   │   ├── domains/             # Custom domain management
│   │   ├── export/              # ZIP code export
│   │   ├── demo/                # Demo data (no auth)
│   │   └── auth/                # OTP login flow
│   └── uploads/                 # Served uploaded photos
├── components/                  # React components
├── lib/
│   ├── types.ts                 # StorefrontData type
│   ├── renderSite.ts            # Converts data → full HTML page
│   ├── anthropic.ts             # Claude API integration
│   ├── templates.ts             # 6 pre-built templates
│   ├── sampleData.ts            # Demo data (no API key)
│   ├── theme.ts                 # Theme system
│   ├── rateLimit.ts             # Redis/in-memory rate limiter
│   ├── uploads.ts               # S3/local disk uploads
│   ├── notifications.ts         # Email notification templates
│   ├── marketing.ts             # AI marketing content
│   ├── llm-router.ts            # Multi-LLM fallback
│   ├── export.ts                # ZIP export
│   └── auth.ts                  # Session management
├── prisma/
│   └── schema.prisma            # Database schema
├── uploads/                     # Local photo storage
└── public/                      # Static assets
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma 6 |
| AI | Claude (Anthropic SDK) |
| Auth | Email OTP via Resend |
| Payments | Razorpay |
| Storage | Local disk (dev) / S3 or Cloudflare R2 (prod) |
| Rate Limiting | Redis (prod) / in-memory (dev) |

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server (needs standalone setup)
npm run lint         # Run ESLint
npm run test         # Run tests (vitest)
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run seed         # Seed demo data
npm run cleanup      # Clean up old data
```

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment guide.

### Quick deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Quick deploy to a VPS

```bash
# On your server
git clone https://github.com/fallofpheonix/ApnaSite-AI.git
cd ApnaSite-AI
npm install
npx prisma generate
npx prisma db push

# Set env vars in .env.local
# Build and start
npm run build
node .next/standalone/server.js
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Prisma connection string. SQLite: `file:./dev.db` · Postgres: `postgresql://...` |
| `ANTHROPIC_API_KEY` | No | Claude API key for AI generation. Without it, demo/sample data is used. |
| `RESEND_API_KEY` | No | For email OTP login. Without it, demo login bypasses auth. |
| `RAZORPAY_KEY_ID` | No | Razorpay test/live key for subscriptions. |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret for payment verification. |
| `REDIS_URL` | No | Enables Redis-backed rate limiting. Falls back to in-memory. |
| `S3_ENDPOINT` | No | S3/R2 endpoint for cloud file storage. |
| `S3_BUCKET` | No | S3/R2 bucket name. |
| `S3_ACCESS_KEY` | No | S3/R2 access key. |
| `S3_SECRET_KEY` | No | S3/R2 secret key. |
| `S3_PUBLIC_URL` | No | Public URL for served files (e.g. `https://pub-xxx.r2.dev`). |

---

## Troubleshooting

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Database errors after schema change:**
```bash
npx prisma generate
npx prisma db push
```

**Build fails:**
```bash
rm -rf .next
npm run build
```

**AI generation not working:**
- Check that `ANTHROPIC_API_KEY` is set in `.env.local`
- Make sure the key starts with `sk-ant-`
- The app falls back to demo mode without a valid key

---

## License

Private — All rights reserved.
