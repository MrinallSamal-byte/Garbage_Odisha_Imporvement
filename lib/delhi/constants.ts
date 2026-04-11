export const delhiSeverities = ["minor", "moderate", "severe", "critical"] as const;
export const delhiStatuses = [
  "unresolved",
  "in_progress",
  "pending_verification",
  "resolved",
] as const;
export const delhiWasteTypes = [
  "household_waste",
  "construction_debris",
  "mixed_waste",
  "e_waste",
  "biomedical",
  "other",
] as const;
export const delhiViews = ["map", "list"] as const;

export const severityLabels: Record<(typeof delhiSeverities)[number], string> = {
  minor: "Minor",
  moderate: "Moderate",
  severe: "Severe",
  critical: "Critical",
};

export const severityDescriptions: Record<(typeof delhiSeverities)[number], string> = {
  minor: "Small scattered garbage or a few bags.",
  moderate: "Noticeable heap in a limited area.",
  severe: "Large roadside pile or recurring open dump.",
  critical: "Major dump, blockage, unsafe spread, or illegal dumpsite.",
};

export const severityColors: Record<(typeof delhiSeverities)[number], string> = {
  minor: "#FACC15",
  moderate: "#F59E0B",
  severe: "#F97316",
  critical: "#DC2626",
};

export const severityBadgeClasses: Record<(typeof delhiSeverities)[number], string> = {
  minor: "border-yellow-200 bg-yellow-100 text-yellow-900",
  moderate: "border-amber-200 bg-amber-100 text-amber-900",
  severe: "border-orange-200 bg-orange-100 text-orange-900",
  critical: "border-rose-200 bg-rose-100 text-rose-900",
};

export const statusLabels: Record<(typeof delhiStatuses)[number], string> = {
  unresolved: "Unresolved",
  in_progress: "In Progress",
  pending_verification: "Pending Verification",
  resolved: "Resolved",
};

export const statusBadgeClasses: Record<(typeof delhiStatuses)[number], string> = {
  unresolved: "border-slate-200 bg-slate-100 text-slate-800",
  in_progress: "border-sky-200 bg-sky-100 text-sky-800",
  pending_verification: "border-violet-200 bg-violet-100 text-violet-900",
  resolved: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

export const wasteTypeLabels: Record<(typeof delhiWasteTypes)[number], string> = {
  household_waste: "Household Waste",
  construction_debris: "Construction Debris",
  mixed_waste: "Mixed Waste",
  e_waste: "E-Waste",
  biomedical: "Biomedical",
  other: "Other",
};
