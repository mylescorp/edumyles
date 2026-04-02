"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type TimetableSlot = {
    day: string;
    period: number;
    subjectId: string;
    startTime: string;
    endTime: string;
    room?: string;
};

export default function StudentTimetable() {
    const slots = useQuery(api.modules.portal.student.queries.getMyTimetable) as TimetableSlot[] | undefined;

    const getSlot = (day: string, period: number) => {
        return slots?.find((s) => s.day === day && s.period === period);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Timetable"
                description="Your weekly class schedule."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border p-2 bg-muted/50 text-left">Period</th>
                                {DAYS.map(day => (
                                    <th key={day} className="border p-2 bg-muted/50 text-center capitalize">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERIODS.map(period => (
                                <tr key={period}>
                                    <td className="border p-2 font-medium bg-muted/30">Period {period}</td>
                                    {DAYS.map(day => {
                                        const slot = getSlot(day, period);
                                        return (
                                            <td
                                                key={`${day}-${period}`}
                                                className={cn(
                                                    "border p-2 text-center transition-colors",
                                                    slot ? "bg-primary/5 hover:bg-primary/10" : "bg-background"
                                                )}
                                            >
                                                {slot ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-sm">{slot.subjectId}</span>
                                                        <span className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                                                        {slot.room && <span className="text-[10px] text-primary/70 uppercase">Room: {slot.room}</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/30 font-light italic">No class</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!slots && (
                        <div className="flex h-32 items-center justify-center text-muted-foreground italic">
                            Loading timetable...
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
