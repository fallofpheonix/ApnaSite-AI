# Authentication Flaws — Comprehensive Guide

## What is it?

Authentication flaws are vulnerabilities that allow attackers to compromise user identity verification mechanisms. These include broken authentication, weak password policies, credential stuffing attacks, and improper session token handling. They arise from poor implementation of login systems, credential storage, and account recovery processes.

## Why Learn It?

Weak authentication is one of the most exploited attack vectors in real-world breaches. Attackers leverage credential stuffing, brute force, and session hijacking to gain unauthorized access. Mastering authentication security is essential for protecting user accounts and sensitive data.

## You Will Learn

- Broken Authentication and authorization bypass techniques
- Session Management weaknesses and token prediction
- Credential Stuffing and password spraying attacks
- Multi-Factor Authentication bypass methods
- Secure credential storage using hashing and salting
- Account enumeration and lockout bypass

## Prerequisites

- Access Control (RBAC, ABAC, least privilege principles)
- Cryptography (hashing algorithms, salt, pepper, key derivation)

## Related Topics

- Session Management
- Secure Coding
- OWASP Top 10

---

## Web Architecture — Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER / ATTACKER                              │
│                   (Browser, curl, Burp Suite, Hydra)                │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Login Request (Username/Password/MFA)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: FRONTEND                               │
│              (Login Form, MFA Prompt, CAPTCHA)                      │
│                                                                     │
│  ◆ Client-side validation (bypassable!)                            │
│  ◆ CAPTCHA can be solved by services                               │
│  ◆ JavaScript reveals logic flaws                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ POST /login {username, password}
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: APPLICATION SERVER                      │
│            (Authentication Logic, Session Creation)                  │
│                                                                     │
│  ◆ Username Enumeration (different error messages)                 │
│  ◆ Rate Limiting (or lack thereof)                                 │
│  ◆ Password Policy Enforcement                                     │
│  ◆ MFA Verification                                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Query / Credential Check
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: DATA STORE                              │
│              (User DB, Credential Vault, HSM)                        │
│                                                                     │
│  ◆ Password Hashing (bcrypt, scrypt, Argon2)                       │
│  ◆ Salt Storage (per-user salt)                                    │
│  ◆ Credential History (breach database check)                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Attack Flow Diagram — Authentication Bypass

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Reconnaissance │───▶│ Determine      │
│          │    │ (Find Login    │    │ Auth Type      │
│          │    │  Endpoint)     │    │ (Form, API)    │
└──────────┘    └────────────────┘    └────────┬───────┘
                                               │
              ┌────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ATTACK VECTORS                                  │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│ Brute Force  │ Credential   │ Password     │ Session               │
│ (Try all     │ Stuffing     │ Spraying     │ Hijacking             │
│  passwords)  │ (Leaked      │ (Common      │ (Steal                │
│              │  combos)     │  passwords)  │  tokens)              │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXPLOITATION                                    │
│  → Account Takeover                                                 │
│  → Privilege Escalation                                             │
│  → Lateral Movement                                                 │
│  → Data Exfiltration                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Broken Authentication

### Description
Broken authentication encompasses flaws in login mechanisms, credential management, and session handling that allow attackers to compromise user accounts.

### Vulnerable Code (Node.js)

```javascript
// VULNERABLE: Broken authentication
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // VULNERABLE: Username enumeration
  const user = await db.users.findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'User not found' }); // Different message
  }

  // VULNERABLE: No password attempt limit
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Wrong password' }); // Different message
  }

  // VULNERABLE: Weak session token
  const token = Math.random().toString(36).substring(7);
  res.json({ token });
});

// VULNERABLE: No password change verification
app.post('/change-password', async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.session.userId;

  // No current password check!
  await db.users.updatePassword(userId, newPassword);
  res.json({ success: true });
});

// VULNERABLE: Password reset token not time-limited
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // Token never expires
  const reset = await db.resets.findByToken(token);
  if (reset) {
    await db.users.updatePassword(reset.userId, newPassword);
    res.json({ success: true });
  }
});
```

### Secure Code (Node.js)

```javascript
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many attempts, try again later',
  skipSuccessfulRequests: true
});

app.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  const user = await db.users.findByUsername(username);
  if (!user) {
    // SECURE: Generic error message
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    // Track failed attempt
    await db.audit.log({
      userId: user.id,
      action: 'login_failed',
      ip: req.ip,
      timestamp: new Date()
    });

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // SECURE: Generate cryptographically secure token
  const token = crypto.randomBytes(32).toString('hex');

  // SECURE: Store session with metadata
  await db.sessions.create({
    userId: user.id,
    token: token,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000) // 1 hour
  });

  // SECURE: Set secure cookie
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600000
  });

  res.json({ success: true });
});

// SECURE: Password change with current password verification
app.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  const user = await db.users.findById(userId);

  // Verify current password
  if (!await bcrypt.compare(currentPassword, user.password)) {
    return res.status(403).json({ error: 'Current password incorrect' });
  }

  // Password strength validation
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'Password too weak' });
  }

  // Hash and update
  const hashed = await bcrypt.hash(newPassword, 12);
  await db.users.updatePassword(userId, hashed);

  // Invalidate all other sessions
  await db.sessions.deleteAllExcept(userId, req.session.id);

  res.json({ success: true });
});

// SECURE: Password reset with expiration
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  const reset = await db.resets.findByToken(token);

  if (!reset || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  // Invalidate token after use
  await db.resets.delete(token);

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.users.updatePassword(reset.userId, hashed);

  // Invalidate all sessions
  await db.sessions.deleteAllForUser(reset.userId);

  res.json({ success: true });
});

function isStrongPassword(password) {
  return password.length >= 12 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password) &&
         /[^A-Za-z0-9]/.test(password);
}
```

---

## 2. Credential Stuffing

### Description
Credential stuffing uses username/password pairs from data breaches to attempt login on other services. Attackers rely on password reuse across platforms.

### Attack Flow

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Data Breach  │───▶│ Credential      │───▶│ Automated Login  │
│ (LinkedIn,   │    │ Dumps           │    │ Attempts on      │
│  Yahoo, etc) │    │ (combo lists)   │    │ Target Service   │
└──────────────┘    └─────────────────┘    └──────────────────┘
                                                     │
                     ┌───────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     RESULTS ANALYSIS                                │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│ Successful      │ Rate Limited    │ Account Locked                  │
│ Login           │                 │                                 │
│ → Account       │ → Try slower    │ → Try different IP              │
│   Takeover      │   rotation      │   / User-Agent                  │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

### Burp Suite Example

```
# Credential Stuffing Detection

1. Intruder: Attack type — Sniper
   POST /login HTTP/1.1
   Content-Type: application/json

   {"username":"§admin§","password":"§password§"}

2. Payloads: Load combo list (email:password format)
   File: credentials.txt

3. Grep Match: "Welcome", "Dashboard", "200 OK"
   Grep Extract: Response body, Set-Cookie

4. Analysis:
   - Same response length for all = likely blocked
   - Different response for valid users = enumeration
   - No rate limiting = vulnerable to stuffing

5. Defense detection:
   - Check for CAPTCHA after N attempts
   - Monitor for IP rotation patterns
   - Look for consistent User-Agent strings
```

### SQLMap Example

```bash
# Check if credential stuffing can be detected via injection
sqlmap -u "http://target.com/login" \
  --data="username=admin&password=pass" \
  --batch \
  --passwords \
  --dump -T users \
  --where="username='admin'"

# Test for timing differences (username enumeration)
sqlmap -u "http://target.com/login" \
  --data="username=admin&password=wrong" \
  --batch \
  --time-sec=5
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Rate limiting | Per-IP, per-account throttling | Critical |
| Breach database check | Have I Been Pwned API, k-anonymity | High |
| Credential hashing | bcrypt/scrypt with high cost factor | Critical |
| Account lockout | Progressive delays after failed attempts | High |
| CAPTCHA | After N failed attempts | Medium |
| Device fingerprinting | Detect unusual login patterns | High |
| Login notifications | Alert users on new device/location | Medium |

---

## 3. Brute Force Attacks

### Description
Brute force attacks systematically try every possible password combination until the correct one is found. Variations include dictionary attacks, rule-based attacks, and rainbow table attacks.

### Attack Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BRUTE FORCE VARIANTS                            │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ Dictionary Attack│ Rule-Based       │ Rainbow Table                 │
│ (Common words)   │ (Password        │ (Precomputed                  │
│                  │  mutations)      │  hash lookups)                │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ password123      │ Password123!     │ MD5 hash → original           │
│ letmein          │ l3tm31n          │ SHA1 hash → original          │
│ qwerty           │ Qw3rty!          │ No computation needed         │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### Burp Suite Intruder Attack

```
# Brute Force Setup

1. Intercept login request
2. Send to Intruder
3. Attack type: Sniper
4. Set position: password field
   POST /login HTTP/1.1
   username=admin&password=§payload§

5. Payloads:
   Type: Runtime file
   File: /usr/share/wordlists/rockyou.txt

6. Grep Match:
   - "Welcome" (success)
   - "Invalid" (failure)
   - "Locked" (lockout)

7. Resource Pool:
   - Concurrent requests: 10
   - Delay: 100ms between requests
   - Timeout: 30 seconds

8. Results analysis:
   - Sort by response length
   - Different length = potential success
   - Monitor for lockout messages
```

### Hydra Example

```bash
# HTTP POST brute force
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  target.com http-post-form \
  "/login:username=^USER^&password=^PASS^:Invalid credentials"

# With cookies
hydra -l admin -P passwords.txt \
  target.com http-post-form \
  "/login:username=^USER^&password=^PASS^:Invalid:Cookie=token=abc123"

# SSH brute force
hydra -l root -P /usr/share/wordlists/rockyou.txt \
  ssh://target.com

# FTP brute force
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  ftp://target.com
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Account lockout | 5 failed attempts → 15 min lock | Critical |
| Progressive delays | 1s, 2s, 4s, 8s between attempts | High |
| CAPTCHA | After 3 failed attempts | High |
| IP blocking | Block after 10 failed attempts from IP | Medium |
| Password policy | Min 12 chars, complexity, breach check | Critical |
| Login notifications | Alert on failed attempts | Medium |
| Multi-factor auth | Require MFA for sensitive accounts | Critical |

---

## 4. Session Fixation

### Description
Session fixation occurs when an attacker can set a user's session token before authentication, then hijack the session after the user logs in.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Obtain Valid   │───▶│ Inject Token   │
│          │    │ Session Token  │    │ into Victim's  │
│          │    │ (or Create)    │    │ Browser        │
└──────────┘    └────────────────┘    └────────┬───────┘
                                               │
                                               ▼
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Victim   │───▶│ Visits Site    │───▶│ Session Cookie │
│ Clicks   │    │ with Fixed     │    │ Already Set    │
│ Link     │    │ Token          │    │ (Attacker's)   │
└──────────┘    └────────────────┘    └────────────────┘
                                               │
                                               ▼
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Victim   │───▶│ Logs In        │───▶│ Session Now    │
│ Authentic│    │                │    │ Authenticated  │
│ ates     │    │                │    │ (Same Token)   │
└──────────┘    └────────────────┘    └────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Attacker uses the known session token to access victim's account    │
└─────────────────────────────────────────────────────────────────────┘
```

### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Session fixation
session_start();

// Session ID from URL is accepted
// URL: ?PHPSESSID=attacker_known_value

$username = $_POST['username'];
$password = $_POST['password'];

if (authenticate($username, $password)) {
    $_SESSION['user_id'] = get_user_id($username);
    // Session ID NOT regenerated!
    // Attacker's pre-set session ID now authenticated
    echo "Logged in";
}
?>
```

### Secure Code (PHP)

```php
<?php
// SECURE: Prevent session fixation
session_start();

// Regenerate session ID on authentication
$username = $_POST['username'];
$password = $_POST['password'];

if (authenticate($username, $password)) {
    // Regenerate session ID
    session_regenerate_id(true);

    $_SESSION['user_id'] = get_user_id($username);
    $_SESSION['login_time'] = time();
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];

    echo "Logged in";
}

// SECURE: Reject session IDs from URLs
// Use only cookies for session transport
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);
?>
```

### Burp Suite Example

```
# Session Fixation Testing

1. Request session token:
   GET /login HTTP/1.1
   → Note Set-Cookie: PHPSESSID=abc123

2. Set token in browser/Repeater:
   Cookie: PHPSESSID=attacker_known_value

3. Login with fixed token:
   POST /login HTTP/1.1
   Cookie: PHPSESSID=attacker_known_value
   username=user&password=pass

4. Check if token changed:
   → If same token = session fixation vulnerability

5. Use fixed token to hijack session:
   GET /dashboard HTTP/1.1
   Cookie: PHPSESSID=attacker_known_value
   → If access granted = confirmed vulnerability
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Session regeneration | Regenerate ID on login | Critical |
| Cookie-only transport | Disable URL session IDs | Critical |
| Strict mode | Reject uninitialized sessions | High |
| Session timeout | Absolute and idle timeouts | High |
| Secure flags | HttpOnly, Secure, SameSite | Critical |
| Session invalidation | On logout, password change | High |

---

## 5. Password Spraying

### Description
Password spraying is a brute force variation where a small number of common passwords are tried against many accounts, avoiding account lockout.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Obtain User    │───▶│ Try Common     │
│          │    │ List (LinkedIn,│    │ Passwords      │
│          │    │ Email, GitHub) │    │ Against All    │
└──────────┘    └────────────────┘    └────────────────┘
                                               │
              ┌────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Password: "Password123!"                                            │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│ user1@corp   │ user2@corp   │ user3@corp   │ admin@corp            │
│ ✗ Failed     │ ✓ Success    │ ✗ Failed     │ ✗ Failed              │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
```

### Common Passwords Used in Spraying

```bash
# Common corporate passwords
Password1!
Password123!
Welcome1!
Summer2024!
Winter2024!
Company1!
Changeit1!
Admin123!
Qwerty123!
Letmein1!
```

### Burp Suite Example

```
# Password Spraying Detection

1. Intruder: Cluster bomb attack type
   POST /login HTTP/1.1

   username=§user§&password=§pass§

2. Payloads:
   Position 1 (user): userlist.txt (1000 users)
   Position 2 (pass): passwords.txt (10 common passwords)

3. Results analysis:
   - Total requests: 10,000 (1000 × 10)
   - No lockout = vulnerable
   - Different response for successful login = enumeration

4. Timing analysis:
   - If all responses take same time = likely blocked
   - If some responses faster = possible success indicator
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Account lockout | Lock after 3 failed attempts | Critical |
| Breach database | Check against Have I Been Pwned | High |
| Password policy | Enforce complexity requirements | High |
| MFA enforcement | Require for all accounts | Critical |
| Login monitoring | Alert on spray patterns | High |
| Smart lockout | Progressive delays per account | High |

---

## 6. Multi-Factor Authentication (MFA) Bypass

### Description
MFA bypass techniques exploit weaknesses in the second authentication factor, allowing attackers to circumvent MFA protections.

### Attack Vectors

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MFA BYPASS TECHNIQUES                           │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ SMS Interception │ MFA Fatigue      │ SIM Swapping                 │
│ (SS7 Attack)     │ (Push Bombing)   │ (Social Engineering)         │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ SS7 protocol     │ Spam MFA push    │ Contact carrier,             │
│ vulnerabilities  │ notifications    │ transfer number              │
│ intercept SMS    │ until user       │                              │
│ codes            │ approves         │                              │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Backup Code      │ TOTP Theft       │ OAuth Token                  │
│ Enumeration      │ (Phishing)       │ Hijacking                    │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Try common       │ Fake login page  │ Steal authorization          │
│ backup codes     │ captures TOTP    │ code in OAuth flow           │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### Vulnerable Code (Node.js)

```javascript
// VULNERABLE: MFA bypass via backup code enumeration
app.post('/verify-mfa', async (req, res) => {
  const { userId, code } = req.body;

  const user = await db.users.findById(userId);

  // VULNERABLE: No rate limiting on backup codes
  if (user.backupCodes.includes(code)) {
    // Backup code not invalidated after use!
    return res.json({ success: true, token: generateToken(user) });
  }

  // VULNERABLE: TOTP with large window
  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: code,
    window: 10 // 10 time steps = 5 minutes tolerance!
  });

  if (verified) {
    return res.json({ success: true, token: generateToken(user) });
  }

  return res.status(401).json({ error: 'Invalid code' });
});

// VULNERABLE: MFA not enforced for sensitive operations
app.post('/transfer', async (req, res) => {
  const { amount, to } = req.body;
  const userId = req.session.userId;

  // No MFA check for transfers!
  await transfer(userId, to, amount);
  res.json({ success: true });
});
```

### Secure Code (Node.js)

```javascript
// SECURE: MFA verification with rate limiting
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts'
});

app.post('/verify-mfa', mfaLimiter, async (req, res) => {
  const { userId, code } = req.body;

  const user = await db.users.findById(userId);

  // Check if MFA is required
  if (!user.mfaEnabled) {
    return res.status(400).json({ error: 'MFA not enabled' });
  }

  // Check if account is locked
  if (user.mfaAttempts >= 5) {
    return res.status(423).json({ error: 'Account locked' });
  }

  let verified = false;

  // Check TOTP first (primary factor)
  verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: code,
    window: 1 // 30 seconds tolerance only
  });

  // If TOTP failed, check backup codes
  if (!verified && user.backupCodes.includes(code)) {
    verified = true;

    // Invalidate used backup code
    await db.users.removeBackupCode(userId, code);

    // Log backup code usage (unusual activity)
    await db.audit.log({
      userId,
      action: 'backup_code_used',
      ip: req.ip,
      timestamp: new Date()
    });
  }

  if (!verified) {
    await db.users.incrementMfaAttempts(userId);
    return res.status(401).json({ error: 'Invalid code' });
  }

  // Reset attempts on success
  await db.users.resetMfaAttempts(userId);

  // Regenerate session
  req.session.regenerate();

  return res.json({ success: true, token: generateToken(user) });
});

// SECURE: MFA required for sensitive operations
app.post('/transfer', authenticate, requireMFA, async (req, res) => {
  const { amount, to } = req.body;
  const userId = req.session.userId;

  // Additional verification for large transfers
  if (amount > 10000) {
    const additionalCode = req.headers['x-mfa-code'];
    if (!additionalCode || !verifyMFA(userId, additionalCode)) {
      return res.status(403).json({ error: 'Additional MFA required' });
    }
  }

  await transfer(userId, to, amount);
  res.json({ success: true });
});
```

### Burp Suite Example

```
# MFA Bypass Testing

1. Test backup code enumeration:
   POST /verify-mfa HTTP/1.1
   {"userId": 1, "code": "000000"}
   → Try 000000-999999

2. Test TOTP replay:
   Capture valid TOTP code
   Reuse same code in Repeater
   → If accepted = no replay protection

3. Test MFA bypass via direct access:
   GET /admin/dashboard HTTP/1.1
   Cookie: session=valid_token
   → Skip MFA verification step

4. Test push notification bombing:
   Send 100 MFA push requests
   → User may accidentally approve one

5. Test OAuth flow:
   Complete OAuth without MFA
   Intercept authorization code
   Use code to get access token
```

### SQLMap Example

```bash
# Check if MFA can be bypassed via injection
sqlmap -u "http://target.com/verify-mfa" \
  --data="userId=1&code=123456" \
  --batch \
  --technique=B \
  --sql-query="SELECT mfa_enabled FROM users WHERE id=1"

# Test for MFA status disclosure
sqlmap -u "http://target.com/api/user?id=1" \
  --batch \
  --dump -T users \
  --columns="id,username,mfa_enabled,totp_secret"
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Rate limiting | Max 5 MFA attempts per 15 min | Critical |
| Account lockout | Lock after 10 failed MFA attempts | High |
| Backup codes | One-time use, stored securely | Critical |
| Push notification signing | Verify push origin | High |
| MFA for sensitive ops | Require for transfers, password changes | Critical |
| FIDO2/WebAuthn | Hardware key phishing resistance | Critical |
| Risk-based MFA | Step-up auth for suspicious activity | High |

---

## Credential Storage Best Practices

### Hashing Algorithms Comparison

| Algorithm | Type | Cost Factor | Time (bcrypt) | Recommendation |
|-----------|------|-------------|---------------|----------------|
| MD5 | Fast | N/A | 0.001ms | NEVER USE |
| SHA-1 | Fast | N/A | 0.001ms | NEVER USE |
| SHA-256 | Fast | N/A | 0.001ms | With salt only |
| bcrypt | Slow | 12 | 250ms | Recommended |
| scrypt | Slow | 14 | 350ms | Recommended |
| Argon2id | Slow | Memory-hard | 500ms | Best choice |

### Secure Hashing Implementation

```python
import bcrypt
import hashlib
import os

# SECURE: bcrypt with proper cost factor
def hash_password_bcrypt(password):
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

# SECURE: Argon2id (best choice)
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=3,        # Number of iterations
    memory_cost=65536,  # 64MB memory usage
    parallelism=4       # Number of threads
)

def hash_password_argon2(password):
    return ph.hash(password)

# SECURE: Pepper (additional secret key)
PEPPER = os.environ.get('PEPPER')

def hash_with_pepper(password):
    peppered = password + PEPPER
    return bcrypt.hashpw(peppered.encode(), bcrypt.gensalt(12)).decode()

def verify_with_pepper(password, hashed):
    peppered = password + PEPPER
    return bcrypt.checkpw(peppered.encode(), hashed.encode())
```

---

## Summary Table — Authentication Flaws

| Attack | Method | Impact | Detection Difficulty | Prevention |
|--------|--------|--------|---------------------|------------|
| Broken Authentication | Logic flaws | Account takeover | Medium | Secure coding practices |
| Credential Stuffing | Breach combos | Mass account compromise | High | Rate limiting, breach checks |
| Brute Force | Try all passwords | Account compromise | Medium | Lockout, CAPTCHA, MFA |
| Session Fixation | Fix session ID | Session hijacking | Low | Session regeneration |
| Password Spraying | Common passwords | Account compromise | High | MFA, password policy |
| MFA Bypass | Various techniques | MFA circumvention | High | FIDO2, risk-based auth |

---

## Interview Questions

1. **What is the difference between brute force and credential stuffing?**
   - Brute force tries all possible passwords for one account. Credential stuffing uses leaked username/password pairs from other breaches on multiple accounts.

2. **How does session fixation differ from session hijacking?**
   - Session fixation: Attacker sets victim's session token BEFORE authentication. Session hijacking: Attacker steals an already-authenticated session token.

3. **What makes a good password policy?**
   - Minimum 12 characters, complexity requirements, check against breach databases, no forced regular rotation (NIST 800-63B), support for passphrases.

4. **How do you prevent username enumeration?**
   - Generic error messages ("Invalid credentials"), consistent response times, same error for wrong username and wrong password.

5. **Explain MFA fatigue attacks and how to prevent them.**
   - MFA fatigue: Attacker spams push notifications until user approves. Prevent with number matching, rate limiting pushes, requiring location verification.

6. **What is the role of pepper in password hashing?**
   - Pepper is a secret key added to passwords before hashing, stored separately from the database. Even if database is compromised, attacker needs the pepper to crack passwords.

7. **How do you handle password reset securely?**
   - Time-limited tokens (1 hour), one-time use, invalidate on use, send via secure channel, require identity verification, notify user of reset.

---

## Hands-on Labs

| Lab | Platform | Description |
|-----|----------|-------------|
| Brute Force Labs | PortSwigger | HTTP brute force, credential stuffing |
| DVWA | Local VM | Brute force and authentication bypass |
| WebGoat | Docker | Broken authentication challenges |
| HackTheBox | Online | Authentication bypass challenges |
| CrackStation | Online | Password hash cracking practice |
| Have I Been Pwned | Online | Check if passwords are breached |

### Lab Setup Commands

```bash
# DVWA - Authentication challenges
docker run -d -p 80:80 vulnerables/web-dvwa
# Set security to Low/High/Medium

# WebGoat - Broken Authentication
docker run -d -p 8080:8080 -p 9090:9090 webgoat/webgoat

# Hydra practice
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  192.168.1.100 http-post-form \
  "/login:username=^USER^&password=^PASS^:Invalid"

# Hash cracking practice
hashcat -m 0 hash.txt rockyou.txt  # MD5
hashcat -m 3200 hash.txt rockyou.txt  # bcrypt
john --wordlist=rockyou.txt hash.txt  # John the Ripper
```

---

*Last updated: 2026-07-16 | OWASP Reference: A07:2021 — Identification and Authentication Failures*