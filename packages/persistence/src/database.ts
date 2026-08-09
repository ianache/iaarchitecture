import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { SCHEMA } from "./schema.js";
const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

export class DatabaseStore {
  private constructor(readonly database: InstanceType<typeof DatabaseSync>) {}

  static open(path: string): DatabaseStore {
    const absolute = resolve(path);
    const isDefaultOperationalPath = absolute.endsWith(".architecture-ai\\architecture-ai.sqlite") || absolute.endsWith(".architecture-ai/architecture-ai.sqlite");
    const isExplicitTestPath = absolute.startsWith(resolve(tmpdir())) || /test|spec/i.test(absolute);
    if (!isDefaultOperationalPath && !isExplicitTestPath) {
      throw new Error("Operational database must be .architecture-ai/architecture-ai.sqlite or an explicit test path");
    }
    mkdirSync(dirname(absolute), { recursive: true });
    const database = new DatabaseSync(absolute);
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec(SCHEMA);
    return new DatabaseStore(database);
  }

  close(): void { this.database.close(); }
}
