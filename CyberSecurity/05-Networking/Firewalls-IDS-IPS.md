# Firewalls, IDS & IPS

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OSI / TCP-IP MODEL                               │
├──────────────┬──────────────┬───────────────────────────────────────┤
│ OSI Layer    │ TCP/IP Layer │ Security Devices                     │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 7. App       │              │ ┌───────────────────────────────────┐ │
│              │              │ │ WAF (Web Application Firewall)   │ │
│              │  Application │ │ Application-layer inspection     │ │
├──────────────┤              │ └───────────────────────────────────┘ │
│ 6. Present   │              │ ┌───────────────────────────────────┐ │
│              │              │ │ NGFW (Deep Packet Inspection)    │ │
│ 5. Session   │              │ │ DPI, Content filtering            │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 4. Transport │  Transport   │ ┌───────────────────────────────────┐ │
│              │              │ │ Stateful Firewall                 │ │
│              │              │ │ Connection tracking                │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 3. Network   │  Internet    │ ┌───────────────────────────────────┐ │
│              │              │ │ Packet Filtering Firewall         │ │
│              │              │ │ IDS / IPS                         │ │
│              │              │ │ ACL, Routing                      │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 2. Data Link │  Link        │ ┌───────────────────────────────────┐ │
│              │              │ │ Switch ACL, VLAN                  │ │
│              │              │ │ MAC Filtering                     │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 1. Physical  │              │ Physical security controls          │
└──────────────┴──────────────┴───────────────────────────────────────┘
```

## Table of Contents

1. [Packet Filtering Firewalls](#packet-filtering-firewalls)
2. [Stateful Inspection](#stateful-inspection)
3. [Application Layer Firewalls (WAF)](#application-layer-firewalls)
4. [Next-Gen Firewalls](#next-gen-firewalls)
5. [IDS vs IPS](#ids-vs-ips)
6. [Detection Methods](#detection-methods)
7. [Tools: Snort, Suricata, Zeek](#idsips-tools)
8. [Network Segmentation](#network-segmentation)
9. [Attacks and Bypass Techniques](#attacks-and-bypass-techniques)
10. [Tools and Debugging](#tools-and-debugging)
11. [Interview Questions](#interview-questions)
12. [Hands-On Labs](#hands-on-labs)
13. [Summary Table](#summary-table)

---

## Packet Filtering Firewalls

### Overview

Packet filtering firewalls examine individual packets and make allow/deny decisions based on predefined rules. They operate at Layer 3 (Network) and Layer 4 (Transport).

### How It Works

```
                    ┌──────────────────┐
                    │  Packet Filter   │
                    │  Firewall        │
┌──────────┐       │                  │       ┌──────────┐
│ Incoming │       │ ┌──────────────┐ │       │ Outgoing │
│ Packet   │──────►│ │ Rule Check   │ │──────►│ Packet   │
│          │       │ │              │ │       │          │
│ Header:  │       │ │ 1. Src IP    │ │       │          │
│ - Src IP │       │ │ 2. Dst IP    │ │       │          │
│ - Dst IP │       │ │ 3. Src Port  │ │       │          │
│ - Src PRT│       │ │ 4. Dst Port  │ │       │          │
│ - Dst PRT│       │ │ 5. Protocol  │ │       │          │
│ - Proto  │       │ │ 6. Interface │ │       │          │
└──────────┘       │ └──────────────┘ │       └──────────┘
                   │                  │
                   │ Decision:        │
                   │ ALLOW / DENY     │
                   │ DROP / REJECT    │
                   └──────────────────┘
```

### Rule Processing

```
Rules are processed top-to-bottom (first match wins):

Rule #  Direction  Source IP      Dest IP      Port   Action
──────  ─────────  ──────────     ──────────   ────   ──────
1       Inbound    Any            10.0.0.5     80     ALLOW
2       Inbound    Any            10.0.0.5     443    ALLOW
3       Inbound    Any            10.0.0.0/24  Any    DENY
4       Outbound   10.0.0.0/24    Any          Any    ALLOW
5       Any        Any            Any          Any    DENY (implicit)

Note: Implicit DENY at end of rule set
```

### Example iptables Rules

```bash
# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from management network
iptables -A INPUT -s 10.0.1.0/24 -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow DNS
iptables -A INPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT -p tcp --dport 53 -j ACCEPT

# Drop everything else
iptables -A INPUT -j DROP

# View rules
iptables -L -n -v --line-numbers
```

### Limitations

| Limitation | Description |
|------------|-------------|
| No state tracking | Each packet evaluated independently |
| No payload inspection | Only examines headers |
| Vulnerable to spoofing | Can't verify source authenticity |
| Limited logging | Basic packet logging only |
| No application awareness | Can't distinguish HTTP from DNS |
| Rule complexity | Difficult to manage large rule sets |

---

## Stateful Inspection

### How Stateful Firewalls Work

```
Connection State Table:

┌─────────────────────────────────────────────────────────────┐
│  Source IP    │ Dst IP      │ S.Prt │ D.Prt │ State    │ TTL│
├───────────────┼─────────────┼───────┼───────┼──────────┼───┤
│ 10.0.0.100    │ 93.184.216  │ 49152 │ 80    │ESTABLISHED│ 3600│
│ 10.0.0.100    │ 93.184.216  │ 49153 │ 443   │ESTABLISHED│ 3600│
│ 192.168.1.50  │ 10.0.0.5    │ 52431 │ 22    │ESTABLISHED│ 7200│
└─────────────────────────────────────────────────────────────┘

Traffic Flow:

1. Outbound SYN
   Client → Firewall → Server
   [No state] → Create state entry (SYN_SENT)

2. Inbound SYN-ACK
   Server → Firewall → Client
   [Check state: SYN_SENT exists] → Allow, update (ESTABLISHED)

3. Inbound ACK
   Server → Firewall → Client
   [Check state: ESTABLISHED] → Allow

4. Inbound data (no SYN)
   Server → Firewall → Client
   [Check state: ESTABLISHED] → Allow

5. New SYN from different source
   Unknown → Firewall
   [No matching state] → Evaluate rules → ALLOW/DENY
```

### State Table Operations

| Operation | Trigger | Action |
|-----------|---------|--------|
| Create | Outbound SYN (new connection) | Add entry with timeout |
| Update | Inbound SYN-ACK | Change state to SYN_RECEIVED |
| Update | ACK after SYN-ACK | Change state to ESTABLISHED |
| Update | Data transfer | Reset timeout |
| Remove | FIN/RST or timeout | Remove entry |

### Stateful vs Stateless Comparison

| Feature | Stateless | Stateful |
|---------|-----------|----------|
| Packet evaluation | Independent | Context-aware |
| Connection tracking | No | Yes |
| Performance | Faster (no state) | Slightly slower |
| Security | Basic | Enhanced |
| Memory usage | Low | Higher (state table) |
| Rule complexity | Simpler | More intuitive |
| Return traffic | Must explicitly allow | Automatically allowed |

---

## Application Layer Firewalls (WAF)

### Web Application Firewall (WAF)

```
                    ┌──────────────────┐
                    │       WAF        │
                    │                  │
┌──────────┐       │  ┌────────────┐  │       ┌──────────┐
│  Client  │──────►│  │ HTTP Parser│  │──────►│ Web      │
│ (Browser)│       │  │            │  │       │ Server   │
└──────────┘       │  │ Analyzes:  │  │       └──────────┘
                   │  │ - Headers  │  │
                   │  │ - Body     │  │
                   │  │ - Cookies  │  │
                   │  │ - URL      │  │
                   │  │ - Params   │  │
                   │  └────────────┘  │
                   │                  │
                   │  Rules:          │
                   │  - OWASP CRS     │
                   │  - Custom rules  │
                   │  - Rate limiting │
                   │  - Whitelisting  │
                   └──────────────────┘
```

### WAF Operation Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Inline | Sits between client and server | Real-time blocking |
| Reverse Proxy | Proxies all traffic | Content inspection |
| Out-of-Band | Receives copy of traffic | Detection only |
| Transparent | Transparent bridge mode | No network changes |

### OWASP Top 10 Protection

| Attack | WAF Detection | Example Rule |
|--------|---------------|--------------|
| SQL Injection | Pattern matching | `UNION SELECT`, `OR 1=1` |
| XSS | Script tag detection | `<script>`, `javascript:` |
| CSRF | Token validation | Missing/invalid tokens |
| Path Traversal | Directory traversal | `../../etc/passwd` |
| Command Injection | Shell metacharacters | `; cat /etc/shadow` |
| File Inclusion | LFI/RFI patterns | `http://evil.com/shell.php` |
| XML External Entity | XXE patterns | `<!DOCTYPE`, `SYSTEM` |
| Broken Authentication | Brute force | Login attempt rate limiting |

### WAF Rule Example (ModSecurity)

```apache
# Block SQL injection attempts
SecRule REQUEST_URI|REQUEST_BODY|QUERY_STRING \
  "@rx (?i:(?:union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table))" \
  "id:1001,phase:1,deny,status:403,log,msg:'SQL Injection Attempt'"

# Block XSS attempts
SecRule REQUEST_URI|REQUEST_BODY|QUERY_STRING \
  "@rx (?i:<script|javascript:|on\w+\s*=)" \
  "id:1002,phase:1,deny,status:403,log,msg:'XSS Attempt'"

# Block path traversal
SecRule REQUEST_URI \
  "@rx \.\./|\.\.\\\\|%2e%2e" \
  "id:1003,phase:1,deny,status:403,log,msg:'Path Traversal'"

# Rate limiting
SecAction "id:1004,phase:1,pass,setvar:ip.request_count=+1"
SecRule IP:REQUEST_COUNT "@gt 100" \
  "id:1005,phase:1,deny,status:429,log,msg:'Rate Limit Exceeded'"
```

---

## Next-Gen Firewalls (NGFW)

### NGFW Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next-Gen Firewall                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │ Traditional │  │ Application │  │ Advanced Features       ││
│  │ Features    │  │ Awareness   │  │                         ││
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤│
│  │ • Stateful  │  │ • Layer 7   │  │ • IPS Integration       ││
│  │ • Packet    │  │   inspection│  │ • SSL/TLS Inspection    ││
│  │   filtering │  │ • User ID   │  │ • Sandboxing            ││
│  │ • NAT       │  │ • App ID    │  │ • Threat Intelligence   ││
│  │ • VPN       │  │ • Content   │  │ • ML-based Detection    ││
│  │ • Routing   │  │   filtering │  │ • Zero Trust Integration││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Management & Visibility                                     ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ • Centralized management    • Log aggregation               ││
│  │ • Policy management         • Compliance reporting          ││
│  │ • User/Group mapping        • Threat correlation           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Application Layer Inspection

| Application | Protocol | NGFW Capabilities |
|-------------|----------|-------------------|
| Web | HTTP/HTTPS | URL filtering, content inspection, SSL decrypt |
| Email | SMTP/POP3/IMAP | Antispam, attachment scanning |
| DNS | DNS | Sinkholing, DNSSEC validation |
| File Transfer | FTP/SFTP | DLP, malware scanning |
| VoIP | SIP/H.323 | Call control, fraud detection |
| Social Media | Various | Policy enforcement, shadow IT detection |

### SSL/TLS Inspection

```
Client                 NGFW                  Server
  │                      │                      │
  │ 1. HTTPS Request     │                      │
  │─────────────────────►│                      │
  │                      │                      │
  │                      │ 2. Decrypt           │
  │                      │    Inspect           │
  │                      │    Re-encrypt        │
  │                      │                      │
  │                      │ 3. HTTPS Request     │
  │                      │─────────────────────►│
  │                      │                      │
  │                      │ 4. HTTPS Response    │
  │                      │◄─────────────────────│
  │                      │                      │
  │                      │ 5. Decrypt           │
  │                      │    Inspect           │
  │                      │    Re-encrypt        │
  │                      │                      │
  │ 6. HTTPS Response    │                      │
  │◄─────────────────────│                      │

Challenges:
- Certificate management (enterprise CA required)
- Performance overhead
- Privacy concerns
- Certificate pinning breaks
- Some protocols resist inspection
```

---

## IDS vs IPS

### Deployment Comparison

```
IDS Deployment (Out-of-Band):

                    ┌──────────────┐
                    │   Monitor    │
                    │   Port       │
                    │   (SPAN)     │
┌──────────┐       │              │       ┌──────────┐
│  Traffic │──────►│              │──────►│ Firewall │
│  Mirror  │       │   IDS        │       │          │
│  (SPAN)  │       │              │       │          │
└──────────┘       └──────┬───────┘       └──────────┘
                          │
                          │ Alert
                          ▼
                    ┌──────────────┐
                    │   SIEM       │
                    │   / Admin    │
                    └──────────────┘

IPS Deployment (Inline):

┌──────────┐       ┌──────────────┐       ┌──────────┐
│  Traffic │──────►│     IPS      │──────►│  Internal│
│  (Router)│       │  (Inline)    │       │  Network │
└──────────┘       │              │       └──────────┘
                   │ Block/Allow  │
                   │ in real-time │
                   └──────────────┘
```

### IDS vs IPS Comparison

| Feature | IDS | IPS |
|---------|-----|-----|
| Position | Out-of-band (SPAN) | Inline |
| Action | Alert only | Alert + Block |
| Latency | Zero (passive) | Added latency |
| Fail-open | N/A | Yes (if IPS fails) |
| Fail-safe | N/A | Blocks traffic on failure |
| Coverage | Detection only | Detection + Prevention |
| Risk | No impact on traffic | Can block legitimate traffic |
| Deployment | Easier | Requires careful tuning |
| Performance | No impact | Requires processing power |

### IDS/IPS Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Promiscuous | All traffic mirrored | IDS monitoring |
| Inline | Traffic flows through device | IPS blocking |
| Tap | Physical network tap | Passive monitoring |
| SPAN | Switch port mirroring | IDS monitoring |

---

## Detection Methods

### Signature-Based Detection

```
Attack Signature Database:

┌─────────────────────────────────────────────────────────────┐
│ Signature #1: SQL Injection                                │
├─────────────────────────────────────────────────────────────┤
│ Pattern: "UNION\s+SELECT.*FROM"                            │
│ Severity: High                                              │
│ Protocol: HTTP                                              │
│ Action: Alert, Block                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Signature #2: Port Scan                                    │
├─────────────────────────────────────────────────────────────┤
│ Pattern: >20 SYN packets to different ports in 10 seconds  │
│ Severity: Medium                                            │
│ Protocol: TCP                                               │
│ Action: Alert                                               │
└─────────────────────────────────────────────────────────────┘

Pros:
- High accuracy (low false positives)
- Fast detection
- Well-understood

Cons:
- Cannot detect zero-day attacks
- Requires signature updates
- Signature evasion possible
- Polymorphic attacks bypass
```

### Anomaly-Based Detection

```
Baseline → Deviation Detection:

Normal Traffic Profile:
┌─────────────────────────────────────────────────────────────┐
│ Baseline (learned over 30 days):                           │
│ - HTTP requests: 1000-2000/min                              │
│ - Average packet size: 512 bytes                           │
│ - Common ports: 80, 443, 53                                │
│ - Normal hours: 9am-6pm                                    │
│ - Average connections: 500 concurrent                       │
└─────────────────────────────────────────────────────────────┘

Anomaly Detected:
┌─────────────────────────────────────────────────────────────┐
│ Current:                                                    │
│ - HTTP requests: 50000/min (50x normal!)                   │
│ - Port 4444 active (unusual)                               │
│ - Connections from unusual IPs                             │
│ - Traffic outside business hours                           │
│                                                             │
│ → ANOMALY ALERT                                              │
└─────────────────────────────────────────────────────────────┘

Pros:
- Detects zero-day attacks
- No signature updates needed
- Behavioral analysis

Cons:
- Higher false positive rate
- Requires training period
- Attackers can train the system
- Cannot identify specific attack type
```

### Hybrid Detection

```
┌─────────────────────────────────────────────────────────────┐
│                Hybrid Detection Engine                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Signature    │  │ Anomaly      │  │ Heuristic    │     │
│  │ Engine       │  │ Engine       │  │ Engine       │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ Pattern      │  │ Statistical  │  │ Rule-based   │     │
│  │ matching     │  │ analysis     │  │ logic        │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼───────┐                         │
│                    │ Correlation  │                         │
│                    │ Engine       │                         │
│                    └──────┬───────┘                         │
│                           │                                 │
│                    ┌──────▼───────┐                         │
│                    │ Decision     │                         │
│                    │ (Alert/Block)│                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## IDS/IPS Tools

### Snort

```
Architecture:

┌─────────────────────────────────────────────────────────────┐
│                     Snort Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │ Packet      │────►│ Decoder      │────►│ Preprocessor ││
│  │ Acquisition │     │              │     │              ││
│  └─────────────┘     └──────────────┘     └──────┬───────┘│
│                                                   │        │
│                                            ┌──────▼───────┐│
│                                            │ Detection    ││
│                                            │ Engine       ││
│                                            │              ││
│                                            │ - Rules      ││
│                                            │ - Patterns   ││
│                                            │ - Protocols  ││
│                                            └──────┬───────┘│
│                                                   │        │
│                                            ┌──────▼───────┐│
│                                            │ Output       ││
│                                            │ Plugins      ││
│                                            │              ││
│                                            │ - Alert      ││
│                                            │ - Log        ││
│                                            │ - TCPDump    ││
│                                            │ - Syslog     ││
│                                            │ - Database   ││
│                                            └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Snort Rules:**
```
# Action Protocol Source → Destination (Port) -> Options

# Alert on SQL injection attempt
alert http $EXTERNAL_NET any -> $HTTP_SERVERS any \
  (msg:"SQL Injection - UNION SELECT"; \
   flow:to_server,established; \
   content:"UNION"; nocase; \
   content:"SELECT"; nocase; \
   classtype:web-application-attack; \
   sid:1000001; rev:1;)

# Detect port scan
alert tcp $EXTERNAL_NET any -> $HOME_NET any \
  (msg:"Port Scan detected"; \
   flags:S; \
   threshold:type both, track by_src, count 20, seconds 10; \
   sid:1000002; rev:1;)

# Block known bad IP
drop ip 192.168.100.100 any -> any any \
  (msg:"Known malicious IP blocked"; \
   sid:1000003; rev:1;)
```

**Snort Configuration:**
```bash
# Install
sudo apt install snort

# Test configuration
sudo snort -T -c /etc/snort/snort.conf

# Run in IDS mode
sudo snort -i eth0 -c /etc/snort/snort.conf -A alert_fast

# Run in packet logging mode
sudo snort -i eth0 -l /var/log/snort

# Analyze pcap
sudo snort -r capture.pcap -c /etc/snort/snort.conf
```

### Suricata

```
Architecture:

┌─────────────────────────────────────────────────────────────┐
│                   Suricata Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │ Capture     │────►│ Decode       │────►│ Stream       ││
│  │ (AF-Packet, │     │ Engine       │     │ Engine       ││
│  │  pcap)      │     │              │     │ (TCP/UDP)    ││
│  └─────────────┘     └──────────────┘     └──────┬───────┘│
│                                                   │        │
│                  ┌────────────────────────────────┤        │
│                  │                                │        │
│           ┌──────▼───────┐               ┌───────▼──────┐│
│           │ Detect       │               │ Lua Scripts  ││
│           │ Engine       │               │ (Custom      ││
│           │              │               │  detection)  ││
│           │ - Rules      │               └──────────────┘│
│           │ - Patterns   │                               │
│           │ - App Layer  │                               │
│           └──────┬───────┘                               │
│                  │                                        │
│           ┌──────▼───────┐                               │
│           │ Output       │                               │
│           │ - EVE JSON   │                               │
│           - Unified2    │                               │
│           │ - Alert      │                               │
│           │ - Log        │                               │
│           └──────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

**Suricata Features:**
| Feature | Description |
|---------|-------------|
| Multi-threading | Parallel packet processing |
| Lua scripting | Custom detection logic |
| File extraction | Extract files from traffic |
| TLS logging | Log TLS certificate info |
| DNS logging | Full DNS query logging |
| HTTP logging | Full HTTP request/response logging |
| NetFlow export | Flow data export |
| PCAP output | Packet capture on alert |

**Suricata Configuration:**
```yaml
# /etc/suricata/suricata.yaml

# Network configuration
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16,10.0.0.0/8,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"

# Rule files
default-rule-path: /var/lib/suricata/rules
rule-files:
  - suricata.rules
  - local.rules

# Logging
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - files
        - flow
```

**Suricata Commands:**
```bash
# Test configuration
sudo suricata -T -c /etc/suricata/suricata.yaml

# Run Suricata
sudo suricata -i eth0 -c /etc/suricata/suricata.yaml

# Update rules
sudo suricata-update

# Analyze pcap
sudo suricata -r capture.pcap -c /etc/suricata/suricata.yaml

# Run in IDS mode (af-packet)
sudo suricata -c /etc/suricata/suricata.yaml --af-packet=eth0
```

### Zeek (formerly Bro)

```
Architecture:

┌─────────────────────────────────────────────────────────────┐
│                     Zeek Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │ Packet      │────►│ Event Engine │────►│ Script       ││
│  │ Capture     │     │              │     │ Interpreter  ││
│  │ (pcap,      │     │ Generates    │     │              ││
│  │  AF-Packet) │     │ events       │     │ Policy       ││
│  └─────────────┘     └──────────────┘     │ scripts      ││
│                                           └──────┬───────┘│
│                                                  │        │
│                                           ┌──────▼───────┐│
│                                           │ Output       ││
│                                           │              ││
│                                           │ - Logs       ││
│                                           │ - Notices    ││
│                                           │ - Intel      ││
│                                           │ - JSON       ││
│                                           └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Zeek Features:**
| Feature | Description |
|---------|-------------|
| Protocol analysis | Deep protocol understanding |
| Scripting language | Custom detection logic |
| Log generation | Structured log files |
| Notice framework | Alerting mechanism |
| Intel framework | Threat intelligence integration |
| File analysis | Extract and analyze files |
| Certificate logging | TLS certificate details |
| Connection logging | Full connection metadata |

**Zeek Logs:**
```
conn.log       - Connection summaries
http.log       - HTTP requests/responses
dns.log        - DNS queries
ssl.log        - TLS certificates
files.log      - File transfers
notice.log     - Alerts (notices)
intel.log      - Threat intelligence matches
software.log   - Software detection
dhcp.log       - DHCP events
smtp.log       - SMTP transactions
```

**Zeek Commands:**
```bash
# Run Zeek
sudo zeek -i eth0

# Analyze pcap
zeek -r capture.pcap

# Run with specific scripts
zeek -i eth0 local

# Generate logs
ls -la /var/log/zeek/

# Check Zeek status
zeekctl status
```

---

## Network Segmentation

### Segmentation Strategies

```
Flat Network (No Segmentation):

┌─────────────────────────────────────────────────────────────┐
│                        Network                              │
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Web   │ │DB    │ │Mail  │ │Dev   │ │IoT   │           │
│  │Server│ │Server│ │Server│ │Server│ │Device │           │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                             │
│  All devices on same network segment                       │
│  Breach of any device = access to all                      │
└─────────────────────────────────────────────────────────────┘

Segmented Network:

┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Perimeter     │
                   │   Firewall      │
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
  ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
  │  DMZ          │ │  Internal     │ │  Management   │
  │  (10.0.1.0/24)│ │  (10.0.2.0/24)│ │  (10.0.3.0/24)│
  ├───────────────┤ ├───────────────┤ ├───────────────┤
  │ Web servers   │ │ App servers   │ │ Jump hosts    │
  │ Mail gateway  │ │ Database      │ │ Monitoring    │
  │ Reverse proxy │ │ Internal apps │ │ Admin tools   │
  └───────────────┘ └───────────────┘ └───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Core Firewall  │
                   │  (Inter-VLAN)   │
                   └─────────────────┘
```

### VLAN Segmentation

```
VLAN Assignment:

┌────────────┬──────────┬──────────┬──────────┬──────────┐
│ VLAN ID    │ VLAN 10  │ VLAN 20  │ VLAN 30  │ VLAN 40  │
├────────────┼──────────┼──────────┼──────────┼──────────┤
│ Purpose    │ Servers  │ Users    │ Guest    │ IoT      │
│ Subnet     │ 10.0.10  │ 10.0.20  │ 10.0.30  │ 10.0.40  │
│ /24        │ .0/24    │ .0/24    │ .0/24    │ .0/24    │
├────────────┼──────────┼──────────┼──────────┼──────────┤
│ Access     │ Servers  │ Workstat.│ BYOD     │ IoT Dev  │
│ Ports      │          │          │          │          │
├────────────┼──────────┼──────────┼──────────┼──────────┤
│ Firewall   │ Strict   │ Moderate │ Strict   │ Strict   │
│ Rules      │          │          │          │          │
├────────────┼──────────┼──────────┼──────────┼──────────┤
│ Monitoring │ High     │ Medium   │ High     │ High     │
└────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Microsegmentation

```
Traditional Segmentation:

┌─────────────────────────────────────────────┐
│  DMZ Segment                               │
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Web 1 │ │Web 2 │ │Web 3 │               │
│  └──────┘ └──────┘ └──────┘               │
│  (All can communicate freely)              │
└─────────────────────────────────────────────┘

Microsegmentation:

┌─────────────────────────────────────────────┐
│  DMZ Segment                               │
│  ┌──────┐     ┌──────┐     ┌──────┐       │
│  │Web 1 │◄───►│Web 2 │     │Web 3 │       │
│  └──┬───┘     └──┬───┘     └──┬───┘       │
│     │            │            │             │
│     └────────────┼────────────┘             │
│                  │                          │
│            ┌─────▼─────┐                    │
│            │  Firewall  │                    │
│            └───────────┘                    │
│                                             │
│  (Each workload has its own security policy)│
└─────────────────────────────────────────────┘
```

---

## Attacks and Bypass Techniques

### Firewall Bypass Techniques

| Technique | Description | Defense |
|-----------|-------------|---------|
| IP Spoofing | Forge source IP | Ingress filtering |
| Fragmentation | Split packets to evade rules | Defragmentation |
| Tunneling | Encapsulate in allowed protocol | Protocol inspection |
| Encryption | Hide payload from inspection | SSL/TLS inspection |
| Covert channels | Hidden data in protocol fields | Deep packet inspection |
| Source port manipulation | Use allowed source ports | Stateful inspection |
| ACK scan | Map firewall rules | Rate limiting |
| Idle scan | Use zombie for scanning | IDS alerts |

### IDS/IPS Evasion

| Technique | Description | Defense |
|-----------|-------------|---------|
| Fragmentation | Split attack across packets | Reassembly |
| Overlapping fragments | Confuse reassembly | Strict reassembly |
| Insertion attacks | Send invalid packets | Protocol validation |
| TTL manipulation | Packets expire in IDS | TTL validation |
| Unicode evasion | Encode attack payloads | Normalization |
| Case manipulation | Vary case in signatures | Case-insensitive matching |
| Whitespace manipulation | Add/modify whitespace | Normalize whitespace |
| Stream splitting | Send attack in multiple streams | Session tracking |

### Firewall Rule Testing

```bash
# Test if port is open
nmap -sT -p 80,443 target
nc -zv target 80

# Test if port is filtered
nmap -Pn -p 80 target  # SYN scan

# Test firewall rules
hping3 -S -p 80 target  # SYN packet
hping3 -A -p 80 target  # ACK packet (bypass stateless)
hping3 -F -p 80 target  # Fragmented

# Test IDS evasion
fragtest -f firewall.rules -r rules.txt -t target
```

---

## Tools and Debugging

### Firewall Management Tools

| Tool | Purpose |
|------|---------|
| `iptables` | Linux packet filtering |
| `nftables` | Linux packet filtering (replacement) |
| `ufw` | Uncomplicated Firewall (Ubuntu) |
| `firewalld` | Dynamic firewall daemon (RHEL) |
| `pf` | Packet filter (BSD/macOS) |
| `firewall-cmd` | firewalld CLI |
| `shorewall` | iptables-based firewall |

### IDS/IPS Management Tools

| Tool | Purpose |
|------|---------|
| `snort` | Network IDS/IPS |
| `suricata` | Network IDS/IPS/NSM |
| `zeek` | Network security monitor |
| `ossec` | Host-based IDS |
| `wazuh` | Security platform (HIDS+SIEM) |
| `security-onion` | Full NSM platform |
| `arkime` | Full packet capture |

### Debug Commands

```bash
# iptables debugging
iptables -L -n -v -x  # Verbose with counters
iptables -t nat -L -n  # NAT table
iptables -t mangle -L -n  # Mangle table

# Check firewall logs
tail -f /var/log/kern.log | grep -i iptables
journalctl -k | grep -i firewall

# Snort debugging
snort -T -c /etc/snort/snort.conf  # Test config
snort -v -r capture.pcap  # Verbose pcap analysis

# Suricata debugging
suricata -T -c /etc/suricata/suricata.yaml  # Test config
suricata-update list-sources  # List available rule sources
suricata-update enable-source et/open  # Enable ruleset

# Zeek debugging
zeek -r capture.pcap  # Analyze pcap
zeekctl diag  # Diagnose issues

# Connection tracking
conntrack -L  # List connections
conntrack -S  # Connection statistics
cat /proc/net/nf_conntrack
```

---

## Interview Questions

### Basic

1. What is the difference between IDS and IPS?
2. What is a stateful firewall?
3. What is packet filtering?
4. What is the difference between WAF and NGFW?
5. What is network segmentation?

### Intermediate

6. How does stateful inspection track connections?
7. What are the pros and cons of signature vs anomaly detection?
8. Explain the difference between inline and out-of-band IDS.
9. What is SSL/TLS inspection and why is it needed?
10. How does VLAN segmentation improve security?

### Advanced

11. How would you detect and prevent firewall bypass attempts?
12. Explain microsegmentation and its benefits.
13. Compare Snort, Suricata, and Zeek capabilities.
14. How does deep packet inspection work?
15. Explain the architecture of a next-gen firewall.

---

## Hands-On Labs

### Lab 1: iptables Configuration
```bash
# Basic firewall setup
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "Dropped: "

# View rules
iptables -L -n -v
```

### Lab 2: Snort Rule Creation
```bash
# Create custom rule
echo 'alert icmp any any -> $HOME_NET any (msg:"ICMP Ping"; sid:1000001; rev:1;)' \
  >> /etc/snort/rules/local.rules

# Test rule
sudo snort -T -c /etc/snort/snort.conf

# Run Snort
sudo snort -i eth0 -c /etc/snort/snort.conf -A alert_fast
```

### Lab 3: Suricata Setup
```bash
# Install Suricata
sudo apt install suricata

# Update rules
sudo suricata-update

# Test configuration
sudo suricata -T -c /etc/suricata/suricata.yaml

# Run Suricata
sudo suricata -i eth0 -c /etc/suricata/suricata.yaml

# Check EVE log
tail -f /var/log/suricata/eve.json
```

### Lab 4: VLAN Segmentation
```bash
# Create VLAN on Linux
sudo ip link add link eth0 name eth0.10 type vlan id 10
sudo ip addr add 10.0.10.1/24 dev eth0.10
sudo ip link set dev eth0.10 up

# Configure iptables for inter-VLAN routing
iptables -A FORWARD -i eth0.10 -o eth0.20 -j ACCEPT
iptables -A FORWARD -i eth0.20 -o eth0.10 -j ACCEPT
```

### Lab 5: Zeek Analysis
```bash
# Analyze pcap with Zeek
zeek -r capture.pcap

# Check generated logs
ls -la *.log

# Analyze connections
cat conn.log | zeek-cut id.orig_h id.resp_p proto | head -20

# Analyze HTTP
cat http.log | zeek-cut id.orig_h host uri | head -20
```

---

## Summary Table

### Firewall Types

| Type | Layer | Inspection | Performance | Security |
|------|-------|------------|-------------|----------|
| Packet Filtering | L3-L4 | Headers only | High | Basic |
| Stateful | L3-L4 | Headers + state | High | Good |
| Application (WAF) | L7 | HTTP content | Medium | Excellent |
| NGFW | L3-L7 | Deep packet | Medium | Excellent |
| UTM | L3-L7 | All-in-one | Medium | Good |

### IDS vs IPS

| Feature | IDS | IPS |
|---------|-----|-----|
| Position | Out-of-band | Inline |
| Action | Alert only | Alert + Block |
| Performance impact | None | Yes |
| False positive impact | Low (alert only) | High (blocks legit traffic) |
| Deployment | Easier | Requires tuning |
| Protection | Detection only | Prevention |

### Detection Methods

| Method | Accuracy | False Positives | Zero-Day | Performance |
|--------|----------|-----------------|----------|-------------|
| Signature | High | Low | No | High |
| Anomaly | Medium | High | Yes | Medium |
| Hybrid | High | Medium | Yes | Medium |

### Tools Comparison

| Tool | Type | Use Case | Language |
|------|------|----------|----------|
| Snort | IDS/IPS | Network monitoring | C |
| Suricata | IDS/IPS/NSM | Enterprise monitoring | C |
| Zeek | NSM | Protocol analysis | C++/Script |
| OSSEC | HIDS | Host monitoring | C |
| Wazuh | HIDS+SIEM | Full security | C/Python |

---

## Related Topics

- [Network Protocols](Network-Protocols.md)
- [TCP/IP Deep Dive](TCP-IP-Deep-Dive.md)
- [DNS & DHCP](DNS-DHCP.md)
- [Network Analysis](Network-Analysis.md)
