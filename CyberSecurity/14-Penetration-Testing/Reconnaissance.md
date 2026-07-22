# Reconnaissance

## What is it?

Reconnaissance is the systematic collection of information about a target before launching an attack. It is divided into two categories: **passive reconnaissance** (gathering information from public sources without direct contact with the target) and **active reconnaissance** (directly interacting with target systems to gather information). This phase is often called the "footprinting" phase and is critical because the quality of intelligence gathered here determines the success of all subsequent phases.

Reconnaissance involves techniques from OSINT (Open Source Intelligence), social engineering, metadata analysis, domain enumeration, and network scanning. Attackers invest significant time here — studies show that advanced persistent threats may spend weeks or months in reconnaissance before attempting exploitation.

## Why Learn It?

Thorough reconnaissance determines the attack surface and available vectors. Without proper reconnaissance:

- Vulnerability scans miss services on non-standard ports
- Social engineering campaigns lack the personalization needed for success
- Exploitation attempts target wrong services or miss entire attack paths
- Defensive teams cannot detect or prevent what they do not understand

Defenders must understand reconnaissance techniques to implement proper monitoring, minimize information leakage, and detect early-stage adversary activity.

## You Will Learn

- Passive OSINT techniques using public databases, WHOIS, DNS records, and search engines
- Active information gathering with tools like Nmap, DNSenum, fierce, and theHarvester
- Social engineering reconnaissance (LinkedIn, social media, phishing vectors)
- Metadata extraction from documents and images
- Target profiling and attack surface mapping
- Google dorking for sensitive information discovery

## Prerequisites

- Methodology & Frameworks
- Networking Fundamentals

## Related Topics

- Scanning & Enumeration
- Social Engineering
- OSINT

---

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PENETRATION TESTING LIFECYCLE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌════════════════╗    ┌──────────────┐        │
│  │ PRE-ENGAGE-  │───▶║RECONNAISSANCE ║───▶│VULNERABILITY │        │
│  │   MENT       │    ║   (YOU ARE     ║    │  ANALYSIS    │        │
│  │              │    ║    HERE)       ║    │              │        │
│  └──────────────┘    ╚════════════════╝    └──────────────┘        │
│                                                                      │
│  Reconnaissance feeds into ALL subsequent phases.                    │
│  Better recon = More attack vectors = Higher success rate           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Passive Reconnaissance (OSINT)

Passive reconnaissance involves collecting information without directly interacting with the target systems. All information comes from public, third-party sources.

### OSINT Collection Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    OSINT COLLECTION DOMAINS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   SEARCH      │  │   SOCIAL      │  │   PUBLIC      │      │
│  │   ENGINES     │  │   NETWORKS    │  │   RECORDS     │      │
│  │               │  │               │  │               │      │
│  │ • Google      │  │ • LinkedIn    │  │ • WHOIS       │      │
│  │ • Bing        │  │ • Twitter/X   │  │ • DNS Records │      │
│  │ • Shodan      │  │ • GitHub      │  │ • BGP/ASN     │      │
│  │ • Censys      │  │ • Facebook    │  │ • SSL/TLS     │      │
│  │ • ZoomEye     │  │ • Instagram   │  │   Certificates│      │
│  │ • Wayback     │  │ • Reddit      │  │ • Wayback     │      │
│  │   Machine     │  │ • HackerOne   │  │   Machine     │      │
│  │               │  │ • StackOverflow│  │ • crt.sh      │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   CODE        │  │   DOCUMENTS   │  │   BUSINESS    │      │
│  │   REPOS       │  │   & DATA      │  │   INTEL       │      │
│  │               │  │               │  │               │      │
│  │ • GitHub      │  │ • SEC EDGAR   │  │ • Job Postings│      │
│  │ • GitLab      │  │ • Annual      │  │ • Press       │      │
│  │ • Bitbucket   │  │   Reports     │  │   Releases    │      │
│  │ • Pastebin    │  │ • Court       │  │ • Vendor      │      │
│  │ • npm/PyPI    │  │   Records     │  │   Disclosures │      │
│  │               │  │ • Patents     │  │ • Conferences │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### WHOIS Enumeration

WHOIS queries reveal domain registration details including owner information, name servers, and contact details.

```bash
# WHOIS lookup
whois example.com

# Example output analysis:
# Domain Name: example.com
# Registry Domain ID: 2336799_DOMAIN_COM-VRSN
# Registrar WHOIS Server: whois.cloudflare.com
# Updated Date: 2024-01-15T12:00:00Z
# Creation Date: 2010-03-22T18:45:00Z
# Name Server: ns1.cloudflare.com
# Name Server: ns2.cloudflare.com
# DNSSEC: unsigned

# Key information to extract:
# → Registration date (age of domain)
# → Registrar (can indicate if privacy-protected)
# → Name servers (DNS infrastructure)
# → Contact information (email, phone, address)
# → Related domains (same registrant)
```

### DNS Enumeration

DNS records reveal infrastructure details, email configurations, and subdomain information.

```bash
# Basic DNS enumeration
dig example.com ANY
dig example.com A
dig example.com MX
dig example.com NS
dig example.com TXT
dig example.com SOA

# Reverse DNS lookup
dig -x 203.0.113.1

# DNS zone transfer attempt (if misconfigured)
dig axfr example.com @ns1.example.com

# Subdomain enumeration with subfinder
subfinder -d example.com -o subdomains.txt

# DNS brute force with dnsenum
dnsenum --enum example.com

# Certificate Transparency logs
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq '.[].name_value' | sort -u

# Amass for comprehensive DNS enumeration
amass enum -passive -d example.com -o amass_results.txt
```

**DNS Record Types and Their Value:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNS RECORD TYPES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  A Record      → Maps domain to IP address                     │
│  AAAA Record   → Maps domain to IPv6 address                   │
│  MX Record     → Mail server (reveals email provider)          │
│  NS Record     → Name servers (reveals DNS infrastructure)     │
│  TXT Record    → Text records (SPF, DKIM, DMARC, verification)│
│  SOA Record    → Start of Authority (admin info, serial #)     │
│  CNAME Record  → Canonical name (reveals hosting, CDN)        │
│  SRV Record    → Service records (reveals internal services)   │
│  PTR Record    → Reverse DNS (IP to hostname mapping)          │
│  CAA Record    → Certificate Authority Authorization           │
│                                                                  │
│  HIGH VALUE: MX reveals email provider (Google, Microsoft)     │
│  HIGH VALUE: TXT records often contain SPF, verification tokens│
│  HIGH VALUE: SRV records reveal internal service names         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Shodan and IoT Search Engines

```bash
# Shodan CLI — Internet-wide device search
# Install: pip install shodan

# Initialize
shodan init YOUR_API_KEY

# Search for target's IP range
shodan search org:"Target Company" --fields ip_str,port,product

# Search by hostname
shodan search hostname:example.com --fields ip_str,port,product

# Search for specific services
shodan search org:"Target" port:3389 product:"Remote Desktop"
shodan search org:"Target" port:22 product:"OpenSSH"
shodan search org:"Target" port:21 product:"vsftpd"

# Censys alternative
# censys search "services.tls.certificates.leaf_names: example.com"

# ZoomEye
# zoomeye search "org:example.com"
```

---

## Active Reconnaissance

Active reconnaissance involves direct interaction with target systems. This is detectable and requires authorization.

### Network Scanning

```bash
# Nmap — Network discovery and service enumeration

# Quick host discovery
nmap -sn 10.10.10.0/24

# TCP SYN scan (stealth)
nmap -sS -T4 -p- 10.10.10.1

# Service version detection
nmap -sV -sC -O 10.10.10.1

# Full port scan with scripts
nmap -sV -sC -p- --min-rate=1000 -T4 10.10.10.1

# UDP scan (top 100 ports)
nmap -sU --top-ports 100 10.10.10.1

# NSE scripts for specific services
nmap --script=http-enum,http-headers,http-methods -p 80,443 10.10.10.1
nmap --script=smb-enum-shares,smb-enum-users -p 445 10.10.10.1
nmap --script=ssl-cert,ssl-enum-ciphers -p 443 10.10.10.1

# Output formats
nmap -oA results -sV -sC 10.10.10.1
# Creates: results.nmap, results.xml, results.gnmap
```

### Web Reconnaissance

```bash
# Directory and file enumeration
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt -t 50

# Virtual host discovery
gobuster vhost -u https://target.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Subdomain brute forcing
ffuf -u https://FUZZ.target.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -mc 200

# Technology fingerprinting
whatweb https://target.com

# Wappalyzer (browser extension or CLI)
wappalyzer https://target.com

# Wayback Machine — historical URLs
waybackurls https://target.com | sort -u | tee wayback_urls.txt

# GAU — Get All URLs
gau target.com | sort -u | tee gau_urls.txt

# LinkFinder — JavaScript endpoint extraction
python linkfinder.py -i https://target.com -o results.html

# Robot.txt and sitemap analysis
curl -s https://target.com/robots.txt
curl -s https://target.com/sitemap.xml
```

### SSL/TLS Certificate Analysis

```bash
# Extract certificate information
openssl s_client -connect target.com:443 -servername target.com < /dev/null 2>/dev/null | openssl x509 -text -noout

# Certificate Transparency logs
curl -s "https://crt.sh/?q=%.target.com&output=json" | jq

# Key information from certificates:
# → Organization name
# → Alternative DNS names (SANs)
# → Certificate authority
# → Validity dates
# → Issuer information
```

---

## Google Dorking

Google dorking uses advanced search operators to find sensitive information exposed on the internet.

### Essential Google Dork Operators

```
┌─────────────────────────────────────────────────────────────────┐
│                   GOOGLE DORK OPERATORS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Operator          │ Purpose                │ Example            │
│  ─────────────────┼────────────────────────┼────────────────── │
│  site:             │ Restrict to domain     │ site:target.com    │
│  inurl:            │ URL contains term      │ inurl:admin        │
│  intitle:          │ Title contains term    │ intitle:"login"    │
│  filetype:         │ Specific file type     │ filetype:pdf       │
│  ext:              │ File extension         │ ext:sql            │
│  intext:           │ Page body contains     │ intext:"password"  │
│  cache:            │ Cached version         │ cache:target.com   │
│  link:              │ Pages linking to URL  │ link:target.com    │
│  related:          │ Similar sites          │ related:target.com │
│  info:              │ Info about page       │ info:target.com    │
│  OR                │ Either term            │ admin OR root      │
│  -                 │ Exclude term           │ -site:target.com   │
│  " "               │ Exact phrase           │ "exact phrase"     │
│  *                 │ Wildcard               │ admin*             │
│  ( )               │ Group terms            │ (admin OR root)    │
│  ..                │ Number range           │ port..1000         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Dangerous Google Dorks

```
# Exposed login pages
site:target.com inurl:login
site:target.com inurl:admin
site:target.com intitle:"Dashboard"
site:target.com inurl:wp-admin OR inurl:wp-login

# Exposed files
site:target.com filetype:pdf
site:target.com filetype:doc OR filetype:docx
site:target.com filetype:xlsx OR filetype:csv
site:target.com filetype:sql
site:target.com filetype:conf OR filetype:config

# Sensitive directories
site:target.com inurl:backup
site:target.com inurl:config
site:target.com inurl:test
site:target.com inurl:dev

# Exposed credentials and data
site:target.com intext:"password"
site:target.com intext:"username" intext:"password"
site:target.com filetype:log password
site:target.com filetype:env DB_PASSWORD

# Source code and configuration
site:target.com filetype:php inurl:config
site:target.com filetype:yml database
site:target.com filetype:xmlrpc

# Error messages and debugging
site:target.com intext:"error" intext:"mysql"
site:target.com intext:"Warning:" intext:"mysql_fetch"
site:target.com intext:" stack trace"
```

### Google Dorking Automation

```bash
# Paginated Google dorking with Googler
googler -n 100 -x site:target.com filetype:pdf

# Automated dork scanning with GooFuzz
python goofuzz.py -t target.com -d "site:target.com inurl:admin"

# Dorking with searchsploit
searchsploit apache 2.4.49
searchsploit wordpress 5.8
```

---

## Social Engineering Reconnaissance

### OSINT on Personnel

```
┌─────────────────────────────────────────────────────────────────┐
│              SOCIAL ENGINEERING RECONNAISSANCE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TARGET: Key Personnel                                          │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  LinkedIn   │ → Job titles, technologies, connections       │
│  │             │ → Recent posts, company culture               │
│  │             │ → Email format (firstname.lastname)           │
│  └─────────────┘                                                │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  Twitter/X  │ → Personal interests, travel patterns         │
│  │             │ → Company announcements                        │
│  │             │ → Technology stack hints                       │
│  └─────────────┘                                                │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  GitHub     │ → Code repositories, commit history           │
│  │             │ → Email addresses in commits                  │
│  │             │ → Leaked credentials/API keys                 │
│  └─────────────┘                                                │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  Hunter.io  │ → Email pattern discovery                     │
│  │             │ → Valid email verification                     │
│  │             │ → Associated email addresses                  │
│  └─────────────┘                                                │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  Glassdoor  │ → Internal processes and technologies         │
│  │             │ → Interview questions (reveal tech stack)     │
│  │             │ → Employee sentiments                          │
│  └─────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phishing Reconnaissance

```
Pre-Attack Information Gathering for Phishing:

1. Email Address Discovery
   → hunter.io: Find email patterns
   → theHarvester: Aggregate from multiple sources
   → LinkedIn: Direct personnel identification

2. Email Format Analysis
   → first.last@company.com
   → firstlast@company.com
   → f.last@company.com

3. Email Security Analysis
   → MX records reveal email provider
   → SPF records reveal authorized senders
   → DKIM/DMARC reveal email authentication

4. Target Profiling
   → Job roles and responsibilities
   → Recent company events (mergers, launches)
   → Technology usage (LinkedIn skills, GitHub)
   → Social connections (who reports to whom)
```

---

## Information Gathering Tools

### theHarvester

```bash
# theHarvester — Email and subdomain harvesting
# Install: pip install theHarvester

# Basic enumeration
theHarvester -d target.com -b all

# Specific source
theHarvester -d target.com -b google,linkedin,github

# Limit results
theHarvester -d target.com -b all -l 200

# Output to file
theHarvester -d target.com -b all -f harvester_results.html
```

### Recon-ng

```bash
# Recon-ng — Full-featured reconnaissance framework
# Install: apt install recon-ng

# Start Recon-ng
recon-ng

# Create workspace
workspaces create target_recon

# Install modules
marketplace install recon/domains-hosts/hackertarget
marketplace install recon/contacts-contacts/metacrawler
marketplace install recon/domains-vulnerabilities/xssposed

# Use modules
modules load recon/domains-hosts/hackertarget
options set SOURCE target.com
run

# Show results
hosts show
contacts show
```

### Maltego

```
Maltego — Visual OSINT and Link Analysis

Key Transforms:
• Domain → DNS servers
• Domain → Email addresses
• Email → Social profiles
• Domain → IP addresses
• IP → Geolocation
• Domain → SSL certificates
• Company → Employees
• Person → Email
• Domain → Subdomains
• Subdomain → IP
• IP → Netblock

Workflow:
1. Create new graph
2. Add seed entity (domain, email, person)
3. Run transforms to expand graph
4. Analyze relationships and patterns
5. Export results
```

---

## Metadata Analysis

### Document Metadata Extraction

```bash
# ExifTool — Extract metadata from files
exifTool document.pdf
exifTool image.jpg
exifTool presentation.pptx

# Key metadata to look for:
# → Author name
# → Organization
# → Software/Version
# → GPS coordinates (images)
# → Creation/Modification dates
# → Hidden comments
# → Template information

# FOCA — Extract metadata from office documents
# FOCA analyzes:
# → Software versions (vulnerability research)
# → Author names (social engineering)
# → Network information (printer names, server names)
# → Templates (internal naming conventions)

# Binwalk — Firmware/binary analysis
binwalk firmware.bin
binwalk -e firmware.bin  # Extract embedded files
```

---

## Real-World Scenario: Reconnaissance Campaign

**Scenario**: Penetration test against MedTech Corp, a healthcare technology company.

```
┌─────────────────────────────────────────────────────────────────┐
│         RECONNAISSANCE CAMPAIGN — MEDTECH CORP                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DAY 1: PASSIVE RECONNAISSANCE                                  │
│  ═══════════════════════════════                                 │
│  WHOIS:                                                         │
│  → Registered 2015, DomainsByProxy (privacy protection)        │
│  → Name servers: ns1.cloudflare.com                            │
│                                                                  │
│  DNS:                                                           │
│  → MX: mxa-002a4a01.gslb.pphosted.com (Proofpoint)            │
│  → SPF: includes:_spf.proofpoint.com                           │
│  → TXT: MS=ms123456 (Microsoft 365 verification)               │
│  → DMARC: v=DMARC1; p=quarantine                              │
│                                                                  │
│  CERTIFICATE TRANSPARENCY:                                      │
│  → admin.medtechcorp.com                                       │
│  → api.medtechcorp.com                                         │
│  → staging.medtechcorp.com                                     │
│  → jenkins.medtechcorp.com                                     │
│  → gitlab.medtechcorp.com                                      │
│                                                                  │
│  GITHUB:                                                        │
│  → Found 3 developer accounts                                  │
│  → Leaked AWS access key in commit history                     │
│  → Internal API endpoint in code comments                      │
│  → Database connection string in config file                    │
│                                                                  │
│  LINKEDIN:                                                      │
│  → 15 employees, 3 developers post about "Django"             │
│  → Job posting mentions "PostgreSQL, Redis, Celery"           │
│  → CTO previously worked at competitor using similar stack     │
│                                                                  │
│  GLASSDOOR:                                                     │
│  → Mentions "Jira" and "Confluence" internally                │
│  → Complaint about "outdated VPN appliances"                  │
│                                                                  │
│  DAY 2: ACTIVE RECONNAISSANCE                                   │
│  ═══════════════════════════════                                 │
│  NMAP RESULTS:                                                  │
│  → 203.0.113.0/24 — 12 hosts alive                             │
│  → Web server: 443 (nginx/1.18), 8080 (Jenkins)              │
│  → VPN: 1194 (OpenVPN)                                        │
│  → Email: 993 (Dovecot), 587 (Postfix)                       │
│                                                                  │
│  GOBUSTER:                                                      │
│  → /admin, /api/v1, /backup, /jenkins                        │
│  → /wp-content (WordPress on staging)                          │
│                                                                  │
│  ATTACK VECTORS IDENTIFIED:                                     │
│  1. Jenkins default credentials (high)                         │
│  2. WordPress on staging with outdated plugins (high)         │
│  3. Leaked AWS credentials (critical)                          │
│  4. SQL injection in API endpoint (critical)                   │
│  5. OpenVPN with weak certificate (medium)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Perspective

### Defending Against Reconnaissance

```
┌─────────────────────────────────────────────────────────────────┐
│              RECONNAISSANCE DEFENSE STRATEGIES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INFORMATION CONTROL:                                           │
│  □ Privacy protection on domain registrations                  │
│  □ Minimize information on job postings                         │
│  □ Social media policies for employees                         │
│  □ Remove sensitive files from public web servers             │
│  □ Monitor for credential leaks on paste sites                 │
│                                                                  │
│  DNS HARDENING:                                                 │
│  □ Restrict zone transfers to authorized servers               │
│  □ Use private DNS infrastructure                              │
│  □ Monitor DNS queries for reconnaissance patterns             │
│  □ Implement DNSSEC                                           │
│                                                                  │
│  CERTIFICATE MANAGEMENT:                                        │
│  □ Minimize SANs in certificates                               │
│  □ Monitor Certificate Transparency logs                       │
│  □ Use wildcard certificates carefully                         │
│                                                                  │
│  CODE REPOSITORY SECURITY:                                      │
│  □ Scan repositories for leaked credentials                    │
│  □ Implement git-secrets or pre-commit hooks                   │
│  □ Use environment variables, not hardcoded secrets            │
│  □ Regularly audit commit history                              │
│                                                                  │
│  DETECTION:                                                     │
│  □ Monitor for unusual DNS query patterns                      │
│  □ Detect OSINT tool signatures in web logs                    │
│  □ Alert on reconnaissance-related HTTP requests               │
│  □ Track information disclosure in public sources              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Reconnaissance Detection

| Indicator | Detection Method | Priority |
|-----------|-----------------|----------|
| WHOIS lookups | Domain registrar monitoring | Low |
| DNS enumeration | DNS query logging, anomaly detection | Medium |
| Port scanning | IDS/IPS alerts, firewall logs | High |
| Email harvesting | Email gateway logs | Medium |
| Social media profiling | Cannot be directly detected | — |
| GitHub credential leaks | Automated scanning services | Critical |
| Google dorking | Web server access logs | Medium |

---

## Interview Questions

**Q1: What is the difference between passive and active reconnaissance?**
A: Passive reconnaissance gathers information from public sources (WHOIS, DNS, social media) without directly contacting the target — it is undetectable. Active reconnaissance involves direct interaction with target systems (port scanning, service enumeration) — it is detectable and requires authorization.

**Q2: Why is OSINT important in penetration testing?**
A: OSINT reveals attack vectors that would otherwise be invisible — leaked credentials, exposed services, technology stacks, employee information. It provides the foundation for targeted social engineering, credential stuffing, and technical exploitation without ever touching the target's infrastructure.

**Q3: How would you detect reconnaissance activities against your organization?**
A: Monitor DNS query patterns for enumeration, detect port scanning via IDS/IPS, audit public information sources for data leakage, scan GitHub for credential exposure, analyze web logs for automated scraping patterns, and monitor Certificate Transparency logs for unauthorized certificate requests.

**Q4: What information would you prioritize gathering during passive reconnaissance?**
A: Technology stack (from job postings, certificates, headers), email patterns and valid addresses, DNS infrastructure, subdomain enumeration, leaked credentials, social media profiles of key personnel, and any publicly accessible development/test environments.

**Q5: How does metadata analysis help in reconnaissance?**
A: Document metadata reveals author names, software versions (for vulnerability research), internal naming conventions, GPS coordinates, network information (printer names, server names), and organizational details — all without directly contacting the target.

---

## Hands-on Labs

### Lab 1: OSINT Footprinting (Passive)

```
Target: Example Corp (use a deliberately vulnerable target or your own domain)

1. WHOIS Enumeration
   → Perform WHOIS lookup on primary domain
   → Document registrar, creation date, name servers
   → Identify privacy protection usage

2. DNS Enumeration
   → Enumerate A, AAAA, MX, NS, TXT, SOA records
   → Attempt zone transfer
   → Use Subfinder for subdomain enumeration
   → Cross-reference with Certificate Transparency logs

3. Search Engine Recon
   → Execute 10 Google dork queries
   → Document exposed files, login pages, sensitive directories
   → Use Wayback Machine for historical URLs

4. Social Media OSINT
   → Identify key personnel on LinkedIn
   → Find developer accounts on GitHub
   → Search for email patterns on Hunter.io

Tools: whois, dig, subfinder, crt.sh, Google, LinkedIn, Hunter.io
Duration: 3 hours
```

### Lab 2: Active Reconnaissance

```
Target: Local VM lab (Metasploitable, DVWA, or TryHackMe room)

1. Network Discovery
   → Discover hosts on target network using Nmap
   → Document all alive hosts

2. Port Scanning
   → Full TCP port scan (1-65535)
   → UDP scan (top 100 ports)
   → Document open ports and services

3. Service Enumeration
   → Enumerate SMB, SSH, HTTP, FTP services
   → Use Nmap NSE scripts for each service
   → Extract banner information

4. Web Application Recon
   → Directory enumeration with Gobuster
   → Technology fingerprinting with WhatWeb
   → Extract endpoints from JavaScript files

Tools: Nmap, Gobuster, WhatWeb, enum4linux, smbclient
Duration: 4 hours
```

---

## Summary Table

| Technique | Type | Detectable | Key Tools | Primary Output |
|-----------|------|-----------|-----------|----------------|
| WHOIS Lookup | Passive | No | whois, RDAP | Domain registration details |
| DNS Enumeration | Passive/Active | Low | dig, subfinder, amass | DNS records, subdomains |
| Google Dorking | Passive | No | Google, dork-db | Exposed files, login pages |
| Shodan/Censys | Passive | No | shodan, censys | Exposed services, devices |
| Social Media OSINT | Passive | No | LinkedIn, GitHub | Personnel, technology stack |
| Email Harvesting | Passive | No | theHarvester, hunter.io | Email addresses, patterns |
| Metadata Analysis | Passive | No | exifTool, FOCA | Authors, software, network info |
| Port Scanning | Active | Yes | Nmap, Masscan | Open ports, services |
| Web Enumeration | Active | Yes | Gobuster, ffuf | Directories, virtual hosts |
| Banner Grabbing | Active | Yes | Nmap, netcat | Software versions |
