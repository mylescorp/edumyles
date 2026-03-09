import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const chartColors = {
  categorical: [
    "var(--em-primary)",
    "var(--em-info)", 
    "var(--em-em-accent)",
    "var(--em-danger)",
    "var(--em-success)",
    "var(--role-student)",
    "var(--role-parent)",
  ],
};
