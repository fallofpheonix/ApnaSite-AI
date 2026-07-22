# Windows Security Tools

## What is it?

Windows Security Tools are built-in and third-party utilities used to protect, monitor, and audit Windows systems. These include Windows Defender for malware protection, Event Viewer for log analysis, MMC snap-ins for system management, and various policy configuration utilities. They form the core of Windows-native security operations and are essential for system administrators and security professionals.

## Why Learn It?

Native security tools are the first line of defense on Windows systems. Proficiency with these tools enables security professionals to detect threats, investigate incidents, and enforce security policies without relying solely on external solutions. Understanding these tools is critical for compliance, forensics, and day-to-day security operations.

## You Will Learn

- Windows Defender configuration and threat management
- Event Viewer for security log analysis and auditing
- MMC snap-ins for certificate and policy management
- Security policies and Group Policy configuration
- Audit policies and advanced audit policy configuration
- Windows Firewall configuration and management
- Log collection, filtering, and correlation techniques

## Prerequisites

- Windows Architecture
- Basic networking concepts

## Related Topics

- Windows Architecture
- Registry
- Active Directory
- PowerShell

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
│                    SECURITY TOOLS LAYER                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Windows  │ │ Event    │ │ MMC      │ │  Security        │   │
│  │ Defender │ │ Viewer   │ │ Snap-ins │ │  Policy Editor   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │             │            │                 │             │
│  ┌────┴─────────────┴────────────┴─────────────────┴──────────┐ │
│  │              Management Console (mmc.exe)                   │ │
│  │              Microsoft Management Console                    │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    OS SERVICES LAYER                             │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │ WinDefend│ │ EventLog │ │ PolicyAgent│ │ MPSSVC  │     │ │
│  │  │ Service  │ │ Service  │ │ (GroupPol)│ │(Firewall)│     │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    KERNEL / DRIVER LAYER                         │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │ WdFilter │ │ WdNisDrv │ │ tcpip.sys│ │ wfps drv │     │ │
│  │  │ (File    │ │ (Network │ │ (Network │ │ (WFP     │     │ │
│  │  │  System) │ │  inspect)│ │  stack)  │ │  callout)│     │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Internal Architecture

### 2.1 Windows Defender Architecture

```
Windows Defender Architecture
═════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│                    Windows Defender                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ User-Mode Service (WinDefend)                         │    │
│  │ ├─ Real-time protection engine                        │    │
│  │ ├─ Cloud-delivered protection                         │    │
│  │ ├─ Automatic sample submission                         │    │
│  │ ├─ Signature update service                           │    │
│  │ └─ Threat remediation                                 │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Kernel-Mode Drivers                                   │    │
│  │ ├─ WdFilter.sys — File system minifilter              │    │
│  │ │   Monitors file I/O in real-time                    │    │
│  │ ├─ WdNisDrv.sys — Network inspection system          │    │
│  │ │   Inspects network traffic for threats              │    │
│  │ └─ WdBoot.sys — Early boot anti-cheat                │    │
│  │     Validates boot integrity                          │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ AMSI Integration                                       │    │
│  │ ├─ Scans PowerShell scripts before execution          │    │
│  │ ├─ Scans VBScript, JScript, .NET                      │    │
│  │ └─ Provides content to AMSI provider interface        │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Protection Layers                                      │    │
│  │ ├─ Real-time scanning (on-access)                     │    │
│  │ ├─ Cloud protection (rapid response)                  │    │
│  │ ├─ Behavior monitoring (heuristics)                   │    │
│  │ ├─ Network inspection (IPS)                           │    │
│  │ ├─ Controlled folder access (ransomware)             │    │
│  │ ├─ Attack surface reduction (ASR) rules              │    │
│  │ └─ Exploit protection (EMET successor)               │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Event Log Architecture

```
Windows Event Log Architecture
══════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│                    Event Sources                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Windows  │ │ Security │ │ Applic-  │ │ Setup    │       │
│  │ Logs     │ │ Audit    │ │ ation    │ │ Events   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │             │            │             │              │
│  ┌────┴─────────────┴────────────┴─────────────┴──────────┐  │
│  │           Event Logging Service (wevtsvc.dll)           │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  Channel    │  File               │  Description        │  │
│  ├─────────────┼─────────────────────┼─────────────────────┤  │
│  │ Security    │ Security.evtx       │ Audit events        │  │
│  │ System      │ System.evtx         │ System events       │  │
│  │ Application │ Application.evtx    │ Application events  │  │
│  │ Setup       │ Setup.evtx          │ Installation events │  │
│  │ Forwarded   │ ForwardedEvents.evtx│ Collected events    │  │
│  │ PowerShell  │ Microsoft-Windows-  │ PS operational      │  │
│  │             │ PowerShell/         │                     │  │
│  │             │ Operational.evtx    │                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Windows Event Collector (WEC)                  │  │
│  │  ├─ Subscriptions (source → collector)                  │  │
│  │  ├─ WinRM-based transport                              │  │
│  │  └─ Centralized log management                         │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown Table

### 3.1 Windows Defender Components

| Component | File/Service | Purpose |
|-----------|-------------|---------|
| **WinDefend** | WinDefend (service) | Main AV service |
| **WdFilter** | WdFilter.sys | File system minifilter (real-time) |
| **WdNisDrv** | WdNisDrv.sys | Network inspection driver |
| **WdBoot** | WdBoot.sys | Early boot protection |
| **SecurityHealthService** | SecurityHealthService.sys | Security center integration |
| **MpCmdRun** | MpCmdRun.exe | CLI for scanning |
| **MpGearCmd** | MpGearCmd.exe | ASR rules management |
| **NisSrv** | NisSrv.exe | Network inspection service |
| **MsMpEng** | MsMpEng.exe | Antimalware engine |

### 3.2 Event Viewer Components

| Component | Purpose |
|-----------|---------|
| **Event Viewer** | GUI for viewing event logs |
| **wevtutil.exe** | CLI for event log management |
| **Get-WinEvent** | PowerShell cmdlet for events |
| **Forwarded Events** | Centralized event collection |
| **Custom Views** | Filtered event views |
| **Event Subscriptions** | WEC-based collection |
| **XML Query** | Advanced event filtering |

### 3.3 MMC Snap-ins

| Snap-in | Purpose |
|---------|---------|
| **certlm.msc** | Local computer certificates |
| **certmgr.msc** | Current user certificates |
| **secpol.msc** | Local security policy |
| **gpedit.msc** | Local Group Policy editor |
| **services.msc** | Service management |
| **devmgmt.msc** | Device Manager |
| **diskmgmt.msc** | Disk Management |
| **compmgmt.msc** | Computer Management |
| **eventvwr.msc** | Event Viewer |
| **fsmgmt.msc** | Shared folders |

### 3.4 Security Policy Components

| Policy Area | Tool | Description |
|-------------|------|-------------|
| **Account Policies** | secpol.msc | Password, account lockout, Kerberos |
| **Local Policies** | secpol.msc | Audit, user rights, security options |
| **Windows Firewall** | wf.msc | Inbound/outbound rules |
| **Advanced Audit** | AuditPol | Granular audit policy |
| **Software Restriction** | gpedit.msc | SRP policies |
| **AppLocker** | gpedit.msc | Application whitelisting |
| **WDAC** | gpedit.msc / XML | Windows Defender Application Control |

---

## 4. Data Flow Diagram

### 4.1 Malware Detection Flow

```
File I/O Request
    │
    ▼
┌─────────────────────────────────────────────┐
│ WdFilter.sys (File System Minifilter)        │
│ ├─ Intercepts file create/read/execute       │
│ ├─ Passes content to user-mode engine        │
│ └─ Blocks if threat detected                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ MsMpEng.exe (Antimalware Engine)             │
│ ├─ Signature-based detection                 │
│ ├─ Heuristic analysis                        │
│ ├─ Behavioral monitoring                     │
│ └─ Cloud query (if enabled)                  │
└──────────────┬──────────────────────────────┘
               │
               ├── Threat Found ──► Quarantine / Remove
               │
               └── Clean ──► Allow I/O to complete
```

### 4.2 Event Log Flow

```
Application/Service generates event
    │
    ▼
Event Logging Service (wevtsvc.dll)
    │
    ├──► Write to Channel File (.evtx)
    │    ├─ Security.evtx
    │    ├─ System.evtx
    │    ├─ Application.evtx
    │    └─ Custom channels
    │
    ├──► Forward to Collector (if subscribed)
    │    └─ WEC Server → ForwardedEvents.evtx
    │
    └──► Notify Subscribers
         ├─ Event Viewer (real-time)
         ├─ SIEM (via agent)
         └─ Custom consumers (WMI, timer)
```

### 4.3 Firewall Packet Flow

```
Network Packet
    │
    ▼
┌─────────────────────────────────────────────┐
│ Windows Filtering Platform (WFP)             │
│ ├─ tcpip.sys (network stack)                │
│ ├─ Filtering layers:                        │
│ │   ├─ WFP_LAYER_ALE_RESOURCE_ASSIGNMENT    │
│ │   ├─ WFP_LAYER_ALE_AUTH_CONNECT           │
│ │   ├─ WFP_LAYER_ALE_AUTH_RECV_ACCEPT       │
│ │   ├─ WFP_LAYER_OUTBOUND_IPPACKET         │
│ │   └─ WFP_LAYER_INBOUND_IPPACKET          │
│ └─ Callout drivers for deep inspection      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Windows Defender Firewall Service (mpssvc)   │
│ ├─ Rule evaluation                           │
│ │   ├─ Block rules (deny first)             │
│ │   └─ Allow rules (permit)                 │
│ ├─ Connection security rules (IPsec)        │
│ └─ Authenticated exceptions                 │
└──────────────┬──────────────────────────────┘
               │
               ├── Allowed ──► Forward to application
               └── Blocked ──► Drop packet / Log
```

---

## 5. Security Perspective

### 5.1 Windows Defender Configuration

```powershell
# Check Defender status
Get-MpComputerStatus

# Enable real-time protection
Set-MpPreference -DisableRealtimeMonitoring $false

# Enable cloud protection
Set-MpPreference -MAPSReporting Advanced

# Enable ASR rules
Add-MpPreference -AttackSurfaceReductionRules_Ids <GUID> `
    -AttackSurfaceReductionRules_Actions Enabled

# Enable controlled folder access
Set-MpPreference -EnableControlledFolderAccess Enabled

# Add exclusion (for legitimate tools)
Add-MpPreference -ExclusionPath "C:\Tools"

# Run full scan
Start-MpScan -ScanType FullScan

# Update signatures
Update-MpSignature
```

### 5.2 Event Log Security Events

| Event ID | Description | Importance |
|----------|-------------|------------|
| **4624** | Successful logon | Track access |
| **4625** | Failed logon | Detect brute force |
| **4634/4647** | Logoff | Session tracking |
| **4648** | Explicit credential logon | Lateral movement |
| **4672** | Special privileges assigned | Admin logon |
| **4688** | New process created | Process monitoring |
| **4689** | Process terminated | Process tracking |
| **4697** | Service installed | Persistence detection |
| **4698** | Scheduled task created | Persistence detection |
| **4699** | Scheduled task deleted | Cleanup detection |
| **4700/4701/4702** | Task enabled/disabled/updated | Task manipulation |
| **4720** | User account created | New account detection |
| **4722/4725** | Account enabled/disabled | Account changes |
| **4726** | User account deleted | Cleanup detection |
| **4728/4732/4756** | Member added to group | Privilege escalation |
| **4738** | User account changed | Attribute modification |
| **4756** | Member added to universal group | Group membership |
| **4768** | TGT requested (Kerberos) | Authentication |
| **4769** | Service ticket requested | Service access |
| **4771** | Kerberos pre-auth failed | Password attack |
| **4776** | NTLM authentication | NTLM usage |
| **5140** | Network share accessed | SMB access |
| **5145** | Network share object access | Detailed share audit |

### 5.3 Advanced Audit Policy

```
Audit Policy Configuration
═══════════════════════════

Category                    │ Subcategory                   │ Setting
────────────────────────────┼───────────────────────────────┼────────
Account Logon               │ Credential Validation         │ Success/Failure
                            │ Kerberos Authentication       │ Success/Failure
                            │ Kerberos Service Ticket       │ Success
                            │ Other Account Logon           │ Success/Failure
Account Management          │ User Account Management       │ Success
                            │ Security Group Management     │ Success
                            │ Computer Account Management   │ Success
DS Access                   │ Directory Service Access       │ Success
                            │ Directory Service Changes      │ Success
Logon/Logoff                │ Logon                         │ Success/Failure
                            │ Logoff                        │ Success
                            │ Special Logon                 │ Success
                            │ Network Policy Server         │ Success/Failure
Object Access               │ File System                   │ Success/Failure
                            │ Registry                      │ Success/Failure
                            │ File Share                    │ Success
                            │ Detailed File Share           │ Success
Policy Change               │ Audit Policy Change           │ Success
                            │ Authentication Policy Change   │ Success
                            │ Authorization Policy Change    │ Success
Privilege Use               │ Sensitive Privilege Use        │ Success
                            │ Other Privilege Use           │ Success
System                      │ IPsec Driver                   │ Success
                            │ Security System Extension      │ Success
                            │ System Integrity               │ Success
```

```powershell
# View current audit policy
auditpol /get /category:*

# Set audit policy
auditpol /set /subcategory:"Logon" /success:enable /failure:enable

# Set by GUID
auditpol /set /subcategory:{0CCE9210-69AE-11D2-BD3B-00105A1F8308} /success:enable

# Backup audit policy
auditpol /backup /file:C:\auditpolicy.csv

# Restore audit policy
auditpol /restore /file:C:\auditpolicy.csv
```

### 5.4 Windows Firewall Configuration

```powershell
# View firewall status
Get-NetFirewallProfile | Select-Object Name, Enabled

# Enable firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Block inbound by default
Set-NetFirewallProfile -DefaultInboundAction Block

# Create allow rule
New-NetFirewallRule -DisplayName "Allow HTTP" `
    -Direction Inbound -Protocol TCP -LocalPort 80 `
    -Action Allow -Profile Domain

# Create block rule
New-NetFirewallRule -DisplayName "Block Telnet" `
    -Direction Inbound -Protocol TCP -LocalPort 23 `
    -Action Block -Profile Any

# View all rules
Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' }

# Export rules
netsh advfirewall export "C:\firewall-rules.wfw"
```

---

## 6. Component Breakdown: Security Tools

### 6.1 Tool Comparison Matrix

| Tool | Type | Purpose | Key Feature |
|------|------|---------|-------------|
| **Windows Defender** | Built-in | Antivirus/malware | Real-time, AMSI, ASR |
| **Event Viewer** | Built-in | Log analysis | Event filtering, custom views |
| **MMC** | Built-in | System management | Snap-in extensibility |
| **secpol.msc** | Built-in | Security policy | Account, audit, user rights |
| **gpedit.msc** | Built-in | Group Policy | Local policy configuration |
| **wf.msc** | Built-in | Firewall | Rule-based filtering |
| **certlm.msc** | Built-in | Certificates | PKI management |
| **AuditPol** | CLI | Audit policy | Granular audit control |
| **wevtutil** | CLI | Event management | Log export, clear, query |
| **netsh** | CLI | Network config | Firewall, IPsec, WLAN |
| **PowerShell** | Scripting | Automation | All tools via cmdlets |
| **Sysinternals** | Third-party | Diagnostics | Process Monitor, Autoruns |

### 6.2 MMC Snap-in Hierarchy

```
mmc.exe (Management Console)
├─ snapin1.msc (Custom Console)
│   ├─ Event Viewer
│   │   ├─ Windows Logs
│   │   │   ├─ Security
│   │   │   ├─ System
│   │   │   ├─ Application
│   │   │   └─ Setup
│   │   ├─ Applications and Services
│   │   └─ Custom Views
│   ├─ Certificates
│   │   ├─ Personal
│   │   ├─ Trusted Root CAs
│   │   └─ Intermediate CAs
│   ├─ Services
│   │   ├─ Windows Defender
│   │   ├─ Event Log
│   │   └─ Windows Firewall
│   └─ Local Users and Groups
│       ├─ Users
│       └─ Groups
```

---

## 7. Attack Surface

### 7.1 Security Tool Attack Vectors

| Target | Attack | Description |
|--------|--------|-------------|
| **Defender** | Disable/Uninstall | Stop AV protection |
| **Defender** | Exclusion abuse | Add malicious paths to exclusions |
| **Defender** | Signature evasion | Polymorphic/metamorphic malware |
| **Defender** | AMSI bypass | Patch AMSI in memory |
| **Event Logs** | Clear logs | Remove evidence |
| **Event Logs** | Disable logging | Stop event generation |
| **Event Logs** | Log injection | Insert false events |
| **Firewall** | Add allow rules | Open ports for C2 |
| **Firewall** | Disable profiles | Remove all filtering |
| **Audit Policy** | Disable auditing | Stop recording events |
| **GPO** | Modify policies | Weaken security settings |
| **Services** | Modify service config | Change service binary path |

### 7.2 Defense Against Tool Manipulation

```
Security Tool Hardening
═══════════════════════

1. Protect Windows Defender
   ├─ Enable Tamper Protection
   ├─ Enable Cloud Protection
   ├─ Configure ASR rules
   ├─ Enable Controlled Folder Access
   └─ Monitor Defender health via Security Center

2. Protect Event Logs
   ├─ Enable log protection (GPO)
   ├─ Forward logs to remote collector
   ├─ Use SIEM for centralized logging
   ├─ Monitor for log clearing (Event ID 1102)
   └─ Enable audit policy for log access

3. Protect Firewall
   ├─ Enable all profiles (Domain, Private, Public)
   ├─ Block inbound by default
   ├─ Require authentication for rule changes
   ├─ Monitor rule modifications
   └─ Use GPO to enforce firewall settings

4. Protect Audit Policy
   ├─ Use Advanced Audit Policy (not basic)
   ├─ Configure via GPO (prevent local changes)
   ├─ Forward audit events to SIEM
   └─ Monitor for policy changes

5. General Hardening
   ├─ Restrict admin access
   ├─ Enable UAC
   ├─ Use LAPS for local admin passwords
   ├─ Enable Credential Guard
   └─ Monitor with SIEM
```

---

## 8. Debugging Perspective

### 8.1 Event Log Debugging

```powershell
# Query events with XML filter
Get-WinEvent -FilterXml @"
<QueryList>
  <Query Id="0" Path="Security">
    <Select Path="Security">
      *[System[(EventID=4624 or EventID=4625)]]
      and
      *[EventData[Data[@Name='TargetUserName'] != 'SYSTEM']]
    </Select>
  </Query>
</QueryList>
"@

# Real-time event monitoring
$watcher = New-Object System.Diagnostics.Eventing.Reader.EventLogWatcher("Security")
Register-ObjectEvent $watcher EventRecordWritten -Action {
    Write-Host $EventArgs.EventRecord.Message
}
$watcher.Enabled = $true

# Export events to CSV
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} |
    Select-Object TimeCreated, Message |
    Export-Csv -Path "C:\logons.csv" -NoTypeInformation
```

### 8.2 Defender Debugging

```powershell
# Get Defender threat history
Get-MpThreatDetection | Select-Object ThreatID, DomainUser, ProcessName, InitialDetectionTime

# Get threat details
Get-MpThreat | Select-Object ThreatID, IsActive, Resources, SeverityID

# Check protection status
Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled,
    OnAccessProtectionEnabled,
    BehaviorMonitorEnabled,
    IoavProtectionEnabled,
    NISEnabled,
    AntivirusEnabled

# Check ASR rules
Get-MpPreference | Select-Object -ExpandProperty AttackSurfaceReductionRules_Ids
Get-MpPreference | Select-Object -ExpandProperty AttackSurfaceReductionRules_Actions

# Defender logs
Get-WinEvent -LogName "Microsoft-Windows-Windows Defender/Operational" |
    Select-Object TimeCreated, Id, Message -First 20
```

### 8.3 Firewall Debugging

```powershell
# Check firewall logs
Get-Content "C:\Windows\System32\LogFiles\Firewall\pfirewall.log" -Tail 50

# Monitor firewall drops
Get-NetFirewallProfile | Select-Object LogBlocked

# Check active connections
Get-NetTCPConnection -State Established |
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess,
    @{N='ProcessName';E={(Get-Process -Id $_.OwningProcess).ProcessName}}

# View firewall rule hit counts
Get-NetFirewallRule | Where-Object { $_.Direction -eq 'Inbound' } |
    Select-Object DisplayName, Enabled, Action, @{N='Hits';E={
        (Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_).LocalPort
    }}
```

---

## 9. Reverse Engineering Perspective

### 9.1 Event Log File Format

```
Windows Event Log (.evtx) Format
═════════════════════════════════

File Structure:
┌──────────────────────────────────────────┐
│ File Header                              │
│ ├─ Signature ("ElfFile")                │
│ ├─ First chunk number                    │
│ ├─ Last chunk number                     │
│ ├─ Next record identifier                │
│ └─ Header size                           │
├──────────────────────────────────────────┤
│ Chunk 0                                  │
│ ├─ Chunk header                          │
│ │   ├─ Signature ("ElfChnk")            │
│ │   ├─ First event record number         │
│ │   ├─ Last event record number          │
│ │   └─ Checksum                          │
│ ├─ XML template table                    │
│ ├─ Event records                         │
│ │   ├─ Record header                     │
│ │   ├─ Size                              │
│ │   ├─ Event ID                          │
│ │   ├─ Timestamp                         │
│ │   ├─ Provider GUID                     │
│ │   └─ XML data                          │
│ └─ Free space                            │
├──────────────────────────────────────────┤
│ Chunk 1                                  │
│ └─ ...                                   │
└──────────────────────────────────────────┘

Key Event IDs for Security Analysis:
- 4624/4625: Logon success/failure
- 4688: Process creation
- 4720: Account creation
- 4732: Group membership
- 4768/4769: Kerberos tickets
- 5140: Share access
- 1102: Log cleared
```

### 9.2 Parsing Event Logs

```python
# Python script to parse evtx files
import Evtx.Evtx as evtx
import Evtx.Views as views

with evtx.Evtx("C:\\Windows\\System32\\Winevt\\Logs\\Security.evtx") as log:
    for record in log.records():
        print(f"Time: {record.timestamp()}")
        print(f"Event ID: {record.event_id()}")
        print(f"XML: {record.xml()}")
```

---

## 10. Practical Examples

### Example 1: Security Health Check

```powershell
function Get-SecurityHealth {
    Write-Host "=== Security Health Check ===" -ForegroundColor Yellow

    # 1. Windows Defender Status
    $defender = Get-MpComputerStatus
    Write-Host "`n[Defender]" -ForegroundColor Cyan
    Write-Host "  Real-time Protection: $($defender.RealTimeProtectionEnabled)"
    Write-Host "  Behavior Monitor: $($defender.BehaviorMonitorEnabled)"
    Write-Host "  Cloud Protection: $($defender.CloudProtectionEnabled)"
    Write-Host "  Signature Version: $($defender.AntivirusSignatureVersion)"
    Write-Host "  Signature Last Updated: $($defender.AntivirusSignatureLastUpdated)"

    # 2. Firewall Status
    $firewall = Get-NetFirewallProfile
    Write-Host "`n[Firewall]" -ForegroundColor Cyan
    foreach ($fw in $firewall) {
        Write-Host "  $($fw.Name): $($fw.Enabled)"
    }

    # 3. Audit Policy
    Write-Host "`n[Audit Policy]" -ForegroundColor Cyan
    $audit = auditpol /get /category:"Logon" 2>$null
    Write-Host "  $audit"

    # 4. PowerShell Logging
    $sbLog = Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" `
        -Name "EnableScriptBlockLogging" -ErrorAction SilentlyContinue
    Write-Host "`n[PowerShell Logging]" -ForegroundColor Cyan
    Write-Host "  Script Block Logging: $(if ($sbLog) {'Enabled'} else {'Disabled'})"

    # 5. Recent Security Events
    Write-Host "`n[Recent Security Events]" -ForegroundColor Cyan
    $recentEvents = Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624,4625} `
        -MaxEvents 5 -ErrorAction SilentlyContinue
    $recentEvents | ForEach-Object {
        Write-Host "  $($_.TimeCreated) - Event $($_.Id)"
    }
}

Get-SecurityHealth
```

### Example 2: Event Log Analysis Script

```powershell
function Find-SuspiciousActivity {
    param(
        [int]$Hours = 24
    )

    $startDate = (Get-Date).AddHours(-$Hours)

    Write-Host "=== Suspicious Activity Report (Last $Hours hours) ===" -ForegroundColor Yellow

    # 1. Failed Logons
    $failedLogons = Get-WinEvent -FilterHashtable @{
        LogName='Security'; ID=4625; StartTime=$startDate
    } -ErrorAction SilentlyContinue
    Write-Host "`n[Failed Logons]: $($failedLogons.Count)" -ForegroundColor Red

    # 2. New Processes (non-standard)
    $newProcesses = Get-WinEvent -FilterHashtable @{
        LogName='Security'; ID=4688; StartTime=$startDate
    } -ErrorAction SilentlyContinue |
    Where-Object { $_.Message -match "powershell|cmd\.exe|wscript|cscript|mshta" }
    Write-Host "`n[Suspicious Process Creations]: $($newProcesses.Count)" -ForegroundColor Red

    # 3. Log Cleared
    $logCleared = Get-WinEvent -FilterHashtable @{
        LogName='Security'; ID=1102; StartTime=$startDate
    } -ErrorAction SilentlyContinue
    if ($logCleared) {
        Write-Host "`n[ALERT] Security Log Was Cleared!" -ForegroundColor Red
    }

    # 4. New Scheduled Tasks
    $scheduledTasks = Get-WinEvent -FilterHashtable @{
        LogName='Security'; ID=4698; StartTime=$startDate
    } -ErrorAction SilentlyContinue
    Write-Host "`n[New Scheduled Tasks]: $($scheduledTasks.Count)" -ForegroundColor Yellow

    # 5. Service Installed
    $services = Get-WinEvent -FilterHashtable @{
        LogName='Security'; ID=4697; StartTime=$startDate
    } -ErrorAction SilentlyContinue
    Write-Host "`n[Services Installed]: $($services.Count)" -ForegroundColor Yellow
}

Find-SuspiciousActivity -Hours 48
```

### Example 3: Firewall Rule Audit

```powershell
function Get-FirewallAudit {
    Write-Host "=== Firewall Rule Audit ===" -ForegroundColor Yellow

    # All enabled inbound allow rules
    $allowRules = Get-NetFirewallRule -Direction Inbound -Enabled True -Action Allow |
        Select-Object DisplayName, Profile,
            @{N='LocalPort';E={(Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_).LocalPort}}

    Write-Host "`nInbound Allow Rules:" -ForegroundColor Cyan
    $allowRules | Format-Table -AutoSize

    # Rules allowing all ports
    $anyPort = $allowRules | Where-Object { $_.LocalPort -eq "Any" -or $_.LocalPort -eq "0" }
    if ($anyPort) {
        Write-Host "[WARNING] Rules allowing ALL ports:" -ForegroundColor Red
        $anyPort | Format-Table
    }

    # Rules from non-standard profiles
    $publicAllow = Get-NetFirewallRule -Direction Inbound -Enabled True -Action Allow -Profile Public |
        Select-Object DisplayName
    if ($publicAllow) {
        Write-Host "`nPublic Profile Allow Rules:" -ForegroundColor Red
        $publicAllow | Format-Table
    }
}

Get-FirewallAudit
```

---

## 11. Interview Questions

1. **What is Windows Defender's architecture?**
   Defender consists of user-mode services (WinDefend, MsMpEng) and kernel-mode drivers (WdFilter for file system, WdNisDrv for network). It provides real-time scanning, cloud protection, behavioral monitoring, ASR rules, and AMSI integration.

2. **How does the Windows Event Log system work?**
   Applications and services generate events via the Event Logging Service (wevtsvc.dll). Events are written to .evtx files organized by channel (Security, System, Application). Events can be queried, forwarded to collectors, and consumed by SIEMs.

3. **What are the key Security event IDs to monitor?**
   4624/4625 (logon success/failure), 4672 (special privileges), 4688 (process creation), 4697/4698 (service/task installation), 4720 (account creation), 4732 (group membership), 4768/4769 (Kerberos), 1102 (log cleared).

4. **How do you configure Advanced Audit Policy?**
   Use `auditpol` CLI or Group Policy (Computer Configuration > Windows Settings > Security Settings > Advanced Audit Policy). Enable specific subcategories rather than broad categories for granular control.

5. **What is the Windows Filtering Platform (WFP)?**
   WFP is the kernel-mode framework that implements Windows Firewall. It provides multiple filtering layers (ALE, transport, application) where callout drivers can inspect and filter network traffic.

6. **How does Windows Defender's AMSI integration work?**
   PowerShell sends script content to the AMSI provider (Windows Defender) before execution. The content is scanned for malicious patterns. If detected, AMSI blocks execution with AMSI_RESULT_DETECTED.

7. **What is the difference between secpol.msc and gpedit.msc?**
   secpol.msc manages local security policies (audit, user rights, account policies). gpedit.msc manages local Group Policy (broader scope including software installation, scripts, folder redirection). In a domain, GPOs override local settings.

8. **How do you forward events to a central collector?**
   Use Windows Event Collector (WEC) service. Create subscriptions on the collector, configure source computers to forward events via WinRM. Events are stored in ForwardedEvents.evtx on the collector.

9. **What is ASR (Attack Surface Reduction) in Defender?**
   ASR rules reduce the attack surface by blocking specific malicious behaviors: Office macros, script execution, credential theft, process injection, etc. Rules can be configured in audit or block mode.

10. **How do you protect event logs from tampering?**
    Enable log protection via GPO, forward logs to remote collectors, use SIEM for centralized logging, monitor for Event ID 1102 (log cleared), and configure audit policy for log access events.

---

## 12. Hands-on Labs

### Lab 1: Windows Defender Configuration

```powershell
# 1. Check current status
Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled,
    BehaviorMonitorEnabled, CloudProtectionEnabled

# 2. Enable ASR rules (audit mode first)
$asrRules = @(
    "56a863a9-875e-4185-98a7-b882c64b5ce5"  # Block Office macros
    "7674ba52-37eb-4a4f-a9a1-f0f9a1619a2c"  # Block script execution
)

foreach ($rule in $asrRules) {
    Add-MpPreference -AttackSurfaceReductionRules_Ids $rule `
        -AttackSurfaceReductionRules_Actions 2  # Audit mode
}

# 3. Enable controlled folder access
Set-MpPreference -EnableControlledFolderAccess Enabled

# 4. Add exclusion for development tools
Add-MpPreference -ExclusionPath "C:\DevTools"

# 5. Run a scan and review results
Start-MpScan -ScanType QuickScan
Get-MpThreatDetection | Select-Object ThreatID, ProcessName, InitialDetectionTime
```

### Lab 2: Event Log Analysis

```powershell
# 1. Export Security log to CSV
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} -MaxEvents 1000 |
    Select-Object TimeCreated, Message |
    Export-Csv "C:\SecurityLogons.csv" -NoTypeInformation

# 2. Create custom view in Event Viewer
# Open Event Viewer > Custom Views > Create Custom View
# Filter: Security log, Event ID 4624,4625
# Save as "Authentication Events"

# 3. Query with XML filter
Get-WinEvent -FilterXml @"
<QueryList>
  <Query Id="0" Path="Security">
    <Select Path="Security">
      *[System[(EventID=4625)]]
    </Select>
  </Query>
</QueryList>
"@ | Select-Object TimeCreated, Message -First 20

# 4. Set up event forwarding
# On collector: wecutil qc
# On source: winrm quickconfig
# Create subscription in Event Viewer
```

### Lab 3: Firewall Hardening

```powershell
# 1. Enable all firewall profiles
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True

# 2. Set default inbound to block
Set-NetFirewallProfile -DefaultInboundAction Block

# 3. Create specific allow rules
New-NetFirewallRule -DisplayName "Allow RDP" `
    -Direction Inbound -Protocol TCP -LocalPort 3389 `
    -Action Allow -Profile Domain

New-NetFirewallRule -DisplayName "Allow HTTPS" `
    -Direction Inbound -Protocol TCP -LocalPort 443 `
    -Action Allow -Profile Domain,Private

# 4. Block dangerous protocols
New-NetFirewallRule -DisplayName "Block Telnet" `
    -Direction Inbound -Protocol TCP -LocalPort 23 `
    -Action Block -Profile Any

New-NetFirewallRule -DisplayName "Block SMB External" `
    -Direction Inbound -Protocol TCP -LocalPort 445 `
    -Action Block -Profile Public

# 5. Export and review
netsh advfirewall export "C:\FirewallBackup.wfw"
Get-NetFirewallRule -Direction Inbound -Enabled True | Select-Object DisplayName, Action
```

### Lab 4: Audit Policy Configuration

```powershell
# 1. View current audit policy
auditpol /get /category:*

# 2. Enable advanced audit policy via GPO
# Computer Configuration > Windows Settings > Security Settings >
# Advanced Audit Policy Configuration > Audit Policies

# 3. Set specific subcategories
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Special Logon" /success:enable
auditpol /set /subcategory:"Process Creation" /success:enable
auditpol /set /subcategory:"File System" /success:enable /failure:enable
auditpol /set /subcategory:"Registry" /success:enable /failure:enable

# 4. Enable command line auditing in process creation
Set-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" `
    -Name "ProcessCreationIncludeCmdLine_Enabled" -Value 1

# 5. Verify
auditpol /get /subcategory:"Process Creation"
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" `
    -Name "ProcessCreationIncludeCmdLine_Enabled"
```

### Lab 5: MMC Custom Console

```
1. Open mmc.exe (Run as Administrator)
2. File > Add/Remove Snap-in
3. Add the following snap-ins:
   - Event Viewer (Local Computer)
   - Certificates (Local Computer)
   - Services (Local Computer)
   - Local Users and Groups
4. File > Save As > "SecurityConsole.msc"
5. Create custom views:
   - Right-click Custom Views > Create Custom View
   - Filter: Security log, Event IDs 4624,4625,4672,4688
   - Save as "Security Events"
6. Save and test opening the console
```

---

## 13. Summary Table

| Topic | Key Takeaway |
|-------|-------------|
| **Windows Defender** | Multi-layered AV: kernel drivers (WdFilter, WdNisDrv) + user-mode engine + AMSI |
| **Real-time Protection** | File system minifilter intercepts I/O, sends to engine for scanning |
| **ASR Rules** | Block specific malicious behaviors (Office macros, script execution, etc.) |
| **AMSI** | Scans script content before execution; PowerShell/VBScript/.NET integration |
| **Event Viewer** | GUI for .evtx log files; channels: Security, System, Application, Setup |
| **wevtutil** | CLI for event log management (query, export, clear) |
| **Get-WinEvent** | PowerShell cmdlet with XML/filter hash queries |
| **Event Forwarding** | WEC service collects events from multiple sources to central collector |
| **Advanced Audit** | Granular audit subcategories via auditpol CLI or GPO |
| **Key Event IDs** | 4624/4625 (logon), 4672 (privileges), 4688 (process), 1102 (log cleared) |
| **MMC** | Management Console hosting snap-ins for certificates, services, policies |
| **secpol.msc** | Local security policy (accounts, audit, user rights) |
| **gpedit.msc** | Local Group Policy editor |
| **Windows Firewall** | WFP-based; rule evaluation; profiles: Domain, Private, Public |
| **NetFirewall** | PowerShell cmdlets for firewall management |
| **Tamper Protection** | Prevents modification of Defender settings |
| **Controlled Folder Access** | Ransomware protection for user folders |
| **Event Log Protection** | Remote forwarding, SIEM, audit for log clearing |

---

## Resources

Books:
- *Windows Security Monitoring* — SergiyAW
- *Mastering Windows Security and Hardening* — Russell Thomas
- *Windows Incident Response* — Matt Harpster

Videos:
- Microsoft Ignite security sessions
- DEF CON / Black Hat Windows security talks
- John Savill's Windows security YouTube channel

Documentation:
- [Microsoft Defender Documentation](https://learn.microsoft.com/en-us/microsoft-365/security/defender/)
- [Windows Event Log](https://learn.microsoft.com/en-us/windows/win32/wes/windows-event-log)
- [Advanced Audit Policy](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/advanced-audit-policy-configuration)
- [Windows Firewall](https://learn.microsoft.com/en-us/windows/security/operating-system-security/networking/windows-firewall/)

Tools:
- Sysinternals Suite — https://learn.microsoft.com/en-us/sysinternals/
- Autoruns — https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns
- Process Monitor — https://learn.microsoft.com/en-us/sysinternals/downloads/procmon
- Wireshark — https://www.wireshark.org/
