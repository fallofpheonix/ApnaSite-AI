# System Administration

## Layer Position

```
┌─────────────────────────────────────────────────────────┐
│                    User Applications                     │
├─────────────────────────────────────────────────────────┤
│                   System Services                        │
├─────────────────────────────────────────────────────────┤
│              init System (systemd)                       │
├─────────────────────────────────────────────────────────┤
│                   Linux Kernel                           │
├─────────────────────────────────────────────────────────┤
│                    Hardware                              │
└─────────────────────────────────────────────────────────┘
```

System administration manages the lifecycle of services, packages, users, and system configuration sitting between user space and the kernel.

## 1. Topic Overview

System administration encompasses managing, configuring, and maintaining Linux systems. Core responsibilities include:

- **Service management**: Starting, stopping, and monitoring background processes
- **Package management**: Installing, updating, and removing software
- **User administration**: Managing accounts, permissions, and access control
- **Network configuration**: Configuring interfaces, DNS, and routing
- **Log management**: Collecting, rotating, and analyzing system logs
- **Backup and recovery**: Protecting data and restoring from failures

| Component | Purpose | Example |
|-----------|---------|---------|
| systemd | Init system and service manager | `systemctl` |
| Package Manager | Software lifecycle | `apt`, `dnf`, `pacman` |
| PAM | Authentication framework | `/etc/pam.d/` |
| journald | Structured logging | `journalctl` |
| cron/timers | Task scheduling | `/etc/crontab` |

## 2. Why It Exists

Without centralized administration, systems degrade into unmanageable chaos:

1. **Consistency**: Standardized configurations across systems
2. **Security**: Controlled access and minimized attack surface
3. **Reliability**: Service dependency management and automatic restart
4. **Auditability**: Complete logging of system events and changes
5. **Scalability**: Manage thousands of servers through automation

Security relevance: unauthorized services = persistent backdoors, unpatched packages = known vulnerabilities, weak passwords = brute-force attacks, missing logs = blind spots.

## 3. Internal Architecture

### 3.1 Service Management (systemd)

#### Unit Files

```
/etc/systemd/system/          # Administrator-created (highest priority)
/run/systemd/system/          # Runtime units (lost on reboot)
/usr/lib/systemd/system/      # Package-installed (lowest priority)
```

```ini
[Unit]
Description=My Custom Service
After=network.target
Requires=database.service
Wants=redis.service

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/start.sh
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

#### Service States

```
loaded    → Unit file parsed
active    → Running (running/exited/dead)
inactive  → Not running
failed    → Started but crashed
enabled   → Starts at boot
disabled  → Does not start at boot
masked    → Cannot be started (symlink to /dev/null)
```

```bash
systemctl start/stop/restart/reload/status servicename
systemctl enable/disable/mask/unmask servicename
systemctl list-units --type=service
systemctl list-unit-files --type=service
```

#### Targets (Runlevels)

| Target | Runlevel | Purpose |
|--------|----------|---------|
| poweroff.target | 0 | Shutdown |
| rescue.target | 1 | Single-user mode |
| multi-user.target | 3 | Multi-user, no GUI |
| graphical.target | 5 | Multi-user with GUI |
| reboot.target | 6 | Reboot |
| emergency.target | - | Emergency shell |

```bash
systemctl get-default                    # View default target
systemctl set-default multi-user.target  # Set default target
systemctl isolate rescue.target          # Switch to rescue mode
```

#### Timer Units

```ini
[Unit]
Description=Daily cleanup

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=600

[Install]
WantedBy=timers.target
```

Calendar expressions: `OnCalendar=Mon *-*-* 09:00:00` (weekly), `OnCalendar=*-*-01 00:00:00` (monthly), `OnBootSec=15min` (after boot), `OnUnitActiveSec=1h` (interval).

```bash
systemctl list-timers --all
systemctl enable/status mytimer.timer
```

#### Journal (journald)

```bash
journalctl                           # All logs
journalctl -u nginx                  # Service-specific logs
journalctl -p err                    # Error priority and above
journalctl --since "2025-01-01"       # Logs since date
journalctl -f                        # Follow (tail -f)
journalctl --disk-usage              # Check journal size
journalctl --vacuum-size=500M        # Limit journal to 500MB
```

Priorities: 0=emerg, 1=alert, 2=crit, 3=err, 4=warning, 5=notice, 6=info, 7=debug.

### 3.2 Package Management

#### apt (Debian/Ubuntu)

```bash
apt update && apt upgrade              # Refresh and upgrade all
apt install/remove/purge nginx         # Install/remove package
apt autoremove                         # Remove unused dependencies
apt search/show nginx                  # Search/package details
apt list --installed                   # List installed packages
```

#### dnf/yum (RHEL/CentOS)

```bash
dnf check-update/install/remove/update  # Package lifecycle
dnf list installed/search/info          # Query packages
dnf history/undo                        # Transaction history
```

#### pacman (Arch)

```bash
pacman -Syu                             # Full system upgrade
pacman -S/-R/-Rns nginx                # Install/remove with deps
pacman -Ss/-Si/-Qs nginx              # Search installed/remote
```

#### Package Verification

```bash
debsums --changed                      # Debian: changed files
rpm -Va | grep "^..5"                 # RHEL: modified files
pacman -Qkk | grep "warning"          # Arch: altered files
```

### 3.3 User Administration

```bash
useradd -m -s /bin/bash username      # Create user
passwd username                       # Set password
usermod -aG sudo username            # Add to sudo group
userdel -r username                  # Delete user + home
chage -M 90 username                 # Force password change every 90 days
```

Password policy in `/etc/security/pwquality.conf`: minlen=14, dcredit=-1, ucredit=-1, lcredit=-1, ocredit=-1.

Login controls in `/etc/ssh/sshd_config`: PermitRootLogin no, PasswordAuthentication no, MaxAuthTries 3.

Account lockout via `/etc/security/faillock.conf`: deny=5, unlock_time=900.

### 3.4 Network Configuration

```bash
ip addr show/add/del                  # Interface management
ip link set eth0 up/down              # Enable/disable interface
ip route show/add                     # Routing table
ip neigh show                         # ARP table
```

```bash
nmcli device status/connection show  # NetworkManager
nmcli connection up/down eth0        # Activate/deactivate
```

DNS: `/etc/resolv.conf` with `nameserver`, `search`, `options`. Tools: `dig`, `nslookup`, `host`, `resolvectl`.

### 3.5 Log Management

rsyslog (`/etc/rsyslog.conf`): `auth,authpriv.* /var/log/auth.log`, remote via `*.* @@logserver:514`.

logrotate (`/etc/logrotate.d/nginx`):

```bash
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
}
logrotate -d /etc/logrotate.conf      # Dry run
logrotate -f /etc/logrotate.d/nginx   # Force rotation
```

Centralized: forward via `*.* @@10.0.0.50:514` in rsyslog or configure journald RemoteSyslogSocket.

### 3.6 Backup and Recovery

```bash
tar -czvf backup.tar.gz /etc/        # Create archive
tar -xzvf backup.tar.gz -C /tmp/     # Extract archive
rsync -avz --delete /src/ /dest/      # Mirror with compression
rsync -avz -e ssh /src/ user@host:/dest/  # Remote sync
```

Incremental: `tar -czvf /backup/incr.tar.gz --listed-incremental=/backup/snap.file /data`. Restore full then incremental.

## 4. System Hiding and Obfuscation

### Covert Services

Adversaries disguise malicious services as legitimate ones through:

- **Override.conf injection**: Adding `ExecStartPre` to run a backdoor before the real service starts
- **Process name spoofing**: Renaming a binary to match a legitimate service name
- **Fake service files**: Creating unit files that mimic system services

```bash
# Override example
# /etc/systemd/system/sshd.service.d/override.conf
[Service]
ExecStartPre=/opt/.hidden/backdoor
```

Detection:

```bash
systemctl list-unit-files --type=service | grep enabled
# Compare against known good baseline
diff <(systemctl list-unit-files --type=service --state=enabled) /etc/expected-services
# Check for unit file modifications
find /etc/systemd/system -type f -newer /etc/passwd
```

### Hidden Files and Directories

Common hiding spots for malicious files:

```bash
/tmp/.X11-unix/                       # Fake X11 socket directory
/dev/shm/.hidden/                     # Shared memory (non-persistent)
/var/tmp/.cache/                      # Fake cache directory
/usr/share/.update/                   # Fake update directory
```

Detection:

```bash
find / -name ".*" -type f -not -path "/proc/*" 2>/dev/null  # Find hidden files
ls -laR /tmp/ /var/tmp/ /dev/shm/    # Check common locations
find / -type d -name ".*" 2>/dev/null  # Find hidden directories
```

### Log Tampering

Attackers clear logs to cover tracks:

```bash
> /var/log/syslog                     # Truncate log file
echo "" > /var/log/auth.log           # Empty auth log
rm /var/log/nginx/access.log          # Delete log file
journalctl --rotate && journalctl --vacuum-time=1s  # Clear journal
```

Detection:

```bash
journalctl --list-boots                # Check for missing boot entries
ausearch -ts recent                   # Audit log gaps
# Check for gaps in log timestamps
head -1 /var/log/auth.log && tail -1 /var/log/auth.log
```

## 5. Detection and Analysis

### Service Integrity Monitoring

```bash
# Verify running services against known good state
systemctl list-units --type=service --state=running > /tmp/running.txt
diff /tmp/running.txt /etc/expected-services

# Check for unexpected listening ports
ss -tlnp                              # TCP listeners with processes
netstat -tlnp                         # Alternative command

# Check for services started by unusual users
ps aux | awk '{print $1}' | sort | uniq -c | sort -rn
```

### Package Integrity

```bash
# Debian/Ubuntu
debsums --changed                      # Show changed package files
dpkg --verify                          # Verify installed packages

# RHEL/CentOS
rpm -Va 2>/dev/null | grep "^..5"    # Modified files
rpm -Va --nomtime --nomode 2>/dev/null | grep -v "^..5" | head

# Arch
pacman -Qkk 2>/dev/null | grep "warning"  # Altered files
```

### Configuration Drift Detection

```bash
find /etc -mtime -1 -type f           # Files modified in last day
find /etc -newer /etc/shadow -type f  # Files newer than shadow

# AIDE (Advanced Intrusion Detection Environment)
aide --init                          # Initialize baseline
aide --check                         # Compare against baseline
```

### Timeline Analysis

```bash
# Create timeline of system activity
find / -xdev -type f -printf '%T+ %p\n' 2>/dev/null | sort > /tmp/timeline.txt

# Check recently modified binaries
find /usr/bin /usr/sbin -mtime -7 -type f

# Check for recently added SUID binaries
find / -perm -4000 -type f -mtime -30 2>/dev/null
```

## 6. Hardening Checklist

### System Level

```
[ ] Disable unused services
[ ] Enable firewall (ufw/firewalld)
[ ] Configure automatic security updates
[ ] Set SELinux/AppArmor to enforcing
[ ] Disable USB storage (if not needed)
[ ] Configure GRUB password protection
[ ] Enable boot audit logging
[ ] Remove unnecessary packages
[ ] Disable core dumps
[ ] Configure ASLR (kernel.randomize_va_space = 2)
[ ] Enable ptrace scope (kernel.yama.ptrace_scope = 1)
[ ] Restrict dmesg access (kernel.dmesg_restrict = 1)
[ ] Disable SysRq key (kernel.sysrq = 0)
```

### SSH Hardening

```
[ ] Use SSH key authentication only
[ ] Disable root login
[ ] Change default SSH port
[ ] Implement AllowUsers/AllowGroups
[ ] Configure MaxAuthTries (3)
[ ] Set ClientAliveInterval/ClientAliveCountMax
[ ] Use Protocol 2 only
[ ] Disable X11Forwarding
[ ] Enable SSH logging
[ ] Limit SSH access by IP (AllowUsers admin@10.0.0.*)
[ ] Disable TCP forwarding if not needed
[ ] Set LoginGraceTime to 30 seconds
```

### File System

```
[ ] /tmp mounted with noexec,nosuid,nodev
[ ] /var/log on separate partition
[ ] /home on separate partition
[ ] Enable disk quotas
[ ] Set proper permissions on critical files
[ ] Implement file integrity monitoring (AIDE/OSSEC)
[ ] Mount /proc with hidepid=2
[ ] Disable unused filesystems (cramfs, freevxfs, jffs2, hfs, hfsplus, udf)
[ ] Set sticky bit on world-writable directories
[ ] Remove no-owner files from /tmp
```

## 7. CIS Benchmark Quick Reference

| Category | Benchmark | Severity |
|----------|-----------|----------|
| /etc/passwd 644 | File permissions | Medium |
| /etc/shadow 600 | File permissions | High |
| PermitRootLogin no | SSH | High |
| PasswordAuthentication no | SSH | High |
| IP forwarding disabled | Network | High |
| net.ipv4.conf.all.rp_filter = 1 | Kernel | Medium |
| Password expiration ≤ 90 days | Accounts | Medium |
| Lock after 5 failed attempts | Accounts | Medium |

## 8. Practical Examples

### Hardened Web Server Service

```ini
# /etc/systemd/system/webapp.service
[Unit]
Description=Secure Web Application
After=network.target
Requires=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
ExecStart=/var/www/app/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
Restart=on-failure
RestartSec=5
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
CapabilityBoundingSet=
SystemCallFilter=@system-service

[Install]
WantedBy=multi-user.target
```

### Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backup"
SOURCE="/var/www"
DATE=$(date +%F-%H%M)
tar -czf "$BACKUP_DIR/full-$DATE.tar.gz" "$SOURCE"
find "$BACKUP_DIR" -name "full-*.tar.gz" -mtime +30 -delete
echo "$(date): Backup completed" >> /var/log/backup.log
```

### SSH Brute Force Monitor

```bash
#!/bin/bash
journalctl -u sshd --since "1 hour ago" | grep "Failed password" | \
  awk '{print $11}' | sort | uniq -c | sort -rn | \
  while read count ip; do
    [ "$count" -gt 10 ] && echo "$ip" >> /etc/hosts.deny
  done
```

## 9. Automation Patterns

### Cron Syntax

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7)
│ │ │ │ │
* * * * * command

0 2 * * * /usr/local/bin/backup.sh       # Daily at 2 AM
*/5 * * * * /usr/local/bin/check.sh      # Every 5 minutes
0 0 * * 0 /usr/local/bin/weekly.sh       # Weekly on Sunday
```

### Systemd Timer vs Cron

| Feature | Cron | Systemd Timers |
|---------|------|----------------|
| Dependency mgmt | No | Yes |
| Resource control | No | Yes |
| Missed runs | No | Yes (Persistent=true) |
| Logging | Manual | journalctl |

## 10. Incident Response Commands

```bash
systemctl list-units --type=service --state=running > /tmp/services.txt
ps auxf > /tmp/processes.txt
ss -tlnp > /tmp/listeners.txt
last -a > /tmp/logins.txt
lastb -a > /tmp/failed_logins.txt
journalctl --no-pager > /tmp/journal.txt
crontab -l > /tmp/crontab.txt
find /etc/systemd/system -type f > /tmp/systemd_units.txt
```

## 11. Interview Questions

1. What is the difference between `systemctl restart` and `systemctl reload`?
2. How would you diagnose why a systemd service fails to start?
3. What happens when you `mask` a service vs `disable` it?
4. How does journald differ from rsyslog?
5. Explain the difference between `userdel` and `userdel -r`.
6. How would you detect a rogue systemd service on a production server?
7. What is the purpose of `ProtectSystem=strict` in a unit file?
8. How do you verify package integrity across different distributions?
9. What is the difference between an incremental and differential backup?
10. How would you implement log rotation for a custom application?
11. Explain the CAP capabilities system and why `CapabilityBoundingSet=` is useful.
12. What security implications does `/proc` with `hidepid=2` provide?

## 12. Hands-On Lab

### Service Hardening and Monitoring

```bash
# 1. Create service user
sudo useradd -r -s /usr/sbin/nologin webapp

# 2. Create application
mkdir -p /opt/webapp
cat > /opt/webapp/app.py << 'EOF'
from http.server import HTTPServer, SimpleHTTPRequestHandler
class Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
HTTPServer(('127.0.0.1', 8080), Handler).serve_forever()
EOF
chown -R webapp:webapp /opt/webapp

# 3. Create hardened unit file
cat > /etc/systemd/system/webapp.service << 'EOF'
[Unit]
Description=Web Application
After=network.target
[Service]
Type=simple
User=webapp
Group=webapp
WorkingDirectory=/opt/webapp
ExecStart=/usr/bin/python3 /opt/webapp/app.py
Restart=on-failure
RestartSec=5
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
CapabilityBoundingSet=
SystemCallFilter=@system-service
[Install]
WantedBy=multi-user.target
EOF

# 4. Start and verify
systemctl daemon-reload
systemctl enable --now webapp
systemctl status webapp
journalctl -u webapp -f

# 5. Verify security
systemd-analyze security webapp.service
```

Expected: `Overall exposure level: 1.7 OK`

## 13. Flowchart

```
                    ┌─────────────────┐
                    │  System Boot     │
                    └────────┬────────┘
                             v
                    ┌─────────────────┐
                    │  systemd init    │
                    └────────┬────────┘
                             v
                    ┌─────────────────┐
                    │  Parse target    │
                    └────────┬────────┘
                             v
                    ┌─────────────────┐
                    │  Start services  │
                    │  (dependency)    │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              v              v              v
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │  Network     │ │  Database   │ │  Web Server  │
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
            └───────────────┼───────────────┘
                            v
                   ┌─────────────────┐
                   │  System Ready    │
                   └─────────────────┘
```

## 14. Key Commands Summary

| Task | Command |
|------|---------|
| List running services | `systemctl list-units --type=service` |
| Check service status | `systemctl status servicename` |
| Enable at boot | `systemctl enable servicename` |
| View journal logs | `journalctl -u servicename` |
| Check port listeners | `ss -tlnp` |
| Verify package integrity | `debsums --changed` or `rpm -Va` |
| Find modified files | `find /etc -mtime -1` |
| Check login history | `last -a` and `lastb -a` |
| List user groups | `groups username` and `id username` |

## 15. Summary

System administration is the foundation of Linux security and reliability. Mastering service management, package integrity, user controls, and log analysis provides the operational security posture required in modern environments. Every misconfigured service, unpatched package, or missing log entry represents a potential attack vector.

## References

- **Books**: UNIX and Linux System Administration Handbook (Evi Nemeth)
- **Documentation**: systemd.io, man systemd.unit(5)
- **Standards**: CIS Benchmarks for Linux Distributions
- **RFCs**: RFC 3164 (Syslog), RFC 5424 (Syslog Protocol)
- **Labs**: OverTheWire: Bandit, Linux Survival

## Related Topics

- [Command Line](./Command-Line.md)
- [File System](./File-System.md)
- [Linux Fundamentals](./Linux-Fundamentals.md)
