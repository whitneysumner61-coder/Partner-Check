/**
 * Claudex — free, open-source hybrid engine powered by Ollama.
 *
 * Runs on ANY Ollama instance — local or cloud VM (RunPod, Vast.ai, any VPS).
 * Point VITE_OLLAMA_BASE_URL at your cloud VM and it works identically.
 *
 * Two models run in parallel, each playing a distinct role:
 *   DeepSeek-R1   → reasoning engine  (chain-of-thought, the "Claude" side)
 *   Qwen2.5-Coder → structured output engine (precise JSON, the "Codex" side)
 *
 * Results are synthesized into a weighted consensus (R1 60% / Coder 40%).
 *
 * ── Cloud VM setup (one-time) ─────────────────────────────────────────────────
 *  1. Spin up a GPU VM (RunPod / Vast.ai / any VPS with a GPU)
 *  2. Install Ollama:  curl -fsSL https://ollama.com/install.sh | sh
 *  3. Pull models:     ollama pull deepseek-r1 && ollama pull qwen2.5-coder
 *  4. Allow external:  export OLLAMA_HOST=0.0.0.0:11434
 *                      export OLLAMA_ORIGINS=*          # allow browser requests
 *  5. Start server:    ollama serve
 *  6. Open port 11434 in your VM's firewall / security group
 *  7. Set in .env.local:  VITE_OLLAMA_BASE_URL=http://<vm-ip>:11434/v1
 *
 * ── Model size guide ──────────────────────────────────────────────────────────
 *  Mini  → deepseek-r1:1.5b  + qwen2.5-coder:1.5b   (~1 GB each, CPU-friendly)
 *  Bal   → deepseek-r1:7b    + qwen2.5-coder:7b      (~4.7 GB each, default)
 *  Max   → deepseek-r1:70b   + qwen2.5-coder:32b     (40 GB + 20 GB, GPU only)
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

// ─── Health check ────────────────────────────────────────────────────────────

export interface ClaudexHealth {
  reachable: boolean;
  url: string;
  reasonModel: string;
  coderModel: string;
  /** null when unreachable, otherwise list of pulled model names */
  pulledModels: string[] | null;
}

/** Ping the Ollama instance and report which models are available. */
export const checkHealth = async (): Promise<ClaudexHealth> => {
  const base = OLLAMA_BASE_URL.replace(/\/v1\/?$/, "");
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const pulledModels = (data.models ?? []).map((m) => m.name);
    return { reachable: true, url: base, reasonModel: REASON_MODEL, coderModel: CODER_MODEL, pulledModels };
  } catch {
    return { reachable: false, url: base, reasonModel: REASON_MODEL, coderModel: CODER_MODEL, pulledModels: null };
  }
};

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
