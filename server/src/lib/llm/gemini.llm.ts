import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite",
  temperature: 0.2,
  apiKey: process.env.GOOGLE_API_KEY,
});

export function getGeminiLLM() {
  return llm;
}

export async function askGemini(prompt: string): Promise<string> {
  try {
    const response = await llm.invoke(prompt);

    if (typeof response.content === "string") {
      return response.content;
    }

    return JSON.stringify(response.content);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
