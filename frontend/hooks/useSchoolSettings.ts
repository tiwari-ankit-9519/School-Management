import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, SchoolConfig } from "@/types";
import { UpdateSchoolSettingsType } from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const schoolSettingsApi = {
  getSchoolSettings: async (): Promise<SchoolConfig> => {
    const response =
      await api.get<ApiResponse<SchoolConfig>>(`/school/settings`);
    return response.data.data;
  },

  updateSchoolSettings: async (
    data: UpdateSchoolSettingsType,
  ): Promise<ApiResponse<SchoolConfig>> => {
    const response = await api.patch<ApiResponse<SchoolConfig>>(
      `/school/settings`,
      data,
    );
    return response.data;
  },

  uploadSchoolLogo: async (file: File): Promise<ApiResponse<SchoolConfig>> => {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await api.patch<ApiResponse<SchoolConfig>>(
      `/school/settings/logo`,
      formData,
    );
    return response.data;
  },

  removeSchoolLogo: async (): Promise<ApiResponse<SchoolConfig>> => {
    const response = await api.delete<ApiResponse<SchoolConfig>>(
      `/school/settings/logo`,
    );
    return response.data;
  },
};

const useSettingsMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<SchoolConfig>>,
  fallbackMessage: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(QUERY_KEYS.SCHOOLSETTINGS, response.data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHOOLSETTINGS });
      toast.success(response.message ?? fallbackMessage);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetSchoolSettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHOOLSETTINGS,
    queryFn: () => schoolSettingsApi.getSchoolSettings(),
  });
};

export const useUpdateSchoolSettings = () =>
  useSettingsMutation(
    ({ data }: { data: UpdateSchoolSettingsType }) =>
      schoolSettingsApi.updateSchoolSettings(data),
    "School settings updated successfully",
  );

export const useUploadSchoolLogo = () =>
  useSettingsMutation(
    (file: File) => schoolSettingsApi.uploadSchoolLogo(file),
    "School logo updated",
  );

export const useRemoveSchoolLogo = () =>
  useSettingsMutation(
    () => schoolSettingsApi.removeSchoolLogo(),
    "School logo removed",
  );
