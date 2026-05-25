import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  AdmissionApplication,
  AdmissionClass,
  PaginatedAdmissionApplications,
} from "@/types";
import {
  AdmissionApplicationFormValues,
  ResubmitAdmissionApplicationFormValues,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const admissionApi = {
  submitAdmissionApplication: async (
    data: AdmissionApplicationFormValues,
    photoFile?: File,
    guardianPhotoFile?: File,
    files: File[] = [],
  ): Promise<AdmissionApplication> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        formData.append("documentsMetadata", JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    if (photoFile) formData.append("photoUrl", photoFile);
    if (guardianPhotoFile) formData.append("guardianPhoto", guardianPhotoFile);
    files.forEach((file) => formData.append("documents", file));
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
    const response = await api.get<ApiResponse<AdmissionApplication>>(
      `/school/admission/${applicationId}`,
    );
    return response.data.data;
  },

  getAdmissionClasses: async (name: string): Promise<AdmissionClass[]> => {
    const params = new URLSearchParams({ name });
    const response = await api.get<ApiResponse<AdmissionClass[]>>(
      `/school/admission/class-name?${params.toString()}`,
    );
    return response.data.data;
  },

  approveAdmissionApplication: async (
    applicationId: string,
    classId: string,
  ) => {
    const response = await api.patch<ApiResponse<{ id: string }>>(
      `/school/admission/${applicationId}/approve`,
      { classId },
    );
    return response.data.message;
  },

  rejectAdmissionApplication: async (
    applicationId: string,
    rejectionReason: string,
  ) => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/reject`,
      { rejectionReason },
    );
    return response.data.message;
  },

  waitlistAdmissionApplication: async (
    applicationId: string,
    waitlistReason: string,
  ) => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/waitlist`,
      { waitlistReason },
    );
    return response.data.message;
  },

  resubmitAdmissionApplication: async (
    applicationId: string,
    data: ResubmitAdmissionApplicationFormValues,
    files: File[] = [],
  ): Promise<string | undefined> => {
    const formData = new FormData();
    if (data.previousSchool)
      formData.append("previousSchool", data.previousSchool);
    if (data.previousClass)
      formData.append("previousClass", data.previousClass);
    if (data.guardianEmail)
      formData.append("guardianEmail", data.guardianEmail);
    if (data.documents && data.documents.length > 0) {
      formData.append("documentsMetadata", JSON.stringify(data.documents));
    }
    files.forEach((file) => formData.append("documents", file));
    const response = await api.patch<ApiResponse<{ id: string }>>(
      `/school/admission/${applicationId}/resubmit`,
      formData,
    );
    return response.data.message;
  },

  confirmSlotOffer: async (
    applicationId: string,
  ): Promise<string | undefined> => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/confirm-slot`,
    );
    return response.data.message;
  },

  declineSlotOffer: async (
    applicationId: string,
  ): Promise<string | undefined> => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/${applicationId}/decline-slot`,
    );
    return response.data.message;
  },

  withdrawStudent: async (
    enrollmentId: string,
    withdrawalReason: string,
  ): Promise<string | undefined> => {
    const response = await api.patch<ApiResponse<null>>(
      `/school/admission/withdraw/${enrollmentId}`,
      { withdrawalReason },
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
      formData: AdmissionApplicationFormValues;
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

export const useGetAdmissionClasses = (name: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMISSION_CLASSES, name],
    queryFn: () => admissionApi.getAdmissionClasses(name),
    enabled: !!name,
  });
};

export const useApproveAdmissionApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      classId,
    }: {
      applicationId: string;
      classId: string;
    }) => admissionApi.approveAdmissionApplication(applicationId, classId),
    onSuccess: (message, { applicationId }) => {
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
    mutationFn: ({
      applicationId,
      rejectionReason,
    }: {
      applicationId: string;
      rejectionReason: string;
    }) =>
      admissionApi.rejectAdmissionApplication(applicationId, rejectionReason),
    onSuccess: (message, { applicationId }) => {
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
    mutationFn: ({
      applicationId,
      waitlistReason,
    }: {
      applicationId: string;
      waitlistReason: string;
    }) =>
      admissionApi.waitlistAdmissionApplication(applicationId, waitlistReason),
    onSuccess: (message, { applicationId }) => {
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
      files,
    }: {
      applicationId: string;
      data: ResubmitAdmissionApplicationFormValues;
      files: File[];
    }) => admissionApi.resubmitAdmissionApplication(applicationId, data, files),
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

export const useConfirmSlotOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      admissionApi.confirmSlotOffer(applicationId),
    onSuccess: (message, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message ?? "Slot offer confirmed successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeclineSlotOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      admissionApi.declineSlotOffer(applicationId),
    onSuccess: (message, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.SCHOOL_APPLICATION, applicationId],
      });
      toast.success(message ?? "Slot offer declined successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useWithdrawStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      withdrawalReason,
    }: {
      enrollmentId: string;
      withdrawalReason: string;
    }) => admissionApi.withdrawStudent(enrollmentId, withdrawalReason),
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOL_APPLICATIONS,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.STUDENTS,
      });
      toast.success(message ?? "Student withdrawn successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
