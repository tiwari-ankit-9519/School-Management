import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  PaginatedApplications,
  ResubmitSchoolApplication,
  School,
  SchoolApplication,
  SchoolApplicationInput,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const schoolApplicationApi = {
  schoolApplicationRegister: async (
    data: SchoolApplicationInput,
    files: File[],
  ): Promise<SchoolApplication> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        formData.append("documents", JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => formData.append("documents", file));
    const response = await api.post<ApiResponse<SchoolApplication>>(
      "/school-application",
      formData,
    );
    return response.data.data;
  },

  viewApplicationStatus: async (id: string) => {
    const response = await api.get<ApiResponse<SchoolApplication>>(
      `/school-application/${id}/status`,
    );
    return response.data.data;
  },

  viewSchoolApplications: async (
    status: string,
    page: number = 1,
  ): Promise<PaginatedApplications> => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedApplications;
    }>(
      `/school-application?status=${status === "ALL" ? "" : status}&page=${page}`,
    );
    return response.data.data;
  },

  viewApplication: async (id: string) => {
    const response = await api.get<ApiResponse<SchoolApplication>>(
      `/school-application/${id}`,
    );
    return response.data.data;
  },

  approveApplication: async (id: string) => {
    const response = await api.patch<ApiResponse<School>>(
      `/school-application/${id}/approve`,
    );
    return response.data.data;
  },

  rejectApplication: async (id: string, rejectionReason: string) => {
    const reponse = await api.patch<ApiResponse<null>>(
      `/school-application/${id}/reject`,
      { rejectionReason },
    );
    return reponse.data.message;
  },

  requestMoreInfo: async (
    id: string,
    moreInfoFields: string[],
    notes: string,
  ) => {
    const response = await api.patch<ApiResponse<null>>(
      `/school-application/${id}/more-info`,
      { moreInfoFields, notes },
    );
    return response.data.message;
  },

  resubmitApplication: async (
    id: string,
    data: ResubmitSchoolApplication,
  ): Promise<string | undefined> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        value.forEach((file: File) => {
          formData.append("documents", file);
        });
      } else if (key === "moreInfoFields" && Array.isArray(value)) {
        formData.append("moreInfoFields", JSON.stringify(value));
      } else {
        formData.append(key, value as string);
      }
    });
    const response = await api.patch<ApiResponse<null>>(
      `/school-application/${id}/resubmit`,
      formData,
    );
    return response.data.message;
  },
};

export const useSchoolApplication = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
      files,
    }: {
      formData: SchoolApplicationInput;
      files: File[];
    }) => schoolApplicationApi.schoolApplicationRegister(formData, files),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      toast.success("Application submitted successfully");
      router.push(`/school-application/${data.id}/status`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUserApplicationStatus = (applicationId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.USER_APPLICATION_STATUS, applicationId],
    queryFn: () => schoolApplicationApi.viewApplicationStatus(applicationId),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!applicationId,
  });
};

export const useViewApplications = (
  status: string = "ALL",
  page: number = 1,
) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery<PaginatedApplications>({
    queryKey: [...QUERY_KEYS.SCHOOL_APPLICATIONS, status, page],
    queryFn: () => schoolApplicationApi.viewSchoolApplications(status, page),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useViewApplication = (applicationId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
    queryFn: () => schoolApplicationApi.viewApplication(applicationId),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!applicationId,
  });
};

export const useApproveApplication = (applicationId: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => schoolApplicationApi.approveApplication(applicationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success("Application approved");
      router.push(`/schools/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRejectApplication = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rejectionReason: string) =>
      schoolApplicationApi.rejectApplication(applicationId, rejectionReason),
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useMoreInfoRequired = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moreInfoFields,
      notes,
    }: {
      moreInfoFields: string[];
      notes: string;
    }) =>
      schoolApplicationApi.requestMoreInfo(
        applicationId,
        moreInfoFields,
        notes,
      ),
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResubmitApplication = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResubmitSchoolApplication) =>
      schoolApplicationApi.resubmitApplication(applicationId, data),
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.USER_APPLICATION_STATUS, applicationId],
      });
      toast.success(message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
