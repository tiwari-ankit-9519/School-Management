import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { ApiResponse, FeeStructure, PaginatedFeeStructures } from "@/types";
import {
  FeesStructureType,
  FeeStructureUpdateType,
} from "@/validations/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const feeApi = {
  createFeeStructure: async (data: FeesStructureType, classId: string) => {
    const response = await api.post<ApiResponse<FeeStructure>>(
      `/school/fee/create/${classId}`,
      data,
    );
    return response.data.data;
  },

  getFeeStructure: async (
    classGroupId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedFeeStructures> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const response = await api.get<ApiResponse<PaginatedFeeStructures>>(
      `/school/fee/${classGroupId}?${params.toString()}`,
    );
    return response.data.data;
  },

  updateFeeStructure: async (data: FeeStructureUpdateType, feeId: string) => {
    const response = await api.patch<ApiResponse<FeeStructure>>(
      `/school/fee/update/${feeId}`,
      data,
    );
    return response.data.data;
  },
};

export const useCreateFeeStructure = (classId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FeesStructureType) =>
      feeApi.createFeeStructure(data, classId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FEES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FEE,
      });
      toast.success("Fee Structure created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetFeeStructureForClass = (
  classGroupId: string,
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.FEES, classGroupId],
    queryFn: () => feeApi.getFeeStructure(classGroupId, page, limit),
    enabled: !!classGroupId,
  });
};

export const useUpdateFeeStructure = (feeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FeeStructureUpdateType) =>
      feeApi.updateFeeStructure(data, feeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FEES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FEE,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
