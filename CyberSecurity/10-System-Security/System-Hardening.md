# System Hardening

## What is it?

System hardening is the process of securing a system by reducing its attack surface. It involves removing unnecessary services, disabling unused ports, applying secure configurations, and enforcing security policies on operating systems and applications. The goal is to minimize vulnerabilities and limit potential entry points for attackers.

## Why Learn It?

Hardening is a foundational defense layer — a poorly configured system undermines every other security control. Attackers routinely exploit default configurations, open ports, and unnecessary services to gain initial access. A hardened system significantly reduces risk and is required by most compliance frameworks.

## You Will Learn

- Identifying and removing unnecessary services and software
- Configuring OS security baselines (Linux and Windows)
- Enforcing password policies, account lockout, and privilege restrictions
- Securing boot processes, file permissions, and kernel parameters
- Applying CIS Benchmarks and DISA STIGs

## Prerequisites

- Linux Fundamentals
- Windows Administration
- Security Fundamentals

## Related Topics

- Penetration Testing
- Compliance & Auditing

---

## Layer Position in Defense Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEFENSE-IN-DEPTH                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │  Physical      │    │  Perimeter     │    │  Network       │      │
│  │  Security      │    │  Security      │    │  Security      │      │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘       │
│          │                     │                     │                │
│          ▼                     ▼                     ▼                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              ▶▶▶  SYSTEM HARDENING  ◀◀◀                    │    │
│  │         (OS / Kernel / Service / Configuration)             │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                       │
│          ▼                  ▼                  ▼                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │  Endpoint      │  │  Application   │  │  Data          │          │
│  │  Security      │  │  Security      │  │  Security      │          │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

System hardening sits at the **core OS layer** — the foundation upon which all application and endpoint controls depend.

---

## 1. OS Hardening Principles

### 1.1 Principle of Least Privilege

Every user, service, and process should operate with the minimum permissions necessary.

| Area | Hardened State | Default (Insecure) State |
|------|---------------|--------------------------|
| Root/Admin access | Disabled for daily tasks | Auto-login as root |
| Service accounts | Dedicated, restricted users | Running as root/ SYSTEM |
| File permissions | 640/700 for sensitive files | 666/777 world-writable |
| Sudo/sudoers | Granular, logged commands | `ALL=(ALL) NOPASSWD: ALL` |
| Kernel capabilities | Explicitly granted only | Full capability sets |

### 1.2 Principle of Attack Surface Reduction

Every enabled service, open port, or installed package is a potential entry point.

```
Attack Surface = Services + Open Ports + Installed Packages + User Accounts
                 + Exposed APIs + Mounted File Systems + Kernel Modules

HARDENING GOAL: Minimize this equation
```

### 1.3 Principle of Secure Defaults

Systems should ship and operate in a secure-by-default posture:

- Services disabled until explicitly needed
- Firewall deny-all with specific allow rules
- Logging enabled from first boot
- No sample/test configurations in production

### 1.4 Defense in Depth for Hardening

```
┌──────────────────────────────────────────────────────┐
│                  BOOT SECURITY                        │
│  UEFI Secure Boot → Signed bootloader → Verified     │
│  kernel → dm-verity for root filesystem              │
├──────────────────────────────────────────────────────┤
│                  KERNEL HARDENING                     │
│  sysctl restrictions → module signing → seccomp      │
│  profiles → kernel lockdown mode                     │
├──────────────────────────────────────────────────────┤
│                  SERVICE HARDENING                    │
│  Remove unnecessary → sandbox remaining → restrict   │
│  capabilities → chroot/containers                    │
├──────────────────────────────────────────────────────┤
│                  USER HARDENING                       │
│  Strong passwords → MFA → least privilege → audit    │
│  logging → account lockout                           │
├──────────────────────────────────────────────────────┤
│                  FILE SYSTEM HARDENING                │
│  Mount options (noexec,nosuid) → permissions →       │
│  encryption → immutable configs                      │
└──────────────────────────────────────────────────────┘
```

---

## 2. Removing Unnecessary Services

### 2.1 Service Audit Process

```bash
# List all running services (Linux)
systemctl list-units --type=service --state=running

# List all enabled (boot-start) services
systemctl list-unit-files --type=service --state=enabled

# List all listening ports
ss -tlnp
netstat -tlnp

# Identify services binding to all interfaces (0.0.0.0)
ss -tlnp | grep -E '0\.0\.0\.0|:::'
```

### 2.2 Common Services to Disable

| Service | Risk | How to Disable |
|---------|------|----------------|
| Telnet | Cleartext protocol | `systemctl disable telnet.socket` |
| FTP | Cleartext, no encryption | Remove vsftpd/proftpd |
| NFS (if unused) | RPC exploitation | `systemctl disable nfs-server` |
| CUPS (if no printing) | Remote exploit surface | `systemctl disable cups` |
| Avahi/mDNS | Network discovery, info leak | `systemctl disable avahi-daemon` |
| Bluetooth (servers) | Bluesnarfing, BlueBorne | `systemctl disable bluetooth` |
| Apache/Nginx (if unused) | Web server exploits | `systemctl stop/disable httpd` |
| RDP (if SSH available) | Brute force, RCE | Disable in Windows settings |

### 2.3 Windows Service Hardening

```powershell
# List running services
Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName

# Disable unnecessary services
Set-Service -Name "TermService" -StartupType Disabled    # Remote Desktop
Set-Service -Name "Browser" -StartupType Disabled         # Computer Browser
Set-Service -Name "Spooler" -StartupType Disabled         # Print Spooler (if unused)

# Disable SMBv1 (critical - WannaCry vector)
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol

# Check for listening ports
netstat -ano | findstr "LISTENING"
```

### 2.4 Service Hardening Workflow

```
┌──────────────┐
│ Audit All     │
│ Services      │──→ systemctl list-units --type=service
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Classify      │
│ Required vs   │──→ Business need documentation
│ Optional      │    Security risk assessment
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Disable       │
│ Unnecessary   │──→ systemctl disable <service>
│ Services      │    systemctl stop <service>
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Sandbox       │
│ Remaining     │──→ systemd unit sandboxing
│ Services      │    PrivateTmp, ProtectSystem
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Monitor       │
│ for Drift     │──→ Periodic audits
│               │    Configuration management
└──────────────┘
```

---

## 3. Secure Configuration

### 3.1 Linux Kernel Hardening (sysctl)

```bash
# /etc/sysctl.d/99-security.conf

# Disable IP forwarding (unless router)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Prevent IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Disable ICMP redirects (prevent MITM)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Enable SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# Log martian packets
net.ipv4.conf.all.log_martians = 1

# Disable IPv6 if unused
net.ipv6.conf.all.disable_ipv6 = 1

# Restrict dmesg access
kernel.dmesg_restrict = 1

# Restrict kernel pointer exposure
kernel.kptr_restrict = 2

# Disable SysRq key
kernel.sysrq = 0

# ASLR full randomization
kernel.randomize_va_space = 2

# Apply changes
sysctl --system
```

### 3.2 Linux SSH Hardening

```bash
# /etc/ssh/sshd_config

Port 2222                          # Non-standard port
Protocol 2                         # SSHv2 only
PermitRootLogin no                 # Disable root login
PasswordAuthentication no          # Key-only authentication
PubkeyAuthentication yes           # Enable public key auth
MaxAuthTries 3                     # Limit brute force
ClientAliveInterval 300            # Timeout idle sessions
ClientAliveCountMax 2
AllowUsers admin deploy            # Whitelist specific users
X11Forwarding no                   # Disable X11 forwarding
AllowTcpForwarding no              # Disable port forwarding
PermitEmptyPasswords no            # No empty passwords
LoginGraceTime 60                  # Login timeout
Banner /etc/issue.net              # Legal notice
Protocol 2                         # Enforce SSHv2
Ciphers aes256-gcm@openssh.com    # Strong ciphers only
MACs hmac-sha2-512-etm@openssh.com
KexAlgorithms curve25519-sha256@libssh.org
```

### 3.3 Windows Hardening

```powershell
# Enable Windows Firewall (all profiles)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Disable LM hashes
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name "NoLMHash" -Value 1

# Require NTLMv2 (disable NTLMv1)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name "LmCompatibilityLevel" -Value 5

# Disable anonymous enumeration
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name "RestrictAnonymous" -Value 1

# Enable DEP (Data Execution Prevention)
bcdedit /set nx AlwaysOn

# Disable autoplay
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" -Name "NoDriveTypeAutoRun" -Value 255

# Audit policy
auditpol /set /category:* /success:enable /failure:enable

# Disable Guest account
net user Guest /active:no

# Enforce password policy
net accounts /minpwlen:14 /maxpwage:90 /lockoutthreshold:5 /lockoutduration:30
```

### 3.4 File Permission Hardening

```
CRITICAL FILE PERMISSIONS (Linux):

/etc/passwd         → 644  (world-readable, owner-writable)
/etc/shadow         → 640  (root:shadow only)
/etc/group          → 644  (world-readable)
/etc/gshadow        → 640  (root:shadow only)
/etc/ssh/sshd_config → 600 (root only)
/etc/sudoers        → 440  (read-only, root only)
/etc/crontab        → 600  (root only)
/boot/grub/grub.cfg → 600  (root only)

FIND WORLD-WRITABLE FILES:
find / -type f -perm -0002 -ls 2>/dev/null

FIND SUID/SGID FILES:
find / -type f \( -perm -4000 -o -perm -2000 \) -ls 2>/dev/null

REMOVE UNNECESSARY SUID:
chmod u-s /usr/bin/unknown_binary
```

---

## 4. CIS Benchmarks

### 4.1 What are CIS Benchmarks?

The Center for Internet Security (CIS) publishes vendor-specific hardening guidelines. Each benchmark provides:

- **Level 1**: Basic security hygiene (recommended for all systems)
- **Level 2**: Defense-in-depth (sensitive/high-security systems)
- **Profile**: Workstation vs. Server vs. Domain Controller

### 4.2 CIS Benchmark Structure

```
┌──────────────────────────────────────────────────────────────┐
│                    CIS BENCHMARK LAYERS                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Initial Setup                                           │
│     ├── Filesystem Configuration ( partitions, /tmp )       │
│     ├── Software Updates                                    │
│     ├── Filesystem Integrity (AIDE)                         │
│     ├── Secure Boot                                         │
│     └── Process Hardening (core dumps, ASLR)               │
│                                                              │
│  2. Services                                                │
│     ├── inetd Services                                      │
│     ├── Special Purpose Services (NTP, X Window, Avahi)     │
│     └── Service Clients (NIS, rsh)                         │
│                                                              │
│  3. Network Configuration                                   │
│     ├── Network Parameters (IPv4, IPv6)                     │
│     ├── Firewall Configuration                              │
│     └── Uncommon Network Protocols                          │
│                                                              │
│  4. Logging and Auditing                                    │
│     ├── Audit System Configuration                          │
│     └── Auditd Rules                                        │
│                                                              │
│  5. Access, Authentication and Authorization                │
│     ├── Cron Jobs                                           │
│     ├── SSH Server Configuration                            │
│     ├── Password Configuration                              │
│     └── User Accounts and Environment                       │
│                                                              │
│  6. System Maintenance                                      │
│     ├── Local User Accounts                                 │
│     ├── Local Groups                                        │
│     └── World Writable Files                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Key CIS Benchmark Items (Linux)

| ID | Control | Expected Setting |
|----|---------|-----------------|
| 1.1.1.1 | cramfs disabled | `install cramfs /bin/true` |
| 1.1.1.2 | freevxfs disabled | `install freevxfs /bin/true` |
| 1.1.1.3 | hfs disabled | `install hfs /bin/true` |
| 1.1.1.4 | hfsplus disabled | `install hfsplus /bin/true` |
| 1.1.1.5 | udf disabled | `install udf /bin/true` |
| 1.1.2 | /tmp separate partition | `tmpfs` with `noexec,nosuid,nodev` |
| 1.3.1 | AIDE installed | `apt install aide` |
| 1.4.1 | Permissions on bootloader | `chmod 600 /boot/grub/grub.cfg` |
| 1.5.1 | Core dumps restricted | `* hard core 0` in limits.conf |
| 3.1.1 | IP forwarding disabled | `net.ipv4.ip_forward = 0` |
| 4.1.1 | Auditd installed | `systemctl enable auditd` |
| 5.2.1 | SSH PermitRootLogin no | `PermitRootLogin no` |
| 5.4.1 | Password expiration ≤365 | `PASS_MAX_DAYS 365` |

### 4.4 Using OpenSCAP for CIS Compliance

```bash
# Install OpenSCAP
apt install libopenscap8 ssg-debian-hardening
# or on RHEL/CentOS
yum install openscap-scanner scap-security-guide

# Scan against CIS Debian 11 Benchmark
oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis \
  --results results.xml \
  --report report.html \
  /usr/share/xml/scap/ssg/content/ssg-debian11-ds.xml

# Generate remediation script
oscap xccdf generate fix \
  --profile xccdf_org.ssgproject.content_profile_cis \
  results.xml > remediation.sh

# Apply remediation
bash remediation.sh
```

---

## 5. DISA STIGs

### 5.1 What are STIGs?

Security Technical Implementation Guides (STIGs) are configuration standards published by the Defense Information Systems Agency (DISA). They are mandatory for DoD systems and widely adopted by other organizations.

### 5.2 STIG vs CIS Comparison

| Aspect | CIS Benchmark | DISA STIG |
|--------|--------------|-----------|
| Publisher | Center for Internet Security | Defense Information Systems Agency |
| Target | All organizations | DoD + widely adopted |
| Strictness | Moderate to High | High (government-grade) |
| Format | PDF + automation tools | XML (SCAP) + STIG Viewer |
| Remediation | Optional scripts | XCCDF + OVAL |
| Regularity | ~2x/year | ~1-2x/year |
| Tool | CIS-CAT | SCAP Compliance Checker |

### 5.3 STIG Viewer and Compliance

```bash
# Download STIG from public.cyber.mil
# Use SCAP Compliance Checker or OpenSCAP

# Evaluate against a STIG
oscap xccdf eval \
  --profile xccdf_disa_stig \
  --results stig-results.xml \
  --report stig-report.html \
  stig-content.xml

# View results in STIG Viewer (GUI)
stig-viewer stig-results.xml
```

### 5.4 Common STIG Controls

```
STIG CONTROL EXAMPLES:

V-254290  (RHEL 9) - Audit rules must be configured
V-254291  - System must use FIPS 140-2 crypto
V-254292  - Audit log storage size configured
V-254293  - Permissions on audit.log = 0600
V-254294  - SSH protocol = 2
V-254295  - SSH ciphers restricted
V-254296  - Unnecessary filesystems disabled
V-254297  - Core dumps restricted
V-254298  - ASLR enabled
V-254299  - /tmp separate partition
V-254300  - /var/tmp separate partition
V-254301  - /dev/shm separate partition with noexec
```

---

## 6. Hardening Automation

### 6.1 Automation Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Inventory    │────→│  Profile      │────→│  Compliance   │
│  Assets       │     │  Selection    │     │  Scanning     │
│  (CMDB/Ansible│     │  (CIS/STIG)   │     │  (OpenSCAP)   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Continuous   │←────│  Deploy       │←────│  Generate     │
│  Monitoring   │     │  (Ansible/    │     │  Remediation  │
│  (Wazuh)      │     │   Puppet)     │     │  Script       │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 6.2 Ansible Hardening Playbook

```yaml
# hardening.yml
---
- hosts: all
  become: yes
  roles:
    - role: cis_hardening
      vars:
        cis_level: 2

# roles/cis_hardening/tasks/main.yml
---
- name: Disable unnecessary services
  systemd:
    name: "{{ item }}"
    state: stopped
    enabled: no
  loop:
    - avahi-daemon
    - cups
    - rpcbind
    - nfs-server

- name: Set kernel parameters
  sysctl:
    name: "{{ item.name }}"
    value: "{{ item.value }}"
    sysctl_set: yes
    state: present
    reload: yes
  loop:
    - { name: "net.ipv4.ip_forward", value: "0" }
    - { name: "net.ipv4.conf.all.rp_filter", value: "1" }
    - { name: "kernel.randomize_va_space", value: "2" }
    - { name: "net.ipv4.conf.all.accept_redirects", value: "0" }

- name: Harden SSH configuration
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "{{ item.regexp }}"
    line: "{{ item.line }}"
  loop:
    - { regexp: '^#?PermitRootLogin', line: 'PermitRootLogin no' }
    - { regexp: '^#?PasswordAuthentication', line: 'PasswordAuthentication no' }
    - { regexp: '^#?X11Forwarding', line: 'X11Forwarding no' }
    - { regexp: '^#?MaxAuthTries', line: 'MaxAuthTries 3' }
  notify: restart sshd

- name: Set file permissions on critical files
  file:
    path: "{{ item.path }}"
    mode: "{{ item.mode }}"
    owner: root
    group: root
  loop:
    - { path: "/etc/shadow", mode: "0640" }
    - { path: "/etc/gshadow", mode: "0640" }
    - { path: "/etc/ssh/sshd_config", mode: "0600" }
    - { path: "/etc/crontab", mode: "0600" }
```

### 6.3 Puppet Hardening Module

```puppet
# site.pp
node default {
  # Disable unnecessary services
  service { ['avahi-daemon', 'cups', 'rpcbind']:
    ensure => stopped,
    enable => false,
  }

  # Harden sysctl
  sysctl { 'net.ipv4.ip_forward':       value => '0' }
  sysctl { 'net.ipv4.conf.all.rp_filter': value => '1' }
  sysctl { 'kernel.randomize_va_space': value => '2' }

  # SSH hardening
  file { '/etc/ssh/sshd_config':
    ensure  => file,
    content => epp('hardening/sshd_config.epp'),
    notify  => Service['sshd'],
  }

  service { 'sshd':
    ensure => running,
    enable => true,
  }
}
```

### 6.4 Docker/Container Hardening

```dockerfile
# Secure Dockerfile
FROM ubuntu:22.04

# Remove unnecessary packages
RUN apt-get update && \
    apt-get remove -y --purge \
      telnet ftp rsh-client && \
    apt-get autoremove -y

# Create non-root user
RUN useradd -r -s /bin/false appuser

# Set restrictive permissions
COPY --chown=appuser:appuser app /app/

# Don't run as root
USER appuser

# Read-only filesystem (runtime)
# docker run --read-only --tmpfs /tmp
```

### 6.5 Configuration Management Drift Detection

```bash
#!/bin/bash
# drift-check.sh - Detect configuration drift

BASELINE="/etc/hardening/baseline"
CURRENT="/tmp/current-configs"

mkdir -p "$CURRENT"

# Capture current state
cp /etc/ssh/sshd_config "$CURRENT/"
cp /etc/sysctl.conf "$CURRENT/"
cp /etc/hosts "$CURRENT/"

# Compare with baseline
for file in "$BASELINE"/*; do
    filename=$(basename "$file")
    if ! diff -q "$file" "$CURRENT/$filename" >/dev/null 2>&1; then
        echo "[DRIFT] $filename has been modified"
        diff "$file" "$CURRENT/$filename"
    fi
done
```

---

## 7. Security Perspective

### 7.1 Attack Techniques Targeting Poor Hardening

```
┌─────────────────────────────────────────────────────────────────┐
│                   ATTACK SURFACE MAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Default Credentials ──→ Unauthorized Access                   │
│       │                                                         │
│  Unnecessary Services ──→ Exploitable Entry Points             │
│       │                                                         │
│  Open Ports ──→ Network Enumeration → Lateral Movement         │
│       │                                                         │
│  Weak Permissions ──→ Privilege Escalation                     │
│       │                                                         │
│  Unpatched Kernel ──→ Kernel Exploits (DirtyPipe, DirtyCow)   │
│       │                                                         │
│  Exposed Config Files ──→ Credential Theft → Full Compromise   │
│       │                                                         │
│  No Auditing ──→ Undetected Persistence                        │
│       │                                                         │
│  Shared Root Access ──→ Accountability Loss → Insider Threat   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Real-World Attack Examples

| Attack | Hardening Gap Exploited | Impact |
|--------|------------------------|--------|
| EternalBlue (WannaCry) | Unpatched SMBv1 | Global ransomware outbreak |
| Dirty COW (CVE-2016-5195) | Unpatched kernel | Root privilege escalation |
| ShellShock (CVE-2014-6271) | Bash with exposed CGI | Remote code execution |
| Default credentials on IoT | No hardening | Botnet recruitment (Mirai) |
| PrintNightmare (CVE-2021-34527) | Print Spooler service running | Domain compromise |

### 7.3 Defense Mechanisms Summary

```
HARDENING DEFENSE CHAIN:

Prevent:
  ├── Remove unnecessary services (reduce attack surface)
  ├── Disable default accounts/credentials
  ├── Apply CIS/STIG baselines
  ├── Enable secure boot chain
  └── Enforce strong authentication

Detect:
  ├── File integrity monitoring (AIDE/Tripwire)
  ├── Audit daemon rules
  ├── Wazuh agent monitoring
  └── Configuration drift detection

Respond:
  ├── Automated remediation playbooks
  ├── Configuration rollback procedures
  ├── Incident isolation via firewall rules
  └── Forensic evidence preservation
```

---

## 8. Practical Examples

### 8.1 Full Linux Server Hardening Script

```bash
#!/bin/bash
# server-hardening.sh - Comprehensive server hardening

echo "[*] Starting server hardening..."

# 1. Update system
apt-get update && apt-get upgrade -y

# 2. Remove unnecessary packages
PACKAGES_TO_REMOVE=(
    "telnet" "ftp" "rsh-client" "rsh-server"
    "ypserv" "ypbind" "tftp" "tftpd"
    "xinetd" "inetd" "ntalk" "talk"
)
for pkg in "${PACKAGES_TO_REMOVE[@]}"; do
    apt-get remove -y --purge "$pkg" 2>/dev/null
done

# 3. Disable services
SERVICES_TO_DISABLE=(
    "avahi-daemon" "cups" "rpcbind"
    "nfs-server" "bluetooth" "wpa_supplicant"
)
for svc in "${SERVICES_TO_DISABLE[@]}"; do
    systemctl stop "$svc" 2>/dev/null
    systemctl disable "$svc" 2>/dev/null
done

# 4. Apply kernel hardening
cat > /etc/sysctl.d/99-hardening.conf << 'EOF'
net.ipv4.ip_forward = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.log_martians = 1
kernel.randomize_va_space = 2
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
net.ipv6.conf.all.disable_ipv6 = 1
EOF
sysctl --system

# 5. Harden SSH
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
sed -i 's/^#\?Protocol.*/Protocol 2/' /etc/ssh/sshd_config
systemctl restart sshd

# 6. Set permissions
chmod 600 /etc/ssh/sshd_config
chmod 640 /etc/shadow
chmod 640 /etc/gshadow
chmod 600 /etc/crontab
chmod 700 /root

# 7. Enable firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp    # SSH on custom port
ufw --force enable

# 8. Enable auditd
apt-get install -y auditd
systemctl enable auditd
echo "-w /etc/passwd -p wa -k identity" >> /etc/audit/rules.d/audit.rules
echo "-w /etc/shadow -p wa -k identity" >> /etc/audit/rules.d/audit.rules
echo "-w /etc/sudoers -p wa -k sudoers" >> /etc/audit/rules.d/audit.rules
auditctl -R /etc/audit/rules.d/audit.rules

echo "[+] Server hardening complete"
```

### 8.2 Windows Server Hardening Script

```powershell
# Windows-Hardening.ps1
Write-Host "[*] Starting Windows server hardening..." -ForegroundColor Green

# 1. Enable Windows Firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
Set-NetFirewallProfile -DefaultInboundAction Block -DefaultOutboundAction Allow

# 2. Disable SMBv1
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart

# 3. Disable RDP (if not needed)
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 1

# 4. Enable DEP
bcdedit /set nx AlwaysOn

# 5. Disable AutoRun
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" -Name "NoDriveTypeAutoRun" -Value 255

# 6. Account policies
net accounts /minpwlen:14 /maxpwage:90 /lockoutthreshold:5 /lockoutduration:30

# 7. Disable Guest
net user Guest /active:no

# 8. Audit policy
auditpol /set /category:* /success:enable /failure:enable

# 9. Disable LLMNR
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" -Name "EnableMulticast" -Value 0

# 10. Disable NTLMv1
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name "LmCompatibilityLevel" -Value 5

Write-Host "[+] Hardening complete" -ForegroundColor Green
```

---

## 9. Interview Questions

### Basic

1. **What is system hardening and why is it important?**
   - Reducing attack surface by removing unnecessary services, applying secure configs, enforcing least privilege

2. **What is the difference between CIS Benchmarks and DISA STIGs?**
   - CIS: vendor-neutral, industry-adopted; STIG: DoD-mandatory, stricter, XML-based SCAP format

3. **How do you identify unnecessary services on a Linux server?**
   - `systemctl list-units --type=service --state=running`, `ss -tlnp`, review business requirements

4. **What kernel parameters should always be hardened?**
   - IP forwarding, ASLR, SYN cookies, ICMP redirects, source routing, dmesg restrictions

5. **Why disable Telnet and use SSH instead?**
   - Telnet transmits in cleartext; SSH encrypts all traffic including credentials

### Intermediate

6. **Explain the CIS Benchmark Level 1 vs Level 2 difference.**
   - Level 1: basic hygiene, minimal performance impact; Level 2: defense-in-depth for sensitive systems

7. **How does OpenSCAP help with hardening compliance?**
   - Scans systems against SCAP content (CIS/STIG profiles), generates compliance reports, produces remediation scripts

8. **What is configuration drift and how do you prevent it?**
   - Gradual deviation from hardened baseline; prevent via configuration management (Ansible/Puppet/Chef) + drift detection

9. **How would you harden SSH beyond basic settings?**
   - Custom port, key-based auth only, restricted algorithms, MFA via Google Authenticator, AllowUsers whitelist

10. **What is the impact of disabling IPv6 on security?**
    - Reduces attack surface if IPv6 not used; some attacks (SLAAC, NDP poisoning) are IPv6-only

### Advanced

11. **How would you automate STIG compliance across 500 servers?**
    - OpenSCAP + Ansible for remediation + Wazuh for continuous compliance monitoring + centralized reporting

12. **Explain the secure boot chain from firmware to OS.**
    - UEFI → signed bootloader (shim) → verified kernel → dm-verity root filesystem → signed modules only

13. **How do you handle hardening for systems that cannot be patched or rebooted?**
    - Compensating controls: network segmentation, WAF, runtime protection (SELinux/AppArmor), enhanced monitoring

14. **What is kernel lockdown mode and when would you use it?**
    - LSM that restricts kernel features (debugfs, kexec, ioperm); use on high-security systems

15. **How do you validate that hardening was applied correctly and hasn't drifted?**
    - OpenSCAP scans + automated drift detection + Wazuh file integrity monitoring + periodic manual audits

---

## 10. Hands-on Labs

### Lab 1: Linux Server Hardening with CIS Benchmark

```bash
# 1. Install OpenSCAP and STIG content
sudo apt install openscap-scanner ssg-debian-hardening

# 2. Run baseline scan
sudo oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis \
  --results /tmp/baseline-results.xml \
  --report /tmp/baseline-report.html \
  /usr/share/xml/scap/ssg/content/ssg-debian11-ds.xml

# 3. Review findings
oscap info /tmp/baseline-results.xml

# 4. Generate remediation script
sudo oscap xccdf generate fix \
  --profile xccdf_org.ssgproject.content_profile_cis \
  /tmp/baseline-results.xml > /tmp/remediation.sh

# 5. Review and apply remediation
cat /tmp/remediation.sh
sudo bash /tmp/remediation.sh

# 6. Re-scan to verify
sudo oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis \
  /usr/share/xml/scap/ssg/content/ssg-debian11-ds.xml
```

### Lab 2: Ansible Hardening Automation

```bash
# Setup
pip install ansible

# Create inventory
echo "web-server ansible_host=192.168.1.100" > inventory.ini

# Run hardening playbook
ansible-playbook -i inventory.ini hardening.yml --check  # Dry run
ansible-playbook -i inventory.ini hardening.yml           # Apply

# Verify
ansible web-server -i inventory.ini -m shell \
  -a "ss -tlnp | grep -E '23|21|111|631'"
```

### Lab 3: Wazuh Configuration Drift Detection

```bash
# On Wazuh server - add to ossec.conf
cat >> /var/ossec/etc/ossec.conf << 'EOF'
<syscheck>
  <directories check_all="yes" report_changes="yes" realtime="yes">/etc</directories>
  <directories check_all="yes" report_changes="yes" realtime="yes">/usr/bin</directories>
  <ignore>/etc/mtab</ignore>
</syscheck>
EOF

# On agent - verify monitoring
/var/ossec/bin/agent_control -i 001
```

### Lab 4: Windows Hardening Validation

```powershell
# Check firewall status
Get-NetFirewallProfile | Select Name, Enabled

# Check SMBv1 status
Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol

# Check audit policy
auditpol /get /category:*

# Check password policy
net accounts

# Run Microsoft Security Compliance Toolkit
# Download from https://www.microsoft.com/en-us/download/details.aspx?id=55319
```

---

## 11. Summary Table

| Topic | Key Concept | Primary Tools | Risk If Ignored |
|-------|------------|---------------|-----------------|
| Service Removal | Reduce attack surface | systemctl, netstat | Unnecessary exploits |
| Kernel Hardening | Restrict kernel features | sysctl, seccomp | Privilege escalation |
| SSH Hardening | Secure remote access | sshd_config, fail2ban | Brute force, unauthorized access |
| File Permissions | Enforce least privilege | chmod, chown, find | Privilege escalation, data leak |
| CIS Benchmarks | Standardized baselines | OpenSCAP, CIS-CAT | Compliance failures |
| DISA STIGs | Government-grade standards | SCAP, STIG Viewer | Regulatory penalties |
| Automation | Consistent enforcement | Ansible, Puppet, Chef | Configuration drift |
| Configuration Drift | Detect unauthorized changes | Wazuh, AIDE, Tripwire | Undetected compromise |
| Boot Security | Verified boot chain | UEFI Secure Boot | Bootkits, rootkits |
| Compliance Scanning | Validate hardening | OpenSCAP, Lynis | Blind spots in security posture |

---

## Resources

**Books:**
- *Linux Security Cookbook* - O'Reilly
- *Windows Security Cookbook* - O'Reilly
- *The Practice of Network Security Monitoring* - Richard Bejtlich

**Documentation:**
- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks
- DISA STIGs: https://public.cyber.mil/stigs/
- OpenSCAP: https://www.open-scap.org/tools/
- NIST SP 800-123: Guide to General Server Security

**Tools:**
- OpenSCAP (compliance scanning)
- Lynis (Linux security auditing)
- Bastille Linux (hardening)
- Microsoft Security Compliance Toolkit
- Ansible/Chef/Puppet (automation)

**Labs:**
- CIS WorkBench (free accounts)
- DISA STIG Library
- OverTheWire: Bandit (Linux basics)
- VulnHub hardened challenges
