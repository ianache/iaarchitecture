import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { extractEmbedding, extractText, OllamaAdapter, OpenAIAdapter } from './model-adapter';

// Mock global fetch
const originalFetch = globalThis.fetch;

describe('model-adapter extractors', () => {
  it('extracts embedding from { embedding }', () => {
    const obj = { embedding: [1, 2, 3] };
    expect(extractEmbedding(obj)).toEqual([1, 2, 3]);
  });

  it('extracts embedding from { data: [{ embedding }] }', () => {
    const obj = { data: [{ embedding: [0.1, 0.2] }] };
    expect(extractEmbedding(obj)).toEqual([0.1, 0.2]);
  });

  it('extracts embedding from { embeddings: [[...]] }', () => {
    const obj = { embeddings: [[42, 43]] };
    expect(extractEmbedding(obj)).toEqual([42, 43]);
  });

  it('returns null for invalid embedding shapes', () => {
    expect(extractEmbedding({})).toBeNull();
    expect(extractEmbedding({ data: [] })).toBeNull();
  });

  it('extracts text from { output }', () => {
    expect(extractText({ output: 'hello' })).toBe('hello');
  });

  it('extracts text from { result }', () => {
    expect(extractText({ result: 'world' })).toBe('world');
  });

  it('extracts text from choices message', () => {
    const obj = { choices: [{ message: { content: 'hi' } }] };
    expect(extractText(obj)).toBe('hi');
  });

  it('extracts text from choices text', () => {
    const obj = { choices: [{ text: 'text' }] };
    expect(extractText(obj)).toBe('text');
  });

  it('returns null for invalid text shapes', () => {
    expect(extractText({})).toBeNull();
  });
});

describe('ModelAdapter (Ollama + OpenAI) basic behavior', () => {
  beforeEach(() => {
    // reset fetch mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('OllamaAdapter.embed should return embedding array', async () => {
    globalThis.fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ embedding: [0.1, 0.2, 0.3] }),
      } as any;
    }) as any;

    const adapter = new OllamaAdapter({ baseUrl: 'http://mock-ollama', embeddingModel: 'm' });
    const res = await adapter.embed('hello world');
    expect(res).toHaveProperty('embedding');
    expect(Array.isArray(res.embedding)).toBe(true);
    expect(res.embedding.length).toBeGreaterThan(0);
  });

  it('OllamaAdapter.generate should return text', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ output: 'generated text' }) } as any)) as any;
    const adapter = new OllamaAdapter({ baseUrl: 'http://mock-ollama', generationModel: 'g' });
    const out = await adapter.generate('prompt');
    expect(out.text).toBe('generated text');
  });

  it('OpenAIAdapter.embed should parse embedding', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ data: [{ embedding: [1, 2, 3] }] }) } as any)) as any;
    const adapter = new OpenAIAdapter({ apiKey: 'sk-test' });
    const res = await adapter.embed('text');
    expect(res.embedding).toEqual([1, 2, 3]);
  });

  it('OpenAIAdapter.generate should parse chat completion', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'hi' } }] }) } as any)) as any;
    const adapter = new OpenAIAdapter({ apiKey: 'sk-test' });
    const out = await adapter.generate('prompt');
    expect(out.text).toBe('hi');
  });
});
<<<<<<< HEAD
import { describe, it, expect } from 'vitest';
import { extractEmbedding, extractText } from './model-adapter';

describe('model-adapter extractors', () => {
  it('extracts embedding from { embedding }', () => {
    const obj = { embedding: [1, 2, 3] };
    expect(extractEmbedding(obj)).toEqual([1, 2, 3]);
  });

  it('extracts embedding from { data: [{ embedding }] }', () => {
    const obj = { data: [{ embedding: [0.1, 0.2] }] };
    expect(extractEmbedding(obj)).toEqual([0.1, 0.2]);
  });

  it('extracts embedding from { embeddings: [[...]] }', () => {
    const obj = { embeddings: [[42, 43]] };
    expect(extractEmbedding(obj)).toEqual([42, 43]);
  });

  it('returns null for invalid embedding shapes', () => {
    expect(extractEmbedding({})).toBeNull();
    expect(extractEmbedding({ data: [] })).toBeNull();
  });

  it('extracts text from { output }', () => {
    expect(extractText({ output: 'hello' })).toBe('hello');
  });

  it('extracts text from { result }', () => {
    expect(extractText({ result: 'world' })).toBe('world');
  });

  it('extracts text from choices message', () => {
    const obj = { choices: [{ message: { content: 'hi' } }] };
    expect(extractText(obj)).toBe('hi');
  });

  it('extracts text from choices text', () => {
    const obj = { choices: [{ text: 'text' }] };
    expect(extractText(obj)).toBe('text');
  });

  it('returns null for invalid text shapes', () => {
    expect(extractText({})).toBeNull();
=======
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OllamaAdapter, OpenAIAdapter } from './model-adapter';

// Mock global fetch
const originalFetch = globalThis.fetch;

describe('ModelAdapter (Ollama + OpenAI) basic behavior', () => {
  beforeEach(() => {
    // reset fetch mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('OllamaAdapter.embed should return embedding array', async () => {
    globalThis.fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ embedding: [0.1, 0.2, 0.3] }),
      } as any;
    }) as any;

    const adapter = new OllamaAdapter({ baseUrl: 'http://mock-ollama', embeddingModel: 'm' });
    const res = await adapter.embed('hello world');
    expect(res).toHaveProperty('embedding');
    expect(Array.isArray(res.embedding)).toBe(true);
    expect(res.embedding.length).toBeGreaterThan(0);
  });

  it('OllamaAdapter.generate should return text', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ output: 'generated text' }) } as any)) as any;
    const adapter = new OllamaAdapter({ baseUrl: 'http://mock-ollama', generationModel: 'g' });
    const out = await adapter.generate('prompt');
    expect(out.text).toBe('generated text');
  });

  it('OpenAIAdapter.embed should parse embedding', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ data: [{ embedding: [1, 2, 3] }] }) } as any)) as any;
    const adapter = new OpenAIAdapter({ apiKey: 'sk-test' });
    const res = await adapter.embed('text');
    expect(res.embedding).toEqual([1, 2, 3]);
  });

  it('OpenAIAdapter.generate should parse chat completion', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'hi' } }] }) } as any)) as any;
    const adapter = new OpenAIAdapter({ apiKey: 'sk-test' });
    const out = await adapter.generate('prompt');
    expect(out.text).toBe('hi');
>>>>>>> origin/master
  });
});
