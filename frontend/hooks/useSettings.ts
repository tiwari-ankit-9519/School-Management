import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { SchoolConfig } from "@/types";
import { UpdateSchoolSettingsType } from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const schoolSettingsApi = {
  getSchoolSettings: async (): Promise<SchoolConfig> => {
    const response = await api.get<SchoolConfig>(`/school/settings`);
    return response.data;
  },
  updateSchoolSettings: async (
    data: UpdateSchoolSettingsType,
  ): Promise<SchoolConfig> => {
    const response = await api.patch<SchoolConfig>(`/school/settings`, data);
    return response.data;
  },
};

export const useUpdateSchoolSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: UpdateSchoolSettingsType }) =>
      schoolSettingsApi.updateSchoolSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHOOLSETTINGS,
      });
      toast.success("School Settings updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetSchoolSettings = () => {
  useQuery({
    queryKey: [QUERY_KEYS.SCHOOLSETTINGS],
    queryFn: () => schoolSettingsApi.getSchoolSettings,
    enabled: true,
  });
};
