"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 500, suffix: "+", label: "Schools Onboarded" },
  { value: 250000, suffix: "+", label: "Students Managed", format: true },
  { value: 47, suffix: "", label: "Counties Covered" },
  { value: 2, suffix: "B+", label: "Fees Collected (KES)", prefix: "KES " },
  { value: 11, suffix: "", label: "Integrated Modules" },
  { value: 99.9, suffix: "%", label: "Platform Uptime", decimal: true },
];

function formatNumber(n: number, format?: boolean, decimal?: boolean): string {
  if (decimal) return n.toFixed(1);
  if (format) {
    if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  }
  return n.toFixed(0);
}

function CountUp({
  target,
  suffix = "",
  prefix = "",
  format,
  decimal,
  started,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  format?: boolean;
  decimal?: boolean;
  started: boolean;
}) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const duration = 1500;
    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, target]);

  return (
    <span>
      {prefix}
      {formatNumber(count, format, decimal)}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="stats"
      ref={ref}
      className="bg-off-white py-16 lg:py-24 border-y border-light-grey"
      aria-label="Impact statistics"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center bg-white rounded-xl p-4 border border-light-grey shadow-sm">
              <div className="font-jakarta font-extrabold text-4xl lg:text-5xl text-gold mb-2">
                <CountUp
                  target={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  format={stat.format}
                  decimal={stat.decimal}
                  started={started}
                />
              </div>
              <div className="font-inter text-sm text-mid-grey leading-tight text-center">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
