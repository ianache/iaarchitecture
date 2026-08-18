import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import { createAdapter } from '../services/model-adapter';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseArg(flag: string, defaultValue: string | undefined) {
  const argv = process.argv.slice(2);
  const idx = argv.findIndex(a => a === flag);
  if (idx === -1) return defaultValue;
  const val = argv[idx + 1];
  return val ?? defaultValue;
}

function parseFlags() {
  const argv = process.argv.slice(2);
  return {
    knowledgePath: parseArg('--knowledge-path', './knowledge') as string,
    revision: parseArg('--revision', 'HEAD') as string,
    batchSize: Number(parseArg('--batch-size', '8')),
    force: argv.includes('--force'),
  };
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
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

function parseFrontmatter(content: string) {
  const fmRegex = /^---\n([\s\S]*?)\n---/;
  const m = content.match(fmRegex);
  if (!m) return {} as Record<string, any>;
  const body = m[1];
  const lines = body.split(/\r?\n/);
  const obj: Record<string, any> = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (/^(true|false)$/i.test(val)) obj[key] = val.toLowerCase() === 'true';
    else obj[key] = val;
  }
  return obj;
}

async function getEmbedding(adapter: any, text: string) {
  const res = await adapter.embed(text, { model: process.env.EMBEDDING_MODEL });
  return res.embedding;
}

async function main() {
  const { knowledgePath, revision, batchSize, force } = parseFlags();
  const SQLITE_PATH = process.env.SQLITE_PATH ?? '.architecture-ai/architecture-ai.sqlite';
  console.log(`Reindex (TS) starting: ${knowledgePath} rev=${revision} sqlite=${SQLITE_PATH}`);

  await fs.mkdir(path.dirname(SQLITE_PATH), { recursive: true });
  const db = new Database(SQLITE_PATH);

  db.exec(`CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    commit_sha TEXT,
    revision TEXT,
    content_snippet TEXT,
    embedding_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  const files = await walkDir(knowledgePath).catch(err => { console.error('walkDir failed', err); process.exit(1); });
  console.log(`Found ${files.length} files`);

  const adapter = createAdapter('ollama', { baseUrl: process.env.OLLAMA_URL, apiKey: process.env.OLLAMA_API_KEY, embeddingModel: process.env.EMBEDDING_MODEL });

  const insertStmt = db.prepare('INSERT OR REPLACE INTO embeddings (id, file_path, commit_sha, revision, content_snippet, embedding_json) VALUES (?, ?, ?, ?, ?, ?)');

  let processed = 0;
  for (const file of files) {
    try {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar'].includes(ext)) continue;
      const raw = await fs.readFile(file, 'utf8');
      const fm = parseFrontmatter(raw);
      if (fm.sensitivity === true || fm.sensitive === true) {
        console.log(`Skipping sensitive: ${file}`);
        continue;
      }
      const snippet = raw.slice(0, 2000);
      const existing = db.prepare('SELECT id, revision FROM embeddings WHERE file_path = ? AND revision = ?').get(file, revision);
      if (existing && !force) {
        console.log(`Already indexed: ${file}`);
        continue;
      }
      const embedding = await getEmbedding(adapter, raw);
      const id = uuidv4();
      insertStmt.run(id, file, null, revision, snippet, JSON.stringify(embedding));
      processed++;
      console.log(`Indexed (${processed}): ${file}`);
      if (processed % batchSize === 0) await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      console.error(`Error processing ${file}:`, err.message ?? err);
    }
  }

  console.log(`Reindex finished. Processed: ${processed}`);
  db.close();
}

main().catch(err => { console.error('Fatal error', err); process.exit(1); });
