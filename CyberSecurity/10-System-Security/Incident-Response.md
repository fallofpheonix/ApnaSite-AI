# Incident Response

## What is it?

Incident response is the structured approach to handling security breaches and cyberattacks. It follows a defined lifecycle — preparation, detection, containment, eradication, recovery, and post-incident review — to minimize damage, reduce recovery time, and preserve evidence.

## Why Learn It?

No system is impervious to compromise. The difference between a minor disruption and a catastrophic breach often comes down to how quickly and effectively an organization responds. IR ensures readiness, reduces panic, and provides a repeatable process for handling threats.

## You Will Learn

- The NIST/ISA incident response lifecycle
- Incident classification and severity escalation
- Containment strategies (short-term and long-term)
- Eradication and recovery procedures
- Post-incident forensics and lessons learned

## Prerequisites

- Security Monitoring

## Related Topics

- Digital Forensics
- Penetration Testing

---

## Layer Position in Defense Architecture

```
+---------------------------------------------------------------------+
|                        DEFENSE-IN-DEPTH                            |
+---------------------------------------------------------------------+
|                                                                     |
|  +---------------+    +---------------+    +---------------+        |
|  |  Physical      |    |  Perimeter     |    |  Network       |       |
|  |  Security      |    |  Security      |    |  Security      |       |
|  +-------+-------+    +-------+-------+    +-------+-------+        |
|          |                     |                     |                |
|          v                     v                     v                |
|  +-------------------------------------------------------------+    |
|  |  +---------------+  +---------------+  +---------------+   |    |
|  |  |  System        |  |  Security     |  |  Endpoint      |   |    |
|  |  |  Hardening     |  |  Monitoring   |  |  Security      |   |    |
|  |  +---------------+  +-------+-------+  +---------------+   |    |
|  |                          |                                   |    |
|  |                          v                                   |    |
|  |               +---------------------------------------------------+
|  |               |  >>>>  INCIDENT RESPONSE  <<<<                    |
|  |               |  (Prepare -> Detect -> Contain -> Eradicate ->   |
|  |               |   Recover -> Lessons Learned)                    |
|  |               +---------------------------------------------------+
|  |                                                                 |
|  +-------------------------------------------------------------+   |
|                                                                     |
+---------------------------------------------------------------------+
```

Incident response sits at the **operational core** — it is invoked when all other defensive layers are breached, coordinating the response to minimize damage.

---

## 1. NIST Incident Response Lifecycle

### 1.1 The Six Phases

```
+------------------------------------------------------------------+
|              NIST SP 800-61 INCIDENT RESPONSE LIFECYCLE           |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+                                            |
|  | 1. PREPARATION   |                                            |
|  |                  |---> Policies, plans, procedures            |
|  |                  |     IR team, tools, training               |
|  |                  |     Communication plans                    |
|  +--------+---------+                                            |
|           |                                                      |
|           v                                                      |
|  +------------------+                                            |
|  | 2. DETECTION &   |                                            |
|  |    ANALYSIS      |---> Monitor alerts, investigate            |
|  |                  |     Determine scope and impact             |
|  |                  |     Classify incident severity             |
|  +--------+---------+                                            |
|           |                                                      |
|           v                                                      |
|  +------------------+                                            |
|  | 3. CONTAINMENT   |                                            |
|  |                  |---> Short-term: Stop the bleeding          |
|  |                  |     Long-term: Isolate systems             |
|  |                  |     Evidence preservation                  |
|  +--------+---------+                                            |
|           |                                                      |
|           v                                                      |
|  +------------------+                                            |
|  | 4. ERADICATION   |                                            |
|  |                  |---> Remove threat actor                    |
|  |                  |     Remove malware/backdoors               |
|  |                  |     Patch vulnerabilities                  |
|  +--------+---------+                                            |
|           |                                                      |
|           v                                                      |
|  +------------------+                                            |
|  | 5. RECOVERY      |                                            |
|  |                  |---> Restore systems                        |
|  |                  |     Verify integrity                      |
|  |                  |     Monitor for re-infection               |
|  +--------+---------+                                            |
|           |                                                      |
|           v                                                      |
|  +------------------+                                            |
|  | 6. LESSONS       |                                            |
|  |    LEARNED       |---> Post-incident review                   |
|  |                  |     Update procedures                     |
|  |                  |     Improve defenses                      |
|  +------------------+                                            |
|                                                                  |
+------------------------------------------------------------------+
```

### 1.2 Phase 1: Preparation

```
PREPARATION CHECKLIST:

+----------------------------------------------------------+
| ORGANIZATIONAL READINESS                                  |
+----------------------------------------------------------+
| [ ] IR Policy approved by management                     |
| [ ] IR Plan documented and accessible                    |
| [ ] IR Team roles defined and assigned                   |
| [ ] Communication plan (internal + external)             |
| [ ] Legal counsel contact established                    |
| [ ] Cyber insurance policy in place                      |
| [ ] Law enforcement contacts documented                  |
| [ ] Vendor contacts for critical systems                 |
+----------------------------------------------------------+

+----------------------------------------------------------+
| TECHNICAL READINESS                                      |
+----------------------------------------------------------+
| [ ] SIEM deployed and tuned                              |
| [ ] EDR deployed on all endpoints                        |
| [ ] Forensic toolkit prepared (Kali, SIFT)               |
| [ ] Isolated network segment ready                       |
| [ ] Backup and recovery tested                           |
| [ ] Incident tracking system (ticketing)                 |
| [ ] Secure communication channel (Signal, encrypted)     |
| [ ] Chain of custody procedures documented               |
+----------------------------------------------------------+

+----------------------------------------------------------+
| TRAINING & EXERCISES                                     |
+----------------------------------------------------------+
| [ ] IR team trained on procedures                        |
| [ ] Tabletop exercises conducted quarterly               |
| [ ] Full simulation exercises annually                   |
| [ ] Role-specific training (forensics, comms)            |
| [ ] New member onboarding process                        |
+----------------------------------------------------------+
```

### 1.3 Incident Classification Matrix

```
+------------------------------------------------------------------+
|               INCIDENT CLASSIFICATION MATRIX                      |
+------------------------------------------------------------------+
|                                                                  |
|  SEVERITY LEVELS                                                |
|  +----------------------------------------------------------+  |
|  | P1 - CRITICAL                                             |  |
|  | - Active data breach with sensitive data exposure         |  |
|  | - Ransomware spreading across network                     |  |
|  | - Domain controller compromise                            |  |
|  | - Business-critical system down                           |  |
|  | Response: Immediate, all hands, exec notification        |  |
|  +----------------------------------------------------------+  |
|  | P2 - HIGH                                                 |  |
|  | - Confirmed intrusion, limited scope                      |  |
|  | - Malware infection on multiple systems                   |  |
|  | - Unauthorized access to sensitive systems                |  |
|  | Response: Within 1 hour, IR team activation              |  |
|  +----------------------------------------------------------+  |
|  | P3 - MEDIUM                                               |  |
|  | - Single system compromise                                |  |
|  | - Phishing with credential harvest                        |  |
|  | - Policy violation with security impact                   |  |
|  | Response: Within 4 hours, analyst investigation          |  |
|  +----------------------------------------------------------+  |
|  | P4 - LOW                                                  |  |
|  | - Suspicious activity, unconfirmed                        |  |
|  | - Failed attack attempts                                  |  |
|  | - Minor policy violations                                 |  |
|  | Response: Next business day, standard workflow            |  |
|  +----------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 2. Containment Strategies

### 2.1 Containment Decision Tree

```
INCIDENT DETECTED
        |
        v
+------------------+
| Assess Scope     |---> How many systems affected?
|                  |     Is it spreading?
+--------+---------+     Is data being exfiltrated?
         |
    +---------+---------+
    |                   |
  Limited            Widespread
    |                   |
    v                   v
+-----------+    +-----------+
| Isolate   |    | Segment   |
| single    |    | network   |
| system    |    | segment   |
+-----+-----+    +-----+-----+
      |                |
      v                v
+-----------+    +-----------+
| Preserve  |    | Preserve  |
| evidence  |    | evidence  |
| (memory,  |    | (network  |
|  disk)    |    |  capture) |
+-----+-----+    +-----+-----+
      |                |
      +-------+--------+
              |
              v
+------------------+
| Notify stakeholders
| based on severity|
+------------------+
```

### 2.2 Short-Term Containment

```
SHORT-TERM CONTAINMENT ACTIONS:

NETWORK LEVEL:
+----------------------------------------------------------+
| - Block malicious IPs at firewall                        |
| - Shut down affected network segments                    |
| - Enable emergency ACLs                                  |
| - Disable VPN access for compromised accounts            |
| - Sinkhole malicious DNS domains                         |
+----------------------------------------------------------+

ENDPOINT LEVEL:
+----------------------------------------------------------+
| - Disconnect system from network (keep powered on)       |
| - Kill malicious processes                               |
| - Disable compromised user accounts                      |
| - Isolate in quarantine VLAN                             |
| - Enable enhanced logging (Sysmon, auditd)               |
+----------------------------------------------------------+

ACCOUNT LEVEL:
+----------------------------------------------------------+
| - Force password reset for compromised accounts          |
| - Disable suspicious accounts                            |
| - Revoke active sessions/tokens                          |
| - Enable MFA for all privileged accounts                 |
| - Review and remove unauthorized API keys                |
+----------------------------------------------------------+
```

### 2.3 Long-Term Containment

```
LONG-TERM CONTAINMENT STRATEGIES:

1. NETWORK SEGMENTATION
   - Create isolated VLANs for affected systems
   - Implement micro-segmentation
   - Deploy network access control (NAC)

2. SYSTEM HARDENING
   - Apply emergency patches
   - Harden configurations
   - Remove unnecessary services
   - Enable additional monitoring

3. ENHANCED MONITORING
   - Deploy additional EDR agents
   - Increase log collection scope
   - Create custom detection rules
   - Enable packet capture

4. ACCESS CONTROLS
   - Implement just-in-time (JIT) access
   - Deploy privileged access management (PAM)
   - Review and tighten firewall rules
   - Implement application whitelisting
```

### 2.4 Containment Playbook Example

```yaml
# Containment Playbook - Ransomware Outbreak
---
name: Ransomware Containment
severity: P1
trigger: Ransomware detection alert OR encryption activity detected

steps:
  - name: Immediate Network Isolation
    action: |
      # Disconnect affected VLAN from core switch
      # Preserve system state (DO NOT POWER OFF)
      # Enable packet capture on segment boundary
    responsible: Network Team
    time_limit: 15 minutes

  - name: Identify Patient Zero
    action: |
      # Check EDR for initial infection point
      # Review firewall logs for C2 communication
      # Identify initial infection vector
    responsible: SOC Analyst
    time_limit: 30 minutes

  - name: Block IOCs Across Environment
    action: |
      # Block malicious IPs/domains at firewall
      # Deploy detection rules to SIEM
      # Update EDR with IOCs
      # Block hash values for known malware
    responsible: Security Engineer
    time_limit: 1 hour

  - name: Credential Reset
    action: |
      # Reset all Domain Admin passwords
      # Reset service account passwords
      # Revoke Kerberos tickets (klist purge)
      # Enable MFA for all accounts
    responsible: AD Team
    time_limit: 2 hours

  - name: Evidence Preservation
    action: |
      # Memory dump of affected systems
      # Full disk forensic image
      # Network traffic capture
      # Log preservation (SIEM export)
    responsible: Forensics Team
    time_limit: 4 hours
```

---

## 3. Eradication

### 3.1 Eradication Process

```
+------------------------------------------------------------------+
|                    ERADICATION PROCESS                             |
+------------------------------------------------------------------+
|                                                                  |
|  1. THREAT IDENTIFICATION                                       |
|     +--------------------------------------------------------+  |
|     | - Identify all malware variants                        |  |
|     | - Map persistence mechanisms                            |  |
|     | - Document all compromised accounts                    |  |
|     | - Identify exploitation vectors                        |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  2. MALWARE REMOVAL                                              |
|     +--------------------------------------------------------+  |
|     | - Remove malicious files/processes                     |  |
|     | - Clean registry modifications (Windows)               |  |
|     | - Remove scheduled tasks/services                      |  |
|     | - Clean browser extensions/plugins                     |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  3. PERSISTENCE REMOVAL                                          |
|     +--------------------------------------------------------+  |
|     | - Remove startup entries                               |  |
|     | - Clean scheduled tasks                                |  |
|     | - Remove rogue services                                |  |
|     | - Delete backdoor accounts                             |  |
|     | - Remove unauthorized SSH keys                         |  |
|     | - Clean DNS entries (hosts file, DNS server)           |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  4. VULNERABILITY REMEDIATION                                    |
|     +--------------------------------------------------------+  |
|     | - Patch exploited vulnerability                        |  |
|     | - Harden misconfigurations                             |  |
|     | - Update security controls                             |  |
|     | - Verify patch application                             |  |
|     +--------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.2 Eradication Checklist

```
ERADICATION VERIFICATION:

MALWARE REMOVAL:
[ ] All malicious files identified and removed
[ ] File hashes verified against known malware DBs
[ ] Temporary files cleaned
[ ] Browser caches cleared
[ ] Email attachments/quarantine reviewed

PERSISTENCE REMOVAL:
[ ] Registry Run keys cleaned (Windows)
[ ] crontab entries reviewed and cleaned (Linux)
[ ] System services verified (no rogue services)
[ ] Scheduled tasks removed
[ ] Startup scripts cleaned
[ ] SSH authorized_keys reviewed
[ ] Group Policy changes reverted

ACCOUNT CLEANUP:
[ ] Rogue accounts deleted
[ ] Compromised passwords reset
[ ] Unauthorized API keys revoked
[ ] OAuth tokens invalidated
[ ] Service account credentials rotated

NETWORK CLEANUP:
[ ] DNS poisoning reversed
[ ] Rogue DNS entries removed
[ ] Firewall rules reviewed and updated
[ ] VPN configurations verified
[ ] Proxy settings cleaned

VERIFICATION:
[ ] Full malware scan completed (all endpoints)
[ ] Vulnerability scan confirms no exploitable vulns
[ ] File integrity check passed
[ ] No new suspicious processes
[ ] Network traffic normalized
```

---

## 4. Recovery

### 4.1 Recovery Process

```
+------------------------------------------------------------------+
|                    RECOVERY PROCESS                               |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+                                           |
|  | 1. VALIDATE      |                                           |
|  |    CLEAN STATE   |                                           |
|  |                  |--> Verify eradication complete             |
|  |                  |    Confirm no reinfection                  |
|  |                  |    Validate system integrity               |
|  +--------+---------+                                           |
|           |                                                      |
|           v                                                      |
|  +------------------+                                           |
|  | 2. RESTORE       |                                           |
|  |    SYSTEMS       |                                           |
|  |                  |--> Restore from clean backups              |
|  |                  |    Rebuild from known-good images          |
|  |                  |    Reinstall if necessary                  |
|  +--------+---------+                                           |
|           |                                                      |
|           v                                                      |
|  +------------------+                                           |
|  | 3. VERIFY        |                                           |
|  |    FUNCTIONALITY |                                           |
|  |                  |--> Test all critical functions             |
|  |                  |    User acceptance testing                 |
|  |                  |    Performance validation                  |
|  +--------+---------+                                           |
|           |                                                      |
|           v                                                      |
|  +------------------+                                           |
|  | 4. MONITOR       |                                           |
|  |    INTENSIVELY   |                                           |
|  |                  |--> Enhanced logging enabled                |
|  |                  |    Watch for reinfection                   |
|  |                  |    30-day monitoring period                |
|  +------------------+                                           |
|                                                                  |
+------------------------------------------------------------------+
```

### 4.2 Recovery Strategies

```
RECOVERY OPTION DECISION MATRIX:

+------------------+-------------------+-------------------+
| Scenario         | Recommended       | Time Estimate     |
|                  | Recovery Method   |                   |
+------------------+-------------------+-------------------+
| Single system    | Restore from      | 2-4 hours         |
| compromise       | backup            |                   |
+------------------+-------------------+-------------------+
| Multiple systems | Rebuild from      | 1-3 days          |
| (same malware)   | gold images       |                   |
+------------------+-------------------+-------------------+
| Domain compromise| Rebuild DC from   | 3-7 days          |
|                  | clean backup      |                   |
+------------------+-------------------+-------------------+
| Ransomware       | Restore from      | Days to weeks     |
| (encrypted)      | offline backup    |                   |
+------------------+-------------------+-------------------+
| Supply chain     | Rebuild with      | Weeks             |
| compromise       | verified software |                   |
+------------------+-------------------+-------------------+

BACKUP VERIFICATION:
1. Identify last known clean backup
2. Verify backup integrity (checksums)
3. Restore to isolated environment
4. Scan restored data for malware
5. Test application functionality
6. Deploy to production
```

### 4.3 Post-Recovery Monitoring

```bash
#!/bin/bash
# post-recovery-monitor.sh - Enhanced monitoring after incident

# 1. Enable comprehensive logging
auditctl -w /etc/passwd -p wa -k identity
auditctl -w /etc/shadow -p wa -k credentials
auditctl -w /root/.ssh -p wa -k ssh_keys
auditctl -a always,exit -F arch=b64 -S execve -k command_execution

# 2. Monitor for known IOCs
cat > /tmp/monitor-iocs.sh << 'IOCS'
#!/bin/bash
# Block known malicious IPs
iptables -A INPUT -s 1.2.3.4 -j DROP
iptables -A INPUT -s 5.6.7.8 -j DROP

# Monitor for suspicious processes
ps aux | grep -E "mimikatz|cobalt|beacon" | grep -v grep

# Check for unauthorized SSH keys
find /home -name "authorized_keys" -exec cat {} \;

# Monitor DNS for C2 domains
tcpdump -i eth0 port 53 -nn | grep -i "suspicious-domain.com"
IOCS
chmod +x /tmp/monitor-iocs.sh

# 3. Schedule recurring checks
echo "*/5 * * * * /tmp/monitor-iocs.sh >> /var/log/post-recovery.log" | crontab -

echo "[+] Post-recovery monitoring enabled"
```

---

## 5. Lessons Learned

### 5.1 Post-Incident Review Process

```
+------------------------------------------------------------------+
|              POST-INCIDENT REVIEW (Lessons Learned)                |
+------------------------------------------------------------------+
|                                                                  |
|  TIMING: Within 1-2 weeks of incident closure                   |
|                                                                  |
|  ATTENDEES:                                                     |
|  - IR Team leads                                                |
|  - Affected system owners                                       |
|  - Management representatives                                   |
|  - Legal/Compliance                                             |
|  - Communications                                               |
|                                                                  |
|  AGENDA:                                                        |
|  +----------------------------------------------------------+  |
|  | 1. Incident Timeline Review                               |  |
|  |    - What happened and when                               |  |
|  |    - Key decision points                                  |  |
|  |    - Response effectiveness                               |  |
|  +----------------------------------------------------------+  |
|  | 2. What Went Well                                          |  |
|  |    - Effective detection                                  |  |
|  |    - Good communication                                   |  |
|  |    - Quick containment                                    |  |
|  +----------------------------------------------------------+  |
|  | 3. What Could Be Improved                                 |  |
|  |    - Detection gaps                                       |  |
|  |    - Communication delays                                 |  |
|  |    - Tool limitations                                     |  |
|  |    - Process gaps                                         |  |
|  +----------------------------------------------------------+  |
|  | 4. Action Items                                           |  |
|  |    - Specific improvements with owners                    |  |
|  |    - Deadlines for completion                             |  |
|  |    - Budget/resource requirements                         |  |
|  +----------------------------------------------------------+  |
|  | 5. Documentation Updates                                   |  |
|  |    - IR plan revisions                                    |  |
|  |    - Playbook updates                                     |  |
|  |    - Detection rule improvements                          |  |
|  +----------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 5.2 Post-Incident Report Template

```
POST-INCIDENT REPORT

INCIDENT ID: INC-2024-001
DATE: 2024-01-15
SEVERITY: P1 - Critical
STATUS: Closed

EXECUTIVE SUMMARY:
[2-3 paragraph summary of the incident, impact, and resolution]

TIMELINE:
2024-01-15 08:00 - Initial compromise via phishing email
2024-01-15 08:15 - Malware execution on workstation
2024-01-15 08:30 - Lateral movement to file server
2024-01-15 09:00 - SIEM alert triggered
2024-01-15 09:15 - IR team activated
2024-01-15 09:30 - Containment initiated
2024-01-15 11:00 - Eradication complete
2024-01-15 14:00 - Systems restored
2024-01-15 14:30 - Incident closed

IMPACT:
- Systems affected: 5 workstations, 1 file server
- Data exposure: None confirmed
- Business impact: 4 hours of limited operations
- Financial impact: $50,000 (response costs)

ROOT CAUSE:
Phishing email with malicious attachment bypassed email filter
due to outdated detection signatures.

LESSONS LEARNED:
1. Email security gateway needs more frequent signature updates
2. User awareness training gaps identified
3. EDR detected but response time was slow

ACTION ITEMS:
1. Update email filter signatures (Owner: Security Team, Due: 1 week)
2. Conduct phishing awareness training (Owner: HR, Due: 1 month)
3. Tune EDR alerting for faster response (Owner: SOC, Due: 2 weeks)
```

---

## 6. Forensics Preservation

### 6.1 Digital Forensics Process

```
+------------------------------------------------------------------+
|                DIGITAL FORENSICS PROCESS                          |
+------------------------------------------------------------------+
|                                                                  |
|  1. IDENTIFICATION                                              |
|     +--------------------------------------------------------+  |
|     | - Identify potential evidence sources                  |  |
|     | - Document chain of custody requirements               |  |
|     | - Identify volatile data (memory, network connections) |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  2. COLLECTION (Order of Volatility)                            |
|     +--------------------------------------------------------+  |
|     | Priority 1: CPU registers, cache                      |  |
|     | Priority 2: Routing table, ARP cache, process table   |  |
|     | Priority 3: RAM (memory dump)                         |  |
|     | Priority 4: Temporary file systems                    |  |
|     | Priority 5: Disk (hard drive, SSD)                    |  |
|     | Priority 6: Remote logging and monitoring data        |  |
|     | Priority 7: Physical configuration, network topology  |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  3. PRESERVATION                                                |
|     +--------------------------------------------------------+  |
|     | - Write-blocker for disk acquisition                  |  |
|     | - Bit-for-bit forensic image (dd, FTK Imager)         |  |
|     | - Memory dump (LiME, WinPmem)                         |  |
|     | - Hash verification (SHA-256)                         |  |
|     | - Chain of custody documentation                      |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  4. ANALYSIS                                                    |
|     +--------------------------------------------------------+  |
|     | - Timeline analysis                                   |  |
|     | - File system analysis                                |  |
|     | - Memory analysis (Volatility)                        |  |
|     | - Network packet analysis                             |  |
|     | - Log correlation                                     |  |
|     +--------------------------------------------------------+  |
|                                                                  |
|  5. REPORTING                                                   |
|     +--------------------------------------------------------+  |
|     | - Technical findings                                  |  |
|     | - Evidence catalog                                    |  |
|     | - Timeline reconstruction                             |  |
|     | - Indicators of compromise (IOCs)                     |  |
|     | - Recommendations                                     |  |
|     +--------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.2 Forensic Imaging Commands

```bash
# Linux disk imaging with dd (bit-for-bit)
dd if=/dev/sda of=/forensics/sda_image.dd bs=4M status=progress
sha256sum /dev/sda > /forensics/sda_original.sha256
sha256sum /forensics/sda_image.dd > /forensics/sda_image.sha256

# Memory dump with LiME
insmod lime.ko "path=/forensics/memory.lime format=lime"

# Windows memory dump with WinPmem
winpmem_mini_x64.exe /forensics/memory.raw

# Network packet capture
tcpdump -i eth0 -w /forensics/capture.pcap -c 100000

# Volatility memory analysis
volatility -f memory.raw imageinfo
volatility -f memory.raw --profile=Win7SP1x64 pslist
volatility -f memory.raw --profile=Win7SP1x64 netscan
volatility -f memory.raw --profile=Win7SP1x64 filescan
```

### 6.3 Chain of Custody Form

```
CHAIN OF CUSTODY FORM

Case Number: IR-2024-001
Evidence Item: EVID-001
Description: Forensic image of workstation WS-001
Date/Time Collected: 2024-01-15 09:45 UTC
Collected By: John Smith, CISO

HASH VERIFICATION:
SHA-256: a1b2c3d4e5f6... (full hash)

CUSTODY LOG:
+----------------+----------------+-------------------+
| Date/Time      | Released By    | Received By       |
+----------------+----------------+-------------------+
| 2024-01-15     | J. Smith       | Forensics Lab     |
| 09:45 UTC      |                |                   |
+----------------+----------------+-------------------+
| 2024-01-16     | Forensics Lab  | Legal Department  |
| 14:00 UTC      |                |                   |
+----------------+----------------+-------------------+

Storage Location: Locked evidence room, Building A
Access Control: Badge + PIN required
```

---

## 7. Security Perspective

### 7.1 Common Attack Patterns and IR Response

```
ATTACK PATTERN -> IR RESPONSE MAPPING:

PHISHING -> INITIAL ACCESS
+----------------------------------------------------------+
| Detection: Email gateway alerts, user reports            |
| Containment: Block sender, quarantine emails             |
| Eradication: Reset credentials, remove malware          |
| Recovery: Restore affected systems, train user          |
+----------------------------------------------------------+

RANSOMWARE -> IMPACT
+----------------------------------------------------------+
| Detection: File encryption alerts, EDR alerts            |
| Containment: Network isolation, preserve evidence       |
| Eradication: Remove malware, identify variant           |
| Recovery: Restore from backup, rebuild if needed        |
+----------------------------------------------------------+

INSIDER THREAT -> PRIVILEGE ESCALATION
+----------------------------------------------------------+
| Detection: UBA anomalies, DLP alerts                     |
| Contain: Disable account, preserve evidence             |
| Eradication: Remove access, investigate scope           |
| Recovery: Monitor, legal proceedings                     |
+----------------------------------------------------------+

SUPPLY CHAIN -> PERSISTENCE
+----------------------------------------------------------+
| Detection: Anomaly in trusted software updates          |
| Containment: Isolate affected systems                   |
| Eradication: Remove compromised software                |
| Recovery: Rebuild with verified software                |
+----------------------------------------------------------+
```

### 7.2 IR Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| MTTD (Mean Time to Detect) | Time from compromise to detection | < 24 hours |
| MTTC (Mean Time to Contain) | Time from detection to containment | < 4 hours |
| MTTR (Mean Time to Recover) | Time from containment to recovery | < 24 hours |
| Incident Volume | Total incidents per month | Trending down |
| False Positive Rate | % of alerts that are FP | < 10% |
| Recurrence Rate | Same incident type repeating | 0% |
| User Reporting Rate | % of incidents reported by users | > 50% |

---

## 8. Practical Examples

### 8.1 IR Playbook - Ransomware Response

```yaml
# Ransomware Response Playbook
name: Ransomware Incident Response
version: 2.0
severity: P1
estimated_time: 24-72 hours

playbook:
  phase_1_detection:
    duration: 0-30 minutes
    actions:
      - Alert received from EDR/SIEM
      - Confirm ransomware indicators (file encryption, ransom note)
      - Initial scope assessment
      - Activate IR team
    contacts:
      - IR Lead: [Name, Phone]
      - CISO: [Name, Phone]
      - Legal: [Name, Phone]

  phase_2_containment:
    duration: 30-120 minutes
    actions:
      - Isolate affected VLANs (network team)
      - Disconnect affected systems (DO NOT POWER OFF)
      - Block IOCs at firewall/EDR
      - Disable compromised accounts
      - Preserve forensic evidence
    critical: "DO NOT pay ransom without executive and legal approval"

  phase_3_eradication:
    duration: 2-24 hours
    actions:
      - Identify ransomware variant
      - Remove malware from all affected systems
      - Remove persistence mechanisms
      - Patch exploited vulnerability
      - Reset all credentials (especially Domain Admin)

  phase_4_recovery:
    duration: 24-72 hours
    actions:
      - Identify last clean backup
      - Verify backup integrity
      - Restore systems in priority order
      - Validate system functionality
      - Enable enhanced monitoring

  phase_5_post_incident:
    duration: 1-2 weeks
    actions:
      - Conduct lessons learned meeting
      - Update IR playbook
      - Improve detection rules
      - User awareness training
      - Report to regulators (if required)
```

### 8.2 IR Playbook - Phishing Response

```bash
#!/bin/bash
# phishing-response.sh - Automated phishing response steps

REPORTED_EMAIL="$1"
FROM_ADDRESS="$2"

echo "[*] Phishing Response Initiated"
echo "Email: $REPORTED_EMAIL"
echo "From: $FROM_ADDRESS"
echo "Time: $(date)"

# 1. Block sender at email gateway
echo "[*] Blocking sender..."
# Postfix example
echo "$FROM_ADDRESS" >> /etc/postfix/blocked_senders
postmap /etc/postfix/blocked_senders
systemctl reload postfix

# 2. Search for similar emails
echo "[*] Searching for similar phishing emails..."
grep -r "$FROM_ADDRESS" /var/mail/ | wc -l
grep -r "Subject:*$REPORTED_EMAIL*" /var/mail/ | wc -l

# 3. Quarantine found emails
echo "[*] Quarantining phishing emails..."
# Move to quarantine directory
find /var/mail -name "*.eml" -exec grep -l "$FROM_ADDRESS" {} \; -exec mv {} /var/mail/quarantine/ \;

# 4. Check for clicks/credential submission
echo "[*] Checking for user interactions..."
# Review web proxy logs for credential submission
grep "$FROM_ADDRESS" /var/log/squid/access.log

# 5. Block malicious URLs
echo "[*] Blocking malicious URLs..."
# Extract URLs from email and block at proxy
# Add to URL filter

# 6. Notify affected users
echo "[*] Notifying users who received the email..."
# Send notification email

echo "[+] Phishing response steps completed"
echo "[!] Manual review still required for full analysis"
```

### 8.3 Forensic Analysis with Volatility

```bash
# Memory forensics with Volatility
# Identify OS profile
volatility -f memory.raw imageinfo

# List running processes
volatility -f memory.raw --profile=Win10x64 pslist

# Show process tree
volatility -f memory.raw --profile=Win10x64 pstree

# Network connections
volatility -f memory.raw --profile=Win10x64 netscan

# Extract malware from memory
volatility -f memory.raw --profile=Win10x64 procdump -D /forensics/

# List loaded DLLs
volatility -f memory.raw --profile=Win10x64 ldrmodules

# Extract command-line arguments
volatility -f memory.raw --profile=Win10x64 cmdline

# Check for injected code
volatility -f memory.raw --profile=Win10x64 malfind
```

---

## 9. Interview Questions

### Basic

1. **What are the six phases of the NIST incident response lifecycle?**
   - Preparation, Detection/Analysis, Containment, Eradication, Recovery, Lessons Learned

2. **What is the difference between short-term and long-term containment?**
   - Short-term: immediate actions to stop bleeding; Long-term: strategic isolation while maintaining operations

3. **Why is evidence preservation important in incident response?**
   - Legal proceedings, regulatory requirements, understanding full scope, lessons learned

4. **What is chain of custody?**
   - Documented trail of evidence handling showing who had access and when

5. **What is the order of volatility for evidence collection?**
   - CPU/cache, routing table, RAM, disk, remote logs

### Intermediate

6. **How do you determine the severity of a security incident?**
   - Impact (data exposure, systems affected), urgency (active exploitation), business criticality

7. **Explain the difference between eradication and recovery.**
   - Eradication: removing the threat; Recovery: restoring normal operations

8. **How do you handle a ransomware incident?**
   - Isolate, preserve evidence, identify variant, DO NOT pay without authorization, restore from backup

9. **What metrics should an IR team track?**
   - MTTD, MTTC, MTTR, incident volume, false positive rate, recurrence rate

10. **How do you conduct a post-incident review?**
    - Timeline review, what went well, what could improve, action items, documentation updates

### Advanced

11. **How would you handle a suspected APT (Advanced Persistent Threat)?**
    - Assume broader compromise, long-term monitoring, threat hunting, external forensics assistance

12. **How do you handle IR for cloud environments?**
    - Understand shared responsibility model, cloud-native forensics, API-based containment, immutable infrastructure

13. **What legal considerations apply to incident response?**
    - Data breach notification laws, GDPR 72-hour rule, evidence preservation requirements, attorney-client privilege

14. **How do you build an effective IR team?**
    - Cross-functional skills, clear roles, regular training, tabletop exercises, external relationships

15. **How does automation improve incident response?**
    - SOAR for playbooks, automated containment, enrichment, reduced MTTC, consistency

---

## 10. Hands-on Labs

### Lab 1: Tabletop Exercise - Ransomware Scenario

```
SCENARIO:
Friday 3:00 PM - Multiple users report files are encrypted with .locked extension.
Ransom note demands 5 Bitcoin for decryption key.

EXERCISE STEPS:
1. Who do you notify first?
2. What immediate actions do you take?
3. How do you identify the scope?
4. What evidence do you preserve?
5. How do you communicate with stakeholders?
6. When do you involve law enforcement?
7. How do you recover without paying ransom?

DISCUSSION POINTS:
- Communication chain
- Evidence preservation
- Backup verification
- Business continuity
- Legal obligations
```

### Lab 2: Forensic Evidence Collection

```bash
# Create forensic workstation
# Install tools: dd, volatility, sleuthkit, autopsy

# 1. Disk image
dd if=/dev/sdb of=/forensics/evidence/disk_image.dd bs=4M status=progress

# 2. Memory dump
# On suspect system (if possible)
sudo insmod lime.ko "path=/tmp/memory.lime format=lime"

# 3. Network capture
tcpdump -i eth0 -w /forensics/evidence/network.pcap

# 4. Verify integrity
sha256sum /forensics/evidence/disk_image.dd > /forensics/evidence/hash.txt
md5sum /forensics/evidence/disk_image.dd >> /forensics/evidence/hash.txt

# 5. Document chain of custody
echo "Evidence collected by [Name] on [Date]" > /forensics/evidence/custody.txt
```

### Lab 3: Wazuh IR Integration

```xml
<!-- Wazuh active response for automated containment -->
<ossec_config>
  <active-response>
    <command>host-deny</command>
    <location>local</location>
    <rules_id>100100,100101,100200</rules_id>
  </active-response>

  <!-- Custom IR detection rules -->
  <rule id="100500" level="12">
    <if_sid>18101</if_sid>
    <field name="win.eventdata.commandLine" type="pcre2">(?i)(mimikatz|sekurlsa|kerberos::)</field>
    <description>Credential dumping detected - IR P1 incident</description>
    <group>credential_access,attack,ir_p1</group>
  </rule>
</ossec_config>
```

### Lab 4: Incident Tracking Setup

```bash
# Set up incident tracking with TheHive (open-source IR platform)
docker run -d --name thehive \
  -p 9000:9000 \
  -v /data/thehive:/opt/TheHive/data \
  thehiveproject/thehive:latest

# Create incident template
curl -X POST http://localhost:9000/api/case \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ransomware Incident - Workstation WS-001",
    "description": "Ransomware detected on workstation",
    "severity": 2,
    "flag": false,
    "tags": ["ransomware", "malware", "p1"]
  }'
```

---

## 11. Summary Table

| Topic | Key Concept | Primary Tools | Risk If Ignored |
|-------|------------|---------------|-----------------|
| NIST Lifecycle | Structured response framework | IR policies, playbooks | Chaotic, ineffective response |
| Preparation | Readiness before incidents | IR team, tools, training | Slow, uncoordinated response |
| Detection | Identify security events | SIEM, EDR, IDS | Breaches go unnoticed |
| Containment | Limit damage scope | Network isolation, EDR | Attack spreads uncontrollably |
| Eradication | Remove threat completely | Forensics tools, scanners | Re-infection likely |
| Recovery | Restore normal operations | Backups, gold images | Extended downtime |
| Lessons Learned | Improve for next time | Post-incident reports | Repeat incidents |
| Forensics | Preserve and analyze evidence | Volatility, dd, FTK | Legal issues, missed IOCs |
| Playbooks | Step-by-step response guides | YAML/IR documentation | Inconsistent response |
| Communication | Stakeholder notification | Encrypted channels, templates | Reputation damage, legal issues |

---

## Resources

**Books:**
- *Incident Response & Computer Forensics* - McGraw-Hill
- *The Art of Incident Response* - No Starch Press
- *Hunting Cyber Criminals* - Wiley

**Documentation:**
- NIST SP 800-61: https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final
- SANS Incident Response: https://www.sans.org/white-papers/incident-response/
- FIRST.org: https://www.first.org/

**Tools:**
- TheHive (IR platform)
- Volatility (memory forensics)
- SIFT Workstation (forensics toolkit)
- Velociraptor (endpoint forensics)
- SOAR platforms (Cortex XSOAR, Splunk SOAR)

**Labs:**
- SANS FOR508 (Incident Response)
- Blue Team Labs Online (BTLO)
- CyberDefenders
- TryHackMe SOC Level 2
- Hacking Labs (IR scenarios)
