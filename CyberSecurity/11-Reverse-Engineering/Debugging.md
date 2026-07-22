# Debugging for Reverse Engineering

## Table of Contents
1. [Introduction](#introduction)
2. [GDB Basics](#gdb)
3. [OllyDbg / x64dbg](#ollydbg)
4. [Breakpoints](#breakpoints)
5. [Stepping Techniques](#stepping)
6. [Memory Inspection](#memory)
7. [Register Inspection](#registers)
8. [GDB Advanced Features](#gdb-advanced)
9. [Security Perspective](#security)
10. [Malware Analysis Context](#malware)
11. [Interview Questions](#interview)
12. [Hands-On Labs](#labs)
13. [Summary](#summary)

---

## 1. Introduction <a name="introduction"></a>

Debugging is the process of examining a program's execution to understand its behavior. For reverse engineers, debugging provides dynamic analysis capabilities that complement static analysis.

### Debugging Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Reverse Engineering Workflow                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Static       │───→│ Form         │───→│ Dynamic      │          │
│  │ Analysis     │    │ Hypotheses   │    │ Debugging    │          │
│  │ (IDA/Ghidra) │    │              │    │ (GDB/x64dbg) │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                                       │                    │
│         │            ┌──────────────┐          │                    │
│         └───────────→│ Verify &     │←─────────┘                    │
│                      │ Document     │                               │
│                      └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Debugger Capabilities

| Capability | Description |
|------------|-------------|
| Breakpoints | Pause execution at specific points |
| Single-stepping | Execute one instruction at a time |
| Memory examination | View/modify memory contents |
| Register inspection | View/modify register values |
| Call stack tracing | View function call history |
| Watchpoints | Break on memory access |
| Conditional logic | Break based on conditions |

---

## 2. GDB Basics <a name="gdb"></a>

### Starting GDB

```bash
# Basic startup
gdb ./binary

# Attach to running process
gdb -p <PID>

# Core dump analysis
gdb ./binary core

# With arguments
gdb --args ./binary arg1 arg2

# Init file
gdb -ix gdbinit.txt ./binary
```

### Essential GDB Commands

```
┌─────────────────────────────────────────────────────────────────────┐
│ Command          │ Short │ Description                              │
├─────────────────────────────────────────────────────────────────────┤
│ run              │ r     │ Start program execution                  │
│ run args         │ r args│ Run with arguments                       │
│ break *0x401000  │ b *0x │ Set breakpoint at address                │
│ break func_name  │ b func│ Set breakpoint at function               │
│ break file:line  │ b f:l │ Set breakpoint at source line            │
│ break ... if cond│       │ Conditional breakpoint                   │
│ continue         │ c     │ Continue execution                       │
│ stepi            │ si    │ Step one instruction (into calls)        │
│ step             │ s     │ Step one source line (into calls)        │
│ nexti            │ ni    │ Step one instruction (over calls)        │
│ next             │ n     │ Step one source line (over calls)        │
│ finish           │ f     │ Run until current function returns       │
│ backtrace        │ bt    │ Print call stack                         │
│ info registers   │ i r   │ Print all registers                      │
│ print expr       │ p expr│ Evaluate and print expression            │
│ x/nfu addr       │       │ Examine memory                           │
│ disassemble addr │ disas │ Disassemble at address                   │
│ set var=val      │       │ Set variable value                       │
│ quit             │ q     │ Exit GDB                                 │
│ help command     │ h cmd │ Get help on command                      │
└─────────────────────────────────────────────────────────────────────┘
```

### GDB Session Example

```bash
$ gdb -q ./vulnerable_program
Reading symbols from ./vulnerable_program...
(gdb) break main
Breakpoint 1 at 0x401146: file vuln.c, line 5.
(gdb) run
Starting program: ./vulnerable_program
hello world

Breakpoint 1, main () at vuln.c:5
5       int main(int argc, char *argv[]) {
(gdb) break vuln
Breakpoint 2 at 0x401126: file vuln.c, line 1.
(gdb) continue
Continuing.

Breakpoint 2, vuln (buf=0x7fffffffe3a0 "") at vuln.c:2
2       void vuln(char *buf) {
(gdb) stepi
0x000000000040112e in vuln (buf=0x7fffffffe3a0 "") at vuln.c:2
2       void vuln(char *buf) {
(gdb) info registers rax
rax            0x0                 0
(gdb) x/20x $rsp
0x7fffffffe380: 0x00007fffffff    0x00000000  0x00401169    0x00000000
0x7fffffffe390: 0x00000000    0x00000000  0xf7a2d830    0x00007fff
0x7fffffffe3a0: 0x00000000    0x00000000  0x00000000    0x00000000
(gdb) quit
```

### GDB Init File (.gdbinit)

```bash
# .gdbinit - Common settings
set disassembly-flavor intel
set history save on
set history filename ~/.gdb_history
set history size 10000
set print pretty on
set confirm off

# Colorize output
define hook-run
    set disassembly-flavor intel
end

# Custom aliases
define hook-ida
    shell ida -A -H $arg0
end

# Aliases
document b
Set breakpoint (alias for break)
end
alias b break
```

### GDB Dashboard (Enhanced UI)

```bash
# Install GDB Dashboard
wget -O ~/.gdbinit-async.py \
  https://raw.githubusercontent.com/cyrus-and/gdb-dashboard/master/.gdbinit-async.py
echo source ~/.gdbinit-async.py >> ~/.gdbinit

# Dashboard panels:
# - Registers view
# - Disassembly view
# - Stack view
# - Source code view (if available)
```

---

## 3. OllyDbg / x64dbg <a name="ollydbg"></a>

### OllyDbg (32-bit Windows)

```
┌─────────────────────────────────────────────────────────────────────┐
│ OllyDbg Interface Layout                                            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CPU - Main thread                                               │ │
│ ├─────────────────────────┬───────────────────────────────────────┤ │
│ │ Disassembly Window      │ Registers Window                      │ │
│ │ ─────────────────────── │ ──────────────────────────────────── │ │
│ │ 00401000  55            │ EAX=00000000  EBX=7FFDF000           │ │
│ │ 00401001  8BEC          │ ECX=00000000  EDX=00000000           │ │
│ │ 00401003  83EC 20       │ ESI=00000000  EDI=00000000           │ │
│ │ 00401006  53            │ EBP=0012FF84  ESP=0012FF44           │ │
│ │ 00401007  56            │ EIP=00401000  EFL=00000000           │ │
│ │ 00401008  57            │                                       │ │
│ ├─────────────────────────┼───────────────────────────────────────┤ │
│ │ Stack Window            │ Memory Dump Window                     │ │
│ │ ─────────────────────── │ ──────────────────────────────────── │ │
│ │ 0012FF84: 00000000      │ 00401000: 55 8B EC 83 EC 20 53 56   │ │
│ │ 0012FF80: 00401069      │ 00401008: 57 8B 45 08 83 C0 01 89   │ │
│ │ 0012FF7C: 0012FFC4      │ 00401010: 45 FC 8B 45 FC 5F 5E 5B   │ │
│ │ 0012FF78: 7C873870      │ 00401018: C9 C3 00 00 00 00 00 00   │ │
│ └─────────────────────────┴───────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Toolbar: Run | Stop | Step Into | Step Over | Step Out | Run to    │
└─────────────────────────────────────────────────────────────────────┘
```

### x64dbg (64-bit Successor)

```
┌─────────────────────────────────────────────────────────────────────┐
│ x64dbg - Modern Windows Debugger                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Features:                                                          │
│ • 32-bit and 64-bit support                                        │
│ • Plugin ecosystem (Scylla, SharpOD, etc.)                         │
│ • Integrated decompiler (until it finds signature)                 │
│ • Trace recording and replay                                        │
│ • Conditional breakpoints with expressions                         │
│ • Multi-core CPU support                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Key Shortcuts:                                                     │
│ F2  - Toggle breakpoint       F7  - Step into                      │
│ F8  - Step over               F9  - Run                            │
│ F12 - Break                   Ctrl+F9 - Run until return           │
│ Space - Assemble instruction  Ctrl+G - Go to address               │
│ Ctrl+F - Search               ;  - Comment                         │
│ :  - Label                    Ctrl+E - Edit bytes                  │
└─────────────────────────────────────────────────────────────────────┘
```

### x64dbg Plugins

| Plugin | Purpose |
|--------|---------|
| ScyllaHide | Anti-anti-debug (hide debugger from detection) |
| SharpOD | Anti-anti-debug for x64dbg |
| xAnalyzer | Enhanced call analysis |
| SwissArmyKnife | Memory search, pattern scanning |
| HashDB | API hash resolution |
| Talles | TLS callback handling |

---

## 4. Breakpoints <a name="breakpoints"></a>

### Types of Breakpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│ Breakpoint Type   │ Mechanism           │ Pros/Cons                 │
├─────────────────────────────────────────────────────────────────────┤
│ Software (INT 3)  │ Opcode 0xCC         │ ✅ Fast, unlimited        │
│                   │                     │ ❌ Detectable, visible    │
│                   │                     │ ❌ Modifies code (1 byte) │
├─────────────────────────────────────────────────────────────────────┤
│ Hardware (DRx)    │ Debug registers     │ ✅ Invisible to program   │
│                   │ DR0-DR3 + DR7       │ ✅ No code modification   │
│                   │                     │ ❌ Only 4 breakpoints     │
│                   │                     │ ❌ Slower than software   │
├─────────────────────────────────────────────────────────────────────┤
│ Memory Watchpoint │ Hardware watchpoint │ ✅ Break on read/write    │
│                   │                     │ ❌ Limited count          │
├─────────────────────────────────────────────────────────────────────┤
│ Conditional       │ Expression eval     │ ✅ Break only when needed │
│                   │                     │ ❌ Slower evaluation      │
└─────────────────────────────────────────────────────────────────────┘
```

### Software Breakpoints

```bash
# GDB - Software breakpoints
(gdb) break main              # Break at function
(gdb) break *0x401000         # Break at address
(gdb) break vuln.c:10         # Break at source line
(gdb) break malloc            # Break at library function
(gdb) info breakpoints        # List all breakpoints
(gdb) delete 1                # Delete breakpoint #1
(gdb) disable 1               # Disable breakpoint #1
(gdb) enable 1                # Enable breakpoint #1
```

```c
// How software breakpoints work internally:
// Original instruction:  0x401000: 55 (push ebp)
// After breakpoint:      0x401000: CC (INT 3)
// Debugger stores:       Original byte (0x55), address (0x401000)

// When INT 3 triggers:
// 1. CPU generates SIGTRAP
// 2. Debugger receives signal
// 3. Debugger restores original byte (0x55)
// 4. Debugger displays breakpoint hit
// 5. On continue: debugger re-inserts INT 3
```

### Hardware Breakpoints

```bash
# GDB - Hardware breakpoints (watchpoints)
(gdb) watch *0x402000        # Break when memory is written
(gdb) rwatch *0x402000       # Break when memory is read
(gdb) awatch *0x402000       # Break on any access

# Using debug registers (x64dbg)
# F2 sets software breakpoint by default
# Right-click → Breakpoint → Hardware, on execution
# Or use command: bpm 0x401000, x  (execute)
#                 bpm 0x401000, r  (read)
#                 bpm 0x401000, w  (write)
```

```c
// Debug Register Layout (DR7)
// Bit 0: L0 - Local enable for DR0
// Bit 1: G0 - Global enable for DR0
// Bit 2: L1 - Local enable for DR1
// Bit 3: G1 - Global enable for DR1
// ...
// Bits 16-17: R/W0 - Condition for DR0
//   00 = Execute only (breakpoint)
//   01 = Write only
//   10 = I/O read/write
//   11 = Read/write
// Bits 18-19: LEN0 - Length for DR0
//   00 = 1 byte
//   01 = 2 bytes
//   10 = 8 bytes (64-bit) or undefined (32-bit)
//   11 = 4 bytes
```

### Conditional Breakpoints

```bash
# GDB conditional breakpoints
(gdb) break *0x401000 if $eax == 0x42
(gdb) break *0x401000 if strcmp(argv[1], "password") == 0
(gdb) break *0x401000 if count > 100
(gdb) break *0x401000 if *(int*)0x402000 == 0

# x64dbg conditional breakpoints
# Right-click breakpoint → Edit condition
# Expression examples:
# EAX == 0
# [ESP] == 0x401000
# EBX > 100 && ECX == 0
# GetString(ESP) == "password"
```

### Breakpoint Commands (GDB)

```bash
# Execute commands automatically when breakpoint is hit
(gdb) break *0x401000
(gdb) commands
> silent
> printf "EAX = 0x%x\n", $eax
> printf "EBX = 0x%x\n", $ebx
> continue
> end
```

---

## 5. Stepping Techniques <a name="stepping"></a>

### Step Types Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│ Instruction  │ Behavior              │ Use When                     │
├─────────────────────────────────────────────────────────────────────┤
│ stepi (si)   │ Execute ONE CPU       │ Examine each instruction     │
│              │ instruction           │ in detail                    │
│ step (s)     │ Execute until next    │ Working with source code     │
│              │ source line           │ available                    │
│ nexti (ni)   │ Execute ONE instr,    │ Skip over function calls     │
│              │ stepping OVER calls   │ you don't need to trace      │
│ next (n)     │ Execute until next    │ Skip over function calls     │
│              │ source line, OVER     │ when you trust them          │
│              │ calls                 │                              │
│ finish (fin) │ Run until current     │ Skip rest of function,       │
│              │ function returns      │ get return value             │
│ continue (c) │ Resume normal         │ Run to next breakpoint       │
│              │ execution             │ or program end               │
│ run (r)      │ Restart program       │ Start over                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Stepping Examples

```bash
# GDB stepping session
(gdb) break main
(gdb) run
(gdb) stepi                    # Execute one instruction
(gdb) stepi 5                  # Execute 5 instructions
(gdb) nexti                    # Step over CALL instructions
(gdb) disassemble $rip, +20    # See upcoming instructions
(gdb) step                     # Step to next source line
(gdb) finish                   # Run until main() returns

# Examining control flow
(gdb) x/i $rip                 # Current instruction
(gdb) x/i $rip, +10            # Next 10 instructions

# Following jumps (step over conditional jumps)
(gdb) ni
# If conditional jump taken:
(gdb) jump *0x401020           # Manually follow jump
```

### Tracing Execution

```bash
# GDB record and replay
(gdb) record full              # Start recording
(gdb) continue                 # Run program
# ... program hits breakpoint ...
(gdb) record instruction-history   # See executed instructions
(gdb) record reversed-nexti        # Step backward!
(gdb) record reversed-continue     # Run backward
(gdb) record stop                  # Stop recording

# x64dbg Trace
# Trace → Trace Over → Records execution into trace file
# Trace → Trace Into → Records including call targets
# Trace → Follow trace → Replay recorded trace
```

---

## 6. Memory Inspection <a name="memory"></a>

### GDB Memory Examination (x command)

```
Syntax: x/nfu addr
  n = count (number of units)
  f = format (x=hex, d=decimal, s=string, i=instruction)
  u = unit (b=byte, h=halfword, w=word, g=giant/8-byte)

Examples:
┌─────────────────────────────────────────────────────────────────────┐
│ Command              │ Description                                  │
├─────────────────────────────────────────────────────────────────────┤
│ x/10x $rsp           │ 10 hex words at stack pointer                │
│ x/20xb 0x402000      │ 20 hex bytes at address                      │
│ x/s 0x402000         │ Print as string at address                   │
│ x/5i $rip            │ 5 instructions at instruction pointer        │
│ x/10xg 0x7fff0000    │ 10 giant (8-byte) hex values                 │
│ x/xw $ebp+8          │ Word at first argument                       │
│ x/s *(char**)argv    │ String at argv[0]                            │
│ x/20i *0x401000      │ Disassemble 20 instructions                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Memory Maps

```bash
# GDB - Memory map inspection
(gdb) info proc mappings       # Show memory layout
(gdb) info file                # Show sections (code, data, etc.)

# Example output:
# Start Addr   End Addr       Size     Offset  Perms  objfile
# 0x00400000 0x00452000   0x52000 0x00000000 r-xp   /path/to/binary
# 0x00651000 0x00652000    0x1000 0x00051000 rw-p   /path/to/binary
# 0x00652000 0x00674000   0x22000 0x00000000 rw-p   
# 0x7ffff7dc1000 0x7ffff7f3f000 0x17e000 0x00000000 r-xp   /lib/x86_64-linux-gnu/libc-2.31.so

# Perms meaning:
# r = read, w = write, x = execute, p = private (COW)
```

### Memory Search

```bash
# GDB - Searching memory
(gdb) find /b 0x400000, 0x450000, 0x41, 0x42, 0x43  # Search for "ABC"
(gdb) find /w 0x400000, 0x450000, 0xdeadbeef         # Search for DWORD

# x64dbg - Memory search
# Ctrl+F → Search in current memory region
# Ctrl+B → Search in all memory regions
# Supports: hex, string, number patterns
# Can filter by memory protection (RWX, RW, etc.)
```

### Memory Modification

```bash
# GDB - Modify memory
(gdb) set {int}0x402000 = 0x12345678
(gdb) set {char[4]}0x402000 = "ABCD"
(gdb) set $eax = 0             # Modify register
(gdb) set *(int*)($ebp-4) = 0  # Modify local variable

# x64dbg - Modify memory
# Select bytes in memory window → Space → Type new bytes
# Or Ctrl+E → Edit bytes at address
```

### Memory Dump Patterns

```
Common memory dump formats:
┌─────────────────────────────────────────────────────────────────────┐
│ Hexdump of 0x402000 (16 bytes):                                    │
│                                                                     │
│ 0x402000: 48 65 6c 6c 6f 20 57 6f  72 6c 64 21 00 00 00 00       │
│           H  e  l  l  o     W  o  r  l  d  !  \0 \0 \0 \0       │
│                                                                     │
│ Decoded: "Hello World!\0"                                           │
│                                                                     │
│ Hexdump of stack:                                                   │
│ 0x7fff0000: DEADBEEF 12345678 00401000 7FFF0000                    │
│            Saved EBP  ?        Return   ?                          │
│ 0x7fff0010: 00000001 7FFF0020 00000000 00401069                    │
│            argc     argv     envp       libc_start                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Register Inspection <a name="registers"></a>

### GDB Register Commands

```bash
# View all registers
(gdb) info registers

# View specific register
(gdb) info registers eax
(gdb) info registers rax rbx rcx

# View floating-point registers
(gdb) info float

# View vector registers (SSE/AVX)
(gdb) info vectors

# View all registers including special
(gdb) info all-registers

# Print register as different format
(gdb) print/d $eax           # Decimal
(gdb) print/x $eax           # Hex
(gdb) print/t $eax           # Binary
(gdb) print/c $eax           # Character
```

### Register Flags Inspection

```bash
# View flags register
(gdb) info registers eflags

# Or check specific flags:
(gdb) p/x $eflags
# 0x246 = 0010 0100 0110
# Bit positions:
# CF=0, ZF=1, SF=0, OF=0, PF=1, IF=1

# Conditional jump logic (for analysis):
(gdb) p $ZF   # Zero flag - set by CMP/SUB when result is zero
(gdb) p $SF   # Sign flag - set when result is negative
(gdb) p $CF   # Carry flag - set on unsigned overflow
(gdb) p $OF   # Overflow flag - set on signed overflow
```

### Register Context Window

```
x64dbg Register Window Analysis:
┌─────────────────────────────────────────────────────────────────────┐
│  EAX = 00000000    EBX = 7FFDF000    ECX = 0012FF84    EDX = 0000 │
│  ESI = 00000000    EDI = 00000000    EBP = 0012FF84    ESP = 0012 │
│  EIP = 00401000    EFL = 00000246    CF=0 ZF=1 SF=0 OF=0         │
├─────────────────────────────────────────────────────────────────────┤
│  C0=0 D0=0 T0=0 S0=0 Z0=1 P0=1 A0=0                             │
│  DF=0 ID=0 AC=0 VM=0 RF=0 NT=0 IOPL=0                           │
├─────────────────────────────────────────────────────────────────────┤
│  CS=001B  DS=0023  ES=0023  FS=003B  GS=0000  SS=0023            │
│  EIP points to: 00401000  push ebp                                │
└─────────────────────────────────────────────────────────────────────┘

Key observations for reverse engineering:
• EAX = return value (0 = success typically)
• ESP/EBP = stack frame (check for corruption)
• EIP = current execution point
• EFLAGS = condition state (for conditional jumps)
```

### Context Save/Restore

```bash
# GDB - Save/restore register context
(gdb) save registers /tmp/regdump.txt
(gdb) restore registers /tmp/regdump.txt

# x64dbg - Working with context
# View → CPU → Shows registers
# Right-click register → Modify value
# Or type in register box and press Enter
```

---

## 8. GDB Advanced Features <a name="gdb-advanced"></a>

### GDB Python API

```python
# gdb-python example
import gdb

class BreakOnString(gdb.Breakpoint):
    """Break when a string is found at a memory location"""
    def __init__(self, addr, search_str):
        super().__init__(f"*(void*){addr}")
        self.addr = addr
        self.search_str = search_str
    
    def stop(self):
        # Check if memory contains our string
        val = gdb.selected_inferior().read_memory(
            gdb.parse_and_eval(self.addr), 
            len(self.search_str)
        )
        if self.search_str in val:
            print(f"Found string at {self.addr}")
            return True
        return False

# Usage:
# (gdb) python BreakOnString("0x402000", "password")
```

### GDB Macros and Functions

```bash
# Define custom command
define hexdump
  dump binary memory /tmp/hexdump.bin $arg0 $arg0+$arg1
  shell xxd /tmp/hexdump.bin
end
document hexdump
  hexdump ADDRESS LENGTH - Hex dump memory region
end

# Define function
define fn_name
  set $result = $arg0 + $arg1
  printf "Result: %d\n", $result
end
```

### GDB Scripting for Automation

```bash
#!/usr/bin/gdb -x
# auto_analysis.gdb - Automated analysis script

set disassembly-flavor intel
set pagination off

# Load binary
file ./suspicious_binary

# Set breakpoint at entry
break *_start
run

# Step through entry point
nexti 5

# Log registers
shell echo "=== Registers ===" > /tmp/analysis.txt
shell echo "$(info registers)" >> /tmp/analysis.txt

# Dump memory regions
shell echo "=== Memory Map ===" >> /tmp/analysis.txt
shell echo "$(info proc mappings)" >> /tmp/analysis.txt

# Continue to main
break main
continue

# Dump stack
shell echo "=== Stack ===" >> /tmp/analysis.txt
shell echo "$(x/40xw $rsp)" >> /tmp/analysis.txt

quit
```

### GDB with PEDA (Python Exploit Development Assistance)

```bash
# Install PEDA
git clone https://github.com/longld/peda.git ~/peda
echo "source ~/peda/peda.py" >> ~/.gdbinit

# PEDA features:
# • Enhanced register display (color-coded)
# • Code tracing with visual execution flow
# • Pattern create/search for exploit development
# • Search memory for patterns
# • Checksec command for security features
# • vmmap - enhanced memory map
# • telescope - smart memory view

# Usage:
(gdb) checksec           # Check security mitigations
(gdb) vmmap              # Enhanced memory map
(gdb) telescope 20       # Smart stack view
(gdb) pattern create 200 # Generate pattern for overflow
(gdb) pattern search     # Find offset in overflowed buffer
```

---

## 9. Security Perspective <a name="security"></a>

### Debugging for Vulnerability Analysis

```bash
# Buffer overflow analysis workflow
(gdb) break vulnerable_function
(gdb) run
(gdb) info frame         # Check stack frame
(gdb) x/40xw $rsp       # Dump stack
(gdb) break *ret_addr   # Break at return
(gdb) continue
(gdb) info registers eip # Check return address
(gdb) x/i $eip          # See where execution would go
```

### Shellcode Debugging

```bash
# Debugging shellcode in GDB
(gdb) break *shellcode_addr
(gdb) run
# Examine shellcode bytes:
(gdb) x/20i shellcode_addr
# Step through shellcode:
(gdb) ni
(gdb) info registers eax ebx ecx edx
# Check syscall arguments:
(gdb) p/x $eax          # syscall number
(gdb) p/x $ebx          # arg1
(gdb) p/x $ecx          # arg2
(gdb) p/x $edx          # arg3
```

### Anti-Debugging Detection

```bash
# Common anti-debug checks and bypasses:
# 1. IsDebuggerPresent
(gdb) break IsDebuggerPresent
(gdb) run
(gdb) set $eax = 0      # Return false
(gdb) continue

# 2. CheckRemoteDebuggerPresent
(gdb) break CheckRemoteDebuggerPresent
(gdb) run
(gdb) set {int}($esp+8) = 0  # Set output to FALSE

# 3. NtQueryInformationProcess
(gdb) break NtQueryInformationProcess
(gdb) run
(gdb) set {int}($esp+8) = 0  # ProcessDebugPort = 0

# 4. Timing checks (RDTSC)
(gdb) break *timing_check
(gdb) run
# Modify timing values or NOP out check
```

### Memory Protection Analysis

```bash
# Check memory protections
(gdb) info proc mappings

# Identify:
# r-xp: Code (executable)
# rw-p: Data (writable, not executable) - NX enabled
# rwxp: Writable AND executable - potential vulnerability

# If rwxp found, analyze what's being written there
(gdb) watch *0x7ffff7dc1000  # Watch for writes to executable region
```

---

## 10. Malware Analysis Context <a name="malware"></a>

### Malware Debugging Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Malware Dynamic Analysis Steps                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Setup Analysis Environment                                       │
│    • VM with snapshot                                              │
│    • Disable network (or use INetSim)                              │
│    • Configure debugger (hide from detection)                      │
│                                                                     │
│ 2. Initial Analysis                                                │
│    • Load in debugger                                              │
│    • Check PE headers, imports                                     │
│    • Identify entry point                                          │
│                                                                     │
│ 3. Trace Execution                                                 │
│    • Step through unpacking/deobfuscation                          │
│    • Identify API calls                                            │
│    • Monitor network connections                                   │
│                                                                     │
│ 4. Extract Indicators                                              │
│    • C2 addresses                                                  │
│    • Dropped files                                                 │
│    • Registry modifications                                        │
│    • Persistence mechanisms                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### API Monitoring

```bash
# GDB - Monitor Windows API calls
# Using gdb with gdb-dashboard or custom scripts

# Common malware APIs to monitor:
(gdb) break CreateFileA
(gdb) break WriteFile
(gdb) break CreateProcessA
(gdb) break RegSetValueExA
(gdb) break InternetOpenA
(gdb) break InternetConnectA
(gdb) break HttpSendRequestA

# When API is hit:
(gdb) x/s $esp+4          # First argument (string parameter)
(gdb) x/s $esp+8          # Second argument
(gdb) x/10xb $esp+12      # Buffer content
```

### Unpacking Analysis

```bash
# Generic unpacking workflow:
# 1. Set breakpoint at entry
# 2. Step until OEP (Original Entry Point) found
# 3. Dump unpacked binary
# 4. Analyze unpacked code

# Common unpacker patterns:
# • UPX: jump to OEP after decompression
# • ASPack: complex stub execution
# • Custom: XOR loops, RC4 decryption, etc.

# Finding OEP:
# • Look for CALL/RET after large loop
# • Monitor stack for return address changes
# • Use hardware breakpoint on execution
(gdb) break *0x401000     # At suspected OEP
(gdb) continue
(gdb) info registers eip  # Confirm OEP
(gdb) dump binary memory unpacked.bin 0x401000 0x405000  # Dump
```

---

## 11. Interview Questions <a name="interview"></a>

### Fundamental Questions

1. **What is the difference between a software and hardware breakpoint?**
   - Software: Uses INT 3 (0xCC) opcode, modifies code, unlimited count
   - Hardware: Uses debug registers (DR0-DR3), no code modification, limited to 4
   - Software is faster but detectable; hardware is invisible to program

2. **Explain the difference between step into and step over.**
   - Step into (stepi): Executes one instruction, enters CALL targets
   - Step over (nexti): Executes one instruction, skips over CALL instructions
   - Use step into for code you need to analyze; step over for trusted code

3. **How would you detect if a debugger is attached?**
   - Check PEB.BeingDebugged (fs:[0x30]+2 or gs:[0x60]+2)
   - Call IsDebuggerPresent API
   - Check NtQueryInformationProcess for debug port
   - Timing checks (RDTSC)
   - INT 2D (Windows specific)
   - Hardware breakpoint detection (DR7 register)

4. **What is the purpose of the shadow space in x64 Windows?**
   - 32 bytes allocated by caller for callee's register spills
   - Used by callee to save register parameters
   - Always allocated even if function doesn't use it
   - Provides uniform stack alignment

### Advanced Questions

5. **How does GDB handle shared libraries?**
   - Lazy binding by default
   - Can set breakpoints by function name
   - `set stop-on-solib-events 1` to break on library loads
   - `info sharedlibrary` to list loaded libraries
   - Can examine dynamic linker structures

6. **Explain the concept of a watchpoint and its implementation.**
   - Breaks when specific memory address is accessed
   - Uses hardware debug registers (DR0-DR3)
   - Can watch for reads, writes, or both
   - Limited to 4 simultaneous watchpoints
   - Useful for finding when/where data is modified

7. **How would you debug a forked process?**
   - `set follow-fork-mode child` in GDB
   - Attaches to child after fork
   - `set detach-on-fork off` to debug both
   - Can switch between parent/child with `inferior` command

8. **What are the challenges of debugging optimized code?**
   - Variables may be in registers, not stack
   - Code reordering affects stepping
   - Inlined functions don't appear in call stack
   - May need to use `set optimization level 0`

---

## 12. Hands-On Labs <a name="labs"></a>

### Lab 1: Basic GDB Operations

```bash
# Compile test program
cat > lab1.c << 'EOF'
#include <stdio.h>
#include <string.h>

void secret_function() {
    printf("Secret function called!\n");
}

int main(int argc, char *argv[]) {
    char buffer[64];
    printf("Enter input: ");
    gets(buffer);  // Vulnerable!
    printf("You entered: %s\n", buffer);
    return 0;
}
EOF
gcc -m32 -fno-stack-protector -o lab1 lab1.c

# Tasks:
# 1. Run lab1 in GDB
# 2. Set breakpoint at main
# 3. Examine stack frame setup
# 4. Find buffer on stack
# 5. Determine overflow offset to return address
# 6. Overwrite return address with address of secret_function
```

### Lab 2: Anti-Debugging Bypass

```bash
# Task: Debug a program with anti-debugging checks
# The program uses:
# 1. IsDebuggerPresent
# 2. Timing checks
# 3. PEB inspection

# Steps:
# 1. Identify anti-debugging checks with static analysis
# 2. Set breakpoints at check functions
# 3. Modify return values to bypass checks
# 4. Continue execution after bypass

# GDB commands to try:
(gdb) catch syscall ptrace   # Detect ptrace anti-debug
(gdb) break IsDebuggerPresent
(gdb) break *0x40XXXX       # At timing check
```

### Lab 3: x64dbg Analysis

```bash
# Windows tasks (using x64dbg):
# 1. Load a packed executable
# 2. Use ScyllaHide to bypass anti-debugging
# 3. Trace through unpacking routine
# 4. Dump unpacked binary
# 5. Re-analyze dumped binary

# x64dbg features to use:
# - Trace → Trace Into (F7)
# - Plugins → Scylla → IAT Autosearch
# - Plugins → Scylla → Get Imports
# - Plugins → Scylla → Dump
```

### Lab 4: Memory Forensics with Debugger

```bash
# Analyze a suspicious memory region
# 1. Attach to process
# 2. Find executable memory regions
# 3. Dump suspicious regions
# 4. Analyze for shellcode patterns

# GDB commands:
(gdb) info proc mappings
(gdb) find /b 0x7fff0000, 0x7fff1000, 0x90, 0x90, 0x90, 0x90  # NOP sled
(gdb) find /b 0x7fff0000, 0x7fff1000, 0x31, 0xc0  # XOR EAX, EAX
(gdb) dump binary memory region.bin 0x7fff0000 0x7fff1000
```

### Lab 5: Conditional Breakpoint Analysis

```bash
# Task: Find where a specific value is being written
# Target: Find the instruction that sets password = "correct"

# 1. Set conditional breakpoint on memory write:
(gdb) watch *(char*)0x402000 if *(char*)0x402000 == 'c'

# 2. Or use x64dbg:
# Right-click → Breakpoint → Hardware, on write
# Condition: BYTE PTR [0x402000] == 'c'

# 3. When breakpoint hits, examine:
# - Which instruction wrote the value
# - What code path led to this write
# - What other values are being compared
```

---

## 13. Summary <a name="summary"></a>

### Debugger Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│ Debugger  │ Platform    │ Bit   │ Best For                         │
├─────────────────────────────────────────────────────────────────────┤
│ GDB       │ Linux/Unix  │ 32/64 │ General RE, scripting, automation│
│ x64dbg    │ Windows     │ 32/64 │ Windows RE, plugins, user-friendly│
│ OllyDbg   │ Windows     │ 32    │ Legacy Windows RE               │
│ WinDbg    │ Windows     │ 32/64 │ Kernel debugging, drivers        │
│ LLDB      │ macOS/Linux │ 32/64 │ macOS, Clang integration         │
│ Radare2   │ Cross-plat  │ 32/64 │ Scriptable, integrated disasm    │
└─────────────────────────────────────────────────────────────────────┘
```

### Quick Reference - GDB Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────┐
│ Essential GDB Commands for Reverse Engineering                      │
├─────────────────────────────────────────────────────────────────────┤
│ Running:     r/r args, c, q                                        │
│ Breakpoints: b func, b *addr, b file:line, i b, d N              │
│ Stepping:    si, ni, s, n, finish, bt                              │
│ Registers:   i r, p/x $eax, set $eax=0                            │
│ Memory:      x/Nfdu addr, set {type}addr=val                      │
│ Info:        i r, i b, i f, i proc mappings, i sharedlibrary      │
│ Search:      find /b start, end, pattern                           │
│ Dump:        dump binary memory file start end                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Common Anti-Debugging Bypasses

| Detection | Bypass |
|-----------|--------|
| `IsDebuggerPresent` | Patch PEB.BeingDebugged or hook API |
| `CheckRemoteDebuggerPresent` | Hook and return FALSE |
| `NtQueryInformationProcess` | Hook debug port queries |
| `INT 2D` | Ignore exception |
| `RDTSC` timing | Modify timing values |
| Hardware breakpoint detection | Limit to 4 breakpoints, use software |

### Study Progression

```
Beginner: Basic GDB commands → Breakpoints → Stepping → Memory examine
    ↓
Intermediate: Conditional breakpoints → Memory maps → Register flags
    ↓
Advanced: Python API → PEDA → Anti-debugging bypass → Unpacking
```

---

*Last Updated: 2026*
*For educational and authorized security testing purposes only*
