-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'MODERATOR');

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
CREATE TYPE "DocumentOwnerType" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'ADMISSION_APPLICATION', 'TEACHER_APPLICATION', 'LEAVE_REQUEST', 'FEE_PAYMENT', 'SCHOOL_APPLICATION');

-- CreateEnum
CREATE TYPE "Module" AS ENUM ('SCHOOL', 'ACADEMIC_YEAR', 'CLASS', 'SUBJECT', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SCHOOL_APPLICATION', 'ADMISSION_APPLICATION', 'TEACHER_APPLICATION', 'TEACHER_SUBJECT', 'CLASS_TEACHER', 'ENROLLMENT', 'TIMETABLE', 'HOLIDAY', 'STUDENT_ATTENDANCE', 'TEACHER_ATTENDANCE', 'EXAM_SCHEDULE', 'MARK', 'FEE_STRUCTURE', 'FEE_PAYMENT', 'LEAVE_REQUEST', 'ANNOUNCEMENT', 'NOTIFICATION', 'DOCUMENT', 'AUDIT_LOG', 'SYSTEM_LOG', 'IP_BLACKLIST', 'RATE_LIMIT');

-- CreateEnum
CREATE TYPE "SchoolApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED');

-- CreateTable
CREATE TABLE "School" (
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
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable


CREATE TABLE "SchoolApplication" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "establishedYear" INTEGER NOT NULL,
    "affiliationNumber" TEXT,
    "boardType" TEXT NOT NULL,
    "adminFirstName" TEXT NOT NULL,
    "adminLastName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "adminPhone" TEXT NOT NULL,
    "adminGender" "Gender" NOT NULL,
    "status" "SchoolApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "moreInfoFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegistrationCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
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
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "module" "Module" NOT NULL,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
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
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT NOT NULL,
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
CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
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
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable


CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT,
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
    "schoolId" TEXT,
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
    "schoolApplicationId" TEXT,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
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
    "schoolId" TEXT,
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
CREATE TABLE "SchoolApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "SchoolApplicationStatus" NOT NULL,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    CONSTRAINT "SchoolApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "rejectionReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "previousStatus" "ApplicationStatus" NOT NULL,
    CONSTRAINT "TeacherApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissonApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL,
    "rejectionReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "previousStatus" "AdmissionStatus" NOT NULL,
    CONSTRAINT "AdmissonApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School" ("code");

-- CreateIndex
CREATE UNIQUE INDEX "School_email_key" ON "School" ("email");

-- CreateIndex
CREATE INDEX "School_code_idx" ON "School" ("code");

-- CreateIndex
CREATE INDEX "School_email_idx" ON "School" ("email");

-- CreateIndex
CREATE INDEX "School_isActive_idx" ON "School" ("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolApplication_email_key" ON "SchoolApplication" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolApplication_adminEmail_key" ON "SchoolApplication" ("adminEmail");

-- CreateIndex
CREATE INDEX "SchoolApplication_status_idx" ON "SchoolApplication" ("status");

-- CreateIndex
CREATE INDEX "SchoolApplication_email_idx" ON "SchoolApplication" ("email");

-- CreateIndex
CREATE INDEX "SchoolApplication_adminEmail_idx" ON "SchoolApplication" ("adminEmail");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_idx" ON "AcademicYear" ("schoolId");

-- CreateIndex
CREATE INDEX "AcademicYear_isCurrent_idx" ON "AcademicYear" ("isCurrent");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_isCurrent_idx" ON "AcademicYear" ("schoolId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_schoolId_name_key" ON "AcademicYear" ("schoolId", "name");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class" ("schoolId");

-- CreateIndex
CREATE INDEX "Class_academicYearId_idx" ON "Class" ("academicYearId");

-- CreateIndex
CREATE INDEX "Class_schoolId_academicYearId_idx" ON "Class" ("schoolId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_academicYearId_name_section_key" ON "Class" (
    "schoolId",
    "academicYearId",
    "name",
    "section"
);

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject" ("schoolId");

-- CreateIndex
CREATE INDEX "Subject_isActive_idx" ON "Subject" ("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject" ("schoolId", "code");

-- CreateIndex
CREATE INDEX "RegistrationCounter_schoolId_role_idx" ON "RegistrationCounter" ("schoolId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationCounter_schoolId_role_key" ON "RegistrationCounter" ("schoolId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_regNumber_key" ON "User" ("regNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User" ("schoolId");

-- CreateIndex
CREATE INDEX "User_regNumber_idx" ON "User" ("regNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User" ("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User" ("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User" ("isActive");

-- CreateIndex
CREATE INDEX "User_schoolId_role_idx" ON "User" ("schoolId", "role");

-- CreateIndex
CREATE INDEX "User_schoolId_isActive_idx" ON "User" ("schoolId", "isActive");

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
CREATE UNIQUE INDEX "SuperAdmin_userId_key" ON "SuperAdmin" ("userId");

-- CreateIndex
CREATE INDEX "SuperAdmin_userId_idx" ON "SuperAdmin" ("userId");

-- CreateIndex
CREATE INDEX "AdminPermission_adminId_idx" ON "AdminPermission" ("adminId");

-- CreateIndex
CREATE INDEX "AdminPermission_module_idx" ON "AdminPermission" ("module");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminId_module_key" ON "AdminPermission" ("adminId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin" ("userId");

-- CreateIndex
CREATE INDEX "Admin_userId_idx" ON "Admin" ("userId");

-- CreateIndex
CREATE INDEX "TeacherApplication_schoolId_idx" ON "TeacherApplication" ("schoolId");

-- CreateIndex
CREATE INDEX "TeacherApplication_status_idx" ON "TeacherApplication" ("status");

-- CreateIndex
CREATE INDEX "TeacherApplication_email_idx" ON "TeacherApplication" ("email");

-- CreateIndex
CREATE INDEX "TeacherApplication_schoolId_status_idx" ON "TeacherApplication" ("schoolId", "status");

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
CREATE INDEX "AdmissionApplication_schoolId_idx" ON "AdmissionApplication" ("schoolId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_status_idx" ON "AdmissionApplication" ("status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_schoolId_status_idx" ON "AdmissionApplication" ("schoolId", "status");

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
CREATE INDEX "FeeStructure_schoolId_idx" ON "FeeStructure" ("schoolId");

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
CREATE INDEX "Holiday_schoolId_idx" ON "Holiday" ("schoolId");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday" ("date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_schoolId_date_key" ON "Holiday" ("schoolId", "date");

-- CreateIndex
CREATE INDEX "Announcement_schoolId_idx" ON "Announcement" ("schoolId");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement" ("isActive");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement" ("publishedAt");

-- CreateIndex
CREATE INDEX "Announcement_schoolId_isActive_idx" ON "Announcement" ("schoolId", "isActive");

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
CREATE INDEX "Document_schoolId_idx" ON "Document" ("schoolId");

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
CREATE INDEX "AuditLog_schoolId_idx" ON "AuditLog" ("schoolId");

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
CREATE INDEX "AuditLog_schoolId_action_idx" ON "AuditLog" ("schoolId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_createdAt_idx" ON "AuditLog" ("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_createdAt_idx" ON "AuditLog" ("performedById", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "SystemLog" ("level");

-- CreateIndex
CREATE INDEX "SystemLog_module_idx" ON "SystemLog" ("module");

-- CreateIndex
CREATE INDEX "SystemLog_schoolId_idx" ON "SystemLog" ("schoolId");

-- CreateIndex
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog" ("userId");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog" ("createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_requestId_idx" ON "SystemLog" ("requestId");

-- CreateIndex
CREATE INDEX "SystemLog_traceId_idx" ON "SystemLog" ("traceId");

-- CreateIndex
CREATE INDEX "SystemLog_schoolId_level_idx" ON "SystemLog" ("schoolId", "level");

-- CreateIndex
CREATE INDEX "SystemLog_schoolId_createdAt_idx" ON "SystemLog" ("schoolId", "createdAt");

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
ALTER TABLE "AcademicYear"
ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class"
ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class"
ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject"
ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session"
ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset"
ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdmin"
ADD CONSTRAINT "SuperAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermission"
ADD CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin"
ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApplication"
ADD CONSTRAINT "TeacherApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "AdmissionApplication"
ADD CONSTRAINT "AdmissionApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Holiday"
ADD CONSTRAINT "Holiday_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement"
ADD CONSTRAINT "Announcement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ADD CONSTRAINT "Document_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Document"
ADD CONSTRAINT "Document_schoolApplicationId_fkey" FOREIGN KEY ("schoolApplicationId") REFERENCES "SchoolApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog"
ADD CONSTRAINT "SystemLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog"
ADD CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolApplicationHistory"
ADD CONSTRAINT "SchoolApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SchoolApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApplicationHistory"
ADD CONSTRAINT "TeacherApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TeacherApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissonApplicationHistory"
ADD CONSTRAINT "AdmissonApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION generate_school_code(p_school_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_words      TEXT[];
  v_prefix     TEXT := '';
  v_word       TEXT;
  v_counter    INT := 1;
  v_candidate  TEXT;
  v_exists     BOOLEAN;
BEGIN
  v_words := regexp_split_to_array(trim(p_school_name), '\s+');

  FOREACH v_word IN ARRAY v_words LOOP
    v_word := regexp_replace(v_word, '[^a-zA-Z]', '', 'g');
    IF length(v_word) > 0 THEN
      v_prefix := v_prefix || upper(left(v_word, 1));
    END IF;
    EXIT WHEN length(v_prefix) >= 4;
  END LOOP;

  IF length(v_prefix) < 2 THEN
    v_prefix := upper(left(regexp_replace(p_school_name, '[^a-zA-Z]', '', 'g'), 4));
  END IF;

  LOOP
    v_candidate := v_prefix || LPAD(v_counter::TEXT, 3, '0');
    SELECT EXISTS (
      SELECT 1 FROM "School" WHERE code = v_candidate
    ) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN v_candidate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_registration_number(
  p_school_id TEXT,
  p_role TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_prefix    TEXT;
  v_new_count INT;
BEGIN
  IF p_role = 'ADMIN' THEN
    v_prefix := 'ADM';
  ELSIF p_role = 'MODERATOR' THEN
    v_prefix := 'MOD';
  ELSIF p_role = 'TEACHER' THEN
    v_prefix := 'TEA';
  ELSIF p_role = 'STUDENT' THEN
    v_prefix := 'STU';
  ELSIF p_role = 'PARENT' THEN
    v_prefix := 'PAR';
  ELSE
    RAISE EXCEPTION 'Unknown role: %', p_role;
  END IF;

  INSERT INTO "RegistrationCounter" (id, "schoolId", role, "lastCount", "updatedAt")
  VALUES (
    gen_random_uuid()::TEXT,
    p_school_id,
    p_role::"Role",
    1,
    NOW()
  )
  ON CONFLICT ("schoolId", role)
  DO UPDATE SET
    "lastCount" = "RegistrationCounter"."lastCount" + 1,
    "updatedAt" = NOW()
  RETURNING "lastCount" INTO v_new_count;

  RETURN v_prefix || LPAD(v_new_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS chk_user_school_id;

ALTER TABLE "User"
ADD CONSTRAINT chk_user_school_id CHECK (
    (
        role = 'SUPER_ADMIN'
        AND "schoolId" IS NULL
    )
    OR (
        role != 'SUPER_ADMIN'
        AND "schoolId" IS NOT NULL
    )
);

CREATE OR REPLACE FUNCTION trg_fn_assign_superadmin_reg()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_existing_count
  FROM "User"
  WHERE role = 'SUPER_ADMIN'
    AND id != NEW.id;

  IF v_existing_count >= 1 THEN
    RAISE EXCEPTION 'Only one Super Admin is allowed in the system.';
  END IF;

  NEW."regNumber" := 'SADM001';
  NEW."schoolId"  := NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_superadmin_reg ON "User";

CREATE TRIGGER trg_assign_superadmin_reg
  BEFORE INSERT ON "User"
  FOR EACH ROW
  WHEN (NEW.role = 'SUPER_ADMIN')
  EXECUTE FUNCTION trg_fn_assign_superadmin_reg();

CREATE OR REPLACE FUNCTION trg_fn_assign_admin_reg()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'ADMIN' AND NEW."schoolId" IS NOT NULL THEN
    NEW."regNumber" := generate_registration_number(NEW."schoolId", 'ADMIN');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_admin_reg ON "User";

CREATE TRIGGER trg_assign_admin_reg
  BEFORE INSERT ON "User"
  FOR EACH ROW
  WHEN (NEW.role = 'ADMIN')
  EXECUTE FUNCTION trg_fn_assign_admin_reg();

CREATE OR REPLACE FUNCTION trg_fn_assign_moderator_reg()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'MODERATOR' AND NEW."schoolId" IS NOT NULL THEN
    NEW."regNumber" := generate_registration_number(NEW."schoolId", 'MODERATOR');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_moderator_reg ON "User";

CREATE TRIGGER trg_assign_moderator_reg
  BEFORE INSERT ON "User"
  FOR EACH ROW
  WHEN (NEW.role = 'MODERATOR')
  EXECUTE FUNCTION trg_fn_assign_moderator_reg();

CREATE OR REPLACE FUNCTION trg_fn_assign_teacher_reg()
RETURNS TRIGGER AS $$
DECLARE
  v_school_id TEXT;
BEGIN
  IF NEW."employmentStatus" = 'ACTIVE' AND OLD."employmentStatus" != 'ACTIVE' THEN
    SELECT u."schoolId"
    INTO v_school_id
    FROM "User" u
    WHERE u.id = NEW."userId";

    IF v_school_id IS NOT NULL THEN
      UPDATE "User"
      SET "regNumber" = generate_registration_number(v_school_id, 'TEACHER')
      WHERE id = NEW."userId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_teacher_reg ON "Teacher";

CREATE TRIGGER trg_assign_teacher_reg
  AFTER UPDATE ON "Teacher"
  FOR EACH ROW
  WHEN (
    NEW."employmentStatus" = 'ACTIVE'
    AND OLD."employmentStatus" != 'ACTIVE'
  )
  EXECUTE FUNCTION trg_fn_assign_teacher_reg();

CREATE OR REPLACE FUNCTION trg_fn_assign_student_reg()
RETURNS TRIGGER AS $$
DECLARE
  v_school_id TEXT;
BEGIN
  IF NEW."enrollmentStatus" = 'ACTIVE' AND OLD."enrollmentStatus" != 'ACTIVE' THEN
    SELECT u."schoolId"
    INTO v_school_id
    FROM "User" u
    WHERE u.id = NEW."userId";

    IF v_school_id IS NOT NULL THEN
      UPDATE "User"
      SET "regNumber" = generate_registration_number(v_school_id, 'STUDENT')
      WHERE id = NEW."userId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_student_reg ON "Student";

CREATE TRIGGER trg_assign_student_reg
  AFTER UPDATE ON "Student"
  FOR EACH ROW
  WHEN (
    NEW."enrollmentStatus" = 'ACTIVE'
    AND OLD."enrollmentStatus" != 'ACTIVE'
  )
  EXECUTE FUNCTION trg_fn_assign_student_reg();

CREATE OR REPLACE FUNCTION trg_fn_assign_parent_reg()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_reg TEXT;
  v_current_reg  TEXT;
  v_school_id    TEXT;
BEGIN
  SELECT u."regNumber"
  INTO v_existing_reg
  FROM "Parent" p
  JOIN "User" u ON u.id = p."userId"
  WHERE p."studentId" = NEW."studentId"
    AND p.id != NEW.id
  LIMIT 1;

  IF v_existing_reg IS NOT NULL THEN
    RAISE EXCEPTION
      'Student % already has a parent with a registration number. Only one parent can receive a registration number.',
      NEW."studentId";
  END IF;

  SELECT u."regNumber"
  INTO v_current_reg
  FROM "User" u
  WHERE u.id = NEW."userId";

  IF v_current_reg IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT u."schoolId"
  INTO v_school_id
  FROM "User" u
  WHERE u.id = NEW."userId";

  IF v_school_id IS NOT NULL THEN
    UPDATE "User"
    SET "regNumber" = generate_registration_number(v_school_id, 'PARENT')
    WHERE id = NEW."userId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_parent_reg ON "Parent";

CREATE TRIGGER trg_assign_parent_reg
  AFTER INSERT ON "Parent"
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_assign_parent_reg();

CREATE OR REPLACE FUNCTION trg_fn_prevent_reg_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."regNumber" IS NOT NULL
    AND NEW."regNumber" != OLD."regNumber"
  THEN
    RAISE EXCEPTION
      'Registration number cannot be modified once assigned. Current: %, Attempted: %',
      OLD."regNumber",
      NEW."regNumber";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_reg_change ON "User";

CREATE TRIGGER trg_prevent_reg_change
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  WHEN (OLD."regNumber" IS DISTINCT FROM NEW."regNumber")
  EXECUTE FUNCTION trg_fn_prevent_reg_change();

CREATE OR REPLACE FUNCTION trg_fn_prevent_duplicate_superadmin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'SUPER_ADMIN' AND OLD.role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Cannot change role to SUPER_ADMIN after creation.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_superadmin ON "User";

CREATE TRIGGER trg_prevent_duplicate_superadmin
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  WHEN (NEW.role = 'SUPER_ADMIN' AND OLD.role != 'SUPER_ADMIN')
  EXECUTE FUNCTION trg_fn_prevent_duplicate_superadmin();

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherSubject_teacherId_subjectId_no_class_key" ON "TeacherSubject" ("teacherId", "subjectId")
WHERE
    "classId" IS NULL;

ALTER TABLE "Timetable"
ADD COLUMN "periodNumber" INTEGER NOT NULL;

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
CREATE INDEX "AdminAttendance_adminId_idx" ON "AdminAttendance" ("adminId");

-- CreateIndex
CREATE INDEX "AdminAttendance_date_idx" ON "AdminAttendance" ("date");

-- CreateIndex
CREATE INDEX "AdminAttendance_status_idx" ON "AdminAttendance" ("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAttendance_adminId_date_key" ON "AdminAttendance" ("adminId", "date");

-- AddForeignKey
ALTER TABLE "AdminAttendance"
ADD CONSTRAINT "AdminAttendance_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE;