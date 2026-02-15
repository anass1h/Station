import { PrismaClient, UserRole, LicencePlan, LicenceStatus, ShiftStatus, AlertType, AlertPriority, AlertStatus, DebtReason, DebtStatus, ClientType, InvoiceStatus, InvoiceType, MovementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function hashPinCode(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomDecimal(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // Clean existing data in order (respecting foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.debtPayment.deleteMany();
  await prisma.pompisteDebt.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.invoicePayment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salePayment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.paymentDetail.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.price.deleteMany();
  await prisma.client.deleteMany();
  await prisma.nozzle.deleteMany();
  await prisma.dispenser.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.licence.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.fuelType.deleteMany();
  console.log('   ✅ Cleaned\n');

  // Create test station
  console.log('🏪 Creating test station...');
  const station = await prisma.station.create({
    data: {
      name: 'Station Test Casablanca',
      address: '123 Boulevard Zerktouni',
      city: 'Casablanca',
      phone: '+212522123456',
      email: 'station.casa@test.com',
      ice: '001234567000089',
      taxId: '12345678',
      rc: '123456',
      patente: 'PAT789',
      isActive: true,
    },
  });
  console.log(`   ✅ Station created: ${station.name}\n`);

  // Create licence BETA
  console.log('📜 Creating BETA licence...');
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  await prisma.licence.create({
    data: {
      stationId: station.id,
      plan: LicencePlan.BETA,
      status: LicenceStatus.ACTIVE,
      startDate,
      endDate,
      maxUsers: 99,
      maxDispensers: 99,
      maxTanks: 99,
      maxStations: 10,
      gracePeriodDays: 30,
      features: {
        shifts: true,
        fuelSales: true,
        cashPayments: true,
        cardPayments: true,
        fuelVouchers: true,
        dashboardBasic: true,
        dashboardAdvanced: true,
        dashboardGlobal: true,
        invoicingB2C: true,
        invoicingB2B: true,
        creditNotes: true,
        creditClients: true,
        reportsBasic: true,
        reportsPdf: true,
        reportsExcel: true,
        reportsBi: true,
        lowStockAlerts: true,
        maintenancePreventive: true,
        multiStation: true,
        apiAccess: true,
        webhooks: true,
        offlineMode: true,
        dgiCompliance: true,
      },
    },
  });
  console.log(`   ✅ BETA Licence created (1 year)\n`);

  // Create Payment Methods
  console.log('💳 Creating payment methods...');
  const [cashMethod, cardMethod, _voucherMethod, _creditMethod, _mobileMethod] = await Promise.all([
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
  console.log(`   ✅ 5 payment methods created\n`);

  // Create Fuel Types
  console.log('⛽ Creating fuel types...');
  const [gasoil, sp95, sp98, dieselPlus] = await Promise.all([
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
  console.log(`   ✅ 4 fuel types created\n`);

  // Create Users
  console.log('👤 Creating users...');
  await prisma.user.create({
    data: {
      email: 'admin@station.com',
      passwordHash: await hashPassword('Admin123!'),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+212600000001',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const gestionnaire = await prisma.user.create({
    data: {
      stationId: station.id,
      email: 'gestionnaire@station.com',
      passwordHash: await hashPassword('Gest123!'),
      badgeCode: 'G001',
      pinCodeHash: await hashPinCode('123456'),
      firstName: 'Mohammed',
      lastName: 'Alami',
      phone: '+212600000002',
      role: UserRole.GESTIONNAIRE,
      isActive: true,
    },
  });

  const pompiste1 = await prisma.user.create({
    data: {
      stationId: station.id,
      badgeCode: 'P001',
      pinCodeHash: await hashPinCode('654321'),
      firstName: 'Ahmed',
      lastName: 'Benali',
      phone: '+212600000003',
      role: UserRole.POMPISTE,
      isActive: true,
    },
  });

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

  const pompiste3 = await prisma.user.create({
    data: {
      stationId: station.id,
      badgeCode: 'P003',
      pinCodeHash: await hashPinCode('222222'),
      firstName: 'Karim',
      lastName: 'Fassi',
      role: UserRole.POMPISTE,
      isActive: true,
    },
  });
  console.log(`   ✅ 5 users created\n`);

  // Create Tanks
  console.log('🛢️ Creating tanks...');
  const tank1 = await prisma.tank.create({
    data: {
      stationId: station.id,
      fuelTypeId: gasoil.id,
      capacity: 20000,
      currentLevel: 15000,
      lowThreshold: 3000,
      reference: 'CUVE-001',
      isActive: true,
    },
  });

  const tank2 = await prisma.tank.create({
    data: {
      stationId: station.id,
      fuelTypeId: sp95.id,
      capacity: 15000,
      currentLevel: 4500, // Low stock!
      lowThreshold: 5000,
      reference: 'CUVE-002',
      isActive: true,
    },
  });

  const tank3 = await prisma.tank.create({
    data: {
      stationId: station.id,
      fuelTypeId: sp98.id,
      capacity: 10000,
      currentLevel: 7500,
      lowThreshold: 2000,
      reference: 'CUVE-003',
      isActive: true,
    },
  });

  const tank4 = await prisma.tank.create({
    data: {
      stationId: station.id,
      fuelTypeId: dieselPlus.id,
      capacity: 8000,
      currentLevel: 1500, // Low stock!
      lowThreshold: 2000,
      reference: 'CUVE-004',
      isActive: true,
    },
  });
  console.log(`   ✅ 4 tanks created\n`);

  // Create Dispensers
  console.log('⛽ Creating dispensers...');
  const dispenser1 = await prisma.dispenser.create({
    data: { stationId: station.id, reference: 'DC-01', isActive: true },
  });

  const dispenser2 = await prisma.dispenser.create({
    data: { stationId: station.id, reference: 'DC-02', isActive: true },
  });

  const dispenser3 = await prisma.dispenser.create({
    data: { stationId: station.id, reference: 'DC-03', isActive: true },
  });
  console.log(`   ✅ 3 dispensers created\n`);

  // Create Nozzles
  console.log('🔫 Creating nozzles...');
  const nozzle1 = await prisma.nozzle.create({
    data: {
      dispenserId: dispenser1.id,
      tankId: tank1.id,
      fuelTypeId: gasoil.id,
      reference: 'DC01-P1',
      currentIndex: 125430.50,
      position: 1,
      isActive: true,
    },
  });

  const nozzle2 = await prisma.nozzle.create({
    data: {
      dispenserId: dispenser1.id,
      tankId: tank2.id,
      fuelTypeId: sp95.id,
      reference: 'DC01-P2',
      currentIndex: 98765.25,
      position: 2,
      isActive: true,
    },
  });

  const nozzle3 = await prisma.nozzle.create({
    data: {
      dispenserId: dispenser2.id,
      tankId: tank1.id,
      fuelTypeId: gasoil.id,
      reference: 'DC02-P1',
      currentIndex: 87654.00,
      position: 1,
      isActive: true,
    },
  });

  const nozzle4 = await prisma.nozzle.create({
    data: {
      dispenserId: dispenser2.id,
      tankId: tank3.id,
      fuelTypeId: sp98.id,
      reference: 'DC02-P2',
      currentIndex: 45678.75,
      position: 2,
      isActive: true,
    },
  });

  await prisma.nozzle.create({
    data: {
      dispenserId: dispenser3.id,
      tankId: tank4.id,
      fuelTypeId: dieselPlus.id,
      reference: 'DC03-P1',
      currentIndex: 23456.00,
      position: 1,
      isActive: true,
    },
  });
  console.log(`   ✅ 5 nozzles created\n`);

  // Create Prices
  console.log('💰 Creating prices...');
  const now = new Date();
  await Promise.all([
    prisma.price.create({
      data: {
        stationId: station.id,
        fuelTypeId: gasoil.id,
        sellingPrice: 12.50,
        sellingPriceHT: 10.42,
        purchasePrice: 9.80,
        effectiveFrom: now,
        createdByUserId: gestionnaire.id,
      },
    }),
    prisma.price.create({
      data: {
        stationId: station.id,
        fuelTypeId: sp95.id,
        sellingPrice: 14.20,
        sellingPriceHT: 11.83,
        purchasePrice: 11.00,
        effectiveFrom: now,
        createdByUserId: gestionnaire.id,
      },
    }),
    prisma.price.create({
      data: {
        stationId: station.id,
        fuelTypeId: sp98.id,
        sellingPrice: 15.50,
        sellingPriceHT: 12.92,
        purchasePrice: 12.00,
        effectiveFrom: now,
        createdByUserId: gestionnaire.id,
      },
    }),
    prisma.price.create({
      data: {
        stationId: station.id,
        fuelTypeId: dieselPlus.id,
        sellingPrice: 13.80,
        sellingPriceHT: 11.50,
        purchasePrice: 10.50,
        effectiveFrom: now,
        createdByUserId: gestionnaire.id,
      },
    }),
  ]);
  console.log(`   ✅ 4 prices created\n`);

  // Create Suppliers
  console.log('🚚 Creating suppliers...');
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'AFRIQUIA',
      contactName: 'Hassan Bennani',
      phone: '+212522456789',
      email: 'contact@afriquia.ma',
      address: 'Zone industrielle Casablanca',
      isActive: true,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'SHELL Maroc',
      contactName: 'Rachid Mansouri',
      phone: '+212522987654',
      email: 'commandes@shell.ma',
      address: 'Casablanca Marina',
      isActive: true,
    },
  });
  console.log(`   ✅ 2 suppliers created\n`);

  // Create Clients
  console.log('👥 Creating clients...');
  const client1 = await prisma.client.create({
    data: {
      stationId: station.id,
      clientType: ClientType.B2B,
      companyName: 'Transport Atlas SARL',
      contactName: 'Omar Tazi',
      ice: '002345678000090',
      taxId: '23456789',
      rc: '234567',
      address: '45 Zone Industrielle, Casablanca',
      phone: '+212522111222',
      email: 'contact@transport-atlas.ma',
      creditLimit: 50000,
      currentBalance: 12500,
      paymentTermDays: 30,
      isActive: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      stationId: station.id,
      clientType: ClientType.B2B,
      companyName: 'Société Logistique Maroc',
      contactName: 'Fatima Alaoui',
      ice: '003456789000091',
      address: '12 Rue de l\'Industrie, Rabat',
      phone: '+212537333444',
      email: 'facturation@slm.ma',
      creditLimit: 30000,
      currentBalance: 5600,
      paymentTermDays: 45,
      isActive: true,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      stationId: station.id,
      clientType: ClientType.B2B,
      companyName: 'Taxi Services Express',
      contactName: 'Khalid Benjelloun',
      address: 'Gare Routière Casa',
      phone: '+212661555666',
      creditLimit: 10000,
      currentBalance: 8500,
      paymentTermDays: 15,
      isActive: true,
    },
  });

  const client4 = await prisma.client.create({
    data: {
      stationId: station.id,
      clientType: ClientType.B2C_REGISTERED,
      contactName: 'Nadia Chraibi',
      phone: '+212662777888',
      creditLimit: 5000,
      currentBalance: 0,
      isActive: true,
    },
  });

  const client5 = await prisma.client.create({
    data: {
      stationId: station.id,
      clientType: ClientType.B2B,
      companyName: 'BTP Construction',
      contactName: 'Mehdi Lahrichi',
      ice: '004567890000092',
      address: 'Chantier Ain Sebaa',
      phone: '+212522999000',
      creditLimit: 100000,
      currentBalance: 45000,
      paymentTermDays: 60,
      isActive: true,
    },
  });
  console.log(`   ✅ 5 clients created\n`);

  // Create Shifts with Sales
  console.log('📋 Creating shifts and sales...');
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Shift 1 - Validated (old)
  const shift1Start = new Date(oneWeekAgo);
  shift1Start.setHours(6, 0, 0, 0);
  const shift1End = new Date(oneWeekAgo);
  shift1End.setHours(14, 0, 0, 0);

  const shift1 = await prisma.shift.create({
    data: {
      nozzleId: nozzle1.id,
      pompisteId: pompiste1.id,
      indexStart: 125000.00,
      indexEnd: 125200.00,
      startedAt: shift1Start,
      endedAt: shift1End,
      status: ShiftStatus.VALIDATED,
    },
  });

  // Create sales for shift1
  for (let i = 0; i < 8; i++) {
    const quantity = randomDecimal(15, 60);
    const unitPrice = 12.50;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));
    const saleTime = randomDate(shift1Start, shift1End);

    const sale = await prisma.sale.create({
      data: {
        shiftId: shift1.id,
        fuelTypeId: gasoil.id,
        clientId: i % 3 === 0 ? client1.id : null,
        quantity,
        unitPrice,
        totalAmount,
        soldAt: saleTime,
      },
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale.id,
        paymentMethodId: i % 2 === 0 ? cashMethod.id : cardMethod.id,
        amount: totalAmount,
        reference: i % 2 !== 0 ? `CB${Date.now()}${i}` : null,
      },
    });
  }

  // Create cash register for shift1
  await prisma.cashRegister.create({
    data: {
      shiftId: shift1.id,
      expectedTotal: 2500.00,
      actualTotal: 2480.00,
      variance: -20.00,
      varianceNote: 'Petit écart - erreur de rendu monnaie',
      closedAt: shift1End,
    },
  });

  // Shift 2 - Closed (yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const shift2Start = new Date(yesterday);
  shift2Start.setHours(6, 0, 0, 0);
  const shift2End = new Date(yesterday);
  shift2End.setHours(14, 0, 0, 0);

  const shift2 = await prisma.shift.create({
    data: {
      nozzleId: nozzle2.id,
      pompisteId: pompiste2.id,
      indexStart: 98500.00,
      indexEnd: 98700.00,
      startedAt: shift2Start,
      endedAt: shift2End,
      status: ShiftStatus.CLOSED,
    },
  });

  // Create sales for shift2
  for (let i = 0; i < 6; i++) {
    const quantity = randomDecimal(20, 50);
    const unitPrice = 14.20;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));
    const saleTime = randomDate(shift2Start, shift2End);

    const sale = await prisma.sale.create({
      data: {
        shiftId: shift2.id,
        fuelTypeId: sp95.id,
        clientId: i === 2 ? client2.id : null,
        quantity,
        unitPrice,
        totalAmount,
        soldAt: saleTime,
      },
    });

    // Mixed payment for one sale
    if (i === 3) {
      const cashPart = parseFloat((totalAmount * 0.6).toFixed(2));
      const cardPart = parseFloat((totalAmount - cashPart).toFixed(2));
      await prisma.salePayment.create({
        data: { saleId: sale.id, paymentMethodId: cashMethod.id, amount: cashPart },
      });
      await prisma.salePayment.create({
        data: { saleId: sale.id, paymentMethodId: cardMethod.id, amount: cardPart, reference: `CB${Date.now()}` },
      });
    } else {
      await prisma.salePayment.create({
        data: {
          saleId: sale.id,
          paymentMethodId: cashMethod.id,
          amount: totalAmount,
        },
      });
    }
  }

  // Shift 3 - Open (current)
  const shift3Start = new Date();
  shift3Start.setHours(6, 0, 0, 0);

  const shift3 = await prisma.shift.create({
    data: {
      nozzleId: nozzle3.id,
      pompisteId: pompiste1.id,
      indexStart: 87600.00,
      startedAt: shift3Start,
      status: ShiftStatus.OPEN,
    },
  });

  // Create some sales for current shift
  for (let i = 0; i < 3; i++) {
    const quantity = randomDecimal(25, 45);
    const unitPrice = 12.50;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));
    const saleTime = new Date();
    saleTime.setHours(saleTime.getHours() - (3 - i));

    const sale = await prisma.sale.create({
      data: {
        shiftId: shift3.id,
        fuelTypeId: gasoil.id,
        quantity,
        unitPrice,
        totalAmount,
        soldAt: saleTime,
      },
    });

    await prisma.salePayment.create({
      data: { saleId: sale.id, paymentMethodId: cashMethod.id, amount: totalAmount },
    });
  }

  // Additional validated shifts for history
  for (let d = 2; d <= 5; d++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - d);
    const shiftStart = new Date(pastDate);
    shiftStart.setHours(14, 0, 0, 0);
    const shiftEnd = new Date(pastDate);
    shiftEnd.setHours(22, 0, 0, 0);

    const historyShift = await prisma.shift.create({
      data: {
        nozzleId: d % 2 === 0 ? nozzle1.id : nozzle4.id,
        pompisteId: d % 2 === 0 ? pompiste2.id : pompiste3.id,
        indexStart: 100000 + d * 100,
        indexEnd: 100000 + d * 100 + randomDecimal(150, 300),
        startedAt: shiftStart,
        endedAt: shiftEnd,
        status: ShiftStatus.VALIDATED,
      },
    });

    // Add some sales
    const salesCount = Math.floor(Math.random() * 5) + 4;
    for (let s = 0; s < salesCount; s++) {
      const quantity = randomDecimal(20, 55);
      const fuelType = d % 2 === 0 ? gasoil : sp98;
      const unitPrice = d % 2 === 0 ? 12.50 : 15.50;
      const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));

      const sale = await prisma.sale.create({
        data: {
          shiftId: historyShift.id,
          fuelTypeId: fuelType.id,
          quantity,
          unitPrice,
          totalAmount,
          soldAt: randomDate(shiftStart, shiftEnd),
        },
      });

      await prisma.salePayment.create({
        data: { saleId: sale.id, paymentMethodId: cashMethod.id, amount: totalAmount },
      });
    }

    // Cash register
    const expectedTotal = randomDecimal(2000, 4000);
    await prisma.cashRegister.create({
      data: {
        shiftId: historyShift.id,
        expectedTotal,
        actualTotal: expectedTotal + randomDecimal(-50, 50),
        variance: randomDecimal(-50, 50),
        closedAt: shiftEnd,
      },
    });
  }
  console.log(`   ✅ Shifts and sales created\n`);

  // Create Deliveries
  console.log('🚛 Creating deliveries...');
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  await prisma.delivery.create({
    data: {
      tankId: tank1.id,
      supplierId: supplier1.id,
      receivedByUserId: gestionnaire.id,
      deliveryNoteNumber: 'BL-2024-001',
      quantity: 8000,
      purchasePrice: 9.80,
      levelBefore: 7000,
      levelAfter: 15000,
      temperature: 18.5,
      deliveredAt: threeDaysAgo,
    },
  });

  await prisma.delivery.create({
    data: {
      tankId: tank2.id,
      supplierId: supplier2.id,
      receivedByUserId: gestionnaire.id,
      deliveryNoteNumber: 'BL-2024-002',
      quantity: 6000,
      purchasePrice: 11.00,
      levelBefore: 3500,
      levelAfter: 9500,
      temperature: 19.2,
      deliveredAt: new Date(threeDaysAgo.getTime() + 86400000),
    },
  });

  await prisma.delivery.create({
    data: {
      tankId: tank4.id,
      supplierId: supplier1.id,
      receivedByUserId: gestionnaire.id,
      deliveryNoteNumber: 'BL-2024-003',
      quantity: 5000,
      purchasePrice: 10.50,
      levelBefore: 1000,
      levelAfter: 6000,
      temperature: 17.8,
      deliveredAt: new Date(threeDaysAgo.getTime() + 172800000),
    },
  });
  console.log(`   ✅ 3 deliveries created\n`);

  // Create Invoices
  console.log('📄 Creating invoices...');
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Invoice 1 - Paid
  const invoice1 = await prisma.invoice.create({
    data: {
      stationId: station.id,
      clientId: client1.id,
      invoiceNumber: 'FAC-2024-0001',
      invoiceType: InvoiceType.B2B,
      status: InvoiceStatus.PAID,
      amountHT: 8333.33,
      vatRate: 20.00,
      vatAmount: 1666.67,
      amountTTC: 10000.00,
      paidAmount: 10000.00,
      periodStart: twoWeeksAgo,
      periodEnd: oneWeekAgo,
      issuedAt: oneWeekAgo,
      dueDate: new Date(oneWeekAgo.getTime() + 30 * 86400000),
      paidAt: new Date(),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice1.id,
      fuelTypeId: gasoil.id,
      description: 'Gasoil 50ppm',
      quantity: 800,
      unitPriceHT: 10.42,
      totalHT: 8333.33,
      vatRate: 20.00,
      vatAmount: 1666.67,
      totalTTC: 10000.00,
    },
  });

  await prisma.invoicePayment.create({
    data: {
      invoiceId: invoice1.id,
      paymentMethodId: cardMethod.id,
      amount: 10000.00,
      reference: 'VIR-20240115',
      paymentDate: new Date(),
    },
  });

  // Invoice 2 - Partially paid
  const invoice2 = await prisma.invoice.create({
    data: {
      stationId: station.id,
      clientId: client2.id,
      invoiceNumber: 'FAC-2024-0002',
      invoiceType: InvoiceType.B2B,
      status: InvoiceStatus.PARTIALLY_PAID,
      amountHT: 4166.67,
      vatRate: 20.00,
      vatAmount: 833.33,
      amountTTC: 5000.00,
      paidAmount: 2000.00,
      periodStart: oneWeekAgo,
      periodEnd: yesterday,
      issuedAt: yesterday,
      dueDate: new Date(yesterday.getTime() + 45 * 86400000),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice2.id,
      fuelTypeId: sp95.id,
      description: 'Sans Plomb 95',
      quantity: 350,
      unitPriceHT: 11.90,
      totalHT: 4166.67,
      vatRate: 20.00,
      vatAmount: 833.33,
      totalTTC: 5000.00,
    },
  });

  await prisma.invoicePayment.create({
    data: {
      invoiceId: invoice2.id,
      paymentMethodId: cashMethod.id,
      amount: 2000.00,
      paymentDate: new Date(),
      notes: 'Acompte',
    },
  });

  // Invoice 3 - Issued (pending payment)
  const invoice3 = await prisma.invoice.create({
    data: {
      stationId: station.id,
      clientId: client3.id,
      invoiceNumber: 'FAC-2024-0003',
      invoiceType: InvoiceType.B2B,
      status: InvoiceStatus.ISSUED,
      amountHT: 6250.00,
      vatRate: 20.00,
      vatAmount: 1250.00,
      amountTTC: 7500.00,
      paidAmount: 0,
      issuedAt: new Date(),
      dueDate: new Date(Date.now() + 15 * 86400000),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice3.id,
      fuelTypeId: gasoil.id,
      description: 'Gasoil 50ppm',
      quantity: 600,
      unitPriceHT: 10.42,
      totalHT: 6250.00,
      vatRate: 20.00,
      vatAmount: 1250.00,
      totalTTC: 7500.00,
    },
  });

  // Invoice 4 - Draft
  const invoice4 = await prisma.invoice.create({
    data: {
      stationId: station.id,
      clientId: client5.id,
      invoiceNumber: 'FAC-2024-0004',
      invoiceType: InvoiceType.B2B,
      status: InvoiceStatus.DRAFT,
      amountHT: 12500.00,
      vatRate: 20.00,
      vatAmount: 2500.00,
      amountTTC: 15000.00,
      paidAmount: 0,
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice4.id,
      fuelTypeId: dieselPlus.id,
      description: 'Diesel Excellence',
      quantity: 1000,
      unitPriceHT: 12.50,
      totalHT: 12500.00,
      vatRate: 20.00,
      vatAmount: 2500.00,
      totalTTC: 15000.00,
    },
  });

  // Invoice 5 - Cancelled
  await prisma.invoice.create({
    data: {
      stationId: station.id,
      clientId: client4.id,
      invoiceNumber: 'FAC-2024-0005',
      invoiceType: InvoiceType.B2C_TICKET,
      status: InvoiceStatus.CANCELLED,
      amountHT: 416.67,
      vatRate: 20.00,
      vatAmount: 83.33,
      amountTTC: 500.00,
      paidAmount: 0,
      notes: 'Annulée - erreur de facturation',
    },
  });
  console.log(`   ✅ 5 invoices created\n`);

  // Create Pompiste Debts
  console.log('💸 Creating pompiste debts...');
  const debt1 = await prisma.pompisteDebt.create({
    data: {
      pompisteId: pompiste1.id,
      stationId: station.id,
      amount: 350.00,
      remainingAmount: 200.00,
      reason: DebtReason.CASH_VARIANCE,
      status: DebtStatus.PARTIALLY_PAID,
      description: 'Écart de caisse du 10/01/2024 - manque justifié partiellement',
      createdByUserId: gestionnaire.id,
    },
  });

  await prisma.debtPayment.create({
    data: {
      debtId: debt1.id,
      amount: 150.00,
      paymentMethod: 'SALARY_DEDUCTION',
      note: 'Retenue sur salaire Janvier',
      receivedByUserId: gestionnaire.id,
      paymentDate: new Date(Date.now() - 5 * 86400000),
    },
  });

  await prisma.pompisteDebt.create({
    data: {
      pompisteId: pompiste2.id,
      stationId: station.id,
      amount: 500.00,
      remainingAmount: 500.00,
      reason: DebtReason.ADVANCE,
      status: DebtStatus.PENDING,
      description: 'Avance sur salaire - urgence familiale',
      createdByUserId: gestionnaire.id,
    },
  });

  const debt3 = await prisma.pompisteDebt.create({
    data: {
      pompisteId: pompiste3.id,
      stationId: station.id,
      amount: 180.00,
      remainingAmount: 0,
      reason: DebtReason.CASH_VARIANCE,
      status: DebtStatus.PAID,
      description: 'Écart de caisse mineur - remboursé',
      createdByUserId: gestionnaire.id,
    },
  });

  await prisma.debtPayment.create({
    data: {
      debtId: debt3.id,
      amount: 180.00,
      paymentMethod: 'CASH',
      note: 'Remboursement intégral',
      receivedByUserId: gestionnaire.id,
      paymentDate: new Date(Date.now() - 2 * 86400000),
    },
  });

  await prisma.pompisteDebt.create({
    data: {
      pompisteId: pompiste1.id,
      stationId: station.id,
      amount: 75.00,
      remainingAmount: 75.00,
      reason: DebtReason.DAMAGE,
      status: DebtStatus.PENDING,
      description: 'Casse pistolet - remplacement joint',
      createdByUserId: gestionnaire.id,
    },
  });
  console.log(`   ✅ 4 debts created\n`);

  // Create Alerts
  console.log('🚨 Creating alerts...');
  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.LOW_STOCK,
      priority: AlertPriority.HIGH,
      status: AlertStatus.ACTIVE,
      title: 'Stock bas - Sans Plomb 95',
      message: 'Le niveau de la cuve CUVE-002 (SP95) est descendu sous le seuil d\'alerte. Niveau actuel: 4500L, Seuil: 5000L',
      relatedEntityId: tank2.id,
      relatedEntityType: 'Tank',
      triggeredAt: new Date(Date.now() - 3600000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.LOW_STOCK,
      priority: AlertPriority.CRITICAL,
      status: AlertStatus.ACTIVE,
      title: 'Stock critique - Diesel Excellence',
      message: 'Le niveau de la cuve CUVE-004 (Diesel Excellence) est critique. Niveau actuel: 1500L, Seuil: 2000L',
      relatedEntityId: tank4.id,
      relatedEntityType: 'Tank',
      triggeredAt: new Date(Date.now() - 7200000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.SHIFT_OPEN_TOO_LONG,
      priority: AlertPriority.MEDIUM,
      status: AlertStatus.ACKNOWLEDGED,
      title: 'Shift ouvert depuis plus de 8h',
      message: `Le shift du pompiste Ahmed Benali est ouvert depuis plus de 8 heures.`,
      relatedEntityId: shift3.id,
      relatedEntityType: 'Shift',
      triggeredAt: new Date(Date.now() - 3600000),
      acknowledgedByUserId: gestionnaire.id,
      acknowledgedAt: new Date(),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.CASH_VARIANCE,
      priority: AlertPriority.HIGH,
      status: AlertStatus.RESOLVED,
      title: 'Écart de caisse détecté',
      message: 'Un écart de -20 MAD a été détecté à la clôture du shift de Ahmed Benali.',
      relatedEntityId: shift1.id,
      relatedEntityType: 'Shift',
      triggeredAt: new Date(Date.now() - 7 * 86400000),
      acknowledgedByUserId: gestionnaire.id,
      acknowledgedAt: new Date(Date.now() - 7 * 86400000 + 3600000),
      resolvedByUserId: gestionnaire.id,
      resolvedAt: new Date(Date.now() - 6 * 86400000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.CREDIT_LIMIT,
      priority: AlertPriority.MEDIUM,
      status: AlertStatus.ACTIVE,
      title: 'Limite crédit proche - Taxi Services Express',
      message: 'Le client Taxi Services Express a atteint 85% de sa limite de crédit (8500/10000 MAD).',
      relatedEntityId: client3.id,
      relatedEntityType: 'Client',
      triggeredAt: new Date(Date.now() - 86400000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.MAINTENANCE_DUE,
      priority: AlertPriority.LOW,
      status: AlertStatus.ACTIVE,
      title: 'Maintenance préventive requise',
      message: 'Le distributeur DC-01 nécessite une maintenance préventive (dernier contrôle il y a 90 jours).',
      relatedEntityId: dispenser1.id,
      relatedEntityType: 'Dispenser',
      triggeredAt: new Date(Date.now() - 172800000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station.id,
      alertType: AlertType.INDEX_VARIANCE,
      priority: AlertPriority.HIGH,
      status: AlertStatus.IGNORED,
      title: 'Écart d\'index suspect',
      message: 'Écart anormal entre les ventes enregistrées et l\'index compteur du pistolet DC01-P1.',
      relatedEntityId: nozzle1.id,
      relatedEntityType: 'Nozzle',
      triggeredAt: new Date(Date.now() - 5 * 86400000),
    },
  });
  console.log(`   ✅ 7 alerts created\n`);

  // Create Stock Movements
  console.log('📦 Creating stock movements...');
  await prisma.stockMovement.create({
    data: {
      tankId: tank1.id,
      userId: gestionnaire.id,
      movementType: MovementType.DELIVERY,
      quantity: 8000,
      balanceAfter: 15000,
      referenceType: 'DELIVERY',
      reason: 'Livraison BL-2024-001',
    },
  });

  await prisma.stockMovement.create({
    data: {
      tankId: tank2.id,
      userId: gestionnaire.id,
      movementType: MovementType.ADJUSTMENT,
      quantity: -200,
      balanceAfter: 4500,
      referenceType: 'MANUAL',
      reason: 'Ajustement après jaugeage',
    },
  });
  console.log(`   ✅ Stock movements created\n`);

  // ============================================================
  // STATION 2 : Station Rabat Agdal
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('🏪 Creating Station 2 - Rabat Agdal...\n');

  const station2 = await prisma.station.create({
    data: {
      name: 'Station Rabat Agdal',
      address: '78 Avenue de France',
      city: 'Rabat',
      phone: '+212537456789',
      email: 'station.rabat@test.com',
      ice: '005678901000093',
      taxId: '56789012',
      rc: '567890',
      patente: 'PAT456',
      stationCode: 'RAB01',
      isActive: true,
    },
  });
  console.log(`   ✅ Station 2 created: ${station2.name}\n`);

  // Licence BETA for station 2
  console.log('📜 Creating BETA licence for station 2...');
  await prisma.licence.create({
    data: {
      stationId: station2.id,
      plan: LicencePlan.BETA,
      status: LicenceStatus.ACTIVE,
      startDate,
      endDate,
      maxUsers: 99,
      maxDispensers: 99,
      maxTanks: 99,
      maxStations: 10,
      gracePeriodDays: 30,
      features: {
        shifts: true,
        fuelSales: true,
        cashPayments: true,
        cardPayments: true,
        fuelVouchers: true,
        dashboardBasic: true,
        dashboardAdvanced: true,
        dashboardGlobal: true,
        invoicingB2C: true,
        invoicingB2B: true,
        creditNotes: true,
        creditClients: true,
        reportsBasic: true,
        reportsPdf: true,
        reportsExcel: true,
        reportsBi: true,
        lowStockAlerts: true,
        maintenancePreventive: true,
        multiStation: true,
        apiAccess: true,
        webhooks: true,
        offlineMode: true,
        dgiCompliance: true,
      },
    },
  });
  console.log(`   ✅ BETA Licence created for station 2\n`);

  // Users for station 2
  console.log('👤 Creating users for station 2...');
  const gestionnaire2 = await prisma.user.create({
    data: {
      stationId: station2.id,
      email: 'gestionnaire2@station.com',
      passwordHash: await hashPassword('Gest456!'),
      badgeCode: 'G002',
      pinCodeHash: await hashPinCode('333333'),
      firstName: 'Rachida',
      lastName: 'Benkirane',
      phone: '+212600100001',
      role: UserRole.GESTIONNAIRE,
      isActive: true,
    },
  });

  const pompiste4 = await prisma.user.create({
    data: {
      stationId: station2.id,
      badgeCode: 'P004',
      pinCodeHash: await hashPinCode('444444'),
      firstName: 'Hamid',
      lastName: 'Ouazzani',
      phone: '+212600100002',
      role: UserRole.POMPISTE,
      isActive: true,
    },
  });

  const pompiste5 = await prisma.user.create({
    data: {
      stationId: station2.id,
      badgeCode: 'P005',
      pinCodeHash: await hashPinCode('555555'),
      firstName: 'Samir',
      lastName: 'Kettani',
      phone: '+212600100003',
      role: UserRole.POMPISTE,
      isActive: true,
    },
  });
  console.log(`   ✅ 3 users created for station 2\n`);

  // Tanks for station 2
  console.log('🛢️ Creating tanks for station 2...');
  const s2Tank1 = await prisma.tank.create({
    data: {
      stationId: station2.id,
      fuelTypeId: gasoil.id,
      capacity: 15000,
      currentLevel: 11000,
      lowThreshold: 3000,
      reference: 'CUVE-R01',
      isActive: true,
    },
  });

  const s2Tank2 = await prisma.tank.create({
    data: {
      stationId: station2.id,
      fuelTypeId: sp95.id,
      capacity: 12000,
      currentLevel: 2000, // Low stock!
      lowThreshold: 3000,
      reference: 'CUVE-R02',
      isActive: true,
    },
  });
  console.log(`   ✅ 2 tanks created for station 2\n`);

  // Dispensers for station 2
  console.log('⛽ Creating dispensers for station 2...');
  const s2Dispenser1 = await prisma.dispenser.create({
    data: { stationId: station2.id, reference: 'DC-R01', isActive: true },
  });

  const s2Dispenser2 = await prisma.dispenser.create({
    data: { stationId: station2.id, reference: 'DC-R02', isActive: true },
  });
  console.log(`   ✅ 2 dispensers created for station 2\n`);

  // Nozzles for station 2
  console.log('🔫 Creating nozzles for station 2...');
  const s2Nozzle1 = await prisma.nozzle.create({
    data: {
      dispenserId: s2Dispenser1.id,
      tankId: s2Tank1.id,
      fuelTypeId: gasoil.id,
      reference: 'DCR01-P1',
      currentIndex: 45000.00,
      position: 1,
      isActive: true,
    },
  });

  const s2Nozzle2 = await prisma.nozzle.create({
    data: {
      dispenserId: s2Dispenser1.id,
      tankId: s2Tank2.id,
      fuelTypeId: sp95.id,
      reference: 'DCR01-P2',
      currentIndex: 32000.50,
      position: 2,
      isActive: true,
    },
  });

  const s2Nozzle3 = await prisma.nozzle.create({
    data: {
      dispenserId: s2Dispenser2.id,
      tankId: s2Tank1.id,
      fuelTypeId: gasoil.id,
      reference: 'DCR02-P1',
      currentIndex: 28500.75,
      position: 1,
      isActive: true,
    },
  });
  console.log(`   ✅ 3 nozzles created for station 2\n`);

  // Prices for station 2
  console.log('💰 Creating prices for station 2...');
  await Promise.all([
    prisma.price.create({
      data: {
        stationId: station2.id,
        fuelTypeId: gasoil.id,
        sellingPrice: 12.80,
        sellingPriceHT: 10.67,
        purchasePrice: 9.90,
        effectiveFrom: now,
        createdByUserId: gestionnaire2.id,
      },
    }),
    prisma.price.create({
      data: {
        stationId: station2.id,
        fuelTypeId: sp95.id,
        sellingPrice: 14.50,
        sellingPriceHT: 12.08,
        purchasePrice: 11.20,
        effectiveFrom: now,
        createdByUserId: gestionnaire2.id,
      },
    }),
  ]);
  console.log(`   ✅ 2 prices created for station 2\n`);

  // Clients for station 2
  console.log('👥 Creating clients for station 2...');
  const s2Client1 = await prisma.client.create({
    data: {
      stationId: station2.id,
      clientType: ClientType.B2B,
      companyName: 'Société Marocaine de Transport',
      contactName: 'Amine Tahiri',
      ice: '006789012000094',
      taxId: '67890123',
      rc: '678901',
      address: '22 Av Hassan II, Rabat',
      phone: '+212537222333',
      email: 'contact@smt.ma',
      creditLimit: 40000,
      currentBalance: 15000,
      paymentTermDays: 30,
      isActive: true,
    },
  });

  const s2Client2 = await prisma.client.create({
    data: {
      stationId: station2.id,
      clientType: ClientType.B2B,
      companyName: 'Rabat Express Livraison',
      contactName: 'Samira Hajji',
      ice: '007890123000095',
      address: '5 Rue Souissi, Rabat',
      phone: '+212537444555',
      email: 'compta@rabat-express.ma',
      creditLimit: 25000,
      currentBalance: 22000,
      paymentTermDays: 30,
      isActive: true,
    },
  });

  await prisma.client.create({
    data: {
      stationId: station2.id,
      clientType: ClientType.B2C_REGISTERED,
      contactName: 'Leila Amrani',
      phone: '+212661888999',
      creditLimit: 3000,
      currentBalance: 500,
      isActive: true,
    },
  });
  console.log(`   ✅ 3 clients created for station 2\n`);

  // Deliveries for station 2 (reuse supplier1 = AFRIQUIA)
  console.log('🚛 Creating deliveries for station 2...');
  const s2FiveDaysAgo = new Date();
  s2FiveDaysAgo.setDate(s2FiveDaysAgo.getDate() - 5);

  await prisma.delivery.create({
    data: {
      tankId: s2Tank1.id,
      supplierId: supplier1.id,
      receivedByUserId: gestionnaire2.id,
      deliveryNoteNumber: 'BL-RAB-001',
      quantity: 7000,
      purchasePrice: 9.90,
      levelBefore: 4000,
      levelAfter: 11000,
      temperature: 20.1,
      deliveredAt: s2FiveDaysAgo,
    },
  });

  await prisma.delivery.create({
    data: {
      tankId: s2Tank2.id,
      supplierId: supplier1.id,
      receivedByUserId: gestionnaire2.id,
      deliveryNoteNumber: 'BL-RAB-002',
      quantity: 5000,
      purchasePrice: 11.20,
      levelBefore: 2000,
      levelAfter: 7000,
      temperature: 19.5,
      deliveredAt: new Date(s2FiveDaysAgo.getTime() + 2 * 86400000),
    },
  });
  console.log(`   ✅ 2 deliveries created for station 2\n`);

  // Shifts for station 2
  console.log('📋 Creating shifts for station 2...');

  // Shift S2-1: VALIDATED (5 days ago)
  const s2Shift1Start = new Date();
  s2Shift1Start.setDate(s2Shift1Start.getDate() - 5);
  s2Shift1Start.setHours(6, 0, 0, 0);
  const s2Shift1End = new Date(s2Shift1Start);
  s2Shift1End.setHours(14, 0, 0, 0);

  const s2Shift1 = await prisma.shift.create({
    data: {
      nozzleId: s2Nozzle1.id,
      pompisteId: pompiste4.id,
      indexStart: 44700.00,
      indexEnd: 44900.00,
      startedAt: s2Shift1Start,
      endedAt: s2Shift1End,
      status: ShiftStatus.VALIDATED,
    },
  });

  // Sales for s2Shift1
  for (let i = 0; i < 5; i++) {
    const quantity = randomDecimal(20, 55);
    const unitPrice = 12.80;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));
    const saleTime = randomDate(s2Shift1Start, s2Shift1End);

    const sale = await prisma.sale.create({
      data: {
        shiftId: s2Shift1.id,
        fuelTypeId: gasoil.id,
        clientId: i === 0 ? s2Client1.id : null,
        quantity,
        unitPrice,
        totalAmount,
        soldAt: saleTime,
      },
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale.id,
        paymentMethodId: i % 2 === 0 ? cashMethod.id : cardMethod.id,
        amount: totalAmount,
        reference: i % 2 !== 0 ? `CB-R${Date.now()}${i}` : null,
      },
    });
  }

  // Shift S2-2: CLOSED (yesterday)
  const s2Shift2Start = new Date(yesterday);
  s2Shift2Start.setHours(6, 0, 0, 0);
  const s2Shift2End = new Date(yesterday);
  s2Shift2End.setHours(14, 0, 0, 0);

  const s2Shift2 = await prisma.shift.create({
    data: {
      nozzleId: s2Nozzle2.id,
      pompisteId: pompiste5.id,
      indexStart: 31800.00,
      indexEnd: 32000.50,
      startedAt: s2Shift2Start,
      endedAt: s2Shift2End,
      status: ShiftStatus.CLOSED,
    },
  });

  // Sales for s2Shift2
  for (let i = 0; i < 4; i++) {
    const quantity = randomDecimal(15, 40);
    const unitPrice = 14.50;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));
    const saleTime = randomDate(s2Shift2Start, s2Shift2End);

    const sale = await prisma.sale.create({
      data: {
        shiftId: s2Shift2.id,
        fuelTypeId: sp95.id,
        clientId: i === 1 ? s2Client2.id : null,
        quantity,
        unitPrice,
        totalAmount,
        soldAt: saleTime,
      },
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale.id,
        paymentMethodId: cashMethod.id,
        amount: totalAmount,
      },
    });
  }

  // Cash register for s2Shift2 (closed shift)
  await prisma.cashRegister.create({
    data: {
      shiftId: s2Shift2.id,
      expectedTotal: 1800.00,
      actualTotal: 1790.00,
      variance: -10.00,
      varianceNote: 'Petit écart de monnaie',
      closedAt: s2Shift2End,
    },
  });

  // Shift S2-3: OPEN (today)
  const s2Shift3Start = new Date();
  s2Shift3Start.setHours(6, 0, 0, 0);

  const s2Shift3 = await prisma.shift.create({
    data: {
      nozzleId: s2Nozzle3.id,
      pompisteId: pompiste4.id,
      indexStart: 28400.00,
      startedAt: s2Shift3Start,
      status: ShiftStatus.OPEN,
    },
  });

  // A couple sales for the open shift
  for (let i = 0; i < 2; i++) {
    const quantity = randomDecimal(20, 40);
    const unitPrice = 12.80;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));
    const saleTime = new Date();
    saleTime.setHours(saleTime.getHours() - (2 - i));

    const sale = await prisma.sale.create({
      data: {
        shiftId: s2Shift3.id,
        fuelTypeId: gasoil.id,
        quantity,
        unitPrice,
        totalAmount,
        soldAt: saleTime,
      },
    });

    await prisma.salePayment.create({
      data: { saleId: sale.id, paymentMethodId: cashMethod.id, amount: totalAmount },
    });
  }
  console.log(`   ✅ 3 shifts with sales created for station 2\n`);

  // Invoices for station 2
  console.log('📄 Creating invoices for station 2...');

  // Invoice S2-1: ISSUED
  const s2Invoice1 = await prisma.invoice.create({
    data: {
      stationId: station2.id,
      clientId: s2Client1.id,
      invoiceNumber: 'RAB01-2024-00001',
      invoiceType: InvoiceType.B2B,
      status: InvoiceStatus.ISSUED,
      amountHT: 5000.00,
      vatRate: 20.00,
      vatAmount: 1000.00,
      amountTTC: 6000.00,
      paidAmount: 0,
      issuedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: s2Invoice1.id,
      fuelTypeId: gasoil.id,
      description: 'Gasoil 50ppm',
      quantity: 468,
      unitPriceHT: 10.67,
      totalHT: 5000.00,
      vatRate: 20.00,
      vatAmount: 1000.00,
      totalTTC: 6000.00,
    },
  });

  // Invoice S2-2: DRAFT
  const s2Invoice2 = await prisma.invoice.create({
    data: {
      stationId: station2.id,
      clientId: s2Client2.id,
      invoiceNumber: 'RAB01-2024-00002',
      invoiceType: InvoiceType.B2B,
      status: InvoiceStatus.DRAFT,
      amountHT: 3500.00,
      vatRate: 20.00,
      vatAmount: 700.00,
      amountTTC: 4200.00,
      paidAmount: 0,
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: s2Invoice2.id,
      fuelTypeId: sp95.id,
      description: 'Sans Plomb 95',
      quantity: 290,
      unitPriceHT: 12.08,
      totalHT: 3500.00,
      vatRate: 20.00,
      vatAmount: 700.00,
      totalTTC: 4200.00,
    },
  });
  console.log(`   ✅ 2 invoices created for station 2\n`);

  // Pompiste debt for station 2
  console.log('💸 Creating pompiste debt for station 2...');
  await prisma.pompisteDebt.create({
    data: {
      pompisteId: pompiste5.id,
      stationId: station2.id,
      amount: 250.00,
      remainingAmount: 250.00,
      reason: DebtReason.CASH_VARIANCE,
      status: DebtStatus.PENDING,
      description: 'Écart de caisse du shift du 08/02 - en attente de justification',
      createdByUserId: gestionnaire2.id,
    },
  });
  console.log(`   ✅ 1 debt created for station 2\n`);

  // Alerts for station 2
  console.log('🚨 Creating alerts for station 2...');
  await prisma.alert.create({
    data: {
      stationId: station2.id,
      alertType: AlertType.LOW_STOCK,
      priority: AlertPriority.HIGH,
      status: AlertStatus.ACTIVE,
      title: 'Stock bas - Sans Plomb 95',
      message: 'Le niveau de la cuve CUVE-R02 (SP95) est descendu sous le seuil d\'alerte. Niveau actuel: 2000L, Seuil: 3000L',
      relatedEntityId: s2Tank2.id,
      relatedEntityType: 'Tank',
      triggeredAt: new Date(Date.now() - 3600000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station2.id,
      alertType: AlertType.SHIFT_OPEN_TOO_LONG,
      priority: AlertPriority.MEDIUM,
      status: AlertStatus.ACTIVE,
      title: 'Shift ouvert depuis plus de 8h',
      message: `Le shift du pompiste Hamid Ouazzani est ouvert depuis plus de 8 heures.`,
      relatedEntityId: s2Shift3.id,
      relatedEntityType: 'Shift',
      triggeredAt: new Date(Date.now() - 1800000),
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station2.id,
      alertType: AlertType.CREDIT_LIMIT,
      priority: AlertPriority.HIGH,
      status: AlertStatus.ACTIVE,
      title: 'Limite crédit proche - Rabat Express Livraison',
      message: 'Le client Rabat Express Livraison a atteint 88% de sa limite de crédit (22000/25000 MAD).',
      relatedEntityId: s2Client2.id,
      relatedEntityType: 'Client',
      triggeredAt: new Date(Date.now() - 43200000),
    },
  });
  console.log(`   ✅ 3 alerts created for station 2\n`);

  // Stock movements for station 2
  console.log('📦 Creating stock movements for station 2...');
  await prisma.stockMovement.create({
    data: {
      tankId: s2Tank1.id,
      userId: gestionnaire2.id,
      movementType: MovementType.DELIVERY,
      quantity: 7000,
      balanceAfter: 11000,
      referenceType: 'DELIVERY',
      reason: 'Livraison BL-RAB-001',
    },
  });

  await prisma.stockMovement.create({
    data: {
      tankId: s2Tank2.id,
      userId: gestionnaire2.id,
      movementType: MovementType.DELIVERY,
      quantity: 5000,
      balanceAfter: 7000,
      referenceType: 'DELIVERY',
      reason: 'Livraison BL-RAB-002',
    },
  });
  console.log(`   ✅ 2 stock movements created for station 2\n`);

  // Summary
  console.log('=' .repeat(60));
  console.log('\n📋 RÉSUMÉ DES DONNÉES DE TEST:\n');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ PLATEFORME (propriétaire SaaS, aucune station)              │');
  console.log('├─────────────────┬────────────────────────────┬──────┬───────┤');
  console.log('│ Rôle            │ Email                      │ Badge│ PIN   │');
  console.log('├─────────────────┼────────────────────────────┼──────┼───────┤');
  console.log('│ SUPER_ADMIN     │ admin@station.com          │ -    │ -     │');
  console.log('├─────────────────┴────────────────────────────┴──────┴───────┤');
  console.log('│ STATION 1 - Casablanca                                     │');
  console.log('├─────────────────┬────────────────────────────┬──────┬───────┤');
  console.log('│ GESTIONNAIRE    │ gestionnaire@station.com   │ G001 │ 123456│');
  console.log('│ POMPISTE        │ -                          │ P001 │ 654321│');
  console.log('│ POMPISTE        │ -                          │ P002 │ 111111│');
  console.log('│ POMPISTE        │ -                          │ P003 │ 222222│');
  console.log('├─────────────────┴────────────────────────────┴──────┴───────┤');
  console.log('│ STATION 2 - Rabat Agdal                                    │');
  console.log('├─────────────────┬────────────────────────────┬──────┬───────┤');
  console.log('│ GESTIONNAIRE    │ gestionnaire2@station.com  │ G002 │ 333333│');
  console.log('│ POMPISTE        │ -                          │ P004 │ 444444│');
  console.log('│ POMPISTE        │ -                          │ P005 │ 555555│');
  console.log('└─────────────────┴────────────────────────────┴──────┴───────┘');
  console.log('\nMots de passe: SUPER_ADMIN=Admin123!, GEST1=Gest123!, GEST2=Gest456!');
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ DONNÉES CRÉÉES                                              │');
  console.log('├─────────────────────────────────────┬──────────┬────────────┤');
  console.log('│ Entité                              │ Station 1│ Station 2  │');
  console.log('├─────────────────────────────────────┼──────────┼────────────┤');
  console.log('│ Utilisateurs (hors SUPER_ADMIN)     │ 4        │ 3          │');
  console.log('│ Cuves                               │ 4        │ 2          │');
  console.log('│ Distributeurs                       │ 3        │ 2          │');
  console.log('│ Pistolets                           │ 5        │ 3          │');
  console.log('│ Prix                                │ 4        │ 2          │');
  console.log('│ Clients                             │ 5        │ 3          │');
  console.log('│ Shifts (OPEN/CLOSED/VALIDATED)      │ 1/1/5    │ 1/1/1      │');
  console.log('│ Ventes                              │ ~35      │ ~11        │');
  console.log('│ Livraisons                          │ 3        │ 2          │');
  console.log('│ Factures                            │ 5        │ 2          │');
  console.log('│ Dettes pompistes                    │ 4        │ 1          │');
  console.log('│ Alertes                             │ 7        │ 3          │');
  console.log('│ Stock movements                     │ 2        │ 2          │');
  console.log('├─────────────────────────────────────┴──────────┴────────────┤');
  console.log('│ Partagés: 4 fuel types, 5 payment methods, 2 fournisseurs  │');
  console.log('│ Plateforme: 1 SUPER_ADMIN (propriétaire SaaS)              │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n✅ Seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
