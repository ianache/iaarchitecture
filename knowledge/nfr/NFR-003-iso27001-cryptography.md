---
id: KI-NFR-003
key: NFR-003
title: Cryptography and key management
summary: Confidential data and internal service communications must use approved encryption and key lifecycle controls consistent with ISO 27001.
type: STANDARD
status: DRAFT
tags: [nfr, iso27001, security, encryption, cryptography]
---
Confidentiality controls must enforce encryption for data in transit and at rest when the information is sensitive, regulated, or externally exposed.

Requirements:
- Transport security must use approved TLS configurations with strong cipher suites and certificate validation.
- Secrets, private keys, and credentials must be stored in managed secret stores and never embedded in source code or deployment manifests.
- Encryption keys must have defined ownership, rotation schedules, and recovery procedures.
- Encryption decisions must consider confidentiality requirements, data classification, and the risk of unauthorized disclosure.

This requirement aligns with ISO/IEC 27001 expectations for cryptographic protection and key management.
