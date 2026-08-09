import type { Review } from "@architecture-ai/domain";
export class AuditLog { private readonly entries: Review[] = []; append(entry: Review): void { this.entries.push(entry); } all(): Review[] { return [...this.entries]; } }
