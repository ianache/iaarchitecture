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
  });
});
