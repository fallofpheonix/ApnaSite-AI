# Windows Architecture

## What is it?

Windows Architecture refers to the internal design and structure of the Microsoft Windows operating system. It encompasses the NT kernel, executive subsystems, hardware abstraction layer, object manager, security reference monitor, and user-mode subsystems. This layered architecture governs how processes, threads, memory, I/O, and security are managed across the system.

## Why Learn It?

A deep understanding of Windows internals is essential for identifying attack surfaces, diagnosing system behavior, and implementing effective security controls. Many vulnerabilities exploit the boundary between user mode and kernel mode, making this knowledge critical for both defenders and attackers. Understanding EPROCESS/ETHREAD structures, the object manager, and the security reference monitor is fundamental to memory forensics and exploit development.

## You Will Learn

- Windows kernel (NT kernel) and its core responsibilities
- Executive subsystems and their roles
- Hardware Abstraction Layer (HAL)
- Subsystem architecture (Win32, WSL, POSIX)
- Windows object model and object manager
- Security Reference Monitor (SRM)
- Registry overview and its relationship to the kernel
- Process and thread structures (EPROCESS, ETHREAD)
- User mode vs kernel mode transitions

## Prerequisites

- Operating Systems fundamentals
- Basic understanding of CPU privilege rings

## Related Topics

- Registry
- Active Directory
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
│                     USER MODE (Ring 3)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Win32   │ │   WSL    │ │  POSIX   │ │  Application     │   │
│  │Subsystem │ │Subsystem │ │Subsystem │ │  (EXE/DLL)       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │             │            │                 │             │
│  ┌────┴─────────────┴────────────┴─────────────────┴──────────┐ │
│  │              NT Runtime / NTDLL.DLL                        │ │
│  │              (System Call Stubs)                            │ │
│  └────────────────────────┬───────────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────────┤
│                     KERNEL MODE (Ring 0)                        │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │                    NTOSKRNL.EXE                            │ │
│  │  ┌───────────┬────────────┬────────────┬──────────────┐    │ │
│  │  │ Executive │  Object    │  Security  │   I/O        │    │ │
│  │  │Components │  Manager   │  Reference │   Manager    │    │ │
│  │  │           │            │  Monitor   │              │    │ │
│  │  ├───────────┼────────────┼────────────┼──────────────┤    │ │
│  │  │ Process   │  Memory    │  PnP       │   Local      │    │ │
│  │  │ Manager   │  Manager   │  Manager   │   Procedure  │    │ │
│  │  │           │            │            │   Call (LPC)  │    │ │
│  │  └───────────┴────────────┴────────────┴──────────────┘    │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │              Kernel (Microkernel)                   │   │ │
│  │  │  Thread Scheduler / Dispatcher / Interrupt Handler  │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         HAL.DLL (Hardware Abstraction Layer)               │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     HARDWARE                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   CPU    │ │   RAM    │ │  Disk    │ │  Network / I/O   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Internal Architecture

### 2.1 NT Kernel (Microkernel)

The Windows NT kernel (`ntoskrnl.exe`) is a hybrid microkernel. It implements the lowest-level OS functions:

| Component | Function |
|-----------|----------|
| **Thread Scheduler** | Preemptive priority-based thread scheduling with 32 priority levels (0-31) |
| **Interrupt Dispatcher** | Routes hardware and software interrupts to handlers |
| **Trap Handler** | Handles exceptions, system calls, and interrupts from user mode |
| **Synchronization** | Provides spinlocks, mutexes, and synchronization primitives for SMP |
| **Power Manager** | Manages system sleep, hibernate, and power state transitions |

The kernel operates at IRQL (Interrupt Request Level):
- **PASSIVE_LEVEL (0)**: Normal execution, most code runs here
- **DISPATCH_LEVEL (1)**: Thread scheduling, DPC execution
- **PROFILE_LEVEL (2)**: Profiling timer
- **HIGH_LEVEL (15)**: Highest IRQL, used by some HAL operations

### 2.2 Executive

The executive is a collection of subsystems that provide OS services:

```
Executive Subsystem Layout
══════════════════════════

┌─────────────────────────────────────────────┐
│              Executive Components            │
├──────────────┬──────────────┬───────────────┤
│ Process      │ Memory       │ I/O Manager   │
│ Manager      │ Manager      │               │
│ - Create     │ - Virtual    │ - IRP handling│
│ - Terminate  │   memory     │ - File sys    │
│ - Suspend    │ - Working    │ - Device I/O  │
│ - Threads    │   sets       │ - Caching     │
│              │ - Pool alloc │               │
├──────────────┼──────────────┼───────────────┤
│ Object       │ Security     │ Plug and Play │
│ Manager      │ Reference    │ Manager       │
│              │ Monitor      │               │
├──────────────┼──────────────┼───────────────┤
│ Configuration│ Local        │ RPC           │
│ Manager      │ Procedure    │ Runtime       │
│ (Registry)   │ Call (LPC)   │               │
├──────────────┼──────────────┼───────────────┤
│ Power        │ PNP          │ WDM Framework │
│ Manager      │ Manager      │               │
└──────────────┴──────────────┴───────────────┘
```

### 2.3 Hardware Abstraction Layer (HAL)

The HAL (`hal.dll`) isolates the kernel and executive from hardware-specific details:

| HAL Function | Description |
|-------------|-------------|
| **I/O Interface** | Provides uniform API for bus access, DMA, and interrupts |
| **Timer Services** | Platform-independent timing functions |
| **Cache Manager** | Manages file system caching |
| **DMA/Bus Master** | Manages direct memory access operations |
| **Processor Control** | Handles processor-specific features (APIC, power states) |

Different HAL variants exist for different hardware:
- `halacpi.dll` — ACPI PC
- `halapic.dll` — UP APIC
- `halmps.dll` — MP System
- `halmacpi.dll` — ACPI MP

### 2.4 Subsystem Architecture

```
┌─────────────────────────────────────────────────┐
│              Subsystem Layer                     │
├────────────────┬────────────────────────────────┤
│  Win32 (CSRSS) │  WSL (LxssManager)            │
│  - Console I/O │  - Linux binary compatibility  │
│  - Threading   │  - NT filesystem bridge        │
│  - GDI/User    │  - WSL2: Hyper-V VM            │
├────────────────┼────────────────────────────────┤
│  OS/2 (defunct)│  POSIX.1 (deprecated)          │
├────────────────┴────────────────────────────────┤
│  NTDLL.DLL — System call gateway                │
│  - Transition from Ring 3 → Ring 0              │
│  - Contains syscall stubs (nt* functions)       │
│  - Handles WOW64 for 32-bit on 64-bit          │
└─────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown Table

| Layer | Component | File/System | Purpose |
|-------|-----------|-------------|---------|
| **Kernel Mode** | NT Kernel | ntoskrnl.exe | Thread scheduling, interrupt handling, synchronization |
| **Kernel Mode** | Executive | ntoskrnl.exe | OS services (process, memory, I/O, security) |
| **Kernel Mode** | Object Manager | ntoskrnl.exe | Manages kernel objects (processes, files, sections) |
| **Kernel Mode** | SRM | ntoskrnl.exe | Access token validation, audit logging |
| **Kernel Mode** | HAL | hal.dll | Hardware abstraction |
| **Kernel Mode** | File System Driver | NTFS.SYS, fastfat.SYS | File system operations |
| **Kernel Mode** | Network Driver | tcpip.sys, afd.sys | Network stack |
| **Kernel Mode** | Display Driver | dxgkrnl.sys, videoprt.sys | Graphics subsystem |
| **User Mode** | Win32 Subsystem | csrss.exe | Console, threading, GDI |
| **User Mode** | NTDLL | ntdll.dll | System call gateway |
| **User Mode** | Kernel32/Advapi32 | kernel32.dll, advapi32.dll | Win32 API wrappers |
| **User Mode** | SMSS | smss.exe | Session manager (spawns csrss, winlogon) |
| **User Mode** | CSRSS | csrss.exe | Client/Server Runtime Subsystem |
| **User Mode** | Winlogon | winlogon.exe | Logon/logoff, credential provider host |

---

## 4. Data Flow Diagrams

### 4.1 System Call Flow (User → Kernel)

```
Application (Ring 3)
    │
    ▼
Win32 API Call (e.g., CreateFile)
    │
    ▼
Kernel32.dll / Advapi32.dll
    │
    ▼
NTDLL.dll (ntCreateFile syscall stub)
    │
    ├──── SYSCALL instruction ────┐
    │                              │
    │                              ▼
    │                    NTOSKRNL.EXE (Ring 0)
    │                    KiSystemCall64 dispatcher
    │                              │
    │                              ▼
    │                    I/O Manager
    │                    → Creates IRP
    │                              │
    │                    ┌─────────┴─────────┐
    │                    ▼                   ▼
    │              File System           Security Ref
    │              Driver                Monitor (SRM)
    │              (NTFS.SYS)            → Checks token
    │                    │                → Grants/Denies
    │                    ▼
    │              Physical Device
    │              (Disk Controller)
    │
    ▼
Return to User Mode
```

### 4.2 Process Creation Flow

```
CreateProcessW() [user mode]
    │
    ▼
NtCreateUserProcess [kernel mode]
    │
    ├──► Object Manager: Creates process object
    ├──► Memory Manager: Creates address space, VAD tree
    ├──► Process Manager: Creates EPROCESS structure
    ├──► PEB/TEB initialization
    ├──► Image Loader: Maps EXE + DLLs
    ├──► Security SRM: Assigns access token
    ├──► Creates primary thread (ETHREAD)
    └──► Thread dispatcher: Schedules initial thread
```

### 4.3 Memory Management Flow

```
┌──────────────────────────────────────────────┐
│           Virtual Address Space               │
│  ┌───────────────────────────────────────┐    │
│  │  User Space (0x00000000 - 0x7FFFFFFF) │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐          │    │
│  │  │ Image│ │Mapped│ │ Heap │          │    │
│  │  │ Sect │ │Files │ │      │          │    │
│  │  └──────┘ └──────┘ └──────┘          │    │
│  └───────────────────────────────────────┘    │
│  ┌───────────────────────────────────────┐    │
│  │  Kernel Space (0x80000000 - 0xFFFFFFFF)│    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐          │    │
│  │  │Ntoskr│ │ HAL  │ │ Drivers         │    │
│  │  └──────┘ └──────┘ └──────┘          │    │
│  └───────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
          │
          ▼
    ┌─────────────┐
    │  Page Table  │──► Physical Memory (RAM)
    │  (CR3 reg)   │    - Working Set
    └─────────────┘    - Page Files
                       - Pool Paged/NonPaged
```

---

## 5. Windows Object Model

### 5.1 Object Manager

The Object Manager is the central component that manages all kernel objects:

| Object Type | Description | Security Gate |
|-------------|-------------|---------------|
| **Process** | EPROCESS structure | Process handle + access token |
| **Thread** | ETHREAD structure | Thread handle |
| **File** | File object (FO) | File handle + share access |
| **Section** | Memory-mapped section | Section handle |
| **Token** | Security access token | Token handle |
| **Mutex** | Synchronization object | Mutex handle |
| **Event** | Signaling object | Event handle |
| **Key** | Registry key | Key handle + ACL |
| **Device** | Device object | Device handle |
| **Driver** | Driver object | Driver object |

### 5.2 Handle Table

Every process has a handle table that maps user-mode handles to kernel object pointers:

```
Process Handle Table
┌─────────┬──────────────┬────────────┐
│ Handle  │ Object Addr  │ Access     │
├─────────┼──────────────┼────────────┤
│ 0x0004  │ 0xFFFFA800...│ READ       │
│ 0x0008  │ 0xFFFFA800...│ READ|WRITE │
│ 0x000C  │ 0xFFFFA800...│ FULL       │
│ 0x0010  │ 0xFFFFA800...│ READ       │
└─────────┴──────────────┴────────────┘
```

---

## 6. Security Reference Monitor (SRM)

### 6.1 Architecture

```
┌─────────────────────────────────────────────────┐
│            Security Reference Monitor            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Access Token (per process/thread)               │
│  ┌───────────────────────────────────────┐       │
│  │ User SID (Identify)                   │       │
│  │ Group SIDs (Include/Exclude)          │       │
│  │ Privileges (SeDebugPrivilege, etc.)   │       │
│  │ Owner SID                             │       │
│  │ Default DACL                          │       │
│  │ Integrity Level (Low/Med/High/Sys)   │       │
│  └───────────────────────────────────────┘       │
│                                                  │
│  Security Descriptors (per object)               │
│  ┌───────────────────────────────────────┐       │
│  │ Owner SID                             │       │
│  │ Group SID                             │       │
│  │ Discretionary ACL (DACL)             │       │
│  │  └─ ACE (Access Control Entry)       │       │
│  │     SID + Access Mask + Type         │       │
│  │ System ACL (SACL) - Auditing         │       │
│  └───────────────────────────────────────┘       │
│                                                  │
│  Access Check Algorithm:                         │
│  1. Get caller's access token                     │
│  2. Get object's security descriptor              │
│  3. Walk DACL, match caller SIDs                  │
│  4. Check privilege requirements                  │
│  5. Check mandatory integrity level               │
│  6. Grant or deny access                          │
└─────────────────────────────────────────────────┘
```

### 6.2 Access Token Structure

```c
// Simplified TOKEN structure
typedef struct _TOKEN {
    TOKEN_SOURCE TokenSource;          // Source: "SeLpc" or "SeTk"
    LUID TokenId;                      // Unique token ID
    LUID AuthenticationId;             // Logon session ID
    LUID ParentTokenId;                // Parent token
    LARGE_INTEGER ExpirationTime;      // Token expiry
    PTOKEN_SOURCE TokenSourceEx;       // Extended source
    SID_AND_ATTRIBUTES *User;          // User SID (identifying)
    SID_AND_ATTRIBUTES *Groups;        // Group SIDs (include/exclude)
    SID_AND_ATTRIBUTES *RestrictedSids;
    PTOKEN_PRIVILEGES Privileges;      // Assigned privileges
    PTOKEN_OWNER Owner;                // Default owner
    PTOKEN_PRIMARY_GROUP PrimaryGroup; // Default primary group
    PTOKEN_DEFAULT_DACL DefaultDacl;   // Default DACL
    TOKEN_TYPE TokenType;              // Primary or Impersonation
    SECURITY_IMPERSONATION_LEVEL ImpersonationLevel;
    UCHAR TokenFlags;                  // ELEVATION, etc.
    TOKEN_ELEVATION Elevation;         // UAC elevation info
} TOKEN, *PTOKEN;
```

---

## 7. Process and Thread Structures

### 7.1 EPROCESS (Executive Process Block)

```
EPROCESS Layout (simplified)
┌──────────────────────────────────────────┐
│ KPROCESS (kernel process block)           │
│  ├─ Dispatcher Header                     │
│  ├─ Kernel Time / User Time              │
│  ├─ Process Lock                          │
│  ├─ Affinity Mask                         │
│  ├─ Base Priority                         │
│  └─ Thread List Head (circular)           │
├──────────────────────────────────────────┤
│ UniqueProcessId (PID)                    │
│ ActiveProcessLinks (linked list)         │
│ ImageFileName                           │
│  → \Device\HarddiskVolume1\...           │
│ SectionObject (image section)            │
│ ObjectTable (handle table)              │
│ Token (access token pointer)            │
│ VadRoot (Virtual Address Descriptor)    │
│  → Maps virtual memory regions           │
│ PEB (Process Environment Block)         │
│  → User-mode process info                │
│  → ImageBaseAddress                      │
│  → ProcessHeap                           │
│  → LoaderData                            │
│ CreateTime / ExitTime                   │
│ QuotaUsage / QuotaPeak                  │
│ WorkingSetSize                          │
│ PeakWorkingSetSize                      │
│ PageFaultCount                          │
│ DbgPort / DebugPort                     │
│ SecurityPort (LSA)                      │
│ AuditProcess                            │
│ CreateInfoBlock                         │
└──────────────────────────────────────────┘
```

Key fields for forensics:

| Field | Purpose |
|-------|---------|
| `UniqueProcessId` | Process ID |
| `ImageFileName` | Executable name (up to 15 chars) |
| `ObjectTable` | Handle table base address |
| `Token` | Pointer to TOKEN structure |
| `VadRoot` | AVL tree of VADs (memory regions) |
| `ActiveProcessLinks` | Doubly-linked list traversal |
| `CreateTime` / `ExitTime` | Process lifetime |
| `Wow64Process` | Pointer if WoW64 (32-bit on 64-bit) |
| `Peb` | Process Environment Block (user mode) |

### 7.2 ETHREAD (Executive Thread Block)

```
ETHREAD Layout (simplified)
┌──────────────────────────────────────────┐
│ KTHREAD (kernel thread block)             │
│  ├─ Dispatcher Header                     │
│  ├─ Kernel Time / User Time              │
│  ├─ Kernel APC / User APC count          │
│  ├─ Thread Environment Block (TEB)       │
│  ├─ Stack Base / Stack Limit            │
│  ├─ Process (pointer to EPROCESS)       │
│  └─ Thread Local Storage                 │
├──────────────────────────────────────────┤
│ Cid (Client ID: PID + TID)              │
│ Thread ProcessLink (links to EPROCESS)   │
│ CreatedTime                             │
│ ExitTime                                │
│ ImpersonationInformation               │
│  → Client security context for RPC      │
│ IoRequestInformation                    │
│ IrpList (pending IRPs)                 │
│ ThreadLocals                           │
└──────────────────────────────────────────┘
```

Key fields for forensics:

| Field | Purpose |
|-------|---------|
| `Cid` | Thread ID (client identifier) |
| `Process` | Back-pointer to owning EPROCESS |
| `ImpersonationInformation` | Impersonation level and token |
| `ThreadLocals` | Thread-local storage pointers |
| `KernelModeTime` / `UserModeTime` | CPU time accounting |
| `StackBase` / `StackLimit` | Thread stack boundaries |

### 7.3 PEB (Process Environment Block)

```
PEB (User Mode, per process)
┌──────────────────────────────────────┐
│ InheritedAddressSpace                │
│ ReadImageFileExecOptions             │
│ BeingDebugged (NtGlobalFlag)         │
│ BitField (SpareBool, etc.)          │
│ Mutant (headless display)            │
│ ImageBaseAddress                     │
│ Ldr (PEB_LDR_DATA)                   │
│  ├─ InLoadOrderModuleList            │
│  ├─ InMemoryOrderModuleList          │
│  └─ InInitializationOrderModuleList  │
│ ProcessHeap                          │
│ TlsBitmap / TlsBitmapBits           │
│ ProcessAffinityMask                  │
│ NumberOfProcessors                   │
│ OSPlatformId                        │
│ CSDVersion                          │
│ OSMinorVersion / OSMajorVersion     │
│ OSBuildNumber                       │
│ ProcessParameters (RTL_USER_PROCESS) │
│  ├─ CommandLine                      │
│  ├─ ImagePathName                   │
│  └─ CurrentDirectory                 │
└──────────────────────────────────────┘
```

---

## 8. Security Perspective

### 8.1 Kernel-User Mode Boundary

```
Security Boundary Overview
═══════════════════════════

User Mode (Ring 3)                     Kernel Mode (Ring 0)
┌─────────────────────┐                ┌─────────────────────┐
│ Application          │  SYSCALL       │ Kernel              │
│ ├─ Cannot access     │ ──────────►    │ ├─ Full hardware    │
│ │  kernel memory     │  STRET instruction│   access          │
│ ├─ Cannot modify     │                │ ├─ Can modify any   │
│ │  page tables       │  SYSRET        │ │  memory           │
│ ├─ Limited I/O       │ ◄──────────    │ ├─ Can load drivers │
│ └─ Must use API      │                │ └─ Trust boundary   │
└─────────────────────┘                └─────────────────────┘

Key Protections:
- SMEP (Supervisor Mode Execution Prevention)
- SMAP (Supervisor Mode Access Prevention)
- KPTI (Kernel Page Table Isolation)
- VBS (Virtualization Based Security)
- HVCI (Hypervisor-enforced Code Integrity)
```

### 8.2 Mandatory Integrity Control (MIC)

```
Integrity Levels
┌──────────┬────────────────────────────────────┐
│ Level    │ Usage                              │
├──────────┼────────────────────────────────────┤
│ Untrusted│ Sandbox processes (Chrome, Edge)   │
│ Low      │ Protected Mode IE, AppContainer    │
│ Medium   │ Standard user processes           │
│ High     │ Elevated (Admin) processes         │
│ System   │ System services, LSASS             │
│ Trusted  │ Hyper-V / Secure Kernel            │
└──────────┴────────────────────────────────────┘

Access Rule:
  A process CAN access objects at equal or lower integrity
  A process CANNOT write to objects at higher integrity
  (Unless SACL contains specific WRITE_UP ACE)
```

---

## 9. Attack Surface

### 9.1 User-to-Kernel Attack Vectors

| Attack Vector | Description | Mitigation |
|--------------|-------------|------------|
| **Driver Exploits** | Malicious or vulnerable kernel drivers | Driver Signature Enforcement, HVCI |
| **Syscall Hooking** | SSDT (System Service Descriptor Table) hooking | PatchGuard (KPP) |
| **DKOM** | Direct Kernel Object Manipulation (hiding processes) | Kernel callbacks, Volatility |
| **Token Theft** | Stealing SYSTEM token from a process | VBS, LSA protection |
| **DLL Injection** | Injecting into privileged processes | Code Integrity, ASR rules |
| **MSIInstaller Abuse** | Trusted installer as privilege escalation | Token restrictions |
| **Named Pipe Impersonation** | SMB relay to impersonate users | SMB signing, EPA |

### 9.2 Kernel Attack Vectors

| Attack | Description |
|--------|-------------|
| **Buffer Overflow** | Stack/heap overflow in kernel driver |
| **Use-After-Free** | Kernel pool corruption |
| **Arbitrary Write** | Writing to kernel memory from user mode |
| **Race Conditions** | TOCTOU in kernel object access |
| **Unsigned Drivers** | Loading malicious drivers (BYOVD) |

---

## 10. Debugging Perspective

### 10.1 Kernel Debugging Tools

| Tool | Purpose |
|------|---------|
| **WinDbg (Preview)** | Kernel debugging, memory analysis, breakpoints |
| **KD** | Command-line kernel debugger |
| **LiveKdD** | Dump kernel memory from live system |
| **ProcDump** | User-mode process dumps |
| **VMMap** | Analyze process virtual memory layout |

### 10.2 Key WinDbg Commands

```
kd> !process 0 0              // List all processes
kd> !thread                   // Current thread info
kd> dt nt!_EPROCESS           // EPROCESS structure
kd> dt nt!_ETHREAD            // ETHREAD structure
kd> !token                    // Current thread token
kd> lm                        // Loaded modules
kd> kb                        // Stack trace
kd> !irp                      // Current IRP
kd> !object \                 // Object directory
kd> dd nt!KeServiceDescriptorTable  // SSDT
kd> !handle 0 0               // All handles
```

---

## 11. Reverse Engineering Perspective

### 11.1 System Call Table

Windows uses a system call table (SSDT) that maps syscall numbers to kernel functions:

```
SSDT (System Service Descriptor Table)
┌──────┬──────────────────────────┐
│ Index│ Kernel Function          │
├──────┼──────────────────────────┤
│ 0x00 │ NtAcceptConnectPort      │
│ 0x01 │ NtAccessCheck            │
│ 0x02 │ NtAccessCheckAndAuditAlarm│
│ ...  │ ...                      │
│ 0x18 │ NtCreateFile             │
│ ...  │ ...                      │
│ 0xB8 │ NtReadVirtualMemory      │
│ ...  │ ...                      │
│ 0x100│ NtCreateUserProcess      │
│ ...  │ ...                      │
└──────┴──────────────────────────┘

Note: Numbers vary by Windows version.
```

### 11.2 Reverse Engineering Key Structures

| Structure | Tool/Method |
|-----------|-------------|
| EPROCESS | Volatility `volatility -f memory.dmp windows.pslist` |
| ETHREAD | `!thread` in WinDbg |
| PEB | `dt ntdll!_PEB` in WinDbg |
| TEB | `dt ntdll!_TEB` in WinDbg |
| TOKEN | `dt nt!_TOKEN` in WinDbg |
| VADs | `!vad` in WinDbg |

---

## 12. Practical Examples

### Example 1: List Running Processes

```powershell
# User-mode enumeration
Get-Process | Select-Object Id, ProcessName, Path

# Kernel-mode view (Sysinternals)
.\pslist.exe -t    # Shows process tree
```

### Example 2: Examine a Process Token

```powershell
# Show current user's token info
whoami /all

# Show token details via WinDbg
kd> !token
```

### Example 3: Examine EPROCESS Structure

```powershell
# Using WinDbg
kd> dt nt!_EPROCESS -r
```

### Example 4: View Object Manager

```powershell
# Using ObjectViewer from Sysinternals
.\objview.exe

# Or via WinDbg
kd> !object \Device
```

---

## 13. Interview Questions

1. **What is the difference between user mode and kernel mode in Windows?**
   User mode (Ring 3) has restricted access to hardware and memory; kernel mode (Ring 0) has full access. Transitions happen via system calls (SYSCALL instruction).

2. **Explain the role of the Security Reference Monitor.**
   The SRM validates access requests by comparing the caller's access token against the target object's security descriptor (DACL). It enforces mandatory integrity checks and generates audit events.

3. **What is the EPROCESS structure?**
   EPROCESS (Executive Process Block) is the kernel-mode data structure representing a process. It contains the PID, image name, token, handle table, VAD tree, and pointers to the PEB and threads.

4. **How does the object manager work?**
   The Object Manager maintains a namespace of kernel objects (processes, files, keys). It creates/destroys objects, manages handle tables, enforces access checks via security descriptors, and provides object types.

5. **What is Mandatory Integrity Control (MIC)?**
   MIC assigns integrity levels (Untrusted, Low, Medium, High, System) to processes and objects. A process cannot write to an object at a higher integrity level unless explicitly allowed.

6. **What is the HAL and why does it exist?**
   The Hardware Abstraction Layer (hal.dll) isolates the kernel from hardware-specific details, providing uniform interfaces for I/O, interrupts, and timers across different hardware platforms.

7. **Explain the system call flow from user mode.**
   Application → Win32 API (kernel32.dll) → NTDLL (syscall stub) → SYSCALL instruction → KiSystemCall64 → Executive handler → Kernel object operations → Return via SYSRET.

8. **What is the purpose of the PEB?**
   The PEB (Process Environment Block) exists in user mode and contains process configuration: image base, heap, loader data, TLS, and command-line parameters.

9. **How does a thread get scheduled?**
   The dispatcher maintains a dispatcher ready queue for each priority level (0-31). When a thread becomes ready, it's placed in the appropriate queue. The scheduler picks the highest-priority ready thread and context-switches to it.

10. **What are common kernel attack techniques?**
    Buffer overflows in drivers, DKOM (hiding processes), SSDT hooking, token stealing, unsigned driver loading (BYOVD), and use-after-free in kernel pool objects.

---

## 14. Hands-on Labs

### Lab 1: Enumerate Processes with WinDbg

```
1. Open WinDbg Preview as Administrator
2. Attach to a running process or use LiveKD
3. Run: !process 0 0
4. Find your process in the output
5. Run: !process <address> 1
6. Inspect EPROCESS fields: PID, image name, token
```

### Lab 2: Examine Handle Table

```
1. In WinDbg, attach to a process
2. Run: !handle 0 0
3. Find a file handle (type: File)
4. Run: !handle <handle> 0    (detailed info)
5. Identify the file object address
6. Run: !object <address>     (object type)
```

### Lab 3: Analyze Memory with Volatility

```
1. Install Volatility 3
2. Take a memory dump: winpmem_mini_x64.exe memory.raw
3. List processes: python3 vol.py -f memory.raw windows.pslist
4. List threads: python3 vol.py -f memory.raw windows.threads
5. List handles: python3 vol.py -f memory.raw windows.handles
6. Compare with Task Manager output
```

### Lab 4: Trace a System Call

```
1. In WinDbg, break on syscall:
   bp nt!NtCreateFile
2. Trigger the call (open Notepad → File → Open)
3. Inspect the call parameters
4. Examine the IRP created
5. Step through: p (step over), t (step into)
```

### Lab 5: Kernel Debugging with VMware

```
1. Enable kernel debugging on a Windows VM:
   bcdedit /debug on
   bcdedit /dbgsettings serial debugport:1 baudrate:115200
2. Configure VMware serial port
3. Start WinDbg on host, connect to the serial port
4. In the VM, trigger a BSOD: NotMyFault.exe
5. Analyze the crash dump in WinDbg
```

---

## 15. Summary Table

| Topic | Key Takeaway |
|-------|-------------|
| **NT Kernel** | Hybrid microkernel handling scheduling, interrupts, synchronization |
| **Executive** | Collection of subsystems providing OS services (process, memory, I/O, security) |
| **HAL** | Hardware abstraction for portability across different platforms |
| **Subsystems** | Win32, WSL, POSIX — user-mode environments running atop the NT executive |
| **Object Manager** | Central registry of all kernel objects with handle-based access |
| **SRM** | Validates access via tokens + security descriptors + integrity levels |
| **EPROCESS** | Kernel structure for processes — PID, token, VADs, handle table, PEB |
| **ETHREAD** | Kernel structure for threads — TID, impersonation, stack, time accounting |
| **PEB** | User-mode structure for process configuration (image base, heap, loader) |
| **Integrity Levels** | Mandatory access control based on Low → System trust hierarchy |
| **System Calls** | SYSCALL instruction transitions from Ring 3 → Ring 0 through NTDLL |
| **Attack Surface** | Drivers, DLL injection, token theft, DKOM, named pipe impersonation |
| **Debugging** | WinDbg, Volatility, ProcDump — essential for forensics and exploit analysis |
| **Forensics** | EPROCESS/ETHREAD chains, handle tables, VAD trees in memory dumps |
| **Mitigations** | SMEP, SMAP, KPTI, HVCI, VBS, Driver Signature Enforcement |

---

## Resources

Books:
- *Windows Internals* (7th Ed) — Pavel Yosifovich et al.
- *Windows Kernel Programming* — Pavel Yosifovich
- *Practical Windows Kernel Development* — Tarjei Mandt

Videos:
- Alex Ionescu's Windows Internals talks
- Black Hat / DEF CON Windows internals presentations
- MSDN Channel 9 — Windows Kernel Debugging

Documentation:
- [Microsoft Docs — Windows Architecture](https://learn.microsoft.com/en-us/windows/win32/)
- [Windows Kernel-Mode Driver Architecture](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/)
- [WinDbg Documentation](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/)

Labs:
- OpenSecurityTraining2 — Windows Internals
- PCILeech / Nidan for kernel experiments
- Volatility Workshop (memory forensics)
