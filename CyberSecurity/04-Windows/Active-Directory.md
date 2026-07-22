# Active Directory

## What is it?

Active Directory (AD) is Microsoft's directory service for managing users, computers, groups, and resources across a Windows domain network. It provides centralized authentication, authorization, and policy management through domain controllers. AD stores objects in a hierarchical database (NTDS.dit) and uses LDAP, Kerberos, and DNS protocols for communication. It is the backbone of most enterprise Windows environments.

## Why Learn It?

Active Directory is one of the most targeted components in enterprise networks. Misconfigurations, weak credentials, trust abuse, and excessive privileges are common attack vectors. Understanding AD is critical for securing enterprise infrastructure, conducting penetration tests, and implementing defense-in-depth strategies. Most successful breaches involve AD compromise at some stage.

## You Will Learn

- AD domain architecture and forest topology
- Group Policy Objects (GPOs) and how they enforce configuration
- Kerberos authentication and ticket-based access
- LDAP query structure and common operations
- Organizational Units (OUs) and delegation of administration
- AD security: delegation, attacks, and hardening
- Trust relationships between domains and forests
- Common AD attack paths

## Prerequisites

- Windows Architecture
- DNS fundamentals
- TCP/IP networking basics

## Related Topics

- Windows Architecture
- Registry
- PowerShell
- Windows Security Tools

## Learning Status

- [x] Theory
- [x] Flowchart
- [x] Internal Architecture
- [x] Hands-on Lab
- [x] Notes Complete

---

## 1. Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Windows  │ │ Windows  │ │ Linux    │ │  Non-Domain      │   │
│  │ Domain   │ │ Non-     │ │ (SSSD/   │ │  (Workgroup)     │   │
│  │ Joined   │ │ Domain   │ │ Winbind) │ │                  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │             │            │                 │             │
│  ┌────┴─────────────┴────────────┴─────────────────┴──────────┐ │
│  │              Security Support Provider (SSP)               │ │
│  │              Kerberos.dll / NTLM.dll / Negotiate.dll      │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    NETWORK LAYER                                 │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │  DNS (AD Lookup) │  Kerberos (88)  │  LDAP (389/636)     │ │
│  │  GC (3268/3269)  │  SMB (445)      │  RPC (135)          │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    DOMAIN CONTROLLER LAYER                      │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │              NTDS.dit (AD Database)                        │ │
│  │  ┌───────────┬────────────┬────────────┬──────────────┐    │ │
│  │  │ LSASS    │  KDC       │  DNS       │  SYSVOL      │    │ │
│  │  │ (Auth)   │  (Kerberos)│  (Records) │  (GPOs)      │    │ │
│  │  └───────────┴────────────┴────────────┴──────────────┘    │ │
│  │  ┌───────────┬────────────┬────────────┬──────────────┐    │ │
│  │  │ ADWS     │  LDAP      │  Replication│  FSMO Roles  │    │ │
│  │  │ (Web Svc)│  Service   │  Service    │              │    │ │
│  │  └───────────┴────────────┴────────────┴──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Internal Architecture

### 2.1 Domain Architecture

```
Forest Architecture
═══════════════════

┌─────────────────────────────────────────────────────────────────┐
│                        AD FOREST                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ROOT DOMAIN                                 │    │
│  │              corp.example.com                            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │    │
│  │  │ DC1      │ │ DC2      │ │ DC3      │                │    │
│  │  │(PDC FSMO)│ │(RID FSMO)│ │(GC)      │                │    │
│  │  └──────────┘ └──────────┘ └──────────┘                │    │
│  │  NTDS.dit: Domain NC, Schema NC, Config NC              │    │
│  └─────────────────────────────────────────────────────────┘    │
│         |                                                        │
│         | Trust (two-way transitive)                            │
│         |                                                        │
│  ┌──────┴────────────────────────────────────────────────────┐  │
│  │  CHILD DOMAIN: child.corp.example.com                     │  │
│  │  ┌──────────┐ ┌──────────┐                                │  │
│  │  │ DC1      │ │ DC2      │                                │  │
│  │  └──────────┘ └──────────┘                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│         |                                                        │
│         | Trust                                                  │
│         |                                                        │
│  ┌──────┴────────────────────────────────────────────────────┐  │
│  │  TRUSTED FOREST: othercorp.com                            │  │
│  │  (External / Forest trust)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 AD Database (NTDS.dit)

| Partition | Description | Replication |
|-----------|-------------|-------------|
| **Domain NC** | Users, groups, computers, OUs | Within domain only |
| **Schema NC** | Object class definitions, attributes | Entire forest |
| **Configuration NC** | Sites, services, partitions | Entire forest |
| **Application NC** | Application-specific data | Varies |

### 2.3 FSMO Roles

| Role | Scope | Purpose |
|------|-------|---------|
| **Schema Master** | Forest-wide | Modify schema (classes/attributes) |
| **Domain Naming Master** | Forest-wide | Add/remove domains |
| **PDC Emulator** | Domain-wide | Primary DC emulation, time sync, password changes |
| **RID Master** | Domain-wide | Allocate RID pools to DCs |
| **Infrastructure Master** | Domain-wide | Cross-domain object references |

---

## 3. Group Policy (GPO)

### 3.1 GPO Architecture

```
Group Policy Object (GPO)
├─ GPC (Group Policy Container) -- stored in AD
│   ├─ gPCFileSysPath (\\DC\SYSVOL\...)
│   ├─ gPCUserExtensionNames
│   └─ gPCMachineExtensionNames
│
└─ GPT (Group Policy Template) -- stored in SYSVOL
    ├─ Machine
    │   ├─ Registry\Registry.pol
    │   ├─ Scripts\Startup / Shutdown
    │   ├─ Microsoft\Windows NT\SecEdit\GptTmpl.inf
    │   └─ Applications\
    └─ User
        ├─ Registry\Registry.pol
        ├─ Scripts\Logon / Logoff
        └─ Applications\

SYSVOL Location: \\Domain\SYSVOL\Domain\Policies\{GUID}\
```

### 3.2 GPO Processing Order (LSDOU)

```
Processing Order: L -> S -> D -> OU (outer) -> OU (inner)

1. Local Policy        (Local GPO applied first)
2. Site Policy         (Linked to AD Site)
3. Domain Policy       (Linked to Domain)
4. OU Policy           (Outermost to innermost)

Override Rules:
- Last Applied wins (unless "Enforced" is set)
- "Enforced" flag prevents child OUs from overriding
- "Block Inheritance" blocks parent GPOs (except Enforced)
```

### 3.3 GPO Components

| Component | Registry Path | Description |
|-----------|--------------|-------------|
| **Computer Configuration** | HKLM\SOFTWARE\Policies | Machine-level settings |
| **User Configuration** | HKCU\SOFTWARE\Policies | User-level settings |
| **Security Settings** | Various | Password policy, audit policy, user rights |
| **Software Installation** | HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion | MSI deployment |
| **Scripts** | GPO\Machine\Scripts or User\Scripts | Startup/Shutdown/Logon/Logoff |
| **Folder Redirection** | GPO\User\Documents & Settings | Redirect folders to network |

### 3.4 GPO Analysis

```powershell
# List all GPOs
Get-GPO -All | Select-Object DisplayName, Id, CreationTime, ModificationTime

# Generate GPO report
Get-GPOReport -All -ReportType HTML -Path "C:\GPOReport.html"

# Find GPOs linked to an OU
Get-GPInheritance -Target "OU=Workstations,DC=corp,DC=example,DC=com"

# Check applied GPOs on a computer
gpresult /r
gpresult /h C:\GPReport.html
```

---

## 4. Kerberos Authentication

### 4.1 Kerberos Flow

```
Kerberos Authentication Flow
═════════════════════════════

┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │   KDC    │                    │ Service  │
│ (User)   │                    │ (DC)     │                    │          │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                                │                                │
     │  1. AS-REQ (Username+Timestamp)│                                │
     │  ─────────────────────────────►│                                │
     │                                │                                │
     │  2. AS-REP (TGT encrypted w/   │                                │
     │     user key)                  │                                │
     │  ◄─────────────────────────────│                                │
     │                                │                                │
     │  3. TGS-REQ (TGT + SPN)       │                                │
     │  ─────────────────────────────►│                                │
     │                                │                                │
     │  4. TGS-REP (Service Ticket)   │                                │
     │  ◄─────────────────────────────│                                │
     │                                │                                │
     │  5. AP-REQ (Service Ticket +   │                                │
     │     Authenticator)             │                                │
     │  ──────────────────────────────────────────────────────────────►│
     │                                                               │
     │  6. AP-REP (Mutual Auth)                                     │
     │  ◄────────────────────────────────────────────────────────────│
     │                                                               │
     │  ◄══════════ Encrypted Session ══════════════════════════════►│
```

### 4.2 Kerberos Ticket Types

| Ticket | Purpose | Lifetime | Encryption |
|--------|---------|----------|------------|
| **TGT** | Authenticate to KDC | 10 hours | User's password hash |
| **TGS** | Access a service | 10 hours | Service's password hash |
| **Service Ticket** | Access specific service | 10 hours | Service's password hash |

### 4.3 Key Kerberos Concepts

| Component | Description |
|-----------|-------------|
| **SPN** | Service Principal Name (e.g., HTTP/webserver.corp.example.com) |
| **KRBTGT** | Special account used to encrypt TGTs; compromise = golden ticket |
| **PAC** | Privilege Attribute Certificate embedded in tickets, contains SIDs |
| **Delegation** | Unconstrained / Constrained / RBCD |

### 4.4 Kerberos Attack Vectors

| Attack | Description | Detection |
|--------|-------------|-----------|
| **Golden Ticket** | Forge TGT using KRBTGT hash | Anomalous logons, PAC failure |
| **Silver Ticket** | Forge service ticket using service hash | Event ID 4768/4769 anomalies |
| **Kerberoasting** | Request TGS for SPNs, offline crack | Event 4769 encryption type 0x17 |
| **AS-REP Roasting** | Request AS-REP for no-preauth accounts | Event 4768 with 0x0 encryption |
| **Pass-the-Ticket** | Use stolen TGT/TGS | Event 4624 Type 3 logon |
| **Overpass-the-Hash** | Use NTLM hash to get TGT | Event 4768 with NTLM auth |
| **Skeleton Key** | Patch LSASS for skeleton password | LSASS memory modification |

---

## 5. LDAP

### 5.1 LDAP Query Syntax

| Filter | Description |
|--------|-------------|
| `(objectClass=user)` | All user objects |
| `(&(objectClass=user)(adminCount=1))` | Admin users |
| `(memberOf=CN=Domain Admins,CN=Users,DC=...)` | Domain Admins members |
| `(&(objectClass=computer)(operatingSystem=*server*))` | Server computers |
| `(servicePrincipalName=*)` | Kerberoastable accounts |
| `(userAccountControl:1.2.840.113556.1.4.803:=4194304)` | No-preauth accounts |

### 5.2 LDAP Ports

| Port | Protocol | Usage |
|------|----------|-------|
| 389 | TCP/UDP | LDAP (plaintext or signing) |
| 636 | TCP | LDAPS (SSL/TLS) |
| 3268 | TCP | Global Catalog (LDAP) |
| 3269 | TCP | Global Catalog (LDAPS) |

### 5.3 LDAP Enumeration

```powershell
Get-ADUser -Filter * -Properties *
Get-ADGroupMember "Domain Admins"
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} -Properties ServicePrincipalName
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}
```

---

## 6. OU Structure

```
OU Structure Example
═════════════════════

DC=corp,DC=example,DC=com
├── OU=Users
│   ├── OU=IT
│   │   ├── OU=Admins
│   │   └── OU=Standard
│   ├── OU=HR
│   └── OU=Finance
├── OU=Computers
│   ├── OU=Workstations
│   ├── OU=Servers
│   └── OU=Kiosks
├── OU=Groups
│   ├── OU=Security
│   └── OU=Distribution
├── OU=Service Accounts
├── OU=Admin Accounts
└── OU=Domain Controllers
```

---

## 7. AD Security (Delegation, Attacks)

### 7.1 Delegation Types

| Type | Description | Risk |
|------|-------------|------|
| **Unconstrained** | Service can impersonate user to ANY service | Critical |
| **Constrained** | Service can impersonate to specific SPNs only | Medium |
| **RBCD** | Resource-based, controlled by target computer | High |

### 7.2 Common AD Attacks

| Attack | Vector | Impact |
|--------|--------|--------|
| **DCSync** | Replicate password data from DC | Password hash extraction |
| **Pass-the-Hash** | Use NTLM hash for authentication | Lateral movement |
| **Kerberoasting** | Offline crack service account passwords | Credential theft |
| **GPP Passwords** | GPO preferences with cpassword | Privilege escalation |
| **Unconstrained Delegation** | Intercept TGTs from connecting users | Domain compromise |
| **ACL Abuse** | Modify ACLs for privileged objects | Privilege escalation |
| **Shadow Credentials** | Modify msDS-KeyCredentialLink | Certificate-based auth |
| **PrintNightmare** | Spooler service RCE | Domain compromise |

### 7.3 AD Hardening Checklist

```
1. Protect Tier 0 Assets
   ├─ Domain Controllers in dedicated OU
   ├─ Separate admin accounts for DA work
   └─ Privileged Access Workstations (PAWs)

2. Credential Protection
   ├─ Enable LSA Protection (RunAsPPL)
   ├─ Enable Credential Guard
   ├─ Disable NTLM where possible
   └─ Rotate KRBTGT password (twice)

3. Delegation Controls
   ├─ Avoid unconstrained delegation
   ├─ Use RBCD over constrained delegation
   ├─ Monitor delegation configurations
   └─ Remove unnecessary SPNs

4. Group Policy Hardening
   ├─ Enforce strong password policies
   ├─ Disable LLMNR/NBT-NS
   ├─ Enable SMB signing
   ├─ Restrict PowerShell execution
   └─ Configure Windows Firewall via GPO

5. Monitoring and Auditing
   ├─ Enable advanced audit policy
   ├─ Monitor Event IDs: 4624, 4625, 4648, 4672, 4768, 4769
   ├─ Deploy SIEM for AD events
   └─ Regular AD health checks (PingCastle, Purple Knight)
```

---

## 8. Component Breakdown Table

| Component | File/System | Purpose |
|-----------|-------------|---------|
| NTDS.dit | NTDS\NTDS.dit | AD database (ESE engine) |
| LSASS | lsass.exe | Authentication, token management |
| KDC | kdcsvc.dll (in lsass) | Kerberos Key Distribution Center |
| DNS | dns.exe | AD-integrated DNS |
| SYSVOL | \\DOMAIN\SYSVOL | GPO templates, scripts |
| NETLOGON | \\DOMAIN\NETLOGON | Logon scripts |
| ADWS | Microsoft.ActiveDirectory.WebServices.exe | Web service interface |
| LDAP | NTDSA (in lsass) | Directory service |
| DFSR | dfsrs.exe | SYSVOL replication (DFS-R) |
| Replication | NTDSA (in lsass) | AD replication between DCs |

---

## 9. Data Flow Diagram

### 9.1 Domain Join Flow

```
Computer → DNS Query for _ldap._tcp.dc._msdcs.domain.com
    → Receives DC IP addresses
    → LDAP bind to DC (admin credentials)
    → Creates computer account in AD
    → Sets machine account password
    → Configures trust relationship
    → Reboots as domain member
```

### 9.2 Authentication Flow

```
User Logon → Winlogon → Credential Provider
    → LSASS → Kerberos SSP
    → KDC: AS-REQ → AS-REP (TGT)
    → TGS-REQ → TGS-REP (Service Ticket)
    → AP-REQ to Service → Access Granted
```

---

## 10. Attack Surface

```
AD Attack Surface Map
═════════════════════

┌──────────────────────────────────────────────────────────────┐
│                  CREDENTIAL ATTACKS                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Kerberoasting│ │ AS-REP      │ │ Password     │         │
│  │              │ │ Roasting    │ │ Spraying     │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├──────────────────────────────────────────────────────────────┤
│                  LATERAL MOVEMENT                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Pass-the-Hash│ │ Pass-the-   │ │ Overpass-the-│         │
│  │              │ │ Ticket      │ │ Hash         │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├──────────────────────────────────────────────────────────────┤
│                  PRIVILEGE ESCALATION                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ GPO Abuse    │ │ ACL Abuse   │ │ Delegation   │         │
│  │              │ │             │ │ Abuse        │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├──────────────────────────────────────────────────────────────┤
│                  PERSISTENCE                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Golden Ticket│ │ Silver      │ │ Skeleton     │         │
│  │              │ │ Ticket      │ │ Key          │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├──────────────────────────────────────────────────────────────┤
│                  DATA COLLECTION                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ DCSync       │ │ LDAP        │ │ Replication  │         │
│  │              │ │ Enumeration │ │ Monitoring   │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Debugging Perspective

### 11.1 AD Debugging Tools

| Tool | Purpose |
|------|---------|
| **dcdiag** | Domain controller diagnostics |
| **repadmin** | AD replication monitoring |
| **nltest** | Domain trust verification |
| **ldp.exe** | LDAP client for AD browsing |
| **ADSI Edit** | Low-level AD object editing |
| **Event Viewer** | AD-related event logs |
| **Wireshark** | LDAP/Kerberos traffic capture |

### 11.2 Key Commands

```powershell
# DC diagnostics
dcdiag /v /c /d /e /s:dc01

# Replication status
repadmin /replsummary
repadmin /showrepl

# Trust verification
nltest /domain_trusts
nltest /dsgetdc:domain.com

# LDAP test
ldp.exe  # Connect to DC, browse tree

# AD replication metadata
Get-ADReplicationFailure -Target "DC01"
Get-ADReplicationPartnerMetadata -Target "DC01"
```

---

## 12. Reverse Engineering Perspective

### 12.1 NTDS.dit File Format

```
NTDS.dit (Extensible Storage Engine / ESE)
════════════════════════════════════════════

File Structure:
┌──────────────────────────────────────────┐
│ Header Page                               │
│ ├─ Signature                             │
│ ├─ Page size (4096 or 8192)              │
│ ├─ Database version                      │
│ └─ Checksum                              │
├──────────────────────────────────────────┤
│ Data Pages                               │
│ ├─ Table pages (datatable, link_table)   │
│ ├─ Index pages                           │
│ └─ Overflow pages                        │
├──────────────────────────────────────────┤
│ Log Files                                │
│ ├─ EDB.log (transaction log)             │
│ └─ EDB.chk (checkpoint)                 │
└──────────────────────────────────────────┘

Key Tables:
- datatable: User/computer/group objects
- link_table: Group membership links
- sd_table: Security descriptors
```

---

## 13. Practical Examples

### Example 1: Enumerate Domain Users

```powershell
# All domain users
Get-ADUser -Filter * -Properties DisplayName, Enabled, LastLogonDate |
    Select-Object Name, Enabled, LastLogonDate

# Disabled accounts
Get-ADUser -Filter {Enabled -eq $false}

# Recently created accounts
Get-ADUser -Filter * -Properties WhenCreated |
    Where-Object { $_.WhenCreated -gt (Get-Date).AddDays(-30) }
```

### Example 2: Find Kerberoastable Accounts

```powershell
Get-ADUser -Filter {ServicePrincipalName -ne "$null" -and Enabled -eq $true} `
    -Properties ServicePrincipalName, PasswordLastSet, AdminCount |
    Select-Object Name, ServicePrincipalName, PasswordLastSet, AdminCount
```

### Example 3: Check Domain Trusts

```powershell
Get-ADTrust -Filter *
nltest /domain_trusts /all_trusts
```

---

## 14. Interview Questions

1. **What is the difference between a domain and a forest?**
   A domain is a logical group of objects (users, computers) sharing a directory database. A forest is a collection of domains with a common schema, configuration, and trust relationships.

2. **Explain the Kerberos authentication process.**
   Client sends AS-REQ to KDC, receives TGT. Client sends TGS-REQ with TGT, receives service ticket. Client presents service ticket to service (AP-REQ). Service validates and grants access.

3. **What is DCSync and how do you detect it?**
   DCSync uses the Directory Replication Service (DRS) protocol to replicate password data from a DC. Detect via Event ID 4662 with replication GUIDs, or by monitoring for unusual replication requests.

4. **What are GPOs and how are they processed?**
   GPOs are Group Policy Objects that enforce configuration. They process in LSDOU order: Local, Site, Domain, OU (outermost to innermost). Enforced GPOs cannot be overridden.

5. **How does NTLM differ from Kerberos?**
   Kerberos uses tickets and is more secure (mutual auth, no password transmission). NTLM uses challenge-response and is vulnerable to relay and pass-the-hash attacks.

6. **What is unconstrained delegation and why is it dangerous?**
   A service with unconstrained delegation can impersonate any user to any service. If compromised, an attacker can capture TGTs from connecting users and access any service those users can access.

7. **What is the KRBTGT account?**
   A special account in every domain used to encrypt TGTs. Its password never expires. Compromising it allows forging golden tickets (unlimited domain access).

8. **How do you detect Kerberoasting?**
   Look for Event ID 4769 with encryption type 0x17 (RC4) for SPN-based requests, especially in burst patterns from non-admin accounts.

9. **What is LSA Protection (RunAsPPL)?**
   LSA Protection runs LSASS as a Protected Process Light, preventing unauthorized processes from reading LSASS memory (blocking mimikatz-style attacks).

10. **How does AD replication work?**
    DCs use multi-master replication. Changes are tracked via Update Sequence Numbers (USNs). DCs pull changes from partners periodically or on notification. KCC (Knowledge Consistency Checker) manages replication topology.

---

## 15. Hands-on Labs

### Lab 1: Build a Lab Domain

```
1. Install Windows Server VM
2. Promote to DC: Install-WindowsFeature AD-Domain-Services
3. Install ADDS: Install-ADDSForest -DomainName "lab.local"
4. Create OUs, users, groups
5. Join a Windows client VM to the domain
6. Configure GPOs and test enforcement
```

### Lab 2: Kerberoasting with Rubeus

```powershell
# On a domain-joined machine
# Request TGS for all SPNs
.\Rubeus.exe kerberoast /outfile:hashes.txt

# Crack with hashcat
hashcat -m 13100 hashes.txt wordlist.txt
```

### Lab 3: GPO Enumeration

```powershell
# Find all GPOs
Get-GPO -All

# Find GPOs with restricted groups
Get-GPO -All | ForEach-Object {
    $report = Get-GPOReport $_.Id -ReportType XML
    if ($report -match "RestrictedGroups") {
        Write-Host $_.DisplayName
    }
}

# Generate comprehensive report
gpresult /h C:\GPOReport.html /f
```

### Lab 4: LDAP Enumeration with ldapsearch

```bash
# From Linux
ldapsearch -x -H ldap://dc.lab.local \
    -b "DC=lab,DC=local" \
    -D "user@lab.local" \
    -W "(objectClass=user)"

# Find all computers
ldapsearch -x -H ldap://dc.lab.local \
    -b "DC=lab,DC=local" \
    -D "user@lab.local" \
    -W "(objectClass=computer)"
```

### Lab 5: Detect Kerberoasting

```powershell
# Enable Kerberos logging
# HKLM\SYSTEM\CurrentControlSet\Control\Lsa\Kerberos\Parameters
# Set KDCValidation = 1

# Monitor Event ID 4769
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4769} |
    Where-Object { $_.Properties[8].Value -eq '0x17' } |
    Select-Object TimeCreated, Properties
```

---

## 16. Summary Table

| Topic | Key Takeaway |
|-------|-------------|
| **Domain** | Logical group of objects sharing NTDS.dit database |
| **Forest** | Collection of domains with shared schema and trust |
| **NTDS.dit** | ESE database storing all AD objects |
| **FSMO Roles** | 5 specialized roles (2 forest-wide, 3 domain-wide) |
| **GPO** | Configuration enforcement via GPC (AD) + GPT (SYSVOL) |
| **GPO Processing** | LSDOU order; Enforced overrides; Block Inheritance |
| **Kerberos** | Ticket-based auth: AS-REQ → TGT → TGS-REQ → TGS → AP-REQ |
| **LDAP** | Directory query protocol (389/636, 3268/3269) |
| **OU** | Delegation and policy targeting container |
| **Delegation** | Unconstrained (dangerous) → Constrained → RBCD |
| **Golden Ticket** | Forged TGT using KRBTGT hash = domain admin |
| **Silver Ticket** | Forged service ticket using service hash |
| **Kerberoasting** | Offline crack of TGS for SPN accounts |
| **DCSync** | Replicate credentials from DC using DRS protocol |
| **LSA Protection** | RunAsPPL prevents LSASS memory dumping |
| **Attack Surface** | Credentials, lateral movement, privilege escalation, persistence |

---

## Resources

Books:
- *Active Directory Deep Dives* — Sean Metcalf
- *Active Directory Security* — Sean Metcalf
- *Penetration Testing Active Directory* — Will Schroeder, Harmj0y

Videos:
- Black Hat / DEF CON AD security talks
- Sean Metcalf's AD security presentations
- SANS SEC560 / SEC565

Documentation:
- [Microsoft AD Documentation](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/)
- [AD Security Blog](https://adsecurity.org/)
- [Harmj0y's Blog](https://harmj0y.net/)

Tools:
- BloodHound — https://github.com/BloodHoundAD/BloodHound
- Rubeus — https://github.com/GhostPack/Rubeus
- Mimikatz — https://github.com/gentilkiwi/mimikatz
- PingCastle — https://github.com/vletoux/pingcastle
