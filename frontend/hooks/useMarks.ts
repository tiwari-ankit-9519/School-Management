import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiMessageResponse,
  ApiResponse,
  Mark,
  PaginatedResponse,
} from "@/types";
import {
  MarksFormValues,
  UpdateMarkFormValues,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface MarksFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  examScheduleId?: string;
  grade?: string;
  isAbsent?: boolean;
}

export type StudentMarksFilter = Omit<MarksFilters, "studentId">;

export type PaginatedMarkRecords = PaginatedResponse<
  Omit<Mark, "student" | "examSchedule" | "subject">
>;

const buildMarksParams = (filters: MarksFilters = {}) => {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 10),
  });

  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.examScheduleId)
    params.set("examScheduleId", filters.examScheduleId);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.isAbsent !== undefined)
    params.set("isAbsent", String(filters.isAbsent));
  return params.toString();
};

const marksApi = {
  gradeExam: async (
    subjectId: string,
    data: MarksFormValues,
  ): Promise<string | undefined> => {
    const response = await api.post<ApiMessageResponse>(
      `/school/marks/${subjectId}/grade`,
      data,
    );
    return response.data.message;
  },

  updateMarks: async (
    markId: string,
    data: UpdateMarkFormValues,
  ): Promise<string | undefined> => {
    const response = await api.patch<ApiMessageResponse>(
      `/school/marks/${markId}`,
      data,
    );
    return response.data.message;
  },
  getMarksForAdmin: async (
    subjectId: string,
    filters: MarksFilters,
  ): Promise<PaginatedMarkRecords> => {
    const response = await api.get<ApiResponse<PaginatedMarkRecords>>(
      `/school/marks/admin/${subjectId}?${buildMarksParams(filters)}`,
    );
    return response.data.data;
  },

  getMarksForTeacher: async (
    subjectId: string,
    filters: MarksFilters,
  ): Promise<PaginatedMarkRecords> => {
    const response = await api.get<ApiResponse<PaginatedMarkRecords>>(
      `/school/marks/teacher/${subjectId}?${buildMarksParams(filters)}`,
    );
    return response.data.data;
  },
  getMarksForStudent: async (
    subjectId: string,
    filters: MarksFilters,
  ): Promise<PaginatedMarkRecords> => {
    const response = await api.get<ApiResponse<PaginatedMarkRecords>>(
      `/school/marks/student/${subjectId}/${buildMarksParams(filters)}`,
    );
    return response.data.data;
  },
};

export const useGetMarksForAdmin = (
  subjectId: string,
  filters: MarksFilters = {},
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.MARKS, "admin", subjectId, filters],
    queryFn: () => marksApi.getMarksForAdmin(subjectId, filters),
    enabled: !!subjectId,
  });
};

export const useGetMarksForTeacher = (
  subjectId: string,
  filters: MarksFilters = {},
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.MARKS, "teacher", subjectId, filters],
    queryFn: () => marksApi.getMarksForTeacher(subjectId, filters),
    enabled: !!subjectId,
  });
};

export const useGetMarksForStudent = (
  subjectId: string,
  filters: MarksFilters = {},
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.MARKS, "student", subjectId, filters],
    queryFn: () => marksApi.getMarksForStudent(subjectId, filters),
    enabled: !!subjectId,
  });
};

export const useGradeMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subjectId,
      data,
    }: {
      subjectId: string;
      data: MarksFormValues;
    }) => marksApi.gradeExam(subjectId, data),
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MARKS,
      });
      toast.success(message ?? "Exam graded successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      markId,
      data,
    }: {
      markId: string;
      data: UpdateMarkFormValues;
    }) => marksApi.updateMarks(markId, data),
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MARKS,
      });
      toast.success(message ?? "Mark updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
