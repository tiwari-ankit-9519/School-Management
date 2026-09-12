import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  DayOfWeek,
  PaginatedTimetables,
  Timetable,
} from "@/types";
import {
  CreateTimetableFormValues,
  UpdateTimetableFormValues,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const timetableApi = {
  createTimeTable: async (
    data: CreateTimetableFormValues[],
  ): Promise<Timetable[]> => {
    const response = await api.post<ApiResponse<Timetable[]>>(
      `/school/timetable/create`,
      data,
    );
    return response.data.data;
  },
  getTimeTableForClass: async (
    classId: string,
    page: number = 1,
    limit: number = 10,
    dayOfWeek: DayOfWeek,
  ): Promise<PaginatedTimetables> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (dayOfWeek !== null) params.set("dayOfWeek", dayOfWeek);
    const response = await api.get<{
      success: true;
      message: string;
      data: PaginatedTimetables;
    }>(`/school/timetable/${classId}/time-table`, { params });
    return response.data.data;
  },
  updateTimeTableForClass: async (
    timetableId: string,
    data: UpdateTimetableFormValues,
  ): Promise<Timetable> => {
    const response = await api.patch<ApiResponse<Timetable>>(
      `/school/timetable/${timetableId}/update`,
      data,
    );
    return response.data.data;
  },
  swapTimeTableForClass: async (data: {
    timeTableId1: string;
    timeTableId2: string;
  }): Promise<Timetable[]> => {
    const response = await api.patch<ApiResponse<Timetable[]>>(
      `/school/timetable/swap-class`,
      data,
    );
    return response.data.data;
  },
};

export const useCreateTimeTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: CreateTimetableFormValues[] }) => {
      return timetableApi.createTimeTable(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TIME_TABLES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TIME_TABLE,
      });
      toast.success("Time table created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetTimeTable = (
  classId: string,
  page: number = 1,
  limit: number = 10,
  dayOfWeek: DayOfWeek,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.TIME_TABLES, classId],
    queryFn: () =>
      timetableApi.getTimeTableForClass(classId, page, limit, dayOfWeek),
    enabled: !!classId,
  });
};

export const useUpdateTimeTable = (timetableId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: UpdateTimetableFormValues }) =>
      timetableApi.updateTimeTableForClass(timetableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TIME_TABLES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TIME_TABLE,
      });
      toast.success("Time table updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useSwapTimeTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: { timeTableId1: string; timeTableId2: string };
    }) => timetableApi.swapTimeTableForClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TIME_TABLES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TIME_TABLE,
      });
      toast.success("Time table swapped successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
