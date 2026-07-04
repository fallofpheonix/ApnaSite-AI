# Design References

Consult this document before any visual design work — app pages or storefront
themes. It records **where we take structural discipline from** (section A)
and **what each storefront theme must feel like** (section B).

The rule in one line: **we borrow structure, never look.** VoxSite's own
identity — "Bazaar Warmth": paper `#FBF1DE`, marigold `#E8A33D`, teal
`#1E5C58`, brick accents, Newsreader italic display, the jali lattice — is
settled and is not up for revision in a polish pass.

---

## A. App references (landing, login, dashboard, billing)

### PostHog — posthog.com

What to borrow:

- **Linear modular stack.** One idea per full-width section, each with a
  clear focal point, separated by generous vertical gutters (~2–3 line
  heights). No two ideas share a section.
- **Whitespace over chrome.** Sections are delineated by spacing and heading
  hierarchy, not boxes-inside-boxes. Cards are used where comparison is the
  point (pricing), not as default decoration.
- **Density varies deliberately.** Marketing sections breathe; data sections
  (pricing tables) are compact and columnar. Don't give every element the
  same airiness.
- **Emphasis via weight, not size-inflation.** Bold key phrases inside
  compact body copy instead of yet another heading level.

### Huly — huly.io

What to borrow:

- **Three-tier headline system, used consistently:** hero headline → section
  headline → feature title. Every section headline is followed by one
  descriptive subtitle line — a predictable heading/subtitle rhythm the eye
  learns after one section.
- **Alignment discipline.** Grids keep uniform gutters; image/text pairs
  alternate predictably; centered vs left-aligned is a deliberate per-section
  choice, never mixed within one.
- **A proper closing.** The page ends with a centered closing statement and a
  real footer — it never just stops after the last widget.

### elementary OS — elementary.io

*(Site blocks automated fetching; this entry is from its published Human
Interface Guidelines and long-stable site design.)*

What to borrow:

- **One decision per screen.** Each view has a single primary action, visually
  unmistakable; secondary actions are quiet. Never two competing CTAs.
- **Humane, minimal copy.** Short sentences, no jargon, buttons say exactly
  what they do — matches our shop-owner audience perfectly.
- **Ruthless whitespace + narrow measures.** Text columns stay readable
  (~60ch); padding is generous and *consistent* — the same spacing token
  repeats rather than a new value per element.

### The VoxSite translation (our working rules)

1. **One heading pattern everywhere:** page title (display serif, 3xl/4xl) +
   one subtitle line (sm, ink-soft) + optional right-aligned action. Encoded
   as `components/PageHeader.tsx` — use it, don't re-implement it.
2. **Eyebrow/kicker** (xs, uppercase, tracked, teal) above hero-level titles
   only — it's the Huly tier-marker adapted to our palette.
3. **Spacing scale:** vertical rhythm in steps of 4 (py-10/12/16, gap-4/6/8).
   If you're typing an odd spacing value, you're off the scale.
4. **Every page closes.** A quiet footer (Terms · Privacy, one-line brand
   note) on every full page; nothing ends on a raw widget.
5. **One primary action per screen** (elementary): marigold = the one thing
   to do next; everything else is outline/ghost.

---

## B. Storefront theme briefs (the 15 categories)

Each brief describes the real-world visual language of that shop type in
India — the design brief the theme must honor. Verdicts: **matches** = theme
already embodies the brief; **strengthen** = specific gaps noted.

### bakery — "Warm Hearth"
Glass counters of buns and cream rolls, kraft boxes, ovens at the back;
warmth is literal — browns, butter, crust. Signage leans homely serif.
**Verdict: matches.** Hearth browns + Newsreader italic land it.

### sweets — "Utsav Rose"
Mithai-box culture: rose and saffron foils, silver varq shine, festival
stacking, celebratory typography. Pinker and more festive than bakery.
**Verdict: matches.** The gulab-rose accent + Fraunces italic is the box lid.

### kirana — "Rozana"
Hand-painted signboards on turmeric/sun-bleached grounds, sacks and dense
practical shelving, dependable rather than fancy. Green = daily freshness.
**Verdict: matches.** Turmeric paper + leaf green is exactly this.

### grocery — "Fresh Market"
Crates of produce under bright light, chalkboard prices, cool morning-market
greens with citrus pops. More open-air than kirana's shop density.
**Verdict: matches**, keep distinct from kirana (cool green vs warm turmeric).

### restaurant — "Evening Table"
Family dining rooms: deep maroon/burgundy, cream tablecloths, brass, menus in
serif caps. Evening warmth, not fast-food brightness.
**Verdict: matches.**

### salon — "Quiet Bloom"
Salon posters, rose-gold accents, soft plush interiors; feminine but
increasingly spa-calm rather than loud. Petal pinks with a deep plum anchor.
**Verdict: matches** (calm reading is a deliberate choice over glam).

### tailor — "Measured Thread"
Chalk-marked pattern paper, unbleached linen, thread spools, measuring tape;
craft credibility over fashion flash. Engraved capitals feel like a label.
**Verdict: matches.** Marcellus caps on linen is the chalk block.

### clothing — "Studio Line"
Boutique racks on ecru walls, gold-foil logos, editorial restraint; the
aspiration is "showroom", one metallic accent on natural ground.
**Verdict: matches.**

### jewellery — "Gilded Velvet"
Dark velvet display cases lit so gold reads as metal; engraved serifs,
burgundy/plum grounds, hallmark seriousness. Trust through richness.
**Verdict: matches** — the strongest theme in the set.

### gym — "Iron Pulse"
Painted iron plates, poster walls, chalk dust, high-vis accents on charcoal;
condensed caps shouting from a wall. Akhada energy, industrial ground.
**Verdict: matches.**

### tuition — "Copybook"
Copybook paper, fountain-pen indigo, rulers and timetables; parents read
serif + ink as "serious about results". Calm, studious, trustworthy.
**Verdict: matches.**

### pharmacy — "Clear Care"
The universal Indian pharmacy language is the **green cross** — glowing green
signage on white, clinical cleanliness, trust through hygiene. Blue exists
but green *is* the category signal.
**Verdict: strengthen.** Our accent is a dark slate-navy that says "office",
not "chemist". Move the accent to a pharmacy-cross green; keep the clinical
pale ground and airy cleanliness.

### hardware — "Site Ready"
Steel shutters, kraft cartons, cement bags, safety-orange stencils, tools on
pegboard; gritty and warm-dusty, not corporate. Industrial condensed type is
right; the ground should feel like the shop floor, not an office lobby.
**Verdict: strengthen.** Current cool blue-grey ground reads corporate
software. Warm it toward cement/kraft; deepen text to iron; keep the
safety-orange accent (it's correct) and let it glow against the warmer dust.

### electronics — "Signal"
Mobile-market storefronts: glossy white counters, vivid electric blue
signage, LED-lit accessory walls, screen-bright contrast. Crisp and saturated
— never washed out.
**Verdict: strengthen.** Current grey-on-grey is too timid for the category.
Push ground to showroom white, saturate the circuit blue, darken ink for
screen-crisp contrast.

### general — "Steady Trust"
The fallback for unclassifiable shops: neutral warm ground, one dependable
deep accent, no category costume. Its job is to look composed anywhere.
**Verdict: matches** — blandness here is the feature.

---

*Changing a theme? Update its brief verdict here in the same commit.*
