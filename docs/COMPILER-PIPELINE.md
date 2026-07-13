# ApnaSite AI — Compiler Pipeline

> **Status:** Frozen
> **Last updated:** 2026-07-13
> **Owner:** Architecture

This document defines the canonical compiler pipeline for ApnaSite AI. The system is modeled as a compiler: raw business knowledge enters, and channel-specific artifacts exit. AI appears exactly once; everything after the Business Graph is deterministic.

---

## Pipeline Overview

```text
Voice / Text
      │
      ▼
Parser
      │
      ▼
Intent Extraction (AI)
      │
      ▼
Proposal
      │
      ▼
Validation
      │
      ▼
Commands
      │
      ▼
Business Graph (IR)
      │
      ▼
Read Models
      │
      ▼
Artifacts
      │
      ▼
Deployment
```

---

## Stage Definitions

### Stage 1: Parser
**Input:** Raw voice transcript or typed text
**Output:** Structured intermediate form (tokens, entities, relationships)

The Parser is deterministic. It converts unstructured input into a structured representation without using AI. Responsibilities:
- Tokenization
- Named entity recognition (deterministic patterns)
- Language detection
- Input validation and sanitization

### Stage 2: Intent Extraction (AI)
**Output:** Proposal containing SuggestedChanges

This is the only stage that uses AI (Claude API). Responsibilities:
- Interpret user intent from parsed input
- Map intent to domain operations (add/update/remove entities)
- Generate SuggestedChanges with confidence scores and reasoning
- Respect business category and capability constraints

### Stage 3: Validation
**Input:** Proposal
**Output:** Validated Proposal (or rejection with errors)

Validation is deterministic. It checks the Proposal against domain rules without using AI. Responsibilities:
- Verify all referenced entities exist
- Check invariant satisfaction
- Validate data types and formats
- Enforce business rules (e.g., max products per category)
- Prevent conflicting operations

### Stage 4: Commands
**Input:** Validated Proposal
**Output:** One or more Commands

Commands are the only write interface to the Business Graph. Each Command is an intent to change state. Responsibilities:
- Translate SuggestedChanges into domain Commands
- Assign deterministic ids where needed
- Set timestamps and metadata
- Route Commands to the appropriate aggregate

### Stage 5: Business Graph (IR)
**Input:** Commands
**Output:** Updated Business Graph

The Business Graph is the Intermediate Representation (IR). It is the single source of truth for all business data. Responsibilities:
- Execute Commands against the appropriate aggregate
- Enforce aggregate invariants
- Emit Domain Events for every state change
- Maintain referential integrity

### Stage 6: Read Models
**Input:** Domain Events
**Output:** Channel-specific Read Models

Read Models are derived from Domain Events. They are pre-computed views optimized for specific consumers. Responsibilities:
- Subscribe to Domain Events
- Update denormalized views
- Maintain consistency with the Business Graph
- Provide query-optimized access patterns

### Stage 7: Artifacts
**Input:** Read Models
**Output:** User-visible Artifacts

Artifacts are the output of Renderers. They are channel-specific representations of the business data. Responsibilities:
- Transform Read Models into HTML, JSON, or message templates
- Apply channel-specific styling and formatting
- Version Artifacts for audit and rollback
- Cache aggressively

### Stage 8: Deployment
**Input:** Artifacts
**Output:** Published channel content

Deployment makes Artifacts available on target channels. Responsibilities:
- Publish HTML to the website
- Send WhatsApp messages
- Update Google Business listings
- Update Instagram profiles
- Track deployment status and errors

---

## Knowledge Layers

The compiler pipeline operates across four knowledge layers. Canonical definitions are in `GLOSSARY.md`; this section provides pipeline-context elaboration.

### Layer 1: Reality
The ground truth about a business. Reality is immutable and external to the system. Examples: what products exist, what hours are kept, where the shop is located.

### Layer 2: Facts
Objective, verifiable data stored in the Business Graph. Facts are derived from Reality through owner input or AI extraction. Examples: product name, price, business hours.

### Layer 3: Knowledge
Computed data derived from Facts. Examples: "the shop is currently open," "this product is out of stock," "this is the best-selling item."

### Layer 4: Intelligence
Inferred data derived from patterns in Facts and Knowledge. Examples: "sales tend to peak on weekends," "this product's price is above market average." Not in V1 scope.

**Rule:** AI may only operate on Layer 1 (Reality) input to produce Layer 2 (Facts) output. Layers 3 and 4 are computed deterministically from Layer 2.

---

## Read/Write Separation

The pipeline enforces strict read/write separation:

- **Write path:** Parser → Intent Extraction → Proposal → Validation → Commands → Business Graph
- **Read path:** Business Graph → Read Models → Artifacts → Deployment

Renderers never read from the Business Graph directly. They always consume Read Models. This ensures:
- Renders are deterministic given the same Read Model
- No side effects during rendering
- Easy testing (mock Read Models, not the entire domain)
- Performance (Read Models are pre-computed)

---

## AI Constraint

**AI appears exactly once in the pipeline.** The AI is used in Stage 2 (Intent Extraction) to convert parsed input into structured SuggestedChanges. After this stage, the pipeline is entirely deterministic.

This constraint ensures:
- Predictable behavior after AI extraction
- Easy debugging (replay from Proposal onwards)
- Vendor independence (AI can be swapped without changing downstream stages)
- Cost control (AI calls are bounded and auditable)

---

## Error Handling

Each stage defines its own error behavior:

| Stage | Error Behavior |
|-------|----------------|
| Parser | Reject malformed input, return validation errors |
| Intent Extraction | Return Proposal with low-confidence suggestions |
| Validation | Reject invalid Proposals, return specific error messages |
| Commands | Reject Commands that violate invariants |
| Business Graph | Reject state transitions that break consistency |
| Read Models | Skip failed updates, log errors, continue processing |
| Artifacts | Render fallback content, log errors |
| Deployment | Retry failed deployments, queue for manual review |

---

## Idempotency

All stages are designed to be idempotent:
- Parsing the same input produces the same intermediate form
- Extracting intent from the same parsed input produces the same Proposal
- Validating the same Proposal produces the same result
- Executing the same Command produces the same Events (deduplication by Command id)
- Rendering the same Read Model produces the same Artifact
- Deploying the same Artifact is safe to retry

---

## Traceability

Every artifact produced by the pipeline can be traced back through the stages:

```text
User-visible Artifact
      ↑
Renderer
      ↑
Read Model
      ↑
Domain Event
      ↑
Command
      ↑
Validated Proposal
      ↑
Proposal (SuggestedChanges)
      ↑
Parsed Input
      ↑
Raw Voice / Text
```

This traceability enables:
- Debugging: trace from artifact back to source input
- Auditing: verify what AI produced vs. what was deployed
- Rollback: revert to any previous state by replaying Events
