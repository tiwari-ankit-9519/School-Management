import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  ModuleKey,
  MyPermissions,
  PermissionAction,
} from "@/types";

const fetchMyPermissions = async (): Promise<MyPermissions> => {
  const response = await api.get<ApiResponse<MyPermissions>>(
    "/school/profile/me/permissions",
  );
  return response.data.data;
};

export const useGetMyPermissions = () =>
  useQuery({
    queryKey: QUERY_KEYS.MY_PERMISSIONS,
    queryFn: fetchMyPermissions,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const usePermissions = () => {
  const { data, isLoading, isError } = useGetMyPermissions();

  const can = useCallback(
    (module: ModuleKey, action: PermissionAction = "canRead"): boolean => {
      if (!data) return false;
      if (data.isAdmin) return true;
      return data.permissions[module]?.[action] ?? false;
    },
    [data],
  );

  return {
    can,
    isAdmin: data?.isAdmin ?? false,
    role: data?.role,
    isLoading,
    isError,
  };
};
