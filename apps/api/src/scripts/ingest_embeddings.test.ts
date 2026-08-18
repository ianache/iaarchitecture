import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DatabaseSync } from 'node:sqlite';
import { reindexMain } from './ingest_embeddings';

describe('ingest_embeddings integration (reindexMain) with mock adapter', () => {
  it('indexes non-sensitive files, skips sensitive, respects idempotency and --force', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ia-test-'));
    const knowledgeDir = path.join(tmp, 'knowledge');
    await fs.mkdir(knowledgeDir, { recursive: true });

    const file1 = path.join(knowledgeDir, 'doc1.md');
    const content1 = `---\ntitle: doc1\n---\nThis is a test document.`;
    await fs.writeFile(file1, content1, 'utf8');

    const file2 = path.join(knowledgeDir, 'secret.md');
    const content2 = `---\ntitle: secret\nsensitivity: true\n---\nTop secret content.`;
    await fs.writeFile(file2, content2, 'utf8');

    const sqlitePath = path.join(tmp, 'test.sqlite');

    const mockAdapter = {
      embed: async (text: string) => ({ embedding: [0.1, 0.2, 0.3], model: 'mock' }),
    } as any;

    // First run: should process 1 file (doc1.md)
    const res1 = await reindexMain({ knowledgePath: knowledgeDir, revision: 'HEAD', batchSize: 8, force: false }, sqlitePath, mockAdapter);
    expect(res1).toHaveProperty('processed');
    expect(res1.processed).toBe(1);

    // Check DB has one entry
    const db1 = new DatabaseSync(sqlitePath);
    const row1 = db1.prepare('SELECT COUNT(*) as c FROM embeddings').get();
    expect(row1.c).toBe(1);

    const entry = db1.prepare('SELECT * FROM embeddings LIMIT 1').get();
    expect(entry.file_path).toBe(file1);
    expect(typeof entry.embedding_json).toBe('string');
    const parsed = JSON.parse(entry.embedding_json);
    expect(Array.isArray(parsed)).toBe(true);
    db1.close();

    // Second run (same revision, no force): processed should be 0
    const res2 = await reindexMain({ knowledgePath: knowledgeDir, revision: 'HEAD', batchSize: 8, force: false }, sqlitePath, mockAdapter);
    expect(res2.processed).toBe(0);

    // Third run with force: should reprocess 1
    const res3 = await reindexMain({ knowledgePath: knowledgeDir, revision: 'HEAD', batchSize: 8, force: true }, sqlitePath, mockAdapter);
    expect(res3.processed).toBe(1);

    // Cleanup
    await fs.rm(tmp, { recursive: true, force: true });
  });
});
