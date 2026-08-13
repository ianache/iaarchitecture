# Design Spec: Knowledge Change Request Web UI Evolution

Status: Approved

## Goal

Enhance the Knowledge Change Request (KCR) Web UI with a professional, dual-column interface that supports dynamic target path generation, an interactive multi-field review panel, and an integrated audit timeline.

## Design

### 1. Hybrid Path Suggestion in Creation View
* **File:** [`apps/web/src/pages/KnowledgeChangeRequests.tsx`](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/03-PERSONAL/00-Arquitectura-Empresarial-with-AgentesAI/apps/web/src/pages/KnowledgeChangeRequests.tsx)
* **Behavior:**
  - Introduce an automated path generator trigger on change of category or key fields.
  - Suggest paths under the formula: `knowledge/${category}/${key}.md`.
  - Display the suggestion inside an editable `targetPath` input field, allowing custom directory structure adjustment.

### 2. Premium Dual-Column Detail Layout
* **Grid Structure:**
  - Left column (45%): ID, status colored badge (`DRAFT` grey, `REVIEWED` blue, `APPROVED` green, `PUBLISHED` purple), base revision, target path, the interactive review panel, and the vertical audit timeline.
  - Right column (55%): A structured read-only card containing Document Title, Summary, Classification type, tags, and a scrollable markdown body container using monospace font.

### 3. Interactive Review Form and Audit Timeline
* **Interactive Panel:**
  - Introduce a form carrying fields: Reviewer Name (required input), Action (dropdown selection between "COMMENT" and "APPROVE" when status is `DRAFT` or `REVIEWED`), and Comment (optional textarea).
  - Submit button triggers `POST /knowledge-change-requests/:id/review` or `POST /knowledge-change-requests/:id/approve` according to selection.
  - If status is `APPROVED`, show the "Publish to Git Branch" button that triggers `POST /knowledge-change-requests/:id/publish`.
* **Integrated Timeline:**
  - Retrieve and display audit trail below metadata, rendering nodes representing who reviewed, what action they took, timestamps, and quotes for comments.

## Verification Criteria
- Creation view automatically proposes the destination path upon filling category/key.
- Action submissions properly send reviewer names, actions, and comments to the API endpoints.
- Tests in `App.dom.test.tsx` and related mock API wrappers pass clean.
