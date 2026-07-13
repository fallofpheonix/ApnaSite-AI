# ApnaSite AI — Glossary

> **Status:** Frozen
> **Last updated:** 2026-07-13
> **Owner:** Architecture

This document defines the canonical vocabulary for ApnaSite AI. Every term appears exactly once as its authoritative definition. All other documents reference these definitions.

---

## Core Domain Concepts

### Business
The central aggregate root representing a shop or service provider. A Business owns all canonical data: profile, catalog, publishing configuration, and history. One Business maps to one owner account in V1.

### Business Profile
A value object belonging to Business. Contains the owner's canonical description: name, tagline, category, language, and theme preference. The Business Profile is the source of truth for how the business describes itself.

### Contact Information
A value object belonging to Business. Contains phone, WhatsApp number, email, and alternate contact methods. Contact Information is part of the Business Profile and is rendered on every published channel.

### Address
A value object belonging to Business. Contains shop number, building, street, landmark, area, city, district, state, country, and postal code. The Address is used for display, directions, and map integration.

### Geo Location
A value object belonging to Business. Contains latitude, longitude, and accuracy. May be set manually (address search or coordinate input) or automatically (browser geolocation). Used for map rendering and navigation.

### Business Hours
A value object belonging to Business. Contains seven day entries (Monday through Sunday), each with open time, close time, and a closed flag. Supports special holiday hours and temporary closures.

### Photo Gallery
A value object belonging to Business. Contains a list of Photo entities representing logo, cover image, gallery images, and product images. Each Photo has an id, filename, storage path, alt text, image type, sort order, and upload metadata.

### Social Links
A value object belonging to Business. Contains optional URLs for Instagram, Facebook, YouTube, LinkedIn, X (Twitter), and Telegram. Only configured platforms are rendered on published channels.

### Catalog
An aggregate owned by Business. Contains Products and Services offered by the business. The Catalog is the source of truth for what the business sells or provides.

### Product
An entity belonging to Catalog. Represents a tangible item the business sells. Has name, description, price, image, stock quantity, and SKU.

### Service
An entity belonging to Catalog. Represents an intangible offering (e.g., haircut, tutoring session). Has name, description, price, and duration.

### Publishing
An aggregate owned by Business. Represents a published channel (Website, WhatsApp, Google Business, Instagram). Each channel has its own configuration and read model.

### Revision
An entity belonging to Publishing. Represents a point-in-time snapshot of the published content. Revisions enable rollback and history inspection.

### Proposal
An entity produced by the AI layer. Contains SuggestedChanges: a list of add, update, and remove operations against Business entities. Proposals are never applied directly — they are reviewed and accepted by the owner before becoming Commands.

### SuggestedChange
A value object within Proposal. Represents a single proposed modification: entity type, entity id, operation (add/update/remove), and the proposed data. Includes confidence score and reasoning from the AI.

### Domain Event
An immutable record of something that happened in the system. Events are append-only and originate from exactly one aggregate. Events are the source of truth for History and the mechanism for updating Read Models.

### Command
An intent to change system state. Commands are the only write interface. Every command is validated before execution and produces one or more Domain Events.

### Read Model
A pre-computed view of data optimized for a specific consumer (renderer, dashboard, API response). Read Models are derived from Domain Events and are never written to directly.

### WebsiteReadModel
A Read Model consumed by WebsiteRenderer. Contains business profile, contact information, address, location, hours, photos, social links, products, services, and theme configuration.

### WhatsAppReadModel
A Read Model consumed by WhatsAppRenderer. Contains business name, phone, hours, address, products, and quick actions for WhatsApp responses.

### DashboardReadModel
A Read Model consumed by DashboardRenderer (the owner dashboard page). Contains business profile, publish status, proposal count, recent events, capabilities, and feature flags.

### GovernanceReadModel
A Read Model consumed by DashboardRenderer. Contains capabilities and feature flags derived from BusinessPolicy entities.

### PublishingReadModel
A Read Model consumed by DashboardRenderer and revision history endpoints. Contains channels, revisions, and latest revision data.

### ProposalListReadModel
A Read Model consumed by DashboardRenderer and proposal list endpoints. Contains proposals, pending count, accepted count, and rejected count.

### Renderer
A pure function that transforms a Read Model into a user-visible artifact (HTML page, WhatsApp message, API response). Renderers have no side effects and no knowledge of the domain model.

### Artifact
The output of a Renderer: a complete HTML page, a JSON response, a WhatsApp message template. Artifacts are versioned and stored for audit and rollback.

### Capability
A data-driven feature flag attached to a Business. Capabilities determine which features are available (menu, services, contact, hours, delivery, booking, reviews, inventory, payments, orders). Capabilities are derived from the business category and can be overridden by the owner.

### Business Graph
The Intermediate Representation (IR) of a business's canonical data. The Business Graph is the central data structure that all channels read from and all writes update. It is the single source of truth.

### Snapshot
An optional checkpoint in the revision model. A Snapshot captures the full state of the Business Graph at a point in time. Between Snapshots, only Events are stored. Restore = Snapshot + replay Events.

### AI Memory
A separate store for AI-specific observations, decisions, outcomes, hypotheses, and experiments. AI Memory is isolated from Business Memory and does not affect the canonical Business Graph.

### Business Memory
A future knowledge layer for storing business decisions, outcomes, and hypotheses. Not in V1 scope.

---

## Bounded Contexts

### Identity
Manages user accounts, authentication (OTP), sessions, and authorization. Owns User and Session entities.

### Business
The core context. Owns the Business aggregate, Business Profile, Contact Information, Address, Geo Location, Business Hours, Photo Gallery, and Social Links.

### Catalog
Owns Products and Services. Manages the business's offerings.

### Publishing
Owns channel configuration, Revision tracking, and Artifact generation. Manages the lifecycle of published content.

### AI Proposal
Owns Proposal and SuggestedChange entities. Interfaces with the AI layer to generate structured suggestions.

### Governance
Manages Feature Flags, Capabilities, and business policies. Determines what features are available to each Business.

### History
Owns the append-only event log. Provides audit trail and rollback capabilities.

---

## Compiler Pipeline Terms

### Parser
The first stage of the compiler pipeline. Converts raw Voice or Text input into a structured intermediate form. The Parser is deterministic and does not use AI.

### Intent Extraction
The AI-powered stage of the compiler pipeline. Analyzes the parsed input and produces a Proposal with SuggestedChanges. This is the only stage that uses AI.

### Validation
The deterministic stage that checks a Proposal against domain rules before execution. Validation ensures all invariants are satisfied and all referenced entities exist.

### Deployment
The final stage of the compiler pipeline. Takes rendered Artifacts and makes them available on the target channel (publishes HTML, sends WhatsApp message, updates Google Business listing).

---

## Knowledge Layers

### Reality
The ground truth about a business: what products exist, what hours are kept, where the shop is located. Reality is immutable and external to the system.

### Facts
Objective, verifiable data stored in the Business Graph. Facts are derived from Reality through owner input or AI extraction. Examples: product name, price, business hours.

### Knowledge
Computed data derived from Facts. Examples: "the shop is currently open," "this product is out of stock," "this is the best-selling item."

### Intelligence
Inferred data derived from patterns in Facts and Knowledge. Examples: "sales tend to peak on weekends," "this product's price is above market average." Not in V1 scope.

---

## Infrastructure Terms

### Aggregate Root
The top-level entity of an aggregate. All access to the aggregate goes through the Root. The Root enforces invariants and is the unit of consistency.

### Entity
An object defined by its identity rather than its attributes. Entities have mutable state and are tracked by their id.

### Value Object
An object defined by its attributes rather than its identity. Value Objects are immutable and are compared by value.

### Anti-Corruption Layer
A translation layer between the legacy Site model and the new Business aggregate. Enables incremental migration without breaking existing functionality.

### Repository
A persistence abstraction that provides collection-like access to Aggregates. Repositories hide database details from the domain layer.

### Read/Write Separation
The architectural principle that Renderers (reads) never access Write Models (aggregates) and instead consume pre-computed Read Models.

### Feature Flag
A runtime toggle that enables or disables functionality. Feature Flags are data-driven and attached to Business entities.

---

## Versioning

### Living Document
A document that evolves as the product matures. May be updated without creating a new ADR. Examples: PRD, Migration Plan.

### Frozen Document
A document that is versioned and requires an ADR to change. Examples: Domain Model, Implementation Spec, Glossary, Compiler Pipeline, ADRs.

### Architecture Decision Record (ADR)
A document that captures an irreversible architectural decision. ADRs are frozen and indexed. Any change to a frozen ADR requires a new ADR that supersedes it.
