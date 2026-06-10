import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data for a clean slate
  console.log('Clearing database tables...');
  await prisma.activity.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.creativity.deleteMany({});
  await prisma.prayer.deleteMany({});
  await prisma.discussion.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash password
  const adminPassword = await bcrypt.hash('Abditam@22', 10);

  // 1. Create Super Admin
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      username: 'Admin',
      email: 'admin@myclass.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  console.log('Database cleared and seeded with clean Super Admin account successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
