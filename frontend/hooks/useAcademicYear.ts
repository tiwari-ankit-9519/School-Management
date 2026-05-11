import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { PaginatedAcademicYears } from "@/types";
import { AcademicYearFormValues } from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const academicYearApi = {
  createNewAcademicYear: async (
    data: AcademicYearFormValues,
  ): Promise<{ id: string }> => {
    const payload = {
      ...data,
      startDate: data.startDate.toString(),
      endDate: data.endDate.toString(),
    };
    const response = await api.post<ApiResponse<{ id: string }>>(
      "/school/academic-year/create",
      payload,
    );
    return response.data.data;
  },

  getAllAcademicYears: async (
    isCurrent?: boolean,
    name?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedAcademicYears> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (isCurrent !== undefined) params.set("isCurrent", String(isCurrent));
    if (name) params.set("name", name);
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedAcademicYears;
    }>(`/school/academic-year/all?${params.toString()}`);
    return response.data.data;
  },
};

export const useCreateAcademicYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AcademicYearFormValues) =>
      academicYearApi.createNewAcademicYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ACADEMIC_YEARS,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ACADEMIC_YEAR,
      });
      toast.success("Academic year created successfully");
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
