import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Password for test accounts: Password123!
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // 1. Superadmin user
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPERADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });

  // 2. Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });

  // 3. Regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: Role.USER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Seeded Accounts (Password: Password123!):');
  console.log(` - Superadmin: ${superadmin.email} (Role: SUPERADMIN)`);
  console.log(` - Admin:      ${admin.email} (Role: ADMIN)`);
  console.log(` - User:       ${user.email} (Role: USER)`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
