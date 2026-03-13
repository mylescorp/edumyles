"use client";

import { useRef, useState, useEffect } from "react";
import { School, Users, Building, Truck, TrendingUp, MapPin } from "lucide-react";

interface StatItem {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const stats: StatItem[] = [
  { value: "500+", label: "Schools", icon: <School size={24} /> },
  { value: "250K+", label: "Students", icon: <Users size={24} /> },
  { value: "20+", label: "Products", icon: <Building size={24} /> },
  { value: "6", label: "Countries", icon: <MapPin size={24} /> },
];

function AnimatedCounter({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasAnimated && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const targetValue = parseInt(value.replace(/[^0-9]/g, ""));
            const duration = 2000;
            const steps = 60;
            const stepValue = targetValue / steps;
            let current = 0;

            const timer = setInterval(() => {
              current += stepValue;
              if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
              }
              setCount(Math.floor(current));
            }, duration / steps);
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(ref.current);
      return () => observer.disconnect();
    }
    return undefined;
  }, [hasAnimated, value]);

  return (
    <span ref={ref}>
      {value.includes('+') ? `${count}+` : count}
    </span>
  );
}

export default function ImpactStats() {
  return (
    <section className="impact-stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
