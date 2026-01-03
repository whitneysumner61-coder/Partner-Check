import { GoogleGenAI, Type } from "@google/genai";
import { AlignmentAnalysis, AlignmentStatus } from "../types";

const createClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("No VITE_GEMINI_API_KEY found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeAlignment = async (
  questionText: string,
  answerA: string,
  answerB: string
): Promise<AlignmentAnalysis> => {
  const ai = createClient();
  
  if (!ai) {
    // Mock response if no API key is present (for development safety)
    return {
      questionId: 'unknown',
      status: AlignmentStatus.PENDING,
      summary: "API Key Missing - Cannot analyze.",
      score: 50
    };
  }

  const prompt = `
    You are a Real Estate Joint Venture arbitrator. 
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
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING }
          },
          required: ["status", "score", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');

    return {
      questionId: '', // Set by caller
      status: result.status as AlignmentStatus,
      score: result.score,
      summary: result.summary
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      questionId: '',
      status: AlignmentStatus.MEDIUM,
      summary: "Error analyzing response.",
      score: 50
    };
  }
};