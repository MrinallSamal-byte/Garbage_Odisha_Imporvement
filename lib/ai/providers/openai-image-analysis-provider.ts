import "server-only";

import { env } from "@/lib/env";
import { reportAiSummarySchema } from "@/lib/ai/schema";
import { AppError } from "@/lib/utils/errors";
import type { ReportAiSummary } from "@/types/domain";

import type { AnalyzeImageContext, ImageAnalysisProvider } from "@/lib/ai/report-image-analyzer";

export class OpenAiImageAnalysisProvider implements ImageAnalysisProvider {
  async analyze(context: AnalyzeImageContext): Promise<ReportAiSummary> {
    if (!env.OPENAI_API_KEY) {
      throw new AppError("OPENAI_API_KEY is required when AI_PROVIDER=openai.", 500);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "report_image_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                issue_detected: { type: "boolean" },
                issue_type: {
                  type: "string",
                  enum: ["garbage", "overflow", "drain", "roadside_dump", "mixed_waste", "litter", "other"],
                },
                confidence_score: { type: "number", minimum: 0, maximum: 1 },
                visible_landmarks: { type: "array", items: { type: "string" } },
                detected_text: { type: "array", items: { type: "string" } },
                language_detected: { type: "string", enum: ["odia", "english", "mixed", "unknown"] },
                likely_environment: {
                  type: "string",
                  enum: ["residential", "roadside", "market", "institution", "public_space", "rural", "unknown"],
                },
                garbage_severity: { type: "string", enum: ["low", "medium", "high"] },
                gps_image_consistency: { type: "string", enum: ["high", "medium", "low"] },
                suspicious_flag: { type: "boolean" },
                moderation_notes: { type: "string" },
                locality_clues: { type: "array", items: { type: "string" } }
              },
              required: [
                "issue_detected",
                "issue_type",
                "confidence_score",
                "visible_landmarks",
                "detected_text",
                "language_detected",
                "likely_environment",
                "garbage_severity",
                "gps_image_consistency",
                "suspicious_flag",
                "moderation_notes",
                "locality_clues"
              ]
            }
          }
        },
        messages: [
          {
            role: "system",
            content:
              "You analyze civic cleanliness report photos. Do not infer exact coordinates from the image. Use the provided GPS area only to assess visual consistency, landmarks, locality clues, text, and moderation risk.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  `GPS area: ${context.reverseGeocodeResult.formattedLabel}`,
                  `Citizen description: ${context.reportInput.description ?? "None provided"}`,
                  `GPS accuracy meters: ${context.reportInput.gpsAccuracyMeters}`,
                  "Return only the schema-compliant JSON.",
                ].join("\n"),
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${context.mimeType};base64,${context.imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new AppError("OpenAI image analysis failed.", 502, await response.text());
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new AppError("OpenAI response did not include a usable analysis payload.", 502);
    }

    const parsed = reportAiSummarySchema.parse(JSON.parse(rawContent));

    return {
      issueDetected: parsed.issue_detected,
      issueType: parsed.issue_type,
      confidenceScore: parsed.confidence_score,
      visibleLandmarks: parsed.visible_landmarks,
      detectedText: parsed.detected_text,
      languageDetected: parsed.language_detected,
      likelyEnvironment: parsed.likely_environment,
      garbageSeverity: parsed.garbage_severity,
      gpsImageConsistency: parsed.gps_image_consistency,
      suspiciousFlag: parsed.suspicious_flag,
      moderationNotes: parsed.moderation_notes,
      localityClues: parsed.locality_clues,
    };
  }
}
