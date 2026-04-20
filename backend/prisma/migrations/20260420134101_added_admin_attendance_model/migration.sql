-- CreateTable
CREATE TABLE "AdminAttendance" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAttendance_adminId_idx" ON "AdminAttendance"("adminId");

-- CreateIndex
CREATE INDEX "AdminAttendance_date_idx" ON "AdminAttendance"("date");

-- CreateIndex
CREATE INDEX "AdminAttendance_status_idx" ON "AdminAttendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAttendance_adminId_date_key" ON "AdminAttendance"("adminId", "date");

-- AddForeignKey
ALTER TABLE "AdminAttendance" ADD CONSTRAINT "AdminAttendance_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
