# Scripting & Automation

## Layer Position

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  ┌───────────────────────────────────────┐  │
│  │   Automation Scripts & Workflows       │  │
│  ├───────────────────────────────────────┤  │
│  │   Task Runners, Schedulers, Parsers    │  │
│  ├───────────────────────────────────────┤  │
│  │   Shell / Python / PowerShell          │  │
│  └───────────────────────────────────────┘  │
│           Operating System Layer            │
│           Network / Hardware Layer          │
└─────────────────────────────────────────────┘
```

## Internal Architecture

```
Automation Ecosystem
│
├── Task Scheduling
│   ├── cron / systemd timers ── Linux scheduling
│   ├── Task Scheduler ──────── Windows scheduling
│   ├── APScheduler ─────────── Python scheduling
│   └── Celery ──────────────── Distributed tasks
│
├── Task Execution
│   ├── subprocess ──────────── Shell command execution
│   ├── Fabric / Invoke ─────── Remote execution
│   ├── Ansible ─────────────── Configuration management
│   └── SaltStack ───────────── Event-driven automation
│
├── Log Processing
│   ├── regex ────────────────── Pattern matching
│   ├── awk / sed ───────────── Stream editing
│   ├── Python pandas ────────── Data analysis
│   └── ELK Stack ───────────── Centralized logging
│
├── Report Generation
│   ├── Jinja2 ──────────────── Template engine
│   ├── matplotlib ───────────── Charts and graphs
│   ├── ReportLab ───────────── PDF generation
│   └── pandas ──────────────── Data formatting
│
└── Configuration Management
    ├── YAML / JSON / TOML ──── Config formats
    ├── dotenv ────────────────── Environment variables
    ├── configparser ──────────── INI file handling
    └── pydantic ──────────────── Validation & types
```

## 1. Task Automation

### Shell Scripting Basics

```bash
#!/bin/bash
# Security audit script

TARGET=${1:-"localhost"}
LOG_FILE="/var/log/security_audit_$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting security audit on $TARGET"

# Check open ports
log "Checking open ports..."
nmap -sV -p- --open "$TARGET" > /tmp/nmap_results.txt 2>&1
if [ $? -eq 0 ]; then
    log "Port scan completed successfully"
else
    log "ERROR: Port scan failed"
fi

# Check for world-readable files
log "Checking for world-readable sensitive files..."
find /etc -perm -004 -type f 2>/dev/null > /tmp/world_readable.txt
WORLD_READABLE_COUNT=$(wc -l < /tmp/world_readable.txt)
log "Found $WORLD_READABLE_COUNT world-readable files in /etc"

# Check for users with empty passwords
log "Checking for empty passwords..."
EMPTY_PW=$(awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow 2>/dev/null | wc -l)
log "Found $EMPTY_PW users with empty/disabled passwords"

log "Audit completed. Results saved to $LOG_FILE"
```

### Python Automation Scripts

```python
#!/usr/bin/env python3
"""Automated security monitoring script."""

import os
import sys
import json
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("/var/log/security_monitor.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class FileIntegrityMonitor:
    """Monitor critical files for unauthorized changes."""

    def __init__(self, baseline_file: str = "/tmp/file_baseline.json"):
        self.baseline_file = Path(baseline_file)
        self.baseline = self._load_baseline()

    def _load_baseline(self) -> dict:
        if self.baseline_file.exists():
            return json.loads(self.baseline_file.read_text())
        return {}

    def _save_baseline(self):
        self.baseline_file.write_text(json.dumps(self.baseline, indent=2))

    def compute_hash(self, filepath: str) -> str:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()

    def create_baseline(self, directories: list):
        for directory in directories:
            for path in Path(directory).rglob("*"):
                if path.is_file():
                    self.baseline[str(path)] = {
                        "hash": self.compute_hash(str(path)),
                        "size": path.stat().st_size,
                        "mtime": path.stat().st_mtime
                    }
        self._save_baseline()
        logger.info(f"Baseline created with {len(self.baseline)} files")

    def check_integrity(self) -> list:
        alerts = []
        for filepath, data in self.baseline.items():
            path = Path(filepath)
            if not path.exists():
                alerts.append({"file": filepath, "alert": "FILE_DELETED"})
                continue
            current_hash = self.compute_hash(filepath)
            if current_hash != data["hash"]:
                alerts.append({
                    "file": filepath,
                    "alert": "HASH_CHANGED",
                    "expected": data["hash"],
                    "actual": current_hash
                })
        return alerts


if __name__ == "__main__":
    monitor = FileIntegrityMonitor()
    critical_dirs = ["/etc", "/usr/bin", "/usr/sbin"]
    monitor.create_baseline(critical_dirs)
    alerts = monitor.check_integrity()
    if alerts:
        for alert in alerts:
            logger.warning(f"ALERT: {alert}")
    else:
        logger.info("All monitored files intact")
```

## 2. Batch Processing

### Parallel File Processing

```python
import os
import hashlib
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import List, Dict

def hash_file(filepath: str) -> Dict:
    """Hash a single file (for parallel processing)."""
    try:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return {
            "file": filepath,
            "hash": h.hexdigest(),
            "size": os.path.getsize(filepath),
            "status": "ok"
        }
    except Exception as e:
        return {"file": filepath, "hash": None, "size": 0, "status": str(e)}

def batch_hash_files(directory: str, max_workers: int = 8) -> List[Dict]:
    """Hash all files in a directory using parallel processing."""
    files = [str(p) for p in Path(directory).rglob("*") if p.is_file()]
    results = []
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(hash_file, f): f for f in files}
        for future in as_completed(futures):
            results.append(future.result())
    return results

def batch_hash_files(directory: str) -> list:
    """Hash all files in directory (single-threaded)."""
    results = []
    for path in Path(directory).rglob("*"):
        if path.is_file():
            results.append(hash_file(str(path)))
    return results

# Usage
if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "/tmp"
    results = batch_hash_files(target)
    print(f"Processed {len(results)} files")
    for r in results:
        if r["status"] == "ok":
            print(f"  {r['file']}: {r['hash'][:16]}...")
```

### Batch Log Processing

```python
import re
import json
from datetime import datetime
from collections import Counter
from pathlib import Path

class LogProcessor:
    """Process and analyze security log files."""

    PATTERNS = {
        "apache": r'(?P<ip>[\d\.]+) - - \[(?P<timestamp>[^\]]+)\] "(?P<method>\w+) (?P<url>[^\s]+) [^"]*" (?P<status>\d+)',
        "ssh": r'(?P<timestamp>\w+ \d+ [\d:]+) .* sshd\[\d+\]: (?P<message>.*)',
        "auth": r'(?P<timestamp>\w+ \d+ [\d:]+) .* (?P<user>\w+): (?P<message>.*)',
    }

    def __init__(self, log_format: str = "apache"):
        self.pattern = re.compile(self.PATTERNS.get(log_format, self.PATTERNS["apache"]))
        self.log_format = log_format

    def parse_line(self, line: str) -> dict:
        match = self.pattern.match(line)
        if match:
            return match.groupdict()
        return None

    def analyze_file(self, filepath: str) -> dict:
        entries = []
        with open(filepath) as f:
            for line in f:
                parsed = self.parse_line(line.strip())
                if parsed:
                    entries.append(parsed)

        analysis = {
            "total_entries": len(entries),
            "unique_ips": len(set(e.get("ip", "") for e in entries)),
            "status_codes": Counter(e.get("status", "") for e in entries),
            "top_urls": Counter(e.get("url", "") for e in entries).most_common(10),
        }

        # Detect potential attacks
        suspicious = []
        for entry in entries:
            url = entry.get("url", "")
            if any(pattern in url.lower() for pattern in ["union", "select", "drop", "<script", "../"]):
                suspicious.append(entry)
        analysis["suspicious_entries"] = suspicious
        return analysis

    def generate_report(self, analysis: dict) -> str:
        report = []
        report.append("=" * 60)
        report.append("SECURITY LOG ANALYSIS REPORT")
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append("=" * 60)
        report.append(f"\nTotal entries analyzed: {analysis['total_entries']}")
        report.append(f"Unique IP addresses: {analysis['unique_ips']}")
        report.append(f"\nStatus Code Distribution:")
        for code, count in analysis["status_codes"].most_common():
            report.append(f"  {code}: {count}")
        report.append(f"\nTop 10 URLs:")
        for url, count in analysis["top_urls"]:
            report.append(f"  {url}: {count}")
        if analysis["suspicious_entries"]:
            report.append(f"\n[!] SUSPICIOUS ENTRIES: {len(analysis['suspicious_entries'])}")
            for entry in analysis["suspicious_entries"][:5]:
                report.append(f"  - {entry}")
        return "\n".join(report)
```

## 3. Log Parsing

### Multi-Format Log Parser

```python
import re
import json
import gzip
from datetime import datetime
from typing import Generator, Optional
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class LogEntry:
    timestamp: str
    source: str
    level: str
    message: str
    ip: Optional[str] = None
    user: Optional[str] = None
    extra: Optional[dict] = None

class SecurityLogParser:
    """Parse multiple log formats and extract security-relevant events."""

    PATTERNS = {
        "apache_combined": re.compile(
            r'(?P<ip>[\d\.]+) - (?P<user>\S+) \[(?P<timestamp>[^\]]+)\] '
            r'"(?P<method>\w+) (?P<url>\S+) [^"]*" (?P<status>\d+) (?P<size>\d+)'
        ),
        "syslog": re.compile(
            r'(?P<timestamp>\w+ \d+ [\d:]+) (?P<hostname>\S+) (?P<process>\S+?)(?:\[(?P<pid>\d+)\])?: (?P<message>.*)'
        ),
        "windows_event": re.compile(
            r'(?P<date>\d{2}/\d{2}/\d{4}) (?P<time>\d{2}:\d{2}:\d{2} [AP]M) '
            r'(?P<level>\w+) (?P<source>\S+) (?P<event_id>\d+) (?P<message>.*)'
        ),
        "ssh_auth": re.compile(
            r'(?P<timestamp>\w+ \d+ [\d:]+) .* sshd\[\d+\]: '
            r'(?P<message>(?:Accepted|Failed) (?P<method>\w+) for (?P<user>\S+) from (?P<ip>[\d\.]+))'
        ),
    }

    SECURITY_KEYWORDS = [
        "failed", "error", "denied", "refused", "invalid",
        "unauthorized", "forbidden", "attack", "intrusion",
        "brute", "exploit", "malware", "injection", "xss"
    ]

    def parse_line(self, line: str, format_name: str = "apache_combined") -> Optional[LogEntry]:
        pattern = self.PATTERNS.get(format_name)
        if not pattern:
            return None
        match = pattern.match(line)
        if not match:
            return None
        data = match.groupdict()
        level = "INFO"
        message = data.get("message", line)
        if any(kw in message.lower() for kw in self.SECURITY_KEYWORDS):
            level = "ALERT"
        return LogEntry(
            timestamp=data.get("timestamp", data.get("date", "")),
            source=format_name,
            level=level,
            message=message,
            ip=data.get("ip"),
            user=data.get("user"),
            extra={k: v for k, v in data.items() if k not in ("timestamp", "source", "message", "ip", "user")}
        )

    def parse_file(self, filepath: str, format_name: str = "apache_combined") -> list:
        entries = []
        open_func = gzip.open if filepath.endswith(".gz") else open
        with open_func(filepath, "rt", errors="replace") as f:
            for line in f:
                entry = self.parse_line(line.strip(), format_name)
                if entry:
                    entries.append(entry)
        return entries

    def filter_alerts(self, entries: list) -> list:
        return [e for e in entries if e.level == "ALERT"]

    def export_json(self, entries: list, output: str):
        data = [asdict(e) for e in entries]
        Path(output).write_text(json.dumps(data, indent=2, default=str))
```

## 4. Report Generation

### Security Report Generator

```python
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

class SecurityReportGenerator:
    """Generate HTML security reports."""

    HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; margin: 40px; background: #0a0a0a; color: #e0e0e0; }}
        h1 {{ color: #00ff88; border-bottom: 2px solid #00ff88; padding-bottom: 10px; }}
        h2 {{ color: #00aaff; }}
        .summary {{ background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .critical {{ color: #ff4444; font-weight: bold; }}
        .warning {{ color: #ffaa00; }}
        .info {{ color: #00aaff; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #333; }}
        th {{ background: #1a1a2e; color: #00ff88; }}
        tr:hover {{ background: #1a1a2e; }}
        .badge {{ padding: 4px 8px; border-radius: 4px; font-size: 12px; }}
        .badge-critical {{ background: #ff4444; color: white; }}
        .badge-warning {{ background: #ffaa00; color: black; }}
        .badge-info {{ background: #00aaff; color: white; }}
        .badge-pass {{ background: #00ff88; color: black; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <p class="info">Generated: {timestamp}</p>

    <div class="summary">
        <h2>Executive Summary</h2>
        <p>Total Findings: <strong>{total_findings}</strong></p>
        <p>Critical: <span class="critical">{critical_count}</span> |
           Warning: <span class="warning">{warning_count}</span> |
           Info: <span class="info">{info_count}</span></p>
    </div>

    <h2>Detailed Findings</h2>
    <table>
        <tr><th>ID</th><th>Severity</th><th>Title</th><th>Description</th><th>Remediation</th></tr>
        {findings_rows}
    </table>

    <h2>Scan Statistics</h2>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        {stats_rows}
    </table>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
        <p class="info">Report generated by Security Scanner v1.0</p>
    </footer>
</body>
</html>"""

    def __init__(self, title: str = "Security Assessment Report"):
        self.title = title
        self.findings = []
        self.stats = {}

    def add_finding(self, severity: str, title: str, description: str, remediation: str = ""):
        finding_id = len(self.findings) + 1
        self.findings.append({
            "id": f"F-{finding_id:03d}",
            "severity": severity,
            "title": title,
            "description": description,
            "remediation": remediation
        })

    def add_stat(self, metric: str, value: str):
        self.stats[metric] = value

    def generate_html(self) -> str:
        critical = sum(1 for f in self.findings if f["severity"] == "CRITICAL")
        warning = sum(1 for f in self.findings if f["severity"] == "WARNING")
        info = sum(1 for f in self.findings if f["severity"] == "INFO")

        findings_rows = ""
        for f in self.findings:
            badge_class = f"badge-{f['severity'].lower()}"
            findings_rows += f"""
            <tr>
                <td>{f['id']}</td>
                <td><span class="badge {badge_class}">{f['severity']}</span></td>
                <td>{f['title']}</td>
                <td>{f['description']}</td>
                <td>{f['remediation']}</td>
            </tr>"""

        stats_rows = ""
        for metric, value in self.stats.items():
            stats_rows += f"<tr><td>{metric}</td><td>{value}</td></tr>"

        return self.HTML_TEMPLATE.format(
            title=self.title,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            total_findings=len(self.findings),
            critical_count=critical,
            warning_count=warning,
            info_count=info,
            findings_rows=findings_rows,
            stats_rows=stats_rows
        )

    def save_report(self, filepath: str):
        Path(filepath).write_text(self.generate_html())
```

## 5. Scheduled Jobs

### Cron Job Setup

```bash
# View existing crontab
crontab -l

# Edit crontab
crontab -e

# Common security cron jobs:

# Run vulnerability scan daily at 2 AM
0 2 * * * /usr/bin/python3 /opt/security/scanner.py >> /var/log/vuln_scan.log 2>&1

# Monitor file integrity every hour
0 * * * * /usr/bin/python3 /opt/security/fim.py --check

# Check for failed SSH logins every 15 minutes
*/15 * * * * /opt/security/check_ssh_failures.sh

# Rotate security logs weekly
0 0 * * 0 /usr/sbin/logrotate /etc/logrotate.d/security

# Update threat intelligence feed daily
0 3 * * * /opt/security/update_threats.py
```

### APScheduler (Python)

```python
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BlockingScheduler()

@scheduler.scheduled_job(CronTrigger(hour=2, minute=0))
def daily_vulnerability_scan():
    logger.info("Starting daily vulnerability scan")
    # Run scanner logic here
    pass

@scheduler.scheduled_job(IntervalTrigger(minutes=15))
def monitor_failed_logins():
    logger.info("Checking failed login attempts")
    # Check auth logs
    pass

@scheduler.scheduled_job(CronTrigger(day_of_week="sun", hour=0))
def weekly_report():
    logger.info("Generating weekly security report")
    # Generate report
    pass

# Start scheduler
# scheduler.start()
```

## 6. Error Handling

### Robust Error Handling Patterns

```python
import logging
import traceback
from functools import wraps
from typing import Callable, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class AutomationError(Exception):
    """Base exception for automation failures."""
    pass

class RetryableError(AutomationError):
    """Error that can be retried."""
    pass

class FatalError(AutomationError):
    """Error that should not be retried."""
    pass

def retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0,
          exceptions: tuple = (Exception,)):
    """Decorator for retrying failed operations."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            current_delay = delay
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts:
                        logger.warning(
                            f"Attempt {attempt}/{max_attempts} failed for {func.__name__}: {e}. "
                            f"Retrying in {current_delay}s..."
                        )
                        import time
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"All {max_attempts} attempts failed for {func.__name__}")
            raise last_exception
        return wrapper
    return decorator

def safe_execute(func: Callable, *args, default=None, **kwargs):
    """Execute function with comprehensive error handling."""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"Error in {func.__name__}: {e}\n{traceback.format_exc()}")
        return default

# Usage examples
@retry(max_attempts=3, delay=2.0, exceptions=(ConnectionError, TimeoutError))
def fetch_security_data(url: str) -> dict:
    import requests
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()

def process_security_events(events: list) -> dict:
    results = {"processed": 0, "errors": 0, "alerts": []}
    for event in events:
        try:
            # Process each event
            results["processed"] += 1
        except Exception as e:
            results["errors"] += 1
            logger.error(f"Failed to process event: {e}")
    return results
```

## 7. Configuration Management

### Config File Handling

```python
import json
import os
from pathlib import Path
from typing import Any, Optional
from dataclasses import dataclass, field

@dataclass
class SecurityConfig:
    """Security scanner configuration."""
    target_network: str = "192.168.1.0/24"
    scan_ports: str = "1-1000"
    threads: int = 50
    timeout: float = 5.0
    output_dir: str = "/var/security/reports"
    log_level: str = "INFO"
    api_key: Optional[str] = None
    excluded_hosts: list = field(default_factory=list)
    alert_email: Optional[str] = None

    @classmethod
    def from_file(cls, filepath: str) -> "SecurityConfig":
        """Load configuration from JSON file."""
        path = Path(filepath)
        if path.exists():
            data = json.loads(path.read_text())
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        return cls()

    @classmethod
    def from_env(cls) -> "SecurityConfig":
        """Load configuration from environment variables."""
        return cls(
            target_network=os.getenv("SCAN_TARGET", "192.168.1.0/24"),
            scan_ports=os.getenv("SCAN_PORTS", "1-1000"),
            threads=int(os.getenv("SCAN_THREADS", "50")),
            api_key=os.getenv("SECURITY_API_KEY"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

    def save(self, filepath: str):
        """Save configuration to file."""
        data = {k: v for k, v in self.__dict__.items()}
        Path(filepath).write_text(json.dumps(data, indent=2, default=str))

    def validate(self) -> list:
        """Validate configuration values."""
        errors = []
        if self.threads < 1 or self.threads > 1000:
            errors.append("threads must be between 1 and 1000")
        if self.timeout < 0.1 or self.timeout > 60:
            errors.append("timeout must be between 0.1 and 60 seconds")
        if not self.api_key:
            errors.append("api_key is required for vulnerability lookups")
        return errors
```

### Environment Variable Management

```python
import os
from pathlib import Path

class SecureConfig:
    """Manage configuration securely using environment variables."""

    REQUIRED_VARS = [
        "DATABASE_URL",
        "API_SECRET_KEY",
        "SMTP_PASSWORD",
    ]

    @classmethod
    def load_dotenv(cls, filepath: str = ".env"):
        """Load variables from .env file (simple implementation)."""
        path = Path(filepath)
        if not path.exists():
            return
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                os.environ.setdefault(key, value)

    @classmethod
    def get_required(cls, var_name: str) -> str:
        """Get required environment variable or raise error."""
        value = os.environ.get(var_name)
        if not value:
            raise EnvironmentError(f"Required environment variable not set: {var_name}")
        return value

    @classmethod
    def get_optional(cls, var_name: str, default: str = "") -> str:
        """Get optional environment variable with default."""
        return os.environ.get(var_name, default)

    @classmethod
    def validate_all(cls) -> list:
        """Validate all required variables are set."""
        missing = []
        for var in cls.REQUIRED_VARS:
            if not os.environ.get(var):
                missing.append(var)
        return missing
```

## Security Perspective

| Aspect | Detail |
|--------|--------|
| Input Validation | Validate all config values and script inputs |
| Privilege Separation | Run automation with least privilege |
| Audit Trail | Log all automated actions with timestamps |
| Secret Storage | Never store secrets in scripts; use vaults |
| Idempotency | Design scripts to be safely re-runnable |
| Rollback | Implement rollback for destructive operations |

## Attack Techniques and Defenses

| Attack | Technique | Defense |
|--------|-----------|---------|
| Cron Job Poisoning | Modify crontab to run malicious scripts | Restrict crontab permissions, monitor changes |
| Log Injection | Craft log entries to hide traces | Validate log formats, use structured logging |
| Config Tampering | Modify config files to redirect scans | File integrity monitoring, checksums |
| Privilege Escalation | Exploit SUID binaries in automation | Audit SUID bits, use capabilities |
| Environment Variable Leaking | Read secrets from /proc | Restrict environment passing |

## Debugging Tools

| Tool | Purpose |
|------|---------|
| `set -x` / `bash -x` | Shell script debugging |
| `pdb` / `ipdb` | Python interactive debugger |
| `strace` / `ltrace` | System/library call tracing |
| `journalctl` | Systemd log viewing |
| `crontab -l` | View scheduled jobs |
| `atq` | View at jobs |
| `systemctl list-timers` | View systemd timers |

## Interview Questions

1. How would you design an automated security monitoring system?
2. What are the differences between cron, at, and systemd timers?
3. How do you handle partial failures in batch processing?
4. Explain the importance of idempotency in automation scripts.
5. How would you securely manage credentials in automation?
6. What logging format would you use for security audit trails?
7. How do you implement retry logic with exponential backoff?
8. Describe a strategy for rolling back failed automation changes.
9. How would you parallelize a log analysis task across multiple servers?
10. What metrics should you track in an automated security pipeline?

## Hands-on Labs

### Lab 1: Automated Backup System
```python
# Task: Build an automated backup system
# Requirements:
# 1. Compress and encrypt backups
# 2. Schedule with cron/APScheduler
# 3. Rotate old backups (keep last 7 daily, 4 weekly)
# 4. Send email notification on failure
# 5. Verify backup integrity with checksums
```

### Lab 2: Log Analysis Pipeline
```python
# Task: Build a log analysis pipeline
# Requirements:
# 1. Parse multiple log formats (Apache, syslog, auth)
# 2. Detect brute force attempts
# 3. Identify SQL injection patterns
# 4. Generate daily summary report
# 5. Alert on critical findings
```

### Lab 3: Configuration Drift Detector
```python
# Task: Build a config drift detection system
# Requirements:
# 1. Snapshot current server configuration
# 2. Compare against known-good baseline
# 3. Alert on unauthorized changes
# 4. Auto-remediate common drift issues
# 5. Maintain change audit log
```

## Summary Table

| Category | Tools/Libraries | Use Case |
|----------|----------------|----------|
| Scheduling | cron, systemd, APScheduler | Time-based task execution |
| Execution | subprocess, Fabric, Ansible | Command and task execution |
| Log Parsing | regex, pandas, ELK | Log analysis and processing |
| Reporting | Jinja2, ReportLab, matplotlib | Report generation |
| Config | JSON, YAML, dotenv, pydantic | Configuration management |
| Error Handling | retry, logging, traceback | Robust error management |
| Parallelism | multiprocessing, threading | Concurrent processing |
| Monitoring | Prometheus, Grafana | System monitoring |
