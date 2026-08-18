#!/usr/bin/env node
// scripts/ingest_embeddings.mjs
// Simple reindex script: walks knowledge/ directory, extracts OKF frontmatter, and stores embeddings in SQLite.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Dynamic import for better-sqlite3 (optional) - user must install dependency
let Database;
try {
  const mod = await import('better-sqlite3');
  Database = mod.default;
} catch (e) {
  console.error('Please install better-sqlite3 to use the ingest script: pnpm add -D better-sqlite3');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = process.argv.slice(2);

function parseArg(flag, defaultValue) {
  const idx = argv.findIndex(a => a === flag);
  if (idx === -1) return defaultValue;
  const val = argv[idx + 1];
  return val ?? defaultValue;
}

const knowledgePath = parseArg('--knowledge-path', './knowledge');
const revision = parseArg('--revision', 'HEAD');
const batchSize = Number(parseArg('--batch-size', '8'));
const force = argv.includes('--force');

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const SQLITE_PATH = process.env.SQLITE_PATH ?? '.architecture-ai/architecture-ai.sqlite';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'local-embed';

function uuidv4() {
  // simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const inner = await walkDir(full);
      files.push(...inner);
    } else if (ent.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function parseFrontmatter(content) {
  const fmRegex = /^---\n([\s\S]*?)\n---/;
  const m = content.match(fmRegex);
  if (!m) return {};
  const body = m[1];
  const lines = body.split(/\r?\n/);
  const obj = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    // basic parsing for booleans
    if (/^(true|false)$/i.test(val)) obj[key] = val.toLowerCase() === 'true';
    else obj[key] = val;
  }
  return obj;
}

async function getEmbeddingForText(text) {
  const url = `${OLLAMA_URL}/embed`;
  const headers = { 'Content-Type': 'application/json' };
  if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
  const body = { model: EMBEDDING_MODEL, input: text };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Ollama embed request failed: ${res.status} ${txt}`);
  }
  const j = await res.json();
  const embedding = j.embedding ?? j.data?.[0]?.embedding ?? j.embeddings ?? null;
  if (!embedding) throw new Error('Unexpected embedding response: ' + JSON.stringify(j));
  return embedding;
}

async function main() {
  console.log(`Starting reindex: knowledgePath=${knowledgePath} revision=${revision} sqlite=${SQLITE_PATH}`);
  // ensure DB directory exists
  await fs.mkdir(path.dirname(SQLITE_PATH), { recursive: true });
  const db = new Database(SQLITE_PATH);

  // Ensure embeddings table exists (migration should handle it)
  db.exec(`CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    commit_sha TEXT,
    revision TEXT,
    content_snippet TEXT,
    embedding_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  const files = await walkDir(knowledgePath).catch(err => {
    console.error('Failed to walk knowledge path:', err.message);
    process.exit(1);
  });

  console.log(`Found ${files.length} files in ${knowledgePath}`);

  const insertStmt = db.prepare(`INSERT OR REPLACE INTO embeddings (id, file_path, commit_sha, revision, content_snippet, embedding_json) VALUES (?, ?, ?, ?, ?, ?)`);

  let processed = 0;
  for (const file of files) {
    try {
      const ext = path.extname(file).toLowerCase();
      // skip binary files naively
      if (['.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar'].includes(ext)) continue;
      const raw = await fs.readFile(file, 'utf8');
      const fm = parseFrontmatter(raw);
      if (fm.sensitivity === true || fm.sensitive === true) {
        console.log(`Skipping sensitive file: ${file}`);
        continue;
      }
      // small snippet for storage
      const snippet = raw.slice(0, 2000);

      // idempotency: check if an embedding exists for this file and revision
      const existing = db.prepare('SELECT id, revision FROM embeddings WHERE file_path = ? AND revision = ?').get(file, revision);
      if (existing && !force) {
        console.log(`Already indexed (revision=${revision}): ${file}`);
        continue;
      }

      const textToEmbed = raw;
      const embedding = await getEmbeddingForText(textToEmbed);

      const id = uuidv4();
      insertStmt.run(id, file, null, revision, snippet, JSON.stringify(embedding));

      processed++;
      console.log(`Indexed (${processed}): ${file}`);

      if (processed % batchSize === 0) {
        // simple pause to avoid hammering Ollama
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(`Failed to process ${file}:`, err.message);
    }
  }

  console.log(`Reindex finished. Processed: ${processed}`);
  db.close();
}

main().catch(err => {
  console.error('Reindex failed:', err);
  process.exit(1);
});
