export interface User {
  id: string;
  schoolId: string;
  regNumber: string;
  role: "ADMIN" | "STUDENT" | "TEACHER" | "PARENT";
  email: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string;
  lastLoginIp: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginFormData {
  email?: string;
  regNumber?: string;
  password: string;
}

export interface AdmissionApplicationInput {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  previousSchool?: string;
  previousClass?: string;
  appliedForClass: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianRelation: ParentType;
  guardianEmail?: string;
  documents?: ApplicationDocument[];
}

export interface AdmissionApplication {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  previousSchool?: string;
  previousClass?: string;
  appliedForClass: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianRelation: ParentType;
  guardianEmail?: string;
  documents?: ApplicationDocument[];
}

export interface ResubmitAdmissionApplicationInput {
  previousSchool?: string;
  previousClass?: string;
  guardianEmail?: string;
  documents?: ApplicationDocument[];
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
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

export interface PaginatedAdmissionApplications {
  data: AdmissionApplicationInput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum AdmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WAITLISTED = "WAITLISTED",
}

export interface ApplicationDocument {
  id: string;
  title: string;
  documentType: string;
  secureUrl: string;
  originalFileName: string;
  sizeBytes: number | null;
  format: string | null;
  createdAt: string;
}

export interface StudentUser {
  id: string;
  regNumber: string;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "STUDENT" | "TEACHER" | "PARENT";
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface StudentParent {
  id: string;
  userId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  parentType: ParentType;
  alternatePhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollment {
  id: string;
  classId: string;
  academicYearId: string;
  rollNumber: string | null;
  status: AdmissionStatus;
  enrolledAt: string;
}

export interface StudentWithDetails {
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
  enrollmentStatus: AdmissionStatus;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
  user: StudentUser;
  parent: StudentParent | null;
  enrollments: StudentEnrollment[];
}
