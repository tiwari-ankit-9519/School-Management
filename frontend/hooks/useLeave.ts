import api from "@/lib/api";
import { ApiResponse, LeaveRequest } from "@/types";
import { CreateLeaveRequestFormValues } from "@/validations/validations";
import { useSearchParams } from "next/navigation";

const leaveApi = {
  createStudentLeave: async (
    data: CreateLeaveRequestFormValues,
  ): Promise<LeaveRequest> => {
    const response = await api.post<ApiResponse<LeaveRequest>>(
      `/school/leave/student`,
      data,
    );
    return response.data.data;
  },

  createTeacherLeave: async (
    data: CreateLeaveRequestFormValues,
  ): Promise<LeaveRequest> => {
    const response = await api.post<ApiResponse<LeaveRequest>>(
      `/school/leave/teacher`,
      data,
    );
    return response.data.data;
  },

  createModLeave: async (
    data: CreateLeaveRequestFormValues,
  ): Promise<LeaveRequest> => {
    const response = await api.post<ApiResponse<LeaveRequest>>(
      `/school/leave/mod`,
      data,
    );
    return response.data.data;
  },

  getStudentLeave: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    studentId?: string,
  ): Promise<LeaveRequest> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    if (studentId) params.set("studentId", studentId);
    const response = await api.get<ApiResponse<LeaveRequest>>(
      `/school/leave/student?${params.toString()}`,
    );
    return response.data.data;
  },

  getTeacherLeave: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    teacherId?: string,
  ): Promise<LeaveRequest> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    if (teacherId) params.set("teacherId", teacherId);
    const response = await api.get<ApiResponse<LeaveRequest>>(
      `/school/leave/student?${params.toString()}`,
    );
    return response.data.data;
  },
};
