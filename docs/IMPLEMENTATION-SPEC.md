# ApnaSite AI — Implementation Specification

> **Status:** Frozen
> **Last updated:** 2026-07-13
> **Owner:** Architecture

This document defines the technical implementation specification for ApnaSite AI. It maps the domain model (see `DOMAIN-MODEL.md`) to concrete technology choices and persistence schemas.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.x | App router, API routes, SSR |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| ORM | Prisma | 6.x | Database access (pinned to v6) |
| Database | SQLite (dev) / PostgreSQL (prod) | — | Persistence |
| AI | Claude API | — | Intent extraction only |
| Auth | OTP via email | — | Passwordless authentication |
| Payments | Razorpay | — | Subscription billing |
| Object Storage | Local (dev) / S3 (prod) | — | File uploads |

---

## Project Structure

```text
apnasite-ai/
├── app/                    # Next.js app router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── business/      # Business CRUD (new)
│   │   ├── catalog/       # Catalog management (new)
│   │   ├── publishing/    # Publishing endpoints (new)
│   │   ├── proposals/     # AI proposal endpoints (new)
│   │   └── upload/        # File upload
│   ├── dashboard/         # Owner dashboard
│   ├── billing/           # Subscription management
│   ├── login/             # Authentication
│   └── s/[slug]/          # Public storefront
├── components/            # React components
│   ├── business/          # Business profile editors (new)
│   ├── catalog/           # Product/service editors (new)
│   ├── publishing/        # Channel configuration (new)
│   └── ui/                # Shared UI components
├── lib/                   # Server-side logic
│   ├── domain/            # Domain model (new)
│   ├── commands/          # Command handlers (new)
│   ├── events/            # Event handlers (new)
│   ├── read-models/       # Read model projections (new)
│   ├── renderers/         # Channel-specific renderers (new)
│   ├── ai/                # AI integration (new)
│   └── legacy/            # Anti-corruption layer (new)
├── prisma/                # Database schema
│   ├── schema.prisma      # Prisma schema
│   └── migrations/        # Database migrations
├── docs/                  # Architecture documentation
│   ├── adr/               # Architecture Decision Records
│   ├── GLOSSARY.md
│   ├── COMPILER-PIPELINE.md
│   ├── DOMAIN-MODEL.md
│   ├── IMPLEMENTATION-SPEC.md
│   ├── PRD.md
│   └── MIGRATION-PLAN.md
└── tests/                 # Test files
```

---

## Persistence Schema

### Prisma Models

#### User (Existing)

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  createdAt    DateTime      @default(now())
  sessions     Session[]
  businesses   Business[]    // Changed from sites
  subscription Subscription?
}

model Session {
  token     String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}

model Subscription {
  id                     String    @id @default(cuid())
  userId                 String    @unique
  user                   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  planKey                String
  razorpaySubscriptionId String    @unique
  status                 String
  currentPeriodEnd       DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

#### Business (New)

```prisma
model Business {
  id          String   @id @default(cuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name        String
  slug        String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  profile     BusinessProfile?
  contact     ContactInformation?
  address     Address?
  location    GeoLocation?
  hours       BusinessHours?
  photos      PhotoGallery?
  socialLinks SocialLinks?
  catalog     Catalog?
  publishing  Publishing?
  proposals   Proposal[]
  policies    BusinessPolicy[]
  events      DomainEvent[]

  @@index([ownerId])
  @@index([slug])
}
```

#### BusinessProfile (New)

```prisma
model BusinessProfile {
  id          String  @id @default(cuid())
  businessId  String  @unique
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  tagline     String?
  category    String
  language    String  @default("hinglish")
  themeOverride String?
  description String?
}
```

#### ContactInformation (New)

```prisma
model ContactInformation {
  id            String  @id @default(cuid())
  businessId    String  @unique
  business      Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  phone         String?
  whatsapp      String?
  email         String?
  alternatePhone String?
  supportEmail  String?
}
```

#### Address (New)

```prisma
model Address {
  id          String  @id @default(cuid())
  businessId  String  @unique
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  shopNumber  String?
  building    String?
  street      String?
  landmark    String?
  area        String?
  city        String
  district    String?
  state       String
  country     String  @default("IN")
  postalCode  String?
}
```

#### GeoLocation (New)

```prisma
model GeoLocation {
  id          String  @id @default(cuid())
  businessId  String  @unique
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  latitude    Float
  longitude   Float
  accuracy    Float?
  source      String  @default("manual")
}
```

#### BusinessHours (New)

```prisma
model BusinessHours {
  id         String  @id @default(cuid())
  businessId String  @unique
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  monday     String? // JSON: { isOpen, openTime, closeTime }
  tuesday    String?
  wednesday  String?
  thursday   String?
  friday     String?
  saturday   String?
  sunday     String?
}
```

#### PhotoGallery (New)

```prisma
model PhotoGallery {
  id         String  @id @default(cuid())
  businessId String  @unique
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  photos     Photo[]
}

model Photo {
  id            String   @id @default(cuid())
  galleryId     String
  gallery       PhotoGallery @relation(fields: [galleryId], references: [id], onDelete: Cascade)
  filename      String
  storagePath   String
  thumbnailPath String?
  altText       String   @default("")
  imageType     String
  sortOrder     Int
  uploadedAt    DateTime @default(now())
  uploadedBy    String

  @@index([galleryId])
  @@index([imageType])
}
```

#### SocialLinks (New)

```prisma
model SocialLinks {
  id         String  @id @default(cuid())
  businessId String  @unique
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  instagram  String?
  facebook   String?
  youtube    String?
  linkedin   String?
  twitter    String?
  telegram   String?
}
```

#### Catalog (New)

```prisma
model Catalog {
  id         String     @id @default(cuid())
  businessId String     @unique
  business   Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
  products   Product[]
  services   Service[]
}

model Product {
  id          String   @id @default(cuid())
  catalogId   String
  catalog     Catalog  @relation(fields: [catalogId], references: [id], onDelete: Cascade)
  name        String
  description String?
  price       String?
  image       String?
  stock       Int?
  sku         String?
  sortOrder   Int      @default(0)

  @@index([catalogId])
}

model Service {
  id          String   @id @default(cuid())
  catalogId   String
  catalog     Catalog  @relation(fields: [catalogId], references: [id], onDelete: Cascade)
  name        String
  description String?
  price       String?
  duration    String?
  sortOrder   Int      @default(0)

  @@index([catalogId])
}
```

#### Publishing (New)

```prisma
model Publishing {
  id         String    @id @default(cuid())
  businessId String    @unique
  business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  channels   Channel[]
  revisions  Revision[]
}

model Channel {
  id            String   @id @default(cuid())
  publishingId  String
  publishing    Publishing @relation(fields: [publishingId], references: [id], onDelete: Cascade)
  channelType   String
  config        String?  // JSON
  status        String   @default("draft")
  slug          String?  @unique
  publishedAt   DateTime?
  unpublishedAt DateTime?

  @@index([publishingId])
  @@index([channelType])
}

model Revision {
  id           String   @id @default(cuid())
  publishingId String
  publishing   Publishing @relation(fields: [publishingId], references: [id], onDelete: Cascade)
  channelId    String
  version      Int
  snapshot     String   // JSON: full BusinessGraph state
  events       String?  // JSON: events since last snapshot
  createdAt    DateTime @default(now())

  @@index([publishingId])
  @@index([channelId])
  @@index([version])
}
```

#### Proposal (New)

```prisma
model Proposal {
  id               String   @id @default(cuid())
  businessId       String
  business         Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  source           String
  suggestedChanges String   // JSON: SuggestedChange[]
  confidence       Float
  reasoning        String
  status           String   @default("pending")
  createdAt        DateTime @default(now())
  resolvedAt       DateTime?

  @@index([businessId])
  @@index([status])
}
```

#### DomainEvent (New)

```prisma
model DomainEvent {
  id          String   @id @default(cuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  aggregateType String
  aggregateId String
  eventType   String
  payload     String   // JSON
  metadata    String?  // JSON
  createdAt   DateTime @default(now())

  @@index([businessId])
  @@index([aggregateType, aggregateId])
  @@index([eventType])
  @@index([createdAt])
}
```

#### BusinessPolicy (New)

```prisma
model BusinessPolicy {
  id         String  @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  policyType String
  key        String
  value      String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([businessId, policyType, key])
  @@index([businessId])
}
```

---

## API Contracts

### Business Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business | Get current user's business | Required |
| POST | /api/business | Create new business | Required |
| PUT | /api/business | Update business profile | Required, Owner |
| GET | /api/business/[id] | Get business by id | Required, Owner |

### Contact Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/contact | Get contact info | Required, Owner |
| PUT | /api/business/[id]/contact | Update contact info | Required, Owner |

### Address Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/address | Get address | Required, Owner |
| PUT | /api/business/[id]/address | Update address | Required, Owner |

### Location Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/location | Get location | Required, Owner |
| PUT | /api/business/[id]/location | Update location | Required, Owner |

### Hours Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/hours | Get business hours | Required, Owner |
| PUT | /api/business/[id]/hours | Update business hours | Required, Owner |

### Photo Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/photos | Get photos | Required, Owner |
| POST | /api/business/[id]/photos | Upload photo | Required, Owner |
| PUT | /api/business/[id]/photos/reorder | Reorder photos | Required, Owner |
| DELETE | /api/business/[id]/photos/[photoId] | Delete photo | Required, Owner |

### Social Links Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/social | Get social links | Required, Owner |
| PUT | /api/business/[id]/social | Update social links | Required, Owner |

### Catalog Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/catalog | Get catalog | Required, Owner |
| POST | /api/business/[id]/catalog | Create catalog | Required, Owner |
| POST | /api/business/[id]/catalog/products | Add product | Required, Owner |
| PUT | /api/business/[id]/catalog/products/[productId] | Update product | Required, Owner |
| DELETE | /api/business/[id]/catalog/products/[productId] | Delete product | Required, Owner |
| POST | /api/business/[id]/catalog/services | Add service | Required, Owner |
| PUT | /api/business/[id]/catalog/services/[serviceId] | Update service | Required, Owner |
| DELETE | /api/business/[id]/catalog/services/[serviceId] | Delete service | Required, Owner |

### Publishing Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/business/[id]/publishing | Get publishing config | Required, Owner |
| POST | /api/business/[id]/publishing/channels | Configure channel | Required, Owner |
| POST | /api/business/[id]/publishing/channels/[channelId]/publish | Publish channel | Required, Owner |
| POST | /api/business/[id]/publishing/channels/[channelId]/unpublish | Unpublish channel | Required, Owner |
| PUT | /api/business/[id]/publishing/channels/[channelId]/config | Update channel config | Required, Owner |
| GET | /api/business/[id]/publishing/revisions | Get revisions | Required, Owner |

### Proposal Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/proposals | Submit proposal (AI) | Required |
| GET | /api/proposals | List proposals | Required, Owner |
| POST | /api/proposals/[id]/accept | Accept proposal | Required, Owner |
| POST | /api/proposals/[id]/reject | Reject proposal | Required, Owner |

---

## Repository Pattern

Each aggregate has a repository interface and a Prisma implementation.

```typescript
// lib/domain/business/repository.ts
interface BusinessRepository {
  findById(id: string): Promise<Business | null>;
  findBySlug(slug: string): Promise<Business | null>;
  findByOwnerId(ownerId: string): Promise<Business | null>;
  save(business: Business): Promise<void>;
}

// lib/domain/business/prisma-repository.ts
class PrismaBusinessRepository implements BusinessRepository {
  async findById(id: string): Promise<Business | null> {
    const record = await prisma.business.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }
  // ... other methods
}
```

---

## Command Handlers

Each command has a handler that:
1. Loads the aggregate from the repository
2. Executes the command against the aggregate
3. Persists the updated aggregate
4. Emits domain events

```typescript
// lib/commands/update-business-profile.ts
async function handleUpdateBusinessProfile(
  command: UpdateBusinessProfileCommand
): Promise<void> {
  const business = await businessRepository.findById(command.businessId);
  if (!business) throw new BusinessNotFoundError(command.businessId);

  business.updateProfile(command.profile);
  await businessRepository.save(business);

  await eventEmitter.emit(new BusinessProfileUpdated(
    business.id,
    command.profile
  ));
}
```

---

## Event Handlers

Event handlers project domain events into read models.

```typescript
// lib/events/handlers/website-read-model.ts
async function onBusinessProfileUpdated(event: BusinessProfileUpdated): Promise<void> {
  await websiteReadModelRepository.update(event.businessId, {
    business: event.profile
  });
}
```

---

## Renderer Pattern

Renderers are pure functions that transform read models into artifacts.

```typescript
// lib/renderers/website.ts
function renderWebsite(readModel: WebsiteReadModel): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${readModel.business.name}</title>
        <meta name="description" content="${readModel.business.tagline}" />
      </head>
      <body>
        <h1>${readModel.business.name}</h1>
        ${renderHero(readModel)}
        ${renderContact(readModel.contact)}
        ${renderAddress(readModel.address)}
        ${renderHours(readModel.hours)}
        ${renderProducts(readModel.products)}
        ${renderGallery(readModel.photos)}
        ${renderMap(readModel.location)}
        ${renderSocialLinks(readModel.socialLinks)}
      </body>
    </html>
  `;
}
```

---

## Anti-Corruption Layer

The Anti-Corruption Layer translates between the legacy Site model and the new Business aggregate.

```typescript
// lib/legacy/site-to-business.ts
function siteToBusiness(site: Site): Business {
  const data = JSON.parse(site.data) as StorefrontData;
  return Business.create({
    ownerId: site.userId,
    name: data.shopName,
    profile: {
      tagline: data.tagline,
      category: data.category,
      language: data.language,
      themeOverride: data.themeOverride,
      description: data.aboutText
    },
    contact: {
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email
    },
    address: parseAddress(data.address),
    hours: parseHours(data.hours),
    catalog: {
      products: data.products.map(toProduct)
    }
  });
}
```

---

## Testing Strategy

### Unit Tests
- Domain model invariants
- Command handlers
- Event handlers
- Repository methods
- Renderer output

### Integration Tests
- API endpoints
- Command → Event → Read Model flow
- Proposal submission → Acceptance → Execution

### E2E Tests
- Business creation → Profile update → Publishing
- Proposal submission → Review → Acceptance

### Architecture Tests
- No infrastructure imports in domain layer
- No direct database access in renderers
- All commands produce events
- All events belong to exactly one aggregate

---

## Migration Strategy

See `MIGRATION-PLAN.md` for the detailed migration phases.

Key constraints:
1. Existing Site model continues to work during migration
2. Anti-Corruption Layer translates between old and new models
3. No downtime during migration
4. Rollback capability at every phase
