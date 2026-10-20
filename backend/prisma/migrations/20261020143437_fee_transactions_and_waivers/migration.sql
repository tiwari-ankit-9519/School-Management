/*
  Warnings:

  - You are about to drop the column `collectedBy` on the `FeePayment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMode` on the `FeePayment` table. All the data in the column will be lost.
  - You are about to drop the column `receiptNumber` on the `FeePayment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `FeePayment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER', 'CARD', 'ONLINE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'REVERSED');

-- DropIndex
DROP INDEX "FeePayment_receiptNumber_key";

-- AlterTable
ALTER TABLE "FeePayment" DROP COLUMN "collectedBy",
DROP COLUMN "paymentMode",
DROP COLUMN "receiptNumber",
DROP COLUMN "transactionId",
ADD COLUMN     "waivedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "waivedAt" TIMESTAMP(3),
ADD COLUMN     "waivedById" TEXT,
ADD COLUMN     "waiverReason" TEXT,
ALTER COLUMN "amountPaid" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SchoolConfig" ADD COLUMN     "allowPartialPayments" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "FeeTransaction" (
    "id" TEXT NOT NULL,
    "feePaymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "referenceNumber" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "collectedById" TEXT NOT NULL,
    "reversedById" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptCounter" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeTransaction_receiptNumber_key" ON "FeeTransaction"("receiptNumber");

-- CreateIndex
CREATE INDEX "FeeTransaction_feePaymentId_idx" ON "FeeTransaction"("feePaymentId");

-- CreateIndex
CREATE INDEX "FeeTransaction_paidAt_idx" ON "FeeTransaction"("paidAt");

-- CreateIndex
CREATE INDEX "FeeTransaction_status_idx" ON "FeeTransaction"("status");

-- CreateIndex
CREATE INDEX "FeeTransaction_collectedById_idx" ON "FeeTransaction"("collectedById");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCounter_academicYearId_key" ON "ReceiptCounter"("academicYearId");

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_waivedById_fkey" FOREIGN KEY ("waivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTransaction" ADD CONSTRAINT "FeeTransaction_feePaymentId_fkey" FOREIGN KEY ("feePaymentId") REFERENCES "FeePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTransaction" ADD CONSTRAINT "FeeTransaction_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTransaction" ADD CONSTRAINT "FeeTransaction_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptCounter" ADD CONSTRAINT "ReceiptCounter_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
