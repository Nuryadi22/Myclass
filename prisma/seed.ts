import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data for a clean slate
  await prisma.activity.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.creativity.deleteMany({});
  await prisma.prayer.deleteMany({});
  await prisma.discussion.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin', 10);
  const teacherPassword = await bcrypt.hash('1981020304', 10);
  const parent1Password = await bcrypt.hash('1234567890', 10);
  const parent2Password = await bcrypt.hash('0987654321', 10);

  // 1. Create Super Admin
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@myclass.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  // 2. Create Teacher (assigned to Kelas 4-A)
  const teacher = await prisma.user.create({
    data: {
      name: 'Budi Setiawan, S.Pd (Guru)',
      username: '1981020304', // NIG
      email: 'guru@myclass.com',
      password: teacherPassword,
      role: 'teacher',
      className: 'Kelas 4-A',
    },
  });

  // 3. Create Parent 1 (linked to Student 1 NISN)
  const parent1 = await prisma.user.create({
    data: {
      name: 'Hendra Wijaya (Orang Tua)',
      username: '1234567890', // NISN
      email: 'ortu@myclass.com',
      password: parent1Password,
      role: 'parent',
    },
  });

  // 4. Create Parent 2 (linked to Student 2 NISN)
  const parent2 = await prisma.user.create({
    data: {
      name: 'Siti Aminah (Orang Tua)',
      username: '0987654321', // NISN
      email: 'siti_parent@myclass.com',
      password: parent2Password,
      role: 'parent',
    },
  });

  // 5. Create Students
  const student1 = await prisma.student.create({
    data: {
      parentId: parent1.id,
      name: 'Ahmad Fauzi',
      studentId: '1234567890', // NISN
      className: 'Kelas 4-A',
      qrCodeToken: 'STU-AHMAD-123',
      totalPoints: 12,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      parentId: parent2.id,
      name: 'Siti Aminah',
      studentId: '0987654321', // NISN
      className: 'Kelas 4-A',
      qrCodeToken: 'STU-SITI-098',
      totalPoints: 5,
    },
  });

  // 6. Create initial activities
  await prisma.activity.create({
    data: {
      studentId: student1.id,
      teacherId: teacher.id,
      type: 'memorization',
      title: 'Surah An-Naba',
      rating: 4,
      pointsImpact: 4,
    },
  });

  await prisma.activity.create({
    data: {
      studentId: student1.id,
      teacherId: teacher.id,
      type: 'literacy',
      title: 'Buku Dongeng Kancil & Buaya',
      rating: 3,
      pointsImpact: 3,
    },
  });

  await prisma.activity.create({
    data: {
      studentId: student1.id,
      teacherId: teacher.id,
      type: 'numeracy',
      title: 'Perkalian Dasar 1-10',
      rating: 5,
      pointsImpact: 5,
    },
  });

  await prisma.activity.create({
    data: {
      studentId: student2.id,
      teacherId: teacher.id,
      type: 'memorization',
      title: 'Surah Al-Mulk',
      rating: 5,
      pointsImpact: 5,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
