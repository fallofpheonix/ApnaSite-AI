# Memory Management

## Layer Position

```
┌──────────────────────────────────────────────────────┐
│                    Applications                       │
├──────────────────────────────────────────────────────┤
│                System Call Interface                  │
├──────────────────────────────────────────────────────┤
│           Virtual Memory Subsystem (MMU)             │
│  ┌───────────┐ ┌─────┐ ┌───────────┐ ┌──────────┐  │
│  │Page Table │ │ TLB │ │Page Fault │ │  Swap    │  │
│  │  Manager  │ │Cache│ │ Handler   │ │ Manager  │  │
│  └───────────┘ └─────┘ └───────────┘ └──────────┘  │
├──────────────────────────────────────────────────────┤
│            Physical Memory Manager                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐         │
│  │  Buddy   │  │  Slab    │  │  Page     │         │
│  │Allocator │  │Allocator │  │  Cache    │         │
│  └──────────┘  └──────────┘  └───────────┘         │
├──────────────────────────────────────────────────────┤
│                   Hardware (RAM)                     │
└──────────────────────────────────────────────────────┘
```

## 1. Topic Overview

Memory management allocates, tracks, and protects memory for every process. It provides each process a private virtual address space mapped onto physical RAM on demand, with enforced permissions. Components:

- **Virtual memory**: Isolated address spaces per process
- **Page tables**: Hardware-assisted virtual-to-physical translation
- **TLB**: Translation cache for fast address resolution
- **Page fault handler**: Demand paging and swap management
- **Physical allocators**: Buddy (pages) and slab (objects)
- **Protection**: NX bits, ASLR, stack canaries, guard pages

Security impact: Nearly every kernel and userland exploit targets memory corruption or confusion.

## 2. Why It Exists

Without memory management, every process accesses the same physical RAM directly. Problems:

1. **No isolation**: Process A reads/overwrites Process B's data
2. **No protection**: A buggy program corrupts kernel memory
3. **No overcommit**: More programs than RAM is impossible

Virtual memory gives each process a private, contiguous address space. The MMU translates addresses transparently, and the kernel can remap, swap, or protect pages anytime. Memory isolation is the foundation of all privilege separation.

## 3. Internal Architecture

### 3.1 Virtual Memory

#### Why Virtual Memory Exists

Every process believes it has exclusive access to large contiguous memory. The kernel maps virtual addresses to physical pages on demand. Benefits: isolation, consistent addressing, overcommit, efficient sharing of kernel pages and libraries.

#### Virtual Address Space Per Process

```
Process A                          Process B
┌──────────────────┐              ┌──────────────────┐
│     Kernel       │              │     Kernel       │ ← Shared
│   (top 128GB)    │              │   (top 128GB)    │
├──────────────────┤              ├──────────────────┤
│   Stack ↓        │              │   Stack ↓        │
│                  │              │                  │
│   Heap ↑         │              │   Heap ↑         │
│   .bss/.data     │              │   .bss/.data     │
│   .text          │              │   .text          │
└──────────────────┘              └──────────────────┘
  Physical Pages A,B,C              Physical Pages D,E,F
```

Each process has independent page tables. Writing to the same virtual address in different processes modifies different physical pages.

#### 32-bit vs 64-bit Address Spaces

| Feature | 32-bit | 64-bit |
|---------|--------|--------|
| User space | 3 GB | 128 TB |
| Kernel space | 1 GB | 128 TB |
| Page size | 4 KB | 4 KB, 2 MB, 1 GB |
| Page table levels | 2 | 4 |

x86-64 uses 48 bits (256 TB total). Bits 48–63 mirror bit 48 (canonical addresses).

#### Kernel vs User Virtual Addresses

- **User** (0x0 – 0x7FFFFFFFFFFF): Process-specific mappings
- **Kernel** (0xFFFF800000000000 – 0xFFFFFFFFFFFFFFFF): Mapped in every process, accessible only from ring 0
- Kernel pages are read-only from user mode

**Security**: KASLR randomizes kernel base address to prevent prediction of function addresses.

### 3.2 Page Tables

#### Multi-Level Page Tables (x86-64)

```
Virtual Address (48 bits):
┌─────────┬─────────┬─────────┬─────────┬──────────┐
│ PML4[9] │ PDP[9]  │ PD[9]   │ PT[9]   │Offset[12]│
│ bits 47 │ bits 38 │ bits 29 │ bits 20 │ bits 11-0│
│   -39   │   -30   │   -21   │   -12   │          │
└─────────┴─────────┴─────────┴─────────┴──────────┘

CR3 → PML4 → PDP → PD → PT → Physical Frame + Offset
```

Each level uses 9 bits as an index. Entries are 8 bytes. Sparse mappings only need allocated page table pages.

#### Page Table Entry Format

| Bit | Name | Description |
|-----|------|-------------|
| 0 | Present | 1 = page in physical memory |
| 1 | R/W | 0 = read-only, 1 = read-write |
| 2 | User | 0 = kernel only, 1 = user accessible |
| 5 | Accessed | Page has been read or written |
| 6 | Dirty | Page has been written to |
| 12-51 | Phys Addr | Physical frame address (40 bits) |
| 63 | NX | No-execute bit |

**Security-critical bits**: Present (controls fault), R/W (write-protection), User (privilege), NX (code execution prevention).

### 3.3 TLB (Translation Lookaside Buffer)

#### TLB Structure

```
┌────────────────────────────────────────────┐
│  L1 TLB (64 entries)                       │
│  ┌──────────────┬───────────────────────┐  │
│  │    DTLB      │       ITLB            │  │
│  │  (Data TLB)  │  (Instruction TLB)    │  │
│  └──────────────┴───────────────────────┘  │
├────────────────────────────────────────────┤
│  L2 TLB (1536 entries, unified)            │
└────────────────────────────────────────────┘
```

Without TLB, every memory access requires 4 memory reads. TLB hits resolve in 1 cycle.

#### TLB Miss Handling

```
CPU memory access → TLB lookup
  ├── Hit: use cached translation (fast)
  └── Miss → Hardware page walker
        ├── Found: load into TLB, retry
        └── Not found: page fault → software handler
```

#### TLB Flush and ASID

On process switch, TLB must be flushed. Methods:
- **Full flush**: Invalidate all entries (expensive)
- **ASID (Address Space ID)**: Tag entries with process ID (12 bits, 4096 max). No flush needed on context switch — only the ASID register changes.

**Security**: TLB entries not flushed on privilege transitions enabled Meltdown/Spectre attacks.

### 3.4 Memory Allocation

#### Brk/Heap

`brk()`/`sbrk()` adjust the heap top pointer. Used by `malloc()` for small allocations.

#### mmap

Maps files or anonymous memory into address space. Permissions and sharing controlled via flags (`MAP_PRIVATE`, `MAP_ANONYMOUS`, `MAP_JIT`). Used for libraries, JIT code, large allocations.

#### Stack Allocation

Each thread has a fixed-size stack (8 MB Linux, 1 MB macOS). Grows downward via `push`/`pop` adjusting RSP. Overflow triggers SIGSEGV.

#### Slab Allocator (Kernel)

Pre-allocates pools of fixed-size objects (inodes, dentries, task structs). `kmalloc()` → slab allocator → fast kernel object allocation. SLUB is the default. Metadata corruption enables kernel heap exploits.

#### Buddy Allocator (Physical Pages)

Manages 4 KB page frames in power-of-2 blocks. Splits larger blocks on allocation, coalesces buddies on free. Physical fragmentation solved by CMA and huge pages.

### 3.5 Page Fault Handling

#### Minor Page Fault

Page exists in RAM but not mapped (first mmap access, COW, lazy allocation). Fast — no disk I/O.

#### Major Page Fault

Page must be read from swap/file. Slow (milliseconds) due to disk I/O.

#### Page Fault Handler Flow

```
Virtual address access → MMU: Present bit = 0 → CPU fault
  → Kernel handler
    ├── Address valid, not mapped → Check VMA list
    │     ├── Minor: map existing page
    │     └── Major: read from disk, then map
    ├── Address invalid → Check stack growth
    │     ├── Stack overflow → SIGSEGV
    │     └── Kernel stack → expand, retry
    └── Permission violation → SIGSEGV
```

**Security**: Race conditions in page fault handling (TOCTOU) can escalate privileges.

### 3.6 Swapping and Paging

#### Swap Space

When RAM is full, inactive pages move to disk (`swapon`/`swapoff`). `vm.swappiness` (0–100) controls aggressiveness. Monitor via `/proc/swaps` and `free -h`.

#### Page Replacement Algorithms

| Algorithm | Description |
|-----------|-------------|
| LRU | Evict least recently used (Linux approximation) |
| Clock | Circular list with reference bit |
| LFU | Evict least frequently used |

Linux uses multi-generational LRU with active/inactive lists.

#### OOM Killer

On critical memory pressure, kernel kills the process with highest `oom_score_adj`. Databases set this to -1000. Containers use cgroup-level OOM handling.

### 3.7 Memory Protection

#### No-Execute Bit (NX/DEP)

Bit 63 marks data pages non-executable. Data Execution Prevention (Windows) / W^X (Linux/macOS). JIT compilers must toggle NX: write → mark executable → execute.

#### Address Space Layout Randomization (ASLR)

Randomizes base addresses per execution. 28-bit entropy on x86-64. Defeats ret-to-libc and fixed-address ROP gadgets.

```
Without ASLR:           With ASLR (each run different):
Stack: 0x7fff           Run 1: a3f0    Run 2: 2b80
Heap:  0x6000           Run 1: 1a00    Run 2: 8c00
```

#### Stack Canaries

Random value between local variables and return address. Checked before return. Defeated by info leaks or non-stack overflows.

```
[return address] ← overwrite target
[stack canary]   ← checked
[local buffer]   ← overflow starts here
```

#### Guard Pages

Unmapped pages around sensitive regions. Stack guard page triggers SIGSEGV on overflow. `mprotect(PROT_NONE)` creates inaccessible barriers.

## 4. Key Data Structures

### VMA (Virtual Memory Area)

```c
struct vm_area_struct {
    unsigned long vm_start;     // Region start
    unsigned long vm_end;       // Region end
    pgprot_t vm_page_prot;      // Protection bits
    unsigned long vm_flags;     // R/W/X/shared flags
    struct file *vm_file;       // Backing file
    struct vm_area_struct *vm_next;
};
```

View via `/proc/<pid>/maps`:
```
00400000-00452000 r-xp 00000000 08:01 131074 /usr/bin/cat
7f8b4fe00000-7f8b50000000 r-xp 00000000 08:01 262243 /usr/lib/libc.so.6
```

### /proc/<pid>/smaps

Detailed per-VMA stats: Size, RSS, PSS, Shared/Private clean/dirty. Used in forensic analysis.

## 5. Memory Vulnerabilities

### Buffer Overflow

Writing past buffer boundaries overwrites adjacent data (return addresses, heap metadata). Mitigated by canaries, NX, ASLR, FORTIFY_SOURCE.

### Use-After-Free (UAF)

Accessing memory after `free()`. Freed memory may be reallocated with attacker-controlled content. Common in browsers and kernels.

### Heap Spraying

Allocating many copies of controlled data to fill freed regions. Increases probability of controlled reallocation.

### Heap Feng Shui

Precisely controlling heap layout via allocation/deallocation order to place attacker data at predictable locations.

### Format String Attacks

`%x`, `%n` specifiers read/write arbitrary memory. Mitigated by `-Wformat-security`.

### Double Free

Freeing the same allocation twice corrupts the free list, enabling overlapping allocations.

## 6. Security Hardening

### Kernel Hardening

| Feature | Description |
|---------|-------------|
| KASLR | Randomizes kernel base address |
| SMEP | Kernel cannot execute user pages |
| SMAP | Kernel cannot access user pages |
| KPTI | Page table isolation (Meltdown fix) |
| Stack protector | Kernel stack canaries |
| Heap hardening | SLUB debug, freelist randomization |

### Userland Hardening

| Feature | Toolchain Flag |
|---------|---------------|
| ASLR | Kernel config |
| NX/DEP | Hardware + OS |
| PIE | `-pie` |
| RELRO | `-Wl,-z,relro` |
| FORTIFY_SOURCE | `-D_FORTIFY_SOURCE=2` |
| Stack canaries | `-fstack-protector-strong` |
| CFI | `-fsanitize=cfi` |

## 7. Debugging and Inspection

### /proc/<pid>/maps and smaps

```bash
cat /proc/$(pidof bash)/maps                    # memory map
cat /proc/$(pidof bash)/smaps | grep -E "^(Size|Rss|Pss)"  # usage
```

### GDB Memory Inspection

```bash
gdb -p <pid>
(gdb) x/20x $rsp            # 20 hex words at stack pointer
(gdb) x/10i $rip            # 10 instructions at RIP
(gdb) info proc mappings     # memory mappings
```

### pmap

```bash
pmap -x <pid>   # detailed memory map with sizes
```

## 8. Kernel vs Userland Memory

| Aspect | Userland | Kernel |
|--------|----------|--------|
| Allocation | `malloc()`, `mmap()` | `kmalloc()`, `vmalloc()` |
| Free | `free()`, `munmap()` | `kfree()`, `vfree()` |
| Fault | SIGSEGV → process dies | Kernel panic if unrecoverable |
| Debugging | valgrind, ASan | KASAN, kmemleak |

## 9. System Call Interface

| Syscall | Purpose |
|---------|---------|
| `brk()` / `sbrk()` | Adjust heap end |
| `mmap()` / `munmap()` | Map/unmap memory |
| `mprotect()` | Change page permissions |
| `mlock()` / `munlock()` | Lock pages in RAM |
| `madvise()` | Advise on usage patterns |
| `userfaultfd()` | Handle page faults in userspace |

## 10. x86-64 Linux Process Memory Layout

```
0xFFFFFFFFFFFFFFFF ┌────────────────────────────┐
                   │       Kernel Space          │
0xFFFF800000000000 ├────────────────────────────┤
                   │                             │
0x00007FFFFFFFFFFF ├────────────────────────────┤
                   │  Stack (grows down) ↓       │
                   │  mmap regions (libs, anon)  │
                   │  Heap (grows up) ↑          │
                   ├────────────────────────────┤
                   │  .bss / .data / .rodata     │
                   │  .text                      │
0x0000000000400000 ├────────────────────────────┤
                   │  NULL page (unmapped)       │
0x0000000000000000 └────────────────────────────┘
```

## 11. Page Table Walk Diagram

```
Virtual Address: 0x00007FFF12345678

CR3 → PML4[256] → PDP[18] → PD[9] → PT[69]
  → Physical page 0x1A3B0 + offset 0x678
  = 0x1A3B0678
```

## 12. Memory Protection Mechanisms Comparison

| Mechanism | Protects Against | Bypass |
|-----------|-----------------|--------|
| NX/DEP | Code injection | ROP |
| ASLR | Predictable addresses | Info leak |
| Stack canaries | Stack overflow | Leak canary |
| CFI | ROP/JOP | vtable overwrite |
| SMEP/SMAP | User-kernel confusion | Not easily bypassed |
| PIE | Fixed code addresses | Info leak |

## 13. Interview Questions

1. **Virtual vs physical memory?** Virtual = process-specific address space; physical = actual RAM. MMU translates between them.
2. **4-level page table walk?** CR3 → PML4 → PDP → PD → PT → frame + offset. 9 bits per level, 12-bit offset.
3. **TLB miss?** Hardware walker traverses page table. If page present → load to TLB. If not → page fault.
4. **Minor vs major page fault?** Minor: page in RAM but unmapped. Major: page must be read from disk (slow).
5. **How ASLR protects?** Randomizes layout, defeating ret-to-libc and fixed-address ROP.
6. **Stack canaries?** Random value before return address, checked before return. Defeated by leaks.
7. **Use-after-free?** Accessing freed memory. Attacker controls reallocated content.
8. **Buddy allocator?** Power-of-2 page blocks. Split on alloc, coalesce on free.
9. **KASAN?** Kernel Address Sanitizer. Detects OOB, UAF, double-free at runtime.
10. **SMAP?** Prevents kernel accessing user memory. Requires explicit stac/clac instructions.
11. **OOM killer?** Kills highest oom_score_adj process when RAM exhausted.
12. **Copy-on-write?** fork() shares pages read-only. Write triggers COW fault for private copy.

## 14. Hands-on Labs

### Lab 1: Inspect Process Memory Map

```bash
cat /proc/$(pidof bash)/maps | grep -E "(stack|heap|libc)"
cat /proc/$(pidof bash)/smaps | grep -E "^(Size|Rss|Pss)" | head -20
```

### Lab 2: Demonstrate ASLR

```bash
# Check status
cat /proc/sys/kernel/randomize_va_space   # 0=off, 2=full

# Disable (requires root)
echo 0 | sudo tee /proc/sys/kernel/randomize_va_space
for i in {1..5}; do /usr/bin/cat /proc/self/maps | grep r-xp | head -1; done

# Re-enable
echo 2 | sudo tee /proc/sys/kernel/randomize_va_space
```

### Lab 3: Buffer Overflow Demo

```c
// vulnerable.c
#include <stdio.h>
#include <string.h>
void vulnerable() {
    char buffer[16];
    printf("Enter input: ");
    gets(buffer);
    printf("You entered: %s\n", buffer);
}
int main() { vulnerable(); return 0; }
```

```bash
gcc -o vulnerable vulnerable.c -fno-stack-protector -z execstack -no-pie
python3 -c "print('A'*32)" | ./vulnerable   # Segfault at 0x41414141
```

### Lab 4: Page Fault Analysis

```bash
pidstat -r -p $(pidof bash) 1   # Watch minflt/s and majflt/s
dd if=/dev/zero of=/tmp/bigfile bs=1M count=1024
cat /tmp/bigfile > /dev/null &
pidstat -r -p $! 1              # Observe major faults
```

### Lab 5: mprotect Demonstration

```c
#include <sys/mman.h>
#include <stdio.h>
int main() {
    void *mem = mmap(NULL, 4096, PROT_READ|PROT_WRITE,
                     MAP_PRIVATE|MAP_ANONYMOUS, -1, 0);
    ((char*)mem)[0] = 'A';        // OK (RW)
    mprotect(mem, 4096, PROT_READ);
    ((char*)mem)[0] = 'B';        // SIGSEGV!
    return 0;
}
```

### Lab 6: Heap Spray Concept

```c
#include <stdlib.h>
#include <string.h>
#define N 1000
int main() {
    void *ptrs[N];
    for (int i = 0; i < N; i++) {
        ptrs[i] = malloc(64);
        memset(ptrs[i], 0x41, 64);
    }
    for (int i = 0; i < N; i += 2) free(ptrs[i]);
    printf("Heap sprayed: %d allocs, holes created.\n", N);
    return 0;
}
```

## 15. Key Terms

| Term | Definition |
|------|-----------|
| MMU | Memory Management Unit — hardware address translation |
| TLB | Translation Lookaside Buffer — page table cache in CPU |
| PTE | Page Table Entry — virtual-to-physical mapping |
| VMA | Virtual Memory Area — contiguous region with same permissions |
| ASLR | Address Space Layout Randomization |
| NX/DEP | No-Execute / Data Execution Prevention — non-executable data pages |
| SMEP | Supervisor Mode Execution Prevention — kernel cannot execute user pages |
| SMAP | Supervisor Mode Access Prevention — kernel cannot access user pages |
| KPTI | Kernel Page Table Isolation — separates kernel/user page tables (Meltdown fix) |
| KASLR | Kernel Address Space Layout Randomization |
| COW | Copy-on-Write — shared pages become private on write |
| OOM | Out of Memory — kernel kills a process when RAM exhausted |
| PIE | Position-Independent Executable — code address randomized |
| RELRO | Relocation Read-Only — makes GOT read-only after dynamic linking |
| CFI | Control Flow Integrity — validates indirect call/jump targets |
| KASAN | Kernel Address Sanitizer — detects memory errors at runtime |
| SLUB | Single List Unbounded — default Linux slab allocator |
| CMA | Contiguous Memory Allocator — reserves memory for DMA |
| KPTI | Kernel Page Table Isolation — unmaps kernel pages from user mode |
| ASID | Address Space ID — tags TLB entries per process |
| PCID | Process Context ID — x86 equivalent of ASID |
| W^X | Write XOR Execute — memory cannot be both writable and executable |
| JIT | Just-In-Time — generates code at runtime (requires NX toggling) |
| GDT | Global Descriptor Table — x86 segmentation (largely unused in x86-64) |
| CR3 | Control Register 3 — holds PML4 base address in x86-64 |

## 16. Common Mistakes

1. Disabling ASLR for debugging in production
2. Ignoring `-Wformat-security` warnings
3. Using `gets()` — always use `fgets()` with size limits
4. Passing user input to `printf()` format string
5. Forgetting NX on JIT — mark pages non-writable after code
6. Not checking `mmap` return — MAP_FAILED is `(void*)-1`, not NULL
7. Assuming contiguous physical memory — use `vmalloc()` for large buffers

## 17. Common Exploitation Patterns

### ret2libc

Overwrite return address with `system()` address. Pass `"/bin/sh"` as argument via ROP chain or environment pointer. Defeated by ASLR.

### ROP (Return-Oriented Programming)

Chain small instruction sequences ("gadgets") ending in `ret`. Each gadget performs one operation. Bypasses NX by reusing existing code.

### Heap Exploitation

1. **Tcache poisoning**: Corrupt tcache fd pointer to allocate at arbitrary address
2. **House of Force**: Overwrite top chunk size to jump heap pointer
3. **House of Spirit**: Fake chunk on stack, free it, reallocate to controlled address
4. **Unsafe unlink**: Corrupt fd/bk pointers to write arbitrary address

### Kernel Exploitation

1. **Stack buffer overflow**: Overwrite return address in kernel stack
2. **UAF in kernel objects**: Reclaim freed object with crafted data
3. **Race conditions**: Exploit TOCTOU between permission check and use
4. **Arbitrary read/write**: Use `copy_to_user`/`copy_from_user` bugs

## 18. Performance Considerations

| Operation | Latency | Notes |
|-----------|---------|-------|
| TLB hit | ~1 cycle | Cached translation |
| L1 cache hit | ~4 cycles | Page data in L1 |
| L2 cache hit | ~12 cycles | Page data in L2 |
| RAM access | ~100 cycles | Main memory |
| Minor page fault | ~1-10 μs | Software handler |
| Major page fault | ~5-10 ms | Disk I/O required |
| Swap read | ~10 ms | SSD: ~0.1 ms |

**Performance impact**: Each level of cache miss multiplies latency. TLB coverage is critical — a single TLB miss costs ~100 cycles for the page walk.

## 19. Memory Layout Security Analysis

### Reading Process Memory Map

```bash
# Full memory map
cat /proc/<pid>/maps

# Show permissions (R/W/X)
cat /proc/<pid>/maps | awk '{print $2}' | sort | uniq -c

# Find executable regions (potential shellcode targets)
cat /proc/<pid>/maps | grep 'r-xp'

# Find writable executable regions (W^X violations)
cat /proc/<pid>/maps | grep 'rwxp'

# Check for stack canary
readelf -s <binary> | grep __stack_chk_fail
```

### Checking Binary Protections

```bash
# Using checksec (from pwntools)
checksec --file=<binary>

# Manual checks
readelf -d <binary> | grep BIND_NOW    # RELRO
readelf -h <binary> | grep Type         # PIE (DYN vs EXEC)
readelf -l <binary> | grep GNU_STACK    # NX (stack permissions)
```

## 20. Kernel Memory Debugging

### /proc/slabinfo

```bash
cat /proc/slabinfo | head -5
# Slab cache name, active objects, total objects, object size
```

### /proc/buddyinfo

```bash
cat /proc/buddyinfo
# Shows free blocks per order per zone
```

### Slub Debug

```bash
# Enable SLUB debugging at boot
# Add to kernel cmdline: slub_debug=FZPU
# F = sanity checks, Z = red zoning, P = poisoning, U = user tracking

# Check for corruption
echo 1 > /sys/kernel/slab/<cache>/sanity_checks
```

### KASAN Output

```
==================================================================
BUG: KASAN: slab-out-of-bounds in kmalloc+0x99/0xb0
Write of size 4 at addr ffff888003a48040 by task bash/1234

CPU: 0 PID: 1234 Comm: bash
Call Trace:
 dump_stack+0x6b/0x8a
 print_address_description+0x6c/0x210
 kasan_report+0xe/0x20
 ...
```

## 21. References

- Operating Systems: Three Easy Pieces (OSTEP) — Virtual Memory
- Linux Kernel Development — Memory Management chapter
- Intel SDM Volume 3A — Chapter 4: Paging
- AMD64 Architecture Programmer's Manual Volume 2 — Page Translation
- Phrack: "Smashing the Stack for Fun and Profit"
- Phrack: "The art of exploitation"
- man pages: mmap(2), mprotect(2), brk(2), proc(5)
- Kernel docs: Documentation/admin-guide/mm/
- "The ART of Memory Forensics" — Memory analysis techniques
- "Hacking: The Art of Exploitation" — Memory corruption chapters
- MIT 6.858: Computer Systems Security — lecture notes on memory safety
- Project Zero blog — browser and kernel memory vulnerability analysis
