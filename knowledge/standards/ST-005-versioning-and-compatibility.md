---
id: KI-ST-005
key: ST-005
title: API versioning and compatibility
summary: Public API changes must be versioned or guarded to preserve client compatibility and reduce breaking changes.
type: STANDARD
status: DRAFT
tags: [api, rest, versioning, compatibility]
---
Breaking changes to public REST contracts must be managed deliberately and communicated to consumers before deployment.

Requirements:
- Contract changes that remove fields, alter semantics, or modify required request payloads must be treated as breaking changes.
- Backward-compatible changes may be added under the current version, but incompatible changes require a new contract version.
- Version identifiers must be explicit, discoverable, and preserved in routes, headers, or documentation as appropriate.
- Deprecation windows and sunset timelines must be documented for older API versions.
- New fields must be additive and optional unless a migration plan is explicitly agreed with consumers.
- Contracts must include compatibility expectations for clients and server-side behavior under version rollouts.

This standard minimizes operational risk and supports safer evolution of external interfaces.
