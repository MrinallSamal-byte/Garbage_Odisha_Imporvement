export const reportSeverities = ["minor", "moderate", "severe", "critical"] as const;
export const reportStatuses = ["unresolved", "in_progress", "resolved"] as const;
export const wasteTypeKeys = [
  "household",
  "construction_debris",
  "mixed",
  "e_waste",
  "biomedical",
] as const;
export const homeViews = ["map", "list"] as const;

export const severityLabels: Record<(typeof reportSeverities)[number], string> = {
  minor: "Minor",
  moderate: "Moderate",
  severe: "Severe",
  critical: "Critical",
};

export const severityDescriptions: Record<(typeof reportSeverities)[number], string> = {
  minor: "Few bags or scattered litter, less than 1 m².",
  moderate: "Noticeable heap around auto-rickshaw size, about 1 to 5 m³.",
  severe: "Large area along a sidewalk or road edge, about 5 to 20 m³.",
  critical: "Illegal dumpsite occupying a plot or full street edge, more than 20 m³.",
};

export const severityMapColors: Record<(typeof reportSeverities)[number], string> = {
  minor: "#FACC15",
  moderate: "#F59E0B",
  severe: "#F97316",
  critical: "#DC2626",
};

export const severityBadgeClasses: Record<(typeof reportSeverities)[number], string> = {
  minor: "bg-yellow-100 text-yellow-900 border-yellow-200",
  moderate: "bg-amber-100 text-amber-900 border-amber-200",
  severe: "bg-orange-100 text-orange-900 border-orange-200",
  critical: "bg-rose-100 text-rose-900 border-rose-200",
};

export const statusLabels: Record<(typeof reportStatuses)[number], string> = {
  unresolved: "Unresolved",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const statusBadgeClasses: Record<(typeof reportStatuses)[number], string> = {
  unresolved: "bg-slate-100 text-slate-800 border-slate-200",
  in_progress: "bg-sky-100 text-sky-800 border-sky-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const wasteTypeLabels: Record<(typeof wasteTypeKeys)[number], string> = {
  household: "Household waste",
  construction_debris: "Construction debris",
  mixed: "Mixed waste",
  e_waste: "E-waste",
  biomedical: "Biomedical waste",
};

export const partyAcronyms: Record<string, string> = {
  "Bharatiya Janata Party": "BJP",
  "Biju Janata Dal": "BJD",
  "Indian National Congress": "INC",
};
