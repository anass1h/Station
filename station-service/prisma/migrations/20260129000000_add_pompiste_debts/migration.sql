-- CreateEnum
CREATE TYPE "DebtReason" AS ENUM ('CASH_VARIANCE', 'ADVANCE', 'DAMAGE', 'FUEL_LOSS', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

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

-- CreateIndex
CREATE INDEX "pompiste_debts_pompisteId_idx" ON "pompiste_debts"("pompisteId");

-- CreateIndex
CREATE INDEX "pompiste_debts_stationId_idx" ON "pompiste_debts"("stationId");

-- CreateIndex
CREATE INDEX "pompiste_debts_status_idx" ON "pompiste_debts"("status");

-- CreateIndex
CREATE INDEX "debt_payments_debtId_idx" ON "debt_payments"("debtId");

-- AddForeignKey
ALTER TABLE "pompiste_debts" ADD CONSTRAINT "pompiste_debts_pompisteId_fkey" FOREIGN KEY ("pompisteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pompiste_debts" ADD CONSTRAINT "pompiste_debts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pompiste_debts" ADD CONSTRAINT "pompiste_debts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "pompiste_debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
