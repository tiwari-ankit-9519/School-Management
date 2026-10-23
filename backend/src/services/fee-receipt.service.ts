import PDFDocument from "pdfkit";
import { Prisma, Role, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { getBillBalance, roundMoney } from "../utils/fees.utils";

const log = createModuleLogger("FeeReceiptService");

const RECEIPT_SEQUENCE_LENGTH = 6;
const LOGO_FETCH_TIMEOUT_MS = 3000;

const personSelect = {
  regNumber: true,
  admin: { select: { firstName: true, lastName: true } },
  teacher: { select: { firstName: true, lastName: true } },
} satisfies Prisma.UserSelect;

export const receiptSelect = {
  id: true,
  receiptNumber: true,
  academicYearId: true,
  totalAmount: true,
  paymentMode: true,
  referenceNumber: true,
  paidAt: true,
  remarks: true,
  status: true,
  reversedAt: true,
  reversalReason: true,
  createdAt: true,
  academicYear: { select: { name: true } },
  collectedBy: { select: personSelect },
  student: {
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      user: { select: { regNumber: true, email: true } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        select: {
          academicYearId: true,
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
  allocations: {
    orderBy: { feePayment: { dueDate: "asc" } },
    select: {
      amount: true,
      feePayment: {
        select: {
          id: true,
          amountDue: true,
          waivedAmount: true,
          dueDate: true,
          billingPeriod: true,
          feeStructure: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.FeeReceiptSelect;

export type ReceiptRecord = Prisma.FeeReceiptGetPayload<{
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

export interface ReceiptLine {
  billId: string;
  feeName: string;
  billingPeriod: string | null;
  dueDate: Date;
  amountDue: number;
  waived: number;
  paidBefore: number;
  paidNow: number;
  balanceAfter: number;
}

export interface ReceiptData {
  receipt: ReceiptRecord;
  school: ReceiptSchool;
  lines: ReceiptLine[];
  totalBalanceAfter: number;
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

export async function getReceiptData(receiptId: string): Promise<ReceiptData> {
  const [receipt, school] = await Promise.all([
    prisma.feeReceipt.findUnique({
      where: { id: receiptId },
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

  if (!receipt) throw new Error("Receipt not found");
  if (!school) throw new Error("School settings not found");

  const billIds = receipt.allocations.map(
    (allocation) => allocation.feePayment.id,
  );

  const paidUpToThis = billIds.length
    ? await prisma.feeAllocation.groupBy({
        by: ["feePaymentId"],
        where: {
          feePaymentId: { in: billIds },
          receipt: {
            status: TransactionStatus.SUCCESS,
            createdAt: { lte: receipt.createdAt },
          },
        },
        _sum: { amount: true },
      })
    : [];

  const paidByBill = new Map(
    paidUpToThis.map((row) => [row.feePaymentId, row._sum.amount ?? 0]),
  );
  const countsTowardsBalance = receipt.status === TransactionStatus.SUCCESS;

  const lines: ReceiptLine[] = receipt.allocations.map((allocation) => {
    const bill = allocation.feePayment;
    const paidThroughThis = roundMoney(paidByBill.get(bill.id) ?? 0);
    const paidNow = roundMoney(allocation.amount);
    const paidBefore = roundMoney(
      Math.max(0, paidThroughThis - (countsTowardsBalance ? paidNow : 0)),
    );
    return {
      billId: bill.id,
      feeName: bill.feeStructure.name,
      billingPeriod: bill.billingPeriod,
      dueDate: bill.dueDate,
      amountDue: bill.amountDue,
      waived: bill.waivedAmount,
      paidBefore,
      paidNow,
      balanceAfter: getBillBalance({
        amountDue: bill.amountDue,
        amountPaid: paidThroughThis,
        waivedAmount: bill.waivedAmount,
      }),
    };
  });

  return {
    receipt,
    school,
    lines,
    totalBalanceAfter: roundMoney(
      lines.reduce((sum, line) => sum + line.balanceAfter, 0),
    ),
  };
}

export function assertReceiptAccess(
  data: ReceiptData,
  userId: string,
  role: Role,
): void {
  if (role === Role.ADMIN || role === Role.MODERATOR) return;

  const student = data.receipt.student;
  if (role === Role.STUDENT && student.userId === userId) return;
  if (
    role === Role.PARENT &&
    student.parentLinks.some((link) => link.parent.userId === userId)
  )
    return;

  log.warn("Receipt access denied", {
    userId,
    role,
    receiptNumber: data.receipt.receiptNumber,
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
    month: "short",
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

const collectorName = (receipt: ReceiptRecord): string => {
  const person = receipt.collectedBy.admin ?? receipt.collectedBy.teacher;
  return person
    ? `${person.firstName} ${person.lastName}`
    : receipt.collectedBy.regNumber;
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
  const { receipt, school, lines, totalBalanceAfter } = data;
  const student = receipt.student;
  const enrollment =
    student.enrollments.find(
      (item) => item.academicYearId === receipt.academicYearId,
    ) ?? student.enrollments[0];
  const guardian = student.parentLinks[0]?.parent;
  const isReversed = receipt.status === TransactionStatus.REVERSED;
  const logo = await fetchLogo(school.logoUrl);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5",
      margin: 28,
      info: {
        Title: `Fee Receipt ${receipt.receiptNumber}`,
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
    const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 40;
    const ink = "#111827";
    const muted = "#6b7280";
    const line = "#e5e7eb";
    const accent = "#4f46e5";

    const drawWatermark = () => {
      if (!isReversed) return;
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
    };

    const drawFooter = () => {
      const footerY = doc.page.height - doc.page.margins.bottom - 22;
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
            lineBreak: false,
          },
        );
      doc.text(`Generated on ${formatDate(new Date())}`, left, footerY + 9, {
        width,
        align: "center",
        lineBreak: false,
      });
    };

    const headerTop = doc.y;
    if (logo) {
      try {
        doc.image(logo, left, headerTop, { fit: [42, 42] });
      } catch {
        log.warn("Logo image could not be embedded in receipt");
      }
    }
    const textLeft = logo ? left + 52 : left;
    const textWidth = width - (textLeft - left);
    doc
      .fillColor(ink)
      .font("Helvetica-Bold")
      .fontSize(12.5)
      .text(school.name, textLeft, headerTop, { width: textWidth });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(muted)
      .text(
        `${school.address}, ${school.city}, ${school.state} - ${school.pincode}`,
        { width: textWidth },
      )
      .text(`Phone: ${school.phone}  |  Email: ${school.email}`, {
        width: textWidth,
      })
      .text(
        [
          school.boardType,
          school.affiliationNumber
            ? `Affiliation No: ${school.affiliationNumber}`
            : "",
        ]
          .filter(Boolean)
          .join("  |  "),
        { width: textWidth },
      );

    doc.y = Math.max(doc.y, headerTop + 44) + 6;
    doc
      .strokeColor(line)
      .lineWidth(1)
      .moveTo(left, doc.y)
      .lineTo(left + width, doc.y)
      .stroke();
    doc.moveDown(0.5);

    doc
      .font("Helvetica-Bold")
      .fontSize(11.5)
      .fillColor(accent)
      .text("FEE RECEIPT", left, doc.y, { width, align: "center" });
    doc.moveDown(0.5);

    const metaY = doc.y;
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(muted)
      .text("Receipt No.", left, metaY);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ink)
      .text(receipt.receiptNumber, left, metaY + 10);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(muted)
      .text("Date", left, metaY, { width, align: "right" });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ink)
      .text(formatDate(receipt.paidAt), left, metaY + 10, {
        width,
        align: "right",
      });
    doc.y = metaY + 28;

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
      ["Session", receipt.academicYear.name],
    ];

    const columnWidth = width / 2;
    for (let index = 0; index < detailRows.length; index += 2) {
      const rowY = doc.y;
      [detailRows[index], detailRows[index + 1]].forEach((pair, column) => {
        if (!pair) return;
        const x = left + column * columnWidth;
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(muted)
          .text(pair[0], x, rowY, { width: columnWidth - 8 });
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor(ink)
          .text(pair[1], x, rowY + 8, { width: columnWidth - 8 });
      });
      doc.y = rowY + 24;
    }

    doc.moveDown(0.3);

    const columns = [
      { label: "Particulars", width: width * 0.36, align: "left" as const },
      { label: "Due", width: width * 0.16, align: "right" as const },
      { label: "Paid earlier", width: width * 0.16, align: "right" as const },
      { label: "Paid now", width: width * 0.16, align: "right" as const },
      { label: "Balance", width: width * 0.16, align: "right" as const },
    ];

    const drawTableHeader = () => {
      const top = doc.y;
      doc.rect(left, top, width, 18).fill("#f3f4f6");
      let x = left;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(muted);
      columns.forEach((column) => {
        doc.text(column.label, x + 4, top + 6, {
          width: column.width - 8,
          align: column.align,
          lineBreak: false,
        });
        x += column.width;
      });
      doc.y = top + 22;
    };

    drawWatermark();
    drawTableHeader();

    lines.forEach((receiptLine) => {
      const particulars = `${receiptLine.feeName} (${formatPeriod(receiptLine.billingPeriod)})${
        receiptLine.waived > 0
          ? `\nWaived: ${formatMoney(receiptLine.waived)}`
          : ""
      }`;
      doc.font("Helvetica").fontSize(8);
      const rowHeight =
        Math.max(
          14,
          doc.heightOfString(particulars, { width: columns[0].width - 8 }),
        ) + 6;

      if (doc.y + rowHeight > bottomLimit()) {
        drawFooter();
        doc.addPage();
        drawWatermark();
        drawTableHeader();
      }

      const rowY = doc.y;
      const values = [
        particulars,
        formatMoney(receiptLine.amountDue),
        formatMoney(receiptLine.paidBefore),
        formatMoney(receiptLine.paidNow),
        formatMoney(receiptLine.balanceAfter),
      ];
      let x = left;
      values.forEach((value, index) => {
        doc
          .font(index === 3 ? "Helvetica-Bold" : "Helvetica")
          .fontSize(8)
          .fillColor(ink)
          .text(value, x + 4, rowY, {
            width: columns[index].width - 8,
            align: columns[index].align,
          });
        x += columns[index].width;
      });
      doc.y = rowY + rowHeight;
      doc
        .strokeColor(line)
        .lineWidth(0.5)
        .moveTo(left, doc.y - 3)
        .lineTo(left + width, doc.y - 3)
        .stroke();
    });

    if (doc.y + 110 > bottomLimit()) {
      drawFooter();
      doc.addPage();
      drawWatermark();
    }

    doc.moveDown(0.3);
    const totalsY = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(ink)
      .text("Total received", left, totalsY);
    doc.text(formatMoney(receipt.totalAmount), left, totalsY, {
      width,
      align: "right",
    });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text("Balance on these fees after this payment", left, totalsY + 15);
    doc.text(formatMoney(totalBalanceAfter), left, totalsY + 15, {
      width,
      align: "right",
    });
    doc.y = totalsY + 32;

    doc
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor(ink)
      .text(amountInWords(receipt.totalAmount), left, doc.y, { width });
    doc.moveDown(0.6);

    const paymentRows: [string, string][] = [
      ["Payment mode", formatMode(receipt.paymentMode)],
      ["Reference No.", receipt.referenceNumber ?? "-"],
      ["Collected by", collectorName(receipt)],
    ];
    if (receipt.remarks) paymentRows.push(["Remarks", receipt.remarks]);

    paymentRows.forEach(([label, value]) => {
      const y = doc.y;
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(muted)
        .text(label, left, y, { width: 84 });
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(ink)
        .text(value, left + 84, y, { width: width - 84 });
      doc.moveDown(0.3);
    });

    if (isReversed) {
      doc.moveDown(0.5);
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#dc2626")
        .text(
          `REVERSED on ${receipt.reversedAt ? formatDate(receipt.reversedAt) : "-"}: ${receipt.reversalReason ?? ""}`,
          left,
          doc.y,
          { width },
        );
    }

    drawFooter();
    doc.end();
  });
}
