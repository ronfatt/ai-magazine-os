import type { StructuredEditorialContent } from "@/lib/types/domain";
import type { Database } from "@/lib/types/database";

type JsonValue = Database["public"]["Tables"]["contents"]["Row"]["structured_content"];

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeString(item))
    .filter(Boolean);
}

export function normalizeStructuredEditorialContent(
  value: unknown,
): StructuredEditorialContent {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const sectionsInput = Array.isArray(record.sections) ? record.sections : [];
  const quotesInput = Array.isArray(record.quotes) ? record.quotes : [];
  const suggestedPagesRaw =
    typeof record.suggestedPages === "number"
      ? record.suggestedPages
      : typeof record.suggested_pages === "number"
        ? record.suggested_pages
        : Number(record.suggestedPages ?? record.suggested_pages ?? 1);

  return {
    title: normalizeString(record.title),
    subtitle: normalizeString(record.subtitle),
    summary: normalizeString(record.summary),
    sections: sectionsInput.map((section) => {
      const sectionRecord =
        section && typeof section === "object" && !Array.isArray(section)
          ? (section as Record<string, unknown>)
          : {};

      return {
        heading: normalizeString(sectionRecord.heading),
        summary: normalizeString(sectionRecord.summary),
        keyPoints: normalizeStringArray(
          "keyPoints" in sectionRecord
            ? sectionRecord.keyPoints
            : sectionRecord.key_points,
        ),
      };
    }),
    quotes: quotesInput.map((quote) => {
      const quoteRecord =
        quote && typeof quote === "object" && !Array.isArray(quote)
          ? (quote as Record<string, unknown>)
          : {};

      return {
        quote: normalizeString(quoteRecord.quote),
        speaker:
          quoteRecord.speaker === null
            ? null
            : normalizeString(quoteRecord.speaker || null, "") || null,
        context: normalizeString(quoteRecord.context),
      };
    }),
    suggestedPages:
      Number.isFinite(suggestedPagesRaw) && suggestedPagesRaw > 0
        ? Math.min(12, Math.max(1, Math.round(suggestedPagesRaw)))
        : 1,
    category: normalizeString(record.category),
  };
}

export function structuredContentToDatabaseJson(
  value: StructuredEditorialContent,
): JsonValue {
  return {
    title: value.title,
    subtitle: value.subtitle,
    summary: value.summary,
    sections: value.sections.map((section) => ({
      heading: section.heading,
      summary: section.summary,
      key_points: section.keyPoints,
    })),
    quotes: value.quotes.map((quote) => ({
      quote: quote.quote,
      speaker: quote.speaker,
      context: quote.context,
    })),
    suggested_pages: value.suggestedPages,
    category: value.category,
  } as JsonValue;
}
