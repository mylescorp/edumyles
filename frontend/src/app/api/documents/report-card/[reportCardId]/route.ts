import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  return new ConvexHttpClient(url);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { reportCardId: string } }
) {
  const sessionToken = req.cookies.get("session_token")?.value;
  if (!sessionToken) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const convex = getConvex();

  // Fetch grades for the student so we can build the report card body
  // We rely on the report card ID being in the format that matches a reportCards record.
  // Since there is no single getter, we fetch recent exams and grades and join them.
  let grades: any[] = [];
  let studentName = "Student";
  let className = "";
  let term = "";
  let academicYear = "";
  let gpa: number | null = null;
  let rank: number | null = null;

  try {
    // Use the student portal query to resolve the current student if the viewer is the student
    const profile = await convex.query(api.modules.portal.student.queries.getMyProfile, {
      sessionToken,
    } as any);
    if (profile) {
      studentName = `${(profile as any).firstName ?? ""} ${(profile as any).lastName ?? ""}`.trim();
      className = (profile as any).className ?? (profile as any).classId ?? "";
    }
  } catch {
    // viewer may be an admin
  }

  try {
    const gradesData = await convex.query(api.modules.portal.student.queries.getMyGrades, {
      sessionToken,
    } as any);
    if (Array.isArray(gradesData)) {
      grades = gradesData as any[];
      if (grades.length > 0) {
        term = grades[0]?.term ?? "";
        academicYear = grades[0]?.academicYear ?? "";
        const scored = grades.filter((g) => typeof g.score === "number");
        if (scored.length > 0) {
          gpa = Math.round((scored.reduce((s, g) => s + g.score, 0) / scored.length) * 10) / 10;
        }
      }
    }
  } catch {
    // ignore
  }

  const gradeRows = grades
    .map((g: any) => {
      const subject = g.subjectName ?? g.subject?.name ?? g.subjectId ?? "Subject";
      const score = typeof g.score === "number" ? g.score : "—";
      const grade = g.grade ?? g.letterGrade ?? letterGrade(g.score);
      const remarks = g.remarks ?? "";
      return `<tr>
        <td>${subject}</td>
        <td style="text-align:center">${score}</td>
        <td style="text-align:center">${grade}</td>
        <td>${remarks}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report Card — ${studentName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
    @media print {
      @page { size: A4; margin: 15mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
    .container { max-width: 740px; margin: 40px auto; padding: 40px; border: 2px solid #0F4C2A; }
    .school-header { text-align: center; border-bottom: 3px double #0F4C2A; padding-bottom: 16px; margin-bottom: 24px; }
    .school-header h1 { font-size: 22px; font-weight: 800; color: #0F4C2A; letter-spacing: 1px; }
    .school-header h2 { font-size: 15px; font-weight: 600; margin-top: 6px; }
    .school-header p { font-size: 12px; color: #6b7280; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9fafb; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; }
    .info-item label { font-size: 11px; color: #9ca3af; display: block; }
    .info-item span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #0F4C2A; color: #fff; }
    th { padding: 9px 10px; text-align: left; font-size: 12px; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .summary { display: flex; gap: 24px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 14px 20px; margin-bottom: 24px; }
    .summary-item label { font-size: 11px; color: #059669; display: block; }
    .summary-item span { font-size: 20px; font-weight: 800; color: #0F4C2A; }
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
    <p>${term ? `${term}  ·  ` : ""}${academicYear || new Date().getFullYear()}</p>
  </div>

  <div class="student-info">
    <div class="info-item"><label>Student Name</label><span>${studentName}</span></div>
    <div class="info-item"><label>Class</label><span>${className || "—"}</span></div>
    <div class="info-item"><label>Term</label><span>${term || "—"}</span></div>
    <div class="info-item"><label>Academic Year</label><span>${academicYear || "—"}</span></div>
  </div>

  ${gpa !== null ? `
  <div class="summary">
    <div class="summary-item"><label>Average Score</label><span>${gpa}%</span></div>
    ${rank !== null ? `<div class="summary-item"><label>Class Rank</label><span>#${rank}</span></div>` : ""}
    <div class="summary-item"><label>Grade</label><span>${letterGradeStr(gpa)}</span></div>
  </div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th style="text-align:center;width:80px">Score (%)</th>
        <th style="text-align:center;width:60px">Grade</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${gradeRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">No grade records found for this report card.</td></tr>'}
    </tbody>
  </table>

  <div class="signature-row">
    <div class="signature-box"><div class="signature-line"></div><p>Class Teacher</p></div>
    <div class="signature-box"><div class="signature-line"></div><p>Principal</p></div>
    <div class="signature-box"><div class="signature-line"></div><p>Parent / Guardian</p></div>
  </div>

  <div class="footer">
    <p>This report card is generated by EduMyles. For queries contact your school administration.</p>
    <p>Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
<script>
function letterGrade(score) {
  if (!score && score !== 0) return "—";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function letterGrade(score: number | null | undefined): string {
  if (score == null) return "—";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

function letterGradeStr(score: number): string {
  return letterGrade(score);
}
