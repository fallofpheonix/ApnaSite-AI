// Reproducible demo data: `npm run seed`
//
// Creates (or fully recreates) a demo account with a few sites so the app
// can be explored without going through generation. Safe to re-run — it
// deletes the demo user first and everything cascades (sites, sessions,
// subscription). Never touches other users.
//
// Log in as the demo user the normal way: request an OTP for
// demo@voxsite.test and read the code from the server console.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_EMAIL = "demo@voxsite.test";

const shared = {
  tagline: "Ghar ki har zaroorat, bas paas mein",
  aboutText:
    "Pichhle das saal se mohalle ki service mein. Daily ka saaman, sahi daam aur apnepan wali service - yahi hamari pehchaan hai.",
  hours: "9 AM - 9 PM, Mon - Sat",
  products: [
    { name: "Daily Kirana", description: "Atta, chawal, dal, tel aur masale - har hafte fresh stock.", price: null },
    { name: "Home Delivery", description: "₹500 se upar ke order par 2 km tak free delivery.", price: "₹500+ pe free" },
  ],
  address: "Shop 4, Main Market Road",
  phone: "98765 43210",
  whatsapp: "98765 43210",
  email: null,
  language: "hinglish",
  themeOverride: null,
};

// One published site (free-plan limit is 1) + two drafts to demo the
// dashboard, editor, theme switcher, and the upgrade prompt on publish #2.
const SITES = [
  { name: "Sweet Crumbs Bakery", category: "bakery", slug: "demo-bakery", published: true },
  { name: "Ratna Jewellers", category: "jewellery", slug: null, published: false },
  { name: "Iron Pulse Gym", category: "gym", slug: null, published: false },
];

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });
  const user = await prisma.user.create({ data: { email: DEMO_EMAIL } });

  for (const s of SITES) {
    await prisma.site.create({
      data: {
        userId: user.id,
        name: s.name,
        slug: s.slug,
        published: s.published,
        data: JSON.stringify({ ...shared, shopName: s.name, category: s.category }),
      },
    });
  }

  console.log(`Seeded ${DEMO_EMAIL}: ${SITES.length} sites (1 published → /s/demo-bakery).`);
  console.log("Log in via the normal OTP flow; the code prints to the server console.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
