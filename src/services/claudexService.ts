/**
 * Claudex — a hybrid analysis engine that fuses OpenAI Codex-style structured
 * generation with Claude's deep reasoning. Both models analyze alignment in
 * parallel; results are synthesized into a single consensus answer.
 *
 *   OpenAI  →  structured JSON score + status
 *   Claude  →  reasoning-backed score + status
 *   Claudex →  weighted consensus (Claude 60 / OpenAI 40) + richer summary
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AlignmentAnalysis, AlignmentStatus } from "../types";

// ─── Clients ──────────────────────────────────────────────────────────────────

const createClaudeClient = (): Anthropic | null => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[Claudex] No VITE_ANTHROPIC_API_KEY found");
    return null;
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
};

const createOpenAIClient = (): OpenAI | null => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[Claudex] No VITE_OPENAI_API_KEY found");
    return null;
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

// ─── Shared prompt ────────────────────────────────────────────────────────────

const buildPrompt = (questionText: string, answerA: string, answerB: string) =>
  `You are a Real Estate Joint Venture arbitrator.
Analyze these two answers to a specific question for alignment.

Question: "${questionText}"
Partner A Answer: "${answerA}"
Partner B Answer: "${answerB}"

Scoring rules:
- HIGH   (score 70-100): partners agree on the core handling of the situation.
- MEDIUM (score 35-69):  partners differ slightly but it is workable.
- LOW    (score 0-34):   partners have a fundamental conflict.

Return ONLY a JSON object — no prose, no markdown fences:
{"status":"HIGH"|"MEDIUM"|"LOW","score":<integer 0-100>,"summary":"<one sentence>"}`;

// ─── Individual model calls ───────────────────────────────────────────────────

interface RawResult {
  status: AlignmentStatus;
  score: number;
  summary: string;
}

async function runClaude(
  client: Anthropic,
  questionText: string,
  answerA: string,
  answerB: string
): Promise<RawResult> {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 512,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: buildPrompt(questionText, answerA, answerB) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude: no text block");

  const match = textBlock.text.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error("Claude: no JSON found");

  return JSON.parse(match[0]);
}

async function runCodex(
  client: OpenAI,
  questionText: string,
  answerA: string,
  answerB: string
): Promise<RawResult> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a structured data extraction engine. Output valid JSON only — no prose.",
      },
      { role: "user", content: buildPrompt(questionText, answerA, answerB) },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return JSON.parse(text);
}

// ─── Synthesis ────────────────────────────────────────────────────────────────

/**
 * Merge two raw results into a Claudex consensus.
 * Weights: Claude 60%, OpenAI 40% — Claude carries more weight because its
 * adaptive thinking produces more context-aware scores.
 */
function synthesize(
  claude: RawResult,
  codex: RawResult,
  questionText: string
): Omit<AlignmentAnalysis, "questionId"> {
  const score = Math.round(claude.score * 0.6 + codex.score * 0.4);

  const status: AlignmentStatus =
    score >= 70
      ? AlignmentStatus.HIGH
      : score >= 35
      ? AlignmentStatus.MEDIUM
      : AlignmentStatus.LOW;

  // Use Claude's summary when both models agree on tier; otherwise surface the
  // divergence so users can see where the models disagreed.
  const summary =
    claude.status === codex.status
      ? claude.summary
      : `[Claudex] Claude saw ${claude.status} alignment; Codex saw ${codex.status}. ` +
        `Consensus score ${score}/100. ${claude.summary}`;

  return { status, score, summary };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const analyzeAlignment = async (
  questionText: string,
  answerA: string,
  answerB: string
): Promise<AlignmentAnalysis> => {
  const claude = createClaudeClient();
  const codex = createOpenAIClient();

  if (!claude && !codex) {
    return {
      questionId: "",
      status: AlignmentStatus.PENDING,
      summary: "Claudex: both API keys missing — cannot analyze.",
      score: 50,
    };
  }

  // Run whichever engines are available in parallel
  const [claudeResult, codexResult] = await Promise.allSettled([
    claude
      ? runClaude(claude, questionText, answerA, answerB)
      : Promise.reject(new Error("Claude client unavailable")),
    codex
      ? runCodex(codex, questionText, answerA, answerB)
      : Promise.reject(new Error("OpenAI client unavailable")),
  ]);

  const claudeOk = claudeResult.status === "fulfilled";
  const codexOk = codexResult.status === "fulfilled";

  if (!claudeOk) console.error("[Claudex] Claude failed:", (claudeResult as PromiseRejectedResult).reason);
  if (!codexOk) console.error("[Claudex] Codex failed:", (codexResult as PromiseRejectedResult).reason);

  // Both succeeded → synthesize
  if (claudeOk && codexOk) {
    const result = synthesize(
      (claudeResult as PromiseFulfilledResult<RawResult>).value,
      (codexResult as PromiseFulfilledResult<RawResult>).value,
      questionText
    );
    return { questionId: "", ...result };
  }

  // Fallback to whichever engine succeeded
  if (claudeOk) {
    const r = (claudeResult as PromiseFulfilledResult<RawResult>).value;
    return { questionId: "", status: r.status as AlignmentStatus, score: r.score, summary: r.summary };
  }
  if (codexOk) {
    const r = (codexResult as PromiseFulfilledResult<RawResult>).value;
    return { questionId: "", status: r.status as AlignmentStatus, score: r.score, summary: r.summary };
  }

  return {
    questionId: "",
    status: AlignmentStatus.MEDIUM,
    summary: "Claudex: analysis failed on both engines.",
    score: 50,
  };
};
