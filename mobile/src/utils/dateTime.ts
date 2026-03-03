/**
 * Timezone-aware formatting for appointments.
 * Backend stores UTC; we show therapist timezone label or "your time" for parent.
 */

/** e.g. "America/Toronto" */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Human-friendly short label for timezone (e.g. "Toronto time") */
export function getTimezoneShortLabel(ianaZone: string): string {
  try {
    const parts = ianaZone.split('/');
    const city = parts[parts.length - 1]?.replace(/_/g, ' ') ?? ianaZone;
    return `${city} time`;
  } catch {
    return 'local time';
  }
}

export type AppointmentTimeLabel = 'therapist' | 'parent';

/**
 * Format a UTC ISO string for display with timezone context.
 * - therapist: "2:00 PM (Toronto time)" using device timezone
 * - parent: "2:00 PM (your time)" using device local
 */
export function formatAppointmentTime(isoUtc: string, label: AppointmentTimeLabel): string {
  const d = new Date(isoUtc);
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  if (label === 'parent') {
    return `${dateStr}, ${timeStr} (your time)`;
  }
  const tz = getDeviceTimezone();
  const tzLabel = getTimezoneShortLabel(tz);
  return `${dateStr}, ${timeStr} (${tzLabel})`;
}

/** Format date + time for slot listing with timezone (therapist). */
export function formatSlotTimeWithTz(isoUtc: string): string {
  const d = new Date(isoUtc);
  const tz = getDeviceTimezone();
  const tzLabel = getTimezoneShortLabel(tz);
  return `${d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} (${tzLabel})`;
}
