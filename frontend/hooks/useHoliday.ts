import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  CreateHolidayPayload,
  Holiday,
  HolidayAttendanceConflict,
  HolidayFilters,
  HolidayMutationResult,
  PaginatedResponse,
  UpdateHolidayPayload,
} from "@/types";

const HOLIDAY_BASE = "/school/holiday";
const ATTENDANCE_CONFLICT_CODE = "ATTENDANCE_EXISTS";

interface ConflictResponseBody {
  code?: string;
  message?: string;
  data?: HolidayAttendanceConflict;
}

const cleanParams = (filters: HolidayFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );

export const getHolidayAttendanceConflict = (
  error: unknown,
): HolidayAttendanceConflict | null => {
  if (!isAxiosError<ConflictResponseBody>(error)) return null;
  const body = error.response?.data;
  return error.response?.status === 409 &&
    body?.code === ATTENDANCE_CONFLICT_CODE &&
    body.data
    ? body.data
    : null;
};

const holidayApi = {
  list: async (
    filters: HolidayFilters,
  ): Promise<PaginatedResponse<Holiday>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Holiday>>>(
      HOLIDAY_BASE,
      {
        params: cleanParams(filters),
      },
    );
    return response.data.data;
  },

  create: async (
    data: CreateHolidayPayload,
  ): Promise<ApiResponse<HolidayMutationResult>> => {
    const response = await api.post<ApiResponse<HolidayMutationResult>>(
      HOLIDAY_BASE,
      data,
    );
    return response.data;
  },

  update: async (
    holidayId: string,
    data: UpdateHolidayPayload,
  ): Promise<ApiResponse<HolidayMutationResult>> => {
    const response = await api.patch<ApiResponse<HolidayMutationResult>>(
      `${HOLIDAY_BASE}/${holidayId}`,
      data,
    );
    return response.data;
  },

  remove: async (holidayId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(
      `${HOLIDAY_BASE}/${holidayId}`,
    );
    return response.data;
  },
};

const useInvalidateHolidayData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HOLIDAYS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_CALENDAR });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_TODAY });
  };
};

const toastUnlessConflict = (error: unknown) => {
  if (getHolidayAttendanceConflict(error)) return;
  toast.error(getErrorMessage(error));
};

export const useGetHolidays = (filters: HolidayFilters, enabled = true) =>
  useQuery({
    queryKey: [...QUERY_KEYS.HOLIDAYS, filters],
    queryFn: () => holidayApi.list(filters),
    enabled,
    placeholderData: (previous) => previous,
  });

export const useCreateHoliday = () => {
  const invalidate = useInvalidateHolidayData();
  return useMutation({
    mutationFn: (data: CreateHolidayPayload) => holidayApi.create(data),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Holiday created");
    },
    onError: toastUnlessConflict,
  });
};

export const useUpdateHoliday = (holidayId: string) => {
  const invalidate = useInvalidateHolidayData();
  return useMutation({
    mutationFn: (data: UpdateHolidayPayload) =>
      holidayApi.update(holidayId, data),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Holiday updated");
    },
    onError: toastUnlessConflict,
  });
};

export const useDeleteHoliday = () => {
  const invalidate = useInvalidateHolidayData();
  return useMutation({
    mutationFn: (holidayId: string) => holidayApi.remove(holidayId),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Holiday deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
