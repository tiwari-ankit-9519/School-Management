import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  DashboardCalendar,
  DashboardOverview,
  DashboardSummary,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

const dashboardApi = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response =
      await api.get<ApiResponse<DashboardSummary>>(`/school/summary`);
    return response.data.data;
  },

  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get<ApiResponse<DashboardOverview>>(
      `/school/dashboard/overview`,
    );
    return response.data.data;
  },

  getDashboardCalendar: async (month: string): Promise<DashboardCalendar> => {
    const response = await api.get<ApiResponse<DashboardCalendar>>(
      `/school/dashboard/calendar`,
      {
        params: { month },
      },
    );
    return response.data.data;
  },
};

export const useGetDashboardSummary = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARDSUMMARY,
    queryFn: () => dashboardApi.getDashboardSummary(),
  });
};

export const useGetDashboardOverview = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW,
    queryFn: () => dashboardApi.getDashboardOverview(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useGetDashboardCalendar = (month: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD_CALENDAR, month],
    queryFn: () => dashboardApi.getDashboardCalendar(month),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
};
