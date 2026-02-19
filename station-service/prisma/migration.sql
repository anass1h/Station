-- =============================================
-- Station Service — Consolidated Migration
-- Generated from schema.prisma (single file)
-- =============================================

-- ===========================================
-- ENUMS
-- ===========================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('POMPISTE', 'GESTIONNAIRE', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('DELIVERY', 'SALE', 'ADJUSTMENT', 'CALIBRATION', 'LOSS');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('B2B', 'B2C_REGISTERED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INTERNAL', 'B2B', 'B2C_TICKET');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'SHIFT_OPEN_TOO_LONG', 'CASH_VARIANCE', 'INDEX_VARIANCE', 'MAINTENANCE_DUE', 'CREDIT_LIMIT');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "LicencePlan" AS ENUM ('BETA');

-- CreateEnum
CREATE TYPE "LicenceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DebtReason" AS ENUM ('CASH_VARIANCE', 'ADVANCE', 'DAMAGE', 'FUEL_LOSS', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- ===========================================
-- TABLES
-- ===========================================

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "stationId" TEXT, -- NULL pour SUPER_ADMIN (propriétaire SaaS, non rattaché à une station)
    "email" TEXT,
    "passwordHash" TEXT,
    "badgeCode" TEXT,
    "pinCodeHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "ice" TEXT,
    "taxId" TEXT,
    "rc" TEXT,
    "patente" TEXT,
    "stationCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanks" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "capacity" DECIMAL(12,2) NOT NULL,
    "currentLevel" DECIMAL(12,2) NOT NULL,
    "lowThreshold" DECIMAL(12,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensers" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispensers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nozzles" (
    "id" TEXT NOT NULL,
    "dispenserId" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "currentIndex" DECIMAL(12,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nozzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "nozzleId" TEXT NOT NULL,
    "pompisteId" TEXT NOT NULL,
    "indexStart" DECIMAL(12,2) NOT NULL,
    "indexEnd" DECIMAL(12,2),
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "incidentNote" TEXT,
    "validatedByUserId" TEXT,
    "validatedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "clientId" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresReference" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "expectedTotal" DECIMAL(12,2) NOT NULL,
    "actualTotal" DECIMAL(12,2) NOT NULL,
    "variance" DECIMAL(12,2) NOT NULL,
    "varianceNote" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_details" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "expectedAmount" DECIMAL(12,2) NOT NULL,
    "actualAmount" DECIMAL(12,2) NOT NULL,
    "variance" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "ice" TEXT,
    "taxId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "receivedByUserId" TEXT NOT NULL,
    "deliveryNoteNumber" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "levelBefore" DECIMAL(12,2) NOT NULL,
    "levelAfter" DECIMAL(12,2) NOT NULL,
    "temperature" DECIMAL(5,2),
    "orderedQuantity" DECIMAL(12,2),
    "deliveryVariance" DECIMAL(12,2),
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "sellingPriceHT" DECIMAL(10,2) NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "clientType" "ClientType" NOT NULL,
    "companyName" TEXT,
    "contactName" TEXT,
    "ice" TEXT,
    "taxId" TEXT,
    "rc" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "clientId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "amountHT" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "amountTTC" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "periodStart" DATE,
    "periodEnd" DATE,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPriceHT" DECIMAL(10,2) NOT NULL,
    "totalHT" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "totalTTC" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "paymentDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "originalInvoiceId" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "amountHT" DECIMAL(12,2) NOT NULL,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "amountTTC" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "dispenserId" TEXT,
    "tankId" TEXT,
    "nozzleId" TEXT,
    "performedByUserId" TEXT,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "findings" TEXT,
    "actionsTaken" TEXT,
    "cost" DECIMAL(12,2),
    "vendorName" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "priority" "AlertPriority" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "acknowledgedByUserId" TEXT,
    "resolvedByUserId" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licences" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "plan" "LicencePlan" NOT NULL,
    "status" "LicenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT 99,
    "maxDispensers" INTEGER NOT NULL DEFAULT 99,
    "maxTanks" INTEGER NOT NULL DEFAULT 99,
    "maxStations" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "stationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pompiste_debts" (
    "id" TEXT NOT NULL,
    "pompisteId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "remainingAmount" DECIMAL(12,2) NOT NULL,
    "reason" "DebtReason" NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pompiste_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "note" TEXT,
    "receivedByUserId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- ===========================================
-- UNIQUE INDEXES
-- ===========================================

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Case-insensitive email index for login normalization
CREATE UNIQUE INDEX "users_email_ci_idx" ON "users" (LOWER("email"));

-- CreateIndex
CREATE UNIQUE INDEX "users_badgeCode_key" ON "users"("badgeCode");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "stations_ice_key" ON "stations"("ice");

-- CreateIndex
CREATE UNIQUE INDEX "stations_taxId_key" ON "stations"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "stations_stationCode_key" ON "stations"("stationCode");

-- CreateIndex
CREATE UNIQUE INDEX "stations_rc_city_key" ON "stations"("rc", "city");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_types_code_key" ON "fuel_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tanks_stationId_reference_key" ON "tanks"("stationId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "dispensers_stationId_reference_key" ON "dispensers"("stationId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "nozzles_dispenserId_reference_key" ON "nozzles"("dispenserId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_code_key" ON "payment_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cash_registers_shiftId_key" ON "cash_registers"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryNoteNumber_key" ON "deliveries"("deliveryNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "clients_stationId_ice_key" ON "clients"("stationId", "ice");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stationId_invoiceNumber_key" ON "invoices"("stationId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_creditNoteNumber_key" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "licences_stationId_key" ON "licences"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_ice_key" ON "suppliers"("ice");

-- ===========================================
-- PERFORMANCE INDEXES
-- ===========================================

-- users
CREATE INDEX "users_stationId_idx" ON "users"("stationId");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- refresh_tokens
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- stations
CREATE INDEX "stations_isActive_idx" ON "stations"("isActive");
CREATE INDEX "stations_city_idx" ON "stations"("city");

-- fuel_types
CREATE INDEX "fuel_types_isActive_idx" ON "fuel_types"("isActive");

-- tanks
CREATE INDEX "tanks_stationId_idx" ON "tanks"("stationId");
CREATE INDEX "tanks_fuelTypeId_idx" ON "tanks"("fuelTypeId");
CREATE INDEX "tanks_isActive_idx" ON "tanks"("isActive");

-- dispensers
CREATE INDEX "dispensers_stationId_idx" ON "dispensers"("stationId");
CREATE INDEX "dispensers_isActive_idx" ON "dispensers"("isActive");

-- nozzles
CREATE INDEX "nozzles_dispenserId_idx" ON "nozzles"("dispenserId");
CREATE INDEX "nozzles_tankId_idx" ON "nozzles"("tankId");
CREATE INDEX "nozzles_isActive_idx" ON "nozzles"("isActive");

-- shifts
CREATE INDEX "shifts_status_idx" ON "shifts"("status");
CREATE INDEX "shifts_pompisteId_idx" ON "shifts"("pompisteId");
CREATE INDEX "shifts_nozzleId_idx" ON "shifts"("nozzleId");
CREATE INDEX "shifts_startedAt_idx" ON "shifts"("startedAt");
CREATE INDEX "shifts_pompisteId_status_idx" ON "shifts"("pompisteId", "status");

-- sales
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");
CREATE INDEX "sales_shiftId_idx" ON "sales"("shiftId");
CREATE INDEX "sales_fuelTypeId_idx" ON "sales"("fuelTypeId");
CREATE INDEX "sales_clientId_idx" ON "sales"("clientId");
CREATE INDEX "sales_soldAt_idx" ON "sales"("soldAt");

-- payment_methods
CREATE INDEX "payment_methods_isActive_idx" ON "payment_methods"("isActive");

-- cash_registers
CREATE INDEX "cash_registers_shiftId_idx" ON "cash_registers"("shiftId");
CREATE INDEX "cash_registers_closedAt_idx" ON "cash_registers"("closedAt");

-- suppliers
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- deliveries
CREATE INDEX "deliveries_tankId_idx" ON "deliveries"("tankId");
CREATE INDEX "deliveries_supplierId_idx" ON "deliveries"("supplierId");
CREATE INDEX "deliveries_deliveredAt_idx" ON "deliveries"("deliveredAt");

-- stock_movements
CREATE INDEX "stock_movements_tankId_idx" ON "stock_movements"("tankId");
CREATE INDEX "stock_movements_movementType_idx" ON "stock_movements"("movementType");
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
CREATE INDEX "stock_movements_tankId_createdAt_idx" ON "stock_movements"("tankId", "createdAt");

-- prices
CREATE INDEX "prices_stationId_fuelTypeId_idx" ON "prices"("stationId", "fuelTypeId");
CREATE INDEX "prices_effectiveTo_idx" ON "prices"("effectiveTo");

-- clients
CREATE INDEX "clients_stationId_idx" ON "clients"("stationId");
CREATE INDEX "clients_clientType_idx" ON "clients"("clientType");
CREATE INDEX "clients_isActive_idx" ON "clients"("isActive");

-- invoices
CREATE INDEX "invoices_stationId_idx" ON "invoices"("stationId");
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_invoiceType_idx" ON "invoices"("invoiceType");
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");
CREATE INDEX "invoices_stationId_status_idx" ON "invoices"("stationId", "status");

-- credit_notes
CREATE INDEX "credit_notes_stationId_idx" ON "credit_notes"("stationId");

-- alerts
CREATE INDEX "alerts_stationId_idx" ON "alerts"("stationId");
CREATE INDEX "alerts_status_idx" ON "alerts"("status");
CREATE INDEX "alerts_priority_idx" ON "alerts"("priority");
CREATE INDEX "alerts_alertType_idx" ON "alerts"("alertType");
CREATE INDEX "alerts_stationId_status_idx" ON "alerts"("stationId", "status");
CREATE INDEX "alerts_triggeredAt_idx" ON "alerts"("triggeredAt");

-- licences
CREATE INDEX "licences_status_idx" ON "licences"("status");
CREATE INDEX "licences_endDate_idx" ON "licences"("endDate");

-- audit_logs
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_stationId_createdAt_idx" ON "audit_logs"("stationId", "createdAt");

-- pompiste_debts
CREATE INDEX "pompiste_debts_pompisteId_idx" ON "pompiste_debts"("pompisteId");
CREATE INDEX "pompiste_debts_stationId_idx" ON "pompiste_debts"("stationId");
CREATE INDEX "pompiste_debts_status_idx" ON "pompiste_debts"("status");
CREATE INDEX "pompiste_debts_createdAt_idx" ON "pompiste_debts"("createdAt");

-- debt_payments
CREATE INDEX "debt_payments_debtId_idx" ON "debt_payments"("debtId");

-- ===========================================
-- FOREIGN KEYS
-- ===========================================

-- users
ALTER TABLE "users" ADD CONSTRAINT "users_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- refresh_tokens
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- tanks
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- dispensers
ALTER TABLE "dispensers" ADD CONSTRAINT "dispensers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- nozzles
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_dispenserId_fkey" FOREIGN KEY ("dispenserId") REFERENCES "dispensers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- shifts
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_nozzleId_fkey" FOREIGN KEY ("nozzleId") REFERENCES "nozzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_pompisteId_fkey" FOREIGN KEY ("pompisteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_validatedByUserId_fkey" FOREIGN KEY ("validatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- sales
ALTER TABLE "sales" ADD CONSTRAINT "sales_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- sale_payments
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- cash_registers
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- payment_details
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- deliveries
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- stock_movements
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- prices
ALTER TABLE "prices" ADD CONSTRAINT "prices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prices" ADD CONSTRAINT "prices_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prices" ADD CONSTRAINT "prices_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- clients
ALTER TABLE "clients" ADD CONSTRAINT "clients_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- invoices
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- invoice_lines
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- invoice_payments
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- credit_notes
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- maintenance_logs
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_dispenserId_fkey" FOREIGN KEY ("dispenserId") REFERENCES "dispensers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_nozzleId_fkey" FOREIGN KEY ("nozzleId") REFERENCES "nozzles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- alerts
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- licences
ALTER TABLE "licences" ADD CONSTRAINT "licences_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- audit_logs
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- pompiste_debts
ALTER TABLE "pompiste_debts" ADD CONSTRAINT "pompiste_debts_pompisteId_fkey" FOREIGN KEY ("pompisteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pompiste_debts" ADD CONSTRAINT "pompiste_debts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pompiste_debts" ADD CONSTRAINT "pompiste_debts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- debt_payments
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "pompiste_debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
