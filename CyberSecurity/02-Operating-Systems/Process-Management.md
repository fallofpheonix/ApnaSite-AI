# Process Management

## Layer Position

Process Management sits at the core of the OS kernel, mediating between hardware (CPU) and user applications. It is invoked on every system call, interrupt, and context switch, making it the most frequently exercised kernel subsystem.

```
+---------------------------------------------+
|           User Applications                 |
+---------------------------------------------+
|         System Call Interface                |
+---------------------------------------------+
|  Process Management | Memory | File System  |
+---------------------------------------------+
|           Hardware Abstraction              |
+---------------------------------------------+
|         CPU | RAM | I/O Devices             |
+---------------------------------------------+
```

## 1. Topic Overview

Process Management is how the OS creates, schedules, synchronizes, terminates, and communicates between running programs. A **process** is a program in execution with its own virtual address space, file descriptors, signal handlers, and security context. The kernel maintains a **Process Control Block (PCB)** for every process, tracks process states through their lifecycle, and rapidly switches the CPU between them (context switching) to create the illusion of parallel execution.

Key subsystems:
- **Process creation/destruction** — fork, exec, exit, wait
- **Scheduling** — deciding which process runs next on which CPU core
- **Context switching** — saving/restoring processor state between processes
- **IPC** — pipes, shared memory, sockets, signals, message queues
- **Threads** — lightweight execution units sharing a process address space
- **Namespaces / cgroups** — isolation and resource limiting (containers)

## 2. Why It Exists

Without process management, a computer could run only one program at a time. The OS multiplexes the CPU across many processes, providing:

- **Multitasking** — interactive responsiveness; dozens of programs share the CPU
- **Isolation** — each process gets its own virtual address space; a crash in one does not corrupt others
- **Resource control** — CPU time, memory, I/O bandwidth are partitioned via schedulers and cgroups
- **Security** — processes run with specific UIDs/GIDs and capabilities; privilege escalation requires crossing well-defined kernel boundaries
- **Concurrency** — multiple threads/processes execute simultaneously on multi-core CPUs

Attackers target process management to escape sandboxes (namespace breakout), inject code into privileged processes (DLL injection, process hollowing), or exhaust CPU via fork bombs. Defenders monitor process trees, scheduling anomalies, and IPC channels to detect malicious activity.

## 3. Internal Architecture

### 3.1 Process Control Block (PCB)

Every process has a PCB — a kernel data structure that holds all metadata needed to manage and resume it.

**Linux: `task_struct`** (defined in `include/linux/sched.h`)

```c
struct task_struct {
    pid_t pid;                    // Process ID
    pid_t tgid;                   // Thread group ID (main thread = PID)
    volatile long state;          // Task state (TASK_RUNNING, etc.)
    void *stack;                  // Kernel stack pointer
    struct mm_struct *mm;         // Virtual memory descriptor
    struct files_struct *files;   // Open file descriptors
    struct signal_struct *signal; // Signal handling info
    struct cred *cred;            // UID, GID, capabilities
    unsigned int policy;          // Scheduling policy (SCHED_NORMAL, etc.)
    int prio;                     // Dynamic priority
    cpumask_t cpus_allowed;       // CPU affinity mask
    char comm[TASK_COMM_LEN];     // Process name (16 chars)
};
```

**Windows: `EPROCESS` / `KTHREAD`**

```
EPROCESS (Executive Process Block)
+-- PEB (Process Environment Block) -- user-mode visible
|   +-- ImageBaseAddress
|   +-- ProcessHeap
|   +-- NtGlobalFlag
+-- UniqueProcessId
+-- InheritedFromUniqueProcessId
+-- ActiveProcessLinks -- doubly-linked list of all processes
+-- ObjectTable -- handle table
+-- VadRoot -- virtual address descriptors
+-- Token -- security token (privileges, SIDs)
```

**Key fields for security analysis:**

| Field | Purpose |
|-------|---------|
| PID / PPID | Process identity and parent relationship |
| UID / EUID / Saved UID | Real vs effective vs saved user ID (privilege model) |
| Capabilities | Fine-grained kernel privileges (Linux) |
| SeDebugPrivilege | Ability to open other processes (Windows) |
| Open file descriptors | What resources the process can access |
| Seccomp filter | Syscall filtering (sandboxing) |

### 3.2 Process States and Transitions

**Linux process states:**

```
              +--------------+
              |   NEW/FORK   |
              +------+-------+
                     | schedule()
                     v
              +--------------+   <-- wake_up ----------+
              |    TASK_     |                          |
              |   RUNNING    |-------+                  |
              +------+-------+       |                  |
                     |               |                  |
          +----------+               |             +----+-----+
          |          |               v             |  TASK_   |
          v          |        +--------------+     | INTERRUPT-
   +----------+      |        |    TASK_     |     |  IBLE
   |  TASK_   |      +------->|  INTERRUPT-  |-----+
   |  PREEMPT |               |    IBLE      |   (woken by signal)
   | _DISABLED|               +------+-------+
   +----------+                      |
                                     | wait event
                                     v
                              +--------------+
                              |    TASK_     |
                              |   BLOCKED    |-----> (waiting on I/O,
                              |  (SLEEPING)  |       event, or resource)
                              +--------------+
                                     |
                              exit() |
                                     v
                              +--------------+
                              |   EXIT_      |
                              |  ZOMBIE      |---- parent calls wait()
                              +--------------+      to collect exit status
```

**Simplified state diagram:**

```
  fork()
    |
    v
 +-------+  schedule()  +---------+  sleep/wait  +---------+
 | NEW   |------------> | RUNNING |-------------> | WAITING |
 +-------+              +----+----+               +----+----+
                             |    interrupt/event        |
                             |<---------------------------+
                             |  exit()
                             v
                      +-------------+  wait()   +----------+
                      |  TERMINATED |<----------|  ZOMBIE  |
                      +-------------+           +----------+
```

**Windows process states:**

| State | Meaning |
|-------|---------|
| Initialized | Being created but not yet runnable |
| Ready | Waiting to be scheduled onto a CPU |
| Running | Currently executing on a CPU core |
| Waiting | Blocked on I/O or event |
| Terminating | Being cleaned up |

### 3.3 Process Creation

**Linux — fork() + exec() model:**

```c
#include <unistd.h>
#include <stdio.h>

int main() {
    pid_t pid = fork();      // Duplicate current process

    if (pid == 0) {
        // Child process — gets return value 0
        printf("Child PID: %d, Parent PID: %d\n", getpid(), getppid());
        execl("/bin/ls", "ls", "-la", "/tmp", NULL);
        perror("exec failed");
        _exit(1);
    } else if (pid > 0) {
        // Parent process — gets child's PID
        int status;
        wait(&status);
        printf("Child exited with status: %d\n", WEXITSTATUS(status));
    } else {
        perror("fork failed");
    }
    return 0;
}
```

**Process creation flow:**

```
Parent Process                    Kernel                        Child Process
     |                              |                               |
     |---- fork() ----------------->|                               |
     |                              |  1. Allocate new task_struct  |
     |                              |  2. Copy parent's mm_struct   |
     |                              |  3. Copy open file descriptors|
     |                              |  4. Assign new PID            |
     |                              |  5. Add to process table      |
     |                              |  6. Set state = TASK_RUNNING  |
     |<------ returns child PID ----|                               |
     |                              |-------- returns 0 ---------->|
     |                              |                               |
     |--- wait() --> (sleeping)     |                               |
     |                              |--- execve() ----------------->|
     |                              |   1. Load ELF binary          |
     |                              |   2. Replace address space    |
     |                              |   3. Transfer to new entry    |
     |                              |<---- exit() ------------------|
     |<---- wakes up, gets status --|                               |
```

**Linux clone() — creating threads:**

```c
// clone() shares specific resources with the child
clone(child_fn, stack_ptr,
      CLONE_VM |           // Share virtual memory
      CLONE_FS |           // Share filesystem info
      CLONE_FILES |        // Share file descriptors
      CLONE_SIGHAND |      // Share signal handlers
      CLONE_THREAD,        // Same thread group
      &arg);

// pthreads is a wrapper around clone()
#include <pthread.h>
void *thread_func(void *arg) { printf("Thread running\n"); return NULL; }
pthread_t tid;
pthread_create(&tid, NULL, thread_func, NULL);
pthread_join(tid, NULL);
```

**Windows — CreateProcess():**

```c
#include <windows.h>
int main() {
    STARTUPINFO si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    CreateProcess(NULL, "C:\\Windows\\System32\\cmd.exe",
        NULL, NULL, FALSE, CREATE_NEW_CONSOLE,
        NULL, NULL, &si, &pi);
    WaitForSingleObject(pi.hProcess, INFINITE);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return 0;
}
```

### 3.4 Context Switching

A context switch saves the state of the currently running process and restores the state of the next process to run.

**What gets saved/restored:**

```
+-----------------------------------------+
|           Context Switch                 |
+-----------------------------------------+
| SAVE current process:                   |
|   - CPU registers (RAX, RBX, RCX, ...)  |
|   - Instruction pointer (RIP)           |
|   - Stack pointer (RSP)                 |
|   - Flags register (RFLAGS)            |
|   - FPU / SIMD state                    |
|   - Page table base (CR3 on x86)       |
+-----------------------------------------+
| RESTORE next process:                   |
|   - All of the above from PCB          |
|   - Load new CR3 -> new address space   |
|   - Flush TLB (or use ASID/PCID)      |
+-----------------------------------------+
```

**Cost of context switching:**

| Component | Typical Cost |
|-----------|-------------|
| Save/restore registers | ~0.5-1 us |
| TLB flush + refill | ~1-10 us |
| Cache pollution (cold cache) | ~10-100 us |
| Total effective cost | ~1-100 us |
| Switches per second (desktop) | 100-10,000 |

TLB flush is the dominant cost. Modern CPUs use **PCID** (Process Context Identifiers) to avoid full TLB flushes on switches between a small set of processes. On Linux, `CONFIG_PREEMPT` allows the scheduler to interrupt kernel code, reducing latency to microseconds.

### 3.5 Scheduling Algorithms

**First-Come, First-Served (FCFS):**
- Simple queue; process runs to completion
- Starvation possible for short processes behind long ones (convoy effect)

**Shortest Job First (SJF):**
- Optimal average waiting time but requires knowing burst times
- Leads to starvation of long processes

**Round Robin (RR):**
- Each process gets a fixed time quantum (e.g., 4ms)
- Too small = excessive switching; too large = degraded interactivity

**Linux CFS (Completely Fair Scheduler):**

```
vruntime = (actual_runtime x NICE_0_WEIGHT) / process_weight
Higher weight (lower nice) -> vruntime grows slower -> gets more CPU
```

- Red-black tree keyed by vruntime; leftmost node runs next
- Nice values (-20 to +19) map to weights
- Latency target: 6ms desktop, 48ms server (`sched_latency_ns`)

**Windows Priority-Based Scheduler:**

```
32 priority levels (0-31):
  0-15:  variable (boosted by kernel for I/O, foreground)
  16-31: real-time (never preempted by lower-priority)
Priority = process class base + thread offset
```

**Real-Time Scheduling:**

| Policy | Description | Use Case |
|--------|-------------|----------|
| `SCHED_FIFO` | Runs until yields/blocks | Low-latency drivers, audio |
| `SCHED_RR` | FIFO with time quantum | Multiple RT threads |
| `SCHED_DEADLINE` | Earliest deadline first | Predictable periodic workloads |

### 3.6 Inter-Process Communication (IPC)

**Mechanism Comparison:**

| Mechanism | Speed | Direction | Scope | Use Case |
|-----------|-------|-----------|-------|----------|
| Pipe (anonymous) | Fast | Unidirectional | Parent-Child | Shell pipelines |
| Named Pipe (FIFO) | Fast | Unidirectional | Any process | Legacy IPC |
| Shared Memory | Fastest | Bidirectional | Related processes | Databases, caching |
| Message Queue | Moderate | Bidirectional | Any process | Microservices |
| Signal | Slow | Asynchronous | Any process | Kill, alarm, notify |
| Socket (Unix) | Moderate | Bidirectional | Local | Services, X11 |
| Socket (TCP/IP) | Moderate | Bidirectional | Remote | Network services |

**Pipes:**

```c
int fd[2];
pipe(fd);  // fd[0] = read, fd[1] = write
if (fork() == 0) { close(fd[0]); write(fd[1], "hello", 5); close(fd[1]); }
else { close(fd[1]); char buf[6]; read(fd[0], buf, 5); close(fd[0]); }
```

**Shared Memory:**

```c
int fd = shm_open("/myshm", O_CREAT | O_RDWR, 0666);
ftruncate(fd, 4096);
void *ptr = mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
strcpy(ptr, "shared data");    // write
printf("%s\n", (char *)ptr);   // read
shm_unlink("/myshm");
```

**Signals:**

```
SIGKILL(9)  - Terminate (cannot be caught)
SIGTERM(15) - Graceful shutdown
SIGSEGV(11) - Segmentation fault
SIGINT(2)   - Ctrl+C
SIGSTOP(19) - Suspend (cannot be caught)
SIGCONT(18) - Resume
SIGCHLD(17) - Child exited
SIGUSR1(10) - User-defined 1
SIGTRAP(5)  - Debugger breakpoint
```

### 3.7 Threads

**User-level vs Kernel-level Threads:**

```
Many-to-One          One-to-One (Linux/Windows)    Many-to-Many
User: T1,T2,T3       User: T1    User: T1          User: T1,T2
     |                    |           |                  |   |
Kernel: KT             Kernel: KT  Kernel: KT       Kernel: KT,KT
(legacy, no parallel)  (NPTL, modern)              (flexible mapping)
```

**Thread Local Storage (TLS):**

```c
__thread int thread_local_var;  // GCC/Clang
// Each thread gets own copy; accessed via FS/GS segment registers
// %fs:0x28 = stack canary on Linux x86-64
```

**Synchronization primitives:**

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_lock(&lock);   // critical section
pthread_mutex_unlock(&lock);

sem_t sem; sem_init(&sem, 0, 3);
sem_wait(&sem);              // blocks if 0
sem_post(&sem);              // increments

pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
pthread_mutex_lock(&mutex);
while (!condition) pthread_cond_wait(&cond, &mutex);
pthread_mutex_unlock(&mutex);
```

**Deadlock (Coffman conditions):**

1. Mutual Exclusion — resource held exclusively
2. Hold and Wait — holds one, waits for another
3. No Preemption — cannot forcibly take
4. Circular Wait — cycle in wait-for graph

**Prevention:** lock ordering (A->B->C), try-lock with backoff, timeout, kernel deadlock detection.

## 4. Process Creation Flow Diagrams

### fork()/exec() Pattern

```
                    +-------------+
                    |  Parent     |
                    +------+------+
                           |
                    +------v------+
                    |   fork()    |
                    +------+------+
                           |
              +------------+------------+
       +------v------+          +------v------+
       |   Child     |          |   Parent    |
       +------+------+          +------+------+
              |                         |
       +------v------+          +------v------+
       |  execve()   |          |  wait()     |
       | Load binary |          +-------------+
       | Replace     |
       | addr space  |
       +------+------+
              |
       +------v------+
       | main() runs |
       +-------------+
```

### Linux Clone Flags

```
CLONE_VM        -> Share virtual memory (threads)
CLONE_FILES     -> Share open file descriptors
CLONE_SIGHAND   -> Share signal handlers
CLONE_NEWNS     -> New mount namespace (containers)
CLONE_NEWPID    -> New PID namespace (containers)
CLONE_NEWUSER   -> New user namespace (unprivileged containers)
CLONE_NEWNET    -> New network namespace (containers)
Container creation uses ~7 CLONE_NEW* flags for OS-level isolation.
```

## 5. /proc Filesystem Inspection

```bash
# Inspect a specific process
cat /proc/1/status        # Name, State, Pid, PPid, Uid
cat /proc/1/cmdline | tr '\0' ' '
cat /proc/1/environ | tr '\0' '\n'
cat /proc/1/maps          # Memory mappings
ls -la /proc/1/fd/        # Open file descriptors (symlinks)
ls -la /proc/1/exe        # Executable binary (recoverable deleted files)
cat /proc/1/limits        # Resource limits
cat /proc/1/sched         # Scheduling stats

# State codes: R=running, S=sleeping, D=disk sleep, T=stopped, Z=zombie

# Dynamic tuning
echo "new-name" > /proc/self/comm
echo -500 > /proc/<pid>/oom_score_adj
cat /proc/sys/kernel/randomize_va_space  # ASLR: 0=off, 2=full
```

## 6. strace Examples

```bash
# Basic tracing
strace ls -la /tmp                  # all syscalls
strace -t ls                        # with timestamps
strace -e trace=network curl https://example.com  # network only
strace -c ls                        # syscall statistics

# Security-relevant patterns
strace -e trace=read,open,access -f sudo id          # credential reads
strace -e trace=connect,sendto,recvfrom -f ./myapp   # socket connections
strace -e trace=fork,clone,execve -f ./myapp         # process creation
strace -e trace=write,sendto -fp $(pgrep suspect)    # exfiltration

# Real output analysis
$ strace -e trace=openat,read,write curl -s http://example.com
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\0\0\0\0\0\0"..., 832) = 832   # Loading libc
openat(AT_FDCWD, "/etc/resolv.conf", O_RDONLY|O_CLOEXEC) = 3  # DNS
socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 3
connect(3, {sin_port=htons(80), sin_addr=inet_addr("93.184.216.34")}, 16) = 0
write(3, "GET / HTTP/1.1\r\nHost: example.com\r\n...", 79) = 79
```

## 7. Process-Related Security Attacks

### Process Injection

```
Technique          Description                          OS        Detection
---------------------------------------------------------------------------------
DLL Injection      Force target to load malicious DLL   Windows   Sysmon Event 8
                   via CreateRemoteThread+LoadLibrary

Process Hollowing  Create suspended process, replace    Windows   Memory mismatch
                   image, then resume execution         (Ghosting)

Ptrace Injection   Attach via ptrace, modify memory/    Linux     audit logs
                   registers, inject shellcode

LD_PRELOAD         Force load shared object before      Linux     /proc/<pid>/environ
                   libc (preloads into every process)

AtomBombing        Write via global atom table into     Windows   Atom table
                   target address space
```

### DLL Injection Flow (Windows)

```
Attacker Process                     Target Process
      |                                     |
      |--- OpenProcess(ALL_ACCESS) -------->|
      |--- VirtualAllocEx() --------------->| (alloc in target)
      |--- WriteProcessMemory() ----------->| (write DLL path)
      |--- CreateRemoteThread() ----------->|
      |     fn = LoadLibraryA               |
      |     param = "evil.dll" path         |
      |                                     |
      |                    Target calls LoadLibraryA("evil.dll")
      |                    evil.dll DllMain() runs in target context
```

### Ptrace Exploitation (Linux)

```c
ptrace(PTRACE_ATTACH, target_pid, NULL, NULL);
waitpid(target_pid, &status, 0);
struct user_regs_struct regs;
ptrace(PTRACE_GETREGS, target_pid, NULL, &regs);
regs.rip = injected_address;
ptrace(PTRACE_SETREGS, target_pid, NULL, &regs);
ptrace(PTRACE_DETACH, target_pid, NULL, NULL);
```

**Defense:** `kernel.yama.ptrace_scope=1` restricts ptrace to parent-only.

### Process Hollowing Detection

```
Indicators:
1. Process created SUSPENDED then resumes with different image
2. In-memory image doesn't match on-disk executable
3. /proc/<pid>/maps shows executable regions with no file backing

Tools: Volatility malfind, Sysmon Event ID 8+10, Process Hacker
```

### Process Tree Abuse (Persistence)

```
Techniques: WMI event subscriptions, scheduled tasks, services, at/atd, cron
Detection: unexpected parent-child relationships, orphaned processes (PPID=1),
           systemd-analyze security, web server spawning shells
```

## 8. Linux Security Features for Processes

### seccomp-BPF (Syscall Filtering)

```c
struct sock_filter filter[] = {
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS, offsetof(struct seccomp_data, nr)),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, __NR_read, 0, 1),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_ALLOW),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, __NR_write, 0, 1),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_ALLOW),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_KILL),  // deny rest
};
```

### Linux Capabilities

```
CAP_NET_RAW          Raw socket operations
CAP_NET_BIND_SERVICE Bind to ports < 1024
CAP_SYS_ADMIN        Mount, namespace, almost root
CAP_SYS_PTRACE       ptrace any process
CAP_SYS_MODULE       Load/unload kernel modules
CAP_DAC_OVERRIDE     Bypass file permission checks
CAP_KILL             Send signals to any process
CAP_SETUID           Change UID arbitrarily

# Check: getpcaps <PID>  |  Run: capsh --caps="cap_net_raw+ep" -- -c "ping ..."
```

### Mandatory Access Control

```
AppArmor: profile-based, /etc/apparmor.d/, aa-status, aa-enforce
SELinux: label-based, getenforce, sesearch -A -s httpd_t
```

## 9. Windows Process Security

```
Security Descriptor:
+-- Owner SID
+-- Group SID
+-- DACL: ACE entries (ALLOW/DENY per user/group)
+-- SACL: audit rules

Key APIs: OpenProcess, AdjustTokenPrivileges, ImpersonateLoggedOnUser,
          CreateProcessAsUser

Monitoring:
- Sysmon Event 1: Process Create
- Sysmon Event 8: CreateRemoteThread
- Sysmon Event 10: ProcessAccess
- Security Event 4688: Process Creation
- Security Event 4689: Process Termination
```

## 10. Container Process Isolation

```
Container = Process + namespaces + cgroups + capabilities

Namespace   Isolates                    Command
-----------------------------------------------
PID         Process ID numbers          unshare --pid --fork --mount-proc
NET         Network stack               unshare --net
MNT         Mount points                unshare --mount
UTS         Hostname                    unshare --uts
USER        UID/GID mappings            unshare --user

# Inspect: ls -la /proc/<pid>/ns/  |  lsns -t pid  |  nsenter -t <pid> -p
```

## 11. Process Monitoring and Forensics

```bash
top -d 1; htop                          # Real-time monitoring
vmstat 1 5; pidstat -d 1                # I/O stats

# Forensic artifacts
/proc/<pid>/exe    # Executable (recover deleted binaries)
/proc/<pid>/fd/    # Open file descriptors
/proc/<pid>/maps   # Memory layout
/proc/<pid>/stack  # Kernel stack trace
/proc/<pid>/wchan  # What process is blocked on

# Audit
sudo ausearch -k execve -ts recent
sudo ausearch -ua root -ts today
```

## 12. Hands-on Labs

### Lab 1: Process States

```bash
sleep 3600 & SPID=$!
cat /proc/$SPID/status | head -5         # State: S (sleeping)
kill -SIGSTOP $SPID
cat /proc/$SPID/status | head -5         # State: T (stopped)
kill -SIGCONT $SPID
cat /proc/$SPID/status | head -5         # State: S (sleeping)

# Zombie: parent never calls wait()
cat > zombie.c << 'EOF'
#include <unistd.h>
int main() { if (fork()==0) _exit(0); sleep(3600); return 0; }
EOF
gcc -o zombie zombie.c && ./zombie &
sleep 1 && ps aux | awk '$8=="Z"'
```

### Lab 2: Context Switch Measurement

```bash
sudo apt install linux-tools-common
perf stat -e context-switches -a sleep 10
perf stat -e context-switches -p <PID>
```

### Lab 3: IPC Mechanisms

```bash
mkfifo /tmp/myfifo
echo "hello" > /tmp/myfifo &     # writer
cat /tmp/myfifo                   # reader

ipcmk -M 1M; ipcs -m; ipcrm -m <shmid>  # shared memory
```

### Lab 4: ptrace Defense

```bash
cat /proc/sys/kernel/yama/ptrace_scope  # 0=any, 1=parent-only, 2=none
sudo sysctl kernel.yama.ptrace_scope=1
strace -p <non-child-PID>              # Should fail with EPERM
```

### Lab 5: Process Injection Detection

```bash
# Watch for /proc/<pid>/maps changes
while true; do md5sum /proc/<PID>/maps; sleep 1; done | uniq -f0 -d

# Audit syscalls
sudo auditctl -w /usr/bin/strace -p warx -k trace_proc
sudo ausearch -k trace_proc
```

## 13. Interview Questions

### Conceptual

**1. Process vs thread?**
Process: own address space, file descriptors, security context. Thread: shares process resources, own stack/registers. fork() expensive; clone() cheap.

**2. Zombie process prevention?**
Child calls exit() but parent hasn't called wait(). Keep PCB until parent collects status. Fix: call wait()/waitpid(), set SIGCHLD handler, or signal(SIGCHLD, SIG_IGN).

**3. Why is context switching expensive?**
TLB flush (page tables differ per process) dominates. PCID/ASID mitigates. Cache pollution adds latency (~1-100 us total).

**4. How does CFS achieve fairness?**
Tracks vruntime per process in red-black tree. Lowest vruntime runs next. Nice value scales weight: higher weight = slower vruntime growth = more CPU.

**5. Pipes vs shared memory vs sockets?**
Pipes: kernel-copied, unidirectional, parent-child. Shared memory: zero-copy, needs sync, fastest. Sockets: bidirectional, network-capable, highest overhead.

### Security

**6. DLL injection flow?**
OpenProcess -> VirtualAllocEx -> WriteProcessMemory (DLL path) -> CreateRemoteThread (LoadLibraryA). Target loads malicious DLL.

**7. Process hollowing detection?**
CreateProcess suspended -> UnmapViewOfFile -> WriteProcessMemory -> SetThreadContext -> ResumeThread. Detect: memory image vs on-disk PE mismatch, Sysmon events.

**8. ptrace security?**
Attacker reads/writes target memory/registers. Defense: ptrace_scope=1, CAP_SYS_PTRACE restriction, SELinux/AppArmor.

**9. Container isolation mechanism?**
CLONE_NEW* flags create isolated namespaces (PID, NET, MNT, etc.) + cgroups for resource limits. Not a hypervisor — kernel exploits can escape.

**10. How to find 100% CPU process?**
`top -H` per-thread, `ps -Lp <PID>`, `/proc/<PID>/task/<TID>/stat`, `/proc/<PID>/stack` for kernel bottlenecks.

**11. Recover deleted running binary?**
`cp /proc/<PID>/exe /tmp/recovered`

**12. Fork bomb detection?**
`ps -e --no-headers | wc -l`, set `ulimit -u <max>`, watch for exponential growth.

**13. Process hiding indicators?**
/proc/<pid> missing from ls, but visible in kernel structures. Check /proc/net/tcp for hidden sockets, dmesg for kernel warnings.

**14. Name resolution in strace?**
DNS: openat("/etc/resolv.conf"), read nameserver lines. Hosts: openat("/etc/hosts"). NSS: openat("/etc/nsswitch.conf").

**15. Seccomp vs capabilities?**
Seccomp filters which syscalls a process can invoke (syscall-level sandboxing). Capabilities control which kernel operations are permitted (fine-grained root replacement). Both used together for defense-in-depth.
