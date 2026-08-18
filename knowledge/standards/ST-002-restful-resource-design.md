---
id: KI-ST-002
key: ST-002
title: RESTful resource design
summary: RESTful APIs must model resources as nouns, use stable URLs, and keep resource semantics consistent across operations.
type: STANDARD
status: DRAFT
tags: [api, rest, integration, resource-design]
---
RESTful APIs must express the domain as resources with stable identifiers and predictable lifecycle semantics.

Requirements:
- Resource names must be nouns or noun phrases, not verbs or action names.
- URLs must identify resources and collections consistently, for example `/orders` and `/orders/{id}`.
- The same resource must preserve identity across updates and not be represented with divergent paths for equivalent semantics.
- Query parameters may filter, sort, or paginate results, but they must not redefine the canonical resource identity.
- API design must document meaningful relationships between resources and avoid overloaded endpoints that mix unrelated concerns.

This standard supports interoperable, discoverable, and evolvable REST APIs.
