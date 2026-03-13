import "server-only";

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openaiClient;
}
