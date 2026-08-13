export type ApplicationErrorCode = "NOT_FOUND" | "INVALID_REVISION" | "INVALID_OKF_METADATA" | "STANDARDS_CONFLICT" | "TRACEABILITY_INCOMPLETE" | "INSUFFICIENT_EVIDENCE" | "PERSISTENCE_ERROR" | "PACKAGE_GENERATION_FAILED" | "PACKAGE_NOT_READY" | "INVALID_REVIEW_TRANSITION" | "GIT_PUBLICATION_FAILED" | "INVALID_PACKAGE_STATUS" | "INVALID_KNOWLEDGE_CHANGE_TRANSITION" | "KNOWLEDGE_PUBLICATION_FAILED";
export class ApplicationError extends Error {
  constructor(readonly code: ApplicationErrorCode, message: string, options?: { cause?: unknown }) { super(message, options); this.name = "ApplicationError"; }
}
