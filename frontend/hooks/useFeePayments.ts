import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  ApiResponse,
  CollectStudentFeesPayload,
  CollectStudentFeesResult,
  FeeBillFilters,
  FeeBillSnapshot,
  FeeStudentDetail,
  FeeStudentFilters,
  MyFeesResponse,
  PaginatedFeeBills,
  PaginatedFeeStudents,
  ReverseFeeReceiptPayload,
  ReverseFeeReceiptResult,
  WaiveFeePaymentPayload,
} from "@/types";

const BASE = "/school/fee-payments";

const cleanParams = <T extends object>(filters: T) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "" && value !== false,
    ),
  );

const feePaymentApi = {
  students: async (
    filters: FeeStudentFilters,
  ): Promise<PaginatedFeeStudents> => {
    const response = await api.get<ApiResponse<PaginatedFeeStudents>>(
      `${BASE}/students`,
      {
        params: cleanParams(filters),
      },
    );
    return response.data.data;
  },

  student: async (studentId: string): Promise<FeeStudentDetail> => {
    const response = await api.get<ApiResponse<FeeStudentDetail>>(
      `${BASE}/students/${studentId}`,
    );
    return response.data.data;
  },

  bills: async (filters: FeeBillFilters): Promise<PaginatedFeeBills> => {
    const response = await api.get<ApiResponse<PaginatedFeeBills>>(BASE, {
      params: cleanParams(filters),
    });
    return response.data.data;
  },

  collect: async (
    studentId: string,
    data: CollectStudentFeesPayload,
  ): Promise<ApiResponse<CollectStudentFeesResult>> => {
    const response = await api.post<ApiResponse<CollectStudentFeesResult>>(
      `${BASE}/students/${studentId}/collect`,
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
    receiptId: string,
    data: ReverseFeeReceiptPayload,
  ): Promise<ApiResponse<ReverseFeeReceiptResult>> => {
    const response = await api.patch<ApiResponse<ReverseFeeReceiptResult>>(
      `${BASE}/receipts/${receiptId}/reverse`,
      data,
    );
    return response.data;
  },

  myFees: async (): Promise<MyFeesResponse> => {
    const response = await api.get<ApiResponse<MyFeesResponse>>(`${BASE}/me`);
    return response.data.data;
  },

  receiptPdf: async (receiptId: string, inline: boolean): Promise<Blob> => {
    const response = await api.get<Blob>(`${BASE}/receipts/${receiptId}/pdf`, {
      params: inline ? { inline: "true" } : undefined,
      responseType: "blob",
    });
    return response.data;
  },
};

const useInvalidateFeeData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE_STUDENTS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE_STUDENT });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEE_PAYMENTS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_FEES });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARDSUMMARY });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_TODAY });
  };
};

export const useGetFeeStudents = (filters: FeeStudentFilters, enabled = true) =>
  useQuery({
    queryKey: [...QUERY_KEYS.FEE_STUDENTS, filters],
    queryFn: () => feePaymentApi.students(filters),
    enabled,
    placeholderData: (previous) => previous,
  });

export const useGetFeeStudent = (studentId: string | null) =>
  useQuery({
    queryKey: [...QUERY_KEYS.FEE_STUDENT, studentId],
    queryFn: () => feePaymentApi.student(studentId ?? ""),
    enabled: !!studentId,
  });

export const useGetFeeBills = (filters: FeeBillFilters, enabled = true) =>
  useQuery({
    queryKey: [...QUERY_KEYS.FEE_PAYMENTS, filters],
    queryFn: () => feePaymentApi.bills(filters),
    enabled,
    placeholderData: (previous) => previous,
  });

export const useCollectStudentFees = (studentId: string) => {
  const invalidate = useInvalidateFeeData();
  return useMutation({
    mutationFn: (data: CollectStudentFeesPayload) =>
      feePaymentApi.collect(studentId, data),
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

export const useReverseFeeReceipt = () => {
  const invalidate = useInvalidateFeeData();
  return useMutation({
    mutationFn: ({
      receiptId,
      data,
    }: {
      receiptId: string;
      data: ReverseFeeReceiptPayload;
    }) => feePaymentApi.reverse(receiptId, data),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message ?? "Receipt reversed");
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
      receiptId,
      receiptNumber,
      inline = false,
    }: {
      receiptId: string;
      receiptNumber: string;
      inline?: boolean;
    }) => {
      const blob = await feePaymentApi.receiptPdf(receiptId, inline);
      const url = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      if (inline) {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = receiptFileName(receiptNumber);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
