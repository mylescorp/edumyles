"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Banknote, CalendarDays, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function formatNumber(n: number): string {
  return n.toLocaleString("en-KE");
}

function formatKES(n: number): string {
  return "KES " + formatNumber(n);
}

export default function ROICalculator() {
  const [students, setStudents] = useState(500);
  const [staff, setStaff] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(400);

  const hoursSavedPerMonth = Math.round((students / 100) * 8 + staff * 5);
  const costSavedPerMonth = hoursSavedPerMonth * hourlyRate;
  const annualHours = hoursSavedPerMonth * 12;
  const annualCost = costSavedPerMonth * 12;

  const metrics: { icon: LucideIcon; value: string; label: string; title: string }[] = [
    {
      icon: Clock,
      value: `${formatNumber(hoursSavedPerMonth)} hrs/month`,
      label: "hours freed up for teaching",
      title: "Hours Saved / Month",
    },
    {
      icon: Banknote,
      value: formatKES(costSavedPerMonth) + "/month",
      label: "in admin labour costs",
      title: "Cost Saved / Month",
    },
    {
      icon: CalendarDays,
      value: `${formatNumber(annualHours)} hrs/year`,
      label: "hours per year",
      title: "Annual Hours Saved",
    },
    {
      icon: Trophy,
      value: formatKES(annualCost) + "/year",
      label: "total annual saving",
      title: "Annual KES Saved",
    },
  ];

  return (
    <section
      id="roi-calculator"
      className="py-16 px-4 sm:px-8 bg-white"
      aria-label="ROI Calculator"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)", color: "#061A12" }}
          >
            Calculate Your School&apos;s ROI
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            See how much time and money EduMyles saves your school every month.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* LEFT — Inputs */}
          <div className="flex flex-col gap-8">
            {/* Students */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#061A12]">
                  How many students does your school have?
                </label>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: "#FEF3DC", color: "#061A12" }}
                >
                  {formatNumber(students)}
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={3000}
                step={50}
                value={students}
                onChange={(e) => setStudents(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none accent-[#061A12] cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #061A12 ${((students - 50) / (3000 - 50)) * 100}%, #e5e7eb ${((students - 50) / (3000 - 50)) * 100}%)`,
                }}
                aria-label="Number of students"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>50</span>
                <span>3,000</span>
              </div>
            </div>

            {/* Staff */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#061A12]">
                  How many administrative staff?
                </label>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: "#FEF3DC", color: "#061A12" }}
                >
                  {staff}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={staff}
                onChange={(e) => setStaff(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none accent-[#061A12] cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #061A12 ${((staff - 1) / (20 - 1)) * 100}%, #e5e7eb ${((staff - 1) / (20 - 1)) * 100}%)`,
                }}
                aria-label="Number of administrative staff"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* Hourly Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#061A12]">
                  Average admin hourly rate (KES)?
                </label>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: "#FEF3DC", color: "#061A12" }}
                >
                  {formatKES(hourlyRate)}
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={1000}
                step={50}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none accent-[#061A12] cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #061A12 ${((hourlyRate - 200) / (1000 - 200)) * 100}%, #e5e7eb ${((hourlyRate - 200) / (1000 - 200)) * 100}%)`,
                }}
                aria-label="Average admin hourly rate in KES"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>KES 200</span>
                <span>KES 1,000</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.title}
                  className="rounded-2xl p-5 flex flex-col gap-1"
                  style={{ background: "#F3FBF6", border: "1px solid #d1fae5" }}
                >
                  <metric.icon
                    className="w-5 h-5 mb-0.5"
                    strokeWidth={1.5}
                    style={{ color: "#1A7A4A" }}
                  />
                  <span
                    className="font-display font-bold text-lg leading-tight"
                    style={{ color: "#E8A020" }}
                  >
                    {metric.value}
                  </span>
                  <span className="text-xs text-gray-500">{metric.label}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-400 mt-2">
              EduMyles costs from KES 12,900/month — a fraction of your savings.
            </p>

            <Link
              href="/waitlist"
              className="inline-flex items-center justify-center gap-2 font-semibold text-sm px-6 py-3 rounded-full text-white transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
              style={{ background: "#061A12" }}
            >
              Start Your Free Trial →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
