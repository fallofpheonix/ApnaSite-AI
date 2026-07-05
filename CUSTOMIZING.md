# Customizing ApnaSite AI

Concrete recipes for the changes you're most likely to want. Each one names
the exact files and shows the code. For the deployment side of things see
[DEPLOY.md](./DEPLOY.md); for the overall map see
[ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Add a new theme

Themes live in **`lib/theme.ts`**. Each is a full color + typography pairing,
picked by matching keywords in the AI-returned `category` string.

**Step 1 — add the theme** to the `THEMES` record:

```ts
// lib/theme.ts
florist: {
  id: "florist",
  label: "Garden Fresh",
  fontDisplayName: "Cormorant",   // must be a family lib/fonts.ts already loads
  fontBodyName: "Karla",
  displayItalicAccent: true,
  bg: "#F0F6EE",
  bgAlt: "#DDEBD8",
  text: "#22301E",
  textMuted: "#5F7457",
  accent: "#B0447A",
  accentDeep: "#8E3562",
  accentText: "#FFFFFF",
  cardBg: "#FFFFFF",
  border: "#C8DCC0",
},
```

**Step 2 — route categories to it** in `KEYWORD_MAP` (same file). Order
matters: more specific patterns go higher.

```ts
[/florist|flower|phool|bouquet|mala/i, "florist"],
```

That's it for existing fonts. **If the theme needs a new Google Font**, also
touch **`lib/fonts.ts`** in three places: add a `next/font/google` export like
the others, add it to `fontVariableClassNames` and `FONT_VAR_BY_NAME` (live
preview), and add the family to `GOOGLE_FONTS_HREF` (published static HTML).

Test without an API key by typing a description containing your keyword
("mera flower shop hai...") — sample mode runs the same keyword matcher.

---

## 2. Change the AI prompt

Everything Claude-related is in **`lib/anthropic.ts`**:

- `BASE_SYSTEM_PROMPT` — the tone/behavior instructions ("warm, credible,
  non-generic copy", never invent facts, tolerate messy voice transcripts).
  Edit this to change the writing style of every generated site.
- `LANGUAGE_INSTRUCTIONS` — the per-language addendum (en / hi / hinglish).
  Add a language here **and** to `Language` in `lib/types.ts` +
  `LANGUAGE_LABELS` there (the UI pills pick that up automatically).
- `STOREFRONT_SCHEMA` — the JSON schema Claude must return. The
  `description` strings inside it are prompt material too: e.g. tightening
  `tagline`'s "under 10 words" is a schema-description edit, not a system
  prompt edit.
- The model id and effort live in the `client.messages.create({...})` call.

No API key? `lib/sampleData.ts` is what runs instead — if you change the
*shape* of the output (see recipe 3), update the samples there too.

---

## 3. Add a new field to generated sites (e.g. Instagram link)

Five files, in data-flow order. Example: `instagram`.

**`lib/types.ts`** — the shared shape:

```ts
export interface StorefrontData {
  // ...existing fields...
  instagram: string | null;
}
// and add `instagram: null` to EMPTY_STOREFRONT
```

**`lib/anthropic.ts`** — teach Claude to extract it, in `STOREFRONT_SCHEMA`:

```ts
instagram: {
  anyOf: [{ type: "string" }, { type: "null" }],
  description: "Instagram handle or URL if mentioned, otherwise null.",
},
// and add "instagram" to the schema's `required` array
```

**`lib/sampleData.ts`** — add `instagram: null` (or a sample handle) to each
of the three `SAMPLES` entries so sample mode matches the new shape.

**`components/StorefrontPreview.tsx`** — make it editable. The contact
section already has a `ContactRow` helper, so it's one line:

```tsx
<ContactRow icon="📸" value={data.instagram} onChange={(v) => update("instagram", v || null)} placeholder="Add Instagram" />
```

**`lib/renderSite.ts`** — show it on the published site, next to the other
contact rows:

```ts
${data.instagram ? `<p>&#128248; <a href="https://instagram.com/${esc(data.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener">@${esc(data.instagram.replace(/^@/, ""))}</a></p>` : ""}
```

Old saved sites simply have the field `undefined` — every renderer treats
missing as "don't show", so no migration is needed.

---

## 4. Change rate limits

The limiter itself is **`lib/rateLimit.ts`** (fixed-window, in-memory — the
comment there explains its single-process scope). The actual numbers live at
each call site:

| Route                            | Current limits                                        |
| -------------------------------- | ----------------------------------------------------- |
| `app/api/generate/route.ts`      | 10 / user / 5 min **and** 20 / IP / 5 min              |
| `app/api/upload/route.ts`        | 30 / user / 5 min **and** 60 / IP / 5 min              |
| `app/api/auth/request-otp/route.ts` | 3 / email / 10 min **and** 10 / IP / 10 min          |

Each is a plain call you can retune in place, e.g. in `generate`:

```ts
const byUser = rateLimit(`generate:user:${user.id}`, 10, 5 * 60 * 1000);
//                                  limit ↑   window ↑
```

---

## 5. Change plan prices or limits

Everything plan-related lives in **`lib/plans.ts`** — one file, one table:

```ts
pro: {
  key: "pro",
  name: "Pro",
  priceInr: 199,            // ← change the monthly price here (₹)
  maxPublishedSites: 5,     // ← and the publish limit here
  showBadge: false,         // whether published sites carry the ApnaSite badge
  perks: [...],             // bullets shown on /billing
},
```

Consumers all read from this table: the publish-limit check
(`app/api/sites/[id]/publish/route.ts`), the badge decision
(`app/s/[slug]/route.ts` → `lib/renderSite.ts`), the /billing page, and the
Razorpay plan that gets created (`lib/razorpay.ts` sends `priceInr * 100`
paise and tags the plan with the price in `notes`). Because the Razorpay plan
is matched by those notes, changing the price simply causes a new Razorpay
plan to be created on the next upgrade — existing subscribers keep their old
price until they cancel.

Adding a third tier = add a key to `PLANS`, and it appears on /billing
automatically; only `planForUser()`'s `PLANS[sub.planKey]` lookup ties a
subscription row to a tier.

---

## 6. How the payment webhook flow works

Three requests are involved in an upgrade, and it helps to know which one is
"real":

1. **`POST /api/billing/subscribe`** — the server creates a Razorpay
   subscription in `created` state and stores a Subscription row (also
   `created` — grants nothing). The browser opens Razorpay Checkout with the
   returned id.
2. **`POST /api/billing/verify`** — when Checkout reports success, the
   browser sends Razorpay's `payment_id`/`subscription_id`/`signature`
   triplet. The server recomputes `HMAC-SHA256(payment_id + "|" +
   subscription_id, RAZORPAY_KEY_SECRET)` and, on match, flips the row to
   `active` so the user gets Pro instantly. This is a UX nicety — a closed
   browser tab would miss it.
3. **`POST /api/billing/webhook`** — the authoritative channel. Razorpay's
   servers call it directly on every lifecycle event (activation, each
   monthly charge, failed-payment halt, cancellation). The handler verifies
   `X-Razorpay-Signature` = HMAC-SHA256 of the **raw body** with
   `RAZORPAY_WEBHOOK_SECRET`, then maps the event to a status via
   `STATUS_BY_EVENT` in `app/api/billing/webhook/route.ts`. Wrong signature →
   401, nothing written. Unknown events → 200 `{ignored}` (Razorpay retries
   non-2xx, so acknowledging is deliberate).

`planForUser()` (lib/plans.ts) treats only `active`/`authenticated` as paid —
so a `halted` subscription (card started failing) automatically drops the
user to free-plan rules without any extra code.

To test locally without real keys: run the server with
`RAZORPAY_WEBHOOK_SECRET=<anything>` and POST a payload signed with the same
secret — see the session notes or Razorpay's webhook docs for payload shape.

---

## 7. Swap SQLite for Postgres

Prisma abstracts nearly everything; the app code never mentions SQLite.

1. **`prisma/schema.prisma`** — one word:

   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **`.env`** — point at the server:

   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/apnasite"
   ```

3. Create the tables: `npx prisma db push`

Optional nicety: on Postgres, `Site.data` could become a native `Json` column
instead of `String`. Then also drop the `JSON.parse`/`JSON.stringify` pairs in
`app/api/sites/route.ts`, `app/api/sites/[id]/route.ts` and
`app/s/[slug]/route.ts`. Keeping it as `String` also works fine — do the
column change only if you want queryable JSON.

Existing SQLite data is not migrated automatically; for a prototype the
simplest path is to let users re-create sites, or write a one-off script that
reads rows from the old file and `create()`s them against the new URL.

---

## 8. Email OTP delivery (built in — Resend)

Real email delivery ships with the app: **`lib/email.ts`** talks to the
Resend REST API directly (no SDK), and `requestOtp()` in **`lib/auth.ts`**
picks the delivery mode from the environment:

- `RESEND_API_KEY` set → branded OTP email (sender from `EMAIL_FROM`)
- unset in dev → the code prints to the server console
- unset in production → login fails closed (503), never silently

Setup (API key, domain verification, SPF/DKIM) is in DEPLOY.md §"Email
OTP". To swap Resend for another provider, replace `sendOtpEmail()` in
`lib/email.ts` — hashing, expiry (10 min), attempt limits (5) and the
session cookie all stay untouched. The email's look is `otpEmailHtml()`
in the same file (table-based, inline-styled, Bazaar Warmth colors).
