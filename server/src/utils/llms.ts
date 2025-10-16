import { ChatGroq } from "@langchain/groq";
import { createOpenRouterLLM } from "./open-router";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const chatLlama70B = createOpenRouterLLM({
  modelName: "meta-llama/llama-3.3-70b-instruct",
});

export const chatGptOSS20B = createOpenRouterLLM({
  modelName: "openai/gpt-oss-20b",
});

export const chatGeminiFlash = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.0-flash",
});

export const chatKimiK2 = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "moonshotai/kimi-k2-instruct",
});

export const chatDeepseekChat = createOpenRouterLLM({
  modelName: "deepseek/deepseek-chat-v3-0324:free",
});

export const LLMS = {
  llama70: chatLlama70B,
  gptoss20: chatGptOSS20B,
  gemini2o: chatGeminiFlash,
  deepseekv3: chatDeepseekChat,
  kimik2: chatKimiK2,
};

export type AvailableModels = keyof typeof LLMS;

export const getModel = (modelName: AvailableModels) => {
  return LLMS[modelName];
};
