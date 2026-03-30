"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DAY_COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-purple-50 border-purple-200",
  "bg-green-50 border-green-200",
  "bg-orange-50 border-orange-200",
  "bg-pink-50 border-pink-200",
];

export default function StudentTimetablePage() {
  const { isLoading } = useAuth();

  const slots = useQuery(api.modules.portal.student.queries.getMyTimetable);

  if (isLoading || slots === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const getSlot = (day: string, period: number) =>
    slots.find((s: any) => s.day === day && s.period === period);

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  return (
    <div>
      <PageHeader
        title="My Timetable"
        description="Your weekly class schedule"
      />

      <div className="space-y-6">
        {/* Today's classes */}
        {DAYS.includes(today) && (
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">Today — {today}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((period) => {
                  const slot = getSlot(today, period);
                  return slot ? (
                    <div
                      key={period}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <Badge variant="outline">P{period}</Badge>
                      <span className="font-medium">{(slot as any).subjectId}</span>
                      {(slot as any).startTime && (
                        <span className="text-muted-foreground">
                          {(slot as any).startTime}–{(slot as any).endTime}
                        </span>
                      )}
                      {(slot as any).room && (
                        <span className="text-xs text-primary/70">
                          Rm {(slot as any).room}
                        </span>
                      )}
                    </div>
                  ) : null;
                })}
                {!PERIODS.some((p) => getSlot(today, p)) && (
                  <p className="text-sm text-muted-foreground italic">
                    No classes scheduled for today.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full weekly grid */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {slots.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground italic">
                No timetable available. Contact your school administrator.
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border bg-muted/50 p-2 text-left font-medium">
                      Period
                    </th>
                    {DAYS.map((day, i) => (
                      <th
                        key={day}
                        className={cn(
                          "border p-2 text-center font-medium capitalize",
                          day === today ? "bg-primary/10 text-primary" : "bg-muted/50"
                        )}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period}>
                      <td className="border bg-muted/30 p-2 font-medium text-center">
                        {period}
                      </td>
                      {DAYS.map((day, dayIdx) => {
                        const slot = getSlot(day, period);
                        return (
                          <td
                            key={`${day}-${period}`}
                            className={cn(
                              "border p-2 text-center align-top",
                              slot ? DAY_COLORS[dayIdx] : "bg-background"
                            )}
                          >
                            {slot ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">
                                  {(slot as any).subjectId}
                                </span>
                                {(slot as any).startTime && (
                                  <span className="text-xs text-muted-foreground">
                                    {(slot as any).startTime}–{(slot as any).endTime}
                                  </span>
                                )}
                                {(slot as any).room && (
                                  <span className="text-[10px] text-primary/70 uppercase tracking-wide">
                                    Rm: {(slot as any).room}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/40 italic">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
