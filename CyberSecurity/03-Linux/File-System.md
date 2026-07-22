# Linux File System

## Layer Position

```
┌─────────────────────────────────────────────┐
│              User Applications              │
├─────────────────────────────────────────────┤
│              System Libraries               │
├─────────────────────────────────────────────┤
│           System Call Interface              │
├─────────────────────────────────────────────┤
│         Virtual Filesystem (VFS)            │  ← Uniform abstraction layer
├─────────────────────────────────────────────┤
│   ext4 │ XFS │ Btrfs │ procfs │ sysfs ...  │  ← Specific filesystem drivers
├─────────────────────────────────────────────┤
│        Block Device Layer / I/O Scheduler   │
├─────────────────────────────────────────────┤
│              Physical Disks                 │
└─────────────────────────────────────────────┘
```

The Linux file system sits at the boundary between user-space and kernel-space. Every `open()`, `read()`, `write()`, and `close()` call traverses from userspace through the VFS abstraction into a concrete filesystem driver, then down to the block layer. Understanding this stack is essential for hardening, forensics, and incident response.

---

## 1. Topic Overview

The Linux file system encompasses all mechanisms for persistent and transient data storage, organization, access control, and naming. It includes the directory hierarchy (FHS), kernel-level filesystem drivers (ext4, XFS, Btrfs), virtual filesystems (`/proc`, `/sys`), mounting infrastructure, partition management (fdisk, LVM), and the permission model that enforces discretionary access control (DAC) and supports mandatory access control (MAC) via SELinux or AppArmor.

From a security perspective, the file system is the most auditable surface on a Linux system. File timestamps (atime, mtime, ctime, btime) enable forensic timelines. Permission bits (SUID, SGID, sticky bit) define privilege boundaries. Extended attributes store security labels. Every process interaction with data leaves a trace here.

---

## 2. Why It Exists

Linux needs a file system for several critical reasons:

1. **Data Organization** — Hierarchical namespace for billions of files across diverse storage backends.
2. **Persistence** — Data survives process termination and system reboots.
3. **Access Control** — Per-file DAC permissions, ACLs, and MAC labels enforce least-privilege principles.
4. **Abstraction** — VFS provides a uniform API regardless of underlying storage (disk, SSD, network, ramdisk, kernel objects).
5. **Integrity** — Journaling filesystems (ext4, XFS) protect against corruption from power failure. Btrfs adds checksumming.
6. **Recoverability** — Filesystem snapshots and journals enable rollback and forensic recovery.
7. **Sharing** — NFS, CIFS/SMB, FUSE enable remote and userspace filesystem access.

Without a file system, there would be no way to name, organize, secure, or recover data. It is the foundation of every privilege boundary, audit trail, and evidence artifact on a Linux system.

---

## 3. Internal Architecture

### 3.1 Linux Filesystem Hierarchy (FHS)

The Filesystem Hierarchy Standard defines the directory structure and contents. The root `/` is the apex of all mount points.

```
/
├── bin/          → Essential user binaries (ls, cp, cat)
├── sbin/         → Essential system binaries (mount, iptables, fsck)
├── lib/          → Shared libraries for /bin and /sbin
├── lib64/        → 64-bit libraries (x86_64 systems)
├── usr/          → Secondary hierarchy (user programs)
│   ├── bin/      → Non-essential user binaries
│   ├── sbin/     → Non-essential system binaries
│   ├── lib/      → Libraries for /usr/bin and /usr/sbin
│   ├── local/    → Locally installed software (/usr/local/bin, /usr/local/lib)
│   └── share/    → Architecture-independent data (man pages, docs)
├── etc/          → System-wide configuration files
│   ├── passwd    → User account information
│   ├── shadow    → Hashed passwords (root-readable only)
│   ├── fstab     → Static filesystem mount table
│   ├── hosts     → Static hostname-to-IP mappings
│   └── ssh/      → SSH server configuration
├── var/          → Variable data (logs, mail, spool)
│   ├── log/      → System and application logs
│   ├── tmp/      → Temporary files preserved across reboots
│   └── lib/      → Dynamic state (rpm, dpkg databases)
├── tmp/          → Temporary files (world-writable, sticky bit)
├── home/         → User home directories
├── root/         → Root user's home directory
├── opt/          → Optional/third-party software packages
├── mnt/          → Temporary mount points (admin use)
├── media/        → Removable media mount points (USB, CD)
├── dev/          → Device files (character and block devices)
│   ├── null      → Black hole (writes discarded, reads EOF)
│   ├── zero      → Infinite null bytes stream
│   ├── random    → Kernel entropy pool (blocking)
│   ├── urandom   → Non-blocking pseudorandom generator
│   └── sda       → First SCSI/SATA disk
├── proc/         → Virtual filesystem — kernel and process information
│   ├── [pid]/    → Per-process directory (maps, fd, status)
│   ├── cpuinfo   → CPU information
│   ├── meminfo   → Memory usage statistics
│   ├── version   → Kernel version string
│   └── mounts    → Currently mounted filesystems
├── sys/          → Virtual filesystem — kernel object model
│   ├── block/    → Block devices
│   ├── class/    → Device classes (net, tty, usb)
│   ├── devices/  → Device tree
│   └── kernel/   → Kernel tunables
├── boot/         → Boot loader files (vmlinuz, initramfs, GRUB)
├── run/          → Runtime data (PID files, sockets, tmpfs)
└── lost+found/   → Recovered filesystem fragments (ext4, one per partition)
```

### 3.2 File Types in Linux

Every file has a type indicated by the first character of `ls -l` output:

| Type | `ls -l` prefix | Description | `mknod` / Creation |
|------|---------------|-------------|-------------------|
| Regular file | `-` | Contains data (text, binary, executables) | `touch file` |
| Directory | `d` | Contains other files and directories | `mkdir dir` |
| Symbolic link | `l` | Points to another path by name | `ln -s target link` |
| Hard link | `-` (same inode) | Additional name for same inode data | `ln source link` |
| Character device | `c` | Streams data byte-by-byte (keyboard, serial) | `mknod dev c MAJOR MINOR` |
| Block device | `b` | Reads/writes in fixed blocks (disks) | `mknod dev b MAJOR MINOR` |
| Named pipe | `p` | IPC mechanism, one-directional byte stream | `mkfifo pipe` |
| Unix domain socket | `s` | Bidirectional IPC endpoint for local processes | `socat` / programmatic |

**Symbolic vs Hard Links:**
- Hard link: shares the same inode number; deleting the original doesn't remove data until all hard links are gone. Cannot cross filesystem boundaries. Cannot link directories.
- Symbolic link: separate inode pointing to a path string; broken if original is deleted. Can span filesystems and link to directories.

```
$ stat file.txt
  File: file.txt
  Size: 1234       Blocks: 8          IO Block: 4096   regular file
Access: (0644/-rw-r--r--)  Uid: ( 1000/ user)   Gid: ( 1000/ user)
Access: 2026-07-15 10:30:00.000000000 -0400
Modify: 2026-07-15 09:15:00.000000000 -0400
Change: 2026-07-15 09:15:00.000000000 -0400
 Birth: 2026-07-10 14:00:00.000000000 -0400
```

Timestamps:
- **atime** — Last access (read). Disabled by default on many mount options (`noatime`).
- **mtime** — Last content modification.
- **ctime** — Last metadata change (permissions, ownership, links).
- **btime** (birth) — File creation time (ext4+, not available on all tools).

### 3.3 Filesystem Types

| Filesystem | Journaling | Max File Size | Max Volume | Checksumming | Use Case |
|-----------|-----------|---------------|-----------|-------------|----------|
| ext4 | Yes | 16 TiB | 1 EiB | No | General-purpose, default on most distros |
| XFS | Yes (metadata) | 8 EiB | 8 EiB | No | Large files, high-performance I/O |
| Btrfs | COW (no journal) | 16 EiB | 16 EiB | Yes (data + metadata) | Snapshots, deduplication, self-healing |
| F2FS | Yes | 3.94 TiB | 16 TiB | Yes | Flash/SSD optimized |
| tmpfs | N/A | Limited by RAM | Limited by RAM | N/A | /tmp, /run, swap |
| procfs | N/A | N/A | N/A | N/A | /proc — kernel and process data |
| sysfs | N/A | N/A | N/A | N/A | /sys — kernel object attributes |
| OverlayFS | N/A | Same as underlying | Same as underlying | N/A | Container layers (Docker, Podman) |
| NFS | N/A | N/A | N/A | N/A | Network file sharing |
| CIFS/SMB | N/A | N/A | N/A | N/A | Windows file sharing interop |

### 3.4 Mounting

Mounting attaches a filesystem to a directory (mount point) in the VFS tree.

```bash
# View mounted filesystems
mount                          # All mounts
findmnt --tree                 # Tree view
cat /proc/mounts               # Kernel's mount table

# Mount a device
mount -t ext4 /dev/sda1 /mnt/data
mount -t nfs server:/share /mnt/nfs
mount -o ro,noexec /dev/sdb1 /mnt/readonly

# Unmount
umount /mnt/data
umount -l /mnt/data            # Lazy unmount (detach when busy)

# /etc/fstab — Persistent mount configuration
# <device>      <mount>     <type>  <options>                <dump> <fsck>
UUID=abcd-1234  /boot       ext4    defaults,noatime          0      1
/dev/vg0/lv_home /home      ext4    defaults,nodev,nosuid     0      2
tmpfs           /tmp        tmpfs   defaults,noexec,nosuid    0      0
```

**Filesystem in Userspace (FUSE):** Allows unprivileged users to create filesystems in userspace (e.g., `sshfs`, `gocryptfs`, `rclone mount`). Security implications: FUSE mounts can expose data without root, but require `allow_other` in `/etc/fuse.conf` for multi-user access.

### 3.5 Disk and Partition Management

```bash
# Partition tools
fdisk -l               # List partitions (MBR/GPT)
parted /dev/sdb print   # GPT-aware partition tool
lsblk                   # Block device tree

# LVM — Logical Volume Manager
# Physical Volumes → Volume Groups → Logical Volumes

pvcreate /dev/sda1 /dev/sdb1           # Initialize as PVs
vgcreate vg_data /dev/sda1 /dev/sdb1   # Create volume group
lvcreate -L 50G -n lv_app vg_data      # Create logical volume
lvcreate -l 100%FREE -n lv_backup vg_data
mkfs.ext4 /dev/vg_data/lv_app
mount /dev/vg_data/lv_app /app

# Resize (online)
lvextend -L +20G /dev/vg_data/lv_app
resize2fs /dev/vg_data/lv_app          # ext4
xfs_growfs /app                         # XFS

# RAID (mdadm)
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sda1 /dev/sdb1
mdadm --detail /dev/md0
```

**LVM Architecture Diagram:**
```
┌──────────────────────────────────────────────────┐
│                 Logical Volumes                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │  lv_app  │  │ lv_data  │  │  lv_swap │     │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│        └──────────────┼─────────────┘            │
│                       │                          │
│              ┌────────┴────────┐                 │
│              │   vg_data VG    │                 │
│              └────────┬────────┘                 │
│        ┌──────────────┼──────────────┐           │
│   ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐     │
│   │ pv_sda1  │  │ pv_sdb1  │  │ pv_sdc1  │     │
│   └──────────┘  └──────────┘  └──────────┘     │
│        ↑              ↑              ↑           │
│    /dev/sda1      /dev/sdb1      /dev/sdc1      │
└──────────────────────────────────────────────────┘
```

---

## 4. Permissions Model

### 4.1 Standard UNIX Permissions

```
-rwxr-xr-- 1 user group 4096 Jul 15 09:00 file
│├─┤├─┤├─┤
│ │  │  └── Other: read
│ │  └───── Group: read + execute
│ └──────── User: read + write + execute
└────────── File type
```

**Numeric (octal):**
| Octal | Binary | Permission |
|-------|--------|-----------|
| 0 | 000 | --- |
| 1 | 001 | --x |
| 2 | 010 | -w- |
| 3 | 011 | -wx |
| 4 | 100 | r-- |
| 5 | 101 | r-x |
| 6 | 110 | rw- |
| 7 | 111 | rwx |

### 4.2 Special Permission Bits

| Bit | Octal | When Set | Security Impact |
|-----|-------|----------|-----------------|
| SUID (4) | `4755` | Executes as file owner | If binary is writable/exploitable, attacker gains owner privileges |
| SGID (2) | `2755` | Executes as file group | On directories, new files inherit group |
| Sticky Bit (1) | `1777` | Only owner can delete files in dir | Protects `/tmp` from deletion attacks |

**Security Risks — SUID/SGID Abuse:**
```bash
# Find all SUID binaries (common recon step)
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null

# Dangerous SUID binaries:
# /usr/bin/vim, /usr/bin/nmap, /usr/bin/python3, /usr/bin/find
# /usr/bin/less, /usr/bin/env, /usr/bin/awk
# These can be abused via GTFOBins for privilege escalation

# World-writable files (should never exist in production)
find / -perm -0002 -type f 2>/dev/null
find / -perm -0002 -type d 2>/dev/null

# World-writable directories without sticky bit
find / -type d -perm -0002 ! -perm -1000 2>/dev/null
```

### 4.3 Access Control Lists (ACLs)

```bash
# Get ACL
getfacl /secure/data

# Set ACL
setfacl -m u:backupuser:r /secure/data
setfacl -m g:analysts:rwx /shared/analysis
setfacl -d -m g:analysts:rx /shared/analysis   # Default ACL for new files

# Remove ACL
setfacl -b /secure/data
```

### 4.4 Extended Attributes and Security Labels

```bash
# List extended attributes
getfattr -d /important/file

# Set attribute
setfattr -n user.purpose -v "critical" /important/file

# SELinux context
ls -Z /var/www/html
# -rw-r--r--. root root unconfined_u:object_r:httpd_sys_content_t:s0 index.html
```

---

## 5. Security Hardening

### 5.1 File Permission Hardening Checklist

```bash
# Disable core dumps
echo "* hard core 0" >> /etc/security/limits.conf
echo "fs.suid_dumpable = 0" >> /etc/sysctl.conf

# Secure /tmp (separate partition, noexec,nosuid,nodev)
# Add to /etc/fstab:
# /dev/sdaX /tmp ext4 defaults,noexec,nosuid,nodev 0 0

# Restrict cron access
chmod 600 /etc/crontab
chmod 700 /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly

# Remove world-writable files
find / -xdev -type f -perm -0002 -exec chmod o-w {} \;

# Remove unnecessary SUID/SGID
find / -xdev -type f -perm -4000 -exec chmod u-s {} \;  # Careful — breaks some tools

# Set proper home directory permissions
chmod 700 /home/*
```

### 5.2 File Integrity Monitoring (FIM)

```bash
# AIDE (Advanced Intrusion Detection Environment)
aide --init              # Create baseline
aide --check             # Check against baseline

# Tripwire
tripwire --check         # Verify file integrity

# Manual hashing baseline
find /usr/bin /usr/sbin -type f -exec sha256sum {} \; > /root/baseline_hashes.txt
sha256sum -c /root/baseline_hashes.txt  # Verify later

# Audit rules for file monitoring
auditctl -w /etc/passwd -p wa -k passwd_changes
auditctl -w /etc/shadow -p wa -k shadow_changes
auditctl -w /etc/sudoers -p wa -k sudoers_changes
ausearch -k passwd_changes
```

---

## 6. Debugging and Analysis

### 6.1 Essential File Inspection Commands

```bash
# File identification
file /bin/ls                    # Identify file type
file -b /bin/ls                 # Without filename
magic -f /bin/ls                # Low-level magic number check

# Find files
find / -name "*.conf" -type f 2>/dev/null
find / -user root -perm -4000 2>/dev/null        # SUID files
find / -mtime -1 -type f 2>/dev/null             # Modified in last 24h
find / -inum 131073 -type f 2>/dev/null           # Find by inode
find / -newer /tmp/reference -type f 2>/dev/null  # Newer than reference

# locate (faster, uses indexed database)
updatedb                      # Update database
locate passwd                  # Search filename

# File metadata
stat /etc/passwd               # Full file metadata
ls -la /etc/passwd             # Permissions, ownership, size, timestamps
ls -ldi /etc/passwd            # Show inode number

# Open files
lsof                           # List all open files
lsof -u username               # Files open by user
lsof -c processname            # Files open by process
lsof +D /var/log               # Files open in directory
lsof /dev/sda1                 # Processes using device

# Strings extraction
strings /usr/bin/ls | head -20  # Readable strings in binary
strings -n 8 suspicious.bin     # Minimum 8 chars
```

### 6.2 Disk Usage Analysis

```bash
du -sh /var/*                   # Summarize by directory
du -sh /var/* | sort -rh | head -20  # Top 20 largest
df -h                           # Filesystem space usage
df -i                           # Inode usage
ncdu /                          # Interactive disk usage explorer
```

---

## 7. Forensics

### 7.1 Timeline Analysis

```bash
# Create a super timeline
# mactime from Sleuth Kit
fls -r -m "/" /dev/sda1 | mactime -b body -d > timeline.csv

# Alternative: find-based timeline
find / -xdev -printf '%T+ %p\n' 2>/dev/null | sort > timeline.txt

# Inode change time analysis (ctime) — detects permission/ownership tampering
find / -xdev -ctime -1 -type f 2>/dev/null | sort
```

### 7.2 File Recovery

```bash
# Deleted file recovery with extundelete (ext3/ext4)
extundelete /dev/sda1 --restore-all

# Photorec — carve files by magic numbers (works on damaged filesystems)
photorec /dev/sda1

# TestDisk — recover lost partitions and boot sectors
testdisk /dev/sda

# Forensic imaging
dd if=/dev/sda of=/evidence/disk.img bs=4M status=progress
dc3dd if=/dev/sda of=/evidence/disk.img hash=sha256  # With hash verification

# Mount read-only for analysis
mount -o ro,loop,noexec /evidence/disk.img /mnt/evidence
```

### 7.3 Evidence Preservation

```bash
# Chain of custody: hash before and after
sha256sum /dev/sda1 > /evidence/original_hash.txt
# After analysis
sha256sum /dev/sda1 > /evidence/after_hash.txt
diff /evidence/original_hash.txt /evidence/after_hash.txt  # Should match
```

---

## 8. Common Vulnerabilities and Attacks

| Attack Vector | Description | Mitigation |
|--------------|-------------|------------|
| SUID binary exploitation | Abusing setuid binaries for privilege escalation (GTFOBins) | Audit and remove unnecessary SUID bits |
| World-writable files | Attackers plant malicious binaries or config | `find / -perm -0002` and fix |
| Symlink race conditions | TOCTOU exploits via symbolic links in temp dirs | Use sticky bit, noexec, O_NOFOLLOW |
| Hardlink attacks | Linking to files you shouldn't access (e.g., /etc/shadow) | `fs.protected_hardlinks = 1` |
| Mount point poisoning | Mounting over existing directories to hijack access | Validate mount sources, use nodev |
| /proc/[pid]/mem access | Reading/writing process memory via procfs | `kernel.yama.ptrace_scope = 1` |
| /tmp race conditions | Predictable filenames in /tmp | Use `mktemp`, secure tmpfs mount |
| Extended attribute abuse | Storing malicious payloads in xattrs | Monitor xattrs in FIM baselines |

```bash
# Kernel hardening sysctl
echo "fs.protected_hardlinks = 1" >> /etc/sysctl.conf
echo "fs.protected_symlinks = 1" >> /etc/sysctl.conf
echo "fs.suid_dumpable = 0" >> /etc/sysctl.conf
sysctl -p
```

---

## 9. Container Filesystem Security

```bash
# Container layers (OverlayFS)
docker inspect <container> | jq '.[0].GraphDriver'

# Read-only root filesystem
docker run --read-only alpine sh -c "touch /test"  # Fails

# No new privileges
docker run --security-opt=no-new-privileges alpine

# Volume mount security
docker run -v /host/sensitive:/container/sensitive:ro alpine
docker run --tmpfs /tmp:rw,noexec,nosuid,size=100m alpine
```

---

## 10. Interview Questions

1. **Explain the difference between a symbolic link and a hard link.**  
   A hard link shares the same inode and data blocks; deleting the original doesn't remove data. A symbolic link is a separate file containing a path string; it breaks if the target is deleted.

2. **What are the four Linux file timestamps and what do they track?**  
   atime (last read), mtime (last content change), ctime (last metadata change), btime (creation time). ctime updates when permissions or ownership change, not just content.

3. **What is the security risk of the SUID bit?**  
   A SUID binary runs with the file owner's privileges (often root). If the binary is exploitable, an attacker can execute arbitrary code as root. Use `find / -perm -4000` to audit.

4. **How does LVM differ from traditional partitioning?**  
   LVM adds an abstraction layer between physical disks and filesystems, enabling resizing, spanning across disks, and snapshots without repartitioning.

5. **What is the purpose of /proc and /sys?**  
   /proc is a virtual filesystem exposing kernel and process information (per-process directories, hardware info). /sys exposes the kernel's device and driver model. Neither uses disk storage.

6. **How would you detect a world-writable file in a production system?**  
   `find / -xdev -type f -perm -0002 -ls 2>/dev/null`. World-writable files allow any user to modify them, enabling code injection or privilege escalation.

7. **Explain OverlayFS in the context of containers.**  
   OverlayFS stacks a read-write layer on top of a read-only base layer. Containers get a merged view. Writes go to the top layer, leaving the base image unchanged.

8. **What does `mount -o noexec` prevent?**  
   It prevents execution of binaries on that filesystem. Useful for /tmp and upload directories to prevent uploaded malware from running.

9. **How does the sticky bit protect /tmp?**  
   When set on a directory, only the file owner (or root) can delete files in that directory, preventing users from deleting each other's temporary files.

10. **What is the difference between ctime and mtime?**  
    mtime changes only when file content is modified. ctime changes on any metadata modification including permissions, ownership, link count, or content. ctime cannot be set directly by the user.

---

## 11. Hands-On Labs

### Lab 1: FHS Exploration
```bash
# Walk the hierarchy and identify purposes
for dir in /bin /sbin /usr /etc /var /proc /sys /dev /tmp /run; do
  echo "=== $dir ==="
  ls $dir | head -10
done

# Examine /proc
cat /proc/cpuinfo | grep "model name" | head -1
cat /proc/meminfo | head -5
ls /proc/self/fd/
cat /proc/self/status | grep -i "seccomp\|cap"
```

### Lab 2: Permission Forensics
```bash
# Find all SUID binaries and categorize
find / -perm -4000 -type f 2>/dev/null | while read f; do
  echo "--- $f ---"
  file "$f"
  ls -la "$f"
done

# Find world-writable directories without sticky bit
find / -type d -perm -0002 ! -perm -1000 2>/dev/null

# Create and test ACLs
touch /tmp/acl_test
setfacl -m u:nobody:r /tmp/acl_test
getfacl /tmp/acl_test
su - nobody -c "cat /tmp/acl_test"    # Should work
su - nobody -c "echo test >> /tmp/acl_test"  # Should fail
```

### Lab 3: File Recovery
```bash
# Create test file, delete it, attempt recovery
echo "Secret data" > /tmp/recovery_test.txt
rm /tmp/recovery_test.txt

# Check if data persists on disk (unmounted device)
xxd /dev/sda1 | grep -i "Secret"
# In practice, use extundelete or photorec for real recovery
```

### Lab 4: Disk and Mount Analysis
```bash
# List all filesystems and mount options
findmnt --real --output TARGET,SOURCE,FSTYPE,OPTIONS

# Identify noexec, nosuid, nodev mount options
findmnt -o TARGET,OPTIONS | grep -E "noexec|nosuid|nodev"

# Analyze disk usage
du -sh /var/log/*
df -i  # Check inode exhaustion
```

---

## 12. Quick Reference

```bash
# File type identification
file <path>
stat <path>

# Permissions
chmod [ugoa][+-=][rwx] <path>
chown user:group <path>
setfacl / getfacl

# Finding
find / -name "*.log" -mtime -7 -type f
locate pattern

# Open files
lsof -p <pid>
lsof +D /var/log

# Disk info
lsblk -f
blkid
df -hT
mount | grep <device>

# Forensics
fls -r /dev/sda1
md5sum <file>
sha256sum <file>
strings <file>
```

---

*File system security is the foundation of Linux defense. Every privilege escalation, data exfiltration, and persistence mechanism ultimately interacts with the file system. Audit it relentlessly.*
