import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, PaginatedAdmins, SingleAdminInfo } from "@/types";
import { CreateModeratorFormValues } from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const moderatorApi = {
  createModerator: async (
    data: CreateModeratorFormValues,
  ): Promise<{ id: string }> => {
    const payload = {
      ...data,
      dateOfBirth:
        data.dateOfBirth instanceof Date
          ? data.dateOfBirth.toISOString().split("T")[0]
          : data.dateOfBirth,
      isTeacher: data.isTeacher ?? false,
      ...(!data.isTeacher && {
        address: undefined,
        city: undefined,
        state: undefined,
        pincode: undefined,
        qualification: undefined,
        experience: undefined,
        specialization: undefined,
        joiningDate: undefined,
      }),
    };

    const response = await api.post<ApiResponse<{ id: string }>>(
      `/school/users/moderator/create`,
      payload,
    );
    return response.data.data;
  },
  getAllAdmins: async (
    page: number = 1,
    limit: number = 10,
    gender: string,
  ): Promise<PaginatedAdmins> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (gender !== "ALL") params.set("gender", gender);
    const response = await api.get<ApiResponse<PaginatedAdmins>>(
      `/school/users/all-admins?${params.toString()}`,
    );
    return response.data.data;
  },
  getSingleAdmin: async (adminId: string) => {
    const response = await api.get<ApiResponse<SingleAdminInfo>>(
      `/school/users/${adminId}`,
    );
    return response.data.data;
  },
};

export const useCreateModerator = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData }: { formData: CreateModeratorFormValues }) =>
      moderatorApi.createModerator(formData), // ✅ no photoUrl
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMINS });
      toast.success("Moderator created successfully");
      router.push(`/admin/moderator-detail/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllAdmins = (
  page: number = 1,
  limit: number = 10,
  gender: string = "ALL",
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMINS, page, limit, gender],
    queryFn: () => moderatorApi.getAllAdmins(page, limit, gender),
    enabled: !!true,
  });
};

export const useGetSingleAdmin = (adminId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN, adminId],
    queryFn: () => moderatorApi.getSingleAdmin(adminId),
    enabled: !!adminId,
  });
};
