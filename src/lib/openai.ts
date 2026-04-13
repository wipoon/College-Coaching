import { AzureOpenAI } from "openai";

let client: AzureOpenAI | null = null;

/** Returns true when real Azure OpenAI credentials are configured */
export function isOpenAIConfigured(): boolean {
  const key = process.env.AZURE_OPENAI_API_KEY ?? "";
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT ?? "";
  return (
    key.length > 0 &&
    !key.startsWith("your-") &&
    endpoint.length > 0 &&
    !endpoint.includes("your-resource")
  );
}

export function getOpenAIClient(): AzureOpenAI | null {
  if (!isOpenAIConfigured()) return null;
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
