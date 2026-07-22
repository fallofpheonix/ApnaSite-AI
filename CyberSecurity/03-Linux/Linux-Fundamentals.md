# Linux Fundamentals

## Layer Position

```
┌─────────────────────────────────────────┐
│           Applications                  │  ← User Space
├─────────────────────────────────────────┤
│           Shell / CLI                   │
├─────────────────────────────────────────┤
│           System Libraries (glibc)      │
├─────────────────────────────────────────┤
│           System Call Interface          │  ← User/Kernel Boundary
├─────────────────────────────────────────┤
│           Kernel                        │  ← Kernel Space
│  ┌─────────┬──────────┬──────────────┐  │
│  │ Process │ Memory   │ Filesystem   │  │
│  │ Mgmt    │ Mgmt     │ (VFS)        │  │
│  ├─────────┼──────────┼──────────────┤  │
│  │ Network │ Device   │ Security     │  │
│  │ Stack   │ Drivers  │ (SELinux)    │  │
│  └─────────┴──────────┴──────────────┘  │
├─────────────────────────────────────────┤
│           Hardware Abstraction          │
└─────────────────────────────────────────┘
```

## 1. Topic Overview

Linux is an open-source Unix-like operating system kernel first created by Linus Torvalds in 1991. Combined with GNU utilities, it forms a complete operating system that runs on over 96% of the world's top servers, all Android devices, embedded systems, IoT devices, and every top 500 supercomputer. Linux is a multitasking, multi-user, memory-protected system with a modular architecture that supports extensive customization for any use case.

**Core Characteristics:**
- **Open source** under GPL v2 license; anyone can audit, modify, and redistribute
- **Multi-user** with full process isolation and resource controls
- **Multitasking** with preemptive scheduling across CPU cores
- **Portable** across x86, ARM, MIPS, RISC-V, PowerPC, and more
- **Secure** with SELinux, AppArmor, capabilities, namespaces, and cgroups
- **Networked** with a complete TCP/IP stack and extensive protocol support

**Key Directories:**
```
/bin    Essential user binaries        /etc    System configuration
/sbin   System admin binaries          /var    Variable data (logs)
/usr    User programs and data         /proc   Kernel/process info (virtual)
/dev    Device files                   /sys    Device/driver info (virtual)
/home   User home directories          /tmp    Temporary files (world-writable)
/boot   Kernel and bootloader files    /root   Root user home directory
```

## 2. Why It Exists

Linux was created because proprietary Unix systems in the 1980s were expensive, vendor-locked, and inaccessible. The Unix Wars fragmented the ecosystem into incompatible variants. Linus Torvalds released a free kernel that anyone could modify, triggering the open-source revolution.

**Why Linux Dominates:**
- **Cost**: Free to use, modify, and distribute
- **Transparency**: Auditable source code eliminates hidden backdoors
- **Community**: Thousands of developers contribute security patches globally
- **Rapid Patching**: CVEs are often fixed within hours of disclosure
- **Flexibility**: Customizable for any hardware, from embedded to mainframe
- **Stability**: Production servers routinely run years without reboot

**Why Cybersecurity Professionals Need Linux:**
1. Most servers hosting web apps, databases, and cloud services run Linux
2. Security tools (Nmap, Metasploit, Burp Suite, Wireshark) are Linux-native
3. Penetration testing distributions (Kali, Parrot, BlackArch) are Linux-based
4. Digital forensic analysis requires deep filesystem knowledge
5. Incident response demands kernel-level understanding of processes and memory
6. Container security (Docker, Kubernetes) is fundamentally Linux-based

## 3. Internal Architecture

### 3.1 Linux History and Philosophy

**Unix Origins (1969-1970)**
- Ken Thompson and Dennis Ritchie created Unix at Bell Labs
- Written in C language, making it the first portable OS
- Established fundamental concepts: processes, pipes, filesystem hierarchy
- Led to System V (AT&T) and BSD (Berkeley) variants

**GNU/Linux Combination (1983-1991)**
- Richard Stallman launched the GNU Project in 1983 to create a free Unix
- GNU created GCC, glibc, Bash, coreutils, but lacked a working kernel
- Linus Torvalds wrote the Linux kernel starting in 1991
- Combined GNU tools + Linux kernel = complete free operating system
- The name "Linux" technically refers to the kernel only

**Open Source Model**
- GPL v2 license requires derivative works to remain open source
- Anyone can audit, modify, fork, and redistribute the code
- Corporate contributions: Red Hat, Google, Microsoft, Meta, Intel
- Over 27 million lines of code in the mainline kernel (2024)

**"Everything is a File" Philosophy**
```
┌──────────────────────────────────────────┐
│        Everything is a File              │
├──────────────────────────────────────────┤
│  Regular Files    → text, binaries       │
│  Directories      → file containers      │
│  Device Files     → /dev/sda, /dev/tty   │
│  Sockets          → /var/run/*.sock      │
│  Pipes            → named and unnamed    │
│  Symbolic Links   → path shortcuts       │
│  /proc/*          → kernel/runtime data  │
│  /sys/*           → device/driver info   │
└──────────────────────────────────────────┘
```

This design allows a uniform API: `open()`, `read()`, `write()`, `close()` work identically on all file types.

### 3.2 Linux Distributions

| Category | Distribution | Package Manager | Use Case |
|----------|-------------|-----------------|----------|
| **Debian-based** | Ubuntu | apt/dpkg | Desktop, Server |
| | Kali Linux | apt/dpkg | Penetration Testing |
| | Debian | apt/dpkg | Stable Servers |
| | Linux Mint | apt/dpkg | User Desktop |
| **Red Hat-based** | RHEL | yum/dnf/rpm | Enterprise |
| | CentOS Stream | yum/dnf/rpm | Free Enterprise |
| | Fedora | yum/dnf/rpm | Cutting Edge |
| | Rocky Linux | yum/dnf/rpm | RHEL Clone |
| **Arch-based** | Arch Linux | pacman | DIY / Learning |
| | Manjaro | pacman | User-friendly Arch |
| | EndeavourOS | pacman | Arch + GUI |
| **Security-focused** | Kali Linux | apt/dpkg | 600+ pentest tools |
| | Parrot OS | apt/dpkg | Pentest + Privacy |
| | BlackArch | pacman | 2800+ security tools |
| | Security Onion | apt/dpkg | Network Security |
| **Minimal/Container** | Alpine | apk | Docker, Edge |
| | Void Linux | xbps | Independent |

**Selection Criteria:** Debian/RHEL for production stability, Kali/Parrot for pentesting, Arch for deep learning, Alpine for minimal containers, RHEL/Rocky for compliance.

### 3.3 Linux Directory Structure (FHS)

```
/                              ← Root directory
├── bin/                       ← Essential user binaries
│   ├── ls, cp, mv, rm, mkdir
│   ├── cat, grep, awk, sed
│   └── bash, sh, env
├── sbin/                      ← System administration binaries
│   ├── iptables, ip6tables
│   ├── fdisk, mkfs, mount
│   └── init, systemctl
├── usr/                       ← User programs and data
│   ├── bin/                   ← Secondary user binaries
│   ├── sbin/                  ← Secondary system binaries
│   ├── lib/                   ← Shared libraries
│   ├── lib64/                 ← 64-bit libraries
│   ├── local/                 ← Locally installed software
│   │   ├── bin/               ← Custom binaries
│   │   ├── lib/               ← Custom libraries
│   │   └── share/             ← Custom data files
│   └── share/                 ← Architecture-independent data
│       ├── man/               ← Manual pages
│       └── doc/               ← Documentation
├── etc/                       ← System configuration
│   ├── passwd                 ← User accounts (no passwords)
│   ├── shadow                 ← Password hashes (root-only read)
│   ├── group                  ← Group definitions
│   ├── sudoers                ← Sudo rules (edit with visudo)
│   ├── fstab                  ← Filesystem mount table
│   ├── hosts                  ← Static hostname resolution
│   ├── resolv.conf            ← DNS resolver config
│   └── ssh/                   ← SSH configuration
│       ├── sshd_config        ← Server config
│       └── ssh_config         ← Client config
├── var/                       ← Variable data
│   ├── log/                   ← System logs
│   │   ├── syslog / messages  ← General system log
│   │   ├── auth.log / secure  ← Authentication events
│   │   └── kern.log           ← Kernel messages
│   ├── www/                   ← Web document root
│   ├── cache/                 ← Package cache
│   ├── lib/                   ← State information
│   └── spool/                 ← Mail/print queues
├── proc/                      ← Virtual: kernel/process info
│   ├── [pid]/                 ← Per-process data
│   │   ├── status             ← Process status
│   │   ├── cmdline            ← Command line args
│   │   ├── maps               ← Memory mappings
│   │   └── fd/                ← Open file descriptors
│   ├── cpuinfo                ← CPU information
│   ├── meminfo                ← Memory statistics
│   ├── version                ← Kernel version string
│   ├── modules                ← Loaded kernel modules
│   └── net/                   ← Network statistics
├── sys/                       ← Virtual: device/driver info
├── dev/                       ← Device files
│   ├── sda, sdb, sdc         ← Storage disks
│   ├── tty*, pty*             ← Terminals
│   ├── null                   ← Black hole (discard)
│   ├── zero                   ← Null byte stream
│   └── random, urandom        ← Random number generators
├── home/                      ← User home directories
│   └── username/
│       ├── .bashrc            ← Shell config
│       ├── .profile           ← Login config
│       └── .ssh/              ← SSH keys
├── root/                      ← Root user home directory
├── boot/                      ← Kernel and GRUB files
│   ├── vmlinuz                ← Kernel image
│   ├── initrd.img             ← Initial RAM disk
│   └── grub/                  ← GRUB bootloader
├── lib/, lib64/               ← Shared libraries
├── media/                     ← Removable media mount points
├── mnt/                       ← Temporary mount points
├── opt/                       ← Third-party software
├── tmp/                       ← Temporary files (world-writable)
└── run/                       ← Runtime data (PIDs, sockets)
```

**Security-Critical Paths:**
| Path | Perm | Sensitivity |
|------|------|-------------|
| /etc/shadow | 640 root:shadow | Password hashes |
| /etc/sudoers | 440 root:root | Privilege escalation |
| /etc/ssh/sshd_config | 600 root:root | SSH server config |
| /root | 700 root:root | Root home directory |
| /tmp | 1777 all:all | World-writable, risky |

### 3.4 Linux Kernel

**Monolithic with Loadable Modules:**
```
User Space → System Call Interface → Kernel Space
Kernel: Process Mgmt | Memory Mgmt | VFS | Network | Drivers | Security
```

**Module Commands:**
```bash
lsmod                       # List loaded modules
modinfo <module>             # Module details
modprobe <module>            # Load module (resolves deps)
modprobe -r <module>         # Remove module
insmod <path>/<module>.ko    # Direct load (no deps)
rmmod <module>               # Direct unload
depmod -a                    # Rebuild module deps
lspci -k                     # Show kernel driver per device
```

**Kernel Hardening (/etc/sysctl.conf):**
```bash
net.ipv4.ip_forward = 0              # Disable IP forwarding
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1          # SYN flood protection
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
kernel.randomize_va_space = 2        # Full ASLR
kernel.dmesg_restrict = 1            # Restrict dmesg to root
kernel.kptr_restrict = 2             # Hide kernel pointers
kernel.yama.ptrace_scope = 1         # Restrict ptrace
kernel.unprivileged_bpf_disabled = 1
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
sysctl -p                            # Apply changes
```

### 3.5 Linux Boot Process

```
BIOS/UEFI → GRUB → Kernel → initramfs → systemd → Target
```

| Phase | Action | Time |
|-------|--------|------|
| BIOS/UEFI | POST, hardware detection, find boot device | 1-5s |
| GRUB | Load bootloader, show menu, load kernel | 1-3s |
| Kernel | Decompress, initialize, load initramfs | 1-2s |
| initramfs | Mount root FS, load essential drivers | 1-3s |
| systemd | Start services, activate sockets, reach target | 2-10s |

**GRUB Config:** Edit `/etc/default/grub`, then `update-grub` (Debian) or `grub2-mkconfig` (RHEL)

**Systemd Targets:** poweroff(0), rescue(1), multi-user(3), graphical(5), reboot(6)

**Service Commands:**
```bash
systemctl start|stop|restart|status <service>
systemctl enable|disable <service>
systemctl get-default / set-default multi-user.target
journalctl -u <service> -f
systemd-analyze blame          # Boot time analysis
systemd-analyze critical-chain # Dependency chain
```

## 4. Process Management

**States:**
```
┌─────────────────────────────────────────┐
│           Process State Machine         │
├─────────────────────────────────────────┤
│   ┌──────┐  fork()  ┌──────────┐       │
│   │ NULL │────────▶│ Runnable  │       │
│   └──────┘         │ (Ready)   │       │
│                     └─────┬────┘       │
│                           │ schedule() │
│                           ▼            │
│                     ┌──────────┐       │
│                     │ Running  │       │
│                     │  (R)     │       │
│                     └─────┬────┘       │
│                           │            │
│          ┌────────────────┼────────┐   │
│          ▼                ▼        ▼   │
│   ┌──────────┐   ┌─────────┐ ┌──────┐ │
│   │ Sleeping │   │ Stopped │ │Dead  │ │
│   │  (S)     │   │  (T)    │ │ (Z)  │ │
│   └──────────┘   └─────────┘ └──────┘ │
│        │ wake_up()                     │
│        ▼                               │
│   ┌──────────┐                         │
│   │ Waiting  │ ← uninterruptible      │
│   │ (D)      │   (disk I/O)           │
│   └──────────┘                         │
└─────────────────────────────────────────┘
```

**State Codes:** R=Running, S=Sleeping(interruptible), D=Waiting(disk), T=Stopped, Z=Zombie

```bash
ps aux / ps -ef               # List all processes
top / htop                    # Real-time monitor
cat /proc/<pid>/status        # Process status
cat /proc/<pid>/cmdline       # Command line args
cat /proc/<pid>/maps          # Memory mappings
ls -la /proc/<pid>/fd         # Open file descriptors
cat /proc/<pid>/environ       # Environment variables
kill -<signal> <pid>          # Send signal
kill -9 <pid>                 # Force kill (SIGKILL)
nice -n 10 <cmd>              # Start with low priority
renice -n 5 -p <pid>          # Change running priority
pgrep <name>                  # Find PID by name
pidof <name>                  # Find PID (exact match)
pstree -p                     # Process tree with PIDs
```

**Key Signals:**
| Signal | Num | Usage |
|--------|-----|-------|
| SIGHUP | 1 | Reload config (nginx, sshd) |
| SIGINT | 2 | Interrupt (Ctrl+C) |
| SIGQUIT | 3 | Quit with core dump (Ctrl+\) |
| SIGKILL | 9 | Force kill (unrecoverable) |
| SIGTERM | 15 | Graceful kill (default) |
| SIGSTOP | 19 | Pause (Ctrl+Z) |
| SIGCONT | 18 | Resume paused process |

## 5. File System Security

**Permissions Model:**
```
┌─────────────────────────────────────────────────┐
│            Permission Bits                     │
├─────────────────────────────────────────────────┤
│  rwx rwx rwx  =  7  7  7                      │
│  │ │ │ │ │ │ │ │ │  │  │  │                   │
│  │ │ │ │ │ │ │ │ │  │  │  └── Other: rwx      │
│  │ │ │ │ │ │ │ │ │  │  └───── Group: rwx      │
│  │ │ │ │ │ │ │ │ │  └──────── User: rwx       │
│  └─┴─┴─┴─┴─┴─┴─┴─┴──┴──┴─────┘               │
│  read(4) write(2) execute(1)                   │
└─────────────────────────────────────────────────┘
```

```bash
chmod 755 file     # rwxr-xr-x (executables)
chmod 600 file     # rw------- (private files)
chmod 644 file     # rw-r--r-- (regular files)
chmod 700 dir      # rwx------ (private dirs)
chmod 4755 bin     # SUID (runs as owner)
chmod 2755 dir     # SGID (runs as group)
chmod 1777 /tmp    # Sticky (owner-only delete)
chown user:group file
chown -R user:group dir    # Recursive
setfacl -m u:bob:rwx file   # Set ACL
getfacl file                 # View ACL
setfacl -d -m u:bob:rwx dir # Default ACL
```

**Integrity Monitoring:**
```bash
sha256sum /etc/passwd
find /etc -type f -exec sha256sum {} \; > /root/baseline.sha256
sha256sum -c /root/baseline.sha256
aide --init && aide --check    # AIDE integrity checker

# Find security anomalies
find / -type f -perm -4000 -ls 2>/dev/null    # SUID files
find / -type f -perm -2000 -ls 2>/dev/null    # SGID files
find / -type f -perm -0002 -ls 2>/dev/null    # World-writable
find / -type d -perm -0002 -ls 2>/dev/null    # World-writable dirs
find / -nouser -o -nogroup 2>/dev/null        # Unowned files
find / -mtime -1 -ls 2>/dev/null              # Modified today
```

## 6. User and Group Management

```bash
useradd -m -s /bin/bash user
passwd user
usermod -aG sudo user
userdel -r user
id user / whoami / w / last / lastb
chage -M 90 user             # Password max age
```

**Sudo (/etc/sudoers - edit with visudo):**
```
username ALL=(ALL:ALL) ALL
%admin ALL=(ALL) ALL
Defaults requiretty, timestamp_timeout=5
```

## 7. Network Fundamentals

```bash
ip addr show                    # IP addresses
ip link show                    # Interfaces
ip route show                   # Routing table
ip neigh show                   # ARP table
ss -tuln                        # Listening ports
ss -tp                          # Established connections
lsof -i                         # Network open files
lsof -i -P -n                   # No DNS resolution
dig <domain>                    # DNS lookup
dig +trace <domain>             # Full DNS path
host <domain>                   # Simple DNS lookup
cat /etc/resolv.conf            # DNS servers
cat /etc/hosts                  # Static hosts
```

**Firewall:**
```bash
# iptables (traditional)
iptables -L -n -v                                     # List rules
iptables -A INPUT -p tcp --dport 22 -j ACCEPT         # Allow SSH
iptables -A INPUT -p tcp --dport 80 -j ACCEPT         # Allow HTTP
iptables -A INPUT -p tcp --dport 443 -j ACCEPT        # Allow HTTPS
iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT         # Allow subnet
iptables -A INPUT -j DROP                              # Default drop
iptables -D INPUT 3                                    # Delete rule #3

# nftables (modern)
nft list ruleset
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add rule inet filter input tcp dport 22 accept

# UFW (Ubuntu)
ufw enable
ufw status verbose
ufw allow 22/tcp
ufw allow from 192.168.1.0/24
ufw deny from 10.0.0.5
ufw delete allow 22/tcp

# firewalld (RHEL/CentOS)
firewall-cmd --state
firewall-cmd --list-all
firewall-cmd --add-service=ssh --permanent
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload
```

## 8. Log Analysis

**Log Locations:**
```
/var/log/syslog          # General system (Debian)
/var/log/messages        # General system (RHEL)
/var/log/auth.log        # Authentication (Debian)
/var/log/secure          # Authentication (RHEL)
/var/log/kern.log        # Kernel messages
/var/log/dmesg           # Boot messages
/var/log/cron.log        # Cron jobs
/var/log/apache2/        # Apache logs
/var/log/nginx/          # Nginx logs
```

```bash
# Authentication analysis
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
grep "Accepted" /var/log/auth.log | tail -20
grep "sudo:" /var/log/auth.log | tail -20

# Service logs
journalctl -u sshd --since "1 hour ago"
journalctl -u nginx --since "2024-01-01" --until "2024-01-02"
journalctl -p err                    # Errors and above
journalctl -b -1                     # Previous boot
journalctl --disk-usage              # Journal size
journalctl --vacuum-size=100M        # Limit journal size

# Kernel messages
dmesg | grep -i "error\|fail\|denied"
dmesg -T | tail -50                  # Timestamped

# Cron analysis
grep "CRON" /var/log/syslog | tail -20

# Log rotation
cat /etc/logrotate.conf
cat /etc/logrotate.d/*
```

## 9. Package Management

| Distro | Update | Install | Search | Clean |
|--------|--------|---------|--------|-------|
| Debian | apt update && apt upgrade | apt install | apt search | apt clean |
| RHEL | dnf update | dnf install | dnf search | dnf clean all |
| Arch | pacman -Syu | pacman -S | pacman -Ss | pacman -Scc |

## 10. Service Security

**SSH Hardening (/etc/ssh/sshd_config):**
```
Port 2222
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
AllowUsers alice bob
```

**Audit:** `systemctl list-unit-files --type=service --state=running` + `ss -tuln`

## 11. Kernel Security

```bash
# Blacklist modules (/etc/modprobe.d/blacklist.conf)
blacklist cramfs / udf / hfs / hfsplus / udf
install <module> /bin/false

# Harden mounts (/etc/fstab)
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev 0 0
```

## 12. Security Tools

```bash
lynis audit system            # Security audit
fail2ban-client status        # Ban brute-force IPs
ausearch -k passwd_changes    # Audit logs
aureport --summary            # Audit summary
```

## 13. Incident Response

```bash
ss -tp / lsof -i              # Active connections
last -x / lastb               # Login history
crontab -l / ls /etc/cron*    # Persistence check
systemctl list-unit-files | grep enabled
cat ~/.bashrc ~/.profile      # User persistence
ls -la ~/.ssh/                # SSH keys
```

## 14. Container Security

```bash
docker run --user 1000:1000 --read-only --cap-drop=ALL --memory=512m alpine
trivy image <image_name>
docker info | grep -i security
```

## 15. Hands-on Labs

### Lab 1: System Reconnaissance
```bash
# Gather complete system information
uname -a                          # Kernel version
cat /etc/os-release               # OS details
hostnamectl                       # Hostname info

# Hardware inventory
lscpu                             # CPU details
free -h                           # Memory usage
lsblk                             # Block devices
lspci | grep -i network           # Network hardware
lspci | grep -i storage           # Storage hardware

# Network configuration
ip a                              # IP addresses
ip r                              # Routing table
ss -tuln                          # Listening ports
cat /etc/resolv.conf              # DNS config
cat /etc/hosts                    # Static hosts

# User and process info
who                               # Logged-in users
w                                 # Detailed logged-in users
last                              # Login history
lastb                             # Failed logins
ps auxf                           # Process tree
top -bn1 | head -20               # Top processes snapshot
```

### Lab 2: Log Analysis
```bash
# Find security events
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
grep "Accepted" /var/log/auth.log | tail -20
grep "sudo:" /var/log/auth.log | tail -20
grep "CRON" /var/log/syslog | tail -20

# Kernel and system messages
dmesg | grep -i "error\|fail\|denied"
journalctl -u sshd --since "24 hours ago"
journalctl -p err --since today

# Build attack timeline
aureport --auth                   # Auth events
ausearch -m USER_LOGIN --start today
last -x | head -50
```

### Lab 3: Security Hardening
```bash
# SSH hardening
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall setup
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp
ufw enable

# Automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Audit rules
apt install auditd
auditctl -w /etc/passwd -p wa -k identity
auditctl -w /etc/shadow -p wa -k identity
auditctl -w /etc/sudoers -p wa -k sudoers
auditctl -w /var/log/auth.log -p wa -k auth_log

# Kernel hardening
sysctl -w net.ipv4.tcp_syncookies=1
sysctl -w kernel.randomize_va_space=2
sysctl -w kernel.dmesg_restrict=1
```

## 16. Interview Questions

1. **Process vs Thread?** Process: separate memory. Thread: shared memory within process.
2. **Boot order?** BIOS/UEFI → GRUB → Kernel → initramfs → systemd
3. **/proc purpose?** Virtual FS for kernel/process runtime data
4. **OOM killer?** Kernel terminates memory-hogging processes when exhausted
5. **SELinux vs Unix perms?** SELinux adds mandatory access control on discretionary
6. **Hard vs Soft link?** Hard: inode-based. Soft: path-based, separate inode
7. **cgroups vs namespaces?** cgroups: resource limits. Namespaces: process isolation
8. **iptables vs nftables?** nftables is modern replacement with simpler syntax

## 17. Quick Reference

| Command | Purpose |
|---------|---------|
| `ls -la` | List all files |
| `find / -name "*.conf"` | Find files |
| `grep -r "pattern" /path` | Recursive search |
| `chmod 755 file` | Change permissions |
| `chown user:group file` | Change ownership |
| `df -h` / `free -h` | Disk/memory usage |
| `uname -a` | System information |

## 18. Resources

- **Books:** *The Linux Command Line*, *Linux Kernel Development*, *How Linux Works*
- **Practice:** OverTheWire Bandit, HackTheBox, TryHackMe
- **Docs:** tldp.org, man7.org, wiki.archlinux.org

---

**Next:** [Command Line](./Command-Line.md) | [File System](./File-System.md) | [Permissions](./Permissions-Users.md) | [System Admin](./System-Administration.md) | [Shell Scripting](./Shell-Scripting.md)
