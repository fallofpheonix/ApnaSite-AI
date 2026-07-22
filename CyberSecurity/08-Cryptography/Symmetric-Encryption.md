# Symmetric Encryption

## Layer Position in Security Model

```
┌─────────────────────────────────────────────────┐
│              APPLICATION LAYER                   │
│         (TLS, IPsec, SSH, S/MIME)               │
├─────────────────────────────────────────────────┤
│              SESSION LAYER                       │
│         (Key Exchange, Authentication)          │
├─────────────────────────────────────────────────┤
│           ► SYMMETRIC ENCRYPTION ◄             │
│  ┌─────────────────────────────────────────┐    │
│  │  AES │ DES │ 3DES │ ChaCha20 │ RC4     │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│           NETWORK LAYER                         │
│         (IPsec ESP, VPN Encryption)             │
├─────────────────────────────────────────────────┤
│           LINK LAYER                            │
│         (WPA2/WPA3, MACsec)                     │
└─────────────────────────────────────────────────┘
```

## Overview

Symmetric encryption uses the **same key** for both encryption and decryption. It is the foundation of modern data confidentiality and is used in virtually every secure protocol.

```
  Plaintext                    Plaintext
      │                            ▲
      ▼                            │
┌─────────────┐   Key K    ┌─────────────┐
│  ENCRYPTION │◄──────────►│  DECRYPTION │
│  (Enc)      │            │  (Dec)      │
└─────────────┘            └─────────────┘
      │                            ▲
      ▼                            │
  Ciphertext ──────────────────► Ciphertext
```

---

## Block Ciphers

Block ciphers encrypt data in fixed-size blocks (e.g., 64 or 128 bits).

### AES (Advanced Encryption Standard)

```
┌──────────────────────────────────────────────────────┐
│                    AES ENCRYPTION                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Plaintext (128 bits)                                │
│  ┌────────────────────────────────────────────┐      │
│  │  P0  │  P1  │  P2  │ ... │ P15 │          │      │
│  └──────┴──────┴──────┴─────┴─────┘          │      │
│            │                                  │      │
│            ▼                                  │      │
│  ┌─────────────────────┐                      │      │
│  │  AddRoundKey (Ark0) │◄─── Round Key 0     │      │
│  └─────────┬───────────┘                      │      │
│            │                                  │      │
│            ▼                                  │      │
│  ┌─────────────────────┐                      │      │
│  │    SubBytes (SBox)  │                      │      │
│  └─────────┬───────────┘                      │      │
│            │                                  │      │
│            ▼                                  │      │
│  ┌─────────────────────┐                      │      │
│  │   ShiftRows         │                      │      │
│  └─────────┬───────────┘                      │      │
│            │                                  │      │
│            ▼                                  │      │
│  ┌─────────────────────┐                      │      │
│  │   MixColumns        │  ◄── (not in last)  │      │
│  └─────────┬───────────┘                      │      │
│            │                                  │      │
│            ▼                                  │      │
│  ┌─────────────────────┐                      │      │
│  │  AddRoundKey (ArkN) │◄─── Round Key N     │      │
│  └─────────┬───────────┘                      │      │
│            │                                  │      │
│            ▼                                  │      │
│  Ciphertext (128 bits)                         │      │
│                                                      │
│  AES-128: 10 rounds  │  AES-192: 12 rounds          │
│  AES-256: 14 rounds  │                              │
└──────────────────────────────────────────────────────┘
```

**AES Specifications:**

| Parameter | AES-128 | AES-192 | AES-256 |
|-----------|---------|---------|---------|
| Key Size | 128 bits | 192 bits | 256 bits |
| Block Size | 128 bits | 128 bits | 128 bits |
| Rounds | 10 | 12 | 14 |
| Security Level | 128-bit | 192-bit | 256-bit |
| Performance | Fastest | Fast | Fast |

### DES (Data Encryption Standard)

```
┌──────────────────────────────────────────────────────┐
│                    DES STRUCTURE                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Plaintext (64 bits)                                 │
│  ┌────────────────────────────────────────────┐      │
│  │  Initial Permutation (IP)                  │      │
│  └────────────────────────────────────────────┘      │
│            │                                         │
│            ▼                                         │
│  ┌─────────────────────┐                             │
│  │  Left Half (32 bits)│  Right Half (32 bits)      │
│  │  ┌──────────────┐   │  ┌──────────────┐          │
│  │  │     Li       │   │  │     Ri       │          │
│  │  └──────┬───────┘   │  └──────┬───────┘          │
│  │         │           │         │                   │
│  │         │           │         ▼                   │
│  │         │           │  ┌──────────────┐           │
│  │         │           │  │ f(Ri, Ki)    │◄── Round Key│
│  │         │           │  └──────┬───────┘           │
│  │         │           │         │                   │
│  │         ◄───────────┼─────────┘ (XOR)            │
│  │         │           │         │                   │
│  │  (16 rounds)        │         │                   │
│  └─────────────────────┘         │                   │
│            │                     │                   │
│            ▼                     ▼                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Final Permutation (IP⁻¹)                 │      │
│  └────────────────────────────────────────────┘      │
│            │                                         │
│            ▼                                         │
│  Ciphertext (64 bits)                                │
│                                                      │
│  DES: 56-bit effective key, 16 rounds               │
│  ⚠ BROKEN: Brute forceable in hours                │
└──────────────────────────────────────────────────────┘
```

### Triple DES (3DES)

```
┌──────────────────────────────────────────────────────┐
│                  TRIPLE DES (3DES)                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Plaintext (64 bits)                                 │
│  ┌────────────────────────────────────────────┐      │
│  │           DES Encrypt with K1              │      │
│  └────────────────────────────────────────────┘      │
│            │                                         │
│            ▼                                         │
│  ┌────────────────────────────────────────────┐      │
│  │           DES Decrypt with K2              │      │
│  └────────────────────────────────────────────┘      │
│            │                                         │
│            ▼                                         │
│  ┌────────────────────────────────────────────┐      │
│  │           DES Encrypt with K3              │      │
│  └────────────────────────────────────────────┘      │
│            │                                         │
│            ▼                                         │
│  Ciphertext (64 bits)                                │
│                                                      │
│  Keying Options:                                     │
│  ├─ Option 1: K1≠K2≠K3  (168-bit security)         │
│  ├─ Option 2: K1=K2≠K3  (112-bit security)         │
│  └─ Option 3: K1=K2=K3  (56-bit security = DES)    │
│                                                      │
│  ⚠ SWEET32 attack: Practical collision at 2^32      │
└──────────────────────────────────────────────────────┘
```

---

## Stream Ciphers

Stream ciphers encrypt data one bit/byte at a time using a pseudorandom keystream.

### RC4 (Rivest Cipher 4)

```
┌──────────────────────────────────────────────────────┐
│                    RC4 ALGORITHM                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Key Scheduling Algorithm (KSA):                     │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Initialize S[0..255] = {0, 1, 2,...,255}│     │
│  │  2. j = 0                                  │      │
│  │  3. For i = 0 to 255:                      │      │
│  │       j = (j + S[i] + Key[i mod keylen])   │      │
│  │       Swap(S[i], S[j])                     │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Pseudo-Random Generation Algorithm (PRGA):          │
│  ┌────────────────────────────────────────────┐      │
│  │  1. i = 0, j = 0                           │      │
│  │  2. For each byte of plaintext:            │      │
│  │       i = (i + 1) mod 256                  │      │
│  │       j = (j + S[i]) mod 256               │      │
│  │       Swap(S[i], S[j])                     │      │
│  │       t = (S[i] + S[j]) mod 256            │      │
│  │       Output K = S[t]                      │      │
│  │       Ciphertext = Plaintext XOR K          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ⚠ BROKEN: Bias in first bytes, Fluhrer attacks    │
└──────────────────────────────────────────────────────┘
```

### ChaCha20

```
┌──────────────────────────────────────────────────────┐
│                  ChaCha20 QUARTER ROUND               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  State: 4x4 matrix of 32-bit words                  │
│  ┌──────┬──────┬──────┬──────┐                      │
│  │  c0  │  c1  │  c2  │  c3  │  (Constants)        │
│  ├──────┼──────┼──────┼──────┤                      │
│  │  k0  │  k1  │  k2  │  k3  │  (Key words)        │
│  ├──────┼──────┼──────┼──────┤                      │
│  │  k4  │  k5  │  k6  │  k7  │  (Key words)        │
│  ├──────┼──────┼──────┼──────┤                      │
│  │ ctr  │  n0  │  n1  │  n2  │  (Counter + Nonce)  │
│  └──────┴──────┴──────┴──────┘                      │
│                                                      │
│  Quarter Round (column/diagonal):                    │
│  ┌────────────────────────────────────────────┐      │
│  │  a += b;  d ^= a;  d <<<= 16;             │      │
│  │  c += d;  b ^= c;  b <<<= 12;             │      │
│  │  a += b;  d ^= a;  d <<<= 8;              │      │
│  │  c += d;  b ^= c;  b <<<= 7;              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  20 rounds = 10 double-rounds                        │
│  Faster than AES on many platforms                   │
│  Used in TLS 1.3, WireGuard, SSH                    │
└──────────────────────────────────────────────────────┘
```

---

## Modes of Operation

Modes define how block ciphers process data larger than one block.

### ECB (Electronic Codebook)

```
┌──────────────────────────────────────────────────────┐
│              ECB MODE (Electronic Codebook)           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  P1 ──┐    P2 ──┐    P3 ──┐    P4 ──┐              │
│       │         │         │         │                │
│       ▼         ▼         ▼         ▼                │
│  ┌─────────┐┌─────────┐┌─────────┐┌─────────┐      │
│  │AES Enc  ││AES Enc  ││AES Enc  ││AES Enc  │      │
│  │  +K     ││  +K     ││  +K     ││  +K     │      │
│  └────┬────┘└────┬────┘└────┬────┘└────┬────┘      │
│       │         │         │         │                │
│       ▼         ▼         ▼         ▼                │
│      C1        C2        C3        C4                │
│                                                      │
│  ⚠ DANGEROUS: Identical blocks → identical ciphertext│
│  ✗ NO confidentiality for structured data            │
│  ✗ Pattern leakage in images, databases              │
└──────────────────────────────────────────────────────┘
```

### CBC (Cipher Block Chaining)

```
┌──────────────────────────────────────────────────────┐
│              CBC MODE (Cipher Block Chaining)         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  IV ──────────────────────────────────┐              │
│  P1 ────┐                             │              │
│         ▼                             │              │
│        XOR ◄──────────────────────────┘              │
│         │                                             │
│         ▼                                             │
│    ┌─────────┐                                       │
│    │AES Enc  │                                       │
│    │  +K     │                                       │
│    └────┬────┘                                       │
│         │         C1 (output)                        │
│         ├──┐                                         │
│         │  │                                         │
│    P2 ──┤  └─────────────────────────► C1            │
│         ▼                                             │
│        XOR ◄────────────────────────── C1            │
│         │                                             │
│         ▼                                             │
│    ┌─────────┐                                       │
│    │AES Enc  │                                       │
│    │  +K     │                                       │
│    └────┬────┘                                       │
│         │         C2 (output)                        │
│                                                      │
│  ✓ Randomizes output (with good IV)                  │
│  ✗ Padding required (PKCS#7)                         │
│  ✗ Vulnerable to padding oracle attacks              │
└──────────────────────────────────────────────────────┘
```

### CTR (Counter Mode)

```
┌──────────────────────────────────────────────────────┐
│              CTR MODE (Counter)                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Nonce │ Counter                                     │
│  ──────┼─────────                                    │
│   IV   │  0001 ──┐  IV   │  0002 ──┐               │
│         │         │        │         │               │
│         ▼         ▼        ▼         ▼               │
│    ┌─────────┐┌─────────┐┌─────────┐               │
│    │AES Enc  ││AES Enc  ││AES Enc  │               │
│    │  +K     ││  +K     ││  +K     │               │
│    └────┬────┘└────┬────┘└────┬────┘               │
│         │         │         │                       │
│         ▼         ▼         ▼                       │
│       Keystream Keystream Keystream                 │
│         │         │         │                       │
│  P1 ────┤  P2 ────┤  P3 ────┤                     │
│         ▼         ▼         ▼                       │
│        XOR       XOR       XOR                      │
│         │         │         │                       │
│         ▼         ▼         ▼                       │
│        C1        C2        C3                       │
│                                                      │
│  ✓ Parallelizable (encryption and decryption)        │
│  ✓ Random access to any block                        │
│  ✓ No padding required                               │
└──────────────────────────────────────────────────────┘
```

### GCM (Galois/Counter Mode)

```
┌──────────────────────────────────────────────────────┐
│              GCM MODE (Galois/Counter)                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  CTR Mode Encryption:                                │
│  ┌────────────────────────────────────────────┐      │
│  │  Nonce + Counter → AES-ECB → Keystream    │      │
│  │  Plaintext ⊕ Keystream → Ciphertext        │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  GHASH Authentication:                               │
│  ┌────────────────────────────────────────────┐      │
│  │                                            │      │
│  │  H = AES_K(0^128)    (hash subkey)        │      │
│  │                                            │      │
│  │  GHASH(H, A, C):                          │      │
│  │  X₀ = 0                                   │      │
│  │  X₁ = (A₁ || 0^v) ⊕ X₀   (A = AAD)     │      │
│  │  X₂ = (C₁ || len₁) ⊕ X₁                 │      │
│  │  ...                                       │      │
│  │  Tag = E_K(IV) ⊕ Xₘ                       │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ✦ Provides confidentiality AND authenticity         │
│  ✦ Authentication tag: 128-bit (recommended 96-bit)  │
│  ✦ Nonce must NEVER repeat with same key!            │
│  ✦ Used in TLS 1.3, IPSec, WireGuard               │
└──────────────────────────────────────────────────────┘
```

### Mode Comparison

| Mode | Parallel | Random Access | Padding | Authentication | Security |
|------|----------|---------------|---------|----------------|----------|
| ECB | Yes | Yes | Yes | No | ❌ Weak |
| CBC | Decrypt only | No | Yes | No | ⚠ Padding issues |
| CTR | Yes | Yes | No | No | ✓ Good |
| GCM | Yes | Yes | No | Yes | ✓✓ Best |

---

## Mathematical Foundations

### Finite Field Arithmetic (GF(2⁸))

```
┌──────────────────────────────────────────────────────┐
│           GF(2⁸) Arithmetic in AES                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  AES operates in Galois Field GF(2⁸)                │
│  Polynomial: x⁸ + x⁴ + x³ + x + 1 = 0x11B        │
│                                                      │
│  Addition: XOR of polynomials                        │
│    (x² + 1) + (x + 1) = x² + x                     │
│    0x05 + 0x03 = 0x06                               │
│                                                      │
│  Multiplication:                                     │
│    a · b mod (x⁸ + x⁴ + x³ + x + 1)               │
│                                                      │
│  S-Box (SubBytes):                                   │
│    1. Multiplicative inverse in GF(2⁸)              │
│    2. Affine transformation over GF(2)              │
│                                                      │
│  Example S-Box values:                               │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐             │
│  │ 0x0 │ 0x1 │ 0x2 │ 0x3 │ 0x4 │ 0x5 │             │
│  │ 0x63│ 0x7c│ 0x77│ 0x7b│ 0xf2│ 0x6b│             │
│  └─────┴─────┴─────┴─────┴─────┴─────┘             │
└──────────────────────────────────────────────────────┘
```

### XOR Properties (Stream Ciphers)

```
┌──────────────────────────────────────────────────────┐
│              XOR Properties                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Commutative:   A ⊕ B = B ⊕ A                   │
│  2. Associative:   (A ⊕ B) ⊕ C = A ⊕ (B ⊕ C)     │
│  3. Identity:      A ⊕ 0 = A                        │
│  4. Self-inverse:  A ⊕ A = 0                        │
│                                                      │
│  Encryption: C = P ⊕ K                              │
│  Decryption: P = C ⊕ K = (P ⊕ K) ⊕ K = P          │
│                                                      │
│  ⚠ One-Time Pad (OTP):                              │
│    If K is truly random, as long as P, and          │
│    never reused → PERFECT SECURITY (Shannon)        │
│                                                      │
│  ⚠ Reused key attack:                               │
│    C₁ ⊕ C₂ = P₁ ⊕ P₂                              │
│    If P₁ known → P₂ recovered                       │
└──────────────────────────────────────────────────────┘
```

---

## Key Management

### Key Derivation

```
┌──────────────────────────────────────────────────────┐
│              KEY DERIVATION FUNCTIONS                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  PBKDF2 (Password-Based KDF):                        │
│  ┌────────────────────────────────────────────┐      │
│  │  DK = PBKDF2(PRF, Password, Salt, c, dkLen)│     │
│  │  c = iteration count (≥100,000)            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  HKDF (HMAC-based KDF) - TLS 1.3:                   │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Extract: PRK = HMAC-Hash(salt, IKM)   │      │
│  │  2. Expand:  OKM = HMAC-Hash(PRK, info)   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Argon2 (Memory-hard KDF):                           │
│  ┌────────────────────────────────────────────┐      │
│  │  Argon2d: Data-dependent memory access     │      │
│  │  Argon2i: Data-independent memory access   │      │
│  │  Argon2id: Hybrid (recommended)            │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Key Sizes and Security

| Algorithm | Recommended Key | Bits of Security | Status |
|-----------|----------------|------------------|--------|
| DES | N/A | 0 | ❌ Broken |
| 3DES | 168-bit (3×56) | 112 | ⚠ Deprecated |
| AES-128 | 128-bit | 128 | ✅ Secure |
| AES-256 | 256-bit | 256 | ✅ Secure (quantum resistant) |
| ChaCha20 | 256-bit | 256 | ✅ Secure |

---

## OpenSSL Commands

### AES Operations

```bash
# AES-256-CBC encryption
openssl enc -aes-256-cbc -salt -in plaintext.txt -out encrypted.bin -pass pass:mypassword

# AES-256-CBC with specific key and IV (hex)
openssl enc -aes-256-cbc -in plaintext.txt -out encrypted.bin \
    -K 0123456789abcdef0123456789abcdef \
    -iv 0123456789abcdef0123456789abcdef

# AES-256-GCM encryption (authenticated)
openssl enc -aes-256-gcm -salt -in plaintext.txt -out encrypted.bin -pass pass:mypassword

# Decrypt AES-256-CBC
openssl enc -aes-256-cbc -d -in encrypted.bin -out decrypted.txt -pass pass:mypassword

# List available ciphers
openssl enc -list

# AES-256-CBC with PBKDF2 key derivation
openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt \
    -in plaintext.txt -out encrypted.bin -pass pass:mypassword

# Generate random key and IV
openssl rand -hex 32   # 256-bit key
openssl rand -hex 16   # 128-bit IV
```

### ChaCha20

```bash
# ChaCha20-Poly1305 encryption
openssl enc -chacha20-poly1305 -salt -in plaintext.txt -out encrypted.bin -pass pass:mypassword

# Decrypt
openssl enc -chacha20-poly1305 -d -in encrypted.bin -out decrypted.txt -pass pass:mypassword
```

### DES and 3DES

```bash
# DES (INSECURE - for testing only)
openssl enc -des-cbc -in plaintext.txt -out encrypted.bin -pass pass:test

# 3DES
openssl enc -des-ede3-cbc -in plaintext.txt -out encrypted.bin -pass pass:test

# Verify DES is weak
openssl enc -des-cbc -d -in encrypted.bin -pass pass:test
```

---

## Practical Examples

### File Encryption Workflow

```bash
#!/bin/bash
# Secure file encryption workflow

FILE=$1
PASSPHRASE=$(read -s -p "Enter passphrase: ")

# Generate salt
SALT=$(openssl rand -hex 16)

# Derive key using PBKDF2
KEY=$(echo -n "$PASSPHRASE" | openssl dgst -sha256 -hex -passout "pass:$PASSPHRASE" | awk '{print $NF}')

# Encrypt with AES-256-GCM
openssl enc -aes-256-gcm -salt -pbkdf2 -iter 200000 \
    -in "$FILE" -out "${FILE}.enc" \
    -pass "pass:$PASSPHRASE"

echo "Encrypted: ${FILE}.enc"
echo "Salt: $SALT"

# Verify
openssl enc -aes-256-gcm -d -pbkdf2 -iter 200000 \
    -in "${FILE}.enc" -out /dev/null \
    -pass "pass:$PASSPHRASE" && echo "✓ Verification passed"
```

### Python Example

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
import os

def aes_gcm_encrypt(key: bytes, plaintext: bytes, aad: bytes = None) -> dict:
    """AES-GCM authenticated encryption."""
    nonce = os.urandom(12)
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce))
    encryptor = cipher.encryptor()

    if aad:
        encryptor.authenticate_additional_data(aad)

    ciphertext = encryptor.update(plaintext) + encryptor.finalize()

    return {
        'nonce': nonce,
        'ciphertext': ciphertext,
        'tag': encryptor.tag
    }

def aes_cbc_encrypt(key: bytes, plaintext: bytes) -> dict:
    """AES-CBC encryption with PKCS7 padding."""
    iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(plaintext) + padder.finalize()

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    return {'iv': iv, 'ciphertext': ciphertext}

# Usage
key = os.urandom(32)  # 256-bit key
message = b"Classified data"

gcm_result = aes_gcm_encrypt(key, message, b"header")
print(f"GCM Tag: {gcm_result['tag'].hex()}")
```

---

## Security Perspective

### Attack Techniques

```
┌──────────────────────────────────────────────────────┐
│              SYMMETRIC ENCRYPTION ATTACKS             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Brute Force:                                     │
│     ├─ Try all 2^n keys                             │
│     ├─ AES-128: 2^128 operations (infeasible)       │
│     └─ DES: 2^56 operations (feasible)              │
│                                                      │
│  2. Known-Plaintext Attack (KPA):                    │
│     ├─ Attacker has (P, C) pairs                     │
│     └─ Exploit weak key scheduling (DES)            │
│                                                      │
│  3. Chosen-Plaintext Attack (CPA):                   │
│     ├─ Attacker chooses plaintexts                   │
│     └─ AES is CPA-secure (IND-CPA)                  │
│                                                      │
│  4. Padding Oracle Attack:                           │
│     ├─ Exploits CBC padding validation               │
│     ├─ ~256 × block_size requests                    │
│     └─ Mitigation: Use GCM, random padding           │
│                                                      │
│  5. Sweet32 (CVE-2016-2183):                         │
│     ├─ 64-bit block collision in 3DES               │
│     └─ Mitigation: Migrate to AES                    │
│                                                      │
│  6. Biclique Attack:                                 │
│     ├─ Theoretical: 2^126.1 for AES-128             │
│     └─ Not practical (still need 2^126 ops)         │
└──────────────────────────────────────────────────────┘
```

### Defense Mechanisms

```
┌──────────────────────────────────────────────────────┐
│              DEFENSE MECHANISMS                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Use AES-256-GCM (authenticated encryption)        │
│  ✓ Never reuse nonce+key combination                  │
│  ✓ Use cryptographically secure random (CSPRNG)      │
│  ✓ Key derivation from passwords: PBKDF2/Argon2      │
│  ✓ Regular key rotation (90-180 days)                │
│  ✓ Hardware security modules (HSM) for key storage   │
│  ✓ Encrypt-then-MAC (not MAC-then-Encrypt)          │
│  ✓ Constant-time implementations                     │
│  ✓ Side-channel resistant implementations            │
└──────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Fundamental

1. **Q: What is the difference between block and stream ciphers?**
   A: Block ciphers encrypt fixed-size blocks (e.g., 128-bit); stream ciphers encrypt one byte at a time using a keystream.

2. **Q: Why is ECB mode insecure?**
   A: Identical plaintext blocks produce identical ciphertext blocks, revealing patterns. No diffusion across blocks.

3. **Q: What is the difference between AES and DES?**
   A: AES uses 128-bit blocks, variable key sizes (128/192/256), and 10-14 rounds. DES uses 64-bit blocks, 56-bit keys, and 16 rounds. DES is broken; AES is secure.

### Intermediate

4. **Q: How does CBC mode protect against pattern leakage?**
   A: Each plaintext block is XORed with the previous ciphertext block before encryption, creating diffusion across blocks.

5. **Q: Why is GCM considered superior to CBC?**
   A: GCM provides both confidentiality and integrity (authenticated encryption), is parallelizable, requires no padding, and avoids padding oracle attacks.

6. **Q: What happens if a nonce is reused in GCM?**
   A: The authentication tag security is completely compromised; an attacker can recover plaintext and forge messages.

### Advanced

7. **Q: Explain the Sweet32 attack on 3DES.**
   A: After 2^32 blocks (~32GB of data), a birthday collision occurs in the 64-bit block, allowing recovery of a plaintext block.

8. **Q: What makes ChaCha20 suitable for mobile devices?**
   A: ChaCha20 uses only simple operations (add, XOR, rotate) that are efficient on ARM processors without AES-NI hardware support.

9. **Q: How does AES-GCM differ from AES-CBC+HMAC?**
   A: GCM is a single-pass authenticated encryption mode; CBC+HMAC requires two passes and careful ordering (encrypt-then-MAC). GCM is generally faster.

---

## Hands-on Labs

### Lab 1: AES Encryption/Decryption

```bash
# Step 1: Create plaintext
echo "Top secret message" > secret.txt

# Step 2: Encrypt with AES-256-GCM
openssl enc -aes-256-gcm -salt -pbkdf2 -iter 200000 \
    -in secret.txt -out secret.enc -pass pass:StrongP@ss1

# Step 3: Verify encryption
ls -la secret.enc
xxd secret.enc | head

# Step 4: Decrypt
openssl enc -aes-256-gcm -d -pbkdf2 -iter 200000 \
    -in secret.enc -out secret_decrypted.txt -pass pass:StrongP@ss1

# Step 5: Compare
diff secret.txt secret_decrypted.txt && echo "✓ Success"
```

### Lab 2: Mode Comparison

```bash
#!/bin/bash
# Compare ECB vs CBC patterns

# Create test image (or use existing)
convert -size 100x100 xc:white \
    -fill black -draw "rectangle 10,10 50,50" \
    -fill black -draw "rectangle 60,60 90,90" \
    test.bmp

# Encrypt with ECB (insecure)
openssl enc -aes-128-ecb -in test.bmp -out test_ecb.bmp \
    -K 0123456789abcdef0123456789abcdef

# Encrypt with CBC (secure)
openssl enc -aes-128-cbc -in test.bmp -out test_cbc.bmp \
    -K 0123456789abcdef0123456789abcdef \
    -iv 0123456789abcdef0123456789abcdef

# Visual inspection shows pattern leakage in ECB
echo "ECB: Patterns visible in encrypted image"
echo "CBC: No patterns visible"
```

### Lab 3: Timing Attack Demonstration

```python
import time
import secrets

def vulnerable_compare(a: bytes, b: bytes) -> bool:
    """Vulnerable to timing attack."""
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False  # Early return leaks timing
    return True

def constant_time_compare(a: bytes, b: bytes) -> bool:
    """Constant-time comparison."""
    return secrets.compare_digest(a, b)

# Timing attack demonstration
def timing_attack():
    target = b"secret_token"
    discovered = bytearray()

    for pos in range(len(target)):
        best_time = float('inf')
        best_byte = 0

        for guess in range(256):
            candidate = bytes(discovered) + bytes([guess])
            candidate = candidate.ljust(len(target), b'\x00')

            times = []
            for _ in range(1000):
                start = time.perf_counter_ns()
                vulnerable_compare(target[:len(candidate)], candidate)
                end = time.perf_counter_ns()
                times.append(end - start)

            avg_time = sum(times) / len(times)
            if avg_time > best_time:
                best_time = avg_time
                best_byte = guess

        discovered.append(best_byte)
        print(f"Discovered byte {pos}: {best_byte:#04x}")

    return bytes(discovered)
```

---

## Summary Table

| Feature | DES | 3DES | AES-128 | AES-256 | ChaCha20 |
|---------|-----|------|---------|---------|----------|
| Key Size | 56-bit | 168-bit | 128-bit | 256-bit | 256-bit |
| Block Size | 64-bit | 64-bit | 128-bit | 128-bit | N/A |
| Rounds | 16 | 48 | 10 | 14 | 20 |
| Speed | Slow | Very Slow | Fast | Fast | Very Fast |
| Security | ❌ Broken | ⚠ Weak | ✅ Secure | ✅ Secure | ✅ Secure |
| Hardware | AES-NI | Legacy | AES-NI | AES-NI | Software |
| Status | Deprecated | Deprecated | Recommended | Recommended | Recommended |

---

## References

- NIST FIPS 197 (AES)
- NIST SP 800-38A (Block Cipher Modes)
- RFC 8439 (ChaCha20-Poly1305)
- RFC 7539 (ChaCha20-Poly1305 for TLS)
- Handbook of Applied Cryptography, Chapter 7
