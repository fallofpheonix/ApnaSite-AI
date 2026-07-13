# ApnaSite AI — Product Requirements Document

> **Status:** Living
> **Last updated:** 2026-07-13
> **Owner:** Product

This document defines the product vision, target users, and feature requirements for ApnaSite AI. It is a living document that evolves as the product matures.

---

## Vision

**"Speak once. Every place your business appears updates automatically."**

ApnaSite AI is a Business Knowledge Platform — a compiler for business knowledge. The Business Graph serves as the canonical intermediate representation (IR) powering multiple output channels (Website, WhatsApp, Google Business, Instagram, etc.).

---

## Problem Statement

India's 63 million small businesses struggle with online presence. They need to maintain consistency across:
- Their website
- WhatsApp Business
- Google Business Profile
- Social media

Today, this requires manual updates across multiple platforms, leading to:
- Inconsistent information
- Wasted time
- Lost customers
- No analytics

---

## Target User (ICP)

**Primary Persona:** Bakery owner in Tier 2 Indian city (Lucknow, Pune, Jaipur, Indore, Bhopal)

**Characteristics:**
- Primary interface is WhatsApp, not website
- Limited technical skills
- Speaks Hindi, English, or Hinglish
- Needs to manage products, hours, contact info
- Wants customers to find them online

---

## Value Proposition

1. **Single Source of Truth:** Describe your business once, publish everywhere
2. **AI-Powered:** Voice or text input, AI extracts structured data
3. **Channel-Aware:** Each channel gets optimized content
4. **Always Current:** Update once, all channels reflect changes
5. **Indian-First:** Designed for Indian businesses and customers

---

## User Stories

### Story 1: Business Creation
**As a** shop owner
**I want to** describe my business using voice or text
**So that** ApnaSite AI creates a structured Business Profile

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph
```

### Story 2: Product Catalog
**As a** shop owner
**I want to** add, update, and remove products
**So that** my catalog is always current

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 3: Contact Information
**As a** shop owner
**I want to** update my phone, WhatsApp, and email
**So that** customers can reach me

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 4: Business Address
**As a** shop owner
**I want to** set my business address
**So that** customers can find me

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 5: Business Location
**As a** shop owner
**I want to** set my GPS coordinates (manually or automatically)
**So that** customers can navigate to me

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 6: Business Hours
**As a** shop owner
**I want to** set my opening hours for each day
**So that** customers know when I'm open

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 7: Business Photos
**As a** shop owner
**I want to** upload my logo, cover image, and gallery photos
**So that** customers see my business visually

**Compiler Pipeline:**
```text
Upload → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 8: Social Links
**As a** shop owner
**I want to** add my Instagram, Facebook, and YouTube links
**So that** customers can follow me on social media

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 9: Website Publishing
**As a** shop owner
**I want to** publish my business as a website
**So that** customers can find me online

**Compiler Pipeline:**
```text
Business Graph → Read Model → Website Renderer → HTML Artifact → Deployment
```

### Story 10: WhatsApp Publishing
**As a** shop owner
**I want to** publish my business information to WhatsApp
**So that** customers see my details on WhatsApp

**Compiler Pipeline:**
```text
Business Graph → Read Model → WhatsApp Renderer → Message Artifact → Deployment
```

### Story 11: Google Business Publishing
**As a** shop owner
**I want to** publish my business to Google Business
**So that** customers find me on Google Search and Maps

**Compiler Pipeline:**
```text
Business Graph → Read Model → Google Business Renderer → Listing Artifact → Deployment
```

### Story 12: AI Proposals
**As a** shop owner
**I want to** review AI suggestions before they're applied
**So that** I maintain control over my business data

**Compiler Pipeline:**
```text
Voice/Text → Parser → Intent Extraction (AI) → Proposal → Owner Review → Accept/Reject → Commands
```

### Story 13: Product Images
**As a** shop owner
**I want to** upload images for my products
**So that** customers see what they're buying

**Compiler Pipeline:**
```text
Upload → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 14: Gallery Reordering
**As a** shop owner
**I want to** reorder my gallery photos
**So that** the best photos appear first

**Compiler Pipeline:**
```text
Reorder Request → Validation → Commands → Business Graph → Read Models → Artifacts
```

### Story 15: Contact Actions
**As a** customer
**I want to** call, WhatsApp, email, or navigate to the business
**So that** I can easily connect with them

**Compiler Pipeline:**
```text
Business Graph → Read Model → Contact Actions Renderer → Action Buttons
```

### Story 16: Interactive Map
**As a** customer
**I want to** see the business location on a map
**So that** I can navigate there

**Compiler Pipeline:**
```text
Business Graph → Read Model → Map Renderer → Embedded Map Artifact
```

### Story 17: Business Hours Display
**As a** customer
**I want to** see if the business is currently open
**So that** I don't waste a trip

**Compiler Pipeline:**
```text
Business Graph → Read Model → Hours Renderer → "Open Now" / "Closed" Display
```

### Story 18: Social Media Links
**As a** customer
**I want to** see the business's social media links
**So that** I can follow them

**Compiler Pipeline:**
```text
Business Graph → Read Model → Social Links Renderer → Icon Links
```

### Story 19: SEO Optimization
**As a** shop owner
**I want** my website to be SEO-optimized
**So that** customers find me on Google

**Compiler Pipeline:**
```text
Business Graph → Read Model → SEO Renderer → Meta Tags, Structured Data
```

### Story 20: Mobile Optimization
**As a** customer
**I want** the business website to work well on my phone
**So that** I can browse on mobile

**Compiler Pipeline:**
```text
Business Graph → Read Model → Mobile Renderer → Responsive HTML
```

---

## V1 Scope

### In Scope
- Identity (User, Session, Auth)
- Business (Profile, Contact, Address, Location, Hours, Photos, Social Links)
- Catalog (Products, Services)
- Publishing (Website channel)
- AI Proposal (Voice/Text → Proposal → Accept/Reject)
- History (Domain Events, Audit Trail)

### Out of V1 Scope
- Orders
- Booking
- Reviews
- Analytics
- CRM
- Inventory
- Automation
- Intelligence
- Marketplace
- WhatsApp channel
- Google Business channel
- Instagram channel

---

## V2 Roadmap

### Phase 2A: Publishing Channels
- WhatsApp channel
- Google Business channel
- Instagram channel

### Phase 2B: Commerce
- Orders
- Payments
- Inventory

### Phase 2C: Engagement
- Reviews
- Booking
- CRM

### Phase 2D: Intelligence
- Analytics
- Automation
- Intelligence
- Marketplace

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first publish | < 5 minutes |
| User retention (30 day) | > 40% |
| NPS | > 50 |
| Website load time | < 2 seconds |
| AI proposal accuracy | > 85% |

---

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | 1 published site, badge |
| Pro | ₹199/mo | 5 sites, no badge, custom domain |

---

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| booking_enabled | false | Enable appointment booking |
| reviews_enabled | false | Enable customer reviews |
| analytics_enabled | false | Enable analytics dashboard |
| orders_enabled | false | Enable order management |
| google_publishing | false | Enable Google Business publishing |
| instagram_publishing | false | Enable Instagram publishing |
| ai_generation | true | Enable AI proposal generation |
| multi_branch | false | Enable multi-branch support |
