---
id: KI-NFR-005
key: NFR-005
title: Personal data (PII) protection and secure handling
summary: Personal Identifiable Information (PII) must be minimised, protected, and processed according to security and privacy principles.
type: STANDARD
status: DRAFT
tags: [nfr, privacy, security, pii, iso27001]
---

Systems that collect, store, or process personal data (PII) must treat it as a high-sensitivity class and apply appropriate technical and organisational controls.

Requirements:
- Data minimisation: collect only the personal data strictly necessary for the stated purpose and retain it no longer than required.
- Lawful processing & consent: ensure a documented lawful basis for processing PII (consent, contract, legal obligation, legitimate interest, etc.) and capture consent where required.
- Classification & inventory: maintain an inventory of PII types and data flows; classify data by sensitivity and regulatory regime (e.g., GDPR, CCPA).
- Encryption: PII must be encrypted in transit (TLS) and at rest using approved algorithms and key management.
- Pseudonymisation/Tokenization: where possible, store pseudonymised or tokenised representations rather than raw identifiers.
- Access control & least privilege: restrict access to PII to a small set of roles/services; require strong authentication and authorization for any access.
- Auditability: all access and administrative operations on PII must be logged with identity, timestamp, action, and purpose; logs must be protected from tampering.
- Data subject rights: implement mechanisms to support data subject requests (access, correction, deletion, portability) within regulatory timeframes.
- Breach detection & notification: monitor for exfiltration or unauthorized access and define processes for timely breach notification to affected parties and authorities when required.
- Secure development & testing: avoid using real PII in development, test, or staging environments; when necessary, use synthetic or anonymised datasets.
- Vendor and third-party controls: require contractual and technical controls from processors handling PII on behalf of the organisation.
- Retention & disposal: define retention schedules and secure deletion/destruction procedures for PII and backups.

Rationale:
Protecting PII reduces legal, financial, and reputational risk. These controls align with ISO/IEC 27001, GDPR principles, and common privacy frameworks.
