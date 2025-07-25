import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDateToLong(dateStr: string) {
  const date = new Date(dateStr); // Directly accepts full ISO
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatUtcTo12HourTime(utcString: string) {
  const timeOnly = utcString.split('T')[1]?.split('Z')[0];
  const date = new Date(`1970-01-01T${timeOnly}Z`);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
  });
}
