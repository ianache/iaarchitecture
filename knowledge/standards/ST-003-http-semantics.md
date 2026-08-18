---
id: KI-ST-003
key: ST-003
title: HTTP semantics and status codes
summary: APIs must use HTTP methods and status codes consistently to represent operations and outcomes without ambiguity.
type: STANDARD
status: DRAFT
tags: [api, rest, http, integration]
---
HTTP methods and response semantics must be used according to the requested operation and the outcome of the request.

Requirements:
- `GET` must be safe and read-only for resource retrieval.
- `POST` must create a new resource or trigger a non-idempotent state transition that is explicitly documented.
- `PUT` must replace or fully establish a resource representation and be idempotent.
- `PATCH` may apply partial updates and must be documented as a partial modification mechanism.
- `DELETE` must remove the resource or invoke a documented cancellation flow, with explicit response semantics.
- Servers must return standard HTTP status codes that distinguish success, validation failure, authorization failure, not found, and server errors.
- Error responses must include a machine-readable code and a human-readable explanation when the contract exposes failures to clients.

This standard reduces ambiguity, improves client compatibility, and supports clear API contract enforcement.
