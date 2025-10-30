import { ChatOpenAI } from "@langchain/openai";

interface OpenRouterConfig {
  modelName: string;
}

export const createOpenRouterLLM = ({
  modelName,
}: OpenRouterConfig): ChatOpenAI => {
  const config = {
    model: modelName,
    configuration: {
      baseURL: process.env.OPENROUTER_BASE_URL!,
      apiKey: process.env.OPENROUTER_API_KEY!,
    },
  };
  return new ChatOpenAI(config);
};
