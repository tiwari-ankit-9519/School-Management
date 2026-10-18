import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  AdminProfile,
  ApiResponse,
  MyProfile,
  ParentProfile,
  Role,
  StudentProfile,
  TeacherProfile,
  UpdatedProfile,
  UpdateMyProfilePayload,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const profilApi = {
  getMyProfile: async (): Promise<MyProfile> => {
    const response =
      await api.get<ApiResponse<MyProfile>>(`/school/profile/me`);
    return response.data.data;
  },

  updateMyProfile: async (
    data: UpdateMyProfilePayload,
  ): Promise<ApiResponse<UpdatedProfile>> => {
    const response = await api.patch<ApiResponse<UpdatedProfile>>(
      `/school/profile/me`,
      data,
    );
    return response.data;
  },
};

export const useGetMyProfil = () => {
  return useQuery({
    queryKey: QUERY_KEYS.MY_PROFILE,
    queryFn: () => profilApi.getMyProfile(),
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMyProfilePayload) =>
      profilApi.updateMyProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MY_PROFILE,
      });
      toast.success(response.message ?? "Profile updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const isStudentProfile = (
  profile: MyProfile | undefined,
): profile is StudentProfile => profile?.role === Role.STUDENT;

export const isTeacherProfile = (
  profile: MyProfile | undefined,
): profile is TeacherProfile => profile?.role === Role.TEACHER;

export const isParentProfile = (
  profile: MyProfile | undefined,
): profile is ParentProfile => profile?.role === Role.PARENT;

export const isModeratorProfile = (
  profile: MyProfile | undefined,
): profile is AdminProfile =>
  profile?.role === Role.ADMIN || profile?.role === Role.MODERATOR;
