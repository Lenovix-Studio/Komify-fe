import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatChapterNumber(chapterNumber: string | number): string {
  if (chapterNumber === undefined || chapterNumber === null) return "";
  const raw = String(chapterNumber).trim();
  const parts = raw.split(/[.,]/);
  const main = parseInt(parts[0], 10);
  if (isNaN(main)) return raw;

  const sub = parts[1] !== undefined ? parseInt(parts[1], 10) : 0;
  if (!sub || isNaN(sub) || sub === 0) {
    return String(main);
  }
  return `${main},${sub}`;
}
