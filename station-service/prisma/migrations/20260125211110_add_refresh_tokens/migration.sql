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
CREATE TYPE "LicencePlan" AS ENUM ('TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "LicenceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "stationId" TEXT,
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
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxDispensers" INTEGER NOT NULL DEFAULT 4,
    "features" JSONB,
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_badgeCode_key" ON "users"("badgeCode");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

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
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_creditNoteNumber_key" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "licences_stationId_key" ON "licences"("stationId");

-- CreateIndex
CREATE INDEX "licences_status_idx" ON "licences"("status");

-- CreateIndex
CREATE INDEX "licences_endDate_idx" ON "licences"("endDate");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensers" ADD CONSTRAINT "dispensers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_dispenserId_fkey" FOREIGN KEY ("dispenserId") REFERENCES "dispensers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_nozzleId_fkey" FOREIGN KEY ("nozzleId") REFERENCES "nozzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_pompisteId_fkey" FOREIGN KEY ("pompisteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_dispenserId_fkey" FOREIGN KEY ("dispenserId") REFERENCES "dispensers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_nozzleId_fkey" FOREIGN KEY ("nozzleId") REFERENCES "nozzles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licences" ADD CONSTRAINT "licences_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
