import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  AdmissionApplication,
  AdmissionApplicationInput,
  PaginatedAdmissionApplications,
  ResubmitAdmissionApplicationInput,
  StudentWithDetails,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      if (value === undefined || value === null) return; // skip both
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
      "/",
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
    }>(`/all?${params.toString()}`);
    return response.data.data;
  },

  getAdmissionApplication: async (applicationId: string) => {
    const response = await api.get<ApiResponse<AdmissionApplicationInput>>(
      `${applicationId}`,
    );
    return response.data.data;
  },

  approveAdmissionApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<StudentWithDetails>>(
      `/${applicationId}/approve`,
    );
    return response.data.message;
  },

  rejectAdmissionApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<null>>(
      `/${applicationId}/rejcet`,
    );
    return response.data.message;
  },

  waitlistAdmissionApplication: async (applicationId: string) => {
    const response = await api.patch<ApiResponse<null>>(
      `/${applicationId}/waitlist`,
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
      `/${applicationId}/resubmit`,
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
