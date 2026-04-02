import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  return new ConvexHttpClient(url);
}

function centsToCurrency(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { payslipId: string } }
) {
  const sessionToken = req.cookies.get("session_token")?.value;
  if (!sessionToken) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const convex = getConvex();

  // Use listPayslips and filter client-side (no single-item getter exists yet)
  const payslips = await convex.query(api.modules.hr.queries.listPayslips, {
    sessionToken,
  } as any);

  const payslip = Array.isArray(payslips)
    ? (payslips as any[]).find((p) => p._id === params.payslipId)
    : null;

  if (!payslip) {
    return new NextResponse("Payslip not found", { status: 404 });
  }

  // Attempt to get staff member name
  let staffName = "Staff Member";
  try {
    const staffList = await convex.query(api.modules.hr.queries.listStaff, {
      sessionToken,
    } as any);
    const staff = (staffList as any[])?.find((s: any) => s._id === payslip.staffId);
    if (staff) {
      staffName = `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() || staffName;
    }
  } catch {
    // ignore
  }

  const currency = payslip.currency ?? "KES";
  const period = payslip.payrollRunId
    ? `Pay Period: ${payslip.payrollRunId}`
    : new Date(payslip.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const gross = (payslip.basicCents + payslip.allowancesCents) / 100;
  const deductions = payslip.deductionsCents / 100;
  const net = payslip.netCents / 100;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payslip — ${staffName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
    @media print {
      @page { size: A4; margin: 15mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
    .container { max-width: 680px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0F4C2A; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 700; color: #0F4C2A; }
    .header .meta { text-align: right; font-size: 12px; color: #6b7280; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 20px 0 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9fafb; padding: 12px; border-radius: 4px; margin-bottom: 16px; }
    .info-item label { display: block; font-size: 11px; color: #9ca3af; }
    .info-item span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9ca3af; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
    td { padding: 7px 0; border-bottom: 1px solid #f3f4f6; }
    td:last-child { text-align: right; }
    .total-row td { font-weight: 700; font-size: 15px; color: #0F4C2A; border-top: 2px solid #0F4C2A; border-bottom: none; padding-top: 10px; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
    .print-btn { display: block; margin: 20px auto 0; padding: 10px 28px; background: #0F4C2A; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>PAYSLIP</h1>
      <p style="font-size:12px;color:#6b7280;margin-top:4px">${period}</p>
    </div>
    <div class="meta">
      <strong>EduMyles</strong><br/>
      School Management System<br/>
      Generated: ${new Date().toLocaleDateString("en-GB")}
    </div>
  </div>

  <div class="section-title">Employee Details</div>
  <div class="info-grid">
    <div class="info-item"><label>Name</label><span>${staffName}</span></div>
    <div class="info-item"><label>Staff ID</label><span>${payslip.staffId?.slice(-8) ?? "—"}</span></div>
    <div class="info-item"><label>Currency</label><span>${currency}</span></div>
    <div class="info-item"><label>Status</label><span>${payslip.status ?? "—"}</span></div>
  </div>

  <div class="section-title">Earnings</div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Basic Salary</td><td>${centsToCurrency(payslip.basicCents, currency)}</td></tr>
      <tr><td>Allowances</td><td>${centsToCurrency(payslip.allowancesCents, currency)}</td></tr>
      <tr><td style="font-weight:600">Gross Pay</td><td style="font-weight:600">${currency} ${gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
    </tbody>
  </table>

  <div class="section-title">Deductions</div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Total Deductions</td><td>${centsToCurrency(payslip.deductionsCents, currency)}</td></tr>
    </tbody>
  </table>

  <table>
    <tbody>
      <tr class="total-row">
        <td>NET PAY</td>
        <td>${currency} ${net.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>This payslip is computer-generated and does not require a signature.</p>
    <p>For queries, contact the HR department.</p>
  </div>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
