import { Configuration, OpenAIApi } from 'openai-edge';

export const openAIConfig = new Configuration({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(openAIConfig);

// the default model to use
export const OPENAI_MODEL_DEFAULT = import.meta.env.OPENAI_MODEL_DEFAULT || 'gpt-3.5-turbo';

export type Docs = {
  id: string;
  title: string;
  description: string;
  domain: string;
  url: string;
  similarity: number;
};
