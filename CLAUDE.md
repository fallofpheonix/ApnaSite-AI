# VoxSite AI — project instructions

- **All visual design work must consult docs/DESIGN-REFERENCES.md first.**
  Section A governs the app's own pages (structure borrowed from PostHog /
  Huly / elementary; the Bazaar Warmth identity is fixed). Section B holds
  the per-category design brief every storefront theme must honor — update
  the brief's verdict in the same commit when changing a theme.
- Prisma is pinned to v6 on purpose (v7 needs prisma.config.ts + driver
  adapters). Don't upgrade casually.
- Uploaded photos live in `./uploads`, served by `app/uploads/[name]/route.ts`
  — never move them into `public/` (`next start` won't serve files added
  after build).
- Plan pricing/limits live only in `lib/plans.ts`.
- The map of the codebase is ARCHITECTURE.md; recipes are CUSTOMIZING.md;
  deployment is DEPLOY.md.
