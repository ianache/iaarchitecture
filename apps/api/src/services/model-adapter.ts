/*
 ModelAdapter scaffold for Architecture AI
 Path: apps/api/src/services/model-adapter.ts

 Provides a small abstraction over multiple LLM providers (Ollama on‑prem, OpenAI, Claude, Gemini).
 Implementations are minimal and intended as a starting point.
*/

export type EmbedResult = {
  id?: string;
  embedding: number[];
  model: string;
};

export type GenerateResult = {
  text: string;
  tokens?: number;
  model: string;
};

export type EmbedOptions = {
  model?: string;
  maxTokens?: number;
};

export type GenerateOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export interface ModelAdapter {
  embed(text: string, opts?: EmbedOptions): Promise<EmbedResult>;
  generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult>;
  healthcheck?(): Promise<boolean>;
}

export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function extractEmbedding(obj: unknown): number[] | null {
  if (!isObject(obj)) return null;
  // shape: { embedding: number[] }
  if (Array.isArray(obj.embedding) && obj.embedding.every((n) => typeof n === "number")) {
    return obj.embedding as number[];
  }
  // shape: { data: [{ embedding: number[] }] }
  if (Array.isArray(obj.data) && obj.data.length > 0 && isObject(obj.data[0]) && Array.isArray(obj.data[0].embedding) && obj.data[0].embedding.every((n) => typeof n === "number")) {
    return obj.data[0].embedding as number[];
  }
  // shape: { embeddings: number[][] }
  if (Array.isArray(obj.embeddings) && Array.isArray(obj.embeddings[0]) && obj.embeddings[0].every((n: unknown) => typeof n === "number")) {
    return obj.embeddings[0] as number[];
  }
  return null;
}

export function extractText(obj: unknown): string | null {
  if (!isObject(obj)) return null;
  if (typeof obj.output === "string") return obj.output;
  if (typeof obj.result === "string") return obj.result;
  if (Array.isArray(obj.choices) && obj.choices.length > 0 && isObject(obj.choices[0])) {
    const first = obj.choices[0];
    if (isObject(first.message) && typeof first.message.content === "string") return first.message.content;
    if (typeof first.text === "string") return first.text;
  }
  return null;
}

/*
  OllamaAdapter: basic HTTP client for Ollama.
  Expects OLLAMA_URL and optionally OLLAMA_API_KEY in env.
  This implementation calls the /embeddings and /completions endpoints as appropriate for your Ollama version.
*/
export class OllamaAdapter implements ModelAdapter {
  baseUrl: string;
  apiKey?: string | undefined;
  defaultEmbeddingModel: string;
  defaultGenerationModel: string;

  constructor(opts?: { baseUrl?: string; apiKey?: string; embeddingModel?: string; generationModel?: string }) {
    this.baseUrl = opts?.baseUrl ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
    this.apiKey = opts?.apiKey ?? process.env.OLLAMA_API_KEY;
    this.defaultEmbeddingModel = opts?.embeddingModel ?? process.env.EMBEDDING_MODEL ?? "qwen3-embedding:0.6b";
    this.defaultGenerationModel = opts?.generationModel ?? process.env.GENERATION_MODEL ?? "local-gen";
  }

  async embed(text: string, opts?: EmbedOptions): Promise<EmbedResult> {
    const model = opts?.model ?? this.defaultEmbeddingModel;
    const url = `${this.baseUrl}/embed`; // note: adjust if your Ollama exposes a different path
    const body = { model, input: text };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama embed failed: ${res.status} ${txt}`);
    }
    const j = (await res.json()) as unknown;
    const embedding = extractEmbedding(j);
    if (!embedding) throw new Error("Unexpected embedding response from Ollama: " + JSON.stringify(j));
    return { embedding, model };
  }

  async generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult> {
    const model = opts?.model ?? this.defaultGenerationModel;
    const url = `${this.baseUrl}/chat`; // adjust if needed
    const body = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 1024,
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama generate failed: ${res.status} ${txt}`);
    }

    const j = (await res.json()) as unknown;
    const text = extractText(j);
    if (text == null) throw new Error("Unexpected generation response from Ollama: " + JSON.stringify(j));
    return { text: String(text), model };
  }

  async healthcheck(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl + "/models");
      return res.ok;
    } catch (e) {
      return false;
    }
  }
}

/*
  OpenAIAdapter and GenericAdapter stubs: implement later. They are placeholders to show how to add public models.
*/
export class OpenAIAdapter implements ModelAdapter {
  apiKey?: string;
  constructor(opts?: { apiKey?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY;
  }
  async embed(text: string): Promise<EmbedResult> {
    if (!this.apiKey) throw new Error("OpenAI API key not configured");
    const url = "https://api.openai.com/v1/embeddings";
    const body = { model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small", input: text };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`OpenAI embed error: ${res.status}`);
    const j = (await res.json()) as unknown;
    const embedding = extractEmbedding(j);
    if (!embedding) throw new Error("Unexpected embedding response from OpenAI: " + JSON.stringify(j));
    return { embedding, model: body.model } as EmbedResult;
  }
  async generate(prompt: string): Promise<GenerateResult> {
    if (!this.apiKey) throw new Error("OpenAI API key not configured");
    const url = "https://api.openai.com/v1/chat/completions";
    const body = { model: process.env.OPENAI_GENERATION_MODEL ?? "gpt-4o-mini", messages: [{ role: "user", content: prompt }] };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`OpenAI generate error: ${res.status}`);
    const j = (await res.json()) as unknown;
    const text = extractText(j);
    if (text == null) throw new Error("Unexpected generation response from OpenAI: " + JSON.stringify(j));
    return { text: String(text), model: body.model };
  }
}

/*
  Factory helper: create adapter by name
*/
export function createAdapter(name: string, opts?: any): ModelAdapter {
  const lower = name.toLowerCase();
  if (lower.includes("ollama") || (opts?.onPrem ?? false)) return new OllamaAdapter(opts);
  if (lower.includes("openai")) return new OpenAIAdapter(opts);
  // Fallback to Ollama by default
  return new OllamaAdapter(opts);
}
