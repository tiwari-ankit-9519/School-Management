-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "withdrawalReason" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);
