# Dynamic Analysis for Reverse Engineering

## Table of Contents
1. [Introduction](#introduction)
2. [Behavior Monitoring](#behavior)
3. [API Hooking](#hooking)
4. [Process Monitoring](#process)
5. [Registry Monitoring](#registry)
6. [Network Monitoring](#network)
7. [Sandboxing](#sandboxing)
8. [Tools and Frameworks](#tools)
9. [Security Perspective](#security)
10. [Malware Analysis Context](#malware)
11. [Interview Questions](#interview)
12. [Hands-On Labs](#labs)
13. [Summary](#summary)

---

## 1. Introduction <a name="introduction"></a>

Dynamic analysis observes a program's behavior during execution. It reveals runtime behavior including network connections, file system changes, and API calls that static analysis cannot detect.

### Dynamic Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Dynamic Analysis Setup                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Isolated VM  │───→│ Analysis     │───→│ Documentation│          │
│  │ (Snapshot)   │    │ Tools        │    │ & IOCs       │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                    │                    │
│         ▼                   ▼                    ▼                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Network      │    │ File System  │    │ Registry     │          │
│  │ Monitor      │    │ Monitor      │    │ Monitor      │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                     │
│  Environment: VM + Snapshots + Network Sim + Analysis Tools        │
└─────────────────────────────────────────────────────────────────────┘
```

### Static vs Dynamic Analysis

| Aspect | Static Analysis | Dynamic Analysis |
|--------|-----------------|------------------|
| Code Coverage | All code paths | Only executed paths |
| Obfuscation | Cannot handle | Runtime reveals behavior |
| Safety | 100% safe | Risk of malware escape |
| Speed | Fast | Slow (execution time) |
| Detection | Cannot detect sandbox | May detect analysis env |
| Unpacking | Shows packed code | Reveals unpacked code |

---

## 2. Behavior Monitoring <a name="behavior"></a>

### File System Monitoring

```bash
# Linux - inotifywait (real-time file changes)
inotifywait -m -r /tmp /var/log -e create,modify,delete

# Linux - auditd rules
auditctl -w /etc/passwd -p wa -k password_changes
auditctl -w /tmp -p wa -k temp_files
ausearch -k password_changes

# Linux - strace for file operations
strace -e trace=open,openat,read,write,close ./binary

# Windows - Process Monitor (ProcMon)
# Filters: Process Name, Operation, Path
# Useful operations: CreateFile, WriteFile, RegSetValue
```

### API Call Monitoring Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│ API Category           │ Key Functions          │ Malware Purpose   │
├─────────────────────────────────────────────────────────────────────┤
│ File Operations        │ CreateFile, ReadFile   │ Drop/persist      │
│                        │ WriteFile, DeleteFile  │ Data theft        │
├─────────────────────────────────────────────────────────────────────┤
│ Process Operations     │ CreateProcess          │ Execute payload   │
│                        │ VirtualAllocEx         │ Memory for inject │
│                        │ WriteProcessMemory     │ Inject code       │
│                        │ CreateRemoteThread     │ Execute injected  │
├─────────────────────────────────────────────────────────────────────┤
│ Registry Operations    │ RegCreateKeyEx         │ Persistence       │
│                        │ RegSetValueEx          │ Config storage    │
│                        │ RegQueryValueEx        │ Environment check │
├─────────────────────────────────────────────────────────────────────┤
│ Network Operations     │ WSAStartup, connect    │ C2 communication  │
│                        │ send, recv             │ Data exfil        │
│                        │ InternetOpen, HttpSend │ Download payload  │
├─────────────────────────────────────────────────────────────────────┤
│ Service Operations     │ CreateService          │ Persistence       │
│                        │ StartService           │ Execute on boot   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. API Hooking <a name="hooking"></a>

### Hooking Methods

```
┌─────────────────────────────────────────────────────────────────────┐
│ Method              │ Mechanism             │ Pros/Cons              │
├─────────────────────────────────────────────────────────────────────┤
│ IAT Hooking         │ Modify Import Table   │ Easy, but detectable  │
│ Inline Hooking      │ Patch first bytes     │ Universal, complex    │
│ Detour Hooking      │ JMP trampoline       │ Flexible, stable      │
│ Debug Hooking       │ INT3 breakpoints      │ Simple, slow          │
│ EAT Hooking         │ Modify Export Table   │ DLL-specific          │
│ SSDT Hooking        │ Modify system table   │ Kernel-level, risky   │
└─────────────────────────────────────────────────────────────────────┘
```

### Inline Hooking Example

```c
// Inline hook: Replace first bytes with JMP to hook function
#include <windows.h>

BYTE originalBytes[5];
FARPROC targetFunc;

void InstallHook() {
    DWORD oldProtect;
    targetFunc = GetProcAddress(LoadLibrary("kernel32.dll"), "Sleep");
    
    // Save original bytes
    VirtualProtect((LPVOID)targetFunc, 5, PAGE_EXECUTE_READWRITE, &oldProtect);
    memcpy(originalBytes, (void*)targetFunc, 5);
    
    // Write JMP instruction
    BYTE jmp[5] = {0xE9, 0x00, 0x00, 0x00, 0x00};
    DWORD jmpAddr = (DWORD)HookFunction - (DWORD)targetFunc - 5;
    memcpy(&jmp[1], &jmpAddr, 4);
    memcpy((void*)targetFunc, jmp, 5);
    
    VirtualProtect((LPVOID)targetFunc, 5, oldProtect, &oldProtect);
}

void __declspec(naked) HookFunction() {
    __asm {
        // Custom behavior before original
        pushad
        call LogAPICall
        popad
        
        // Execute original function
        pushad
        call originalBytes  // Execute saved bytes
        popad
        ret
    }
}
```

### Frida Dynamic Instrumentation

```javascript
// Frida hook script for Sleep API
Interceptor.attach(Module.getExportByName('kernel32.dll', 'Sleep'), {
    onEnter: function(args) {
        console.log('[*] Sleep(' + args[0] + ')');
        // Log call stack
        console.log(Thread.backtrace(this.context, Backtracer.ACCURATE)
            .map(DebugSymbol.fromAddress).join('\n'));
    },
    onLeave: function(retval) {
        // Modify sleep time
        // args[0] = 0;  // Remove sleep
    }
});

// Hook all API calls from a specific module
var kernel32 = Module.getBaseAddress('kernel32.dll');
var exports = Module.enumerateExports('kernel32.dll');
exports.forEach(function(exp) {
    if (exp.name.indexOf('Create') !== -1) {
        Interceptor.attach(exp.address, {
            onEnter: function(args) {
                console.log('[*] ' + exp.name);
            }
        });
    }
});
```

```bash
# Frida usage
frida -l hook_script.js -n target_process.exe
frida -l hook_script.js --spawn target_binary
```

---

## 4. Process Monitoring <a name="process"></a>

### Process Creation Monitoring

```bash
# Linux - strace
strace -e trace=clone,fork,vfork,execve ./binary

# Linux - auditd
auditctl -a always,exit -F arch=b64 -S execve -k process_execution
ausearch -k process_execution

# Windows - Process Monitor
# Filter: Operation = Process Create

# Monitor child processes
# Use Process Hacker or Process Explorer
# Show process tree with command lines
```

### Process Injection Detection

```
┌─────────────────────────────────────────────────────────────────────┐
│ Injection Type        │ Indicators              │ Detection Method  │
├─────────────────────────────────────────────────────────────────────┤
│ CreateRemoteThread    │ Remote thread in target │ Monitor thread    │
│                       │ Memory write+execute    │ creation API      │
├─────────────────────────────────────────────────────────────────────┤
│ QueueUserAPC          │ APC in target thread    │ Monitor APC queue │
│                       │ Alertable thread        │                   │
├─────────────────────────────────────────────────────────────────────┤
│ SetWindowsHookEx      │ DLL injection via hook  │ Monitor hook      │
│                       │ Message-based           │ installation      │
├─────────────────────────────────────────────────────────────────────┤
│ Process Hollowing     │ Unmap+remap sections    │ Monitor section   │
│                       │ Suspended process       │ operations        │
├─────────────────────────────────────────────────────────────────────┤
│ AtomBombing           │ Atom table abuse        │ Monitor atom ops  │
│                       │ Write via global atom   │                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Process Hollowing Detection

```c
// Detection pattern: Monitor for process hollowing
// 1. CreateProcess with CREATE_SUSPENDED
// 2. NtUnmapViewOfSection (unmap legitimate code)
// 3. VirtualAllocEx (allocate in target)
// 4. WriteProcessMemory (write malicious code)
// 5. SetThreadContext (change entry point)
// 6. ResumeThread (execute malicious code)

// Monitor with ETW (Event Tracing for Windows)
// or API hooking on NtUnmapViewOfSection
```

---

## 5. Registry Monitoring <a name="registry"></a>

### Registry Monitoring Tools

```bash
# Linux (using duktape or reglookup for Wine)
# Monitor Wine registry changes

# Windows - Process Monitor
# Filter: Operation contains Reg
# Operations: RegCreateKey, RegSetValue, RegDeleteValue

# Windows - RegistrySnapshot
# Take before/after snapshots
regshot before.reg
# ... run malware ...
regshot after.reg
# Compare differences

# Sysinternals Autoruns
# Shows all autostart locations
autoruns.exe /accepteula
```

### Common Malware Registry Locations

```
┌─────────────────────────────────────────────────────────────────────┐
│ Registry Key                                          │ Purpose     │
├─────────────────────────────────────────────────────────────────────┤
│ HKLM\Software\Microsoft\Windows\CurrentVersion\Run  │ Persistence │
│ HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce│ Single run │
│ HKCU\Software\Microsoft\Windows\CurrentVersion\Run  │ User persist│
│ HKLM\Software\Microsoft\Windows NT\CurrentVersion\Winlogon│ Shell  │
│ HKLM\SYSTEM\CurrentControlSet\Services               │ Services    │
│ HKLM\Software\Microsoft\Windows\CurrentVersion\Explorer\\│ Shell Folders│
│ HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\\│ User folders│
└─────────────────────────────────────────────────────────────────────┘
```

### Registry Change Detection Script

```powershell
# PowerShell registry monitoring
$watcher = New-Object System.Management.ManagementEventWatcher
$query = "SELECT * FROM RegistryKeyChangeEvent WHERE Hive='HKEY_LOCAL_MACHINE' AND KeyPath='Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run'"
$watcher.Query = $query
Register-ObjectEvent $watcher "EventArrived" -Action {
    Write-Host "Registry changed: $($EventArgs)"
}
$watcher.Start()
```

---

## 6. Network Monitoring <a name="network"></a>

### Network Analysis Tools

```bash
# Wireshark - Packet capture
wireshark -i eth0 -f "tcp port 80 or tcp port 443"

# tcpdump - Command line capture
tcpdump -i eth0 -w capture.pcap host 192.168.1.100
tcpdump -r capture.pcap -A  # Show ASCII content

# netstat - Connection monitoring
netstat -tlnp           # Active connections
netstat -anp            # All connections with PIDs
watch -n 1 'netstat -tlnp'  # Monitor continuously

# Windows - netsh trace
netsh trace start capture=yes tracefile=capture.etl
netsh trace stop
```

### Network Indicators of Compromise

```
┌─────────────────────────────────────────────────────────────────────┐
│ IOC Type            │ Examples                │ Detection Method    │
├─────────────────────────────────────────────────────────────────────┤
│ C2 IP/Domain        │ Hardcoded addresses     │ DNS monitoring      │
│                     │ DGA domains             │ Pattern analysis    │
├─────────────────────────────────────────────────────────────────────┤
│ Protocol Anomaly    │ Non-standard ports      │ Traffic analysis    │
│                     │ Encrypted C2            │ JA3 fingerprinting  │
├─────────────────────────────────────────────────────────────────────┤
│ Data Exfiltration   │ Large DNS responses     │ DNS monitoring      │
│                     │ Unusual upload volumes  │ NetFlow analysis    │
├─────────────────────────────────────────────────────────────────────┤
│ Beaconing           │ Regular connections     │ Time analysis       │
│                     │ Jitter patterns         │ Jitter detection    │
└─────────────────────────────────────────────────────────────────────┘
```

### FakeNet-NG Network Simulation

```bash
# FakeNet-NG - Simulate internet for malware
# Intercepts all network traffic and responds with fake data

# Install
pip install fakenet-ng

# Run
fakenet-ng --interface 0.0.0.0

# Configuration
# fakenet-ng.ini defines:
# - DNS responses (all domains → local IP)
# - HTTP server (serves fake web pages)
# - SMTP server (logs emails)
# - IRC server (logs messages)
# - Custom protocols
```

---

## 7. Sandboxing <a name="sandboxing"></a>

### Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Sandbox Environment                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Host Machine                                                │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ Virtual Machine (Isolated)                          │   │   │
│  │  │  ┌─────────────────────────────────────────────┐   │   │   │
│  │  │  │ Analysis Environment                       │   │   │   │
│  │  │  │  • OS with analysis tools                   │   │   │   │
│  │  │  │  • Network simulation (FakeNet)             │   │   │   │
│  │  │  │  • API monitoring (API Monitor)             │   │   │   │
│  │  │  │  • File system monitoring                   │   │   │   │
│  │  │  │  • Registry monitoring                      │   │   │   │
│  │  │  └─────────────────────────────────────────────┘   │   │   │
│  │  │                                                     │   │   │
│  │  │  ┌─────────────────────────────────────────────┐   │   │   │
│  │  │  │ Snapshot (Reset point)                      │   │   │   │
│  │  │  └─────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Isolation: No network access to real internet                     │
│  Monitoring: All system calls logged and analyzed                  │
│  Reset: Revert to clean snapshot after analysis                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Automated Sandbox Solutions

| Sandbox | Type | Features |
|---------|------|----------|
| Cuckoo | Open source | Automated analysis, API monitoring, network capture |
| CAPE | Open source | Cuckoo fork, focus on malware config extraction |
| Any.Run | Commercial | Interactive cloud sandbox |
| Joe Sandbox | Commercial | Deep behavioral analysis |
| Hybrid Analysis | Free tier | Public malware analysis service |
| VMRay | Commercial | Hypervisor-based (harder to detect) |

### Cuckoo Sandbox Usage

```bash
# Install Cuckoo
pip install -U cuckoo

# Submit sample
cuckoo submit --timeout 120 malware.exe

# View report
cuckoo web  # Access web interface at localhost:8000

# API submission
curl -F "file=@malware.exe" http://localhost:8000/apiv2/tasks/create/file
```

### Sandbox Detection Techniques

```
┌─────────────────────────────────────────────────────────────────────┐
│ Detection Method        │ Sandbox Indicators                        │
├─────────────────────────────────────────────────────────────────────┤
│ Hardware fingerprint    │ VM-specific hardware (VMware, VirtualBox) │
│ Timing checks           │ Execution too fast (no user interaction)  │
│ User interaction        │ No mouse movement, no keystrokes          │
│ File artifacts          │ Sandbox-specific files/drivers            │
│ Registry keys           │ VMware/VBox registry entries              │
│ MAC address             │ VM vendor MAC prefixes                    │
│ Screen resolution       │ Unusual default resolutions              │
│ Process list            │ Sandbox tools running                    │
│ Memory artifacts        │ VM-specific memory patterns              │
│ CPU count               │ Single-core systems (sandbox default)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Tools and Frameworks <a name="tools"></a>

### Tool Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tool              │ Platform    │ Purpose                          │
├─────────────────────────────────────────────────────────────────────┤
│ ProcMon           │ Windows     │ File/Registry/Process/Network    │
│ Process Hacker    │ Windows     │ Process/Service/Network monitor  │
│ API Monitor       │ Windows     │ API call monitoring              │
│ Wireshark         │ Cross       │ Network packet analysis          │
│ tcpdump           │ Linux       │ Command-line packet capture      │
│ strace            │ Linux       │ System call tracing              │
│ ltrace            │ Linux       │ Library call tracing             │
│ Frida             │ Cross       │ Dynamic instrumentation          │
│ Cuckoo            │ Cross       │ Automated sandbox                │
│ INetSim           │ Linux       │ Network simulation               │
│ FakeNet-NG        │ Cross       │ Network simulation               │
│ REMnux            │ Linux       │ Malware analysis distro          │
└─────────────────────────────────────────────────────────────────────┘
```

### REMnux Toolkit

```bash
# REMnux - Linux distribution for malware analysis
# Includes: YARA, Volatility, oletools, pdf-parser, etc.

# Key tools:
# - fakedns: DNS simulation
# - inetsim: Network simulation
# - oledump: OLE file analysis
# - pdf-parser: PDF malware analysis
# - yara: Pattern matching
# - volatility: Memory forensics
# - radare2: Reverse engineering
```

---

## 9. Security Perspective <a name="security"></a>

### Malware Behavior Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│ Behavior              │ Indicators                │ Risk Level      │
├─────────────────────────────────────────────────────────────────────┤
│ Persistence           │ Registry Run keys         │ High            │
│                       │ Scheduled tasks           │                 │
│                       │ Service creation          │                 │
├─────────────────────────────────────────────────────────────────────┤
│ Privilege Escalation  │ UAC bypass                │ Critical        │
│                       │ Token manipulation        │                 │
│                       │ DLL hijacking             │                 │
├─────────────────────────────────────────────────────────────────────┤
│ Defense Evasion       │ Anti-debugging            │ High            │
│                       │ Process injection         │                 │
│                       │ Code packing              │                 │
├─────────────────────────────────────────────────────────────────────┤
│ Credential Access     │ Keylogging                │ Critical        │
│                       │ Password scraping         │                 │
│                       │ LSASS memory access       │                 │
├─────────────────────────────────────────────────────────────────────┤
│ Lateral Movement      │ Pass-the-hash             │ Critical        │
│                       │ RDP connections           │                 │
│                       │ SMB shares                │                 │
├─────────────────────────────────────────────────────────────────────┤
│ Exfiltration          │ DNS tunneling             │ High            │
│                       │ HTTP uploads              │                 │
│                       │ Steganography             │                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Malware Analysis Context <a name="malware"></a>

### Malware Dynamic Analysis Checklist

```
□ Environment Setup
  □ Clean VM snapshot
  □ Network simulation enabled
  □ Monitoring tools running
  □ No sensitive data on VM

□ Initial Execution
  □ Monitor process creation
  □ Monitor file system changes
  □ Monitor registry changes
  □ Monitor network connections

□ Behavior Documentation
  □ API calls logged
  □ Network traffic captured
  □ Files created/modified
  □ Registry modifications

□ Indicators Extraction
  □ C2 addresses
  □ Dropped file hashes
  □ Persistence mechanisms
  □ YARA rules created
```

---

## 11. Interview Questions <a name="interview"></a>

### Fundamental Questions

1. **What is the advantage of dynamic over static analysis?**
   - Dynamic analysis reveals actual runtime behavior
   - Can handle obfuscated and packed code
   - Shows real network connections and file operations
   - Cannot be evaded by code-level anti-analysis techniques

2. **How would you set up a safe malware analysis environment?**
   - Use isolated VM with no host network access
   - Take clean snapshots before analysis
   - Use network simulation (INetSim/FakeNet-NG)
   - Install analysis tools but not sensitive software
   - Disable shared folders and clipboard

3. **What is API hooking and why is it used?**
   - Intercepts API calls between application and OS
   - Used for monitoring, logging, and modifying behavior
   - Methods: IAT hooking, inline hooking, detour hooking
   - Helps trace malware behavior without modifying binary

4. **Explain the difference between strace and ltrace.**
   - strace traces system calls (kernel-level)
   - ltrace traces library calls (user-level)
   - strace shows file, network, process operations
   - ltrace shows function calls to shared libraries

### Advanced Questions

5. **How does process injection work and how do you detect it?**
   - Malicious code written into legitimate process memory
   - Detection: Monitor VirtualAllocEx + WriteProcessMemory + CreateRemoteThread
   - Check for RWX memory regions
   - Monitor for suspended processes
   - Analyze thread start addresses

6. **What are the limitations of sandbox analysis?**
   - Malware can detect sandbox environment
   - Time-based evasion (sleep for long periods)
   - User interaction requirements
   - Network-based evasion (check for real internet)
   - Resource limitations affect behavior

7. **How would you analyze network C2 traffic?**
   - Capture with Wireshark/tcpdump
   - Identify protocols (HTTP, DNS, custom)
   - Extract IOCs (IPs, domains, URLs)
   - Decode custom protocols
   - Reconstruct commands and responses

8. **Explain DNS tunneling as an evasion technique.**
   - Encodes data in DNS queries/responses
   - Bypasses firewalls (DNS usually allowed)
   - Detection: Unusual DNS query volume, long subdomains
   - High entropy in DNS names
   - Non-standard record types

---

## 12. Hands-On Labs <a name="labs"></a>

### Lab 1: Basic Behavior Monitoring

```bash
# Task: Monitor a sample's behavior
# 1. Start ProcMon (Windows) or auditd (Linux)
# 2. Run sample in isolated VM
# 3. Document:
#    - Files created/modified
#    - Registry changes
#    - Network connections
#    - Process tree

# Linux equivalent:
strace -f -e trace=file,process,network -o trace.log ./sample
grep -E "open|execve|connect" trace.log
```

### Lab 2: API Hooking with Frida

```javascript
// Task: Hook key APIs and log parameters
// hook_apis.js
Interceptor.attach(Module.getExportByName('kernel32.dll', 'CreateFileA'), {
    onEnter: function(args) {
        this.fileName = args[0].readUtf8String();
        this.access = args[1].toInt32();
        console.log('[CreateFileA] ' + this.fileName);
        console.log('  Access: 0x' + this.access.toString(16));
    }
});

Interceptor.attach(Module.getExportByName('ws2_32.dll', 'connect'), {
    onEnter: function(args) {
        var sockaddr = args[1];
        var port = sockaddr.add(2).readU16();
        var ip = sockaddr.add(4).readByteArray(4);
        console.log('[connect] IP: ' + ip + ' Port: ' + port);
    }
});
```

### Lab 3: Network Traffic Analysis

```bash
# Task: Analyze C2 communication
# 1. Set up INetSim or FakeNet-NG
# 2. Run sample with tcpdump capturing
# 3. Analyze captured traffic:
tcpdump -r capture.pcap -A | head -100

# 4. Identify:
#    - Protocol used (HTTP, DNS, custom)
#    - C2 addresses
#    - Data being sent
#    - Command and control patterns
```

### Lab 4: Sandbox Analysis

```bash
# Task: Submit to Cuckoo sandbox
# 1. Install Cuckoo
# 2. Submit sample: cuckoo submit malware.exe
# 3. Analyze report:
#    - Behavioral summary
#    - Network analysis
#    - Dropped files
#    - API calls
#    - Screenshots

# 4. Extract IOCs and create YARA rules
```

### Lab 5: Anti-Sandbox Detection

```bash
# Task: Identify sandbox evasion techniques
# Test sample in different environments:
# 1. Normal VM
# 2. VM with no network
# 3. VM with realistic user activity

# Document:
# - Different behaviors observed
# - Timing differences
# - Network-based detection
# - File artifact detection
```

---

## 13. Summary <a name="summary"></a>

### Quick Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dynamic Analysis Commands                                           │
├─────────────────────────────────────────────────────────────────────┤
│ Linux:  strace, ltrace, auditd, inotifywait, sysdig               │
│ Windows: ProcMon, Process Hacker, API Monitor, netstat             │
│ Network: Wireshark, tcpdump, tshark, INetSim                       │
│ Sandboxing: Cuckoo, CAPE, Any.Run, VMRay                          │
│ Instrumentation: Frida, DynamoRIO, Pin                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Study Progression

```
Beginner: strace/ProcMon basics → File/Registry monitoring → Network capture
    ↓
Intermediate: API hooking → Frida scripting → Cuckoo sandbox
    ↓
Advanced: Anti-sandbox bypass → Custom sandboxes → Memory forensics
```

---

*Last Updated: 2026*
*For educational and authorized security testing purposes only*
