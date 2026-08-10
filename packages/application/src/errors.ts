export type ApplicationErrorCode = "NOT_FOUND" | "INVALID_REVISION" | "INSUFFICIENT_EVIDENCE" | "PERSISTENCE_ERROR" | "PACKAGE_GENERATION_FAILED" | "PACKAGE_NOT_READY" | "INVALID_REVIEW_TRANSITION";
export class ApplicationError extends Error {
  constructor(readonly code: ApplicationErrorCode, message: string, options?: { cause?: unknown }) { super(message, options); this.name = "ApplicationError"; }
}
