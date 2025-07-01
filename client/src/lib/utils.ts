import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = "USD"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numAmount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.substring(0, 1))
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300";
    case "pending":
    case "sent":
      return "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300";
    case "overdue":
    case "failed":
      return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300";
    case "draft":
      return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
    case "active":
      return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300";
    case "inactive":
      return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
  }
}
