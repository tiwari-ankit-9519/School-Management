/*
  Warnings:

  - Added the required column `classGroupId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classGroupId` to the `FeeStructure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "classGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "classGroupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ClassGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
