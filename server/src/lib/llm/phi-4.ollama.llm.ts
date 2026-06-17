import { ChatOllama } from "@langchain/ollama";

const llm = new ChatOllama({
  model: "phi4-mini",
  temperature: 0.2,
  baseUrl: "http://localhost:11434",
});

export async function askOllama(prompt: string): Promise<string> {
  try {
    const response = await llm.invoke(prompt);

    if (typeof response.content === "string") {
      return response.content;
    }

    return JSON.stringify(response.content);
  } catch (error) {
    console.error("Ollama Error:", error);
    throw error;
  }
}