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

export enum PaymentMode {
  CASH = "CASH",
  UPI = "UPI",
  CHEQUE = "CHEQUE",
  BANK_TRANSFER = "BANK_TRANSFER",
  CARD = "CARD",
  ONLINE = "ONLINE",
}

export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  REVERSED = "REVERSED",
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

export type ModuleKey =
  | "ACADEMIC_YEAR"
  | "CLASS"
  | "SUBJECT"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "ADMISSION_APPLICATION"
  | "TEACHER_APPLICATION"
  | "TEACHER_SUBJECT"
  | "CLASS_TEACHER"
  | "ENROLLMENT"
  | "TIMETABLE"
  | "HOLIDAY"
  | "STUDENT_ATTENDANCE"
  | "TEACHER_ATTENDANCE"
  | "EXAM_SCHEDULE"
  | "MARK"
  | "FEE_STRUCTURE"
  | "FEE_PAYMENT"
  | "LEAVE_REQUEST"
  | "ANNOUNCEMENT"
  | "NOTIFICATION"
  | "DOCUMENT"
  | "AUDIT_LOG"
  | "SYSTEM_LOG"
  | "IP_BLACKLIST"
  | "RATE_LIMIT";

export type PermissionAction =
  | "canCreate"
  | "canRead"
  | "canUpdate"
  | "canDelete"
  | "canApprove"
  | "canExport";

export type PermissionFlags = Record<PermissionAction, boolean>;

export interface MyPermissions {
  role: Role;
  isAdmin: boolean;
  permissions: Record<ModuleKey, PermissionFlags>;
}

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

export interface TeacherApplicationStatusResponse {
  id: string;
  status: ApplicationStatus;
  updatedAt: string;
  rejectionReason?: string | null;
}

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
  feeDueDay: number;
  allowPartialPayments: boolean;
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
  classGroupId: string;
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
  photoUrl: string | null;
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
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user?: SafeUser;
  parentLinks?: ParentStudent[];
  enrollments?: Enrollment[];
  attendances?: StudentAttendance[];
  marks?: Mark[];
  feePayments?: FeePayment[];
  leaveRequests?: LeaveRequest[];
  documents?: Document[];
}

export interface StudentWithDetails extends Omit<
  Student,
  "user" | "parentLinks" | "enrollments"
> {
  user: SafeUser;
  parentLinks: ParentStudent[];
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
  withdrawalReason: string | null;
  withdrawnAt: string | null;
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
  firstName: string;
  lastName: string;
  alternatePhone: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user?: SafeUser;
  children?: ParentStudent[];
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

export interface FeeStructure {
  id: string;
  academicYearId: string;
  classId: string | null;
  name: string;
  amount: number;
  isRecurring: boolean;
  recurringMonth: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  classGroupId: string;
  academicYear?: AcademicYear;
  class?: Class;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
  status: FeeStatus;
  paymentDate: string | null;
  dueDate: string;
  billingPeriod: string | null;
  waiverReason: string | null;
  waivedById: string | null;
  waivedAt: string | null;
  remarks: string | null;
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

export interface HolidayFilters {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
}

export interface CreateHolidayPayload {
  name: string;
  date: string;
  description?: string;
  overrideAttendance?: boolean;
}

export interface UpdateHolidayPayload {
  name?: string;
  date?: string;
  description?: string;
  overrideAttendance?: boolean;
}

export interface HolidayMutationResult {
  holiday: Holiday;
  convertedAttendance: number;
}

export interface HolidayAttendanceConflict {
  date: string;
  students: number;
  teachers: number;
  admins: number;
  total: number;
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
  isRecurring: boolean;
  recurringMonth: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  classGroupId: string;
  academicYear?: AcademicYear;
  class?: Class;
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
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
  status: FeeStatus;
  paymentDate: string | null;
  dueDate: string;
  billingPeriod: string | null;
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

export interface TodayPeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subjectName: string;
  teacherName: string;
  className: string;
}

export interface TodayExam {
  id: string;
  title: string;
  examType: ExamType;
  date: string;
  startTime: string;
  subjectName: string;
  className: string;
  childName: string | null;
}

export interface TodayExamOutlook {
  count: number;
  byDay: number[];
  next: TodayExam | null;
}

export interface TodayFeeOutlook {
  pendingCount: number;
  overdueCount: number;
  dueAmount: number;
}

interface TodayBase {
  date: string;
  dayOfWeek: DayOfWeek;
  time: string;
  holiday: string | null;
}

export interface StudentToday extends TodayBase {
  role: "STUDENT";
  className: string | null;
  periodsToday: number;
  nextPeriod: TodayPeriod | null;
  weekLoad: number[];
  exams: TodayExamOutlook;
  attendanceToday: AttendanceStatus | null;
  recentAttendance: AttendanceStatus[];
  fees: TodayFeeOutlook;
}

export interface TeacherToday extends TodayBase {
  role: "TEACHER";
  periodsToday: number;
  nextPeriod: TodayPeriod | null;
  weekLoad: number[];
  exams: TodayExamOutlook;
  classTeacherOf: {
    classId: string;
    className: string;
    students: number;
    attendanceMarked: boolean;
  }[];
}

export interface ParentToday extends TodayBase {
  role: "PARENT";
  children: {
    studentId: string;
    name: string;
    className: string | null;
    periodsToday: number;
    attendanceToday: AttendanceStatus | null;
  }[];
  periodsToday: number;
  exams: TodayExamOutlook;
  fees: TodayFeeOutlook;
}

export interface AdminToday extends TodayBase {
  role: "ADMIN" | "MODERATOR";
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    marked: number;
    enrolled: number;
    rate: number | null;
  };
  attendanceTrend: (number | null)[];
  pending: {
    admissions: number;
    teacherApplications: number;
    leaveRequests: number;
    total: number;
  };
  exams: TodayExamOutlook;
}

export type MyTodaySummary =
  | StudentToday
  | TeacherToday
  | ParentToday
  | AdminToday;

export interface ParentStudent {
  id: string;
  parentId: string;
  studentId: string;
  parentType: ParentType;
  createdAt: string;
  parent?: Parent;
  student?: Student;
}

export interface EnrollmentListItem {
  studentId: string;
  status: EnrollmentStatus;
  academicYearId: string;
  class: {
    name: string;
    section: string;
  };
  student: {
    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    enrollmentStatus: EnrollmentStatus;
    admissionDate: string;
    user: {
      email: string | null;
      phone: string | null;
    };
    parentLinks: {
      parentType: ParentType;
      parent: {
        firstName: string;
        lastName: string;
        alternatePhone: string | null;
        user: {
          email: string | null;
          phone: string | null;
        };
      };
    }[];
  };
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

export interface DashboardSummary {
  academicYear: {
    id: string;
    name: string;
  } | null;
  students: {
    total: number;
    byStatus: {
      ACTIVE: number;
      INACTIVE: number;
      SUSPENDED: number;
      GRADUATED: number;
      TRANSFERRED: number;
      EXPELLED: number;
      WITHDRAWN: number;
    };
  };
  teachers: {
    total: number;
    byStatus: {
      ACTIVE: number;
      INACTIVE: number;
      SUSPENDED: number;
      TERMINATED: number;
      ON_LEAVE: number;
    };
  };
  admins: {
    total: number;
    byStatus: {
      ACTIVE: number;
      INACTIVE: number;
      SUSPENDED: number;
      TERMINATED: number;
      ON_LEAVE: number;
    };
  };
  parentCount: number;
  classCount: number;
  admissionApplications: {
    total: number;
    byStatus: {
      PENDING: number;
      WAITLISTED: number;
      APPROVED: number;
      REJECTED: number;
      SLOT_OFFERED: number;
      OFFER_EXPIRED: number;
      OFFER_DECLINED: number;
    };
  };
  teacherApplications: {
    total: number;
    byStatus: {
      PENDING: number;
      SHORTLISTED: number;
      SELECTED: number;
      REJECTED: number;
    };
  };
  feePayments: {
    total: number;
    byStatus: {
      PENDING: number;
      PAID: number;
      OVERDUE: number;
      WAIVED: number;
      PARTIAL: number;
    };
  };
  feeRevenue: {
    collected: number;
    expected: number;
  };
  studentLeaveRequests: {
    total: number;
    byStatus: {
      PENDING: number;
      APPROVED: number;
      REJECTED: number;
      CANCELLED: number;
    };
  };
  teacherLeaveRequests: {
    total: number;
    byStatus: {
      PENDING: number;
      APPROVED: number;
      REJECTED: number;
      CANCELLED: number;
    };
  };
  todayAttendance: {
    students: {
      PRESENT: number;
      ABSENT: number;
      LATE: number;
      EXCUSED: number;
      HOLIDAY: number;
    };
    teachers: {
      PRESENT: number;
      ABSENT: number;
      LATE: number;
      EXCUSED: number;
      HOLIDAY: number;
    };
  };
}

export interface AdmissionApplicationStatusResponse {
  id: string;
  status: string;
  updatedAt: string;
  rejectionReason?: string | null;
  waitlistReason?: string | null;
  waitlistPosition?: number | null;
  slotOfferedAt?: string | null;
  slotExpiresAt?: string | null;
  slotOfferedClass?: string | null;
}

export type ProfileUserFields = Pick<
  User,
  | "id"
  | "regNumber"
  | "role"
  | "email"
  | "phone"
  | "isActive"
  | "isVerified"
  | "lastLoginAt"
  | "createdAt"
>;

export type StudentProfileRecord = Omit<
  Student,
  | "user"
  | "parentLinks"
  | "enrollments"
  | "attendances"
  | "marks"
  | "feePayments"
  | "leaveRequests"
  | "documents"
>;

export type TeacherProfileRecord = Omit<
  Teacher,
  | "user"
  | "subjects"
  | "timetables"
  | "classTeachers"
  | "attendances"
  | "leaveRequests"
  | "examSchedules"
  | "documents"
> & {
  photoUrl: string | null;
};

export type ParentProfileRecord = Omit<
  Parent,
  "user" | "children" | "documents"
>;

export type AdminProfileRecord = Omit<
  SingleAdminInfo,
  "adminAttendance" | "user"
>;

export interface StudentProfile extends Omit<ProfileUserFields, "role"> {
  role: Role.STUDENT;
  student: StudentProfileRecord | null;
}

export interface TeacherProfile extends Omit<ProfileUserFields, "role"> {
  role: Role.TEACHER;
  teacher: TeacherProfileRecord | null;
}

export interface ParentProfile extends Omit<ProfileUserFields, "role"> {
  role: Role.PARENT;
  parent: ParentProfileRecord | null;
}

export interface AdminProfile extends Omit<ProfileUserFields, "role"> {
  role: Role.ADMIN | Role.MODERATOR;
  admin: AdminProfileRecord | null;
}

export type MyProfile =
  | StudentProfile
  | TeacherProfile
  | ParentProfile
  | AdminProfile;

export type UpdatedUserCore = Pick<User, "id" | "email" | "phone" | "role">;

export type UpdatedProfile =
  | {
      user: UpdatedUserCore & { role: Role.STUDENT };
      student: StudentProfileRecord;
    }
  | {
      user: UpdatedUserCore & { role: Role.TEACHER };
      teacher: TeacherProfileRecord;
    }
  | {
      user: UpdatedUserCore & { role: Role.PARENT };
      parent: ParentProfileRecord;
    }
  | {
      user: UpdatedUserCore & { role: Role.ADMIN | Role.MODERATOR };
      admin: AdminProfileRecord;
    };

export type GetMyProfileResponse = ApiResponse<MyProfile>;
export type UpdateMyProfileResponse = ApiResponse<UpdatedProfile>;

export interface UpdateStudentProfilePayload {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  emergencyContact?: string;
}

export interface UpdateTeacherProfilePayload {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualification?: string;
  experience?: number;
  specialization?: string;
  photoUrl?: string;
}

export interface UpdateParentProfilePayload {
  email?: string;
  phone?: string;
  alternatePhone?: string;
}

export interface UpdateAdminProfilePayload {
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  photoUrl?: string;
}

export type UpdateMyProfilePayload =
  | UpdateStudentProfilePayload
  | UpdateTeacherProfilePayload
  | UpdateParentProfilePayload
  | UpdateAdminProfilePayload;

export interface FeeBillStructureRef {
  id: string;
  name: string;
  isRecurring: boolean;
  recurringMonth: number | null;
}

export interface FeeBillStudentRef {
  id: string;
  firstName: string;
  lastName: string;
  regNumber: string;
  className: string | null;
  rollNumber: string | null;
}

export interface FeeBillListItem {
  id: string;
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
  balance: number;
  status: FeeStatus;
  dueDate: string;
  billingPeriod: string | null;
  paymentDate: string | null;
  createdAt: string;
  receiptCount: number;
  feeStructure: FeeBillStructureRef;
  student: FeeBillStudentRef;
}

export interface FeeBillTotals {
  billed: number;
  collected: number;
  waived: number;
  outstanding: number;
}

export interface PaginatedFeeBills extends PaginatedResponse<FeeBillListItem> {
  totals: FeeBillTotals;
}

export interface FeeBillGuardian {
  relation: ParentType;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface FeeBillSnapshot {
  id: string;
  studentId?: string;
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
  status: FeeStatus;
  balance: number;
}

export interface FeeBillFilters {
  page?: number;
  limit?: number;
  status?: FeeStatus;
  academicYearId?: string;
  classId?: string;
  classGroupId?: string;
  feeStructureId?: string;
  billingPeriod?: string;
  overdueOnly?: boolean;
  search?: string;
  sortBy?: "dueDate" | "createdAt" | "paymentDate" | "amountDue";
  order?: "asc" | "desc";
}

export interface WaiveFeePaymentPayload {
  amount?: number;
  reason: string;
}

export interface MyFeesSummary {
  billed: number;
  paid: number;
  waived: number;
  outstanding: number;
  overdueCount: number;
  openCount: number;
}

export type FeeDueStatus = "ALL" | "DUE" | "OVERDUE" | "CLEARED";

export type FeeStudentSort = "outstanding" | "overdue" | "name" | "lastPayment";

export interface FeeStudentFilters {
  page?: number;
  limit?: number;
  academicYearId?: string;
  classId?: string;
  classGroupId?: string;
  search?: string;
  dueStatus?: FeeDueStatus;
  sortBy?: FeeStudentSort;
  order?: "asc" | "desc";
}

export interface FeeStudentRow {
  studentId: string;
  firstName: string;
  lastName: string;
  regNumber: string;
  className: string | null;
  classId: string | null;
  rollNumber: string | null;
  enrollmentStatus: EnrollmentStatus | null;
  billCount: number;
  billed: number;
  paid: number;
  waived: number;
  outstanding: number;
  overdueCount: number;
  lastPaymentAt: string | null;
}

export interface FeeStudentTotals {
  students: number;
  billed: number;
  collected: number;
  waived: number;
  outstanding: number;
  withDues: number;
  withOverdue: number;
}

export interface PaginatedFeeStudents extends PaginatedResponse<FeeStudentRow> {
  totals: FeeStudentTotals;
}

export interface FeeBillsSummary {
  billed: number;
  paid: number;
  waived: number;
  outstanding: number;
  overdueCount: number;
  openCount: number;
  billCount: number;
}

export interface StudentFeeBill {
  id: string;
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
  balance: number;
  isOverdue: boolean;
  status: FeeStatus;
  dueDate: string;
  billingPeriod: string | null;
  paymentDate: string | null;
  createdAt: string;
  waiverReason: string | null;
  waivedAt: string | null;
  waivedBy: string | null;
  feeStructure: FeeBillStructureRef;
}

export interface StudentFeeYear {
  academicYearId: string;
  name: string;
  isCurrent: boolean;
  summary: FeeBillsSummary;
  bills: StudentFeeBill[];
}

export interface FeeReceiptItem {
  billId: string;
  feeName: string;
  billingPeriod: string | null;
  amount: number;
}

export interface FeeReceiptSummary {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMode: PaymentMode;
  referenceNumber: string | null;
  paidAt: string;
  remarks: string | null;
  status: TransactionStatus;
  reversedAt: string | null;
  reversalReason: string | null;
  createdAt: string;
  academicYear: { id: string; name: string };
  collectedBy: string | null;
  reversedBy: string | null;
  items: FeeReceiptItem[];
}

export interface FeeStudentDetail {
  student: FeeBillStudentRef & {
    email: string | null;
    phone: string | null;
    enrollmentStatus: EnrollmentStatus | null;
    session: string | null;
    guardians: FeeBillGuardian[];
  };
  summary: FeeBillsSummary;
  years: StudentFeeYear[];
  receipts: FeeReceiptSummary[];
}

export interface CollectStudentFeesPayload {
  billIds: string[];
  amount: number;
  paymentMode: Exclude<PaymentMode, PaymentMode.ONLINE>;
  referenceNumber?: string;
  paidAt?: string;
  remarks?: string;
}

export interface CollectStudentFeesResult {
  receipt: FeeReceiptSummary;
  bills: FeeBillSnapshot[];
  balanceRemaining: number;
}

export interface ReverseFeeReceiptPayload {
  reason: string;
}

export interface ReverseFeeReceiptResult {
  receipt: FeeReceiptSummary;
  bills: FeeBillSnapshot[];
}

export interface MyFeeReceipt {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMode: PaymentMode;
  paidAt: string;
  status: TransactionStatus;
  academicYear: { id: string; name: string };
  items: FeeReceiptItem[];
}

export interface MyFeesChild {
  studentId: string;
  name: string;
  className: string | null;
  summary: FeeBillsSummary;
  years: StudentFeeYear[];
  receipts: MyFeeReceipt[];
}

export interface MyFeesResponse {
  children: MyFeesChild[];
}

export interface DashboardAccess {
  students: boolean;
  teachers: boolean;
  studentAttendance: boolean;
  teacherAttendance: boolean;
  fees: boolean;
  admissions: boolean;
  teacherApplications: boolean;
  classes: boolean;
  leaves: boolean;
}

export interface DashboardTrendStat {
  value: number;
  previous: number | null;
  changePercent: number | null;
}

export interface DashboardAttendanceToday {
  isHoliday: boolean;
  holidayName: string | null;
  present: number;
  late: number;
  absent: number;
  excused: number;
  marked: number;
  enrolled: number;
  percent: number | null;
  weekAveragePercent: number | null;
  changePoints: number | null;
}

export interface DashboardWeeklyDay {
  date: string;
  label: string;
  isHoliday: boolean;
  holidayName: string | null;
  isFuture: boolean;
  marked: number;
  presentPercent: number;
  latePercent: number;
  absentPercent: number;
}

export interface DashboardMonthlyFee {
  month: string;
  label: string;
  collected: number;
  billed: number;
}

export interface DashboardFeeDefaulter {
  studentId: string;
  name: string;
  regNumber: string;
  className: string | null;
  overdueAmount: number;
  overdueCount: number;
  oldestDueDate: string;
}

export interface DashboardRecentPayment {
  receiptId: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMode: PaymentMode;
  paidAt: string;
}

export interface DashboardSeatsByGroup {
  classGroupId: string;
  name: string;
  classCount: number;
  capacity: number;
  filled: number;
}

export interface DashboardTeacherAttendance {
  total: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  notMarked: number;
}

export interface DashboardAdmissionsFunnel {
  since: string;
  applied: number;
  pending: number;
  waitlisted: number;
  slotOffered: number;
  approved: number;
  rejected: number;
  enrolled: number;
}

export interface DashboardPendingCounts {
  admissions: number | null;
  teacherApplications: number | null;
  studentLeaves: number | null;
  teacherLeaves: number | null;
}

export type DashboardEventType = "EXAM" | "HOLIDAY";

export interface DashboardEvent {
  id: string;
  type: DashboardEventType;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  examType: ExamType | null;
  className: string | null;
  subjectName: string | null;
  description: string | null;
}

export interface DashboardOverview {
  generatedAt: string;
  today: string;
  academicYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  access: DashboardAccess;
  pending: DashboardPendingCounts;
  stats: {
    students: DashboardTrendStat | null;
    teachers: DashboardTrendStat | null;
    attendanceToday: DashboardAttendanceToday | null;
    feeCollected: DashboardTrendStat | null;
  };
  weeklyAttendance: { weekStart: string; days: DashboardWeeklyDay[] } | null;
  monthlyFees: DashboardMonthlyFee[] | null;
  feeDefaulters: DashboardFeeDefaulter[] | null;
  recentPayments: DashboardRecentPayment[] | null;
  seatsByGroup: DashboardSeatsByGroup[] | null;
  teacherAttendanceToday: DashboardTeacherAttendance | null;
  admissionsFunnel: DashboardAdmissionsFunnel | null;
  upcoming: DashboardEvent[];
}

export interface DashboardCalendar {
  month: string;
  events: DashboardEvent[];
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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiMessageResponse {
  success: true;
  message?: string;
}
