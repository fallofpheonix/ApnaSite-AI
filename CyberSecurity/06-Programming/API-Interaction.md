# API Interaction for Security

## Layer Position

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  ┌───────────────────────────────────────┐  │
│  │   API Client / Consumer                │  │
│  ├───────────────────────────────────────┤  │
│  │   Authentication Layer                 │  │
│  │   (API Keys, OAuth, JWT, mTLS)        │  │
│  ├───────────────────────────────────────┤  │
│  │   Protocol Layer                       │  │
│  │   (REST, GraphQL, gRPC, WebSocket)    │  │
│  ├─────────────────────────────────────  ┤  │
│  │   Transport Layer (HTTP/HTTPS)         │  │
│  └───────────────────────────────────────┘  │
│           Network Layer (TCP/TLS)            │
│           Infrastructure Layer              │
└─────────────────────────────────────────────┘
```

## Internal Architecture

```
API Security Ecosystem
│
├── API Architectures
│   ├── REST ──────────────── Resource-based HTTP APIs
│   ├── GraphQL ──────────── Query language for APIs
│   ├── gRPC ─────────────── High-performance RPC
│   ├── WebSocket ────────── Bidirectional streaming
│   └── SOAP ─────────────── XML-based legacy APIs
│
├── Authentication Methods
│   ├── API Keys ──────────── Simple token-based
│   ├── OAuth 2.0 ─────────── Delegated authorization
│   ├── JWT ────────────────── Stateless tokens
│   ├── mTLS ──────────────── Certificate-based
│   ├── HMAC ──────────────── Request signing
│   └── Basic Auth ────────── Username/password
│
├── Security Controls
│   ├── Rate Limiting ─────── Request throttling
│   ├── Input Validation ──── Schema enforcement
│   ├── Output Filtering ──── Data minimization
│   ├── CORS ──────────────── Cross-origin control
│   └── API Gateway ────────── Centralized security
│
├── Vulnerability Classes
│   ├── BOLA ──────────────── Broken Object Level Auth
│   ├── BFLA ──────────────── Broken Function Level Auth
│   ├── Mass Assignment ────── Over-posting
│   ├── SSRF ──────────────── Server-Side Request Forgery
│   └── Injection ──────────── Command/SQL/NoSQL
│
└── Testing & Monitoring
    ├── API Scanners ──────── Automated testing
    ├── Fuzzing ────────────── Input mutation
    ├── Traffic Analysis ────── Anomaly detection
    └── Schema Validation ───── Contract enforcement
```

## 1. REST APIs

### REST Fundamentals

```python
import requests
import json
from typing import Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class APIResponse:
    status_code: int
    data: Any
    headers: Dict[str, str]
    success: bool

class RESTClient:
    """Secure REST API client."""

    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "SecurityScanner/1.0"
        })
        if api_key:
            self.session.headers["Authorization"] = f"Bearer {api_key}"

    def _request(self, method: str, endpoint: str, **kwargs) -> APIResponse:
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            data = None
            try:
                data = response.json()
            except json.JSONDecodeError:
                data = response.text
            return APIResponse(
                status_code=response.status_code,
                data=data,
                headers=dict(response.headers),
                success=200 <= response.status_code < 300
            )
        except requests.exceptions.RequestException as e:
            return APIResponse(status_code=0, data=str(e), headers={}, success=False)

    def get(self, endpoint: str, params: dict = None) -> APIResponse:
        return self._request("GET", endpoint, params=params)

    def post(self, endpoint: str, data: dict = None) -> APIResponse:
        return self._request("POST", endpoint, json=data)

    def put(self, endpoint: str, data: dict = None) -> APIResponse:
        return self._request("PUT", endpoint, json=data)

    def delete(self, endpoint: str) -> APIResponse:
        return self._request("DELETE", endpoint)

# Usage
client = RESTClient("https://api.example.com", api_key="your-api-key")
users = client.get("/api/v1/users")
new_user = client.post("/api/v1/users", data={"name": "Alice", "role": "admin"})
```

### REST Security Best Practices

```python
class SecureRESTAPI:
    """Implement security best practices for REST APIs."""

    def __init__(self):
        self.rate_limits = {}

    def validate_input(self, data: dict, schema: dict) -> tuple:
        """Validate API input against schema."""
        errors = []
        for field, rules in schema.items():
            value = data.get(field)
            if rules.get("required") and value is None:
                errors.append(f"{field} is required")
                continue
            if value is not None:
                if "type" in rules and not isinstance(value, rules["type"]):
                    errors.append(f"{field} must be {rules['type'].__name__}")
                if "max_length" in rules and len(str(value)) > rules["max_length"]:
                    errors.append(f"{field} exceeds maximum length")
                if "pattern" in rules:
                    import re
                    if not re.match(rules["pattern"], str(value)):
                        errors.append(f"{field} format is invalid")
        return len(errors) == 0, errors

    def rate_limit_check(self, client_id: str, limit: int = 100, window: int = 60) -> bool:
        """Simple rate limiting."""
        import time
        now = time.time()
        if client_id not in self.rate_limits:
            self.rate_limits[client_id] = []
        # Remove old entries
        self.rate_limits[client_id] = [
            t for t in self.rate_limits[client_id] if now - t < window
        ]
        if len(self.rate_limits[client_id]) >= limit:
            return False
        self.rate_limits[client_id].append(now)
        return True

    def sanitize_response(self, data: dict, allowed_fields: list) -> dict:
        """Filter response to only include allowed fields."""
        if isinstance(data, dict):
            return {k: v for k, v in data.items() if k in allowed_fields}
        elif isinstance(data, list):
            return [self.sanitize_response(item, allowed_fields) for item in data]
        return data

    def check_bola(self, user_id: int, resource_id: int, resource_owner: int) -> bool:
        """Check Broken Object Level Authorization."""
        return user_id == resource_owner
```

## 2. Authentication

### API Key Authentication

```python
import hashlib
import hmac
import time
import base64
from typing import Dict

class APIKeyAuth:
    """API Key authentication management."""

    def __init__(self):
        self.keys = {}

    def generate_key(self, user_id: str, permissions: list = None) -> str:
        """Generate a new API key."""
        raw_key = f"{user_id}:{time.time()}:{secrets.token_hex(32)}"
        api_key = hashlib.sha256(raw_key.encode()).hexdigest()
        self.keys[api_key] = {
            "user_id": user_id,
            "permissions": permissions or ["read"],
            "created_at": time.time(),
            "last_used": None,
            "active": True
        }
        return api_key

    def validate_key(self, api_key: str) -> Dict:
        """Validate an API key."""
        if api_key not in self.keys:
            return {"valid": False, "error": "Invalid API key"}
        key_data = self.keys[api_key]
        if not key_data["active"]:
            return {"valid": False, "error": "API key is revoked"}
        key_data["last_used"] = time.time()
        return {"valid": True, "user_id": key_data["user_id"], "permissions": key_data["permissions"]}

    def revoke_key(self, api_key: str):
        """Revoke an API key."""
        if api_key in self.keys:
            self.keys[api_key]["active"] = False

    def rotate_key(self, old_key: str) -> str:
        """Rotate an API key (generate new, revoke old)."""
        key_data = self.keys.get(old_key)
        if not key_data:
            raise ValueError("Invalid API key")
        new_key = self.generate_key(key_data["user_id"], key_data["permissions"])
        self.revoke_key(old_key)
        return new_key
```

### OAuth 2.0

```python
import requests
import secrets
import hashlib
import base64
from urllib.parse import urlencode
from typing import Optional

class OAuth2Client:
    """OAuth 2.0 client implementation."""

    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.authorization_endpoint = ""
        self.token_endpoint = ""
        self.userinfo_endpoint = ""

    def generate_pkce_pair(self) -> tuple:
        """Generate PKCE code verifier and challenge."""
        code_verifier = secrets.token_urlsafe(64)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b"=").decode()
        return code_verifier, code_challenge

    def get_authorization_url(self, state: str, scope: str = "openid profile email",
                              code_challenge: str = None) -> str:
        """Generate OAuth 2.0 authorization URL."""
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": scope,
        }
        if code_challenge:
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = "S256"
        return f"{self.authorization_endpoint}?{urlencode(params)}"

    def exchange_code(self, code: str, code_verifier: str = None) -> dict:
        """Exchange authorization code for tokens."""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        if code_verifier:
            data["code_verifier"] = code_verifier
        response = requests.post(self.token_endpoint, data=data, timeout=30)
        return response.json()

    def refresh_token(self, refresh_token: str) -> dict:
        """Refresh an access token."""
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        response = requests.post(self.token_endpoint, data=data, timeout=30)
        return response.json()

    def get_user_info(self, access_token: str) -> dict:
        """Get user information from userinfo endpoint."""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(self.userinfo_endpoint, headers=headers, timeout=30)
        return response.json()
```

### JWT (JSON Web Tokens)

```python
import json
import time
import hmac
import hashlib
import base64
from typing import Dict, Optional

class JWTManager:
    """JWT creation and validation."""

    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key.encode()
        self.algorithm = algorithm

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    def _base64url_decode(self, data: str) -> bytes:
        padding = 4 - len(data) % 4
        data += "=" * padding
        return base64.urlsafe_b64decode(data)

    def create_token(self, payload: dict, expires_in: int = 3600) -> str:
        """Create a JWT token."""
        header = {"alg": self.algorithm, "typ": "JWT"}
        now = time.time()
        payload.update({
            "iat": int(now),
            "exp": int(now) + expires_in,
        })
        header_b64 = self._base64url_encode(json.dumps(header).encode())
        payload_b64 = self._base64url_encode(json.dumps(payload).encode())
        signing_input = f"{header_b64}.{payload_b64}"
        signature = hmac.new(self.secret_key, signing_input.encode(), hashlib.sha256).digest()
        signature_b64 = self._base64url_encode(signature)
        return f"{header_b64}.{payload_b64}.{signature_b64}"

    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify and decode a JWT token."""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            header_b64, payload_b64, signature_b64 = parts
            # Verify signature
            signing_input = f"{header_b64}.{payload_b64}"
            expected_sig = hmac.new(self.secret_key, signing_input.encode(), hashlib.sha256).digest()
            actual_sig = self._base64url_decode(signature_b64)
            if not hmac.compare_digest(expected_sig, actual_sig):
                return None
            # Decode payload
            payload = json.loads(self._base64url_decode(payload_b64))
            # Check expiration
            if payload.get("exp", 0) < time.time():
                return None
            return payload
        except Exception:
            return None

    def refresh_token(self, token: str, extend_seconds: int = 3600) -> Optional[str]:
        """Refresh a token by extending expiration."""
        payload = self.verify_token(token)
        if not payload:
            return None
        payload["exp"] = int(time.time()) + extend_seconds
        return self.create_token({k: v for k, v in payload.items() if k not in ("iat", "exp")})

# Usage
jwt_mgr = JWTManager("your-secret-key")
token = jwt_mgr.create_token({"user_id": 123, "role": "admin"})
decoded = jwt_mgr.verify_token(token)
```

## 3. Rate Limiting

```python
import time
from collections import defaultdict
from typing import Dict, Tuple

class RateLimiter:
    """Token bucket rate limiter."""

    def __init__(self, requests_per_second: float = 10, burst_size: int = 20):
        self.rate = requests_per_second
        self.burst = burst_size
        self.buckets: Dict[str, Tuple[float, float]] = {}

    def allow_request(self, client_id: str) -> bool:
        """Check if request is allowed."""
        now = time.time()
        if client_id not in self.buckets:
            self.buckets[client_id] = (self.burst, now)
            return True

        tokens, last_time = self.buckets[client_id]
        elapsed = now - last_time
        tokens = min(self.burst, tokens + elapsed * self.rate)

        if tokens >= 1:
            self.buckets[client_id] = (tokens - 1, now)
            return True
        else:
            self.buckets[client_id] = (tokens, now)
            return False

    def get_retry_after(self, client_id: str) -> float:
        """Get seconds until next request is allowed."""
        if client_id not in self.buckets:
            return 0
        tokens, last_time = self.buckets[client_id]
        if tokens >= 1:
            return 0
        return (1 - tokens) / self.rate

class SlidingWindowRateLimiter:
    """Sliding window counter rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: Dict[str, list] = defaultdict(list)

    def allow_request(self, client_id: str) -> bool:
        now = time.time()
        self.requests[client_id] = [
            t for t in self.requests[client_id] if now - t < self.window
        ]
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        self.requests[client_id].append(now)
        return True

    def get_usage(self, client_id: str) -> Dict:
        now = time.time()
        recent = [t for t in self.requests[client_id] if now - t < self.window]
        return {
            "used": len(recent),
            "limit": self.max_requests,
            "remaining": max(0, self.max_requests - len(recent)),
            "reset_in": self.window - (now - recent[0]) if recent else self.window
        }
```

## 4. API Security

### API Security Testing

```python
import requests
from typing import List, Dict
from urllib.parse import urljoin

class APISecurityTester:
    """Test API endpoints for common vulnerabilities."""

    def __init__(self, base_url: str, auth_token: str = None):
        self.base_url = base_url
        self.session = requests.Session()
        if auth_token:
            self.session.headers["Authorization"] = f"Bearer {auth_token}"

    def test_bola(self, endpoint_template: str, valid_id: int, other_id: int) -> Dict:
        """Test Broken Object Level Authorization."""
        valid_url = endpoint_template.format(id=valid_id)
        other_url = endpoint_template.format(id=other_id)
        valid_resp = self.session.get(valid_url)
        other_resp = self.session.get(other_url)
        return {
            "test": "BOLA",
            "vulnerable": other_resp.status_code == 200,
            "valid_response": valid_resp.status_code,
            "other_response": other_resp.status_code,
            "severity": "HIGH" if other_resp.status_code == 200 else "PASS"
        }

    def test_bfla(self, admin_endpoint: str, user_endpoint: str) -> Dict:
        """Test Broken Function Level Authorization."""
        resp = self.session.get(admin_endpoint)
        return {
            "test": "BFLA",
            "vulnerable": resp.status_code == 200,
            "status_code": resp.status_code,
            "severity": "HIGH" if resp.status_code == 200 else "PASS"
        }

    def test_mass_assignment(self, endpoint: str, malicious_data: dict) -> Dict:
        """Test Mass Assignment vulnerability."""
        # First, get current state
        before = self.session.get(endpoint).json()
        # Try to modify protected fields
        resp = self.session.put(endpoint, json=malicious_data)
        # Check if protected fields were modified
        after = self.session.get(endpoint).json()
        changed = {k: after.get(k) != before.get(k) for k in malicious_data.keys()}
        return {
            "test": "Mass Assignment",
            "vulnerable": any(changed.values()),
            "changed_fields": changed,
            "severity": "HIGH" if any(changed.values()) else "PASS"
        }

    def test_rate_limiting(self, endpoint: str, requests_count: int = 150) -> Dict:
        """Test rate limiting implementation."""
        results = []
        for i in range(requests_count):
            resp = self.session.get(endpoint)
            results.append(resp.status_code)
            if resp.status_code == 429:
                return {
                    "test": "Rate Limiting",
                    "vulnerable": False,
                    "triggered_at": i + 1,
                    "severity": "PASS"
                }
        return {
            "test": "Rate Limiting",
            "vulnerable": True,
            "total_requests": requests_count,
            "severity": "HIGH"
        }

    def test_cors(self, endpoint: str, malicious_origin: str = "https://evil.com") -> Dict:
        """Test CORS configuration."""
        resp = self.session.get(endpoint, headers={"Origin": malicious_origin})
        acao = resp.headers.get("Access-Control-Allow-Origin", "")
        acac = resp.headers.get("Access-Control-Allow-Credentials", "")
        return {
            "test": "CORS",
            "vulnerable": acao == "*" or (acao == malicious_origin and acac == "true"),
            "acao": acao,
            "acac": acac,
            "severity": "HIGH" if acao == "*" or (acao == malicious_origin and acac == "true") else "PASS"
        }

    def run_all_tests(self, endpoints: dict) -> List[Dict]:
        """Run all security tests."""
        results = []
        if "resource" in endpoints:
            results.append(self.test_bola(endpoints["resource"], 1, 2))
        if "admin" in endpoints:
            results.append(self.test_bfla(endpoints["admin"], endpoints.get("user", "")))
        if "update" in endpoints:
            results.append(self.test_mass_assignment(endpoints["update"], {"role": "admin", "is_admin": True}))
        if "rate_limit" in endpoints:
            results.append(self.test_rate_limiting(endpoints["rate_limit"]))
        if "cors" in endpoints:
            results.append(self.test_cors(endpoints["cors"]))
        return results
```

### OWASP API Security Top 10

```python
OWASP_API_SECURITY_TOP_10 = {
    "API1": {
        "name": "Broken Object Level Authorization (BOLA)",
        "description": "Attackers can access objects they should not have access to",
        "example": "GET /api/users/123/orders - accessing another user's orders",
        "prevention": "Implement object-level authorization checks for every request"
    },
    "API2": {
        "name": "Broken Authentication",
        "description": "Weaknesses in authentication mechanisms",
        "example": "Brute force attacks, credential stuffing, weak passwords",
        "prevention": "Implement MFA, rate limiting, strong password policies"
    },
    "API3": {
        "name": "Broken Object Property Level Authorization",
        "description": "Accessing or modifying unauthorized object properties",
        "example": "Modifying role or price fields in API request",
        "prevention": "Define and enforce allowed properties per role"
    },
    "API4": {
        "name": "Unrestricted Resource Consumption",
        "description": "No rate limiting or resource caps",
        "example": "Sending unlimited requests, uploading huge files",
        "prevention": "Implement rate limiting, pagination, file size limits"
    },
    "API5": {
        "name": "Broken Function Level Authorization",
        "description": "Accessing administrative functions without authorization",
        "example": "Normal user calling DELETE /api/admin/users",
        "prevention": "Enforce function-level authorization checks"
    },
    "API6": {
        "name": "Unrestricted Access to Sensitive Business Flows",
        "description": "Abusing business logic flaws",
        "example": "Automated purchasing, coupon abuse",
        "prevention": "Implement business logic rate limiting, anomaly detection"
    },
    "API7": {
        "name": "Server-Side Request Forgery (SSRF)",
        "description": "API fetches attacker-controlled URLs",
        "example": "Using webhook URL to scan internal network",
        "prevention": "Validate and whitelist target URLs"
    },
    "API8": {
        "name": "Security Misconfiguration",
        "description": "Missing security headers, verbose errors, default configs",
        "example": "Leaking stack traces, debug mode in production",
        "prevention": "Hardened configurations, minimal error responses"
    },
    "API9": {
        "name": "Improper Inventory Management",
        "description": "Exposed old or undocumented API versions",
        "example": "v1 API still accessible with weaker security",
        "prevention": "Document all APIs, deprecate old versions"
    },
    "API10": {
        "name": "Unsafe Consumption of APIs",
        "description": "Trusting data from third-party APIs",
        "example": "Using unsanitized webhook payloads",
        "prevention": "Validate all external data, implement schema validation"
    }
}
```

## 5. GraphQL

```python
import requests
from typing import Dict, Optional

class GraphQLClient:
    """GraphQL API client with security considerations."""

    def __init__(self, endpoint: str, headers: dict = None):
        self.endpoint = endpoint
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            **(headers or {})
        })

    def query(self, query: str, variables: dict = None) -> Dict:
        """Execute a GraphQL query."""
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        response = self.session.post(self.endpoint, json=payload, timeout=30)
        return response.json()

    def introspect(self) -> Dict:
        """Introspect the GraphQL schema (for testing only)."""
        introspection_query = """
        query IntrospectionQuery {
            __schema {
                queryType { name }
                mutationType { name }
                types {
                    name
                    kind
                    fields {
                        name
                        type { name kind }
                    }
                }
            }
        }
        """
        return self.query(introspection_query)

class GraphQLSecurityTester:
    """Test GraphQL endpoints for vulnerabilities."""

    def __init__(self, client: GraphQLClient):
        self.client = client

    def test_introspection_disabled(self) -> Dict:
        """Check if introspection is disabled in production."""
        result = self.client.introspect()
        has_schema = "__schema" in result.get("data", {})
        return {
            "test": "Introspection",
            "enabled": has_schema,
            "severity": "HIGH" if has_schema else "PASS"
        }

    def test_query_depth_limit(self) -> Dict:
        """Test if query depth limiting is enforced."""
        deep_query = """
        query {
            users {
                posts {
                    comments {
                        author {
                            posts {
                                comments {
                                    author { name }
                                }
                            }
                        }
                    }
                }
            }
        }
        """
        result = self.client.query(deep_query)
        has_error = "errors" in result
        return {
            "test": "Query Depth Limit",
            "enforced": has_error,
            "severity": "HIGH" if not has_error else "PASS"
        }

    def test_query_complexity(self) -> Dict:
        """Test if query complexity limiting is enforced."""
        complex_query = """
        query {
            a1: users { id }
            a2: users { id }
            a3: users { id }
            a4: users { id }
            a5: users { id }
        }
        """
        result = self.client.query(complex_query)
        has_error = "errors" in result
        return {
            "test": "Query Complexity Limit",
            "enforced": has_error,
            "severity": "MEDIUM" if not has_error else "PASS"
        }

    def test_batching_abuse(self) -> Dict:
        """Test if query batching is rate-limited."""
        queries = [{"query": "{ users { id } }"} for _ in range(100)]
        response = self.client.session.post(
            self.client.endpoint,
            json=queries,
            timeout=30
        )
        return {
            "test": "Batch Query Limiting",
            "vulnerable": response.status_code == 200,
            "severity": "HIGH" if response.status_code == 200 else "PASS"
        }

    def test_n_plus_one(self) -> Dict:
        """Detect N+1 query vulnerability."""
        query = """
        query {
            users {
                id
                posts { id }
            }
        }
        """
        result = self.client.query(query)
        return {
            "test": "N+1 Query Detection",
            "has_potential_issue": "posts" in str(result),
            "severity": "MEDIUM"
        }
```

## 6. gRPC

```python
# gRPC Protocol Buffers definition (service.proto)
# syntax = "proto3";
#
# service SecurityService {
#   rpc GetVulnerabilities (VulnRequest) returns (VulnResponse);
#   rpc StreamAlerts (AlertRequest) returns (stream Alert);
# }
#
# message VulnRequest {
#   string target = 1;
#   int32 port = 2;
# }
#
# message VulnResponse {
#   repeated Vulnerability vulns = 1;
# }
#
# message Vulnerability {
#   string id = 1;
#   string title = 2;
#   string severity = 3;
#   string description = 4;
# }
#
# message AlertRequest {
#   string severity_filter = 1;
# }
#
# message Alert {
#   string timestamp = 1;
#   string message = 2;
#   string severity = 3;
# }

# Python gRPC client
# import grpc
# import service_pb2
# import service_pb2_grpc
#
# channel = grpc.secure_channel('api.example.com:443', credentials)
# stub = service_pb2_grpc.SecurityServiceStub(channel)
# response = stub.GetVulnerabilities(service_pb2.VulnRequest(target="192.168.1.1", port=80))

GRPC_SECURITY_CONSIDERATIONS = {
    "transport_security": "Always use TLS (grpc.secure_channel, not grpc.insecure_channel)",
    "authentication": "Implement token-based auth via metadata",
    "authorization": "Check permissions for each RPC method",
    "input_validation": "Validate proto message fields server-side",
    "rate_limiting": "Implement per-client rate limiting",
    "logging": "Log all RPC calls with metadata",
    "timeout": "Set appropriate deadlines for all calls",
    "max_message_size": "Configure max receive/send message sizes",
}
```

## 7. API Testing Tools

### Postman-like Testing

```python
import requests
import json
from typing import Dict, Any
from datetime import datetime

class APITestRunner:
    """Run API security tests."""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.results = []

    def run_test(self, name: str, method: str, endpoint: str,
                 headers: dict = None, data: dict = None,
                 expected_status: int = 200, expected_contains: str = None) -> Dict:
        """Run a single API test."""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.request(
                method, url, headers=headers, json=data, timeout=30
            )
            passed = response.status_code == expected_status
            if expected_contains and passed:
                passed = expected_contains in response.text

            result = {
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "passed": passed,
                "timestamp": datetime.now().isoformat(),
                "response_time": response.elapsed.total_seconds(),
                "response_size": len(response.content),
            }
            self.results.append(result)
            return result
        except Exception as e:
            result = {
                "name": name,
                "passed": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.results.append(result)
            return result

    def run_security_suite(self) -> Dict:
        """Run comprehensive security test suite."""
        tests = [
            ("Health Check", "GET", "/health", None, 200),
            ("Unauthorized Access", "GET", "/api/admin", {"Authorization": "Bearer invalid"}, 401),
            ("SQL Injection in Query", "GET", "/api/search?q=' OR 1=1--", None, 200),
            ("XSS in Input", "POST", "/api/comments", {"text": "<script>alert(1)</script>"}, 200),
            ("Large Payload", "POST", "/api/upload", None, 413),
            ("Missing Auth Header", "GET", "/api/users", None, 401),
            ("CORS Check", "GET", "/api/data", {"Origin": "https://evil.com"}, 200),
        ]

        for name, method, endpoint, headers, expected in tests:
            self.run_test(name, method, endpoint, headers=headers, expected_status=expected)

        passed = sum(1 for r in self.results if r.get("passed"))
        return {
            "total": len(self.results),
            "passed": passed,
            "failed": len(self.results) - passed,
            "results": self.results
        }

    def export_results(self, filepath: str):
        """Export test results to JSON."""
        with open(filepath, "w") as f:
            json.dump(self.results, f, indent=2, default=str)
```

## Security Perspective

| Aspect | Detail |
|--------|--------|
| Authentication | Use strong auth (OAuth 2.0 + PKCE, JWT with short expiry) |
| Authorization | Implement object-level and function-level checks |
| Rate Limiting | Protect against brute force and DoS |
| Input Validation | Validate all inputs against schema |
| Output Filtering | Return only necessary data |
| Logging | Log all API access for audit |

## Attack Techniques and Defenses

| Attack | Technique | Defense |
|--------|-----------|---------|
| BOLA | Access other users' resources | Object-level authorization |
| BFLA | Call admin functions as user | Function-level authorization |
| Mass Assignment | Modify protected fields | Whitelist allowed fields |
| SSRF | Make server fetch attacker URLs | URL validation, whitelist |
| API Key Leakage | Expose keys in code/repos | Rotation, environment variables |
| JWT None Attack | Bypass signature verification | Reject "none" algorithm |
| GraphQL Batching | Send 1000s of queries | Query complexity limits |
| Token Replay | Reuse stolen tokens | Short expiry, refresh tokens |

## Debugging Tools

| Tool | Purpose |
|------|---------|
| curl | HTTP request testing |
| Postman | API development and testing |
| Burp Suite | API proxy and scanner |
| OWASP ZAP | Automated API testing |
| GraphQL Playground | GraphQL introspection |
| grpcurl | gRPC CLI testing |
| JWT.io | JWT token decoding |
| Auth0 JWT Debugger | JWT validation |

## Interview Questions

1. What is the difference between authentication and authorization in APIs?
2. Explain OAuth 2.0 Authorization Code flow with PKCE.
3. What are the risks of exposing API documentation publicly?
4. How would you implement rate limiting for a public API?
5. What is the difference between JWT and session-based authentication?
6. How do you prevent SSRF in webhook implementations?
7. Explain BOLA and how to prevent it.
8. What security headers should REST APIs return?
9. How would you test an API for mass assignment vulnerabilities?
10. What are the trade-offs between API key and OAuth 2.0 authentication?

## Hands-on Labs

### Lab 1: Build a Secure REST API
```python
# Task: Build a secure REST API with FastAPI
# Requirements:
# 1. Implement OAuth 2.0 authentication
# 2. Add JWT token validation
# 3. Implement rate limiting
# 4. Add input validation with Pydantic
# 5. Implement CORS with strict origins
# 6. Add comprehensive logging
# 7. Write security test suite
```

### Lab 2: API Penetration Testing
```python
# Task: Test a live API for vulnerabilities
# Requirements:
# 1. Test for BOLA across endpoints
# 2. Test for mass assignment
# 3. Test rate limiting
# 4. Test CORS configuration
# 5. Test authentication bypass
# 6. Generate security report
```

### Lab 3: JWT Security Lab
```python
# Task: Implement and attack JWT authentication
# Requirements:
# 1. Implement JWT creation and verification
# 2. Demonstrate "none" algorithm attack
# 3. Demonstrate key confusion attack
# 4. Implement token refresh mechanism
# 5. Add token blacklisting
# 6. Implement short-lived access tokens
```

## Summary Table

| Category | Technologies | Security Considerations |
|----------|-------------|------------------------|
| REST | HTTP methods, status codes | Authentication, input validation |
| GraphQL | Queries, mutations, schema | Introspection, depth limits |
| gRPC | Protobuf, HTTP/2 | Transport security, auth metadata |
| Auth - API Keys | Simple tokens | Rotation, scope limiting |
| Auth - OAuth | Authorization codes, PKCE | Redirect URI validation, state |
| Auth - JWT | Signed tokens | Algorithm validation, expiry |
| Rate Limiting | Token bucket, sliding window | DDoS protection, fair usage |
| Testing | Automated scans, fuzzing | OWASP API Top 10 coverage |
