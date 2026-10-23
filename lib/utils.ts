import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dob: string | Date, asOfDate?: Date): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = asOfDate || new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) ? 0 : age;
}

export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined) return "Nearby";
  if (distanceKm < 1) return "Less than a km away";
  if (distanceKm === 1) return "1 km away";
  return `${Math.round(distanceKm)} km away`;
}

export function formatDate(timestamp: string | Date, asOfDate?: Date): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = asOfDate || new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffHours < 48) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
