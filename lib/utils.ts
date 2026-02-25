import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getWeekDates(date: Date = new Date()): string[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(format(d, "yyyy-MM-dd"));
  }
  return week;
}

export const TIME_BLOCK_MINUTES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm

export function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

export function formatTimeBlock(hour: number, minute: number): string {
  return `${formatHour(hour)} :${minute.toString().padStart(2, "0")}`;
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#6366f1",
  high: "#f59e0b",
  urgent: "#ef4444",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
