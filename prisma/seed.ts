import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const plainPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !plainPassword) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to run seed.',
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
