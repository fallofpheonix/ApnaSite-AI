# File Systems

## Layer Position

```
┌─────────────────────────────────────────────────────────┐
│                    Applications                         │
├─────────────────────────────────────────────────────────┤
│                    System Calls                         │
├─────────────────────────────────────────────────────────┤
│         Virtual File System (VFS) Layer                 │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   ext4      │    NTFS     │   FAT32     │    Btrfs      │
├─────────────┴─────────────┴─────────────┴───────────────┤
│              Block Device Drivers                       │
├─────────────────────────────────────────────────────────┤
│              Hardware / Storage Devices                 │
└─────────────────────────────────────────────────────────┘
```

File systems sit between user-space applications and physical storage hardware. The VFS layer abstracts different file system implementations behind a unified API, allowing applications to use the same system calls regardless of the underlying file system type.

## 1. Topic Overview

A file system is a method and data structure that the operating system uses to organize, store, retrieve, and manage data on storage devices. It defines how data is named, stored, retrieved, updated, and deleted. Beyond simple data organization, file systems provide metadata (permissions, timestamps, ownership), journaling for crash recovery, and access control mechanisms critical for system security.

Key concepts include:
- **Metadata management**: Inodes (Linux), MFT records (NTFS) store file attributes
- **Space allocation**: How disk blocks are assigned and tracked
- **Directory structure**: Hierarchical organization of files and folders
- **Journaling**: Write-ahead logging for crash consistency
- **Access control**: Permissions, ACLs, and security descriptors
- **Virtual file system**: Unified interface hiding file system differences

## 2. Why It Exists

Without file systems, operating systems would have raw, unstructured disk access — every program would need to know exact disk block locations. File systems provide:

1. **Abstraction**: Programs use filenames, not physical block addresses
2. **Organization**: Hierarchical directory trees for logical file grouping
3. **Protection**: Permission systems prevent unauthorized access
4. **Reliability**: Journaling recovers from crashes and power failures
5. **Efficiency**: Intelligent block allocation and caching improve performance
6. **Portability**: Standardized formats allow cross-platform data sharing
7. **Forensics**: Metadata and journal logs provide investigative evidence

## 3. Internal Architecture

### 3.1 File System Concepts

#### Inode Structure (Linux)

```
┌────────────────────────────────────┐
│           Inode Structure          │
├────────────────────────────────────┤
│  Mode (permissions & file type)    │
│  UID (owner user ID)              │
│  GID (owner group ID)             │
│  File size                         │
│  Access time (atime)              │
│  Modification time (mtime)        │
│  Change time (ctime)              │
│  Creation time (crtime)           │
│  Link count                        │
│  Block count                       │
│  Direct block pointers (0-11)     │
│  Single indirect block pointer    │
│  Double indirect block pointer    │
│  Triple indirect block pointer    │
│  Extended attributes               │
└────────────────────────────────────┘
```

Inodes do NOT store filenames — filenames are stored in directory entries that point to inode numbers. This allows hard links (multiple names, same inode).

#### NTFS MFT Entry

```
┌────────────────────────────────────┐
│        NTFS MFT Record             │
├────────────────────────────────────┤
│  MFT Entry Header                  │
│    - Signature "FILE"             │
│    - Update sequence number       │
│    - Log sequence number (LSN)    │
│    - Sequence number              │
│    - Hard link count              │
│    - Attribute offset             │
│    - Flags (in use, directory)    │
│    - Entry size / Next free ID    │
├────────────────────────────────────┤
│  Standard Information (0x10)      │
│    - Creation, modify, access     │
│    - MFT change times             │
│    - File attributes              │
├────────────────────────────────────┤
│  File Name (0x30)                 │
│    - Parent directory ref         │
│    - Filename (Unicode)           │
│    - Namespace (Win32, DOS)       │
├────────────────────────────────────┤
│  Data (0x80)                      │
│    - Resident or non-resident     │
│    - Attribute list if needed     │
├────────────────────────────────────┤
│  Security Descriptor (0x50)       │
│  Volume Information (0x70)        │
│  Extended Attributes (0xB0)       │
│  End of Record (0xFFFFFFFF)       │
└────────────────────────────────────┘
```

#### Superblock

The superblock contains global file system metadata:
- File system size and block count
- Free block count and inode count
- Block size and fragment size
- Mount count and maximum mounts before check
- Magic number (filesystem identifier)
- Last check time and next check time
- UUID and volume label

Corrupted superblocks render the entire file system unreadable — backups in block groups are critical for recovery.

#### Directory Entries

Directory entries map filenames to inode numbers:

```
Directory Entry Table (ext4):
┌──────────────────┬─────────┐
│     Filename     │ Inode#  │
├──────────────────┼─────────┤
│  .               │  2      │
│  ..              │  2      │
│  passwd          │  1234   │
│  shadow          │  1235   │
│  secret.txt      │  5678   │
└──────────────────┴─────────┘
```

#### File Descriptors

When a process opens a file, the kernel creates a file descriptor:
- **File descriptor table** (per-process): maps FD numbers to open file entries
- **Open file table** (system-wide): tracks file position, mode, and inode pointer
- **Inode table** (per-inode): stores metadata and block pointers

Standard file descriptors: 0 (stdin), 1 (stdout), 2 (stderr)

### 3.2 File System Types

#### ext2/3/4 (Linux)

```
ext4 Block Group Layout:
┌───────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Super │ Group   │ Block  │ Inode  │ Inode  │ Block  │ Block  │ Reserv │
│ Block │ Desc   │ Bitmap │ Bitmap │ Table  │ Groups │ Groups │ d      │
│ (1B)  │ (nB)   │ (1B)   │ (1B)   │ (nB)   │        │        │        │
└───────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

- **ext2**: No journaling, simple structure, legacy systems
- **ext3**: Added journaling, backward compatible with ext2
- **ext4**: Extents, delayed allocation, journal checksums, 1 EiB max size

#### NTFS (Windows)

- Master File Table (MFT) stores all file metadata
- Alternate Data Streams (ADS) allow hidden data in files
- Encrypting File System (EFS) for file-level encryption
- Volume Shadow Copy for point-in-time recovery
- Change Journal ($UsnJrnl) tracks all modifications

#### FAT32/exFAT

- No journaling, simple structure, widely compatible
- 4 GB maximum file size (FAT32)
- exFAT supports larger files and volumes
- Common in USB drives, cameras, embedded systems

#### Btrfs, ZFS

- **Btrfs**: Copy-on-write, snapshots, subvolumes, built-in RAID
- **ZFS**: Pooled storage, end-to-end checksumming, deduplication, snapshots
- Both use CoW semantics and tree-based structures

#### Virtual File Systems

- **tmpfs**: In-memory file system (volatile)
- **procfs**: Exposes process and kernel information as files
- **sysfs**: Exposes kernel objects and device attributes
- **devfs/devtmpfs**: Device node file system

### 3.3 How Files Are Stored

#### Block Allocation

File systems divide storage into fixed-size blocks (typically 4KB). A file's data occupies one or more blocks, tracked by allocation bitmaps or bit vectors.

#### Block Mapping Strategies

```
Direct Mapping:
File offset → Direct block pointer → Disk block

Indirect Mapping:
File offset → Indirect block → Block pointers → Disk blocks

Double Indirect:
File offset → Double indirect → Indirect blocks → Block pointers → Disk blocks

Extents (ext4):
File offset → Extent header → Extent entries (start_block, len, start_logical)
```

Extents are more efficient than traditional block pointers for large, contiguous files.

#### Journaling

Journaling writes metadata changes to a journal before committing to the main file system:

1. Transaction begins
2. Changes written to journal (write-ahead)
3. Journal commit record written
4. Changes applied to actual data structures
5. Journal record marked complete

Replay on crash: if a transaction lacks a commit record, it is rolled back.

#### Copy-on-Write (CoW)

CoW file systems (Btrfs, ZFS, ZFS) never overwrite existing data. New data is written to unused blocks, and metadata is updated atomically. This enables:
- Atomic snapshots
- Data integrity (old data preserved until snapshot removed)
- Rollback capabilities

### 3.4 File Permissions

#### Linux Permission Model

```
File Permission Bits (octal representation):
┌─────────────────────────────────────────────────┐
│  rwxrwxrwx  →  777  (all permissions)          │
│  rwxr-xr-x  →  755  (owner full, others read)  │
│  rw-r--r--  →  644  (owner write, others read) │
│  rw-------  →  600  (owner only)               │
│  rwx------  →  700  (owner execute only)        │
└─────────────────────────────────────────────────┘

Special Bits:
┌─────────────────────────────────────────────────┐
│  SUID (4000): Execute as file owner             │
│  SGID (2000): Execute as file group / inherit   │
│  Sticky (1000): Only owner can delete           │
└─────────────────────────────────────────────────┘
```

Security implications:
- SUID binaries (e.g., `passwd`, `sudo`) run with elevated privileges
- SGID directories force new files to inherit group ownership
- Sticky bit on `/tmp` prevents users from deleting others' files

#### Windows Access Control

```
Windows Security Descriptor:
┌─────────────────────────────────────────────────┐
│  Owner SID                                      │
│  Group SID                                      │
│  DACL (Discretionary ACL)                       │
│    - ACE: User/Group SID + Access Mask          │
│      Allow / Deny + Read/Write/Execute/etc.     │
│  SACL (System ACL)                              │
│    - ACE: Audit entries for logging             │
└─────────────────────────────────────────────────┘
```

NTFS permissions include: Read, Write, Execute, Modify, Full Control, Take Ownership, Change Permissions.

### 3.5 File System Operations

The system call interface:

```
Application
    │
    ▼
open(path, flags, mode)  →  fd
    │
    ▼
read(fd, buffer, count)  →  bytes_read
write(fd, buffer, count)  →  bytes_written
lseek(fd, offset, whence)  →  new_position
close(fd)
    │
    ▼
VFS Layer
    │
    ▼
File System Driver (ext4/NTFS/etc.)
    │
    ▼
Buffer Cache / Page Cache
    │
    ▼
Block Device Driver
    │
    ▼
Physical Storage
```

Buffer/page caching stores recently accessed blocks in memory, reducing disk I/O. The kernel uses dirty page writeback to flush modified cache entries to disk.

---

## 4. Linux File System Hierarchy (FHS)

```
/                   Root directory
├── bin/            Essential user binaries
├── boot/           Boot loader files, kernel
├── dev/            Device files (null, zero, random)
├── etc/            System configuration files
├── home/           User home directories
├── lib/            Essential shared libraries
├── mnt/            Temporary mount points
├── opt/            Optional software packages
├── proc/           Process and kernel information (virtual)
├── root/           Root user home
├── sbin/           Essential system binaries
├── srv/            Service data (web, FTP)
├── sys/            Kernel and hardware info (virtual)
├── tmp/            Temporary files (world-writable, sticky)
├── usr/            User programs and data
│   ├── bin/        User binaries
│   ├── lib/        Libraries
│   └── share/      Architecture-independent data
└── var/            Variable data (logs, mail, spool)
    ├── log/        System logs
    ├── mail/       User mailboxes
    └── tmp/        Persistent temporary files
```

## 5. Windows File System Structure

```
Volume Layout (NTFS):
┌─────────────────────────────────────────────────────┐
│  Boot Sector ($BOOT)                                │
├─────────────────────────────────────────────────────┤
│  Master File Table ($MFT) — first 16 entries fixed │
│    $MFT, $MFTMirr, $LogFile, $Volume,             │
│    $AttrDef, $, $Bitmap, $Boot,                    │
│    $BadClus, $Secure, $UpCase, $Extend, etc.       │
├─────────────────────────────────────────────────────┤
│  Data Area (clusters for file data)                │
├─────────────────────────────────────────────────────┤
│  Backup Boot Sector                                │
└─────────────────────────────────────────────────────┘
```

## 6. Security Threats and Attacks

### 6.1 Permission Exploits

**SUID/SGID Abuse:**
```bash
# Find SUID binaries
find / -perm -4000 -type f 2>/dev/null

# Find SGID binaries
find / -perm -2000 -type f 2>/dev/null
```

Exploitable SUID binaries allow privilege escalation if they:
- Accept user input without validation
- Execute shell commands with user-controlled arguments
- Access files with elevated privileges

### 6.2 Symlink Attacks

```c
// Attacker creates symlink in /tmp
// Victim (running as root) follows symlink
ln -s /etc/shadow /tmp/attacker_file

// Vulnerable code
fd = open("/tmp/attacker_file", O_WRONLY | O_CREAT, 0666);
// Writes to /etc/shadow instead of /tmp/attacker_file
```

**Mitigation**: Use O_NOFOLLOW, O_EXCL flags; avoid predictable temp file names.

### 6.3 Path Traversal

```
../../etc/passwd
..%2F..%2Fetc%2Fpasswd
....//....//etc/passwd
```

Attacks escape the intended directory by injecting `../` sequences. URL encoding and double encoding bypass naive filters.

### 6.4 NTFS Alternate Data Streams

```powershell
# Create hidden ADS
echo "secret data" > C:\file.txt:hidden.txt

# Read hidden ADS
type C:\file.txt:hidden.txt

# List ADS
dir /r C:\file.txt
```

ADS allows hiding data in files, bypassing many security tools. Used for data exfiltration and malware persistence.

### 6.5 File System Race Conditions (TOCTOU)

Time-of-Check to Time-of-Use: Attacker modifies a file between the security check and actual use.

```
1. Program checks: /tmp/file exists and is safe
2. Attacker replaces /tmp/file with symlink to /etc/passwd
3. Program reads /tmp/file — actually reads /etc/passwd
```

### 6.6 Hard Link Attacks

Hard links to protected files allow reading/writing through another path:
```bash
ln /etc/shadow ~/shadow_link
# If permissions allow, read shadow via the link
```

---

## 7. File System Forensics

### 7.1 File Carving

File carving recovers files by scanning disk images for file signatures (magic bytes) without relying on file system metadata.

Common file signatures:
```
JPEG:  FF D8 FF E0 (JFIF) or FF D8 FF E1 (EXIF)
PNG:   89 50 4E 47 0D 0A 1A 0A
PDF:   25 50 44 46 2D 31 2E (%PDF-1.)
ZIP:   50 4B 03 04
GZIP:  1F 8B 08
ELF:   7F 45 4C 46
```

Tools: foremost, scalpel, PhotoRec, Autopsy

### 7.2 Deleted File Recovery

When a file is deleted:
- **ext4**: Inode marked free, block pointers cleared, data blocks remain until overwritten
- **NTFS**: MFT record marked inactive, clusters marked free in bitmap, data may persist

Recovery is possible until blocks are reused. SSD TRIM makes recovery harder.

### 7.3 Important Forensic Artifacts

```
Linux:
  - /var/log/syslog          System log
  - /var/log/auth.log        Authentication log
  - /var/log/kern.log        Kernel messages
  - ~/.bash_history          User commands
  - /etc/passwd, /etc/shadow User accounts
  - File timestamps (atime, mtime, ctime)

Windows:
  - $MFT                    Master File Table
  - $UsnJrnl                Change Journal
  - $LogFile                NTFS Journal
  - Prefetch files           Executed programs
  - Recent documents         User activity
  - $Recycle.Bin             Deleted files metadata
  - Registry hives           System configuration
```

### 7.4 Timeline Analysis

File system timestamps enable timeline reconstruction:
- **MAC times**: Modification, Access, Change (inode metadata)
- **$STANDARD_INFORMATION**: Creation, modification, access, MFT change
- **$FILE_NAME**: Secondary timestamp set (harder to tamper)
- **$UsnJrnl**: Comprehensive change log with reasons

## 8. Debugging and Analysis Tools

### Linux

```bash
# File system information
stat /path/to/file              # Inode details, timestamps
file /path/to/file              # File type detection
debugfs /dev/sda1               # ext2/3/4 file system debugger
tune2fs -l /dev/sda1            # Superblock information
dumpe2fs /dev/sda1              # Detailed FS information

# Permission analysis
namei -l /path/to/file          # Permission chain
getfacl /path/to/file           # ACL details
lsattr /path/to/file            # Extended attributes

# Block analysis
hd /path/to/file | head -20     # Hex dump
strings /path/to/file | grep -i password  # String extraction
```

### Windows

```powershell
# File system information
fsutil fsinfo ntfsinfo C:       # NTFS volume information
fsutil file queryfileid C:\file # MFT file reference number
ntfsinfo -m C:\$MFT            # MFT analysis
streams.exe C:\file.txt         # List alternate data streams

# Permission analysis
icacls C:\file                  # Access control entries
accesschk C:\file               # Detailed permissions
```

### Cross-Platform

```bash
# File type identification
file mystery_binary
xxd mystery_binary | head -5

# Magic number database
mimetype mystery_binary

# Disk image analysis
mount -o loop image.dd /mnt/forensic
fls -r -d /mnt/forensic         # List files (Sleuth Kit)
icat /mnt/forensic inode_number # Extract file by inode
```

## 9. File System Integrity

### 9.1 Checksumming

ZFS and Btrfs use end-to-end checksums to detect silent data corruption (bit rot). Traditional file systems (ext4, NTFS) lack this — they trust the disk to return correct data.

### 9.2 File Integrity Monitoring

Tools like AIDE, Tripwire, OSSEC create baselines of file hashes and alert on changes:

```bash
# AIDE initialization
aide --init
# AIDE check
aide --check
```

### 9.3 Journal Recovery

```bash
# ext4 journal replay
e2fsck -f /dev/sda1

# NTFS journal analysis
ntfsfix /dev/sda1
```

---

## 10. Case Studies

### Case 1: Log4Shell Evidence (2021)

Forensic analysts recovered deleted web shell files from `/tmp` using ext4 journal analysis. The journal preserved inode metadata after the files were deleted, enabling reconstruction of attacker activity.

### Case 2: Ransomware NTFS Artifacts

Ransomware modified file data but left NTFS MFT records intact. Analysts used `$UsnJrnl` (change journal) to identify which files were encrypted and when, mapping the attack timeline.

### Case 3: SUID Binary Escalation

An attacker exploited a custom SUID binary that passed user input to `system()` without sanitization, achieving root access. The binary was identified through `find / -perm -4000`.

---

## 11. Interview Questions

### Conceptual

1. **What is the difference between an inode and a directory entry?**
   An inode stores metadata (permissions, timestamps, block pointers) but not the filename. A directory entry maps a filename to an inode number. Multiple directory entries can point to the same inode (hard links).

2. **How does journaling prevent data corruption?**
   Journaling writes a record of intended changes to a journal area before modifying actual data structures. On crash recovery, the file system replays committed transactions and rolls back incomplete ones.

3. **What are the security implications of NTFS Alternate Data Streams?**
   ADS allows hiding data within files without changing filename or visible size. Malware can use ADS for persistence, data exfiltration, or evading detection tools that don't scan ADS by default.

4. **Explain the TOCTOU vulnerability in file systems.**
   Time-of-Check to Time-of-Use occurs when a program checks file attributes (permissions, existence) and then uses the file, but an attacker modifies the file between check and use. Race conditions in `/tmp` files are common examples.

5. **Why is ext4 more resilient than ext2?**
   ext3/4 add journaling for crash recovery, extents for better large-file performance, delayed allocation for reduced fragmentation, and journal checksums for journal integrity.

### Practical

6. **How would you recover a deleted file on ext4?**
   Check for unallocated blocks that may still contain data using `debugfs`. The inode's block pointers are cleared on deletion but the data blocks may persist. Use file carving tools (foremost, photorec) if the file system metadata is destroyed.

7. **A file shows permission `rwsr-xr-x`. What does this indicate?**
   The `s` in the owner execute position indicates the SUID bit is set. When executed, this binary runs with the file owner's privileges (typically root). This is normal for system utilities like `passwd` but dangerous on custom binaries.

8. **How does copy-on-write improve file system reliability?**
   CoW never overwrites existing data. New writes go to free blocks, and metadata is updated atomically. This means snapshots are always consistent, and if a write fails, the old data remains intact.

9. **What is the purpose of the sticky bit on `/tmp`?**
   The sticky bit (chmod +t) means only the file owner, directory owner, or root can delete or rename files within that directory. Without it, any user could delete other users' temporary files.

10. **Describe how you would detect hidden NTFS ADS files.**
    Use `dir /r` to list ADS, `streams.exe` from Sysinternals, or PowerShell `Get-Item -Stream *`. Forensic tools like The Sleuth Kit's `alternate_data_streams` plugin can detect them in disk images.

---

## 12. Hands-On Labs

### Lab 1: Linux File Permissions Analysis

```bash
# Create test files with various permissions
mkdir /tmp/lab && cd /tmp/lab
touch normal_file
chmod 4755 suid_file         # SUID
chmod 2755 sgid_file         # SGID
chmod 1777 sticky_dir         # Sticky bit directory

# Examine permissions
ls -la
stat suid_file

# Find SUID/SGID files system-wide
find / -perm -4000 -type f 2>/dev/null | head -20
find / -perm -2000 -type f 2>/dev/null | head -20

# Test permission model
useradd testuser
su - testuser -c "touch /tmp/lab/testuser_file"
ls -la /tmp/lab/
```

### Lab 2: File System Forensics with Sleuth Kit

```bash
# Create a forensic image
dd if=/dev/sda of=forensic_image.dd bs=4M

# Analyze with The Sleuth Kit
fls -r -d forensic_image.dd    # List all files
icat forensic_image.dd 1234 > recovered.txt  # Recover by inode
istat forensic_image.dd 1234   # Inode information

# File carving
forensic_find -t 0 forensic_image.dd | grep "JPEG"
```

### Lab 3: NTFS Alternate Data Streams

```powershell
# Create file with hidden ADS
echo "Normal content" > C:\lab\visible.txt
echo "Hidden data" > C:\lab\visible.txt:hidden.txt

# Verify ADS exists
Get-Item C:\lab\visible.txt -Stream *
dir /r C:\lab\visible.txt
cat C:\lab\visible.txt:hidden.txt

# Detect with forensic tools
# Sysinternals: streams.exe C:\lab\visible.txt
```

### Lab 4: File System Journaling

```bash
# Create journal on ext4
mkfs.ext4 /dev/sdb1
mount /dev/sdb1 /mnt/lab

# Write files, check journal
echo "test data" > /mnt/lab/testfile
debugfs -R "logdump -i <inode_number>" /dev/sdb1

# Simulate crash recovery
dd if=/dev/zero of=/dev/sdb1 bs=512 count=1
fsck.ext4 -f /dev/sdb1
```

### Lab 5: File Integrity Monitoring

```bash
# Install and configure AIDE
apt install aide
aideinit

# Create baseline
cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Simulate modification
echo "altered" >> /etc/hostname

# Detect changes
aide --check
```

---

## 13. Security Best Practices

1. **Principle of least privilege**: Grant minimum necessary file permissions
2. **Audit SUID/SGID binaries**: Regularly review and remove unnecessary ones
3. **Disable SUID on non-essential binaries**: Use `nosuid` mount option
4. **Use ACLs for fine-grained control**: When standard permissions are insufficient
5. **Enable file system journaling**: For crash recovery (ext3/4, NTFS)
6. **Monitor file integrity**: Deploy AIDE or Tripwire in production
7. **Secure temporary files**: Use sticky bit, avoid predictable names
8. **Restrict world-writable directories**: Prevent unauthorized modifications
9. **Use NTFS permissions wisely**: Deny-by-default, audit with SACLs
10. **Regular forensic backups**: Capture file system metadata for incident response

---

## 14. Summary

| Concept | Linux (ext4) | Windows (NTFS) |
|---------|--------------|-----------------|
| Metadata Store | Inodes | MFT Records |
| Journaling | ext3/4 journal | $LogFile, $UsnJrnl |
| Permissions | rwx + special bits | DACL/SACL |
| Hidden Data | Extended attributes | Alternate Data Streams |
| Integrity | AIDE/Tripwire | EFS, BitLocker |
| Recovery | debugfs, forensic tools | $MFT, Volume Shadow Copy |
| Block Mapping | Direct/indirect/extents | Clusters, runs |

File systems are a critical layer for both system functionality and security. Understanding their internal structures enables effective forensics, incident response, privilege escalation detection, and secure system administration.

---

## 15. Quick Reference

```bash
# Essential commands
stat file                    # File metadata
ls -la                       # Permissions view
find / -perm -4000           # Find SUID files
debugfs /dev/sda1            # Ext4 debugger
file /bin/ls                 # Binary identification
mount | grep -v "proc\|sys\|dev"  # Mounted file systems

# Dangerous patterns to audit
chmod 777 *                  # World-writable files
chmod u+s suspicious_binary  # New SUID binary
rm -rf / *                   # Catastrophic deletion (prevent via monitoring)
```

---

*File systems store everything — your job is to understand what they reveal and how to protect what they hold.*
