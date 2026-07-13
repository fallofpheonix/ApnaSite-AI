# ApnaSite AI — Architecture Decision Index

> **Status:** Active
> **Last updated:** 2026-07-13
> **Owner:** Architecture

This document provides a single view of all architectural decisions made in the project. Each ADR is linked to its full document.

---

## Active ADRs

| ADR | Title | Status | Date | Affects | Superseded By |
|-----|-------|--------|------|---------|---------------|
| [ADR-001](adr/ADR-001.md) | Business is the Canonical Aggregate | Accepted | 2026-07-13 | Domain Model, Implementation Spec | — |
| [ADR-002](adr/ADR-002.md) | Business Graph is the Intermediate Representation | Accepted | 2026-07-13 | Compiler Pipeline, Domain Model | — |
| [ADR-003](adr/ADR-003.md) | AI Produces Proposals, Never State Mutations | Accepted | 2026-07-13 | AI Proposal Context, Domain Model | — |
| [ADR-004](adr/ADR-004.md) | Commands are the Only Write Interface | Accepted | 2026-07-13 | Domain Model, Implementation Spec | — |
| [ADR-005](adr/ADR-005.md) | Read Models Power Renderers | Accepted | 2026-07-13 | Domain Model, Implementation Spec | — |
| [ADR-006](adr/ADR-006.md) | Renderers are Pure Functions | Accepted | 2026-07-13 | Implementation Spec, Renderers | — |
| [ADR-007](adr/ADR-007.md) | Events are Append-Only | Accepted | 2026-07-13 | Domain Model, History Context | — |
| [ADR-008](adr/ADR-008.md) | Anti-Corruption Layer for Migration | Accepted | 2026-07-13 | Implementation Spec, Migration Plan | — |
| [ADR-009](adr/ADR-009.md) | Capability Registry is Data-Driven | Accepted | 2026-07-13 | Governance Context, Domain Model | — |
| [ADR-010](adr/ADR-010.md) | Publishing is Channel-Based | Accepted | 2026-07-13 | Publishing Context, Domain Model | — |

---

## ADR Lifecycle

### Statuses

| Status | Description |
|--------|-------------|
| Proposed | Under discussion, not yet decided |
| Accepted | Decision made and implemented |
| Superseded | Replaced by a newer ADR |
| Deprecated | No longer applicable |

### Creating a New ADR

1. Create a new file in `docs/adr/ADR-XXX.md`
2. Use the template below
3. Update this index
4. Link to affected documents

### Superseding an ADR

1. Create a new ADR that references the old one
2. Update the old ADR's status to "Superseded"
3. Update this index with the superseding ADR

---

## ADR Template

```markdown
# ADR-XXX: [Title]

> **Status:** [Proposed | Accepted | Superseded | Deprecated]
> **Date:** YYYY-MM-DD
> **Supersedes:** [ADR-XXX or None]
> **Superseded By:** [ADR-XXX or None]
> **Affects:** [List of affected documents]

## Context

[Describe the problem or decision that needed to be made]

## Decision

[Describe the decision that was made]

## Consequences

**Positive:**
- [List positive consequences]

**Negative:**
- [List negative consequences]

## References

- [Links to related documents]
```

---

## Decision Categories

### Domain Model
- ADR-001: Business is the Canonical Aggregate
- ADR-002: Business Graph is the Intermediate Representation
- ADR-009: Capability Registry is Data-Driven

### Write Path
- ADR-003: AI Produces Proposals, Never State Mutations
- ADR-004: Commands are the Only Write Interface

### Read Path
- ADR-005: Read Models Power Renderers
- ADR-006: Renderers are Pure Functions

### Events
- ADR-007: Events are Append-Only

### Migration
- ADR-008: Anti-Corruption Layer for Migration

### Publishing
- ADR-010: Publishing is Channel-Based
