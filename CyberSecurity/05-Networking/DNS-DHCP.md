# DNS & DHCP

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OSI / TCP-IP MODEL                               │
├──────────────┬──────────────┬───────────────────────────────────────┤
│ OSI Layer    │ TCP/IP Layer │ Protocols / Functions                │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 7. App       │              │ HTTP, FTP, SSH, SMTP                 │
│ 6. Present   │  Application │ Encoding, Compression               │
│ 5. Session   │              │ Session management                   │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 4. Transport │  Transport   │ TCP (DNS zone transfer, large resp)  │
│              │              │ UDP (DNS queries, DHCP)              │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 3. Network   │  Internet    │ IP, ICMP                             │
│              │              │ ┌───────────────────────────────────┐ │
│              │              │ │ DNS (Port 53)                     │ │
│              │              │ │ DHCP (Ports 67/68)                │ │
│              │              │ └───────────────────────────────────┘ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 2. Data Link │  Link        │ Ethernet, Wi-Fi                      │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 1. Physical  │              │ Cables, Signals                      │
└──────────────┴──────────────┴───────────────────────────────────────┘

DNS operates at Application layer but uses UDP (Transport) for queries
DHCP operates at Application layer but uses UDP (Transport) for DORA
```

## Table of Contents

1. [DNS Hierarchy](#dns-hierarchy)
2. [DNS Record Types](#dns-record-types)
3. [DNS Resolution Process](#dns-resolution-process)
4. [DHCP DORA Process](#dhcp-dora-process)
5. [DHCP Options](#dhcp-options)
6. [DNS Architecture](#dns-architecture)
7. [DNS Attacks](#dns-attacks)
8. [DHCP Attacks](#dhcp-attacks)
9. [Defenses](#defenses)
10. [Tools and Debugging](#tools-and-debugging)
11. [Interview Questions](#interview-questions)
12. [Hands-On Labs](#hands-on-labs)
13. [Summary Table](#summary-table)

---

## DNS Hierarchy

### Global DNS Structure

```
                        Root Zone (.)
                    ┌──────────────────┐
                    │  13 Root Server  │
                    │  Clusters        │
                    │  a.root-servers  │
                    │  .net to m.root  │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
     ┌────────────┐   ┌────────────┐   ┌────────────┐
     │  .com TLD  │   │  .org TLD  │   │  .net TLD  │
     │  Servers   │   │  Servers   │   │  Servers   │
     └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
           │                │                │
     ┌─────┼─────┐          │                │
     │     │     │          │                │
     ▼     ▼     ▼          ▼                ▼
  ┌─────┐┌─────┐┌─────┐┌─────┐          ┌─────┐
  │ns1  ││ns2  ││ns3  ││ns1  │          │ns1  │
  │.com ││.com ││.com ││.org │          │.net │
  └──┬──┘└──┬──┘└──┬──┘└──┬──┘          └──┬──┘
     │      │      │      │                │
     ▼      ▼      ▼      ▼                ▼
  ┌──────────────┐  ┌──────────┐       ┌──────────┐
  │ example.com  │  │ wiki.org │       │ test.net │
  │ Authoritative│  │ Authorit.│       │ Authorit.│
  └──────────────┘  └──────────┘       └──────────┘
```

### DNS Server Types

| Server Type | Function | Example |
|-------------|----------|---------|
| Recursive Resolver | Full resolution for clients | 8.8.8.8, 1.1.1.1 |
| Root Nameserver | Directs to TLD servers | a.root-servers.net |
| TLD Nameserver | Manages TLD zone (.com, .org) | a.gtld-servers.net |
| Authoritative | Provides definitive answers | ns1.example.com |
| Caching-only | Caches without authoritative data | ISP resolvers |
| Forwarding | Forwards queries to other resolvers | Internal resolvers |

### DNS Zone Structure

```
example.com.        SOA   ns1.example.com. admin.example.com. (
                        2026071601  ; Serial (YYYYMMDDNN)
                        3600        ; Refresh (1 hour)
                        900         ; Retry (15 minutes)
                        604800      ; Expire (1 week)
                        86400       ; Minimum TTL (1 day)
                        )

example.com.        NS    ns1.example.com.
example.com.        NS    ns2.example.com.

ns1.example.com.    A     93.184.216.34
ns2.example.com.    A     93.184.216.35

example.com.        A     93.184.216.34
example.com.        AAAA  2606:2800:220:1:248:1893:25c8:1946
example.com.        MX    10 mail.example.com.
example.com.        MX    20 mail2.example.com.
example.com.        TXT   "v=spf1 mx a ip4:93.184.216.0/24 ~all"

www.example.com.    CNAME example.com.
ftp.example.com.    A     93.184.216.36
mail.example.com.   A     93.184.216.37
mail2.example.com.  A     93.184.216.38

_dmarc.example.com. TXT   "v=DKIM1; p=none; rua=mailto:dmarc@example.com"
selector._domainkey.example.com. TXT "v=DKIM1; k=rsa; p=MIIBIjAN..."
```

---

## DNS Record Types

### Complete Record Reference

| Record | Full Name | Purpose | TTL | RFC |
|--------|-----------|---------|-----|-----|
| A | Address | IPv4 address mapping | Yes | 1035 |
| AAAA | IPv6 Address | IPv6 address mapping | Yes | 3596 |
| CNAME | Canonical Name | Alias to another name | Yes | 1035 |
| MX | Mail Exchanger | Mail server for domain | Yes | 1035 |
| NS | Nameserver | Authoritative NS for zone | Yes | 1035 |
| SOA | Start of Authority | Zone metadata | Yes | 1035 |
| TXT | Text | Arbitrary text data | Yes | 1035 |
| PTR | Pointer | Reverse lookup (IP→name) | Yes | 1035 |
| SRV | Service | Service location | Yes | 2782 |
| CAA | Certification Auth | CA authorization | Yes | 8659 |
| NSEC | Next Secure | Authenticated denial | Yes | 4034 |
| NSEC3 | Next Secure v3 | Hashed denial | Yes | 5155 |
| DS | Delegation Signer | DNSSEC trust chain | Yes | 4034 |
| DNSKEY | DNS Key | DNSSEC public key | Yes | 4034 |
| RRSIG | Resource Record Sig | DNSSEC signature | Yes | 4034 |

### Record Type Details

#### A Record (IPv4)
```
example.com.    IN    A    93.184.216.34
www.example.com IN    A    93.184.216.34
```
- Maps hostname to 32-bit IPv4 address
- Most common DNS record
- Multiple A records = load balancing

#### AAAA Record (IPv6)
```
example.com.    IN    AAAA    2606:2800:220:1:248:1893:25c8:1946
```
- Maps hostname to 128-bit IPv6 address
- "AAAA" = "quad A" (4× A record size)

#### MX Record (Mail Exchange)
```
example.com.    IN    MX    10    mail.example.com.
example.com.    IN    MX    20    mail2.example.com.
```
- Priority: lower = preferred
- Points to hostname, not IP directly
- Required for email delivery

#### CNAME Record (Canonical Name)
```
www.example.com.    IN    CNAME    example.com.
shop.example.com.   IN    CNAME    myshopify.com.
```
- Creates alias to another domain name
- Cannot coexist with other records for same name
- Useful for pointing subdomains to services

#### TXT Record (Text)
```
example.com.    IN    TXT    "v=spf1 mx a ip4:93.184.216.0/24 ~all"
example.com.    IN    TXT    "google-site-verification=abc123"
```
- Stores arbitrary text
- Commonly used for:
  - SPF (Sender Policy Framework)
  - DKIM (DomainKeys Identified Mail)
  - DMARC (Domain-based Message Authentication)
  - Domain verification
  - SSL validation

#### NS Record (Nameserver)
```
example.com.    IN    NS    ns1.example.com.
example.com.    IN    NS    ns2.example.com.
```
- Identifies authoritative nameservers for zone
- Delegates authority to child zones

#### SOA Record (Start of Authority)
```
example.com.    IN    SOA    ns1.example.com. admin.example.com. (
                            2026071601    ; Serial
                            3600          ; Refresh
                            900           ; Retry
                            604800        ; Expire
                            86400         ; Minimum TTL
                            )
```
- One per zone
- Contains zone metadata
- Serial: must increment on zone changes

#### PTR Record (Pointer - Reverse DNS)
```
34.216.184.93.in-addr.arpa.    IN    PTR    example.com.
```
- Resolves IP to hostname
- Used for:
  - Email server verification
  - Spam filtering
  - Logging

#### SRV Record (Service)
```
_sip._tcp.example.com.    IN    SRV    10 60 5060 sipserver.example.com.
_ldap._tcp.example.com.   IN    SRV    0 0 389 ldap.example.com.
```
- Format: `_service._protocol.name. TTL CLASS SRV priority weight port target`
- Used by SIP, LDAP, XMPP, Active Directory

#### CAA Record (Certificate Authority Authorization)
```
example.com.    IN    CAA    0 issue "letsencrypt.org"
example.com.    IN    CAA    0 issue "digicert.com"
example.com.    IN    CAA    0 iodef "mailto:security@example.com"
```
- Controls which CAs can issue certificates
- Prevents unauthorized certificate issuance

---

## DNS Resolution Process

### Complete Resolution Flow

```
┌──────────┐
│  Client  │
│ (Browser)│
└────┬─────┘
     │
     │ 1. Check browser cache
     │ 2. Check OS cache (nscd, systemd-resolved)
     │ 3. Check /etc/hosts
     │ 4. Check /etc/resolv.conf for resolver
     │
     ▼
┌──────────────────────────────────────────────────┐
│            Recursive Resolver                    │
│         (ISP DNS / 8.8.8.8 / 1.1.1.1)          │
├──────────────────────────────────────────────────┤
│ 5. Check resolver cache                         │
│    ├─ Cache HIT → Return cached response        │
│    └─ Cache MISS → Begin recursive resolution   │
└──────────────────────┬───────────────────────────┘
                       │
                       │ 6. Query Root Server (.)
                       ▼
              ┌────────────────┐
              │  Root Server   │
              │  (a-m.root)    │
              │                │
              │ Returns:       │
              │ .com NS:       │
              │ a.gtld-servers │
              │ .net           │
              └────────┬───────┘
                       │
                       │ 7. Query TLD Server (.com)
                       ▼
              ┌────────────────┐
              │  TLD Server    │
              │  (.com)        │
              │                │
              │ Returns:       │
              │ example.com NS:│
              │ ns1.example.com│
              │ ns2.example.com│
              └────────┬───────┘
                       │
                       │ 8. Query Authoritative Server
                       ▼
              ┌────────────────┐
              │  Authoritative │
              │  Server        │
              │  (ns1.example) │
              │                │
              │ Returns:       │
              │ A: 93.184.216.34│
              └────────┬───────┘
                       │
                       │ 9. Cache and return to client
                       ▼
┌──────────┐
│  Client  │
│ Has IP:  │
│ 93.184.  │
│ 216.34   │
└──────────┘
```

### Resolution Types

| Type | Description | Use Case |
|------|-------------|----------|
| Recursive | Resolver handles full resolution | Client → Resolver |
| Iterative | Each server returns referral | Resolver ↔ Root/TLD |
| Non-recursive | Authoritative server has answer | Direct authoritative query |
| Inverse | IP → Domain name | PTR records |

### DNS Caching

```
Cache Hierarchy:

┌──────────────┐
│ Browser Cache│  TTL: minutes to hours
└──────┬───────┘
       │
┌──────▼───────┐
│ OS Cache     │  TTL: varies by OS
│ (nscd, etc.) │
└──────┬───────┘
       │
┌──────▼───────┐
│ Resolver     │  TTL: per record
│ Cache        │  (respects SOA minimum)
└──────┬───────┘
       │
┌──────▼───────┐
│ Root/TLD     │  Propagation delay
│ Caches       │  hours to days
└──────────────┘

Negative Caching:
- NXDOMAIN responses cached per SOA minimum TTL
- SERVFAIL cached briefly
- Prevents repeated queries for non-existent domains
```

---

## DHCP DORA Process

### Complete DORA Flow

```
┌──────────┐                        ┌──────────────┐
│  Client  │                        │ DHCP Server  │
│  (New)   │                        │              │
└────┬─────┘                        └──────┬───────┘
     │                                      │
     │ ════════ DISCOVER (Broadcast) ═══════│
     │ src: 0.0.0.0:68                     │
     │ dst: 255.255.255.255:67             │
     │ CHADDR: Client MAC                  │
     │ Options:                             │
     │   - DHCP Message Type: DISCOVER      │
     │   - Requested IP (optional)          │
     │   - Parameter Request List           │
     │   - Client Identifier               │
     │ ──────────────────────────────────►  │
     │                                      │
     │                                      │ Check ARP table
     │                                      │ Select IP from pool
     │                                      │ Reserve lease
     │                                      │
     │ ════════ OFFER (Unicast/Broadcast) ═│
     │ src: DHCP Server:67                  │
     │ dst: Client:68                       │
     │ yiaddr: Offered IP (e.g., 192.168.1.100) │
     │ Options:                             │
     │   - DHCP Message Type: OFFER         │
     │   - Server Identifier                │
     │   - Lease Time                       │
     │   - Subnet Mask                      │
     │   - Router                           │
     │   - DNS Servers                      │
     │ ◄────────────────────────────────── │
     │                                      │
     │ ════════ REQUEST (Broadcast) ═══════│
     │ src: 0.0.0.0:68                     │
     │ dst: 255.255.255.255:67             │
     │ Options:                             │
     │   - DHCP Message Type: REQUEST       │
     │   - Requested IP: 192.168.1.100      │
     │   - Server Identifier                │
     │ ──────────────────────────────────►  │
     │                                      │
     │                                      │ Update lease
     │                                      │ Configure bindings
     │                                      │
     │ ════════ ACK (Unicast/Broadcast) ═══│
     │ src: DHCP Server:67                  │
     │ dst: Client:68                       │
     │ yiaddr: 192.168.1.100               │
     │ Options:                             │
     │   - DHCP Message Type: ACK           │
     │   - Lease Time                       │
     │   - All configuration parameters     │
     │ ◄────────────────────────────────── │
     │                                      │
     │ Client configures:                   │
     │ - IP: 192.168.1.100                  │
     │ - Mask: 255.255.255.0                │
     │ - Gateway: 192.168.1.1               │
     │ - DNS: 8.8.8.8, 8.8.4.4             │
     └──────────────────────────────────────┘
```

### DHCP State Machine

```
                    ┌───────────┐
                    │  INIT     │
                    │ (Start)   │
                    └─────┬─────┘
                          │
                          │ Send DISCOVER
                          ▼
                    ┌───────────┐
               ┌───►│ SELECTING │
               │    │           │
               │    └─────┬─────┘
               │          │
               │    Receive OFFER(s)
               │          │
               │    Select best offer
               │          │
               │          ▼
               │    ┌───────────┐
               │    │REQUESTING │
               │    │           │
               │    └─────┬─────┘
               │          │
               │    Send REQUEST
               │          │
               │          ▼
               │    ┌───────────┐
               │    │BOUND      │◄─── Lease active
               │    │           │
               │    └─────┬─────┘
               │          │
               │    T1 (50%) expired
               │          │
               │          ▼
               │    ┌───────────┐
               │    │RENEWING   │
               │    │           │
               │    └─────┬─────┘
               │          │
               │    T2 (87.5%) expired
               │          │
               │          ▼
               │    ┌───────────┐
               │    │REBINDING  │
               │    │           │
               │    └─────┬─────┘
               │          │
               │    Lease expired or ACK
               │          │
               │    ┌──────┴──────┐
               │    │             │
               │    ▼             ▼
               │ ┌───────────┐ ┌───────────┐
               │ │  INIT     │ │  BOUND    │
               │ │ (Expired) │ │ (Renewed) │
               │ └───────────┘ └───────────┘
               │
               └──────────────────
                    (NACK → INIT)
```

### DHCP Lease Timers

| Timer | Default | Action |
|-------|---------|--------|
| T1 (Renewal) | 50% of lease | Unicast REQUEST to original server |
| T2 (Rebinding) | 87.5% of lease | Broadcast REQUEST to any server |
| Lease Expiry | 24 hours (typical) | Release IP, send DISCOVER |

---

## DHCP Options

### Common DHCP Options

| Code | Name | Description | Example |
|------|------|-------------|---------|
| 1 | Subnet Mask | Network mask | 255.255.255.0 |
| 3 | Router | Default gateway | 192.168.1.1 |
| 6 | DNS Server | DNS resolvers | 8.8.8.8, 8.8.4.4 |
| 15 | Domain Name | Domain suffix | example.com |
| 44 | WINS Server | NetBIOS name server | 192.168.1.10 |
| 46 | WINS/Node Type | NetBIOS node type | 0x1 (broadcast) |
| 51 | IP Address Lease | Lease duration in seconds | 86400 (1 day) |
| 53 | DHCP Message Type | DORA message type | 1-8 |
| 54 | Server Identifier | Server IP for requests | 192.168.1.1 |
| 58 | Renewal Time | T1 in seconds | 43200 |
| 59 | Rebinding Time | T2 in seconds | 75600 |
| 60 | Vendor Class ID | Client vendor info | "MSFT 5.0" |
| 61 | Client ID | Client identifier | MAC address |
| 66 | TFTP Server Name | For PXE boot | tftp.example.com |
| 67 | Bootfile Name | PXE boot file | pxelinux.0 |
| 150 | TFTP Server Address | TFTP server IP | 192.168.1.50 |
| 252 | Proxy Auto-Config | PAC file URL | http://proxy/pac |

### PXE Boot Options

```
DHCP Options for PXE Boot:

Option 66: TFTP Server Name     → tftp.example.com
Option 67: Bootfile Name        → pxelinux.0
Option 150: TFTP Server Address → 192.168.1.50

Boot Process:
1. Client sends DHCP DISCOVER
2. Server responds with PXE options
3. Client downloads boot image via TFTP
4. Boot image loads OS installer
```

### DHCP Relay Agent

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │     │ DHCP Relay   │     │ DHCP Server  │
│  (VLAN10)│     │ (Router)     │     │ (VLAN1)      │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘
     │                   │                    │
     │ DISCOVER          │                    │
     │ (broadcast)       │                    │
     │──────────────────►│                    │
     │                   │ RELAY AGENT        │
     │                   │ (option 82)        │
     │                   │───────────────────►│
     │                   │                    │
     │                   │ OFFER              │
     │                   │◄───────────────────│
     │◄──────────────────│                    │
     │                   │                    │
     │ REQUEST           │                    │
     │──────────────────►│───────────────────►│
     │                   │                    │
     │ ACK               │                    │
     │◄──────────────────│◄───────────────────│

Option 82 (Relay Agent Information):
- Circuit ID: Identifies client's physical circuit
- Remote ID: Identifies relay agent
```

---

## DNS Architecture

### DNS Server Deployment

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Firewall     │
              └────────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
 ┌────────────┐ ┌────────────┐ ┌────────────┐
 │ External   │ │ External   │ │ DMZ        │
 │ DNS (Pub)  │ │ DNS (Pub)  │ │ DNS        │
 │ ns1.ext    │ │ ns2.ext    │ │ ns.dmz     │
 └────────────┘ └────────────┘ └────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │ Zone Transfer
                       │ (TSIG secured)
                       ▼
              ┌────────────────┐
              │   Internal     │
              │   DNS          │
              │   (Authorit.)  │
              └────────┬───────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ DC/DNS   │ │ App DNS  │ │ Backup   │
     │ (AD)     │ │ (Internal│ │ DNS      │
     │          │ │  zones)  │ │          │
     └──────────┘ └──────────┘ └──────────┘
```

### Split-Horizon DNS

```
Same domain, different answers based on source:

Internal clients → 10.0.0.10 (internal IP)
External clients → 203.0.113.10 (public IP)

Zone file (internal):
www.example.com.    A    10.0.0.10

Zone file (external):
www.example.com.    A    203.0.113.10
```

### DNSSEC Chain of Trust

```
Root Zone KSK (Key Signing Key)
    │ Signs DNSKEY
    ▼
Root Zone ZSK (Zone Signing Key)
    │ Signs .com DS record
    ▼
.com Zone KSK
    │ Signs example.com DS record
    ▼
example.com KSK
    │ Signs example.com ZSK
    ▼
example.com ZSK
    │ Signs A, MX, TXT records with RRSIG
    ▼
DNS Record + RRSIG
    │
    ▼
Client validates using:
1. DS record from parent
2. DNSKEY from child
3. RRSIG on records
```

---

## DNS Attacks

### DNS Cache Poisoning (Kaminsky Attack)

```
Attacker                          Resolver          Auth Server
    │                               │                  │
    │  1. Query for random subdomain│                  │
    │  (nonexistent.example.com)    │                  │
    │──────────────────────────────►│                  │
    │                               │  2. Query auth   │
    │                               │─────────────────►│
    │                               │                  │
    │  3. Race: Send forged response│                  │
    │  with crafted TXID            │                  │
    │  (poisoned A record)          │                  │
    │──────────────────────────────►│                  │
    │                               │                  │
    │  If TXID matches:             │                  │
    │  Cache poisoned!              │                  │
    │  All future queries for       │                  │
    │  example.com → attacker IP    │                  │

Defense:
- Randomize source port
- Randomize TXID (already standard)
- DNSSEC validation
- Response Rate Limiting
```

### DNS Tunneling

```
┌──────────┐                ┌──────────┐
│ Attacker │                │ DNS      │
│ Client   │                │ Server   │
└────┬─────┘                └────┬─────┘
     │                           │
     │  Encode data in DNS queries│
     │  aGVsbG8gd29ybGQ.example.com
     │──────────────────────────►│
     │                           │ Decode data
     │                           │ and forward to C2
     │                           │
     │  Receive data in DNS      │
     │  responses (TXT records)  │
     │◄──────────────────────────│

Tools: dnscat2, iodine, dns2tcp
Detection: Unusual TXT record sizes, high DNS query volume
```

### DNS Amplification DDoS

```
Attacker                    Amplifier           Victim
    │                           │                  │
    │ 1. Spoof source IP        │                  │
    │ (victim's IP)            │                  │
    │                           │                  │
    │ 2. Query: ANY example.com │                  │
    │ (small query)             │                  │
    │──────────────────────────►│                  │
    │                           │                  │
    │ 3. Large response         │                  │
    │ (50-100x amplification)  │                  │
    │                           │─────────────────►│
    │                           │                  │
    │ Repeat with many          │                  │
    │ open resolvers            │                  │
    │                           │                  │

Amplification factors:
- ANY record: 10-50x
- DNSSEC signed: 50-100x
- Typical response: 3000-4000 bytes vs 60 byte query
```

### DNS Rebinding

```
Step 1: Attacker registers evil.com
        DNS A record → 8.8.8.8 (attacker-controlled)

Step 2: Victim visits evil.com
        Browser loads page, gets IP 8.8.8.8

Step 3: Malicious JavaScript fetches data from evil.com
        DNS resolves to 8.8.8.8 (external)

Step 4: Attacker changes DNS to 127.0.0.1 (internal)
        TTL expires, new lookup returns 127.0.0.1

Step 5: Same-origin policy allows access
        JavaScript can now reach internal services

Impact: Bypass firewall, access internal APIs, IoT attacks
Defense: DNS pinning, HSTS, DNSSEC
```

### DNS Cache Poisoning Variants

| Attack | Technique | Impact |
|--------|-----------|--------|
| Kaminsky | Random subdomain flood | Global cache poisoning |
| Birthday | TXID collision | Targeted poisoning |
| Birthday + ports | TXID + source port | Higher success rate |
| Ghost Domain | Exploit expired domains | Persistent malicious domains |

---

## DHCP Attacks

### DHCP Starvation

```
Attacker                              DHCP Server
    │                                     │
    │ 1. Send many DISCOVER messages      │
    │    with spoofed MAC addresses       │
    │                                     │
    │ DISCOVER (MAC: aa:bb:cc:00:00:01)   │
    │────────────────────────────────────►│
    │ DISCOVER (MAC: aa:bb:cc:00:00:02)   │
    │────────────────────────────────────►│
    │ DISCOVER (MAC: aa:bb:cc:00:00:03)   │
    │────────────────────────────────────►│
    │ ... (thousands more)                │
    │                                     │
    │                                     │ IP pool exhausted!
    │                                     │
    │ 2. Legitimate clients can't get IPs  │
    │    DoS achieved!                     │

Tools: Yersinia, DhcpStarv
Defense: DHCP snooping, port security, MAC limiting
```

### Rogue DHCP Server

```
Attacker                              Network
    │                                     │
    │ 1. Deploy rogue DHCP server         │
    │                                     │
    │ 2. Client sends DISCOVER            │
    │                                     │
    │    ┌──────────┐ ┌──────────┐        │
    │    │ Legit    │ │ Rogue    │        │
    │    │ DHCP     │ │ DHCP     │        │
    │    └────┬─────┘ └────┬─────┘        │
    │         │            │              │
    │    OFFER│       OFFER│ (faster)     │
    │         │◄───────────│              │
    │         │            │              │
    │    Client accepts rogue offer!      │
    │                                     │
    │ 3. Rogue server assigns:            │
    │    - Gateway: attacker's machine    │
    │    - DNS: attacker's DNS            │
    │    → MITM, credential theft         │

Defense: DHCP snooping on switches, 802.1X
```

### DHCP Starvation + Rogue Attack

```
Combined Attack:

1. Starve legitimate DHCP pool
2. Deploy rogue DHCP server
3. Clients get malicious configuration
4. Attacker intercepts all traffic

┌──────────┐              ┌──────────┐
│ Attacker │              │ Network  │
└────┬─────┘              └────┬─────┘
     │                         │
     │ Starvation              │
     │ (exhaust IPs)           │
     │═══════════════════════► │
     │                         │
     │ Rogue DHCP              │
     │ (malicious config)      │
     │═══════════════════════► │
     │                         │
     │ MITM                    │
     │◄═══════════════════════ │
```

---

## Defenses

### DNS Defenses

| Defense | Description | Implementation |
|---------|-------------|----------------|
| DNSSEC | Cryptographic signing of DNS records | Zone signing, validation |
| DNS-over-HTTPS (DoH) | Encrypt DNS queries via HTTPS | Browser support, resolver config |
| DNS-over-TLS (DoT) | Encrypt DNS queries via TLS | Port 853, resolver config |
| Response Rate Limiting | Limit responses per source | BIND: `rate-limit` |
| Source Port Randomization | Randomize UDP source port | Standard in modern resolvers |
| DNS Firewall (RPZ) | Block malicious domains | Zone-based blocking |
| Split-horizon DNS | Separate internal/external views | Authoritative server config |
| DNS logging | Monitor query patterns | Log analysis, SIEM integration |

### DHCP Defenses

| Defense | Description | Implementation |
|---------|-------------|----------------|
| DHCP Snooping | Filter unauthorized DHCP offers | Switch configuration |
| Port Security | Limit MAC addresses per port | Switch configuration |
| Dynamic ARP Inspection | Validate ARP against DHCP | Switch configuration |
| 802.1X | Port-based network access control | RADIUS + supplicant |
| DHCP Relay Agent Info | Track client location | Option 82 |
| Lease Database Monitoring | Detect starvation attacks | DHCP server logs |
| MAC Address Filtering | Allow known clients only | Switch ACLs |

### DHCP Snooping Configuration

```
Cisco Switch:

ip dhcp snooping
ip dhcp snooping vlan 10,20

interface GigabitEthernet0/1
  ip dhcp snooping trust        # DHCP server port

interface GigabitEthernet0/2
  ip dhcp snooping limit rate 15  # Limit DHCP messages
  ip dhcp snooping               # Untrusted port

show ip dhcp snooping binding
```

---

## Tools and Debugging

### DNS Tools

| Tool | Purpose |
|------|---------|
| `dig` | DNS lookup utility |
| `nslookup` | DNS query tool (cross-platform) |
| `host` | Simple DNS lookup |
| `delv` | DNSSEC validation tool |
| `dnstop` | DNS traffic monitor |
| `dnstracer` | Trace DNS queries |
| `dnsrecon` | DNS enumeration |
| `dnsenum` | DNS bruteforcing |

### DNS Debug Commands

```bash
# Basic lookup
dig example.com
dig example.com A
dig example.com MX

# Trace resolution path
dig +trace example.com

# Query specific DNS server
dig @8.8.8.8 example.com

# Check DNSSEC
dig example.com +dnssec
dig example.com DNSKEY
delv example.com

# Reverse lookup
dig -x 93.184.216.34

# Zone transfer (if allowed)
dig axfr example.com @ns1.example.com

# Batch query
dig -f domains.txt

# Debug output
dig +debug example.com

# Check TTL
dig +noall +answer example.com
```

### DHCP Tools

| Tool | Purpose |
|------|---------|
| `dhclient` | DHCP client (Linux) |
| `dhcpcd` | DHCP client daemon |
| `dhcpdump` | DHCP packet decoder |
| `dhcpcanon` | Anonymous DHCP client |
| `yersinia` | DHCP attack tool |
| `wireshark` | Packet analysis |

### DHCP Debug Commands

```bash
# Release and renew IP
sudo dhclient -r eth0    # Release
sudo dhclient eth0       # Renew

# Verbose DHCP activity
sudo dhclient -v eth0

# Monitor DHCP traffic
sudo tcpdump -i eth0 port 67 or port 68 -n -v

# Decode DHCP packets
sudo dhcpdump -i eth0

# Check current lease
cat /var/lib/dhcp/dhclient.leases

# Check DHCP status
ip addr show eth0
ip route show
```

### Common DNS Issues

```bash
# Flush DNS cache
# Linux (systemd-resolved)
sudo systemd-resolve --flush-caches
resolvectl flush-caches

# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Check DNS resolution
nslookup example.com
dig example.com +short

# Check DNS server
cat /etc/resolv.conf

# Test DNSSEC
delv example.com
```

---

## Interview Questions

### Basic

1. What is DNS and what port does it use?
2. Explain the DNS resolution process.
3. What is the DHCP DORA process?
4. What is the difference between A and AAAA records?
5. What is a CNAME record?

### Intermediate

6. How does DNS caching work?
7. What is DNS cache poisoning?
8. Explain DHCP lease lifecycle.
9. What are common DHCP options?
10. How does DHCP snooping work?

### Advanced

11. Explain the Kaminsky DNS cache poisoning attack.
12. What is DNS rebinding and how does it bypass firewalls?
13. How does DNSSEC prevent cache poisoning?
14. Explain DHCP starvation attack and defenses.
15. What is split-horizon DNS and when is it used?

---

## Hands-On Labs

### Lab 1: DNS Enumeration
```bash
# Zone transfer attempt
dig axfr example.com @ns1.example.com

# DNS bruteforcing
dnsenum example.com

# Reverse DNS
dnsrecon -r 192.168.1.0/24

# DNS monitoring
dnstop -l 5 eth0
```

### Lab 2: DHCP Analysis
```bash
# Capture DHCP traffic
sudo tcpdump -i eth0 port 67 or port 68 -w dhcp.pcap

# Analyze in Wireshark
# Filter: dhcp
# Follow UDP stream

# Decode with dhcpdump
sudo dhcpdump -i eth0
```

### Lab 3: DNSSEC Validation
```bash
# Check DNSSEC chain
dig example.com +dnssec +multi

# Verify RRSIG
dig example.com RRSIG

# Check DS record
dig com DS

# Validate with delv
delv example.com
```

### Lab 4: DHCP Starvation (Test Environment)
```bash
# WARNING: Only in isolated lab
# Yersinia DHCP attack
yersinia dhcp -attack 1

# Monitor DHCP pool
watch -n 1 'cat /var/lib/dhcp/dhclient.leases | grep lease'
```

### Lab 5: DNS-over-HTTPS Configuration
```bash
# Configure DoH in Firefox
# about:config → network.trr.mode = 2

# Test DoH
curl -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=example.com&type=A'
```

---

## Summary Table

### DNS Summary

| Component | Port | Transport | Purpose |
|-----------|------|-----------|---------|
| DNS Query | 53 | UDP (TCP for large) | Domain resolution |
| DNS Zone Transfer | 53 | TCP | Full zone copy |
| DNSSEC | 53 | UDP/TCP | Signed DNS records |
| DoH | 443 | TCP (HTTPS) | Encrypted DNS |
| DoT | 853 | TCP (TLS) | Encrypted DNS |

### DHCP Summary

| Component | Port | Transport | Purpose |
|-----------|------|-----------|---------|
| DHCP Server | 67 | UDP | Responds to clients |
| DHCP Client | 68 | UDP | Sends requests |
| DHCP Relay | 67 | UDP | Forwards between subnets |

### Record Types Summary

| Record | Priority | Use Case | Notes |
|--------|----------|----------|-------|
| A | N/A | IPv4 mapping | Most common |
| AAAA | N/A | IPv6 mapping | Growing adoption |
| MX | Yes (lower=preferred) | Email delivery | Points to hostname |
| CNAME | N/A | Aliases | No coexistence |
| TXT | N/A | Verification | SPF, DKIM, DMARC |
| NS | N/A | Authority delegation | Zone responsibility |
| SOA | N/A | Zone metadata | Serial, timers |
| PTR | N/A | Reverse lookup | IP → name |
| SRV | Yes | Service location | Port specification |
| CAA | N/A | CA authorization | Certificate control |

---

## Related Topics

- [Network Protocols](Network-Protocols.md)
- [TCP/IP Deep Dive](TCP-IP-Deep-Dive.md)
- [Firewalls, IDS & IPS](Firewalls-IDS-IPS.md)
- [Network Analysis](Network-Analysis.md)
