export const APPLICATION_STATUSES = [
  "DISCOVERED",
  "SAVED",
  "REVIEW",
  "READY",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const DEFAULT_AI_PROVIDER = "ollama";
export const DEFAULT_AI_MODEL = "llama3";

export function formatSalary(min?: number | null, max?: number | null, currency: string = "USD"): string {
  if (!min && !max) return "Not specified";
  const currSymbol = currency === "INR" ? "₹" : "$";
  if (min && max) return `${currSymbol}${min.toLocaleString()} - ${currSymbol}${max.toLocaleString()}`;
  if (min) return `From ${currSymbol}${min.toLocaleString()}`;
  return `Up to ${currSymbol}${max!.toLocaleString()}`;
}
