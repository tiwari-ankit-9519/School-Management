import { FeeStatus } from "@prisma/client";

export const OPEN_FEE_STATUSES: FeeStatus[] = [
  FeeStatus.PENDING,
  FeeStatus.PARTIAL,
  FeeStatus.OVERDUE,
];

export const OVERDUE_ELIGIBLE_STATUSES: FeeStatus[] = [
  FeeStatus.PENDING,
  FeeStatus.PARTIAL,
];

const MONEY_EPSILON = 0.005;

export interface BillAmounts {
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
}

export interface BillState extends BillAmounts {
  dueDate: Date;
}

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const getBillBalance = (bill: BillAmounts): number =>
  roundMoney(Math.max(0, bill.amountDue - bill.amountPaid - bill.waivedAmount));

export const isBillSettled = (bill: BillAmounts): boolean =>
  getBillBalance(bill) <= MONEY_EPSILON;

export const resolveBillStatus = (bill: BillState, today: Date): FeeStatus => {
  if (isBillSettled(bill)) {
    return bill.amountPaid <= MONEY_EPSILON && bill.waivedAmount > MONEY_EPSILON
      ? FeeStatus.WAIVED
      : FeeStatus.PAID;
  }
  if (bill.dueDate < today) return FeeStatus.OVERDUE;
  if (bill.amountPaid > MONEY_EPSILON) return FeeStatus.PARTIAL;
  return FeeStatus.PENDING;
};
