import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, DashboardSummary } from "@/types";
import { useQuery } from "@tanstack/react-query";

const dashboardApi = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response =
      await api.get<ApiResponse<DashboardSummary>>(`/school/summary`);
    return response.data.data;
  },
};

export const useGetDashboardSummary = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARDSUMMARY],
    queryFn: () => dashboardApi.getDashboardSummary(),
  });
};
