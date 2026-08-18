---
id: KI-ST-004
key: ST-004
title: Pagination and filtering for list endpoints
summary: List endpoints must provide deterministic paging, filtering, and sorting semantics for large or frequently accessed collections.
type: STANDARD
status: DRAFT
tags: [api, rest, pagination, filtering]
---
Collection endpoints must behave predictably for clients that need large result sets or incremental retrieval.

Requirements:
- APIs must define default paging behavior when a collection response may be large.
- Cursor or offset pagination must be explicit, stable, and documented for all list endpoints.
- Sorting keys must be deterministic and applied consistently across requests.
- Filtering must use explicit query parameters or structured filter object fields with documented semantics.
- Response metadata must indicate total counts or next-page cursors when relevant to client behavior.
- Clients must not rely on implicit ordering that changes across time or replicas.

This standard prevents unstable list behavior and simplifies client-side processing for large REST payloads.
