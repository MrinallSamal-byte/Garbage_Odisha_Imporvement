import { z } from "zod";

import {
  moderationStatuses,
  reportCategories,
  reportSeverities,
  reportStatuses,
  representativeTypes,
  sourceTypes,
} from "@/types/domain";

export const analyzeRequestSchema = z.object({
  latitude: z.coerce.number().min(17).max(23),
  longitude: z.coerce.number().min(81).max(88),
  gpsAccuracyMeters: z.coerce.number().min(0).max(5000),
  captureTimestamp: z.string().datetime(),
  description: z.string().trim().max(2000).optional(),
  sourceType: z.enum(sourceTypes).default("LIVE_CAPTURE"),
});

export const submitReportSchema = z.object({
  previewToken: z.string().min(24),
  description: z.string().trim().min(5).max(2500),
  anonymousFlag: z.coerce.boolean().default(true),
});

export const reportFiltersSchema = z.object({
  district: z.string().trim().optional(),
  constituency: z.string().trim().optional(),
  category: z.enum(reportCategories).optional(),
  status: z.enum(reportStatuses).optional(),
  severity: z.enum(reportSeverities).optional(),
  sourceType: z.enum(sourceTypes).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const commentSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(1200),
});

export const voteSchema = z.object({
  sessionKey: z.string().trim().min(8).max(120),
});

export const byPointSchema = z.object({
  lat: z.coerce.number().min(17).max(23),
  lng: z.coerce.number().min(81).max(88),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const adminStatusSchema = z.object({
  status: z.enum(reportStatuses),
  note: z.string().trim().min(2).max(1000),
});

export const adminModerationSchema = z.object({
  moderationStatus: z.enum(moderationStatuses),
  reason: z.string().trim().min(2).max(1000),
});

export const representativeUpsertSchema = z.object({
  representativeType: z.enum(representativeTypes),
  name: z.string().trim().min(2).max(140),
  partyName: z.string().trim().min(2).max(140),
  isStateRulingParty: z.coerce.boolean(),
  isCentralRulingParty: z.coerce.boolean(),
  assemblyConstituencyId: z.string().uuid().nullable().optional(),
  parliamentConstituencyId: z.string().uuid().nullable().optional(),
  officialRoleTitle: z.string().trim().max(140).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  oppositionLabel: z.string().trim().max(120).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  active: z.coerce.boolean().default(true),
  termStart: z.string().datetime().nullable().optional(),
  termEnd: z.string().datetime().nullable().optional(),
});
