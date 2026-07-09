# ApnaSite AI — Feature Documentation

> AI-powered website builder for Indian small businesses.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [AI Generation](#ai-generation)
5. [Visual Editor](#visual-editor)
6. [Theme System](#theme-system)
7. [Published Storefront](#published-storefront)
8. [E-Commerce](#e-commerce)
9. [Booking System](#booking-system)
10. [Customer Reviews](#customer-reviews)
11. [Contact Form](#contact-form)
12. [Analytics](#analytics)
13. [AI Marketing](#ai-marketing)
14. [AI Prompt Editor](#ai-prompt-editor)
15. [Template Library](#template-library)
16. [Demo Mode](#demo-mode)
17. [Dashboard](#dashboard)
18. [Billing & Payments](#billing--payments)
19. [Custom Domains](#custom-domains)
20. [Code Export](#code-export)
21. [Undo/Redo History](#undoredo-history)
22. [Text-to-Speech](#text-to-speech)
23. [Authentication](#authentication)
24. [API Reference](#api-reference)
25. [Database Schema](#database-schema)
26. [Deployment](#deployment)
27. [Environment Variables](#environment-variables)
28. [Tech Stack](#tech-stack)

---

## Overview

ApnaSite AI lets anyone create a professional website for their Indian small business by simply describing it in plain language (English, Hindi, or Hinglish). The AI generates a complete, themed website with products, contact info, reviews, booking, and e-commerce — all in seconds.

**What makes it different:**
- Works in Hindi and Hinglish, not just English
- Theme auto-matches business type (gym → dark theme, bakery → warm theme)
- Built-in booking, reviews, orders, and contact forms
- No technical knowledge required
- Free to start, affordable Pro plan

---

## Getting Started

### Quick Start (any laptop)

```bash
# 1. Clone
git clone https://github.com/fallofpheonix/ApnaSite-AI.git
cd ApnaSite-AI

# 2. Install
npm install

# 3. Database setup
npx prisma generate
npx prisma db push

# 4. Start
npm run dev
```

Open **http://localhost:3000** — click **"Skip login — try demo site"** to explore instantly.

### With API Keys (full AI features)

```bash
cp .env .env.local
# Edit .env.local and add:
# ANTHROPIC_API_KEY=sk-ant-...    (for AI generation)
# RESEND_API_KEY=re_...           (for email OTP login)
# RAZORPAY_KEY_ID=rzp_test_...    (for payments)
# RAZORPAY_KEY_SECRET=...
```

See [README.md](./README.md) for full setup instructions.

---

## Core Features

| Feature | Description | Requires |
|---------|-------------|----------|
| AI Site Generation | Describe business in natural language → get a complete website | Login + API key |
| Voice Input | Speak your business description (Hindi/English) | Browser mic access |
| 6 Pre-built Templates | Bakery, Restaurant, Salon, Cafe, Grocery, Clothing | Nothing |
| Demo Mode | Try the editor without login or API keys | Nothing |
| 14 Themes | Auto-matched to business type, switchable in editor | Nothing |
| Inline Editing | Click any text on the preview to edit it | Nothing |
| Photo Upload | Add product photos (JPEG/PNG/WebP, max 4 MB) | Login |
| Undo/Redo | 30-step history with Ctrl+Z / Ctrl+Shift+Z | Nothing |
| Dark/Light Mode | Toggle for the app UI (separate from storefront themes) | Nothing |
| Multi-language | Generate sites in English, Hindi, or Hinglish | Nothing |
| Publish to Web | Get a live URL (`/s/your-site-name`) | Login |
| Custom Slug | Choose your own URL path | Login |
| Mobile Responsive | All storefronts work on phones and desktops | Nothing |
| SEO Ready | OpenGraph, Twitter Cards, schema.org JSON-LD | Nothing |
| Crash Recovery | Auto-saves to localStorage, recovers on reload | Nothing |

---

## AI Generation

### How It Works

1. User describes their business (text or voice)
2. System detects language (English/Hindi/Hinglish)
3. Claude AI generates structured JSON with:
   - Shop name, tagline, category
   - About text, business hours
   - Products with descriptions and prices
   - Contact info (address, phone, WhatsApp, email)
   - FAQ items
   - Theme recommendation
4. Theme system matches category to a visual theme
5. Preview renders instantly with inline editing

### Generation Modes

| Mode | When | What Happens |
|------|------|-------------|
| **AI Generation** | Valid API key + login | Claude generates custom content |
| **Template** | No login needed | Pre-built data loaded into editor |
| **Demo** | No login, no API key | Sample general store data |
| **Sample Fallback** | No API key but logged in | Sample data with category detection |

### Progress Streaming

Generation uses Server-Sent Events (SSE) for real-time progress:
- `queued` → Job waiting in queue
- `processing` → AI call started (5%)
- `progress` → Intermediate update (50% - "Loading sample content...")
- `completed` → Done (100%)
- `failed` → Error with message
- `heartbeat` → Keepalive every 15 seconds

### Language Support

| Language | Speech Recognition | AI Prompt | Output |
|----------|-------------------|-----------|--------|
| English | `en-IN` | English system prompt | English storefront |
| Hindi | `hi-IN` | Hindi system prompt | Devanagari script, `lang="hi"` |
| Hinglish | `en-IN` | Hinglish system prompt | Latin script, Hindi words |

---

## Visual Editor

### What You Can Edit

Every text element in the storefront preview is clickable and editable:

- **Shop name** — main heading
- **Tagline** — subheading below name
- **Category** — business type (drives theme selection)
- **About text** — business description paragraph
- **Business hours** — operating hours
- **Address** — physical location
- **Phone number** — contact number
- **WhatsApp** — WhatsApp number (for click-to-chat)
- **Email** — contact email
- **Products** — name, description, price, SKU, stock for each
- **FAQ items** — question and answer pairs

### Product Management

- **Add product:** Click "Add Product" button
- **Remove product:** Click the × button on any product card
- **Photo upload:** Click the photo area → select file → auto-uploads
- **Pricing:** Leave empty for "contact for price" or enter a value
- **Inventory:** Set stock quantity and SKU for each product

### Photo Upload

- Formats: JPEG, PNG, WebP
- Max size: 4 MB
- Magic-byte verification (prevents disguised executables)
- Server-generated filenames (timestamp + random hex)
- Stored on local disk (dev) or S3/R2 (production)

---

## Theme System

### 14 Available Themes

| Theme | Style | Best For |
|-------|-------|----------|
| Warm Hearth | Light, warm cream, rust accent | Bakeries, cafes |
| Quiet Bloom | Light, blush pink, plum accent | Salons, beauty |
| Site Ready | Light, kraft, safety orange | Hardware, tools |
| Evening Table | Light, warm white, wine | Restaurants |
| Fresh Market | Light, mint, orange | Grocery stores |
| Clear Care | Light, clinical green | Pharmacies, clinics |
| Studio Line | Light, ecru, gold | Clothing stores |
| Utsav Rose | Light, rose cream, deep rose | Sweet shops |
| Rozana | Light, turmeric, leaf green | Kirana stores |
| Measured Thread | Light, linen, spruce | Tailors |
| Gilded Velvet | **Dark**, deep plum, gold | Jewellery stores |
| Iron Pulse | **Dark**, charcoal, lime | Gyms, fitness |
| Copybook | Light, aged paper, indigo | Tuition centres |
| Signal | Light, showroom white, blue | Electronics |

### Auto-Matching

The AI detects your business type from the description and selects the best theme. Keywords like "gym", "bakery", "salon" trigger specific themes. You can override the theme manually in the editor.

### Theme Application

Each theme defines:
- **Colors:** Background, text, accent, card, border (8 color values)
- **Fonts:** Display font (headings) + body font (text)
- **Style:** Light or dark mode, italic accents or not

---

## Published Storefront

### What's Included

When you publish a site at `/s/your-slug`, visitors see:

- **Hero section** — Category badge, shop name, tagline, WhatsApp/Call buttons
- **About section** — Business description
- **Hours section** — Operating hours
- **Products section** — Photo cards with descriptions and prices
- **Reviews section** — Customer reviews (approved only)
- **FAQ section** — Accordion-style frequently asked questions
- **Contact form** — Name, email, phone, message
- **Booking form** — Service, date, time, notes
- **Cart/Checkout** — If products have prices (COD payments)
- **Analytics beacon** — Tracks pageviews automatically
- **TTS button** — Text-to-speech for accessibility
- **Google Maps** — Embeds map if address is provided
- **Schema.org** — LocalBusiness structured data for SEO
- **Meta tags** — OpenGraph and Twitter Card support

### Responsive Design

All storefronts are fully responsive:
- Mobile-first layout
- Floating cart button on mobile
- Collapsible navigation
- Touch-friendly buttons (44px minimum)

---

## E-Commerce

### Product Setup

1. Add products in the editor with name, description, and price
2. Upload product photos
3. Set stock quantity and SKU (optional)
4. Publish the site

### Shopping Cart

- **Add to Cart** button appears on products with prices
- Floating cart button shows item count
- Cart dropdown with item list, quantities, and total
- **Checkout form** collects: name, email, phone, address, payment method
- Supports **Cash on Delivery (COD)**

### Order Management

From the dashboard:
- View all orders with status (pending/confirmed/delivered/cancelled)
- Filter by status
- Confirm, deliver, or cancel orders
- See total revenue and order count

---

## Booking System

### For Customers

- Service selection (text input with suggestions)
- Date picker (no past dates)
- Time picker
- Optional notes
- Validation prevents double-booking

### For Business Owners

- View all bookings with status (pending/confirmed/cancelled)
- Filter by status
- Confirm or cancel bookings
- See upcoming booking count

---

## Customer Reviews

### Submission

- Public form on published storefronts
- Fields: name, rating (1-5 stars), comment
- Reviews start as **pending** (not publicly visible)

### Moderation

From the dashboard:
- See total reviews, pending count, average rating
- Approve or reject individual reviews
- Delete reviews
- Only approved reviews show on the public site

---

## Contact Form

### On Published Sites

- Fields: name (required), email (required), phone (optional), message (required)
- Rate limited: 5 messages per IP per hour
- Messages stored in database
- Form shows success/error feedback inline

### In Dashboard

Contact messages can be viewed and managed from the site dashboard.

---

## Analytics

### Tracking

- Analytics beacon on published sites tracks every pageview
- Records: path, referrer, user agent, IP, timestamp
- Unique visitor tracking (by IP)

### Dashboard View

- **Total views** — all-time pageviews
- **Unique visitors** — distinct IPs
- **Views today** — today's count
- **Views this week** — last 7 days
- **Daily chart** — 30-day bar chart
- **Top pages** — most visited paths
- **Top referrers** — where visitors come from

---

## AI Marketing

### Content Types

| Type | Platforms | What It Generates |
|------|-----------|-------------------|
| **Ad Copy** | Facebook, Google, Instagram | Headlines, primary text, descriptions, CTA |
| **Email Campaign** | Welcome, Promotion, Announcement | Subject line, preview text, body, CTA |
| **Social Post** | Instagram, Facebook, Twitter | Caption, hashtags, engagement hooks |

### How It Works

1. Select content type and platform/goal
2. AI reads your storefront data (name, products, tagline)
3. Generates platform-optimized content
4. Copy to clipboard with one click

---

## AI Prompt Editor

### Natural Language Editing

Type instructions like:
- "Change the tagline to 'Best coffee in town'"
- "Add a product: Cold Brew, ₹200"
- "Remove the address section"
- "Change the theme to dark mode"

### How It Works

1. User types instruction in chat interface
2. Current site data sent to Claude as context
3. Claude generates a JSON patch (partial update)
4. Patch merged with existing data
5. Changes saved and preview updated

---

## Template Library

### 6 Pre-built Templates

| Template | Category | Products |
|----------|----------|----------|
| Sweet Bakery | Bakery | Sourdough Loaf, Chocolate Cake, Butter Croissant |
| Spice Garden | Restaurant | Butter Chicken, Paneer Tikka, Biryani |
| Glow Studio | Hair Salon | Haircut & Styling, Hair Colour, Beard Grooming |
| The Brew House | Cafe | Cappuccino, Avocado Toast, Cold Brew |
| Fresh Mart | Grocery Store | Fresh Vegetables, Organic Fruits, Dairy & Eggs |
| Thread & Style | Clothing Store | Classic Cotton Tee, Denim Jacket, Linen Shirt |

### Using Templates

1. Click "Start from Template" on the home page
2. Browse and select a template
3. Click "Use This Template"
4. Editor opens with pre-filled data
5. Customize everything as usual

---

## Demo Mode

### What Works Without Login/API Keys

- Browse the home page and UI
- Click "Skip login — try demo site" → loads sample storefront
- Pick from 6 templates → loads template data
- Edit all content in the visual editor
- Switch themes
- Undo/redo changes
- Publish sites (local only)

### What Requires Login

- Save multiple sites
- Dashboard with site management
- Photo uploads
- AI generation (with API key)
- Prompt-based editing
- Marketing content generation
- Analytics, reviews, bookings, orders

---

## Dashboard

### Site List (`/dashboard`)

- All your sites with name, published status, slug, last updated
- Actions: Edit, Manage, Publish/Unpublish, Delete
- Site count and live count

### Site Management (`/dashboard/[siteId]`)

8 tabs for managing a published site:

| Tab | What It Shows |
|-----|--------------|
| **Analytics** | Views, visitors, charts, top pages |
| **AI Editor** | Chat interface for natural language edits |
| **Marketing** | Generate ad copy, emails, social posts |
| **Reviews** | View and moderate customer reviews |
| **Bookings** | Manage appointment requests |
| **Orders** | Manage customer orders |
| **Domains** | Add/verify custom domains |
| **Export** | Download ZIP with self-contained HTML |

---

## Billing & Payments

### Plans

| Plan | Price | Published Sites | Badge |
|------|-------|-----------------|-------|
| **Free** | ₹0/month | 1 | "Made with ApnaSite" shown |
| **Pro** | ₹199/month | 5 | No badge |

### Features

- All themes and editing available on Free
- Pro removes the badge and allows 5 published sites
- Razorpay Checkout for payments
- Subscription management (cancel anytime)
- 3-day grace period on renewal

---

## Custom Domains

### Adding a Domain

1. Go to Domains tab in site dashboard
2. Enter your domain (e.g., `myshop.com`)
3. Get a verification token
4. Add DNS record (simulated in dev)
5. Click Verify

### Status

- **Pending** — awaiting DNS verification
- **Verified** — domain is active

---

## Code Export

### ZIP Download

Click "Export" in the site dashboard to download:
- `index.html` — self-contained HTML file (all CSS inline)
- `README.txt` — hosting instructions

### Features of Exported HTML

- Complete storefront with theme colors and fonts
- Google Fonts loaded via `<link>`
- Products, about, hours, contact, FAQ
- OpenGraph and Twitter Card meta tags
- LocalBusiness JSON-LD
- No analytics, no cart, no forms (pure static)
- No "Made with ApnaSite" badge

### Hosting

Upload `index.html` to any static host:
- Netlify, Vercel, GitHub Pages
- Any web server (Apache, Nginx)
- Even open directly in a browser

---

## Undo/Redo History

### How It Works

- Editor maintains a history stack of 30 states
- Every edit creates a new history entry
- **Undo:** Ctrl+Z (Cmd+Z on Mac) or click undo button
- **Redo:** Ctrl+Shift+Z (Cmd+Shift+Z on Mac) or click redo button
- History clears when you "Start Over"

---

## Text-to-Speech

### On Published Sites

- Click the speaker icon to hear the page content
- Uses Web Speech API (browser-native)
- Language-aware (Hindi text → Hindi voice, English → English voice)
- Cancel and restart on second click
- Reads: shop name, tagline, about text, products, hours

---

## Authentication

### OTP Login Flow

1. Enter email address
2. Receive 6-digit code (via Resend email, or console in dev)
3. Enter code → session created
4. Session lasts 30 days (cookie-based)

### Security

- OTP codes stored as SHA-256 hashes (never plaintext)
- Timing-safe comparison prevents timing attacks
- Max 5 verification attempts per code
- Codes expire after 10 minutes
- CSRF middleware on all API POST/PUT/PATCH/DELETE

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/request-otp` | POST | Send login code to email |
| `/api/auth/verify-otp` | POST | Verify code, create session |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Destroy session |

### Sites

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites` | GET | List user's sites |
| `/api/sites` | POST | Create new site |
| `/api/sites/[id]` | GET | Load site data |
| `/api/sites/[id]` | PUT | Save edits |
| `/api/sites/[id]` | DELETE | Delete site |
| `/api/sites/[id]` | PATCH | Update slug/schedule |
| `/api/sites/[id]/publish` | POST | Publish site |
| `/api/sites/[id]/unpublish` | POST | Unpublish site |

### AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Start AI generation |
| `/api/generate/[jobId]` | GET | SSE progress stream |
| `/api/generate/[jobId]` | DELETE | Cancel generation |
| `/api/prompt` | POST | AI prompt-based edit |
| `/api/marketing` | POST | Generate marketing content |

### Content

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews` | GET/POST/PATCH/DELETE | Reviews CRUD |
| `/api/appointments` | GET/POST/PATCH | Bookings CRUD |
| `/api/orders` | GET/POST/PATCH | Orders CRUD |
| `/api/contact` | POST | Submit contact message |
| `/api/analytics` | GET/POST | Analytics data |
| `/api/domains` | GET/POST/PATCH/DELETE | Custom domains |
| `/api/upload` | POST | Photo upload |
| `/api/export/[siteId]` | GET | ZIP download |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/demo` | GET | Sample storefront data |
| `/api/billing` | GET | Billing info |
| `/api/billing/subscribe` | POST | Create subscription |
| `/api/billing/verify` | POST | Verify payment |
| `/api/billing/webhook` | POST | Razorpay webhook |

### Public

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/s/[slug]` | GET | Published storefront |
| `/uploads/[name]` | GET | Uploaded photos |

---

## Database Schema

### Models

| Model | Purpose |
|-------|---------|
| `User` | User accounts (email, sessions, sites) |
| `Session` | Login sessions (token, 30-day TTL) |
| `OtpCode` | OTP verification codes (hashed, 10-min TTL) |
| `Site` | Website data (name, data JSON, slug, published) |
| `Subscription` | Razorpay subscriptions (status, plan, period) |
| `Pageview` | Analytics events (path, referrer, IP) |
| `Review` | Customer reviews (rating, comment, approved) |
| `Appointment` | Booking requests (date, time, status) |
| `Order` | Customer orders (items, total, status) |
| `Domain` | Custom domains (domain, verified) |
| `Notification` | Email logs (type, recipient, status) |
| `ContactMessage` | Contact form submissions |
| `WebhookEvent` | Razorpay webhook dedup |

### Key Relationships

```
User ──┬── Session[]
       ├── Site[] ──┬── Pageview[]
       │            ├── Review[]
       │            ├── Appointment[]
       │            ├── Order[]
       │            ├── Domain[]
       │            ├── Notification[]
       │            └── ContactMessage[]
       └── Subscription?
```

---

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
# Set env vars in Vercel dashboard
```

### VPS (DigitalOcean, AWS, etc.)

```bash
git clone https://github.com/fallofpheonix/ApnaSite-AI.git
cd ApnaSite-AI
npm install
npx prisma generate && npx prisma db push
npm run build
node .next/standalone/server.js
```

### Docker (future)

Not yet configured, but the standalone output works with any Node.js container.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | Prisma connection string |
| `ANTHROPIC_API_KEY` | No | — | Claude API key for AI generation |
| `RESEND_API_KEY` | No | — | Email OTP delivery |
| `RAZORPAY_KEY_ID` | No | — | Razorpay test/live key |
| `RAZORPAY_KEY_SECRET` | No | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | No | — | Razorpay webhook HMAC secret |
| `REDIS_URL` | No | — | Redis for rate limiting |
| `S3_ENDPOINT` | No | — | S3/R2 endpoint |
| `S3_BUCKET` | No | — | S3/R2 bucket |
| `S3_ACCESS_KEY` | No | — | S3/R2 access key |
| `S3_SECRET_KEY` | No | — | S3/R2 secret key |
| `S3_PUBLIC_URL` | No | — | Public URL for uploads |
| `UPLOADS_DIR` | No | `./uploads` | Local upload directory |
| `PORT` | No | `3000` | Server port |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 |
| UI | React 19, Tailwind CSS 3.4 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma 6.19 |
| AI | Claude (Anthropic SDK) |
| Auth | Email OTP via Resend |
| Payments | Razorpay |
| Storage | Local disk / S3 / Cloudflare R2 |
| Rate Limiting | Redis (ioredis) / in-memory |
| Email | Resend REST API |
| Fonts | Google Fonts (next/font) |
| 3D | Three.js (particle background) |
| Testing | Vitest |

---

## Security

- CSRF middleware on all API POST/PUT/PATCH/DELETE
- OTP codes hashed with SHA-256 (never stored plaintext)
- Timing-safe comparison for OTP verification
- Session cookies: httpOnly, sameSite=lax, secure in production
- Server-generated upload filenames (no client path traversal)
- Magic-byte image validation (prevents disguised executables)
- Rate limiting on all public endpoints
- Razorpay webhook HMAC signature verification
- Input validation on all API endpoints
- Max limits: 25 sites/user, 2000 chars description, 40 products, 20 FAQ items

---

## Internationalization

- Three output languages: English, Hindi (Devanagari), Hinglish (Latin)
- Hindi content gets `lang="hi"` on the HTML element
- Devanagari fallback fonts in every font stack
- Speech recognition: `hi-IN` for Hindi, `en-IN` for English/Hinglish
- AI system prompts adapted per language

---

*Last updated: July 2026*
