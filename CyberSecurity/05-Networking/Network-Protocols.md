# Network Protocols

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    OSI / TCP-IP MODEL                           │
├──────────────┬──────────────┬───────────────┬───────────────────┤
│ OSI Layer    │ TCP/IP Layer │ Protocols     │ Port(s)           │
├──────────────┼──────────────┼───────────────┼───────────────────┤
│ 7. App       │              │ HTTP, HTTPS   │ 80, 443           │
│              │              │ FTP           │ 20, 21            │
│              │              │ SSH           │ 22                │
│              │              │ SMTP          │ 25, 587, 465      │
│              │              │ POP3          │ 110, 995          │
│              │              │ IMAP          │ 143, 993          │
│              │              │ DNS           │ 53                │
│              │              │ SNMP          │ 161, 162          │
│              │              │ NTP           │ 123               │
│              │              │ DHCP          │ 67, 68            │
│              │              │ Telnet        │ 23                │
├──────────────┤  Application │───────────────│───────────────────│
│ 6. Present   │              │ TLS/SSL       │ 443               │
├──────────────┤              │               │                   │
│ 5. Session   │              │               │                   │
├──────────────┼  Transport   │───────────────│───────────────────│
│ 4. Transport │              │ TCP, UDP      │ Various           │
├──────────────┼──────────────┼───────────────┼───────────────────│
│ 3. Network   │  Internet    │ IP, ICMP      │                   │
├──────────────┼──────────────┼───────────────┼───────────────────│
│ 2. Data Link │              │ Ethernet      │                   │
├──────────────┼──────────────┼───────────────┼───────────────────│
│ 1. Physical  │  Link        │ Cables, WiFi  │                   │
└──────────────┴──────────────┴───────────────┴───────────────────┘
```

## Table of Contents

1. [HTTP/HTTPS](#httphttps)
2. [DNS](#dns)
3. [DHCP](#dhcp)
4. [FTP, SSH, SMTP, POP3, IMAP](#file-and-remote-protocols)
5. [SNMP and NTP](#management-protocols)
6. [Protocol Security (TLS, SRTP, DNSSEC)](#protocol-security)
7. [Port Numbers and Well-Known Ports](#port-numbers)
8. [Attacks and Defenses](#attacks-and-defenses)
9. [Tools and Debugging](#tools-and-debugging)
10. [Interview Questions](#interview-questions)
11. [Hands-On Labs](#hands-on-labs)
12. [Summary Table](#summary-table)

---

## HTTP/HTTPS

### HTTP Overview

HTTP (HyperText Transfer Protocol) is an application-layer protocol for transmitting hypermedia documents. It follows a client-server model where the client sends a request and the server returns a response.

### HTTP Methods

| Method   | Purpose                     | Request Body | Safe | Idempotent | Cacheable |
|----------|-----------------------------|-------------|------|------------|-----------|
| GET      | Retrieve resource           | No          | Yes  | Yes        | Yes       |
| HEAD     | GET without body            | No          | Yes  | Yes        | Yes       |
| POST     | Create resource             | Yes         | No   | No         | Conditional |
| PUT      | Replace entire resource     | Yes         | No   | Yes        | No        |
| PATCH    | Partial update              | Yes         | No   | No         | No        |
| DELETE   | Remove resource             | Optional    | No   | Yes        | No        |
| OPTIONS  | Describe communication      | No          | Yes  | Yes        | No        |
| TRACE    | Loop-back test              | No          | Yes  | Yes        | No        |
| CONNECT  | Tunnel through proxy        | No          | No   | No         | No        |

### HTTP Request Structure

```
┌─────────────────────────────────────────────┐
│ HTTP Request                                │
├─────────────────────────────────────────────┤
│ GET /index.html HTTP/1.1                     │  ← Request Line
│ Host: www.example.com                        │  ← Headers
│ User-Agent: Mozilla/5.0                      │
│ Accept: text/html,application/xhtml+xml     │
│ Accept-Language: en-US,en;q=0.9             │
│ Accept-Encoding: gzip, deflate, br          │
│ Connection: keep-alive                       │
│ Cookie: session=abc123; theme=dark          │
│ Content-Type: application/json              │
│ Content-Length: 348                          │
│ Authorization: Bearer eyJhbGci...           │
│                                             │  ← Blank Line
│ {"username":"admin","password":"xxx"}        │  ← Body (POST/PUT)
└─────────────────────────────────────────────┘
```

### HTTP Response Structure

```
┌─────────────────────────────────────────────┐
│ HTTP Response                               │
├─────────────────────────────────────────────┤
│ HTTP/1.1 200 OK                             │  ← Status Line
│ Date: Thu, 16 Jul 2026 10:00:00 GMT         │  ← Headers
│ Server: Apache/2.4.51                       │
│ Content-Type: text/html; charset=UTF-8      │
│ Content-Length: 1234                         │
│ Cache-Control: max-age=3600                 │
│ Set-Cookie: session=xyz789; HttpOnly; Secure│
│ X-Frame-Options: DENY                       │
│ Strict-Transport-Security: max-age=31536000 │
│                                             │
│ <html>...</html>                            │  ← Body
└─────────────────────────────────────────────┘
```

### HTTP Status Codes

**1xx - Informational**
| Code | Meaning |
|------|---------|
| 100  | Continue |
| 101  | Switching Protocols |
| 102  | Processing (WebDAV) |
| 103  | Early Hints |

**2xx - Success**
| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 202  | Accepted |
| 204  | No Content |
| 206  | Partial Content |

**3xx - Redirection**
| Code | Meaning |
|------|---------|
| 301  | Moved Permanently |
| 302  | Found (Temporary) |
| 304  | Not Modified |
| 307  | Temporary Redirect |
| 308  | Permanent Redirect |

**4xx - Client Error**
| Code | Meaning |
|------|---------|
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 405  | Method Not Allowed |
| 408  | Request Timeout |
| 409  | Conflict |
| 413  | Payload Too Large |
| 429  | Too Many Requests |

**5xx - Server Error**
| Code | Meaning |
|------|---------|
| 500  | Internal Server Error |
| 501  | Not Implemented |
| 502  | Bad Gateway |
| 503  | Service Unavailable |
| 504  | Gateway Timeout |

### HTTPS (HTTP Secure)

HTTPS = HTTP + TLS (Transport Layer Security)

```
┌──────────────┐          ┌──────────────┐
│   Client     │          │   Server     │
├──────────────┤──────────┤──────────────┤
│ 1. ClientHello            │
│    - Supported ciphers    │
│    - TLS version          │
│    - Random number        │ ──────────► │
│                           │             │
│         2. ServerHello    │             │
│    - Chosen cipher suite  │             │
│    - Random number        │             │
│    - Certificate          │ ◄────────── │
│                           │             │
│ 3. Verify Certificate     │             │
│    - Check CA chain       │             │
│    - Check revocation     │             │
│    - Check hostname       │             │
│                           │             │
│ 4. Key Exchange           │             │
│    - Pre-master secret    │ ──────────► │
│                           │             │
│ 5. Both derive session    │             │
│    keys from randoms      │             │
│                           │             │
│ 6. ChangeCipherSpec       │ ──────────► │
│                           │             │
│ 7. Finished (encrypted)   │ ◄─────────► │
│                           │             │
│ 8. Encrypted Data         │ ◄─────────► │
└──────────────┘──────────┘──────────────┘
```

### Key HTTP Security Headers

| Header | Purpose |
|--------|---------|
| `Strict-Transport-Security` | Enforce HTTPS for specified time |
| `Content-Security-Policy` | Control resource loading origins |
| `X-Content-Type-Options` | Prevent MIME sniffing (`nosniff`) |
| `X-Frame-Options` | Prevent clickjacking (`DENY`/`SAMEORIGIN`) |
| `X-XSS-Protection` | Enable XSS filter (`1; mode=block`) |
| `Referrer-Policy` | Control referrer information leakage |
| `Permissions-Policy` | Control browser feature access |
| `Cross-Origin-Opener-Policy` | Isolate browsing context |
| `Cross-Origin-Resource-Policy` | Control cross-origin resource loading |

---

## DNS

### DNS Overview

DNS (Domain Name System) translates domain names to IP addresses. It operates on UDP port 53 (queries) and TCP port 53 (zone transfers, large responses).

### DNS Resolution Process

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. Check local cache
     │ 2. Check hosts file
     │ 3. Query recursive resolver
     ▼
┌──────────────────┐
│ Recursive         │
│ Resolver          │
│ (ISP/8.8.8.8)    │
└────┬─────────────┘
     │ 4. Query root server (.)
     ▼
┌──────────────────┐
│ Root DNS Server   │
│ (13 clusters)     │
│ Returns: .com NS  │
└──────────────────┘
     │ 5. Query TLD server
     ▼
┌──────────────────┐
│ TLD Server        │
│ (.com)            │
│ Returns: example. │
│ com NS            │
└──────────────────┘
     │ 6. Query authoritative
     ▼
┌──────────────────┐
│ Authoritative     │
│ Server            │
│ Returns: A record │
│ 93.184.216.34    │
└──────────────────┘
     │ 7. Response cached
     │ 8. Response to client
     ▼
┌──────────┐
│  Client  │
│ Has IP   │
└──────────┘
```

### DNS Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| A      | Maps domain to IPv4 | example.com → 93.184.216.34 |
| AAAA   | Maps domain to IPv6 | example.com → 2606:2800:220:1:... |
| MX     | Mail exchange server | example.com → mail.example.com (priority 10) |
| CNAME  | Canonical name (alias) | www.example.com → example.com |
| TXT    | Text information | SPF, DKIM, domain verification |
| NS     | Nameserver for domain | example.com → ns1.example.com |
| SOA    | Start of Authority | Zone metadata, serial, refresh intervals |
| PTR    | Reverse lookup (IP→name) | 34.216.184.93 → example.com |
| SRV    | Service location | _sip._tcp.example.com → server:5060 |
| CAA    | Certificate Authority auth | example.com → letsencrypt.org |

### DNS Query Types

| Type | Description |
|------|-------------|
| Recursive | Resolver handles entire resolution |
| Iterative | Each server returns referral |
| Inverse | IP to domain lookup |
| Zone Transfer | Full zone copy (AXFR/IXFR) |

---

## DHCP

### DHCP DORA Process

```
┌──────────┐                        ┌──────────────┐
│  Client  │                        │ DHCP Server  │
└────┬─────┘                        └──────┬───────┘
     │                                      │
     │  1. DHCP DISCOVER (broadcast)        │
     │  src: 0.0.0.0, dst: 255.255.255.255 │
     │  UDP: src 68, dst 67                │
     │ ──────────────────────────────────► │
     │                                      │
     │  2. DHCP OFFER (broadcast/unicast)  │
     │  Offered IP, subnet, gateway, DNS   │
     │ ◄────────────────────────────────── │
     │                                      │
     │  3. DHCP REQUEST (broadcast)        │
     │  "I accept IP X.X.X.X"             │
     │ ──────────────────────────────────► │
     │                                      │
     │  4. DHCP ACK (broadcast/unicast)    │
     │  Confirms lease, provides config    │
     │ ◄────────────────────────────────── │
     │                                      │
     │  Client configures network stack    │
     │  Lease timer starts                  │
     └──────────────────────────────────────┘
```

### DHCP Options

| Option | Description |
|--------|-------------|
| 1      | Subnet Mask |
| 3      | Router (Default Gateway) |
| 6      | DNS Server |
| 15     | Domain Name |
| 44     | WINS Server |
| 51     | Lease Time |
| 53     | Message Type |
| 66     | TFTP Server (PXE boot) |
| 150    | TFTP Server Address |

### DHCP Lease Lifecycle

```
Time ──────────────────────────────────────────►
│                                               │
├── T1 (50%) ── Renewal attempt ────────────────┤
│   Client sends unicast REQUEST to original    │
│   server to extend lease                      │
│                                               │
├── T2 (87.5%) ── Rebind attempt ──────────────┤
│   Client broadcasts REQUEST to any server     │
│   if original server unresponsive             │
│                                               │
├── Lease Expiry ── Release ───────────────────┤
│   Client releases IP, sends DISCOVER          │
│                                               │
└───────────────────────────────────────────────┘
```

---

## File and Remote Protocols

### FTP (File Transfer Protocol)

```
Control Connection (Port 21)    Data Connection (Port 20)
┌────────┐                     ┌────────┐
│ Client │──── SYN ──────────►│ Server │
│        │◄── SYN-ACK ───────│        │
│        │──── ACK ──────────►│        │
│        │──── USER ─────────►│        │
│        │──── PASS ─────────►│        │
│        │◄── 230 OK ─────────│        │
│        │──── RETR file.txt ─►│        │
│        │                     │        │
│        │◄── PORT 20 ─────────│        │  Active Mode
│        │                     │        │
│        │──── PASV ──────────►│        │
│        │◄── 227 (port) ─────│        │  Passive Mode
└────────┘                     └────────┘
```

| Mode | Direction | Port | Use Case |
|------|-----------|------|----------|
| Active | Server→Client | 20→ephemeral | Simple networks |
| Passive | Client→Server | ephemeral→ephemeral | Behind NAT/Firewall |

**FTP Vulnerabilities:**
- Credentials transmitted in plaintext
- No encryption of data in transit
- Vulnerable to bounce attacks
- Anonymous FTP can expose sensitive data

**Secure Alternatives:** SFTP (SSH-based), FTPS (TLS-based)

### SSH (Secure Shell)

```
┌──────────────┐                    ┌──────────────┐
│   Client     │                    │   Server     │
├──────────────┤────────────────────┤──────────────┤
│ 1. TCP Connection (port 22)       │
│ ────────────────────────────────► │
│                                   │
│ 2. Protocol Version Exchange      │
│ ──── "SSH-2.0-OpenSSH_8.4" ────► │
│ ◄── "SSH-2.0-OpenSSH_8.4" ────── │
│                                   │
│ 3. Key Exchange Init              │
│    (Supported algorithms)         │
│ ◄══════════════════════════════► │
│                                   │
│ 4. Diffie-Hellman Key Exchange    │
│    (ECDH / Curve25519)           │
│ ◄══════════════════════════════► │
│                                   │
│ 5. Server Key Verification        │
│    (Known hosts check)            │
│                                   │
│ 6. Authentication                │
│    - Password                     │
│    - Public Key                   │
│    - Keyboard Interactive         │
│ ────────────────────────────────► │
│                                   │
│ 7. Encrypted Session              │
│ ◄══════════════════════════════► │
└───────────────────────────────────┘
```

**SSH Key Types:**
| Type | Algorithm | Bits | Security |
|------|-----------|------|----------|
| RSA  | Rivest-Shamir-Adleman | 2048-4096 | Legacy |
| DSA  | Digital Signature Algorithm | 1024 | Deprecated |
| ECDSA | Elliptic Curve DSA | 256-521 | Good |
| Ed25519 | Edwards Curve | 256 | Recommended |

### SMTP (Simple Mail Transfer Protocol)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Mail     │     │ Mail     │
│ (MUA)    │     │ Relay    │     │ Server   │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │  25/587         │  25           │  25/110/143
     │                 │               │
     │ EHLO domain     │               │
     │────────────────►│               │
     │ 250 OK          │               │
     │◄────────────────│               │
     │ AUTH login      │               │
     │────────────────►│               │
     │ 235 Auth OK     │               │
     │◄────────────────│               │
     │ MAIL FROM:<..>  │               │
     │────────────────►│               │
     │ 250 OK          │  MAIL FROM:   │
     │◄────────────────│──────────────►│
     │ RCPT TO:<..>    │               │
     │────────────────►│──────────────►│
     │ DATA            │               │
     │────────────────►│──────────────►│
     │ Subject: Hello  │               │
     │ Body...         │               │
     │ .               │               │
     │ 250 OK          │ 250 OK        │
     │◄────────────────│◄──────────────│
     │ QUIT            │               │
     │────────────────►│──────────────►│
     │ 221 Bye         │               │
     │◄────────────────│◄──────────────│
```

**SMTP Ports:**
| Port | Protocol | Use |
|------|----------|-----|
| 25   | SMTP     | Server-to-server |
| 587  | SMTP     | Client submission (STARTTLS) |
| 465  | SMTPS    | Implicit TLS (deprecated) |

### POP3 (Post Office Protocol v3)

- Connects to port 110 (or 995 with SSL)
- Downloads emails to client
- Deletes from server after download
- Simple but limited (single-device access)

**POP3 Commands:**
```
USER username       → +OK
PASS password       → +OK
LIST                → List of messages
RETR 1              → Retrieve message 1
DELE 1              → Mark message 1 for deletion
QUIT                → Apply changes, disconnect
```

### IMAP (Internet Message Access Protocol)

- Connects to port 143 (or 993 with SSL)
- Emails remain on server
- Supports folders, flags, search
- Multi-device synchronization

**IMAP Commands:**
```
LOGIN user pass     → OK
SELECT INBOX        → Selected mailbox
FETCH 1 BODY[]      → Retrieve message
SEARCH UNSEEN       → Find unread
COPY 1 "Archive"    → Copy message
STORE 1 +FLAGS \Seen│ Mark as read
LOGOUT              → Disconnect
```

| Feature | POP3 | IMAP |
|---------|------|------|
| Storage | Local | Server |
| Folders | No | Yes |
| Multi-device | No | Yes |
| Bandwidth | Low | Higher |
| Offline access | Yes | Limited |

---

## Management Protocols

### SNMP (Simple Network Management Protocol)

```
┌──────────┐    UDP/161    ┌──────────┐
│ Manager  │◄─────────────│ Agent    │
│ (NMS)    │              │ (Device) │
└────┬─────┘              └──────────┘
     │  GET / SET
     │───────────────────►│
     │  Response          │
     │◄───────────────────│
     │                    │
     │  Trap (port 162)   │
     │◄───────────────────│
```

**SNMP Versions:**
| Version | Security | Auth | Encryption |
|---------|----------|------|------------|
| v1      | Community strings | No | No |
| v2c     | Community strings | No | No |
| v3      | USM + USM | Yes (MD5/SHA) | Yes (DES/AES) |

**SNMP MIB Objects:**
| OID | Description |
|-----|-------------|
| 1.3.6.1.2.1.1.1 | sysDescr |
| 1.3.6.1.2.1.1.3 | sysUpTime |
| 1.3.6.1.2.1.1.5 | sysName |
| 1.3.6.1.2.1.2.1 | ifNumber |

### NTP (Network Time Protocol)

```
┌──────────┐    UDP/123    ┌──────────┐
│  Client  │◄─────────────│  NTP     │
│          │──────────────►│  Server  │
└──────────┘              └──────────┘

NTP Stratum Hierarchy:
Stratum 0: Atomic clocks, GPS receivers
Stratum 1: Primary servers (directly connected to Stratum 0)
Stratum 2: Secondary servers (sync with Stratum 1)
Stratum 3: Tertiary servers
...
Stratum 15: Maximum practical stratum
```

**NTP Attack: NTP Amplification**
- Attacker sends `monlist` command with spoofed source IP
- Amplification factor: up to 556x
- Used in DDoS attacks

---

## Protocol Security

### TLS (Transport Layer Security)

**TLS 1.3 Handshake (1-RTT):**
```
Client                              Server
  │                                    │
  │──── ClientHello + KeyShare ──────►│
  │     (Supported ciphers, SNI)      │
  │                                    │
  │◄── ServerHello + KeyShare ───────│
  │    Certificate                     │
  │    CertificateVerify               │
  │    Finished                        │
  │                                    │
  │──── Finished ─────────────────────►│
  │                                    │
  │◄════════ Encrypted Data ═════════►│
```

**TLS 1.2 vs 1.3:**
| Feature | TLS 1.2 | TLS 1.3 |
|---------|---------|---------|
| Handshake RTT | 2-RTT | 1-RTT (0-RTT possible) |
| Key Exchange | RSA, DH, ECDH | ECDHE only |
| Cipher Suites | Many | 5 only |
| Forward Secrecy | Optional | Mandatory |
| Session Resumption | Session IDs, tickets | PSK only |

### SRTP (Secure Real-time Transport Protocol)

- Encryption for VoIP and real-time media
- AES-128 encryption
- HMAC-SHA1 authentication
- Protects RTP/RTCP packets

### DNSSEC (DNS Security Extensions)

```
DNSSEC Chain of Trust:

Root Zone (KSK)
    │ Signs
    ▼
.com Zone (KSK)
    │ Signs
    ▼
example.com Zone (KSK)
    │ Signs
    ▼
www.example.com (RRSIG)
```

**DNSSEC Record Types:**
| Record | Purpose |
|--------|---------|
| RRSIG | Digital signature for a record set |
| DNSKEY | Public key for DNSSEC validation |
| DS | Delegation Signer (parent-child trust) |
| NSEC | authenticated denial of existence |
| NSEC3 | Hashed authenticated denial of existence |

---

## Port Numbers

### Well-Known Ports (0-1023)

| Port | Protocol | Service | Notes |
|------|----------|---------|-------|
| 20   | TCP      | FTP Data | Active mode data channel |
| 21   | TCP      | FTP Control | FTP command channel |
| 22   | TCP      | SSH | Secure Shell |
| 23   | TCP      | Telnet | Unencrypted remote access |
| 25   | TCP      | SMTP | Mail sending |
| 53   | TCP/UDP  | DNS | Domain resolution |
| 67   | UDP      | DHCP Server | |
| 68   | UDP      | DHCP Client | |
| 80   | TCP      | HTTP | Web traffic |
| 110  | TCP      | POP3 | Mail retrieval |
| 123  | UDP      | NTP | Time sync |
| 143  | TCP      | IMAP | Mail access |
| 161  | UDP      | SNMP | Management queries |
| 162  | UDP      | SNMP Trap | Management alerts |
| 443  | TCP      | HTTPS | Secure web traffic |
| 465  | TCP      | SMTPS | SMTP over SSL (deprecated) |
| 587  | TCP      | SMTP (submission) | Client mail submission |
| 993  | TCP      | IMAPS | IMAP over SSL |
| 995  | TCP      | POP3S | POP3 over SSL |

### Registered Ports (1024-49151)

| Port | Protocol | Service |
|------|----------|---------|
| 1433 | TCP      | Microsoft SQL Server |
| 1521 | TCP      | Oracle Database |
| 3306 | TCP      | MySQL |
| 3389 | TCP      | RDP |
| 5432 | TCP      | PostgreSQL |
| 5060 | TCP/UDP  | SIP |
| 5061 | TCP      | SIP-TLS |
| 8080 | TCP      | HTTP Proxy |
| 8443 | TCP      | HTTPS Alternate |

### Dynamic/Ephemeral Ports (49152-65535)

- Used by client applications as source ports
- Assigned by OS when connecting to a service
- Range varies by OS:
  - Linux: 32768-60999
  - Windows: 49152-65535
  - macOS: 49152-65535

---

## Attacks and Defenses

### Protocol-Specific Attacks

| Attack | Target Protocol | Technique |
|--------|----------------|-----------|
| HTTP Smuggling | HTTP | Exploiting parsing inconsistencies |
| HTTP Request Smuggling | HTTP | CL/TE header conflicts |
| DNS Cache Poisoning | DNS | Injecting forged DNS records |
| DNS Amplification | DNS | Amplified DDoS via open resolvers |
| DHCP Starvation | DHCP | Exhausting IP address pool |
| DHCP Spoofing | DHCP | Rogue DHCP server |
| FTP Bounce | FTP | Using PORT command for port scanning |
| SSH Brute Force | SSH | Password guessing |
| SNMP Enumeration | SNMP | Community string guessing |
| NTP Amplification | NTP | monlist amplification |
| SMTP Open Relay | SMTP | Using server for spam |

### Defense Strategies

| Defense | Protocols Protected |
|---------|-------------------|
| TLS 1.3 | HTTP, SMTP, IMAP, POP3, FTP |
| DNSSEC | DNS |
| IPSec | IP layer |
| SRTP | RTP (VoIP) |
| Network segmentation | All |
| Protocol-level rate limiting | All |
| Input validation | HTTP, SMTP, DNS |
| Certificate pinning | TLS |
| MFA | SSH, VPN, web apps |
| Fail2Ban | SSH, HTTP, SMTP |

---

## Tools and Debugging

### Protocol Analysis Tools

| Tool | Purpose | Protocols |
|------|---------|-----------|
| Wireshark | Packet capture/analysis | All |
| tcpdump | Command-line capture | All |
| nmap | Port scanning | TCP/UDP |
| dig/nslookup | DNS queries | DNS |
| curl | HTTP testing | HTTP/HTTPS |
| openssl | TLS testing | TLS |
| netcat | Raw connections | TCP/UDP |
| snmpwalk | SNMP testing | SNMP |
| ntpdate | NTP testing | NTP |

### Common Debug Commands

```bash
# DNS Resolution
dig example.com A
dig +trace example.com
dig @8.8.8.8 example.com

# HTTP Testing
curl -v https://example.com
curl -I https://example.com
curl -X POST -d '{"key":"val"}' -H "Content-Type: application/json" https://api.example.com

# TLS Inspection
openssl s_client -connect example.com:443
openssl s_client -connect example.com:443 -tls1_3

# SNMP Testing
snmpwalk -v2c -c public 192.168.1.1
snmpget -v3 -u admin -l authPriv -a SHA -A authpass -x AES -X privpass 192.168.1.1 sysDescr.0

# NTP Testing
ntpdate -q pool.ntp.org
ntpq -p

# Port Scanning
nmap -sT -p 1-65535 target
nmap -sU -p 53,123,161 target
nmap -sV target
```

---

## Interview Questions

### Basic

1. What is the difference between HTTP and HTTPS?
2. What port does DNS use? What about DHCP?
3. Explain the DNS resolution process.
4. What are the DHCP DORA steps?
5. What is the difference between POP3 and IMAP?

### Intermediate

6. What makes TLS 1.3 more secure than TLS 1.2?
7. How does DNSSEC prevent cache poisoning?
8. What are the security implications of running SNMPv2c?
9. Explain the difference between active and passive FTP.
10. What is DNS tunneling and how is it used in attacks?

### Advanced

11. How would you detect HTTP request smuggling in traffic?
12. Explain the TLS 1.3 handshake in detail.
13. How does SRTP protect VoIP communications?
14. What are the implications of DNS rebinding attacks?
15. How would you defend against a DHCP starvation attack?

---

## Hands-On Labs

### Lab 1: HTTP Header Analysis
```bash
# Capture HTTP traffic with Wireshark filter
tshark -i eth0 -f "port 80" -Y "http" -T fields \
  -e http.request.method -e http.request.uri -e http.response.code

# Test HTTP headers with curl
curl -v -I http://example.com
```

### Lab 2: DNS Resolution Tracing
```bash
# Trace full DNS resolution path
dig +trace example.com

# Check DNSSEC validation
dig example.com +dnssec
delv example.com
```

### Lab 3: SSH Key Analysis
```bash
# Generate and inspect SSH keys
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
ssh-keygen -lf ~/.ssh/id_ed25519.pub

# Analyze SSH algorithms
ssh -vvv -o "KexAlgorithms=curve25519-sha256" user@host
```

### Lab 4: TLS Configuration Testing
```bash
# Test TLS configuration
testssl.sh https://example.com

# Check supported cipher suites
openssl s_client -connect example.com:443 -cipher 'ECDHE-RSA-AES256-GCM-SHA384'
```

### Lab 5: SNMP Enumeration
```bash
# Walk MIB tree
snmpwalk -v2c -c public 192.168.1.0/24 1.3.6.1.2.1

# Check for default community strings
onesixtyone -c community.txt 192.168.1.0/24
```

---

## Summary Table

| Protocol | Port | Transport | Encryption | Authentication | Common Attacks |
|----------|------|-----------|------------|----------------|----------------|
| HTTP | 80 | TCP | None | None | XSS, CSRF, Smuggling |
| HTTPS | 443 | TCP | TLS | Certificate | MITM, Stripping |
| DNS | 53 | UDP/TCP | DNSSEC | None | Poisoning, Amplification |
| DHCP | 67/68 | UDP | None | None | Starvation, Spoofing |
| FTP | 20/21 | TCP | None (FTPS: TLS) | Username/Password | Bounce, Brute Force |
| SSH | 22 | TCP | Yes (AES) | Keys/Password | Brute Force, Enumeration |
| SMTP | 25/587 | TCP | STARTTLS | Username/Password | Open Relay, Phishing |
| POP3 | 110/995 | TCP | POP3S (SSL) | Username/Password | Credential Theft |
| IMAP | 143/993 | TCP | IMAPS (SSL) | Username/Password | Mailbox Enumeration |
| SNMP | 161/162 | UDP | v3 only | Community/User | Enumeration, DDoS |
| NTP | 123 | UDP | NTS (optional) | None | Amplification, Spoofing |
| Telnet | 23 | TCP | None | Username/Password | Credential Sniffing |

---

## Related Topics

- [TCP/IP Deep Dive](TCP-IP-Deep-Dive.md)
- [DNS & DHCP](DNS-DHCP.md)
- [Firewalls, IDS & IPS](Firewalls-IDS-IPS.md)
- [Network Analysis](Network-Analysis.md)
