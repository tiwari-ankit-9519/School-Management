-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'MODERATOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'SELECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED', 'EXPELLED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ALERT', 'ANNOUNCEMENT', 'REMINDER', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SSE', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'STATUS_CHANGE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'UNASSIGN', 'GENERATE_REG_NO', 'SSE_CONNECT', 'SSE_DISCONNECT', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('UNIT_TEST', 'MID_TERM', 'FINAL', 'PRACTICAL', 'ASSIGNMENT', 'PROJECT', 'QUIZ');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'WAIVED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ADMISSION_FORM', 'BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'MARKSHEET', 'ID_PROOF', 'ADDRESS_PROOF', 'PHOTO', 'RESUME', 'QUALIFICATION_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'FEE_RECEIPT', 'LEAVE_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentOwnerType" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'ADMISSION_APPLICATION', 'TEACHER_APPLICATION', 'LEAVE_REQUEST', 'FEE_PAYMENT');

-- CreateEnum
CREATE TYPE "Module" AS ENUM ('ACADEMIC_YEAR', 'CLASS', 'SUBJECT', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ADMISSION_APPLICATION', 'TEACHER_APPLICATION', 'TEACHER_SUBJECT', 'CLASS_TEACHER', 'ENROLLMENT', 'TIMETABLE', 'HOLIDAY', 'STUDENT_ATTENDANCE', 'TEACHER_ATTENDANCE', 'EXAM_SCHEDULE', 'MARK', 'FEE_STRUCTURE', 'FEE_PAYMENT', 'LEAVE_REQUEST', 'ANNOUNCEMENT', 'NOTIFICATION', 'DOCUMENT', 'AUDIT_LOG', 'SYSTEM_LOG', 'IP_BLACKLIST', 'RATE_LIMIT');

-- CreateTable
CREATE TABLE "SchoolConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "establishedYear" INTEGER NOT NULL,
    "affiliationNumber" TEXT,
    "boardType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "roomNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationCounter" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegistrationCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "regNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isp" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "Module" NOT NULL,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specialization" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    CONSTRAINT "TeacherApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specialization" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "salary" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "appliedForClass" TEXT NOT NULL,
    "guardianFirstName" TEXT NOT NULL,
    "guardianLastName" TEXT NOT NULL,
    "guardianRelation" "ParentType" NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "guardianEmail" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "waitlistReason" TEXT,
    "waitlistPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "guardianPhotoUrl" TEXT,
    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "admissionId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "medicalConditions" TEXT,
    "emergencyContact" TEXT,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "parentType" "ParentType" NOT NULL,
    "alternatePhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "rollNumber" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "periodNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "remarks" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passingMarks" DOUBLE PRECISION NOT NULL,
    "instructions" TEXT,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "enteredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringMonth" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT,
    "paymentMode" TEXT,
    "receiptNumber" TEXT,
    "remarks" TEXT,
    "collectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterRole" "Role" NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "classId" TEXT,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable


CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetRoles" "Role"[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "announcementId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSEConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "disconnectedAt" TIMESTAMP(3),
    CONSTRAINT "SSEConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerType" "DocumentOwnerType" NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'raw',
    "format" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "folder" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "parentId" TEXT,
    "admissionId" TEXT,
    "teacherAppId" TEXT,
    "leaveRequestId" TEXT,
    "feePaymentId" TEXT,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "targetUserId" TEXT,
    "action" "AuditAction" NOT NULL,
    "module" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isp" TEXT,
    "sessionId" TEXT,
    "statusCode" INTEGER,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT true,
    "failureReason" TEXT,
    "duration" INTEGER,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "method" TEXT,
    "path" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "traceId" TEXT,
    "spanId" TEXT,
    "statusCode" INTEGER,
    "duration" INTEGER,
    "error" TEXT,
    "stackTrace" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPBlacklist" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "blockedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IPBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitRecord" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "previousStatus" "ApplicationStatus" NOT NULL,
    "rejectionReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    CONSTRAINT "TeacherApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissonApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL,
    "previousStatus" "AdmissionStatus" NOT NULL,
    "rejectionReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    CONSTRAINT "AdmissonApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolConfig_code_key" ON "SchoolConfig" ("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolConfig_email_key" ON "SchoolConfig" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear" ("name");

-- CreateIndex
CREATE INDEX "AcademicYear_isCurrent_idx" ON "AcademicYear" ("isCurrent");

-- CreateIndex
CREATE INDEX "Class_academicYearId_idx" ON "Class" ("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_academicYearId_name_section_key" ON "Class" (
    "academicYearId",
    "name",
    "section"
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject" ("code");

-- CreateIndex
CREATE INDEX "Subject_isActive_idx" ON "Subject" ("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationCounter_role_key" ON "RegistrationCounter" ("role");

-- CreateIndex
CREATE UNIQUE INDEX "User_regNumber_key" ON "User" ("regNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE INDEX "User_regNumber_idx" ON "User" ("regNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User" ("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User" ("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User" ("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session" ("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session" ("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session" ("token");

-- CreateIndex
CREATE INDEX "Session_isActive_idx" ON "Session" ("isActive");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session" ("expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_isActive_idx" ON "Session" ("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset" ("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset" ("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset" ("token");

-- CreateIndex
CREATE INDEX "PasswordReset_isUsed_idx" ON "PasswordReset" ("isUsed");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_module_key" ON "UserPermission" ("userId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin" ("userId");

-- CreateIndex
CREATE INDEX "Admin_userId_idx" ON "Admin" ("userId");

-- CreateIndex
CREATE INDEX "TeacherApplication_status_idx" ON "TeacherApplication" ("status");

-- CreateIndex
CREATE INDEX "TeacherApplication_email_idx" ON "TeacherApplication" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher" ("userId");

-- CreateIndex
CREATE INDEX "Teacher_userId_idx" ON "Teacher" ("userId");

-- CreateIndex
CREATE INDEX "Teacher_employmentStatus_idx" ON "Teacher" ("employmentStatus");

-- CreateIndex
CREATE INDEX "TeacherSubject_teacherId_idx" ON "TeacherSubject" ("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSubject_subjectId_idx" ON "TeacherSubject" ("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_classId_key" ON "TeacherSubject" (
    "teacherId",
    "subjectId",
    "classId"
);

-- CreateIndex
CREATE INDEX "ClassTeacher_classId_idx" ON "ClassTeacher" ("classId");

-- CreateIndex
CREATE INDEX "ClassTeacher_teacherId_idx" ON "ClassTeacher" ("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_classId_teacherId_key" ON "ClassTeacher" ("classId", "teacherId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_status_idx" ON "AdmissionApplication" ("status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_guardianPhone_idx" ON "AdmissionApplication" ("guardianPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionId_key" ON "Student" ("admissionId");

-- CreateIndex
CREATE INDEX "Student_userId_idx" ON "Student" ("userId");

-- CreateIndex
CREATE INDEX "Student_enrollmentStatus_idx" ON "Student" ("enrollmentStatus");

-- CreateIndex
CREATE INDEX "Student_admissionId_idx" ON "Student" ("admissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_studentId_key" ON "Parent" ("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment" ("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_idx" ON "Enrollment" ("classId");

-- CreateIndex
CREATE INDEX "Enrollment_academicYearId_idx" ON "Enrollment" ("academicYearId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment" ("status");

-- CreateIndex
CREATE INDEX "Enrollment_classId_academicYearId_idx" ON "Enrollment" ("classId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYearId_key" ON "Enrollment" ("studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "Timetable_classId_idx" ON "Timetable" ("classId");

-- CreateIndex
CREATE INDEX "Timetable_teacherId_idx" ON "Timetable" ("teacherId");

-- CreateIndex
CREATE INDEX "Timetable_subjectId_idx" ON "Timetable" ("subjectId");

-- CreateIndex
CREATE INDEX "Timetable_dayOfWeek_idx" ON "Timetable" ("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_classId_dayOfWeek_startTime_key" ON "Timetable" (
    "classId",
    "dayOfWeek",
    "startTime"
);

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_teacherId_dayOfWeek_startTime_key" ON "Timetable" (
    "teacherId",
    "dayOfWeek",
    "startTime"
);

-- CreateIndex
CREATE INDEX "StudentAttendance_studentId_idx" ON "StudentAttendance" ("studentId");

-- CreateIndex
CREATE INDEX "StudentAttendance_classId_idx" ON "StudentAttendance" ("classId");

-- CreateIndex
CREATE INDEX "StudentAttendance_date_idx" ON "StudentAttendance" ("date");

-- CreateIndex
CREATE INDEX "StudentAttendance_status_idx" ON "StudentAttendance" ("status");

-- CreateIndex
CREATE INDEX "StudentAttendance_studentId_date_idx" ON "StudentAttendance" ("studentId", "date");

-- CreateIndex
CREATE INDEX "StudentAttendance_classId_date_idx" ON "StudentAttendance" ("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_studentId_date_classId_key" ON "StudentAttendance" (
    "studentId",
    "date",
    "classId"
);

-- CreateIndex
CREATE INDEX "TeacherAttendance_teacherId_idx" ON "TeacherAttendance" ("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_date_idx" ON "TeacherAttendance" ("date");

-- CreateIndex
CREATE INDEX "TeacherAttendance_status_idx" ON "TeacherAttendance" ("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendance_teacherId_date_key" ON "TeacherAttendance" ("teacherId", "date");

-- CreateIndex
CREATE INDEX "AdminAttendance_adminId_idx" ON "AdminAttendance" ("adminId");

-- CreateIndex
CREATE INDEX "AdminAttendance_date_idx" ON "AdminAttendance" ("date");

-- CreateIndex
CREATE INDEX "AdminAttendance_status_idx" ON "AdminAttendance" ("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAttendance_adminId_date_key" ON "AdminAttendance" ("adminId", "date");

-- CreateIndex
CREATE INDEX "ExamSchedule_academicYearId_idx" ON "ExamSchedule" ("academicYearId");

-- CreateIndex
CREATE INDEX "ExamSchedule_classId_idx" ON "ExamSchedule" ("classId");

-- CreateIndex
CREATE INDEX "ExamSchedule_subjectId_idx" ON "ExamSchedule" ("subjectId");

-- CreateIndex
CREATE INDEX "ExamSchedule_teacherId_idx" ON "ExamSchedule" ("teacherId");

-- CreateIndex
CREATE INDEX "ExamSchedule_examType_idx" ON "ExamSchedule" ("examType");

-- CreateIndex
CREATE INDEX "ExamSchedule_date_idx" ON "ExamSchedule" ("date");

-- CreateIndex
CREATE INDEX "ExamSchedule_classId_subjectId_idx" ON "ExamSchedule" ("classId", "subjectId");

-- CreateIndex
CREATE INDEX "Mark_studentId_idx" ON "Mark" ("studentId");

-- CreateIndex
CREATE INDEX "Mark_examScheduleId_idx" ON "Mark" ("examScheduleId");

-- CreateIndex
CREATE INDEX "Mark_subjectId_idx" ON "Mark" ("subjectId");

-- CreateIndex
CREATE INDEX "Mark_studentId_subjectId_idx" ON "Mark" ("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Mark_studentId_examScheduleId_key" ON "Mark" ("studentId", "examScheduleId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_idx" ON "FeeStructure" ("academicYearId");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "FeeStructure" ("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_isActive_idx" ON "FeeStructure" ("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_receiptNumber_key" ON "FeePayment" ("receiptNumber");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_idx" ON "FeePayment" ("studentId");

-- CreateIndex
CREATE INDEX "FeePayment_feeStructureId_idx" ON "FeePayment" ("feeStructureId");

-- CreateIndex
CREATE INDEX "FeePayment_status_idx" ON "FeePayment" ("status");

-- CreateIndex
CREATE INDEX "FeePayment_dueDate_idx" ON "FeePayment" ("dueDate");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_status_idx" ON "FeePayment" ("studentId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_studentId_idx" ON "LeaveRequest" ("studentId");

-- CreateIndex
CREATE INDEX "LeaveRequest_teacherId_idx" ON "LeaveRequest" ("teacherId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest" ("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_fromDate_toDate_idx" ON "LeaveRequest" ("fromDate", "toDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_requesterId_idx" ON "LeaveRequest" ("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday" ("date");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday" ("date");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement" ("isActive");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement" ("publishedAt");

-- CreateIndex
CREATE INDEX "Notification_senderId_idx" ON "Notification" ("senderId");

-- CreateIndex
CREATE INDEX "Notification_announcementId_idx" ON "Notification" ("announcementId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification" ("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification" ("createdAt");

-- CreateIndex
CREATE INDEX "Notification_channel_idx" ON "Notification" ("channel");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_idx" ON "NotificationRecipient" ("userId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_notificationId_idx" ON "NotificationRecipient" ("notificationId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_isRead_idx" ON "NotificationRecipient" ("isRead");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_isRead_idx" ON "NotificationRecipient" ("userId", "isRead");

-- CreateIndex
CREATE INDEX "NotificationRecipient_createdAt_idx" ON "NotificationRecipient" ("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient" ("notificationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SSEConnection_connectionId_key" ON "SSEConnection" ("connectionId");

-- CreateIndex
CREATE INDEX "SSEConnection_userId_idx" ON "SSEConnection" ("userId");

-- CreateIndex
CREATE INDEX "SSEConnection_connectionId_idx" ON "SSEConnection" ("connectionId");

-- CreateIndex
CREATE INDEX "SSEConnection_isActive_idx" ON "SSEConnection" ("isActive");

-- CreateIndex
CREATE INDEX "SSEConnection_userId_isActive_idx" ON "SSEConnection" ("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Document_cloudinaryId_key" ON "Document" ("cloudinaryId");

-- CreateIndex
CREATE INDEX "Document_ownerId_ownerType_idx" ON "Document" ("ownerId", "ownerType");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document" ("documentType");

-- CreateIndex
CREATE INDEX "Document_cloudinaryId_idx" ON "Document" ("cloudinaryId");

-- CreateIndex
CREATE INDEX "Document_uploadedBy_idx" ON "Document" ("uploadedBy");

-- CreateIndex
CREATE INDEX "Document_isActive_idx" ON "Document" ("isActive");

-- CreateIndex
CREATE INDEX "Document_ownerId_ownerType_documentType_idx" ON "Document" (
    "ownerId",
    "ownerType",
    "documentType"
);

-- CreateIndex
CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog" ("performedById");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog" ("targetUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" ("action");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog" ("module");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_isSuccessful_idx" ON "AuditLog" ("isSuccessful");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_resourceType_idx" ON "AuditLog" ("resourceId", "resourceType");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_createdAt_idx" ON "AuditLog" ("performedById", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "SystemLog" ("level");

-- CreateIndex
CREATE INDEX "SystemLog_module_idx" ON "SystemLog" ("module");

-- CreateIndex
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog" ("userId");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog" ("createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_requestId_idx" ON "SystemLog" ("requestId");

-- CreateIndex
CREATE INDEX "SystemLog_traceId_idx" ON "SystemLog" ("traceId");

-- CreateIndex
CREATE INDEX "SystemLog_level_createdAt_idx" ON "SystemLog" ("level", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IPBlacklist_ipAddress_key" ON "IPBlacklist" ("ipAddress");

-- CreateIndex
CREATE INDEX "IPBlacklist_ipAddress_idx" ON "IPBlacklist" ("ipAddress");

-- CreateIndex
CREATE INDEX "IPBlacklist_isActive_idx" ON "IPBlacklist" ("isActive");

-- CreateIndex
CREATE INDEX "IPBlacklist_expiresAt_idx" ON "IPBlacklist" ("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitRecord_identifier_idx" ON "RateLimitRecord" ("identifier");

-- CreateIndex
CREATE INDEX "RateLimitRecord_endpoint_idx" ON "RateLimitRecord" ("endpoint");

-- CreateIndex
CREATE INDEX "RateLimitRecord_windowEnd_idx" ON "RateLimitRecord" ("windowEnd");

-- CreateIndex
CREATE INDEX "RateLimitRecord_identifier_endpoint_idx" ON "RateLimitRecord" ("identifier", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitRecord_identifier_endpoint_windowStart_key" ON "RateLimitRecord" (
    "identifier",
    "endpoint",
    "windowStart"
);

-- AddForeignKey
ALTER TABLE "Class"
ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session"
ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset"
ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission"
ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin"
ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher"
ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject"
ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject"
ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher"
ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher"
ADD CONSTRAINT "ClassTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student"
ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student"
ADD CONSTRAINT "Student_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "AdmissionApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent"
ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent"
ADD CONSTRAINT "Parent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable"
ADD CONSTRAINT "Timetable_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable"
ADD CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable"
ADD CONSTRAINT "Timetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance"
ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance"
ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAttendance"
ADD CONSTRAINT "AdminAttendance_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT "ExamSchedule_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT "ExamSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT "ExamSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT "ExamSchedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark"
ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark"
ADD CONSTRAINT "Mark_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark"
ADD CONSTRAINT "Mark_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure"
ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure"
ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment"
ADD CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment"
ADD CONSTRAINT "FeePayment_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient"
ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient"
ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSEConnection"
ADD CONSTRAINT "SSEConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "AdmissionApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_teacherAppId_fkey" FOREIGN KEY ("teacherAppId") REFERENCES "TeacherApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_feePaymentId_fkey" FOREIGN KEY ("feePaymentId") REFERENCES "FeePayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog"
ADD CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApplicationHistory"
ADD CONSTRAINT "TeacherApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TeacherApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissonApplicationHistory"
ADD CONSTRAINT "AdmissonApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent registration number from being changed once assigned
CREATE OR REPLACE FUNCTION trg_fn_prevent_reg_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."regNumber" IS NOT NULL AND NEW."regNumber" != OLD."regNumber" THEN
    RAISE EXCEPTION
      'Registration number cannot be modified once assigned. Current: %, Attempted: %',
      OLD."regNumber",
      NEW."regNumber";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_reg_change
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  WHEN (OLD."regNumber" IS DISTINCT FROM NEW."regNumber")
  EXECUTE FUNCTION trg_fn_prevent_reg_change();

-- Partial unique index for TeacherSubject where classId is NULL
CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_no_class_key" ON "TeacherSubject" ("teacherId", "subjectId")
WHERE
    "classId" IS NULL;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "AdmissionStatus" ADD VALUE 'SLOT_OFFERED';

ALTER TYPE "AdmissionStatus" ADD VALUE 'OFFER_EXPIRED';

ALTER TYPE "AdmissionStatus" ADD VALUE 'OFFER_DECLINED';

-- AlterTable
ALTER TABLE "AdmissionApplication"
ADD COLUMN "slotExpiresAt" TIMESTAMP(3),
ADD COLUMN "slotOfferedAt" TIMESTAMP(3),
ADD COLUMN "slotOfferedClass" TEXT;

-- AlterEnum
ALTER TYPE "EnrollmentStatus" ADD VALUE 'WITHDRAWN';