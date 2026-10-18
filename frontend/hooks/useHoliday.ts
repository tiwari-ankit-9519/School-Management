import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, Holiday } from "@/types";
import { CreateHolidayFormValues } from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const holidayApi = {
  createHoliday: async (data: CreateHolidayFormValues): Promise<Holiday> => {
    const response = await api.post<ApiResponse<Holiday>>(
      `/school/holiday`,
      data,
    );
    return response.data.data;
  },
  getHoliday: async (): Promise<Holiday> => {
    const response = await api.get<ApiResponse<Holiday>>(`/school/holiday`);
    return response.data.data;
  },
  deleteHoliday: async (holidayId: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/school/holiday/${holidayId}`,
    );
    return response.data.data;
  },
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHolidayFormValues) =>
      holidayApi.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.HOLIDAYS,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.HOLIDAY,
      });
      toast.success("Holiday created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetHoliday = () => {
  return useQuery({
    queryKey: [...QUERY_KEYS.HOLIDAYS],
    queryFn: () => holidayApi.getHoliday,
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (holidayId: string) => holidayApi.deleteHoliday(holidayId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.HOLIDAYS,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
