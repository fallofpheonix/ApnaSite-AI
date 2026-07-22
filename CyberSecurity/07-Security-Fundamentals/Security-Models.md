# Security Models

## Layer Position

```
┌─────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                  │
├─────────────────────────────────────────────────────┤
│              SECURITY FUNDAMENTALS                   │
│  ┌───────────────────────────────────────────────┐  │
│  │              SECURITY MODELS                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │  Bell-   │ │  Biba    │ │   Clark-     │  │  │
│  │  │LaPadula │ │          │ │   Wilson     │  │  │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │  │
│  │       │             │              │           │  │
│  │       ▼             ▼              ▼           │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  Brewer-Nash │ Graham-Denning │ HRU     │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│              IMPLEMENTATION LAYER                    │
│  SELinux │ Trusted Solaris │ Type Enforcement       │
└─────────────────────────────────────────────────────┘
```

## What are Security Models?

Security models provide formal mathematical frameworks for defining, implementing, and verifying security policies. They translate abstract security goals into enforceable, verifiable rules that govern how subjects (users, processes) access objects (files, resources).

## Why Learn It?

- Formalize security requirements into enforceable rules
- Critical for certification exams (CISSP, CISM, CEH)
- Enable verification that a system meets its security policy
- Foundation for trusted operating systems (SELinux, Trusted Solaris)
- Bridge between policy (what) and mechanism (how)

---

## Bell-LaPadula Model (BLP)

### Overview
- **Focus:** Confidentiality
- **Developed:** 1973 by David Bell and Leonard LaPadula
- **Type:** Mandatory Access Control (MAC)
- **Use Case:** Military and government classified systems

### Core Rules

```
┌─────────────────────────────────────────────────────┐
│           BELL-LAPADULA PROPERTIES                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Simple Security Property (No Read Up):            │
│  ┌─────────┐                                       │
│  │Subject  │ can READ only objects at EQUAL or     │
│  │Level L  │ LOWER security level                  │
│  └────┬────┘                                       │
│       │                                             │
│       ▼                                             │
│  ┌─────────┐                                       │
│  │Object   │ must have security level ≤ L          │
│  │Level M  │ where M ≤ L                           │
│  └─────────┘                                       │
│                                                     │
│  *-Property (No Write Down):                       │
│  ┌─────────┐                                       │
│  │Subject  │ can WRITE only objects at EQUAL or    │
│  │Level L  │ HIGHER security level                  │
│  └────┬────┘                                       │
│       │                                             │
│       ▼                                             │
│  ┌─────────┐                                       │
│  │Object   │ must have security level ≥ L          │
│  │Level M  │ where M ≥ L                           │
│  └─────────┘                                       │
│                                                     │
│  Strong *-Property:                                 │
│  Subject can write only if current access is READ   │
│  and security level equals object's level           │
│                                                     │
│  Discretionary Security Property:                   │
│  Access controlled by ACL/ds-object               │
└─────────────────────────────────────────────────────┘
```

### Security Levels (Military Example)

```
┌─────────────────────────────────────┐
│          TOP SECRET                 │  ◀── Highest
├─────────────────────────────────────┤
│          SECRET                    │
├─────────────────────────────────────┤
│       CONFIDENTIAL                 │
├─────────────────────────────────────┤
│        UNCLASSIFIED                │  ◀── Lowest
└─────────────────────────────────────┘

Flow Direction:
  READ:  Top ──▶ Down (can read lower)
  WRITE: Bottom ──▶ Up (can write higher)
```

### Access Matrix Example

```
         │ File A │ File B │ File C │ File D
         │(TS)    │(S)     │(C)     │(U)
─────────┼────────┼────────┼────────┼────────
Alice(TS)│ READ   │ READ   │ READ   │ READ
Bob(S)   │   —    │ READ   │ READ   │ READ
Carol(C) │   —    │   —    │ READ   │ READ
Dave(U)  │   —    │   —    │   —    │ READ/WRITE
```

### Limitations
- Does not address integrity (data can be modified at same level)
- No covert channel protection
- No concept of "need to know" beyond clearance
- Does not handle declassification

### Real-World Implementations
- **SELinux:** Type Enforcement (TE) model
- **Trusted Solaris:** Labeled security
- **Trusted BSD:** MAC framework
- **Windows Vista+:** Mandatory Integrity Control (MIC)

---

## Biba Model

### Overview
- **Focus:** Integrity
- **Developed:** 1977 by Kenneth Biba
- **Type:** Mandatory Access Control (MAC)
- **Relationship:** Inverse of Bell-LaPadula

### Core Rules

```
┌─────────────────────────────────────────────────────┐
│              BIBA PROPERTIES                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Simple Integrity Axiom (No Read Down):            │
│  ┌─────────┐                                       │
│  │Subject  │ can READ only objects at EQUAL or     │
│  │Level L  │ HIGHER integrity level                │
│  └────┬────┘                                       │
│       │                                             │
│       ▼                                             │
│  ┌─────────┐                                       │
│  │Object   │ must have integrity level ≥ L         │
│  │Level M  │ where M ≥ L                           │
│  └─────────┘                                       │
│                                                     │
│  *-Integrity Axiom (No Write Up):                  │
│  ┌─────────┐                                       │
│  │Subject  │ can WRITE only objects at EQUAL or    │
│  │Level L  │ LOWER integrity level                 │
│  └────┬────┘                                       │
│       │                                             │
│       ▼                                             │
│  ┌─────────┐                                       │
│  │Object   │ must have integrity level ≤ L         │
│  │Level M  │ where M ≤ L                           │
│  └─────────┘                                       │
│                                                     │
│  Invocation Property:                               │
│  Subject at level L cannot invoke (execute)        │
│  subjects at lower integrity levels                │
└─────────────────────────────────────────────────────┘
```

### Integrity Levels

```
┌─────────────────────────────────────┐
│           CRITICAL                  │  ◀── Highest integrity
│  (Trusted software, OS kernel)      │
├─────────────────────────────────────┤
│          HIGH                       │
│  (Verified applications)            │
├─────────────────────────────────────┤
│          MEDIUM                     │
│  (General applications)             │
├─────────────────────────────────────┤
│           LOW                       │
│  (User data, untrusted input)       │  ◀── Lowest integrity
└─────────────────────────────────────┘

Flow Direction:
  READ:  High ──▶ Up (cannot read lower, contaminated data)
  WRITE: Low ──▶ Down (cannot write higher, prevent corruption)
```

### Biba vs Bell-LaPadula

| Property | Bell-LaPadula | Biba |
|----------|---------------|------|
| Focus | Confidentiality | Integrity |
| Read | No read up | No read down |
| Write | No write down | No write up |
| Prevents | Data leakage | Data corruption |
| Assumption | Higher level = more trusted | Higher level = more trusted |

### Limitations
- Does not protect confidentiality
- Does not prevent covert channels
- Can be overly restrictive for collaborative environments
- No concept of content-dependent access

### Real-World Application
- Database integrity controls
- Software development pipelines (dev → staging → prod)
- Input validation (user input at low integrity, cannot directly influence high-integrity processes)

---

## Clark-Wilson Model

### Overview
- **Focus:** Integrity in commercial/financial environments
- **Developed:** 1987 by David Clark and David Wilson
- **Type:** Well-formed transactions with separation of duties
- **Key Innovation:** Separates data into constrained and unconstrained

### Core Concepts

```
┌─────────────────────────────────────────────────────┐
│           CLARK-WILSON ARCHITECTURE                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────┐                            │
│  │   Users (People)    │                            │
│  └──────────┬──────────┘                            │
│             │                                       │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │   IVPs (Interface   │  ◀── Integrity Verification│
│  │  Verification Procs)│      Procedures            │
│  └──────────┬──────────┘                            │
│             │                                       │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │   TPs (Transforma-  │  ◀── Well-Formed          │
│  │   tion Procedures)  │      Transactions          │
│  └──────────┬──────────┘                            │
│             │                                       │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │ Constrained Data    │  ◀── Protected data        │
│  │ Objects (CDOs)      │      (bank accounts, etc.) │
│  └─────────────────────┘                            │
│                                                     │
│  ┌─────────────────────┐                            │
│  │ Unconstrained Data  │  ◀── User data            │
│  │ Objects (UDOs)      │      (emails, docs)        │
│  └─────────────────────┘                            │
└─────────────────────────────────────────────────────┘
```

### Well-Formed Transactions

```
Traditional (No Clark-Wilson):
  User A ──▶ Transfer $1000 ──▶ Database
  (Any user can directly modify data)

Clark-Wilson:
  User A ──▶ TPs (transfer procedure) ──▶ Database
  (Users cannot directly access CDOs)
  (TPs enforce integrity constraints)
  (Separation of duties enforced)
```

### Separation of Duties

```
┌─────────────────────────────────────────────┐
│          SEPARATION OF DUTIES               │
├─────────────────────────────────────────────┤
│                                             │
│  No single user can:                       │
│  • Both initiate AND approve a transaction │
│  • Both create AND authorize a payment     │
│  • Both modify AND verify data             │
│                                             │
│  Requires:                                 │
│  • Multiple authorized users               │
│  • Multiple transformation procedures      │
│  • Independent verification (IVPs)         │
│                                             │
│  Example: Wire Transfer                    │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │Initia│─▶│Approv│─▶│ Execu│             │
│  │ te   │  │  e   │  │  te  │             │
│  └──────┘  └──────┘  └──────┘            │
│  User A    User B     User C              │
└─────────────────────────────────────────────┘
```

### Rules

| Rule | Description |
|------|-------------|
| RP1 | All access is through TPs |
| RP2 | All TPs are certified to preserve integrity |
| RP3 | All TPs are certified to maintain well-formed transactions |
| RP4 | All TPs are certified to enforce separation of duties |
| RP5 | Only certified TPs can access CDOs |
| RP6 | All IVPs certify integrity of CDOs |
| RP7 | All TPs are certified to log sufficient information |

### Real-World Application
- Banking and financial systems
- Healthcare (HIPAA compliance)
- ERP systems (SAP, Oracle)
- Payment processing (PCI-DSS)
- Any system requiring audit trails and separation of duties

---

## Brewer-Nash Model (Chinese Wall)

### Overview
- **Focus:** Conflict of interest
- **Developed:** 1989 by Ross Brewer and David Nash
- **Key Innovation:** Dynamic access control based on user behavior
- **Use Case:** Consulting firms, financial services, competing clients

### Core Concepts

```
┌─────────────────────────────────────────────────────┐
│            CHINEWALL MODEL                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Conflict of Interest (COI) Classes:               │
│  ┌─────────────────────────────────────────────┐   │
│  │  COI Class: Banking                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │Bank A    │  │Bank B    │  │Bank C    │  │   │
│  │  │Dataset   │  │Dataset   │  │Dataset   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  │   │
│  ├─────────────────────────────────────────────┤   │
│  │  COI Class: Retail                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │Retailer A│  │Retailer B│  │Retailer C│  │   │
│  │  │Dataset   │  │Dataset   │  │Dataset   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Rule: User who has accessed Dataset A in a COI    │
│  class CANNOT access Dataset B in the same class C │
│                                                     │
│  Consultant Scenario:                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ Day 1: Consultant accesses Bank A data      │   │
│  │ Day 2: Consultant CANNOT access Bank B data │   │
│  │        (same COI class: Banking)            │   │
│  │ Day 3: Consultant CAN access Retailer A     │   │
│  │        (different COI class: Retail)        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Access Decision Flow

```
User requests access to Dataset X
        │
        ▼
┌─────────────────┐
│ Has user accessed│
│ any dataset in   │──── YES ──▶ Deny access
│ same COI class?  │           (prevent conflict)
└────────┬────────┘
         │ NO
         ▼
   ┌─────────────┐
   │ Grant access │
   │ Read dataset │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Sanitize     │
   │ write buffer │
   │ (prevent     │
   │  indirect    │
   │  disclosure) │
   └─────────────┘
```

### Write Sanitization

```
Problem:
  Consultant reads Bank A data, then writes to shared report
  Report might leak Bank A info when Bank B reads it

Solution - Write Sanitization:
  1. User writes to private buffer
  2. System checks if write contains data from different datasets
  3. If sanitized, write is allowed to shared area
  4. If not, write is blocked or sanitized

  ┌──────────┐     ┌──────────────┐     ┌──────────┐
  │ Read     │────▶│ Write Buffer │────▶│ Shared   │
  │ Bank A   │     │ (Private)    │     │ Report   │
  └──────────┘     └──────────────┘     └──────────┘
                         │
                    Sanitized (no
                    Bank A data)
```

### Real-World Application
- Consulting firms serving competing clients
- Financial analysts covering multiple companies
- Healthcare providers with multiple patients
- Any scenario where access to one entity's data conflicts with another

---

## Graham-Denning Model

### Overview
- **Focus:** Access control in computer systems
- **Developed:** 1972 by Graham and Denning
- **Type:** Formal model using access control matrix
- **Key Innovation:** Defines primitive operations on access control

### Core Concepts

```
┌─────────────────────────────────────────────────────┐
│         GRAHAM-DENNING PRIMITIVES                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Subjects (S): Active entities (users, processes)  │
│  Objects (O): Passive entities (files, resources)  │
│  Rights (R): Permissions (read, write, execute)    │
│                                                     │
│  Access Control Matrix:                             │
│         │ Obj1  │ Obj2  │ Obj3  │ Obj4            │
│  ───────┼───────┼───────┼───────┼──────            │
│  Sub1   │ RW    │ R     │  —    │ RWX             │
│  Sub2   │  —    │ RW    │ R     │  —              │
│  Sub3   │ R     │  —    │ RWX   │ R               │
│                                                     │
│  Primitive Operations:                              │
│  1. Create object                                  │
│  2. Destroy object                                 │
│  3. Grant access right                             │
│  4. Revoke access right                            │
│  5. Create subject                                 │
│  6. Destroy subject                                │
└─────────────────────────────────────────────────────┘
```

### The Six Primitives

| Primitive | Operation | Description |
|-----------|-----------|-------------|
| 1 | Create Object | Creates a new object with no access rights |
| 2 | Destroy Object | Removes object and all its access rights |
| 3 | Grant Right | Adds a right to the access control matrix |
| 4 | Revoke Right | Removes a specific right from a subject |
| 5 | Create Subject | Creates a new subject with no rights |
| 6 | Destroy Subject | Removes subject and all its rights |

### State Machine

```
┌──────────────────────────────────────────────┐
│              STATE MACHINE                   │
├──────────────────────────────────────────────┤
│                                              │
│  State = Access Control Matrix               │
│                                              │
│  ┌──────┐     ┌──────────┐     ┌──────┐    │
│  │State1│────▶│ Operation│────▶│State2│    │
│  └──────┘     └──────────┘     └──────┘    │
│     │              │               │        │
│     │         Create/Destroy       │        │
│     │         Grant/Revoke         │        │
│     │              │               │        │
│     └──────────────┴───────────────┘        │
│         (valid state transitions)            │
└──────────────────────────────────────────────┘
```

### Limitations
- Does not model mandatory access control
- No hierarchy or grouping of subjects/objects
- Access matrix can become very large
- Does not address covert channels

### Real-World Application
- OS access control implementations
- Database permission systems
- Cloud IAM policies
- File system ACLs

---

## Harrison-Ruzzo-Ullman (HRU) Model

### Overview
- **Focus:** Safety problem in access control systems
- **Developed:** 1976 by Harrison, Ruzzo, and Ullman
- **Key Innovation:** Proved that safety is undecidable in general
- **Significance:** Shows fundamental limits of access control verification

### Core Concepts

```
┌─────────────────────────────────────────────────────┐
│              HRU MODEL                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Extended from Graham-Denning with:                │
│  • Generic rights (not just specific operations)   │
│  • Conditional commands (if-then rules)            │
│  • Monotonic restriction (rights can only be       │
│    added, not removed, in safety analysis)         │
│                                                     │
│  Commands:                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │ command name(S, O, r)                       │   │
│  │ if r1 in matrix[S][O] then                  │   │
│  │   grant S1 O1 r1                             │   │
│  │   grant S2 O2 r2                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Safety Problem:                                    │
│  Given initial state and set of commands,           │
│  can subject S ever gain right r to object O?       │
│                                                     │
│  Answer: UNDECIDABLE (in general)                   │
│  (Only decidable for single-command systems)       │
└─────────────────────────────────────────────────────┘
```

### The Safety Problem

```
Initial State:
  Subject A has read access to Object X

Command:
  grant(S, O, r):
    if write in matrix[S][O] then
      grant S read any object

Question: Can Subject A gain write access to Object Y?

HRU Theorem: This question is UNDECIDABLE
for systems with 2+ commands.

Implication: You cannot build a general tool
that verifies security of access control systems.
```

### Practical Implications

| Finding | Meaning |
|---------|---------|
| Safety undecidable | Cannot automatically verify all access control systems |
| Single-command decidable | Simple systems CAN be analyzed |
| Monotonic systems | Rights can only be added in analysis (simpler) |
| Non-monotonic | Real systems can revoke rights (harder) |

### Real-World Significance
- Explains why automated security analysis tools have limitations
- Drives need for formal methods in critical systems
- Motivates capability-based security
- Influences design of secure operating systems

---

## Other Notable Models

### Take-Grant Model
- **Focus:** Capability-based access control
- **Key Concept:** Rights can be transferred between subjects
- **Rules:** Take (acquire right), Grant (give right), Create, Destroy, Revoke

### Harrison-Ruzzo-Ullman with Monotonic Restriction
- Simplified version focusing on whether access can be gained
- More tractable than general HRU

### Information Flow Model
- **Focus:** How information moves between objects
- **Lattice-based:** Defines allowed flows between security levels
- **Example:** Bell-LaPadula as lattice of security levels

---

## Comparison Matrix

| Model | Focus | Type | Key Property | Limitation |
|-------|-------|------|--------------|------------|
| Bell-LaPadula | Confidentiality | MAC | No read up, no write down | No integrity protection |
| Biba | Integrity | MAC | No read down, no write up | No confidentiality |
| Clark-Wilson | Integrity | Commercial | Well-formed transactions | Complex implementation |
| Brewer-Nash | Conflict of Interest | Dynamic | Chinese Wall | Limited to COI classes |
| Graham-Denning | Access Control | Formal | 6 primitives | No MAC, large matrices |
| HRU | Safety | Formal | Safety undecidable | Theoretical, not practical |
| Take-Grant | Capabilities | Formal | Transferable rights | Limited expressiveness |

---

## Security Perspective

### Model Selection Guide

```
┌─────────────────────────────────────────────────────┐
│           MODEL SELECTION DECISION TREE              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  What is the PRIMARY security goal?                │
│  │                                                   │
│  ├── Confidentiality ──▶ Bell-LaPadula             │
│  │                        (military/gov)            │
│  │                                                   │
│  ├── Integrity ──▶ Is it commercial/financial?      │
│  │                  │                                │
│  │                  ├── Yes ──▶ Clark-Wilson        │
│  │                  │                                │
│  │                  └── No ──▶ Biba                 │
│  │                                                   │
│  ├── Conflict of Interest ──▶ Brewer-Nash           │
│  │                             (Chinese Wall)       │
│  │                                                   │
│  └── Access Control Analysis ──▶ Graham-Denning     │
│                                  (formal analysis)  │
└─────────────────────────────────────────────────────┘
```

### Models in Practice

```
┌────────────────────────────────────────────────────┐
│              REAL-WORLD MAPPING                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  Military/Government ──▶ Bell-LaPadula            │
│  • Classified systems                              │
│  • NATO communications                             │
│  • Intelligence agencies                           │
│                                                    │
│  Financial Systems ──▶ Clark-Wilson               │
│  • Banking transactions                            │
│  • Stock trading                                   │
│  • Payment processing                              │
│                                                    │
│  Consulting ──▶ Brewer-Nash                        │
│  • Big 4 accounting firms                          │
│  • Management consulting                           │
│  • Legal firms                                     │
│                                                    │
│  Operating Systems ──▶ Graham-Denning/HRU         │
│  • Linux DAC/MAC                                   │
│  • SELinux TE model                                │
│  • Windows ACLs                                    │
│                                                    │
│  Cloud/IoT ──▶ ABAC (Attribute-Based)             │
│  • AWS IAM policies                                │
│  • Azure RBAC                                      │
│  • Kubernetes RBAC                                 │
└────────────────────────────────────────────────────┘
```

---

## Attack Techniques

### Bypassing Security Models

| Model | Attack | Method |
|-------|--------|--------|
| BLP | Covert channel | Storage/timing channel to leak data |
| BLP | Write-up exploit | Manipulate classification levels |
| Biba | Dirty data injection | Corrupt high-integrity data via side channel |
| Clark-Wilson | TP manipulation | Compromise transformation procedure |
| Brewer-Nash | Indirect disclosure | Write sanitized data reveals source |
| Graham-Denning | Privilege escalation | Exploit matrix inconsistencies |
| HRU | Safety violation | Exploit multi-command interactions |

### Covert Channels (BLP)

```
Storage Channel:
  Subject A (High) ──▶ Writes to shared resource ──▶ Subject B (Low)
  (Hides data in shared memory, temp files, or database records)

Timing Channel:
  Subject A (High) ──▶ Varies response time ──▶ Subject B (Low)
  (Hides data in how long operations take)

Example:
  Process A at Top Secret accesses disk
  Process B at Unclassified monitors disk activity
  Access pattern encodes classified information
```

---

## Defense Mechanisms

### Mitigating Model Weaknesses

| Weakness | Mitigation |
|----------|------------|
| BLP covert channels | Covert channel analysis, bandwidth limitation |
| Biba isolation | Input sanitization, quarantine zones |
| Clark-Wilson complexity | Formal verification, automated TP testing |
| Brewer-Nash write sanitization | Data loss prevention, output filtering |
| Graham-Denning large matrices | Capability systems, hierarchical groups |
| HRU undecidable safety | Formal methods for critical subsystems |

### Formal Verification

```
┌─────────────────────────────────────────────────────┐
│           FORMAL VERIFICATION TOOLS                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Model Checking:                                   │
│  • SPIN (Promela models)                           │
│  • NuSMV (CTL/LTL formulas)                        │
│  • TLA+ (Lamport's temporal logic)                 │
│                                                     │
│  Theorem Proving:                                  │
│  • Coq (constructive proofs)                       │
│  • Isabelle/HOL (higher-order logic)               │
│  • Lean (dependent types)                          │
│                                                     │
│  Static Analysis:                                  │
│  • Astrée (C program analysis)                     │
│  • Coverity (defect detection)                     │
│  • Infer (Facebook's separation logic)             │
└─────────────────────────────────────────────────────┘
```

---

## Debugging / Analysis Tools

### Security Model Analysis

| Tool | Purpose |
|------|---------|
| SELinux audit2allow | Analyze and generate SELinux policies |
| seinfo / sesearch | Query SELinux policy database |
| auditd | Monitor access control decisions |
| AppArmor tools | Analyze AppArmor profiles |
| tripwire | Verify file integrity (Biba) |
| ACProc | Access control procedure verification |

### Formal Methods Tools

| Tool | Purpose |
|------|---------|
| SPIN | Model concurrent systems, verify safety |
| NuSMV | Symbolic model checker |
| TLA+ | Specify and verify concurrent systems |
| ProVerif | Automated verification of protocols |
| Scapy | Network protocol analysis |

### Practical Tools

```bash
# SELinux policy analysis
seinfo --stats
sesearch --allow -t file_t -c file

# Check current security context
ls -Z /etc/passwd
ps -eZ | grep httpd

# Analyze access control lists
getfacl /etc/shadow
setfacl -m u:user:r /etc/shadow

# Audit access decisions
ausearch -m AVC -ts recent
aureport --auth
```

---

## Practical Examples

### Lab 1: Bell-LaPadula with SELinux

```bash
# Check current SELinux mode
getenforce

# View SELinux contexts
ls -Z /var/www/html/

# Create a test file with specific context
touch /tmp/testfile
chcon -t httpd_sys_content_t /tmp/testfile

# Attempt to read (should work - same level)
cat /tmp/testfile

# Attempt to write from untrusted to trusted
# (simulating no write down)
echo "data" > /tmp/testfile
```

### Lab 2: Biba Integrity Labels

```bash
# Create integrity-labeled directories (conceptual)
mkdir -p /integrity/{high,medium,low}

# Simulate integrity levels
echo "trusted data" > /integrity/high/critical.txt
echo "user data" > /integrity/low/user.txt

# High integrity process reads low (contamination)
cat /integrity/low/user.txt  # Biba: BLOCKED

# Low integrity process writes high (corruption)
echo "injected" > /integrity/high/critical.txt  # Biba: BLOCKED
```

### Lab 3: Chinese Wall Access Simulation

```python
class ChineseWall:
    def __init__(self, coi_classes):
        self.coi_classes = coi_classes
        self.user_access = {}  # user -> set of accessed datasets
    
    def can_access(self, user, dataset):
        # Find which COI class the dataset belongs to
        for coi_class, datasets in self.coi_classes.items():
            if dataset in datasets:
                # Check if user accessed any other dataset in this class
                if user in self.user_access:
                    accessed = self.user_access[user]
                    for d in accessed:
                        if d in datasets and d != dataset:
                            return False, f"Conflict: already accessed {d}"
                return True, "Access granted"
        return False, "Dataset not found"
    
    def grant_access(self, user, dataset):
        if user not in self.user_access:
            self.user_access[user] = set()
        self.user_access[user].add(dataset)

# Usage
coi = {
    "banking": {"BankA", "BankB", "BankC"},
    "retail": {"RetailA", "RetailB"}
}
wall = ChineseWall(coi)

# Consultant accesses BankA
print(wall.can_access("consultant", "BankA"))  # (True, "Access granted")
wall.grant_access("consultant", "BankA")

# Consultant tries BankB (same COI class)
print(wall.can_access("consultant", "BankB"))  # (False, "Conflict: BankA")

# Consultant tries RetailA (different COI class)
print(wall.can_access("consultant", "RetailA"))  # (True, "Access granted")
```

### Lab 4: Access Control Matrix

```python
class AccessMatrix:
    def __init__(self):
        self.matrix = {}
        self.subjects = set()
        self.objects = set()
    
    def create_subject(self, subject):
        self.subjects.add(subject)
        self.matrix[subject] = {}
    
    def create_object(self, obj):
        self.objects.add(obj)
        for subj in self.subjects:
            self.matrix[subj][obj] = set()
    
    def grant(self, subject, obj, right):
        if subject in self.matrix and obj in self.objects:
            self.matrix[subject][obj].add(right)
    
    def revoke(self, subject, obj, right):
        if subject in self.matrix and obj in self.objects:
            self.matrix[subject][obj].discard(right)
    
    def check_access(self, subject, obj, right):
        if subject in self.matrix and obj in self.matrix[subject]:
            return right in self.matrix[subject][obj]
        return False
    
    def display(self):
        print(f"{'Subject':<10}", end="")
        for obj in self.objects:
            print(f"{obj:<15}", end="")
        print()
        for subj in self.subjects:
            print(f"{subj:<10}", end="")
            for obj in self.objects:
                rights = self.matrix[subj].get(obj, set())
                print(f"{','.join(rights) or '—':<15}", end="")
            print()

# Usage
am = AccessMatrix()
am.create_subject("Alice")
am.create_subject("Bob")
am.create_object("file1.txt")
am.create_object("file2.txt")

am.grant("Alice", "file1.txt", "read")
am.grant("Alice", "file1.txt", "write")
am.grant("Bob", "file1.txt", "read")
am.grant("Bob", "file2.txt", "read")
am.grant("Bob", "file2.txt", "write")

am.display()
# Alice       read,write    —
# Bob         read          read,write
```

---

## Interview Questions

### Fundamentals
1. **What is the difference between MAC and DAC?**
2. **Explain the "no read up, no write down" rule and which model uses it.**
3. **What is the Biba model and how does it differ from Bell-LaPadula?**
4. **What is a well-formed transaction in the Clark-Wilson model?**
5. **Why is the safety problem undecidable in the HRU model?**

### Intermediate
6. **Compare Bell-LaPadula and Biba — what are their complementary properties?**
7. **How does the Chinese Wall model handle conflict of interest?**
8. **Explain separation of duties and give a real-world example.**
9. **What is a covert channel and how does it bypass BLP?**
10. **How does SELinux implement mandatory access control?**

### Advanced
11. **Why can't we build a general tool that verifies access control safety?**
12. **How would you design a security model for a multi-tenant cloud platform?**
13. **What are the limitations of formal models in real-world deployments?**
14. **Explain how the Clark-Wilson model maps to PCI-DSS requirements.**
15. **How do you handle the tension between security models and usability?**

---

## Hands-On Labs

### Lab 1: SELinux Policy Audit
```bash
# List all SELinux booleans
getsebool -a | grep httpd

# Allow httpd to connect to network
setsebool -P httpd_can_network_connect 1

# Analyze AVC denials
ausearch -m AVC -ts recent
audit2allow -a

# Generate custom policy module
audit2allow -a -M mypol
semodule -i mypol.pp
```

### Lab 2: Access Control Analysis with Python
```python
import json

class SecurityModelAnalyzer:
    def __init__(self):
        self.levels = {"top_secret": 4, "secret": 3, "confidential": 2, "unclassified": 1}
    
    def check_blp_read(self, subject_clearance, object_classification):
        """No read up: subject can only read objects at or below their level"""
        return self.levels[subject_clearance] >= self.levels[object_classification]
    
    def check_blp_write(self, subject_clearance, object_classification):
        """No write down: subject can only write objects at or above their level"""
        return self.levels[subject_clearance] <= self.levels[object_classification]
    
    def check_biba_read(self, subject_integrity, object_integrity):
        """No read down: subject can only read objects at or above their level"""
        return self.levels[subject_integrity] <= self.levels[object_integrity]
    
    def check_biba_write(self, subject_integrity, object_integrity):
        """No write up: subject can only write objects at or below their level"""
        return self.levels[subject_integrity] >= self.levels[object_integrity]

analyzer = SecurityModelAnalyzer()

# Test BLP
print("BLP Read (no read up):")
print(f"  Secret reads Confidential: {analyzer.check_blp_read('secret', 'confidential')}")
print(f"  Secret reads Top Secret: {analyzer.check_blp_read('secret', 'top_secret')}")

print("\nBLP Write (no write down):")
print(f"  Secret writes Confidential: {analyzer.check_blp_write('secret', 'confidential')}")
print(f"  Secret writes Top Secret: {analyzer.check_blp_write('secret', 'top_secret')}")

# Test Biba
print("\nBiba Read (no read down):")
print(f"  Secret reads Confidential: {analyzer.check_biba_read('secret', 'confidential')}")
print(f"  Secret reads Top Secret: {analyzer.check_biba_read('secret', 'top_secret')}")
```

### Lab 3: Formal Specification with TLA+
```tla
---- MODULE SecurityModel ----
EXTENDS Naturals

CONSTANTS Subjects, Objects, Levels

VARIABLES access_matrix, level

TypeInvariant ==
    /\ access_matrix \in [Subjects -> [Objects -> SUBSET {"read", "write"}]]
    /\ level \in [Subjects -> Levels]

BLPNoReadUp ==
    \A s \in Subjects, o \in Objects:
        "read" \in access_matrix[s][o] =>
            level[s] >= level[o]

BLPNoWriteDown ==
    \A s \in Subjects, o \in Objects:
        "write" \in access_matrix[s][o] =>
            level[s] <= level[o]

BLP == BLPNoReadUp /\ BLPNoWriteDown

Init ==
    /\ access_matrix = [s \in Subjects |-> [o \in Objects |-> {}]]
    /\ level = [s \in Subjects |-> "unclassified"]

====
```

### Lab 4: Chinese Wall Simulation
```bash
#!/bin/bash
# Simulate Chinese Wall access control

declare -A COI_CLASSES
COI_CLASSES[banking]="BankA BankB BankC"
COI_CLASSES[retail]="RetailA RetailB"

declare -A USER_ACCESS

can_access() {
    local user=$1
    local dataset=$2
    
    for class in "${!COI_CLASSES[@]}"; do
        if echo "${COI_CLASSES[$class]}" | grep -qw "$dataset"; then
            if [ -n "${USER_ACCESS[$user]}" ]; then
                for accessed in ${USER_ACCESS[$user]}; do
                    if echo "${COI_CLASSES[$class]}" | grep -qw "$accessed" && [ "$accessed" != "$dataset" ]; then
                        echo "DENIED: $user already accessed $accessed in class $class"
                        return 1
                    fi
                done
            fi
            echo "GRANTED: $user can access $dataset"
            USER_ACCESS[$user]+=" $dataset"
            return 0
        fi
    done
    echo "ERROR: Dataset $dataset not found"
    return 1
}

# Usage
can_access "consultant" "BankA"
can_access "consultant" "BankB"  # Should be denied
can_access "consultant" "RetailA"  # Should be allowed
```

---

## Summary Table

| Model | Year | Focus | Key Rule | Use Case | Limitation |
|-------|------|-------|----------|----------|------------|
| Bell-LaPadula | 1973 | Confidentiality | No read up, no write down | Military/government | No integrity |
| Biba | 1977 | Integrity | No read down, no write up | Software systems | No confidentiality |
| Clark-Wilson | 1987 | Integrity | Well-formed transactions, SoD | Financial/commercial | Complex |
| Brewer-Nash | 1989 | Conflict of Interest | Chinese Wall | Consulting | Limited scope |
| Graham-Denning | 1972 | Access Control | 6 primitives | OS access control | No MAC |
| HRU | 1976 | Safety | Safety undecidable | Theoretical | Not practical |
| Take-Grant | 1982 | Capabilities | Transferable rights | Capability systems | Limited |

---

## References

- Bell, D.E. & LaPadula, L.J. (1973). Secure Computer Systems
- Biba, K.J. (1977). Integrity Considerations for Secure Computer Systems
- Clark, D.D. & Wilson, D.R. (1987). A Comparison of Commercial and Military Computer Security Policies
- Brewer, R.A. & Nash, M.J. (1989). The Chinese Wall Security Policy
- Graham, G.S. & Denning, P.J. (1972). Protection — Principles and Practice
- Harrison, M.A., Ruzzo, W.L., Ullman, J.D. (1976). Protection in Operating Systems
- NIST SP 800-53: Security and Privacy Controls
- ISO/IEC 15408: Common Criteria
