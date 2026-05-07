import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  AcademicYear,
  CreateNewAcademicYearInout,
  PaginatedAcademicYear,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const academicYearApi = {
  createNewAcademicYear: async (
    data: CreateNewAcademicYearInout,
  ): Promise<AcademicYear> => {
    const response = await api.post<ApiResponse<AcademicYear>>(
      "/school/academic-year/create",
      data,
    );
    return response.data.data;
  },

  getAllAcademicYears: async (
    isCurrent?: boolean,
    name?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedAcademicYear> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (isCurrent !== undefined) params.set("isCurrent", String(isCurrent));
    if (name) params.set("name", name);
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedAcademicYear;
    }>(`/school/academic-year/all?${params.toString()}`);
    return response.data.data;
  },
};

export const useCreateAcademicYear = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: CreateNewAcademicYearInout) =>
      academicYearApi.createNewAcademicYear(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ACADEMIC_YEARS,
      });
      toast.success("Academic year created successfully");
      router.push(`/admin/academic-year/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllAcademicYears = (
  isCurrent?: boolean,
  name?: string,
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ACADEMIC_YEARS, isCurrent, name, page, limit],
    queryFn: () =>
      academicYearApi.getAllAcademicYears(isCurrent, name, page, limit),
  });
};
