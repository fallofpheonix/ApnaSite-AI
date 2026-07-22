# Cloud Models

## What is it?

Cloud computing delivers on-demand resources—compute, storage, networking—over the internet. The three primary service models are IaaS (Infrastructure as a Service), PaaS (Platform as a Service), and SaaS (Software as a Service). Deployment models include public, private, hybrid, and multi-cloud, each with distinct security implications. Understanding cloud models is the bedrock of cloud security; every control you deploy and every policy you write depends on which model you operate in.

## Why Learn It?

Understanding cloud models is foundational to cloud security. Each model shifts the boundary of responsibility between provider and customer. Misunderstanding this shared responsibility model is the most common cause of cloud misconfigurations and breaches. According to the IBM Cost of a Data Breach Report 2024, cloud misconfigurations account for 19% of breaches, costing an average of $4.45 million per incident. Mastering cloud models lets you identify exactly which controls you own and which are delegated.

## You Will Learn

- IaaS, PaaS, SaaS service models and their security boundaries
- Public, private, hybrid, and multi-cloud deployment models
- The shared responsibility model and where your duties begin and end
- Cloud service providers (AWS, Azure, GCP) and their security offerings
- Cloud-native vs legacy migration and associated risks
- Cost and compliance trade-offs across cloud models

## Prerequisites

- Networking fundamentals
- Security Fundamentals

## Related Topics

- Cloud Security Architecture
- Compliance
- Identity Management
- Data Protection

---

## Layer Position Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUD SECURITY LAYER STACK                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER 7 - APPLICATION                                        │  │
│  │  SaaS: Email, CRM, ERP, Collaboration Tools                  │  │
│  │  PaaS: Application runtime, middleware, databases             │  │
│  │  IaaS: User manages OS, apps, data                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER 6 - DATA                                               │  │
│  │  SaaS: Provider manages encryption, backup, lifecycle         │  │
│  │  PaaS: Customer manages data classification, access           │  │
│  │  IaaS: Customer manages ALL data encryption and backup        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER 4/5 - NETWORK / TRANSPORT                              │  │
│  │  SaaS: Provider manages network, CDN, DDoS protection        │  │
│  │  PaaS: Provider manages network; customer configures VPC      │  │
│  │  IaaS: Customer manages VPC, subnets, firewalls, routing      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER 3 - OS / VIRTUALIZATION                                │  │
│  │  SaaS: Fully managed by provider                              │  │
│  │  PaaS: Fully managed by provider                              │  │
│  │  IaaS: Customer manages OS, patches, hardening                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER 1/2 - PHYSICAL / VIRTUALIZATION HOST                   │  │
│  │  SaaS: Provider manages all hardware                          │  │
│  │  PaaS: Provider manages all hardware                          │  │
│  │  IaaS: Provider manages all hardware                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ▲ Customer Responsibility Increases Going UP                       │
│  ▼ Provider Responsibility Increases Going DOWN                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Service Models

### 1.1 IaaS (Infrastructure as a Service)

IaaS provides virtualized computing resources over the internet. The customer manages everything from the OS up.

```
┌─────────────────────────────────────────────────────────┐
│                    IaaS MODEL                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  YOUR RESPONSIBILITY                             │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  Applications                              │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Data                                      │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Runtime                                   │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Middleware                                 │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Operating System                          │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PROVIDER RESPONSIBILITY                        │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  Virtualization                            │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Servers                                   │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Storage                                   │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Networking                                │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Examples: EC2, Azure VMs, GCP Compute Engine            │
│  Security: VPC, NSGs, OS hardening, IAM, patching       │
└─────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Maximum control over infrastructure
- Customer responsible for OS patching, firewall rules, IAM
- Elastic scaling of compute resources
- Pay-per-use pricing model

**Security Implications:**
- Full responsibility for OS hardening and vulnerability management
- Must configure network security (VPC, subnets, NACLs, security groups)
- Data encryption at rest and in transit is customer's duty
- Logging and monitoring configuration required

**AWS Example:**
```bash
# Launch an EC2 instance with security best practices
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name my-key-pair \
  --security-group-ids sg-0123456789abcdef0 \
  --subnet-id subnet-0123456789abcdef0 \
  --iam-instance-profile Name=EC2SSMRole \
  --metadata-options "HttpTokens=required,HttpEndpoint=enabled" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"Encrypted":true,"KmsKeyId":"alias/aws/ebs"}}]'
```

### 1.2 PaaS (Platform as a Service)

PaaS provides a managed platform where the provider handles OS, runtime, and middleware.

```
┌─────────────────────────────────────────────────────────┐
│                    PaaS MODEL                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  YOUR RESPONSIBILITY                             │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  Applications                              │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Data                                      │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Configuration / Environment Variables     │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PROVIDER RESPONSIBILITY                        │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  Runtime                                   │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Middleware                                 │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Operating System                          │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Virtualization                            │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Servers / Storage / Networking            │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Examples: Heroku, Azure App Service, GCP App Engine     │
│  Security: App config, secrets mgmt, data protection    │
└─────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Provider manages OS, runtime, middleware, and database engine
- Developer focuses on application code and data
- Built-in scaling, load balancing, and high availability
- Abstracts infrastructure complexity

**Security Implications:**
- Must secure application-level configurations and secrets
- Data classification and encryption remain customer responsibilities
- Dependency injection and supply chain risks in packages
- Logging limited to application-level events

**Azure Example:**
```bash
# Deploy to Azure App Service with security features
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name mySecureApp \
  --runtime "DOTNETCORE|8.0" \
  --https-only true \
  --min-tls-version 1.2 \
  --enable-managed-identity
```

### 1.3 SaaS (Software as a Service)

SaaS delivers fully managed applications over the internet. The provider handles everything.

```
┌─────────────────────────────────────────────────────────┐
│                    SaaS MODEL                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  YOUR RESPONSIBILITY                             │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  Data Classification & Access Control      │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  User Provisioning & MFA                   │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Security Configurations (SSO, DLP)        │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Compliance Posture                        │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PROVIDER RESPONSIBILITY                        │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  Application                               │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Data Storage & Encryption                 │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Networking                                │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  OS / Middleware / Runtime                  │  │    │
│  │  ├───────────────────────────────────────────┤  │    │
│  │  │  Physical Infrastructure                   │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Examples: Microsoft 365, Salesforce, Google Workspace   │
│  Security: SSO, DLP policies, audit logs, admin controls │
└─────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Fully managed application delivered via browser or API
- Multi-tenant architecture shared across customers
- Provider handles patching, updates, and infrastructure
- Customer manages identity, access, and data policies

**Security Implications:**
- Must configure SSO, MFA, and conditional access policies
- Data residency and sovereignty must be verified
- Third-party integrations introduce API and OAuth risks
- Audit log retention and export critical for incident response

**GCP Example:**
```bash
# Configure Google Workspace DLP settings
gcloud workspace dlp inspect \
  --custom-info-types='{"name":"PHONE_NUMBER","regex":"\\d{3}-\\d{3}-\\d{4}"}' \
  --inspect-config='{"minLikelihood":"LIKELY"}'
```

---

## 2. Deployment Models

### 2.1 Public Cloud

```
┌───────────────────────────────────────────────────────────────┐
│                      PUBLIC CLOUD                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   Organization A        Organization B        Organization C   │
│   ┌──────────┐          ┌──────────┐          ┌──────────┐    │
│   │ VPC A    │          │ VPC B    │          │ VPC C    │    │
│   │ 10.0/16  │          │ 10.1/16  │          │ 10.2/16  │    │
│   └────┬─────┘          └────┬─────┘          └────┬─────┘    │
│        │                     │                     │          │
│   ┌────▼─────────────────────▼─────────────────────▼────┐     │
│   │              SHARED PHYSICAL INFRASTRUCTURE          │     │
│   │  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │     │
│   │  │ Compute │  │ Storage  │  │ Networking        │  │     │
│   │  └─────────┘  └──────────┘  └───────────────────┘  │     │
│   │  ┌─────────────────────────────────────────────┐   │     │
│   │  │  Hypervisor / Physical Security              │   │     │
│   │  └─────────────────────────────────────────────┘   │     │
│   └─────────────────────────────────────────────────────┘     │
│                                                               │
│   Advantages: Cost-effective, scalable, no hardware mgmt      │
│   Risks: Multi-tenant isolation, shared responsibility        │
│   Providers: AWS, Azure, GCP, Oracle Cloud                    │
└───────────────────────────────────────────────────────────────┘
```

**Security Considerations:**
- Data co-residency with other tenants (hypervisor isolation)
- Provider controls physical security and hypervisor patching
- Customer must enforce logical isolation via VPCs and IAM
- Compliance may require specific data residency regions

### 2.2 Private Cloud

```
┌───────────────────────────────────────────────────────────────┐
│                     PRIVATE CLOUD                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │            SINGLE ORGANIZATION                        │   │
│   │                                                       │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│   │   │ Compute  │  │ Storage  │  │ Networking       │  │   │
│   │   │ (VMs)    │  │ (SAN/NAS)│  │ (Private VLANs)  │  │   │
│   │   └──────────┘  └──────────┘  └──────────────────┘  │   │
│   │                                                       │   │
│   │   ┌───────────────────────────────────────────────┐  │   │
│   │   │  Hypervisor: VMware vSphere / KVM / Hyper-V   │  │   │
│   │   └───────────────────────────────────────────────┘  │   │
│   │                                                       │   │
│   │   ┌───────────────────────────────────────────────┐  │   │
│   │   │  Orchestration: OpenStack / vSphere / Azure   │  │   │
│   │   │  Stack HCI / Nutanix                          │  │   │
│   │   └───────────────────────────────────────────────┘  │   │
│   │                                                       │   │
│   │   Physical Location: On-premises or hosted           │   │
│   └───────────────────────────────────────────────────────┘   │
│                                                               │
│   Advantages: Full control, compliance, data sovereignty      │
│   Risks: High cost, limited scalability, staffing required    │
│   Examples: VMware vCloud, OpenStack, Azure Stack HCI         │
└───────────────────────────────────────────────────────────────┘
```

**Security Considerations:**
- Full control over physical and logical security
- Customer responsible for all layers including hardware
- Custom security policies and controls possible
- Higher operational overhead but stronger compliance posture

### 2.3 Hybrid Cloud

```
┌───────────────────────────────────────────────────────────────────────┐
│                         HYBRID CLOUD                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────┐          ┌─────────────────────────────┐    │
│   │   ON-PREMISES        │          │    PUBLIC CLOUD              │    │
│   │   PRIVATE CLOUD      │◄────────►│    (AWS / Azure / GCP)       │    │
│   │                      │  VPN /   │                              │    │
│   │  ┌────────────────┐  │  Direct  │  ┌──────────────────────┐  │    │
│   │  │ Sensitive Data  │  │  Connect │  │ Burst Workloads      │  │    │
│   │  │ (PII, PHI)     │  │          │  │ Dev/Test Environments │  │    │
│   │  └────────────────┘  │          │  └──────────────────────┘  │    │
│   │                      │          │                              │    │
│   │  ┌────────────────┐  │          │  ┌──────────────────────┐  │    │
│   │  │ Core Banking /  │  │          │  │ Disaster Recovery     │  │    │
│   │  │ Legacy Systems  │  │          │  │ Archive Storage       │  │    │
│   │  └────────────────┘  │          │  └──────────────────────┘  │    │
│   │                      │          │                              │    │
│   │  ┌────────────────┐  │          │  ┌──────────────────────┐  │    │
│   │  │ Compliance      │  │          │  │ Analytics / ML        │  │    │
│   │  │ Regulated Data  │  │          │  │ Non-sensitive Workloads│  │    │
│   │  └────────────────┘  │          │  └──────────────────────┘  │    │
│   └─────────────────────┘          └─────────────────────────────┘    │
│                                                                       │
│   Connectors: VPN, AWS Direct Connect, Azure ExpressRoute,           │
│               GCP Cloud Interconnect                                  │
│   Challenges: Consistent security policies, identity federation,     │
│               network segmentation, data flow control                 │
└───────────────────────────────────────────────────────────────────────┘
```

**Security Considerations:**
- Identity federation across on-prem and cloud (AD sync, OIDC)
- Consistent encryption policies and key management
- Network segmentation must be maintained across environments
- Single pane of glass for logging and monitoring
- Data classification determines placement (sensitive → on-prem)

### 2.4 Multi-Cloud

```
┌───────────────────────────────────────────────────────────────────────┐
│                        MULTI-CLOUD                                     │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│   │     AWS       │    │    Azure      │    │       GCP            │   │
│   │              │    │              │    │                      │   │
│   │  ┌────────┐  │    │  ┌────────┐  │    │  ┌────────────────┐  │   │
│   │  │Compute │  │    │  │Compute │  │    │  │Compute         │  │   │
│   │  │(EC2)   │  │    │  │(VMs)   │  │    │  │(GCE)           │  │   │
│   │  └────────┘  │    │  └────────┘  │    │  └────────────────┘  │   │
│   │  ┌────────┐  │    │  ┌────────┐  │    │  ┌────────────────┐  │   │
│   │  │Storage │  │    │  │Storage │  │    │  │Storage         │  │   │
│   │  │(S3)    │  │    │  │(Blob)  │  │    │  │(GCS)           │  │   │
│   │  └────────┘  │    │  └────────┘  │    │  └────────────────┘  │   │
│   └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘   │
│          │                   │                       │               │
│   ┌──────▼───────────────────▼───────────────────────▼───────────┐   │
│   │           UNIFIED MANAGEMENT LAYER                            │   │
│   │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐   │   │
│   │  │ Terraform /  │ │ CloudBolt /  │ │ SSO / IAM          │   │   │
│   │  │ Pulumi       │ │ Morpheus     │ │ Federation         │   │   │
│   │  └──────────────┘ └──────────────┘ └────────────────────┘   │   │
│   │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐   │   │
│   │  │ SIEM         │ │ CSPM         │ │ Cost Management    │   │   │
│   │  │ (Splunk/ELK) │ │ (Prisma Cloud│ │ (CloudHealth)      │   │   │
│   │  └──────────────┘ └──────────────┘ └────────────────────┘   │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Advantages: Avoid vendor lock-in, best-of-breed services           │
│   Risks: Complexity, inconsistent security, cost overruns            │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Shared Responsibility Model

The shared responsibility model defines which security controls the cloud provider manages and which the customer must implement.

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SHARED RESPONSIBILITY MODEL                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CONTROL        │   IaaS          │   PaaS          │   SaaS           │
│  ───────────────┼─────────────────┼─────────────────┼────────────────── │
│  Data           │   CUSTOMER      │   CUSTOMER      │   CUSTOMER       │
│  Applications   │   CUSTOMER      │   CUSTOMER      │   PROVIDER       │
│  Runtime        │   CUSTOMER      │   PROVIDER      │   PROVIDER       │
│  Middleware     │   CUSTOMER      │   PROVIDER      │   PROVIDER       │
│  OS             │   CUSTOMER      │   PROVIDER      │   PROVIDER       │
│  Virtualization │   PROVIDER      │   PROVIDER      │   PROVIDER       │
│  Servers        │   PROVIDER      │   PROVIDER      │   PROVIDER       │
│  Storage        │   PROVIDER      │   PROVIDER      │   PROVIDER       │
│  Networking     │   PROVIDER      │   PROVIDER      │   PROVIDER       │
│  Facilities     │   PROVIDER      │   PROVIDER      │   PROVIDER       │
│  ───────────────┼─────────────────┼─────────────────┼────────────────── │
│                                                                         │
│  ▲ CUSTOMER RESPONSIBILITY INCREASES ──────────────────────►            │
│  ◄────────────────────── PROVIDER RESPONSIBILITY INCREASES ▲            │
│                                                                         │
│  KEY: Always Customer Responsibility                                    │
│    - Data classification and governance                                  │
│    - Identity and access management                                      │
│    - Client-side encryption and network traffic protection               │
│    - Server-side encryption (file system / data)                         │
│    - Network traffic protection (on-prem / cloud)                        │
│    - Application security (code review, OWASP)                          │
│    - OS patches and configuration                                        │
│    - Network and firewall configuration                                  │
│    - Client OS / Browsers                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### AWS Shared Responsibility Model

```
┌─────────────────────────────────────────────────────────────────┐
│                 AWS SHARED RESPONSIBILITY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CUSTOMER RESPONSIBILITIES ("Security IN the Cloud"):           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Customer data                                         │   │
│  │  • Platform, applications, IAM                           │   │
│  │  • Operating system, network, and firewall configuration │   │
│  │  • Client-side data encryption and integrity checking    │   │
│  │  • Server-side encryption (S3, EBS, RDS)                │   │
│  │  • Network traffic encryption (SSL/TLS)                  │   │
│  │  • Software and OS patch management                      │   │
│  │  • Security group and NACL configuration                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  AWS RESPONSIBILITIES ("Security OF the Cloud"):                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Software (compute, storage, database, networking)    │   │
│  │  • Hardware / AWS global infrastructure                  │   │
│  │  • Regions, Availability Zones, Edge Locations           │   │
│  │  • Physical security of data centers                     │   │
│  │  • Hypervisor / host OS virtualization layer            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Tools: AWS Config, Security Hub, CloudTrail, GuardDuty        │
└─────────────────────────────────────────────────────────────────┘
```

### Azure Shared Responsibility Model

```
┌─────────────────────────────────────────────────────────────────┐
│                AZURE SHARED RESPONSIBILITY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CUSTOMER RESPONSIBILITIES:                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Data classification and accountability               │   │
│  │  • Azure AD tenant administration                        │   │
│  │  • Access control (RBAC, Conditional Access)            │   │
│  │  • OS patch management (VMs)                             │   │
│  │  • Network configuration (NSGs, Azure Firewall)         │   │
│  │  • Application-level security                            │   │
│  │  • Encryption key management (BYOK options)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  AZURE RESPONSIBILITIES:                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Physical infrastructure (data centers)               │   │
│  │  • Host OS, virtualization layer                        │   │
│  │  • Network equipment                                     │   │
│  │  • Physical security                                     │   │
│  │  • Compliance certifications (SOC, ISO, FedRAMP)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Tools: Azure Security Center, Sentinel, Defender for Cloud     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Cloud Service Providers

### 4.1 AWS (Amazon Web Services)

**Key Security Services:**
| Service | Purpose |
|---------|---------|
| IAM | Identity and access management |
| Security Hub | Centralized security findings |
| GuardDuty | Threat detection |
| CloudTrail | API audit logging |
| Config | Configuration compliance |
| WAF | Web application firewall |
| Shield | DDoS protection |
| KMS | Key management |
| Secrets Manager | Secret rotation |
| Macie | Data classification |
| Inspector | Vulnerability assessment |
| Detective | Security investigation |

### 4.2 Microsoft Azure

**Key Security Services:**
| Service | Purpose |
|---------|---------|
| Azure AD / Entra ID | Identity and access management |
| Defender for Cloud | Cloud security posture management |
| Sentinel | SIEM and SOAR |
| Key Vault | Key and secret management |
| Azure Policy | Governance and compliance |
| Azure Firewall | Network security |
| DDoS Protection | DDoS mitigation |
| Information Protection | Data classification and labeling |
| Sentinel | Threat intelligence and hunting |

### 4.3 Google Cloud Platform (GCP)

**Key Security Services:**
| Service | Purpose |
|---------|---------|
| Cloud IAM | Identity and access management |
| Security Command Center | Security findings dashboard |
| Cloud Armor | DDoS protection and WAF |
| Cloud KMS | Key management |
| VPC Service Controls | Perimeter security |
| Cloud DLP | Data loss prevention |
| Chronicle | SIEM and threat detection |
| Binary Authorization | Container deployment security |
| Eventarc | Audit logging |

---

## 5. Cloud-Native vs Legacy

### 5.1 Cloud-Native Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    CLOUD-NATIVE ARCHITECTURE                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    CONTAINER ORCHESTRATION                    │  │
│  │                    (Kubernetes / ECS / EKS)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │Container │  │Container │  │Container │  │Container │   │  │
│  │  │  (App)   │  │  (App)   │  │  (DB)    │  │ (Cache)  │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    MICROSERVICES                              │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐              │  │
│  │  │ Auth       │ │ Payment    │ │ Notification│              │  │
│  │  │ Service    │ │ Service    │ │ Service     │              │  │
│  │  └────────────┘ └────────────┘ └────────────┘              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  INFRASTRUCTURE AS CODE         │ CI/CD PIPELINES          │  │
│  │  (Terraform / CloudFormation)   │ (GitHub Actions /        │  │
│  │                                 │  GitLab CI / ArgoCD)     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  API GATEWAY          │ SERVICE MESH         │ OBSERVABILITY│  │
│  │  (Kong / AWS API GW)  │ (Istio / Linkerd)   │ (Prometheus, │  │
│  │                       │                      │  Grafana,    │  │
│  │                       │                      │  Jaeger)     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Benefits: Elasticity, resilience, faster deployment,            │
│            infrastructure as code, immutable infrastructure       │
│  Security: Container scanning, runtime protection,               │
│            secrets in vaults, zero-trust networking               │
└───────────────────────────────────────────────────────────────────┘
```

### 5.2 Lift-and-Shift (Legacy Migration)

```
┌───────────────────────────────────────────────────────────────────┐
│                 LIFT-AND-SHIFT MIGRATION                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BEFORE (On-Premises):          AFTER (Cloud):                    │
│  ┌───────────────────┐          ┌───────────────────┐            │
│  │ Physical Server   │  ─────►  │ EC2 Instance      │            │
│  │ - Windows 2016    │  Copy    │ - Windows 2016    │            │
│  │ - IIS + .NET      │  ─────►  │ - IIS + .NET      │            │
│  │ - SQL Server      │          │ - SQL Server      │            │
│  │ - Custom Firewall │          │ - Security Groups  │            │
│  └───────────────────┘          └───────────────────┘            │
│                                                                   │
│  RISKS:                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  • OS vulnerabilities moved to cloud without remediation    │  │
│  │  • Legacy configurations and credentials preserved          │  │
│  │  • No cloud-native security controls applied                │  │
│  │  • License compliance issues                                │  │
│  │  • Suboptimal performance and cost                          │  │
│  │  • No immutable infrastructure or auto-scaling              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  MITIGATION:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  1. Patch all OS and applications before migration          │  │
│  │  2. Replace hardcoded credentials with IAM roles            │  │
│  │  3. Enable cloud-native logging and monitoring              │  │
│  │  4. Implement cloud security groups and NACLs              │  │
│  │  5. Plan re-architecture to cloud-native patterns          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### 5.3 Comparison Table

| Aspect | Cloud-Native | Lift-and-Shift |
|--------|-------------|----------------|
| **Architecture** | Microservices, containers | Monolithic |
| **Scaling** | Auto-scaling, elastic | Manual or limited |
| **Security** | Cloud-native controls | Legacy controls |
| **Cost** | Pay-per-use, optimized | Over-provisioned |
| **Deployment** | CI/CD, immutable | Manual, mutable |
| **Recovery** | Automated failover | Manual restore |
| **Compliance** | Built-in controls | Retrofitted controls |
| **Complexity** | Higher (many services) | Lower (same stack) |

---

## 6. Security Perspective

### 6.1 Threat Landscape by Model

```
┌─────────────────────────────────────────────────────────────────────┐
│              CLOUD SECURITY THREAT MATRIX                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  IaaS Threats:                   PaaS Threats:                      │
│  ┌─────────────────────────┐    ┌─────────────────────────┐       │
│  │ • OS vulnerabilities    │    │ • Dependency injection   │       │
│  │ • Misconfigured SGs    │    │ • Insecure deserialization│       │
│  │ • Unpatched systems    │    │ • Secret exposure        │       │
│  │ • Lateral movement     │    │ • API abuse              │       │
│  │ • Root access exploits │    │ • Supply chain attacks   │       │
│  │ • Metadata service SSRF│    │ • Runtime manipulation   │       │
│  └─────────────────────────┘    └─────────────────────────┘       │
│                                                                     │
│  SaaS Threats:                   Deployment Threats:                │
│  ┌─────────────────────────┐    ┌─────────────────────────┐       │
│  │ • Account takeover      │    │ • Insecure Terraform    │       │
│  │ • OAuth token theft     │    │ • Hardcoded secrets in  │       │
│  │ • Data exfiltration    │    │   CloudFormation        │       │
│  │ • Shadow IT            │    │ • Misconfigured IAM     │       │
│  │ • Insider threats      │    │ • Unencrypted storage   │       │
│  │ • API key exposure     │    │ • Public S3 buckets     │       │
│  └─────────────────────────┘    └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Attack Techniques (Cloud-Specific)

**Instance Metadata Service (IMDS) Attack:**
```bash
# SSRF attack to steal IAM credentials via IMDSv1
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/MyEC2Role

# Defense: Require IMDSv2 (HTTP token required)
aws ec2 modify-instance-metadata-options \
  --instance-id i-1234567890abcdef0 \
  --http-tokens required \
  --http-endpoint enabled
```

**Public S3 Bucket Exposure:**
```bash
# Attack: Enumerate and download from public buckets
aws s3 ls s3://target-bucket/ --no-sign-request
aws s3 cp s3://target-bucket/sensitive-data.csv . --no-sign-request

# Defense: Block public access and enable encryption
aws s3api put-public-access-block \
  --bucket my-bucket \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,\
    BlockPublicPolicy=true,RestrictPublicBuckets=true
```

**Overly Permissive IAM Role:**
```json
// DANGEROUS: Admin access to everything
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// SECURE: Least privilege
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject"
  ],
  "Resource": "arn:aws:s3:::my-bucket/*",
  "Condition": {
    "Bool": {
      "aws:SecureTransport": "true"
    }
  }
}
```

---

## 7. Defense Mechanisms

### 7.1 Security Controls by Layer

```
┌─────────────────────────────────────────────────────────────────────┐
│                DEFENSE-IN-DEPTH CLOUD CONTROLS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LAYER 1: PHYSICAL (Provider)                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • Biometric access, mantraps, CCTV                        │   │
│  │  • Environmental controls, fire suppression                 │   │
│  │  • Redundant power, network, cooling                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 2: NETWORK                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • VPC with private subnets                                 │   │
│  │  • Security Groups (stateful) + NACLs (stateless)          │   │
│  │  • VPN / Direct Connect / ExpressRoute                     │   │
│  │  • DDoS protection (Shield / Azure DDoS / Cloud Armor)    │   │
│  │  • WAF for application layer filtering                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 3: IDENTITY                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • IAM with least privilege                                 │   │
│  │  • MFA on all privileged accounts                           │   │
│  │  • SSO / Federation (SAML / OIDC)                          │   │
│  │  • Conditional access policies                              │   │
│  │  • Privileged Access Management (PAM)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 4: APPLICATION                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • Input validation, output encoding                        │   │
│  │  • API authentication (OAuth 2.0, API keys)                │   │
│  │  • Container image scanning                                 │   │
│  │  • Runtime Application Self-Protection (RASP)              │   │
│  │  • Code review and SAST/DAST                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 5: DATA                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • Encryption at rest (AES-256)                             │   │
│  │  • Encryption in transit (TLS 1.2+)                         │   │
│  │  • Key management (KMS / HSM)                               │   │
│  │  • Data classification and DLP                              │   │
│  │  • Backup and disaster recovery                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 6: MONITORING & RESPONSE                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • CloudTrail / Activity Log / Audit Log                    │   │
│  │  • GuardDuty / Sentinel / Chronicle                         │   │
│  │  • SIEM integration (Splunk, ELK, Sentinel)               │   │
│  │  • Automated incident response (Lambda / Functions)        │   │
│  │  • Forensics and evidence preservation                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Cloud Security Posture Management (CSPM)

```bash
# AWS Security Hub - Enable and run checks
aws securityhub enable-security-hub
aws securityhub batch-import-findings --findings file://findings.json

# Azure Defender for Cloud
az security task list --resource-group myResourceGroup --query "[?properties.severity=='High']"

# GCP Security Command Center
gcloud scc sources list --organization=123456789
```

---

## 8. Practical Examples

### 8.1 Secure VPC Setup (AWS)

```bash
# Create VPC with no default VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications \
  'ResourceType=vpc,Tags=[{Key=Name,Value=SecureVPC}]'

# Create private subnets only (no public subnets)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a --tag-specifications \
  'ResourceType=subnet,Tags=[{Key=Name,Value=Private-1a}]'

# Enable VPC Flow Logs
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-xxx \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /vpc/flowlogs \
  --deliver-logs-permission-arn arn:aws:iam::xxx:role/VPCFlowLogsRole
```

### 8.2 Kubernetes Security (EKS)

```yaml
# Pod Security Standards - Restricted
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
# Network Policy - Zero Trust
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
# Security Context
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: myapp:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

---

## 9. Interview Questions

### Fundamental
1. What is the difference between IaaS, PaaS, and SaaS? Give examples of each.
2. Explain the AWS shared responsibility model. Who is responsible for what?
3. What are the key differences between public, private, and hybrid cloud?
4. Why is cloud-native different from lift-and-shift in terms of security?

### Intermediate
5. How does the shared responsibility model change when moving from IaaS to SaaS?
6. What are the security implications of running legacy applications on cloud IaaS?
7. How do you secure a hybrid cloud environment with consistent policies?
8. What is multi-cloud and what unique security challenges does it introduce?

### Advanced
9. Design a secure hybrid cloud architecture for a healthcare organization.
10. How would you implement identity federation across AWS, Azure, and on-premises AD?
11. Evaluate the trade-offs between cloud-native security tools vs third-party CSPM solutions.
12. How does container orchestration (Kubernetes) change the shared responsibility model?

---

## 10. Hands-on Labs

### Lab 1: Deploy and Secure an EC2 Instance
```bash
# 1. Create a security group with minimal rules
aws ec2 create-security-group \
  --group-name secure-web-sg \
  --description "Allow HTTPS only" \
  --vpc-id vpc-xxx

# 2. Add only HTTPS ingress
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# 3. Launch instance with IMDSv2 and encrypted EBS
aws ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.micro \
  --security-group-ids sg-xxx \
  --metadata-options "HttpTokens=required" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"Encrypted":true}}]'
```

### Lab 2: Enable AWS Config Rules
```bash
# Enable Config
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::xxx:role/ConfigRole

# Add compliance rules
aws configservice put-config-rule --config-rule file://encrypted-volumes.json
aws configservice put-config-rule --config-rule file://public-s3-bucket.json
```

### Lab 3: Audit S3 Bucket Security
```bash
# List all buckets and check public access
aws s3api list-buckets --query 'Buckets[*].Name'

# Check public access block for each bucket
for bucket in $(aws s3api list-buckets --query 'Buckets[*].Name' --output text); do
  echo "=== $bucket ==="
  aws s3api get-public-access-block --bucket $bucket 2>/dev/null || echo "No public access block"
done
```

---

## Summary Table

| Aspect | IaaS | PaaS | SaaS | Public | Private | Hybrid |
|--------|------|------|------|--------|---------|--------|
| **Data Control** | Full | Partial | Minimal | Shared | Full | Full |
| **OS Management** | Customer | Provider | Provider | Varies | Customer | Mixed |
| **Network Control** | Full | Limited | Minimal | Logical | Full | Full |
| **Physical Security** | Provider | Provider | Provider | Provider | Customer | Mixed |
| **Scalability** | High | High | High | Elastic | Limited | Moderate |
| **Compliance Burden** | High | Medium | Low | Shared | Full | High |
| **Cost Model** | OpEx | OpEx | OpEx/SaaS | Pay-use | CapEx+OpEx | Mixed |
| **Security Overhead** | High | Medium | Low | Medium | High | High |

---

## References

- AWS Shared Responsibility Model: https://aws.amazon.com/compliance/shared-responsibility-model/
- Azure Shared Responsibility: https://learn.microsoft.com/en-us/azure/shared-responsibility-model/
- GCP Shared Responsibility: https://cloud.google.com/docs/shared-responsibility-model
- NIST SP 800-145: Cloud Computing Definition
- CSA Cloud Controls Matrix (CCM): https://cloudsecurityalliance.org/research/cloud-controls-matrix/
- CIS Benchmarks for AWS/Azure/GCP: https://www.cisecurity.org/cis-benchmarks
