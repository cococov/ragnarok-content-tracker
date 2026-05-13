import type { CooldownCategory, TrackerItem } from "./types";

export function getResetTime(doneAt: number, cdSeconds: number) {
  if (cdSeconds < 86400) return doneAt + cdSeconds * 1000;

  const resetBase = new Date(doneAt);
  resetBase.setUTCHours(resetBase.getUTCHours() - 7);
  resetBase.setUTCHours(0, 0, 0, 0);
  resetBase.setUTCHours(7, 0, 0, 0);
  const resetCount = Math.ceil(cdSeconds / 86400);
  resetBase.setUTCDate(resetBase.getUTCDate() + resetCount);
  return resetBase.getTime();
}

export function remaining(doneAt: number | null | undefined, cdSeconds: number) {
  if (!doneAt) return -1;
  return Math.floor((getResetTime(doneAt, cdSeconds) - Date.now()) / 1000);
}

export function fmt(seconds: number) {
  if (seconds <= 0) return "Disponible";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function mapCooldown(category: CooldownCategory): Pick<TrackerItem, "cd" | "cdLabel"> {
  switch (category) {
    case "3h":
      return { cd: 3 * 3600, cdLabel: "3 horas" };
    case "12h":
      return { cd: 12 * 3600, cdLabel: "12 horas" };
    case "3_days":
      return { cd: 3 * 24 * 3600, cdLabel: "3 días" };
    case "7_days":
      return { cd: 7 * 24 * 3600, cdLabel: "7 días" };
    default:
      return { cd: 24 * 3600, cdLabel: "1 día" };
  }
}

export function getNextResetLabel(nowMs: number) {
  const nowDate = new Date(nowMs);
  const nextReset = new Date(nowDate);
  nextReset.setUTCHours(nextReset.getUTCHours() - 7);
  nextReset.setUTCHours(0, 0, 0, 0);
  nextReset.setUTCHours(7, 0, 0, 0);
  nextReset.setUTCDate(nextReset.getUTCDate() + 1);

  return fmt(Math.floor((nextReset.getTime() - nowDate.getTime()) / 1000));
}
