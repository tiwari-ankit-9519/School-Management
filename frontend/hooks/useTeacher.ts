import api, { ApiResponse } from "@/lib/api";
import {
  CreateTeacherApplicationInput,
  PaginatedAllTeachersApplication,
  PaginatedTeachers,
  Teacher,
  TeacherApplication,
} from "@/types";

const teacherApi = {
  createTeacherApplication: async (
    data: CreateTeacherApplicationInput,
    files: File[] = [],
  ): Promise<TeacherApplication> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "documents" && Array.isArray(value)) {
        formData.append("documents", JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => formData.append("files", file));
    const response = await api.post<ApiResponse<TeacherApplication>>(
      "/school/user/teacher/apply",
      formData,
    );
    return response.data.data;
  },

  getAllTeacherApplications: async (
    page: number = 1,
    limit: number = 10,
    status: string,
  ): Promise<PaginatedAllTeachersApplication> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status !== "ALL") params.set("status", status);
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedAllTeachersApplication;
    }>(`/school/users/teacher/applications?${params.toString()}`);
    return response.data.data;
  },

  getSingleTeacherApplication: async (applicationId: string) => {
    const response = await api.get<ApiResponse<TeacherApplication>>(
      `/school/users/teacher/${applicationId}`,
    );
    return response.data.data;
  },

  shortlistTeacherApplication: async () => {},

  getAllTeachers: async (
    status: string = "ALL",
    gender: string = "",
    city: string = "",
    state: string = "",
    qualification: string = "",
    experience?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedTeachers> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status !== "ALL") params.set("status", status);
    if (gender) params.set("gender", gender);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (qualification) params.set("qualification", qualification);
    if (experience !== undefined && !isNaN(experience))
      params.set("experience", String(experience));

    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedTeachers;
    }>(`/school/teachers/all-teachers?${params.toString()}`);

    return response.data.data;
  },

  getSingleTeacher: async (teacherId: string) => {
    const response = await api.get<ApiResponse<Teacher>>(
      `/school/teacher/${teacherId}`,
    );
    return response.data.data;
  },
};
