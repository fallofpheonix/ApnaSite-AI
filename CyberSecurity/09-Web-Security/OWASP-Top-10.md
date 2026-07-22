# OWASP Top 10 — Comprehensive Web Security Guide

## What is it?

The OWASP Top 10 is a regularly updated document listing the most critical web application security risks. Published by the Open Worldwide Application Security Project, it serves as an industry-standard awareness document. Each risk is categorized and assigned a risk rating based on exploitability and impact across real-world applications.

## Why Learn It?

The OWASP Top 10 is the foundation of web application security knowledge. It provides a common language for developers, testers, and security professionals to discuss and prioritize vulnerabilities. Understanding these risks is essential for building secure applications and passing security certifications.

## You Will Learn

- Broken Access Control and its exploitation
- Cryptographic Failures and data exposure risks
- Injection vulnerabilities including SQL and NoSQL
- Security Misconfiguration across cloud and server environments
- Identification and Authentication Failures
- Vulnerable and Outdated Components
- Software and Data Integrity Failures
- Security Logging and Monitoring Failures
- Server-Side Request Forgery (SSRF)

## Prerequisites

- Web Technologies (HTTP, HTML, JavaScript, REST APIs)
- Security Fundamentals (CIA Triad, threat modeling basics)

## Related Topics

- Injection Attacks
- Authentication Flaws
- Session Management
- Secure Coding

---

## Web Architecture — Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER / ATTACKER                              │
│                   (Browser, curl, Burp Suite)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/HTTPS Request
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: NETWORK                                │
│         (Firewall, WAF, Load Balancer, TLS Termination)             │
│                                                                     │
│  ◆ OWASP A10:2021 — SSRF (Server-Side Request Forgery)            │
│  ◆ DDoS Protection  ◆ Rate Limiting  ◆ IP Filtering                │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Forwarded Request
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: WEB SERVER                              │
│            (Nginx, Apache, IIS — Static Content)                    │
│                                                                     │
│  ◆ OWASP A05:2021 — Security Misconfiguration                     │
│  ◆ Server Headers  ◆ Directory Listing  ◆ Default Pages            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Proxy Pass
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   LAYER 3: APPLICATION SERVER                        │
│         (Node.js, Django, Spring Boot, Laravel, ASP.NET)            │
│                                                                     │
│  ◆ OWASP A03:2021 — Injection (SQL, XSS, Command)                 │
│  ◆ OWASP A07:2021 — Auth Failures                                  │
│  ◆ OWASP A08:2021 — Software & Data Integrity                      │
│  ◆ OWASP A09:2021 — Logging & Monitoring Failures                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Database Queries
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 4: DATA STORE                              │
│          (MySQL, PostgreSQL, MongoDB, Redis, S3)                    │
│                                                                     │
│  ◆ OWASP A02:2021 — Cryptographic Failures                        │
│  ◆ OWASP A01:2021 — Broken Access Control                         │
│  ◆ Encryption at Rest  ◆ Backup Security  ◆ Access Controls        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## OWASP A01:2021 — Broken Access Control

### Description
Access control enforces policy such that users cannot act outside their intended permissions. Failures lead to unauthorized information disclosure, modification, or destruction of data.

### Attack Flow Diagram

```
┌──────────┐    ┌─────────────┐    ┌────────────────┐    ┌───────────┐
│ Attacker │───▶│ Normal User │───▶│ Modify Request │───▶│ Admin     │
│          │    │ Endpoint    │    │ (Change ID)    │    │ Endpoint  │
└──────────┘    └─────────────┘    └────────────────┘    └─────┬─────┘
                                                               │
                                                               ▼
                                                        ┌─────────────┐
                                                        │ Unauthorized│
                                                        │ Data Access │
                                                        └─────────────┘
```

### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Insecure Direct Object Reference (IDOR)
$user_id = $_GET['user_id'];
$query = "SELECT * FROM users WHERE id = $user_id";
$result = mysqli_query($conn, $query);
$user_data = mysqli_fetch_assoc($result);

// No check if current user owns this profile
echo json_encode($user_data);
?>
```

### Secure Code (PHP)

```php
<?php
// SECURE: Verify ownership before data access
session_start();
$logged_in_user = $_SESSION['user_id'];
$requested_id = (int)$_GET['user_id'];

// Enforce ownership check
if ($logged_in_user !== $requested_id) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

$query = "SELECT * FROM users WHERE id = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $requested_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user_data = mysqli_fetch_assoc($result);

echo json_encode($user_data);
?>
```

### Burp Suite Example

```
# IDOR Detection in Burp Suite

1. Login as user A and capture request:
   GET /api/v1/users/1001/profile HTTP/1.1
   Cookie: session=abc123

2. Repeater: Change user_id from 1001 to 1002:
   GET /api/v1/users/1002/profile HTTP/1.1
   Cookie: session=abc123

3. If server returns user B's data → IDOR vulnerability confirmed

4. Automate with Burp Intruder:
   - Set position: /users/§1001§/profile
   - Payload: Numbers 1000-2000
   - Filter: Response length != 403 length
```

### SQLMap Example

```bash
# Detect IDOR in parameter
sqlmap -u "http://target.com/api/users?id=1" \
  --cookie="session=abc123" \
  --batch \
  --dbs

# Test for privilege escalation via IDOR
sqlmap -u "http://target.com/api/documents?user_id=1" \
  --cookie="session=abc123" \
  --is-dba \
  --privileges
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Deny by default | Require explicit grants for every resource | Critical |
| Ownership check | Validate user owns requested resource | Critical |
| Directory listing | Disable in web server config | High |
| CORS policy | Restrict origins properly | High |
| RBAC/ABAC | Role-based or attribute-based access control | Critical |
| JWT validation | Verify claims and scopes on every request | Critical |

---

## OWASP A02:2021 — Cryptographic Failures

### Description
Failures related to cryptography which often lead to sensitive data exposure, data compromise, or system compromise.

### Attack Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ Attacker     │────▶│ Intercept    │────▶│ Decrypt/Decode   │
│              │     │ Traffic/Data │     │ Sensitive Data   │
└──────────────┘     └──────────────┘     └──────────────────┘
        │                                         │
        ▼                                         ▼
┌──────────────┐                          ┌──────────────┐
│ Weak Cipher  │                          │ Plaintext    │
│ MD5/SHA1     │                          │ Passwords,   │
│ No TLS       │                          │ PII, Cards   │
└──────────────┘                          └──────────────┘
```

### Vulnerable Code (Python)

```python
import hashlib
import base64

# VULNERABLE: Weak hashing without salt
def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()

# VULNERABLE: Hardcoded encryption key
KEY = "super_secret_key_12345"

def encrypt_data(data):
    return base64.b64encode(data.encode()).decode()

# VULNERABLE: Storing data in plaintext
def save_user(user):
    db.insert({
        "username": user["username"],
        "password": hash_password(user["password"]),
        "credit_card": user["credit_card"],  # PLAINTEXT!
        "ssn": user["ssn"]                    # PLAINTEXT!
    })
```

### Secure Code (Python)

```python
import os
import bcrypt
from cryptography.fernet import Fernet

# SECURE: Strong hashing with salt (bcrypt)
def hash_password(password):
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())

# SECURE: Environment-based key management
def get_encryption_key():
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        raise ValueError("ENCRYPTION_KEY not set")
    return key.encode()

def encrypt_data(data):
    f = Fernet(get_encryption_key())
    return f.encrypt(data.encode()).decode()

# SECURE: Encrypt sensitive fields
def save_user(user):
    db.insert({
        "username": user["username"],
        "password": hash_password(user["password"]),
        "credit_card": encrypt_data(user["credit_card"]),
        "ssn": encrypt_data(user["ssn"])
    })
```

### Burp Suite Example

```
# Detecting Weak Crypto in Burp

1. Proxy → Options → SSL → Check for weak ciphers:
   - TLS 1.0, TLS 1.1 (deprecated)
   - RC4, DES, 3DES ciphers
   - MD5 signatures in certificates

2. Repeater: Force downgrade attack:
   Client Hello with only TLS 1.0 ciphers
   → If server accepts → vulnerability

3. Scan for cleartext:
   - Search responses for patterns: SSN, credit cards
   - Match regex: \b\d{3}-\d{2}-\d{4}\b (SSN)
   - Match regex: \b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b (CC)
```

### SQLMap Example

```bash
# Detect encrypted fields in database
sqlmap -u "http://target.com/api/users?id=1" \
  --dump -T users \
  --columns \
  --where="column_name LIKE '%password%' OR column_name LIKE '%credit%'"

# Check if password hashes are weak (MD5/SHA1)
sqlmap -u "http://target.com/api/login" \
  --data="user=admin&pass=test" \
  --passwords \
  --batch
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| TLS 1.2+ | Enforce modern TLS versions | Critical |
| Strong ciphers | AES-256-GCM, ChaCha20 | Critical |
| Key management | Use HSM, KMS, or vault solutions | Critical |
| Password hashing | bcrypt/scrypt/Argon2id (NOT MD5/SHA1) | Critical |
| Data classification | Encrypt PII, financial, health data | High |
| Certificate pinning | Mobile apps, critical API endpoints | High |

---

## OWASP A03:2021 — Injection

### Description
Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query. SQL, NoSQL, OS command, and LDAP injection are the most common.

### Attack Flow Diagram

```
┌──────────┐    ┌─────────────┐    ┌────────────────┐    ┌───────────┐
│ Attacker │───▶│ User Input  │───▶│ Interpreter    │───▶│ Full DB   │
│          │    │ Form/API    │    │ (SQL, OS, etc) │    │ Access    │
└──────────┘    └─────────────┘    └────────────────┘    └───────────┘
                      │                    │
                      ▼                    ▼
               ┌─────────────┐     ┌────────────────┐
               │ Payload:    │     │ Malicious      │
               │ ' OR 1=1--  │     │ Command Exec   │
               └─────────────┘     └────────────────┘
```

### Vulnerable Code (Java)

```java
// VULNERABLE: SQL Injection
String username = request.getParameter("username");
String query = "SELECT * FROM users WHERE username = '" + username + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(query);

// VULNERABLE: OS Command Injection
String ip = request.getParameter("ip");
Runtime.getRuntime().exec("ping " + ip);

// VULNERABLE: LDAP Injection
String filter = "(uid=" + request.getParameter("uid") + ")";
searchLDAP(filter);
```

### Secure Code (Java)

```java
// SECURE: Parameterized query (PreparedStatement)
String username = request.getParameter("username");
String query = "SELECT * FROM users WHERE username = ?";
PreparedStatement pstmt = conn.prepareStatement(query);
pstmt.setString(1, username);
ResultSet rs = pstmt.executeQuery();

// SECURE: Input validation for command injection
String ip = request.getParameter("ip");
if (!ip.matches("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$")) {
    throw new IllegalArgumentException("Invalid IP format");
}
ProcessBuilder pb = new ProcessBuilder("ping", "-c", "4", ip);
pb.start();

// SECURE: Parameterized LDAP
String filter = "(uid={0})";
Attributes attrs = new BasicAttributes(true);
Attribute uid = new BasicAttribute("uid", request.getParameter("uid"));
searchLDAP(filter, new Object[]{request.getParameter("uid")});
```

### Burp Suite Example

```
# SQL Injection Detection

1. Proxy → Intercept form POST:
   POST /login HTTP/1.1
   Content-Type: application/x-www-form-urlencoded

   username=admin'--&password=anything

2. Repeater: Test payloads:
   ' OR '1'='1'--
   ' UNION SELECT null,username,password FROM users--
   '; WAITFOR DELAY '0:0:5'--  (time-based)

3. Intruder: Automate detection:
   Positions: username=§payload§&password=test
   Payloads: SQLi wordlist (sqlmap.txt)
   Grep Match: "Welcome admin", "Error", "500"
```

### SQLMap Examples

```bash
# Basic SQL injection detection
sqlmap -u "http://target.com/page?id=1" --batch --dbs

# POST-based injection
sqlmap -u "http://target.com/login" \
  --data="username=admin&password=pass" \
  --batch \
  --dbs

# Time-based blind injection
sqlmap -u "http://target.com/page?id=1" \
  --technique=T \
  --time-sec=5 \
  --batch

# Union-based extraction
sqlmap -u "http://target.com/page?id=1" \
  --technique=U \
  --union-cols=5 \
  --dump -T users

# With authentication
sqlmap -u "http://target.com/admin/users?id=1" \
  --cookie="session=abc123; token=xyz" \
  --batch \
  --dump

# Bypass WAF with tamper scripts
sqlmap -u "http://target.com/page?id=1" \
  --tamper=space2comment,between,randomcase \
  --batch
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Parameterized queries | Use prepared statements everywhere | Critical |
| Input validation | Whitelist approach, schema validation | Critical |
| ORM usage | Never concatenate SQL strings | High |
| Output encoding | Context-aware encoding | High |
| Least privilege | DB user with minimal permissions | High |
| WAF | Deploy ModSecurity, AWS WAF, CloudFlare | Medium |

---

## OWASP A04:2021 — Insecure Design

### Description
Insecure design refers to risks related to design flaws, missing or ineffective security controls. This is different from implementation vulnerabilities — it's about the absence of security architecture.

### Attack Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Design Phase    │───▶│ Missing Control │───▶│ Exploitation    │
│ (No Threat      │    │ (No Rate Limit, │    │ (Mass Account   │
│  Modeling)      │    │  No Validation) │    │  Takeover)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Vulnerable Code (Node.js)

```javascript
// VULNERABLE: No rate limiting on password reset
app.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  const user = await db.users.findByEmail(email);

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.tokens.create({ userId: user.id, token });
    await sendEmail(email, `Reset: https://app.com/reset?token=${token}`);
  }

  // Always returns success — enables enumeration
  res.json({ message: 'If account exists, reset email sent' });
});

// VULNERABLE: No business logic validation
app.post('/transfer', async (req, res) => {
  const { from, to, amount } = req.body;
  // No check: negative amount? self-transfer? overdraft?
  await db.transfers.create({ from, to, amount });
  res.json({ success: true });
});
```

### Secure Code (Node.js)

```javascript
// SECURE: Rate limiting + account enumeration prevention
const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many requests'
});

app.post('/reset-password', resetLimiter, async (req, res) => {
  const { email } = req.body;
  const user = await db.users.findByEmail(email);

  // Always return same response — prevents enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);
    await db.tokens.create({ userId: user.id, token, expiresAt: expiry });
    await sendEmail(email, 'If account exists, reset email sent');
  }

  res.json({ message: 'If account exists, reset email sent' });
});

// SECURE: Business logic validation
app.post('/transfer', authenticate, async (req, res) => {
  const { to, amount } = req.body;
  const from = req.user.id;

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Prevent self-transfer
  if (from === to) {
    return res.status(400).json({ error: 'Cannot transfer to self' });
  }

  // Check balance
  const balance = await db.accounts.getBalance(from);
  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  await db.transfers.create({ from, to, amount });
  res.json({ success: true });
});
```

### Burp Suite Example

```
# Business Logic Testing

1. Test negative amounts:
   POST /api/transfer
   {"from":"A","to":"B","amount":-100}
   → Check if balance increases (credit manipulation)

2. Test race conditions:
   Send 10 simultaneous transfer requests
   → Check if overdraft protection works

3. Test parameter pollution:
   GET /api/transfer?amount=100&amount=-100
   → Check which value the server uses
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Threat modeling | STRIDE/DREAD during design phase | Critical |
| Rate limiting | Per-user, per-endpoint throttling | Critical |
| Business logic validation | Server-side state checks | Critical |
| Abuse case testing | Design-level attack scenarios | High |
| Reference architecture | Use secure design patterns | High |
| Security requirements | Include in user stories | High |

---

## OWASP A05:2021 — Security Misconfiguration

### Description
Security misconfiguration is the most commonly seen issue. This includes insecure default configurations, incomplete or ad-hoc configurations, open cloud storage, misconfigured HTTP headers, and verbose error messages.

### Attack Flow Diagram

```
┌──────────┐    ┌─────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Enumerate       │───▶│ Find Default   │
│          │    │ Server Headers  │    │ Credentials    │
└──────────┘    └─────────────────┘    └────────┬───────┘
                                                │
                   ┌─────────────────┐           ▼
                   │ Access Admin    │◀───── Successful
                   │ Panel / Data    │      Exploitation
                   └─────────────────┘
```

### Vulnerable Code (Nginx Config)

```nginx
# VULNERABLE: Insecure Nginx configuration
server {
    listen 80;

    # Missing security headers
    # No X-Frame-Options
    # No Content-Security-Policy
    # No Strict-Transport-Security

    location /admin {
        # Default credentials unchanged
        auth_basic "Admin Area";
        auth_basic_user_file /etc/nginx/.htpasswd; # admin:admin
    }

    location /uploads {
        # Directory listing enabled
        autoindex on;
    }

    error_page 404 /404.html;
    # Verbose error pages leak server info
}
```

### Secure Code (Nginx Config)

```nginx
# SECURE: Hardened Nginx configuration
server {
    listen 443 ssl http2;
    listen 80 return 301 https://$host$request_uri;

    ssl_certificate /etc/ssl/certs/app.crt;
    ssl_certificate_key /etc/ssl/private/app.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(),camera=()" always;

    # Remove server version
    server_tokens off;

    # Admin with strong auth
    location /admin {
        auth_basic "Admin Area";
        auth_basic_user_file /etc/nginx/.htpasswd; # Strong password
        allow 10.0.0.0/8;
        deny all;
    }

    # No directory listing
    location /uploads {
        autoindex off;
    }

    # Custom error pages (no info leakage)
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Burp Suite Example

```
# Security Misconfiguration Scanning

1. Spider → Discover paths:
   /admin, /backup, /.env, /config, /debug

2. Scanner → Check for:
   - Missing security headers
   - Verbose error messages
   - Directory listing
   - Default credentials
   - Server version disclosure

3. Repeater: Test admin access:
   GET /admin HTTP/1.1
   → 401 Unauthorized with Basic Auth
   → Try default: admin:admin, root:root

4. Intruder: Directory brute-force:
   GET /§path§ HTTP/1.1
   Payloads: /admin, /backup, /.git, /.env
```

### SQLMap Example

```bash
# SQLMap also detects misconfigurations
sqlmap -u "http://target.com/page?id=1" \
  --batch \
  --check-waf \
  --identify-waf \
  --banner \
  --is-dba \
  --privileges \
  --passwords
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Configuration hardening | CIS benchmarks for servers | Critical |
| Security headers | OWASP Secure Headers project | High |
| Disable defaults | Remove default credentials/pages | Critical |
| Regular audits | Automated config scanning | High |
| IaC scanning | Terraform/CloudFormation linting | High |
| Minimal exposure | Close unused ports/services | High |

---

## OWASP A06:2021 — Vulnerable and Outdated Components

### Description
Using components with known vulnerabilities may undermine application defenses and enable various attacks. This includes using outdated libraries, frameworks, or operating systems.

### Attack Flow Diagram

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Identify     │───▶│ Find CVE in     │───▶│ Exploit Known    │
│ Component    │    │ Database        │    │ Vulnerability    │
│ (npm, pip)   │    │ (NVD, GitHub)   │    │ (Metasploit)     │
└──────────────┘    └─────────────────┘    └──────────────────┘
```

### Vulnerable Code (package.json)

```json
{
  "name": "vulnerable-app",
  "dependencies": {
    "express": "3.0.0",
    "lodash": "4.17.11",
    "jquery": "2.1.0",
    "mongoose": "4.13.0",
    "jsonwebtoken": "7.0.0"
  }
}
```

### Secure Code (package.json)

```json
{
  "name": "secure-app",
  "dependencies": {
    "express": "4.18.2",
    "lodash": "4.17.21",
    "jquery": "3.7.1",
    "mongoose": "7.6.3",
    "jsonwebtoken": "9.0.2"
  },
  "devDependencies": {
    "npm-audit-resolver": "^3.0.0"
  },
  "scripts": {
    "audit": "npm audit --production",
    "audit:fix": "npm audit fix"
  }
}
```

### Burp Suite Example

```
# Component Detection

1. Passive scanning reveals:
   - X-Powered-By: Express 3.0.0
   - Set-Cookie: connect.sid (Express session default)
   - X-AspNet-Version: 4.0.30319

2. SearchSploit integration:
   searchsploit express 3.0.0
   → Multiple known CVEs available

3. JavaScript analysis:
   - Extract all JS files
   - Search for library versions in comments
   - Match against vulnerability database
```

### SQLMap Example

```bash
# SQLMap detects database version for component analysis
sqlmap -u "http://target.com/page?id=1" \
  --banner \
  --batch \
  --technique=E \
  --sql-query="SELECT version()"

# Output reveals: MySQL 5.7.23 (known vulnerabilities)
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Dependency scanning | Dependabot, Snyk, OWASP Dependency-Check | Critical |
| Version pinning | Lock files (package-lock.json, Pipfile.lock) | High |
| Regular updates | Automated patching pipeline | High |
| SBOM | Software Bill of Materials tracking | Medium |
| Vulnerability monitoring | Subscribe to CVE feeds | High |
| Replace abandoned | Switch to maintained libraries | High |

---

## OWASP A07:2021 — Identification and Authentication Failures

### Description
Confirmation of the user's identity, authentication, and session management is critical to protect against authentication-related attacks.

### Attack Flow Diagram

```
┌──────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Attacker │───▶│ Credential      │───▶│ Account         │
│          │    │ Stuffing/Brute  │    │ Takeover        │
│          │    │ Force           │    │                 │
└──────────┘    └─────────────────┘    └─────────────────┘
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│ Weak Password    │                  │ Session          │
│ Policy           │                  │ Hijacking        │
│ (min 6 chars)    │                  │ (Predictable)    │
└──────────────────┘                  └──────────────────┘
```

### Vulnerable Code (Python/Flask)

```python
from flask import Flask, request, session
import hashlib

app = Flask(__name__)
app.secret_key = 'secret'  # VULNERABLE: Weak secret key

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # VULNERABLE: MD5 hashing, no salt
    hashed = hashlib.md5(password.encode()).hexdigest()

    user = db.query(
        f"SELECT * FROM users WHERE username='{username}' AND password='{hashed}'"
    )

    if user:
        # VULNERABLE: No brute force protection
        session['user_id'] = user.id
        # VULNERABLE: Session token not regenerated
        return 'Logged in'
    return 'Invalid credentials'

@app.route('/change-password', methods=['POST'])
def change_password():
    # VULNERABLE: No current password verification
    new_password = request.form['new_password']
    user_id = session['user_id']

    hashed = hashlib.md5(new_password.encode()).hexdigest()
    db.execute(f"UPDATE users SET password='{hashed}' WHERE id={user_id}")
    return 'Password changed'
```

### Secure Code (Python/Flask)

```python
from flask import Flask, request, session, abort
import bcrypt
import secrets
from functools import wraps
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Rate limiting
from flask_limiter import Limiter
limiter = Limiter(app, default_limits=["100 per hour"])

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    username = request.form['username']
    password = request.form['password']

    user = db.query(
        "SELECT * FROM users WHERE username = ?", (username,)
    )

    if not user or not bcrypt.checkpw(password.encode(), user.password.encode()):
        # Generic message prevents username enumeration
        abort(401, description="Invalid credentials")

    # Regenerate session to prevent fixation
    session.regenerate()
    session['user_id'] = user.id
    session['login_time'] = datetime.utcnow().isoformat()
    session['ip'] = request.remote_addr

    return 'Logged in'

@app.route('/change-password', methods=['POST'])
def change_password():
    current_password = request.form['current_password']
    new_password = request.form['new_password']

    user = db.query("SELECT * FROM users WHERE id = ?", (session['user_id'],))

    # Verify current password
    if not bcrypt.checkpw(current_password.encode(), user.password.encode()):
        abort(403, description="Current password incorrect")

    # Password strength check
    if len(new_password) < 12:
        abort(400, description="Password must be at least 12 characters")

    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(12))
    db.execute(
        "UPDATE users SET password = ? WHERE id = ?",
        (hashed, session['user_id'])
    )

    # Invalidate all other sessions
    db.execute(
        "DELETE FROM sessions WHERE user_id = ? AND id != ?",
        (session['user_id'], session.id)
    )

    return 'Password changed'
```

### Burp Suite Example

```
# Brute Force Testing

1. Intruder → Attack type: Sniper
   POST /login HTTP/1.1
   username=admin&password=§payload§

2. Payloads: rockyou.txt or custom wordlist

3. Grep Match: "Welcome", "Dashboard", "200 OK"
   Grep Extract: Response length, "Invalid" vs "Wrong password"

4. Analyze results:
   - Different response for valid user = enumeration
   - No rate limiting = vulnerable to brute force
   - Response time variation = possible timing attack
```

### SQLMap Example

```bash
# Test authentication bypass
sqlmap -u "http://target.com/login" \
  --data="username=admin&password=pass" \
  --batch \
  --passwords \
  --dump -T users \
  --where="username='admin'"

# Test for authentication via injection
sqlmap -u "http://target.com/page?id=1" \
  --auth-type=basic \
  --authcred="admin:password" \
  --batch
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Multi-factor auth | TOTP, WebAuthn, SMS backup | Critical |
| Password policy | Min 12 chars, complexity, breach database check | Critical |
| Account lockout | Progressive delays after failed attempts | High |
| Session management | Regenerate on login, secure flags | Critical |
| Credential storage | bcrypt/scrypt/Argon2id | Critical |
| Secure recovery | Time-limited tokens, identity verification | High |

---

## OWASP A08:2021 — Software and Data Integrity Failures

### Description
Relates to code and infrastructure that does not protect against integrity violations — insecure CI/CD pipelines, auto-update without verification, insecure deserialization.

### Attack Flow Diagram

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Compromise   │───▶│ Inject Malicious│───▶│ Execute on       │
│ CI/CD        │    │ Code into Build │    │ Production       │
│ Pipeline     │    │                 │    │ Servers          │
└──────────────┘    └─────────────────┘    └──────────────────┘
```

### Vulnerable Code (JavaScript)

```javascript
// VULNERABLE: Deserialization of untrusted data
const data = req.body; // From user input
const object = eval('(' + data.serialized + ')');

// VULNERABLE: Loading script from CDN without SRI
// <script src="https://cdn.example.com/lib.js"></script>

// VULNERABLE: Auto-update without verification
const update = await fetch('https://update-server.com/latest');
const code = await update.text();
eval(code);
```

### Secure Code (JavaScript)

```javascript
// SECURE: Safe deserialization
const object = JSON.parse(data.serialized);

// SECURE: Subresource Integrity (SRI)
// <script src="https://cdn.example.com/lib.js"
//   integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8w"
//   crossorigin="anonymous"></script>

// SECURE: Signed updates with verification
const crypto = require('crypto');
const update = await fetch('https://update-server.com/latest');
const data = await update.json();
const signature = crypto.createHmac('sha256', PUBLIC_KEY)
  .update(data.code)
  .digest('hex');

if (signature !== data.signature) {
  throw new Error('Update signature verification failed');
}

eval(data.code);
```

### Burp Suite Example

```
# CI/CD Pipeline Testing

1. Check for exposed CI endpoints:
   /jenkins, /gitlab, /.github/workflows
   /bitbucket, /circleci, /.travis.yml

2. Look for artifact manipulation:
   - Unsigned container images
   - Exposed build secrets in logs
   - Overly permissive artifact access

3. Test deserialization:
   POST /api/import
   Content-Type: application/json

   {"data": {"$type": "os.Command", "command": "id"}}
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| SRI | Subresource Integrity for CDN scripts | High |
| Signed updates | Cryptographic verification of packages | Critical |
| CI/CD security | Sign commits, protect branches, scan artifacts | Critical |
| SBOM | Track all dependencies and their integrity | High |
| Supply chain | Pin exact versions, verify checksums | Critical |
| Code signing | Sign releases and containers | High |

---

## OWASP A09:2021 — Security Logging and Monitoring Failures

### Description
Without logging and monitoring, breaches cannot be detected. Insufficient logging, detection, monitoring, and active response occurs any time auditable events are logged, logs are inactive, undetected, or insufficient.

### Attack Flow Diagram

```
┌──────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Attack   │───▶│ No Logs Created │───▶│ Attack Goes     │
│ Occurs   │    │ (Or Logs Not    │    │ Unnoticed for   │
│          │    │  Monitored)     │    │ Months/Years    │
└──────────┘    └─────────────────┘    └─────────────────┘
```

### Vulnerable Code (Python)

```python
# VULNERABLE: No logging at all
@app.route('/login', methods=['POST'])
def login():
    user = authenticate(request.form['username'], request.form['password'])
    if user:
        session['user_id'] = user.id
        return 'OK'
    return 'Fail'

# VULNERABLE: Logging sensitive data
@app.route('/transfer', methods=['POST'])
def transfer():
    amount = request.form['amount']
    log.info(f"Transfer attempt: {amount}, "
             f"card={request.form['card_number']}, "
             f"ssn={request.form['ssn']}")
    # PII in logs!

# VULNERABLE: Logs not stored centrally
# Logs only in local file, no rotation
logging.basicConfig(filename='/var/log/app.log')
```

### Secure Code (Python)

```python
import logging
import structlog
from datetime import datetime

# Structured logging with context
logger = structlog.get_logger()

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']

    try:
        user = authenticate(username, request.form['password'])
        logger.info("login_success",
                    user_id=user.id,
                    ip=request.remote_addr,
                    user_agent=request.user_agent.string)

        session['user_id'] = user.id
        return 'OK'
    except AuthError:
        logger.warning("login_failure",
                       username=username,
                       ip=request.remote_addr,
                       reason="invalid_credentials")
        return 'Fail'

@app.route('/transfer', methods=['POST'])
def transfer():
    amount = request.form['amount']
    # Log event WITHOUT sensitive data
    logger.info("transfer_attempt",
                user_id=session['user_id'],
                amount=amount,
                ip=request.remote_addr,
                timestamp=datetime.utcnow().isoformat())
    # No card numbers or SSN in logs!
```

### Burp Suite Example

```
# Logging Verification

1. Send attack payloads through all endpoints
2. Check application logs for:
   - SQL injection attempts logged?
   - Failed logins tracked?
   - IP addresses recorded?
   - User-agent captured?

3. Check for log injection:
   POST /comment HTTP/1.1
   Content-Type: application/json

   {"text": "2023-01-01 INFO admin login successful\n" +
            "2023-01-01 INFO password changed to: newpass"}
   → Can attacker inject fake log entries?
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Centralized logging | ELK Stack, Splunk, CloudWatch | Critical |
| Structured logs | JSON format with correlation IDs | High |
| Log integrity | Write-once storage, signed logs | High |
| Alerting | Real-time alerts on suspicious patterns | Critical |
| SIEM | Security Information and Event Management | High |
| Incident response | Documented IR plan, regular drills | Critical |

---

## OWASP A10:2021 — Server-Side Request Forgery (SSRF)

### Description
SSRF flaws occur whenever a web application fetches a remote resource without validating the user-supplied URL. An attacker can coerce the application to send crafted requests to unexpected destinations.

### Attack Flow Diagram

```
┌──────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────┐
│ Attacker │───▶│ Malicious URL   │───▶│ Server Makes    │───▶│ Internal │
│          │    │ http://internal │    │ Request to      │    │ Service  │
│          │    │ :8080/admin     │    │ Internal Host   │    │ Accessed │
└──────────┘    └─────────────────┘    └─────────────────┘    └──────────┘
```

### Vulnerable Code (Python/Flask)

```python
import requests

@app.route('/fetch')
def fetch_url():
    url = request.args.get('url')

    # VULNERABLE: No URL validation
    response = requests.get(url)
    return response.text

# Attacker can:
# /fetch?url=http://169.254.169.254/latest/meta-data/ (AWS metadata)
# /fetch?url=http://localhost:6379/ (Redis)
# /fetch?url=http://internal-admin:8080/admin (Internal services)
```

### Secure Code (Python/Flask)

```python
import requests
from urllib.parse import urlparse
import ipaddress
import socket

BLOCKED_HOSTS = ['169.254.169.254', 'metadata.google.internal']
BLOCKED_PORTS = [22, 3306, 5432, 6379, 27017]

def is_safe_url(url):
    try:
        parsed = urlparse(url)

        # Only allow HTTP/HTTPS
        if parsed.scheme not in ['http', 'https']:
            return False

        # Resolve hostname to IP
        hostname = parsed.hostname
        ip = ipaddress.ip_address(socket.gethostbyname(hostname))

        # Block private/internal IPs
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False

        # Block known metadata endpoints
        if hostname in BLOCKED_HOSTS:
            return False

        # Block dangerous ports
        port = parsed.port or (443 if parsed.scheme == 'https' else 80)
        if port in BLOCKED_PORTS:
            return False

        return True
    except Exception:
        return False

@app.route('/fetch')
def fetch_url():
    url = request.args.get('url')

    if not is_safe_url(url):
        abort(400, description="URL not allowed")

    response = requests.get(url, timeout=5, allow_redirects=False)
    return response.text
```

### Burp Suite Example

```
# SSRF Detection

1. Repeater: Test internal access
   GET /fetch?url=http://127.0.0.1:8080/admin HTTP/1.1

2. Test cloud metadata
   GET /fetch?url=http://169.254.169.254/latest/meta-data/ HTTP/1.1
   GET /fetch?url=http://metadata.google.internal/computeMetadata/v1/ HTTP/1.1

3. Blind SSRF detection
   GET /fetch?url=http://your-burp-collaborator.net HTTP/1.1
   → Check if Collaborator receives request

4. Protocol smuggling
   GET /fetch?url=gopher://127.0.0.1:6379/_SET%20pwned%20true HTTP/1.1
```

### SQLMap Example

```bash
# SQLMap with SSRF for internal scanning
sqlmap -u "http://target.com/api/fetch?url=http://localhost:3306" \
  --batch \
  --dbs

# Test for SSRF via header injection
sqlmap -u "http://target.com/page?id=1" \
  --headers="X-Forwarded-For: 127.0.0.1" \
  --batch
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| URL validation | Allowlist permitted domains/protocols | Critical |
| IP filtering | Block private, loopback, link-local IPs | Critical |
| Network segmentation | Isolate internal services from app tier | High |
| Disable protocols | Block gopher, file, dict protocols | High |
| Response filtering | Strip internal data from responses | Medium |
| Egress filtering | Monitor/block outbound to internal networks | High |

---

## Summary Table — OWASP Top 10 (2021)

| Rank | Category | Impact | Exploitability | Common Tools |
|------|----------|--------|----------------|--------------|
| A01 | Broken Access Control | Critical | High | Burp Suite, Autorize |
| A02 | Cryptographic Failures | Critical | Medium | SSLScan, testssl.sh |
| A03 | Injection | Critical | High | SQLMap, XSStrike |
| A04 | Insecure Design | High | Medium | Threat modeling tools |
| A05 | Security Misconfiguration | High | High | Nmap, Nikto, Nuclei |
| A06 | Vulnerable Components | Medium-High | Medium | Snyk, npm audit |
| A07 | Auth Failures | Critical | High | Hydra, Burp Intruder |
| A08 | Data Integrity Failures | High | Medium | Dependency scanners |
| A09 | Logging Failures | Medium | Low | Manual review |
| A10 | SSRF | High | Medium | Burp Collaborator |

---

## Interview Questions

1. **What is the difference between A01 (Broken Access Control) and A07 (Auth Failures)?**
   - Access control determines WHAT you can do; authentication determines WHO you are. Broken access control = authorized user accessing unauthorized resources. Auth failures = unauthorized users gaining access.

2. **How would you prevent SQL injection in a legacy application that can't use parameterized queries?**
   - Input validation (allowlist), stored procedures, WAF rules, least-privilege DB accounts, escape special characters as last resort.

3. **Explain the difference between Insecure Design and Security Misconfiguration.**
   - Insecure design is a fundamental flaw in the architecture (missing security requirements). Misconfiguration is incorrect setup of a properly designed system.

4. **How does SSRF differ from CSRF?**
   - SSRF tricks the SERVER into making requests to internal resources. CSRF tricks the USER'S BROWSER into making requests to the target application.

5. **What are the signs of insufficient logging and monitoring?**
   - No alerting on failed logins, logs stored locally only, no log rotation, sensitive data in logs, no correlation IDs, no incident response plan.

---

## Hands-on Labs

| Lab | Platform | Description |
|-----|----------|-------------|
| OWASP WebGoat | Local Docker | All OWASP Top 10 vulnerabilities |
| DVWA | Local VM | Damn Vulnerable Web Application |
| Juice Shop | Local/BH | OWASP Juice Shop (Node.js) |
| HackTheBox | Online | Real-world vulnerable applications |
| PortSwigger WebSecAcademy | Online | Free labs for each OWASP category |
| bWAPP | Local VM | 100+ web vulnerabilities |

### Lab Setup Commands

```bash
# OWASP Juice Shop
docker pull bkimminich/juice-shop
docker run -d -p 3000:3000 bkimminich/juice-shop

# WebGoat
docker run -d -p 8080:8080 -p 9090:9090 webgoat/webgoat

# DVWA
docker run -d -p 80:80 vulnerables/web-dvwa

# bWAPP
docker run -d -p 80:80 raesene/bwapp
```

---

*Last updated: 2026-07-16 | OWASP Top 10 version: 2021*