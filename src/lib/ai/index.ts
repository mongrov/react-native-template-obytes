import type { AIConfig } from '@mongrov/ai';
import { createOpenAI } from '@ai-sdk/openai';
import Env from 'env';

/**
 * Create the OpenAI provider with API key from environment.
 * Falls back to a demo mode if no key is provided.
 */
function createModel() {
  const apiKey = Env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      '[@mongrov/ai] No EXPO_PUBLIC_OPENAI_API_KEY found. AI features will not work.',
    );
    return null;
  }

  const openai = createOpenAI({ apiKey });
  return openai('gpt-4o-mini');
}

const model = createModel();

/**
 * AI configuration for the app.
 * Provides the model and system prompt for chat interactions.
 */
export const aiConfig: AIConfig | null = model
  ? {
      model,
      systemPrompt: `You are a helpful assistant for the Mongrov app. 
Be concise and friendly in your responses.
Help users with their questions about the app and general inquiries.`,
    }
  : null;

export { aiConfig as default };
