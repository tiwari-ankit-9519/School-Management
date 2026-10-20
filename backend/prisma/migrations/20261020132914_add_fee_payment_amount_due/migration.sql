/*
Warnings:

- Added the required column `amountDue` to the `FeePayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN "amountDue" DOUBLE PRECISION;

UPDATE "FeePayment" AS fp
SET "amountDue" = fs."amount"
FROM "FeeStructure" AS fs
WHERE fp."feeStructureId" = fs."id";

ALTER TABLE "FeePayment" ALTER COLUMN "amountDue" SET NOT NULL;