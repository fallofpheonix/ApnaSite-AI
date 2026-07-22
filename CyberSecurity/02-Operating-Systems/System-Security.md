# System Security

## Layer Position

```
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                      SYSTEM CALL INTERFACE                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               SYSTEM SECURITY LAYER (THIS CHAPTER)          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │  MAC/    │ │  Auth    │ │ Auditing │ │  Kernel      │  │   │
│  │  │  DAC     │ │  (PAM)   │ │ (auditd) │ │  Security    │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                      KERNEL / OS LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                      HARDWARE LAYER                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Topic Overview

System security encompasses all mechanisms an OS provides to enforce confidentiality, integrity, and availability. Core components:

- **Access Control**: DAC, MAC, ACLs, capabilities — who can do what
- **Authentication**: Password, Kerberos, MFA, biometrics — who are you
- **Authorization**: Permissions, sudo, UAC — what you're allowed to do
- **Auditing**: Logs, audit trails, event correlation — what did you do
- **Kernel Security**: Secure Boot, KASLR, module signing — protecting the OS core

---

## 2. Why It Exists

Without system security, any user-level process could read/write any file, kill any process, load kernel rootkits, intercept network traffic, or access hardware directly.

System security enforces the **principle of least privilege**: every entity gets only the minimum permissions required. It is the final barrier between user-level access and full system compromise.

---

## 3. Internal Architecture

### 3.1 Security Boundaries

**Ring 0 vs Ring 3**:

| Property | Ring 0 (Kernel) | Ring 3 (User) |
|----------|-----------------|---------------|
| Privilege | Full hardware access | No direct hardware access |
| Memory | All physical memory | Virtual address space only |
| Instructions | All CPU instructions | Restricted instruction set |
| I/O | Direct port access | Must use syscalls |
| Exceptions | Handled in kernel | Process terminated on fault |

**Kernel Space vs User Space**:

```
KERNEL SPACE (Ring 0): Kernel Image, Modules, vmalloc, Fixmap
═══════════════════════ KERNEL/USER BOUNDARY ═══════════════════════
USER SPACE (Ring 3): Text │ Data │ BSS │ Heap → Stack ← mmap region
```

**Process Isolation**: Each process has its own virtual address space. The MMU enforces isolation via page tables — Process A cannot access Process B's memory unless explicitly shared (mmap MAP_SHARED).

**User Isolation**: Each user has separate home directory, file ownership, environment, process tree, and resource limits (ulimits).

```bash
ps aux | head -5          # Your processes only (unless root)
cat /proc/<pid>/maps      # Process memory map
id                        # Your UID, GID, groups
```

---

### 3.2 Access Control

**DAC (Discretionary Access Control)**:
Owner decides who gets access via `chmod`/`chown`. Problem: owner can grant access to anyone, including malicious processes.

**MAC (Mandatory Access Control)**:
System policy (not owner) controls access. Even root must obey policy.

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Subject    │      │   Policy     │      │   Object     │
│  (Process)   │─────►│  (SELinux/   │─────►│  (File/etc)  │
│              │      │  AppArmor)   │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
  Even root cannot override MAC policy!
```

**ACLs (Access Control Lists)**:

```bash
getfacl /etc/passwd                  # View ACLs
setfacl -m u:alice:rwx /data/shared  # Grant alice full access
setfacl -d -m g:devops:rx /data/shared  # Default ACL for new files
```

**Capabilities (Linux)**:
Fine-grained privileges split from root's monolithic power.

```bash
getcap /usr/bin/ping                    # cap_net_raw+ep
setcap cap_net_raw+ep /usr/bin/ping     # Set capability
cat /proc/<pid>/status | grep Cap       # View process caps
# CAP_CHOWN(0) CAP_NET_RAW(13) CAP_SYS_ADMIN(21) CAP_SYS_PTRACE(19)
```

**SELinux Architecture**:

```
Subject ──► Object Manager ──► Policy Server ──► Object Manager
  (process)                                    (labeling)
       │                                           │
       ▼                                           ▼
  Security Context                          Security Context
  system_u:system_r:httpd_t:s0            system_u:object_r:etc_t:s0

Policy Types: Targeted (default) | MLS (multi-level) | Strict
Type Enforcement: httpd_t → read → httpd_sys_content_t
Role-Based: system_r → transition → httpd_r
MLS: s0 (public) → s1 (secret) → s2 (top secret)
```

```bash
getenforce / setenforce 0|1    # Check/set mode
ls -Z /var/www/html/           # View file contexts
ps auxZ | grep httpd           # View process contexts
getsebool -a                   # List booleans
setsebool httpd_can_network_connect on
ausearch -m avc --start recent | audit2why    # Troubleshoot denials
ausearch -m avc --start recent | audit2allow -M myfix  # Generate policy
semodule -i myfix.pp
restorecon -Rv /var/www/html/
```

**AppArmor** (path-based, simpler):

```bash
# /etc/apparmor.d/usr.sbin.nginx
/usr/sbin/nginx {
  /etc/nginx/** r,
  /var/log/nginx/** w,
  /var/www/html/** r,
  network inet stream,
}
aa-enforce /usr/sbin.nginx    # Enforce mode
aa-complain /usr/sbin.nginx   # Log-only mode
apparmor_status               # Show all profiles
```

**SELinux vs AppArmor**:

| Feature | SELinux | AppArmor |
|---------|---------|----------|
| Model | Label-based (xattr) | Path-based |
| Granularity | Very fine-grained | Coarse |
| Complexity | Steep learning curve | Easier |
| Distro | RHEL, Fedora, CentOS | Ubuntu, SUSE, Debian |

---

### 3.3 Authentication Mechanisms

**PAM (Pluggable Authentication Modules) Flow**:

```
Application (sshd) ──► pam_authenticate() ──► PAM Framework
                                                    │
                    reads /etc/pam.d/sshd           │
                    ┌───────────────────────────────┤
                    │ auth    required  pam_unix.so        │
                    │ auth    required  pam_faillock.so    │
                    │ account required  pam_unix.so        │
                    │ password required pam_pwquality.so   │
                    │ session required  pam_limits.so      │
                    └───────────────────────────────┤
                                                    │
  Stacking: required=must pass (continues)  requisite=must pass (stops)
            sufficient=pass if no prior required failed
  Result: AUTH_SUCCESS or AUTH_FAILURE
```

```bash
# PAM config: /etc/pam.d/sshd, /etc/pam.d/login
# Password quality: /etc/security/pwquality.conf (minlen=12, dcredit=-1)
# Brute force: pam_faillock.so (deny=5, unlock_time=900)
```

**Kerberos Authentication**:

```
Client ──1. AS-REQ──► KDC ──2. AS-REP (TGT)──► Client
Client ──3. TGS-REQ──► KDC ──4. TGS-REP (service ticket)──► Client
Client ──5. AP-REQ─────────────────────────────────────► Server
Client ◄──6. AP-REP (mutual auth)────────────────────── Server
```

```bash
kinit alice@EXAMPLE.COM   # Get TGT
klist                     # Show tickets
kdestroy                  # Destroy tickets
```

**Multi-Factor Authentication (MFA)**:

| Factor | Examples |
|--------|----------|
| Something You KNOW | Password, PIN |
| Something You HAVE | YubiKey, Phone (OTP) |
| Something You ARE | Fingerprint, Face |
| Something You DO | Typing pattern, Voice |
| Somewhere You ARE | GPS, IP address |

---

### 3.4 Authorization

**File Permissions (Linux)**:

```
$ ls -la /etc/passwd
-rw-r--r-- 1 root root 2847 ... /etc/passwd
│││ │││ │││
│││ │││ └┘└── Others: r
│││ └┘└────── Group: r
│└┘─────────── Owner: rw
│              SUID(4000) SGID(2000) Sticky(1000)
```

**SUID Exploitation Path**:

```
Normal User ──► /usr/bin/passwd (SUID root) ──► Runs with UID=0
  → find / -perm -4000 -type f 2>/dev/null
  → Dangerous: find -exec sh \;  vim -c ':!sh'  nmap --interactive
```

**sudo Configuration** (`/etc/sudoers`, use `visudo`):

```bash
alice    ALL=(ALL:ALL) ALL              # Full sudo
bob      ALL=(ALL) NOPASSWD: /usr/bin/vim  # Passwordless vim
%devops  ALL=(ALL) /usr/bin/systemctl restart nginx
Defaults  env_reset timestamp_timeout=15
```

**Linux Capabilities**:

```bash
setcap cap_net_raw+ep /usr/bin/ping
cat /proc/<pid>/status | grep Cap
capsh --decode=00000000a80425fb
```

---

### 3.5 Auditing and Logging

**Linux Logging Pipeline**:

```
Kernel ──► syslog daemon ──► rsyslog/syslog-ng ──► /var/log/
Processes ──► journald (systemd)

Priority: 0=emerg 1=alert 2=crit 3=err 4=warn 5=notice 6=info 7=debug
```

```bash
journalctl -u sshd              # SSH logs
journalctl -p err                # Errors only
journalctl --since "1 hour ago"  # Time filter
journalctl -f                    # Follow
journalctl -k                    # Kernel messages

# Traditional: /var/log/auth.log (Debian) | /var/log/secure (RHEL)
```

**Auditd Rules**:

```bash
# /etc/audit/rules.d/audit.rules
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-a always,exit -F arch=b64 -S execve -k exec_commands
-a always,exit -F arch=b64 -S setuid -S setgid -k privilege_escalation
-w /sbin/insmod -p x -k module_load

ausearch -k passwd_changes --start today
aureport --auth
aureport --failed
```

**Security Event Correlation**:

```
02:31:15 ─── Failed login (brute force attempt)
02:31:17 ─── Failed login
02:31:19 ─── Failed login
02:31:22 ─── SUCCESSFUL LOGIN ← Compromised account
02:31:45 ─── sudo -i ← Privilege escalation
02:32:01 ─── useradd backdoor ← Persistence
02:32:15 ─── Modified /etc/shadow ← Credential tampering
02:32:30 ─── Outbound C2 connection ← Data exfiltration
```

---

### 3.6 Kernel Security

**Secure Boot Chain**:

```
UEFI Firmware ──► Shim Loader ──► Bootloader (GRUB2) ──► Kernel ──► Init ──► User Space
  If ANY link fails verification → Boot stops
```

**KASLR (Kernel Address Space Layout Randomization)**:

```bash
cat /proc/cmdline | grep nokaslr   # If present, KASLR is OFF
# Bypass: info leak, brute force (crash+reboot), side channel timing
```

**Kernel Self-Protection (KSPP)**:

```
Compile-time: CONFIG_RANDOMIZE_BASE (KASLR), CONFIG_STACKPROTECTOR_STRONG
              CONFIG_FORTIFY_SOURCE, CONFIG_HARDENED_USERCOPY
Runtime:      kptr_restrict=2, dmesg_restrict=1, perf_event_paranoid=3
Hardware:     SMEP, SMAP, KPTI (Meltdown fix), CET (shadow stacks)
```

```bash
# Kernel lockdown
echo 1 > /sys/kernel/security/lockdown   # integrity mode
echo 2 > /sys/kernel/security/lockdown   # confidentiality mode
```

---

## 4. Privilege Escalation Paths

```
VERTICAL (User → Root):
  1. SUID/SGID binaries          6. Capabilities abuse
  2. Kernel vulnerabilities      7. LD_PRELOAD hijacking
  3. Misconfigured sudo          8. PATH manipulation
  4. Cron jobs as root            9. NFS root squashing bypass
  5. Writable /etc/passwd        10. Docker socket abuse

HORIZONTAL (User A → User B):
  1. Sudo credentials            4. Environment files (.bashrc)
  2. Kerberos tickets            5. Writable home directories
  3. SSH keys (id_rsa)           6. Group membership (docker, lxd)
```

---

## 5. Kernel Exploitation Techniques

```
1. Stack Buffer Overflow → Overwrite return addr → shellcode
   Mitigation: Stack canaries, SMEP, SMAP

2. Use-After-Free → Free object, realloc with attacker data
   Mitigation: SLAB_FREELIST_HARDENED

3. Race Conditions (TOCTOU) → Double-fetch in copy_from_user()
   Mitigation: Proper locking

4. Info Leak → KASLR bypass via kernel pointer leak
   Mitigation: kptr_restrict, memory zeroing

5. DirtyPipe (CVE-2022-0847) → Pipe splice overwrites read-only files
   Affects: Linux 5.8-5.16.11
```

---

## 6. /var/log Analysis

```bash
# Brute Force Detection
grep "Failed password" /var/log/auth.log | \
  awk '{for(i=1;i<=NF;i++) if($i=="from") print $(i+1)}' | \
  sort | uniq -c | sort -rn | head -10

# Successful logins after failures (compromised account)
grep "Accepted" /var/log/auth.log | while read line; do
  user=$(echo $line | awk '{for(i=1;i<=NF;i++) if($i=="for") print $(i+1)}')
  ip=$(echo $line | awk '{for(i=1;i<=NF;i++) if($i=="from") print $(i+1)}')
  failures=$(grep "Failed password" /var/log/auth.log | grep "from $ip" | wc -l)
  [ "$failures" -gt 0 ] && echo "ALERT: $user from $ip after $failures failures"
done

# Privilege Escalation Detection
grep "COMMAND=" /var/log/auth.log | awk -F'COMMAND=' '{print $2}' | sort | uniq -c | sort -rn | head -10

# Audit file changes
ausearch -k passwd_changes --start today
ausearch -k shadow_changes --start today
ausearch -f /etc/passwd -i --start today
```

---

## 7. Auditd Rules Reference

```bash
# File integrity
-w /etc/ -p wa -k etc_changes
-w /etc/passwd -p wa -k identity
-w /etc/sudoers -p wa -k sudoers

# Execution monitoring
-a always,exit -F arch=b64 -S execve -k exec_all
-w /usr/bin/su -p x -k su_usage
-w /usr/bin/sudo -p x -k sudo_usage
-w /usr/bin/curl -p x -k curl_usage

# Network
-a always,exit -F arch=b64 -S socket -F a1=3 -k raw_socket
-a always,exit -F arch=b64 -S connect -F a2=16 -k network_connect

# Kernel modules
-a always,exit -F arch=b64 -S init_module -S finit_module -k module_load
-a always,exit -F arch=b64 -S delete_module -k module_unload

# Time changes
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time_change
```

---

## 8. System Hardening Checklist

```
BOOT:    □ Enable Secure Boot  □ Set UEFI password  □ TPM disk encryption
KERNEL:  □ KASLR  □ kptr_restrict=2  □ dmesg_restrict=1  □ Module signing
USER:    □ Disable root SSH  □ Key-based auth  □ Password complexity  □ Umask 027
FILES:   □ /tmp noexec,nosuid,nodev  □ /etc/passwd=644  □ /etc/shadow=640  □ AIDE
NETWORK: □ Firewall  □ Disable services  □ SYN cookies  □ RP filter
LOGGING: □ auditd  □ Remote syslog  □ Log retention  □ rkhunter
```

---

## 9. SELinux Policy Deep Dive

```bash
# /etc/audit/rules.d/custom.rules
-w /home/ -p wa -k home_changes
-a always,exit -F arch=b64 -S execve -F uid>=1000 -k user_exec
-a always,exit -F arch=b64 -S setuid -S setgid -k priv_esc

sudo augenrules --load
sudo auditctl -l
sudo ausearch -k user_exec --start today
sudo aureport --failed --start today
```

---

## 10. Hands-on Labs

### Lab 1: File Permission Audit

```bash
find /etc /var /usr -perm -002 -type f 2>/dev/null   # World-writable
find / -perm -4000 -type f 2>/dev/null                # SUID
find / -nouser -o -nogroup 2>/dev/null                # Orphan files
chmod 644 /etc/passwd && chmod 640 /etc/shadow && chmod 1777 /tmp
```

### Lab 2: PAM Configuration

```bash
# /etc/pam.d/common-auth
auth    required    pam_faillock.so preauth deny=5 unlock_time=900
auth    required    pam_faillock.so authfail deny=5 unlock_time=900
sudo faillock --user alice
sudo faillock --user alice --reset
```

### Lab 3: Auditd Custom Rules

```bash
cat > /etc/audit/rules.d/custom.rules << 'EOF'
-w /home/ -p wa -k home_changes
-w /root/.ssh/ -p wa -k root_ssh
-a always,exit -F arch=b64 -S execve -F uid>=1000 -k user_exec
-a always,exit -F arch=b64 -S setuid -S setgid -k priv_esc
EOF
sudo augenrules --load && sudo auditctl -l
```

### Lab 4: SELinux Troubleshooting

```bash
ls -Z /var/www/html/
sudo ausearch -m avc --start recent
sudo sealert -a /var/log/audit/audit.log
sudo restorecon -Rv /var/www/html/
sudo grep httpd /var/log/audit/audit.log | audit2allow -M myhttpd
sudo semodule -i myhttpd.pp
```

### Lab 5: Kernel Security Verification

```bash
mokutil --sb-state
dmesg | grep -i secure
cat /sys/kernel/security/lockdown
sysctl kernel.kptr_restrict kernel.dmesg_restrict
cat /sys/devices/system/cpu/vulnerabilities/*
```

---

## 11. Security Event Correlation Rules

```
Rule 1 (Brute Force): failed > 5 within 60s same_ip → ALERT + Block IP
Rule 2 (Lateral Movement): ssh from new_ip + known_ip exists → ALERT + MFA
Rule 3 (Privesc): sudo + not in whitelist + off-hours → ALERT
Rule 4 (Exfiltration): outbound > 1GB + not whitelisted → ALERT + Block
Rule 5 (Persistence): cron/authorized_keys/passwd changed → ALERT
```

---

## 12. Penetration Testing Commands

```bash
# Recon
uname -a && cat /etc/os-release && id && sudo -l
getcap -r / 2>/dev/null
crontab -l && ls -la /etc/cron*

# Priv Esc Enumeration
find / -perm -4000 -type f 2>/dev/null
echo $PATH | tr ':' '\n' | xargs -I{} find {} -writable -type f 2>/dev/null
find /etc -writable -type f 2>/dev/null
ls -la /var/run/docker.sock

# Kernel Checks
uname -r
cat /sys/devices/system/cpu/vulnerabilities/*
```

---

## 13. Windows System Security

```powershell
# Audit policies
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 50

# Hardening
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
New-NetFirewallRule -DisplayName "Block RDP" -Direction Inbound -Protocol TCP -LocalPort 3389 -Action Block
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DnSClient" -Name "EnableMulticast" -Value 0
```

---

## 14. Common Vulnerabilities

| CVE | Name | Impact | Fix |
|-----|------|--------|-----|
| CVE-2022-0847 | DirtyPipe | Local privesc (Linux 5.8-5.16.11) | Patch kernel |
| CVE-2021-4034 | PwnKit | Local privesc (Polkit < 0.120) | Update polkit |
| CVE-2016-5195 | DirtyCow | Local privesc (Linux < 4.8.3) | Patch kernel |
| CVE-2021-3156 | Baron Samedit | Local privesc (Sudo < 1.9.5p2) | Update sudo |
| CVE-2020-1472 | Zerologon | Domain takeover (Windows DC) | Patch + enforcement |

---

## 15. Interview Questions

**Q1: DAC vs MAC?**
A: DAC lets owners set permissions (chmod). MAC enforces system policy owners cannot override — even root obeys SELinux.

**Q2: PAM module stacking?**
A: Required = must pass (continues). Requisite = must pass (stops). Sufficient = succeeds if no prior required failed.

**Q3: KASLR bypass methods?**
A: Info leak (read kernel pointer), brute force (crash+reboot), side channel (timing oracle).

**Q4: Secure Boot chain?**
A: Firmware → Shim → Bootloader → Kernel. Each verifies the next via cryptographic signatures.

**Q5: Linux capabilities vs root?**
A: Capabilities split root into discrete units. Process gets only needed privileges, reducing attack surface.

**Q6: SUID escalation path?**
A: SUID bit runs binary as owner. Root-owned SUID binaries allow shell spawning. Find: `find / -perm -4000`.

**Q7: Detecting brute force from logs?**
A: Count "Failed password" by source IP. >5 in 60s = brute force. Cross-reference with successful login.

**Q8: SELinux type enforcement?**
A: Maps process types to allowed file types. httpd_t can read httpd_sys_content_t but not etc_t.

**Q9: Kernel lockdown modes?**
A: Integrity = no unsigned modules. Confidentiality = also blocks /proc/kcore and device memory.

**Q10: Investigating compromised Linux server?**
A: Check auth.log, auditd logs, SUID binaries, cron jobs, processes, network connections, file integrity, kernel modules.

---

## 16. Quick Reference

```bash
# System info
uname -a && cat /etc/os-release && id

# Priv esc vectors
sudo -l && find / -perm -4000 -type f 2>/dev/null && getcap -r / 2>/dev/null

# SELinux
getenforce && ls -Z /etc/passwd && ausearch -m avc --start recent

# Audit
auditctl -l && ausearch -k exec_all --start today && aureport --failed

# Logs
journalctl -u sshd --since "1 hour ago" && grep "Failed" /var/log/auth.log | tail -20

# Hardening
sysctl -a | grep -E "(kptr_restrict|dmesg_restrict|rp_filter|accept_redirects)"

# Integrity
sha256sum /usr/bin/su /usr/bin/sudo /usr/bin/passwd

# Processes
ps auxf && ss -tlnp && netstat -tlnp
```

---

## 17. Cross-References

| Topic | File |
|-------|------|
| OS Architecture | OS-Architecture.md |
| Process Management | Process-Management.md |
| Memory Management | Memory-Management.md |
| File Systems | File-Systems.md |

---

## 18. Resources

**Books**: *Linux Security Cookbook* · *SELinux System Administration* · *How Linux Works* (Brian Ward) · *The Linux Programming Interface* (Kerrisk)

**Docs**: https://selinuxproject.org/wiki/ · https://wiki.archlinux.org/title/AppArmor

**Tools**: Lynis (audit) · LinPEAS (priv esc) · BeRoot (priv esc) · Seatbelt (Windows audit)

**Labs**: OverTheWire Bandit · TryHackMe Linux Fundamentals · HackTheBox Linux machines
