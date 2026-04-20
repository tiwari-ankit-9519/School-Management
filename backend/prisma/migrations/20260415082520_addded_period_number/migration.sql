/*
  Warnings:

  - Added the required column `periodNumber` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "periodNumber" INTEGER NOT NULL;
