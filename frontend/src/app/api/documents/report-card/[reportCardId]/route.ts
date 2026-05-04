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

function formatDate(value?: number | string) {
  const date = typeof value === "number" ? new Date(value) : value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reportCardId: string }> }
) {
  const { reportCardId } = await context.params;
  const sessionToken = req.cookies.get("session_token")?.value;
  if (!sessionToken) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const convex = getConvex();
  const data = await convex.query(api.modules.academics.queries.getReportCardById, {
    reportCardId,
    sessionToken,
  });

  if (!data) {
    return new NextResponse("Report card not found", { status: 404 });
  }

  const { reportCard, student, classRecord } = data as any;
  const studentName = student
    ? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim()
    : reportCard.studentId;
  const className = classRecord?.name ?? reportCard.classId ?? "-";
  const subjects = Array.isArray(reportCard.subjects) ? reportCard.subjects : [];
  const average = reportCard.overallPercentage ?? reportCard.gpa ?? null;
  const rank = reportCard.classRank ?? reportCard.rank ?? null;
  const attendance = reportCard.attendanceSummary ?? {};

  const gradeRows = subjects
    .map((subject: any) => {
      const name = subject.subjectName ?? subject.name ?? subject.subjectId ?? "Subject";
      const score = subject.score ?? subject.marks ?? subject.percentage ?? "-";
      const outOf = subject.outOf ?? subject.maxScore ?? 100;
      const grade = subject.grade ?? subject.meanGrade ?? "-";
      const remarks = subject.remarks ?? subject.teacherRemarks ?? "";
      return `<tr>
        <td>${escapeHtml(name)}</td>
        <td style="text-align:center">${escapeHtml(score)}${outOf ? ` / ${escapeHtml(outOf)}` : ""}</td>
        <td style="text-align:center">${escapeHtml(grade)}</td>
        <td>${escapeHtml(remarks)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report Card - ${escapeHtml(studentName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
    @media print {
      @page { size: A4; margin: 15mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
      .container { margin: 0; border: none; }
    }
    .container { max-width: 760px; margin: 40px auto; padding: 40px; border: 2px solid #0F4C2A; }
    .school-header { text-align: center; border-bottom: 3px double #0F4C2A; padding-bottom: 16px; margin-bottom: 24px; }
    .school-header h1 { font-size: 22px; font-weight: 800; color: #0F4C2A; letter-spacing: 1px; }
    .school-header h2 { font-size: 15px; font-weight: 600; margin-top: 6px; }
    .school-header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9fafb; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; }
    .info-item label { font-size: 11px; color: #6b7280; display: block; text-transform: uppercase; }
    .info-item span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #0F4C2A; color: #fff; }
    th { padding: 9px 10px; text-align: left; font-size: 12px; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 14px 20px; margin-bottom: 24px; }
    .summary-item label { font-size: 11px; color: #047857; display: block; text-transform: uppercase; }
    .summary-item span { font-size: 18px; font-weight: 800; color: #0F4C2A; }
    .remarks { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .remarks div { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; min-height: 84px; }
    .remarks h3 { font-size: 12px; color: #0F4C2A; margin-bottom: 8px; text-transform: uppercase; }
    .remarks p { line-height: 1.5; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-box { text-align: center; width: 30%; }
    .signature-line { border-bottom: 1px solid #111; margin-bottom: 6px; height: 36px; }
    .signature-box p { font-size: 11px; color: #6b7280; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    .print-btn { display: block; margin: 20px auto 0; padding: 10px 28px; background: #0F4C2A; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
<div class="container">
  <div class="school-header">
    <h1>STUDENT REPORT CARD</h1>
    <h2>EduMyles School Management System</h2>
    <p>${escapeHtml(reportCard.term)}${reportCard.academicYear ? ` - ${escapeHtml(reportCard.academicYear)}` : ""}</p>
  </div>

  <div class="student-info">
    <div class="info-item"><label>Student Name</label><span>${escapeHtml(studentName)}</span></div>
    <div class="info-item"><label>Admission No.</label><span>${escapeHtml(student?.admissionNumber ?? "-")}</span></div>
    <div class="info-item"><label>Class</label><span>${escapeHtml(className)}</span></div>
    <div class="info-item"><label>Status</label><span>${escapeHtml(reportCard.status)}</span></div>
  </div>

  <div class="summary">
    <div class="summary-item"><label>Average</label><span>${average == null ? "-" : `${escapeHtml(average)}%`}</span></div>
    <div class="summary-item"><label>Mean Grade</label><span>${escapeHtml(reportCard.meanGrade ?? "-")}</span></div>
    <div class="summary-item"><label>Rank</label><span>${rank == null ? "-" : `#${escapeHtml(rank)}`}</span></div>
    <div class="summary-item"><label>Attendance</label><span>${escapeHtml(attendance.presentDays ?? attendance.present ?? "-")}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th style="text-align:center;width:100px">Marks</th>
        <th style="text-align:center;width:70px">Grade</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${gradeRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">No subject records are attached to this report card.</td></tr>'}
    </tbody>
  </table>

  <div class="remarks">
    <div>
      <h3>Class Teacher Remarks</h3>
      <p>${escapeHtml(reportCard.classTeacherRemarks ?? reportCard.aiGeneratedNarrative ?? "-")}</p>
    </div>
    <div>
      <h3>Principal Remarks</h3>
      <p>${escapeHtml(reportCard.principalRemarks ?? "-")}</p>
    </div>
  </div>

  <div class="signature-row">
    <div class="signature-box"><div class="signature-line"></div><p>Class Teacher</p></div>
    <div class="signature-box"><div class="signature-line"></div><p>Principal</p></div>
    <div class="signature-box"><div class="signature-line"></div><p>Parent / Guardian</p></div>
  </div>

  <div class="footer">
    <p>This report card is generated by EduMyles. For queries contact your school administration.</p>
    <p>Generated: ${formatDate(reportCard.generatedAt)}</p>
  </div>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
