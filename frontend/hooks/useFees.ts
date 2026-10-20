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
  createFeeStructure: async (
    data: FeesStructureType,
    classGroupId: string,
  ): Promise<ApiResponse<FeeStructure>> => {
    const response = await api.post<ApiResponse<FeeStructure>>(
      `/school/fee/create/${classGroupId}`,
      data,
    );
    return response.data;
  },

  getFeeStructure: async (
    classGroupId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedFeeStructures> => {
    const response = await api.get<ApiResponse<PaginatedFeeStructures>>(
      `/school/fee/${classGroupId}`,
      { params: { page, limit } },
    );
    return response.data.data;
  },

  updateFeeStructure: async (
    data: FeeStructureUpdateType,
    feeId: string,
  ): Promise<ApiResponse<FeeStructure>> => {
    const response = await api.patch<ApiResponse<FeeStructure>>(
      `/school/fee/update/${feeId}`,
      data,
    );
    return response.data;
  },
};

export const useGetFeeStructureForClass = (
  classGroupId: string,
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.FEES, classGroupId, page, limit],
    queryFn: () => feeApi.getFeeStructure(classGroupId, page, limit),
    enabled: !!classGroupId,
  });
};

export const useCreateFeeStructure = (classGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FeesStructureType) =>
      feeApi.createFeeStructure(data, classGroupId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE });
      toast.success(response.message ?? "Fee structure created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateFeeStructure = (feeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FeeStructureUpdateType) =>
      feeApi.updateFeeStructure(data, feeId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE });
      toast.success(response.message ?? "Fee structure updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
