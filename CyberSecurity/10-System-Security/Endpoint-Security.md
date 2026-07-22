# Endpoint Security

## What is it?

Endpoint security protects individual devices — workstations, laptops, servers, and mobile devices — from threats. It combines antivirus software, Endpoint Detection and Response (EDR), host-based firewalls, and device control policies to detect, prevent, and respond to malicious activity at the device level.

## Why Learn It?

Endpoints are the most targeted attack surface in any organization. Users interact with them daily, making them susceptible to phishing, malware, and unauthorized access. Strong endpoint security is the last line of defense when network controls are bypassed.

## You Will Learn

- Antivirus and anti-malware engine operations
- EDR architecture and behavioral analysis
- Host-based firewall configuration and rules
- Device control and peripheral management
- Endpoint protection platforms (EPP) vs EDR vs XDR

## Prerequisites

- System Hardening

## Related Topics

- Malware Analysis
- Incident Response

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
│  │  System        │    │        ▶▶▶  ENDPOINT SECURITY ◀◀◀  │       │
│  │  Hardening     │    │   (AV/EDR/Firewall/DLP/Whitelist)  │       │
│  └───────────────┘    └──────────────────┬──────────────────┘       │
│                                          │                          │
│                                          ▼                          │
│                               ┌──────────────────┐                 │
│                               │  Application &    │                │
│                               │  Data Security    │                │
│                               └──────────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Endpoint security sits at the **device level** — the last line of defense closest to the user and data.

---

## 1. Antivirus / Anti-Malware

### 1.1 Detection Methods

```
┌──────────────────────────────────────────────────────────────────┐
│                  MALWARE DETECTION METHODS                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ 1. SIGNATURE     │  Hash/pattern matching against known DB    │
│  │    MATCHING      │  Pros: Fast, low false positives           │
│  │                  │  Cons: Cannot detect zero-day              │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ 2. HEURISTIC     │  Code analysis for suspicious patterns     │
│  │    ANALYSIS      │  Pros: Detects variants of known malware   │
│  │                  │  Cons: Higher false positive rate          │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ 3. BEHAVIORAL    │  Monitor runtime behavior (API calls,      │
│  │    ANALYSIS      │  file changes, registry modifications)     │
│  │                  │  Pros: Zero-day detection                  │
│  │                  │  Cons: Higher resource usage               │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ 4. SANDBOXING    │  Execute in isolated environment           │
│  │    (EMULATION)   │  Pros: Safe detonation, full analysis      │
│  │                  │  Cons: Sandbox evasion possible            │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ 5. MACHINE       │  AI/ML trained on millions of samples     │
│  │    LEARNING      │  Pros: Adapts to new threats               │
│  │                  │  Cons: Requires training data, compute     │
│  └─────────────────┘                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Signature-Based Detection Workflow

```
File/Process Attempting to Run
         │
         ▼
┌─────────────────────┐
│ Compute file hash    │──→ SHA-256 / MD5
│ (PE header, body)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Query signature      │──→ Local DB + Cloud DB
│ database             │    (millions of signatures)
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │            │
   Match       No Match
     │            │
     ▼            ▼
┌─────────┐  ┌──────────────┐
│ BLOCK   │  │ Heuristic     │
│ Quarantine│  │ Analysis      │
│ Alert   │  └──────┬───────┘
└─────────┘         │
              ┌─────┴─────┐
              │            │
          Suspicious   Clean
              │            │
              ▼            ▼
         ┌─────────┐  ┌─────────┐
         │ Behavioral│  │ ALLOW   │
         │ Monitor   │  │         │
         └─────────┘  └─────────┘
```

### 1.3 Open-Source Anti-Malware Tools

| Tool | Platform | Detection Method | Use Case |
|------|----------|-----------------|----------|
| ClamAV | Linux/Windows | Signature + Heuristic | Email gateway, file scanning |
| YARA | Cross-platform | Pattern rules | Malware research, detection |
| OSSEC | Cross-platform | Rootkit detection | Host-based IDS |
| Wazuh | Cross-platform | YARA + behavioral | EDR-like capabilities |
| Maltrail | Linux | Threat intelligence | Network threat detection |

### 1.4 ClamAV Practical Usage

```bash
# Install ClamAV
sudo apt install clamav clamav-daemon

# Update signatures
sudo freshclam

# Scan a directory
clamscan -r /home/user/

# Scan with removal
clamscan -r --remove /tmp/

# Scan and log
clamscan -r -l /var/log/clamav/scan.log /home/

# On-access scanning (daemon)
sudo systemctl start clamav-daemon

# YARA rules for custom detection
yara -r /path/to/rules/ /path/to/scan/
```

### 1.5 Malware Detection Evasion Techniques (Attacker Perspective)

| Technique | Description | Defense |
|-----------|-------------|---------|
| Polymorphic code | Changes signature each execution | Behavioral analysis |
| Metamorphic code | Rewrites entire code body | Heuristic + ML detection |
| Fileless malware | Lives in memory/registry only | Memory scanning, EDR |
| Packing/encryption | Obfuscates binary content | Unpacking engines, sandbox |
| DLL sideloading | Loads malicious DLLs | Application whitelisting |
| Process hollowing | Injects into legitimate process | EDR behavioral monitoring |

---

## 2. Endpoint Detection and Response (EDR)

### 2.1 EDR Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      EDR ARCHITECTURE                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ Endpoint A   │  │ Endpoint B   │  │ Endpoint C   │                  │
│  │ ┌──────────┐│  │ ┌──────────┐│  │ ┌──────────┐│                  │
│  │ │ EDR      ││  │ │ EDR      ││  │ │ EDR      ││                  │
│  │ │ Agent    ││  │ │ Agent    ││  │ │ Agent    ││                  │
│  │ └────┬─────┘│  │ └────┬─────┘│  │ └────┬─────┘│                  │
│  └──────┼──────┘  └──────┼──────┘  └──────┼──────┘                  │
│         │                │                │                           │
│         ▼                ▼                ▼                           │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │                    EDR SERVER / CLOUD                       │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │      │
│  │  │ Event    │  │ Threat   │  │ Behavioral│  │ Response │  │      │
│  │  │ Collect  │  │ Intel    │  │ Analysis  │  │ Engine   │  │      │
│  │  │ & Store  │  │ Feeds    │  │ (ML)      │  │          │  │      │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │      │
│  │                                                           │      │
│  │  ┌──────────────────────────────────────────────────────┐ │      │
│  │  │              ANALYST CONSOLE                          │ │      │
│  │  │  - Alert triage     - Threat hunting                 │ │      │
│  │  │  - Investigation    - Automated response             │ │      │
│  │  └──────────────────────────────────────────────────────┘ │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 EDR vs EPP vs XDR

| Feature | EPP | EDR | XDR |
|---------|-----|-----|-----|
| **Primary Function** | Prevent (block known threats) | Detect + Respond (investigate unknown) | Extended detection across all layers |
| **Detection** | Signature-based | Behavioral + ML | Multi-source correlation |
| **Response** | Block/quarantine | Full investigation + remediation | Cross-domain automated response |
| **Visibility** | Point-in-time | Continuous recording | Network + endpoint + cloud |
| **Threat Hunting** | Limited | Advanced | Cross-domain hunting |
| **Forensics** | Basic | Timeline, process tree | Full attack chain visibility |
| **Examples** | McAfee, Symantec | CrowdStrike, SentinelOne | Palo Alto XDR, Microsoft Sentinel |

### 2.3 EDR Data Collection Points

```
EDR AGENT COLLECTS:

Process Events:
  ├── Process creation (PID, parent, command line)
  ├── Process termination
  ├── DLL loading
  └── Memory allocation patterns

File Events:
  ├── File creation/modification/deletion
  ├── File permission changes
  ├── File access (read/write)
  └── New file types in unusual locations

Registry Events (Windows):
  ├── Key creation/modification
  ├── Value changes (especially Run keys)
  ├── Service installation
  └── COM object registration

Network Events:
  ├── Connection establishment
  ├── DNS queries
  ├── HTTP/HTTPS metadata
  └── Raw socket usage

User Events:
  ├── Login/logoff
  ├── Privilege escalation
  ├── Group membership changes
  └── Authentication failures
```

### 2.4 Wazuh as Open-Source EDR

```xml
<!-- Wazuh agent configuration -->
<ossec_config>
  <!-- File integrity monitoring -->
  <syscheck>
    <frequency>3600</frequency>
    <scan_on_start>yes</scan_on_start>
    <directories check_all="yes" report_changes="yes" realtime="yes">/etc,/usr/bin,/usr/sbin</directories>
    <directories check_all="yes" report_changes="yes" realtime="yes">/bin,/sbin</directories>
  </syscheck>

  <!-- Log monitoring -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/syslog</location>
  </localfile>

  <!-- Active response -->
  <active-response>
    <command>host-deny</command>
    <location>local</location>
    <rules_id>100101,100102</rules_id>
  </active-response>
</ossec_config>
```

### 2.5 EDR Alert Investigation Workflow

```
┌──────────────┐
│ Alert         │──→ New alert from EDR agent
│ Generated     │    (e.g., suspicious PowerShell execution)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Triage        │──→ Is this true positive or false positive?
│ (Severity     │    Check: process tree, parent process,
│  Assessment)  │    command line arguments, destination IP
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Investigate   │──→ Full timeline reconstruction
│ (Timeline     │    What happened before and after?
│  Analysis)    │    Lateral movement? Data exfil?
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Contain       │──→ Isolate endpoint from network
│               │    Kill malicious processes
│               │    Block IOCs on other endpoints
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Eradicate     │──→ Remove malware/persistence
│               │    Reset compromised credentials
│               │    Patch exploited vulnerability
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Recover       │──→ Restore normal operations
│               │    Verify system integrity
│               │    Continue monitoring
└──────────────┘
```

---

## 3. Host-Based Firewall

### 3.1 Why Host-Based Firewalls?

```
NETWORK FIREWALL vs HOST FIREWALL:

Network Firewall:                Host Firewall:
┌──────────────────┐             ┌──────────────────┐
│ Protects entire   │             │ Protects single   │
│ network segment   │             │ endpoint          │
│                   │             │                   │
│ Controls traffic  │             │ Controls traffic  │
│ IN/OUT of network │             │ IN/OUT of host    │
│                   │             │                   │
│ Blind to internal │             │ Sees all host     │
│ lateral movement  │             │ traffic           │
│                   │             │                   │
│ Single point of   │             │ Defense-in-depth  │
│ failure risk      │             │ if network FW     │
│                   │             │ is bypassed       │
└──────────────────┘             └──────────────────┘

RECOMMENDATION: Use BOTH for defense-in-depth
```

### 3.2 Windows Firewall Configuration

```powershell
# View current rules
Get-NetFirewallRule | Select DisplayName, Direction, Action, Enabled

# Block inbound SMB (lateral movement prevention)
New-NetFirewallRule -DisplayName "Block Inbound SMB" `
  -Direction Inbound -Protocol TCP -LocalPort 445 -Action Block

# Block PowerShell remoting from unauthorized sources
New-NetFirewallRule -DisplayName "Block PS Remoting" `
  -Direction Inbound -Protocol TCP -LocalPort 5985-5986 -Action Block `
  -RemoteAddress 10.0.0.0/24  # Only allow from management subnet

# Allow only specific IP for RDP
New-NetFirewallRule -DisplayName "Allow RDP from Admin" `
  -Direction Inbound -Protocol TCP -LocalPort 3389 -Action Allow `
  -RemoteAddress 10.0.1.50

# Block outbound DNS except to internal DNS
New-NetFirewallRule -DisplayName "Block External DNS" `
  -Direction Outbound -Protocol UDP -LocalPort 53 -Action Block `
  -RemoteAddress !10.0.1.10

# Enable logging
Set-NetFirewallProfile -Profile Domain,Public,Private `
  -LogBlocked True -LogMaxSizeKilobytes 32767 `
  -LogFileName "C:\Windows\System32\LogFiles\Firewall\pfirewall.log"
```

### 3.3 Linux iptables/nftables

```bash
#!/bin/bash
# iptables-hardening.sh

# Flush existing rules
iptables -F
iptables -X

# Default policies: deny all
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (non-standard port)
iptables -A INPUT -p tcp --dport 2222 -j ACCEPT

# Allow HTTP/HTTPS (if web server)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Block SMB from outside
iptables -A INPUT -p tcp --dport 445 -j DROP
iptables -A INPUT -p tcp --dport 139 -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "IPTABLES-DROP: " --log-level 4

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### 3.4 nftables (Modern Alternative)

```bash
#!/usr/sbin/nft -f
# /etc/nftables.conf

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        
        # Allow established
        ct state established,related accept
        
        # Allow loopback
        iif "lo" accept
        
        # Allow SSH
        tcp dport 2222 accept
        
        # Allow HTTP/HTTPS
        tcp dport { 80, 443 } accept
        
        # Block SMB
        tcp dport { 139, 445 } drop
        
        # Log and drop everything else
        limit rate 5/minute log prefix "NFT-DROP: " drop
    }
    
    chain forward {
        type filter hook forward priority 0; policy drop;
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

---

## 4. Application Whitelisting

### 4.1 What is Application Whitelisting?

```
TRADITIONAL APPROACH (Blacklisting):
  Known bad = BLOCKED
  Unknown = ALLOWED  ← DANGER! Zero-day executes freely

WHITELISTING APPROACH:
  Known good = ALLOWED
  Unknown = BLOCKED  ← Zero-day cannot execute

ADVANTAGE: Stops ALL unauthorized executables
DISADVANTAGE: Operational overhead, user productivity impact
```

### 4.2 Whitelisting Implementation Methods

| Method | Description | Tools |
|--------|-------------|-------|
| Path-based | Allow executables from specific directories | Group Policy (SRP) |
| Hash-based | Allow only specific file hashes | AppLocker, Bit9 |
| Certificate-based | Allow signed binaries from trusted publishers | AppLocker, Windows Defender |
| Policy-based | Rules combining multiple criteria | Carbon Black, CrowdStrike |

### 4.3 Windows AppLocker Configuration

```powershell
# Create AppLocker policy
# Allow only signed executables from Program Files
New-AppLockerPolicy -RuleType Publisher -RuleAction Allow `
  -User Everyone `
  -PublisherRule "O=Microsoft Corporation,L=Redmond,S=Washington,C=US" `
  -Deny -Optimize

# Create rule: Allow only specific hash
New-AppLockerPolicy -RuleType Hash -RuleAction Allow `
  -User Everyone `
  -Path "C:\Program Files\MyApp\*.exe" `
  -Deny

# Export policy
Get-AppLockerPolicy -Local | Export-AppLockerPolicy -Path "C:\Policies\applocker.xml"

# Apply policy via Group Policy
# Computer Configuration → Windows Settings → Security Settings
#   → Application Control Policies → AppLocker

# Test policy (audit mode first)
Get-AppLockerPolicy -Local | Test-AppLockerPolicy `
  -Path "C:\Users\Public\malware.exe" `
  -User "DOMAIN\user"
```

### 4.4 Linux Application Control

```bash
# Using file capabilities to restrict
# Remove dangerous capabilities from binaries
setcap -r /usr/bin/unknown_binary

# Using SELinux to confine applications
# Check current SELinux context
ls -Z /usr/bin/

# Restrict a service with SELinux
semanage fcontext -a -t httpd_sys_content_t "/webapp(/.*)?"
restorecon -Rv /webapp/

# Using AppArmor profiles
aa-enforce /etc/apparmor.d/usr.bin.firefox
aa-status

# Using fapolicyd (Fedora/RHEL)
fapolicyd --list     # List rules
fapolicyd-cli -f add -t /usr/bin/python3 -p python3   # Trust specific binaries
```

### 4.5 Application Whitelisting Workflow

```
┌──────────────┐
│  Inventory    │──→ List all required applications
│  Applications │    Document versions, publishers
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Create       │──→ Define rules (hash/cert/path)
│  Whitelist    │    Include OS components
│  Policy       │    Include business applications
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Test in      │──→ Audit mode first
│  Audit Mode   │    Monitor blocked attempts
│               │    Refine rules
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Enforce      │──→ Switch to enforcement mode
│               │    Handle exceptions
│               │    User communication
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Monitor &    │──→ Track new applications
│  Maintain     │    Update whitelist regularly
│               │    Review exceptions
└──────────────┘
```

---

## 5. Device Control

### 5.1 Device Control Categories

```
┌──────────────────────────────────────────────────────────────────┐
│                   DEVICE CONTROL CATEGORIES                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USB/Removable Media                                           │
│  ├── USB flash drives                                          │
│  ├── External hard drives                                      │
│  ├── SD cards                                                  │
│  └── USB phones (MTP/PTP)                                     │
│                                                                  │
│  Wireless Devices                                               │
│  ├── Bluetooth adapters                                         │
│  ├── Wi-Fi adapters (unauthorized)                             │
│  └── NFC readers                                               │
│                                                                  │
│  Input Devices                                                  │
│  ├── Keyboards (HID attacks)                                   │
│  ├── Mice                                                      │
│  └── Custom USB devices (BadUSB)                               │
│                                                                  │
│  Output Devices                                                 │
│  ├── Printers                                                  │
│  ├── Displays (HDMI/DisplayPort)                               │
│  └── Audio devices                                             │
│                                                                  │
│  Network Adapters                                               │
│  ├── Unauthorized Wi-Fi dongles                                │
│  └── Cellular modems                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 USB Device Control (Windows)

```powershell
# Disable USB storage via registry
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR" `
  -Name "Start" -Value 4  # 4 = Disabled

# Re-enable when needed
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR" `
  -Name "Start" -Value 3  # 3 = Manual

# Disable USB devices by class GUID (USB mass storage)
# {36fc9e60-c465-11cf-8056-444553540000} = USB device class
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeviceInstall\Restrictions"
New-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeviceInstall\Restrictions" `
  -Name "DenyDeviceClasses" -Value 1 -PropertyType DWORD

# Use Group Policy for USB restriction
# Computer Config → Admin Templates → System → Device Installation
#   → Prevent installation of removable devices
```

### 5.3 USB Device Control (Linux)

```bash
# Disable USB storage module
echo "blacklist usb-storage" >> /etc/modprobe.d/blacklist-usb.conf

# Load module only when needed
modprobe usb-storage      # Enable
rmmod usb-storage         # Disable

# udev rule for specific USB devices only
# /etc/udev/rules.d/99-usb-allow.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="0951", ATTR{idProduct}=="1666", MODE="0660", GROUP="storage"
SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ENV{ID_VENDOR_ID}!="0951", RUN+="/bin/sh -c 'echo 0 > /sys/$devpath/authorized'"

# Use USBGuard for policy-based USB control
apt install usbguard
usbguard generate-policy > /etc/usbguard/rules.conf
systemctl enable usbguard
```

### 5.4 Device Control Policy Framework

```
DEVICE CONTROL DECISION MATRIX:

┌────────────────┬──────────────┬──────────────┬──────────────┐
│ Device Type    │ Personal     │ Corporate    │ Unknown      │
├────────────────┼──────────────┼──────────────┼──────────────┤
│ USB Storage    │ BLOCKED      │ BLOCKED*     │ BLOCKED      │
│ USB Keyboard   │ ALLOWED      │ ALLOWED      │ LOG+BLOCK    │
│ USB Mouse      │ ALLOWED      │ ALLOWED      │ LOG+BLOCK    │
│ Bluetooth      │ BLOCKED      │ LOG+ALLOW    │ BLOCKED      │
│ Wi-Fi Adapter  │ BLOCKED      │ BLOCKED      │ BLOCKED      │
│ Printer        │ ALLOWED      │ ALLOWED      │ BLOCKED      │
│ External HDD   │ BLOCKED      │ ENCRYPTED    │ BLOCKED      │
│ MTP Phone      │ BLOCKED      │ BLOCKED      │ BLOCKED      │
└────────────────┴──────────────┴──────────────┴──────────────┘

* Corporate USB: Encrypted + DLP scanning
```

---

## 6. Data Loss Prevention (DLP)

### 6.1 DLP Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      DLP ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Endpoint     │  │ Network      │  │ Cloud/Email │             │
│  │ DLP          │  │ DLP          │  │ DLP         │             │
│  │              │  │              │  │             │             │
│  │ - File copy  │  │ - HTTP/S     │  │ - Email     │             │
│  │ - USB write  │  │ - FTP        │  │ - Cloud     │             │
│  │ - Print      │  │ - DNS exfil  │  │   storage   │             │
│  │ - Clipboard  │  │ - Steganog.  │  │ - SaaS apps │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DLP MANAGEMENT CONSOLE                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Policy       │  │ Content      │  │ Incident     │   │   │
│  │  │ Management   │  │ Inspection   │  │ Management   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  │  ┌──────────────┐  ┌──────────────┐                     │   │
│  │  │ Reporting    │  │ Compliance   │                     │   │
│  │  │ & Analytics  │  │ Rules        │                     │   │
│  │  └──────────────┘  └──────────────┘                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 DLP Content Inspection Methods

| Method | Description | Accuracy | Performance |
|--------|-------------|----------|-------------|
| Regex | Pattern matching (SSN, CC#) | Medium | Fast |
| Exact Data Match | Fingerprint of sensitive data | High | Medium |
| Document Fingerprinting | Template matching | High | Medium |
| Category Classification | Predefined content categories | Medium | Fast |
| ML/Cognitive | AI-based content understanding | High | Slow |
| Named Entity Recognition | Identifies names, orgs, locations | Medium | Medium |

### 6.3 DLP Policy Examples

```yaml
# DLP Policy Configuration Example

policies:
  - name: "Credit Card Protection"
    description: "Prevent unauthorized transfer of credit card numbers"
    data_type: "Payment Card (PCI)"
    detection:
      method: "regex"
      patterns:
        - "4[0-9]{12}(?:[0-9]{3})?"      # Visa
        - "5[1-5][0-9]{14}"               # MasterCard
        - "3[47][0-9]{13}"                # Amex
        - "6(?:011|5[0-9]{2})[0-9]{12}"  # Discover
    action: "BLOCK"
    notification: "Security team"
    incident_severity: "HIGH"

  - name: "PII Protection"
    description: "Prevent PII from leaving the organization"
    data_type: "Personally Identifiable Information"
    detection:
      method: "compound"
      rules:
        - type: "regex"
          pattern: "\d{3}-\d{2}-\d{4}"  # SSN
        - type: "keywords"
          terms: ["social security", "date of birth", "passport"]
    action: "BLOCK + ENCRYPT"
    notification: "DLP team"
    incident_severity: "HIGH"

  - name: "Source Code Protection"
    description: "Prevent source code exfiltration"
    data_type: "Intellectual Property"
    detection:
      method: "file_extension"
      extensions: [".py", ".java", ".cpp", ".js", ".go"]
      destination: "external"
    action: "BLOCK"
    notification: "Development manager"
    incident_severity: "MEDIUM"
```

### 6.4 DLP Implementation at Endpoints

```bash
# Linux DLP with ossec/wazuh
# Monitor file access to sensitive directories
# /var/ossec/etc/ossec.conf
<syscheck>
  <directories check_all="yes" report_changes="yes" realtime="yes">
    /etc/shadow,/etc/gshadow,/root/.ssh
  </directories>
</syscheck>

# Block USB mass storage (see device control section)

# Monitor file transfers
# Using auditd rules
auditctl -w /home/ -p wa -k file_access
auditctl -a always,exit -F arch=b64 -S connect -k network_connect
```

---

## 7. Security Perspective

### 7.1 Endpoint Attack Chain

```
┌──────────────────────────────────────────────────────────────────┐
│                   ENDPOINT ATTACK KILL CHAIN                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INITIAL ACCESS                                              │
│     ├── Phishing email with malicious attachment                │
│     ├── Drive-by download                                       │
│     ├── USB drop attack                                         │
│     └── Exploiting public-facing application                    │
│                                                                  │
│  2. EXECUTION                                                   │
│     ├── Macro execution (Office documents)                      │
│     ├── PowerShell/batch script execution                       │
│     ├── Exploiting application vulnerability                    │
│     └── LOLBins (Living Off the Land)                           │
│                                                                  │
│  3. PERSISTENCE                                                 │
│     ├── Registry Run keys                                       │
│     ├── Scheduled tasks                                         │
│     ├── Services                                                │
│     ├── DLL hijacking                                          │
│     └── Startup folder                                         │
│                                                                  │
│  4. PRIVILEGE ESCALATION                                        │
│     ├── Kernel exploit (DirtyPipe, DirtyCow)                    │
│     ├── Misconfigured sudo/sudoers                              │
│     ├── Token impersonation                                     │
│     └── DLL search order hijacking                              │
│                                                                  │
│  5. DEFENSE EVASION                                             │
│     ├── Disable antivirus/EDR                                   │
│     ├── Timestomping                                            │
│     ├── Log clearing                                            │
│     └── Process hollowing/injection                             │
│                                                                  │
│  6. CREDENTIAL ACCESS                                           │
│     ├── LSASS memory dump                                       │
│     ├── SAM database extraction                                 │
│     ├── Kerberoasting                                          │
│     └── Credential dumping tools                                │
│                                                                  │
│  7. LATERAL MOVEMENT                                            │
│     ├── PsExec/WMI                                              │
│     ├── RDP hijacking                                           │
│     ├── Pass-the-Hash                                           │
│     └── Shared drive access                                     │
│                                                                  │
│  8. EXFILTRATION                                                │
│     ├── HTTP/S to external C2                                   │
│     ├── DNS tunneling                                           │
│     ├── Encrypted channels                                      │
│     └── Physical media (USB)                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Endpoint Security Countermeasures

| Attack Phase | Endpoint Defense | Tool/Control |
|-------------|-----------------|--------------|
| Initial Access | Email filtering, web proxy | MIMEcast, Zscaler |
| Execution | Application whitelisting, macro blocking | AppLocker, GPO |
| Persistence | File integrity monitoring | Wazuh, Tripwire |
| Privilege Escalation | Patch management, least privilege | WSUS, Ansible |
| Defense Evasion | EDR with tamper protection | CrowdStrike, SentinelOne |
| Credential Access | Credential Guard, LAPS | Windows CredGuard |
| Lateral Movement | Host firewall, network segmentation | Windows Firewall |
| Exfiltration | DLP, egress filtering | Symantec DLP, Zscaler |

---

## 8. Practical Examples

### 8.1 Deploying Wazuh Agent for EDR

```bash
# On the agent endpoint
# Add Wazuh repo and install
curl -sO https://packages.wazuh.com/4.7/wazuh-agent_4.7.0-1_amd64.deb
sudo dpkg -i ./wazuh-agent_4.7.0-1_amd64.deb

# Configure agent
sudo sed -i 's/<address>.*<\/address>/<address>10.0.1.50<\/address>/' /var/ossec/etc/ossec.conf
sudo sed -i 's/<protocol>.*<\/protocol>/<protocol>tcp<\/protocol>/' /var/ossec/etc/ossec.conf

# Enable modules
sudo sed -i 's/<disabled>yes<\/disabled>/<disabled>no<\/disabled>/' /var/ossec/etc/ossec.conf

# Start agent
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent

# Verify connectivity
sudo /var/ossec/bin/agent_control -i 001
```

### 8.2 Configuring Windows Defender Advanced

```powershell
# Enable all protection features
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -DisableBehaviorMonitoring $false
Set-MpPreference -DisableIOAVProtection $false
Set-MpPreference -DisableScriptScanning $false

# Configure cloud protection
Set-MpPreference -MAPSReporting Advanced
Set-MpPreference -SubmitSamplesConsent SendAllSamples

# Enable ASR (Attack Surface Reduction) rules
Add-MpPreference -AttackSurfaceReductionRules_Ids `
  -AttackSurfaceReductionRules_Actions

# Block Office applications from creating child processes
Add-MpPreference -AttackSurfaceReductionRules_Ids `
  "D4F940AB-401B-4EFC-AADC-AD583F9BB6C4" `
  -AttackSurfaceReductionRules_Actions 1

# Block credential stealing from LSASS
Add-MpPreference -AttackSurfaceReductionRules_Ids `
  "9E6C4E1F-7D60-472F-BA1A-A39EF669E4B2" `
  -AttackSurfaceReductionRules_Actions 1

# Configure network protection
Set-MpPreference -EnableNetworkProtection Enabled

# Add exclusion for legitimate software
Add-MpPreference -ExclusionPath "C:\Program Files\LegitimateApp"
```

### 8.3 Linux Host Firewall + DLP Combined

```bash
#!/bin/bash
# endpoint-defense.sh

# 1. Enable iptables
iptables -F
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 2222 -j ACCEPT

# 2. Disable USB storage
echo "blacklist usb-storage" > /etc/modprobe.d/blacklist-usb.conf
depmod -a

# 3. Enable file integrity monitoring (AIDE)
apt install aide
aideinit
# Add to cron: 0 5 * * * /usr/bin/aide --check

# 4. Monitor sensitive files
cat >> /etc/audit/rules.d/monitoring.rules << 'EOF'
-w /etc/shadow -p wa -k credential_access
-w /etc/passwd -p wa -k identity_change
-w /root/.ssh -p wa -k ssh_keys
-w /etc/ssh/sshd_config -p wa -k ssh_config
EOF
augenrules --load

# 5. Enable ClamAV on-access scanning
systemctl enable clamav-daemon
systemctl start clamav-daemon

echo "[+] Endpoint defense hardened"
```

---

## 9. Interview Questions

### Basic

1. **What is the difference between EPP and EDR?**
   - EPP: prevention-focused, signature-based; EDR: detection/response-focused, behavioral analysis

2. **Why use host-based firewalls when network firewalls exist?**
   - Defense-in-depth; network firewalls can't see internal lateral movement; host firewall protects if network FW is bypassed

3. **What is application whitelisting and why is it superior to blacklisting?**
   - Whitelisting allows only known-good apps; blacklisting can't keep up with new malware variants

4. **Name three DLP content inspection methods.**
   - Regex pattern matching, exact data match, document fingerprinting, ML-based classification

5. **What is the purpose of USB device control?**
   - Prevent data exfiltration, malware introduction, and unauthorized device connections

### Intermediate

6. **How does EDR detect fileless malware?**
   - Memory scanning, behavioral analysis (suspicious PowerShell commands), registry monitoring, process injection detection

7. **Explain the difference between blocking and auditing in application whitelisting.**
   - Audit mode: log violations without blocking; enforce mode: prevent execution; start with audit to refine rules

8. **How do you handle false positives in DLP?**
   - Tune regex patterns, add exceptions for business-critical workflows, implement approval workflows for blocked transfers

9. **What is a BadUSB attack and how do you defend against it?**
   - USB device firmware reprogrammed to act as keyboard; defend via device whitelisting, USB port control, user training

10. **How would you implement endpoint security for remote workers?**
    - Cloud-managed EDR, VPN for all traffic, host firewall rules, DLP agents, device compliance checks

### Advanced

11. **Compare CrowdStrike Falcon, SentinelOne, and Microsoft Defender for Endpoint.**
    - CrowdStrike: cloud-native, strong threat intel; SentinelOne: autonomous response; Defender: deep Windows integration, cost-effective

12. **How does process hollowing evade traditional AV?**
    - Injects malicious code into legitimate process memory; AV sees legitimate process name; EDR detects memory anomalies

13. **Design a comprehensive endpoint security architecture for a 10,000-user organization.**
    - EDR on all endpoints + NDR + SIEM integration + DLP + host firewall + application control + patch management + user training

14. **How do you investigate an endpoint that has been isolated by EDR?**
    - Forensic imaging, memory dump analysis, timeline reconstruction, IOC extraction, threat hunting with YARA

15. **What is the future of endpoint security beyond traditional EDR?**
    - XDR (extended detection), AI/ML-driven autonomous response, zero-trust endpoint posture, extended detection and response

---

## 10. Hands-on Labs

### Lab 1: Deploy and Configure Wazuh for EDR

```bash
# On Wazuh server
docker-compose up -d  # Wazuh + ELK stack

# On endpoint
curl -sO https://packages.wazuh.com/4.7/wazuh-agent_4.7.0-1_amd64.deb
sudo dpkg -i ./wazuh-agent_4.7.0-1_amd64.deb
sudo sed -i 's/<address>.*<\/address>/<address>SERVER_IP<\/address>/' /var/ossec/etc/ossec.conf
sudo systemctl start wazuh-agent

# Create detection rule for suspicious PowerShell
cat >> /var/ossec/etc/rules/local_rules.xml << 'EOF'
<group name="windows,">
  <rule id="100100" level="10">
    <if_sid>18101</if_sid>
    <field name="win.eventdata.commandLine" type="pcre2">(?i)(invoke-expression|iex|downloadstring|webclient)</field>
    <description>Suspicious PowerShell execution detected</description>
    <mitre>
      <id>T1059.001</id>
    </mitre>
  </rule>
</group>
EOF
```

### Lab 2: Application Whitelisting with AppLocker

```powershell
# Create basic AppLocker policy
New-AppLockerPolicy -RuleType Publisher,Path,Hash `
  -User Everyone -Deny -Optimize

# Test policy in audit mode
Get-AppLockerPolicy -Local | Test-AppLockerPolicy `
  -Path "C:\Windows\System32\cmd.exe" -User "Everyone"

# Export and view policy
Get-AppLockerPolicy -Local | Export-AppLockerPolicy -Path "C:\applocker-policy.xml"
```

### Lab 3: USB Device Control

```bash
# Linux - USBGuard setup
sudo apt install usbguard
sudo usbguard generate-policy > /etc/usbguard/rules.conf
# Edit rules.conf to allow specific devices only
sudo systemctl enable usbguard

# Test - plug in USB device
usbguard list-devices
usbguard allow-device <DEVICE_ID>
```

### Lab 4: DLP Policy Testing

```bash
# Create test file with credit card numbers
echo "4111-1111-1111-1111" > /tmp/test-cc.txt

# Monitor with ossec/wazuh
/var/ossec/bin/agent_control -R 001

# Check alerts
tail -f /var/ossec/logs/alerts/alerts.log
```

---

## 11. Summary Table

| Topic | Key Concept | Primary Tools | Risk If Ignored |
|-------|------------|---------------|-----------------|
| Antivirus/AM | Signature + behavioral detection | ClamAV, Defender, CrowdStrike | Malware infection |
| EDR | Behavioral detection + response | CrowdStrike, SentinelOne, Wazuh | Undetected breaches |
| Host Firewall | Endpoint traffic control | Windows Firewall, iptables | Lateral movement |
| App Whitelisting | Allow only known-good apps | AppLocker, Carbon Black | Zero-day execution |
| Device Control | Peripheral management | USBGuard, Group Policy | Data exfiltration, BadUSB |
| DLP | Sensitive data protection | Symantec DLP, Microsoft Purview | Data breach, compliance failure |
| EPP vs EDR vs XDR | Evolution of endpoint protection | Varies | Gaps in detection capability |

---

## Resources

**Books:**
- *Practical Endpoint Protection* - No Starch Press
- *The Art of Deception* - Kevin Mitnick
- *Network Security Monitoring* - Richard Bejtlich

**Documentation:**
- Wazuh Documentation: https://documentation.wazuh.com/
- CIS Benchmarks for Endpoint Security
- NIST SP 800-83: Guide to Malware Incident Prevention

**Tools:**
- Wazuh (open-source EDR)
- ClamAV (open-source antivirus)
- YARA (pattern matching)
- ELK Stack (log analysis)
- Sigma Rules (detection rules)

**Labs:**
- DVSA (Damn Vulnerable Semi-Automated Website)
- VulnHub endpoint challenges
- TryHackMe Endpoint Security paths
- CyberDefenders (DFIR challenges)
