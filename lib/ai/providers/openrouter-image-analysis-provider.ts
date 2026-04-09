import { env } from "@/lib/env";
import { reportAiSummarySchema } from "@/lib/ai/schema";
import { AppError } from "@/lib/utils/errors";
import type { ReportAiSummary } from "@/types/domain";

import type { AnalyzeImageContext, ImageAnalysisProvider } from "@/lib/ai/report-image-analyzer";

function extractJsonObject(input: string) {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = input.indexOf("{");
  const lastBrace = input.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return input.slice(firstBrace, lastBrace + 1);
  }

  return input;
}

export class OpenRouterImageAnalysisProvider implements ImageAnalysisProvider {
  async analyze(context: AnalyzeImageContext): Promise<ReportAiSummary> {
    if (!env.OPENROUTER_API_KEY) {
      throw new AppError("OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter.", 500);
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
        "X-Title": "SafaOdisha",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "You analyze civic cleanliness report photos. Never infer exact coordinates from the image. Use the provided GPS area only for consistency checks, locality clues, OCR, and moderation guidance. Return JSON only.",
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
                  "Return this exact JSON shape with snake_case keys:",
                  JSON.stringify({
                    issue_detected: true,
                    issue_type: "garbage",
                    confidence_score: 0.91,
                    visible_landmarks: ["market gate"],
                    detected_text: ["Ward 31"],
                    language_detected: "mixed",
                    likely_environment: "roadside",
                    garbage_severity: "high",
                    gps_image_consistency: "medium",
                    suspicious_flag: false,
                    moderation_notes: "Short moderation summary.",
                    locality_clues: ["Nayapalli"],
                  }),
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
      throw new AppError("OpenRouter image analysis failed.", 502, await response.text());
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    const rawContent = Array.isArray(content)
      ? content
          .map((entry) => entry.text ?? "")
          .join("\n")
          .trim()
      : content?.trim();

    if (!rawContent) {
      throw new AppError("OpenRouter response did not include a usable analysis payload.", 502);
    }

    const parsed = reportAiSummarySchema.parse(JSON.parse(extractJsonObject(rawContent)));

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
