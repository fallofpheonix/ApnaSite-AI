# ApnaSite AI — Domain Model

> **Status:** Frozen
> **Last updated:** 2026-07-13
> **Owner:** Architecture

This document defines the canonical domain model for ApnaSite AI. All terms are defined in `GLOSSARY.md`. The system is modeled as a compiler (see `COMPILER-PIPELINE.md`).

---

## Bounded Contexts

### V1 Contexts (Frozen)

| Context | Owner | Aggregate Root | Description |
|---------|-------|----------------|-------------|
| Identity | User | User | Authentication, authorization, sessions |
| Business | Business | Business | Core business data, profile, catalog |
| Catalog | Business | Catalog | Products and services |
| Publishing | Business | Publishing | Channel configuration, revisions |
| AI Proposal | — | Proposal | AI-generated suggestions |
| Governance | — | BusinessPolicy | Feature flags, capabilities |
| History | — | DomainEvent | Append-only event log |

### Future Contexts (Out of V1 Scope)

- Orders
- Booking
- Reviews
- Analytics
- CRM
- Inventory
- Automation
- Intelligence
- Marketplace

---

## Business Aggregate

The Business is the canonical aggregate root. All other entities are owned by or associated with a Business.

### Aggregate Root: Business

**Identity:** Business.id (cuid)
**Owner:** User (1:1 in V1)
**Lifecycle:** Created → Active → Suspended → Deleted

#### Invariants
1. A Business must have a unique slug (when published)
2. A Business must have exactly one Business Profile
3. A Business must have at most one Catalog
4. A Business must have at most one Publishing configuration
5. A Business cannot be deleted while it has active published channels
6. A Business slug must be URL-safe and unique across the system

#### Owned Entities
- Business Profile (1:1)
- Contact Information (1:1)
- Address (1:1)
- Geo Location (1:1)
- Business Hours (1:1)
- Photo Gallery (1:1)
- Social Links (1:1)
- Catalog (0:1, ID reference only)
- Publishing (0:1, ID reference only)

---

### Business Profile

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| name | string | required, max 100 chars |
| tagline | string | max 200 chars |
| category | string | required, from category enum |
| language | Language | required, default "hinglish" |
| themeOverride | string \| null | optional theme id |
| description | string | max 2000 chars |

#### Category Enum
- bakery
- salon
- restaurant
- grocery
- pharmacy
- clothing
- sweets
- kirana
- tailor
- jewellery
- gym
- tuition
- electronics
- hardware
- general

#### Invariants
1. name must be non-empty
2. category must be from the valid category enum
3. language must be from the valid language enum

---

### Contact Information

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| phone | string \| null | E.164 format preferred |
| whatsapp | string \| null | E.164 format preferred |
| email | string \| null | RFC 5322 format |
| alternatePhone | string \| null | optional |
| supportEmail | string \| null | optional |

#### Invariants
1. At least one contact method must be non-null
2. Phone numbers must be valid format when non-null
3. Email must be valid format when non-null

---

### Address

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| shopNumber | string \| null | optional |
| building | string \| null | optional |
| street | string \| null | optional |
| landmark | string \| null | optional |
| area | string \| null | optional |
| city | string | required |
| district | string \| null | optional |
| state | string | required |
| country | string | required, default "IN" |
| postalCode | string \| null | optional |

#### Invariants
1. city must be non-empty
2. state must be non-empty
3. country must be non-empty

---

### Geo Location

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| latitude | number | -90 to 90 |
| longitude | number | -180 to 180 |
| accuracy | number \| null | meters |
| source | LocationSource | required |

#### LocationSource Enum
- manual: Owner entered coordinates
- search: Derived from address search
- browser: Browser geolocation API

#### Invariants
1. latitude must be between -90 and 90
2. longitude must be between -180 and 180
3. accuracy must be positive when non-null

---

### Business Hours

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| days | DaySchedule[7] | Monday through Sunday |

#### DaySchedule

| Field | Type | Constraints |
|-------|------|-------------|
| day | DayOfWeek | required |
| isOpen | boolean | required |
| openTime | string \| null | HH:MM format, required when isOpen |
| closeTime | string \| null | HH:MM format, required when isOpen |
| isClosed | boolean | default false |

#### DayOfWeek Enum
- monday
- tuesday
- wednesday
- thursday
- friday
- saturday
- sunday

#### Invariants
1. Must have exactly 7 day entries
2. When isOpen is true, openTime and closeTime must be non-null
3. openTime must be before closeTime
4. Day entries must be in order (Monday through Sunday)

---

### Photo Gallery

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| photos | Photo[] | list of photos |
| maxPhotos | number | default 50 |

#### Photo Entity

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| filename | string | required |
| storagePath | string | required |
| thumbnailPath | string \| null | optional |
| altText | string | default "" |
| imageType | ImageType | required |
| sortOrder | number | required |
| uploadedAt | DateTime | required |
| uploadedBy | string | user id |

#### ImageType Enum
- logo
- cover
- gallery
- product
- team

#### Invariants
1. Each Photo must have a unique id
2. sortOrder must be non-negative
3. storagePath must be valid
4. File must be JPG, PNG, or WebP (enforced at upload, not in domain)

---

### Social Links

**Value Object** belonging to Business.

| Field | Type | Constraints |
|-------|------|-------------|
| instagram | string \| null | URL |
| facebook | string \| null | URL |
| youtube | string \| null | URL |
| linkedin | string \| null | URL |
| twitter | string \| null | URL |
| telegram | string \| null | URL |

#### Invariants
1. All URLs must be valid when non-null
2. Only configured platforms are rendered

---

## Catalog Aggregate

**Aggregate Root:** Catalog
**Owner:** Business (1:1)
**Lifecycle:** Created → Active → Archived

### Invariants
1. A Catalog belongs to exactly one Business
2. A Catalog must have at most 40 Products
3. A Catalog must have at most 20 Services

### Product Entity

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| name | string | required, max 200 chars |
| description | string | max 2000 chars |
| price | string \| null | formatted price string |
| image | string \| null | storage path |
| stock | number \| null | non-negative when set |
| sku | string \| null | max 100 chars |
| sortOrder | number | required |

#### Invariants
1. Each Product must have a unique id within its Catalog
2. name must be non-empty
3. stock must be non-negative when set
4. sortOrder must be non-negative

### Service Entity

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| name | string | required, max 200 chars |
| description | string | max 2000 chars |
| price | string \| null | formatted price string |
| duration | string \| null | duration string |
| sortOrder | number | required |

#### Invariants
1. Each Service must have a unique id within its Catalog
2. name must be non-empty
3. sortOrder must be non-negative

---

## Publishing Aggregate

**Aggregate Root:** Publishing
**Owner:** Business (1:1)
**Lifecycle:** Unconfigured → Configured → Published → Unpublished

### Invariants
1. A Publishing configuration belongs to exactly one Business
2. A Publishing configuration must have at least one Channel configured
3. A slug, once assigned, is permanent for the Business

### Channel Entity

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| channelType | ChannelType | required |
| config | ChannelConfig | required |
| status | ChannelStatus | required |
| slug | string \| null | unique, URL-safe |
| publishedAt | DateTime \| null | when first published |
| unpublishedAt | DateTime \| null | when unpublished |

#### ChannelType Enum
- website
- whatsapp
- google_business
- instagram

#### ChannelStatus Enum
- draft
- published
- unpublished
- error

#### ChannelConfig (Website)

| Field | Type | Constraints |
|-------|------|-------------|
| customDomain | string \| null | optional |
| themeId | string | required |
| seoTitle | string \| null | optional |
| seoDescription | string \| null | optional |

#### Invariants
1. Each Channel must have a unique id
2. website Channel must have a slug when published
3. slug must be URL-safe and unique across the system

---

## Revision Entity

**Entity** belonging to Publishing.

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| channel | Channel | required |
| version | number | positive, monotonically increasing |
| snapshot | BusinessGraph | full state at this point |
| events | DomainEvent[] | events since last snapshot |
| createdAt | DateTime | required |

#### Invariants
1. version must be monotonically increasing
2. snapshot must be a valid BusinessGraph
3. events must be ordered by timestamp

---

## AI Proposal

### Proposal Entity

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| businessId | string | required |
| source | ProposalSource | required |
| suggestedChanges | SuggestedChange[] | non-empty |
| confidence | number | 0 to 1 |
| reasoning | string | AI explanation |
| status | ProposalStatus | required |
| createdAt | DateTime | required |
| resolvedAt | DateTime \| null | when accepted/rejected |

#### ProposalSource Enum
- voice: Voice input
- text: Typed text
- whatsapp: WhatsApp message
- system: System-generated

#### ProposalStatus Enum
- pending: Awaiting owner review
- accepted: Owner accepted, Commands executed
- rejected: Owner rejected
- expired: Timed out

#### SuggestedChange

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| entityType | EntityType | required |
| entityId | string \| null | null for adds |
| operation | Operation | required |
| data | Record<string, unknown> | proposed data |
| confidence | number | 0 to 1 |
| reasoning | string | AI explanation |

#### EntityType Enum
- business_profile
- contact_information
- address
- geo_location
- business_hours
- photo
- social_links
- product
- service

#### Operation Enum
- add: Create new entity
- update: Modify existing entity
- remove: Delete entity

#### Invariants
1. A Proposal must have at least one SuggestedChange
2. confidence must be between 0 and 1
3. update and remove operations must reference an existing entityId
4. add operations must not reference an entityId
5. A Proposal can only be resolved once

---

## Commands

Commands are the only write interface to the Business Graph.

### Business Commands

| Command | Aggregate | Produces Events |
|---------|-----------|-----------------|
| CreateBusiness | Business | BusinessCreated |
| UpdateBusinessProfile | Business | BusinessProfileUpdated |
| UpdateContactInformation | Business | ContactInformationUpdated |
| UpdateAddress | Business | AddressUpdated |
| UpdateGeoLocation | Business | GeoLocationUpdated |
| UpdateBusinessHours | Business | BusinessHoursUpdated |
| UploadPhoto | Business | PhotoUploaded |
| RemovePhoto | Business | PhotoRemoved |
| ReorderPhotos | Business | PhotosReordered |
| UpdateSocialLinks | Business | SocialLinksUpdated |

### Catalog Commands

| Command | Aggregate | Produces Events |
|---------|-----------|-----------------|
| CreateCatalog | Catalog | CatalogCreated |
| AddProduct | Catalog | ProductAdded |
| UpdateProduct | Catalog | ProductUpdated |
| RemoveProduct | Catalog | ProductRemoved |
| ReorderProducts | Catalog | ProductsReordered |
| AddService | Catalog | ServiceAdded |
| UpdateService | Catalog | ServiceUpdated |
| RemoveService | Catalog | ServiceRemoved |
| ReorderServices | Catalog | ServicesReordered |

### Publishing Commands

| Command | Aggregate | Produces Events |
|---------|-----------|-----------------|
| ConfigureChannel | Publishing | ChannelConfigured |
| PublishChannel | Publishing | ChannelPublished |
| UnpublishChannel | Publishing | ChannelUnpublished |
| UpdateChannelConfig | Publishing | ChannelConfigUpdated |

### AI Proposal Commands

| Command | Aggregate | Produces Events |
|---------|-----------|-----------------|
| SubmitProposal | Proposal | ProposalSubmitted |
| AcceptProposal | Proposal | ProposalAccepted |
| RejectProposal | Proposal | ProposalRejected |

### Governance Commands

| Command | Aggregate | Produces Events |
|---------|-----------|-----------------|
| EnableCapability | BusinessPolicy | CapabilityEnabled |
| DisableCapability | BusinessPolicy | CapabilityDisabled |
| SetFeatureFlag | BusinessPolicy | FeatureFlagSet |

---

## Domain Events

Events are append-only and originate from exactly one aggregate.

### Business Events

| Event | Aggregate | Triggered By |
|-------|-----------|--------------|
| BusinessCreated | Business | CreateBusiness |
| BusinessProfileUpdated | Business | UpdateBusinessProfile |
| ContactInformationUpdated | Business | UpdateContactInformation |
| AddressUpdated | Business | UpdateAddress |
| GeoLocationUpdated | Business | UpdateGeoLocation |
| BusinessHoursUpdated | Business | UpdateBusinessHours |
| PhotoUploaded | Business | UploadPhoto |
| PhotoRemoved | Business | RemovePhoto |
| PhotosReordered | Business | ReorderPhotos |
| SocialLinksUpdated | Business | UpdateSocialLinks |

### Catalog Events

| Event | Aggregate | Triggered By |
|-------|-----------|--------------|
| CatalogCreated | Catalog | CreateCatalog |
| ProductAdded | Catalog | AddProduct |
| ProductUpdated | Catalog | UpdateProduct |
| ProductRemoved | Catalog | RemoveProduct |
| ProductsReordered | Catalog | ReorderProducts |
| ServiceAdded | Catalog | AddService |
| ServiceUpdated | Catalog | UpdateService |
| ServiceRemoved | Catalog | RemoveService |
| ServicesReordered | Catalog | ReorderServices |

### Publishing Events

| Event | Aggregate | Triggered By |
|-------|-----------|--------------|
| ChannelConfigured | Publishing | ConfigureChannel |
| ChannelPublished | Publishing | PublishChannel |
| ChannelUnpublished | Publishing | UnpublishChannel |
| ChannelConfigUpdated | Publishing | UpdateChannelConfig |

### AI Proposal Events

| Event | Aggregate | Triggered By |
|-------|-----------|--------------|
| ProposalSubmitted | Proposal | SubmitProposal |
| ProposalAccepted | Proposal | AcceptProposal |
| ProposalRejected | Proposal | RejectProposal |

### Governance Events

| Event | Aggregate | Triggered By |
|-------|-----------|--------------|
| CapabilityEnabled | BusinessPolicy | EnableCapability |
| CapabilityDisabled | BusinessPolicy | DisableCapability |
| FeatureFlagSet | BusinessPolicy | SetFeatureFlag |

---

## Read Models

### WebsiteReadModel

Pre-computed view for website rendering.

| Field | Type | Source |
|-------|------|--------|
| business | BusinessProfile | Business aggregate |
| contact | ContactInformation | Business aggregate |
| address | Address | Business aggregate |
| location | GeoLocation | Business aggregate |
| hours | BusinessHours | Business aggregate |
| photos | Photo[] | Business aggregate |
| socialLinks | SocialLinks | Business aggregate |
| products | Product[] | Catalog aggregate |
| services | Service[] | Catalog aggregate |
| theme | ThemeConfig | Governance aggregate |

### WhatsAppReadModel

Pre-computed view for WhatsApp responses.

| Field | Type | Source |
|-------|------|--------|
| businessName | string | BusinessProfile |
| phone | string | ContactInformation |
| hours | string (formatted) | BusinessHours |
| address | string (formatted) | Address |
| products | Product[] (limited) | Catalog |
| quickActions | QuickAction[] | ContactInformation |

### DashboardReadModel

**Read Model** consumed by DashboardRenderer (the owner dashboard page).

| Field | Type | Source |
|-------|------|--------|
| business | BusinessProfile | Business aggregate |
| publishStatus | ChannelStatus[] | Publishing aggregate |
| proposalCount | number | Proposal count |
| recentEvents | DomainEvent[] | History |
| capabilities | Capability[] | GovernanceReadModel |
| featureFlags | FeatureFlag[] | GovernanceReadModel |
| revisions | Revision[] | PublishingReadModel |
| proposals | Proposal[] | ProposalListReadModel |

### GovernanceReadModel

**Read Model** consumed by DashboardRenderer.

| Field | Type | Source |
|-------|------|--------|
| capabilities | Capability[] | BusinessPolicy (policyType=capability) |
| featureFlags | FeatureFlag[] | BusinessPolicy (policyType=feature_flag) |

### PublishingReadModel

**Read Model** consumed by DashboardRenderer and revision history endpoints.

| Field | Type | Source |
|-------|------|--------|
| channels | Channel[] | Publishing aggregate |
| revisions | Revision[] | Publishing aggregate |
| latestRevision | Revision | Publishing aggregate |

### ProposalListReadModel

**Read Model** consumed by DashboardRenderer and proposal list endpoints.

| Field | Type | Source |
|-------|------|--------|
| proposals | Proposal[] | AI Proposal aggregate |
| pendingCount | number | Proposal count |
| acceptedCount | number | Proposal count |
| rejectedCount | number | Proposal count |

### Read-Only Consumer Stories

Stories 15-20 (Contact Actions, Interactive Map, Business Hours Display, Social Media Links, SEO Optimization, Mobile Optimization) are consumer-facing read-only stories. Their compiler pipelines go directly from Business Graph to Read Model to Renderer, bypassing the Command stage. The data they display was written by commands from Stories 3, 5, 6, and 8. These stories do not require Commands — this is a documented exception to the traceability rule.

---

## Capability Registry

Data-driven feature flags attached to Business.

### Capabilities

| Capability | Category | Description |
|------------|----------|-------------|
| menu | catalog | Products and services display |
| services | catalog | Service bookings |
| contact | business | Contact information |
| hours | business | Business hours |
| delivery | catalog | Delivery options |
| booking | publishing | Appointment booking |
| reviews | publishing | Customer reviews |
| inventory | catalog | Stock tracking |
| payments | publishing | Online payments |
| orders | publishing | Order management |

### Category → Capability Mapping

| Category | Default Capabilities |
|----------|---------------------|
| bakery | menu, contact, hours, delivery |
| salon | services, contact, hours |
| restaurant | menu, contact, hours, delivery |
| grocery | menu, contact, hours, delivery |
| pharmacy | menu, contact, hours |
| clothing | menu, contact, hours |
| sweets | menu, contact, hours, delivery |
| kirana | menu, contact, hours, delivery |
| tailor | services, contact, hours |
| jewellery | menu, contact, hours |
| gym | services, contact, hours |
| tuition | services, contact, hours |
| electronics | menu, contact, hours |
| hardware | menu, contact, hours |
| general | menu, contact, hours |

---

## Identity Context

### User Aggregate

**Aggregate Root:** User
**Lifecycle:** Created → Active → Suspended → Deleted

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| email | string | required, unique, RFC 5322 format |
| createdAt | DateTime | required |

#### Invariants
1. email must be unique across all Users
2. email must be valid format
3. A User can own at most one Business (in V1)

### Session Entity

| Field | Type | Constraints |
|-------|------|-------------|
| token | string | required, unique |
| userId | string | required, references User |
| expiresAt | DateTime | required, must be in the future |
| createdAt | DateTime | required |

#### Invariants
1. token must be unique
2. expiresAt must be after createdAt
3. Session must reference a valid User

---

## Governance Context

### BusinessPolicy Aggregate

**Aggregate Root:** BusinessPolicy
**Lifecycle:** Created → Active → Updated → Deleted

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| businessId | string | required, references Business |
| policyType | PolicyType | required |
| key | string | required |
| value | string | required |
| createdAt | DateTime | required |
| updatedAt | DateTime | required |

#### PolicyType Enum
- capability: Feature capability (menu, services, contact, etc.)
- feature_flag: Runtime feature toggle (booking_enabled, reviews_enabled, etc.)

#### Invariants
1. policyType must be from the valid PolicyType enum
2. key must be non-empty
3. value must be valid for the policyType
4. The combination of (businessId, policyType, key) must be unique
5. BusinessPolicy must reference a valid Business

### GovernanceReadModel

**Read Model** consumed by DashboardRenderer.

| Field | Type | Source |
|-------|------|--------|
| capabilities | Capability[] | BusinessPolicy (policyType=capability) |
| featureFlags | FeatureFlag[] | BusinessPolicy (policyType=feature_flag) |

---

## History Context

### DomainEvent Aggregate

**Aggregate Root:** DomainEvent
**Lifecycle:** Created (append-only, immutable)

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | cuid, required |
| businessId | string | required, references Business |
| aggregateType | string | required |
| aggregateId | string | required |
| eventType | string | required |
| payload | string | required (JSON) |
| metadata | string \| null | optional (JSON) |
| createdAt | DateTime | required |

#### Invariants
1. DomainEvent is append-only (no updates, no deletes)
2. aggregateType must be non-empty
3. aggregateId must be non-empty
4. eventType must be non-empty
5. payload must be valid JSON
6. DomainEvent must reference a valid Business
7. Events are ordered by createdAt (monotonically increasing)

---

## Lifecycle Diagrams

### Business Lifecycle

```text
[CreateBusiness]
       │
       ▼
    Created ──── [UpdateBusinessProfile] ──── Active
       │              │
       │              ▼
       │        ProfileUpdated
       │
       ▼
  [PublishChannel]
       │
       ▼
   Published ──── [UnpublishChannel] ──── Unpublished
       │                                      │
       ▼                                      ▼
  ChannelPublished                      ChannelUnpublished
```

### Proposal Lifecycle

```text
[SubmitProposal]
       │
       ▼
    Pending ──── [AcceptProposal] ──── Accepted
       │              │
       │              ▼
       │        ProposalAccepted
       │              │
       │              ▼
       │        Commands Executed
       │
       ▼
  [RejectProposal]
       │
       ▼
    Rejected
```
