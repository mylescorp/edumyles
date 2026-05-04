import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  return new ConvexHttpClient(url);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: number | string) {
  const date = typeof value === "number" ? new Date(value) : value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ noticeIdOrNumber: string }> }
) {
  const { noticeIdOrNumber } = await context.params;
  const sessionToken = req.cookies.get("session_token")?.value;
  if (!sessionToken) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const convex = getConvex();
  const data = await convex.query(api.modules.finance.queries.getDemandNotice, {
    noticeIdOrNumber,
    sessionToken,
  });

  if (!data) {
    return new NextResponse("Demand notice not found", { status: 404 });
  }

  const { notice, student, invoices } = data as any;
  const studentName = student
    ? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim()
    : notice.studentId;
  const rows = (Array.isArray(invoices) ? invoices : [])
    .map((invoice: any) => {
      const balance = invoice.balanceKes ?? Math.max(0, Number(invoice.totalKes ?? invoice.amount ?? 0) - Number(invoice.paidAmountKes ?? 0));
      return `<tr>
        <td>${escapeHtml(invoice.invoiceNumber ?? invoice._id)}</td>
        <td>${escapeHtml(invoice.description ?? invoice.type ?? "School fees")}</td>
        <td>${escapeHtml(invoice.dueDate ?? "-")}</td>
        <td style="text-align:right">KES ${formatMoney(invoice.totalKes ?? invoice.amount)}</td>
        <td style="text-align:right">KES ${formatMoney(balance)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Demand Notice ${escapeHtml(notice.noticeNumber)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 14px; color: #111; background: #fff; }
    @media print {
      @page { size: A4; margin: 18mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
      .container { margin: 0; border: none; }
    }
    .container { max-width: 760px; margin: 40px auto; padding: 40px; border: 1px solid #d1d5db; }
    .header { border-bottom: 3px solid #991b1b; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { color: #991b1b; font-size: 24px; letter-spacing: 0.4px; }
    .header p { color: #6b7280; margin-top: 6px; font-size: 12px; }
    .notice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; }
    .notice-meta label { display: block; color: #6b7280; font-size: 11px; text-transform: uppercase; }
    .notice-meta span { font-weight: 700; }
    .amount-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px 20px; margin: 20px 0 24px; }
    .amount-box label { display: block; color: #991b1b; font-size: 12px; text-transform: uppercase; }
    .amount-box strong { display: block; color: #7f1d1d; font-size: 28px; margin-top: 4px; }
    p { line-height: 1.6; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0 24px; }
    thead tr { background: #991b1b; color: #fff; }
    th { text-align: left; font-size: 12px; padding: 9px 10px; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .signature { margin-top: 48px; width: 240px; border-top: 1px solid #111; padding-top: 8px; color: #6b7280; font-size: 12px; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    .print-btn { display: block; margin: 20px auto 0; padding: 10px 28px; background: #991b1b; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FEE DEMAND NOTICE</h1>
      <p>EduMyles School Management System</p>
    </div>

    <div class="notice-meta">
      <div><label>Notice Number</label><span>${escapeHtml(notice.noticeNumber)}</span></div>
      <div><label>Generated</label><span>${formatDate(notice.generatedAt)}</span></div>
      <div><label>Student</label><span>${escapeHtml(studentName)}</span></div>
      <div><label>Admission No.</label><span>${escapeHtml(student?.admissionNumber ?? "-")}</span></div>
    </div>

    <p>Dear Parent or Guardian,</p>
    <p>Our records indicate that the following school fee balance remains outstanding. Kindly arrange settlement with the school accounts office.</p>

    <div class="amount-box">
      <label>Total Outstanding</label>
      <strong>KES ${formatMoney(notice.outstandingKes)}</strong>
    </div>

    <table>
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Description</th>
          <th>Due Date</th>
          <th style="text-align:right">Total</th>
          <th style="text-align:right">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px">No invoice records are attached to this notice.</td></tr>'}
      </tbody>
    </table>

    <p>Please ignore this notice if payment has already been made and share the payment reference with the accounts office for reconciliation.</p>
    <div class="signature">Accounts Office</div>

    <div class="footer">
      <p>This notice is generated by EduMyles. Generated: ${formatDate()}</p>
    </div>
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
