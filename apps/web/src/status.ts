export type BadgeTone = "amber" | "green" | "neutral" | "rose";

const TONE_BY_STATUS: Record<string, BadgeTone> = {
  DRAFT: "amber",
  REVIEWED: "amber",
  IN_REVIEW: "amber",
  UNDER_REVIEW: "amber",
  RUNNING: "neutral",
  APPROVED: "green",
  MERGED: "green",
  PUBLISHED: "green",
  COMPLETE: "green",
  INCOMPLETE: "rose",
  REJECTED: "rose"
};

export function badgeTone(status: string): BadgeTone {
  return TONE_BY_STATUS[status.toUpperCase()] ?? "neutral";
}

export function badgeClassName(status: string): string {
  return `badge badge-${badgeTone(status)}`;
}
