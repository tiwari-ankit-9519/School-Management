import PDFDocument from "pdfkit";
import { Prisma, Role, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { getBillBalance, roundMoney } from "../utils/fees.utils";

const log = createModuleLogger("FeeReceiptService");

const RECEIPT_SEQUENCE_LENGTH = 6;
const LOGO_FETCH_TIMEOUT_MS = 3000;

export const receiptSelect = {
  id: true,
  receiptNumber: true,
  amount: true,
  paymentMode: true,
  referenceNumber: true,
  paidAt: true,
  remarks: true,
  status: true,
  reversedAt: true,
  reversalReason: true,
  createdAt: true,
  collectedBy: {
    select: {
      regNumber: true,
      admin: { select: { firstName: true, lastName: true } },
      teacher: { select: { firstName: true, lastName: true } },
    },
  },
  feePayment: {
    select: {
      id: true,
      amountDue: true,
      amountPaid: true,
      waivedAmount: true,
      dueDate: true,
      billingPeriod: true,
      status: true,
      feeStructure: {
        select: { name: true, academicYear: { select: { name: true } } },
      },
      student: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          user: { select: { regNumber: true, email: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { enrolledAt: "desc" },
            take: 1,
            select: {
              rollNumber: true,
              class: { select: { name: true, section: true } },
            },
          },
          parentLinks: {
            select: {
              parentType: true,
              parent: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.FeeTransactionSelect;

export type ReceiptTransaction = Prisma.FeeTransactionGetPayload<{
  select: typeof receiptSelect;
}>;

interface ReceiptSchool {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  affiliationNumber: string | null;
  boardType: string;
}

export interface ReceiptData {
  transaction: ReceiptTransaction;
  school: ReceiptSchool;
  paidToDate: number;
  balanceAfter: number;
}

const toReceiptPrefix = (schoolCode: string): string =>
  schoolCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "SCHOOL";

export async function generateReceiptNumber(
  tx: Prisma.TransactionClient,
  academicYearId: string,
): Promise<string> {
  const [school, academicYear, counter] = await Promise.all([
    tx.schoolConfig.findFirst({ select: { code: true } }),
    tx.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
      select: { name: true },
    }),
    tx.receiptCounter.upsert({
      where: { academicYearId },
      create: { academicYearId, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
      select: { lastNumber: true },
    }),
  ]);

  const sequence = String(counter.lastNumber).padStart(
    RECEIPT_SEQUENCE_LENGTH,
    "0",
  );
  return `${toReceiptPrefix(school?.code ?? "")}/${academicYear.name}/${sequence}`;
}

export async function getReceiptData(
  transactionId: string,
): Promise<ReceiptData> {
  const [transaction, school] = await Promise.all([
    prisma.feeTransaction.findUnique({
      where: { id: transactionId },
      select: receiptSelect,
    }),
    prisma.schoolConfig.findFirst({
      select: {
        name: true,
        code: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        logoUrl: true,
        affiliationNumber: true,
        boardType: true,
      },
    }),
  ]);

  if (!transaction) throw new Error("Receipt not found");
  if (!school) throw new Error("School settings not found");

  const paidUpToThis = await prisma.feeTransaction.aggregate({
    where: {
      feePaymentId: transaction.feePayment.id,
      status: TransactionStatus.SUCCESS,
      createdAt: { lte: transaction.createdAt },
    },
    _sum: { amount: true },
  });

  const paidToDate = roundMoney(paidUpToThis._sum.amount ?? 0);
  const balanceAfter = getBillBalance({
    amountDue: transaction.feePayment.amountDue,
    amountPaid: paidToDate,
    waivedAmount: transaction.feePayment.waivedAmount,
  });

  return { transaction, school, paidToDate, balanceAfter };
}

export function assertReceiptAccess(
  data: ReceiptData,
  userId: string,
  role: Role,
): void {
  if (role === Role.ADMIN || role === Role.MODERATOR) return;

  const student = data.transaction.feePayment.student;
  if (role === Role.STUDENT && student.userId === userId) return;
  if (
    role === Role.PARENT &&
    student.parentLinks.some((link) => link.parent.userId === userId)
  )
    return;

  log.warn("Receipt access denied", {
    userId,
    role,
    receiptNumber: data.transaction.receiptNumber,
  });
  throw new Error("You do not have access to this receipt");
}

export const receiptFileName = (receiptNumber: string): string =>
  `Receipt-${receiptNumber.replace(/\//g, "-")}.pdf`;

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const belowHundred = (n: number): string =>
  n < 20
    ? ONES[n]
    : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

const belowThousand = (n: number): string => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [
    hundreds ? `${ONES[hundreds]} Hundred` : "",
    rest ? belowHundred(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const toIndianWords = (value: number): string => {
  if (value === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(value / 10_000_000);
  const lakh = Math.floor((value % 10_000_000) / 100_000);
  const thousand = Math.floor((value % 100_000) / 1000);
  const rest = value % 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
};

const amountInWords = (amount: number): string => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return `Rupees ${toIndianWords(rupees)}${paise ? ` and ${toIndianWords(paise)} Paise` : ""} Only`;
};

const formatMoney = (amount: number): string =>
  `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

const formatPeriod = (billingPeriod: string | null): string => {
  if (!billingPeriod) return "One-time";
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatMode = (mode: string): string =>
  mode
    .toLowerCase()
    .split("_")
    .map((word) =>
      word === "upi" ? "UPI" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

const collectorName = (transaction: ReceiptTransaction): string => {
  const person =
    transaction.collectedBy.admin ?? transaction.collectedBy.teacher;
  return person
    ? `${person.firstName} ${person.lastName}`
    : transaction.collectedBy.regNumber;
};

async function fetchLogo(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    const pngUrl = logoUrl.includes("/upload/")
      ? logoUrl.replace("/upload/", "/upload/f_png/")
      : logoUrl;
    const response = await fetch(pngUrl, {
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (
      !type.includes("png") &&
      !type.includes("jpeg") &&
      !type.includes("jpg")
    )
      return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    log.warn("Could not load school logo for receipt", {
      error: (error as Error).message,
    });
    return null;
  }
}

export async function buildReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const { transaction, school, paidToDate, balanceAfter } = data;
  const bill = transaction.feePayment;
  const student = bill.student;
  const enrollment = student.enrollments[0];
  const guardian = student.parentLinks[0]?.parent;
  const isReversed = transaction.status === TransactionStatus.REVERSED;
  const logo = await fetchLogo(school.logoUrl);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5",
      margin: 32,
      info: {
        Title: `Fee Receipt ${transaction.receiptNumber}`,
        Author: school.name,
        Subject: "Fee payment receipt",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const width =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const ink = "#111827";
    const muted = "#6b7280";
    const line = "#e5e7eb";
    const accent = "#4f46e5";

    const headerTop = doc.y;
    if (logo) {
      try {
        doc.image(logo, left, headerTop, { fit: [44, 44] });
      } catch {
        log.warn("Logo image could not be embedded in receipt");
      }
    }
    const textLeft = logo ? left + 54 : left;
    doc
      .fillColor(ink)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(school.name, textLeft, headerTop, {
        width: width - (textLeft - left),
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text(
        `${school.address}, ${school.city}, ${school.state} - ${school.pincode}`,
        { width: width - (textLeft - left) },
      )
      .text(`Phone: ${school.phone}  |  Email: ${school.email}`)
      .text(
        [
          school.boardType,
          school.affiliationNumber
            ? `Affiliation No: ${school.affiliationNumber}`
            : "",
        ]
          .filter(Boolean)
          .join("  |  "),
      );

    doc.moveDown(0.8);
    doc
      .strokeColor(line)
      .lineWidth(1)
      .moveTo(left, doc.y)
      .lineTo(left + width, doc.y)
      .stroke();
    doc.moveDown(0.6);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(accent)
      .text("FEE RECEIPT", left, doc.y, { width, align: "center" });
    doc.moveDown(0.6);

    const metaY = doc.y;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text("Receipt No.", left, metaY);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ink)
      .text(transaction.receiptNumber, left, metaY + 10);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text("Date", left, metaY, { width, align: "right" });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ink)
      .text(formatDate(transaction.paidAt), left, metaY + 10, {
        width,
        align: "right",
      });
    doc.y = metaY + 30;

    const detailRows: [string, string][] = [
      ["Student", `${student.firstName} ${student.lastName}`],
      ["Registration No.", student.user.regNumber],
      [
        "Class",
        enrollment
          ? `${enrollment.class.name}-${enrollment.class.section}`
          : "-",
      ],
      ["Roll No.", enrollment?.rollNumber ?? "-"],
      [
        "Guardian",
        guardian ? `${guardian.firstName} ${guardian.lastName}` : "-",
      ],
      ["Session", bill.feeStructure.academicYear.name],
    ];

    const columnWidth = width / 2;
    detailRows.forEach(([label, value], index) => {
      const column = index % 2;
      const rowY = doc.y;
      const x = left + column * columnWidth;
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(muted)
        .text(label, x, rowY, { width: columnWidth - 8 });
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(ink)
        .text(value, x, rowY + 9, { width: columnWidth - 8 });
      if (column === 1) doc.y = rowY + 26;
      else doc.y = rowY;
    });
    if (detailRows.length % 2 === 1) doc.y += 26;

    doc.moveDown(0.4);
    const tableTop = doc.y;
    doc.rect(left, tableTop, width, 20).fill("#f3f4f6");
    doc.fillColor(muted).font("Helvetica-Bold").fontSize(8);
    doc.text("Particulars", left + 8, tableTop + 6);
    doc.text("Amount", left, tableTop + 6, {
      width: width - 8,
      align: "right",
    });

    const tableRows: [string, string, boolean][] = [
      [
        `${bill.feeStructure.name} (${formatPeriod(bill.billingPeriod)})`,
        formatMoney(bill.amountDue),
        false,
      ],
      ["Waived / concession", `- ${formatMoney(bill.waivedAmount)}`, false],
      [
        "Paid earlier",
        `- ${formatMoney(roundMoney(paidToDate - transaction.amount))}`,
        false,
      ],
      ["Amount received (this receipt)", formatMoney(transaction.amount), true],
      ["Balance after this payment", formatMoney(balanceAfter), true],
    ];

    let rowY = tableTop + 26;
    tableRows.forEach(([label, value, strong]) => {
      doc
        .font(strong ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(ink);
      doc.text(label, left + 8, rowY, { width: width * 0.65 });
      doc.text(value, left, rowY, { width: width - 8, align: "right" });
      rowY += 18;
      doc
        .strokeColor(line)
        .lineWidth(0.5)
        .moveTo(left, rowY - 5)
        .lineTo(left + width, rowY - 5)
        .stroke();
    });
    doc.y = rowY + 4;

    doc
      .font("Helvetica-Oblique")
      .fontSize(8.5)
      .fillColor(ink)
      .text(amountInWords(transaction.amount), left, doc.y, { width });
    doc.moveDown(0.8);

    const paymentRows: [string, string][] = [
      ["Payment mode", formatMode(transaction.paymentMode)],
      ["Reference No.", transaction.referenceNumber ?? "-"],
      ["Collected by", collectorName(transaction)],
    ];
    if (transaction.remarks) paymentRows.push(["Remarks", transaction.remarks]);

    paymentRows.forEach(([label, value]) => {
      const y = doc.y;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(muted)
        .text(label, left, y, { width: 90 });
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(ink)
        .text(value, left + 90, y, { width: width - 90 });
      doc.moveDown(0.35);
    });

    if (isReversed) {
      doc.moveDown(0.6);
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#dc2626")
        .text(
          `REVERSED on ${transaction.reversedAt ? formatDate(transaction.reversedAt) : "-"}: ${transaction.reversalReason ?? ""}`,
          left,
          doc.y,
          { width },
        );

      doc.save();
      doc.rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc
        .font("Helvetica-Bold")
        .fontSize(60)
        .fillColor("#dc2626")
        .opacity(0.12)
        .text("REVERSED", 0, doc.page.height / 2 - 30, {
          width: doc.page.width,
          align: "center",
        });
      doc.restore();
      doc.opacity(1);
    }

    const footerY = doc.page.height - doc.page.margins.bottom - 24;
    doc
      .strokeColor(line)
      .lineWidth(0.5)
      .moveTo(left, footerY - 6)
      .lineTo(left + width, footerY - 6)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(muted)
      .text(
        "This is a computer-generated receipt and does not require a signature.",
        left,
        footerY,
        {
          width,
          align: "center",
        },
      )
      .text(`Generated on ${formatDate(new Date())}`, {
        width,
        align: "center",
      });

    doc.end();
  });
}
