import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  EnrollmentStatus,
  Gender,
  PaginatedEnrollments,
  StudentWithDetails,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

export const studentApi = {
  getAllStudents: async (
    filters: {
      classId?: string;
      academicYearId?: string;
      status?: EnrollmentStatus;
      gender?: Gender;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedEnrollments> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.academicYearId)
      params.set("academicYearId", filters.academicYearId);
    if (filters.classId) params.set("classId", filters.classId);
    if (filters.status) params.set("status", filters.status);
    if (filters.gender) params.set("gender", filters.gender);
    const response = await api.get<ApiResponse<PaginatedEnrollments>>(
      `/school/students/all?${params.toString()}`,
    );
    return response.data.data;
  },
  getSingleStudent: async (studentId: string): Promise<StudentWithDetails> => {
    const response = await api.get<ApiResponse<StudentWithDetails>>(
      `/school/student/${studentId}`,
    );
    return response.data.data;
  },
};

export const useGetAllStudents = (
  filters: {
    classId?: string;
    academicYearId?: string;
    status?: EnrollmentStatus;
    gender?: Gender;
  },
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.STUDENTS,
      filters.classId,
      filters.academicYearId,
      filters.status,
      filters.gender,
      page,
      limit,
    ],
    queryFn: () => studentApi.getAllStudents(filters, page, limit),
    enabled: true,
  });
};

export const useGetSingleStudent = (studentId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.STUDENT, studentId],
    queryFn: () => studentApi.getSingleStudent(studentId),
    enabled: !!studentId,
  });
};
