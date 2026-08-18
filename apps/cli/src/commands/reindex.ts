#!/usr/bin/env node
// apps/cli/src/commands/reindex.ts
// CLI command to trigger reindexing of knowledge using the ingest script or directly via ModelAdapter.

import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();
program
  .name('reindex')
  .description('Reindex knowledge/ and store embeddings in SQLite')
  .option('--knowledge-path <path>', 'Path to knowledge directory', './knowledge')
  .option('--revision <rev>', 'Revision or commit SHA (default HEAD)', 'HEAD')
  .option('--batch-size <n>', 'Batch size for embedding requests', '8')
  .option('--force', 'Force reindex even if revision already indexed')
  .action(opts => {
    // spawn the top-level script
    const script = path.resolve(process.cwd(), 'scripts', 'ingest_embeddings.mjs');
    const args = ['--knowledge-path', opts.knowledgePath, '--revision', opts.revision, '--batch-size', String(opts.batchSize)];
    if (opts.force) args.push('--force');

    const node = process.execPath;
    const child = spawn(node, [script, ...args], { stdio: 'inherit', env: process.env });

    child.on('exit', code => {
      process.exit(code ?? 0);
    });
  });

program.parse(process.argv);
