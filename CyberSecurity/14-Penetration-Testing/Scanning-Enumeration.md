# Scanning & Enumeration

## What is it?

Scanning involves actively probing target systems to discover open ports, running services, and potential vulnerabilities. Enumeration goes deeper — extracting specific information like usernames, shares, software versions, and configurations from discovered services. These techniques bridge reconnaissance and exploitation.

## Why Learn It?

Scanning identifies the entry points an attacker could exploit. Without proper scanning and enumeration, a penetration tester misses critical vulnerabilities. Understanding these techniques also enables defenders to harden services, close unnecessary ports, and detect scanning activity.

## You Will Learn

- Port scanning with Nmap (SYN, TCP, UDP scans, script engine)
- Service and version detection techniques
- Vulnerability scanning with Nessus, OpenVAS, Nikto
- Enumeration of SMB, SNMP, LDAP, and HTTP services
- Banner grabbing and service fingerprinting

## Prerequisites

- Reconnaissance

## Related Topics

- Exploitation
- Networking Fundamentals

## Learning Status

- [ ] Theory
- [ ] Flowchart
- [ ] Internal Architecture
- [ ] Hands-on Lab
- [ ] Notes Complete

## Resources

Books:
- "Nmap Network Scanning" by Gordon Lyon
- "Metasploit Penetration Testing Cookbook"

Videos:
- LiveOverflow Nmap series
- NetworkChuck scanning tutorials

Documentation:
- Nmap docs: https://nmap.org/docs.html
- Nessus user guide

RFCs:
- RFC 793 (TCP) and RFC 768 (UDP)

Labs:
- Hack The Box enumeration challenges
- TryHackMe Nmap and Nessus rooms
