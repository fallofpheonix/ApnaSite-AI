# Access Control

## Layer Position

```
+-----------------------------------------------------+
|                   APPLICATION LAYER                  |
+-----------------------------------------------------+
|              SECURITY FUNDAMENTALS                   |
|  +-----------------------------------------------+  |
|  |              ACCESS CONTROL                   |  |
|  |  +----------+ +----------+ +--------------+  |  |
|  |  |  AuthN   | |  AuthZ   | |  Accounting  |  |  |
|  |  |(Identify)| | (Permit) | |   (Log)      |  |  |
|  |  +----+-----+ +----+-----+ +------+-------+  |  |
|  |       |             |              |           |  |
|  |       v             v              v           |  |
|  |  +-----------------------------------------+  |  |
|  |  |  RBAC | ABAC | MAC | DAC | Zero Trust   |  |  |
|  |  +-----------------------------------------+  |  |
|  +-----------------------------------------------+  |
+-----------------------------------------------------+
|              IDENTITY LAYER                         |
|  IAM | SSO | Federation | MFA | Directory          |
+-----------------------------------------------------+
```

## What is Access Control?

Access control is the selective restriction of access to resources. It determines who can access what, under what conditions, and what they can do with that access.

**Core Formula:**
```
Access = f(Subject, Object, Action, Environment)
```

## Why Learn It?

- Primary mechanism for enforcing confidentiality and integrity
- Most common and damaging security failures stem from access misconfigurations
- Foundation for compliance (GDPR, HIPAA, PCI-DSS)
- Essential for every system from workstations to cloud platforms
- Required knowledge for CISSP, CEH, CompTIA Security+

---

## Authentication Factors

### Factor Categories

```
+-----------------------------------------------------+
|         AUTHENTICATION FACTORS                       |
+-----------------------------------------------------+
|                                                     |
|  Something You KNOW                                |
|  +- Passwords                                      |
|  +- PINs                                           |
|  +- Security questions                             |
|  +- Passphrases                                    |
|                                                     |
|  Something You HAVE                                |
|  +- Smart cards                                    |
|  +- Hardware tokens (YubiKey)                      |
|  +- Software tokens (authenticator apps)           |
|  +- Mobile phones                                  |
|  +- Certificates                                   |
|                                                     |
|  Something You ARE (Biometrics)                     |
|  +- Fingerprint                                    |
|  +- Iris/retina scan                               |
|  +- Facial recognition                             |
|  +- Voice recognition                              |
|  +- Hand geometry                                  |
|                                                     |
|  Something You DO                                  |
|  +- Signature dynamics                             |
|  +- Keystroke dynamics                             |
|  +- Gait analysis                                  |
|                                                     |
|  Somewhere You ARE                                 |
|  +- GPS location                                   |
|  +- IP address                                     |
|  +- Network location                               |
|  +- Time of access                                 |
+-----------------------------------------------------+
```

### Multi-Factor Authentication (MFA)

```
+-----------------------------------------------------+
|              MFA IMPLEMENTATION                      |
+-----------------------------------------------------+
|                                                     |
|  User --> Factor 1 --> Factor 2 --> Factor 3        |
|           (Know)       (Have)       (Are)           |
|           Password     Token        Biometric       |
|                                                     |
|  MFA = At least 2 different factor categories       |
|                                                     |
|  Same category = NOT MFA:                           |
|  Password + PIN = Single-factor (both "know")      |
|                                                     |
|  Different categories = MFA:                        |
|  Password + Token = Two-factor (know + have)       |
|  Token + Fingerprint = Two-factor (have + are)     |
|                                                     |
|  Security Levels:                                   |
|  +- 1FA: Low security                              |
|  +- 2FA: Moderate security                         |
|  +- 3FA: High security                             |
|  +- Adaptive: Risk-based (step-up auth)            |
+-----------------------------------------------------+
```

### MFA Methods Comparison

| Method | Security | Convenience | Cost | Replay Resistant |
|--------|----------|-------------|------|------------------|
| SMS OTP | Low | High | Free | No |
| Email OTP | Low-Med | High | Free | No |
| TOTP (Authenticator) | Medium | High | Free | No |
| Push Notification | Medium | Very High | Low | Partial |
| Hardware Token (FIDO2) | Very High | High | Medium | Yes |
| Smart Card | Very High | Medium | High | Yes |
| Biometric | High | Very High | Medium | Yes |
| Certificate-Based | Very High | Medium | High | Yes |

### Password Security

```
+-----------------------------------------------------+
|           PASSWORD BEST PRACTICES                    |
+-----------------------------------------------------+
|                                                     |
|  Minimum Requirements:                             |
|  +- Length: 12+ characters (16+ for privileged)    |
|  +- Complexity: Upper, lower, numbers, symbols     |
|  +- Uniqueness: No reuse across accounts           |
|  +- Rotation: Only when compromised                |
|  +- Storage: Salted hash (bcrypt, Argon2)          |
|                                                     |
|  Prohibited:                                        |
|  +- Dictionary words                               |
|  +- Personal information                           |
|  +- Common patterns (123456, password)             |
|  +- Reused passwords                               |
|  +- Default passwords                              |
|                                                     |
|  Storage:                                           |
|  +---------------------------------------------+   |
|  | Password: "MyP@ssw0rd"                      |   |
|  |                                             |   |
|  | Step 1: Generate random salt                |   |
|  |         Salt: a1b2c3d4e5f6                 |   |
|  |                                             |   |
|  | Step 2: Hash(password + salt)               |   |
|  |         Hash: $2b$12$a1b2c3d4e5f6...      |   |
|  |                                             |   |
|  | Step 3: Store hash + salt (not password)    |   |
|  +---------------------------------------------+   |
+-----------------------------------------------------+
```

### Biometric Systems

```
+-----------------------------------------------------+
|           BIOMETRIC SYSTEM ARCHITECTURE              |
+-----------------------------------------------------+
|                                                     |
|  +----------+     +----------+     +----------+    |
|  | Sensor   |---->| Feature  |---->| Template |    |
|  | (Capture)|     | Extract  |     | Match    |    |
|  +----------+     +----------+     +----+-----+    |
|                                        |           |
|                                        v           |
|                                  +----------+      |
|                                  | Decision |      |
|                                  | (Match/  |      |
|                                  | No Match)|      |
|                                  +----------+      |
|                                                     |
|  Error Rates:                                       |
|  +- FAR (False Accept Rate): Accept impostor       |
|  |  -> Security risk                               |
|  +- FRR (False Reject Rate): Reject legitimate     |
|  |  -> User inconvenience                          |
|  +- CER (Crossover Error Rate): FAR = FRR          |
|     -> Lower = better system                       |
|                                                     |
|  Template Storage:                                  |
|  +- Can't recover original biometric               |
|  +- Irreversible transformation                    |
|  +- Cancelable biometrics (revocable)              |
+-----------------------------------------------------+
```

---

## AAA Framework

### Authentication (AuthN) -- "Who are you?"

```
+-----------------------------------------------------+
|           AUTHENTICATION FLOW                        |
+-----------------------------------------------------+
|                                                     |
|  +--------+    +------------+    +------------+    |
|  |  User  |--->|  AuthN     |--->|  Identity  |    |
|  |        |    |  Server    |    |  Provider  |    |
|  +--------+    +------------+    +------------+    |
|       |              |                  |           |
|       |         +----+----+             |           |
|       |         |Credentials|            |           |
|       |         |(user/pass)|            |           |
|       |         +----------+             |           |
|       |                                  |           |
|       |         +--------------------+   |           |
|       |         |  Verify:           |   |           |
|       |         |  - Password hash   |<--+           |
|       |         |  - Token valid     |              |
|       |         |  - Certificate     |              |
|       |         +--------+----------+              |
|       |                  |                          |
|       |                  v                          |
|       |         +-----------------+                 |
|       |         |  Result:        |                 |
|       |         |  Success / Fail |                 |
|       |         +--------+--------+                 |
|       |                  |                          |
|  +----v------+           |                          |
|  | Session   |<----------+                          |
|  | Token     |                                       |
|  +-----------+                                       |
+-----------------------------------------------------+
```

**Authentication Methods:**

| Method | Security | Use Case |
|--------|----------|----------|
| Password | Low-Medium | General access |
| MFA | High | Critical systems |
| Certificate | Very High | Server-to-server |
| Token-based | High | APIs, web apps |
| Biometric | High | Physical access |
| SSO | Medium-High | Enterprise |

### Authorization (AuthZ) -- "What can you do?"

```
+-----------------------------------------------------+
|           AUTHORIZATION DECISION FLOW                |
+-----------------------------------------------------+
|                                                     |
|  +--------+    +----------+    +-----------+       |
|  | Subject|--->| AuthZ    |--->| Policy    |       |
|  | (User) |    | Engine   |    | Decision  |       |
|  +--------+    +----------+    +-----+-----+       |
|                    |                |               |
|                    v                v               |
|              +----------+    +-----------+         |
|              | Policy   |    | Resource  |         |
|              | Store    |    | Access    |         |
|              | (ABAC/   |    | (Allow/   |         |
|              |  RBAC)   |    |  Deny)    |         |
|              +----------+    +-----------+         |
|                                                     |
|  Decision Factors:                                 |
|  +- Who: Identity, role, group                     |
|  +- What: Resource, classification                 |
|  +- How: Operation (read, write, execute)          |
|  +- When: Time, date                               |
|  +- Where: Location, network                       |
|  +- Why: Business justification                    |
+-----------------------------------------------------+
```

### Accounting (Audit) -- "What did you do?"

```
+-----------------------------------------------------+
|           ACCOUNTING / AUDIT LOGGING                |
+-----------------------------------------------------+
|                                                     |
|  Events Captured:                                  |
|  +- Authentication attempts (success/failure)      |
|  +- Authorization decisions (allow/deny)           |
|  +- Resource access (read, write, delete)          |
|  +- Privilege changes                              |
|  +- Configuration changes                          |
|  +- Session management (login, logout, timeout)    |
|                                                     |
|  Log Format:                                       |
|  +---------------------------------------------+   |
|  | 2024-01-15T10:30:00Z | john.doe | LOGIN    |   |
|  | SUCCESS | 192.168.1.100 | /admin/dashboard |   |
|  +---------------------------------------------+   |
|                                                     |
|  Retention Requirements:                           |
|  +- HIPAA: 6 years                                |
|  +- PCI-DSS: 1 year (3 months online)             |
|  +- SOX: 7 years                                  |
|  +- GDPR: As long as necessary                    |
+-----------------------------------------------------+
```

---

## Access Control Models

### Discretionary Access Control (DAC)

```
+-----------------------------------------------------+
|              DAC MODEL                              |
+-----------------------------------------------------+
|                                                     |
|  Owner controls access to resources                 |
|                                                     |
|  +--------+    +-----------------+                  |
|  | Owner  |--->| Access Control  |                  |
|  | Alice  |    | List (ACL)      |                  |
|  +--------+    +-----------------+                  |
|                    |                                |
|                    v                                |
|  +-------------------------------------------+     |
|  | File: report.txt                          |     |
|  | Owner: Alice                              |     |
|  | ACL:                                      |     |
|  |   Alice: Read, Write, Delete              |     |
|  |   Bob:   Read                             |     |
|  |   Carol: Read, Write                      |     |
|  |   Dave:  (no access)                      |     |
|  +-------------------------------------------+     |
|                                                     |
|  Pros: Flexible, easy to implement                 |
|  Cons: Vulnerable to Trojan horses,                |
|        no centralized control,                     |
|        difficult to enforce policies               |
+-----------------------------------------------------+
```

**DAC Implementation:**
```bash
# Linux file permissions (DAC example)
ls -la /etc/passwd
# -rw-r--r-- 1 root root 2345 Jan 15 10:00 /etc/passwd

# Set permissions
chmod 755 script.sh      # rwxr-xr-x
chmod 600 private.key    # rw-------
chown alice:alice file.txt

# ACL (extended permissions)
setfacl -m u:bob:r file.txt
setfacl -m d:u:carol:rw directory/
```

### Mandatory Access Control (MAC)

```
+-----------------------------------------------------+
|              MAC MODEL                              |
+-----------------------------------------------------+
|                                                     |
|  System enforces access based on security labels   |
|                                                     |
|  Security Labels:                                  |
|  +-------------------------------------------+     |
|  | Top Secret (TS)                           |     |
|  | Confidential (C)                          |     |
|  | Unclassified (U)                          |     |
|  +-------------------------------------------+     |
|                                                     |
|  Access Rules (Bell-LaPadula):                     |
|  +- No Read Up: Subject cannot read higher level  |
|  +- No Write Down: Subject cannot write lower     |
|                                                     |
|  Example:                                          |
|  +--------+  +--------+  +--------+              |
|  | TS     |  | Secret |  |  U     |              |
|  | Subject|  | Subject|  | Subject|              |
|  | (can   |  | (can   |  | (can   |              |
|  | read   |  | read   |  | read   |              |
|  | below) |  | below) |  | all)   |              |
|  +--------+  +--------+  +--------+              |
|                                                     |
|  Pros: Strong policy enforcement, centralized      |
|  Cons: Complex administration, rigid               |
+-----------------------------------------------------+
```

**MAC Implementation (SELinux):**
```bash
# Check SELinux status
getenforce
sestatus

# View file contexts
ls -Z /var/www/html/

# Set context
chcon -t httpd_sys_content_t /var/www/html/index.html

# Manage booleans
getsebool -a | grep httpd
setsebool -P httpd_can_network_connect on

# Audit MAC denials
ausearch -m AVC -ts recent
audit2allow -a
```

### Role-Based Access Control (RBAC)

```
+-----------------------------------------------------+
|              RBAC MODEL                             |
+-----------------------------------------------------+
|                                                     |
|  Access determined by role assignment              |
|                                                     |
|  +--------+     +--------+     +--------+          |
|  | User   |---->|  Role  |---->| Perms  |          |
|  | Alice  |     | Admin  |     | R,W,D  |          |
|  | Bob    |     | Editor |     | R,W    |          |
|  | Carol  |     | Viewer |     | R      |          |
|  +--------+     +--------+     +--------+          |
|                                                     |
|  RBAC Hierarchy:                                   |
|  +-------------------------------------------+     |
|  |           Super Admin                     |     |
|  |              |                            |     |
|  |         +----+----+                       |     |
|  |         |         |                       |     |
|  |       Admin    Manager                    |     |
|  |         |         |                       |     |
|  |     +---+---+ +--+--+                    |     |
|  |     |       | |     |                     |     |
|  |   Editor  Viewer  Editor                 |     |
|  |     |            |                       |     |
|  |   Viewer      Viewer                     |     |
|  +-------------------------------------------+     |
|                                                     |
|  Benefits:                                         |
|  +- Simplifies administration                      |
|  +- Supports principle of least privilege          |
|  +- Enables separation of duties                   |
|  +- Scales well for large organizations            |
+-----------------------------------------------------+
```

**RBAC Implementation:**
```yaml
# Kubernetes RBAC example
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### Attribute-Based Access Control (ABAC)

```
+-----------------------------------------------------+
|              ABAC MODEL                             |
+-----------------------------------------------------+
|                                                     |
|  Access determined by attributes and policies      |
|                                                     |
|  Attributes:                                       |
|  +- Subject: role, department, clearance           |
|  +- Object: classification, type, owner            |
|  +- Action: read, write, execute                   |
|  +- Environment: time, location, risk level        |
|                                                     |
|  Policy Example:                                   |
|  +-------------------------------------------+     |
|  | IF subject.department == "finance"         |     |
|  | AND object.classification == "financial"   |     |
|  | AND action == "read"                       |     |
|  | AND environment.time BETWEEN 9am AND 5pm   |     |
|  | AND environment.location == "corporate"    |     |
|  | THEN ALLOW                                 |     |
|  +-------------------------------------------+     |
|                                                     |
|  +--------+   +-----------+   +-----------+        |
|  | Subject|-->|  Policy   |-->| Decision  |        |
|  | Attrs  |   |  Engine   |   | Point     |        |
|  +--------+   +-----------+   +-----------+        |
|       |              |              |              |
|       v              v              v              |
|  +--------+   +-----------+   +-----------+        |
|  | Object |   | Policy   |   |  Resource |        |
|  | Attrs  |   | Store    |   |  Access   |        |
|  +--------+   +-----------+   +-----------+        |
|                                                     |
|  Benefits:                                         |
|  +- Fine-grained control                          |
|  +- Context-aware decisions                        |
|  +- Supports complex business rules                |
|  +- Cloud-native (AWS, Azure, GCP)                |
+-----------------------------------------------------+
```

**ABAC Policy Example (XACML-like):**
```
Policy: Finance-Data-Access
  Target: Resources with classification = "financial"
  Rule 1: Allow if
    subject.role = "analyst"
    AND subject.department = "finance"
    AND action = "read"
    AND environment.time >= "09:00"
    AND environment.time <= "17:00"
    AND environment.ip IN corporate_range
  Rule 2: Allow if
    subject.role = "manager"
    AND subject.department = "finance"
    AND action IN ["read", "write"]
  Rule 3: Deny all other access
```

### Comparison Matrix

| Model | Control | Granularity | Administration | Scalability |
|-------|---------|-------------|----------------|-------------|
| DAC | Owner | Low | Decentralized | Low |
| MAC | System | High | Centralized | Medium |
| RBAC | Role | Medium | Semi-centralized | High |
| ABAC | Policy | Very High | Centralized | Very High |

---

## Identity Management (IdM)

### Identity Lifecycle

```
+-----------------------------------------------------+
|           IDENTITY LIFECYCLE                         |
+-----------------------------------------------------+
|                                                     |
|  +----------+    +----------+    +----------+      |
|  | Provision|-->|  Maintain|-->|Deprovision|      |
|  +----------+    +----------+    +----------+      |
|       |              |               |             |
|       v              v               v             |
|  +----------+    +----------+    +----------+      |
|  | Create   |    | Modify  |    | Revoke   |      |
|  | Account  |    | Rights  |    | Access   |      |
|  +----------+    +----------+    +----------+      |
|                                                     |
|  Provisioning:                                     |
|  +- Joining employee: Create accounts              |
|  +- Role change: Update permissions                |
|  +- Transfer: Adjust access                       |
|                                                     |
|  Maintenance:                                      |
|  +- Password resets                                |
|  +- MFA enrollment                                |
|  +- Access reviews                                |
|  +- Certification campaigns                        |
|                                                     |
|  Deprovisioning:                                   |
|  +- Termination: Disable immediately              |
|  +- Offboarding: Revoke all access                |
|  +- Archive: Preserve audit trails                 |
+-----------------------------------------------------+
```

### Directory Services

| Service | Protocol | Use Case |
|---------|----------|----------|
| Active Directory | LDAP/Kerberos | Windows enterprise |
| OpenLDAP | LDAP | Linux/Unix |
| Azure AD | LDAP/OAuth/OIDC | Cloud/Hybrid |
| Okta | SAML/OIDC | SaaS/Cloud |
| FreeIPA | LDAP/Kerberos | Linux enterprise |

### IAM Platforms

| Platform | Type | Key Features |
|----------|------|--------------|
| AWS IAM | Cloud | Policies, roles, MFA |
| Azure AD | Cloud/Hybrid | SSO, MFA, Conditional Access |
| Okta | SaaS | SSO, lifecycle management |
| OneLogin | SaaS | SSO, MFA, provisioning |
| Ping Identity | Enterprise | Federation, MFA |
| ForgeRock | Enterprise | Identity management |

---

## Federation and SSO

### Single Sign-On (SSO)

```
+-----------------------------------------------------+
|              SSO FLOW                               |
+-----------------------------------------------------+
|                                                     |
|  +--------+    +--------+    +--------+            |
|  |  User  |--->|   SSO  |--->|Service |            |
|  |        |    | Portal |    |Provider|            |
|  +--------+    +--------+    +--------+            |
|       |              |              |               |
|       |         +----+----+        |               |
|       |         | Central |        |               |
|       |         | AuthN   |        |               |
|       |         +---------+        |               |
|       |                            |               |
|       +----------------------------+               |
|                                                     |
|  Flow:                                             |
|  1. User accesses Service Provider (SP)            |
|  2. SP redirects to Identity Provider (IdP)        |
|  3. User authenticates with IdP                    |
|  4. IdP issues token/assertion                     |
|  5. SP validates token, grants access              |
|                                                     |
|  Benefits:                                         |
|  +- Single password to manage                      |
|  +- Centralized access control                     |
|  +- Improved user experience                       |
|  +- Easier deprovisioning                          |
+-----------------------------------------------------+
```

### SAML Flow

```
+-----------------------------------------------------+
|              SAML 2.0 FLOW                          |
+-----------------------------------------------------+
|                                                     |
|  User ---> SP ---> IdP ---> User                    |
|    |        |        |        |                     |
|    |        |        |        |                     |
|    |  1.AuthN Request        |                     |
|    |-------->|        |        |                     |
|    |        |        |        |                     |
|    |  2.Redirection to IdP   |                     |
    |        |-------->|        |                     |
|    |        |        |        |                     |
|    |  3.User authenticates   |                     |
|    |        |        |-------->|                     |
|    |        |        |        |                     |
|    |  4.SAML Assertion       |                     |
|    |        |        |-------->|                     |
|    |        |        |        |                     |
|    |  5.Access granted       |                     |
|    |<-------|        |        |                     |
|                                                     |
|  SAML Components:                                  |
|  +- Identity Provider (IdP)                        |
|  +- Service Provider (SP)                          |
|  +- SAML Assertion (XML token)                     |
|  +- SAML Request/Response                          |
+-----------------------------------------------------+
```

### OAuth 2.0 / OpenID Connect

```
+-----------------------------------------------------+
|           OAUTH 2.0 + OIDC FLOW                     |
+-----------------------------------------------------+
|                                                     |
|  +--------+    +--------+    +--------+            |
|  |  User  |--->|  App   |--->|  AuthZ |            |
|  |        |    | (Client)|    | Server |            |
|  +--------+    +--------+    +--------+            |
|                                                     |
|  OAuth 2.0 (Authorization):                        |
|  1. Client requests authorization                  |
|  2. User authenticates and consents                |
|  3. AuthZ server issues access token              |
|  4. Client uses token to access resource          |
|                                                     |
|  OpenID Connect (Authentication):                  |
|  1. Client initiates OIDC flow                     |
|  2. User authenticates                             |
|  3. IdP issues ID token + access token             |
|  4. Client verifies ID token                       |
|  5. Client gets user info                          |
|                                                     |
|  Token Types:                                      |
|  +- Access Token: API access (short-lived)         |
|  +- Refresh Token: Get new access tokens           |
|  +- ID Token: User identity (JWT)                  |
+-----------------------------------------------------+
```

### Federation Protocols Comparison

| Protocol | Type | Use Case | Token Format |
|----------|------|----------|--------------|
| SAML 2.0 | Federation | Enterprise SSO | XML |
| OAuth 2.0 | Authorization | API access | Bearer token |
| OpenID Connect | Authentication | User login | JWT |
| WS-Federation | Federation | Legacy Microsoft | XML |

---

## Zero Trust Architecture

### Core Principles

```
+-----------------------------------------------------+
|           ZERO TRUST PRINCIPLES                      |
+-----------------------------------------------------+
|                                                     |
|  1. Never trust, always verify                     |
|     +- No implicit trust based on network location |
|     +- Verify every request                       |
|                                                     |
|  2. Least privilege access                         |
|     +- Grant minimum necessary permissions        |
|     +- Just-in-time and just-enough access         |
|                                                     |
|  3. Assume breach                                  |
|     +- Design as if attacker is inside            |
|     +- Microsegmentation                          |
|                                                     |
|  4. Verify explicitly                              |
|     +- Authenticate and authorize every access    |
|     +- Use all available signals                  |
|                                                     |
|  5. Microsegmentation                              |
|     +- Isolate resources into small zones         |
|     +- Control east-west traffic                  |
+-----------------------------------------------------+
```

### Zero Trust Architecture

```
+-----------------------------------------------------+
|           ZERO TRUST ARCHITECTURE                   |
+-----------------------------------------------------+
|                                                     |
|  +--------+    +----------+    +--------+          |
|  |  User  |--->| Policy   |--->|Resource|          |
|  |        |    | Engine   |    |        |          |
|  +--------+    +----------+    +--------+          |
|       |              |              |               |
|       v              v              v               |
|  +--------+    +----------+    +--------+          |
|  |Identity|    | Device   |    | micro- |          |
|  | Verify |    | Verify   |    | segment|          |
|  +--------+    +----------+    +--------+          |
|       |              |              |               |
|       v              v              v               |
|  +--------+    +----------+    +--------+          |
|  | MFA    |    | Health   |    | encrypt|          |
|  |        |    | Check    |    |        |          |
|  +--------+    +----------+    +--------+          |
|                                                     |
|  Policy Decision Point (PDP):                      |
|  +- Evaluates all signals                          |
|  +- Makes allow/deny decision                      |
|                                                     |
|  Policy Enforcement Point (PEP):                   |
|  +- Enforces PDP decisions                         |
|  +- Proxies all access                             |
+-----------------------------------------------------+
```

### Zero Trust Implementations

| Vendor/Product | Approach |
|----------------|----------|
| Google BeyondCorp | Device信任, proxy-based |
| Zscaler | Cloud proxy, CASB |
| Palo Alto Prisma | SASE, microsegmentation |
| Microsoft Defender for Identity | Hybrid identity protection |
| Cloudflare Access | Zero Trust network access |
| AWS Verified Access | Identity-aware proxy |

---

## Security Perspective

### Defense-in-Depth for Access Control

```
+-----------------------------------------------------+
|      ACCESS CONTROL DEFENSE LAYERS                  |
+-----------------------------------------------------+
|                                                     |
|  Layer 1: Physical                                 |
|  +- Badge access, biometric                        |
|  +- Security guards, cameras                       |
|                                                     |
|  Layer 2: Network                                 |
|  +- Firewall rules, VPN                           |
|  +- Network segmentation                          |
|                                                     |
|  Layer 3: Operating System                        |
|  +- Local accounts, sudo                          |
|  +- File permissions, SELinux                     |
|                                                     |
|  Layer 4: Application                             |
|  +- Authentication, authorization                 |
|  +- Session management, input validation          |
|                                                     |
|  Layer 5: Data                                    |
|  +- Encryption at rest and in transit             |
|  +- Database access controls                      |
|  +- DLP                                           |
+-----------------------------------------------------+
```

---

## Attack Techniques

### Access Control Attacks

| Attack | Target | Method | Impact |
|--------|--------|--------|--------|
| Brute Force | Authentication | Try all passwords | Account compromise |
| Credential Stuffing | Authentication | Use leaked credentials | Account takeover |
| Privilege Escalation | Authorization | Exploit misconfig | Admin access |
| Session Hijacking | Session mgmt | Steal session token | Impersonation |
| Token Theft | Authentication | Intercept tokens | Unauthorized access |
| LDAP Injection | Directory | Manipulate queries | Bypass auth |
| SQL Injection | Database | Inject queries | Data access |
| Path Traversal | File system | Navigate directories | File access |
| IDOR | Application | Change object IDs | Unauthorized access |
| Default Credentials | Authentication | Use vendor defaults | System compromise |

### Privilege Escalation

```
+-----------------------------------------------------+
|           PRIVILEGE ESCALATION                      |
+-----------------------------------------------------+
|                                                     |
|  Vertical Escalation:                              |
|  +- User -> Admin -> Root/System                   |
|  +- Low privilege -> High privilege                |
|                                                     |
|  Horizontal Escalation:                            |
|  +- User A -> User B (same level)                 |
|  +- Access other users resources                   |
|                                                     |
|  Common Vectors:                                   |
|  +- SUID/SGID binaries (Linux)                    |
|  +- Unquoted service paths (Windows)              |
|  +- Kernel exploits                                |
|  +- Misconfigured sudo                            |
|  +- Stored credentials                             |
|  +- Scheduled tasks/cron jobs                      |
|  +- DLL hijacking                                 |
+-----------------------------------------------------+
```

---

## Defense Mechanisms

### Access Control Best Practices

| Practice | Implementation |
|----------|----------------|
| Least Privilege | Grant minimum necessary permissions |
| Separation of Duties | Split critical tasks across roles |
| Need to Know | Access only required information |
| Defense in Depth | Multiple control layers |
| Regular Review | Quarterly access certification |
| Automated Provisioning | JIT access, workflow approval |
| Strong Authentication | MFA for all privileged access |
| Session Management | Timeout, re-auth for sensitive ops |
| Monitoring | Log all access, anomaly detection |
| Zero Trust | Verify every request |

### Password Policy Enforcement

```bash
# Linux password policy (/etc/security/pwquality.conf)
minlen = 12
dcredit = -1
ucredit = -1
lcredit = -1
ocredit = -1
maxrepeat = 3
dictcheck = 1

# Account lockout (/etc/pam.d/common-auth)
auth required pam_tally2.so deny=5 unlock_time=900

# Password aging (/etc/login.defs)
PASS_MAX_DAYS 90
PASS_MIN_DAYS 7
PASS_WARN_AGE 14
```

---

## Debugging / Analysis Tools

### Access Control Analysis

| Tool | Purpose |
|------|---------|
| bloodhound | Active Directory attack path analysis |
| PowerView | Windows domain enumeration |
| ldapsearch | LDAP query tool |
| ldapenum | LDAP enumeration |
| getfacl | View file ACLs (Linux) |
| icacls | View/set file ACLs (Windows) |
| accesschk | Check permissions (Windows) |
| LinPEAS | Linux privilege escalation checks |
| WinPEAS | Windows privilege escalation checks |
| Seatbelt | Windows security audit |

### Authentication Testing

| Tool | Purpose |
|------|---------|
| Hydra | Online brute force |
| John the Ripper | Password hash cracking |
| Hashcat | GPU password cracking |
| Mimikatz | Windows credential extraction |
| Rubeus | Kerberos attacks |
| Burp Suite | Web app authentication testing |
| Nmap scripts | Service authentication testing |

---

## Practical Examples

### Lab 1: RBAC Implementation

```python
class RBACSystem:
    def __init__(self):
        self.users = {}      # user -> roles
        self.roles = {}      # role -> permissions
        self.user_sessions = {}
    
    def add_role(self, role, permissions):
        self.roles[role] = set(permissions)
    
    def assign_role(self, user, role):
        if user not in self.users:
            self.users[user] = set()
        self.users[user].add(role)
    
    def check_permission(self, user, permission):
        if user not in self.users:
            return False
        for role in self.users[user]:
            if permission in self.roles.get(role, set()):
                return True
        return False
    
    def display(self):
        for user, roles in self.users.items():
            perms = set()
            for role in roles:
                perms.update(self.roles.get(role, set()))
            print(f"{user}: roles={roles}, permissions={perms}")

# Usage
rbac = RBACSystem()
rbac.add_role("admin", ["read", "write", "delete", "manage_users"])
rbac.add_role("editor", ["read", "write"])
rbac.add_role("viewer", ["read"])

rbac.assign_role("alice", "admin")
rbac.assign_role("bob", "editor")
rbac.assign_role("carol", "viewer")

print(rbac.check_permission("alice", "delete"))  # True
print(rbac.check_permission("bob", "delete"))    # False
print(rbac.check_permission("carol", "read"))    # True
rbac.display()
```

### Lab 2: ABAC Policy Engine

```python
class ABACEngine:
    def __init__(self):
        self.policies = []
    
    def add_policy(self, name, conditions, effect="allow"):
        self.policies.append({
            "name": name,
            "conditions": conditions,
            "effect": effect
        })
    
    def evaluate(self, subject, resource, action, environment):
        for policy in self.policies:
            if self._match_conditions(policy["conditions"], 
                                       subject, resource, action, environment):
                return policy["effect"], policy["name"]
        return "deny", "default"
    
    def _match_conditions(self, conditions, subject, resource, action, env):
        for key, value in conditions.items():
            if key.startswith("subject."):
                attr = key[9:]
                if subject.get(attr) != value:
                    return False
            elif key.startswith("resource."):
                attr = key[9:]
                if resource.get(attr) != value:
                    return False
            elif key.startswith("action."):
                attr = key[7:]
                if action != value:
                    return False
            elif key.startswith("env."):
                attr = key[4:]
                if env.get(attr) != value:
                    return False
        return True

# Usage
engine = ABACEngine()
engine.add_policy("finance_read", {
    "subject.department": "finance",
    "resource.classification": "financial",
    "action": "read"
})
engine.add_policy("admin_all", {
    "subject.role": "admin"
})

subject = {"department": "finance", "role": "analyst"}
resource = {"classification": "financial"}
env = {"time": "10:00", "location": "office"}

effect, policy = engine.evaluate(subject, resource, "read", env)
print(f"Decision: {effect} (policy: {policy})")
```

### Lab 3: SAML SP Implementation

```python
# Simplified SAML SP validation (conceptual)
import base64
import xml.etree.ElementTree as ET

class SAMLResponse:
    def __init__(self, xml_content):
        self.root = ET.fromstring(xml_content)
        self.ns = {'saml': 'urn:oasis:names:tc:SAML:2.0:assertion'}
    
    def get_issuer(self):
        return self.root.find('.//saml:Issuer', self.ns).text
    
    def get_name_id(self):
        return self.root.find('.//saml:NameID', self.ns).text
    
    def get_attributes(self):
        attrs = {}
        for attr_stmt in self.root.findall('.//saml:AttributeStatement', self.ns):
            for attr in attr_stmt.findall('saml:Attribute', self.ns):
                name = attr.get('Name')
                value = attr.find('saml:AttributeValue', self.ns).text
                attrs[name] = value
        return attrs
    
    def validate_signature(self):
        # In production: validate XML signature
        return True
    
    def validate_conditions(self):
        # Check NotBefore and NotOnOrAfter
        return True

# Usage (conceptual)
# response = SAMLResponse(saml_xml)
# print(response.get_name_id())
# print(response.get_attributes())
```

### Lab 4: OAuth 2.0 Authorization Code Flow

```python
# Conceptual OAuth 2.0 flow
import requests
import json

class OAuthClient:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    def get_authorization_url(self, auth_endpoint, scope="openid profile"):
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": scope,
            "state": "random_state_value"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{auth_endpoint}?{query}"
    
    def exchange_code(self, token_endpoint, code):
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        response = requests.post(token_endpoint, data=data)
        return response.json()
    
    def refresh_token(self, token_endpoint, refresh_token):
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        response = requests.post(token_endpoint, data=data)
        return response.json()

# Usage
client = OAuthClient("app_id", "app_secret", "https://app.com/callback")
auth_url = client.get_authorization_url("https://idp.com/authorize")
print(f"Redirect user to: {auth_url}")
```

---

## Interview Questions

### Fundamentals
1. **What are the three components of AAA?**
2. **What is the difference between authentication and authorization?**
3. **Explain the five categories of authentication factors.**
4. **What makes MFA truly multi-factor?**
5. **What is the principle of least privilege?**

### Intermediate
6. **Compare DAC, MAC, RBAC, and ABAC. When would you use each?**
7. **How does SAML differ from OAuth 2.0?**
8. **What is the difference between federation and SSO?**
9. **Explain vertical vs. horizontal privilege escalation.**
10. **How does Zero Trust architecture differ from traditional perimeter security?**

### Advanced
11. **Design an access control system for a multi-tenant SaaS platform.**
12. **How do you handle access control in a microservices architecture?**
13. **Explain the security implications of JWT tokens and how to mitigate them.**
14. **How do you implement just-in-time (JIT) access for production systems?**
15. **Design a Zero Trust architecture for a hybrid cloud environment.**

---

## Hands-On Labs

### Lab 1: Linux Permission Analysis
```bash
# Find SUID binaries (privilege escalation vectors)
find / -perm -4000 -type f 2>/dev/null

# Find world-writable files
find / -perm -o+w -type f 2>/dev/null

# Check sudo permissions
sudo -l

# Analyze ACLs
getfacl /etc/shadow

# Check PAM configuration
cat /etc/pam.d/common-auth
```

### Lab 2: Active Directory Enumeration
```bash
# Using ldapsearch
ldapsearch -x -H ldap://dc.example.com -b "DC=example,DC=com" \
  "(objectClass=user)" sAMAccountName

# Using PowerView (Windows)
Import-Module .\PowerView.ps1
Get-DomainUser | Select-Object samaccountname, memberof
Get-DomainGroup | Select-Object name, memberof
```

### Lab 3: Web Application Access Control Testing
```bash
# Test for IDOR
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "https://app.com/api/users/$i"
done

# Test for privilege escalation
curl -X POST https://app.com/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"role": "admin"}'
```

### Lab 4: Zero Trust Policy Testing
```python
class ZeroTrustVerifier:
    def __init__(self):
        self.policies = []
        self.logs = []
    
    def add_policy(self, name, conditions):
        self.policies.append({"name": name, "conditions": conditions})
    
    def verify_request(self, request):
        self.logs.append(request)
        for policy in self.policies:
            if self._matches(policy["conditions"], request):
                return True, policy["name"]
        return False, "no_matching_policy"
    
    def _matches(self, conditions, request):
        return all(request.get(k) == v for k, v in conditions.items())
    
    def audit_log(self):
        for log in self.logs:
            print(f"Request: {log}")

vt = ZeroTrustVerifier()
vt.add_policy("internal_api", {
    "source_ip": "10.0.0.0/8",
    "auth_method": "mfa",
    "device_trusted": True
})

req = {"source_ip": "10.0.1.100", "auth_method": "mfa", "device_trusted": True}
allowed, policy = vt.verify_request(req)
print(f"Access: {'ALLOW' if allowed else 'DENY'} (policy: {policy})")
```

---

## Summary Table

| Component | Purpose | Key Standards | Attack Vectors |
|-----------|---------|---------------|----------------|
| Authentication | Verify identity | NIST 800-63B | Brute force, credential stuffing |
| Authorization | Grant permissions | RFC 7519 | Privilege escalation, IDOR |
| Accounting | Track activity | SOX, HIPAA | Log tampering, evasion |
| RBAC | Role-based access | NIST RBAC | Role escalation |
| ABAC | Attribute-based | XACML | Policy bypass |
| MAC | Mandatory access | Bell-LaPadula | Covert channels |
| DAC | Discretionary access | POSIX permissions | Trojan horses |
| SSO | Centralized authN | SAML, OIDC | Token theft, IdP compromise |
| Federation | Cross-domain auth | SAML, OAuth | assertion injection |
| Zero Trust | Never trust, always verify | NIST 800-207 | lateral movement |
| MFA | Multi-factor auth | FIDO2, TOTP | MFA fatigue, SIM swapping |
| IAM | Identity lifecycle | SCIM, LDAP | Orphan accounts |

---

## References

- NIST SP 800-53: Access Control Family
- NIST SP 800-63B: Digital Identity Guidelines
- NIST SP 800-207: Zero Trust Architecture
- ISO/IEC 27001: Access Control Policy
- OWASP Top 10: Broken Access Control
- SANS Institute: Access Control resources
- RFC 7519: JSON Web Token (JWT)
- RFC 6749: OAuth 2.0 Framework
- SAML 2.0 Specification
