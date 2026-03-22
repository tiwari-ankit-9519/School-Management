export interface User {
  id: string;
  schoolId: string;
  regNumber: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STUDENT" | "TEACHER" | "PARENT";
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

export interface SchoolApplicationInput {
  schoolName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  establishedYear: number;
  affiliationNumber?: string;
  boardType: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminGender: Gender;
  documents?: { documentType: DocumentType; title: string }[];
}

export interface SchoolApplication {
  id: string;
  schoolName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string | null;
  establishedYear: number;
  affiliationNumber?: string | null;
  boardType: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminGender: "MALE" | "FEMALE" | "OTHER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  notes: string | null;
  moreInfoFields: string[];
  createdAt: string;
  updatedAt: string;
  documents?: ApplicationDocument[];
}

export interface PaginatedApplications {
  data: SchoolApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResubmitSchoolApplication {
  website?: string;
  affiliationNumber?: string;
  phone?: string;
  address?: string;
  pincode?: string;
  adminPhone?: string;
  documents?: File[];
  schoolName?: string;
  city?: string;
  state?: string;
  country?: string;
  moreInfoFields: string[];
}

export interface SchoolApplicationStatus {
  status: "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";
}

export interface School {
  id: string;
  name: string;
  code: string;
  addres: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string | null;
  logoUrl: string | null;
  establishedYear: string;
  affiliationNumber: string | null;
  boardType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
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

export type SchoolApplicationStatusValue = SchoolApplicationStatus["status"];
