import type { StorefrontData } from "./types";
import { scriptLangFor } from "./types";
import { themeForSite } from "./theme";
import { GOOGLE_FONTS_HREF, staticFontStack } from "./fonts";

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsString(value: string | null | undefined): string {
  return JSON.stringify(value ?? "").replace(/</g, "\\u003c");
}

function priceAmount(price: string | null | undefined): number | null {
  if (!price) return null;
  const normalized = price.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!normalized) return null;
  const amount = Number(normalized[0]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

const UPLOAD_PATH_RE = /^\/uploads\/[0-9]+-[a-f0-9]+\.(jpg|png|webp)$/;

function safeImageSrc(src: string | null | undefined): string | null {
  return src && UPLOAD_PATH_RE.test(src) ? src : null;
}

// wa.me links require a country code. Most owners will type a bare 10-digit
// Indian mobile number, so those get the +91 prefix; anything longer is
// assumed to already carry its country code.
const WA_DEFAULT_COUNTRY_CODE = "91";

function waLink(whatsapp: string): string | null {
  let digits = whatsapp.replace(/[^0-9]/g, "");
  if (digits.length === 10) digits = WA_DEFAULT_COUNTRY_CODE + digits;
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

/** tel: URIs must not contain spaces or dashes — keep digits and a leading +. */
function telLink(phone: string): string | null {
  const plus = phone.trim().startsWith("+") ? "+" : "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 6 || digits.length > 15) return null;
  return `tel:${plus}${digits}`;
}

function mailLink(email: string): string | null {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return `mailto:${encodeURIComponent(trimmed)}`;
}

/** Meta description: the tagline if present, else the about text, clamped so
 * search results and WhatsApp link previews don't show a truncated wall. */
function metaDescription(data: StorefrontData): string {
  const raw = (data.tagline || data.aboutText || "").trim().replace(/\s+/g, " ");
  return raw.length > 160 ? raw.slice(0, 157).trimEnd() + "..." : raw;
}

export interface RenderOptions {
  /** Absolute URL of this page (for og:url and absolutizing og-image).
   * Without it the og tags that need absolute URLs are omitted. */
  pageUrl?: string;
  /** Free-plan sites carry a small "Made with ApnaSite" footer badge linking
   * back to the app (see lib/plans.ts). Pro sites render no branding. */
  showBadge?: boolean;
  /** Server-rendered reviews section. Each review must be approved. */
  reviews?: Array<{ author: string; rating: number; comment: string; createdAt: string }>;
  /** List of service names for the appointment booking form suggestions. */
  appointmentServices?: string[];
  /** Enable client-side order/cart functionality if products have prices. */
  enableOrders?: boolean;
}

export function renderStorefrontHTML(data: StorefrontData, options: RenderOptions = {}): string {
  const theme = themeForSite(data);
  const fontDisplay = staticFontStack(theme.fontDisplayName, "display");
  const fontBody = staticFontStack(theme.fontBodyName, "body");
  const htmlLang = scriptLangFor(data.language);

  const productsHTML = data.products
    .map((p) => {
      const image = safeImageSrc(p.image);
      const amount = priceAmount(p.price);
      const cartBtn =
        options.enableOrders && amount
          ? `<button class="add-to-cart-btn" data-name="${esc(p.name)}" data-price-label="${esc(p.price || "")}" data-price-amount="${amount}">Add to Cart</button>`
          : "";
      return `
        <div class="product-card">
          ${image ? `<img class="product-photo" src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" />` : ""}
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description)}</p>
          ${p.price ? `<span class="price">${esc(p.price)}</span>` : ""}
          ${cartBtn}
        </div>`;
    })
    .join("\n");

  // Social-preview tags so a link shared on WhatsApp shows the shop name,
  // description and (when available) the first product photo.
  const description = metaDescription(data);
  let origin: string | null = null;
  let canonicalUrl: string | null = null;
  try {
    if (options.pageUrl) {
      const u = new URL(options.pageUrl);
      origin = u.origin;
      canonicalUrl = u.origin + u.pathname; // no query — one canonical per site
    }
  } catch {
    // Malformed pageUrl (odd proxy header) — skip absolute og tags, render on.
  }
  const firstPhoto = data.products.map((p) => safeImageSrc(p.image)).find(Boolean);
  const ogImage = firstPhoto && origin ? new URL(firstPhoto, origin).href : null;
  const ogTags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(data.shopName)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:site_name" content="${esc(data.shopName)}" />`,
    canonicalUrl ? `<link rel="canonical" href="${esc(canonicalUrl)}" />` : "",
    canonicalUrl ? `<meta property="og:url" content="${esc(canonicalUrl)}" />` : "",
    ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : "",
    `<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />`,
  ]
    .filter(Boolean)
    .join("\n");

  // LocalBusiness structured data for search engines — only fields the owner
  // actually filled in. Free-text values (address, hours) stay free text:
  // schema.org accepts Text for both. "<" is escaped so user content can
  // never break out of the script tag.
  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.shopName,
  };
  if (description) localBusiness.description = description;
  if (data.address) localBusiness.address = data.address;
  if (data.phone) localBusiness.telephone = data.phone;
  if (data.email) localBusiness.email = data.email;
  if (data.hours) localBusiness.openingHours = data.hours;
  if (canonicalUrl) localBusiness.url = canonicalUrl;
  if (ogImage) localBusiness.image = ogImage;
  const jsonLd = JSON.stringify(localBusiness).replace(/</g, "\\u003c");

  const whatsappLink = data.whatsapp ? waLink(data.whatsapp) : null;
  const phoneLink = data.phone ? telLink(data.phone) : null;
  const emailLink = data.email ? mailLink(data.email) : null;
  const mapSrc = data.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&output=embed`
    : null;
  const contactButtons = [
    whatsappLink
      ? `<a class="btn btn-primary" href="${esc(whatsappLink)}" target="_blank" rel="noopener">Message on WhatsApp</a>`
      : "",
    phoneLink ? `<a class="btn btn-outline" href="${esc(phoneLink)}">Call ${esc(data.phone)}</a>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(data.shopName)}${data.tagline ? ` — ${esc(data.tagline)}` : ""}</title>
<meta name="description" content="${esc(description)}" />
${ogTags}
<script type="application/ld+json">${jsonLd}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${GOOGLE_FONTS_HREF}" />
<style>
  :root {
    --bg: ${theme.bg};
    --bg-alt: ${theme.bgAlt};
    --text: ${theme.text};
    --text-muted: ${theme.textMuted};
    --accent: ${theme.accent};
    --accent-deep: ${theme.accentDeep};
    --accent-text: ${theme.accentText};
    --card-bg: ${theme.cardBg};
    --border: ${theme.border};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: ${fontBody};
    line-height: 1.6;
  }
  h1, h2, h3 { font-family: ${fontDisplay}; margin: 0 0 0.5rem; }
  .wrap { max-width: 880px; margin: 0 auto; padding: 0 1.5rem; }
  header.hero {
    background: var(--bg-alt);
    padding: 4rem 0 3rem;
    text-align: center;
    border-bottom: 1px solid var(--border);
  }
  .badge {
    display: inline-block;
    background: var(--accent);
    color: var(--accent-text);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    margin-bottom: 1rem;
  }
  .hero h1 { font-size: 2.75rem; }
  .hero .tagline {
    font-family: ${fontDisplay};
    font-style: ${theme.displayItalicAccent ? "italic" : "normal"};
    font-size: 1.25rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }
  .btn {
    display: inline-block;
    padding: 0.85rem 1.75rem;
    border-radius: 0.6rem;
    font-weight: 600;
    text-decoration: none;
    margin: 0.35rem;
    font-size: 1rem;
  }
  .btn-primary { background: var(--accent); color: var(--accent-text); }
  .btn-outline { background: transparent; color: var(--text); border: 1.5px solid var(--border); }
  section { padding: 3rem 0; }
  section.alt { background: var(--card-bg); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .about p { font-size: 1.05rem; max-width: 65ch; }
  .hours-box {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.25rem 1.5rem;
    display: inline-block;
  }
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-top: 1.5rem;
  }
  .product-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.25rem;
  }
  .product-photo {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 0.5rem;
    margin-bottom: 0.85rem;
    display: block;
  }
  .product-card h3 { font-size: 1.1rem; }
  .product-card p { color: var(--text-muted); font-size: 0.95rem; margin: 0 0 0.5rem; }
  .price { font-weight: 700; color: var(--accent); }
  .contact-grid { display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-start; margin-top: 1.5rem; }
  /* Comfortable one-tap rows on phones: the link itself carries the padding
     so the whole visual row is the tap target. */
  .contact-info p { margin: 0; color: var(--text-muted); }
  .contact-info a {
    display: inline-block;
    padding: 0.65rem 0;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .contact-info p:not(:has(a)) { padding: 0.65rem 0; }
  .map-placeholder {
    flex: 1;
    min-width: 260px;
    min-height: 200px;
    background: var(--bg-alt);
    border: 1px dashed var(--border);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  footer {
    text-align: center;
    padding: 2rem 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
  .apnasite-badge {
    display: inline-block;
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.8rem;
  }
  .apnasite-badge:hover { color: var(--text); }
  .reviews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
    margin-top: 1.5rem;
  }
  .review-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.25rem;
  }
  .review-card .stars { color: var(--accent); margin-bottom: 0.5rem; }
  .review-card .review-meta { color: var(--text-muted); font-size: 0.85rem; margin-top: 0.5rem; }
  .site-form {
    max-width: 500px;
    margin-top: 1.5rem;
  }
  .site-form label {
    display: block;
    margin-bottom: 1.25rem;
  }
  .site-form input,
  .site-form select,
  .site-form textarea {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    font-size: 1rem;
    background: var(--bg);
    color: var(--text);
    font-family: inherit;
  }
  .site-form .optional-label { font-size: 0.8rem; color: var(--text-muted); }
  .form-status { margin-top: 0.75rem; font-size: 0.9rem; color: var(--text-muted); }
  .form-status.ok { color: var(--accent); }
  .form-status.err { color: var(--accent-deep); }
  .add-to-cart-btn {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: var(--accent-text);
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .add-to-cart-btn:hover { opacity: 0.9; }
  .cart-float {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 998;
    background: var(--accent);
    color: var(--accent-text);
    border: none;
    border-radius: 999px;
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .cart-float .cart-count {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--accent-deep);
    color: #fff;
    border-radius: 999px;
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cart-dropdown {
    position: fixed;
    top: 76px;
    right: 20px;
    z-index: 997;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    display: none;
  }
  .cart-dropdown.open { display: block; }
  .cart-dropdown h3 { margin: 0 0 0.75rem; font-size: 1rem; }
  .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  .cart-item:last-child { border-bottom: none; }
  .cart-item .remove-btn { background: none; border: none; color: var(--accent-deep); cursor: pointer; font-size: 0.85rem; }
  .cart-empty { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem 0; }
  .faq-list { margin-top: 1.5rem; }
  .faq-item {
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    overflow: hidden;
  }
  .faq-item summary {
    padding: 1rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    background: var(--card-bg);
    list-style: none;
  }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::before { content: "+ "; color: var(--accent); font-weight: 700; }
  .faq-item[open] summary::before { content: "− "; }
  .faq-item p {
    padding: 0 1.25rem 1rem;
    color: var(--text-muted);
    font-size: 0.95rem;
    margin: 0;
  }
  .cart-total { font-weight: 700; margin-top: 0.75rem; text-align: right; }
  .checkout-toggle { width: 100%; margin-top: 0.85rem; border: none; cursor: pointer; }
  .checkout-form { margin-top: 0.85rem; display: none; }
  .checkout-form.open { display: block; }
  .checkout-form .btn { border: none; cursor: pointer; width: 100%; margin-left: 0; margin-right: 0; }
  .map-embed {
    flex: 1;
    min-width: 260px;
    height: 220px;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
  }
  @media (max-width: 600px) {
    .hero h1 { font-size: 2rem; }
    .cart-dropdown { left: 12px; right: 12px; width: auto; }
  }
</style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <span class="badge">${esc(data.category)}</span>
      <h1>${esc(data.shopName)}</h1>
      <p class="tagline">${esc(data.tagline)}</p>
      ${contactButtons}
    </div>
  </header>

  <section class="about">
    <div class="wrap">
      <h2>About Us</h2>
      <p>${esc(data.aboutText)}</p>
    </div>
  </section>

  <section class="alt">
    <div class="wrap">
      <h2>Hours</h2>
      <div class="hours-box">${esc(data.hours)}</div>
    </div>
  </section>

  ${
    data.products.length
      ? `<section class="products">
    <div class="wrap">
      <h2>What We Offer</h2>
      <div class="products-grid">
        ${productsHTML}
      </div>
    </div>
  </section>`
      : ""
  }

  <section class="alt contact">
    <div class="wrap">
      <h2>Visit / Contact Us</h2>
      <div class="contact-grid">
        <div class="contact-info">
          ${data.address ? `<p>&#128205; ${esc(data.address)}</p>` : ""}
          ${phoneLink ? `<p>&#128222; <a href="${esc(phoneLink)}">${esc(data.phone)}</a></p>` : ""}
          ${whatsappLink ? `<p>&#128172; <a href="${esc(whatsappLink)}" target="_blank" rel="noopener">WhatsApp: ${esc(data.whatsapp)}</a></p>` : ""}
          ${emailLink ? `<p>&#9993; <a href="${esc(emailLink)}">${esc(data.email)}</a></p>` : ""}
        </div>
        ${
          mapSrc
            ? `<iframe class="map-embed" src="${esc(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map for ${esc(data.shopName)}"></iframe>`
            : `<div class="map-placeholder">Map</div>`
        }
      </div>
    </div>
  </section>

  <section class="reviews">
    <div class="wrap">
      <h2>Customer Reviews</h2>
      ${
        options.reviews && options.reviews.length > 0
          ? `<div class="reviews-grid">
          ${options.reviews
            .map((r) => {
              const stars = "&#9733;".repeat(Math.min(Math.max(r.rating, 1), 5));
              return `<div class="review-card">
              <div class="stars">${stars}</div>
              <p>${esc(r.comment)}</p>
              <div class="review-meta">${esc(r.author)} &middot; ${esc(r.createdAt)}</div>
            </div>`;
            })
            .join("\n")}
        </div>`
          : `<p class="cart-empty">No reviews yet.</p>`
      }
      <form class="site-form" id="review-form">
        <h3>Leave a Review</h3>
        <label>
          Name *
          <input type="text" name="author" required />
        </label>
        <label>
          Rating *
          <select name="rating" required>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </label>
        <label>
          Comment *
          <textarea name="comment" rows="4" maxlength="2000" required></textarea>
        </label>
        <button type="submit" class="btn btn-primary">Submit Review</button>
        <div class="form-status" id="review-status" role="status"></div>
      </form>
    </div>
  </section>

  ${
    options.appointmentServices && options.appointmentServices.length > 0
      ? `<section class="alt appointments">
    <div class="wrap">
      <h2>Book an Appointment</h2>
      <form class="site-form" id="appointment-form">
        <label>
          Name *
          <input type="text" name="name" required />
        </label>
        <label>
          Email *
          <input type="email" name="email" required />
        </label>
        <label>
          Phone <span class="optional-label">(optional)</span>
          <input type="tel" name="phone" />
        </label>
        <label>
          Service *
          <input type="text" name="service" list="service-suggestions" required />
          <datalist id="service-suggestions">
            ${options.appointmentServices.map((s) => `<option value="${esc(s)}" />`).join("\n            ")}
          </datalist>
        </label>
        <label>
          Date *
          <input type="date" name="date" required />
        </label>
        <label>
          Time *
          <input type="text" name="time" placeholder="e.g. 10:30 AM" required />
        </label>
        <label>
          Notes <span class="optional-label">(optional)</span>
          <textarea name="notes" rows="3"></textarea>
        </label>
        <button type="submit" class="btn btn-primary">Request Appointment</button>
        <div class="form-status" id="appointment-status" role="status"></div>
      </form>
    </div>
  </section>`
      : ""
  }

  ${
    data.faq && data.faq.length > 0
      ? `<section class="faq">
    <div class="wrap">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">
        ${data.faq
          .map(
            (f, i) => `
        <details class="faq-item"${i === 0 ? " open" : ""}>
          <summary>${esc(f.question)}</summary>
          <p>${esc(f.answer)}</p>
        </details>`
          )
          .join("\n")}
      </div>
    </div>
  </section>`
      : ""
  }

  <section class="alt contact-form-section">
    <div class="wrap">
      <h2>Send Us a Message</h2>
      <form class="site-form" id="contact-form">
        <label>
          Name *
          <input type="text" name="name" required />
        </label>
        <label>
          Email *
          <input type="email" name="email" required />
        </label>
        <label>
          Phone <span class="optional-label">(optional)</span>
          <input type="tel" name="phone" />
        </label>
        <label>
          Message *
          <textarea name="message" rows="4" required maxlength="2000"></textarea>
        </label>
        <button type="submit" class="btn btn-primary">Send Message</button>
        <div class="form-status" id="contact-status" role="status"></div>
      </form>
    </div>
  </section>

  ${
    options.showBadge !== false
      ? `<footer><a class="apnasite-badge" href="${origin ?? ""}/" rel="noopener">&#10024; Made with ApnaSite</a></footer>`
      : ""
  }

  ${
    options.enableOrders
      ? `<button class="cart-float" id="cart-float-btn" onclick="toggleCart()">🛒<span class="cart-count" id="cart-count">0</span></button>
  <div class="cart-dropdown" id="cart-dropdown">
    <h3>Your Cart</h3>
    <div id="cart-items"></div>
    <div class="cart-total" id="cart-total"></div>
    <button type="button" class="btn btn-primary checkout-toggle" id="checkout-toggle">Place Order</button>
    <form class="site-form checkout-form" id="checkout-form">
      <label>
        Name *
        <input type="text" name="customerName" required />
      </label>
      <label>
        Email *
        <input type="email" name="customerEmail" required />
      </label>
      <label>
        Phone <span class="optional-label">(optional)</span>
        <input type="tel" name="customerPhone" />
      </label>
      <label>
        Payment *
        <select name="paymentMethod" required>
          <option value="cod">Cash on Delivery</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </label>
      <button type="submit" class="btn btn-primary">Confirm Order</button>
      <div class="form-status" id="checkout-status" role="status"></div>
    </form>
  </div>`
      : ""
  }

  <button id="tts-btn" onclick="toggleTTS()" style="position:fixed;bottom:20px;right:20px;z-index:999;width:44px;height:44px;border-radius:999px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.12);" aria-label="Read page aloud">🔊</button>

  <script>
  (function() {
    try {
      var body = JSON.stringify({siteId: '__SITE_ID__', path: location.pathname, referrer: document.referrer});
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', new Blob([body], {type:'application/json'}));
      } else {
        fetch('/api/analytics', {method:'POST', headers:{'Content-Type':'application/json'}, body:body, keepalive:true});
      }
    } catch(e) {}
  })();

  function toggleTTS() {
    if (!('speechSynthesis' in window)) return;
    var text = ${jsString(data.shopName)} + '. ' + ${jsString(data.tagline || "")} + '. ' + ${jsString(data.aboutText || "")};
    var u = new SpeechSynthesisUtterance(text);
    u.lang = ${jsString(htmlLang)};
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      window.setTimeout(function(){ speechSynthesis.speak(u); }, 80);
    } else {
      speechSynthesis.speak(u);
    }
  }

  function formStatus(id, message, ok) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = 'form-status ' + (ok ? 'ok' : 'err');
  }

  function formJson(form) {
    var data = {};
    new FormData(form).forEach(function(value, key) { data[key] = String(value); });
    return data;
  }

  function postJson(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    }).then(function(res) {
      if (!res.ok) {
        return res.json().catch(function(){ return {}; }).then(function(data) {
          throw new Error(data.error || 'Request failed');
        });
      }
      return res.json();
    });
  }

  var reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = formJson(reviewForm);
      postJson('/api/reviews', {
        siteId: '__SITE_ID__',
        author: data.author,
        rating: Number(data.rating),
        comment: data.comment
      }).then(function() {
        reviewForm.reset();
        formStatus('review-status', 'Review submitted for approval.', true);
      }).catch(function(err) {
        formStatus('review-status', err.message || 'Could not submit review.', false);
      });
    });
  }

  var appointmentForm = document.getElementById('appointment-form');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = formJson(appointmentForm);
      postJson('/api/appointments', {
        siteId: '__SITE_ID__',
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        service: data.service,
        date: data.date,
        time: data.time,
        notes: data.notes
      }).then(function() {
        appointmentForm.reset();
        formStatus('appointment-status', 'Appointment request received.', true);
      }).catch(function(err) {
        formStatus('appointment-status', err.message || 'Could not request appointment.', false);
      });
    });
  }

  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = formJson(contactForm);
      postJson('/api/contact', {
        siteId: '__SITE_ID__',
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message
      }).then(function() {
        contactForm.reset();
        formStatus('contact-status', 'Message sent! We\'ll get back to you soon.', true);
      }).catch(function(err) {
        formStatus('contact-status', err.message || 'Could not send message.', false);
      });
    });
  }

  ${
    options.enableOrders
      ? `
  var _cart = JSON.parse(localStorage.getItem('cart') || '[]');
  var _lastOrderMessage = '';
  function _saveCart() { localStorage.setItem('cart', JSON.stringify(_cart)); }
  function _renderCart() {
    var count = _cart.reduce(function(s,i){return s+i.qty;},0);
    var el = document.getElementById('cart-count'); if(el) el.textContent = count;
    var items = document.getElementById('cart-items'); var tot = document.getElementById('cart-total');
    if(!items) return;
    var checkoutToggle = document.getElementById('checkout-toggle');
    var checkoutForm = document.getElementById('checkout-form');
    if(!_cart.length){
      items.innerHTML='<div class="cart-empty">' + (_lastOrderMessage || 'Your cart is empty.') + '</div>';
      tot.textContent='';
      if (checkoutToggle) checkoutToggle.style.display = 'none';
      if (checkoutForm && !_lastOrderMessage) checkoutForm.classList.remove('open');
      return;
    }
    if (checkoutToggle) checkoutToggle.style.display = 'block';
    items.innerHTML = _cart.map(function(c,i){ return '<div class="cart-item"><span>'+c.name+' &times; '+c.qty+'</span><span>'+c.priceLabel+'</span><button class="remove-btn" onclick="removeFromCart('+i+')">Remove</button></div>'; }).join('');
    var total = _cart.reduce(function(s,i){return s + (i.priceAmount * i.qty);},0);
    tot.textContent = 'Total: ₹' + total.toLocaleString('en-IN');
  }
  function addToCart(name, priceLabel, priceAmount) {
    var found = _cart.find(function(c){return c.name===name;});
    if(found){ found.qty++; } else { _cart.push({name:name, priceLabel:priceLabel, priceAmount:priceAmount, qty:1}); }
    _saveCart(); _renderCart(); toggleCart(true);
  }
  function removeFromCart(i) { _cart.splice(i,1); _saveCart(); _renderCart(); }
  function toggleCart(forceOpen) {
    var dd = document.getElementById('cart-dropdown');
    if(forceOpen) dd.classList.add('open'); else dd.classList.toggle('open');
  }
  document.addEventListener('click', function(e) {
    var dd = document.getElementById('cart-dropdown');
    var btn = document.getElementById('cart-float-btn');
    if(dd && btn && !dd.contains(e.target) && !btn.contains(e.target)) dd.classList.remove('open');
  });
  document.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      addToCart(btn.dataset.name || '', btn.dataset.priceLabel || '', Number(btn.dataset.priceAmount || 0));
    });
  });
  var checkoutToggle = document.getElementById('checkout-toggle');
  var checkoutForm = document.getElementById('checkout-form');
  if (checkoutToggle && checkoutForm) {
    checkoutToggle.addEventListener('click', function() { checkoutForm.classList.toggle('open'); });
    checkoutForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!_cart.length) {
        formStatus('checkout-status', 'Your cart is empty.', false);
        return;
      }
      var data = formJson(checkoutForm);
      postJson('/api/orders', {
        siteId: '__SITE_ID__',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod,
        items: _cart.map(function(item) {
          return {name: item.name, price: item.priceAmount, quantity: item.qty};
        })
      }).then(function(result) {
        _cart = [];
        _lastOrderMessage = 'Order placed. Reference: ' + result.orderId;
        _saveCart();
        _renderCart();
        checkoutForm.reset();
        checkoutForm.classList.remove('open');
      }).catch(function(err) {
        formStatus('checkout-status', err.message || 'Could not place order.', false);
      });
    });
  }
  _renderCart();`
      : ""
  }
  </script>
</body>
</html>
`;
}
