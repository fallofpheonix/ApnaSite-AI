# PKI & Certificates

## Layer Position in Security Model

```
┌───────────────────────────────────────────────────────┐
│                APPLICATION LAYER                       │
│        (HTTPS, Email Encryption, Code Signing)         │
├───────────────────────────────────────────────────────┤
│           ► PKI & CERTIFICATES ◄                      │
│  ┌───────────────────────────────────────────────┐    │
│  │  X.509 │ CA │ Certificate Chains │ OCSP       │    │
│  └───────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────┤
│           TRANSPORT LAYER (TLS)                       │
│        (Certificate Exchange, Handshake)              │
├───────────────────────────────────────────────────────┤
│           ASYMMETRIC ENCRYPTION                       │
│        (RSA, ECC, Key Exchange)                       │
├───────────────────────────────────────────────────────┤
│           TRUST INFRASTRUCTURE                        │
│        (Root CAs, Trust Stores, CRLs)                │
└───────────────────────────────────────────────────────┘
```

## Overview

Public Key Infrastructure (PKI) provides a framework for managing public keys and certificates. It enables authentication, encryption, and digital signatures through a trust hierarchy.

```
┌──────────────────────────────────────────────────────┐
│              PKI ECOSYSTEM                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Root CA  │◄───│  Root CA  │◄───│  Root CA  │      │
│  └─────┬────┘    └─────┬────┘    └─────┬────┘      │
│        │               │               │            │
│        ▼               ▼               ▼            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ Int. CA  │    │ Int. CA  │    │ Int. CA  │      │
│  └─────┬────┘    └─────┬────┘    └─────┬────┘      │
│        │               │               │            │
│        ▼               ▼               ▼            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │End Entity│    │End Entity│    │End Entity│      │
│  │(Server)  │    │(Client)  │    │(Code)    │      │
│  └──────────┘    └──────────┘    └──────────┘      │
│                                                      │
│  Components:                                         │
│  ├─ Certificate Authority (CA)                       │
│  ├─ Registration Authority (RA)                      │
│  ├─ Certificate Revocation List (CRL)               │
│  ├─ Online Certificate Status Protocol (OCSP)       │
│  ├─ Certificate Policy (CP)                         │
│  └─ Certification Practice Statement (CPS)          │
└──────────────────────────────────────────────────────┘
```

---

## X.509 Certificates

### Certificate Structure

```
┌──────────────────────────────────────────────────────┐
│                 X.509 v3 CERTIFICATE                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │           Certificate Fields               │      │
│  ├────────────────────────────────────────────┤      │
│  │  Version:          v3 (2)                  │      │
│  │  Serial Number:    04:ab:cd:ef:12:34:56:78│      │
│  │  Signature Algo:   sha256WithRSAEncryption │      │
│  │  Issuer:           CN=Let's Encrypt        │      │
│  │  Validity:                               │      │
│  │    Not Before:     Jan  1 00:00:00 2024   │      │
│  │    Not After:      Jan  1 00:00:00 2025   │      │
│  │  Subject:          CN=example.com         │      │
│  │  Subject Public Key Info:                  │      │
│  │    Algorithm:      rsaEncryption (2048)   │      │
│  │    Public Key:     [2048-bit key]         │      │
│  │  Extensions:                               │      │
│  │    Subject Alt Name:                      │      │
│  │      DNS: example.com                     │      │
│  │      DNS: www.example.com                 │      │
│  │    Basic Constraints:                     │      │
│  │      CA: FALSE                            │      │
│  │    Key Usage:                             │      │
│  │      Digital Signature, Key Encipherment  │      │
│  │    Extended Key Usage:                    │      │
│  │      TLS Web Server Authentication        │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │           Signature                        │      │
│  ├────────────────────────────────────────────┤      │
│  │  Algorithm:  sha256WithRSAEncryption       │      │
│  │  Signature:  [CA's digital signature]      │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Certificate Extensions

```
┌──────────────────────────────────────────────────────┐
│             X.509 v3 EXTENSIONS                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Subject Alternative Name (SAN):                     │
│  ┌────────────────────────────────────────────┐      │
│  │  DNS: example.com                          │      │
│  │  DNS: *.example.com (wildcard)             │      │
│  │  IP: 192.168.1.1                           │      │
│  │  email: admin@example.com                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Basic Constraints:                                  │
│  ┌────────────────────────────────────────────┐      │
│  │  CA: TRUE/FALSE                            │      │
│  │  Path Length Constraint: N                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Key Usage:                                          │
│  ┌────────────────────────────────────────────┐      │
│  │  ├─ Digital Signature                      │      │
│  │  ├─ Key Encipherment                       │      │
│  │  ├─ Data Encipherment                      │      │
│  │  ├─ Key Agreement                          │      │
│  │  ├─ Key Certificate Sign                    │      │
│  │  ├─ CRL Sign                               │      │
│  │  └─ Encipher Only / Decipher Only          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Extended Key Usage:                                 │
│  ┌────────────────────────────────────────────┐      │
│  │  ├─ TLS Web Server Authentication          │      │
│  │  ├─ TLS Web Client Authentication          │      │
│  │  ├─ Code Signing                           │      │
│  │  ├─ Email Protection (S/MIME)              │      │
│  │  ├─ Time Stamping                          │      │
│  │  └─ OCSP Signing                           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Authority Key Identifier (AKI):                     │
│  ┌────────────────────────────────────────────┐      │
│  │  Identifies the CA's key used to sign      │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Subject Key Identifier (SKI):                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Identifies the subject's public key       │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  CRL Distribution Points:                            │
│  ┌────────────────────────────────────────────┐      │
│  │  URL where CRL can be fetched              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Authority Information Access (AIA):                 │
│  ┌────────────────────────────────────────────┐      │
│  │  ├─ OCSP Responder URL                     │      │
│  │  └─ CA Issuer URL (intermediate cert)      │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Certificate Authorities (CA)

### Trust Hierarchy

```
┌──────────────────────────────────────────────────────┐
│              CERTIFICATE AUTHORITY HIERARCHY           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │              ROOT CA (Offline)             │      │
│  │  ├─ Self-signed certificate                │      │
│  │  ├─ Stored in HSM (Hardware Security Module)│     │
│  │  ├─ Long validity (10-20 years)            │      │
│  │  └─ Signs intermediate CA certificates     │      │
│  └────────────────────┬───────────────────────┘      │
│                       │                              │
│                       ▼                              │
│  ┌────────────────────────────────────────────┐      │
│  │           INTERMEDIATE CA (Online)         │      │
│  │  ├─ Signed by Root CA                      │      │
│  │  ├─ Signs end-entity certificates         │      │
│  │  ├─ Can be revoked (isolated from root)   │      │
│  │  └─ Typically 3-5 year validity           │      │
│  └────────────────────┬───────────────────────┘      │
│                       │                              │
│          ┌────────────┼────────────┐                 │
│          ▼            ▼            ▼                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │End Entity│  │End Entity│  │End Entity│          │
│  │ (Server) │  │ (Client) │  │ (Email)  │          │
│  │ 90 days  │  │ 1 year   │  │ 1 year   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  Benefits of Multi-Level Hierarchy:                  │
│  ├─ Root key rarely used (minimal exposure)         │
│  ├─ Intermediate can be revoked independently       │
│  ├─ Different CAs for different services            │
│  └─ Scalability across organizations                 │
└──────────────────────────────────────────────────────┘
```

### Types of Certificates

```
┌──────────────────────────────────────────────────────┐
│              CERTIFICATE TYPES                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Domain Validation (DV):                          │
│  ┌────────────────────────────────────────────┐      │
│  │  Validates: Domain ownership only          │      │
│  │  Issuance: Automated (minutes)             │      │
│  │  Cost: Free - $50/year                     │      │
│  │  Use: Personal sites, blogs                │      │
│  │  Examples: Let's Encrypt, ZeroSSL          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Organization Validation (OV):                    │
│  ┌────────────────────────────────────────────┐      │
│  │  Validates: Domain + Organization identity │      │
│  │  Issuance: Manual verification (1-3 days)  │      │
│  │  Cost: $50-200/year                        │      │
│  │  Use: Business websites, e-commerce        │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. Extended Validation (EV):                        │
│  ┌────────────────────────────────────────────┐      │
│  │  Validates: Domain + Org + Legal entity    │      │
│  │  Issuance: Extensive vetting (1-2 weeks)   │      │
│  │  Cost: $200-1000+/year                     │      │
│  │  Use: Banks, financial institutions        │      │
│  │  Note: Browser UI no longer distinctive    │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Wildcard Certificate:                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Covers: *.example.com                     │      │
│  │  Includes all subdomains                   │      │
│  │  DV wildcard: $100-300/year                │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  5. Multi-Domain (SAN) Certificate:                 │
│  ┌────────────────────────────────────────────┐      │
│  │  Covers: Multiple domains                  │      │
│  │  example.com, www.example.com, mail.example│     │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  6. Self-Signed Certificate:                         │
│  ┌────────────────────────────────────────────┐      │
│  │  Not signed by CA                          │      │
│  │  No trust chain                            │      │
│  │  Use: Development, internal testing        │      │
│  │  ⚠ Browsers show warnings!                 │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Certificate Chains

### Chain of Trust

```
┌──────────────────────────────────────────────────────┐
│              CERTIFICATE CHAIN VALIDATION              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Validation Steps:                                   │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Certificate → Signed by Intermediate CA│      │
│  │  2. Intermediate → Signed by Root CA       │      │
│  │  3. Root CA → Self-signed (in trust store) │      │
│  │  4. Check validity period                   │      │
│  │  5. Check revocation status                 │      │
│  │  6. Check key usage constraints             │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Chain Construction:                                 │
│  ┌────────────────────────────────────────────┐      │
│  │                                            │      │
│  │  End Entity Certificate                    │      │
│  │  ├─ Issuer: Intermediate CA                │      │
│  │  ├─ AKI: Intermediate CA's key ID         │      │
│  │  └─ Signature: Verified with Int. CA pub  │      │
│  │                                            │      │
│  │  Intermediate Certificate                  │      │
│  │  ├─ Issuer: Root CA                        │      │
│  │  ├─ AKI: Root CA's key ID                 │      │
│  │  └─ Signature: Verified with Root CA pub  │      │
│  │                                            │      │
│  │  Root Certificate                          │      │
│  │  ├─ Issuer: Self                           │      │
│  │  └─ Self-signed                            │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Common Chain Issues:                                │
│  ├─ Missing intermediate certificate                 │
│  ├─ Untrusted root CA                                │
│  ├─ Expired certificate                              │
│  ├─ Key usage constraint violation                   │
│  └─ Name mismatch                                    │
└──────────────────────────────────────────────────────┘
```

### Path Validation Algorithm

```
┌──────────────────────────────────────────────────────┐
│           CERTIFICATE PATH VALIDATION                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Input: Target cert, trust anchors, policies        │
│                                                      │
│  Algorithm (RFC 5280):                               │
│  ┌────────────────────────────────────────────┐      │
│  │  1. BUILD PATH:                            │      │
│  │     Start with target cert                 │      │
│  │     Find issuer in store or received certs │      │
│  │     Repeat until root found                │      │
│  │                                            │      │
│  │  2. VALIDATE PATH:                         │      │
│  │     For each cert in chain (leaf to root): │      │
│  │     ├─ Check signature validity            │      │
│  │     ├─ Check validity period               │      │
│  │     ├─ Check revocation status             │      │
│  │     ├─ Check basic constraints             │      │
│  │     ├─ Check key usage                     │      │
│  │     ├─ Check name constraints              │      │
│  │     └─ Check policy constraints            │      │
│  │                                            │      │
│  │  3. CHECK POLICY:                          │      │
│  │     Verify certificate policies match      │      │
│  │     required policies                      │      │
│  │                                            │      │
│  │  4. OUTPUT: Valid/Invalid path             │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Trust Anchor:                                       │
│  ├─ Root CA certificate in trust store              │
│  ├─ Self-signed                                     │
│  └─ Must be explicitly trusted by user/system        │
└──────────────────────────────────────────────────────┘
```

---

## Trust Stores

### Operating System Trust Stores

```
┌──────────────────────────────────────────────────────┐
│              TRUST STORE LOCATIONS                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Windows:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  certlm.msc → Trusted Root Certification   │      │
│  │  Authorities → Intermediate Certification  │      │
│  │  Authorities                               │      │
│  │  Registry: HKLM\SOFTWARE\Microsoft\System  │      │
│  │           Certificates\Root\Certificates   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  macOS:                                              │
│  ┌────────────────────────────────────────────┐      │
│  │  Keychain Access → System Roots            │      │
│  │  /Library/Keychains/System.keychain        │      │
│  │  /System/Library/Keychains/SystemRoots.keychain│
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Linux:                                              │
│  ┌────────────────────────────────────────────┐      │
│  │  /etc/ssl/certs/ (Debian/Ubuntu)           │      │
│  │  /etc/pki/tls/certs/ (RHEL/CentOS)        │      │
│  │  /usr/share/ca-certificates/               │      │
│  │  update-ca-certificates (Debian)           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Browsers:                                           │
│  ┌────────────────────────────────────────────┐      │
│  │  Firefox: Own NSS store (separate!)        │      │
│  │  Chrome/Edge: Uses OS trust store          │      │
│  │  Safari: Uses macOS Keychain               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Trust Store Contents:                               │
│  ├─ ~150 Root CAs (typical)                         │
│  ├─ Regular updates (revoked CAs removed)           │
│  └─ Mozilla NSS is open source reference             │
└──────────────────────────────────────────────────────┘
```

### Custom Trust Stores

```bash
# View system trust store (Linux)
ls /etc/ssl/certs/

# View specific certificate
openssl x509 -in /etc/ssl/certs/ca-certificates.crt -text -noout | head -30

# Add custom CA (Linux)
sudo cp my-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Remove custom CA
sudo rm /usr/local/share/ca-certificates/my-ca.crt
sudo update-ca-certificates

# View trust store info (macOS)
security find-certificate -a -p /System/Library/Keychains/SystemRoots.keychain | wc -l

# View trust store info (Windows PowerShell)
Get-ChildItem -Path Cert:\LocalMachine\Root | Format-List
```

---

## Let's Encrypt

### ACME Protocol

```
┌──────────────────────────────────────────────────────┐
│              LET'S ENCRYPT / ACME                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ACME Protocol (RFC 8555):                           │
│  ┌────────────────────────────────────────────┐      │
│  │                                            │      │
│  │  1. Account Registration                  │      │
│  │     POST /acme/new-acct                   │      │
│  │     { contact: ["mailto:admin@domain.com"] }│     │
│  │                                            │      │
│  │  2. Order Creation                         │      │
│  │     POST /acme/new-order                  │      │
│  │     { identifiers: [{ type: "dns",         │      │
│  │       value: "example.com" }] }            │      │
│  │                                            │      │
│  │  3. Authorization (Domain Validation)      │      │
│  │     ├─ HTTP-01: /.well-known/acme-challenge/│    │
│  │     ├─ DNS-01: _acme-challenge TXT record  │      │
│  │     └─ TLS-ALPN-01: TLS handshake          │      │
│  │                                            │      │
│  │  4. Challenge Response                      │      │
│  │     Serve token at /.well-known/acme-challenge│  │
│  │     or create DNS TXT record               │      │
│  │                                            │      │
│  │  5. Finalization                            │      │
│  │     POST /acme/cert/{cert_id}             │      │
│  │     Provide CSR (Certificate Signing Request)│    │
│  │                                            │      │
│  │  6. Certificate Download                    │      │
│  │     GET /acme/cert/{cert_id}              │      │
│  │     Returns: leaf + intermediate cert      │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Benefits:                                           │
│  ├─ Free certificates                                │
│  ├─ Automated (certbot, acme.sh)                    │
│  ├─ 90-day validity (automatic renewal)             │
│  ├─ Trusted by all major browsers                    │
│  └─ Wildcard support (DNS-01)                       │
└──────────────────────────────────────────────────────┘
```

### Certbot Usage

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu
sudo yum install certbot python3-certbot-nginx  # CentOS

# Obtain certificate (Nginx)
sudo certbot --nginx -d example.com -d www.example.com

# Obtain certificate (Apache)
sudo certbot --apache -d example.com

# Standalone mode
sudo certbot certonly --standalone -d example.com

# DNS challenge (for wildcards)
sudo certbot certonly --manual --preferred-challenges dns \
    -d "*.example.com" -d example.com

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# View certificates
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-name example.com

# Delete certificate
sudo certbot delete --cert-name example.com
```

### acme.sh Usage

```bash
# Install acme.sh
curl https://get.acme.sh | sh

# Issue certificate
acme.sh --issue -d example.com -d www.example.com --webroot /var/www/html

# DNS API (Cloudflare)
acme.sh --issue -d example.com --dns dns_cf

# Install certificate
acme.sh --install-cert -d example.com \
    --key-file /etc/ssl/private/key.pem \
    --fullchain-file /etc/ssl/certs/cert.pem \
    --reloadcmd "systemctl reload nginx"

# Auto-renewal (cron job)
acme.sh --install-cronjob
```

---

## Certificate Pinning

### Pin Types

```
┌──────────────────────────────────────────────────────┐
│              CERTIFICATE PINNING                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. SPKI Pin (Subject Public Key Info):              │
│  ┌────────────────────────────────────────────┐      │
│  │  Pin: Hash of public key in certificate    │      │
│  │  Example: SHA-256 of SubjectPublicKeyInfo  │      │
│  │                                            │      │
│  │  Pin-Set Header:                           │      │
│  │  pin-sha256="base64==";                    │      │
│  │  pin-sha256="backup_pin==";                │      │
│  │  max-age=5184000;                          │      │
│  │  includeSubDomains;                        │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Certificate Pin (Deprecated):                    │
│  ┌────────────────────────────────────────────┐      │
│  │  Pin: Hash of entire certificate           │      │
│  │  ❌ Breaks on certificate renewal           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. Public Key Pin (HPKP):                           │
│  ┌────────────────────────────────────────────┐      │
│  │  HTTP Public Key Pinning header            │      │
│  │  ⚠ Deprecated (Chrome 102+, removed 2023) │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Pin Validation:                                     │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Compute hash of certificate's SPKI     │      │
│  │  2. Compare against pin-set                │      │
│  │  3. At least one pin must match            │      │
│  │  4. Backup pin required (for key rotation) │      │
│  │  5. max-age controls pin validity          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Current Status:                                     │
│  ├─ HPKP: Deprecated (too risky, DoS vector)        │
│  ├─ Certificate Transparency: Recommended           │
│  ├─ Expect-CT: Transitional                        │
│  └─ Embedded pins: Used in apps (iOS, Android)     │
└──────────────────────────────────────────────────────┘
```

### Application Pinning

```python
# Python requests with certificate pinning
import requests
import ssl
import hashlib
import base64

class PinnedAdapter(requests.adapters.HTTPAdapter):
    def __init__(self, pin SHA256):
        self.pin = pin

    def send(self, request, **kwargs):
        response = super().send(request, **kwargs)
        # Verify pin after connection
        cert = response.raw.connection.sock.getpeercert()
        # ... verify pin
        return response

# Using urllib3 with pinning
import urllib3

http = urllib3.PoolManager(
    ca_certs=None,
    cert_reqs='CERT_REQUIRED'
)
```

```bash
# Get certificate SPKI hash for pinning
echo | openssl s_client -connect example.com:443 2>/dev/null | \
    openssl x509 -pubkey -noout | \
    openssl pkey -pubin -outform der | \
    openssl dgst -sha256 -binary | base64
```

---

## Certificate Revocation

### Revocation Methods

```
┌──────────────────────────────────────────────────────┐
│            CERTIFICATE REVOCATION                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Certificate Revocation List (CRL):               │
│  ┌────────────────────────────────────────────┐      │
│  │  Signed list of revoked certificates       │      │
│  │  Published periodically (daily/weekly)     │      │
│  │  Contains: Serial numbers of revoked certs │      │
│  │                                            │      │
│  │  CRL Distribution Point:                   │      │
│  │  http://crl.example.com/ca.crl             │      │
│  │                                            │      │
│  │  Issues:                                   │      │
│  │  ├─ Can grow very large                    │      │
│  │  ├─ Stale data (interval between updates) │      │
│  │  └─ No real-time status                    │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Online Certificate Status Protocol (OCSP):       │
│  ┌────────────────────────────────────────────┐      │
│  │  Real-time revocation check                │      │
│  │  Client sends cert serial to OCSP responder│      │
│  │  Responder returns: Good/Revoked/Unknown   │      │
│  │                                            │      │
│  │  OCSP Request:                             │      │
│  │  POST /ocsp                                │      │
│  │  { serial: "04ab:cd:ef:12:34:56:78",      │      │
│  │    issuer: "CN=CA" }                       │      │
│  │                                            │      │
│  │  OCSP Response:                            │      │
│  │  { status: "good",                         │      │
│  │    thisUpdate: "2024-01-01T00:00:00Z",     │      │
│  │    nextUpdate: "2024-01-08T00:00:00Z" }    │      │
│  │                                            │      │
│  │  Issues:                                   │      │
│  │  ├─ Privacy concern (reveals visited sites)│      │
│  │  ├─ OCSP stapling (server sends response) │      │
│  │  └─ Can be slow (adds latency)             │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. OCSP Stapling:                                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Server fetches OCSP response              │      │
│  │  "Staples" it to TLS handshake             │      │
│  │  Client verifies stapled response          │      │
│  │  ✓ No privacy leak                         │      │
│  │  ✓ Faster (cached response)                │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Short-Lived Certificates:                        │
│  ┌────────────────────────────────────────────┐      │
│  │  No revocation check needed                │      │
│  │  Valid for hours (1-7 days)                │      │
│  │  Automatic renewal before expiry           │      │
│  │  Let's Encrypt: 90-day certificates        │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Certificate Transparency

```
┌──────────────────────────────────────────────────────┐
│           CERTIFICATE TRANSPARENCY (CT)               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Purpose: Public log of all issued certificates      │
│                                                      │
│  Components:                                         │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Log Server                             │      │
│  │     Append-only Merkle tree of certificates│      │
│  │                                            │      │
│  │  2. Monitor                                │      │
│  │     Watches for mis-issued certificates    │      │
│  │                                            │      │
│  │  3. Auditor                                │      │
│  │     Verifies log consistency               │      │
│  │     Checks for duplicate/removed entries   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  SCT (Signed Certificate Timestamp):                 │
│  ┌────────────────────────────────────────────┐      │
│  │  Proof certificate was logged              │      │
│  │  Embedded in cert, TLS extension, or OCSP  │      │
│  │  Browser requires 2-3 SCTs for trust       │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Benefits:                                           │
│  ├─ Detect mis-issuance (unauthorized certs)       │
│  ├─ Deter malicious CAs                             │
│  ├─ Enable forensic analysis                        │
│  └─ Required by Chrome for all certs (2018)         │
└──────────────────────────────────────────────────────┘
```

---

## OpenSSL Commands

### Certificate Operations

```bash
# View certificate details
openssl x509 -in cert.pem -text -noout

# View certificate chain
openssl s_client -connect example.com:443 -showcerts

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt cert.pem

# Check certificate expiration
openssl x509 -in cert.pem -noout -dates

# Check specific certificate
echo | openssl s_client -connect example.com:443 2>/dev/null | \
    openssl x509 -noout -dates

# Generate CSR
openssl req -new -key private.key -out request.csr \
    -subj "/CN=example.com/O=My Org/C=US"

# Self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout private.key -out cert.pem

# View CSR
openssl req -in request.csr -text -noout

# Convert certificate formats
openssl x509 -in cert.pem -outform DER -out cert.der
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem

# Extract public key
openssl x509 -in cert.pem -pubkey -noout

# Check key matches certificate
openssl x509 -in cert.pem -noout -modulus | md5sum
openssl rsa -in private.key -noout -modulus | md5sum
```

### OCSP Operations

```bash
# Check OCSP status
openssl ocsp -issuer issuer.pem -cert cert.pem \
    -url http://ocsp.example.com -resp_text

# OCSP stapling test (Nginx)
curl -v --tlsv1.2 --tls-max 1.2 \
    --cert-status https://example.com 2>&1 | grep -i "OCSP"
```

### Certificate Chain Verification

```bash
# Download and verify certificate chain
echo | openssl s_client -connect example.com:443 \
    -showcerts 2>/dev/null | \
    awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{print}' > chain.pem

# Verify against system trust store
openssl verify chain.pem

# Verify against specific CA
openssl verify -CAfile root-ca.pem -untrusted intermediate.pem cert.pem

# Build certificate chain
cat leaf.pem intermediate.pem root-ca.pem > fullchain.pem
```

---

## Practical Examples

### Certificate Deployment (Nginx)

```nginx
# /etc/nginx/sites-available/example.com
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # TLS Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # SSL Session
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Python Certificate Verification

```python
import ssl
import socket
import OpenSSL
from cryptography import x509
from cryptography.hazmat.backends import default_backend

def verify_certificate(hostname: str, port: int = 443) -> dict:
    """Verify certificate chain and return details."""
    context = ssl.create_default_context()

    with socket.create_connection((hostname, port)) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            cert = ssock.getpeercert()

    return {
        'subject': dict(x[0] for x in cert['subject']),
        'issuer': dict(x[0] for x in cert['issuer']),
        'serial': cert['serialNumber'],
        'notBefore': cert['notBefore'],
        'notAfter': cert['notAfter'],
        'san': cert.get('subjectAltName', []),
        'version': cert['version']
    }

def get_certificate_chain(hostname: str, port: int = 443) -> list:
    """Retrieve full certificate chain."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    with socket.create_connection((hostname, port)) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            chain = ssock.getpeercert(True)  # DER format
            cert = x509.load_der_x509_certificate(chain, default_backend())

    return cert

# Usage
cert_info = verify_certificate("example.com")
print(f"Subject: {cert_info['subject']}")
print(f"Expires: {cert_info['notAfter']}")
```

---

## Security Perspective

### Attack Techniques

```
┌──────────────────────────────────────────────────────┐
│              PKI ATTACK VECTORS                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. CA Compromise:                                   │
│  ├─ 2011: DigiNotar (rogue certs for *.google.com)  │
│  ├─ 2015: CNNIC (unauthorized intermediate)         │
│  └─ Impact: All certificates from CA are suspect    │
│                                                      │
│  2. Certificate Forgery:                             │
│  ├─ Use stolen CA private key                        │
│  ├─ Exploit CA verification weaknesses              │
│  ├─ Hash collision (MD5-based cert forgery)         │
│  └─ Defenses: CT, CA audit, HSM                     │
│                                                      │
│  3. Man-in-the-Middle (MitM):                        │
│  ├─ Intercept TLS handshake                         │
│  ├─ Present forged certificate                       │
│  ├─ Client must verify chain correctly              │
│  └─ Defenses: Certificate pinning, CT               │
│                                                      │
│  4. Downgrade Attacks:                               │
│  ├─ Force weak TLS version                           │
│  ├─ Disable certificate verification                 │
│  └─ Defenses: HSTS, certificate transparency        │
│                                                      │
│  5. Revocation Bypass:                               │
│  ├─ Client doesn't check revocation                 │
│  ├─ OCSP soft-fail (fail open)                      │
│  └─ Defenses: OCSP stapling, short-lived certs      │
│                                                      │
│  6. Private Key Theft:                               │
│  ├─ Server compromise                                │
│  ├─ Weak key generation                              │
│  ├─ Side-channel attacks                             │
│  └─ Defenses: HSM, key management, rotation         │
└──────────────────────────────────────────────────────┘
```

### Defense Mechanisms

```
┌──────────────────────────────────────────────────────┐
│              PKI DEFENSE MECHANISMS                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Use Certificate Transparency (CT)                │
│  ✓ Enable OCSP stapling                              │
│  ✓ Implement HSTS (HTTP Strict Transport Security)  │
│  ✓ Use short-lived certificates (90 days)            │
│  ✓ Regular certificate rotation                      │
│  ✓ Monitor certificate issuance (CT logs)           │
│  ✓ Use CAA DNS records (control which CAs issue)    │
│  ✓ Store private keys in HSM/KMS                    │
│  ✓ Validate full certificate chain                   │
│  ✓ Check revocation status                           │
│  ✓ Use Certificate Transparency in applications      │
└──────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Fundamental

1. **Q: What is the purpose of a digital certificate?**
   A: A certificate binds a public key to an identity (domain, organization) using a digital signature from a trusted CA. It enables trust without prior key exchange.

2. **Q: What is the difference between a certificate and a key?**
   A: A key is a cryptographic secret (private) or public value. A certificate is a signed document that binds a public key to an identity.

3. **Q: Why are intermediate CAs used?**
   A: Intermediate CAs protect the root CA (kept offline). If compromised, only the intermediate is affected, not the root. Root key exposure would invalidate all certificates.

### Intermediate

4. **Q: What is Certificate Transparency and why is it needed?**
   A: CT is a system of public logs recording all issued certificates. It detects mis-issuance and unauthorized certificates, protecting against CA compromise.

5. **Q: What is OCSP stapling and why is it used?**
   A: The server fetches its own OCSP response and "staples" it to the TLS handshake. This avoids client-side OCSP requests (privacy, performance) and ensures current revocation status.

6. **Q: How does Let's Encrypt validate domain ownership?**
   A: ACME protocol supports HTTP-01 (serve token at /.well-known/acme-challenge/), DNS-01 (create TXT record), and TLS-ALPN-01 (special TLS handshake). HTTP-01 is most common.

### Advanced

7. **Q: What is the difference between HPKP and Certificate Transparency?**
   A: HPKP (deprecated) pinned specific keys in browsers. CT logs all certificates for monitoring. CT is safer (no DoS risk) and now the industry standard.

8. **Q: How do you handle certificate revocation at scale?**
   A: Use short-lived certificates (hours-days) to avoid revocation. For existing certs, use OCSP stapling with fallback. Monitor CT logs for unexpected issuance.

9. **Q: What is a CAA DNS record and how does it help?**
   A: CAA records specify which CAs can issue certificates for a domain. Only the listed CAs will issue, preventing unauthorized issuance. Example: `example.com. CAA 0 issue "letsencrypt.org"`.

---

## Hands-on Labs

### Lab 1: Self-Signed Certificate

```bash
# Step 1: Generate private key
openssl genrsa -out server.key 2048

# Step 2: Generate CSR
openssl req -new -key server.key -out server.csr \
    -subj "/CN=localhost/O=Test/C=US"

# Step 3: Self-sign certificate
openssl x509 -req -days 365 -in server.csr \
    -signkey server.key -out server.crt

# Step 4: Verify
openssl x509 -in server.crt -text -noout

# Step 5: Test with web server
openssl s_server -key server.key -cert server.crt -port 8443 &
curl -k https://localhost:8443
```

### Lab 2: Certificate Chain Creation

```bash
# Create Root CA
openssl genrsa -out root.key 4096
openssl req -new -x509 -days 3650 -key root.key -out root.crt \
    -subj "/CN=My Root CA"

# Create Intermediate CA
openssl genrsa -out intermediate.key 2048
openssl req -new -key intermediate.key -out intermediate.csr \
    -subj "/CN=My Intermediate CA"

# Sign Intermediate with Root
openssl x509 -req -days 1825 -in intermediate.csr \
    -CA root.crt -CAkey root.key -CAcreateserial \
    -out intermediate.crt

# Create leaf certificate
openssl genrsa -out leaf.key 2048
openssl req -new -key leaf.key -out leaf.csr \
    -subj "/CN=example.com"

# Sign leaf with Intermediate
openssl x509 -req -days 90 -in leaf.csr \
    -CA intermediate.crt -CAkey intermediate.key -CAcreateserial \
    -out leaf.crt

# Build full chain
cat leaf.crt intermediate.crt root.crt > fullchain.crt

# Verify chain
openssl verify -CAfile root.crt -untrusted intermediate.crt leaf.crt
```

### Lab 3: OCSP Responder Setup

```bash
# Create OCSP responder configuration
cat > ocsp.cnf << EOF
[ocsp]
default_ca = CA_default

[CA_default]
database = index.txt
serial = serial
certificate = issuer.crt
default_days = 7
default_md = sha256

[policy_match]
countryName = match
stateOrProvinceName = optional
organizationName = optional
organizationalUnitName = optional
commonName = supplied
emailAddress = optional
EOF

# Start OCSP responder
openssl ocsp -index index.txt -port 8888 \
    -rsigner issuer.crt -rkey issuer.key \
    -CA root.crt -text
```

---

## Summary Table

| Component | Purpose | Trust Level | Example |
|-----------|---------|-------------|---------|
| Root CA | Signs intermediate CAs | Self-signed | DigiCert, Let's Encrypt |
| Intermediate CA | Signs end-entity certs | Signed by root | ISRG Root X1 |
| End-Entity | Server/client identity | Signed by intermediate | example.com cert |
| Trust Store | Collection of trusted CAs | OS/browser managed | System Roots |
| CRL | List of revoked certs | Signed by CA | Periodic updates |
| OCSP | Real-time revocation check | Signed by CA | responder.example.com |
| CT Log | Public certificate log | Append-only | Google Argon |

---

## References

- RFC 5280 (X.509 PKI Certificate Profile)
- RFC 6960 (OCSP)
- RFC 8555 (ACME Protocol)
- RFC 6962 (Certificate Transparency)
- CA/Browser Forum Baseline Requirements
- NIST SP 800-57 (Key Management)
