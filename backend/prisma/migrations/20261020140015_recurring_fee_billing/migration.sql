/*
  Warnings:

  - A unique constraint covering the columns `[studentId,feeStructureId,billingPeriod]` on the table `FeePayment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "billingPeriod" TEXT;

-- AlterTable
ALTER TABLE "SchoolConfig" ADD COLUMN     "feeDueDay" INTEGER NOT NULL DEFAULT 10;

-- CreateIndex
CREATE INDEX "FeePayment_billingPeriod_idx" ON "FeePayment"("billingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_studentId_feeStructureId_billingPeriod_key" ON "FeePayment"("studentId", "feeStructureId", "billingPeriod");
