# Python for Security

## Layer Position

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  ┌───────────────────────────────────────┐  │
│  │   Python Security Scripts & Tools      │  │
│  ├───────────────────────────────────────┤  │
│  │   Libraries: requests, scapy, socket  │  │
│  │   hashlib, cryptography, subprocess   │  │
│  ├───────────────────────────────────────┤  │
│  │   CPython Interpreter / Runtime       │  │
│  └───────────────────────────────────────┘  │
│           Operating System Layer            │
│           Network / Hardware Layer          │
└─────────────────────────────────────────────┘
```

## Internal Architecture

```
Python Security Ecosystem
│
├── Network Layer
│   ├── socket ───── Raw TCP/UDP communication
│   ├── scapy ────── Packet crafting & sniffing
│   ├── requests ─── HTTP client library
│   └── httpx ────── Async HTTP client
│
├── Cryptography Layer
│   ├── hashlib ──── Hash functions (MD5, SHA256)
│   ├── cryptography ─ AES, RSA, X.509
│   ├── hmac ─────── Message authentication
│   └── secrets ──── Secure random generation
│
├── System Layer
│   ├── subprocess ── Process execution
│   ├── os ────────── Filesystem operations
│   ├── pathlib ───── Modern path handling
│   └── shutil ────── File operations
│
├── Data Layer
│   ├── json ──────── JSON parsing
│   ├── csv ────────── CSV parsing
│   ├── sqlite3 ────── SQLite databases
│   └── struct ─────── Binary data packing
│
└── Web Layer
    ├── BeautifulSoup ── HTML parsing
    ├── Selenium ──────── Browser automation
    ├── urllib ────────── Low-level HTTP
    └── aiohttp ──────── Async HTTP server/client
```

## 1. Python Basics for Security

### Installation & Setup

```bash
# Install Python (macOS)
brew install python@3.12

# Create virtual environment
python3 -m venv security-env
source security-env/bin/activate

# Install security packages
pip install requests scapy cryptography beautifulsoup4 selenium
pip install python-nmap paramiko impacket pwntools
pip install flask fastapi uvicorn sqlalchemy
```

### Variables and Data Types

```python
# Security-relevant variable types
target_ip = "192.168.1.100"        # String - target definition
port_range = range(1, 1025)        # Range - port scanning
open_ports = []                     # List - results storage
scan_results = {}                   # Dict - structured data
is_vulnerable = True                # Bool - flag detection
payload_bytes = b"\x90\x90\xcc"    # Bytes - shellcode/binary

# Type checking for input validation
def validate_ip(ip: str) -> bool:
    parts = ip.split(".")
    if len(parts) != 4:
        return False
    return all(part.isdigit() and 0 <= int(part) <= 255 for part in parts)
```

### Control Flow

```python
# Port scanning with control flow
target = "scanme.nmap.org"
common_ports = {22: "SSH", 80: "HTTP", 443: "HTTPS", 3306: "MySQL"}

for port, service in common_ports.items():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((target, port))
        if result == 0:
            print(f"[+] {port}/tcp open - {service}")
        else:
            print(f"[-] {port}/tcp closed")
        sock.close()
    except socket.error as e:
        print(f"[!] Error on port {port}: {e}")
```

### Functions and Decorators

```python
import functools
import time
import logging

def rate_limit(max_calls: int, period: float):
    """Decorator to rate-limit function calls (useful for API interactions)."""
    calls = []
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            calls[:] = [c for c in calls if now - c < period]
            if len(calls) >= max_calls:
                raise Exception(f"Rate limit: {max_calls} calls per {period}s")
            calls.append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator

def log_execution(func):
    """Decorator to log function execution for audit trails."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logging.info(f"Executing {func.__name__} with args={args}, kwargs={kwargs}")
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        logging.info(f"Completed {func.__name__} in {elapsed:.4f}s")
        return result
    return wrapper

@rate_limit(max_calls=10, period=60.0)
@log_execution
def query_api(endpoint: str) -> dict:
    import requests
    return requests.get(endpoint).json()
```

### Error Handling

```python
import traceback
import sys

class SecurityError(Exception):
    """Custom exception for security-related failures."""
    pass

class AuthenticationError(SecurityError):
    pass

class ConnectionTimeout(SecurityError):
    pass

def safe_connect(host: str, port: int, timeout: int = 5):
    """Connect with comprehensive error handling."""
    import socket
    sock = None
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        return sock
    except socket.timeout:
        raise ConnectionTimeout(f"Connection to {host}:{port} timed out")
    except ConnectionRefusedError:
        raise SecurityError(f"Connection refused by {host}:{port}")
    except PermissionError:
        raise SecurityError("Permission denied - try running as root")
    except Exception as e:
        logging.error(f"Unexpected error: {traceback.format_exc()}")
        raise
    finally:
        if sock:
            sock.close()
```

## 2. Security Libraries

### requests — HTTP Client

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Session with retry logic
def create_session(retries: int = 3, backoff: float = 0.3):
    session = requests.Session()
    retry = Retry(total=retries, backoff_factor=backoff,
                  status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Security header checking
def check_security_headers(url: str) -> dict:
    response = requests.get(url, timeout=10)
    security_headers = {
        "Strict-Transport-Security": "HSTS",
        "Content-Security-Policy": "CSP",
        "X-Frame-Options": "Clickjacking Protection",
        "X-Content-Type-Options": "MIME Sniffing Protection",
        "X-XSS-Protection": "XSS Filter",
        "Referrer-Policy": "Referrer Control",
        "Permissions-Policy": "Feature Policy",
    }
    results = {}
    for header, description in security_headers.items():
        value = response.headers.get(header)
        results[header] = {"present": value is not None, "value": value, "description": description}
    return results

# Proxy support for penetration testing
proxies = {
    "http": "http://127.0.0.1:8080",
    "https": "http://127.0.0.1:8080",
}
response = requests.get("http://target.com", proxies=proxies, verify=False)
```

### scapy — Packet Crafting

```python
from scapy.all import *
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.http import HTTPRequest, HTTPResponse

# TCP SYN scan
def syn_scan(target: str, ports: list) -> list:
    open_ports = []
    for port in ports:
        packet = IP(dst=target) / TCP(dport=port, flags="S")
        response = sr1(packet, timeout=1, verbose=0)
        if response and response[TCP].flags == "SA":
            open_ports.append(port)
            # Send RST to close connection
            sr1(IP(dst=target) / TCP(dport=port, flags="R"), timeout=1, verbose=0)
    return open_ports

# ICMP sweep
def icmp_sweep(network: str) -> list:
    alive_hosts = []
    ans, _ = sr(IP(dst=network) / ICMP(), timeout=2, verbose=0)
    for sent, received in ans:
        alive_hosts.append(received.src)
    return alive_hosts

# HTTP packet sniffing
def sniff_http(packets_count: int = 100):
    packets = sniff(filter="tcp port 80", count=packets_count, iface="eth0")
    for pkt in packets:
        if pkt.haslayer(HTTPRequest):
            print(f"[HTTP Request] {pkt[HTTPRequest].Method} {pkt[HTTPRequest].Host}{pkt[HTTPRequest].Path}")
        elif pkt.haslayer(HTTPResponse):
            print(f"[HTTP Response] {pkt[HTTPResponse].Status_Code}")
```

### socket — Raw Networking

```python
import socket
import struct

# Raw TCP scanner
class TCPScanner:
    def __init__(self, target: str, timeout: float = 1.0):
        self.target = target
        self.timeout = timeout

    def scan_port(self, port: int) -> bool:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.timeout)
            result = sock.connect_ex((self.target, port))
            sock.close()
            return result == 0
        except socket.error:
            return False

    def scan_range(self, start: int, end: int) -> list:
        open_ports = []
        for port in range(start, end + 1):
            if self.scan_port(port):
                open_ports.append(port)
        return open_ports

# UDP scanner (slower, less reliable)
def udp_scan(target: str, ports: list) -> list:
    open_ports = []
    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(2)
            sock.sendto(b"test", (target, port))
            sock.recvfrom(1024)
            open_ports.append(port)
        except socket.timeout:
            pass
        except socket.error:
            pass
        finally:
            sock.close()
    return open_ports

# DNS resolution helper
def resolve_host(hostname: str) -> str:
    try:
        return socket.gethostbyname(hostname)
    except socket.gaierror:
        return None
```

### subprocess — System Interaction

```python
import subprocess
import shlex
import os

def run_command(cmd: str, timeout: int = 30) -> dict:
    """Execute shell command safely with timeout."""
    args = shlex.split(cmd)
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Command timed out", "returncode": -1, "success": False}
    except FileNotFoundError:
        return {"stdout": "", "stderr": f"Command not found: {args[0]}", "returncode": -1, "success": False}

# Nmap integration
def nmap_scan(target: str, ports: str = "1-1000") -> dict:
    cmd = f"nmap -sV -p {ports} --open {target}"
    return run_command(cmd, timeout=300)

# Nikto integration
def nikto_scan(target: str) -> dict:
    cmd = f"nikto -h {target} -Format txt"
    return run_command(cmd, timeout=600)
```

## 3. Web Scraping for Security

### BeautifulSoup — HTML Parsing

```python
from bs4 import BeautifulSoup
import requests

def find_forms(url: str) -> list:
    """Extract all forms from a web page."""
    response = requests.get(url, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")
    forms = []
    for form in soup.find_all("form"):
        form_data = {
            "action": form.get("action", ""),
            "method": form.get("method", "GET").upper(),
            "inputs": []
        }
        for inp in form.find_all(["input", "textarea", "select"]):
            form_data["inputs"].append({
                "name": inp.get("name"),
                "type": inp.get("type", "text"),
                "value": inp.get("value", "")
            })
        forms.append(form_data)
    return forms

def extract_links(url: str) -> list:
    """Extract all links from a page."""
    response = requests.get(url, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")
    links = []
    for a_tag in soup.find_all("a", href=True):
        links.append(a_tag["href"])
    return links

def find_comments(url: str) -> list:
    """Extract HTML comments that may leak info."""
    response = requests.get(url, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")
    comments = []
    for comment in soup.find_all(string=lambda text: isinstance(text, type(soup.new_comment("")))):
        comments.append(str(comment).strip())
    return comments
```

### Selenium — Browser Automation

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.options import Options

def setup_headless_browser() -> webdriver.Firefox:
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Firefox(options=options)
    driver.set_page_load_timeout(30)
    return driver

def test_xss_reflected(url: str, payload: str) -> bool:
    """Test for reflected XSS vulnerability."""
    driver = setup_headless_browser()
    try:
        driver.get(f"{url}?q={payload}")
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        page_source = driver.page_source
        return payload in page_source
    finally:
        driver.quit()

def test_login_form(url: str, username: str, password: str) -> dict:
    """Test login form for brute-force or SQL injection."""
    driver = setup_headless_browser()
    try:
        driver.get(url)
        user_field = driver.find_element(By.NAME, "username")
        pass_field = driver.find_element(By.NAME, "password")
        user_field.send_keys(username)
        pass_field.send_keys(password)
        submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit.click()
        return {
            "url": driver.current_url,
            "title": driver.title,
            "page_source_length": len(driver.page_source)
        }
    finally:
        driver.quit()
```

## 4. Cryptography

### hashlib — Hashing

```python
import hashlib
import binascii

def compute_hashes(data: bytes) -> dict:
    """Compute multiple hash algorithms for comparison."""
    return {
        "md5": hashlib.md5(data).hexdigest(),
        "sha1": hashlib.sha1(data).hexdigest(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "sha512": hashlib.sha512(data).hexdigest(),
    }

def hash_file(filepath: str, algorithm: str = "sha256") -> str:
    """Hash a file in chunks (memory efficient)."""
    h = hashlib.new(algorithm)
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def verify_file_integrity(filepath: str, expected_hash: str) -> bool:
    """Verify file integrity against expected hash."""
    return hash_file(filepath) == expected_hash
```

### cryptography — AES/RSA Encryption

```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

# Symmetric encryption (AES via Fernet)
def generate_key() -> bytes:
    return Fernet.generate_key()

def encrypt_message(message: str, key: bytes) -> bytes:
    f = Fernet(key)
    return f.encrypt(message.encode())

def decrypt_message(token: bytes, key: bytes) -> str:
    f = Fernet(key)
    return f.decrypt(token).decode()

# Password-based key derivation
def derive_key(password: str, salt: bytes = None) -> tuple:
    if salt is None:
        salt = os.urandom(16)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=480000)
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt

# Asymmetric encryption (RSA)
def generate_rsa_keypair(key_size: int = 2048):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)
    public_key = private_key.public_key()
    return private_key, public_key

def rsa_encrypt(message: bytes, public_key) -> bytes:
    return public_key.encrypt(
        message,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )

def rsa_decrypt(ciphertext: bytes, private_key) -> bytes:
    return private_key.decrypt(
        ciphertext,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
```

## 5. Network Tools

### Port Scanner

```python
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

class NetworkScanner:
    def __init__(self, target: str, threads: int = 100):
        self.target = target
        self.threads = threads
        self.open_ports = []

    def _scan_port(self, port: int) -> int | None:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.5)
            result = sock.connect_ex((self.target, port))
            sock.close()
            if result == 0:
                return port
        except:
            pass
        return None

    def scan(self, ports: range = range(1, 65536)) -> list:
        with ThreadPoolExecutor(max_workers=self.threads) as executor:
            futures = {executor.submit(self._scan_port, port): port for port in ports}
            for future in as_completed(futures):
                result = future.result()
                if result:
                    self.open_ports.append(result)
        return sorted(self.open_ports)

    def get_service_detection(self, port: int) -> str:
        common_services = {
            21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
            53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
            443: "HTTPS", 993: "IMAPS", 995: "POP3S",
            3306: "MySQL", 5432: "PostgreSQL", 6379: "Redis",
            8080: "HTTP-Proxy", 8443: "HTTPS-Alt"
        }
        return common_services.get(port, "Unknown")
```

### Packet Sniffer

```python
from scapy.all import sniff, TCP, UDP, IP, Raw

def packet_analyzer(packet):
    if packet.haslayer(IP):
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        proto = packet[IP].proto
        if packet.haslayer(TCP):
            print(f"[TCP] {src_ip}:{packet[TCP].sport} -> {dst_ip}:{packet[TCP].dport} Flags={packet[TCP].flags}")
        elif packet.haslayer(UDP):
            print(f"[UDP] {src_ip}:{packet[UDP].sport} -> {dst_ip}:{packet[UDP].dport}")
        if packet.haslayer(Raw):
            payload = packet[Raw].load[:100]
            print(f"  Payload: {payload}")

# Start sniffing (requires root)
# sniff(filter="tcp port 80", prn=packet_analyzer, count=100)
```

## 6. File Handling

```python
import os
import hashlib
from pathlib import Path

def secure_file_read(filepath: str) -> str:
    """Read file with validation."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    if not path.is_file():
        raise ValueError(f"Not a file: {filepath}")
    if path.stat().st_size > 10 * 1024 * 1024:  # 10MB limit
        raise ValueError("File too large")
    return path.read_text(encoding="utf-8")

def directory_inventory(root: str) -> dict:
    """Inventory files with hashes for integrity checking."""
    inventory = {}
    for path in Path(root).rglob("*"):
        if path.is_file():
            h = hashlib.sha256(path.read_bytes()).hexdigest()
            inventory[str(path)] = {
                "size": path.stat().st_size,
                "hash": h,
                "modified": path.stat().st_mtime
            }
    return inventory
```

## 7. Automation Scripts

### Vulnerability Scanner Template

```python
import requests
import json
from datetime import datetime

class VulnScanner:
    def __init__(self, target: str):
        self.target = target
        self.results = []

    def check_ssl(self):
        """Check SSL/TLS configuration."""
        try:
            r = requests.get(f"https://{self.target}", timeout=10)
            self.results.append({
                "test": "SSL/TLS",
                "status": "PASS" if r.url.startswith("https") else "FAIL",
                "details": f"Final URL: {r.url}"
            })
        except Exception as e:
            self.results.append({"test": "SSL/TLS", "status": "ERROR", "details": str(e)})

    def check_security_headers(self):
        """Check for security headers."""
        required = ["Strict-Transport-Security", "Content-Security-Policy", "X-Frame-Options"]
        try:
            r = requests.get(f"https://{self.target}", timeout=10)
            missing = [h for h in required if h not in r.headers]
            self.results.append({
                "test": "Security Headers",
                "status": "PASS" if not missing else "FAIL",
                "details": f"Missing: {missing}" if missing else "All present"
            })
        except Exception as e:
            self.results.append({"test": "Security Headers", "status": "ERROR", "details": str(e)})

    def generate_report(self) -> str:
        report = {
            "target": self.target,
            "timestamp": datetime.now().isoformat(),
            "results": self.results,
            "summary": {
                "total": len(self.results),
                "passed": sum(1 for r in self.results if r["status"] == "PASS"),
                "failed": sum(1 for r in self.results if r["status"] == "FAIL"),
            }
        }
        return json.dumps(report, indent=2)
```

## Security Perspective

| Aspect | Detail |
|--------|--------|
| Input Validation | Always validate and sanitize all user inputs |
| Least Privilege | Run scripts with minimal required permissions |
| Secrets Management | Never hardcode credentials; use env vars or vaults |
| Logging | Log all security-relevant actions for audit |
| Dependencies | Pin versions, scan with `pip-audit` or `safety` |
| Encoding | Handle bytes vs strings carefully in network code |

## Attack Techniques and Defenses

| Attack | Technique | Defense |
|--------|-----------|---------|
| Script Injection | Pass unsanitized input to subprocess | Use `shlex.split()`, avoid `shell=True` |
| Path Traversal | Manipulate file paths in scripts | Validate with `Path.resolve()` |
| SSRF | Use requests to scan internal network | Whitelist allowed domains |
| Deserialization | Exploit pickle/yaml loads | Use `json` or safe YAML loaders |
| Regex DoS | Craft ReDoS patterns | Use `re2` library or limit input length |

## Debugging Tools

| Tool | Purpose |
|------|---------|
| `pdb` / `ipdb` | Interactive debugger |
| `logging` | Structured log output |
| `py-spy` | Sampling profiler |
| `memory_profiler` | Memory usage analysis |
| `bandit` | Security linter for Python |
| `safety` | Check dependencies for CVEs |
| `pylint` / `ruff` | Code quality and linting |

## Interview Questions

1. How would you write a Python script to perform a TCP SYN scan without using nmap?
2. What is the difference between `requests.get()` and `urllib.request.urlopen()`?
3. How do you securely hash passwords in Python? Why not use MD5?
4. Explain the difference between symmetric and asymmetric encryption.
5. How would you prevent command injection when using `subprocess`?
6. What are the security implications of `pickle.loads()` on untrusted data?
7. How does `scapy` differ from raw `socket` for packet manipulation?
8. Write a function that detects SQL injection patterns in user input.
9. How would you implement rate limiting in a Python security tool?
10. Explain how to use `cryptography` library to implement TLS certificate validation.

## Hands-on Labs

### Lab 1: Build a Port Scanner
```python
# Task: Build a multi-threaded port scanner
# Requirements:
# 1. Accept target IP and port range as arguments
# 2. Use threading for parallel scanning
# 3. Identify open ports and common services
# 4. Output results to JSON file
# 5. Handle timeouts and errors gracefully
```

### Lab 2: Web Vulnerability Scanner
```python
# Task: Build a basic web vulnerability scanner
# Requirements:
# 1. Check for missing security headers
# 2. Detect directory listing
# 3. Find forms and test for basic XSS/SQLi
# 4. Check SSL certificate validity
# 5. Generate HTML report
```

### Lab 3: Password Cracker
```python
# Task: Build a password hash cracker
# Requirements:
# 1. Read password hashes from file
# 2. Use dictionary attack with common wordlists
# 3. Support MD5, SHA1, SHA256
# 4. Display cracked passwords with time taken
# 5. Calculate crack speed (hashes/second)
```

## Summary Table

| Category | Tools/Libraries | Use Case |
|----------|----------------|----------|
| HTTP | requests, httpx, aiohttp | Web requests, API interaction |
| Network | socket, scapy | Raw packets, scanning |
| Crypto | hashlib, cryptography | Hashing, encryption |
| Web Parse | BeautifulSoup, Selenium | Scraping, automation |
| System | subprocess, os, pathlib | Command execution, files |
| Data | json, csv, sqlite3 | Data processing |
| Testing | pytest, unittest | Test automation |
| Analysis | bandit, safety | Security auditing |
