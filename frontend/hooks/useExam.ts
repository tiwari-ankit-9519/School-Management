import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, ExamSchedule, PaginatedExamSchedules } from "@/types";
import { ExamScheduleFormValues } from "@/validations/validations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const examApi = {
  createExam: async (
    data: ExamScheduleFormValues,
    classGroupId: string,
  ): Promise<ExamSchedule> => {
    const response = await api.post<ApiResponse<ExamSchedule>>(
      `/school/exam/${classGroupId}/create`,
    );
    return response.data.data;
  },

  getExamScheduleForAdmin: async (
    classId?: string,
    academicYear?: string,
    examType?: string,
    subjectId?: string,
    teacherId?: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedExamSchedules> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (classId !== undefined) params.set("classId", classId);
    if (academicYear !== undefined) params.set("academicYear", academicYear);
    if (examType !== undefined) params.set("examType", examType);
    if (subjectId !== undefined) params.set("subjectId", subjectId);
    if (teacherId !== undefined) params.set("teacherId", teacherId);
    if (fromDate !== undefined) params.set("fromDate", fromDate);
    if (toDate !== undefined) params.set("toDate", toDate);

    const response =
      await api.get<ApiResponse<PaginatedExamSchedules>>(`/school/exam/admin`);

    return response.data.data;
  },

  getExamScheduleForTeacher: async (
    classId?: string,
    examType?: string,
    subjectId?: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ExamSchedule> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (classId !== undefined) params.set("classId", classId);
    if (examType !== undefined) params.set("examType", examType);
    if (subjectId !== undefined) params.set("subjectId", subjectId);
    if (fromDate !== undefined) params.set("fromDate", fromDate);
    if (toDate !== undefined) params.set("toDate", toDate);
    const response =
      await api.get<ApiResponse<ExamSchedule>>(`/school/exam/teacher`);
    return response.data.data;
  },
  getExamScheduleForStudent: async (
    examType?: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ExamSchedule> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (examType !== undefined) params.set("examType", examType);
    if (fromDate !== undefined) params.set("fromDate", fromDate);
    if (toDate !== undefined) params.set("toDate", toDate);
    const response = await api.get<ApiResponse<ExamSchedule>>(
      "/school/exam/student",
    );
    return response.data.data;
  },
};

export const useCreateExamSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      classGroupId,
    }: {
      data: ExamScheduleFormValues;
      classGroupId: string;
    }) => examApi.createExam(data, classGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.EXAM_SCHEDULES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.EXAM_SCHEDULE,
      });
      toast.success("Exam created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
