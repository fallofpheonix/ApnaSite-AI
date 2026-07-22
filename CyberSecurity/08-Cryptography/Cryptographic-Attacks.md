# Cryptographic Attacks

## Layer Position in Security Model

```
┌───────────────────────────────────────────────────────┐
│                APPLICATION LAYER                       │
│        (Implementation Flaws, Protocol Attacks)       │
├───────────────────────────────────────────────────────┤
│           ► CRYPTOGRAPHIC ATTACKS ◄                   │
│  ┌───────────────────────────────────────────────┐    │
│  │  Brute Force │ Side-Channel │ Padding Oracle  │    │
│  │  Downgrade   │ Math Attacks │ Quantum Threats │    │
│  └───────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────┤
│           PROTOCOL LAYER                              │
│        (TLS, IPsec, SSH Vulnerabilities)             │
├───────────────────────────────────────────────────────┤
│           ALGORITHM LAYER                             │
│        (Mathematical Weaknesses)                     │
├───────────────────────────────────────────────────────┤
│           IMPLEMENTATION LAYER                        │
│        (Side Channels, Timing, Power Analysis)       │
└───────────────────────────────────────────────────────┘
```

## Overview

Cryptographic attacks exploit weaknesses in algorithms, implementations, or protocols. Understanding these attacks is essential for designing secure systems.

```
┌──────────────────────────────────────────────────────┐
│            ATTACK CLASSIFICATION                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Based on Attacker Capability:                       │
│  ├─ Ciphertext Only: Only has encrypted data         │
│  ├─ Known Plaintext: Has some (P, C) pairs          │
│  ├─ Chosen Plaintext: Can encrypt arbitrary data     │
│  ├─ Chosen Ciphertext: Can decrypt arbitrary data    │
│  └─ Related Key: Access to encryptions under related │
│                                                      │
│  Based on Attack Target:                             │
│  ├─ Mathematical: Exploit algorithm weakness         │
│  ├─ Implementation: Exploit code/hardware flaws      │
│  ├─ Protocol: Exploit design vulnerabilities         │
│  └─ Social: Exploit human factors                    │
│                                                      │
│  Based on Attack Method:                             │
│  ├─ Brute Force: Exhaustive search                   │
│  ├─ Cryptanalysis: Mathematical analysis             │
│  ├─ Side-Channel: Physical measurements              │
│  └─ Fault Injection: Induce errors                   │
└──────────────────────────────────────────────────────┘
```

---

## Brute Force Attacks

### Types of Brute Force

```
┌──────────────────────────────────────────────────────┐
│              BRUTE FORCE ATTACKS                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Pure Brute Force:                                │
│  ┌────────────────────────────────────────────┐      │
│  │  Try ALL possible keys                      │      │
│  │  Key space: 2^n keys                        │      │
│  │  Average: 2^(n-1) attempts                  │      │
│  │                                            │      │
│  │  Time to exhaustion (1 billion keys/sec):  │      │
│  │  ├─ 32-bit: ~2 seconds                     │      │
│  │  ├─ 56-bit (DES): ~9 hours                 │      │
│  │  ├─ 128-bit: ~10^22 years                  │      │
│  │  └─ 256-bit: ~10^50 years                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Dictionary Attack:                               │
│  ┌────────────────────────────────────────────┐      │
│  │  Use common passwords/words                │      │
│  │  Wordlist: rockyou.txt (14 million entries) │      │
│  │  Much faster than pure brute force         │      │
│  │  Effective against weak passwords           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. Rainbow Table Attack:                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Pre-computed hash lookups                  │      │
│  │  Time-memory tradeoff                       │      │
│  │  Defeated by: salt                          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Credential Stuffing:                             │
│  ┌────────────────────────────────────────────┐      │
│  │  Use leaked username/password combos        │      │
│  │  Automated attacks on multiple sites        │      │
│  │  Success rate: 0.5-2%                       │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  5. GPU/ASIC Brute Force:                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Hardware acceleration                     │      │
│  │  GPU: 10-100 billion hashes/sec            │      │
│  │  ASIC: 100+ billion hashes/sec             │      │
│  │  Defeated by: memory-hard functions        │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Countermeasures:                                    │
│  ├─ Sufficient key length (128+ bits)               │
│  ├─ Account lockout after N attempts                │
│  ├─ Rate limiting                                    │
│  ├─ CAPTCHA                                          │
│  ├─ Multi-factor authentication                      │
│  └─ Strong password policies                         │
└──────────────────────────────────────────────────────┘
```

### Brute Force Time Estimates

| Key Size | Keys/sec | Time | Status |
|----------|----------|------|--------|
| 32-bit | 10⁹ | 2 seconds | ❌ Trivial |
| 40-bit | 10⁹ | 18 minutes | ❌ Trivial |
| 56-bit | 10⁹ | 9 hours | ❌ Feasible |
| 64-bit | 10⁹ | 97 days | ⚠️ Borderline |
| 80-bit | 10⁹ | 38,550 years | ✅ Secure |
| 128-bit | 10⁹ | 10²² years | ✅ Secure |
| 256-bit | 10⁹ | 10⁵⁰ years | ✅ Secure |

---

## Side-Channel Attacks

### Types of Side-Channel Attacks

```
┌──────────────────────────────────────────────────────┐
│              SIDE-CHANNEL ATTACKS                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Timing Attacks:                                  │
│  ┌────────────────────────────────────────────┐      │
│  │  Measure execution time of operations      │      │
│  │                                            │      │
│  │  Example: RSA with square-and-multiply     │      │
│  │  ├─ Bit 1: multiply + square               │      │
│  │  └─ Bit 0: square only                     │      │
│  │                                            │      │
│  │  If multiplication is slower:              │      │
│  │  Longer time → bit is 1                    │      │
│  │  Shorter time → bit is 0                   │      │
│  │                                            │      │
│  │  Countermeasure: Constant-time operations  │      │
│  │  Use Montgomery multiplication             │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Power Analysis:                                  │
│  ┌────────────────────────────────────────────┐      │
│  │  Simple Power Analysis (SPA):              │      │
│  │  ├─ Measure power consumption              │      │
│  │  ├─ Different operations = different power │      │
│  │  └─ Directly observe algorithm execution   │      │
│  │                                            │      │
│  │  Differential Power Analysis (DPA):        │      │
│  │  ├─ Statistical analysis of power traces   │      │
│  │  ├─ Correlate power with data/key          │      │
│  │  └─ Recover key bits with ~1000 traces     │      │
│  │                                            │      │
│  │  Countermeasure:                           │      │
│  │  ├─ Constant-time implementations          │      │
│  │  ├─ Power noise generation                 │      │
│  │  ├─ Dual-rail logic                        │      │
│  │  └─ Shielding                              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. Electromagnetic (EM) Analysis:                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Similar to power analysis                 │      │
│  │  Measures EM radiation from chip           │      │
│  │  Can target specific regions of die        │      │
│  │  More precise than power analysis          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Cache-Timing Attacks:                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Exploit CPU cache behavior                │      │
│  │                                            │      │
│  │  Flush+Reload:                             │      │
│  │  ├─ Flush cache line (shared memory)       │      │
│  │  ├─ Wait for victim access                 │      │
│  │  ├─ Reload and measure time                │      │
│  │  └─ Fast reload = accessed by victim       │      │
│  │                                            │      │
│  │  Prime+Probe:                              │      │
│  │  ├─ Fill cache with attacker data          │      │
│  │  ├─ Wait for victim                        │      │
│  │  ├─ Probe cache, measure time              │      │
│  │  └─ Slow probe = evicted by victim         │      │
│  │                                            │      │
│  │  Attacks: AES T-table, RSA, ECDSA          │      │
│  │  Countermeasure: AES-NI, constant-time     │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  5. Acoustic Cryptanalysis:                          │
│  ┌────────────────────────────────────────────┐      │
│  │  Record sounds from computer               │      │
│  │  RSA key extraction from key clicks        │      │
│  │  Range: ~10 meters with parabolic mic      │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Side-Channel Countermeasures

```
┌──────────────────────────────────────────────────────┐
│           SIDE-CHANNEL DEFENSES                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Constant-Time Code:                                 │
│  ├─ No secret-dependent branches                    │
│  ├─ No secret-dependent memory access               │
│  ├─ Use bitwise operations, not conditionals        │
│  └─ Tools: ct-grind, timecop                        │
│                                                      │
│  Hardware Countermeasures:                           │
│  ├─ AES-NI instruction set                          │
│  ├─ Hardware security modules (HSM)                 │
│  ├─ Trusted Platform Module (TPM)                   │
│  └─ Secure enclaves (SGX, TrustZone)               │
│                                                      │
│  Software Countermeasures:                           │
│  ├─ Blinding (randomize intermediate values)        │
│  ├─ Masking (randomize data representation)         │
│  ├─ Shuffling (randomize operation order)           │
│  └─ Noise injection                                 │
│                                                      │
│  Protocol-Level:                                     │
│  ├─ Constant-time comparison for all auth           │
│  ├─ Random delays in responses                      │
│  └─ Rate limiting                                    │
└──────────────────────────────────────────────────────┘
```

---

## Padding Oracle Attacks

### How Padding Oracle Attacks Work

```
┌──────────────────────────────────────────────────────┐
│              PADDING ORACLE ATTACK                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Target: CBC mode encryption with PKCS#7 padding    │
│                                                      │
│  PKCS#7 Padding:                                     │
│  ┌────────────────────────────────────────────┐      │
│  │  Pad length N: Add N bytes of value N      │      │
│  │  Example: Pad to 16 bytes                  │      │
│  │  ├─ 15 bytes: add 0x01                    │      │
│  │  ├─ 14 bytes: add 0x02 0x02               │      │
│  │  └─ 16 bytes: add 0x10 × 16              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Attack Process:                                     │
│  ┌────────────────────────────────────────────┐      │
│  │  Given: C = C₀ || C₁ (two ciphertext blocks)│     │
│  │                                            │      │
│  │  To decrypt C₁:                           │      │
│  │  1. Modify C₀ to C₀' (change last byte)   │      │
│  │  2. Send (C₀', C₁) to server              │      │
│  │  3. Server returns: Valid/Invalid padding  │      │
│  │                                            │      │
│  │  If Valid:                                 │      │
│  │  P₁'[15] ⊕ C₀'[15] = 0x01               │      │
│  │  P₁[15] = 0x01 ⊕ C₀[15] ⊕ C₀'[15]     │      │
│  │                                            │      │
│  │  Repeat for each byte:                     │      │
│  │  For byte i, set padding to (16-i)        │      │
│  │  Modify C₀'[i] until valid response       │      │
│  │  Calculate: P₁[i] = padding ⊕ C₀[i] ⊕ C₀'[i]│
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Complexity: ~256 × block_size requests per block    │
│  For AES (128-bit): ~256 × 16 = 4096 requests/block│
│                                                      │
│  Real-World Attacks:                                 │
│  ├─ POODLE (TLS 1.0, SSL 3.0)                      │
│  ├─ Lucky13 (TLS 1.0-1.2)                          │
│  ├─ Vaudenay (original, 2002)                       │
│  └─ Various web application flaws                   │
│                                                      │
│  Countermeasures:                                    │
│  ├─ Use GCM mode (authenticated encryption)         │
│  ├─ Encrypt-then-MAC                                 │
│  ├─ Constant-time padding validation                │
│  └─ MAC-then-encrypt with careful implementation    │
└──────────────────────────────────────────────────────┘
```

### Padding Oracle Example

```python
import requests
import binascii

def padding_oracle_attack(host: str, port: int, ciphertext: bytes) -> bytes:
    """Demonstrate padding oracle attack."""
    block_size = 16
    num_blocks = len(ciphertext) // block_size

    plaintext = b""

    for block_num in range(num_blocks - 1, 0, -1):
        decrypted_block = bytearray()

        for byte_pos in range(block_size - 1, -1, -1):
            padding_value = block_size - byte_pos

            # Construct modified ciphertext
            modified = bytearray(ciphertext[:block_num * block_size])

            # Set already discovered bytes to produce correct padding
            for k in range(byte_pos + 1, block_size):
                modified[k] ^= decrypted_block[k - byte_pos - 1] ^ padding_value

            # Try all 256 values for this byte
            for guess in range(256):
                modified[byte_pos] = ciphertext[byte_pos] ^ guess ^ padding_value

                # Send to oracle
                response = requests.post(
                    f"https://{host}:{port}/decrypt",
                    data={'ciphertext': binascii.hexlify(bytes(modified)).decode()}
                )

                if response.status_code == 200:  # Valid padding
                    decrypted_block.append(guess)
                    print(f"Found byte {byte_pos}: {guess:#04x}")
                    break

        plaintext = bytes(decrypted_block) + plaintext

    return plaintext
```

---

## Downgrade Attacks

### TLS Downgrade Attacks

```
┌──────────────────────────────────────────────────────┐
│              TLS DOWNGRADE ATTACKS                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. POODLE (Padding Oracle On Downgraded Legacy      │
│     Encryption, CVE-2014-3566):                      │
│  ┌────────────────────────────────────────────┐      │
│  │  Target: SSL 3.0 (CBC mode)               │      │
│  │  Attack: Force SSL 3.0 negotiation         │      │
│  │  ├─ MitM blocks TLS 1.2+                   │      │
│  │  ├─ Server falls back to SSL 3.0           │      │
│  │  ├─ Exploit padding oracle in SSL 3.0      │      │
│  │  └─ Recover plaintext (e.g., session cookie)│     │
│  │                                            │      │
│  │  Impact: Decryption of encrypted traffic   │      │
│  │  Fix: Disable SSL 3.0 entirely             │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. DROWN (Decrypting RSA with Obsolete and          │
│     Weakened eNcryption, CVE-2016-0800):             │
│  ┌────────────────────────────────────────────┐      │
│  │  Target: SSLv2 (even if server doesn't use │      │
│  │          SSLv2, shared keys are vulnerable) │      │
│  │  Attack: Cross-protocol attack             │      │
│  │  ├─ Use SSLv2 handshake to recover RSA key │      │
│  │  ├─ Use recovered key to decrypt TLS session│    │
│  │  └─ Affects servers with RSA key export    │      │
│  │                                            │      │
│  │  Impact: Decrypt any TLS connection        │      │
│  │  Fix: Disable SSLv2, remove RSA key export │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. FREAK (Factoring RSA Export Keys):               │
│  ┌────────────────────────────────────────────┐      │
│  │  Target: Export cipher suites (512-bit RSA)│      │
│  │  Attack: Force use of export ciphers       │      │
│  │  ├─ MitM downgrades to export ciphers      │      │
│  │  ├─ Factor 512-bit RSA key                 │      │
│  │  └─ Decrypt traffic                        │      │
│  │                                            │      │
│  │  Fix: Disable export cipher suites         │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Logjam (CVE-2015-4000):                         │
│  ┌────────────────────────────────────────────┐      │
│  │  Target: Diffie-Hellman (512-bit)          │      │
│  │  Attack: Force 512-bit DH export grade     │      │
│  │  ├─ Pre-computation attack on 512-bit DH   │      │
│  │  ├─ Cost: ~$20K and one week on Amazon EC2 │      │
│  │  └─ MitM and decrypt connections           │      │
│  │                                            │      │
│  │  Fix: Disable 512-bit DH, use 2048+ bit    │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  5. ROBOT (Return Of Bleichenbacher's Oracle):       │
│  ┌────────────────────────────────────────────┐      │
│  │  Target: RSA PKCS#1 v1.5 encryption       │      │
│  │  Attack: Bleichenbacher oracle in TLS       │      │
│  │  ├─ Server reveals decryption errors       │      │
│  │  ├─ Use as oracle to decrypt ciphertext    │      │
│  │  └─ Recover RSA session key                │      │
│  │                                            │      │
│  │  Fix: Use ECDHE key exchange (not RSA)     │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Countermeasures:                                    │
│  ├─ TLS 1.3 (removes downgrade options)             │
│  ├─ TLS_FALLBACK_SCSV (fallback signaling)          │
│  ├─ HSTS (prevent HTTP downgrade)                   │
│  ├─ Disable legacy protocols (SSLv2/3, TLS 1.0)    │
│  └─ Use strong cipher suites only                    │
└──────────────────────────────────────────────────────┘
```

### Protocol Downgrade Defense

```
┌──────────────────────────────────────────────────────┐
│         PROTOCOL DOWNGRADE DEFENSES                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  TLS_FALLBACK_SCSV:                                  │
│  ┌────────────────────────────────────────────┐      │
│  │  Signal in ClientHello (cipher suite)      │      │
│  │  Indicates: "This is a fallback attempt"   │      │
│  │  Server rejects if higher version supported │      │
│  │  Prevents: Forced downgrades               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  HSTS (HTTP Strict Transport Security):              │
│  ┌────────────────────────────────────────────┐      │
│  │  Header: Strict-Transport-Security         │      │
│  │          max-age=63072000; includeSubDomains│     │
│  │                                            │      │
│  │  Effect:                                   │      │
│  │  ├─ Browser only uses HTTPS                │      │
│  │  ├─ No HTTP fallback                       │      │
│  │  └─ HSTS Preload list (permanent)          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Certificate Transparency:                           │
│  ┌────────────────────────────────────────────┐      │
│  │  Detect mis-issued certificates            │      │
│  │  Prevent downgrade to fraudulent certs     │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Implementation Flaws

### Common Implementation Mistakes

```
┌──────────────────────────────────────────────────────┐
│           IMPLEMENTATION FLAWS                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Random Number Generator Flaws:                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Weak PRNGs:                               │      │
│  │  ├─ Predictable seeds (time, PID)          │      │
│  │  ├─ Insufficient entropy                   │      │
│  │  ├─ State recovery attacks                 │      │
│  │                                            │      │
│  │  Real incidents:                           │      │
│  │  ├─ Debian OpenSSL bug (2008)             │      │
│  │  │   └─ Only 32,768 possible keys          │      │
│  │  ├─ PlayStation 3 ECDSA hack (2010)       │      │
│  │  │   └─ Static nonce → key recovery        │      │
│  │  ├─ Android SecureRandom (2013)           │      │
│  │  │   └─ Predictable Bitcoin wallets        │      │
│  │  └─ Dual_EC_DRBG backdoor (2013)          │      │
│  │      └─ NSA backdoor in NIST standard      │      │
│  │                                            │      │
│  │  Fix: Use /dev/urandom, CSPRNG             │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Key Reuse:                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Never reuse key+nonce in:                 │      │
│  │  ├─ GCM mode                               │      │
│  │  ├─ ChaCha20-Poly1305                      │      │
│  │  ├─ AES-CTR                                │      │
│  │  ├─ Nonce-based authentication             │      │
│  │                                            │      │
│  │  Sony PS3 ECDSA (2010):                    │      │
│  │  ├─ Same nonce k for all signatures        │      │
│  │  ├─ s = k⁻¹(hash + d·r) mod n            │      │
│  │  ├─ With two signatures (same k):         │      │
│  │  │   s₁ - s₂ = k⁻¹(hash₁ - hash₂)      │      │
│  │  │   k = (hash₁ - hash₂)/(s₁ - s₂)       │      │
│  │  │   d = (s·k - hash)/r                   │      │
│  │  └─ Private key recovered!                │      │
│  │                                            │      │
│  │  Fix: Deterministic nonces (RFC 6979)      │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. Incorrect Verification:                          │
│  ┌────────────────────────────────────────────┐      │
│  │  Common mistakes:                          │      │
│  │  ├─ Verify signature AFTER using data      │      │
│  │  ├─ Skip certificate validation            │      │
│  │  ├─ Ignore hostname verification errors    │      │
│  │  ├─ Use == instead of constant-time compare│      │
│  │  └─ Fail open instead of fail closed       │      │
│  │                                            │      │
│  │  Fix: Verify first, then use               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Buffer Overflow in Crypto:                       │
│  ┌────────────────────────────────────────────┐      │
│  │  OpenSSL Heartbleed (CVE-2014-0160):       │      │
│  │  ├─ Heartbeat extension doesn't check      │      │
│  │  │   claimed length vs actual payload      │      │
│  │  ├─ Attacker reads 64KB of server memory   │      │
│  │  ├─ Leaks: Private keys, passwords, cookies│      │
│  │  └─ Affects: ~17% of SSL servers (2014)    │      │
│  │                                            │      │
│  │  Fix: Bounds checking, constant-time       │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  5. Timing-Constant Violation:                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Timing side-channel in HMAC comparison    │      │
│  │  Early return leaks partial key information│      │
│  │                                            │      │
│  │  Vulnerable:                               │      │
│  │  for i in range(len(a)):                   │      │
│  │      if a[i] != b[i]: return False         │      │
│  │                                            │      │
│  │  Secure:                                   │      │
│  │  hmac.compare_digest(a, b)                 │      │
│  │  secrets.compare_digest(a, b)              │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Mathematical Attacks

### Number Theory Attacks

```
┌──────────────────────────────────────────────────────┐
│           MATHEMATICAL ATTACKS                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. RSA Factoring:                                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Given n = p × q, find p and q             │      │
│  │                                            │      │
│  │  Algorithms:                               │      │
│  │  ├─ Trial Division: O(√n)                  │      │
│  │  ├─ Pollard's Rho: O(n^(1/4))             │      │
│  │  ├─ Quadratic Sieve: sub-exponential       │      │
│  │  ├─ General Number Field Sieve:            │      │
│  │  │   L_n[1/3, (64/9)^(1/3)] ≈ e^(1.923(n^(1/3)(ln n)^(2/3)))│
│  │  └─ Current record: 829-bit RSA (RSA-250)  │
│  │                                            │      │
│  │  Key size recommendations:                 │      │
│  │  ├─ 1024-bit: ⚠ Deprecated                 │      │
│  │  ├─ 2048-bit: ✅ Minimum (112-bit security) │      │
│  │  ├─ 3072-bit: ✅ Recommended (128-bit)      │      │
│  │  └─ 4096-bit: ✅ High security              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  2. Discrete Logarithm Problem (DLP):                │
│  ┌────────────────────────────────────────────┐      │
│  │  Given g, p, A = g^a mod p, find a        │      │
│  │                                            │      │
│  │  Algorithms:                               │      │
│  │  ├─ Baby-step Giant-step: O(√p)           │      │
│  │  ├─ Pollard's Rho: O(√p)                  │      │
│  │  ├─ Index Calculus: sub-exponential        │      │
│  │  └─ Function Field Sieve: best known       │      │
│  │                                            │      │
│  │  Current record: 795-bit DLP (finite field)│      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  3. Elliptic Curve Attacks:                          │
│  ┌────────────────────────────────────────────┐      │
│  │  ECDLP: Given P and Q = kP, find k         │      │
│  │                                            │      │
│  │  Algorithms:                               │      │
│  │  ├─ Pollard's Rho: O(√n) - best known     │      │
│  │  ├─ Transfer attacks to DLP                │      │
│  │  └─ Index calculus (not effective for ECC) │      │
│  │                                            │      │
│  │  Current record: 131-bit ECC               │      │
│  │  256-bit ECC: ~2^128 operations (infeasible)│    │
│  │                                            │      │
│  │  Weak curves:                              │      │
│  │  ├─ Curves with small embedding degree     │      │
│  │  ├─ Anomalous curves (order = p)           │      │
│  │  └─ Curves with special structure           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  4. Lattice Attacks:                                 │
│  ┌────────────────────────────────────────────┐      │
│  │  LLL algorithm: shortest vector problem    │      │
│  │  Used against:                             │      │
│  │  ├─ RSA with small private exponent        │      │
│  │  ├─ Hidden number problem                  │      │
│  │  ├─ Some NTRU implementations              │      │
│  │  └─ Lattice-based cryptography (target)    │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  5. Meet-in-the-Middle:                              │
│  ┌────────────────────────────────────────────┐      │
│  │  Reduces effective key length              │      │
│  │  Example: 2DES = 2^57 (not 2^112)         │      │
│  │  3DES: 2^112 (not 2^168)                   │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Quantum Threats

### Quantum Computing Impact

```
┌──────────────────────────────────────────────────────┐
│              QUANTUM THREATS                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Shor's Algorithm (1994):                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Polynomial-time factoring and discrete log│      │
│  │                                            │      │
│  │  Impact on cryptography:                   │      │
│  │  ├─ RSA: Completely broken                 │      │
│  │  │   ├─ 2048-bit RSA broken with ~4000    │      │
│  │  │   │   logical qubits                    │      │
│  │  │   └─ Running time: polynomial           │      │
│  │  ├─ ECC: Completely broken                 │      │
│  │  │   ├─ 256-bit ECC broken with ~2300     │      │
│  │  │   │   logical qubits                    │      │
│  │  │   └─ Same algorithm (discrete log)      │      │
│  │  ├─ DH: Completely broken                  │      │
│  │  └─ DSA: Completely broken                 │      │
│  │                                            │      │
│  │  NOT affected:                             │      │
│  │  ├─ Symmetric encryption (Grover's)        │      │
│  │  │   └─ Only halves key security           │      │
│  │  ├─ Hash functions (Grover's)              │      │
│  │  └─ Post-quantum cryptography              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Grover's Algorithm (1996):                          │
│  ┌────────────────────────────────────────────┐      │
│  │  Quadratic speedup for unstructured search │      │
│  │                                            │      │
│  │  Impact:                                   │      │
│  │  ├─ AES-128: 2^64 operations (feasible!)  │      │
│  │  ├─ AES-256: 2^128 operations (still safe)│      │
│  │  └─ SHA-256: 2^128 preimage (still safe)  │      │
│  │                                            │      │
│  │  Mitigation: Double key/hash sizes         │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Harvest Now, Decrypt Later:                         │
│  ┌────────────────────────────────────────────┐      │
│  │  Adversaries collect encrypted traffic now │      │
│  │  Decrypt when quantum computers available  │      │
│  │  Timeline: 10-15 years (estimated)         │      │
│  │                                            │      │
│  │  At risk:                                  │      │
│  │  ├─ Government secrets (long classification)│    │
│  │  ├─ Healthcare records (HIPAA)             │      │
│  │  ├─ Financial data (PCI-DSS)               │      │
│  │  └─ Intellectual property                   │      │
│  │                                            │      │
│  │  Must migrate NOW for long-lived secrets   │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Post-Quantum Cryptography

```
┌──────────────────────────────────────────────────────┐
│           POST-QUANTUM CRYPTOGRAPHY                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  NIST PQC Standards (2024):                          │
│  ┌────────────────────────────────────────────┐      │
│  │  1. ML-KEM (CRYSTALS-Kyber):               │      │
│  │     ├─ Type: Lattice-based key exchange    │      │
│  │     ├─ Key sizes: 800-1568 bytes           │      │
│  │     ├─ Ciphertext: 768-1568 bytes          │      │
│  │     ├─ Security levels: 1,3,5              │      │
│  │     └─ Used in: TLS 1.3 (hybrid mode)     │      │
│  │                                            │      │
│  │  2. ML-DSA (CRYSTALS-Dilithium):           │      │
│  │     ├─ Type: Lattice-based signature       │      │
│  │     ├─ Signature size: 2420-4627 bytes     │      │
│  │     ├─ Public key: 1312-2592 bytes         │      │
│  │     └─ Primary signature scheme             │      │
│  │                                            │      │
│  │  3. SLH-DSA (SPHINCS+):                    │      │
│  │     ├─ Type: Hash-based signature          │      │
│  │     ├─ Conservative (well-understood)      │      │
│  │     ├─ Larger signatures (7856-49856 bytes)│      │
│  │     └─ Backup if lattice schemes broken    │      │
│  │                                            │      │
│  │  4. FN-DSA (FALCON):                       │      │
│  │     ├─ Type: Lattice-based signature       │      │
│  │     ├─ Compact signatures (666-1280 bytes) │      │
│  │     ├─ Complex implementation              │      │
│  │     └─ Standardized 2025                   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Migration Strategy:                                 │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Inventory: Identify crypto assets      │      │
│  │  2. Risk assessment: Classify by data life │      │
│  │  3. Hybrid mode: Classical + PQC           │      │
│  │  4. Full PQC: When standards mature        │      │
│  │  5. Continuous monitoring                   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Current Deployments:                                │
│  ├─ Google Chrome: X25519Kyber768 (hybrid)          │
│  ├─ Cloudflare: X25519Kyber768                       │
│  ├─ Signal: PQXDH (X25519 + Kyber)                  │
│  └─ Apple iMessage: PQ3 (hybrid)                     │
└──────────────────────────────────────────────────────┘
```

---

## OpenSSL Commands

### Testing Vulnerable Configurations

```bash
# Test for weak cipher suites
nmap --script ssl-enum-ciphers -p 443 example.com

# Test for POODLE vulnerability
sslscan example.com:443

# Test for Heartbleed
echo | openssl s_client -connect example.com:443 -tlsextdebug 2>&1 | grep -i heartbeat

# Check TLS version support
openssl s_client -connect example.com:443 -tls1    # TLS 1.0 (insecure)
openssl s_client -connect example.com:443 -tls1_2  # TLS 1.2
openssl s_client -connect example.com:443 -tls1_3  # TLS 1.3

# Check for weak DH parameters
openssl s_client -connect example.com:443 -cipher "DHE" 2>/dev/null | \
    grep "Server Temp Key"
```

### Security Testing Tools

```bash
# TestSSL.sh (comprehensive TLS testing)
./testssl.sh example.com

# SSLyze (TLS scanner)
sslyze --regular example.com

# Test certificate transparency
curl -s "https://crt.sh/?q=example.com" | head -20

# Check OCSP stapling
openssl s_client -connect example.com:443 -status 2>/dev/null | \
    grep -A5 "OCSP Response"

# Generate test weak key for testing
openssl genrsa -out weak.key 512  # DON'T USE IN PRODUCTION
```

### Post-Quantum Testing

```bash
# Check for hybrid key exchange (Chrome-style)
openssl s_client -connect example.com:443 -groups X25519Kyber768 2>/dev/null | \
    grep "Server Temp Key"

# List available PQC groups (if supported)
openssl list -groups | grep -i kyber
```

---

## Practical Examples

### Timing Attack Mitigation

```python
import hmac
import hashlib
import secrets
import time

def vulnerable_compare(a: bytes, b: bytes) -> bool:
    """VULNERABLE: Early return leaks timing information."""
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False  # Early return on first mismatch
    return True

def constant_time_compare(a: bytes, b: bytes) -> bool:
    """SECURE: Constant-time comparison."""
    return hmac.compare_digest(a, b)

def constant_time_xor_compare(a: bytes, b: bytes) -> bool:
    """SECURE: Manual constant-time comparison."""
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0

# Timing measurement
def measure_timing(func, a, b, iterations=10000):
    start = time.perf_counter_ns()
    for _ in range(iterations):
        func(a, b)
    end = time.perf_counter_ns()
    return (end - start) / iterations

# Demonstrate timing difference
target = b"secret_token"
correct = target
wrong = b"secret_tokem"  # Last byte different

print(f"Vulnerable (correct): {measure_timing(vulnerable_compare, target, correct):.0f} ns")
print(f"Vulnerable (wrong):   {measure_timing(vulnerable_compare, target, wrong):.0f} ns")
print(f"Constant-time:        {measure_timing(constant_time_compare, target, correct):.0f} ns")
```

### Random Number Generator Testing

```python
import secrets
import hashlib
from collections import Counter

def test_rng_quality(rng_func, samples=1000000):
    """Simple statistical test for RNG quality."""
    values = [rng_func() for _ in range(samples)]

    # Frequency test
    counter = Counter(values)
    expected = samples / 256  # For byte-level RNG

    chi_squared = sum(
        (count - expected) ** 2 / expected
        for count in counter.values()
    )

    print(f"Chi-squared: {chi_squared:.2f}")
    print(f"Expected (uniform): ~256")
    print(f"Pass (chi² < 293): {chi_squared < 293}")

# CSPRNG (secure)
test_rng_quality(lambda: secrets.randbelow(256))

# Linear Congruential Generator (insecure)
class BadRNG:
    def __init__(self):
        self.state = 12345
    def __call__(self):
        self.state = (1103515245 * self.state + 12345) % (2**31)
        return self.state % 256

test_rng_quality(BadRNG())
```

### Side-Channel Resistant Code

```python
def constant_time_hash_verify(stored_hash: bytes, computed_hash: bytes) -> bool:
    """Constant-time hash verification."""
    if len(stored_hash) != len(computed_hash):
        return False

    result = 0
    for a, b in zip(stored_hash, computed_hash):
        result |= a ^ b

    return result == 0

def secure_lookup(table: list, index: int) -> int:
    """Constant-time array lookup (no branch on secret index)."""
    result = 0
    for i, value in enumerate(table):
        # Constant-time conditional move
        mask = -int(i == index)  # All 1s if equal, all 0s otherwise
        result = (result & ~mask) | (value & mask)
    return result

# Using secrets module for cryptographic randomness
def generate_secure_token(length: int = 32) -> bytes:
    """Generate cryptographically secure random token."""
    return secrets.token_bytes(length)

def generate_secure_nonce() -> bytes:
    """Generate 96-bit nonce for GCM."""
    return secrets.token_bytes(12)
```

---

## Security Perspective

### Attack Summary

```
┌──────────────────────────────────────────────────────┐
│           ATTACK SUMMARY BY TARGET                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Symmetric Encryption:                               │
│  ├─ Brute force (if key too short)                  │
│  ├─ Related key attacks (weak key schedule)          │
│  ├─ Side-channel (timing, power, EM)                │
│  └─ Quantum (Grover's: halves security)             │
│                                                      │
│  Asymmetric Encryption:                              │
│  ├─ Factoring (RSA)                                  │
│  ├─ Discrete log (DH, DSA)                          │
│  ├─ ECDLP (ECC)                                     │
│  ├─ Side-channel (timing, power analysis)           │
│  ├─ Fault injection (Bellcore attack)               │
│  └─ Quantum (Shor's: completely broken)             │
│                                                      │
│  Hash Functions:                                     │
│  ├─ Collision (birthday, differential)              │
│  ├─ Preimage (brute force)                          │
│  ├─ Length extension (Merkle-Damgård)              │
│  └─ Quantum (Grover's: halves security)             │
│                                                      │
│  Protocols:                                          │
│  ├─ Downgrade attacks (POODLE, FREAK, Logjam)       │
│  ├─ Padding oracle (Vaudenay, Lucky13)              │
│  ├─ Man-in-the-middle                               │
│  └─ Replay attacks                                  │
│                                                      │
│  Implementations:                                    │
│  ├─ Buffer overflow (Heartbleed)                    │
│  ├─ Timing side-channel                             │
│  ├─ Random number generator flaws                   │
│  ├─ Key management errors                           │
│  └─ Incorrect verification                          │
└──────────────────────────────────────────────────────┘
```

### Defense Mechanisms

```
┌──────────────────────────────────────────────────────┐
│              COMPREHENSIVE DEFENSES                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Algorithm Selection:                                │
│  ├─ AES-256-GCM for symmetric encryption            │
│  ├─ RSA-3072+ or ECC-256+ for asymmetric            │
│  ├─ SHA-256+ for hashing                            │
│  ├─ Argon2id for password hashing                    │
│  ├─ Ed25519 for signatures                          │
│  └─ Prepare for post-quantum migration              │
│                                                      │
│  Protocol Design:                                    │
│  ├─ TLS 1.3 only (no downgrade)                     │
│  ├─ Authenticated encryption (GCM, Poly1305)        │
│  ├─ Forward secrecy (ECDHE)                         │
│  ├─ Certificate Transparency                         │
│  ├─ HSTS + preload                                   │
│  └─ OCSP stapling                                    │
│                                                      │
│  Implementation:                                     │
│  ├─ Constant-time operations for all crypto          │
│  ├─ Use established libraries (not custom)          │
│  ├─ CSPRNG for all random generation                │
│  ├─ Proper error handling (fail closed)             │
│  ├─ Regular security audits                         │
│  └─ Memory-safe languages when possible              │
│                                                      │
│  Operational:                                        │
│  ├─ Key rotation (90-180 days)                      │
│  ├─ Certificate rotation (90 days)                   │
│  ├─ Security monitoring and logging                  │
│  ├─ Incident response plan                          │
│  └─ Cryptographic agility (ability to swap algos)   │
└──────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Fundamental

1. **Q: What is a side-channel attack?**
   A: An attack that exploits physical information (timing, power consumption, EM radiation) rather than mathematical weaknesses in the algorithm.

2. **Q: Why is ECB mode insecure?**
   A: Identical plaintext blocks produce identical ciphertext blocks, revealing patterns. No diffusion across blocks.

3. **Q: What is a padding oracle attack?**
   A: An attack on CBC mode where the server reveals whether padding is valid, allowing decryption of ciphertext byte-by-byte.

### Intermediate

4. **Q: How does a downgrade attack work?**
   A: An attacker forces the client and server to use a weaker protocol version or cipher suite (e.g., forcing SSL 3.0 or export ciphers).

5. **Q: What makes constant-time code important?**
   A: Timing side-channels can leak secret information. Constant-time code ensures execution time doesn't depend on secret data.

6. **Q: What is the difference between collision and preimage resistance?**
   A: Collision: find any two inputs with same hash. Preimage: given hash, find any matching input.

### Advanced

7. **Q: How does Shor's algorithm break RSA?**
   A: Shor's algorithm factors large integers in polynomial time using quantum Fourier transform. Factoring n = p × q recovers the private key.

8. **Q: What is the impact of quantum computing on current cryptography?**
   A: RSA, ECC, DH are completely broken by Shor's algorithm. AES-256 and SHA-256 remain secure (Grover's only halves security).

9. **Q: How should organizations prepare for quantum threats?**
   A: Inventory cryptographic assets, prioritize long-lived secrets, implement hybrid classical+PQC, monitor NIST PQC standards, and plan migration timeline.

---

## Hands-on Labs

### Lab 1: Timing Attack Demonstration

```python
import time
import secrets

def vulnerable_verify(stored: bytes, provided: bytes) -> bool:
    """Timing-vulnerable comparison."""
    if len(stored) != len(provided):
        return False
    for i in range(len(stored)):
        if stored[i] != provided[i]:
            return False
    return True

def recover_secret(target: bytes, max_len: int) -> bytes:
    """Recover secret using timing attack."""
    recovered = bytearray()

    for pos in range(max_len):
        best_time = 0
        best_byte = 0

        for guess in range(256):
            candidate = bytes(recovered + bytearray([guess]))
            candidate = candidate.ljust(len(target), b'\x00')

            # Measure timing
            times = []
            for _ in range(500):
                start = time.perf_counter_ns()
                vulnerable_verify(target, candidate)
                end = time.perf_counter_ns()
                times.append(end - start)

            avg_time = sum(times) / len(times)

            if avg_time > best_time:
                best_time = avg_time
                best_byte = guess

        recovered.append(best_byte)
        print(f"Byte {pos}: {best_byte:#04x} ({chr(best_byte) if 32 <= best_byte < 127 else '?'})")

    return bytes(recovered)

# Test
secret = b"SECRET123"
print(f"Target: {secret}")
print(f"Recovered: {recover_secret(secret, len(secret))}")
```

### Lab 2: Random Number Generator Analysis

```python
import secrets
import hashlib
import struct
from collections import Counter

class XorShift128:
    """Insecure PRNG for demonstration."""
    def __init__(self, seed: int):
        self.state = seed
    def next(self):
        x = self.state
        x ^= x << 13
        x ^= x >> 17
        x ^= x << 5
        self.state = x
        return x & 0xFFFFFFFF

class LCG:
    """Linear Congruential Generator (insecure)."""
    def __init__(self, seed: int):
        self.state = seed
    def next(self):
        self.state = (1103515245 * self.state + 12345) % (2**31)
        return self.state

def test_uniformity(rng_func, n=100000):
    """Test uniformity of RNG."""
    values = [rng_func() % 256 for _ in range(n)]
    counter = Counter(values)

    # Chi-squared test
    expected = n / 256
    chi2 = sum((v - expected)**2 / expected for v in counter.values())

    # Bit independence test
    bits = [(v >> b) & 1 for v in values for b in range(8)]
    bit_counter = Counter(bits)
    bit_chi2 = sum((v - n*4)**2 / (n*4) for v in bit_counter.values())

    return {
        'chi_squared': chi2,
        'bit_chi_squared': bit_chi2,
        'uniform': chi2 < 293,  # For 255 DOF
        'independent_bits': bit_chi2 < 293
    }

# Test CSPRNG
print("CSPRNG (secrets):")
result = test_uniformity(lambda: secrets.randbelow(256))
print(f"  Chi²: {result['chi_squared']:.2f}, Uniform: {result['uniform']}")

# Test LCG
print("\nLCG:")
lcg = LCG(42)
result = test_uniformity(lcg.next)
print(f"  Chi²: {result['chi_squared']:.2f}, Uniform: {result['uniform']}")

# Test XorShift
print("\nXorShift128:")
xorshift = XorShift128(42)
result = test_uniformity(xorshift.next)
print(f"  Chi²: {result['chi_squared']:.2f}, Uniform: {result['uniform']}")
```

### Lab 3: Padding Oracle Attack Simulation

```python
from Crypto.Cipher import AES
import os

class VulnerableServer:
    """Simulates vulnerable CBC server with padding oracle."""
    def __init__(self):
        self.key = os.urandom(16)
        self.iv = os.urandom(16)

    def encrypt(self, plaintext: bytes) -> bytes:
        cipher = AES.new(self.key, AES.MODE_CBC, self.iv)
        # PKCS7 padding
        pad_len = 16 - (len(plaintext) % 16)
        padded = plaintext + bytes([pad_len] * pad_len)
        return self.iv + cipher.encrypt(padded)

    def decrypt_and_check(self, ciphertext: bytes) -> bool:
        """Returns True if padding is valid (VULNERABLE)."""
        try:
            iv = ciphertext[:16]
            ct = ciphertext[16:]
            cipher = AES.new(self.key, AES.MODE_CBC, iv)
            decrypted = cipher.decrypt(ct)

            # Check PKCS7 padding
            pad_len = decrypted[-1]
            if pad_len < 1 or pad_len > 16:
                return False
            if decrypted[-pad_len:] != bytes([pad_len] * pad_len):
                return False
            return True
        except Exception:
            return False

def padding_oracle_attack(server, ciphertext: bytes) -> bytes:
    """Decrypt using padding oracle."""
    block_size = 16
    num_blocks = (len(ciphertext) - 16) // block_size

    plaintext = b""

    for block_idx in range(num_blocks):
        start = block_idx * block_size + 16
        end = start + block_size
        target_block = ciphertext[start:end]

        decrypted_block = bytearray()

        for byte_pos in range(block_size - 1, -1, -1):
            padding_val = block_size - byte_pos

            modified = bytearray(ciphertext[:start])

            for k in range(byte_pos + 1, block_size):
                modified[k] ^= decrypted_block[k - byte_pos - 1] ^ padding_val

            for guess in range(256):
                modified[byte_pos] = ciphertext[byte_pos] ^ guess ^ padding_val

                if server.decrypt_and_check(bytes(modified)):
                    decrypted_block.append(guess)
                    break

        plaintext += bytes(decrypted_block)

    return plaintext

# Test
server = VulnerableServer()
original = b"Secret message to decrypt!"
encrypted = server.encrypt(original)

recovered = padding_oracle_attack(server, encrypted)
print(f"Original: {original}")
print(f"Recovered: {recovered}")
print(f"Match: {original == recovered}")
```

---

## Summary Table

| Attack Type | Target | Difficulty | Mitigation |
|------------|--------|------------|------------|
| Brute Force | All crypto | High | Sufficient key length |
| Timing | RSA, ECC, HMAC | Medium | Constant-time code |
| Power Analysis | Hardware | Medium | HSM, shielding |
| Padding Oracle | CBC mode | Low | GCM, encrypt-then-MAC |
| POODLE | SSL 3.0 | Low | Disable SSL 3.0 |
| FREAK | RSA export | Low | Disable export ciphers |
| Logjam | DH export | Low | 2048+ bit DH |
| Heartbleed | OpenSSL | Low | Patch, bounds checking |
| Factoring | RSA | High (quantum) | 3072+ bit, PQC prep |
| Shor's | RSA/ECC/DH | Medium (quantum) | PQC migration |

---

## References

- NIST SP 800-57 (Key Management)
- NIST PQC Standards (FIPS 203, 204, 205)
- Schneier, "Applied Cryptography"
- Stinson, "Cryptography: Theory and Practice"
- Boneh, "Twenty Years of Attacks on the RSA Cryptosystem"
- CVE databases (MITRE)
