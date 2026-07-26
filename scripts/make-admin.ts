/**
 * Promotes an existing user to SUPER_ADMIN by email.
 *
 * This solves the "first admin" chicken-and-egg problem: the /admin/admins
 * UI can only be used by an existing SUPER_ADMIN, so the very first admin
 * has to be granted from the command line.
 *
 * Usage:
 *   1. Sign up for a normal account on the site with the email you want to
 *      use as admin (this creates the linked Supabase Auth + local User
 *      records).
 *   2. Run: npm run make-admin -- you@example.com
 *   3. Log out and back in on the site — you now have SUPER_ADMIN access.
 */
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run make-admin -- <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(
      `No user found with email "${email}". Sign up on the site first (so the account is linked to Supabase Auth), then run this script again.`
    );
    process.exit(1);
  }

  if (!user.supabaseId) {
    console.warn(
      `Warning: this user has no linked Supabase Auth account (supabaseId is empty). They won't be able to log in until that's fixed.`
    );
  }

  const updated = await prisma.user.update({ where: { email }, data: { role: Role.SUPER_ADMIN } });
  console.log(`✓ ${updated.email} is now SUPER_ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
