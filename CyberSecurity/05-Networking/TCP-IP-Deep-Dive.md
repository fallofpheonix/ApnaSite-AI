# TCP/IP Deep Dive

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OSI / TCP-IP MODEL                               │
├──────────────┬──────────────┬───────────────────────────────────────┤
│ OSI Layer    │ TCP/IP Layer │ Protocols / Functions                │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 7. App       │              │ HTTP, FTP, SSH, DNS, SMTP, SNMP     │
│ 6. Present   │  Application │ Encoding, Compression, Encryption    │
│ 5. Session   │              │ Session management, Dialog control   │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 4. Transport │  Transport   │ TCP (reliable), UDP (unreliable)    │
│              │              │ Ports, Segmentation, Flow Control    │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 3. Network   │  Internet    │ IP, ICMP, ARP, Routing              │
│              │              │ Addressing, Packet forwarding        │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 2. Data Link │  Link        │ Ethernet, Wi-Fi, PPP                │
│              │              │ Frames, MAC addressing, Error detect │
├──────────────┼──────────────┼───────────────────────────────────────┤
│ 1. Physical  │              │ Cables, Hubs, Signals               │
└──────────────┴──────────────┴───────────────────────────────────────┘
```

## Table of Contents

1. [TCP 3-Way Handshake](#tcp-3-way-handshake)
2. [TCP State Machine](#tcp-state-machine)
3. [TCP Flow Control](#tcp-flow-control)
4. [TCP Congestion Control](#tcp-congestion-control)
5. [TCP Segment Structure](#tcp-segment-structure)
6. [UDP Characteristics](#udp-characteristics)
7. [IP Addressing and Subnetting](#ip-addressing-and-subnetting)
8. [ICMP](#icmp)
9. [Attacks and Defenses](#attacks-and-defenses)
10. [Tools and Debugging](#tools-and-debugging)
11. [Interview Questions](#interview-questions)
12. [Hands-On Labs](#hands-on-labs)
13. [Summary Table](#summary-table)

---

## TCP 3-Way Handshake

### Connection Establishment

```
    Client                                    Server
      │                                         │
      │  1. SYN (seq=x)                        │
      │────────────────────────────────────────►│
      │     [SYN_SENT]                         │
      │                                         │
      │  2. SYN-ACK (seq=y, ack=x+1)           │
      │◄────────────────────────────────────────│
      │     [SYN_RECEIVED]                      │
      │                                         │
      │  3. ACK (ack=y+1)                       │
      │────────────────────────────────────────►│
      │     [ESTABLISHED]                       │
      │                                         │
      │◄═══════════ DATA TRANSFER ═════════════►│
      │                                         │
```

### Sequence Numbers

```
Initial Sequence Number (ISN):
- Random value chosen by each side
- Prevents prediction attacks
- Calculated using: ISN = M + F(localhost, localport, remotehost, remoteport)

Sequence Number Tracking:
Client ISN = 1000
Server ISN = 5000

Client → Server: seq=1000, len=100 bytes
Server → Client: ack=1100

Server → Client: seq=5000, len=200 bytes
Client → Server: ack=5200
```

### Connection Termination (4-Way)

```
    Client                                    Server
      │                                         │
      │  1. FIN (seq=u)                         │
      │────────────────────────────────────────►│
      │     [FIN_WAIT_1]                        │
      │                                         │
      │  2. ACK (ack=u+1)                       │
      │◄────────────────────────────────────────│
      │     [FIN_WAIT_2]                        │
      │                                         │
      │  3. FIN (seq=v)                         │
      │◄────────────────────────────────────────│
      │     [CLOSE_WAIT]                        │
      │                                         │
      │  4. ACK (ack=v+1)                       │
      │────────────────────────────────────────►│
      │     [TIME_WAIT] → [CLOSED]              │
      │                                         │
      │     [LAST_ACK] → [CLOSED]               │
```

### Simultaneous Close

```
    Client                                    Server
      │                                         │
      │  FIN (seq=u)                            │
      │────────────────────────────────────────►│
      │◄────────────────────────────────────────│
      │                          FIN (seq=v)    │
      │                                         │
      │  ACK (ack=v+1)                          │
      │────────────────────────────────────────►│
      │◄────────────────────────────────────────│
      │                          ACK (ack=u+1)  │
      │                                         │
```

---

## TCP State Machine

```
                         ┌─────────────┐
                         │   CLOSED    │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │ Connect               │ Listen
                    ▼                       ▼
             ┌──────────┐           ┌──────────────┐
             │SYN_SENT  │           │  LISTEN      │
             └────┬─────┘           └──────┬───────┘
                  │                        │
                  │ SYN-ACK received       │ SYN received
                  │ Send ACK               │ Send SYN-ACK
                  ▼                        ▼
             ┌──────────────────────────────────┐
             │        SYN_RECEIVED              │
             └──────────────────┬───────────────┘
                                │
                                │ ACK received
                                ▼
                         ┌──────────────┐
                    ┌───►│ ESTABLISHED  │◄───┐
                    │    └──────┬───────┘    │
                    │           │            │
                    │    Close  │  Data xfer │
                    │           │            │
                    │           ▼            │
                    │    ┌──────────────┐    │
                    │    │ FIN_WAIT_1   │    │
                    │    └──────┬───────┘    │
                    │           │            │
                    │     ACK   │  FIN       │
                    │           ▼            │
                    │    ┌──────────────┐    │
                    │    │ FIN_WAIT_2   │    │
                    │    └──────┬───────┘    │
                    │           │            │
                    │     FIN   │            │
                    │           ▼            │
                    │    ┌──────────────┐    │
                    │    │  TIME_WAIT   │    │
                    │    │ (2×MSL)      │    │
                    │    └──────┬───────┘    │
                    │           │            │
                    │      Timeout          │
                    │           │            │
                    │           ▼            │
                    │    ┌──────────────┐    │
                    │    │   CLOSED     │    │
                    │    └──────────────┘    │
                    │                        │
                    │    CLOSE_WAIT          │
                    │    ┌──────────────┐    │
                    │    │ CLOSE_WAIT   │    │
                    │    └──────┬───────┘    │
                    │           │            │
                    │     FIN   │            │
                    │           ▼            │
                    │    ┌──────────────┐    │
                    │    │  LAST_ACK    │────┘
                    │    └──────┬───────┘
                    │           │
                    │     ACK   │
                    │           ▼
                    │    ┌──────────────┐
                    │    │   CLOSED     │
                    │    └──────────────┘
```

### State Descriptions

| State | Description |
|-------|-------------|
| CLOSED | No connection exists |
| LISTEN | Waiting for incoming connection |
| SYN_SENT | SYN sent, waiting for SYN-ACK |
| SYN_RECEIVED | SYN-ACK sent, waiting for ACK |
| ESTABLISHED | Connection active, data transfer |
| FIN_WAIT_1 | FIN sent, waiting for ACK |
| FIN_WAIT_2 | ACK received, waiting for FIN |
| TIME_WAIT | Final ACK sent, waiting (2×MSL) |
| CLOSE_WAIT | FIN received, waiting for application |
| LAST_ACK | FIN sent, waiting for final ACK |
| CLOSING | Both sides sent FIN simultaneously |

### TIME_WAIT Significance

- **Duration:** 2×MSL (Maximum Segment Lifetime) — typically 60 seconds
- **Purpose:**
  1. Ensures final ACK reaches remote host
  2. Allows old duplicate segments to expire
  3. Prevents new connection from receiving stale data
- **Problem:** High-connection-rate servers accumulate TIME_WAIT sockets
- **Solutions:** `SO_REUSEADDR`, `SO_REUSEPORT`, tuned `net.ipv4.tcp_tw_reuse`

---

## TCP Flow Control

### Sliding Window Mechanism

```
Sender's View of Window:

  Acknowledged  │  Can Send (Window)  │  Cannot Send
  ─────────────►│◄───────────────────►│◄────────────►
  ██████████████│░░░░░░░░░░░░░░░░░░░░│─────────────
                │                     │
                │                     │
  Last ACK     │  Last Byte Sent     │  Last Byte Can Send
  Received     │                     │
  (una)        │                     │
               │                     │
               ├─────────────────────┤
                    Window Size

  Window = rwnd (receiver window)
  Bytes in flight = SND.UNA to SND.NXT
  Usable window = SND.WND - (SND.NXT - SND.UNA)
```

### Window Updates

```
Sender                              Receiver
  │                                    │
  │──── seq=1, len=1000, win=4000 ───►│
  │                                    │ Buffer: 4000 bytes
  │                                    │
  │◄─── ack=1001, win=3000 ───────────│  Consumed 1000 bytes
  │                                    │ Buffer now: 3000 free
  │                                    │
  │──── seq=1001, len=3000 ──────────►│  Buffer full
  │                                    │
  │◄─── ack=4001, win=0 ──────────────│  Zero window
  │                                    │
  │    [Sender stops, sends probes]    │
  │                                    │
  │──── seq=4001, len=1 (probe) ─────►│
  │                                    │ App reads data
  │◄─── ack=4002, win=2000 ───────────│  Window opens
  │                                    │
```

### Window Size Fields in TCP Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│          Source Port          │       Destination Port            │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                        Sequence Number                           │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                     Acknowledgment Number                        │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ Offset│ Reserved  │N│C│E│U│A│P│R│S│F│        Window Size          │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│         Checksum             │       Urgent Pointer              │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                    Options (variable)                            │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                             Padding                               │
└───────────────────────────────────────────────────────────────────┘

Flags:
  N = Nonce, C = CWR, E = ECN-Echo
  U = URG, A = ACK, P = PSH, R = RST, S = SYN, F = FIN
```

---

## TCP Congestion Control

### Congestion Control Algorithms

```
Cubic Congestion Window (Linux default):

cwnd
 ▲
 │                        ┌─────────
 │                    ┌───┘
 │                ┌───┘
 │            ┌───┘          Cubic function:
 │        ┌───┘              W(t) = C(t-K)³ + Wmax
 │    ┌───┘
 │┌───┘
 ││   K = time to reach Wmax
 ││   C = scaling constant
 ├──────────────────────────────────────────► time
 │
 │   Wmax = window size at last loss event
```

### Congestion Window States

```
                    ┌──────────────┐
                    │   SLOW START │
                    │  cwnd = 1    │
                    │  ssthresh    │
                    └──────┬───────┘
                           │
              cwnd >= ssthresh?
              ┌──────┴──────┐
              │ No          │ Yes
              ▼             ▼
     ┌────────────┐  ┌──────────────┐
     │ cwnd *= 2  │  │CONGESTION    │
     │ (per ACK)  │  │AVOIDANCE     │
     │            │  │cwnd += 1/MSS │
     │ Loss event │  │(per ACK)     │
     │ detected?  │  └──────┬───────┘
     │            │         │
     │            │    Loss detected?
     └─────┬──────┘    ┌───┴────┐
           │           │Yes     │No
           ▼           ▼        │
    ┌─────────────┐   │        │
    │ ssthresh =  │   │        │
    │ cwnd/2      │   │        │
    │ cwnd = 1    │   │        │
    │ (3 dup ACKs │   │        │
    │  → ssthresh)│   │        │
    └─────────────┘   │        │
                      ▼        ▼
                   (Continue congestion avoidance)
```

### TCP Reno vs CUBIC vs BBR

| Algorithm | Behavior | Loss Recovery |
|-----------|----------|---------------|
| Tahoe | Slow start on any loss | 3 dup ACKs → retransmit |
| Reno | Fast recovery on 3 dup ACKs | ssthresh = cwnd/2 |
| NewReno | Improved Reno recovery | Better handling of multiple losses |
| CUBIC | Cubic function for cwnd growth | Default Linux, better for high-BDP |
| BBR | Model-based, measures RTT & BW | Google's algorithm, no loss-based |

---

## UDP Characteristics

### UDP Header Structure

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│          Source Port          │       Destination Port            │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│            Length              │          Checksum                 │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                             Data                                  │
└───────────────────────────────────────────────────────────────────┘

UDP Header Size: 8 bytes (fixed)
TCP Header Size: 20-60 bytes (variable)
```

### TCP vs UDP Comparison

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best-effort |
| Order | Ordered delivery | No ordering |
| Flow Control | Yes (window) | No |
| Congestion Control | Yes | No |
| Header Size | 20-60 bytes | 8 bytes |
| Speed | Slower | Faster |
| Overhead | Higher | Lower |
| Error Checking | Extensive | Basic (checksum) |
| Use Cases | Web, email, file transfer | DNS, video, gaming, VoIP |

### UDP Use Cases

| Application | Protocol | Why UDP |
|-------------|----------|---------|
| DNS | Port 53 | Small queries, fast response |
| DHCP | Port 67/68 | Broadcast, no connection needed |
| NTP | Port 123 | Small packets, time-sensitive |
| VoIP/SIP | Port 5060 | Real-time, tolerate loss |
| Video Streaming | Various | Real-time, tolerate loss |
| Online Gaming | Various | Low latency critical |
| SNMP | Port 161/162 | Small packets, management |

---

## IP Addressing and Subnetting

### IPv4 Address Structure

```
192.168.1.100

Binary:  11000000.10101000.00000001.01100100

Classful:
Class A: 1.0.0.0    - 126.255.255.255   (First bit: 0)
Class B: 128.0.0.0  - 191.255.255.255   (First bits: 10)
Class C: 192.0.0.0  - 223.255.255.255   (First bits: 110)
Class D: 224.0.0.0  - 239.255.255.255   (Multicast)
Class E: 240.0.0.0  - 255.255.255.255   (Reserved)
```

### Private IP Ranges (RFC 1918)

| Range | CIDR | Addresses | Use |
|-------|------|-----------|-----|
| 10.0.0.0 - 10.255.255.255 | /8 | 16,777,216 | Large networks |
| 172.16.0.0 - 172.31.255.255 | /12 | 1,048,576 | Medium networks |
| 192.168.0.0 - 192.168.255.255 | /16 | 65,536 | Small networks |

### Subnetting

```
Network: 192.168.1.0/24

Subnet Mask: 255.255.255.0

Binary: 11111111.11111111.11111111.00000000
        ├──────── 24 bits ────────┤├─ 8 bits ─┤
        │       Network           │   Host    │
        └─────────────────────────┴───────────┘

Subnetting /24 into /26:

Original: 192.168.1.0/24 = 254 hosts

/26 creates 4 subnets, each with 62 hosts:
192.168.1.0/26    (192.168.1.1 - 192.168.1.62)
192.168.1.64/26   (192.168.1.65 - 192.168.1.126)
192.168.1.128/26  (192.168.1.129 - 192.168.1.190)
192.168.1.192/26  (192.168.1.193 - 192.168.1.254)
```

### CIDR Notation Quick Reference

| CIDR | Subnet Mask | Hosts | Block Size |
|------|-------------|-------|------------|
| /8   | 255.0.0.0 | 16,777,214 | 16M |
| /16  | 255.255.0.0 | 65,534 | 64K |
| /24  | 255.255.255.0 | 254 | 256 |
| /25  | 255.255.255.128 | 126 | 128 |
| /26  | 255.255.255.192 | 62 | 64 |
| /27  | 255.255.255.224 | 30 | 32 |
| /28  | 255.255.255.240 | 14 | 16 |
| /29  | 255.255.255.248 | 6 | 8 |
| /30  | 255.255.255.252 | 2 | 4 |
| /31  | 255.255.255.254 | 2 | 2 (P2P) |
| /32  | 255.255.255.255 | 1 | 1 (Host) |

### IPv6 Addressing

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334

Simplification:
- Leading zeros: 2001:db8:85a3:0:0:8a2e:370:7334
- Consecutive zeros: 2001:db8:85a3::8a2e:370:7334

IPv6 Special Addresses:
::1/128         - Loopback
::/0            - Default route
fe80::/10       - Link-local
fc00::/7        - Unique local (private)
ff00::/8        - Multicast
2001:db8::/32   - Documentation (example)
```

### IP Header Structure

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│Version│  IHL  │    DSCP     │ECN│         Total Length            │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│        Identification        │R│DF│MF│     Fragment Offset         │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│    Time to Live  │   Protocol │       Header Checksum             │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                       Source IP Address                          │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                    Destination IP Address                        │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│                    Options (if IHL > 5)                          │
└───────────────────────────────────────────────────────────────────┘

Key Fields:
- TTL: Max hops (decremented at each router, 0 = discard)
- Protocol: 6=TCP, 17=UDP, 1=ICMP
- Fragmentation: MF=More Fragments, DF=Don't Fragment
```

---

## ICMP

### ICMP Message Types

| Type | Code | Name | Purpose |
|------|------|------|---------|
| 0    | 0    | Echo Reply | Response to ping |
| 3    | 0    | Destination Unreachable | Network unreachable |
| 3    | 1    | Destination Unreachable | Host unreachable |
| 3    | 2    | Destination Unreachable | Protocol unreachable |
| 3    | 3    | Destination Unreachable | Port unreachable |
| 3    | 4    | Destination Unreachable | Fragmentation needed |
| 5    | 0    | Redirect | Datagram for better route |
| 8    | 0    | Echo Request | Ping request |
| 11   | 0    | Time Exceeded | TTL expired in transit |
| 11   | 1    | Time Exceeded | Fragment reassembly timeout |
| 12   | 0    | Parameter Problem | Bad IP header |

### ICMP Tools and Uses

```bash
# Ping - connectivity test
ping -c 4 8.8.8.8
ping -s 1472 -M do 8.8.8.8  # MTU discovery

# Traceroute - path discovery
traceroute example.com
traceroute -I example.com  # Use ICMP (default UDP on Linux)

# Path MTU Discovery
ping -M do -s 1472 target
# If too large: Frag needed & DF set (Type 3, Code 4)
```

### ICMP Security Implications

| Attack | Technique |
|--------|-----------|
| Ping Flood | Overwhelm target with echo requests |
| Ping of Death | Malformed ICMP packet > 65535 bytes |
| Smurf Attack | Broadcast ping to network with spoofed source |
| ICMP Redirect | Manipulate routing tables |
| ICMP Tunneling | Encapsulate data in ICMP packets |
| OS Fingerprinting | Analyze ICMP responses to identify OS |

---

## Attacks and Defenses

### TCP Attacks

| Attack | Description | Defense |
|--------|-------------|---------|
| SYN Flood | Overwhelm with half-open connections | SYN cookies, rate limiting |
| RST Attack | Inject RST to kill connections | Sequence number randomization |
| Session Hijacking | Steal TCP session via prediction | Encryption, unpredictable ISN |
| TCP Reset Attack | Force connection termination | IPSec, encrypted tunnels |
| Land Attack | Spoof source as destination | Ingress filtering |
| SYN-ACK Flood | Overwhelm with SYN-ACK packets | SYN proxy |
| Window Manipulation | Manipulate window for DoS | Validate window updates |

### IP Attacks

| Attack | Description | Defense |
|--------|-------------|---------|
| IP Spoofing | Forge source IP address | Ingress/egress filtering (BCP38) |
| IP Fragmentation | Overlap fragments to bypass IDS | Proper reassembly, normalization |
| Smurf Attack | Broadcast amplification DDoS | Disable directed broadcasts |
| Teardrop | Overlapping fragmented packets | OS patching |
| IP Options | Abuse IP header options | Drop packets with unusual options |
| Land Attack | Source IP = destination IP | Ingress filtering |

### Defense Configurations

```bash
# Linux: Enable SYN cookies
echo 1 > /proc/sys/net/ipv4/tcp_syncookies

# Linux: Reduce SYN-ACK retries
echo 2 > /proc/sys/net/ipv4/tcp_synack_retries

# Linux: Enable reverse path filtering
echo 1 > /proc/sys/net/ipv4/conf/all/rp_filter

# Linux: Disable ICMP redirects
echo 0 > /proc/sys/net/ipv4/conf/all/accept_redirects

# Linux: Enable IP forwarding (router)
echo 1 > /proc/sys/net/ipv4/ip_forward

# iptables: Rate limit ICMP
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP
```

---

## Tools and Debugging

### Network Diagnostic Tools

| Tool | Purpose |
|------|---------|
| `netstat` | Connection statistics, listening ports |
| `ss` | Socket statistics (modern replacement) |
| `ip` | IP configuration, routing |
| `tcpdump` | Packet capture |
| `nmap` | Port scanning, OS detection |
| `traceroute` | Path discovery |
| `mtr` | Combined ping + traceroute |
| `iftop` | Bandwidth monitoring |
| `iperf` | Network performance testing |
| `tc` | Traffic control |

### Common Commands

```bash
# View connections and states
ss -tuna
ss -tuna | awk '{print $1}' | sort | uniq -c | sort -rn

# Check routing table
ip route show
ip route get 8.8.8.8

# Monitor TCP retransmissions
netstat -s | grep -i retrans
nstat -az | grep Retrans

# Check network statistics
cat /proc/net/snmp
cat /proc/net/netstat

# Capture specific traffic
tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0'
tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0'
tcpdump -i eth0 'src host 10.0.0.1 and port 80'

# Test TCP connectivity
nc -zv host 80
nc -zvu host 53

# Performance testing
iperf3 -s          # Server
iperf3 -c server   # Client
```

### TCP Debugging Checklist

```bash
# 1. Check if port is listening
ss -tlnp | grep :80

# 2. Check connection states
ss -tan state established | wc -l

# 3. Check for TIME_WAIT accumulation
ss -tan state time-wait | wc -l

# 4. Check for SYN_RECV (potential SYN flood)
ss -tan state syn-recv | wc -l

# 5. Check TCP error counters
cat /proc/net/snmp | grep Tcp:
# RetransSegs, InErrs, OutRsts

# 6. Check interface errors
ip -s link show eth0
# RX/TX errors, drops, overruns

# 7. Check ARP table
arp -n
ip neigh show
```

---

## Interview Questions

### Basic

1. What is the TCP 3-way handshake?
2. What is the difference between TCP and UDP?
3. What is a subnet mask?
4. What does ICMP do?
5. What port does HTTP use? What about DNS?

### Intermediate

6. Explain TCP flow control using sliding window.
7. What is the purpose of TIME_WAIT state?
8. How does TCP congestion control work?
9. What is the difference between a /24 and /25 subnet?
10. What are the differences between TCP Reno and CUBIC?

### Advanced

11. How would you detect a SYN flood attack?
12. Explain the TCP state machine transitions.
13. What is BBR congestion control and why is it different?
14. How does IP fragmentation work and why is it a security risk?
15. Explain how TCP sequence number prediction enables attacks.

---

## Hands-On Labs

### Lab 1: TCP Connection Analysis
```bash
# Capture a complete TCP connection
tcpdump -i eth0 -nn -S port 80 -w tcp_conn.pcap

# Analyze in Wireshark:
# - Follow TCP Stream
# - Analyze → Conversation → TCP tab
# - Statistics → TCP Stream Graphs
```

### Lab 2: Subnetting Practice
```bash
# Calculate subnets
ipcalc 192.168.1.0/24 255.255.255.192
ipcalc 10.0.0.0/8 255.255.0.0

# Verify on Linux
ip addr add 192.168.1.100/26 dev eth0
ip addr show dev eth0
```

### Lab 3: SYN Flood Detection
```bash
# Generate SYN flood (test environment only)
hping3 -S --flood -p 80 target

# Monitor SYN_RECV connections
watch -n 1 'ss -tan state syn-recv | wc -l'

# Enable SYN cookies
sysctl -w net.ipv4.tcp_syncookies=1
```

### Lab 4: ICMP Analysis
```bash
# Capture ICMP traffic
tcpdump -i eth0 icmp -w icmp.pcap

# Analyze ICMP types
tshark -r icmp.pcap -T fields -e icmp.type -e icmp.code
```

### Lab 5: UDP vs TCP Performance
```bash
# TCP performance
iperf3 -c server -t 10

# UDP performance
iperf3 -c server -t 10 -u -b 100M

# Compare results
```

---

## Summary Table

| Feature | TCP | UDP | ICMP |
|---------|-----|-----|------|
| OSI Layer | 4 (Transport) | 4 (Transport) | 3 (Network) |
| Connection | Connection-oriented | Connectionless | Connectionless |
| Reliability | Guaranteed | Best-effort | Best-effort |
| Ordering | Ordered | Unordered | N/A |
| Flow Control | Sliding window | None | None |
| Congestion Control | Yes | No | No |
| Header Size | 20-60 bytes | 8 bytes | 8 bytes |
| Speed | Slower | Faster | N/A |
| Common Ports | 80, 443, 22, 21, 25 | 53, 67, 68, 123, 161 | N/A |
| Use Cases | Web, email, file transfer | DNS, DHCP, VoIP, streaming | Diagnostics, routing |
| Security Risks | SYN flood, hijacking | Amplification, reflection | Flood, tunneling |

---

## Related Topics

- [Network Protocols](Network-Protocols.md)
- [DNS & DHCP](DNS-DHCP.md)
- [Firewalls, IDS & IPS](Firewalls-IDS-IPS.md)
- [Network Analysis](Network-Analysis.md)
