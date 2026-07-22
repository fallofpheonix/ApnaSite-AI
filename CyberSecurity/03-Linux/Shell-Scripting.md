# Shell Scripting

## Layer Position

```
┌─────────────────────────────────────────────────┐
│              Applications                        │
├─────────────────────────────────────────────────┤
│              Shell Scripts (Bash)   ◄── YOU      │
├─────────────────────────────────────────────────┤
│              Shell (Bash/Zsh)                   │
├─────────────────────────────────────────────────┤
│              System Calls (fork, exec, read)     │
├─────────────────────────────────────────────────┤
│              Linux Kernel                       │
├─────────────────────────────────────────────────┤
│              Hardware                           │
└─────────────────────────────────────────────────┘
```

Shell scripting operates at the user-space layer between interactive shell use and compiled programs. Scripts interpret commands sequentially, calling system calls under the hood to manipulate files, processes, and network resources.

---

## 1. Topic Overview

Shell scripting is the practice of writing executable text files containing sequences of shell commands, variables, control structures, and functions. Bash (Bourne Again Shell) is the default shell on most Linux distributions and macOS (until Catalina). Scripts enable automation of repetitive tasks, orchestration of system administration workflows, and rapid development of security tools.

A shell script is interpreted line-by-line by the shell. Each line is parsed into tokens, expanded (variables, globs, arithmetic), and then executed either as a built-in command or by forking an external program.

---

## 2. Why It Exists

- **Automation**: Eliminate repetitive manual tasks (user provisioning, log rotation, backups)
- **Rapid tooling**: Build custom security scanners, log parsers, and exploit scripts faster than compiling C
- **System administration**: User management, cron jobs, service control, package management
- **Incident response**: Triage compromised systems by collecting logs, processes, network connections, and file hashes in seconds
- **Pentesting**: Reconnaissance, port scanning, brute-force scripting, privilege escalation checks
- **Glue code**: Connect disparate tools (nmap, curl, openssl, sqlite) into pipelines

---

## 3. Internal Architecture

### 3.1 Bash Internals

**How Bash Executes Commands**

```
User Input → Parser → Expander → Executor
                 │          │          │
                 │          │          └─ fork/exec built-in or external
                 │          └─ variable expansion, globbing, word splitting
                 └─ tokenize, parse into command list
```

Execution flow:
1. **Read**: Bash reads a line from stdin or the script file
2. **Parse**: Tokenizes into words, identifies operators (`|`, `&&`, `;`)
3. **Expand**: Performs parameter expansion, command substitution, arithmetic expansion, globbing
4. **Execute**: Built-ins run in the current shell; external commands fork a child process via `execve()`

**Subshells and Child Processes**

```
┌──────────────────────────────────┐
│ Parent Shell (PID 1000)         │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Subshell (PID 1001)       │  │
│  │  $(command)               │  │
│  │  (command1; command2)     │  │
│  │  pipe: cmd1 | cmd2        │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Child Process (PID 1002)  │  │
│  │  exec /usr/bin/nmap       │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

Subshells inherit variables but changes do not propagate back. Subshell creation: `$(...)`, `(...)`, pipes (each segment), background `&`.

**File Descriptors**

```
FD 0  stdin   ──► keyboard / file input
FD 1  stdout  ──► terminal / file output
FD 2  stderr  ──► terminal / error output
FD 3+ custom  ──► arbitrary (used in scripts)
```

Redirections:
- `>` stdout to file (truncate)
- `>>` stdout to file (append)
- `2>` stderr to file
- `&>` both stdout and stderr
- `2>&1` merge stderr into stdout
- `</dev/null` suppress input

**Exit Codes**

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of shell builtins |
| 126 | Command not executable |
| 127 | Command not found |
| 128+N | Killed by signal N |
| 130 | Ctrl+C (SIGINT) |
| 143 | SIGTERM |

Check with `$?` immediately after command execution.

### 3.2 Variables

**Environment vs Local Variables**

```bash
# Local variable (only current shell)
MY_VAR="secret"

# Environment variable (exported to children)
export PATH="/usr/local/bin:$PATH"

# See all exported variables
env
printenv
```

Inherited by child processes. Exported variables survive into subshells.

**Variable Expansion**

```bash
${var}          # Direct expansion
${var:-default} # Use default if unset
${var:=default} # Assign default if unset
${var:+alt}     # Use alt if var is set
${var:?error}   # Error if unset
${#var}         # Length of string
${var%pattern}  # Remove shortest suffix
${var%%pattern} # Remove longest suffix
${var#pattern}  # Remove shortest prefix
${var##pattern} # Remove longest prefix
${var/old/new}  # Replace first occurrence
${var//old/new} # Replace all occurrences
```

**Arithmetic Expansion**

```bash
$(( expression ))
# Examples:
echo $(( 5 + 3 ))      # 8
echo $(( 2 ** 10 ))    # 1024
```

**Special Variables**

| Variable | Meaning |
|----------|---------|
| `$0` | Script name |
| `$1`..`$9` | Positional arguments |
| `${10}` | Positional args beyond 9 |
| `$#` | Number of arguments |
| `$@` | All arguments (individual) |
| `$*` | All arguments (single word) |
| `$?` | Exit status of last command |
| `$$` | Current shell PID |
| `$!` | PID of last background command |
| `$-` | Current shell options |

**Arrays**

```bash
# Indexed array
declare -a FRUITS=("apple" "banana" "cherry")
echo ${FRUITS[0]}      # apple
echo ${FRUITS[@]}      # all elements
echo ${#FRUITS[@]}     # length

# Associative array
declare -A MAP
MAP[name]="value"
echo ${MAP[name]}
```

### 3.3 Control Structures

**if/elif/else**

```bash
if [[ condition ]]; then
    # true branch
elif [[ condition ]]; then
    # elif branch
else
    # false branch
fi

# Test operators:
# String: -z (empty), -n (non-empty), ==, !=
# File: -f (regular), -d (dir), -r (readable), -w (writable), -x (executable), -s (non-empty)
# Numeric: -eq, -ne, -lt, -le, -gt, -ge
```

**Loops**

```bash
# for loop
for i in {1..10}; do echo $i; done
for file in /var/log/*.log; do ...; done
for (( i=0; i<10; i++ )); do ...; done

# while loop
while read -r line; do
    echo "$line"
done < file.txt

# until loop
until ping -c1 target &>/dev/null; do
    sleep 1
done
```

**case Statements**

```bash
case "$1" in
    start)  start_service ;;
    stop)   stop_service ;;
    restart) stop_service; start_service ;;
    *)      echo "Usage: $0 {start|stop|restart}" ;;
esac
```

**Functions**

```bash
# Define
function check_port {
    local host=$1
    local port=$2
    nc -z -w2 "$host" "$port" 2>/dev/null
    return $?  # 0 = open, 1 = closed
}

# Call and check
if check_port 192.168.1.1 22; then
    echo "SSH open"
fi
```

### 3.4 Text Processing

**grep** - Global Regular Expression Print

```bash
grep -r "password" /etc/        # recursive search
grep -i "error" logfile         # case-insensitive
grep -c "failed" auth.log       # count matches
grep -E "regex|pattern" file    # extended regex
grep -A3 -B3 "panic" syslog     # context lines
```

**sed** - Stream Editor

```bash
sed 's/old/new/' file           # first occurrence per line
sed 's/old/new/g' file          # all occurrences
sed -i 's/old/new/g' file       # in-place edit
sed -n '10,20p' file            # print lines 10-20
sed '/pattern/d' file           # delete matching lines
```

**awk** - Pattern Scanning and Processing

```bash
awk '{print $1, $3}' file       # print columns 1 and 3
awk -F: '{print $1, $3}' /etc/passwd  # custom delimiter
awk '/error/ {count++} END {print count}' logfile
awk '$3 > 1024 {print $0}' data.txt
```

**Pipes and Redirection**

```bash
# Pipe chains
cat access.log | grep "404" | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Redirect multiple destinations
command > output.txt 2>&1 | tee error.log

# Here document
cat <<EOF
This is a heredoc
$USER is logged in
EOF

# Here string
grep "pattern" <<< "$string"
```

### 3.5 Script Security

**Input Validation**

```bash
# Validate IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    fi
    return 1
}

# Validate integer
validate_int() {
    [[ $1 =~ ^[0-9]+$ ]]
}
```

**Quoting Rules**

```bash
# Single quotes: literal (no expansion)
echo '$HOME'        # prints: $HOME

# Double quotes: expansion occurs, word splitting prevented
echo "$HOME"        # prints: /root

# No quotes: word splitting and globbing occur
echo $HOME          # prints: /root (but dangerous with spaces)
echo $1             # breaks if argument has spaces
```

**Race Conditions and Temporary Files**

```bash
# INSECURE: predictable filename
tempfile="/tmp/myapp.pid"
echo $$ > $tempfile    # attacker can predict and symlink

# SECURE: use mktemp
tempfile=$(mktemp /tmp/myapp.XXXXXX)
trap 'rm -f "$tempfile"' EXIT
echo $$ > "$tempfile"
```

**Command Injection Risks**

```bash
# DANGEROUS: user input in command
input=$USER_INPUT
eval "$input"           # arbitrary command execution!

# DANGEROUS: unquoted variable
file=$USER_INPUT
cat $file               # glob expansion, word splitting

# SAFE: quoted, validated input
[[ "$input" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 1
cat "$file"
```

**eval Dangers**

```bash
# eval executes its argument as shell code
# Any input to eval can run arbitrary commands
data='$(rm -rf /)'
eval "$data"            # CATASTROPHIC if $data is untrusted

# Instead, use indirect references carefully
varname="MY_VAR"
echo "${!varname}"      # safer indirect expansion
```

---

## 4. Security Automation Scripts

### 4.1 Log Analyzer

```bash
#!/bin/bash
LOG="/var/log/auth.log"
THRESHOLD=5

echo "=== Failed Login Attempts ==="
grep "Failed password" "$LOG" | \
    awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | \
    while read count ip; do
        if [[ $count -ge $THRESHOLD ]]; then
            echo "[ALERT] $ip: $count failed attempts"
        fi
    done

echo ""
echo "=== Successful Logins After Failures ==="
last -i | head -20
```

### 4.2 Port Scanner

```bash
#!/bin/bash
HOST=$1
PORTS=${2:-"22 80 443 8080 8443"}

if [[ -z "$HOST" ]]; then
    echo "Usage: $0 <host> [ports]"
    exit 1
fi

for port in $PORTS; do
    (echo >/dev/tcp/$HOST/$port) 2>/dev/null && \
        echo "[OPEN]  $port" || \
        echo "[CLOSED] $port"
done
```

### 4.3 User Auditor

```bash
#!/bin/bash
echo "=== UID 0 Accounts ==="
awk -F: '$3 == 0 {print $1}' /etc/passwd

echo ""
echo "=== Accounts with No Password ==="
awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow

echo ""
echo "=== Sudoers ==="
grep -v "^#" /etc/sudoers 2>/dev/null | grep -v "^$"

echo ""
echo "=== Users with Login Shells ==="
grep -v '/nologin\|/false\|/sync\|/halt\|/shutdown' /etc/passwd | awk -F: '{print $1, $7}'

echo ""
echo "=== Recent Logins ==="
last -n 10
```

### 4.4 File Integrity Checker

```bash
#!/bin/bash
BASELINE="/var/lib/checksums.baseline"
CHECK="/etc/passwd /etc/shadow /etc/sudoers"

if [[ ! -f "$BASELINE" ]]; then
    echo "Creating baseline..."
    sha256sum $CHECK > "$BASELINE"
    exit 0
fi

echo "=== Integrity Check ==="
sha256sum -c "$BASELINE" 2>/dev/null | while read result; do
    if echo "$result" | grep -q "FAILED"; then
        echo "[TAMPERED] $result"
    fi
done
```

---

## 5. Common Patterns

### 5.1 Argument Parsing

```bash
#!/bin/bash
while getopts "u:p:t:h" opt; do
    case $opt in
        u) USER=$OPTARG ;;
        p) PASS=$OPTARG ;;
        t) TARGET=$OPTARG ;;
        h) echo "Usage: $0 -u user -p pass -t target"; exit 0 ;;
        *) echo "Invalid option"; exit 1 ;;
    esac
done

[[ -z "$USER" || -z "$PASS" || -z "$TARGET" ]] && {
    echo "Missing required arguments"
    exit 1
}
```

### 5.2 Trap and Cleanup

```bash
#!/bin/bash
cleanup() {
    echo "Cleaning up..."
    rm -f "$TEMP_FILE"
    kill $BACKGROUND_PID 2>/dev/null
}
trap cleanup EXIT INT TERM

TEMP_FILE=$(mktemp)
```

### 5.3 Parallel Execution

```bash
#!/bin/bash
pids=()
for host in $(cat hosts.txt); do
    ssh "$host" "uptime" &
    pids+=($!)
done

for pid in "${pids[@]}"; do
    wait "$pid"
done
echo "All tasks complete"
```

---

## 6. Scripting Best Practices

| Practice | Why |
|----------|-----|
| Always use `#!/bin/bash` | Explicit shell, avoids POSIX sh differences |
| Quote variables `"$var"` | Prevents word splitting and globbing |
| Use `set -euo pipefail` | Exit on error, unset vars, pipe failures |
| Use `mktemp` for temp files | Prevents race conditions |
| Validate all input | Prevents injection attacks |
| Use `local` in functions | Scope variables properly |
| Comment non-obvious logic | Maintainability |
| Check exit codes | Detect failures early |

### 6.1 Strict Mode Template

```bash
#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Your script here
```

- `-e`: Exit on any command failure
- `-u`: Treat unset variables as errors
- `-o pipefail`: Pipeline returns exit code of last failed command
- `IFS`: Prevents unexpected word splitting

---

## 7. Security Considerations

### 7.1 Privilege Escalation via Scripts

```bash
# SUID scripts are dangerous — kernel ignores SUID on interpreted scripts
# Use sudoers to grant specific commands instead
# NEVER: chmod +s script.sh

# Safe sudoers entry:
# user ALL=(root) NOPASSWD: /usr/bin/systemctl restart apache2
```

### 7.2 Environment Variable Attacks

```bash
# PATH manipulation attack
# If attacker controls PATH, they can inject malicious binaries
# Always use absolute paths in scripts
/usr/bin/cat file.txt
/usr/bin/grep pattern file.txt

# LD_PRELOAD injection
# Attacker sets LD_PRELOAD=/evil.so to hijack library calls
# Mitigation: unset LD_PRELOAD in scripts
unset LD_PRELOAD
```

### 7.3 Signal Handling

```bash
#!/bin/bash
# Handle signals properly for clean shutdown
trap 'echo "Received SIGINT"; exit 1' INT
trap 'echo "Received SIGTERM"; exit 1' TERM
trap 'echo "Received SIGHUP"; exit 1' HUP

while true; do
    # work here
    sleep 1
done
```

---

## 8. Quick Reference Table

| Task | Command/Pattern |
|------|-----------------|
| Check if file exists | `[[ -f "$file" ]]` |
| Check if dir exists | `[[ -d "$dir" ]]` |
| String comparison | `[[ "$a" == "$b" ]]` |
| Regex match | `[[ "$a" =~ ^pattern$ ]]` |
| Command substitution | `$(command)` |
| Arithmetic | `$(( a + b ))` |
| Array length | `${#arr[@]}` |
| Last exit code | `$?` |
| Current PID | `$$` |
| Background PID | `$!` |
| Read line by line | `while read -r line; do ...; done < file` |

---

## 9. Interview Questions

1. **What is the difference between `$@` and `$*`?**
   - `$@` expands each argument as a separate word; `$*` combines them into one.

2. **Why use `set -euo pipefail`?**
   - Prevents silent failures by exiting on errors, unset variables, and broken pipes.

3. **What happens when you run a bash script with `./script.sh` vs `bash script.sh`?**
   - `./script.sh` may use a different shell if shebang is missing; `bash script.sh` forces bash.

4. **How do you make a script executable?**
   - `chmod +x script.sh`

5. **Explain the difference between `>` and `>>`.**
   - `>` truncates the file; `>>` appends to the file.

6. **What is command substitution? Give an example.**
   - `$(command)` runs a command and substitutes its output: `today=$(date +%Y-%m-%d)`

7. **How do you prevent race conditions with temporary files?**
   - Use `mktemp` to create unpredictable filenames and `trap` to clean up on exit.

8. **What is the purpose of `trap`?**
   - Registers signal handlers to execute code on specific signals (EXIT, INT, TERM, etc.).

9. **How do you read a file line by line in bash?**
   - `while IFS= read -r line; do ...; done < file`

10. **What is the difference between `[ ]` and `[[ ]]`?**
    - `[[ ]]` is bash-specific with better regex support, no word splitting, and safer error handling.

---

## 10. Hands-On Labs

### Lab 1: Build a Basic Recon Script

```bash
#!/bin/bash
set -euo pipefail

TARGET=$1
echo "=== Recon: $TARGET ==="

echo "[*] DNS lookup:"
host "$TARGET" 2>/dev/null || echo "DNS lookup failed"

echo "[*] Open ports (common):"
for port in 21 22 25 53 80 443 8080 8443; do
    (echo >/dev/tcp/"$TARGET"/"$port") 2>/dev/null && echo "  Port $port: OPEN"
done

echo "[*] HTTP headers:"
curl -sI "http://$TARGET" 2>/dev/null | head -5
```

### Lab 2: Log Monitoring Script

```bash
#!/bin/bash
LOG="/var/log/auth.log"
ALERT_FILE="/tmp/alerts.log"

tail -f "$LOG" | while read -r line; do
    if echo "$line" | grep -qi "failed\|invalid\|error"; then
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$timestamp] ALERT: $line" >> "$ALERT_FILE"
        echo "[ALERT] $line"
    fi
done
```

### Lab 3: Automated Backup with Encryption

```bash
#!/bin/bash
set -euo pipefail

SRC="/etc"
DEST="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$DEST/etc_$DATE.tar.gz"
GPG_KEY="backup@example.com"

tar czf "$ARCHIVE" "$SRC"
gpg --encrypt --recipient "$GPG_KEY" "$ARCHIVE"
rm -f "$ARCHIVE"

echo "Backup encrypted: ${ARCHIVE}.gpg"
```

---

## 11. Real-World Scenarios

### Scenario 1: Detect Web Shell

```bash
#!/bin/bash
WEBROOT="/var/www/html"
find "$WEBROOT" -type f -name "*.php" -newer "$WEBROOT/index.php" -ls
find "$WEBROOT" -type f \( -name "*.php" -o -name "*.jsp" \) \
    -exec grep -l "eval\|base64_decode\|shell_exec" {} \;
```

### Scenario 2: Brute-Force Detection

```bash
#!/bin/bash
THRESHOLD=10
LOG="/var/log/auth.log"
INTERVAL=300  # 5 minutes

while true; do
    recent=$(grep "Failed password" "$LOG" | \
        awk -v cutoff="$(date -d "$INTERVAL seconds ago" '+%b %d %H:%M:%S')" \
        '$0 >= cutoff' | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn)

    echo "$recent" | while read count ip; do
        if [[ $count -ge $THRESHOLD ]]; then
            echo "[BLOCK] $ip ($count attempts)"
            iptables -A INPUT -s "$ip" -j DROP
        fi
    done
    sleep "$INTERVAL"
done
```

### Scenario 3: Network Service Discovery

```bash
#!/bin/bash
SUBNET=${1:-"192.168.1"}

echo "=== Scanning $SUBNET.0/24 ==="
for i in $(seq 1 254); do
    host="$SUBNET.$i"
    (ping -c1 -W1 "$host" &>/dev/null && echo "[ALIVE] $host") &
done
wait
echo "=== Scan complete ==="
```

---

## 12. Debugging

```bash
bash -x script.sh         # Print each command before execution
set -x                     # Enable debug mode within script
set +x                     # Disable debug mode
PS4='+${BASH_SOURCE}:${LINENO}: '  # Better debug output
```

---

## 13. Summary

| Concept | Key Takeaway |
|---------|--------------|
| Shebang | `#!/bin/bash` — always specify |
| Variables | Quote `"$var"`, use `local` in functions |
| Conditionals | `[[ ]]` preferred over `[ ]` |
| Loops | `for`, `while`, `until` for iteration |
| Text tools | `grep`, `sed`, `awk` — the holy trinity |
| Security | Validate input, use `mktemp`, avoid `eval` |
| Debugging | `bash -x`, `set -x`, `PS4` |
| Best practice | `set -euo pipefail` in every script |

Shell scripting is the backbone of Linux security automation. Master these patterns and you can build tools for reconnaissance, log analysis, incident response, and system hardening — all without compiling a single line of C.