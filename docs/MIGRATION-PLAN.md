# ApnaSite AI — Migration Plan

> **Status:** Living
> **Last updated:** 2026-07-13
> **Owner:** Engineering

This document defines the migration strategy from the legacy Site model to the new Business aggregate. It is a living document that evolves as the migration progresses.

---

## Migration Strategy

The migration follows an incremental approach with zero downtime. The Anti-Corruption Layer (see ADR-008) translates between the legacy Site model and the new Business aggregate during the transition period.

---

## Phase 1: New Prisma Tables

**Status:** Not Started
**Duration:** 1-2 days

### Objective
Add new Prisma tables alongside the existing `Site` table without breaking existing functionality.

### Tasks
1. Create new Prisma models:
   - Business
   - BusinessProfile
   - ContactInformation
   - Address
   - GeoLocation
   - BusinessHours
   - PhotoGallery
   - Photo
   - SocialLinks
   - Catalog
   - Product
   - Service
   - Publishing
   - Channel
   - Revision
   - Proposal
   - DomainEvent
   - BusinessPolicy

2. Run `prisma db push` to create tables
3. Verify existing functionality still works
4. Write tests for new models

### Rollback
Drop the new tables. Existing Site model is unaffected.

### Verification
- All existing tests pass
- New models are created successfully
- No data loss in existing tables

---

## Phase 2: Anti-Corruption Layer

**Status:** Not Started
**Duration:** 2-3 days

### Objective
Create a translation layer between the legacy Site model and the new Business aggregate.

### Tasks
1. Create `lib/legacy/site-to-business.ts`:
   - Parse `StorefrontData` from Site.data
   - Map to Business aggregate fields
   - Handle missing fields gracefully

2. Create `lib/legacy/business-to-site.ts`:
   - Serialize Business aggregate to `StorefrontData`
   - Maintain backward compatibility

3. Create repository implementations:
   - `PrismaBusinessRepository`
   - `PrismaCatalogRepository`
   - `PrismaPublishingRepository`

4. Write integration tests for ACL

### Rollback
Remove ACL code. Existing Site model is unaffected.

### Verification
- ACL correctly translates Site → Business
- ACL correctly translates Business → Site
- All existing tests pass
- New integration tests pass

---

## Phase 3: First Vertical Slice

**Status:** Not Started
**Duration:** 3-5 days

### Objective
Implement the first end-to-end flow using the new domain model: Business creation → Product catalog → Website publishing.

### Tasks
1. Create API endpoints:
   - `POST /api/business` — Create business
   - `PUT /api/business` — Update business profile
   - `POST /api/business/[id]/catalog/products` — Add product
   - `POST /api/business/[id]/publishing/channels` — Configure website channel
   - `POST /api/business/[id]/publishing/channels/[channelId]/publish` — Publish

2. Create command handlers:
   - `CreateBusiness`
   - `UpdateBusinessProfile`
   - `AddProduct`
   - `ConfigureChannel`
   - `PublishChannel`

3. Create event handlers:
   - Project events to WebsiteReadModel

4. Create renderers:
   - `WebsiteRenderer` — Pure function, Read Model → HTML

5. Create UI components:
   - Business profile editor
   - Product catalog editor
   - Publishing configuration

6. Write end-to-end tests

### Rollback
Remove new endpoints and components. Legacy Site model continues to work.

### Verification
- User can create a business via new API
- User can add products via new API
- User can publish website via new API
- Published website renders correctly
- All tests pass

---

## Phase 4: Data Migration

**Status:** Not Started
**Duration:** 2-3 days

### Objective
Migrate existing Site data to the new Business aggregate.

### Tasks
1. Create migration script:
   - Read all existing Sites
   - Translate each Site to Business using ACL
   - Save Business to new tables
   - Verify data integrity

2. Create verification script:
   - Compare Site.data with Business aggregate
   - Log any discrepancies
   - Allow manual correction

3. Run migration in staging
4. Verify all sites render correctly
5. Run migration in production

### Rollback
Delete migrated Business records. Site data is unchanged.

### Verification
- All existing sites have corresponding Business records
- All Business records have correct data
- All published sites render correctly
- No data loss

---

## Phase 5: Remove Legacy Model

**Status:** Not Started
**Duration:** 1-2 days

### Objective
Remove the legacy Site model and ACL after migration is complete and verified.

### Tasks
1. Verify all users have migrated to new UI
2. Remove ACL code
3. Remove Site model from Prisma schema
4. Remove legacy API endpoints
5. Remove legacy UI components
6. Update tests

### Rollback
Restore Site model from git history.

### Verification
- All functionality works with new domain model
- No references to legacy Site model
- All tests pass
- No performance degradation

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 1-2 days | None |
| Phase 2 | 2-3 days | Phase 1 |
| Phase 3 | 3-5 days | Phase 2 |
| Phase 4 | 2-3 days | Phase 3 |
| Phase 5 | 1-2 days | Phase 4 |
| **Total** | **9-15 days** | |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Backup before each phase; verification scripts |
| Downtime | Incremental migration; zero-downtime strategy |
| Performance degradation | Benchmark before/after; optimize as needed |
| Feature regression | Comprehensive test suite; rollback capability |
| User confusion | Parallel systems during transition; clear communication |

---

## Success Criteria

The migration is complete when:
1. All existing sites have corresponding Business records
2. All published sites render correctly from Business data
3. New features (Business Profile, Photos, Location) work correctly
4. No references to legacy Site model remain
5. All tests pass
6. No performance degradation
