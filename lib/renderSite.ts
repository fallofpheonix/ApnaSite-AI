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

// wa.me links require a country code. Most owners will type a bare 10-digit
// Indian mobile number, so those get the +91 prefix; anything longer is
// assumed to already carry its country code.
const WA_DEFAULT_COUNTRY_CODE = "91";

function waLink(whatsapp: string): string {
  let digits = whatsapp.replace(/[^0-9]/g, "");
  if (digits.length === 10) digits = WA_DEFAULT_COUNTRY_CODE + digits;
  return `https://wa.me/${digits}`;
}

/** tel: URIs must not contain spaces or dashes — keep digits and a leading +. */
function telLink(phone: string): string {
  const plus = phone.trim().startsWith("+") ? "+" : "";
  return `tel:${plus}${phone.replace(/[^0-9]/g, "")}`;
}

/** Meta description: the tagline if present, else the about text, clamped so
 * search results and WhatsApp link previews don't show a truncated wall. */
function metaDescription(data: StorefrontData): string {
  const raw = (data.tagline || data.aboutText || "").trim().replace(/\s+/g, " ");
  return raw.length > 160 ? raw.slice(0, 157).trimEnd() + "..." : raw;
}

export interface RenderOptions {
  /** Absolute URL of this page (for og:url and absolutizing og:image).
   * Without it the og tags that need absolute URLs are omitted. */
  pageUrl?: string;
  /** Free-plan sites carry a small "Made with VoxSite" footer badge linking
   * back to the app (see lib/plans.ts). Pro sites render no branding. */
  showBadge?: boolean;
}

export function renderStorefrontHTML(data: StorefrontData, options: RenderOptions = {}): string {
  const theme = themeForSite(data);
  const fontDisplay = staticFontStack(theme.fontDisplayName, "display");
  const fontBody = staticFontStack(theme.fontBodyName, "body");
  const htmlLang = scriptLangFor(data.language);

  const productsHTML = data.products
    .map(
      (p) => `
        <div class="product-card">
          ${p.image ? `<img class="product-photo" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />` : ""}
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description)}</p>
          ${p.price ? `<span class="price">${esc(p.price)}</span>` : ""}
        </div>`
    )
    .join("\n");

  // Social-preview tags so a link shared on WhatsApp shows the shop name,
  // description and (when available) the first product photo.
  const description = metaDescription(data);
  const origin = options.pageUrl ? new URL(options.pageUrl).origin : null;
  const firstPhoto = data.products.find((p) => p.image)?.image;
  const ogImage = firstPhoto && origin ? new URL(firstPhoto, origin).href : null;
  const ogTags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(data.shopName)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:site_name" content="${esc(data.shopName)}" />`,
    options.pageUrl ? `<meta property="og:url" content="${esc(options.pageUrl)}" />` : "",
    ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : "",
    `<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />`,
  ]
    .filter(Boolean)
    .join("\n");

  const contactButtons = [
    data.whatsapp
      ? `<a class="btn btn-primary" href="${waLink(data.whatsapp)}" target="_blank" rel="noopener">Message on WhatsApp</a>`
      : "",
    data.phone ? `<a class="btn btn-outline" href="${telLink(data.phone)}">Call ${esc(data.phone)}</a>` : "",
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
  .voxsite-badge {
    display: inline-block;
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.8rem;
  }
  .voxsite-badge:hover { color: var(--text); }
  @media (max-width: 600px) {
    .hero h1 { font-size: 2rem; }
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
          ${data.phone ? `<p>&#128222; <a href="${telLink(data.phone)}">${esc(data.phone)}</a></p>` : ""}
          ${data.whatsapp ? `<p>&#128172; <a href="${waLink(data.whatsapp)}" target="_blank" rel="noopener">WhatsApp: ${esc(data.whatsapp)}</a></p>` : ""}
          ${data.email ? `<p>&#9993; <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>` : ""}
        </div>
        <div class="map-placeholder">${data.address ? "Map: " + esc(data.address) : "Map"}</div>
      </div>
    </div>
  </section>

  ${
    options.showBadge !== false
      ? `<footer><a class="voxsite-badge" href="${origin ?? ""}/" rel="noopener">&#10024; Made with VoxSite</a></footer>`
      : ""
  }
</body>
</html>
`;
}
