# Risk Management

## Layer Position

```
┌─────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                  │
├─────────────────────────────────────────────────────┤
│              SECURITY FUNDAMENTALS                   │
│  ┌───────────────────────────────────────────────┐  │
│  │              RISK MANAGEMENT                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │  Risk    │ │ Threat   │ │    Risk      │  │  │
│  │  │Assessment│ │ Modeling │ │  Treatment   │  │  │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │  │
│  │       │             │              │           │  │
│  │       ▼             ▼              ▼           │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  BCP │ DR │ Risk Register │ Reporting   │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│              GOVERNANCE LAYER                        │
│  Policies │ Compliance │ Standards │ Frameworks     │
└─────────────────────────────────────────────────────┘
```

## What is Risk Management?

Risk management is the systematic process of identifying, assessing, and responding to threats that could compromise organizational assets. It provides the framework for allocating finite security resources to protect against the most critical risks.

**Core Formula:**
```
Risk = Threat × Vulnerability × Impact
     = Likelihood × Consequence
```

## Why Learn It?

- Security resources are finite — risk management prioritizes their allocation
- Bridges gap between technical controls and business objectives
- Foundation of every compliance framework (NIST, ISO 27001, GDPR)
- Every security decision is a risk trade-off
- Required for CISSP, CISM, CRISC certifications

---

## Risk Assessment Process

### Overview

```
┌─────────────────────────────────────────────────────┐
│           RISK ASSESSMENT LIFECYCLE                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐                                   │
│  │ 1. Identify  │  ──▶ Assets, threats,             │
│  │    Assets    │      vulnerabilities              │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 2. Identify  │  ──▶ Threat sources and          │
│  │   Threats    │      threat events                │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 3. Identify  │  ──▶ Weaknesses that could       │
│  │Vulnerabilities│     be exploited                 │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 4. Determine │  ──▶ Likelihood of occurrence    │
│  │  Likelihood  │                                   │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 5. Determine │  ──▶ Business impact if          │
│  │   Impact     │      risk materializes            │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 6. Calculate │  ──▶ Risk = Likelihood × Impact  │
│  │    Risk      │                                   │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 7. Prioritize│  ──▶ Rank risks for treatment    │
│  │   Risks      │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

### Step 1: Asset Identification

| Asset Type | Examples | Value Metric |
|------------|----------|--------------|
| Data | Customer PII, financial records, IP | Revenue, reputation, legal |
| Hardware | Servers, workstations, network devices | Replacement cost, downtime |
| Software | Applications, databases, OS | Development cost, licensing |
| People | Employees, contractors, partners | Training cost, productivity |
| Facilities | Data centers, offices | Construction, lease cost |
| Reputation | Brand, customer trust | Market value, customer churn |

**Asset Valuation Methods:**
```
┌─────────────────────────────────────────────────────┐
│           ASSET VALUATION                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Purchase Cost: What you paid                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ Server cost: $10,000                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Replacement Cost: What it costs to replace        │
│  ┌─────────────────────────────────────────────┐   │
│  │ New server + migration: $15,000              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Business Value: Revenue generated/protected       │
│  ┌─────────────────────────────────────────────┐   │
│  │ Server generates $100K/month revenue         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Total Cost of Ownership (TCO):                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Hardware + Software + Personnel + Operations │   │
│  │ + Maintenance + Training + Depreciation     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Step 2: Threat Identification

| Threat Category | Examples | Source |
|-----------------|----------|--------|
| Natural | Flood, earthquake, fire, lightning | Environmental |
| Human (Intentional) | Hacking, insider threat, terrorism | Adversarial |
| Human (Unintentional) | Accidental deletion, misconfiguration | Negligent |
| Technical | Hardware failure, software bug, power outage | System |
| Environmental | HVAC failure, water damage | Physical |
| Supply Chain | Vendor compromise, component shortage | Third-party |

### Step 3: Vulnerability Identification

**Vulnerability Sources:**

| Source | Method |
|--------|--------|
| Vulnerability Scanning | Nessus, Qualys, OpenVAS |
| Penetration Testing | Manual/automated exploitation |
| Code Review | Static analysis (SAST) |
| Configuration Audit | CIS Benchmarks, DISA STIGs |
| Physical Inspection | Facility walk-through |
| Process Review | Policy/procedure assessment |
| Vendor Advisories | CVE database, security bulletins |

### Step 4-7: Risk Calculation

#### Qualitative Risk Assessment

```
┌─────────────────────────────────────────────────────┐
│          QUALITATIVE RISK MATRIX                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│              IMPACT                                 │
│         Low    Medium   High    Critical            │
│       ┌──────┬────────┬───────┬──────────┐         │
│ High  │ Med  │ High   │ V.High│ Critical │         │
│ L     ├──────┼────────┼───────┼──────────┤         │
│ i Med │ Low  │ Med    │ High  │ V.High   │         │
│ k     ├──────┼────────┼───────┼──────────┤         │
│ e Low │ V.Low│ Low    │ Med   │ High     │         │
│ l     ├──────┼────────┼───────┼──────────┤         │
│ y V.Low│ V.Low│ V.Low │ Low   │ Med      │         │
│       └──────┴────────┴───────┴──────────┘         │
│                                                     │
│  Risk Rating = Likelihood × Impact                  │
└─────────────────────────────────────────────────────┘
```

**Qualitative Scales:**

| Factor | Low (1) | Medium (2) | High (3) | Critical (4) |
|--------|---------|------------|----------|--------------|
| Likelihood | Rare | Possible | Probable | Almost Certain |
| Impact | Minimal | Moderate | Significant | Severe |
| Financial | < $10K | $10K-$100K | $100K-$1M | > $1M |
| Reputational | Minor | Moderate | Major | Catastrophic |
| Legal | No violation | Regulatory inquiry | Lawsuit | Criminal charges |

#### Quantitative Risk Assessment

```
┌─────────────────────────────────────────────────────┐
│          QUANTITATIVE METRICS                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Single Loss Expectancy (SLE):                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ SLE = Asset Value × Exposure Factor          │   │
│  │                                              │   │
│  │ Example:                                     │   │
│  │ Asset: Customer database ($1,000,000)        │   │
│  │ Exposure Factor: 40% (partial breach)        │   │
│  │ SLE = $1,000,000 × 0.40 = $400,000          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Annualized Rate of Occurrence (ARO):              │
│  ┌─────────────────────────────────────────────┐   │
│  │ ARO = Expected frequency per year           │   │
│  │                                              │   │
│  │ Example:                                     │   │
│  │ DDoS attack occurs every 2 years             │   │
│  │ ARO = 0.5                                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Annual Loss Expectancy (ALE):                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ALE = SLE × ARO                             │   │
│  │                                              │   │
│  │ Example:                                     │   │
│  │ ALE = $400,000 × 0.5 = $200,000/year        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Return on Security Investment (ROSI):             │
│  ┌─────────────────────────────────────────────┐   │
│  │ ROSI = (ALE_before - ALE_after - Cost) /    │   │
│  │        Cost × 100%                          │   │
│  │                                              │   │
│  │ Example:                                     │   │
│  │ ALE_before: $200,000                         │   │
│  │ ALE_after:  $50,000 (control reduces risk)   │   │
│  │ Control cost: $75,000                        │   │
│  │ ROSI = ($200K - $50K - $75K) / $75K × 100%  │   │
│  │ ROSI = $75K / $75K × 100% = 100%            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Threat Modeling

### STRIDE

```
┌─────────────────────────────────────────────────────┐
│                 STRIDE MODEL                        │
├──────────────┬──────────────────────────────────────┤
│ Threat       │ Description              │ CIA       │
├──────────────┼──────────────────────────┼───────────┤
│ Spoofing     │ Impersonating someone    │ Confid.   │
│ Tampering    │ Modifying data/code      │ Integrity │
│ Repudiation  │ Denying actions          │ Integrity │
│ Info Disc.   │ Exposing information     │ Confid.   │
│ DoS          │ Denying service          │ Avail.    │
│ Elevation    │ Gaining unauthorized     │ Authz.    │
│ of Privilege │ privileges               │           │
└──────────────┴──────────────────────────┴───────────┘
```

**STRIDE Per Element:**

```
┌─────────────────────────────────────────────────────┐
│         STRIDE MAPPING TO ELEMENTS                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Data Flow Diagram (DFD) Elements:                 │
│                                                     │
│  ┌──────────┐     ┌──────────┐                     │
│  │ External │────▶│ Process  │                     │
│  │ Entity   │     │          │                     │
│  └──────────┘     └────┬─────┘                     │
│                        │                            │
│                   ┌────▼─────┐                     │
│                   │  Data    │                     │
│                   │  Store   │                     │
│                   └──────────┘                     │
│                                                     │
│  Mapping:                                           │
│  ┌──────────────┬────┬────┬────┬────┬────┬────┐   │
│  │ Element      │ S  │ T  │ R  │ I  │ D  │ E  │   │
│  ├──────────────┼────┼────┼────┼────┼────┼────┤   │
│  │ External Ent │ ✓  │    │    │ ✓  │    │    │   │
│  │ Process      │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │   │
│  │ Data Flow    │ ✓  │ ✓  │    │ ✓  │    │    │   │
│  │ Data Store   │    │ ✓  │ ✓  │ ✓  │    │    │   │
│  └──────────────┴────┴────┴────┴────┴────┴────┘   │
└─────────────────────────────────────────────────────┘
```

**STRIDE Analysis Process:**
1. Create Data Flow Diagram (DFD)
2. Identify trust boundaries
3. Apply STRIDE to each element
4. Document threats in threat model
5. Identify mitigations for each threat

### DREAD

```
┌─────────────────────────────────────────────────────┐
│                  DREAD MODEL                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  D - Damage Potential                              │
│  R - Reproducibility                               │
│  E - Exploitability                                │
│  A - Affected Users                                │
│  D - Discoverability                               │
│                                                     │
│  Scoring: 1 (Low) to 10 (High)                    │
│                                                     │
│  DREAD Score = (D + R + E + A + D) / 5             │
│                                                     │
│  ┌────────────────┬──────┬──────────────────────┐  │
│  │ Rating         │ Score│ Action               │  │
│  ├────────────────┼──────┼──────────────────────┤  │
│  │ High           │ >8   │ Fix immediately      │  │
│  │ Medium         │ 5-8  │ Fix within deadline  │  │
│  │ Low            │ <5   │ Fix when possible    │  │
│  └────────────────┴──────┴──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**DREAD Example:**

| Threat | D | R | E | A | D | Score | Priority |
|--------|---|---|---|---|---|-------|----------|
| SQL Injection | 9 | 10 | 8 | 10 | 9 | 9.2 | Critical |
| XSS (stored) | 7 | 9 | 7 | 8 | 8 | 7.8 | High |
| Information disclosure | 5 | 10 | 4 | 6 | 10 | 7.0 | High |
| Directory traversal | 4 | 8 | 5 | 5 | 6 | 5.6 | Medium |
| CSRF | 6 | 7 | 6 | 7 | 5 | 6.2 | Medium |

### PASTA (Process for Attack Simulation and Threat Analysis)

```
┌─────────────────────────────────────────────────────┐
│              PASTA 7-STAGE PROCESS                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Stage 1: Define Business Objectives                │
│  Stage 2: Define Technical Scope                    │
│  Stage 3: Application Decomposition                 │
│  Stage 4: Threat Analysis                           │
│  Stage 5: Vulnerability & Weakness Analysis         │
│  Stage 6: Attack Modeling & Simulation              │
│  Stage 7: Risk & Impact Analysis                    │
│                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │  1   │─▶│  2   │─▶│  3   │─▶│  4   │          │
│  └──────┘  └──────┘  └──────┘  └──┬───┘          │
│                                    │               │
│  ┌──────┐  ┌──────┐  ┌──────┐    │               │
│  │  7   │◀─│  6   │◀─│  5   │◀───┘               │
│  └──────┘  └──────┘  └──────┘                     │
└─────────────────────────────────────────────────────┘
```

### Other Threat Modeling Frameworks

| Framework | Focus | Best For |
|-----------|-------|----------|
| STRIDE | Threat categories | General applications |
| DREAD | Risk rating | Prioritizing threats |
| PASTA | Attack simulation | Complex applications |
| LINDDUN | Privacy | GDPR/privacy compliance |
| VAST | Agile/scale | DevOps environments |
| Attack Trees | Attack paths | Specific attack analysis |

---

## Risk Treatment

### Four Strategies

```
┌─────────────────────────────────────────────────────┐
│              RISK TREATMENT OPTIONS                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           HIGH IMPACT                       │   │
│  │                                             │   │
│  │  MITIGATE        │        AVOID            │   │
│  │  (Reduce risk)   │   (Eliminate activity)  │   │
│  │  Cost: $$        │   Cost: $$$$           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           LOW IMPACT                        │   │
│  │                                             │   │
│  │  TRANSFER        │        ACCEPT           │   │
│  │  (Share risk)    │   (Live with risk)      │   │
│  │  Cost: $$        │   Cost: $              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│              ◄── Low Cost ──┼── High Cost ──►      │
└─────────────────────────────────────────────────────┘
```

### 1. Mitigate (Reduce)

Implement controls to reduce likelihood or impact.

| Control Type | Examples | Cost |
|--------------|----------|------|
| Preventive | Firewalls, encryption, MFA | Medium-High |
| Detective | IDS, log monitoring, SIEM | Medium |
| Corrective | Backups, patches, incident response | Medium |
| Deterrent | Warning banners, security cameras | Low-Medium |
| Compensating | Enhanced monitoring when primary control unavailable | Variable |

**Mitigation Analysis:**
```
Before Control:
  ALE = $200,000/year

After Control:
  ALE = $50,000/year

Control Cost: $75,000/year

Net Benefit: $200K - $50K - $75K = $75,000/year
ROSI: 100%

Decision: Mitigate (positive ROSI)
```

### 2. Transfer (Share)

Shift risk to another party (insurance, outsourcing).

| Method | Description | Example |
|--------|-------------|---------|
| Insurance | Transfer financial risk | Cyber insurance policy |
| Outsourcing | Transfer operational risk | Cloud provider, MSP |
| Contracts | Shift liability via agreement | SLAs, indemnification |
| Warranty | Vendor assumes defect risk | Hardware warranty |
| Bonding | Third-party guarantees | Performance bonds |

**Transfer Limitations:**
- Cannot transfer reputation damage
- Cannot transfer legal liability in all cases
- Insurance has exclusions and limits
- Third-party risk remains

### 3. Accept

Acknowledge the risk and take no action.

**When to Accept:**
- Cost of control exceeds potential loss
- Risk is very low likelihood AND low impact
- No feasible control exists
- Risk is part of business strategy

**Formal Acceptance Requirements:**
- Risk must be documented
- Must have management approval
- Must be reviewed periodically
- Must not violate legal/regulatory requirements

### 4. Avoid

Eliminate the activity that creates the risk.

**Examples:**
- Discontinue a risky product/service
- Cancel a planned deployment
- Change business process
- Don't enter a new market

**When to Avoid:**
- Risk exceeds organizational risk appetite
- Regulatory/legal constraints
- Technical feasibility concerns
- Reputational damage unacceptable

### Risk Treatment Decision Matrix

```
┌─────────────────────────────────────────────────────┐
│        RISK TREATMENT DECISION MATRIX               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Risk Score │ Likely Impact │ Recommended Action    │
│  ───────────┼───────────────┼─────────────────────  │
│  1-4        │ Low           │ Accept                │
│  5-8        │ Medium        │ Mitigate or Transfer  │
│  9-12       │ High          │ Mitigate              │
│  13-16      │ Critical      │ Avoid or Mitigate     │
│  17-25      │ Severe        │ Avoid                 │
└─────────────────────────────────────────────────────┘
```

---

## Risk Register

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    RISK REGISTER                            │
├────┬─────────┬──────────┬──────────┬────────┬────────┬────┤
│ ID │ Threat  │Likelihood│ Impact   │ Rating │ Owner  │Status│
├────┼─────────┼──────────┼──────────┼────────┼────────┼────┤
│R-01│SQL Inj. │ High(4)  │Crit.(4)  │ 16     │ CISO   │Open │
│R-02│DDoS     │ Med.(3)  │High(3)   │  9     │ NetOps │Open │
│R-03│Insider  │ Med.(3)  │Crit.(4)  │ 12     │ HR/CISO│Open │
│R-04│Ransomw. │ High(4)  │High(3)   │ 12     │ CISO   │Mit. │
│R-05│Phishing │ High(4)  │ Med.(2)  │  8     │ CISO   │Mit. │
│R-06│PowerOut │ Low(1)   │High(3)   │  3     │Facil.  │Accept│
│R-07│HW Fail  │ Med.(3)  │ Med.(2)  │  6     │ IT     │Mit. │
│R-08│Vendor   │ Med.(3)  │High(3)   │  9     │ CISO   │Trans│
└────┴─────────┴──────────┴──────────┴────────┴────────┴────┘

Risk Score: Likelihood (1-5) × Impact (1-5)
Thresholds: Low (1-6), Medium (7-12), High (13-20), Critical (21-25)
```

### Risk Reporting

```
┌─────────────────────────────────────────────────────┐
│         RISK DASHBOARD (Executive View)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Total Risks: 24                                    │
│  ├─ Critical: 3  (███░░░░░░░) 12.5%               │
│  ├─ High:     8  (███████░░░) 33.3%               │
│  ├─ Medium:   9  (█████████░) 37.5%               │
│  └─ Low:      4  (████░░░░░░) 16.7%               │
│                                                     │
│  Trends (vs. last quarter):                        │
│  ├─ Critical: ▲ +1                                │
│  ├─ High:     ▼ -2                                │
│  ├─ Medium:   ─  0                                │
│  └─ Low:      ▲ +1                                │
│                                                     │
│  Top Risks:                                        │
│  1. R-01 SQL Injection (Score: 16)                 │
│  2. R-03 Insider Threat (Score: 12)                │
│  3. R-04 Ransomware (Score: 12)                    │
└─────────────────────────────────────────────────────┘
```

---

## Business Continuity Planning (BCP)

### Overview

```
┌─────────────────────────────────────────────────────┐
│              BCP LIFECYCLE                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐                                   │
│  │ 1. BIA       │  ──▶ Identify critical processes  │
│  │ (Business    │      and recovery requirements    │
│  │  Impact      │                                   │
│  │  Analysis)   │                                   │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 2. Recovery  │  ──▶ Define RTO, RPO for each    │
│  │  Strategy    │      critical process             │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 3. Plan      │  ──▶ Document procedures and     │
│  │  Development │      responsibilities             │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 4. Testing   │  ──▶ Tabletop exercises,         │
│  │  & Training  │      simulations, drills          │
│  └──────┬───────┘                                   │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ 5. Maintenance│ ──▶ Regular review and updates   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

### Business Impact Analysis (BIA)

```
┌──────────────────────────────────────────────────────────────┐
│                    BUSINESS IMPACT ANALYSIS                   │
├──────────────┬───────────┬───────────┬───────────┬──────────┤
│ Process      │ RTO       │ RPO       │ MTD       │Priority  │
├──────────────┼───────────┼───────────┼───────────┼──────────┤
│ Order Process│ 1 hour    │ 15 min    │ 4 hours   │ Critical │
│ Email        │ 4 hours   │ 1 hour    │ 24 hours  │ High     │
│ CRM          │ 2 hours   │ 30 min    │ 8 hours   │ High     │
│ Payroll      │ 24 hours  │ 24 hours  │ 72 hours  │ Medium   │
│ Website      │ 30 min    │ 5 min     │ 2 hours   │ Critical │
│ ERP          │ 4 hours   │ 1 hour    │ 24 hours  │ High     │
└──────────────┴───────────┴───────────┴───────────┴──────────┘

RTO: Recovery Time Objective (max acceptable downtime)
RPO: Recovery Point Objective (max acceptable data loss)
MTD: Maximum Tolerable Downtime (absolute maximum)
```

### Recovery Strategies

```
┌─────────────────────────────────────────────────────┐
│          RECOVERY STRATEGY SPECTRUM                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Cost ▲                                            │
│       │  ┌─────────────────────────────────────┐   │
│       │  │     HOT SITE                        │   │
│       │  │     RTO: Minutes, RPO: Near-zero    │   │
│       │  │     Real-time replication           │   │
│       │  └─────────────────────────────────────┘   │
│       │  ┌─────────────────────────────────────┐   │
│       │  │     WARM SITE                       │   │
│       │  │     RTO: Hours, RPO: Hours          │   │
│       │  │     Periodic replication            │   │
│       │  └─────────────────────────────────────┘   │
│       │  ┌─────────────────────────────────────┐   │
│       │  │     COLD SITE                       │   │
│       │  │     RTO: Days, RPO: Days            │   │
│       │  │     Backup tapes/drives             │   │
│       │  └─────────────────────────────────────┘   │
│       │  ┌─────────────────────────────────────┐   │
│       │  │     MOBILE SITE                     │   │
│       │  │     RTO: Hours-Days, RPO: Variable │   │
│       │  │     Portable/convertible facility   │   │
│       │  └─────────────────────────────────────┘   │
│       │  ┌─────────────────────────────────────┐   │
│       │  │     CLOUD/DRaaS                     │   │
│       │  │     RTO: Minutes-Hours, RPO: Var.  │   │
│       │  │     Scalable, pay-per-use           │   │
│       │  └─────────────────────────────────────┘   │
│       └────────────────────────────────────────▶   │
│                                              Time    │
└─────────────────────────────────────────────────────┘
```

### BCP Document Structure

| Section | Contents |
|---------|----------|
| Purpose & Scope | Objectives, applicability, assumptions |
| Roles & Responsibilities | Team structure, contact information |
| BIA Summary | Critical processes, RTO/RPO/MTD |
| Recovery Strategies | Chosen strategies, alternatives |
| Plan Procedures | Step-by-step recovery actions |
| Communication Plan | Internal/external notification |
| Testing Schedule | Exercise types, frequency |
| Appendices | Vendor contacts, inventory, checklists |

---

## Disaster Recovery Planning (DRP)

### DRP vs BCP

| Aspect | BCP | DRP |
|--------|-----|-----|
| Scope | Entire organization | IT systems and data |
| Focus | Business processes | Technology recovery |
| Timeframe | Long-term continuity | Immediate recovery |
| Output | Business continuity plan | Technical recovery procedures |
| Owner | Business leadership | IT management |

### DRP Components

```
┌─────────────────────────────────────────────────────┐
│              DRP COMPONENTS                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 1. Data Backup Plan                         │   │
│  │    • Backup types (full, incremental, diff) │   │
│  │    • Backup frequency                       │   │
│  │    • Retention policies                     │   │
│  │    • Offsite storage                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 2. System Recovery Plan                     │   │
│  │    • Recovery procedures per system          │   │
│  │    • Priority order                         │   │
│  │    • Dependency mapping                     │   │
│  │    • Recovery time estimates                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 3. Network Recovery Plan                    │   │
│  │    • Network topology restoration           │   │
│  │    • ISP failover procedures               │   │
│  │    • VPN/DNS recovery                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 4. Emergency Operations Center (EOC)        │   │
│  │    • Alternate work locations               │   │
│  │    • Communication procedures               │   │
│  │    • Command structure                      │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Testing Types

| Test Type | Description | Disruption | Cost |
|-----------|-------------|------------|------|
| Checklist Review | Verify plan completeness | None | $ |
| Tabletop Exercise | Walk through scenarios | None | $ |
| Functional Exercise | Test specific components | Minimal | $$ |
| Full-Scale Simulation | Complete recovery test | Moderate | $$$ |
| Parallel Test | Run systems at DR site | Minimal | $$$$ |
| Full Interruption | Switch to DR site | Significant | $$$$$ |

---

## Risk Management Frameworks

### NIST Risk Management Framework (RMF)

```
┌─────────────────────────────────────────────────────┐
│           NIST RMF (SP 800-37)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 1.Prepare│─▶│2.Categor-│─▶│3.Select  │         │
│  │          │  │  ize     │  │ Controls │         │
│  └──────────┘  └──────────┘  └─────┬────┘         │
│                                    │               │
│  ┌──────────┐  ┌──────────┐  ┌────▼─────┐         │
│  │6.Monitor │◀─│5.Assess  │◀─│4.Implement│         │
│  │          │  │          │  │ Controls │         │
│  └─────┬────┘  └──────────┘  └──────────┘         │
│        │                                           │
│        ▼                                           │
│  ┌──────────┐                                     │
│  │7.Author- │  ──▶ Authorize system or            │
│  │ ize      │      reject with conditions         │
│  └──────────┘                                     │
└─────────────────────────────────────────────────────┘
```

### ISO 27005 Risk Management Process

```
┌─────────────────────────────────────────────────────┐
│           ISO 27005 PROCESS                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Context Establishment                             │
│  │                                                  │
│  ▼                                                  │
│  Risk Assessment                                    │
│  ├─ Risk Identification                             │
│  │  ├─ Asset identification                         │
│  │  ├─ Threat identification                        │
│  │  ├─ Vulnerability identification                 │
│  │  └─ Control identification                       │
│  ├─ Risk Analysis                                   │
│  │  ├─ Consequence analysis                         │
│  │  └─ Likelihood estimation                        │
│  └─ Risk Evaluation                                 │
│     └─ Compare with risk criteria                   │
│                                                     │
│  Risk Treatment                                     │
│  ├─ Modify (mitigate)                               │
│  ├─ Retain (accept)                                 │
│  ├─ Avoid                                           │
│  └─ Share (transfer)                                │
│                                                     │
│  Risk Acceptance                                    │
│  └─ Formal management decision                      │
│                                                     │
│  Risk Communication & Consultation                  │
│  └─ Throughout entire process                       │
│                                                     │
│  Risk Monitoring & Review                           │
│  └─ Continuous improvement                          │
└─────────────────────────────────────────────────────┘
```

---

## Security Perspective

### Defense-in-Depth for Risk Management

```
┌─────────────────────────────────────────────────────┐
│         RISK MANAGEMENT DEFENSE LAYERS              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: Governance                               │
│  ├─ Risk appetite statement                        │
│  ├─ Risk management policy                         │
│  └─ Roles and responsibilities                     │
│                                                     │
│  Layer 2: Assessment                               │
│  ├─ Asset inventory                                │
│  ├─ Threat intelligence                            │
│  ├─ Vulnerability management                       │
│  └─ Risk quantification                            │
│                                                     │
│  Layer 3: Treatment                                │
│  ├─ Control selection                              │
│  ├─ Implementation                                 │
│  ├─ Transfer mechanisms                            │
│  └─ Acceptance decisions                           │
│                                                     │
│  Layer 4: Monitoring                               │
│  ├─ Continuous monitoring                          │
│  ├─ Key risk indicators (KRIs)                     │
│  ├─ Metrics and reporting                          │
│  └─ Audit and assurance                            │
│                                                     │
│  Layer 5: Improvement                              │
│  ├─ Lessons learned                                │
│  ├─ Framework updates                              │
│  ├─ Training and awareness                         │
│  └─ Maturity assessment                            │
└─────────────────────────────────────────────────────┘
```

---

## Attack Techniques

### Risk Assessment Attacks

| Attack | Target | Method |
|--------|--------|--------|
| Risk assessment bypass | Governance | Skip formal risk process |
| Threat intelligence manipulation | Assessment | Feed false threat data |
| Asset inventory evasion | Assessment | Shadow IT, untracked assets |
| Compliance theater | Governance | Document-only compliance |
| Risk register manipulation | Reporting | Understate risk ratings |
| Control circumvention | Treatment | Find control weaknesses |

### Social Engineering in Risk Context

```
┌─────────────────────────────────────────────────────┐
│         SOCIAL ENGINEERING RISKS                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Phishing ──▶ Credential theft                     │
│  │           (bypasses authentication controls)    │
│  │                                                  │
│  Vishing ──▶ Phone-based deception                 │
│  │           (bypasses technical controls)          │
│  │                                                  │
│  Pretexting ──▶ Fabricated scenarios               │
│  │              (bypasses process controls)         │
│  │                                                  │
│  Baiting ──▶ Malicious media/devices              │
│  │           (bypasses physical controls)           │
│  │                                                  │
│  Tailgating ──▶ Follow authorized personnel        │
│                 (bypasses access controls)          │
└─────────────────────────────────────────────────────┘
```

---

## Defense Mechanisms

### Risk Management Controls

| Category | Control | Purpose |
|----------|---------|---------|
| Governance | Risk committee | Oversight and decisions |
| Assessment | Automated scanning | Continuous vulnerability detection |
| Treatment | Defense-in-depth | Layered controls |
| Monitoring | SIEM/SOAR | Real-time risk visibility |
| Compliance | Audit program | Verify control effectiveness |
| Insurance | Cyber insurance | Financial risk transfer |
| Training | Security awareness | Reduce human risk |
| Incident Response | IR plan | Minimize impact |

---

## Debugging / Analysis Tools

### Risk Assessment Tools

| Tool | Purpose |
|------|---------|
| FAIR (Factor Analysis of Information Risk) | Quantitative risk analysis |
| OpenVAS | Vulnerability scanning |
| Nessus | Vulnerability assessment |
| Qualys | Cloud-based vulnerability management |
| Rapid7 InsightVM | Real-time vulnerability data |
| OWASP Threat Dragon | Threat modeling |
| Microsoft Threat Modeling Tool | STRIDE-based threat modeling |
| RiskWatch | Risk management platform |
| LogicManager | Enterprise risk management |

### GRC Platforms

| Platform | Features |
|----------|----------|
| ServiceNow GRC | Risk, compliance, audit management |
| RSA Archer | Integrated risk management |
| MetricStream | Governance, risk, compliance |
| Resolver | Risk intelligence |
| LogicGate | Risk management workflow |

---

## Practical Examples

### Lab 1: Qualitative Risk Assessment

```python
class RiskAssessment:
    def __init__(self):
        self.risks = []
    
    def add_risk(self, name, likelihood, impact):
        score = likelihood * impact
        if score >= 16:
            rating = "Critical"
        elif score >= 12:
            rating = "High"
        elif score >= 7:
            rating = "Medium"
        else:
            rating = "Low"
        
        self.risks.append({
            "name": name,
            "likelihood": likelihood,
            "impact": impact,
            "score": score,
            "rating": rating
        })
    
    def display(self):
        print(f"{'Risk':<25} {'L':<5} {'I':<5} {'Score':<8} {'Rating'}")
        print("-" * 60)
        for risk in sorted(self.risks, key=lambda x: x["score"], reverse=True):
            print(f"{risk['name']:<25} {risk['likelihood']:<5} "
                  f"{risk['impact']:<5} {risk['score']:<8} {risk['rating']}")

# Usage
ra = RiskAssessment()
ra.add_risk("SQL Injection", 4, 4)
ra.add_risk("DDoS Attack", 3, 3)
ra.add_risk("Phishing", 4, 2)
ra.add_risk("Hardware Failure", 3, 2)
ra.add_risk("Power Outage", 1, 4)
ra.display()
```

### Lab 2: Quantitative Risk Analysis

```python
class QuantitativeRisk:
    def __init__(self, asset_value, exposure_factor, aro):
        self.asset_value = asset_value
        self.exposure_factor = exposure_factor
        self.aro = aro
    
    def sle(self):
        return self.asset_value * self.exposure_factor
    
    def ale(self):
        return self.sle() * self.aro
    
    def analyze(self):
        print(f"Asset Value: ${self.asset_value:,.2f}")
        print(f"Exposure Factor: {self.exposure_factor:.0%}")
        print(f"Single Loss Expectancy: ${self.sle():,.2f}")
        print(f"Annualized Rate of Occurrence: {self.aro}")
        print(f"Annual Loss Expectancy: ${self.ale():,.2f}")

# Compare controls
risk = QuantitativeRisk(1000000, 0.4, 0.5)
print("Without Control:")
risk.analyze()

# With control that reduces ARO to 0.1
risk_controlled = QuantitativeRisk(1000000, 0.4, 0.1)
cost = 75000
print(f"\nWith Control (cost: ${cost:,}):")
risk_controlled.analyze()
print(f"ROSI: {((risk.ale() - risk_controlled.ale() - cost) / cost * 100):.1f}%")
```

### Lab 3: STRIDE Threat Modeling

```python
class STRIDEModel:
    def __init__(self):
        self.threats = []
    
    def add_threat(self, element, threat_type, description, severity):
        self.threats.append({
            "element": element,
            "type": threat_type,
            "description": description,
            "severity": severity
        })
    
    def analyze_dfd_element(self, element_type, element_name):
        mapping = {
            "external_entity": ["Spoofing", "Information Disclosure"],
            "process": ["All STRIDE threats"],
            "data_flow": ["Tampering", "Spoofing", "Information Disclosure"],
            "data_store": ["Tampering", "Information Disclosure", "Repudiation"]
        }
        return mapping.get(element_type, [])
    
    def display(self):
        print(f"{'Element':<20} {'Type':<12} {'Description':<40} {'Severity'}")
        print("-" * 85)
        for threat in self.threats:
            print(f"{threat['element']:<20} {threat['type']:<12} "
                  f"{threat['description']:<40} {threat['severity']}")

# Usage
model = STRIDEModel()
model.add_threat("Login Form", "Spoofing", "Weak password policy", "High")
model.add_threat("API Endpoint", "Tampering", "No input validation", "Critical")
model.add_threat("User Session", "Info Disclosure", "Session in URL", "High")
model.add_threat("Payment Process", "Elevation", "Missing authorization", "Critical")
model.display()
```

### Lab 4: Risk Register Template

```python
import json
from datetime import datetime

class RiskRegister:
    def __init__(self):
        self.risks = []
        self.counter = 0
    
    def add_risk(self, name, description, likelihood, impact, 
                 owner, mitigation=None, status="Open"):
        self.counter += 1
        risk = {
            "id": f"R-{self.counter:03d}",
            "name": name,
            "description": description,
            "likelihood": likelihood,
            "impact": impact,
            "score": likelihood * impact,
            "owner": owner,
            "mitigation": mitigation,
            "status": status,
            "date_identified": datetime.now().isoformat(),
            "last_reviewed": datetime.now().isoformat()
        }
        self.risks.append(risk)
        return risk["id"]
    
    def get_risks_by_status(self, status):
        return [r for r in self.risks if r["status"] == status]
    
    def get_critical_risks(self):
        return [r for r in self.risks if r["score"] >= 16]
    
    def export_json(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.risks, f, indent=2)
    
    def display(self):
        print(f"{'ID':<8} {'Risk':<25} {'Score':<8} {'Rating':<10} {'Owner':<15} {'Status'}")
        print("-" * 90)
        for risk in sorted(self.risks, key=lambda x: x["score"], reverse=True):
            rating = ("Critical" if risk["score"] >= 16 else
                     "High" if risk["score"] >= 12 else
                     "Medium" if risk["score"] >= 7 else "Low")
            print(f"{risk['id']:<8} {risk['name']:<25} {risk['score']:<8} "
                  f"{rating:<10} {risk['owner']:<15} {risk['status']}")

# Usage
register = RiskRegister()
register.add_risk("SQL Injection", "Web app vulnerability", 4, 4, "CISO", "WAF + code review")
register.add_risk("DDoS Attack", "Volumetric attack", 3, 3, "NetOps", "CDN + rate limiting")
register.add_risk("Insider Threat", "Malicious employee", 3, 4, "HR", "DLP + monitoring")
register.display()
```

---

## Interview Questions

### Fundamentals
1. **What is the formula for calculating risk?**
2. **What are the four risk treatment strategies?**
3. **What is the difference between qualitative and quantitative risk assessment?**
4. **Explain SLE, ARO, and ALE with an example.**
5. **What is a risk register and what does it contain?**

### Intermediate
6. **How do you perform a Business Impact Analysis?**
7. **What is the difference between BCP and DRP?**
8. **Explain STRIDE and give an example of each threat type.**
9. **How do you calculate Return on Security Investment (ROSI)?**
10. **What are the key differences between NIST RMF and ISO 27005?**

### Advanced
11. **How would you build a risk management program from scratch?**
12. **Explain how to quantify reputational damage in risk calculations.**
13. **How do you handle risk management in an agile development environment?**
14. **What are the challenges of third-party risk management?**
15. **How do you communicate risk to non-technical executives?**

---

## Hands-On Labs

### Lab 1: Vulnerability Scanning with OpenVAS
```bash
# Install OpenVAS
sudo apt-get install gvm
sudo gvm-setup
sudo gvm-check-setup

# Start OpenVAS
sudo gvm-start

# Access web interface
# https://127.0.0.1:9392

# Create target and scan
# Export results for risk assessment
```

### Lab 2: Risk Calculation Spreadsheet
```python
# Create a comprehensive risk assessment
import csv

risks = [
    {"Asset": "Web Server", "Threat": "DDoS", "Vuln": "No rate limiting",
     "Likelihood": 3, "Impact": 4, "Control": "CDN", "Control Cost": 5000},
    {"Asset": "Database", "Threat": "SQL Injection", "Vuln": "No WAF",
     "Likelihood": 4, "Impact": 5, "Control": "WAF + Code Review", "Control Cost": 20000},
    {"Asset": "Employee Data", "Threat": "Insider Threat", "Vuln": "No DLP",
     "Likelihood": 2, "Impact": 5, "Control": "DLP + Monitoring", "Control Cost": 15000},
]

with open('risk_assessment.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=risks[0].keys())
    writer.writeheader()
    writer.writerows(risks)

print("Risk assessment exported to risk_assessment.csv")
```

### Lab 3: Tabletop Exercise Facilitation
```markdown
# Tabletop Exercise: Ransomware Attack

## Scenario
It's Monday morning. The IT team receives reports that multiple
employees cannot access files. A ransom note appears on screens
demanding 50 Bitcoin for decryption keys.

## Discussion Questions
1. Who is notified first?
2. What is the immediate response?
3. How do you assess the scope?
4. Do you pay the ransom? Why or why not?
5. What is the communication plan?
6. How do you recover?
7. What are the legal/regulatory obligations?

## Timeline
- 08:00 - First reports
- 08:15 - IT confirms ransomware
- 08:30 - Management notified
- 09:00 - Incident response team activated
- 09:30 - Law enforcement contacted
- 10:00 - Media inquiries begin
```

### Lab 4: BIA Worksheet
```python
class BIA:
    def __init__(self):
        self.processes = []
    
    def add_process(self, name, revenue_per_hour, employees, 
                    regulatory, customer_facing):
        impact = revenue_per_hour * 24  # Daily impact
        if regulatory:
            impact *= 1.5
        if customer_facing:
            impact *= 1.3
        
        self.processes.append({
            "name": name,
            "revenue_per_hour": revenue_per_hour,
            "employees": employees,
            "daily_impact": impact,
            "regulatory": regulatory,
            "customer_facing": customer_facing
        })
    
    def display(self):
        print(f"{'Process':<20} {'Rev/Hr':<12} {'Daily Impact':<15} {'Priority'}")
        print("-" * 60)
        for p in sorted(self.processes, key=lambda x: x["daily_impact"], reverse=True):
            priority = ("Critical" if p["daily_impact"] > 100000 else
                       "High" if p["daily_impact"] > 50000 else
                       "Medium" if p["daily_impact"] > 10000 else "Low")
            print(f"{p['name']:<20} ${p['revenue_per_hour']:<11,} "
                  f"${p['daily_impact']:<14,.0f} {priority}")

bia = BIA()
bia.add_process("Order Processing", 5000, 20, True, True)
bia.add_process("Email", 500, 100, False, False)
bia.add_process("CRM", 2000, 50, False, True)
bia.add_process("ERP", 3000, 30, True, False)
bia.display()
```

---

## Summary Table

| Component | Purpose | Key Tools | Output |
|-----------|---------|-----------|--------|
| Risk Assessment | Identify and evaluate risks | STRIDE, DREAD, PASTA | Risk register |
| Quantitative Analysis | Numerical risk calculation | SLE, ARO, ALE, ROSI | Financial impact |
| Qualitative Analysis | Categorical risk rating | Risk matrix, scoring | Priority ranking |
| Threat Modeling | Identify attack vectors | DFD, attack trees | Threat catalog |
| BIA | Determine critical processes | RTO, RPO, MTD | Priority list |
| BCP | Ensure business continuity | Recovery strategies | BCP document |
| DRP | Recover IT systems | Backup, failover | DR procedures |
| Risk Treatment | Address identified risks | Mitigate, transfer, accept, avoid | Control plan |
| Monitoring | Track risk posture | KRIs, metrics, audit | Reports |
| Compliance | Meet regulatory requirements | NIST, ISO 27001, GDPR | Audit evidence |

---

## References

- NIST SP 800-30: Risk Management Guide
- NIST SP 800-37: Risk Management Framework
- ISO 31000: Risk Management Guidelines
- ISO 27005: Information Security Risk Management
- FAIR: Factor Analysis of Information Risk
- OWASP Threat Modeling Process
- SANS Risk Management resources
- NIST Cybersecurity Framework
