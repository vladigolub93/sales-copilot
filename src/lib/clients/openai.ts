import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}


export type OpenAIResponse = Awaited<ReturnType<OpenAI['responses']['create']>>;

export function extractOutputText(response: unknown): string | undefined {
  if (response && typeof response === 'object' && 'output_text' in (response as Record<string, unknown>)) {
    const value = (response as { output_text?: string | null }).output_text;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}
