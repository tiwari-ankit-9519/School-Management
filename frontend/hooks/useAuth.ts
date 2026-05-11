import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { QUERY_KEYS } from "@/lib/constants";
import type { User } from "@/types";
import { LoginFormValues } from "@/validations/validations";

const authApi = {
  login: async (data: LoginFormValues) => {
    const isEmail = data.identifier.includes("@"); // ✅ transform here
    const payload = {
      email: isEmail ? data.identifier : undefined,
      regNumber: !isEmail ? data.identifier : undefined,
      password: data.password,
    };
    const response = await api.post<
      ApiResponse<{ user: User; accessToken: string }>
    >("/auth/login", payload);
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
      switch (data.user.role) {
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        case "STUDENT":
          router.push("/student/dashboard");
          break;
        case "PARENT":
          router.push("/parent/dashboard");
          break;
        case "TEACHER":
          router.push("/teacher/dashboard");
          break;
        case "MODERATOR":
          router.push("/moderator/dashboard");
          break;
        default:
          router.push("/dashboard");
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
