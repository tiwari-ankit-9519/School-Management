import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { Class, PaginatedClasses } from "@/types";
import {
  AssignTeacherToSubjectFormValues,
  ClassFormValues,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const classApi = {
  createClass: async (data: ClassFormValues): Promise<Class> => {
    const response = await api.post<ApiResponse<Class>>(
      `/school/class/create`,
      data,
    );
    return response.data.data;
  },

  getAllClasses: async (
    filters: {
      academicYearId: string;
      name?: string;
      section?: string;
      capacityMin?: number;
      capacityMax?: number;
      roomNumber?: string;
      teacherId?: string;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedClasses> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      academicYearId: filters.academicYearId,
    });
    if (filters.name) params.set("name", filters.name);
    if (filters.section) params.set("section", filters.section);
    if (filters.roomNumber) params.set("roomNumber", filters.roomNumber);
    if (filters.teacherId) params.set("teacherId", filters.teacherId);
    if (filters.capacityMin !== undefined)
      params.set("capacityMin", String(filters.capacityMin));
    if (filters.capacityMax !== undefined)
      params.set("capacityMax", String(filters.capacityMax));
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PaginatedClasses;
    }>(`/school/class/all?${params.toString()}`);
    return response.data.data;
  },

  getSingleClass: async (classId: string): Promise<Class> => {
    const response = await api.get<ApiResponse<Class>>(
      `/school/class/${classId}`,
    );
    return response.data.data;
  },

  assignClassTeacher: async (data: AssignTeacherToSubjectFormValues) => {
    const response = await api.post<Promise<null>>(
      `/school/class/assign-class-teacher`,
      data,
    );
    return response.data;
  },
};

export const useCreateClass = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassFormValues) => classApi.createClass(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CLASSES,
      });
      toast.success("Class created successfully");
      router.push(`/admin/classes/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetAllClasses = (
  filters: {
    academicYearId: string;
    name?: string;
    section?: string;
    capacityMin?: number;
    capacityMax?: number;
    roomNumber?: string;
    teacherId?: string;
  },
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.CLASSES,
      filters.academicYearId,
      filters.name ?? "",
      filters.section ?? "",
      filters.capacityMin ?? "",
      filters.capacityMax ?? "",
      filters.roomNumber ?? "",
      filters.teacherId ?? "",
      page,
      limit,
    ],
    queryFn: () => classApi.getAllClasses(filters, page, limit),
    enabled: !!filters.academicYearId,
  });
};

export const useAssignClassTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignTeacherToSubjectFormValues) =>
      classApi.assignClassTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CLASS,
      });
      toast.success("Class Teacher assigned successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetSingleClass = (classId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.CLASS, classId],
    queryFn: () => classApi.getSingleClass(classId),
    enabled: !!classId,
  });
};
