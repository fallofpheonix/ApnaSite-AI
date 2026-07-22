# Secure Coding — Comprehensive Guide

## What is it?

Secure coding is the practice of developing software that resists security vulnerabilities by design. It encompasses input validation, output encoding, error handling, and following a Secure Software Development Lifecycle (SSDLC). The goal is to eliminate vulnerabilities at the source rather than patching them after deployment.

## Why Learn It?

The majority of security breaches stem from insecure code. Secure coding practices reduce the attack surface and prevent entire classes of vulnerabilities before they reach production. It is a required skill for developers working in security-sensitive environments.

## You Will Learn

- Input Validation using allowlists and schema validation
- Output Encoding to prevent injection and XSS
- Parameterized Queries for SQL injection prevention
- Content Security Policy (CSP) configuration
- Secure Software Development Lifecycle (SSDLC) phases
- Code Review for security vulnerabilities

## Prerequisites

- Injection Attacks (understanding what you are preventing)
- Authentication Flaws (securing identity-related code)

## Related Topics

- OWASP Top 10
- Penetration Testing
- Secure Architecture

---

## Web Architecture — Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT PHASE                               │
│         (IDE, Pre-commit Hooks, SAST, Code Review)                 │
│                                                                     │
│  ◆ Input validation at code entry points                           │
│  ◆ Static Analysis (SAST) scans                                    │
│  ◆ Peer code review for security                                   │
│  ◆ Secure coding standards                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Compiled Code / Deployed
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: INPUT PROCESSING                        │
│             (Request Parsing, Validation, Sanitization)             │
│                                                                     │
│  ◆ Schema validation (JSON, XML, form data)                        │
│  ◆ Type checking and length limits                                 │
│  ◆ Whitelist validation                                            │
│  ◆ Parameterized query preparation                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Validated Data
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: BUSINESS LOGIC                          │
│             (Authorization, State Changes, Data Processing)         │
│                                                                     │
│  ◆ Access control checks                                           │
│  ◆ Business rule validation                                        │
│  ◆ State machine enforcement                                       │
│  ◆ Rate limiting                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Processed Data
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: OUTPUT ENCODING                         │
│            (Context-Aware Encoding, CSP, Security Headers)          │
│                                                                     │
│  ◆ HTML entity encoding                                            │
│  ◆ JavaScript encoding                                             │
│  ◆ URL encoding                                                    │
│  ◆ CSS encoding                                                    │
│  ◆ Content Security Policy headers                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Encoded Output
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 4: MONITORING & RESPONSE                   │
│            (Logging, Alerting, Incident Response)                   │
│                                                                     │
│  ◆ Security event logging                                          │
│  ◆ Anomaly detection                                               │
│  ◆ Audit trails                                                    │
│  ◆ Incident response procedures                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Attack Flow Diagram — Secure Coding Defenses

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY DEFENSE LAYERS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ATTACK: SQL Injection                                             │
│  ┌─────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Input   │───▶│ Parameterized│───▶│ Query Safe   │              │
│  │ Payload │    │ Query        │    │              │              │
│  └─────────┘    └──────────────┘    └──────────────┘              │
│                                                                     │
│  ATTACK: XSS                                                      │
│  ┌─────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Script  │───▶│ Output       │───▶│ Safe HTML    │              │
│  │ Payload │    │ Encoding     │    │              │              │
│  └─────────┘    └──────────────┘    └──────────────┘              │
│                                                                     │
│  ATTACK: Command Injection                                        │
│  ┌─────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ OS Cmd  │───▶│ Input        │───▶│ Rejected     │              │
│  │ Payload │    │ Validation   │    │              │              │
│  └─────────┘    └──────────────┘    └──────────────┘              │
│                                                                     │
│  ATTACK: CSRF                                                     │
│  ┌─────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Forced  │───▶│ CSRF Token   │───▶│ Request      │              │
│  │ Request │    │ Validation   │    │ Rejected     │              │
│  └─────────┘    └──────────────┘    └──────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Input Validation

### Description
Input validation ensures that data submitted by users conforms to expected formats, types, and ranges before processing. It's the first line of defense against injection attacks.

### Validation Strategies

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INPUT VALIDATION STRATEGIES                      │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ Allowlist        │ Blocklist        │ Schema Validation             │
│ (Whitelist)      │ (Blacklist)      │                               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Accept known     │ Reject known     │ Validate against             │
│ good patterns    │ bad patterns     │ JSON Schema / XML Schema     │
│                  │                  │                               │
│ Safer (can't     │ Less safe (new   │ Comprehensive                 │
│ bypass by novel  │ attacks bypass)  │ Type-safe                     │
│ attacks)         │                  │                               │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### Vulnerable Code (Python)

```python
# VULNERABLE: No input validation
@app.route('/search')
def search():
    query = request.args.get('q')
    # No validation - accepts anything
    results = db.execute(f"SELECT * FROM products WHERE name LIKE '%{query}%'")
    return results

@app.route('/create', methods=['POST'])
def create():
    data = request.get_json()
    # No validation
    user = db.users.create(
        name=data['name'],        # Could be SQL injection
        email=data['email'],      # Could be invalid format
        age=data['age']           # Could be negative or string
    )
    return user

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    # No validation
    file.save(f'uploads/{file.filename}')  # Path traversal!
    return 'Uploaded'
```

### Secure Code (Python)

```python
from marshmallow import Schema, fields, validate
import re
import os

# SECURE: Schema validation with Marshmallow
class CreateUserSchema(Schema):
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    email = fields.Email(required=True)
    age = fields.Int(
        required=True,
        validate=validate.Range(min=0, max=150)
    )

@app.route('/create', methods=['POST'])
def create():
    data = request.get_json()

    # Validate against schema
    schema = CreateUserSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    validated = schema.load(data)
    user = db.users.create(**validated)
    return user

# SECURE: Input validation for search
@app.route('/search')
def search():
    query = request.args.get('q', '')

    # Validate query format
    if not re.match(r'^[a-zA-Z0-9\s\-]+$', query):
        return jsonify({'error': 'Invalid search query'}), 400

    if len(query) > 100:
        return jsonify({'error': 'Query too long'}), 400

    # Use parameterized query
    results = db.execute(
        "SELECT * FROM products WHERE name LIKE ?",
        [f"%{query}%"]
    )
    return results

# SECURE: File upload validation
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']

    # Validate extension
    if not file.filename:
        return 'No filename', 400

    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return 'Invalid file type', 400

    # Validate file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    if size > MAX_FILE_SIZE:
        return 'File too large', 400

    # Generate safe filename
    import uuid
    safe_filename = f"{uuid.uuid4().hex}.{ext}"

    file.save(f'uploads/{safe_filename}')
    return 'Uploaded'
```

### JavaScript/Node.js Validation

```javascript
const Joi = require('joi');

// VULNERABLE
app.post('/user', (req, res) => {
  const { name, email } = req.body;
  // No validation
  db.users.create({ name, email });
});

// SECURE: Joi schema validation
const userSchema = Joi.object({
  name: Joi.string().alphanum().min(1).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150).required()
});

app.post('/user', (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details });
  }

  db.users.create(value);
  res.json({ success: true });
});

// SECURE: Custom validation middleware
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details });
    }
    req.validatedBody = value;
    next();
  };
}

app.post('/user', validate(userSchema), (req, res) => {
  db.users.create(req.validatedBody);
  res.json({ success: true });
});
```

### Burp Suite Example

```
# Input Validation Testing

1. Repeater: Send invalid inputs
   POST /create HTTP/1.1
   Content-Type: application/json

   {"name":"","email":"not-an-email","age":-5}
   → Check if server validates

2. Test bypass techniques:
   {"name":"admin'--","email":"test@test.com","age":25}
   → SQL injection attempt

   {"name":"<script>alert(1)</script>","email":"x@x.com","age":25}
   → XSS attempt

3. File upload bypass:
   POST /upload HTTP/1.1
   Content-Type: multipart/form-data

   filename="shell.php.jpg"
   → Double extension bypass

   filename="shell.php%00.jpg"
   → Null byte injection

4. Use Burp Intruder for fuzzing:
   Fuzz all input fields with common payloads
   Monitor for different responses
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Allowlist validation | Accept only known-good patterns | Critical |
| Schema validation | JSON Schema, XML Schema, Marshmallow | Critical |
| Type checking | Enforce expected data types | High |
| Length limits | Maximum field lengths | High |
| Range checking | Numeric bounds validation | Medium |
| Format validation | Email, phone, URL formats | Medium |
| File validation | Extension, size, content type | High |

---

## 2. Output Encoding

### Description
Output encoding converts special characters into their safe representations for the output context (HTML, JavaScript, URL, CSS). It prevents injection attacks when user data is displayed.

### Encoding Contexts

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OUTPUT ENCODING CONTEXTS                        │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ HTML Context     │ JavaScript       │ URL Context                   │
│                  │ Context          │                               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ < becomes &lt;   │ \ becomes \\     │ Space becomes %20             │
│ > becomes &gt;   │ " becomes \"     │ / becomes %2F                 │
│ & becomes &amp;  │ ' becomes \'     │ < becomes %3C                 │
│ " becomes &quot; │ / becomes \/     │ > becomes %3E                 │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ CSS Context      │ URL Parameter    │ Attribute Context             │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ \XX encoding     │ URL encoding     │ Attribute-specific encoding   │
│ for special chars│ via encodeURIComponent │                         │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### Vulnerable Code (PHP)

```php
<?php
// VULNERABLE: No output encoding
$search = $_GET['q'];
echo "Results for: " . $search;

// VULNERABLE: JavaScript context
$user_input = $_GET['name'];
echo "<script>var name = '$user_input';</script>";

// VULNERABLE: HTML attribute
$img_src = $_GET['img'];
echo "<img src='$img_src'>";

// VULNERABLE: URL parameter
$redirect = $_GET['url'];
header("Location: " . $redirect);
?>
```

### Secure Code (PHP)

```php
<?php
// SECURE: HTML context encoding
$search = htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8');
echo "Results for: " . $search;

// SECURE: JavaScript context encoding
$user_input = htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');
echo "<script>var name = '" . $user_input . "';</script>";

// Better: Use json_encode for JavaScript
$user_input = $_GET['name'];
echo "<script>var name = " . json_encode($user_input) . ";</script>";

// SECURE: URL context encoding
$redirect = $_GET['url'];
if (filter_var($redirect, FILTER_VALIDATE_URL)) {
    header("Location: " . $redirect);
}

// SECURE: Attribute encoding
$img_src = htmlspecialchars($_GET['img'], ENT_QUOTES, 'UTF-8');
echo "<img src='$img_src'>";

// SECURE: URL parameter encoding
$search = urlencode($_GET['q']);
echo "<a href='/search?q=$search'>Search</a>";
?>
```

### JavaScript Output Encoding

```javascript
const he = require('he');

// SECURE: HTML entity encoding
function encodeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// SECURE: JavaScript encoding
function encodeJs(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// SECURE: URL encoding
function encodeUrl(str) {
  return encodeURIComponent(str);
}

// SECURE: CSS encoding
function encodeCss(str) {
  return str.replace(/[^a-zA-Z0-9]/g, (char) => {
    return '\\' + char.charCodeAt(0).toString(16) + ' ';
  });
}

// Usage with template engine (auto-escaping)
// EJS: <%= variable %> (auto-escaped)
// Pug: #{variable} (auto-escaped)
// Handlebars: {{variable}} (auto-escaped)
```

### Burp Suite Example

```
# Output Encoding Testing

1. Test HTML context:
   Search: <script>alert('XSS')</script>
   → If reflected unescaped = vulnerable

2. Test JavaScript context:
   Input: '; alert(1); //
   → If executed in script block = vulnerable

3. Test attribute context:
   Input: " onmouseover="alert(1)
   → If attribute breakout = vulnerable

4. Test URL context:
   Input: javascript:alert(1)
   → If link navigates to javascript: = vulnerable

5. Check Content-Security-Policy header:
   CSP: script-src 'self'
   → Prevents inline script execution
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Context-aware encoding | Different encoding per output context | Critical |
| Template auto-escaping | Use frameworks with auto-escaping | Critical |
| DOMPurify | Sanitize rich HTML input | High |
| CSP headers | Prevent inline script execution | High |
| Trusted Types | Browser API for DOM injection prevention | Medium |
| Output validation | Verify encoded output format | Medium |

---

## 3. Parameterized Queries

### Description
Parameterized queries (prepared statements) separate SQL code from data, preventing SQL injection by ensuring user input is treated as data, not executable code.

### How Parameterized Queries Work

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SQL QUERY EXECUTION FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  VULNERABLE (String Concatenation):                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Query: "SELECT * FROM users WHERE id=" + userInput          │   │
│  │                                                             │   │
│  │ userInput = "1 OR 1=1"                                      │   │
│  │                                                             │   │
│  │ Final: SELECT * FROM users WHERE id=1 OR 1=1               │   │
│  │        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑                │   │
│  │        Attacker's input becomes part of SQL                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SECURE (Parameterized Query):                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Query: "SELECT * FROM users WHERE id = ?" (template)       │   │
│  │ Parameters: [userInput] (data only)                        │   │
│  │                                                             │   │
│  │ userInput = "1 OR 1=1"                                      │   │
│  │                                                             │   │
│  │ Final: SELECT * FROM users WHERE id = "1 OR 1=1"          │   │
│  │        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑                │   │
│  │        Treated as literal string, not code                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Vulnerable Code (Various Languages)

```php
// VULNERABLE PHP
$username = $_POST['username'];
$query = "SELECT * FROM users WHERE username = '$username'";

// VULNERABLE Python
username = request.form['username']
query = f"SELECT * FROM users WHERE username = '{username}'"

// VULNERABLE Node.js
const username = req.body.username;
const query = `SELECT * FROM users WHERE username = '${username}'`;

// VULNERABLE Java
String username = request.getParameter("username");
String query = "SELECT * FROM users WHERE username = '" + username + "'";
```

### Secure Code (Various Languages)

```php
// SECURE PHP (MySQLi)
$username = $_POST['username'];
$stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

// SECURE PHP (PDO)
$username = $_POST['username'];
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
$stmt->execute(['username' => $username]);
$user = $stmt->fetch();
```

```python
# SECURE Python (sqlite3)
username = request.form['username']
cursor = conn.execute(
    "SELECT * FROM users WHERE username = ?",
    (username,)
)

# SECURE Python (SQLAlchemy ORM)
user = User.query.filter_by(username=username).first()
```

```javascript
// SECURE Node.js (pg)
const username = req.body.username;
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);

// SECURE Node.js (Sequelize ORM)
const user = await User.findOne({
  where: { username: username }
});
```

```java
// SECURE Java (PreparedStatement)
String username = request.getParameter("username");
String query = "SELECT * FROM users WHERE username = ?";
PreparedStatement pstmt = conn.prepareStatement(query);
pstmt.setString(1, username);
ResultSet rs = pstmt.executeQuery();
```

### ORM Usage (Object-Relational Mapping)

```python
# SECURE: SQLAlchemy ORM (Python)
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String)

# Always safe - ORM handles parameterization
user = session.query(User).filter(User.username == username).first()
user = session.query(User).filter_by(username=username).first()

# Complex queries
users = session.query(User).filter(
    User.username.like(f'%{search}%'),
    User.active == True
).all()
```

```javascript
// SECURE: Sequelize ORM (Node.js)
const user = await User.findOne({
  where: {
    username: username,
    active: true
  }
});

// Complex queries
const users = await User.findAll({
  where: {
    username: { [Op.like]: `%${search}%` },
    active: true
  },
  order: [['createdAt', 'DESC']],
  limit: 10
});
```

### Burp Suite Example

```
# Parameterized Query Verification

1. SQLMap detection:
   sqlmap -u "http://target.com/page?id=1" --batch
   → If vulnerable, parameterized queries not used

2. Manual testing in Repeater:
   GET /page?id=1' OR '1'='1 HTTP/1.1
   → If error/changed result = not parameterized

3. Test all database operations:
   - SELECT (read)
   - INSERT (create)
   - UPDATE (modify)
   - DELETE (remove)

4. Check ORM usage:
   - Find database queries in source
   - Verify parameterization or ORM usage
   - Check for raw queries bypassing ORM
```

### SQLMap Examples

```bash
# Verify parameterization
sqlmap -u "http://target.com/page?id=1" --batch --is-dba

# Test all parameters
sqlmap -u "http://target.com/page?id=1&name=test&sort=asc" \
  --batch \
  --level=5

# POST-based testing
sqlmap -u "http://target.com/search" \
  --data="q=test" \
  --batch \
  --dbs

# With authentication
sqlmap -u "http://target.com/api/users?id=1" \
  --cookie="session=abc123" \
  --batch \
  --dump -T users
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| Parameterized queries | Use prepared statements everywhere | Critical |
| ORM usage | Never concatenate SQL strings | Critical |
| Stored procedures | Pre-compiled database logic | High |
| Least privilege | DB user with minimal permissions | High |
| Input validation | Validate before querying | High |
| Query builders | Use framework query builders | High |

---

## 4. Content Security Policy (CSP)

### Description
CSP is an HTTP header that restricts which resources (scripts, styles, images) a browser can load, preventing XSS and data injection attacks.

### CSP Directives

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CSP DIRECTIVES                                   │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ default-src      │ script-src       │ style-src                     │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Fallback for     │ Controls which   │ Controls which                │
│ all resource     │ scripts can      │ stylesheets can               │
│ types            │ execute          │ be loaded                     │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ img-src          │ font-src         │ connect-src                   │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Controls which   │ Controls which   │ Controls AJAX,               │
│ images can       │ fonts can be     │ WebSocket,                    │
│ be loaded        │ loaded           │ EventSource connections       │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ frame-src        │ object-src       │ media-src                     │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Controls which   │ Controls plugins│ Controls audio/video          │
│ iframes can      │ (Flash, etc)     │ media                         │
│ be loaded        │                  │                               │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### CSP Configuration Examples

```python
# Flask
@app.after_request
def add_csp(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' https://cdn.example.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' https://api.example.com; "
        "frame-ancestors 'none'; "
        "form-action 'self'; "
        "base-uri 'self'"
    )
    return response
```

```javascript
// Express.js (helmet middleware)
const helmet = require('helmet');

app.use(helmet());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.example.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "https://api.example.com"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"]
  }
}));
```

```nginx
# Nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self'
" always;
```

### CSP Bypass Techniques

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CSP BYPASS TECHNIQUES                            │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ unsafe-inline    │ JSONP Bypass     │ Base URI Injection            │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Allows inline    │ Use JSONP end-   │ Inject base tag to            │
│ scripts          │ points to        │ redirect relative             │
│                  │ execute code     │ script loading                │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Domain Bypass    │ Data URI         │ Wildcard (*)                  │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Compromise a     │ data:text/html   │ Allows all sources            │
│ whitelisted      │ with script      │ (CSP useless)                 │
│ domain           │                  │                               │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

### Burp Suite Example

```
# CSP Testing

1. Check CSP header:
   Proxy → HTTP History → Look for Content-Security-Policy

2. Analyze CSP for weaknesses:
   - 'unsafe-inline' → Allows inline scripts
   - 'unsafe-eval' → Allows eval()
   - Broad wildcards → Too permissive
   - Missing directives → Attack surface

3. Test CSP bypass:
   If script-src includes CDN with JSONP:
   https://cdn.example.com/api?callback=alert(1)//

   If data: URI allowed:
   data:text/html,<script>alert(1)</script>

4. Test frame-ancestors:
   Create page with iframe pointing to target
   → If framed = CSP frame-ancestors missing/wrong
```

### Defense Mechanisms

| Control | Implementation | Priority |
|---------|---------------|----------|
| strict-d CSP | Start with report-only, enforce | Critical |
| No unsafe-inline | Use nonces or hashes | Critical |
| No unsafe-eval | Avoid eval(), new Function() | Critical |
| Frame ancestors | Prevent clickjacking | High |
| Report URI | Monitor CSP violations | High |
| Regular review | Audit CSP against new features | Medium |

---

## 5. Secure Software Development Lifecycle (SSDLC)

### SSDLC Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURE SDLC PHASES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │ Training │───▶│ Require- │───▶│ Design   │───▶│ Implement│    │
│  │          │    │ ments    │    │          │    │          │    │
│  │ Security │    │ Security │    │ Threat   │    │ Secure   │    │
│  │ awareness│    │ user     │    │ modeling │    │ coding   │    │
│  │          │    │ stories  │    │          │    │          │    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│       │                                             │              │
│       │    ┌──────────┐    ┌──────────┐    ┌───────▼──────┐      │
│       │    │ Deploy   │◀───│ Release  │◀───│ Verify       │      │
│       │    │          │    │          │    │              │      │
│       │    │ Secure   │    │ Security │    │ SAST, DAST,  │      │
│       │    │ config   │    │ gates    │    │ Pen Test     │      │
│       │    │          │    │          │    │              │      │
│       │    └──────────┘    └──────────┘    └──────────────┘      │
│       │                                                           │
│       │    ┌──────────────────────────────────────────────────┐   │
│       └───▶│ Respond: Incident Response, Monitoring, Audit   │   │
│            └──────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase Details

| Phase | Security Activities | Tools |
|-------|-------------------|-------|
| Training | Security awareness, secure coding training | OWASP, SANS |
| Requirements | Security user stories, compliance requirements | Threat modeling |
| Design | Threat modeling, security architecture review | STRIDE, DREAD |
| Implement | Secure coding standards, peer review | SonarQube, Checkmarx |
| Verify | SAST, DAST, penetration testing | OWASP ZAP, Burp Suite |
| Release | Security gates, code signing | CI/CD pipeline |
| Deploy | Secure configuration, hardening | Ansible, Terraform |
| Respond | Incident response, monitoring | SIEM, IDS/IPS |

### Security Requirements Example

```markdown
## Security User Stories

### Story 1: Input Validation
**As a** security engineer
**I want** all user inputs validated against a schema
**So that** injection attacks are prevented

**Acceptance Criteria:**
- All form fields have server-side validation
- API endpoints validate request body against JSON Schema
- File uploads validate extension, size, and content type
- Invalid inputs return 400 error with no sensitive information

### Story 2: Authentication
**As a** security engineer
**I want** strong authentication mechanisms
**So that** unauthorized access is prevented

**Acceptance Criteria:**
- Passwords minimum 12 characters with complexity
- MFA required for admin accounts
- Account lockout after 5 failed attempts
- Session tokens regenerated on login
```

---

## 6. Code Review for Security

### Security Code Review Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY CODE REVIEW CHECKLIST                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ INPUT HANDLING                                                      │
│ ☐ All inputs validated against schema                              │
│ ☐ Whitelist validation used (not blacklist)                        │
│ ☐ File uploads validated (type, size, content)                     │
│ ☐ URL parameters validated                                         │
│                                                                     │
│ OUTPUT ENCODING                                                     │
│ ☐ HTML context: htmlspecialchars() used                            │
│ ☐ JavaScript context: json_encode() used                           │
│ ☐ URL context: urlencode() used                                    │
│ ☐ CSS context: CSS encoding used                                   │
│                                                                     │
│ DATABASE                                                            │
│ ☐ All queries parameterized                                        │
│ ☐ ORM used where possible                                          │
│ ☐ No raw SQL with user input                                       │
│ ☐ Database user has minimal privileges                             │
│                                                                     │
│ AUTHENTICATION                                                      │
│ ☐ Passwords hashed with bcrypt/scrypt/Argon2                       │
│ ☐ Session tokens cryptographically random                          │
│ ☐ MFA available for sensitive operations                           │
│ ☐ Rate limiting on login                                           │
│                                                                     │
│ SESSION MANAGEMENT                                                  │
│ ☐ Cookies: HttpOnly, Secure, SameSite                              │
│ ☐ Session regenerated on login                                     │
│ ☐ Session invalidated on logout                                    │
│ ☐ CSRF tokens on state-changing requests                           │
│                                                                     │
│ ERROR HANDLING                                                      │
│ ☐ No sensitive data in error messages                              │
│ ☐ Generic error messages for users                                 │
│ ☐ Detailed errors logged server-side only                          │
│ ☐ Custom error pages (no stack traces)                             │
│                                                                     │
│ DEPENDENCIES                                                        │
│ ☐ No known vulnerable dependencies                                 │
│ ☐ Dependencies pinned to specific versions                         │
│ ☐ Regular dependency updates                                       │
│ ☐ SBOM generated                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Code Review Example

```python
# CODE REVIEW FINDINGS

# Finding 1: SQL Injection (Critical)
# File: app/views/users.py, Line 45
def get_user(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"  # SQL INJECTION
    return db.execute(query)

# Finding 2: XSS (High)
# File: app/templates/profile.html, Line 12
# <p>Welcome, {{ user.name | safe }}</p>  # XSS - 'safe' disables escaping

# Finding 3: Weak Password Hashing (High)
# File: app/auth.py, Line 78
password_hash = hashlib.md5(password.encode()).hexdigest()  # MD5 - WEAK

# Finding 4: Missing CSRF Protection (High)
# File: app/views/transfer.py, Line 23
@app.route('/transfer', methods=['POST'])
def transfer():  # No CSRF token validation
    amount = request.form['amount']
    to = request.form['to']
    process_transfer(amount, to)

# Finding 5: Information Disclosure (Medium)
# File: app/errors.py, Line 15
@app.errorhandler(500)
def error(e):
    return jsonify({
        'error': str(e),  # Exposes internal error details
        'traceback': traceback.format_exc()  # Stack trace exposed
    }), 500
```

### Static Analysis Tools

```bash
# Python
bandit -r app/ -f json -o report.json
pylint --load-plugins=pylint_flask app/

# JavaScript/Node.js
npm audit
eslint --plugin security .
sonarqube-scanner

# Java
spotbugs -effort:max -low app/
findbugs -html -output report.html

# Go
gosec ./...
staticcheck ./...

# Ruby
brakeman -f json
rubocop --require security
```

### Burp Suite Code Analysis

```
# Code-Based Testing

1. Check for hardcoded secrets:
   Search in JS files: password, secret, api_key, token
   grep -r "password\s*=" client/
   grep -r "api_key\s*=" client/

2. Check for insecure deserialization:
   Search for: eval(), exec(), pickle.loads()
   → These can execute arbitrary code

3. Check for open redirects:
   Search for: redirect(), Location header with user input
   → Test with: /redirect?url=https://evil.com

4. Check for path traversal:
   Search for: open(), read(), file operations with user input
   → Test with: ../../../etc/passwd
```

---

## Secure Coding Summary Table

| Category | Primary Defense | Common Mistakes | Priority |
|----------|----------------|-----------------|----------|
| Input Validation | Allowlist + Schema | No validation, blacklist only | Critical |
| Output Encoding | Context-aware encoding | No encoding, wrong context | Critical |
| Parameterized Queries | Prepared statements | String concatenation | Critical |
| Password Storage | bcrypt/Argon2id | MD5, SHA1, no salt | Critical |
| Session Management | Secure cookie flags | No HttpOnly, no Secure | Critical |
| CSRF Protection | Tokens + SameSite | No protection | Critical |
| Error Handling | Generic messages | Stack traces exposed | High |
| CSP | strict-d policy | unsafe-inline, unsafe-eval | High |
| Dependencies | Regular updates | Outdated libraries | High |
| Logging | Structured logs | Sensitive data in logs | Medium |

---

## Interview Questions

1. **What is the difference between input validation and output encoding?**
   - Input validation checks if data conforms to expected format before processing. Output encoding converts special characters for safe display in specific contexts.

2. **Explain parameterized queries and why they prevent SQL injection.**
   - Parameterized queries separate SQL code from data. User input is treated as data, not executable code. The database engine never interprets parameters as SQL.

3. **What makes a good Content Security Policy?**
   - Starts with restrictive defaults, no unsafe-inline/unsafe-eval, uses nonces for inline scripts, reports violations, regularly reviewed.

4. **How does the Secure SDLC differ from traditional SDLC?**
   - SSDLC integrates security at every phase: threat modeling in design, secure coding in implementation, SAST/DAST in testing, security gates before release.

5. **What should you look for in a security code review?**
   - Input validation, output encoding, parameterized queries, authentication/session handling, error handling, dependency versions, hardcoded secrets.

6. **Explain the principle of least privilege in secure coding.**
   - Components should have only the minimum permissions needed. Database users should only have SELECT/INSERT/UPDATE on specific tables. API keys should have minimal scopes.

7. **What is defense in depth?**
   - Multiple security layers so that if one fails, others still protect. Example: Input validation + parameterized queries + least-privilege DB user = multiple SQLi defenses.

---

## Hands-on Labs

| Lab | Platform | Description |
|-----|----------|-------------|
| OWASP Juice Shop | Docker | Full-stack vulnerable app |
| WebGoat | Docker | Secure coding lessons |
| DVWA | Local VM | Vulnerability testing |
| Code Review Games | OWASP | Secure code review practice |
| SAST Tools | Various | Static analysis practice |
| PortSwigger | Online | Secure coding labs |

### Lab Setup Commands

```bash
# OWASP Juice Shop (full vulnerable app)
docker pull bkimminich/juice-shop
docker run -d -p 3000:3000 bkimminich/juice-shop

# WebGoat (secure coding lessons)
docker run -d -p 8080:8080 -p 9090:9090 webgoat/webgoat

# DVWA
docker run -d -p 80:80 vulnerables/web-dvwa

# Bandit (Python security linter)
pip install bandit
bandit -r your_project/

# ESLint Security Plugin
npm install --save-dev eslint-plugin-security
```

---

*Last updated: 2026-07-16 | OWASP Reference: A03:2021 — Injection, A05:2021 — Security Misconfiguration*