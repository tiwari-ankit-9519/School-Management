import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  AdminProfile,
  ApiResponse,
  MyProfile,
  MyTodaySummary,
  ParentProfile,
  Role,
  StudentProfile,
  TeacherProfile,
  UpdatedProfile,
  UpdateMyProfilePayload,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const profileApi = {
  getMyProfile: async (): Promise<MyProfile> => {
    const response =
      await api.get<ApiResponse<MyProfile>>(`/school/profile/me`);
    return response.data.data;
  },

  getMyToday: async (): Promise<MyTodaySummary> => {
    const response = await api.get<ApiResponse<MyTodaySummary>>(
      `/school/profile/me/today`,
    );
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

  uploadMyPhoto: async (
    file: File,
  ): Promise<ApiResponse<{ photoUrl: string }>> => {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await api.patch<ApiResponse<{ photoUrl: string }>>(
      `/school/profile/me/photo`,
      formData,
    );
    return response.data;
  },

  removeMyPhoto: async (): Promise<ApiResponse<{ photoUrl: null }>> => {
    const response = await api.delete<ApiResponse<{ photoUrl: null }>>(
      `/school/profile/me/photo`,
    );
    return response.data;
  },
};

export const useGetMyProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.MY_PROFILE,
    queryFn: () => profileApi.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetMyProfil = useGetMyProfile;

export const useGetMyToday = () => {
  return useQuery({
    queryKey: QUERY_KEYS.MY_TODAY,
    queryFn: () => profileApi.getMyToday(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMyProfilePayload) =>
      profileApi.updateMyProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_PROFILE });
      toast.success(response.message ?? "Profile updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUploadMyPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadMyPhoto(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_PROFILE });
      toast.success(response.message ?? "Profile photo updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRemoveMyPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => profileApi.removeMyPhoto(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_PROFILE });
      toast.success(response.message ?? "Profile photo removed");
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

export const getProfilePhotoUrl = (
  profile: MyProfile | undefined,
): string | null => {
  if (!profile) return null;
  if (isStudentProfile(profile)) return profile.student?.photoUrl ?? null;
  if (isTeacherProfile(profile)) return profile.teacher?.photoUrl ?? null;
  if (isParentProfile(profile)) return profile.parent?.photoUrl ?? null;
  return profile.admin?.photoUrl ?? null;
};
