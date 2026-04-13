import { AzureOpenAI } from "openai";

let client: AzureOpenAI | null = null;

export function getOpenAIClient(): AzureOpenAI {
  if (!client) {
    client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
    });
  }
  return client;
}

export const DEPLOYMENT_NAME =
  process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
