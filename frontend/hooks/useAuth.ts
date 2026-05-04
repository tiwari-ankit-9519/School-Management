import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { QUERY_KEYS } from "@/lib/constants";
import type { User, LoginFormData } from "@/types";

const authApi = {
  login: async (data: LoginFormData) => {
    const response = await api.post<
      ApiResponse<{
        user: User;
        accessToken: string;
      }>
    >("/auth/login", data);
    return response.data.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse<null>>("/auth/logout");
    return response.data.data;
  },
};

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
      toast.success("Welcome Back!");
      if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (data.user.role === "STUDENT") {
        router.push("/student-dashboard");
      } else if (data.user.role === "PARENT") {
        router.push("/parent-dashboard");
      } else {
        router.push("/teacher-dashboard");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
