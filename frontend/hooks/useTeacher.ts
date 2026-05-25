import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  PaginatedTeacherApplications,
  PaginatedTeachers,
  Teacher,
  TeacherApplication,
  TeacherWithDetails,
} from "@/types";
import {
  ResubmitTeacherApplicationFormValues,
  TeacherApplicationFormValues,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const teacherApi = {
  createTeacherApplication: async (
    data: TeacherApplicationFormValues,
    files: File[] = [],
  ): Promise<{ id: string }> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        formData.append("documents", JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => formData.append("files", file));
    const response = await api.post<ApiResponse<{ id: string }>>(
      "/school/user/teacher/apply",
      formData,
    );
    return response.data.data;
  },

  getAllTeacherApplications: async (
    page: number = 1,
    limit: number = 10,
    status: string,
  ): Promise<PaginatedTeacherApplications> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status !== "ALL") params.set("status", status);
    const response = await api.get<ApiResponse<PaginatedTeacherApplications>>(
      `/school/users/teacher/applications?${params.toString()}`,
    );
    return response.data.data;
  },

  getSingleTeacherApplication: async (applicationId: string) => {
    const response = await api.get<ApiResponse<TeacherApplication>>(
      `/school/users/teacher/${applicationId}`,
    );
    return response.data.data;
  },

  shortlistTeacherApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<void>>(
      `/school/users/teacher/${applicationId}/shortlist`,
    );
    return response.data.message;
  },

  approveTeacherApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<TeacherWithDetails>>(
      `/school/users/teacher/${applicationId}/approve`,
    );
    return response.data.message;
  },

  rejectTeacherApplication: async (
    applicationId: string,
    rejectionReason: string,
  ) => {
    const response = await api.patch<ApiResponse<TeacherWithDetails>>(
      `/school/users/teacher/${applicationId}/reject`,
      { rejectionReason },
    );
    return response.data.message;
  },

  resubmitTeacherApplication: async (
    applicationId: string,
    data: ResubmitTeacherApplicationFormValues,
    files: File[] = [],
  ): Promise<{ id: string }> => {
    const formData = new FormData();
    if (data.specialization)
      formData.append("specialization", data.specialization);
    if (data.documents && data.documents.length > 0) {
      formData.append("documentsMetadata", JSON.stringify(data.documents));
    }
    files.forEach((file) => formData.append("documents", file));
    const response = await api.patch<ApiResponse<{ id: string }>>(
      `/school/users/teacher/${applicationId}/resubmit`,
      formData,
    );
    return response.data.data;
  },

  getAllTeachers: async (
    status: string = "ALL",
    gender: string = "",
    city: string = "",
    state: string = "",
    qualification: string = "",
    experience?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedTeachers> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status !== "ALL") params.set("status", status);
    if (gender) params.set("gender", gender);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (qualification) params.set("qualification", qualification);
    if (experience !== undefined && !isNaN(experience))
      params.set("experience", String(experience));

    const response = await api.get<ApiResponse<PaginatedTeachers>>(
      `/school/teacher/all-teachers?${params.toString()}`,
    );

    return response.data.data;
  },

  getSingleTeacher: async (teacherId: string) => {
    const response = await api.get<ApiResponse<Teacher>>(
      `/school/teacher/${teacherId}`,
    );
    return response.data.data;
  },
};

export const useCreateTeacherApplication = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
      files,
    }: {
      formData: TeacherApplicationFormValues;
      files: File[];
    }) => teacherApi.createTeacherApplication(formData, files),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TEACHER_APPLICATIONS,
      });
      toast.success("Teacher Application submitted successfully");
      router.push(`/teacher/application/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllTeacherApplications = (
  page: number = 1,
  limit: number = 10,
  status: string = "ALL",
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.TEACHER_APPLICATIONS, page, limit, status],
    queryFn: () => teacherApi.getAllTeacherApplications(page, limit, status),
  });
};

export const useGetSingleTeacherApplication = (applicationId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.TEACHER_APPLICATION, applicationId],
    queryFn: () => teacherApi.getSingleTeacherApplication(applicationId),
    enabled: !!applicationId,
  });
};

export const useShortlistTeacherApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      teacherApi.shortlistTeacherApplication(applicationId),
    onSuccess: (message, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TEACHER_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.TEACHER_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application shortlisted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useApproveTeacherApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      teacherApi.approveTeacherApplication(applicationId),
    onSuccess: (message, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TEACHER_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.TEACHER_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application approved successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRejectTeacherApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      rejectionReason,
    }: {
      applicationId: string;
      rejectionReason: string;
    }) => teacherApi.rejectTeacherApplication(applicationId, rejectionReason),
    onSuccess: (message, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TEACHER_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.TEACHER_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application rejected successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResubmitTeacherApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
      files,
    }: {
      applicationId: string;
      data: ResubmitTeacherApplicationFormValues;
      files: File[];
    }) => teacherApi.resubmitTeacherApplication(applicationId, data, files),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TEACHER_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.TEACHER_APPLICATION, applicationId],
      });
      toast.success("Application resubmitted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllTeachers = (
  status: string = "ALL",
  gender: string = "",
  city: string = "",
  state: string = "",
  qualification: string = "",
  experience?: number,
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.TEACHERS,
      status,
      gender,
      city,
      state,
      qualification,
      experience,
      page,
      limit,
    ],
    queryFn: () =>
      teacherApi.getAllTeachers(
        status,
        gender,
        city,
        state,
        qualification,
        experience,
        page,
        limit,
      ),
  });
};

export const useGetSingleTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.TEACHER, teacherId],
    queryFn: () => teacherApi.getSingleTeacher(teacherId),
    enabled: !!teacherId,
  });
};
