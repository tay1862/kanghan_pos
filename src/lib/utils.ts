import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("lo-LA").format(amount) + " ກີບ";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("lo-LA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("lo-LA", {
    timeStyle: "short",
  }).format(new Date(date));
}

export function getTableLabel(table: {
  number?: number | null;
  customName?: string | null;
}): string {
  if (table.number) return `ໂຕ໊ະ ${table.number}`;
  if (table.customName) return table.customName;
  return "ໂຕ໊ະທົ່ວໄປ";
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
