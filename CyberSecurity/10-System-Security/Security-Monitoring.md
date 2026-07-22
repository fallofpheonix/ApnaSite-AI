# Security Monitoring

## What is it?

Security monitoring is the continuous collection, analysis, and alerting of security-related events across systems and networks. It uses log aggregation, SIEM platforms, and baseline comparisons to detect anomalies, policy violations, and potential incidents in real time.

## Why Learn It?

You cannot protect what you cannot see. Security monitoring provides visibility into system behavior, enabling early detection of breaches and ongoing threat hunting. It is the backbone of any operational security program and feeds directly into incident response.

## You Will Learn

- Log collection and normalization techniques
- SIEM architecture and query fundamentals
- Alert tuning and threshold configuration
- Baseline establishment and anomaly detection
- Integration with threat intelligence feeds

## Prerequisites

- System Hardening

## Related Topics

- Incident Response
- Network Traffic Analysis

---

## Layer Position in Defense Architecture

```
+---------------------------------------------------------------------+
|                        DEFENSE-IN-DEPTH                             |
+---------------------------------------------------------------------+
|                                                                     |
|  +---------------+    +---------------+    +---------------+        |
|  |  Physical      |    |  Perimeter     |    |  Network       |       |
|  |  Security      |    |  Security      |    |  Security      |       |
|  +-------+-------+    +-------+-------+    +-------+-------+        |
|          |                     |                     |                |
|          v                     v                     v                |
|  +-------------------------------------------------------------+    |
|  |            >>>>  SECURITY MONITORING  <<<<                   |    |
|  |         (Logs -> SIEM -> Alerts -> Response)                 |    |
|  |              OBSERVABILITY ACROSS ALL LAYERS                 |    |
|  +------------------------------+------------------------------+    |
|                                 |                                   |
|          v                      v                      v            |
|  +---------------+  +---------------+  +---------------+           |
|  |  Endpoint      |  |  Application   |  |  Incident      |          |
|  |  Security      |  |  Security      |  |  Response      |          |
|  +---------------+  +---------------+  +---------------+           |
|                                                                     |
+---------------------------------------------------------------------+
```

Security monitoring provides **cross-cutting visibility** — it observes events at every layer and correlates them to detect threats that individual layers might miss.

---

## 1. Log Collection

### 1.1 Log Sources and Categories

```
+------------------------------------------------------------------+
|                    SECURITY LOG SOURCES                           |
+------------------------------------------------------------------+
|                                                                  |
|  SYSTEM LOGS                                                     |
|  |-- syslog / journald (Linux)                                  |
|  |-- Windows Event Logs (Security, System, Application)         |
|  |-- /var/log/auth.log (authentication events)                  |
|  |-- /var/log/secure (RHEL/CentOS auth)                        |
|  +-- /var/log/syslog (system messages)                          |
|                                                                  |
|  NETWORK LOGS                                                    |
|  |-- Firewall logs (iptables, pf, Windows Firewall)            |
|  |-- IDS/IPS alerts (Snort, Suricata)                          |
|  |-- DNS query logs                                              |
|  |-- NetFlow / IPFIX data                                       |
|  |-- Proxy logs (Squid, Zscaler)                               |
|  +-- VPN connection logs                                        |
|                                                                  |
|  APPLICATION LOGS                                                |
|  |-- Web server logs (Apache, Nginx)                           |
|  |-- Database audit logs                                         |
|  |-- Email server logs (Postfix, Exchange)                      |
|  |-- Application-specific logs (Jenkins, WordPress)            |
|  +-- API access logs                                            |
|                                                                  |
|  SECURITY TOOL LOGS                                              |
|  |-- Antivirus / EDR alerts                                     |
|  |-- Vulnerability scanner results                              |
|  |-- Patch management logs                                      |
|  |-- DLP incidents                                               |
|  +-- Authentication system logs (LDAP, RADIUS)                  |
|                                                                  |
|  CLOUD LOGS                                                      |
|  |-- AWS CloudTrail                                              |
|  |-- Azure Activity Log                                         |
|  |-- GCP Audit Logs                                              |
|  |-- S3 access logs                                              |
|  +-- Container orchestration logs (Kubernetes)                  |
|                                                                  |
+------------------------------------------------------------------+
```

### 1.2 Log Collection Architecture

```
+------------------------------------------------------------------+
|                  LOG COLLECTION ARCHITECTURE                      |
+------------------------------------------------------------------+
|                                                                  |
|  +----------+ +----------+ +----------+ +----------+           |
|  | Servers  | |Firewalls | | Network  | | Cloud    |           |
|  |          | |          | | Devices  | | Services |           |
|  +----+-----+ +----+-----+ +----+-----+ +----+-----+           |
|       |            |            |            |                   |
|       v            v            v            v                   |
|  +----------------------------------------------------------+  |
|  |                    LOG COLLECTORS                          |  |
|  |  +----------+  +----------+  +----------+               |  |
|  |  | Filebeat |  | Rsyslog  |  | Fluentd  |               |  |
|  |  | (Agent)  |  | (Syslog) |  | (Unified)|               |  |
|  |  +----------+  +----------+  +----------+               |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  +----------------------------------------------------------+  |
|  |                 MESSAGE BROKER                           |  |
|  |              Apache Kafka / Redis                        |  |
|  |         (Buffering, Decoupling, Reliability)            |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|              +---------------+---------------+                  |
|              v               v               v                  |
|  +--------------+  +--------------+  +--------------+           |
|  | Elasticsearch|  |  Log Storage  |  |  Long-term   |          |
|  | (Indexing)   |  |  (Hot/Warm)  |  |  Archive     |          |
|  +--------------+  +--------------+  +--------------+           |
|                                                                  |
+------------------------------------------------------------------+
```

### 1.3 Log Format Standards

```
SYSLOG FORMAT (RFC 5424):
<PRIO>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG

Example:
<34>1 2024-01-15T10:30:00.000Z webserver nginx 1234 - - - User login failed from 192.168.1.100

CEF FORMAT (Common Event Format):
CEF:Version|Device Vendor|Device Product|Device Version|Device Event Class ID|Name|Severity|Extension

Example:
CEF:0|Security|Wazuh|3.7|5716|Authentication Failure|8|src=10.0.1.100 dst=10.0.1.1 user=admin

JSON FORMAT (Modern):
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "WARN",
  "source": "auth",
  "message": "Failed login attempt",
  "src_ip": "192.168.1.100",
  "user": "admin",
  "event_type": "authentication_failure"
}
```

### 1.4 Log Collection Configuration

```yaml
# Filebeat configuration (filebeat.yml)
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/auth.log
      - /var/log/syslog
      - /var/log/apache2/access.log

  - type: log
    enabled: true
    paths:
      - /var/log/audit/audit.log
    fields:
      log_type: audit

# Output to Elasticsearch
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  protocol: "http"
  index: "security-logs-%{+yyyy.MM.dd}"

# Processors
processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
  - decode_json_fields:
      fields: ["message"]
      target: "json"
```

```yaml
# Rsyslog configuration (/etc/rsyslog.d/security.conf)
# Remote syslog forwarding
$ActionForwardDefaultTemplate RSYSLOG_SyslogProtocol23Format
*.* @@logserver:514;RSYSLOG_SyslogProtocol23Format

# Local buffering
$WorkDirectory /var/spool/rsyslog
$ActionQueueFileName security_queue
$ActionQueueMaxDiskSpace 1g
$ActionQueueSaveOnShutdown on
$ActionQueueType LinkedList
```

---

## 2. SIEM (Security Information and Event Management)

### 2.1 SIEM Architecture

```
+------------------------------------------------------------------+
|                      SIEM ARCHITECTURE                            |
+------------------------------------------------------------------+
|                                                                  |
|  DATA COLLECTION LAYER                                           |
|  +----------------------------------------------------------+  |
|  | Agents, Syslog, API Connectors, API Polling              |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  DATA PROCESSING LAYER                                          |
|  +----------------------------------------------------------+  |
|  | Parsing -> Normalization -> Enrichment -> Correlation     |  |
|  |                                                          |  |
|  | - Parse: Extract fields from raw logs                    |  |
|  | - Normalize: Map to common schema (CEF/LEEF/ECS)        |  |
|  | - Enrich: Add GeoIP, threat intel, user info            |  |
|  | - Correlate: Cross-reference events across sources       |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  STORAGE LAYER                                                  |
|  +----------------------------------------------------------+  |
|  | Hot: Elasticsearch / Splunk (7-30 days)                  |  |
|  | Warm: Compressed index (30-90 days)                      |  |
|  | Cold: S3/GCS archive (90-365 days)                       |  |
|  | Frozen: Glacier/Tape (compliance, years)                 |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  ANALYSIS & RESPONSE LAYER                                      |
|  +----------------------------------------------------------+  |
|  | Dashboard | Alerting | Threat Hunting | Investigation     |  |
|  | Reporting | SOAR Integration | API Access                 |  |
|  +----------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 2.2 ELK Stack as SIEM

```
+------------------------------------------------------------------+
|                    ELK STACK ARCHITECTURE                         |
+------------------------------------------------------------------+
|                                                                  |
|  +----------+    +---------------+    +----------------+        |
|  | Filebeat  |--->| Logstash      |--->| Elasticsearch  |        |
|  | (Agent)   |    | (Processing)  |    | (Storage)      |        |
|  +----------+    +---------------+    +-------+--------+        |
|                                              |                   |
|                                              v                   |
|                                     +----------------+           |
|                                     |    Kibana       |           |
|                                     | (Visualization) |           |
|                                     +----------------+           |
|                                                                  |
|  COMPONENTS:                                                    |
|  - Filebeat: Lightweight log shipper (replaces Logstash forward)|
|  - Logstash: Data processing pipeline (parse, transform)       |
|  - Elasticsearch: Distributed search and analytics engine       |
|  - Kibana: Web interface for visualization and dashboards       |
|                                                                  |
+------------------------------------------------------------------+
```

### 2.3 Splunk SIEM

```
+------------------------------------------------------------------+
|                    SPLUNK ARCHITECTURE                            |
+------------------------------------------------------------------+
|                                                                  |
|  +----------+    +---------------+    +----------------+        |
|  | Universal |--->| Indexers       |--->| Search Heads    |        |
|  | Forwarder  |    | (Storage)     |    | (Query)         |        |
|  +----------+    +---------------+    +-------+--------+        |
|                                              |                   |
|  +----------+    +---------------+    +------+--------+         |
|  | Heavy     |--->| Deployment    |--->| License Master|         |
|  | Forwarder  |    | Server        |    |               |         |
|  +----------+    +---------------+    +----------------+        |
|                                                                  |
|  SPL QUERY EXAMPLES:                                            |
|  index=security sourcetype=auth action=failure                  |
|  | stats count by src_ip, user                                  |
|  | where count > 10                                             |
|                                                                  |
+------------------------------------------------------------------+
```

### 2.4 Wazuh SIEM (Open-Source)

```xml
<!-- Wazuh manager configuration for SIEM -->
<ossec_config>
  <!-- Log analysis rules -->
  <rule id="100100" level="10">
    <if_sid>18101</if_sid>
    <field name="win.eventdata.commandLine" type="pcre2">(?i)(invoke-expression|iex)</field>
    <description>Suspicious PowerShell execution</description>
  </rule>

  <!-- Compliance monitoring -->
  <policy>
    <policy>
      <profile>pci_dss</profile>
      <profile>hipaa</profile>
      <profile>gdpr</profile>
    </policy>
  </policy>

  <!-- Integration with Elasticsearch -->
  <integration>
    <name>elastic</name>
    <host>elasticsearch</host>
    <port>9200</port>
    <protocol>http</protocol>
  </integration>
</ossec_config>
```

### 2.5 SIEM Query Examples

```
SPLUNK SPL:

# Find brute force attempts
index=security sourcetype=auth action=failure
| stats count by src_ip, user
| where count > 5
| sort -count

# Detect lateral movement (RDP from unusual source)
index=security sourcetype=wineventlog EventCode=4624 Logon_Type=10
| stats dc(src_ip) as source_count by user
| where source_count > 3

# Failed logins after hours
index=security sourcetype=auth action=failure
| eval hour=strftime(_time, "%H")
| where hour < 6 OR hour > 20
| stats count by src_ip, user

ELASTICSEARCH KQL:

# Authentication failures
event.code:4625 AND source.ip:*

# Suspicious process creation
event.code:1 AND win.eventdata.Image:*powershell.exe AND win.eventdata.CommandLine:*download*

# Firewall blocks
event.action:blocked AND source.port:443
```

---

## 3. Alerting Rules

### 3.1 Alert Rule Framework

```
+------------------------------------------------------------------+
|                    ALERTING FRAMEWORK                             |
+------------------------------------------------------------------+
|                                                                  |
|  RULE DEFINITION                                                |
|  +----------------------------------------------------------+  |
|  | Condition: What to detect                                |  |
|  | Threshold: When to trigger (count, rate, anomaly)        |  |
|  | Severity: Critical, High, Medium, Low, Informational     |  |
|  | Scope: Which assets/users to monitor                     |  |
|  | Time window: Detection period                            |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  ALERT GENERATION                                               |
|  +----------------------------------------------------------+  |
|  | - Deduplication (avoid alert fatigue)                    |  |
|  | - Correlation (combine related events)                   |  |
|  | - Enrichment (add context: geo, user info)               |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  NOTIFICATION                                                   |
|  +----------------------------------------------------------+  |
|  | - Email to SOC team                                      |  |
|  | - Slack/Teams webhook                                    |  |
|  | - PagerDuty (P1/P2)                                      |  |
|  | - SIEM dashboard                                         |  |
|  | - SOAR playbook trigger                                  |  |
|  +----------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.2 Alert Rule Examples (Wazuh/ELK)

```xml
<!-- Wazuh detection rules -->

<!-- Rule: Brute force authentication -->
<group name="authentication,">
  <rule id="100200" level="10" frequency="5" timeframe="300">
    <if_sid>18101</if_sid>
    <description>Brute force: 5 failed logins in 5 minutes</description>
    <group>authentication_failure,brute_force</group>
  </rule>

  <!-- Rule: Root login via SSH -->
  <rule id="100201" level="10">
    <if_sid>18110</if_sid>
    <match>Accepted publickey for root</match>
    <description>Root SSH login detected</description>
  </rule>

  <!-- Rule: New user created -->
  <rule id="100202" level="8">
    <if_sid>18105</if_sid>
    <match>new user</match>
    <description>New user account created</description>
  </rule>
</group>
```

```json
// Elasticsearch alerting rule (Elastic Security)
{
  "rule": {
    "name": "Brute Force Detection",
    "type": "threshold",
    "query": "event.code:4625 AND source.ip:*",
    "threshold": {
      "field": "source.ip",
      "value": 10,
      "cardinality": {
        "field": "user.name",
        "value": 3
      }
    },
    "severity": "high",
    "risk_score": 75,
    "action": ["notify-slack", "create-ticket"],
    "schedule": {
      "interval": "5m"
    }
  }
}
```

### 3.3 Sigma Rules (Vendor-Agnostic Detection)

```yaml
# sigma-rule-example.yml
title: Suspicious PowerShell Download Cradle
id: 12345678-1234-1234-1234-123456789012
status: experimental
description: Detects PowerShell commands that download and execute content
references:
  - https://attack.mitre.org/techniques/T1059/001/
author: Security Team
date: 2024/01/15
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
    CommandLine|contains:
      - 'DownloadString'
      - 'DownloadFile'
      - 'Invoke-WebRequest'
      - 'Net.WebClient'
      - 'Start-BitsTransfer'
  condition: selection
level: high
falsepositives:
  - Legitimate software updates
  - IT automation scripts
```

---

## 4. Baseline Monitoring

### 4.1 Establishing Security Baselines

```
+------------------------------------------------------------------+
|                    BASELINE MONITORING                             |
+------------------------------------------------------------------+
|                                                                  |
|  NETWORK BASELINE                                               |
|  +----------------------------------------------------------+  |
|  | - Normal traffic volume per hour/day                     |  |
|  | - Typical protocol distribution                          |  |
|  | - Expected connection patterns                           |  |
|  | - DNS query frequency and destinations                   |  |
|  | - Bandwidth utilization by subnet                        |  |
|  +----------------------------------------------------------+  |
|                                                                  |
|  HOST BASELINE                                                  |
|  +----------------------------------------------------------+  |
|  | - Normal process list and count                          |  |
|  | - Expected CPU/memory/disk usage                        |  |
|  | - Typical login hours and patterns                       |  |
|  | - Normal service states                                 |  |
|  | - Expected file modification rates                       |  |
|  +----------------------------------------------------------+  |
|                                                                  |
|  USER BASELINE                                                  |
|  +----------------------------------------------------------+  |
|  | - Normal working hours per user                          |  |
|  | - Typical application usage                              |  |
|  | - Expected data access patterns                          |  |
|  | - Normal authentication locations                        |  |
|  | - Typical file transfer volumes                          |  |
|  +----------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 4.2 Anomaly Detection Methods

```
BASELINE COMPARISON:

Normal Baseline: 100 logins/hour -> Anomaly: 500 logins/hour
                  (Statistical deviation detected)

STATISTICAL METHODS:
1. Standard Deviation: Alert if > 3 sigma from mean
2. Moving Average: Compare current to rolling 30-day average
3. Percentile: Alert if above 99th percentile
4. Z-Score: (X - Mean) / Standard Deviation

MACHINE LEARNING METHODS:
1. Isolation Forest: Detect outliers in multi-dimensional data
2. Autoencoders: Learn normal patterns, flag reconstruction errors
3. LSTM Networks: Time-series anomaly detection
4. Clustering: Group similar behaviors, flag deviations

THRESHOLD METHODS:
1. Static: Fixed threshold (e.g., > 100 failed logins)
2. Dynamic: Adaptive threshold based on historical patterns
3. Composite: Multiple conditions must be true
```

### 4.3 Baseline Monitoring Implementation

```bash
#!/bin/bash
# baseline-monitor.sh - Simple baseline monitoring

# Baseline values (learned over 30 days)
BASELINE_LOGIN_HOUR=50
BASELINE_FAILED_LOGINS=5
BASELINE_NEW_CONNECTIONS=200

# Current metrics
CURRENT_LOGIN=$(grep "Accepted" /var/log/auth.log | \
  awk -v d="$(date +%Y-%m-%d_%H)" '$0 ~ d' | wc -l)
CURRENT_FAILED=$(grep "Failed" /var/log/auth.log | \
  awk -v d="$(date +%Y-%m-%d_%H)" '$0 ~ d' | wc -l)

# Calculate deviation
LOGIN_DEVIATION=$(echo "scale=2; ($CURRENT_LOGIN - $BASELINE_LOGIN_HOUR) / $BASELINE_LOGIN_HOUR * 100" | bc)

# Alert if threshold exceeded
if (( $(echo "$LOGIN_DEVIATION > 50" | bc -l) )); then
    echo "[ALERT] Login activity 50% above baseline"
    # Send to SIEM/SOC
fi

if [ "$CURRENT_FAILED" -gt $((BASELINE_FAILED_LOGINS * 3)) ]; then
    echo "[ALERT] Failed logins 3x above baseline"
fi
```

---

## 5. Network Monitoring

### 5.1 Network Monitoring Architecture

```
+------------------------------------------------------------------+
|                  NETWORK MONITORING ARCHITECTURE                  |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+                                           |
|  | TAP / SPAN Port  |                                           |
|  | (Copy traffic)   |                                           |
|  +--------+---------+                                           |
|           |                                                      |
|           v                                                      |
|  +------------------+     +------------------+                  |
|  | Network Probe    |     | Flow Collector   |                  |
|  | (Zeek/Suricata) |     | (NetFlow/sFlow)  |                  |
|  +--------+---------+     +--------+---------+                  |
|           |                      |                               |
|           v                      v                               |
|  +------------------+     +------------------+                  |
|  | Protocol Analysis|     | Traffic Analysis |                  |
|  | (Deep Packet     |     | (Volume, patterns│                  |
|  |  Inspection)     |     |  anomalies)      |                  |
|  +--------+---------+     +--------+---------+                  |
|           |                      |                               |
|           +----------+-----------+                               |
|                      |                                          |
|                      v                                          |
|             +------------------+                                |
|             |   SIEM / NDR    |                                |
|             | (Correlation +   |                                |
|             |  Alerting)       |                                |
|             +------------------+                                |
|                                                                  |
+------------------------------------------------------------------+
```

### 5.2 Network Monitoring Tools

| Tool | Type | Key Features | Use Case |
|------|------|-------------|----------|
| Zeek (Bro) | Network analysis | Protocol analysis, logging | Deep traffic inspection |
| Suricata | IDS/IPS | Signature + anomaly detection | Threat detection |
| Wireshark | Packet capture | Deep packet analysis | Forensic investigation |
| ntopng | Flow analysis | Traffic visualization | Bandwidth monitoring |
| ELK + Packetbeat | Full stack | Integrated with SIEM | Enterprise monitoring |

### 5.3 Suricata Configuration

```yaml
# /etc/suricata/suricata.yaml
# Network monitoring configuration

- interface: eth0
  # Enable inline mode for IPS
  mode: tap

# Detection rules
default-log-dir: /var/log/suricata/

outputs:
  - fast:
      enabled: yes
      filename: fast.log
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

# Rule files
rule-files:
  - suricata.rules
  - /etc/suricata/rules/emerging-all.rules

# Classification
classification-file: /etc/suricata/classification.config
reference-config-file: /etc/suricata/reference.config
```

### 5.4 Zeek Network Monitoring

```bash
# Install Zeek
sudo apt install zeek

# Configure network interface
echo "NETIF=eth0" >> /etc/zeek/node.cfg

# Start Zeek
sudo zeekctl deploy

# Analyze captured logs
cat /var/log/zeek/conn.log    # Connection logs
cat /var/log/zeek/http.log    # HTTP activity
cat /var/log/zeek/dns.log     # DNS queries
cat /var/log/zeek/ssl.log     # TLS connections

# Zeek script for detecting DNS tunneling
# local.zeek
event dns_reply(c: connection, query: string, ans: string, reply_type: count, TTL: count) {
    if (|query| > 50) {
        print fmt("Long DNS query from %s: %s", c$id$orig_h, query);
    }
}
```

---

## 6. User Behavior Analytics (UBA)

### 6.1 UBA Architecture

```
+------------------------------------------------------------------+
|                 USER BEHAVIOR ANALYTICS                           |
+------------------------------------------------------------------+
|                                                                  |
|  DATA SOURCES                                                   |
|  +----------------------------------------------------------+  |
|  | - Authentication logs (AD, LDAP, RADIUS)                 |  |
|  | - VPN connection logs                                     |  |
|  | - Application access logs                                 |  |
|  | - Email activity                                          |  |
|  | - File access and modification                            |  |
|  | - Database queries                                        |  |
|  | - Endpoint telemetry (process, network)                   |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  BEHAVIORAL PROFILING                                          |
|  +----------------------------------------------------------+  |
|  | - Login time patterns per user                            |  |
|  | - Data access volume and frequency                        |  |
|  | - Application usage patterns                              |  |
|  | - Network connection patterns                             |  |
|  | - Geolocation of access                                   |  |
|  | - Device and browser fingerprints                         |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  ANOMALY DETECTION                                             |
|  +----------------------------------------------------------+  |
|  | - Deviation from individual baseline                      |  |
|  | - Peer group comparison                                   |  |
|  | - Temporal anomalies (after-hours access)                 |  |
|  | - Volume anomalies (bulk data transfer)                   |  |
|  | - Geographic anomalies (impossible travel)               |  |
|  +---------------------------+------------------------------+  |
|                              |                                  |
|                              v                                  |
|  RISK SCORING                                                  |
|  +----------------------------------------------------------+  |
|  | - Per-user risk score (0-100)                            |  |
|  | - Risk trend analysis                                     |  |
|  | - Automated response (lock account, alert)               |  |
|  | - Integration with SIEM/SOAR                             |  |
|  +----------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.2 UBA Detection Scenarios

```
HIGH-RISK USER BEHAVIOR SCENARIOS:

1. IMPOSSIBLE TRAVEL
   User logs in from New York at 9:00 AM, then London at 9:30 AM
   Detection: Geolocation + time analysis
   Risk Score: 90/100

2. AFTER-HOURS DATA ACCESS
   User accesses sensitive database at 3:00 AM (never before)
   Detection: Temporal anomaly + baseline comparison
   Risk Score: 75/100

3. BULK DATA DOWNLOAD
   User downloads 5GB of files (normal: 50MB/day)
   Detection: Volume anomaly
   Risk Score: 85/100

4. UNUSUAL APPLICATION ACCESS
   HR employee accesses source code repository
   Detection: Peer group comparison
   Risk Score: 60/100

5. PRIVILEGE ESCALATION
   Normal user attempts admin actions
   Detection: Permission deviation
   Risk Score: 80/100
```

### 6.3 UBA Implementation with ELK

```json
// Elasticsearch UBA query - Detect after-hours access
GET security-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "event.type": "authentication" } },
        { "term": { "event.outcome": "success" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ],
      "must_not": [
        { "range": { "event.hour": { "gte": 8, "lte": 18 } } }
      ]
    }
  },
  "aggs": {
    "users": {
      "terms": { "field": "user.name", "size": 20 },
      "aggs": {
        "avg_risk": { "avg": { "field": "user.risk_score" } }
      }
    }
  }
}
```

---

## 7. Security Perspective

### 7.1 Monitoring Evasion Techniques

```
ATTACKER TECHNIQUES TO EVADE MONITORING:

1. LOG CLEARING
   Attackers delete logs to cover tracks
   Defense: Centralized logging, log integrity monitoring

2. TIMESTAMP MANIPULATION
   Timestomping to avoid time-based correlation
   Defense: NTP sync, immutable timestamps, centralized logging

3. ENCRYPTION
   Encrypt C2 traffic to evade DPI
   Defense: TLS inspection, behavioral analysis

4. LOW-AND-SLOW
   Activity spread over time to avoid thresholds
   Defense: Long-window correlation, baseline comparison

5. INSIDER THREAT
   Authorized user with malicious intent
   Defense: UBA, least privilege, DLP

6. LIVING OFF THE LAND
   Use legitimate tools (PowerShell, WMI)
   Defense: Process command-line logging, behavioral analysis

7. DNS TUNNELING
   Exfiltrate data via DNS queries
   Defense: DNS monitoring, query length analysis
```

### 7.2 Detection Coverage Map

| Attack Technique | Log Source | Detection Method | Tool |
|-----------------|-----------|-----------------|------|
| Brute Force | Auth logs | Threshold alerting | Wazuh, Splunk |
| Lateral Movement | Windows Event 4624/4625 | Correlation rules | ELK, Sentinel |
| Data Exfiltration | Proxy/DNS logs | Volume anomaly | UBA, DLP |
| Malware C&C | Network flows | DNS analysis | Suricata, Zeek |
| Privilege Escalation | Auth logs | UBA baseline | Splunk UBA |
| Persistence | Sysmon/EDR | File integrity | Wazuh, Tripwire |
| Credential Theft | LSASS access | Process monitoring | Sysmon, CrowdStrike |

---

## 8. Practical Examples

### 8.1 Complete ELK SIEM Stack Deployment

```yaml
# docker-compose.yml for ELK SIEM
version: '3.7'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ES_JAVA_OPTS=-Xms2g -Xmx2g
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/log:/var/log:ro
    depends_on:
      - logstash

volumes:
  es_data:
```

### 8.2 Wazuh Centralized Monitoring Setup

```bash
# On Wazuh server
# Install Wazuh manager
curl -sO https://packages.wazuh.com/4.7/wazuh-manager_4.7.0-1_amd64.deb
sudo dpkg -i ./wazuh-manager_4.7.0-1_amd64.deb

# Install Filebeat
curl -sO https://packages.wazuh.com/4.7/filebeat_7.17.16-1_amd64.deb
sudo dpkg -i ./filebeat_7.17.16-1_amd64.deb

# Configure Filebeat for Wazuh
sudo cp /etc/filebeat/filebeat.yml /etc/filebeat/filebeat.yml.bak
sudo cat > /etc/filebeat/filebeat.yml << 'EOF'
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/ossec/logs/alerts/alerts.json

output.elasticsearch:
  hosts: ["http://localhost:9200"]
  index: "wazuh-alerts-4.x-%{+yyyy.MM.dd}"
EOF

# Start services
sudo systemctl start wazuh-manager
sudo systemctl start filebeat
```

---

## 9. Interview Questions

### Basic

1. **What is SIEM and what does it do?**
   - Collects, normalizes, correlates, and alerts on security events from across the environment

2. **Name three types of log sources for security monitoring.**
   - System logs, network logs, application logs, authentication logs, firewall logs

3. **What is log normalization?**
   - Converting different log formats into a common schema for analysis and correlation

4. **Why is centralized logging important?**
   - Prevents log tampering, enables correlation, simplifies analysis, supports compliance

5. **What is the difference between IDS and IPS?**
   - IDS detects and alerts; IPS detects and blocks

### Intermediate

6. **How do you reduce alert fatigue in a SIEM?**
   - Tune thresholds, correlate related events, deduplicate, prioritize by severity, use SOAR for automation

7. **Explain the difference between signature-based and anomaly-based detection.**
   - Signature: matches known patterns (fast, low FP); Anomaly: deviations from baseline (detects unknown threats, higher FP)

8. **How does User Behavior Analytics (UBA) detect insider threats?**
   - Establishes per-user baselines, detects deviations (unusual hours, data access, locations)

9. **What is the ELK stack and how does it function as a SIEM?**
   - Elasticsearch (storage), Logstash (processing), Kibana (visualization); with Filebeat for collection

10. **How do you handle log storage and retention for compliance?**
    - Tiered storage (hot/warm/cold), retention policies (PCI: 1yr, HIPAA: 6yr), encrypted archives

### Advanced

11. **Design a SIEM architecture for a 50,000-employee enterprise.**
    - Distributed collectors, Kafka buffer, Elasticsearch cluster, dedicated correlation engines, SOAR integration, dedicated SOC dashboards

12. **How do you detect advanced persistent threats (APTs) with monitoring?**
    - Long-term correlation, threat hunting, UBA, network traffic analysis, threat intelligence integration

13. **Explain Sigma rules and their role in detection engineering.**
    - Vendor-agnostic detection rule format; converts to Splunk/ELK/QRadar queries; community-driven

14. **How do you handle encrypted traffic monitoring without breaking privacy?**
    - Metadata analysis, JA3 fingerprinting, TLS inspection (with consent), behavioral analysis on flow data

15. **What is the future of security monitoring beyond SIEM?**
    - XDR (extended detection), SOAR automation, AI/ML-driven detection, cloud-native security platforms

---

## 10. Hands-on Labs

### Lab 1: Deploy ELK Stack for Security Monitoring

```bash
# Deploy with Docker
git clone https://github.com/elastic/examples
cd examples/logging-metrics

# Configure Filebeat
cat > filebeat.yml << 'EOF'
filebeat.inputs:
  - type: log
    paths: ["/var/log/auth.log"]
output.elasticsearch:
  hosts: ["http://localhost:9200"]
EOF

# Start stack
docker-compose up -d

# Access Kibana
open http://localhost:5601
```

### Lab 2: Wazuh Alert Rule Creation

```bash
# Add custom detection rule
cat >> /var/ossec/etc/rules/local_rules.xml << 'EOF'
<group name="custom,">
  <rule id="100300" level="10">
    <if_sid>18101</if_sid>
    <field name="win.eventdata.commandLine" type="pcre2">(?i)(mimikatz|sekurlsa)</field>
    <description>Credential dumping tool detected</description>
    <group>credential_access,attack</group>
  </rule>
</group>
EOF

# Restart Wazuh manager
systemctl restart wazuh-manager
```

### Lab 3: Network Baseline with Zeek

```bash
# Capture network baseline
sudo zeek -i eth0 -w capture.pcap duration 3600

# Analyze connections
cat conn.log | zeek-cut id.orig_h id.resp_p service duration | sort | uniq -c | sort -rn | head 20

# Create Zeek script for anomaly detection
cat > dns-anomaly.zeek << 'EOF'
event dns_reply(c: connection, query: string, ans: string, reply_type: count, TTL: count) {
    if (|query| > 50) {
        print fmt("Long DNS query: %s -> %s", c$id$orig_h, query);
    }
}
EOF
```

---

## 11. Summary Table

| Topic | Key Concept | Primary Tools | Risk If Ignored |
|-------|------------|---------------|-----------------|
| Log Collection | Gather events from all sources | Filebeat, Rsyslog, Fluentd | Blind spots |
| SIEM | Correlate and alert on events | ELK, Splunk, Wazuh, Sentinel | Undetected breaches |
| Alerting Rules | Detect specific threats | Sigma, Wazuh rules, Elastic | Missed attacks |
| Baseline Monitoring | Know what is normal | Statistical analysis, ML | Cannot detect anomalies |
| Network Monitoring | Visibility into traffic | Zeek, Suricata, Wireshark | Lateral movement undetected |
| UBA | Detect insider threats | ML-based profiling | Insider attacks missed |
| Log Retention | Compliance and forensics | Tiered storage, archives | Legal penalties |

---

## Resources

**Books:**
- *Security Operations Center* - Syngress
- *Network Security Monitoring* - Richard Bejtlich
- *The Log Analysis Handbook* - CRC Press

**Documentation:**
- Elastic SIEM: https://www.elastic.co/security
- Wazuh: https://documentation.wazuh.com/
- Splunk Security: https://www.splunk.com/en_us/software/splunk-security.html
- Sigma Rules: https://github.com/SigmaHQ/sigma

**Tools:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Wazuh (open-source SIEM)
- Splunk Enterprise Security
- Zeek (network analysis)
- Suricata (IDS/IPS)
- Sigma (detection rules)

**Labs:**
- TryHackMe SOC Level 1/2 paths
- Blue Team Labs Online (BTLO)
- CyberDefenders
- SANS Cyber Ranges
