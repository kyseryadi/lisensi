const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    throw new Error('Production seed requires ADMIN_EMAIL and ADMIN_PASSWORD.');
  }
  const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Alh4mdul!ll4hAm4n', 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password }
  });

  console.log(`User admin ${email} berhasil disiapkan.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
