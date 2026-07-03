import type { StorefrontData } from "./types";
import { scriptLangFor } from "./types";
import { resolveTheme } from "./theme";
import { GOOGLE_FONTS_HREF, staticFontStack } from "./fonts";

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function waLink(whatsapp: string): string {
  const digits = whatsapp.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}

export function renderStorefrontHTML(data: StorefrontData): string {
  const theme = resolveTheme(data.category);
  const fontDisplay = staticFontStack(theme.fontDisplayName, "display");
  const fontBody = staticFontStack(theme.fontBodyName, "body");
  const htmlLang = scriptLangFor(data.language);

  const productsHTML = data.products
    .map(
      (p) => `
        <div class="product-card">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description)}</p>
          ${p.price ? `<span class="price">${esc(p.price)}</span>` : ""}
        </div>`
    )
    .join("\n");

  const contactButtons = [
    data.whatsapp
      ? `<a class="btn btn-primary" href="${waLink(data.whatsapp)}" target="_blank" rel="noopener">Message on WhatsApp</a>`
      : "",
    data.phone ? `<a class="btn btn-outline" href="tel:${esc(data.phone)}">Call ${esc(data.phone)}</a>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(data.shopName)}</title>
<meta name="description" content="${esc(data.tagline)}" />
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
  .product-card h3 { font-size: 1.1rem; }
  .product-card p { color: var(--text-muted); font-size: 0.95rem; margin: 0 0 0.5rem; }
  .price { font-weight: 700; color: var(--accent); }
  .contact-grid { display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-start; margin-top: 1.5rem; }
  .contact-info p { margin: 0.25rem 0; color: var(--text-muted); }
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
          ${data.phone ? `<p>&#128222; ${esc(data.phone)}</p>` : ""}
          ${data.whatsapp ? `<p>&#128172; WhatsApp: ${esc(data.whatsapp)}</p>` : ""}
          ${data.email ? `<p>&#9993; ${esc(data.email)}</p>` : ""}
        </div>
        <div class="map-placeholder">${data.address ? "Map: " + esc(data.address) : "Map"}</div>
      </div>
    </div>
  </section>

  <footer>Built with VoxSite AI</footer>
</body>
</html>
`;
}
