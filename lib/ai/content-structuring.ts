import "server-only";

import {
  normalizeStructuredEditorialContent,
  structuredContentToDatabaseJson,
} from "@/lib/content/structured-content";
import type { StructuredEditorialContent } from "@/lib/types/domain";

import { getOpenAIClient } from "@/lib/ai/openai";

export const STRUCTURED_EDITORIAL_JSON_SCHEMA = {
  name: "structured_editorial_content",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "subtitle",
      "summary",
      "sections",
      "quotes",
      "suggested_pages",
      "category",
    ],
    properties: {
      title: { type: "string" },
      subtitle: { type: "string" },
      summary: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["heading", "summary", "key_points"],
          properties: {
            heading: { type: "string" },
            summary: { type: "string" },
            key_points: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
      quotes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["quote", "speaker", "context"],
          properties: {
            quote: { type: "string" },
            speaker: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            context: { type: "string" },
          },
        },
      },
      suggested_pages: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
      category: { type: "string" },
    },
  },
  strict: true,
} as const;

export function buildContentStructuringPrompt(input: {
  contentType: string;
  title: string;
  rawText: string;
}) {
  return [
    "You are structuring uploaded editorial source text for a magazine publishing system.",
    "Return a concise editorial JSON representation for downstream layout planning.",
    "Do not invent facts that are not grounded in the source text.",
    "If the source title is weak, improve it while staying faithful to the content.",
    "Suggested pages should reflect likely magazine layout length, not article word count alone.",
    "",
    `Source content type: ${input.contentType}`,
    `Source title: ${input.title}`,
    "",
    "Raw text:",
    input.rawText,
  ].join("\n");
}

function parseStructuredOutput(outputText: string): StructuredEditorialContent {
  return normalizeStructuredEditorialContent(JSON.parse(outputText));
}

export async function structureTextContentWithOpenAI(input: {
  contentType: string;
  title: string;
  rawText: string;
}) {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || "gpt-4.1";

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "Structure editorial text into a compact JSON object for magazine planning.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildContentStructuringPrompt(input),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        ...STRUCTURED_EDITORIAL_JSON_SCHEMA,
      },
    },
  });

  const outputText = response.output_text;

  if (!outputText) {
    throw new Error("OpenAI returned no structured output.");
  }

  return {
    model,
    provider: "openai",
    structuredContent: parseStructuredOutput(outputText),
    structuredContentJson: structuredContentToDatabaseJson(parseStructuredOutput(outputText)),
  };
}
