import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, PaginatedSubjects, Subject } from "@/types";
import {
  AssignTeacherToSubjectFormValues,
  SubjectFormValues,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const subjectApi = {
  createSubject: async (data: SubjectFormValues): Promise<{ id: string }> => {
    const response = await api.post<ApiResponse<{ id: string }>>(
      `/school/subject/create`,
      data,
    );
    return response.data.data;
  },
  getAllSubjects: async (
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<PaginatedSubjects> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (isActive !== undefined) params.set("isActive", String(isActive));
    const response = await api.get<ApiResponse<PaginatedSubjects>>(
      `/school/subject/all-subjects?${params.toString()}`,
    );
    return response.data.data;
  },
  getSingleSubject: async (subjectId: string) => {
    const response = await api.get<ApiResponse<Subject>>(
      `/school/subject/${subjectId}`,
    );
    return response.data.data;
  },
  assignTeacherToSubject: async (
    subjectId: string,
    data: AssignTeacherToSubjectFormValues,
  ) => {
    const response = await api.post<ApiResponse<null>>(
      `/school/subject/${subjectId}/assign-teacher`,
      data,
    );
    return response.data.message;
  },
  unassignTeacherFromSubject: async (subjectId: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/school/subject/${subjectId}/aunssign-teacher`,
    );
    return response.data.message;
  },
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubjectFormValues) => subjectApi.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SUBJECTS,
      });
      toast.success("Subject created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllSubjects = (
  page: number = 1,
  limit: number = 10,
  isActive?: boolean,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.SUBJECTS, page, limit, isActive],
    queryFn: () => subjectApi.getAllSubjects(page, limit, isActive),
    enabled: true,
  });
};

export const useGetSingleSubject = (subjectId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.SUBJECT, subjectId],
    queryFn: () => subjectApi.getSingleSubject(subjectId),
    enabled: !!subjectId,
  });
};

export const useAssignTeacherToSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subjectId,
      data,
    }: {
      subjectId: string;
      data: AssignTeacherToSubjectFormValues;
    }) => subjectApi.assignTeacherToSubject(subjectId, data),
    onSuccess: (message, { subjectId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SUBJECTS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SUBJECT, subjectId],
      });
      toast.success(message ?? "Subject assigned to teacher successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUnassignTeacherFromSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) =>
      subjectApi.unassignTeacherFromSubject(subjectId),
    onSuccess: (message, subjectId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SUBJECTS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SUBJECT, subjectId],
      });
      toast.success(message ?? "Subject unassigned for teacher");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
