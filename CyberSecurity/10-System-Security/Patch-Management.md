# Patch Management

## What is it?

Patch management is the systematic process of identifying, testing, deploying, and verifying software updates across an environment. It addresses known vulnerabilities in operating systems, applications, and firmware before attackers can exploit them.

## Why Learn It?

Unpatched software is one of the most common attack vectors. High-profile breaches like WannaCry and Equifax were caused by missing patches. A disciplined patch management program is critical for reducing exposure and maintaining compliance.

## You Will Learn

- Vulnerability identification and CVSS scoring
- Patch testing and staging procedures
- Automated deployment tools and strategies
- Rollback planning and failure handling
- Patch cadence and SLA definitions

## Prerequisites

- System Hardening

## Related Topics

- Vulnerability Management
- Compliance & Auditing

---

## Layer Position in Defense Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEFENSE-IN-DEPTH                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │  Physical      │    │  Perimeter     │    │  Network       │      │
│  │  Security      │    │  Security      │    │  Security      │      │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘       │
│          │                     │                     │                │
│          ▼                     ▼                     ▼                │
│  ┌───────────────┐    ┌─────────────────────────────────────┐       │
│  │  System        │    │      ▶▶▶  PATCH MANAGEMENT  ◀◀◀    │       │
│  │  Hardening     │    │  (Vulnerability → Test → Deploy)    │       │
│  └───────────────┘    └──────────────────┬──────────────────┘       │
│                                          │                          │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │            Asset Management (Know what to patch)          │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│          ▼                  ▼                  ▼                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │  Endpoint      │  │  Application   │  │  Vulnerability │          │
│  │  Security      │  │  Security      │  │  Scanning      │          │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Patch management bridges system hardening and vulnerability scanning — it **remediates** discovered weaknesses.

---

## 1. Vulnerability Lifecycle

### 1.1 Vulnerability Lifecycle Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   VULNERABILITY LIFECYCLE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DISCOVERY                                                   │
│     ├── Security researcher finds vulnerability                 │
│     ├── Vendor notified (responsible disclosure)                │
│     └── CVE assigned (Common Vulnerabilities and Exposures)     │
│                                                                  │
│  2. DISCLOSURE                                                  │
│     ├── Vendor develops patch                                   │
│     ├── CVE details published                                   │
│     ├── CVSS score assigned                                     │
│     └── Exploit code may appear (0-day → N-day)                │
│                                                                  │
│  3. EXPOSURE WINDOW                                             │
│     ├── Patch available but not deployed                        │
│     ├── Attackers develop/exploit                               │
│     └── RISK IS HIGHEST DURING THIS PHASE                       │
│                                                                  │
│  4. REMEDIATION                                                 │
│     ├── Organization tests patch                                │
│     ├── Deploys to production                                   │
│     └── Verifies patch effectiveness                            │
│                                                                  │
│  5. VERIFICATION                                                │
│     ├── Re-scan confirms vulnerability closed                   │
│     ├── Monitoring for bypass attempts                          │
│     └── Documentation updated                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Vulnerability Scoring (CVSS)

```
CVSS v3.1 SCORE RANGES:

  0.0  ────────── 3.9  ────────── 6.9  ────────── 8.9  ────────── 10.0
    │               │               │               │               │
    LOW             LOW          MEDIUM           HIGH          CRITICAL
    (Green)       (Yellow)      (Orange)         (Red)       (Dark Red)

CVSS VECTOR COMPONENTS:

  Attack Vector (AV):      Network | Adjacent | Local | Physical
  Attack Complexity (AC):  Low | High
  Privileges Required (PR): None | Low | High
  User Interaction (UI):   None | Required
  Scope (S):               Unchanged | Changed
  Confidentiality (C):     None | Low | High
  Integrity (I):           None | Low | High
  Availability (A):        None | Low | High

EXAMPLE:
  CVE-2024-3094 (XZ Utils backdoor):
  CVSS: 10.0 (Critical)
  AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
  → Remote, no auth, full compromise

  CVE-2021-44228 (Log4Shell):
  CVSS: 10.0 (Critical)
  AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
  → Remote code execution, no authentication
```

### 1.3 CVE Lifecycle

```
CVE ID Assignment → Details Published → CVSS Score → Patch Released
       │                  │                  │              │
       ▼                  ▼                  ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ MITRE assigns│  │ NVD publishes│  │ NVD assigns  │  │ Vendor issues│
│ CVE-YYYY-NNN │  │ description  │  │ base score   │  │ security     │
│              │  │ + references │  │ + vector     │  │ advisory     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │ ORGANIZATION PATCH    │
                                    │ MANAGEMENT PROCESS    │
                                    │ (This document)       │
                                    └──────────────────────┘
```

---

## 2. Patch Testing

### 2.1 Testing Workflow

```
┌──────────────┐
│ 1. Lab        │──→ Replicate production environment
│ Environment   │    Clone VMs or use containers
│ Setup         │    Include critical applications
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. Baseline   │──→ Document current state
│ Snapshot      │    Record system performance
│               │    Capture application behavior
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. Patch      │──→ Apply patch in lab
│ Application   │    Document any errors
│               │    Note installation time
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. Functional │──→ Test core application functions
│ Testing       │    Verify business processes
│               │    Check user workflows
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. Regression │──→ Run automated test suites
│ Testing       │    Verify no functionality lost
│               │    Check performance metrics
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 6. Security   │──→ Verify vulnerability is patched
│ Validation    │    Scan for new vulnerabilities
│               │    Confirm no regressions
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 7. Approval   │──→ Change Advisory Board (CAB)
│               │    Sign-off from app owners
│               │    Schedule deployment window
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 8. Pilot      │──→ Deploy to small group first
│ Deployment    │    Monitor for 24-48 hours
│               │    Collect user feedback
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 9. Full       │──→ Roll out to production
│ Deployment    │    Staged rollout
│               │    Monitor and validate
└──────────────┘
```

### 2.2 Testing Checklist

```
PRE-PATCH TESTING:
□ Verify patch applicability (correct OS/version)
□ Check patch prerequisites and dependencies
□ Backup critical data and system state
□ Create VM snapshot for rollback

FUNCTIONAL TESTING:
□ Core application functions work
□ Database connectivity maintained
□ Network services operational
□ Authentication/authorization working
□ Scheduled tasks running
□ Printers and peripherals functional

PERFORMANCE TESTING:
□ CPU usage within normal range
□ Memory usage acceptable
□ Disk I/O not degraded
□ Network throughput maintained
□ Application response times normal

SECURITY TESTING:
□ Vulnerability scan confirms patch applied
□ No new vulnerabilities introduced
□ Firewall rules still functional
□ SSL/TLS certificates valid
□ Audit logging operational

POST-PATCH TESTING:
□ User acceptance testing (UAT)
□ 48-hour monitoring period
□ No increased error rates
□ Application logs clean
```

### 2.3 Testing Environments

| Environment | Purpose | Configuration | Refresh Cycle |
|-------------|---------|---------------|---------------|
| Development | Developer testing | Latest code, relaxed security | Continuous |
| QA/Staging | Quality assurance | Mirror production | Weekly |
| Pre-Production | Final validation | Exact production copy | Before each release |
| Pilot Group | User acceptance | Subset of production users | Before full rollout |
| Production | Live environment | Full hardening + monitoring | Permanent |

---

## 3. Deployment Strategies

### 3.1 Deployment Models

```
┌──────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRATEGIES                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ STRATEGY 1: BIG BANG                                     │    │
│  │ Deploy to ALL systems simultaneously                    │    │
│  │ Pros: Fast coverage, consistent state                   │    │
│  │ Cons: High risk, no rollback option                     │    │
│  │ Use: Emergency critical patches (0-day)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ STRATEGY 2: PHASED/STAGED                               │    │
│  │ Deploy to groups sequentially                           │    │
│  │ Phase 1: IT/test → Phase 2: Pilot → Phase 3: Full      │    │
│  │ Pros: Controlled, rollback possible                     │    │
│  │ Cons: Slower full coverage                              │    │
│  │ Use: Standard scheduled patches                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ STRATEGY 3: RING-BASED                                  │    │
│  │ Deploy to rings of increasing criticality               │    │
│  │ Ring 0: Dev → Ring 1: Test → Ring 2: Prod-low-risk     │    │
│  │ → Ring 3: Prod-high-risk → Ring 4: Mission-critical    │    │
│  │ Pros: Gradual rollout, risk-based                      │    │
│  │ Cons: Complex management                                │    │
│  │ Use: Large enterprises                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ STRATEGY 4: AUTOMATIC                                   │    │
│  │ Deploy automatically without manual intervention        │    │
│  │ Pros: Fast coverage, no human error                     │    │
│  │ Cons: Risk of breaking changes                          │    │
│  │ Use: Low-risk patches, home users                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Patch Deployment Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Vendor       │     │  WSUS/SCCM   │     │  Endpoints    │
│  Patch Server │────→│  Server       │────→│              │
│  (Microsoft,  │     │              │     │  Workstation  │
│   Red Hat)    │     │  ┌────────┐ │     │  Server       │
└──────────────┘     │  │ Test   │ │     │  Laptop       │
                     │  │ Group  │ │     └──────────────┘
                     │  └────────┘ │           │
                     │       │     │           ▼
                     │       ▼     │     ┌──────────────┐
                     │  ┌────────┐ │     │  Verify &     │
                     │  │Pilot   │ │     │  Report       │
                     │  │Group   │ │     │  Status       │
                     │  └────────┘ │     └──────────────┘
                     │       │     │
                     │       ▼     │
                     │  ┌────────┐ │
                     │  │ Full   │ │
                     │  │Deploy  │ │
                     │  └────────┘ │
                     └──────────────┘
```

### 3.3 Windows Update Deployment (WSUS/SCCM)

```powershell
# WSUS Configuration via Group Policy
# Computer Config → Admin Templates → Windows Components → Windows Update

# Configure WSUS server
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" `
  -Name "WUServer" -Value "http://wsus-server:8530"
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" `
  -Name "WUStatusServer" -Value "http://wsus-server:8530"

# Configure auto-install schedule
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" `
  -Name "AUOptions" -Value 4  # Auto download and schedule install
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" `
  -Name "ScheduledInstallDay" -Value 0  # Every day
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" `
  -Name "ScheduledInstallTime" -Value 3  # 3:00 AM

# Force update check
wuauclt /detectnow /resetauthorization
```

### 3.4 Linux Patch Deployment (Ansible)

```yaml
# patch-deployment.yml
---
- hosts: all
  become: yes
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

    - name: Apply all pending updates (Debian/Ubuntu)
      apt:
        upgrade: dist
      register: update_result

    - name: Check if reboot required
      stat:
        path: /var/run/reboot-required
      register: reboot_required

    - name: Deploy security patches only (RHEL/CentOS)
      yum:
        name: "*"
        security: yes
        state: latest
      when: ansible_os_family == "RedHat"

    - name: Notify if updates applied
      debug:
        msg: "Updates applied. Reboot required: {{ reboot_required.stat.exists }}"
```

---

## 4. Emergency Patching

### 4.1 Emergency Patch Criteria

```
EMERGENCY PATCH TRIGGERS:

┌──────────────────────────────────────────────────────────────┐
│ CRITICAL (Patch within 24-48 hours)                          │
│ ├── Active exploitation in the wild                          │
│ ├── CVSS score ≥ 9.0                                        │
│ ├── Remote code execution without authentication             │
│ ├── Affects internet-facing systems                          │
│ └── No workarounds available                                 │
├──────────────────────────────────────────────────────────────┤
│ HIGH (Patch within 7 days)                                   │
│ ├── Public exploit available                                 │
│ ├── CVSS score 7.0-8.9                                      │
│ ├── Requires authentication but high impact                  │
│ └── Affects critical business systems                        │
├──────────────────────────────────────────────────────────────┤
│ MEDIUM (Patch within 30 days)                                │
│ ├── No known exploits                                        │
│ ├── CVSS score 4.0-6.9                                      │
│ └── Limited attack surface                                   │
├──────────────────────────────────────────────────────────────┤
│ LOW (Next regular cycle)                                     │
│ ├── CVSS score < 4.0                                        │
│ ├── Requires local access                                    │
│ └── Minimal business impact                                  │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Emergency Patch Workflow

```
┌──────────────┐
│ THREAT        │──→ Active exploitation detected
│ INTELLIGENCE  │    or critical CVE published
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ ASSESS        │──→ Which systems are affected?
│ IMPACT        │    What is the exposure?
│               │    Are there workarounds?
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ APPLY         │──→ Deploy patch (or workaround)
│ WORKAROUND    │    Enable compensating controls
│ OR PATCH      │    Block at firewall/WAF
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ VERIFY        │──→ Confirm patch applied
│ DEPLOYMENT    │    Scan for vulnerability
│               │    Monitor for exploitation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ DOCUMENT      │──→ Update asset inventory
│ & LEARN       │    Root cause analysis
│               │    Update emergency procedures
└──────────────┘
```

### 4.3 Emergency Patch Script

```bash
#!/bin/bash
# emergency-patch.sh - Quick deployment for critical patches

CVE_ID="$1"
PATCH_URL="$2"

echo "[!] EMERGENCY PATCH DEPLOYMENT"
echo "CVE: $CVE_ID"
echo "Time: $(date)"

# 1. Log the action
echo "$(date) - Emergency patch initiated for $CVE_ID" >> /var/log/emergency-patches.log

# 2. Create backup
echo "[*] Creating pre-patch snapshot..."
tar czf /backup/pre-patch-$(date +%Y%m%d).tar.gz /etc/ 2>/dev/null

# 3. Download and apply patch
echo "[*] Downloading patch..."
wget -q "$PATCH_URL" -O /tmp/emergency-patch.deb
dpkg -i /tmp/emergency-patch.deb

# 4. Verify
echo "[*] Verifying patch..."
if dpkg -l | grep -q "patched-package"; then
    echo "[+] Patch applied successfully"
    echo "$(date) - Patch $CVE_ID applied successfully" >> /var/log/emergency-patches.log
else
    echo "[-] Patch verification failed"
    echo "$(date) - Patch $CVE_ID FAILED" >> /var/log/emergency-patches.log
fi

# 5. Check if reboot required
if [ -f /var/run/reboot-required ]; then
    echo "[!] REBOOT REQUIRED - schedule immediately"
fi
```

---

## 5. Vulnerability Scanning

### 5.1 Vulnerability Scanning Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  VULNERABILITY SCANNING ARCHITECTURE              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────┐      │
│  │ Scan Engine   │────→│         Target Assets             │      │
│  │ (Nessus,      │     │  ┌──────┐ ┌──────┐ ┌──────┐    │      │
│  │  OpenVAS,     │     │  │Server│ │Server│ │Desktop│   │      │
│  │  Qualys)      │     │  │  01  │ │  02  │ │  01  │   │      │
│  └──────┬───────┘     │  └──────┘ └──────┘ └──────┘    │      │
│         │             └──────────────────────────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │ Results       │────→│  Reporting    │                          │
│  │ Database      │     │  Dashboard    │                          │
│  │               │     │  (Grafana,    │                          │
│  │ - CVE data    │     │   ELK)       │                          │
│  │ - CVSS scores │     └──────────────┘                          │
│  │ - Remediation │                                               │
│  └──────┬───────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Integration   │                                                │
│  │ ├── Patch     │──→ WSUS/Ansible auto-deploy                   │
│  │ │   Management│                                               │
│  │ ├── Ticketing │──→ Jira/ServiceNow ticket creation            │
│  │ │   System    │                                               │
│  │ └── SIEM      │──→ Wazuh/Splunk correlation                  │
│  └──────────────┘                                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 OpenVAS Scanner Setup and Usage

```bash
# Install OpenVAS
sudo apt install gvm
sudo gvm-setup

# Update feeds
sudo gvm-feed-update

# Start services
sudo gvm-check-setup

# Access web interface
# https://127.0.0.1:9392

# CLI scanning
gvm-cli --gmp-username admin --gmp-password admin \
  socket --socketpath /run/gvmd/gvmd.sock \
  "<get_tasks/>"

# Create and run scan
gvm-cli --gmp-username admin --gmp-password admin \
  socket --socketpath /run/gvmd/gvmd.sock \
  "<create_target><name>Web Servers</name><hosts>10.0.1.0/24</hosts></create_target>"

# Export results
gvm-cli --gmp-username admin --gmp-password admin \
  socket --socketpath /run/gvmd/gvmd.sock \
  "<get_reports format_id='a994b278-1f72-4deb-b585-65a416847047'/>"
```

### 5.3 Nessus Scanning (CLI)

```bash
# Nessus CLI scan
nessuscli db sync
nessuscli scan new \
  --name "Quarterly Scan" \
  --targets "10.0.1.0/24" \
  --template "Basic Network Scan"

# Import results
nessuscli import results.nessus

# Export to CSV
nessuscli export results.nessus --format csv --output results.csv
```

### 5.4 Scanning Schedule and Coverage

| Scan Type | Frequency | Scope | Purpose |
|-----------|-----------|-------|---------|
| Authenticated Full | Monthly | All assets | Complete vulnerability assessment |
| Unauthenticated | Weekly | External-facing | Attacker perspective scan |
| Web Application | Weekly | Web servers | OWASP Top 10, misconfigurations |
| Configuration Audit | Monthly | All systems | CIS/STIG compliance |
| Patch Verification | Post-deployment | Patched systems | Confirm remediation |
| Emergency/Ad-hoc | As needed | Affected systems | Critical CVE response |

---

## 6. Asset Management

### 6.1 Asset Inventory Framework

```
┌──────────────────────────────────────────────────────────────────┐
│                    ASSET MANAGEMENT FRAMEWORK                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  DISCOVERY                                                │    │
│  │  ├── Network scanning (Nmap, SNMP)                      │    │
│  │  ├── Agent-based inventory (OSSEC, Wazuh)               │    │
│  │  ├── Cloud API (AWS Config, Azure Resource Graph)       │    │
│  │  └── Manual registration (CMDB)                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  CLASSIFICATION                                           │    │
│  │  ├── Hardware type (server, workstation, network device) │    │
│  │  ├── Operating system and version                        │    │
│  │  ├── Installed software                                  │    │
│  │  ├── Business criticality (Critical, High, Medium, Low) │    │
│  │  ├── Data classification (Public, Internal, Confidential)│    │
│  │  └── Owner and responsible team                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  LIFECYCLE MANAGEMENT                                     │    │
│  │  ├── Procurement → Deployment → Operation → Retirement  │    │
│  │  ├── Patch compliance tracking                           │    │
│  │  ├── End-of-life (EOL) / End-of-support (EOS) tracking │    │
│  │  └── License management                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  REPORTING                                                │    │
│  │  ├── Real-time asset dashboard                           │    │
│  │  ├── Compliance status reports                           │    │
│  │  ├── Unpatched system reports                            │    │
│  │  └── Shadow IT detection                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Asset Discovery with Nmap

```bash
# Network discovery
nmap -sn 10.0.1.0/24 -oG - | awk '/Up$/{print $2}' > live-hosts.txt

# Service version detection
nmap -sV -O 10.0.1.0/24 -oA service-scan

# Find unpatched systems (example: checking for vulnerable SSH version)
nmap -p 22 --script ssh2-enum-algos 10.0.1.0/24

# Find systems with specific vulnerable service
nmap -p 445 --script smb-vuln-ms17-010 10.0.1.0/24

# Detect OS for inventory
nmap -O --osscan-guess 10.0.1.0/24
```

### 6.3 Asset Database Schema

```sql
-- Asset management database schema
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    ip_address INET,
    mac_address MACADDR,
    asset_type VARCHAR(50),  -- server, workstation, network_device
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    owner VARCHAR(100),
    department VARCHAR(100),
    criticality VARCHAR(20),  -- critical, high, medium, low
    data_classification VARCHAR(20),  -- public, internal, confidential
    location VARCHAR(255),
    purchase_date DATE,
    warranty_end DATE,
    eos_date DATE,  -- end of support
    last_scan TIMESTAMP,
    patch_compliance DECIMAL(5,2),
    status VARCHAR(20)  -- active, retired, maintenance
);

CREATE TABLE software_inventory (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id),
    software_name VARCHAR(255),
    version VARCHAR(50),
    vendor VARCHAR(100),
    install_date DATE,
    license_type VARCHAR(50)
);

CREATE TABLE patch_status (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id),
    cve_id VARCHAR(20),
    patch_available BOOLEAN,
    patch_applied BOOLEAN,
    patch_date TIMESTAMP,
    risk_level VARCHAR(20)
);
```

---

## 7. Security Perspective

### 7.1 Attack Techniques Exploiting Unpatched Systems

```
┌──────────────────────────────────────────────────────────────────┐
│            UNPATCHED SYSTEM ATTACK VECTORS                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CVE-Based Exploitation                                         │
│  ├── EternalBlue (MS17-010) → WannaCry ransomware              │
│  ├── Log4Shell (CVE-2021-44228) → Remote code execution        │
│  ├── ProxyLogon (CVE-2021-26855) → Exchange server compromise   │
│  ├── DirtyPipe (CVE-2022-0847) → Linux privilege escalation    │
│  └── PrintNightmare (CVE-2021-34527) → Domain controller       │
│                                                                  │
│  Misconfiguration Exploitation                                  │
│  ├── Default credentials on admin panels                        │
│  ├── Open management interfaces                                 │
│  ├── Unnecessary services exposed                               │
│  └── Weak SSL/TLS configurations                               │
│                                                                  │
│  Supply Chain Attacks                                           │
│  ├── Compromised third-party libraries (SolarWinds)             │
│  ├── Trojanized software updates                                │
│  └── Backdoored open-source packages (XZ Utils)                │
│                                                                  │
│  Persistence via Patch Gaps                                    │
│  ├── Old vulnerabilities re-exploited after patch regression    │
│  ├── End-of-life systems without security updates              │
│  └── Firmware vulnerabilities in network devices                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Real-World Breach Case Studies

| Incident | Year | Root Cause | Impact | Lesson |
|----------|------|------------|--------|--------|
| WannaCry | 2017 | Missing MS17-010 | $4B+ damages, 200K+ systems | Patch critical SMB vuln |
| Equifax | 2017 | Missing Apache Struts patch | 147M records exposed | Web app patch mgmt |
| NotPetya | 2017 | Missing MS17-010 | $10B+ damages globally | Patch across all orgs |
| SolarWinds | 2020 | Supply chain compromise | US govt agencies breached | Verify update integrity |
| Log4Shell | 2021 | Missing Log4j patch | Millions of Java apps | Library patch management |
| MOVEit | 2023 | Zero-day in file transfer | 2,500+ organizations | Web app security |

---

## 8. Practical Examples

### 8.1 Complete Patch Management Policy

```yaml
# patch-management-policy.yaml

policy:
  name: "Enterprise Patch Management Policy"
  version: "2.1"
  effective_date: "2024-01-01"
  
  scope: "All IT assets including servers, workstations, network devices, and cloud instances"
  
  roles:
    patch_manager:
      responsibilities:
        - Maintain asset inventory
        - Track vendor security advisories
        - Coordinate testing and deployment
        - Generate compliance reports
    
    system_administrators:
      responsibilities:
        - Apply patches to assigned systems
        - Report deployment issues
        - Validate patch installation
    
    change_advisory_board:
      responsibilities:
        - Approve emergency changes
        - Review patch compliance metrics
        - Approve exceptions
  
  severity_levels:
    critical:
      cvss: ">= 9.0"
      deployment_timeline: "24-48 hours"
      approval: "CISO or delegate"
      testing: "Abbreviated (core functions only)"
    
    high:
      cvss: "7.0-8.9"
      deployment_timeline: "7 days"
      approval: "Change manager"
      testing: "Standard test suite"
    
    medium:
      cvss: "4.0-6.9"
      deployment_timeline: "30 days"
      approval: "System owner"
      testing: "Full regression"
    
    low:
      cvss: "< 4.0"
      deployment_timeline: "90 days (next cycle)"
      approval: "System owner"
      testing: "Standard"
  
  exceptions:
    process:
      - Document business justification
      - Apply compensating controls
      - Set expiration date (max 90 days)
      - Review monthly
      - CISO approval required
    
    compensating_controls:
      - Network segmentation
      - Enhanced monitoring (Wazuh rules)
      - Application whitelisting
      - Reduced access privileges
  
  compliance:
    scan_frequency: "Weekly"
    reporting: "Monthly to CISO"
    audit: "Quarterly internal, annual external"
```

### 8.2 Ansible Patch Management Playbook

```yaml
# patch-all.yml
---
- hosts: all
  become: yes
  vars:
    patch_type: "security"  # all, security, critical
    reboot_allowed: true
    reboot_timeout: 600
  
  pre_tasks:
    - name: Gather facts
      setup:
    
    - name: Pre-patch snapshot
      command: >
        virsh snapshot-create-as {{ ansible_hostname }}
        pre-patch-{{ ansible_date_time.date }}
      delegate_to: localhost
      ignore_errors: yes
      when: reboot_allowed

  tasks:
    # Debian/Ubuntu
    - name: Update apt cache (Debian)
      apt:
        update_cache: yes
      when: ansible_os_family == "Debian"
    
    - name: Apply security patches (Debian)
      apt:
        upgrade: dist
        security: yes
      when: ansible_os_family == "Debian"
      register: debian_patches
    
    # RHEL/CentOS
    - name: Apply security patches (RHEL)
      yum:
        name: "*"
        security: yes
        state: latest
      when: ansible_os_family == "RedHat"
      register: rhel_patches
    
    # Windows
    - name: Install Windows updates
      win_updates:
        category_ids:
          - SecurityUpdates
          - CriticalUpdates
      register: windows_patches
      when: ansible_os_family == "Windows"
    
    - name: Check reboot required
      stat:
        path: /var/run/reboot-required
      register: reboot_required
      when: ansible_os_family == "Debian"
    
    - name: Reboot if required
      reboot:
        reboot_timeout: "{{ reboot_timeout }}"
      when:
        - reboot_allowed
        - reboot_required.stat.exists | default(false)
    
    - name: Post-patch verification
      command: /usr/bin/uptime
      register: uptime_result
    
    - name: Report patch status
      debug:
        msg: |
          Host: {{ ansible_hostname }}
          OS: {{ ansible_distribution }}
          Patches applied: {{ debian_patches | default(rhel_patches) | default(windows_patches) | default('N/A') }}
          Uptime: {{ uptime_result.stdout }}
```

### 8.3 Vulnerability Scan and Remediation Pipeline

```bash
#!/bin/bash
# vuln-scan-remediate.sh - Automated scan and patch pipeline

echo "[*] Starting vulnerability scan..."

# 1. Run OpenVAS scan
gvm-cli --gmp-username admin --gmp-password admin \
  socket --socketpath /run/gvmd/gvmd.sock \
  "<start_task task_id='SCAN_TASK_ID'/>"

echo "[*] Waiting for scan to complete..."
# Wait for scan completion (poll status)
while true; do
    STATUS=$(gvm-cli --gmp-username admin --gmp-password admin \
      socket --socketpath /run/gvmd/gvmd.sock \
      "<get_tasks task_id='SCAN_TASK_ID'/>" | grep -o 'status>[^<]*' | cut -d'>' -f2)
    if [ "$STATUS" = "Done" ]; then break; fi
    sleep 30
done

# 2. Export results
gvm-cli --gmp-username admin --gmp-password admin \
  socket --socketpath /run/gvmd/gvmd.sock \
  "<get_reports format_id='csv'/>" > /tmp/scan-results.csv

# 3. Parse critical/high vulnerabilities
CRITICAL=$(grep -c "Critical" /tmp/scan-results.csv)
HIGH=$(grep -c "High" /tmp/scan-results.csv)

echo "[*] Found: $CRITICAL critical, $HIGH high vulnerabilities"

# 4. Auto-remediate if possible
if [ $CRITICAL -gt 0 ] || [ $HIGH -gt 0 ]; then
    echo "[*] Deploying patches..."
    ansible-playbook patch-all.yml --extra-vars "patch_type=critical"
fi

# 5. Re-scan to verify
echo "[*] Re-scanning to verify remediation..."
# Run scan again
```

---

## 9. Interview Questions

### Basic

1. **What is patch management and why is it critical?**
   - Systematic process to update software; prevents exploitation of known vulnerabilities

2. **What is the difference between a patch, a hotfix, and a service pack?**
   - Patch: specific fix; Hotfix: emergency fix; Service pack: bundle of patches

3. **What is CVSS and how is it used?**
   - Common Vulnerability Scoring System; rates severity 0-10; guides patch prioritization

4. **Name three patch deployment strategies.**
   - Big bang, phased/staged, ring-based

5. **What is the exposure window in vulnerability lifecycle?**
   - Time between patch availability and deployment; highest risk period

### Intermediate

6. **How do you prioritize patches across a large environment?**
   - CVSS score, asset criticality, exposure (internet-facing), exploit availability, business impact

7. **Explain the difference between authenticated and unauthenticated scanning.**
   - Authenticated: scans with credentials, finds local vulns; Unauthenticated: attacker perspective, limited visibility

8. **How do you handle patches that break applications?**
   - Rollback to snapshot, apply workaround, escalate to vendor, document exception

9. **What is a CVE and how does it relate to patch management?**
   - Common Vulnerabilities and Exposures; unique ID for each vulnerability; drives patch prioritization

10. **How do you measure patch management compliance?**
    - % systems patched within SLA, mean time to patch, vulnerability recurrence rate

### Advanced

11. **Design a patch management process for a hospital with 99.99% uptime requirements.**
    - Ring-based deployment, extended testing, maintenance windows, rollback plans, compensating controls for unpatchable medical devices

12. **How do you handle patching for legacy systems that vendor no longer supports?**
    - Network isolation, virtual patching (IPS rules), application whitelisting, enhanced monitoring, planned migration

13. **Explain the concept of "virtual patching" and when to use it.**
    - IPS/WAF rules that block exploit patterns; use when vendor patch unavailable or system cannot be rebooted

14. **How does cloud computing change patch management?**
    - Immutable infrastructure (replace vs patch), auto-scaling, managed services (AWS Patch Manager), but shared responsibility model

15. **How do you handle firmware patching for network devices?**
    - Vendor advisories, scheduled maintenance windows, staged deployment, backup configs, verify integrity after update

---

## 10. Hands-on Labs

### Lab 1: OpenVAS Vulnerability Scan

```bash
# Install and start OpenVAS
sudo apt install gvm
sudo gvm-setup
sudo gvm-start

# Create target
# Web UI: https://127.0.0.1:9392
# Navigate to Scans → Targets → New Target
# Add your network range

# Create scan task
# Navigate to Scans → Tasks → New Task
# Select target and scan config

# Run scan and export results
# Download CSV report for analysis
```

### Lab 2: WSUS Patch Deployment (Windows Lab)

```powershell
# Install WSUS role
Install-WindowsFeature -Name UpdateServices -IncludeAllSubFeature

# Configure WSUS
wsusutil.exe configure --sqlinstance localhost --contentdir D:\WSUS

# Configure Group Policy for WSUS
# Create GPO linked to OU
# Set: Computer Config → Admin Templates → Windows Update
#   Specify intranet update service: http://wsus-server:8530

# Approve and deploy patches
# WSUS Console → Updates → All Updates → Right-click → Approve
```

### Lab 3: Ansible Automated Patching

```bash
# Setup Ansible
pip install ansible

# Create inventory
echo "linux-servers ansible_host=10.0.1.10" > inventory.ini

# Dry run first
ansible-playbook -i inventory.ini patch-all.yml --check

# Apply patches
ansible-playbook -i inventory.ini patch-all.yml

# Verify patch status
ansible all -i inventory.ini -m shell -a "apt list --upgradable 2>/dev/null || yum check-update"
```

### Lab 4: CVE Analysis Practice

```bash
# Research a CVE
# Visit: https://nvd.nist.gov/vuln/detail/CVE-2021-44228

# Analyze:
# 1. CVSS score and vector
# 2. Affected software versions
# 3. Available patches/workarounds
# 4. Exploit availability
# 5. Recommended remediation timeline

# Create remediation plan for your environment
# Document in your vulnerability management system
```

---

## 11. Summary Table

| Topic | Key Concept | Primary Tools | Risk If Ignored |
|-------|------------|---------------|-----------------|
| Vulnerability Lifecycle | Track CVE from discovery to remediation | NVD, MITRE CVE | Unknown exposure |
| CVSS Scoring | Prioritize based on severity | NVD, Nessus | Misallocated resources |
| Patch Testing | Validate before production | Lab environments, snapshots | Broken production systems |
| Deployment Strategies | Controlled rollout | WSUS, SCCM, Ansible | Service disruptions |
| Emergency Patching | Rapid response to critical vulns | Scripts, CAB process | Active exploitation |
| Vulnerability Scanning | Discover unpatched systems | OpenVAS, Nessus, Qualys | Blind spots |
| Asset Management | Know what to patch | CMDB, Nmap, agents | Shadow IT, missed systems |
| Compliance Reporting | Track patch SLAs | Dashboards, reports | Regulatory penalties |

---

## Resources

**Books:**
- *The Practice of Network Security Monitoring* - Richard Bejtlich
- *Patch Management: A Survival Guide* - SANS
- *Vulnerability Management* - McGraw-Hill

**Documentation:**
- NVD (National Vulnerability Database): https://nvd.nist.gov/
- MITRE CVE: https://cve.mitre.org/
- OpenVAS Documentation: https://docs.greenbone.net/
- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks

**Tools:**
- OpenVAS (open-source vulnerability scanner)
- Nessus (commercial scanner)
- Qualys (cloud-based scanning)
- WSUS/SCCM (Windows patching)
- Ansible (Linux/cloud patching)
- Wazuh (compliance monitoring)

**Labs:**
- VulnHub vulnerable VMs
- HackTheBox machines
- TryHackMe Vulnerability Management path
- NIST CVE exercise sets
