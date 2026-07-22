# Command Line

## Layer Position

```
┌─────────────────────────────────────────────────────────┐
│                    User Applications                     │
├─────────────────────────────────────────────────────────┤
│                    Shell (bash/zsh)                      │
├─────────────────────────────────────────────────────────┤
│                  Terminal Emulator                       │
├─────────────────────────────────────────────────────────┤
│                   TTY/PTY Layer                          │
├─────────────────────────────────────────────────────────┤
│                  Linux Kernel                            │
└─────────────────────────────────────────────────────────┘
```

The command line sits between the user and the kernel, providing a text-based interface to the operating system.

## 1. Topic Overview

The command line interface (CLI) is a text-based method for interacting with a computer system. In Linux, the command line consists of three main components:

1. **Terminal Emulator**: The program that displays the interface
2. **Shell**: The program that interprets and executes commands
3. **Kernel**: The core of the OS that processes system calls

### Key Characteristics

- **Text-based**: All interaction happens through text input/output
- **Scriptable**: Commands can be automated through scripts
- **Remote-capable**: Can be accessed over networks via SSH
- **Resource-efficient**: Minimal system resource usage
- **Powerful**: Direct access to system functions and utilities

## 2. Why It Exists

### Historical Context

The CLI predates GUIs and originated from teletype machines. When Unix was developed in the 1970s, the command line was the primary interface.

### Practical Reasons

1. **Efficiency**: Faster for experienced users than GUI navigation
2. **Automation**: Commands can be chained and scripted
3. **Remote Access**: Works over low-bandwidth connections
4. **Server Management**: Most servers run headless (no GUI)
5. **Security Tools**: Most security utilities are CLI-based
6. **Precision**: Exact control over system operations

### Security Relevance

- Penetration testing tools are primarily CLI-based
- Log analysis requires command-line text processing
- Forensic investigations use CLI utilities
- Incident response relies on command-line diagnostics
- Scripting enables automated security monitoring

## 3. Internal Architecture

### 3.1 Terminal Emulators

#### Physical Terminals

- **tty1-tty6**: Virtual consoles accessible via Ctrl+Alt+F1-F6
- Direct kernel interface, no network overhead
- Useful when GUI becomes unresponsive

#### Software Terminal Emulators

| Emulator | Desktop | Features |
|----------|---------|----------|
| xterm | X11 | Lightweight, classic |
| GNOME Terminal | GNOME | Tab support, profiles |
| Konsole | KDE | Split views, bookmarks |
| Alacritty | Cross-platform | GPU-accelerated |
| Kitty | Cross-platform | Image rendering |

#### Pseudo-terminals (PTY)

- Created when opening terminal emulators or SSH sessions
- `who` command shows active PTY sessions

### 3.2 Shell Types

#### Major Shell Variants

```bash
cat /etc/shells      # List available shells
echo $SHELL          # Check current shell
```

| Shell | Path | Features |
|-------|------|----------|
| bash | /bin/bash | Default on most Linux, POSIX-compliant |
| zsh | /usr/bin/zsh | Auto-completion, themes, plugins |
| sh | /bin/sh | Minimal POSIX shell |
| fish | /usr/bin/fish | User-friendly, syntax highlighting |
| dash | /bin/dash | Fast, used for scripts |

#### Shell Initialization Files

**Login Shell** (executed once on login):
```
/etc/profile
~/.bash_profile (or ~/.profile)
```

**Interactive Non-Login Shell** (each new terminal):
```
/etc/bash.bashrc
~/.bashrc
```

**Shell Initialization Diagram:**

```
┌─────────────────────────────────────────────────────────┐
│                    Login Shell                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │/etc/profile │→ │~/.profile   │→ │~/.bashrc    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Non-Login Shell                            │
│  ┌──────────────┐  ┌─────────────┐                      │
│  │/etc/bashrc   │→ │~/.bashrc    │                      │
│  └──────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

#### Environment Variables

```bash
env                     # View all environment variables
export MY_VAR="value"   # Set (temporary)
export PATH="/custom/path:$PATH"

echo 'export MY_VAR="value"' >> ~/.bashrc  # Persistent
source ~/.bashrc

echo $PATH               # Executable search path
echo $HOME               # Home directory
echo $USER               # Current username
```

### 3.3 Shell Internals

#### Command Parsing Flow

```
┌─────────────┐
│ User Input  │ "ls -la"
└──────┬──────┘
       ▼
┌─────────────┐
│   Lexer     │ Tokenize input
└──────┬──────┘
       ▼
┌─────────────┐
│   Parser    │ Build command structure
└──────┬──────┘
       ▼
┌─────────────┐
│  Expansion  │ Variables, wildcards
└──────┬──────┘
       ▼
┌─────────────┐
│ Redirection │ Handle I/O
└──────┬──────┘
       ▼
┌─────────────┐
│  Execution  │ Builtins or exec()
└─────────────┘
```

#### PATH Resolution

```
Command → Builtin? → Alias? → Function? → Search PATH → Execute
```

```bash
echo $PATH | tr ':' '\n'
which ls / type ls / command -v ls
export PATH="/opt/security-tools:$PATH"
```

#### Shell Builtins vs External Commands

```bash
type cd        # Shell builtin
type ls        # /bin/ls

# Builtins: cd, echo, export, source, alias, set, unset, exec
```

#### Aliases and Functions

```bash
alias ll='ls -la'
unalias ll
echo "alias ll='ls -la'" >> ~/.bashrc

mkcd() {
    mkdir -p "$1" && cd "$1"
}
```

### 3.4 Command Anatomy

```
command  [options/flags]  [arguments]
   │          │              │
  grep      -i -n       "pattern" file.txt
```

#### Redirection

```bash
command > file.txt      # Overwrite
command >> file.txt     # Append
command 2> errors.txt   # Redirect stderr
command > out.txt 2>&1  # Both stdout and stderr
command < input.txt     # Read from file
command << EOF          # Here document
line 1
line 2
EOF
```

#### Pipe Chain Diagram

```
command1 | command2 | command3
   │          │          │
  stdout → stdin → stdout → result

Example: cat access.log | grep "404" | awk '{print $1}' | sort
```

#### Command Substitution

```bash
echo "Today is $(date)"
files=$(ls -la)
diff <(ls dir1) <(ls dir2)
```

### 3.5 Process Control from CLI

#### Jobs, Background, Foreground

```bash
long_process &
jobs -l
fg %1 / bg %1
disown %1
```

#### Signals

```bash
kill -l

# SIGHUP (1) - hangup, SIGINT (2) - interrupt, SIGKILL (9) - force kill, SIGTERM (15) - graceful

kill PID / kill -9 PID
killall process_name
pkill -f "pattern"

trap 'echo "Caught"; exit 1' SIGINT SIGTERM
```

#### Process Persistence

```bash
nohup long_command &

screen -S name / screen -ls / screen -r name
tmux new -s name / tmux ls / tmux attach -t name
```

## 4. Essential Navigation Commands

```bash
pwd / cd ~ / cd - / cd ..
ls -la / ls -lh / ls -ltr
find / -name "*.conf" 2>/dev/null
find / -perm -4000 2>/dev/null
find . -type f -mtime -7
locate passwd
cp source dest / cp -r dir1 dir2
mv old new / rm file / rm -rf dir
mkdir -p path / touch file / stat file / file file
```

## 5. Text Processing Commands

### grep

```bash
grep "pattern" file / grep -i "pattern" file
grep -r "pattern" dir / grep -n "pattern" file
grep -v "pattern" file / grep -c "pattern" file
grep "Failed password" /var/log/auth.log
```

### find

```bash
find /path -name "file" / find /path -user root
find /path -perm 777 / find /path -size +100M
find / -perm -4000 -type f 2>/dev/null
```

### awk

```bash
awk '{print $1}' file / awk -F: '{print $1}' /etc/passwd
awk 'NR==5' file / awk '{sum+=$1} END {print sum}' file
awk -F: '$3==0 {print}' /etc/passwd
```

### sed

```bash
sed 's/old/new/' file / sed 's/old/new/g' file
sed -i 's/old/new/g' file / sed -n '5,10p' file
sed '/pattern/d' file
```

### sort, uniq, cut, tr

```bash
sort file / sort -n file
sort file | uniq / sort file | uniq -c
cut -d: -f1 /etc/passwd / cut -c1-10 file
echo "hello" | tr 'a-z' 'A-Z'
```

## 6. Network Commands

```bash
ip addr show / ip route show
netstat -tulnp / ss -tulnp
nslookup domain.com / dig domain.com
ping -c 4 target / traceroute target
nc -zv host port / curl -I https://website
nmap -sV target / nmap -sS target
tcpdump -i eth0 / tcpdump -i eth0 port 80
```

## 7. Process and System Commands

```bash
ps aux / ps aux | grep process
top / htop
kill PID / kill -9 PID / pkill / pgrep
lsof -p PID / lsof -i :80
strace command
uname -a / hostname / uptime / free -h / df -h
dmesg / journalctl -xe / last / who
```

## 8. Permission Commands

```bash
chmod 755 file / chmod u+x script
chown user:group file / chown -R user:group dir
ls -la / getfacl file / stat file
chmod u+s file / chmod g+s file / chmod +t dir
```

## 9. Security: Threats and Attacks

### Command Injection

```bash
# Vulnerable
eval "cat $user_input"

# Defense
user_input=$(echo "$user_input" | grep -E '^[a-zA-Z0-9._-]+$')
command "${args[@]}"
```

### PATH Hijacking

```bash
# Attack
export PATH="/tmp:$PATH"  # /tmp/ls runs instead of /bin/ls

# Defense
which command / type command
# Use full paths: /usr/bin/ls
```

### Shell Escape

```bash
!sh / Ctrl+Z; fg / alias
```

### SUID/SGID Abuse

```bash
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
getcap -r / 2>/dev/null
```

## 10. Security: Hardening Techniques

### SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
systemctl restart sshd
```

### Bash Security

```bash
PATH="/usr/local/bin:/usr/bin:/bin"
/bin/grep "pattern" /etc/passwd
ulimit -c 0
IFS=$' \t\n'
unset PASSWORD API_KEY
```

### Audit and Logging

```bash
auditctl -w /etc/passwd -p wa -k passwd_changes
export HISTTIMEFORMAT="%Y-%m-%d %H:%M:%S "
script session.log
```

## 11. Security: Log Analysis

```bash
grep "Failed password" /var/log/auth.log
grep "Accepted" /var/log/auth.log
journalctl -u sshd / journalctl --since "1 hour ago"
dmesg | grep -i error
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head

grep "Failed password" /var/log/auth.log | \
  awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -20
```

## 12. Essential Security Commands Reference

| Command | Purpose | Example |
|---------|---------|---------|
| grep | Pattern search | `grep "error" log` |
| find | File search | `find / -name "*.conf"` |
| awk | Text processing | `awk '{print $1}' file` |
| sed | Stream editing | `sed 's/old/new/g' file` |
| sort | Sort lines | `sort file` |
| uniq | Deduplicate | `sort file \| uniq -c` |
| cut | Extract columns | `cut -d: -f1 file` |
| wc | Count lines | `wc -l file` |
| tail | Last lines | `tail -f /var/log/syslog` |
| curl | HTTP requests | `curl -I https://site` |
| nc | Network utility | `nc -zv host port` |
| nmap | Port scanner | `nmap -sV target` |
| tcpdump | Packet capture | `tcpdump -i eth0` |

## 13. Advanced Redirection and Pipes

```bash
command 2> errors.txt
command > output.txt 2>&1
command &> output.txt
command 2>&1 | grep "error"
command > /dev/null 2>&1
command <<< "input"
find . -name "*.log" -print0 | xargs -0 grep "error"
find . -name "*.gz" | xargs -P 4 -I {} gunzip {}
command | tee output.txt
diff <(ssh server1 ls) <(ssh server2 ls)
```

## 14. Scripting Essentials

```bash
#!/bin/bash
set -euo pipefail
NAME="value"

if [ "$VAR" = "value" ]; then echo "Match"; fi

for file in *.log; do echo "Processing $file"; done
for i in {1..10}; do echo "Number $i"; done
while read -r line; do echo "Line: $line"; done < file.txt

function_name() {
    local var="local_scope"
    echo "$1"
    return 0
}
```

## 15. Hands-On Lab: Security Investigation

```bash
# Step 1: Unauthorized logins
last -20
grep "Accepted" /var/log/auth.log | tail -20

# Step 2: Suspicious processes
ps aux | grep -E "(nc|ncat|netcat|socat)"
top -bn1 | head -20

# Step 3: Network connections
ss -tulnp
lsof -i -P -n | grep ESTABLISHED

# Step 4: Modified files
find /etc -mtime -1 -type f

# Step 5: SUID/SGID
find / -perm -4000 -type f 2>/dev/null

# Step 6: Cron jobs
crontab -l
cat /etc/crontab

# Step 7: User accounts
grep ":0:" /etc/passwd
awk -F: '$3 >= 1000 {print $1}' /etc/passwd

# Step 8: Logs
journalctl --since "24 hours ago" | grep -i "fail\|error"

# Step 9: Forensic image
dd if=/dev/sda of=/backup/disk_image.dd bs=4M status=progress
```

## 16. Common Interview Questions

### Basic

1. **`>` vs `>>`?** Overwrite vs append.
2. **Find a file?** `find` for attributes, `locate` for names.
3. **`chmod 755`?** Owner: rwx, Group: r-x, Others: r-x.
4. **Check open port?** `nc -zv host port`, `nmap -p port host`.
5. **`/dev/null`?** Discards all data written.

### Intermediate

6. **`kill` vs `kill -9`?** SIGTERM (graceful) vs SIGKILL (forced).
7. **Zombie process?** Completed process with process table entry.
8. **Redirect stderr?** `command 2>&1` or `command &>`.
9. **Sticky bit?** Only file owner can delete files in directory.
10. **Process using port?** `lsof -i :port` or `ss -tulnp | grep port`.

### Advanced

11. **Shell escape?** Program allows arbitrary commands. Prevent with input validation, restricted shells.
12. **PATH hijacking?** Malicious executable earlier in PATH. Prevent with absolute paths.
13. **Command injection?** Unsanitized input executed. Prevent with validation, avoid `eval`.
14. **SUID risks?** Binaries run with owner privileges; exploitable for privilege escalation.
15. **`source` vs execute?** Current shell vs subprocess.

## 17. Command Line Tips and Tricks

```bash
# History
!! / !$ / Ctrl+R

# Keyboard shortcuts
Ctrl+A/E (begin/end), Ctrl+W/U/K (delete), Ctrl+L (clear), Ctrl+C/Z (cancel/suspend)

# Aliases
alias update='sudo apt update && sudo apt upgrade'
alias ports='netstat -tulnp'

# Debugging
bash -x script.sh
strace -f command
md5sum file / sha256sum file
```

## 18. Security Monitoring Scripts

### Failed Login Monitor

```bash
#!/bin/bash
grep "Failed password" /var/log/auth.log | \
  awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | \
  while read count ip; do
    [ "$count" -gt 5 ] && echo "ALERT: $ip failed $count times"
  done
```

### File Integrity Checker

```bash
#!/bin/bash
for file in /etc/passwd /etc/shadow /etc/sudoers; do
    [ -f "$file" ] || continue
    current=$(md5sum "$file" | awk '{print $1}')
    saved=$(grep "$file" /var/secure/checksums.md5 2>/dev/null | awk '{print $1}')
    [ "$current" != "$saved" ] && echo "WARNING: $file modified!"
done
```

## 19. Quick Reference Card

```
cp src dest    mv old new    rm file    mkdir -p dir
ls -la         find . -name  locate     stat file

grep "pat" file    sed 's/a/b/g' file    awk '{print $1}' file
sort file          uniq -c                cut -d: -f1 file
wc -l file         head/tail -n 10 file   cat file

ps aux        top/htop      kill PID     pkill name
bg/fg/jobs    nohup cmd &   disown %1

ip addr       ss -tulnp     ping host    curl URL
nc -zv port   nmap target   dig domain

chmod 755 file    chown user file    getfacl file
```

## 20. Best Practices

### Security

1. Never use `eval` with untrusted input
2. Always quote variables
3. Use full paths in scripts
4. Validate user input
5. Use `set -euo pipefail`
6. Avoid storing passwords
7. Use SSH keys
8. Limit SUID/SGID
9. Audit logs regularly
10. Keep systems updated

### Scripting

1. Add shebang line
2. Use meaningful variable names
3. Comment your code
4. Handle errors gracefully
5. Use `local` in functions
6. Quote all variables
7. Use `[[ ]]` instead of `[ ]`
8. Test in safe environment
9. Use shellcheck
10. Document usage

## 21. Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Unquoted variables | Word splitting | Always quote: `"$var"` |
| `cd` in scripts | Silent failure | Use `cd || exit 1` |
| Missing shebang | Wrong interpreter | Add `#!/bin/bash` |
| Using `ls` in scripts | Parsing issues | Use globs |
| `rm -rf /` | Catastrophic | Double-check paths |
| Storing passwords | Security risk | Use env vars/vaults |
| No return code check | Silent failures | Use `set -e` |
| Global variables | Conflicts | Use `local` |

## 22. Summary

### Key Takeaways

1. The command line is essential for Linux security operations
2. Understanding shell internals helps identify vulnerabilities
3. Text processing tools are powerful for log analysis
4. Network commands are crucial for security monitoring
5. Proper scripting practices prevent security issues
6. Regular auditing and monitoring are essential

### Next Steps

1. Practice commands in a safe environment
2. Write scripts to automate tasks
3. Learn advanced text processing (awk, sed)
4. Study network security tools
5. Explore forensics and incident response tools

## 23. Practice Exercises

### Exercise 1: Log Analysis
Analyze `/var/log/auth.log` to find:
- All failed login attempts
- The IP with most failures
- Time range of attacks

### Exercise 2: System Hardening
Create a script that:
- Checks for SUID/SGID files
- Verifies file permissions
- Logs suspicious activity

### Exercise 3: Network Investigation
Investigate network connections:
- List all established connections
- Identify processes using network
- Check for unusual listening ports

## 24. Resources

### Books
- *The Linux Command Line* by William Shotts
- *Linux Pocket Guide* by Daniel Barrett
- *Bash Cookbook* by Carl Albing

### Online Resources
- [Linux Command Library](https://linuxcommand.org)
- [Explainshell](https://explainshell.com)
- [Commandlinefu](https://commandlinefu.com)

### Practice Platforms
- OverTheWire (Bandit)
- picoCTF
- HackTheBox

---

**Last Updated**: July 2026
**Version**: 1.0
**Author**: Security Documentation Team