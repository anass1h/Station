/*
  Warnings:

  - A unique constraint covering the columns `[stationId,ice]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stationId,invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ice]` on the table `stations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taxId]` on the table `stations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rc,city]` on the table `stations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ice]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "invoices_invoiceNumber_key";

-- AlterTable
ALTER TABLE "cash_registers" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pompiste_debts" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "ice" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "tanks" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "alerts_stationId_idx" ON "alerts"("stationId");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_priority_idx" ON "alerts"("priority");

-- CreateIndex
CREATE INDEX "alerts_alertType_idx" ON "alerts"("alertType");

-- CreateIndex
CREATE INDEX "alerts_stationId_status_idx" ON "alerts"("stationId", "status");

-- CreateIndex
CREATE INDEX "alerts_triggeredAt_idx" ON "alerts"("triggeredAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_stationId_createdAt_idx" ON "audit_logs"("stationId", "createdAt");

-- CreateIndex
CREATE INDEX "cash_registers_shiftId_idx" ON "cash_registers"("shiftId");

-- CreateIndex
CREATE INDEX "cash_registers_closedAt_idx" ON "cash_registers"("closedAt");

-- CreateIndex
CREATE INDEX "clients_stationId_idx" ON "clients"("stationId");

-- CreateIndex
CREATE INDEX "clients_clientType_idx" ON "clients"("clientType");

-- CreateIndex
CREATE INDEX "clients_isActive_idx" ON "clients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "clients_stationId_ice_key" ON "clients"("stationId", "ice");

-- CreateIndex
CREATE INDEX "deliveries_tankId_idx" ON "deliveries"("tankId");

-- CreateIndex
CREATE INDEX "deliveries_supplierId_idx" ON "deliveries"("supplierId");

-- CreateIndex
CREATE INDEX "deliveries_deliveredAt_idx" ON "deliveries"("deliveredAt");

-- CreateIndex
CREATE INDEX "dispensers_stationId_idx" ON "dispensers"("stationId");

-- CreateIndex
CREATE INDEX "dispensers_isActive_idx" ON "dispensers"("isActive");

-- CreateIndex
CREATE INDEX "fuel_types_isActive_idx" ON "fuel_types"("isActive");

-- CreateIndex
CREATE INDEX "invoices_stationId_idx" ON "invoices"("stationId");

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoiceType_idx" ON "invoices"("invoiceType");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_stationId_status_idx" ON "invoices"("stationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stationId_invoiceNumber_key" ON "invoices"("stationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "nozzles_dispenserId_idx" ON "nozzles"("dispenserId");

-- CreateIndex
CREATE INDEX "nozzles_tankId_idx" ON "nozzles"("tankId");

-- CreateIndex
CREATE INDEX "nozzles_isActive_idx" ON "nozzles"("isActive");

-- CreateIndex
CREATE INDEX "payment_methods_isActive_idx" ON "payment_methods"("isActive");

-- CreateIndex
CREATE INDEX "pompiste_debts_createdAt_idx" ON "pompiste_debts"("createdAt");

-- CreateIndex
CREATE INDEX "prices_stationId_fuelTypeId_idx" ON "prices"("stationId", "fuelTypeId");

-- CreateIndex
CREATE INDEX "prices_effectiveTo_idx" ON "prices"("effectiveTo");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sales_shiftId_idx" ON "sales"("shiftId");

-- CreateIndex
CREATE INDEX "sales_fuelTypeId_idx" ON "sales"("fuelTypeId");

-- CreateIndex
CREATE INDEX "sales_clientId_idx" ON "sales"("clientId");

-- CreateIndex
CREATE INDEX "sales_soldAt_idx" ON "sales"("soldAt");

-- CreateIndex
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

-- CreateIndex
CREATE INDEX "shifts_pompisteId_idx" ON "shifts"("pompisteId");

-- CreateIndex
CREATE INDEX "shifts_nozzleId_idx" ON "shifts"("nozzleId");

-- CreateIndex
CREATE INDEX "shifts_startedAt_idx" ON "shifts"("startedAt");

-- CreateIndex
CREATE INDEX "shifts_pompisteId_status_idx" ON "shifts"("pompisteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stations_ice_key" ON "stations"("ice");

-- CreateIndex
CREATE UNIQUE INDEX "stations_taxId_key" ON "stations"("taxId");

-- CreateIndex
CREATE INDEX "stations_isActive_idx" ON "stations"("isActive");

-- CreateIndex
CREATE INDEX "stations_city_idx" ON "stations"("city");

-- CreateIndex
CREATE UNIQUE INDEX "stations_rc_city_key" ON "stations"("rc", "city");

-- CreateIndex
CREATE INDEX "stock_movements_tankId_idx" ON "stock_movements"("tankId");

-- CreateIndex
CREATE INDEX "stock_movements_movementType_idx" ON "stock_movements"("movementType");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_tankId_createdAt_idx" ON "stock_movements"("tankId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_ice_key" ON "suppliers"("ice");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "tanks_stationId_idx" ON "tanks"("stationId");

-- CreateIndex
CREATE INDEX "tanks_fuelTypeId_idx" ON "tanks"("fuelTypeId");

-- CreateIndex
CREATE INDEX "tanks_isActive_idx" ON "tanks"("isActive");

-- CreateIndex
CREATE INDEX "users_stationId_idx" ON "users"("stationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
