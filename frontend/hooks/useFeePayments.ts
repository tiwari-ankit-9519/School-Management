import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  CollectFeePaymentPayload,
  FeeBillDetail,
  FeeBillFilters,
  FeeBillSnapshot,
  FeeTransactionResult,
  MyFeesResponse,
  PaginatedFeeBills,
  ReverseFeeTransactionPayload,
  WaiveFeePaymentPayload,
} from "@/types";

const BASE = "/school/fee-payments";

const cleanParams = (filters: FeeBillFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "" && value !== false,
    ),
  );

const feePaymentApi = {
  list: async (filters: FeeBillFilters): Promise<PaginatedFeeBills> => {
    const response = await api.get<ApiResponse<PaginatedFeeBills>>(BASE, {
      params: cleanParams(filters),
    });
    return response.data.data;
  },

  detail: async (billId: string): Promise<FeeBillDetail> => {
    const response = await api.get<ApiResponse<FeeBillDetail>>(
      `${BASE}/${billId}`,
    );
    return response.data.data;
  },

  collect: async (
    billId: string,
    data: CollectFeePaymentPayload,
  ): Promise<ApiResponse<FeeTransactionResult>> => {
    const response = await api.post<ApiResponse<FeeTransactionResult>>(
      `${BASE}/${billId}/collect`,
      data,
    );
    return response.data;
  },

  waive: async (
    billId: string,
    data: WaiveFeePaymentPayload,
  ): Promise<ApiResponse<FeeBillSnapshot>> => {
    const response = await api.patch<ApiResponse<FeeBillSnapshot>>(
      `${BASE}/${billId}/waive`,
      data,
    );
    return response.data;
  },

  reverse: async (
    transactionId: string,
    data: ReverseFeeTransactionPayload,
  ): Promise<ApiResponse<FeeTransactionResult>> => {
    const response = await api.patch<ApiResponse<FeeTransactionResult>>(
      `${BASE}/transactions/${transactionId}/reverse`,
      data,
    );
    return response.data;
  },

  myFees: async (): Promise<MyFeesResponse> => {
    const response = await api.get<ApiResponse<MyFeesResponse>>(`${BASE}/me`);
    return response.data.data;
  },

  receipt: async (transactionId: string, inline: boolean): Promise<Blob> => {
    const response = await api.get<Blob>(
      `${BASE}/transactions/${transactionId}/receipt`,
      {
        params: inline ? { inline: "true" } : undefined,
        responseType: "blob",
      },
    );
    return response.data;
  },
};

const useInvalidateFeeData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE_PAYMENTS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE_PAYMENT });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_FEES });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_TODAY });
  };
};

export const useGetFeeBills = (filters: FeeBillFilters, enabled = true) =>
  useQuery({
    queryKey: [...QUERY_KEYS.FEE_PAYMENTS, filters],
    queryFn: () => feePaymentApi.list(filters),
    enabled,
    placeholderData: (previous) => previous,
  });

export const useGetFeeBill = (billId: string | null) =>
  useQuery({
    queryKey: [...QUERY_KEYS.FEE_PAYMENT, billId],
    queryFn: () => feePaymentApi.detail(billId ?? ""),
    enabled: !!billId,
  });

export const useCollectFeePayment = (billId: string) => {
  const invalidate = useInvalidateFeeData();
  return useMutation({
    mutationFn: (data: CollectFeePaymentPayload) =>
      feePaymentApi.collect(billId, data),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Payment recorded");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useWaiveFeePayment = (billId: string) => {
  const invalidate = useInvalidateFeeData();
  return useMutation({
    mutationFn: (data: WaiveFeePaymentPayload) =>
      feePaymentApi.waive(billId, data),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Fee waived");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useReverseFeeTransaction = () => {
  const invalidate = useInvalidateFeeData();
  return useMutation({
    mutationFn: ({
      transactionId,
      data,
    }: {
      transactionId: string;
      data: ReverseFeeTransactionPayload;
    }) => feePaymentApi.reverse(transactionId, data),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Payment reversed");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useGetMyFees = () =>
  useQuery({
    queryKey: QUERY_KEYS.MY_FEES,
    queryFn: () => feePaymentApi.myFees(),
  });

export const receiptFileName = (receiptNumber: string) =>
  `Receipt-${receiptNumber.replace(/\//g, "-")}.pdf`;

export const useDownloadReceipt = () =>
  useMutation({
    mutationFn: async ({
      transactionId,
      receiptNumber,
      inline = false,
    }: {
      transactionId: string;
      receiptNumber: string;
      inline?: boolean;
    }) => {
      const blob = await feePaymentApi.receipt(transactionId, inline);
      const url = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      if (inline) {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = receiptFileName(receiptNumber);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
