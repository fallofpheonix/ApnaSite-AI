# Network Analysis

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OSI / TCP-IP MODEL                               │
├──────────────┬──────────────┬───────────────────────────────────────┤
│ OSI Layer    │ TCP/IP Layer │ Analysis Focus                       │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 7. App       │              │ ┌───────────────────────────────────┐ │
│              │              │ │ HTTP analysis, DNS queries        │ │
│              │  Application │ │ SMTP, FTP, SSH parsing            │ │
│              │              │ │ Protocol compliance               │ │
├──────────────┤              │ └───────────────────────────────────┘ │
│ 6. Present   │              │ ┌───────────────────────────────────┐ │
│              │              │ │ TLS handshake analysis            │ │
│ 5. Session   │              │ │ Certificate inspection            │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 4. Transport │  Transport   │ ┌───────────────────────────────────┐ │
│              │              │ │ TCP/UDP flow analysis              │ │
│              │              │ │ Connection tracking                │ │
│              │              │ │ Retransmission detection           │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 3. Network   │  Internet    │ ┌───────────────────────────────────┐ │
│              │              │ │ IP routing, fragmentation         │ │
│              │              │ │ ICMP analysis                     │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 2. Data Link │  Link        │ ┌───────────────────────────────────┐ │
│              │              │ │ ARP, MAC analysis                 │ │
│              │              │ │ VLAN tagging                      │ │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 1. Physical  │              │ Signal analysis, cable testing       │
└──────────────┴──────────────┴───────────────────────────────────────┘
```

## Table of Contents

1. [Wireshark Basics](#wireshark-basics)
2. [Packet Capture](#packet-capture)
3. [Protocol Analysis](#protocol-analysis)
4. [Network Forensics](#network-forensics)
5. [Traffic Analysis Techniques](#traffic-analysis-techniques)
6. [Bandwidth Monitoring](#bandwidth-monitoring)
7. [NetFlow Analysis](#netflow-analysis)
8. [Tools and Utilities](#tools-and-utilities)
9. [Attacks Detection](#attacks-detection)
10. [Interview Questions](#interview-questions)
11. [Hands-On Labs](#hands-on-labs)
12. [Summary Table](#summary-table)

---

## Wireshark Basics

### Interface Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ Wireshark - Network Protocol Analyzer                              │
├─────────────────────────────────────────────────────────────────────┤
│ File Edit View Go Capture Analyze Statistics Telephony Wireless Tools Help │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [Display Filter]  [Apply] [Clear]                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ No. │ Time    │ Source      │ Dest        │ Proto │ Len │ Info     │
├─────┼─────────┼─────────────┼─────────────┼───────┼─────┼──────────┤
│  1  │ 0.000   │ 10.0.0.100  │ 93.184.216  │ TCP   │ 66  │ 49152→80 │
│  2  │ 0.001   │ 93.184.216  │ 10.0.0.100  │ TCP   │ 66  │ 80→49152 │
│  3  │ 0.002   │ 10.0.0.100  │ 93.184.216  │ TCP   │ 54  │ ACK      │
│ ... │         │             │             │       │     │          │
├─────┴─────────┴─────────────┴─────────────┴───────┴─────┴──────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Packet Details (Expandable Tree)                               │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Frame 1: 66 bytes on wire, 66 bytes captured                  │ │
│ │ ├─ Ethernet II: Src: aa:bb:cc:dd:ee:ff, Dst: 11:22:33:44:55:66│ │
│ │ ├─ Internet Protocol Version 4: Src: 10.0.0.100, Dst: 93...   │ │
│ │ ├─ Transmission Control Protocol: Src Port: 49152, Dst Port: 80│ │
│ │ └─ [HTTP] (if present)                                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Packet Bytes (Hex Dump)                                        │ │
│ │ 0000  aa bb cc dd ee ff 11 22 33 44 55 66 08 00 45 00          │ │
│ │ 0010  00 34 12 34 40 00 40 06 ...                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Essential Display Filters

#### Protocol Filters
```
# HTTP traffic
http
http.request
http.response
http.request.method == "POST"
http.response.code == 200
http.host contains "example.com"

# DNS traffic
dns
dns.qry.name == "example.com"
dns.a == "93.184.216.34"
dns.qry.type == 1  # A record

# TCP traffic
tcp
tcp.flags.syn == 1
tcp.flags.rst == 1
tcp.port == 80
tcp.stream eq 5

# UDP traffic
udp
udp.port == 53

# ICMP traffic
icmp
icmp.type == 8  # Echo request
icmp.type == 0  # Echo reply
```

#### IP Filters
```
# Specific hosts
ip.src == 10.0.0.100
ip.dst == 93.184.216.34
ip.addr == 10.0.0.100

# Subnet
ip.addr == 10.0.0.0/24

# IP ranges
ip.addr >= 10.0.0.1 and ip.addr <= 10.0.0.100

# Protocol
ip.proto == 6  # TCP
ip.proto == 17  # UDP
ip.proto == 1  # ICMP
```

#### Combination Filters
```
# HTTP errors
http.response.code >= 400

# Large packets
frame.len > 1000

# Specific conversation
ip.addr == 10.0.0.100 and ip.addr == 93.184.216.34

# Time-based
frame.time >= "2026-07-16 10:00:00" and frame.time <= "2026-07-16 11:00:00"

# TCP flags
tcp.flags.syn == 1 and tcp.flags.ack == 0  # SYN only
tcp.flags.rst == 1  # RST packets

# Errors
tcp.analysis.flags
tcp.analysis.retransmission
tcp.analysis.duplicate_ack
```

### Color Rules

```
Wireshark Packet Colors:

Green:   TCP (normal traffic)
Blue:    DNS
Purple:  TCP SYN/FIN
Black:   TCP errors (retransmission, etc.)
Yellow:  Warning
Red:     Error

Custom Color Rules:
Edit → Coloring Rules → Add

Example: Highlight HTTP errors
Filter: http.response.code >= 400
Color: Red background
```

---

## Packet Capture

### Capture Methods

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Packet Capture Methods                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Promiscuous│  │   SPAN/Mirror│  │   Network    │             │
│  │   Mode       │  │   Port       │  │   Tap        │             │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤             │
│  │ NIC captures │  │ Switch copies│  │ Physical     │             │
│  │ ALL traffic  │  │ port traffic │  │ device in    │             │
│  │ on network   │  │ to monitor   │  │ line        │             │
│  │ segment      │  │ port         │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │   Remote     │  │   Agent-     │                                │
│  │   Capture    │  │   Based      │                                │
│  ├──────────────┤  ├──────────────┤                                │
│  │ Capture from │  │ Software on  │                                │
│  │ remote host  │  │ endpoint     │                                │
│  │ via SSH/RPCAP│  │ captures     │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Capture Filters (BPF)

```bash
# Host-based filters
host 10.0.0.100
src host 10.0.0.100
dst host 93.184.216.34
net 10.0.0.0/24

# Port filters
port 80
portrange 1-1024
src port 49152
dst port 443

# Protocol filters
tcp
udp
icmp
arp

# Direction filters
src net 10.0.0.0/8
dst net 192.168.0.0/16

# Combined filters
host 10.0.0.100 and port 80
tcp and port 80 and not port 443
(src 10.0.0.100 or src 10.0.0.101) and dst port 80

# Size filters
greater 1000
less 100
```

### Capture Options

```
Wireshark Capture Options:

┌─────────────────────────────────────────────────────────────────────┐
│ Capture Options                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Interface:     eth0 ▼                                              │
│ Capture filter: [port 80 or port 443]                              │
│                                                                  │
│ ☑ Promiscuous mode                                                │
│ ☑ Resolve MAC addresses                                          │
│ ☑ Resolve network (IP) addresses                                 │
│ ☑ Resolve transport (TCP/UDP) ports                              │
│                                                                  │
│ Capture packets:                                                  │
│ ☐ Capture limit: [____] packets                                  │
│ ☐ Capture file(s): [/path/to/file.pcap]                          │
│ ☐ File size: [____] MB (rotate)                                  │
│ ☐ Ring buffer: [____] files                                      │
│                                                                  │
│ ☑ Enable name resolution                                        │
│ ☐ Stop capture after: [____] seconds                             │
│ ☑ Auto-scroll live capture                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Command-Line Capture (tcpdump)

```bash
# Basic capture
sudo tcpdump -i eth0

# Capture with filter
sudo tcpdump -i eth0 port 80
sudo tcpdump -i eth0 host 10.0.0.100
sudo tcpdump -i eth0 'tcp[tcpflags] & tcp-syn != 0'

# Save to file
sudo tcpdump -i eth0 -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Verbose output
sudo tcpdump -i eth0 -vvv

# Limit capture
sudo tcpdump -i eth0 -c 1000  # 1000 packets
sudo tcpdump -i eth0 -G 3600 -w 'cap_%Y%m%d_%H%M.pcap'  # Rotate hourly

# Capture specific traffic
sudo tcpdump -i eth0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'

# DNS capture
sudo tcpdump -i eth0 port 53 -nn

# HTTP capture (without encryption)
sudo tcpdump -i eth0 port 80 -A | grep -i 'get\|post\|http'
```

### Capture Files

| Format | Extension | Description |
|--------|-----------|-------------|
| pcap | .pcap | Standard capture format |
| pcapng | .pcapng | Next-gen format (recommended) |
| pcap-compressed | .pcap.gz | Gzipped pcap |
| pcap-in-memory | (memory) | Live capture |

---

## Protocol Analysis

### HTTP Analysis

```
HTTP Request Analysis:

Frame 1: 66 bytes
  Ethernet II: Src: aa:bb:cc:dd:ee:ff, Dst: 11:22:33:44:55:66
  IPv4: Src: 10.0.0.100, Dst: 93.184.216.34
  TCP: Src Port: 49152, Dst Port: 80, Seq: 1, Ack: 1
  
Hypertext Transfer Protocol
  GET /index.html HTTP/1.1\r\n
  Host: www.example.com\r\n
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n
  Accept: text/html,application/xhtml+xml\r\n
  Accept-Language: en-US,en;q=0.9\r\n
  Accept-Encoding: gzip, deflate, br\r\n
  Connection: keep-alive\r\n
  Cookie: session=abc123\r\n
  \r\n

HTTP Response Analysis:
  HTTP/1.1 200 OK\r\n
  Server: Apache/2.4.51\r\n
  Content-Type: text/html; charset=UTF-8\r\n
  Content-Length: 1234\r\n
  Set-Cookie: session=xyz789; HttpOnly; Secure\r\n
  Strict-Transport-Security: max-age=31536000\r\n
  \r\n
  [Full response body]
```

### DNS Analysis

```
DNS Query Analysis:

Frame 5: 74 bytes
  UDP: Src Port: 53, Dst Port: 53123
  
Domain Name System (query)
  Transaction ID: 0x1234
  Flags: 0x0100 (Standard query)
  Questions: 1
  Answers: 0
  
  Queries
    www.example.com: type A, class IN
      Name: www.example.com
      Type: A (Host address)
      Class: IN (Internet)

DNS Response Analysis:
  Answers
    www.example.com: type A, class IN, addr 93.184.216.34
      Name: www.example.com
      Type: A (Host address)
      Class: IN (Internet)
      TTL: 300 (5 minutes)
      Length: 4
      Address: 93.184.216.34
```

### TLS/SSL Analysis

```
TLS Handshake Analysis:

ClientHello:
  Handshake Type: Client Hello (1)
  Version: TLS 1.2
  Random: 32 bytes
  Session ID Length: 32
  Cipher Suites Length: 36
  Cipher Suites:
    TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
  Extensions:
    server_name: www.example.com
    signature_algorithms: ecdsa_sha256, rsa_sha256

ServerHello:
  Handshake Type: Server Hello (2)
  Version: TLS 1.2
  Random: 32 bytes
  Cipher Suite: TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
  Extensions:
    certificate: [Certificate chain]

Certificate:
  Handshake Type: Certificate (11)
  Certificates:
    Subject: CN=www.example.com
    Issuer: CN=Let's Encrypt Authority X3
    Validity: Not Before, Not After
    Public Key: RSA 2048 bits

Change Cipher Spec:
  Change Cipher Spec Message

Encrypted Handshake Message:
  [Encrypted Finish]
```

### TCP Analysis

```
TCP Stream Analysis:

Frame 1: SYN
  TCP: Src Port: 49152, Dst Port: 80
  Flags: SYN
  Sequence Number: 0 (relative)
  Window: 64240
  MSS: 1460

Frame 2: SYN-ACK
  TCP: Src Port: 80, Dst Port: 49152
  Flags: SYN, ACK
  Sequence Number: 0 (relative)
  Acknowledgment Number: 1 (relative)
  Window: 65535
  MSS: 1460

Frame 3: ACK
  TCP: Src Port: 49152, Dst Port: 80
  Flags: ACK
  Sequence Number: 1 (relative)
  Acknowledgment Number: 1 (relative)

Frame 4-10: Data Transfer
  [HTTP Request in Frame 4]
  [TCP ACK in Frame 5]
  [TCP Segment in Frame 6]
  [HTTP Response in Frame 7-10]

Frame 11: FIN
  TCP: Flags: FIN, ACK

Frame 12: ACK
  TCP: Flags: ACK

Frame 13: FIN
  TCP: Flags: FIN, ACK

Frame 14: ACK
  TCP: Flags: ACK
```

---

## Network Forensics

### Evidence Collection

```
┌─────────────────────────────────────────────────────────────────────┐
│                Network Forensics Process                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. IDENTIFY                                                        │
│     └─ Detect suspicious activity (IDS alerts, anomalies)          │
│                                                                     │
│  2. CAPTURE                                                         │
│     └─ Full packet capture (PCAP)                                  │
│     └─ Flow data (NetFlow, sFlow)                                  │
│     └─ Logs (firewall, proxy, DNS)                                 │
│                                                                     │
│  3. PRESERVE                                                        │
│     └─ Chain of custody documentation                              │
│     └─ Hash verification (MD5/SHA256)                              │
│     └─ Secure storage                                               │
│                                                                     │
│  4. ANALYZE                                                         │
│     └─ Protocol analysis (Wireshark)                               │
│     └─ Timeline reconstruction                                     │
│     └─ Statistical analysis                                         │
│     └─ Extract artifacts (files, credentials)                      │
│                                                                     │
│  5. REPORT                                                          │
│     └─ Timeline of events                                          │
│     └─ Extracted evidence                                           │
│     └─ Indicators of Compromise (IoCs)                             │
│     └─ Recommendations                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Evidence Types

| Evidence Type | Source | Use Case |
|---------------|--------|----------|
| Full PCAP | Wireshark, tcpdump | Complete packet analysis |
| Packet headers | NetFlow, IPFIX | Connection metadata |
| Connection logs | Firewall, proxy | Communication patterns |
| DNS logs | DNS server | Domain resolution tracking |
| DHCP logs | DHCP server | IP assignment tracking |
| HTTP logs | Web server | Web activity |
| Email logs | Mail server | Email communications |
| TLS logs | NGFW, proxy | Certificate information |

### Timeline Analysis

```
Network Forensics Timeline:

10:00:00  ──── Normal web browsing ────────────
10:05:32  ──── DNS query: evil.com ────────────
10:05:33  ──── TCP SYN to evil.com:443 ────────
10:05:34  ──── TLS handshake ──────────────────
10:05:35  ──── HTTP POST to /upload ───────────
10:05:36  ──── 500KB data transferred ────────
10:05:37  ──── HTTP GET /download/shell.exe ───
10:05:38  ──── File downloaded (2.3MB) ───────
10:05:39  ──── DNS query: c2-server.com ──────
10:05:40  ──── TCP connection to c2:4444 ──────
10:05:41  ──── Encrypted C2 traffic ──────────
10:10:00  ──── Multiple RDP connections ───────
10:15:00  ──── SMB file shares accessed ──────
10:20:00  ──── Data exfiltration detected ────

Evidence:
- evil.com (malicious download)
- c2-server.com (command & control)
- RDP lateral movement
- SMB data exfiltration
```

### Packet Extraction

```bash
# Extract files from pcap
# Using Wireshark: File → Export Objects → HTTP/DICOM/SMB/TFTP

# Using tcpextract
tcpextract -r capture.pcap -a

# Using NetworkMiner
networkminer -r capture.pcap

# Extract specific traffic
tcpdump -r capture.pcap -w http_traffic.pcap 'port 80'

# Extract DNS queries
tcpdump -r capture.pcap -nn port 53 | grep -o '[A-Za-z0-9]*\.[A-Za-z]*\.[A-Za-z]*'

# Extract URLs
strings capture.pcap | grep -i 'http://\|https://'

# Extract emails
strings capture.pcap | grep -i 'From:\|To:\|Subject:'
```

---

## Traffic Analysis Techniques

### Statistical Analysis

```
Wireshark Statistics:

Conversation Statistics:
┌──────────────────────────────────────────────────────────────┐
│ Conversations                                                 │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Address 1│ Address 2│ Packets  │ Bytes    │ Protocol         │
├──────────┼──────────┼──────────┼──────────┼──────────────────┤
│ 10.0.0.1 │ 8.8.8.8  │ 1234     │ 1.2 MB   │ DNS              │
│ 10.0.0.1 │ 142.250. │ 5678     │ 12.5 MB  │ HTTP/TLS        │
│ 10.0.0.1 │ 10.0.0.2 │ 890      │ 2.3 MB   │ SMB              │
└──────────┴──────────┴──────────┴──────────┴──────────────────┘

Protocol Hierarchy:
├── Ethernet II
│   ├── IPv4
│   │   ├── TCP (78%)
│   │   │   ├── HTTP (45%)
│   │   │   ├── TLS (30%)
│   │   │   └── SSH (5%)
│   │   ├── UDP (15%)
│   │   │   ├── DNS (10%)
│   │   │   └── DHCP (5%)
│   │   └── ICMP (2%)
│   └── ARP (5%)

IO Graph:
┌─────────────────────────────────────────────────────────────┐
│ Packets/sec                                                 │
│ 1000│           ████                                        │
│  800│       ████    ████                                   │
│  600│   ████            ████                               │
│  400│███                    ████                           │
│  200│                            ████                      │
│    0└──────────────────────────────────────────────► Time  │
└─────────────────────────────────────────────────────────────┘
```

### Flow Analysis

```
Flow Record:

┌─────────────────────────────────────────────────────────────┐
│ Flow: 10.0.0.100:49152 → 93.184.216.34:80                  │
├─────────────────────────────────────────────────────────────┤
│ Start Time:    2026-07-16 10:05:32.123                     │
│ End Time:      2026-07-16 10:05:34.567                     │
│ Duration:      2.444 seconds                                │
│ Protocol:      TCP (6)                                      │
│ Packets:       12 (src→dst: 6, dst→src: 6)                  │
│ Bytes:         1234 (src→dst: 567, dst→src: 667)           │
│ Flags:         SYN, ACK, FIN                               │
│ TTL:           64 → 55                                     │
│ TCP Window:    64240 → 65535                               │
│ Retransmits:   0                                            │
│ Errors:        None                                         │
└─────────────────────────────────────────────────────────────┘
```

### Pattern Detection

```
Suspicious Patterns:

1. Port Scanning:
   ┌─────────────────────────────────────────┐
   │ 10.0.0.100 → multiple IPs, port 80      │
   │ SYN packets, no ACK responses           │
   │ High volume in short time               │
   └─────────────────────────────────────────┘

2. Data Exfiltration:
   ┌─────────────────────────────────────────┐
   │ 10.0.0.100 → external IP                │
   │ Large outbound data (100MB+)            │
   │ Unusual time (2 AM)                     │
   │ Encrypted traffic (TLS)                 │
   └─────────────────────────────────────────┘

3. C2 Communication:
   ┌─────────────────────────────────────────┐
   │ Regular beaconing (every 60 seconds)    │
   │ Small, consistent packet sizes          │
   │ Encrypted traffic to single IP          │
   │ DNS queries to DGA domains              │
   └─────────────────────────────────────────┘

4. Lateral Movement:
   ┌─────────────────────────────────────────┐
   │ Internal → Internal, multiple ports     │
   │ RDP, SMB, WMI, PowerShell               │
   │ New connections between hosts           │
   └─────────────────────────────────────────┘
```

---

## Bandwidth Monitoring

### Tools

| Tool | Type | Platform | Features |
|------|------|----------|----------|
| iftop | CLI | Linux | Real-time bandwidth per connection |
| nethogs | CLI | Linux | Bandwidth per process |
| vnstat | CLI | Linux | Historical traffic statistics |
| nload | CLI | Linux | Real-time bandwidth graph |
| iperf3 | CLI | Cross-platform | Bandwidth testing |
| PRTG | GUI | Windows | Enterprise monitoring |
| Cacti | GUI | Linux | Graphing and monitoring |
| Zabbix | GUI | Cross-platform | Enterprise monitoring |

### iftop Usage

```bash
# Basic usage
sudo iftop -i eth0

# With port filtering
sudo iftop -i eth0 -f "port 80"

# With display options
sudo iftop -i eth0 -n  # Don't resolve hostnames
sudo iftop -i eth0 -P  # Show ports
sudo iftop -i eth0 -N  # Don't resolve port names

# Output:
#                  12.5Kb          25.0Kb          37.5Kb          50.0Kb
# ─────────────────────────────────────────────────────────────────────
# 10.0.0.100    <=>  93.184.216.34    15.2Kb   12.1Kb   10.5Kb
# 10.0.0.100    <=>  142.250.80.46     8.3Kb    7.2Kb    6.8Kb
# 10.0.0.101    <=>  10.0.0.1          2.1Kb    1.8Kb    1.5Kb
```

### nethogs Usage

```bash
# Basic usage
sudo nethogs eth0

# With refresh interval
sudo nethogs eth0 -d 2

# Tracemode
sudo nethogs eth0 -t

# Output:
# NetHogs version 0.8.5
#
#   PID    USER     PROGRAM                                   DEV        SENT      RECEIVED
#  1234    root     /usr/sbin/sshd                           eth0       15.2 KB    12.1 KB
#  5678    www-data /usr/sbin/apache2                         eth0      125.3 KB   892.1 KB
#  9012    root     /usr/bin/wget                             eth0        2.1 MB     15.2 KB
```

### iperf3 Testing

```bash
# Server
iperf3 -s

# Client - TCP test
iperf3 -c server_ip -t 10 -P 4  # 4 parallel streams, 10 seconds

# Client - UDP test
iperf3 -c server_ip -u -b 100M  # 100 Mbps UDP

# Bidirectional test
iperf3 -c server_ip -d

# Reverse test (server sends)
iperf3 -c server_ip -R

# JSON output
iperf3 -c server_ip -J

# Output:
# [ ID] Interval       Transfer     Bitrate
# [  5] 0.00-10.00 sec  1.10 GBytes  942 Mbits/sec  sender
# [  5] 0.00-10.00 sec  1.10 GBytes  941 Mbits/sec  receiver
```

---

## NetFlow Analysis

### NetFlow Overview

```
NetFlow Components:

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Network     │     │  NetFlow     │     │  Collector   │
│  Device      │────►│  Exporter    │────►│  (Analyzer)  │
│  (Router/    │     │              │     │              │
│   Switch)    │     │  Exports     │     │  Aggregates  │
└──────────────┘     │  flow records│     │  & Analyzes  │
                     └──────────────┘     └──────────────┘

Flow Record Fields:
┌─────────────────────────────────────────────────────────────┐
│ Field                    │ Description                       │
├──────────────────────────┼──────────────────────────────────┤
│ Source IP                │ Originating IP address            │
│ Destination IP           │ Destination IP address            │
│ Source Port              │ Originating port                  │
│ Destination Port         │ Destination port                  │
│ Protocol                 │ IP protocol (TCP/UDP/ICMP)        │
│ ToS                      │ Type of Service                   │
│ Input/Output Interface   │ Router interface                  │
│ Packets                  │ Number of packets                 │
│ Bytes                    │ Number of bytes                   │
│ First/Last               │ Flow timestamps                   │
│ TCP Flags                │ TCP flag bitmask                  │
│ AS Source/Destination    │ Autonomous System numbers         │
│ VLAN                     │ VLAN tags                         │
└──────────────────────────┴──────────────────────────────────┘
```

### NetFlow Versions

| Version | Features | Use Case |
|---------|----------|----------|
| v5 | Fixed format, 24 fields | Traditional routers |
| v7 | Like v5, adds router IP | Cisco routers |
| v9 | Template-based, flexible | Modern devices |
| IPFIX | Standard (RFC 7011) | Cross-vendor |

### NetFlow Analysis Tools

| Tool | Type | Features |
|------|------|----------|
| nfdump | CLI | NetFlow collection and analysis |
| nfsen | GUI | Web-based NetFlow visualization |
| ntopng | GUI | Real-time traffic analysis |
| ManageEngine | GUI | Enterprise flow analysis |
| Plixer Scrutinizer | GUI | Enterprise flow analysis |
| Elastic Stack | GUI | Custom flow analysis |

### nfdump Usage

```bash
# Collect flows
nfcapd -l /var/flows -p 9995

# Analyze flows
nfdump -r /var/flows/nfcapd.202607161200

# Filter by IP
nfdump -r /var/flows/nfcapd.202607161200 'src ip 10.0.0.100'

# Filter by port
nfdump -r /var/flows/nfcapd.202607161200 'dst port 80'

# Top talkers
nfdump -r /var/flows/nfcapd.202607161200 -s srcip/bytes -n 10

# Top destinations
nfdump -r /var/flows/nfcapd.202607161200 -s dstip/bytes -n 10

# Time range
nfdump -r /var/flows/nfcapd.202607161200 -t '2026/07/16.10:00:00-2026/07/16.11:00:00'

# Aggregation
nfdump -r /var/flows/nfcapd.202607161200 -a srcip, dstport
```

### Flow Analysis Queries

```bash
# Find top bandwidth consumers
nfdump -r flows -s srcip/bytes -n 20

# Find DNS queries
nfdump -r flows 'dst port 53' -s srcip/flows

# Find potential scanning
nfdump -r flows 'flags syn and not flags ack' -s srcip/flows -n 20

# Find long connections
nfdump -r flows 'duration > 3600' -s srcip/dstip

# Find large transfers
nfdump -r flows 'bytes > 100000000' -s srcip/dstip

# Export to CSV
nfdump -r flows -o csv > flows.csv
```

---

## Tools and Utilities

### Capture Tools

| Tool | Platform | Description |
|------|----------|-------------|
| Wireshark | Cross-platform | GUI packet analyzer |
| tcpdump | Linux/macOS | CLI packet capture |
| tshark | Cross-platform | CLI Wireshark |
| dumpcap | Cross-platform | Wireshark capture engine |
| WinPcap/Npcap | Windows | Packet capture library |
| netcap | Go | Packet capture tool |
| joy | Cross-platform | Network flow data |

### Analysis Tools

| Tool | Platform | Description |
|------|----------|-------------|
| Wireshark | Cross-platform | Protocol analysis |
| tshark | Cross-platform | CLI protocol analysis |
| NetworkMiner | Windows | Network forensics |
| Zeek | Cross-platform | Network security monitor |
| Arkime | Linux | Full packet capture |
| Moloch | Linux | Large-scale pcap indexing |
| Stenographer | Linux | Full packet capture |

### Monitoring Tools

| Tool | Platform | Description |
|------|----------|-------------|
| iftop | Linux | Real-time bandwidth |
| nethogs | Linux | Bandwidth per process |
| vnstat | Linux | Traffic statistics |
| nload | Linux | Bandwidth graph |
| iperf3 | Cross-platform | Bandwidth testing |
| Prometheus | Cross-platform | Metrics collection |
| Grafana | Cross-platform | Visualization |

### Essential Commands

```bash
# Quick network analysis
# Capture specific traffic
sudo tcpdump -i eth0 -nn port 80 -c 100 -w http.pcap

# Analyze with tshark
tshark -r http.pcap -T fields -e http.request.method -e http.host

# Flow analysis
tshark -r capture.pcap -q -z conv,tcp

# Statistics
tshark -r capture.pcap -q -z io,phs

# Extract DNS queries
tshark -r capture.pcap -Y dns -T fields -e dns.qry.name

# Extract HTTP hosts
tshark -r capture.pcap -Y http -T fields -e http.host

# Connection analysis
tshark -r capture.pcap -q -z conv,ip
```

---

## Attacks Detection

### Attack Signatures

| Attack | Indicators | Detection |
|--------|------------|-----------|
| Port Scan | Many SYN to different ports | High SYN count, no ACK |
| SYN Flood | Excessive SYN packets | SYN rate > threshold |
| DNS Amplification | Large DNS responses | DNS response > 512 bytes |
| DDoS | High traffic volume | Bandwidth spike |
| Data Exfiltration | Large outbound transfers | Unusual data volume |
| C2 Beaconing | Regular small connections | Periodic connections |
| Lateral Movement | Internal port scanning | New internal connections |
| Credential Stuffing | Many login attempts | HTTP 401/403 spikes |

### Detection Queries

```bash
# Port scan detection
tshark -r capture.pcap -Y "tcp.flags.syn==1 && tcp.flags.ack==0" \
  -T fields -e ip.src | sort | uniq -c | sort -rn | head -20

# SYN flood detection
tshark -r capture.pcap -Y "tcp.flags.syn==1 && tcp.flags.ack==0" \
  -T fields -e ip.src | sort | uniq -c | sort -rn

# DNS amplification
tshark -r capture.pcap -Y "dns && udp.length > 512" \
  -T fields -e ip.src -e udp.length

# Data exfiltration
nfdump -r flows 'bytes > 10000000' -s srcip/dstip

# C2 beaconing (regular intervals)
tshark -r capture.pcap -Y "tcp.flags.syn==1" \
  -T fields -e frame.time -e ip.src -e ip.dst | \
  awk '{print $4}' | sort | uniq -c | sort -rn
```

### Security Onion

```
Security Onion Stack:

┌─────────────────────────────────────────────────────────────┐
│                Security Onion Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │ Capture     │────►│ Processing   │────►│ Analysis     ││
│  │             │     │              │     │              ││
│  │ • Stenograph│     │ • Logstash   │     │ • Kibana     ││
│  │ • pcap-agent│     │ • Elasticsearch│   │ • CyberChef  ││
│  │ • netsniff  │     │ • Suricata   │     │ • Wazuh      ││
│  └─────────────┘     │ • Zeek       │     │ • TheHive    ││
│                      └──────────────┘     └──────────────┘│
│                                                             │
│  Features:                                                  │
│  • Full packet capture (pcap)                              │
│  • Network metadata (NetFlow)                              │
│  • Intrusion detection (Suricata)                          │
│  • Protocol analysis (Zeek)                                │
│  • Log management (ELK stack)                              │
│  • Alerting and response                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Basic

1. What is Wireshark and what does it do?
2. What is the difference between a capture filter and a display filter?
3. What is a TCP handshake?
4. What is packet capture?
5. How do you identify malicious traffic?

### Intermediate

6. Explain the OSI model and where network analysis happens.
7. What is the difference between promiscuous mode and monitor mode?
8. How would you detect a SYN flood attack?
9. What is NetFlow and how is it used?
10. How do you extract files from a pcap?

### Advanced

11. How would you perform network forensics on a suspected breach?
12. Explain how to detect C2 beaconing in network traffic.
13. What are the challenges of analyzing encrypted traffic?
14. How would you build a network monitoring solution?
15. Explain how to use Zeek for protocol analysis.

---

## Hands-On Labs

### Lab 1: Wireshark Basics
```bash
# Capture HTTP traffic
tshark -i eth0 -f "port 80" -c 100

# Analyze with display filter
tshark -r capture.pcap -Y "http.request.method == GET"

# Follow TCP stream
# In Wireshark: Right-click → Follow → TCP Stream
```

### Lab 2: tcpdump Capture
```bash
# Capture DNS queries
sudo tcpdump -i eth0 port 53 -nn -v

# Capture with pcap output
sudo tcpdump -i eth0 -w lab.pcap 'port 80 or port 443'

# Analyze capture
tshark -r lab.pcap -q -z conv,tcp
```

### Lab 3: Network Forensics
```bash
# Download sample malware pcap
wget https://www.malware-traffic-analysis.net/...

# Analyze with tshark
tshark -r suspicious.pcap -Y "http.request" -T fields -e http.host -e http.uri

# Extract files
# Wireshark: File → Export Objects → HTTP

# Check DNS queries
tshark -r suspicious.pcap -Y "dns" -T fields -e dns.qry.name
```

### Lab 4: Bandwidth Analysis
```bash
# Install iftop
sudo apt install iftop

# Monitor bandwidth
sudo iftop -i eth0 -n -P

# Test bandwidth with iperf3
# Server:
iperf3 -s
# Client:
iperf3 -c server_ip -t 30 -P 4
```

### Lab 5: NetFlow Analysis
```bash
# Install nfdump
sudo apt install nfdump

# Capture flows
sudo nfcapd -l /tmp/flows -p 9995 -i eth0

# Analyze flows
nfdump -r /tmp/flows/nfcapd.* -s srcip/bytes -n 10

# Find top destinations
nfdump -r /tmp/flows/nfcapd.* -s dstip/bytes -n 20
```

---

## Summary Table

### Tools Comparison

| Tool | Type | Platform | Use Case |
|------|------|----------|----------|
| Wireshark | GUI | Cross | Protocol analysis |
| tcpdump | CLI | Linux/macOS | Packet capture |
| tshark | CLI | Cross | Scripted analysis |
| Zeek | NSM | Cross | Protocol analysis |
| Arkime | Full PCAP | Linux | Large-scale capture |
| iftop | CLI | Linux | Real-time bandwidth |
| nethogs | CLI | Linux | Per-process bandwidth |
| iperf3 | CLI | Cross | Bandwidth testing |
| nfdump | CLI | Linux | NetFlow analysis |
| Security Onion | Suite | Linux | Full NSM platform |

### Analysis Methods

| Method | Data | Purpose | Tools |
|--------|------|---------|-------|
| Packet Analysis | Full PCAP | Deep protocol inspection | Wireshark, tshark |
| Flow Analysis | NetFlow/IPFIX | Connection metadata | nfdump, ntopng |
| Log Analysis | Various logs | Event correlation | ELK, Splunk |
| Statistical | Metrics | Trend analysis | Grafana, Prometheus |
| Behavioral | Patterns | Anomaly detection | ML tools |

### Capture Methods

| Method | Visibility | Performance | Complexity |
|--------|------------|-------------|------------|
| Promiscuous | All traffic on segment | Low overhead | Simple |
| SPAN/Mirror | Copied port traffic | Medium | Medium |
| Network Tap | Physical inline | High | Complex |
| Remote | Remote capture | Network dependent | Complex |
| Agent | Endpoint capture | Low | Medium |

### Key Filters Reference

| Filter | Purpose |
|--------|---------|
| `http.request.method == "POST"` | HTTP POST requests |
| `dns.qry.name contains "evil"` | Suspicious DNS |
| `tcp.flags.syn==1 && tcp.flags.ack==0` | SYN packets |
| `tcp.analysis.retransmission` | TCP retransmissions |
| `frame.len > 1000` | Large packets |
| `ip.src == 10.0.0.100` | Source IP filter |
| `tcp.port == 443` | HTTPS traffic |
| `icmp.type == 8` | ICMP ping |

---

## Related Topics

- [Network Protocols](Network-Protocols.md)
- [TCP/IP Deep Dive](TCP-IP-Deep-Dive.md)
- [DNS & DHCP](DNS-DHCP.md)
- [Firewalls, IDS & IPS](Firewalls-IDS-IPS.md)
