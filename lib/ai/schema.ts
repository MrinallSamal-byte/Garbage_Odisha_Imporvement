import { z } from "zod";

import { aiEnvironmentTypes, aiGarbageSeverities, aiGpsConsistencyLevels, aiIssueTypes, aiLanguages } from "@/types/domain";

export const reportAiSummarySchema = z.object({
  issue_detected: z.boolean(),
  issue_type: z.enum(aiIssueTypes),
  confidence_score: z.number().min(0).max(1),
  visible_landmarks: z.array(z.string()),
  detected_text: z.array(z.string()),
  language_detected: z.enum(aiLanguages),
  likely_environment: z.enum(aiEnvironmentTypes),
  garbage_severity: z.enum(aiGarbageSeverities),
  gps_image_consistency: z.enum(aiGpsConsistencyLevels),
  suspicious_flag: z.boolean(),
  moderation_notes: z.string(),
  locality_clues: z.array(z.string()),
});

export type ReportAiSummaryPayload = z.infer<typeof reportAiSummarySchema>;
