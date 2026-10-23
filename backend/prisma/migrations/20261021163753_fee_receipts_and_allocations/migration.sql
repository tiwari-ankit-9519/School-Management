/*
Warnings:

- You are about to drop the `FeeTransaction` table. Its rows are copied into "FeeReceipt" and "FeeAllocation" first.

*/
-- DropForeignKey
ALTER TABLE "FeeTransaction"
DROP CONSTRAINT "FeeTransaction_collectedById_fkey";

-- DropForeignKey
ALTER TABLE "FeeTransaction"
DROP CONSTRAINT "FeeTransaction_feePaymentId_fkey";

-- DropForeignKey
ALTER TABLE "FeeTransaction"
DROP CONSTRAINT "FeeTransaction_reversedById_fkey";

-- CreateTable
CREATE TABLE "FeeReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "referenceNumber" TEXT,
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
    CONSTRAINT "FeeReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAllocation" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "feePaymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeReceipt_receiptNumber_key" ON "FeeReceipt" ("receiptNumber");

-- CreateIndex
CREATE INDEX "FeeReceipt_studentId_idx" ON "FeeReceipt" ("studentId");

-- CreateIndex
CREATE INDEX "FeeReceipt_academicYearId_idx" ON "FeeReceipt" ("academicYearId");

-- CreateIndex
CREATE INDEX "FeeReceipt_paidAt_idx" ON "FeeReceipt" ("paidAt");

-- CreateIndex
CREATE INDEX "FeeReceipt_status_idx" ON "FeeReceipt" ("status");

-- CreateIndex
CREATE INDEX "FeeReceipt_collectedById_idx" ON "FeeReceipt" ("collectedById");

-- CreateIndex
CREATE INDEX "FeeAllocation_feePaymentId_idx" ON "FeeAllocation" ("feePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAllocation_receiptId_feePaymentId_key" ON "FeeAllocation" ("receiptId", "feePaymentId");

-- CopyData: one receipt per old transaction (same id and receipt number)
INSERT INTO "FeeReceipt" (
  "id", "receiptNumber", "studentId", "academicYearId", "totalAmount",
  "paymentMode", "referenceNumber", "paidAt", "remarks", "status",
  "collectedById", "reversedById", "reversedAt", "reversalReason", "emailedAt",
  "createdAt", "updatedAt"
)
SELECT
  ft."id",
  ft."receiptNumber",
  fp."studentId",
  fs."academicYearId",
  ft."amount",
  ft."paymentMode",
  ft."referenceNumber",
  ft."paidAt",
  ft."remarks",
  ft."status",
  ft."collectedById",
  ft."reversedById",
  ft."reversedAt",
  ft."reversalReason",
  ft."emailedAt",
  ft."createdAt",
  ft."updatedAt"
FROM "FeeTransaction" ft
JOIN "FeePayment" fp   ON fp."id" = ft."feePaymentId"
JOIN "FeeStructure" fs ON fs."id" = fp."feeStructureId";

-- CopyData: one allocation per old transaction, to the bill it paid
INSERT INTO "FeeAllocation" ("id", "receiptId", "feePaymentId", "amount", "createdAt")
SELECT
  gen_random_uuid()::text,
  ft."id",
  ft."feePaymentId",
  ft."amount",
  ft."createdAt"
FROM "FeeTransaction" ft;

-- DropTable
DROP TABLE "FeeTransaction";

-- AddForeignKey
ALTER TABLE "FeeReceipt"
ADD CONSTRAINT "FeeReceipt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipt"
ADD CONSTRAINT "FeeReceipt_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipt"
ADD CONSTRAINT "FeeReceipt_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipt"
ADD CONSTRAINT "FeeReceipt_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAllocation"
ADD CONSTRAINT "FeeAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "FeeReceipt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAllocation"
ADD CONSTRAINT "FeeAllocation_feePaymentId_fkey" FOREIGN KEY ("feePaymentId") REFERENCES "FeePayment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;