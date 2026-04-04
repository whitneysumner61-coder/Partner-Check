/**
 * Claudex — free, open-source, zero-API-key hybrid engine powered by Ollama.
 *
 * Two local models run in parallel, each playing a distinct role:
 *
 *   DeepSeek-R1  →  reasoning engine  (chain-of-thought, the "Claude" side)
 *   Qwen2.5-Coder → structured output engine  (precise JSON, the "Codex" side)
 *
 * Results are synthesized into a weighted consensus (R1 60% / Coder 40%).
 *
 * Prerequisites (one-time setup):
 *   brew install ollama          # or https://ollama.com/download
 *   ollama pull deepseek-r1      # reasoning model (~4.7 GB for 7B)
 *   ollama pull qwen2.5-coder    # coding / structured-output model (~4.7 GB)
 *   ollama serve                 # starts local server on :11434
 *
 * Smaller/larger variants:
 *   deepseek-r1:1.5b  (fastest, ~1 GB)   →  deepseek-r1:70b  (most powerful, ~40 GB)
 *   qwen2.5-coder:1.5b                   →  qwen2.5-coder:32b
 */

import OpenAI from "openai";
import { AlignmentAnalysis, AlignmentStatus } from "../types";

// ─── Config ───────────────────────────────────────────────────────────────────

const OLLAMA_BASE_URL =
  (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined) ??
  "http://localhost:11434/v1";

/**
 * Model used for the reasoning pass (DeepSeek-R1 family).
 * Override via VITE_CLAUDEX_REASON_MODEL in .env.local
 * Recommended: deepseek-r1:7b (balanced) or deepseek-r1:70b (max power)
 */
const REASON_MODEL =
  (import.meta.env.VITE_CLAUDEX_REASON_MODEL as string | undefined) ??
  "deepseek-r1";

/**
 * Model used for the structured-output pass (Qwen2.5-Coder family).
 * Override via VITE_CLAUDEX_CODER_MODEL in .env.local
 * Recommended: qwen2.5-coder:7b (balanced) or qwen2.5-coder:32b (max power)
 */
const CODER_MODEL =
  (import.meta.env.VITE_CLAUDEX_CODER_MODEL as string | undefined) ??
  "qwen2.5-coder";

// ─── Ollama client (OpenAI-compatible endpoint) ───────────────────────────────

/**
 * Ollama exposes an OpenAI-compatible REST API at /v1.
 * The openai SDK works against it with a dummy API key.
 */
const client = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama", // Ollama ignores the key; value must be non-empty
  dangerouslyAllowBrowser: true,
});

// ─── Shared prompt ────────────────────────────────────────────────────────────

const buildPrompt = (
  questionText: string,
  answerA: string,
  answerB: string
) => `You are a Real Estate Joint Venture arbitrator.
Analyze the two partner answers below for alignment.

Question: "${questionText}"
Partner A Answer: "${answerA}"
Partner B Answer: "${answerB}"

Scoring rules:
- HIGH   (70-100): partners agree on the core approach.
- MEDIUM (35-69):  partners differ slightly but it is workable.
- LOW    (0-34):   partners have a fundamental conflict.

Return ONLY a raw JSON object — no prose, no markdown, no code fences:
{"status":"HIGH"|"MEDIUM"|"LOW","score":<integer 0-100>,"summary":"<one sentence>"}`;

// ─── Individual engine calls ───────────────────────────────────────────────────

interface RawResult {
  status: AlignmentStatus;
  score: number;
  summary: string;
}

/** DeepSeek-R1: reasoning pass. Strips <think>…</think> blocks before parsing. */
async function runReasoningEngine(
  questionText: string,
  answerA: string,
  answerB: string
): Promise<RawResult> {
  const response = await client.chat.completions.create({
    model: REASON_MODEL,
    temperature: 0.2, // slight warmth for natural summaries
    messages: [
      {
        role: "system",
        content:
          "You are a precise arbitrator. Think carefully, then output only a JSON object.",
      },
      { role: "user", content: buildPrompt(questionText, answerA, answerB) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  // DeepSeek-R1 wraps its chain-of-thought in <think>…</think> — strip it
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const match = stripped.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error(`R1: no JSON found in: ${stripped.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

/** Qwen2.5-Coder: structured-output pass. Strict JSON, temperature=0. */
async function runCoderEngine(
  questionText: string,
  answerA: string,
  answerB: string
): Promise<RawResult> {
  const response = await client.chat.completions.create({
    model: CODER_MODEL,
    temperature: 0,
    format: "json", // Ollama JSON mode — keeps output strictly valid JSON
    messages: [
      {
        role: "system",
        content:
          "You are a structured data extraction engine. Output valid JSON only — no prose.",
      },
      { role: "user", content: buildPrompt(questionText, answerA, answerB) },
    ],
  } as Parameters<typeof client.chat.completions.create>[0]);

  const raw = response.choices[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error(`Coder: no JSON found in: ${raw.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

// ─── Synthesis ────────────────────────────────────────────────────────────────

/**
 * Merge the two engine results into a Claudex consensus.
 * DeepSeek-R1 carries 60% weight (richer reasoning),
 * Qwen2.5-Coder carries 40% (precise scoring discipline).
 */
function synthesize(
  reason: RawResult,
  coder: RawResult
): Omit<AlignmentAnalysis, "questionId"> {
  const score = Math.round(reason.score * 0.6 + coder.score * 0.4);

  const status: AlignmentStatus =
    score >= 70
      ? AlignmentStatus.HIGH
      : score >= 35
      ? AlignmentStatus.MEDIUM
      : AlignmentStatus.LOW;

  const summary =
    reason.status === coder.status
      ? reason.summary // both agree → use the richer reasoning summary
      : `[Claudex] R1 saw ${reason.status} alignment; Coder saw ${coder.status}. ` +
        `Consensus ${score}/100. ${reason.summary}`;

  return { status, score, summary };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const analyzeAlignment = async (
  questionText: string,
  answerA: string,
  answerB: string
): Promise<AlignmentAnalysis> => {
  const [reasonResult, coderResult] = await Promise.allSettled([
    runReasoningEngine(questionText, answerA, answerB),
    runCoderEngine(questionText, answerA, answerB),
  ]);

  const reasonOk = reasonResult.status === "fulfilled";
  const coderOk = coderResult.status === "fulfilled";

  if (!reasonOk)
    console.error(
      "[Claudex] DeepSeek-R1 failed:",
      (reasonResult as PromiseRejectedResult).reason
    );
  if (!coderOk)
    console.error(
      "[Claudex] Qwen2.5-Coder failed:",
      (coderResult as PromiseRejectedResult).reason
    );

  // Both succeeded → full synthesis
  if (reasonOk && coderOk) {
    const result = synthesize(
      (reasonResult as PromiseFulfilledResult<RawResult>).value,
      (coderResult as PromiseFulfilledResult<RawResult>).value
    );
    return { questionId: "", ...result };
  }

  // Fallback to whichever engine succeeded
  if (reasonOk) {
    const r = (reasonResult as PromiseFulfilledResult<RawResult>).value;
    return { questionId: "", status: r.status, score: r.score, summary: r.summary };
  }
  if (coderOk) {
    const r = (coderResult as PromiseFulfilledResult<RawResult>).value;
    return { questionId: "", status: r.status, score: r.score, summary: r.summary };
  }

  // Both failed — likely Ollama isn't running
  return {
    questionId: "",
    status: AlignmentStatus.PENDING,
    summary:
      "Claudex: Ollama is not running. Start it with `ollama serve` and ensure both models are pulled.",
    score: 50,
  };
};
