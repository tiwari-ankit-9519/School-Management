import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  AdmissionApplication,
  AdmissionApplicationInput,
  PaginatedAdmissionApplications,
  ResubmitAdmissionApplicationInput,
  StudentWithDetails,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const admissionApi = {
  submitAdmissionApplication: async (
    data: AdmissionApplicationInput,
    photoFile?: File,
    guardianPhotoFile?: File,
    files: File[] = [],
  ): Promise<AdmissionApplication> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        formData.append("documents", JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    if (photoFile) formData.append("photoUrl", photoFile);
    if (guardianPhotoFile)
      formData.append("guardianPhotoUrl", guardianPhotoFile);
    files.forEach((file) => formData.append("files", file));
    const response = await api.post<ApiResponse<AdmissionApplication>>(
      "/school/admission/",
      formData,
    );
    return response.data.data;
  },

  getAllAdmissionApplication: async (
    page: number = 1,
    limit: number = 10,
    status: string,
  ): Promise<PaginatedAdmissionApplications> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status !== "ALL") params.set("status", status);
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedAdmissionApplications;
    }>(`/school/admission/all?${params.toString()}`);
    return response.data.data;
  },

  getAdmissionApplication: async (applicationId: string) => {
    const response = await api.get<ApiResponse<AdmissionApplicationInput>>(
      `/school/admission/${applicationId}`,
    );
    return response.data.data;
  },

  approveAdmissionApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<StudentWithDetails>>(
      `/school/admission/${applicationId}/approve`,
    );
    return response.data.message;
  },

  rejectAdmissionApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/rejcet`,
    );
    return response.data.message;
  },

  waitlistAdmissionApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/waitlist`,
    );
    return response.data.message;
  },

  resubmitAdmissionApplication: async (
    applicationId: string,
    data: ResubmitAdmissionApplicationInput,
  ): Promise<string | undefined> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        value.forEach((file: File) => {
          formData.append("documents", file);
        });
      } else {
        formData.append(key, value as string);
      }
    });
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/resubmit`,
      formData,
    );
    return response.data.message;
  },
};

export const useCreateAdmissionApplication = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
      photoFile,
      guardianPhotoFile,
      files,
    }: {
      formData: AdmissionApplicationInput;
      photoFile?: File;
      guardianPhotoFile?: File;
      files: File[];
    }) =>
      admissionApi.submitAdmissionApplication(
        formData,
        photoFile,
        guardianPhotoFile,
        files,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      toast.success("Application submitted successfully");
      router.push(`/student/admission/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllAdmissionApplications = (
  page: number = 1,
  limit: number = 10,
  status: string = "ALL",
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.SCHOOL_APPLICATIONS, page, limit, status],
    queryFn: () => admissionApi.getAllAdmissionApplication(page, limit, status),
  });
};

export const useGetAdmissionApplication = (applicationId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
    queryFn: () => admissionApi.getAdmissionApplication(applicationId),
    enabled: !!applicationId,
  });
};

export const useApproveAdmissionApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      admissionApi.approveAdmissionApplication(applicationId),
    onSuccess: (message, applicationId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application approved successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRejectAdmissionApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      admissionApi.rejectAdmissionApplication(applicationId),
    onSuccess: (message, applicationId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application rejected successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useWaitlistAdmissionApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      admissionApi.waitlistAdmissionApplication(applicationId),
    onSuccess: (message, applicationId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application waitlisted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResubmitAdmissionApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: ResubmitAdmissionApplicationInput;
    }) => admissionApi.resubmitAdmissionApplication(applicationId, data),
    onSuccess: (message, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message ?? "Application resubmitted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
