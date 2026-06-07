export enum Role {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  MODERATOR = "MODERATOR",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum AdmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WAITLISTED = "WAITLISTED",
  SLOT_OFFERED = "SLOT_OFFERED",
  OFFER_EXPIRED = "OFFER_EXPIRED",
  OFFER_DECLINED = "OFFER_DECLINED",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  SHORTLISTED = "SHORTLISTED",
  SELECTED = "SELECTED",
  REJECTED = "REJECTED",
}

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  GRADUATED = "GRADUATED",
  TRANSFERRED = "TRANSFERRED",
  EXPELLED = "EXPELLED",
  WITHDRAWN = "WITHDRAWN",
}

export enum EmploymentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
  ON_LEAVE = "ON_LEAVE",
}

export enum NotificationType {
  INFO = "INFO",
  WARNING = "WARNING",
  ALERT = "ALERT",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  REMINDER = "REMINDER",
  URGENT = "URGENT",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  SSE = "SSE",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET = "PASSWORD_RESET",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  ROLE_CHANGE = "ROLE_CHANGE",
  STATUS_CHANGE = "STATUS_CHANGE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ASSIGN = "ASSIGN",
  UNASSIGN = "UNASSIGN",
  GENERATE_REG_NO = "GENERATE_REG_NO",
  SSE_CONNECT = "SSE_CONNECT",
  SSE_DISCONNECT = "SSE_DISCONNECT",
  DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD",
  DOCUMENT_DELETE = "DOCUMENT_DELETE",
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
  HOLIDAY = "HOLIDAY",
}

export enum ExamType {
  UNIT_TEST = "UNIT_TEST",
  MID_TERM = "MID_TERM",
  FINAL = "FINAL",
  PRACTICAL = "PRACTICAL",
  ASSIGNMENT = "ASSIGNMENT",
  PROJECT = "PROJECT",
  QUIZ = "QUIZ",
}

export enum FeeStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  WAIVED = "WAIVED",
  PARTIAL = "PARTIAL",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ParentType {
  FATHER = "FATHER",
  MOTHER = "MOTHER",
  GUARDIAN = "GUARDIAN",
}

export enum DocumentType {
  ADMISSION_FORM = "ADMISSION_FORM",
  BIRTH_CERTIFICATE = "BIRTH_CERTIFICATE",
  TRANSFER_CERTIFICATE = "TRANSFER_CERTIFICATE",
  MARKSHEET = "MARKSHEET",
  ID_PROOF = "ID_PROOF",
  ADDRESS_PROOF = "ADDRESS_PROOF",
  PHOTO = "PHOTO",
  RESUME = "RESUME",
  QUALIFICATION_CERTIFICATE = "QUALIFICATION_CERTIFICATE",
  MEDICAL_CERTIFICATE = "MEDICAL_CERTIFICATE",
  FEE_RECEIPT = "FEE_RECEIPT",
  LEAVE_DOCUMENT = "LEAVE_DOCUMENT",
  OTHER = "OTHER",
}

export enum DocumentOwnerType {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
  PARENT = "PARENT",
  ADMISSION_APPLICATION = "ADMISSION_APPLICATION",
  TEACHER_APPLICATION = "TEACHER_APPLICATION",
  LEAVE_REQUEST = "LEAVE_REQUEST",
  FEE_PAYMENT = "FEE_PAYMENT",
}

export enum Module {
  ACADEMIC_YEAR = "ACADEMIC_YEAR",
  CLASS = "CLASS",
  SUBJECT = "SUBJECT",
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  ADMISSION_APPLICATION = "ADMISSION_APPLICATION",
  TEACHER_APPLICATION = "TEACHER_APPLICATION",
  TEACHER_SUBJECT = "TEACHER_SUBJECT",
  CLASS_TEACHER = "CLASS_TEACHER",
  ENROLLMENT = "ENROLLMENT",
  TIMETABLE = "TIMETABLE",
  HOLIDAY = "HOLIDAY",
  STUDENT_ATTENDANCE = "STUDENT_ATTENDANCE",
  TEACHER_ATTENDANCE = "TEACHER_ATTENDANCE",
  EXAM_SCHEDULE = "EXAM_SCHEDULE",
  MARK = "MARK",
  FEE_STRUCTURE = "FEE_STRUCTURE",
  FEE_PAYMENT = "FEE_PAYMENT",
  LEAVE_REQUEST = "LEAVE_REQUEST",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  NOTIFICATION = "NOTIFICATION",
  DOCUMENT = "DOCUMENT",
  AUDIT_LOG = "AUDIT_LOG",
  SYSTEM_LOG = "SYSTEM_LOG",
  IP_BLACKLIST = "IP_BLACKLIST",
  RATE_LIMIT = "RATE_LIMIT",
}

// ─────────────────────────────────────────────
// CORE MODELS
// ─────────────────────────────────────────────

export type AdmissionClass = {
  id: string;
  name: string;
  section: string | null;
  capacity: number;
  roomNumber: string | null;
  academicYearId: string;
  enrolled: number;
  pending: number;
  remaining: number;
};

export interface SchoolConfig {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string | null;
  logoUrl: string | null;
  establishedYear: number;
  affiliationNumber: string | null;
  boardType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  academicYearId: string;
  name: string;
  section: string;
  capacity: number;
  roomNumber: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
  classTeachers?: ClassTeacher[];
  enrollments?: Enrollment[];
  timetables?: Timetable[];
  examSchedules?: ExamSchedule[];
  leaveRequest?: LeaveRequest[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isElective: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherSubjects: TeacherSubject[];
  timetables: Timetable[];
}

// ─────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────

export interface SafeUser {
  id: string;
  regNumber: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  regNumber: string;
  role: Role;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  module: Module;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  ipAddress: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  photoUrl: string | null;
  designation: string | null;
  department: string | null;
  joiningDate: string;
}

export interface AdminAttendance {
  id: string;
  adminId: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// TEACHER
// ─────────────────────────────────────────────

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  qualification: string;
  experience: number;
  specialization: string | null;
  joiningDate: string;
  employmentStatus: EmploymentStatus;
  salary: number | null;
  createdAt: string;
  updatedAt: string;
  user?: SafeUser;
  subjects?: TeacherSubject[];
  timetables?: Timetable[];
  classTeachers?: ClassTeacher[];
  attendances?: TeacherAttendance[];
  leaveRequests?: LeaveRequest[];
  examSchedules?: ExamSchedule[];
  documents?: Document[];
}

export interface TeacherWithDetails extends Omit<Teacher, "user"> {
  user: SafeUser;
  subjects?: TeacherSubject[];
  classTeachers?: ClassTeacher[];
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string | null;
  isPrimary: boolean;
  createdAt: string;
  teacher?: Teacher;
  subject?: Subject;
}

export interface ClassTeacher {
  id: string;
  classId: string;
  teacherId: string;
  isPrimary: boolean;
  createdAt: string;
  class?: Class;
  teacher?: Teacher;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  remarks: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  qualification: string;
  experience: number;
  specialization: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
  documents?: Document[];
  histories?: TeacherApplicationHistory[];
}

export interface TeacherApplicationHistory {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  previousStatus: ApplicationStatus;
  rejectionReason: string | null;
  changedAt: string;
  changedBy: string;
}

// ─────────────────────────────────────────────
// STUDENT
// ─────────────────────────────────────────────

export interface Student {
  id: string;
  userId: string;
  admissionId: string | null;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bloodGroup: string | null;
  medicalConditions: string | null;
  emergencyContact: string | null;
  enrollmentStatus: EnrollmentStatus;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
  user?: SafeUser;
  parent?: Parent;
  enrollments?: Enrollment[];
  attendances?: StudentAttendance[];
  marks?: Mark[];
  feePayments?: FeePayment[];
  leaveRequests?: LeaveRequest[];
  documents?: Document[];
}

export interface StudentWithDetails extends Omit<
  Student,
  "user" | "parent" | "enrollments"
> {
  user: SafeUser;
  parent: Parent | undefined;
  enrollments: Enrollment[];
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  rollNumber: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  updatedAt: string;
  student?: Student;
  class?: Class;
  academicYear?: AcademicYear;
}

// ─────────────────────────────────────────────
// PARENT
// ─────────────────────────────────────────────

export interface Parent {
  id: string;
  userId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  parentType: ParentType;
  alternatePhone: string | null;
  createdAt: string;
  updatedAt: string;
  user?: SafeUser;
  student?: Student;
  documents?: Document[];
}

// ─────────────────────────────────────────────
// ADMISSION
// ─────────────────────────────────────────────

export interface AdmissionApplication {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  previousSchool: string | null;
  previousClass: string | null;
  appliedForClass: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianRelation: ParentType;
  guardianPhone: string;
  guardianEmail: string | null;
  status: AdmissionStatus;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  waitlistReason: string | null;
  waitlistPosition: number | null;
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
  guardianPhotoUrl: string | null;
  documents?: Document[];
  histories?: AdmissionApplicationHistory[];
  slotOfferedAt?: string | null;
  slotExpiresAt?: string | null;
  slotOfferedClass?: string | null;
}

export interface AdmissionApplicationHistory {
  id: string;
  applicationId: string;
  status: AdmissionStatus;
  previousStatus: AdmissionStatus;
  rejectionReason: string | null;
  changedAt: string;
  changedBy: string;
}

// ─────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────

export interface Timetable {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  periodNumber: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
}

// ─────────────────────────────────────────────
// EXAM & MARKS
// ─────────────────────────────────────────────

export interface ExamSchedule {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  examType: ExamType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  instructions: string | null;
  weightage: number;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
  marks?: Mark[];
}

export interface Mark {
  id: string;
  studentId: string;
  examScheduleId: string;
  subjectId: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  isAbsent: boolean;
  enteredBy: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  examSchedule?: ExamSchedule;
  subject?: Subject;
}

// ─────────────────────────────────────────────
// FEES
// ─────────────────────────────────────────────

export interface FeeStructure {
  id: string;
  academicYearId: string;
  classId: string | null;
  name: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  recurringMonth: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
  class?: Class;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  status: FeeStatus;
  paymentDate: string | null;
  dueDate: string;
  transactionId: string | null;
  paymentMode: string | null;
  receiptNumber: string | null;
  remarks: string | null;
  collectedBy: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  feeStructure?: FeeStructure;
  documents?: Document[];
}

// ─────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────

export interface LeaveRequest {
  id: string;
  requesterId: string;
  requesterRole: Role;
  studentId: string | null;
  teacherId: string | null;
  classId: string | null;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  teacher?: Teacher;
  class?: Class;
  documents?: Document[];
}

// ─────────────────────────────────────────────
// HOLIDAY
// ─────────────────────────────────────────────

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// ANNOUNCEMENTS & NOTIFICATIONS
// ─────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: Role[];
  publishedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  senderId: string | null;
  announcementId: string | null;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  sender?: SafeUser;
  announcement?: Announcement;
  recipients?: NotificationRecipient[];
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId: string;
  isRead: boolean;
  readAt: string | null;
  isDelivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
  notification?: Notification;
  user?: SafeUser;
}

export interface SSEConnection {
  id: string;
  userId: string;
  connectionId: string;
  ipAddress: string;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  connectedAt: string;
  lastPingAt: string;
  isActive: boolean;
  disconnectedAt: string | null;
  user?: SafeUser;
}

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────

export interface Document {
  id: string;
  ownerId: string;
  ownerType: DocumentOwnerType;
  documentType: DocumentType;
  title: string;
  originalFileName: string;
  cloudinaryId: string;
  cloudinaryUrl: string;
  secureUrl: string;
  resourceType: string;
  format: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  folder: string | null;
  uploadedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentId: string | null;
  teacherId: string | null;
  parentId: string | null;
  admissionId: string | null;
  teacherAppId: string | null;
  leaveRequestId: string | null;
  feePaymentId: string | null;
}

// ─────────────────────────────────────────────
// AUDIT & SYSTEM LOGS
// ─────────────────────────────────────────────

export interface AuditLog {
  id: string;
  performedById: string;
  targetUserId: string | null;
  action: AuditAction;
  module: string;
  resourceId: string | null;
  resourceType: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  sessionId: string | null;
  statusCode: number | null;
  isSuccessful: boolean;
  failureReason: string | null;
  duration: number | null;
  requestId: string | null;
  createdAt: string;
  performedBy?: SafeUser;
  targetUser?: SafeUser | null;
}

export interface SystemLog {
  id: string;
  userId: string | null;
  level: LogLevel;
  message: string;
  module: string;
  method: string | null;
  path: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  traceId: string | null;
  spanId: string | null;
  statusCode: number | null;
  duration: number | null;
  error: string | null;
  stackTrace: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: SafeUser | null;
}

export interface IPBlacklist {
  id: string;
  ipAddress: string;
  reason: string | null;
  blockedBy: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateLimitRecord {
  id: string;
  identifier: string;
  endpoint: string;
  requests: number;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// LIST ITEM TYPES (for paginated responses)
// ─────────────────────────────────────────────

export interface TeacherListItem {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  city: string;
  state: string;
  qualification: string;
  experience: number;
  specialization: string | null;
  employmentStatus: EmploymentStatus;
  joiningDate: string;
  createdAt: string;
  user: SafeUser;
}

export interface TeacherApplicationListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  qualification: string;
  experience: number;
  specialization: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  createdAt: string;
}

export interface StudentListItem {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  city: string;
  state: string;
  bloodGroup: string | null;
  enrollmentStatus: EnrollmentStatus;
  admissionDate: string;
  createdAt: string;
}

export interface AdmissionApplicationListItem {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  appliedForClass: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  status: AdmissionStatus;
  appliedAt: string;
  createdAt: string;
}

export interface TimetableListItem {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  periodNumber: number;
  isActive: boolean;
}

export interface ExamScheduleListItem {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  examType: ExamType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  weightage: number;
  createdAt: string;
}

export interface MarkListItem {
  id: string;
  studentId: string;
  examScheduleId: string;
  subjectId: string;
  marksObtained: number;
  grade: string | null;
  isAbsent: boolean;
  createdAt: string;
}

export interface FeeStructureListItem {
  id: string;
  academicYearId: string;
  classId: string | null;
  name: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface LeaveRequestListItem {
  id: string;
  requesterId: string;
  requesterRole: Role;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface FeePaymentListItem {
  id: string;
  studentId: string;
  amountPaid: number;
  status: FeeStatus;
  paymentDate: string | null;
  dueDate: string;
  receiptNumber: string | null;
  paymentMode: string | null;
  createdAt: string;
}

export interface AuditLogListItem {
  id: string;
  performedById: string;
  action: AuditAction;
  module: string;
  resourceId: string | null;
  isSuccessful: boolean;
  ipAddress: string | null;
  statusCode: number | null;
  createdAt: string;
}

export interface SystemLogListItem {
  id: string;
  level: LogLevel;
  message: string;
  module: string;
  statusCode: number | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AnnouncementListItem {
  id: string;
  title: string;
  targetRoles: Role[];
  publishedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
}

export interface NotificationListItem {
  id: string;
  title: string;
  type: NotificationType;
  channel: NotificationChannel;
  createdAt: string;
}

export interface DocumentListItem {
  id: string;
  documentType: DocumentType;
  title: string;
  originalFileName: string;
  secureUrl: string;
  format: string | null;
  sizeBytes: number | null;
  uploadedBy: string;
  createdAt: string;
}

export interface StudentAttendanceListItem {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  markedBy: string | null;
}

export interface TeacherAttendanceListItem {
  id: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  remarks: string | null;
  markedBy: string | null;
}

export interface EnrollmentListItem {
  id: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  rollNumber: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface IPBlacklistListItem {
  id: string;
  ipAddress: string;
  reason: string | null;
  blockedBy: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SingleAdminInfo {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  photoUrl: string | null;
  designation: string | null;
  department: string | null;
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
  adminAttendance: AdminAttendance[];
  user: User & {
    userPermission: UserPermission[];
  };
}

export type PaginatedTeachers = PaginatedResponse<TeacherListItem>;
export type PaginatedAdmins = PaginatedResponse<Admin>;
export type PaginatedTeacherApplications =
  PaginatedResponse<TeacherApplicationListItem>;
export type PaginatedStudents = PaginatedResponse<StudentListItem>;
export type PaginatedAdmissionApplications =
  PaginatedResponse<AdmissionApplicationListItem>;
export type PaginatedAuditLogs = PaginatedResponse<AuditLogListItem>;
export type PaginatedSystemLogs = PaginatedResponse<SystemLogListItem>;
export type PaginatedNotifications = PaginatedResponse<NotificationListItem>;
export type PaginatedLeaveRequests = PaginatedResponse<LeaveRequestListItem>;
export type PaginatedFeePayments = PaginatedResponse<FeePaymentListItem>;
export type PaginatedDocuments = PaginatedResponse<DocumentListItem>;
export type PaginatedAcademicYears = PaginatedResponse<AcademicYear>;
export type PaginatedClasses = PaginatedResponse<Class>;
export type PaginatedSubjects = PaginatedResponse<Subject>;
export type PaginatedTimetables = PaginatedResponse<TimetableListItem>;
export type PaginatedExamSchedules = PaginatedResponse<ExamScheduleListItem>;
export type PaginatedMarks = PaginatedResponse<MarkListItem>;
export type PaginatedFeeStructures = PaginatedResponse<FeeStructureListItem>;
export type PaginatedHolidays = PaginatedResponse<Holiday>;
export type PaginatedAnnouncements = PaginatedResponse<AnnouncementListItem>;
export type PaginatedStudentAttendance =
  PaginatedResponse<StudentAttendanceListItem>;
export type PaginatedTeacherAttendance =
  PaginatedResponse<TeacherAttendanceListItem>;
export type PaginatedEnrollments = PaginatedResponse<EnrollmentListItem>;
export type PaginatedIPBlacklist = PaginatedResponse<IPBlacklistListItem>;

// ─────────────────────────────────────────────
// API RESPONSE WRAPPER
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
