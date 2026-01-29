import { PrismaClient, UserRole, LicencePlan, LicenceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function hashPinCode(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.licence.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.fuelType.deleteMany();

  // Create test station
  console.log('🏪 Creating test station...');
  const station = await prisma.station.create({
    data: {
      name: 'Station Test Casablanca',
      address: '123 Boulevard Zerktouni',
      city: 'Casablanca',
      phone: '+212 522 123 456',
      email: 'station.casa@test.com',
      isActive: true,
    },
  });
  console.log(`   ✅ Station created: ${station.name} (${station.id})\n`);

  // Create TRIAL licence for the station
  console.log('📜 Creating TRIAL licence...');
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // 30 days trial

  const licence = await prisma.licence.create({
    data: {
      stationId: station.id,
      plan: LicencePlan.TRIAL,
      status: LicenceStatus.ACTIVE,
      startDate,
      endDate,
      maxUsers: 5,
      maxDispensers: 4,
      features: {
        invoicing: true,
        reports: false,
        multiStation: false,
        api: false,
        support: 'email',
      },
    },
  });
  console.log(`   ✅ TRIAL licence created, expires: ${endDate.toISOString().split('T')[0]}\n`);

  // Create Payment Methods
  console.log('💳 Creating payment methods...');
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: { code: 'CASH', name: 'Espèces', requiresReference: false, isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { code: 'CARD', name: 'Carte bancaire', requiresReference: true, isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { code: 'VOUCHER', name: 'Bon carburant', requiresReference: true, isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { code: 'CREDIT', name: 'Crédit client', requiresReference: false, isActive: true },
    }),
    prisma.paymentMethod.create({
      data: { code: 'MOBILE', name: 'Paiement mobile', requiresReference: true, isActive: true },
    }),
  ]);
  console.log(`   ✅ ${paymentMethods.length} payment methods created\n`);

  // Create Fuel Types
  console.log('⛽ Creating fuel types...');
  const fuelTypes = await Promise.all([
    prisma.fuelType.create({
      data: { code: 'GASOIL', name: 'Gasoil 50ppm', isActive: true },
    }),
    prisma.fuelType.create({
      data: { code: 'SP95', name: 'Sans Plomb 95', isActive: true },
    }),
    prisma.fuelType.create({
      data: { code: 'SP98', name: 'Sans Plomb 98', isActive: true },
    }),
    prisma.fuelType.create({
      data: { code: 'DIESEL_PLUS', name: 'Diesel Excellence', isActive: true },
    }),
  ]);
  console.log(`   ✅ ${fuelTypes.length} fuel types created\n`);

  // Create SUPER_ADMIN (email + password only)
  console.log('👤 Creating SUPER_ADMIN...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@station.com',
      passwordHash: await hashPassword('Admin123!'),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+212 600 000 001',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`   ✅ SUPER_ADMIN: ${superAdmin.email}`);
  console.log(`      Password: Admin123!\n`);

  // Create GESTIONNAIRE (email + password + badge + pin)
  console.log('👤 Creating GESTIONNAIRE...');
  const gestionnaire = await prisma.user.create({
    data: {
      stationId: station.id,
      email: 'gestionnaire@station.com',
      passwordHash: await hashPassword('Gest123!'),
      badgeCode: 'G001',
      pinCodeHash: await hashPinCode('123456'),
      firstName: 'Mohammed',
      lastName: 'Alami',
      phone: '+212 600 000 002',
      role: UserRole.GESTIONNAIRE,
      isActive: true,
    },
  });
  console.log(`   ✅ GESTIONNAIRE: ${gestionnaire.email}`);
  console.log(`      Password: Gest123!`);
  console.log(`      Badge: ${gestionnaire.badgeCode}`);
  console.log(`      PIN: 123456\n`);

  // Create POMPISTE (badge + pin only)
  console.log('👤 Creating POMPISTE...');
  const pompiste = await prisma.user.create({
    data: {
      stationId: station.id,
      badgeCode: 'P001',
      pinCodeHash: await hashPinCode('654321'),
      firstName: 'Ahmed',
      lastName: 'Benali',
      phone: '+212 600 000 003',
      role: UserRole.POMPISTE,
      isActive: true,
    },
  });
  console.log(`   ✅ POMPISTE: ${pompiste.firstName} ${pompiste.lastName}`);
  console.log(`      Badge: ${pompiste.badgeCode}`);
  console.log(`      PIN: 654321\n`);

  // Create second POMPISTE for testing
  console.log('👤 Creating second POMPISTE...');
  const pompiste2 = await prisma.user.create({
    data: {
      stationId: station.id,
      badgeCode: 'P002',
      pinCodeHash: await hashPinCode('111111'),
      firstName: 'Youssef',
      lastName: 'Idrissi',
      role: UserRole.POMPISTE,
      isActive: true,
    },
  });
  console.log(`   ✅ POMPISTE: ${pompiste2.firstName} ${pompiste2.lastName}`);
  console.log(`      Badge: ${pompiste2.badgeCode}`);
  console.log(`      PIN: 111111\n`);

  console.log('=' .repeat(60));
  console.log('\n📋 RÉSUMÉ DES COMPTES DE TEST:\n');
  console.log('┌─────────────────┬────────────────────────────┬──────────┬────────┐');
  console.log('│ Rôle            │ Email                      │ Badge    │ PIN    │');
  console.log('├─────────────────┼────────────────────────────┼──────────┼────────┤');
  console.log('│ SUPER_ADMIN     │ admin@station.com          │ -        │ -      │');
  console.log('│ GESTIONNAIRE    │ gestionnaire@station.com   │ G001     │ 123456 │');
  console.log('│ POMPISTE        │ -                          │ P001     │ 654321 │');
  console.log('│ POMPISTE        │ -                          │ P002     │ 111111 │');
  console.log('└─────────────────┴────────────────────────────┴──────────┴────────┘');
  console.log('\nMots de passe: SUPER_ADMIN=Admin123!, GESTIONNAIRE=Gest123!\n');
  console.log(`Station ID: ${station.id}`);
  console.log(`Licence ID: ${licence.id}`);
  console.log(`Licence Plan: ${licence.plan}`);
  console.log(`Licence Expires: ${endDate.toISOString().split('T')[0]}\n`);

  console.log('✅ Seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
