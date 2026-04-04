import Anthropic from "@anthropic-ai/sdk";
import { AlignmentAnalysis, AlignmentStatus } from "../types";

const createClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("No VITE_ANTHROPIC_API_KEY found in environment variables");
    return null;
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
};

export const analyzeAlignment = async (
  questionText: string,
  answerA: string,
  answerB: string
): Promise<AlignmentAnalysis> => {
  const client = createClient();

  if (!client) {
    return {
      questionId: "unknown",
      status: AlignmentStatus.PENDING,
      summary: "API Key Missing - Cannot analyze.",
      score: 50,
    };
  }

  const prompt = `You are a Real Estate Joint Venture arbitrator.
Analyze these two answers to a specific question for alignment.

Question: "${questionText}"

Partner A Answer: "${answerA}"
Partner B Answer: "${answerB}"

Determine if these partners are aligned.
- HIGH alignment means they agree on the core handling of the situation.
- MEDIUM alignment means they differ slightly but it's workable.
- LOW alignment means they have a fundamental conflict (e.g., one says "Capital Call" and the other says "Never Capital Call").

Provide a score from 0 (Total Conflict) to 100 (Perfect Alignment).
Provide a short 1-sentence summary of the conflict or agreement.

Respond with JSON only in this exact format:
{"status": "HIGH" | "MEDIUM" | "LOW", "score": <integer 0-100>, "summary": "<one sentence>"}`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in response");
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      questionId: "",
      status: result.status as AlignmentStatus,
      score: result.score,
      summary: result.summary,
    };
  } catch (error) {
    console.error("Claude Analysis Error:", error);
    return {
      questionId: "",
      status: AlignmentStatus.MEDIUM,
      summary: "Error analyzing response.",
      score: 50,
    };
  }
};
