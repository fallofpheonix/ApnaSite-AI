# Registry

## What is it?

The Windows Registry is a hierarchical database that stores configuration settings and options for the operating system, hardware devices, installed applications, and user preferences. It replaces the legacy INI files and provides a centralized, structured mechanism for system configuration. The registry is accessed through the Registry Editor (regedit.exe), PowerShell, and the Win32 API (RegOpenKeyEx, RegSetValueEx, etc.).

## Why Learn It?

Attackers frequently abuse the registry to establish persistence, escalate privileges, disable security features, and modify system behavior. Security professionals must understand registry structure to detect malicious changes, harden systems, and perform forensic analysis during incident response. Registry analysis is a core skill in malware analysis, threat hunting, and digital forensics.

## You Will Learn

- Registry hive structure (HKLM, HKCU, etc.)
- Registry keys, values, types, and their purposes
- Registry persistence mechanisms and autostart locations
- Registry security (ACLs, ownership, auditing)
- Registry analysis tools and techniques
- Common attack techniques leveraging the registry
- Registry backup and recovery
- Registry forensics

## Prerequisites

- Windows Architecture
- Basic understanding of Windows file system

## Related Topics

- Windows Architecture
- Active Directory
- Windows Security Tools
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
│                    APPLICATION LAYER                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Registry │ │ PowerShell│ │  Group   │ │  Third-Party     │   │
│  │ Editor   │ │ (Get-Item)│ │  Policy  │ │  Tools           │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │             │            │                 │             │
│  ┌────┴─────────────┴────────────┴─────────────────┴──────────┐ │
│  │              Win32 API (Advapi32.dll)                      │ │
│  │              RegOpenKeyEx / RegSetValueEx / etc.            │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    KERNEL MODE                                   │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │         Configuration Manager (ntoskrnl.exe)               │ │
│  │  ┌───────────┬────────────┬────────────┬──────────────┐    │ │
│  │  │ CmRegister│  Hive      │  Cell      │  Transaction │    │ │
│  │  │ Callback  │  Manager   │  Manager   │  Manager     │    │ │
│  │  └───────────┴────────────┴────────────┴──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    STORAGE LAYER                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ SOFTWARE │ │ SAM      │ │ SECURITY │ │  NTUSER.DAT      │   │
│  │ (hive)   │ │ (hive)   │ │ (hive)   │ │  (hive)          │   │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────────┤   │
│  │ SYSTEM   │ │ BCD      │ │ COMPONENT│ │  OTHERS...       │   │
│  │ (hive)   │ │ (hive)   │ │ (hive)   │ │                  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Internal Architecture

### 2.1 Configuration Manager

The Configuration Manager is the kernel-mode component that manages the registry:

```
Configuration Manager Architecture
═══════════════════════════════════

User Mode
┌─────────────────────────────────────┐
│  Registry API Calls                 │
│  (RegOpenKeyEx, RegQueryValueEx)   │
└──────────────┬──────────────────────┘
               │
               ▼
Kernel Mode
┌─────────────────────────────────────┐
│  Configuration Manager              │
│  ┌───────────────────────────────┐  │
│  │  Key Node (KEY_NODE)          │  │
│  │  - Name, security descriptor  │  │
│  │  - Subkey list                │  │
│  │  - Value list                 │  │
│  ├───────────────────────────────┤  │
│  │  Key Body (KEY_BODY)          │  │
│  │  - Handle context per process │  │
│  │  - Current position in key    │  │
│  ├───────────────────────────────┤  │
│  │  Cell Manager                 │  │
│  │  - Allocates/frees cells      │  │
│  │  - Cell index addressing      │  │
│  │  - Handles "dirty" tracking   │  │
│  ├───────────────────────────────┤  │
│  │  Hive Manager                 │  │
│  │  - Maps hives to files        │  │
│  │  - Manages hive dirty pages   │  │
│  │  - Lazy write flush           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Transaction Log (LOG/LOG1)   │  │
│  │  - Write-ahead logging        │  │
│  │  - Recovery on boot           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Hive Files (Disk)                  │
│  \%SystemRoot%\System32\Config\    │
│  + NTUSER.DAT per user              │
└─────────────────────────────────────┘
```

### 2.2 Registry Key Object

```
KEY_NODE (Registry Key)
┌──────────────────────────────────────────┐
│ Signature ("kn")                         │
│ Access Bits (KEY_READ, KEY_WRITE, etc.)  │
│ Parent Key (cell index)                 │
│ Name (UTF-16, variable length)          │
│ Class Name (optional)                   │
│ Security Key → SD (security descriptor) │
│ Value List                              │
│  ┌────────────────────────────────────┐  │
│  │ Value 0: Name + Type + Data       │  │
│  │ Value 1: Name + Type + Data       │  │
│  │ ...                               │  │
│  └────────────────────────────────────┘  │
│ Subkey List                              │
│  ┌────────────────────────────────────┐  │
│  │ Subkey 0 → KEY_NODE               │  │
│  │ Subkey 1 → KEY_NODE               │  │
│  │ ...                               │  │
│  └────────────────────────────────────┘  │
│ Class (optional class name data)         │
│ LastWritten (timestamp)                  │
│ Parent: 0xFFFFFFFF = root of hive        │
└──────────────────────────────────────────┘
```

---

## 3. Registry Hives

### 3.1 Hive Overview

| Hive File | Logical Name | Scope | Description |
|-----------|-------------|-------|-------------|
| **SAM** | `HKEY_LOCAL_MACHINE\SAM` | System-wide | User accounts, groups, passwords (hashes) |
| **SECURITY** | `HKEY_LOCAL_MACHINE\SECURITY` | System-wide | LSA secrets, user rights, audit policies |
| **SOFTWARE** | `HKEY_LOCAL_MACHINE\SOFTWARE` | System-wide | Installed software, Windows settings |
| **SYSTEM** | `HKEY_LOCAL_MACHINE\SYSTEM` | System-wide | Boot config, drivers, services |
| **BCD** | `HKEY_LOCAL_MACHINE\BCD` | System-wide | Boot Configuration Data |
| **DEFAULT** | `HKEY_USERS\.DEFAULT` | System-wide | Default user profile |
| **NTUSER.DAT** | `HKEY_CURRENT_USER` | Per-user | User-specific settings |
| **UsrClass.dat** | `HKEY_CURRENT_USER\Software\Classes` | Per-user | User file associations |

### 3.2 Logical Registry Hives

```
Registry Hive Tree
══════════════════

HKEY_LOCAL_MACHINE (HKLM)
├── SAM
│   ├── SAM
│   │   ├── Domains
│   │   │   ├── Account
│   │   │   │   ├── Users
│   │   │   │   │   ├── Names
│   │   │   │   │   └── <RID>
│   │   │   │   └── Aliases
│   │   │   └── Builtin
│   │   └── RXAct
│   └── [Secured - requires SYSTEM]
├── SECURITY
│   ├── Policy
│   │   ├── Accounts
│   │   ├── Accounts Domains
│   │   └── Secrets
│   ├── Sam
│   └── [Secured - requires SYSTEM]
├── SOFTWARE
│   ├── Microsoft
│   │   ├── Windows
│   │   │   ├── CurrentVersion
│   │   │   │   ├── Run
│   │   │   │   ├── RunOnce
│   │   │   │   └── Policies
│   │   │   └── NT
│   │   └── .NETFramework
│   ├── Classes
│   │   ├── CLSID
│   │   └── .exe
│   └── Wow6432Node (32-bit on 64-bit)
├── SYSTEM
│   ├── CurrentControlSet
│   │   ├── Control
│   │   │   ├── ProductName
│   │   │   └── Lsa
│   │   ├── Enum
│   │   ├── Hardware Profiles
│   │   ├── Services
│   │   └── ControlSet001 / ControlSet002
│   └── MountedDevices
├── BCD
│   └── Objects
└── HARDWARE (volatile)

HKEY_CURRENT_USER (HKCU) ← → HKU\SID
├── AppEvents
├── Console
├── Control Panel
├── Environment
├── Identities
├── Keyboard Layout
├── Network
├── Software
│   ├── Microsoft
│   │   ├── Windows
│   │   │   ├── CurrentVersion
│   │   │   │   ├── Run
│   │   │   │   ├── RunOnce
│   │   │   │   ├── Explorer
│   │   │   │   └── Policies
│   │   └── Office
│   └── Classes
├── System
└── Volatile Environment

HKEY_CLASSES_ROOT (HKCR) ← Merged view of HKLM\Software\Classes + HKCU\Software\Classes

HKEY_CURRENT_CONFIG (HKCC) ← Alias to HKLM\SYSTEM\CurrentControlSet\Hardware Profiles\Current
```

### 3.3 Hive File Locations

| Hive | File Path |
|------|-----------|
| SAM | `%SystemRoot%\System32\Config\SAM` |
| SECURITY | `%SystemRoot%\System32\Config\SECURITY` |
| SOFTWARE | `%SystemRoot%\System32\Config\SOFTWARE` |
| SYSTEM | `%SystemRoot%\System32\Config\SYSTEM` |
| DEFAULT | `%SystemRoot%\System32\Config\DEFAULT` |
| BCD | `\Boot\BCD` |
| NTUSER.DAT | `%UserProfile%\NTUSER.DAT` |
| UsrClass.dat | `%LocalAppData%\Microsoft\Windows\UsrClass.dat` |

---

## 4. Registry Keys, Values, and Types

### 4.1 Value Types

| Type | Constant | Description |
|------|----------|-------------|
| **REG_NONE** | 0 | No type, data interpretation depends on usage |
| **REG_SZ** | 1 | Fixed-length string (null-terminated) |
| **REG_EXPAND_SZ** | 2 | String with environment variable expansion (%PATH%) |
| **REG_BINARY** | 3 | Raw binary data |
| **REG_DWORD** | 4 | 32-bit unsigned integer |
| **REG_DWORD_BIG_ENDIAN** | 5 | 32-bit big-endian integer |
| **REG_LINK** | 6 | Unicode symbolic link (kernel internal) |
| **REG_MULTI_SZ** | 7 | Array of null-terminated strings |
| **REG_RESOURCE_LIST** | 8 | Device driver resource list |
| **REG_FULL_RESOURCE_DESCRIPTOR** | 9 | Hardware resource descriptor |
| **REG_RESOURCE_REQUIREMENTS_LIST** | 10 | Resource requirements |
| **REG_QWORD** | 11 | 64-bit unsigned integer |

### 4.2 Access Masks

| Access Right | Description |
|-------------|-------------|
| `KEY_QUERY_VALUE` | Read a value |
| `KEY_SET_VALUE` | Write a value |
| `KEY_CREATE_SUB_KEY` | Create a subkey |
| `KEY_ENUMERATE_SUB_KEYS` | List subkeys |
| `KEY_NOTIFY` | Receive change notifications |
| `KEY_CREATE_LINK` | Create a symbolic link |
| `KEY_WOW64_32KEY` | Access 32-bit view from 64-bit |
| `KEY_WOW64_64KEY` | Access 64-bit view from 32-bit |
| `KEY_READ` | Standard read access |
| `KEY_WRITE` | Standard write access |
| `KEY_ALL_ACCESS` | Full access |

### 4.3 Well-Known Keys

| Path | Purpose |
|------|---------|
| `HKLM\SYSTEM\CurrentControlSet\Services` | All installed services/drivers |
| `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run` | Machine autostart |
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | User autostart |
| `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon` | Logon configuration |
| `HKLM\SYSTEM\CurrentControlSet\Control\Lsa` | LSA configuration |
| `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies` | System policies |
| `HKLM\SOFTWARE\Policies\Microsoft\Windows` | Group Policy settings |
| `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management` | Memory settings |
| `HKLM\BCD\Objects` | Boot Configuration Data |

---

## 5. Registry Persistence Mechanisms

### 5.1 Autostart Locations

```
Registry Autostart Locations
═════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│                    BOOT PHASE                                │
├──────────────────────────────────────────────────────────────┤
│ 1. BCD (Boot Configuration Data)                            │
│    HKLM\BCD\Objects\...\Elements                           │
│    → Early boot drivers, boot options                       │
│                                                              │
│ 2. SYSTEM\CurrentControlSet\Services                         │
│    → Drivers and services marked as boot-start              │
│    → Start type: 0 = Boot, 1 = System, 2 = Auto            │
├──────────────────────────────────────────────────────────────┤
│                    LOGON PHASE                               │
├──────────────────────────────────────────────────────────────┤
│ 3. Winlogon Keys                                            │
│    HKLM\...\Winlogon\Shell     = explorer.exe               │
│    HKLM\...\Winlogon\Userinit = userinit.exe                │
│    HKLM\...\Winlogon\Notify   = LSA extensions             │
│                                                              │
│ 4. Run Keys (per-user and machine)                          │
│    HKLM\...\Run                                            │
│    HKLM\...\RunOnce                                       │
│    HKCU\...\Run                                           │
│    HKCU\...\RunOnce                                      │
│                                                              │
│ 5. Startup Folder (Registry reference)                      │
│    HKCU\Software\Microsoft\Windows\CurrentVersion\          │
│    Explorer\Shell Folders\Startup                           │
├──────────────────────────────────────────────────────────────┤
│                    PERSISTENCE PHASE                         │
├──────────────────────────────────────────────────────────────┤
│ 6. Service Registration                                     │
│    HKLM\SYSTEM\CurrentControlSet\Services\<name>           │
│    ImagePath, Start, Type, Group                            │
│                                                              │
│ 7. Scheduled Tasks (Registry-backed)                        │
│    HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\       │
│    Schedule\TaskCache\Tree                                  │
├──────────────────────────────────────────────────────────────┤
│                    EXTENSION PHASE                           │
├──────────────────────────────────────────────────────────────┤
│ 8. AppInit_DLLs                                             │
│    HKLM\...\Windows NT\CurrentVersion\Windows\              │
│    AppInit_DLLs                                             │
│    → DLL loaded into every process using user32.dll         │
│                                                              │
│ 9. Winsock2 LSP (Layered Service Provider)                 │
│    HKLM\SYSTEM\CurrentControlSet\Services\WinSock2\         │
│    Parameters\WinSock Catalog Registered Items               │
├──────────────────────────────────────────────────────────────┤
│                    LOGON SCRIPTS                             │
├──────────────────────────────────────────────────────────────┤
│ 10. Group Policy Scripts                                    │
│     HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\         │
│     Group Policy\Scripts\Logon / Logoff                     │
│     HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\         │
│     Group Policy\Scripts\Logon / Logoff                     │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Detailed Persistence Keys

| Registry Path | Value | Purpose | Risk |
|--------------|-------|---------|------|
| `HKLM\...\Run` | `<name>` | Auto-start programs | High |
| `HKLM\...\RunOnce` | `<name>` | Single auto-start | Medium |
| `HKCU\...\Run` | `<name>` | User auto-start | High |
| `HKLM\...\Winlogon\Shell` | `explorer.exe` | Logon shell | Critical |
| `HKLM\...\Winlogon\Userinit` | `userinit.exe` | Logon init | Critical |
| `HKLM\...\Winlogon\Notify` | `<DLL>` | Logon notification | High |
| `HKLM\...\Services\<svc>` | `ImagePath` | Service binary | Critical |
| `HKLM\...\AppInit_DLLs` | `<DLL>` | Load into all user32 apps | Critical |
| `HKLM\...\Image File Execution Options\<exe>` | `Debugger` | Hijack execution | Critical |
| `HKCU\...\Policies\...\System` | `Shell` | Alternate shell | Critical |
| `HKLM\...\Winsock2\Parameters` | `Catalog` | Network interception | High |

### 5.3 Image File Execution Options (IFEO)

```
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\
    Image File Execution Options\notepad.exe
        │
        ├── Debugger = "C:\malware.exe"
        │   → When notepad.exe launches, malware.exe runs instead
        │
        ├── GlobalFlag = 0x00000200 (FLG_MONITOR_SILENT_PROCESS_EXIT)
        │   → Monitor for silent process exits
        │
        └── UseFilter = 1
            → Enable filter driver monitoring
```

---

## 6. Registry Security (ACLs)

### 6.1 Security Descriptors

```
Registry Key Security
═════════════════════

┌─────────────────────────────────────────────┐
│ Security Descriptor (SD)                     │
├─────────────────────────────────────────────┤
│ Owner: SYSTEM / Administrators / User       │
│ Group: (typically not used for registry)    │
│                                              │
│ DACL (Discretionary ACL):                    │
│ ┌─────────────────────────────────────────┐ │
│ │ ACE 1: BUILTIN\Administrators           │ │
│ │   Access: KEY_ALL_ACCESS                │ │
│ │   Type: ACCESS_ALLOWED                  │ │
│ │                                         │ │
│ │ ACE 2: NT AUTHORITY\SYSTEM              │ │
│ │   Access: KEY_ALL_ACCESS                │ │
│ │   Type: ACCESS_ALLOWED                  │ │
│ │                                         │ │
│ │ ACE 3: Everyone                         │ │
│ │   Access: KEY_READ                      │ │
│ │   Type: ACCESS_ALLOWED                  │ │
│ │                                         │ │
│ │ ACE 4: BUILTIN\Users                    │ │
│ │   Access: KEY_READ                      │ │
│ │   Type: ACCESS_ALLOWED                  │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ SACL (System ACL) - Auditing:               │
│ ┌─────────────────────────────────────────┐ │
│ │ Audit ACE: SYSTEM                       │ │
│ │   Audit: Success + Failure              │ │
│ │   Access: KEY_WRITE                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 6.2 Default Permissions

| Key | Owner | Key Permission | Write Access |
|-----|-------|----------------|--------------|
| `HKLM\SAM` | SYSTEM | SYSTEM only | SYSTEM only |
| `HKLM\SECURITY` | SYSTEM | SYSTEM only | SYSTEM only |
| `HKLM\SOFTWARE` | Administrators | Everyone (Read) | Administrators, SYSTEM |
| `HKLM\SYSTEM` | Administrators | Everyone (Read) | Administrators, SYSTEM |
| `HKCU` | Current User | Current User (Full) | Current User |
| `HKCR` | Administrators | Everyone (Read) | Administrators, SYSTEM, Users |
| `HKU\<SID>` | SYSTEM | Everyone (Read) | SYSTEM, Admins |

### 6.3 Checking Registry Permissions

```powershell
# View security descriptor
Get-Acl "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Set new permissions
$acl = Get-Acl "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
$rule = New-Object System.Security.AccessControl.RegistryAccessRule(
    "BUILTIN\Users",
    "SetValue",
    "Deny"
)
$acl.AddAccessRule($rule)
Set-Acl "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" $acl
```

---

## 7. Common Autostart Locations

### 7.1 Complete Autostart Map

```
System Boot
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. BCD → Boot Drivers (Start=0)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. SYSTEM\Services (Start=1: System)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. SMSS.EXE → CSRSS.EXE, WINLOGON.EXE │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. WINLOGON.EXE                         │
│    → Userinit = userinit.exe            │
│    → Shell = explorer.exe               │
│    → Notify = LSA extensions            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. USERINIT.EXE → Explorer.exe          │
│    → Runs Group Policy scripts          │
│    → Starts shell                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. EXPLORER.EXE                         │
│    → HKCU\...\Run                      │
│    → HKCU\...\RunOnce                  │
│    → Startup folder                     │
│    → HKLM\...\Run                      │
│    → HKLM\...\RunOnce                  │
│    → StartupApproved                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Services (Start=2: Automatic)        │
│    → HKLM\SYSTEM\CurrentControlSet\     │
│      Services\<name>                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 8. Scheduled Tasks                      │
│    → HKLM\SOFTWARE\Microsoft\Windows\   │
│      NT\CurrentVersion\Schedule\        │
│      TaskCache\Tree                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 9. Winsock2 / LSP Providers            │
│    → Network layer persistence          │
└─────────────────────────────────────────┘
```

---

## 8. Registry Analysis Tools

### 8.1 Tool Comparison

| Tool | Platform | Purpose | Key Features |
|------|----------|---------|--------------|
| **Registry Editor (regedit.exe)** | Windows | GUI browsing | Search, export, import, permissions |
| **reg.exe** | Windows | CLI operations | Query, add, delete, export, import |
| **PowerShell** | Windows | Scriptable access | Get-Item, Set-Item, Get-ItemProperty |
| **RegRipper** | Cross-platform | Forensic analysis | Plugin-based, timeline, persistence |
| **Registry Explorer** | Windows | Advanced GUI | Hive analysis, deleted key recovery |
| **Autoruns** | Windows | Autostart analysis | Comprehensive startup enumeration |
| **Process Monitor** | Windows | Live monitoring | Registry access in real-time |
| **RegShot** | Windows | Diff analysis | Compare before/after snapshots |
| **RegistryViewer** | Cross-platform | Forensic GUI | AccessData registry analysis |
| **Volatility** | Cross-platform | Memory forensics | Registry from memory dumps |

### 8.2 RegRipper Usage

```bash
# Rip a registry hive
perl rip.pl -r SOFTWARE -o output.txt

# List persistence locations
perl rip.pl -r SOFTWARE -p persistence

# List services
perl rip.pl -r SYSTEM -p services

# Compare hives
perl rip.pl -r SOFTWARE -r SOFTWARE.old -p diff
```

### 8.3 PowerShell Registry Commands

```powershell
# Read registry
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Set registry value
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" `
    -Name "MyApp" -Value "C:\path\to\app.exe"

# Remove registry value
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" `
    -Name "MyApp"

# Create new key
New-Item -Path "HKLM:\SOFTWARE\MyCompany\MyApp"

# List all autostart entries
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Check services
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\*"

# Export hive for analysis
reg export HKLM\SOFTWARE C:\exported_software.reg
```

### 8.4 Autoruns Analysis

```powershell
# Run Autoruns with CSV output
.\autorunsc.exe -a * -c -h -s -v -o autoruns.csv

# Parse CSV in PowerShell
Import-Csv .\autoruns.csv | Where-Object { $_.Enabled -eq "enabled" }
```

---

## 9. Security Perspective

### 9.1 Registry Hardening

```
Registry Hardening Checklist
═════════════════════════════

1. Restrict Write Access
   ├─ Remove write permissions for Users on HKLM\...\Run keys
   ├─ Deny write to AppInit_DLLs key
   └─ Lock down Winlogon keys

2. Disable Dangerous Features
   ├─ Disable AppInit_DLLs: HKLM\...\Windows\ AppInit_DLLs = ""
   ├─ Disable WSH: HKLM\...\Windows Script Host\ = 0
   └─ Disable PowerShell: (Not recommended, but policy-based)

3. Monitor Critical Keys
   ├─ Enable auditing on HKLM\...\Run
   ├─ Enable auditing on HKLM\...\Winlogon
   ├─ Enable auditing on HKLM\...\Services
   └─ Log registry changes via Sysmon (Event ID 12, 13, 14)

4. Use Group Policy
   ├─ Enforce registry-based policies
   ├─ Use Restricted Groups for admin membership
   └─ Deploy software restrictions

5. Integrity Monitoring
   ├─ Use Tripwire / OSSEC / Wazuh for file integrity
   ├─ Monitor .reg file imports
   └─ Baseline critical keys
```

### 9.2 Registry Attack Techniques

| Technique | Registry Key | Impact |
|-----------|-------------|--------|
| **Run Key Persistence** | HKLM/HKCU\...\Run | Execute at logon |
| **Service Installation** | HKLM\...\Services\<name> | Execute at boot/logon |
| **IFEO Hijacking** | HKLM\...\Image File Execution Options | Redirect program execution |
| **AppInit DLL Injection** | HKLM\...\AppInit_DLLs | Inject into all user32 processes |
| **Winlogon Hijacking** | HKLM\...\Winlogon\Shell/Userinit | Replace logon shell |
| **BHO Injection** | HKLM\...\Internet Explorer\Browser Helper Objects | Inject into IE |
| **COM Hijacking** | HKCR\CLSID\{GUID}\InprocServer32 | Hijack COM objects |
| **Accessibility Features** | HKLM\...\Winlogon\Accessibility | Replace accessibility tools |
| **Screensaver** | HKCU\...\Control Panel\Desktop\SCRNSAVE.EXE | Persistence via screensaver |
| **Winsock LSP** | HKLM\...\WinSock2\Parameters | Network layer interception |

---

## 10. Attack Surface

### 10.1 Registry Attack Vectors

```
Registry Attack Surface
═══════════════════════

┌──────────────────────────────────────────────────────────┐
│                  PERSISTENCE ATTACKS                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Run Keys     │ │ Services     │ │ IFEO         │     │
│  │ (Auto-start) │ │ (Boot/Logon) │ │ (Hijacking)  │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ AppInit DLL  │ │ Winlogon     │ │ COM Hijacking│     │
│  │ (Injection)  │ │ (Shell)      │ │ (Object)     │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
├──────────────────────────────────────────────────────────┤
│                  PRIVILEGE ESCALATION                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Token        │ │ Service      │ │ DLL Search   │     │
│  │ Manipulation │ │ Path         │ │ Order        │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
├──────────────────────────────────────────────────────────┤
│                  DEFENSE EVASION                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Disable      │ │ Disable      │ │ Uninstall    │     │
│  │ Defender     │ │ Logging      │ │ Security SW  │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
├──────────────────────────────────────────────────────────┤
│                  DATA EXFILTRATION                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Store        │ │ Credentials  │ │ C2 Data      │     │
│  │ Payload      │ │ in Reg Keys  │ │ Exfil        │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Registry-Based Defense Evasion

```powershell
# Common defense evasion techniques via registry

# Disable Windows Defender real-time monitoring
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection" `
    -Name "DisableRealtimeMonitoring" -Value 1

# Disable Windows Event Logging
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\EventLog\Security" `
    -Name "Start" -Value 4

# Disable PowerShell logging
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" `
    -Name "EnableScriptBlockLogging" -Value 0

# Disable AMSI
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\AMSI\Providers" `
    -Name "{27817CC1-9D0B-415B-B17E-990A23E4F6D}" -Value 0
```

---

## 11. Debugging Perspective

### 11.1 Registry Debugging

```
WinDbg Registry Commands
═════════════════════════

kd> dt nt!_CM_KEY_NODE          // Key node structure
kd> dt nt!_CM_KEY_VALUE         // Value structure
kd> dt nt!_HIVE                 // Hive structure
kd> !regrootlist                // List root keys
kd> !regkeyinfo <key>           // Key info
kd> !regvaluelist <key>         // List values
kd> !reghive <hive>             // Hive info
kd> !regfindkey <name>          // Find a key
```

### 11.2 Registry Tracing

```
# Using Process Monitor to trace registry access
1. Start Process Monitor
2. Filter: Operation = RegOpenKey, RegQueryValue, RegSetValue
3. Filter: Path contains "Run"
4. Capture registry access patterns

# Using WinDbg to break on registry operations
kd> bp nt!CmRegisterCallbackEx
kd> bp nt!NtOpenKeyEx
kd> bp nt!NtSetValueKey
```

---

## 12. Reverse Engineering Perspective

### 12.1 Registry Hive File Format

```
Registry Hive File Structure
═════════════════════════════

┌─────────────────────────────────────┐
│ Base Block (Header)                 │
│ ├─ Signature ("regf")              │
│ ├─ Sequence numbers                │
│ ├─ File name                       │
│ ├─ Hive bins data offset           │
│ ├─ Checksum                        │
│ └─ Flags                           │
├─────────────────────────────────────┤
│ Hive Bin 0                          │
│ ├─ Signature ("hbin")              │
│ ├─ Offset to next bin              │
│ ├─ Bin size                        │
│ └─ Cells                           │
│    ├─ Free cells                   │
│    ├─ Key node cells              │
│    ├─ Key value cells             │
│    └─ Security descriptor cells   │
├─────────────────────────────────────┤
│ Hive Bin 1                          │
│ └─ ...                             │
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘

Cell Types:
- 0x6B6E = Key node ("kn")
- 0x766C = Key value ("vl")
- 0x736C = Security descriptor ("sl")
- 0x666E = Key node index list ("fn")
- 0x6C6E = Subkey list ("ln")
- 0x646E = Value name list ("dn")
- 0x696E = Big data ("in")
```

### 12.2 Parsing Registry Hives with Python

```python
# Simple registry hive parser (using python-registry)
from python_registry import Registry

reg = Registry.Registry("C:\\Windows\\System32\\config\\SOFTWARE")

# Navigate to a key
key = reg.open("Microsoft\\Windows\\CurrentVersion\\Run")

# List values
for v in key.values():
    print(f"{v.name()} = {v.value()} (type: {v.value_type()})")

# List subkeys
for sk in key.subkeys():
    print(f"Subkey: {sk.name()}")
```

---

## 13. Practical Examples

### Example 1: Enumerate All Autostart Entries

```powershell
# Machine Run keys
Write-Host "=== HKLM Run ===" -ForegroundColor Yellow
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue

# User Run keys
Write-Host "=== HKCU Run ===" -ForegroundColor Yellow
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue

# Winlogon
Write-Host "=== Winlogon ===" -ForegroundColor Yellow
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" `
    -Name "Shell","Userinit","Notify" -ErrorAction SilentlyContinue

# Services (boot-start and auto-start)
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\*" |
    Where-Object { $_.Start -in 0,1,2 } |
    Select-Object PSChildName, Start, Type, ImagePath
```

### Example 2: Detect IFEO Hijacking

```powershell
$ifeoPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options"
$entries = Get-ChildItem $ifeoPath -ErrorAction SilentlyContinue

foreach ($entry in $entries) {
    $debugger = Get-ItemProperty $entry.PSPath -Name "Debugger" -ErrorAction SilentlyContinue
    if ($debugger) {
        Write-Host "[ALERT] IFEO Hijack: $($entry.PSChildName) -> $($debugger.Debugger)" `
            -ForegroundColor Red
    }
}
```

### Example 3: Backup Registry

```powershell
# Export individual hives
reg export HKLM\SOFTWARE C:\backup\HKLM_SOFTWARE.reg
reg export HKCU\SOFTWARE C:\backup\HKCU_SOFTWARE.reg

# Export entire HKLM
reg export HKLM C:\backup\HKLM_FULL.reg

# PowerShell backup
Backup-Registry -Path "HKLM:\SOFTWARE" -OutputFile "C:\backup\SOFTWARE.reg"
```

---

## 14. Interview Questions

1. **What are the main registry hives and their purposes?**
   - HKLM\SYSTEM: Boot config, services, drivers
   - HKLM\SOFTWARE: Installed software, OS settings
   - HKLM\SAM: User accounts (requires SYSTEM to read)
   - HKLM\SECURITY: LSA secrets, audit policies
   - HKCU: Per-user settings (NTUSER.DAT)

2. **How does the registry differ from a file system?**
   The registry is a hierarchical database with typed values (REG_SZ, REG_DWORD, etc.), not a flat file system. It has security descriptors, cell-based allocation, and write-ahead logging for crash recovery.

3. **What is the purpose of HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options?**
   IFEO allows developers to attach debuggers to specific executables for debugging. Attackers abuse this by setting the Debugger value to redirect execution of legitimate programs to malicious ones.

4. **How can you detect persistence in the registry?**
   Monitor Run keys, services, Winlogon keys, AppInit_DLLs, IFEO entries, scheduled tasks, and COM registrations. Use Autoruns, RegRipper, or PowerShell to enumerate and compare against baselines.

5. **What are the default permissions on HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run?**
   Administrators and SYSTEM have Full Control; Users have Read access. This means standard users can read but not modify Run entries under HKLM.

6. **Explain the relationship between HKCR, HKLM\SOFTWARE\Classes, and HKCU\Software\Classes.**
   HKCR is a merged view: HKLM\SOFTWARE\Classes (system-wide) + HKCU\Software\Classes (per-user). HKCU entries take precedence for the current user.

7. **How does the registry handle crash recovery?**
   The registry uses write-ahead logging (WAL). Before modifying hive files, changes are written to LOG/LOG1 files. On boot, the Configuration Manager replays logs to recover uncommitted changes.

8. **What is the SAM hive and how is it protected?**
   The SAM hive contains user account database (usernames, password hashes, group memberships). It is protected by requiring SYSTEM-level access to read. The keys are accessible only via the Local Security Authority (LSA) process.

9. **How do you detect COM hijacking via the registry?**
   Check HKCR\CLSID\{GUID}\InprocServer32 for suspicious DLL paths. Compare entries against known-good baselines. Monitor for new or modified COM registrations using Sysmon (Event IDs 12-14).

10. **What is the difference between HKLM\...\Run and HKLM\...\RunOnce?**
    Run entries execute every time at logon; RunOnce entries execute once and then the value is deleted. RunOnce is often used by installers but can also be abused for persistence.

---

## 15. Hands-on Labs

### Lab 1: Registry Persistence Analysis

```
1. Open Registry Editor (regedit.exe)
2. Navigate to HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
3. Document all entries
4. Navigate to HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
5. Document all entries
6. Use Autoruns to find additional persistence
7. Identify any suspicious entries (unknown executables, paths in temp folders)
8. Export findings to CSV
```

### Lab 2: Registry Permissions Audit

```powershell
# 1. Check permissions on critical keys
$keys = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon",
    "HKLM:\SYSTEM\CurrentControlSet\Services"
)

foreach ($key in $keys) {
    Write-Host "`n=== $key ===" -ForegroundColor Yellow
    Get-Acl $key | Format-List
}

# 2. Find keys with weak permissions (Users can write)
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" |
    ForEach-Object {
        $acl = Get-Acl $_.PSPath
        $acl.Access | Where-Object {
            $_.IdentityReference -eq "BUILTIN\Users" -and
            $_.AccessControlType -eq "Allow" -and
            ($_.RegistryRights -band [System.Security.AccessControl.RegistryRights]::SetValue)
        }
    }
```

### Lab 3: Registry Forensics with RegRipper

```
1. Install RegRipper (Perl-based)
2. Acquire a registry hive:
   reg save HKLM\SOFTWARE C:\forensics\SOFTWARE.hive
   reg save HKLM\SYSTEM C:\forensics\SYSTEM.hive
3. Run RegRipper:
   perl rip.pl -r C:\forensics\SOFTWARE.hive -o software_report.txt
   perl rip.pl -r C:\forensics\SYSTEM.hive -o system_report.txt
4. Review output for:
   - Installed software
   - Persistence mechanisms
   - Network connections
   - User activity
5. Search for indicators of compromise
```

### Lab 4: Registry Monitoring with Process Monitor

```
1. Download Process Monitor (Sysinternals)
2. Start capture with filters:
   - Operation contains "Reg" (Registry operations)
   - Path contains "Run" or "Winlogon" or "Services"
3. Perform typical system operations
4. Review captured registry access patterns
5. Identify which processes modify autostart keys
6. Export results for analysis
```

### Lab 5: Registry Hardening

```powershell
# 1. Disable unnecessary autostart locations
# Remove default values from RunOnce (not commonly needed)
Remove-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce" `
    -Name "*" -ErrorAction SilentlyContinue

# 2. Restrict AppInit_DLLs
Set-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Windows" `
    -Name "AppInit_DLLs" -Value ""

# 3. Disable Windows Script Host
Set-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings" `
    -Name "Enabled" -Value 0

# 4. Verify changes
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Windows" `
    -Name "AppInit_DLLs"
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings" `
    -Name "Enabled"
```

---

## 16. Summary Table

| Topic | Key Takeaway |
|-------|-------------|
| **Registry Structure** | Hierarchical database of keys, values, and hives storing system config |
| **Configuration Manager** | Kernel-mode component managing registry hives, cells, and transactions |
| **Hives** | SAM, SECURITY, SOFTWARE, SYSTEM, BCD, NTUSER.DAT — each a separate file |
| **Key Types** | REG_SZ, REG_DWORD, REG_BINARY, REG_MULTI_SZ, REG_EXPAND_SZ, REG_QWORD |
| **Persistence** | Run keys, services, Winlogon, AppInit_DLLs, IFEO, COM hijacking |
| **Security** | ACLs control access; SAM/SECURITY require SYSTEM; audit via SACL |
| **Autostart** | Boot → Services → SMSS → Winlogon → Userinit → Explorer → Run keys |
| **Tools** | Registry Editor, reg.exe, PowerShell, RegRipper, Autoruns, Process Monitor |
| **Hive Files** | Located in System32\config (system) and %UserProfile% (user) |
| **Crash Recovery** | Write-ahead logging (LOG/LOG1 files) for crash consistency |
| **Attack Surface** | Persistence, privilege escalation, defense evasion, COM hijacking |
| **Defense** | Restrict permissions, monitor critical keys, use Group Policy, baseline |
| **Forensics** | RegRipper, Registry Explorer, Volatility for hive analysis |
| **IFEO** | Image File Execution Options abused for program redirection |
| **Cell Model** | Cell-based allocation with free lists and dirty tracking |

---

## Resources

Books:
- *Windows Registry Forensics* — Harlan Carvey
- *Windows Internals* (7th Ed) — Chapter on Registry
- *Practical Registry Forensics* — Hal Pomeranz

Videos:
- SANS FOR508 — Windows Forensics
- Black Hat — Windows Registry Deep Dive
- Harlan Carvey — Registry Forensics talks

Documentation:
- [Microsoft Docs — Registry](https://learn.microsoft.com/en-us/windows/win32/sysinfo/registry)
- [Registry Reference](https://learn.microsoft.com/en-us/windows/win32/sysinfo/registry-key)
- [Windows Registry Overview](https://docs.microsoft.com/en-us/troubleshoot/windows-server/performance/windows-registry-advanced-users)

Tools:
- RegRipper — https://github.com/keydet89/RegRipper3.0
- Registry Explorer — https://ericzimmerman.github.io/
- Autoruns — https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns
- Process Monitor — https://learn.microsoft.com/en-us/sysinternals/downloads/procmon
