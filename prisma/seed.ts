import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Kamran Carpets database…");

  // Default currencies
  const currencies = [
    { code: "USD", symbol: "$", rateToBase: 1, isDefault: true },
    { code: "EUR", symbol: "€", rateToBase: 0.92 },
    { code: "GBP", symbol: "£", rateToBase: 0.79 },
    { code: "AED", symbol: "د.إ", rateToBase: 3.67 },
    { code: "SAR", symbol: "﷼", rateToBase: 3.75 },
    { code: "INR", symbol: "₹", rateToBase: 83.5 },
    { code: "CAD", symbol: "CA$", rateToBase: 1.36 },
    { code: "AUD", symbol: "A$", rateToBase: 1.54 },
    { code: "JPY", symbol: "¥", rateToBase: 149.5 },
  ];

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log(`  ✓ ${currencies.length} currencies seeded`);

  // Default categories
  const categories = [
    { name: "Persian Carpets", slug: "persian-carpets" },
    { name: "Turkish Rugs", slug: "turkish-rugs" },
    { name: "Indian Rugs", slug: "indian-rugs" },
    { name: "Modern Carpets", slug: "modern-carpets" },
    { name: "Silk Rugs", slug: "silk-rugs" },
    { name: "Outdoor Rugs", slug: "outdoor-rugs" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log(`  ✓ ${categories.length} categories seeded`);

  // Default collections
  const collections = [
    { name: "Luxury Collection", slug: "luxury", type: "LUXURY" as const },
    { name: "Premium Collection", slug: "premium", type: "PREMIUM" as const },
    { name: "Traditional Collection", slug: "traditional", type: "TRADITIONAL" as const },
    { name: "Modern Collection", slug: "modern", type: "MODERN" as const },
    { name: "Seasonal Highlights", slug: "seasonal", type: "SEASONAL" as const },
  ];

  for (const c of collections) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log(`  ✓ ${collections.length} collections seeded`);

  // Default settings
  const settings = [
    { key: "company", value: { name: "Kamran Carpets", email: "hello@kamrancarpets.com", phone: "+1 800 000 0000" } },
    { key: "seo", value: { metaTitle: "Kamran Carpets | Luxury Carpets & Rugs", metaDescription: "Hand-selected luxury carpets from the world's finest weaving traditions." } },
    { key: "shipping", value: { freeShippingThreshold: 500, defaultCharge: 25 } },
    { key: "tax", value: { taxRate: 0, taxLabel: "Tax" } },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value as any },
      create: { id: s.key, key: s.key, value: s.value as any },
    });
  }
  console.log(`  ✓ ${settings.length} settings seeded`);

  // NOTE: we intentionally don't create a placeholder SUPER_ADMIN user here
  // anymore — a User row with no supabaseId can never log in, which was a
  // frequent source of confusion. Instead: sign up normally on the site
  // with the account you want to use as admin, then run:
  //   npm run make-admin -- you@example.com
  console.log("  ℹ To create your first admin: sign up on the site, then run `npm run make-admin -- <email>`.");

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
