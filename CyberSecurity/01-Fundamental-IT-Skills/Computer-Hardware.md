# Computer Hardware

## Layer Position

```
Software Applications
        ↓
    Operating System
        ↓
    Drivers / HAL
        ↓
  ┌─────────────────────────────┐
  │     COMPUTER HARDWARE       │
  │  CPU · RAM · Storage · NIC  │
  │  GPU · Motherboard · BIOS   │
  └─────────────────────────────┘
        ↓
    Electricity
```

Computer hardware is the physical foundation upon which every layer of computing rests. Every operating system, every security tool, every exploit ultimately manipulates hardware through layers of abstraction. Understanding hardware is not optional for cybersecurity — it is the substrate upon which all attacks and defenses exist.

---

## 1. Topic Overview

Computer hardware encompasses the physical components of a computing system: the central processing unit (CPU), random access memory (RAM), storage devices, motherboard, power supply, network interface card (NIC), and peripheral controllers. These components communicate through electrical buses, follow clock signals, and execute instructions at the transistor level.

Every cybersecurity concept — from buffer overflows to cache timing attacks — exploits or defends against hardware behavior. You cannot understand software security without understanding what the hardware actually does.

---

## 2. Why It Exists

Computers exist to process information. Hardware provides the physical machinery to:

- **Execute instructions** (CPU)
- **Store data temporarily** (RAM)
- **Store data persistently** (SSD/HDD)
- **Connect to networks** (NIC)
- **Render output** (GPU, display)
- **Coordinate components** (motherboard, buses)

Without hardware, software is abstract mathematics with no physical manifestation. The hardware determines what is physically possible — every software vulnerability is ultimately a hardware instruction doing something the programmer did not intend.

---

## 3. Internal Architecture

### 3.1 The Motherboard

The motherboard is the central circuit board connecting all components.

```
┌──────────────────────────────────────────────────────┐
│                     MOTHERBOARD                       │
│                                                      │
│  ┌─────────┐    ┌──────────┐    ┌──────────────┐    │
│  │   CPU   │◄──►│   RAM    │◄──►│   Chipset    │    │
│  │ Socket  │    │  Slots   │    │ (North/South)│    │
│  └────┬────┘    └──────────┘    └──────┬───────┘    │
│       │                                 │            │
│       │         ┌──────────┐            │            │
│       └────────►│   Bus    │◄───────────┘            │
│                 │ (PCIe)   │                         │
│                 └────┬─────┘                         │
│           ┌──────────┼──────────┐                    │
│           ▼          ▼          ▼                    │
│       ┌──────┐  ┌──────┐  ┌──────┐                  │
│       │ GPU  │  │ NIC  │  │ NVMe │                  │
│       └──────┘  └──────┘  └──────┘                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │            Southbridge / PCH                  │    │
│  │  USB · SATA · Audio · BIOS/UEFI Firmware     │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Key buses:**
- **Front Side Bus (FSB)** or **QPI/UPI** (Intel) / **Infinity Fabric** (AMD): Connects CPU to chipset
- **PCIe**: High-speed serial bus for GPU, NVMe, NIC
- **SATA**: Connects storage devices
- **USB**: Connects peripherals
- **DMI**: Connects chipset to CPU

### 3.2 The CPU (Central Processing Unit)

The CPU is an integrated circuit containing billions of transistors arranged into functional units.

```
┌─────────────────────────────────────────────────────┐
│                        CPU                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              Control Unit (CU)              │    │
│  │  Fetches instructions from memory           │    │
│  │  Decodes instruction opcode                 │    │
│  │  Directs data flow between components       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │          Arithmetic Logic Unit (ALU)        │    │
│  │  Integer arithmetic (ADD, SUB, MUL, DIV)    │    │
│  │  Bitwise operations (AND, OR, XOR, NOT)     │    │
│  │  Comparison operations (CMP, TEST)          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │        Floating Point Unit (FPU)            │    │
│  │  Decimal/floating-point arithmetic          │    │
│  │  SSE, AVX vector operations                 │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              Registers                      │    │
│  │  RAX, RBX, RCX, RDX (General purpose)      │    │
│  │  RSP, RBP (Stack pointer, base pointer)     │    │
│  │  RIP (Instruction pointer)                  │    │
│  │  RFLAGS (Status flags)                      │    │
│  │  XMM0-XMM15 (SSE registers)                │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │           Cache Hierarchy                   │    │
│  │  L1i (instruction) ─ 32-64 KB per core      │    │
│  │  L1d (data) ─ 32-64 KB per core            │    │
│  │  L2 ─ 256 KB - 1 MB per core               │    │
│  │  L3 (shared) ─ 8-64 MB                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │        Memory Management Unit (MMU)         │    │
│  │  Virtual → Physical address translation     │    │
│  │  Page table walking                         │    │
│  │  TLB (Translation Lookaside Buffer)         │    │
│  │  Supports paging and segmentation           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3.3 The Fetch-Decode-Execute Cycle

Every CPU instruction goes through this cycle:

```
┌─────────────────────────────────────────────────────────┐
│                 FETCH-DECODE-EXECUTE CYCLE              │
│                                                         │
│   ┌──────────┐                                          │
│   │  FETCH   │ ← Read instruction from memory at       │
│   │          │   address in RIP (instruction pointer)   │
│   └────┬─────┘                                          │
│        │                                                │
│        ▼                                                │
│   ┌──────────┐                                          │
│   │  DECODE  │ ← Determine: What operation? Which      │
│   │          │   operands? What addressing mode?        │
│   └────┬─────┘                                          │
│        │                                                │
│        ▼                                                │
│   ┌──────────┐                                          │
│   │ EXECUTE  │ ← ALU performs operation, or memory     │
│   │          │   access occurs, or branch taken        │
│   └────┬─────┘                                          │
│        │                                                │
│        ▼                                                │
│   ┌──────────┐                                          │
│   │  WRITE   │ ← Store result in register or memory    │
│   │  BACK    │   Update RIP (unless branch)            │
│   └────┬─────┘                                          │
│        │                                                │
│        ▼                                                │
│   ┌──────────┐                                          │
│   │  CHECK   │ ← Interrupts pending? Pipeline hazards? │
│   │          │   If yes, handle; if no, FETCH again    │
│   └──────────┘                                          │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Memory Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                MEMORY HIERARCHY                     │
│                                                     │
│          Speed ▲                                    │
│               │    ┌──────────┐                     │
│               │    │ Registers│  < 1 ns  (CPU)      │
│               │    └────┬─────┘                     │
│               │         │ ~0.5-1 ns                 │
│               │    ┌────┴─────┐                     │
│               │    │ L1 Cache │  ~1-2 ns            │
│               │    └────┬─────┘                     │
│               │         │ ~3-5 ns                   │
│               │    ┌────┴─────┐                     │
│               │    │ L2 Cache │  ~5-10 ns           │
│               │    └────┬─────┘                     │
│               │         │ ~10-20 ns                 │
│               │    ┌────┴─────┐                     │
│               │    │ L3 Cache │  ~20-40 ns          │
│               │    └────┬─────┘                     │
│               │         │ ~50-100 ns                │
│               │    ┌────┴─────┐                     │
│               │    │   RAM    │  ~50-100 ns         │
│               │    └────┬─────┘                     │
│               │         │ ~5-10 μs                  │
│               │    ┌────┴─────┐                     │
│               │    │   SSD    │  ~50-150 μs         │
│               │    └────┬─────┘                     │
│               │         │ ~5-10 ms                  │
│               │    ┌────┴─────┐                     │
│               │    │   HDD    │  ~5-10 ms           │
│               │    └──────────┘                     │
│               │                                    │
│          Capacity ▼                               │
└─────────────────────────────────────────────────────┘
```

**Why this matters for security:**
- Cache timing attacks exploit the speed difference between L1 and RAM
- Rowhammer exploits DRAM refresh timing
- Spectre/Meltdown exploit speculative execution and cache state

---

## 4. Component Breakdown

### 4.1 CPU

| Aspect | Detail |
|--------|--------|
| **Purpose** | Execute instructions, perform calculations, control all hardware |
| **Responsibilities** | Fetch/decode/execute instructions, manage memory access, handle interrupts |
| **Inputs** | Instructions from memory, data from memory/peripherals |
| **Outputs** | Computed results, memory writes, I/O commands |
| **Dependencies** | RAM (for instructions/data), motherboard (for interconnection), cooling |
| **Failure cases** | Overheating → throttling or shutdown; bit flip → crash or corruption |
| **Security risks** | Spectre/Meltdown, branch prediction poisoning, microarchitectural attacks |

### 4.2 RAM (Random Access Memory)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Store instructions and data currently in use by the CPU |
| **Responsibilities** | Provide fast read/write access to active data |
| **Inputs** | Memory addresses and data from CPU |
| **Outputs** | Data at requested addresses |
| **Dependencies** | Motherboard (memory slots), CPU (memory controller) |
| **Failure cases** | Bit flips (soft errors), complete failure (blue screen), degradation |
| **Security risks** | Cold boot attacks, Rowhammer, DMA attacks, memory forensics |

### 4.3 Storage (SSD/HDD)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Persist data when power is off |
| **Responsibilities** | Read/write data blocks, manage wear leveling (SSD), handle bad sectors (HDD) |
| **Inputs** | Block addresses and data from I/O controller |
| **Outputs** | Stored or retrieved data blocks |
| **Dependencies** | SATA/NVMe controller, filesystem driver |
| **Failure cases** | Bad sectors, controller failure, data corruption, write endurance exhaustion |
| **Security risks** | Data remanence, encryption bypass, firmware attacks |

### 4.4 NIC (Network Interface Card)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Connect computer to network |
| **Responsibilities** | Frame construction, CRC calculation, media access control |
| **Inputs** | Network packets from OS, electrical/optical signals from cable |
| **Outputs** | Packets to OS, signals to cable |
| **Dependencies** | PCIe bus, network driver, network stack |
| **Failure cases** | Driver crash, buffer overflow, link failure |
| **Security risks** | MAC spoofing, promiscuous mode, packet injection, firmware attacks |

### 4.5 BIOS/UEFI Firmware

| Aspect | Detail |
|--------|--------|
| **Purpose** | Initialize hardware and hand off to bootloader |
| **Responsibilities** | POST, hardware initialization, boot device selection, secure boot verification |
| **Inputs** | Power-on signal, hardware registers |
| **Outputs** | Initialized hardware, bootloader execution |
| **Dependencies** | Flash memory (ROM), hardware components |
| **Failure cases** | Corrupted firmware → no boot; failed POST → no display |
| **Security risks** | BIOS rootkits, UEFI malware, secure boot bypass |

---

## 5. Step-by-Step Workflow: Powering On a Computer

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPUTER BOOT SEQUENCE                     │
│                                                             │
│  1. Power Button Pressed                                    │
│     │                                                       │
│     ▼                                                       │
│  2. Power Supply Unit (PSU)                                 │
│     │  Converts AC (wall) to DC (components)               │
│     │  Provides +3.3V, +5V, +12V rails                     │
│     │  Sends "Power Good" signal when voltage stabilizes   │
│     │                                                       │
│     ▼                                                       │
│  3. CPU Reset Vector                                        │
│     │  CPU begins at fixed address (0xFFFFFFF0 in x86)     │
│     │  Jumps to BIOS/UEFI entry point                      │
│     │                                                       │
│     ▼                                                       │
│  4. BIOS/UEFI Firmware Executes                             │
│     │  a) Initialize CPU registers and cache               │
│     │  b) Perform POST (Power-On Self-Test)                │
│     │  c) Detect and initialize RAM                         │
│     │  d) Enumerate and initialize PCIe devices            │
│     │  e) Initialize USB, SATA, NVMe controllers          │
│     │  f) Display boot screen                               │
│     │                                                       │
│     ▼                                                       │
│  5. Boot Device Selection                                    │
│     │  Check boot order (configured in UEFI)               │
│     │  For UEFI: Read EFI System Partition (ESP)           │
│     │  For Legacy: Read MBR from first sector              │
│     │                                                       │
│     ▼                                                       │
│  6. Bootloader Execution                                     │
│     │  UEFI: Execute /EFI/BOOT/BOOTX64.EFI                │
│     │  Legacy: Execute code at MBR (stage 1)              │
│     │  Bootloader loads kernel into RAM                    │
│     │                                                       │
│     ▼                                                       │
│  7. Kernel Loading                                           │
│     │  Decompress kernel image                              │
│     │  Set up protected mode / long mode                   │
│     │  Initialize page tables                               │
│     │  Set up interrupt descriptor table (IDT)             │
│     │  Initialize device drivers                            │
│     │  Mount root filesystem                                │
│     │                                                       │
│     ▼                                                       │
│  8. Init Process                                             │
│     │  Linux: systemd (PID 1)                              │
│     │  Windows: smss.exe → csrss.exe → wininit.exe        │
│     │  Start system services                                │
│     │  Load user interface                                  │
│     │                                                       │
│     ▼                                                       │
│  9. Login Prompt / Desktop                                   │
│     System ready for user interaction                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow

### 6.1 Reading a File

```
┌──────┐     ┌───────┐     ┌──────┐     ┌──────┐     ┌──────┐
│ User │────►│  OS   │────►│ SATA │────►│ SSD  │────►│ Data │
│ App  │     │ VFS   │     │Ctrl  │     │NAND  │     │ in   │
│      │◄────│ Cache │◄────│      │◄────│Flash │◄────│ RAM  │
└──────┘     └───────┘     └──────┘     └──────┘     └──────┘
```

**Detailed flow:**
1. Application calls `read(fd, buffer, size)`
2. VFS (Virtual File System) checks page cache
3. If cache miss: VFS calls filesystem driver (ext4, NTFS)
4. Filesystem calculates block addresses
5. Block layer issues I/O request to SATA/NVMe driver
6. Driver sends command to storage controller
7. SSD reads NAND flash cells → data moves to internal DRAM buffer
8. Data transferred via PCIe/DMA to RAM
9. Page cache updated
10. Data copied to user-space buffer
11. `read()` returns

### 6.2 Sending a Network Packet

```
┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
│ App  │───►│ SOCK │───►│ TCP/ │───►│ IP   │───►│ NIC  │───►│Wire/ │
│ Data │    │ Layer│    │ UDP  │    │ Layer│    │Driver│    │Fiber │
│      │    │      │    │      │    │      │    │      │    │      │
│      │◄───│      │◄───│      │◄───│      │◄───│      │◄───│      │
└──────┘    └──────┘    └──────┘    └──────┘    └──────┘    └──────┘
```

---

## 7. Control Flow

### 7.1 Interrupt Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERRUPT FLOW                           │
│                                                             │
│  External Event (NIC receives packet)                      │
│       │                                                     │
│       ▼                                                     │
│  Interrupt Request Line (IRQ) asserted                     │
│       │                                                     │
│       ▼                                                     │
│  Interrupt Controller (APIC) receives signal               │
│       │                                                     │
│       ▼                                                     │
│  APIC signals CPU                                          │
│       │                                                     │
│       ▼                                                     │
│  CPU finishes current instruction                          │
│       │                                                     │
│       ▼                                                     │
│  CPU saves current state (RIP, RFLAGS, registers) to stack│
│       │                                                     │
│       ▼                                                     │
│  CPU looks up Interrupt Descriptor Table (IDT)             │
│       │                                                     │
│       ▼                                                     │
│  Jumps to ISR (Interrupt Service Routine)                  │
│       │                                                     │
│       ▼                                                     │
│  ISR: Save more registers, acknowledge IRQ                 │
│       │                                                     │
│       ▼                                                     │
│  ISR: Read data from NIC buffer to RAM                    │
│       │                                                     │
│       ▼                                                     │
│  ISR: Schedule softirq or tasklet for processing          │
│       │                                                     │
│       ▼                                                     │
│  ISR: Restore registers, execute IRET instruction          │
│       │                                                     │
│       ▼                                                     │
│  CPU resumes previous execution                            │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Context Switching

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTEXT SWITCH                             │
│                                                             │
│  Process A (Running)        Process B (Ready)              │
│       │                                                     │
│       ▼                                                     │
│  Timer interrupt fires (e.g., every 4ms)                   │
│       │                                                     │
│       ▼                                                     │
│  Kernel saves Process A state:                             │
│    - Registers → Process A's PCB                           │
│    - RIP → Process A's saved instruction pointer           │
│    - RSP → Process A's saved stack pointer                 │
│    - FPU/SSE registers (if used)                           │
│       │                                                     │
│       ▼                                                     │
│  Scheduler selects Process B                               │
│       │                                                     │
│       ▼                                                     │
│  Kernel restores Process B state:                          │
│    - Process B's registers ← PCB                          │
│    - RIP ← Process B's saved instruction pointer           │
│    - RSP ← Process B's saved stack pointer                 │
│    - TLB flushed (or ASID used)                           │
│    - Page tables switched (CR3 register on x86)           │
│       │                                                     │
│       ▼                                                     │
│  Process B resumes execution                               │
│  (appears to have been running continuously)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Memory Flow

### 8.1 Virtual to Physical Address Translation

```
┌─────────────────────────────────────────────────────────────┐
│           VIRTUAL → PHYSICAL TRANSLATION                    │
│                                                             │
│  Virtual Address: 0x00007FFF12345678                       │
│       │                                                     │
│       │  Split into:                                        │
│       │  ┌─────────────────┬───────────┬────────────────┐  │
│       │  │  PML4 Index (9) │ PDPT (9)  │ PD (9) │ PT (9)│  │
│       │  │  │               │ │         │ │       │ │     │  │
│       │  │  │  ┌────────────┘ │ ┌───────┘ │ ┌─────┘     │  │
│       │  │  │  │              │ │         │ │           │  │
│       │  └──┼──┼──────────────┼─┼─────────┼─┼───────────┘  │
│       │     │  │              │ │         │ │              │
│       ▼     ▼  ▼              ▼ ▼         ▼ ▼              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ PML4   │→│ PDPT   │→│   PD   │→│   PT   │              │
│  │ Table  │ │ Table  │ │ Table  │ │ Table  │              │
│  └────────┘ └────────┘ └────────┘ └───┬────┘              │
│                                       │                    │
│                                       ▼                    │
│                               ┌──────────────┐             │
│                               │Physical Frame │             │
│                               │  (4 KB page)  │             │
│                               └──────────────┘             │
│                                                             │
│  TLB caches recent translations for fast lookup            │
│  TLB miss → page table walk → TLB fill                     │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Page Table Entry Structure

```
┌─────────────────────────────────────────────────────────────┐
│              PAGE TABLE ENTRY (64-bit)                      │
│                                                             │
│  63    52 51    12 11  9 8  7 6 5 4 3 2 1 0               │
│  ┌───────┬─────────┬─────┬─┬─┬─┬─┬─┬─┬─┬─┬─┐              │
│  │ Unused│ PhysAddr│Avail│G│D│A│C│T│U│W│P│P│              │
│  │ / NX │[51:12]  │     │ │ │ │ │ │ │ │ │ │              │
│  └───────┴─────────┴─────┴─┴─┴─┴─┴─┴─┴─┴─┴─┘              │
│                                                             │
│  P (Bit 0):     Present — page is in physical memory       │
│  R/W (Bit 1):   Read/Write — 0=read only, 1=read/write    │
│  U/S (Bit 2):   User/Supervisor — 0=kernel only           │
│  PWT (Bit 3):   Page Write-Through caching                 │
│  PCD (Bit 4):   Page Cache Disabled                        │
│  A (Bit 5):     Accessed — page has been read/written      │
│  D (Bit 6):     Dirty — page has been written to           │
│  PAT (Bit 7):   Page Attribute Table index                 │
│  G (Bit 8):     Global — not flushed on TLB flush         │
│  NX (Bit 63):   No Execute — prevents code execution      │
└─────────────────────────────────────────────────────────────┘
```

**Security significance:**
- NX bit prevents shellcode execution on the stack (DEP)
- U/S bit prevents user-space from accessing kernel memory
- These bits are enforced by the MMU in hardware

---

## 9. Hardware Interaction

### 9.1 DMA (Direct Memory Access)

DMA allows peripherals to transfer data to/from RAM without CPU involvement.

```
┌─────────────────────────────────────────────────────────────┐
│                    DMA TRANSFER                             │
│                                                             │
│  1. CPU programs DMA controller:                           │
│     - Source address (NIC buffer)                          │
│     - Destination address (RAM location)                   │
│     - Transfer size                                        │
│     - Transfer direction                                   │
│                                                             │
│  2. CPU returns to other work                              │
│                                                             │
│  3. DMA controller transfers data directly:                │
│     NIC buffer ──────────────────────► RAM                 │
│     (no CPU involvement)                                   │
│                                                             │
│  4. DMA controller raises interrupt when complete          │
│                                                             │
│  5. CPU handles interrupt, data is now in RAM              │
│                                                             │
│  SECURITY RISK: FireWire, Thunderbolt, PCIe devices       │
│  can perform DMA to arbitrary RAM addresses               │
│  → Cold boot attacks, memory scraping                     │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 I/O Port Mapping

```
┌─────────────────────────────────────────────────────────────┐
│              I/O ACCESS METHODS                             │
│                                                             │
│  Port-Mapped I/O (PMIO):                                   │
│    CPU uses special instructions (IN, OUT)                 │
│    Address space: 0x0000 - 0xFFFF (64KB)                  │
│    Used for: legacy devices, UART, PS/2                   │
│                                                             │
│  Memory-Mapped I/O (MMIO):                                 │
│    Device registers mapped to physical addresses           │
│    CPU uses regular load/store instructions                │
│    Used for: PCIe devices, GPU, modern peripherals        │
│    Kernel must mark these regions as uncacheable           │
│                                                             │
│  Port I/O:                                                 │
│    ┌──────┐    IN AL, 0x60    ┌──────────┐                │
│    │ CPU  │──────────────────►│ Keyboard │                │
│    │      │◄──────────────────│Controller│                │
│    └──────┘    MOV AL,[port]  └──────────┘                │
│                                                             │
│  MMIO:                                                     │
│    ┌──────┐    MOV [0xFE00],  ┌──────────┐                │
│    │ CPU  │──────────────────►│  GPU     │                │
│    │      │◄──────────────────│Registers │                │
│    └──────┘    MOV reg,[0xFE00]└──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Operating System Interaction

### 10.1 Privilege Levels (Rings)

```
┌─────────────────────────────────────────────────────────────┐
│                  x86 PRIVILEGE RINGS                        │
│                                                             │
│         ┌─────────────────────────────────┐                 │
│         │          Ring 0 (Kernel)        │                 │
│         │  ┌─────────────────────────┐    │                 │
│         │  │     Ring 1 (unused)     │    │                 │
│         │  │  ┌─────────────────┐    │    │                 │
│         │  │  │  Ring 2 (unused)│    │    │                 │
│         │  │  │  ┌───────────┐  │    │    │                 │
│         │  │  │  │ Ring 3    │  │    │    │                 │
│         │  │  │  │ (User)    │  │    │    │                 │
│         │  │  │  │           │  │    │    │                 │
│         │  │  │  │ Your apps │  │    │    │                 │
│         │  │  │  └───────────┘  │    │    │                 │
│         │  │  └─────────────────┘    │    │                 │
│         │  └─────────────────────────┘    │                 │
│         └─────────────────────────────────┘                 │
│                                                             │
│  Ring 0: Full hardware access, execute any instruction     │
│  Ring 3: Restricted, cannot execute privileged insns       │
│                                                             │
│  Transition: Ring 3 → Ring 0 via:                          │
│    - System call (SYSCALL instruction)                     │
│    - Interrupt (INT 0x80 or IDT entry)                     │
│    - Exception (page fault, divide by zero)                │
│                                                             │
│  SECURITY: This hardware mechanism prevents user apps      │
│  from directly accessing hardware or other processes'      │
│  memory. Vulnerabilities that escalate to Ring 0 are      │
│  called "privilege escalation" exploits.                   │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 System Call Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   SYSTEM CALL FLOW                          │
│                                                             │
│  User Application (Ring 3)                                 │
│       │                                                     │
│       │  MOV RAX, 1        (syscall number: write)         │
│       │  MOV RDI, 1        (fd: stdout)                    │
│       │  MOV RSI, buf      (buffer address)                │
│       │  MOV RDX, 14       (count: 14 bytes)               │
│       │  SYSCALL                                         │
│       │                                                     │
│       ▼                                                     │
│  CPU:                                                        │
│    1. Saves user RIP to RCX                                │
│    2. Saves user RFLAGS to R11                             │
│    3. Loads kernel RSP from MSR_LSTAR                      │
│    4. Jumps to kernel entry point (MSR_LSTAR)             │
│    5. Switches to Ring 0                                   │
│       │                                                     │
│       ▼                                                     │
│  Kernel syscall handler:                                   │
│    1. Saves all registers to thread's kernel stack        │
│    2. Validates syscall number (bounds check)             │
│    3. Looks up handler in sys_call_table[RAX]             │
│    4. Calls sys_write(fd, buf, count)                     │
│    5. sys_write validates pointers, copies data           │
│    6. Returns to syscall entry                             │
│       │                                                     │
│       ▼                                                     │
│  CPU:                                                        │
│    1. Restores registers from kernel stack                │
│    2. Loads user RIP from RCX                             │
│    3. Loads user RFLAGS from R11                          │
│    4. Switches to Ring 3                                   │
│    5. Resumes user execution after SYSCALL                │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Security Perspective

### 11.1 What Attackers Abuse

| Attack | Hardware Component | Mechanism |
|--------|-------------------|-----------|
| **Spectre** | CPU branch predictor | Speculative execution leaks data through cache timing |
| **Meltdown** | CPU out-of-order execution | Reads kernel memory from user space |
| **Rowhammer** | RAM DRAM cells | Repeated row access flips adjacent bits |
| **Cold Boot** | RAM | Data persists briefly after power off; freezing RAM preserves it |
| **DMA Attack** | Thunderbolt/PCIe | Direct memory access bypasses OS controls |
| **Cache Timing** | CPU cache | Measure access time to infer data in cache |
| **Side Channel** | CPU cache, branch predictor | Inadvertent information leakage through timing |
| **Firmware Rootkit** | BIOS/UEFI Flash | Persistent malware below OS level |

### 11.2 What Defenders Protect

- **NX bit (DEP)**: Prevents code execution on stack/heap
- **ASLR**: Randomizes memory layout to prevent predictable addresses
- **SMEP/SMAP**: Prevents kernel from executing/accessing user pages
- **KPTI (Kernel Page Table Isolation)**: Separates kernel/user page tables (Meltdown mitigation)
- **Stack Canaries**: Detect stack buffer overflows before return
- **Control Flow Integrity**: Prevents ROP/JOP attacks
- **IOMMU (VT-d)**: Restricts DMA access
- **Secure Boot**: Verifies bootloader/firmware integrity

### 11.3 Common Vulnerabilities

```c
// Buffer overflow - writes past allocated memory
char buffer[64];
gets(buffer);  // No bounds checking!

// Stack layout:
// ┌──────────────┐ High address
// │ Return Addr  │ ← Attacker overwrites this
// │ Saved RBP    │
// │ Local Vars   │
// │ buffer[64]   │ ← Input goes here
// └──────────────┘ Low address

// When function returns, CPU jumps to attacker's address
```

### 11.4 Detection Methods

- Hardware performance counters detect unusual patterns
- Memory integrity measurement (TPM)
- Firmware integrity verification
- Side-channel attack detection through timing analysis

### 11.5 Mitigation

- Hardware-level mitigations (microcode updates)
- OS-level mitigations (KPTI, retpolines)
- Compiler protections (stack canaries, CFI)
- Firmware protections (Secure Boot, measured boot)

---

## 12. Attack Surface

```
┌─────────────────────────────────────────────────────────────┐
│                   HARDWARE ATTACK SURFACE                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Firmware Layer                    │    │
│  │  BIOS/UEFI rootkits, SMM exploits, Option ROMs    │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  CPU Microarch                      │    │
│  │  Spectre, Meltdown, speculative execution leaks   │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Memory                           │    │
│  │  Rowhammer, cold boot, DMA attacks, bit flips     │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Peripherals                        │    │
│  │  Thunderbolt DMA, USB attacks, HID injection       │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Network                          │    │
│  │  NIC firmware attacks, Wake-on-LAN abuse          │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Storage                          │    │
│  │  Firmware attacks, evil maid, data remanence       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Defensive Perspective

| Defense | Layer | Purpose |
|---------|-------|---------|
| Secure Boot | Firmware | Verify boot chain integrity |
| TPM | Hardware | Store measurements, attest system state |
| IOMMU/VT-d | CPU | Restrict DMA from peripherals |
| NX/DEP | CPU/MMU | Prevent code execution in data regions |
| SMEP/SMAP | CPU | Prevent kernel from accessing user memory |
| KPTI | OS/CPU | Isolate kernel page tables from user |
| Retpoline | Compiler | Mitigate Spectre v2 branch target injection |
| L1TF mitigations | OS/CPU | Mitigate L1 Terminal Fault |
| Stack canaries | Compiler | Detect stack buffer overflows |
| ASLR | OS | Randomize memory layout |

---

## 14. Debugging Perspective

### 14.1 Inspecting Hardware State

```bash
# CPU information
cat /proc/cpuinfo
lscpu

# Memory information
free -h
cat /proc/meminfo
dmidecode -t memory

# PCI devices (hardware enumeration)
lspci -v

# USB devices
lsusb -v

# Block devices
lsblk
fdisk -l

# Kernel messages (hardware events)
dmesg | tail -50
journalctl -k --since "10 minutes ago"

# Interrupts (hardware interrupts)
cat /proc/interrupts

# I/O ports
cat /proc/ioports

# DMA channels
cat /proc/dma

# Hardware temperature sensors
sensors
```

### 14.2 Memory Debugging

```bash
# Memory test
memtester 100M 1

# Check for memory errors
edac-util -s

# View page table entries (requires root)
cat /proc/<pid>/smaps

# Memory map of process
cat /proc/<pid>/maps
```

### 14.3 Using GDB for Hardware Inspection

```bash
# Inspect registers
(gdb) info registers

# Inspect memory at address
(gdb) x/16xg $rsp      # 16 giant (8-byte) hex values at stack pointer

# Inspect memory at arbitrary address
(gdb) x/10i 0x401000   # 10 instructions at address

# Inspect page table (Linux-specific)
(gdb) monitor info registers cr3    # Page table base
(gdb) monitor xp /16xg 0xfffff80000000000  # Kernel memory
```

---

## 15. Reverse Engineering Perspective

### 15.1 What Ghidra/IDA Reveal

When you disassemble a binary, you see hardware instructions:

```asm
; Function prologue
push   rbp            ; Save base pointer (memory write to stack)
mov    rbp, rsp       ; Set up stack frame (register operation)
sub    rsp, 0x40      ; Allocate 64 bytes on stack (stack pointer manipulation)

; Function body
mov    DWORD PTR [rbp-0x4], edi    ; Store first argument on stack
mov    eax, DWORD PTR [rbp-0x4]    ; Load value into ALU
add    eax, 0x1                     ; ALU performs addition
mov    DWORD PTR [rbp-0x8], eax    ; Store result

; Function epilogue
mov    eax, DWORD PTR [rbp-0x8]    ; Load return value
leave                              ; Restore stack pointer (mov rsp,rbp; pop rbp)
ret                                ; Pop return address into RIP
```

### 15.2 What strace Reveals

```bash
$ strace -e trace=read,write,open ./program
open("/etc/passwd", O_RDONLY)        = 3     # File descriptor 3
read(3, "root:x:0:0:root:/root:/bin/..."..., 4096) = 1638
write(1, "User: root\n", 11)        = 11
close(3)                            = 0
```

### 15.3 System Calls Involved in File Read

```
Application: open() → read() → close()
     │
     ▼
Kernel: sys_open() → sys_read() → sys_close()
     │
     ▼
VFS: inode lookup → permission check → file operation table
     │
     ▼
Filesystem: ext4_open() → ext4_read()
     │
     ▼
Block layer: bio submission → elevator → driver
     │
     ▼
Hardware: SATA/NVMe command → storage controller → NAND flash
```

---

## 16. Mental Model

**What should I imagine happening inside the computer?**

When you press the power button, electricity flows through the PSU, which stabilizes voltages. The CPU receives power and begins executing instructions from a fixed address in firmware. The firmware (BIOS/UEFI) initializes hardware by writing to device registers through I/O ports or memory-mapped I/O. Each device has control registers that, when written with specific values, cause the device to perform operations.

When the OS runs, the CPU rapidly switches between processes (thousands of times per second), giving each a slice of time. Each process believes it has exclusive access to memory, but the MMU translates every memory access through page tables, isolating processes from each other. The TLB caches recent translations for speed.

When you read a file, your `read()` system call traps into the kernel, which checks permissions, looks up the file in the filesystem, calculates which disk blocks to read, sends I/O commands to the storage controller, waits for the data to arrive via DMA into RAM, copies it to your buffer, and returns to your application.

Every instruction you see in a debugger — every `mov`, `push`, `call` — is a hardware operation manipulating transistors, registers, and memory cells. There is no magic. Only electricity following logic gates, controlled by clock signals, billions of times per second.

---

## 17. Cybersecurity Connection

| Perspective | How Hardware Connects |
|-------------|----------------------|
| **Attacker** | Exploits hardware behavior (speculative execution, cache timing) to leak data or escalate privileges |
| **Defender** | Uses hardware features (NX, ASLR, IOMMU) to enforce security boundaries |
| **Malware** | Uses hardware instructions to manipulate memory, hide from detection, persist in firmware |
| **Forensic Analyst** | Reads hardware state (memory dumps, disk images) to reconstruct attacks |
| **Pen Tester** | Tests hardware security (DMA attacks, cold boot, firmware) to find physical vulnerabilities |

---

## 18. Interview Questions

### Beginner

1. **What is the difference between RAM and storage?**
   RAM is volatile (loses data when powered off), fast (~100ns access), and used for active data. Storage is persistent, slower (~50μs for SSD, ~5ms for HDD), and used for long-term data retention.

2. **What does the CPU do?**
   The CPU fetches instructions from memory, decodes them to determine the operation, executes the operation using its ALU and control unit, and writes results back to memory or registers. This cycle repeats billions of times per second.

3. **What is a bus?**
   A bus is a shared communication pathway connecting components. It carries addresses, data, and control signals. Examples: PCIe (high-speed peripheral bus), USB (peripheral bus), SATA (storage bus).

4. **Why do we need an operating system?**
   The OS provides hardware abstraction, resource management (CPU scheduling, memory allocation), security isolation between processes, and a uniform API for applications. Without an OS, every program would need to manage hardware directly.

5. **What is a system call?**
   A system call is the mechanism for a user-space program to request a service from the kernel (file I/O, network, process creation). It triggers a privilege transition from Ring 3 to Ring 0, where the kernel validates and executes the request.

### Intermediate

6. **How does virtual memory work?**
   The MMU translates virtual addresses to physical addresses using page tables. Each process has its own page table, providing memory isolation. The TLB caches recent translations. On TLB miss, the MMU performs a page table walk (4 levels in x86-64). Pages can be swapped to disk when RAM is full.

7. **What is DMA and why is it a security risk?**
   DMA allows peripherals to transfer data directly to/from RAM without CPU involvement. It's efficient but risky because a malicious peripheral (via Thunderbolt, for example) could read or write arbitrary physical memory, bypassing OS protections. IOMMU (VT-d) mitigates this by restricting DMA access.

8. **Explain the cache hierarchy and why it matters for security.**
   L1 is fastest (~1ns) and smallest (~64KB), L2 is medium (~5ns, ~256KB), L3 is slowest (~20ns, ~8MB) but shared. Cache timing attacks measure how long memory accesses take to determine whether data is in cache (fast) or RAM (slow), leaking information about access patterns.

9. **What is the difference between a thread and a process?**
   A process has its own address space, file descriptors, and resources. Threads share the same address space but have their own registers, stack, and instruction pointer. Context switching between threads is cheaper because no page table switch is needed.

10. **How does ASLR protect against exploitation?**
    ASLR randomizes the base addresses of the stack, heap, and libraries each time a program runs. An attacker who finds a buffer overflow must also guess where their shellcode or ROP gadgets are located, making exploitation probabilistic rather than deterministic.

### Advanced

11. **Explain Spectre Variant 1 (Bounds Check Bypass).**
    The CPU speculatively executes instructions ahead of branch resolution. If a bounds check is predicted as taken, the CPU may speculatively access out-of-bounds memory, loading data into cache. After the branch resolves and the speculative path is squashed, the cache state remains. An attacker can time cache accesses to infer the speculatively accessed data, leaking secrets across security boundaries.

12. **How does KPTI (Kernel Page Table Isolation) mitigate Meltdown?**
    Meltdown exploits out-of-order execution to read kernel memory from user space. KPTI maintains separate page tables for user mode and kernel mode. User-mode page tables only map user pages (kernel pages marked not-present). Even if speculative execution attempts to access kernel memory, the TLB won't have the translation, and the access will fault before data leaks to cache.

13. **What is Rowhammer and how does it work?**
    DRAM stores bits as charges in capacitors. Repeatedly accessing (hammering) one row can cause adjacent rows to lose charge due to electrical interference (coupling capacitance). An attacker can hammer rows to flip bits in adjacent rows, potentially changing permission bits, code data, or page table entries to gain unauthorized access.

14. **Explain the role of the IOMMU in preventing DMA attacks.**
    The IOMMU (Intel VT-d, AMD-Vi) translates device-visible virtual addresses to physical addresses, similar to how the CPU MMU works. It can restrict which physical memory regions a device can access via DMA. The OS programs the IOMMU with page tables that only map the device's allocated buffers, preventing malicious or compromised devices from reading/writing arbitrary memory.

15. **How does Control Flow Integrity (CFI) prevent ROP attacks?**
    CFI enforces that indirect calls (function pointers, return instructions) only target valid destinations. Before each indirect control transfer, the hardware or software checks that the target address is a legitimate entry point. This prevents attackers from redirecting execution to arbitrary gadgets, breaking ROP chains.

---

## 19. Hands-on Labs

### Simple: Inspect Hardware

```bash
# List CPU details
lscpu

# List memory details
sudo dmidecode -t memory

# List PCI devices
lspci -nn

# Check kernel hardware messages
dmesg | grep -i "memory\|cpu\|pci\|usb"
```

### Intermediate: Memory Mapping

```bash
# View process memory map
pid=$$
cat /proc/$pid/maps

# Find a specific mapping
cat /proc/$pid/smaps | grep -A 10 "[stack]"

# Examine memory contents with GDB
gdb -p $pid
(gdb) info proc mappings
(gdb) x/16xg 0x7fffffffe000
```

### Advanced: Cache Timing

```c
// cache_timing.c - Measure cache hit vs miss
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define ARRAY_SIZE (16 * 1024 * 1024)  // 16MB (larger than LLC)
#define STRIDE 64                        // Cache line size

int main() {
    char *array = malloc(ARRAY_SIZE);
    struct timespec start, end;
    volatile char sink;

    // Flush from cache
    for (int i = 0; i < ARRAY_SIZE; i += STRIDE)
        __builtin_clflush(&array[i]);

    // Time access to first element (cold - not in cache)
    clock_gettime(CLOCK_MONOTONIC, &start);
    sink = array[0];
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("Cold access: %ld ns\n",
           (end.tv_sec - start.tv_sec) * 1000000000L +
           (end.tv_nsec - start.tv_nsec));

    // Time access again (hot - in cache now)
    clock_gettime(CLOCK_MONOTONIC, &start);
    sink = array[0];
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("Hot access: %ld ns\n",
           (end.tv_sec - start.tv_sec) * 1000000000L +
           (end.tv_nsec - start.tv_nsec));

    free(array);
    return 0;
}
```

```bash
gcc -O0 -o cache_timing cache_timing.c && ./cache_timing
# Typical output:
# Cold access: 85 ns
# Hot access: 3 ns
```

### Mini Project: DMA Security Audit

```bash
# Check for Thunderbolt/PCIe DMA capabilities
sudo lspci -vv | grep -i "bridge\|DMA"

# Check IOMMU status
dmesg | grep -i iommu

# Enumerate DMA-capable devices
for d in /sys/kernel/iommu_groups/*/devices/*; do
    echo "$(basename $d): $(cat /sys/kernel/iommu_groups/*/devices/*/driver_override 2>/dev/null || echo 'default')"
done
```

---

## 20. Knowledge Check

### Multiple Choice

1. **Which CPU component translates virtual addresses to physical addresses?**
   - A) ALU
   - B) Control Unit
   - C) MMU
   - D) Cache

   **Answer: C) MMU (Memory Management Unit)**

2. **What happens during a cache miss?**
   - A) The data is lost
   - B) The CPU fetches data from the next cache level or RAM
   - C) The program crashes
   - D) The OS terminates the process

   **Answer: B)**

3. **Which hardware feature prevents code execution on the stack?**
   - A) ASLR
   - B) NX bit (No Execute)
   - C) Stack canary
   - D) SMEP

   **Answer: B) NX bit**

### Scenario-Based

4. **A researcher discovers that measuring memory access times can reveal which encryption key is being used. What type of attack is this?**
   - A) Buffer overflow
   - B) Side-channel attack
   - C) SQL injection
   - D) Phishing

   **Answer: B) Side-channel attack (cache timing)**

5. **An attacker uses a Thunderbolt device to read the contents of a running laptop's RAM without the OS knowing. Which hardware feature could have prevented this?**
   - A) NX bit
   - B) IOMMU (VT-d)
   - C) Secure Boot
   - D) TPM

   **Answer: B) IOMMU (VT-d)**

### Debugging

6. **A program crashes with a segmentation fault. What does this indicate at the hardware level?**
   - A) CPU overheating
   - B) MMU detected an invalid virtual address translation
   - C) Cache corruption
   - D) Power supply failure

   **Answer: B)**

7. **You observe in /proc/interrupts that interrupt count for IRQ 42 is increasing rapidly while network traffic is high. What is happening?**
   - A) Hardware failure
   - B) NIC is generating interrupts for each received packet
   - C) CPU is failing
   - D) RAM is corrupted

   **Answer: B)**

### Architecture

8. **Explain why the memory hierarchy exists and how it affects security.**
   - The hierarchy trades speed for capacity and cost. Registers are fastest but smallest; RAM is slower but larger. Security is affected because timing differences between cache hits and misses leak information (cache timing attacks). Faster memory closer to CPU is also more vulnerable to physical attacks (cold boot).

---

## 21. Summary

| Concept | Purpose | How it Works | Key Components | Security Importance | Common Mistakes |
|---------|---------|--------------|----------------|--------------------|-----------------| 
| CPU | Execute instructions | Fetch-decode-execute cycle | ALU, CU, registers, cache | Spectre/Meltdown exploit speculative execution | Assuming CPU is "just fast" |
| RAM | Temporary storage | DRAM capacitors hold charges | Memory cells, rows, columns | Rowhammer, cold boot attacks | Not understanding volatility |
| Storage | Persistent storage | NAND flash (SSD) or magnetic (HDD) | Controllers, NAND cells | Data remanence, firmware attacks | Assuming deletion is permanent |
| MMU | Address translation | Page tables, TLB | PML4, PDPT, PD, PT | NX bit, KPTI, ASLR rely on MMU | Ignoring virtual vs physical |
| Bus | Component interconnection | Electrical pathways | PCIe, USB, SATA | DMA attacks via buses | Not isolating peripherals |
| Firmware | Hardware initialization | POST, boot sequence | BIOS/UEFI, Option ROMs | Firmware rootkits persist below OS | Ignoring firmware updates |

---

## 22. Preview of the Next Topic

**Connection Types** — Now that you understand the physical components, we'll examine how computers connect to each other: Ethernet cables, fiber optics, wireless signals, and the physical layer protocols that enable networking. This builds directly on the NIC hardware we discussed and leads into the deeper networking concepts in Section 05.

---

*Understanding hardware is understanding the physical reality that all software — including malware and security tools — must ultimately obey.*
