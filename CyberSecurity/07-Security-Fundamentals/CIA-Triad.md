# CIA Triad

## Layer Position

```
┌─────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                  │
├─────────────────────────────────────────────────────┤
│              SECURITY FUNDAMENTALS                   │
│  ┌───────────────────────────────────────────────┐  │
│  │              CIA TRIAD                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │Confiden- │ │ Integrity│ │ Availability │  │  │
│  │  │ tiality  │ │          │ │              │  │  │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │  │
│  │       │             │              │           │  │
│  │       ▼             ▼              ▼           │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │     Trade-offs & Real-World Examples     │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│             SUPPORTING CONTROLS LAYER               │
│  Encryption │ Hashing │ Redundancy │ Access Control │
└─────────────────────────────────────────────────────┘
```

## What is the CIA Triad?

The CIA Triad is the foundational model in information security consisting of three interdependent pillars:

- **Confidentiality** — Only authorized parties can access data
- **Integrity** — Data is accurate, trustworthy, and unaltered
- **Availability** — Systems and data are accessible when needed

Every security control, policy, and architecture decision maps back to at least one pillar. The triad is the lens through which risk is assessed and defenses are designed.

## Why Learn It?

- Cornerstone of every security certification (CISSP, CEH, CompTIA Security+)
- Drives all security architecture decisions
- Enables structured risk assessment
- Foundation for compliance frameworks (NIST, ISO 27001, GDPR)
- Every incident can be analyzed through the CIA lens

---

## Pillar 1: Confidentiality

### Definition
Ensuring that information is accessible only to those authorized to have access. Preventing unauthorized disclosure of sensitive information.

### Core Mechanisms

#### 1. Encryption
Transforms plaintext into ciphertext using algorithms and keys.

```
Plaintext ──[Algorithm + Key]──▶ Ciphertext ──[Algorithm + Key]──▶ Plaintext
```

**Symmetric Encryption (same key)**
```
┌──────────┐    Key     ┌──────────┐
│ Plaintext│───────────▶│Ciphertext│
│  "HELLO" │◀───────────│  "X5#9@" │
└──────────┘  Decrypt   └──────────┘
     │                       │
     └─────── Shared Key ────┘
```

| Algorithm | Key Size | Block Size | Status |
|-----------|----------|------------|--------|
| DES | 56-bit | 64-bit | Broken |
| 3DES | 168-bit | 64-bit | Deprecated |
| AES-128 | 128-bit | 128-bit | Secure |
| AES-256 | 256-bit | 128-bit | Secure |
| ChaCha20 | 256-bit | Stream | Secure |

**Asymmetric Encryption (key pair)**
```
┌──────────┐                      ┌──────────┐
│  Sender  │    Encrypted with    │ Receiver │
│          │─── Public Key ──────▶│          │
│          │◀── Private Key ─────│          │
└──────────┘    Decrypted with    └──────────┘
```

| Algorithm | Key Size | Use Case |
|-----------|----------|----------|
| RSA | 2048-4096 bit | Signatures, key exchange |
| ECC | 256-bit | Mobile, IoT |
| Diffie-Hellman | 2048+ bit | Key exchange |
| X25519 | 256-bit | Modern key exchange |

#### 2. Access Control
Restricts who can read, modify, or execute resources.

```
User ──▶ Authentication ──▶ Authorization ──▶ Resource
   │          │                    │              │
   │     Verify Identity    Check Permissions     │
   │          │                    │              │
   │     ┌────▼────┐         ┌────▼────┐         │
   │     │Password │         │  RBAC   │         │
   │     │  MFA    │         │  ABAC   │         │
   │     │Biometric│         │  ACL    │         │
   │     └─────────┘         └─────────┘         │
```

**Types of Access Control:**
- **DAC (Discretionary):** Owner decides access
- **MAC (Mandatory):** System-enforced labels
- **RBAC (Role-Based):** Access by role assignment
- **ABAC (Attribute-Based):** Access by attributes/conditions

#### 3. Data Classification
Categorizes data by sensitivity to determine protection level.

```
┌─────────────────────────────────────────────┐
│           DATA CLASSIFICATION               │
├──────────────┬──────────────────────────────┤
│ Top Secret   │ National security,           │
│              │ crypto keys, master DBs      │
├──────────────┼──────────────────────────────┤
│ Secret       │ Trade secrets, PII,          │
│              │ financial records            │
├──────────────┼──────────────────────────────┤
│ Confidential │ Internal memos,              │
│              │ employee data                │
├──────────────┼──────────────────────────────┤
│ Internal     │ Public-facing docs,          │
│              │ marketing materials          │
├──────────────┼──────────────────────────────┤
│ Public       │ Published content,           │
│              │ press releases               │
└──────────────┴──────────────────────────────┘
```

### Confidentiality Breach Examples
- **Equifax (2017):** 147M records exposed via unpatched Apache Struts
- **Yahoo (2013-14):** 3B accounts compromised
- **Capital One (2019):** 100M records via misconfigured WAF
- **SolarWinds (2020):** Supply chain attack exposing government data

---

## Pillar 2: Integrity

### Definition
Ensuring that data is accurate, complete, and has not been tampered with. Includes both data integrity and system integrity.

### Core Mechanisms

#### 1. Hashing
Produces a fixed-size digest from arbitrary input. One-way function — cannot reverse.

```
Input ("Hello World") ──▶ SHA-256 ──▶ 59e19f...
```

| Algorithm | Output Size | Speed | Security |
|-----------|-------------|-------|----------|
| MD5 | 128-bit | Fast | Broken |
| SHA-1 | 160-bit | Fast | Broken |
| SHA-256 | 256-bit | Moderate | Secure |
| SHA-512 | 512-bit | Moderate | Secure |
| bcrypt | Variable | Slow | Passwords |
| Argon2 | Variable | Slow | Passwords |

**Hash Properties:**
- Deterministic: same input always produces same output
- Pre-image resistant: cannot derive input from hash
- Collision resistant: infeasible to find two inputs with same hash
- Avalanche: small input change produces drastically different hash

```
┌─────────────┐    ┌─────────┐    ┌──────────────────┐
│ "Hello"     │───▶│  SHA-256│───▶│ 2cf24dba...      │
└─────────────┘    └─────────┘    └──────────────────┘
┌─────────────┐    ┌─────────┐    ┌──────────────────┐
│ "hello"     │───▶│  SHA-256│───▶│ b94d27b9...      │
└─────────────┘    └─────────┘    └──────────────────┘
     (1 char change = completely different hash)
```

#### 2. Digital Signatures
Provides authentication, integrity, and non-repudiation.

```
Signing:
Message ──▶ Hash ──▶ Encrypt with Private Key ──▶ Signature

Verification:
Signature ──▶ Decrypt with Public Key ──▶ Hash
                                                    ╳ Compare
Message ──▶ Hash ──────────────────────────▶ Hash
```

| Algorithm | Use Case | Strength |
|-----------|----------|----------|
| RSA-PSS | Code signing, TLS | Strong |
| ECDSA | Blockchain, TLS | Strong |
| EdDSA | Modern protocols | Very Strong |
| HMAC | API authentication | Strong |

#### 3. Checksums and CRCs
Detect accidental corruption (not malicious tampering).

```
Data ──▶ CRC-32 Algorithm ──▶ 4-byte checksum
Data + Checksum ──▶ Transmitted ──▶ Receiver recalculates ──▶ Compare
```

#### 4. Version Control and Audit Trails
- Git commits with signed tags
- Database transaction logs
- File integrity monitoring (AIDE, Tripwire, OSSEC)

### Integrity Threats

| Threat | Description | Example |
|--------|-------------|---------|
| Man-in-the-Middle | Attacker intercepts and modifies data | SSL stripping |
| SQL Injection | Malicious queries alter database | Bobby Tables |
| Ransomware | Encrypts files, demands payment | WannaCry |
| Bit-flipping | Modifies ciphertext to change plaintext | WEP attack |
| Supply chain | Compromised software updates | SolarWinds |

### Integrity Breach Examples
- **Stuxnet (2010):** Manipulated PLC firmware to damage Iranian centrifuges
- **Target (2013):** Malware altered transaction records
- **SolarWinds Orion (2020):** Backdoored software updates compromised 18K+ organizations

---

## Pillar 3: Availability

### Definition
Ensuring that systems, applications, and data are accessible to authorized users when needed.

### Core Mechanisms

#### 1. Redundancy

**Hardware Redundancy**
```
┌──────────────────────────────────┐
│         PRIMARY SERVER           │
│         (Active)                 │
└──────────────┬───────────────────┘
               │ Heartbeat
┌──────────────▼───────────────────┐
│        FAILOVER SERVER           │
│        (Standby/Hot)             │
└──────────────────────────────────┘
```

**RAID Configurations:**
| Level | Min Disks | Fault Tolerance | Performance |
|-------|-----------|-----------------|-------------|
| RAID 0 | 2 | None | Read/Write stripe |
| RAID 1 | 2 | 1 disk failure | Read mirror |
| RAID 5 | 3 | 1 disk failure | Read stripe, write parity |
| RAID 6 | 4 | 2 disk failures | Read stripe, dual parity |
| RAID 10 | 4 | 1 per mirror pair | Best performance |

**Network Redundancy:**
```
┌────────┐          ┌────────┐
│ ISP 1  │─────┐   │Router A│
└────────┘     ├──▶│        │──── LAN
┌────────┐     │   └────────┘
│ ISP 2  │─────┘   ┌────────┐
└────────┘         │Router B│──── LAN (backup)
                   └────────┘
```

#### 2. DDoS Protection

```
Internet ──▶ CDN/WAF ──▶ Rate Limiter ──▶ Load Balancer ──▶ Servers
              │                │                │
              │           ┌────▼────┐    ┌─────▼─────┐
              │           │ Block   │    │ Distribute│
              │           │ Bad IPs │    │ Traffic   │
              │           └─────────┘    └───────────┘
```

**DDoS Attack Types:**
| Layer | Type | Example |
|-------|------|---------|
| L3/L4 | Volumetric | UDP flood, ICMP flood |
| L4 | Protocol | SYN flood, Ping of Death |
| L7 | Application | HTTP flood, Slowloris |
| L7 | Amplification | DNS amplification, NTP amplification |

#### 3. Backup and Recovery

```
┌─────────────────────────────────────────┐
│           BACKUP STRATEGY               │
├─────────────────────────────────────────┤
│                                         │
│  Full Backup ──── Complete copy         │
│      │         (weekly)                 │
│      ▼                                  │
│  Incremental ─── Changes since last     │
│      │         (daily)                  │
│      ▼                                  │
│  Differential ── Changes since last     │
│      │         full backup              │
│      ▼                                  │
│  Offsite ─────── Geographic redundancy  │
│      │         (3-2-1 rule)             │
│      ▼                                  │
│  Immutable ───── Cannot be modified     │
│              (ransomware protection)    │
└─────────────────────────────────────────┘
```

**3-2-1 Backup Rule:**
- **3** copies of data
- **2** different media types
- **1** offsite copy

#### 4. High Availability Patterns

```
Active-Active:
┌───────┐  ┌───────┐
│Server1│  │Server2│  ◀── Both handle traffic
└───┬───┘  └───┬───┘
    └────┬─────┘
      Load Balancer

Active-Passive:
┌───────┐  ┌───────┐
│Server1│  │Server2│  ◀── Standby, activates on failure
│Active │  │Passive│
└───┬───┘  └───┬───┘
    └────┬─────┘
      Load Balancer
```

### Availability Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Uptime | (Total - Downtime) / Total | Percentage operational |
| MTBF | Total Uptime / # Failures | Mean Time Between Failures |
| MTTR | Total Repair Time / # Repairs | Mean Time To Repair |
| RPO | — | Max acceptable data loss (time) |
| RTO | — | Max acceptable downtime (time) |

**Availability Targets:**
| SLA | Uptime | Annual Downtime |
|-----|--------|-----------------|
| 99% | Two 9s | 3.65 days |
| 99.9% | Three 9s | 8.76 hours |
| 99.99% | Four 9s | 52.6 minutes |
| 99.999% | Five 9s | 5.26 minutes |

### Availability Breach Examples
- **GitHub (2018):** DDoS attack peaked at 1.35 Tbps
- **Dyn (2016):** Mirai botnet DDoS took down Twitter, Netflix, Reddit
- **AWS S3 (2017):** Typo in command took down major websites for 4+ hours
- **Cloudflare (2019):** 26 million requests/second DDoS attack mitigated

---

## Trade-offs Between CIA

### The CIA Triangle Tensions

```
                    Confidentiality
                         /\
                        /  \
                       /    \
                      / Choose\
                     /  two    \
                    /   of three \
                   /______________\
          Integrity ─────────── Availability

   Maximum Security ◀────────▶ Maximum Usability
```

### Common Trade-off Scenarios

| Scenario | Sacrifice | Gain | Example |
|----------|-----------|------|---------|
| Full disk encryption | Performance | Confidentiality | BitLocker, LUKS |
| Air-gapped systems | Availability | Confidentiality | Military networks |
| Public key infrastructure | Convenience | Integrity + Confidentiality | TLS certificates |
| Multi-factor auth | Availability | Authentication strength | Banking apps |
| Redundant systems | Cost | Availability | Cloud regions |
| Audit logging | Performance | Integrity + Accountability | SIEM systems |
| Zero trust architecture | Usability | Security | BeyondCorp |

### Balancing Framework

```
┌─────────────────────────────────────────────────────┐
│              RISK-BASED APPROACH                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Identify asset value (CIA priority)             │
│  2. Assess threat likelihood                        │
│  3. Evaluate impact (CIA compromise)                │
│  4. Select controls proportional to risk            │
│  5. Accept residual risk or add controls            │
│                                                     │
│  Example:                                           │
│  ┌─────────────┬────────┬────────┬──────────┐      │
│  │ Asset       │ C      │ I      │ A        │      │
│  ├─────────────┼────────┼────────┼──────────┤      │
│  │ Medical DB  │ HIGH   │ HIGH   │ MEDIUM   │      │
│  │ Web server  │ LOW    │ HIGH   │ HIGH     │      │
│  │ Backup sys  │ HIGH   │ HIGH   │ LOW      │      │
│  └─────────────┴────────┴────────┴──────────┘      │
└─────────────────────────────────────────────────────┘
```

---

## Real-World Case Studies

### Case Study 1: Equifax Breach (2017)
- **Confidentiality:** 147M records (SSNs, birth dates, addresses) exposed
- **Integrity:** Attackers could modify data silently
- **Availability:** N/A — data was exfiltrated, not destroyed
- **Root Cause:** Unpatched Apache Struts vulnerability (CVE-2017-5638)
- **Lesson:** Patch management is a CIA control

### Case Study 2: WannaCry (2017)
- **Confidentiality:** Limited — ransomware encrypts, doesn't exfiltrate
- **Integrity:** Files encrypted, integrity destroyed
- **Availability:** 200K+ systems across 150 countries rendered unusable
- **Root Cause:** EternalBlue exploit on unpatched Windows SMB
- **Lesson:** Patch management preserves all three CIA pillars

### Case Study 3: SolarWinds (2020)
- **Confidentiality:** Government and enterprise data compromised
- **Integrity:** Software update pipeline compromised — trust broken
- **Availability:** N/A — stealth persistence, not destructive
- **Root Cause:** Supply chain attack on Orion build system
- **Lesson:** Supply chain security is critical to integrity

### Case Study 4: Colonial Pipeline (2021)
- **Confidentiality:** Employee credentials stolen via VPN
- **Integrity:** Ransomware encrypted billing systems
- **Availability:** Pipeline shut down for 6 days, fuel shortages
- **Root Cause:** Single VPN password, no MFA
- **Lesson:** MFA and network segmentation protect all CIA pillars

---

## Security Perspective

### Defense-in-Depth (Layered Security)

```
┌──────────────────────────────────────────┐
│  LAYER 1: Physical                       │
│  Locks, badges, cameras, guards          │
├──────────────────────────────────────────┤
│  LAYER 2: Network                       │
│  Firewalls, IDS/IPS, segmentation        │
├──────────────────────────────────────────┤
│  LAYER 3: Host                          │
│  OS hardening, EDR, patching             │
├──────────────────────────────────────────┤
│  LAYER 4: Application                   │
│  Input validation, auth, secure coding   │
├──────────────────────────────────────────┤
│  LAYER 5: Data                          │
│  Encryption, classification, DLP         │
└──────────────────────────────────────────┘

Each layer addresses one or more CIA pillars.
```

### Attack Techniques Targeting CIA

| CIA Pillar | Attack | Method |
|------------|--------|--------|
| Confidentiality | Packet sniffing | Intercept unencrypted traffic |
| Confidentiality | SQL injection | Extract database contents |
| Confidentiality | Phishing | Steal credentials |
| Integrity | Man-in-the-middle | Modify data in transit |
| Integrity | Ransomware | Encrypt and alter files |
| Integrity | Rootkits | Modify system components |
| Availability | DDoS | Overwhelm resources |
| Availability | Power outage | Physical destruction |
| Availability | Logic bomb | Trigger system failure |

---

## Internal Architecture

### How CIA Maps to Security Controls

```
┌────────────────────────────────────────────────────────┐
│                    SECURITY CONTROLS                    │
├──────────────────┬──────────────────┬─────────────────┤
│   CONFIDENTIALITY│    INTEGRITY     │  AVAILABILITY   │
├──────────────────┼──────────────────┼─────────────────┤
│ • Encryption     │ • Hashing        │ • Redundancy    │
│ • Access Control │ • Digital Sigs   │ • Load Balancing│
│ • Data Class.    │ • Checksums      │ • Failover      │
│ • Steganography  │ • Version Control│ • Backups       │
│ • DLP            │ • File Integrity │ • DDoS Protect. │
│ • VPN            │ • Audit Logs     │ • UPS/Generators│
│ • MFA            │ • Input Valid.   │ • Clustering    │
│ • Zero Trust     │ • Code Signing   │ • Replication   │
└──────────────────┴──────────────────┴─────────────────┘
```

### Control Categories (NIST SP 800-53)

| Category | Purpose | Examples |
|----------|---------|---------|
| Preventive | Stop incidents before they occur | Firewalls, encryption, access control |
| Detective | Identify incidents during/after occurrence | IDS, audit logs, file integrity |
| Corrective | Restore systems after incidents | Backups, patches, incident response |
| Deterrent | Discourage potential attackers | Warning banners, security cameras |
| Compensating | Alternative controls when primary fails | Enhanced monitoring when patching delayed |

---

## Debugging / Analysis Tools

### For Confidentiality
| Tool | Purpose |
|------|---------|
| Wireshark | Network packet analysis, detect unencrypted data |
| OpenSSL | Test TLS/SSL configurations |
| Nmap | Identify open ports and services |
| Metasploit | Penetration testing |
| John the Ripper | Password strength testing |
| Hashcat | Password hash cracking |
| SSLyze | TLS configuration auditing |
| testssl.sh | Comprehensive TLS testing |

### For Integrity
| Tool | Purpose |
|------|---------|
| AIDE | Advanced Intrusion Detection Environment |
| Tripwire | File integrity monitoring |
| OSSEC | Host-based IDS |
| GPG/PGP | Digital signatures |
| OpenSSL dgst | File hash verification |
| sha256sum | Hash verification utility |
| Git | Version control with integrity |

### For Availability
| Tool | Purpose |
|------|---------|
| Nagios/Zabbix | Infrastructure monitoring |
| Prometheus + Grafana | Metrics and dashboards |
| HAProxy/Nginx | Load balancing |
| Pacemaker | Cluster resource management |
| rsync | File synchronization |
| Velero | Kubernetes backup |
| MRTG | Network traffic monitoring |

---

## Practical Examples

### Lab 1: Encryption (Confidentiality)
```bash
# Generate AES-256 key
openssl enc -aes-256-cbc -salt -pbkdf2 -in plaintext.txt -out encrypted.bin

# Decrypt
openssl enc -aes-256-cbc -d -pbkdf2 -in encrypted.bin -out decrypted.txt

# Generate RSA key pair
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem

# Sign a file
openssl dgst -sha256 -sign private.pem -out signature.bin document.txt

# Verify signature
openssl dgst -sha256 -verify public.pem -signature signature.bin document.txt
```

### Lab 2: Hashing (Integrity)
```bash
# Generate file hashes
sha256sum important_file.tar.gz
md5sum important_file.tar.gz

# Verify hash
echo "expected_hash  important_file.tar.gz" | sha256sum -c

# Password hashing with bcrypt
htpasswd -B -n -b "" "user" "password123"

# HMAC generation
echo -n "message" | openssl dgst -sha256 -hmac "secret_key"
```

### Lab 3: Availability Testing
```bash
# Stress test web server
ab -n 10000 -c 100 http://target/

# Monitor system resources
htop
iostat -x 1
vmstat 1

# Test failover
systemctl stop nginx  # Simulate failure
# Observe failover to backup server
systemctl start nginx
```

### Lab 4: File Integrity Monitoring
```bash
# Initialize AIDE database
sudo aideinit

# Check for changes
sudo aide --check

# Update database after legitimate changes
sudo aide --update
sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

---

## Interview Questions

### Fundamentals
1. **What are the three pillars of the CIA Triad and why are they important?**
2. **Give an example where improving confidentiality might reduce availability.**
3. **How does encryption protect confidentiality vs. how does hashing protect integrity?**
4. **What is the difference between symmetric and asymmetric encryption?**
5. **Explain the difference between RPO and RTO with examples.**

### Intermediate
6. **How would you design a system that balances all three CIA pillars?**
7. **What is defense-in-depth and how does it relate to the CIA Triad?**
8. **Compare and contrast MAC, DAC, and RBAC in terms of CIA.**
9. **How does a digital signature provide integrity, authenticity, and non-repudiation?**
10. **Explain the 3-2-1 backup rule and why each component matters.**

### Advanced
11. **How would you assess CIA priorities for a hospital's electronic health record system?**
12. **Design a disaster recovery plan for an e-commerce platform. What are your RPO and RTO targets?**
13. **How does Zero Trust architecture address all three CIA pillars?**
14. **Analyze the SolarWinds attack through the CIA Triad framework.**
15. **How do you handle the trade-off between confidentiality and availability in a real-time trading system?**

---

## Hands-On Labs

### Lab 1: TLS Configuration Audit
```bash
# Test TLS configuration of a web server
nmap --script ssl-enum-ciphers -p 443 target.example.com

# Comprehensive TLS test
testssl.sh target.example.com

# Check for weak ciphers
sslscan target.example.com:443
```

### Lab 2: Password Security Assessment
```bash
# Create password hash with bcrypt
python3 -c "import bcrypt; print(bcrypt.hashpw(b'password123', bcrypt.gensalt()))"

# Check password strength
zxcvbn "password123"

# Hashcat mode for bcrypt
hashcat -m 3200 hash.txt wordlist.txt
```

### Lab 3: DDoS Simulation (Local Only)
```bash
# Monitor network traffic during test
tcpdump -i eth0 -w capture.pcap

# SYN flood test (local only, with permission)
hping3 -S -p 80 --flood 127.0.0.1

# Analyze with Wireshark
wireshark capture.pcap
```

### Lab 4: File Integrity Baseline
```bash
# Create baseline hash of critical files
find /etc -type f -exec sha256sum {} \; > /var/backups/etc_hashes.txt

# Check for modifications
while IFS=' ' read -r hash file; do
    current=$(sha256sum "$file" 2>/dev/null | awk '{print $1}')
    if [ "$hash" != "$current" ]; then
        echo "MODIFIED: $file"
    fi
done < /var/backups/etc_hashes.txt
```

---

## Summary Table

| Component | Purpose | CIA Pillar | Key Controls | Attack Vectors |
|-----------|---------|------------|--------------|----------------|
| Encryption | Protect data in transit/at rest | Confidentiality | AES, RSA, TLS | Key compromise, side-channel |
| Access Control | Restrict unauthorized access | Confidentiality | RBAC, ABAC, MFA | Privilege escalation, bypass |
| Data Classification | Categorize sensitivity | Confidentiality | Labels, handling rules | Social engineering, leaks |
| Hashing | Verify data integrity | Integrity | SHA-256, bcrypt | Collision attacks |
| Digital Signatures | Authenticity + integrity | Integrity | RSA-PSS, ECDSA | Key compromise, replay |
| File Integrity Monitoring | Detect unauthorized changes | Integrity | AIDE, Tripwire | Rootkits, stealth modifications |
| Redundancy | Eliminate single points of failure | Availability | RAID, clustering | Correlated failures |
| Load Balancing | Distribute load, prevent overload | Availability | HAProxy, NLB | Layer 7 DDoS |
| Backups | Recover from data loss | Availability | 3-2-1 rule, immutable | Ransomware, deletion |
| DDoS Protection | Maintain service availability | Availability | CDN, rate limiting, WAF | Volumetric, application-layer |
| Audit Logging | Track changes and access | All three | SIEM, log management | Log tampering, storage exhaustion |

---

## References

- NIST SP 800-53: Security and Privacy Controls
- ISO/IEC 27001: Information Security Management
- NIST Cybersecurity Framework
- OWASP Top 10
- CISSP CBK (Common Body of Knowledge)
- SANS Institute Reading Room
- RFC 4949: Internet Security Glossary
