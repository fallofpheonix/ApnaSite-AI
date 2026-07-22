# Asymmetric Encryption

## Layer Position in Security Model

```
┌───────────────────────────────────────────────────────┐
│                APPLICATION LAYER                       │
│           (PGP, S/MIME, Code Signing)                 │
├───────────────────────────────────────────────────────┤
│          ► ASYMMETRIC ENCRYPTION ◄                    │
│  ┌───────────────────────────────────────────────┐    │
│  │  RSA │ ECC │ ElGamal │ Diffie-Hellman │ ECDH │    │
│  └───────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────┤
│              SESSION LAYER                            │
│           (TLS Handshake, Key Exchange)               │
├───────────────────────────────────────────────────────┤
│           SYMMETRIC ENCRYPTION                        │
│           (AES-GCM, ChaCha20)                         │
├───────────────────────────────────────────────────────┤
│              NETWORK LAYER                            │
│           (IPsec IKEv2, VPN Key Exchange)             │
└───────────────────────────────────────────────────────┘
```

## Overview

Asymmetric encryption uses **key pairs**: a public key (shared) and a private key (secret). It solves the key distribution problem of symmetric encryption.

```
  Plaintext
      │
      ▼
┌─────────────────────────────────────────────┐
│                                             │
│  Sender                                    │
│  ┌─────────┐      ┌─────────┐             │
│  │ Receiver│      │ Receiver│             │
│  │ Public  │      │ Private │             │
│  │ Key     │      │ Key     │             │
│  └────┬────┘      └────┬────┘             │
│       │                │                   │
│       ▼                ▼                   │
│  ┌─────────┐      ┌─────────┐             │
│  │ENCRYPT  │      │DECRYPT  │             │
│  │(PubKey) │      │(PrivKey)│             │
│  └────┬────┘      └────┬────┘             │
│       │                │                   │
│       ▼                ▼                   │
│  Ciphertext ────────► Plaintext            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## RSA (Rivest-Shamir-Adleman)

### Key Generation

```
┌──────────────────────────────────────────────────────┐
│                  RSA KEY GENERATION                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Generate two large primes:                       │
│     p = random_prime(2048 bits)                      │
│     q = random_prime(2048 bits)                      │
│                                                      │
│  2. Compute modulus:                                  │
│     n = p × q                                        │
│     (n is 4096 bits for 2048-bit RSA)               │
│                                                      │
│  3. Compute Euler's totient:                          │
│     φ(n) = (p-1)(q-1)                                │
│                                                      │
│  4. Choose public exponent:                           │
│     e = 65537 (0x10001)                              │
│     (prime, small, efficient)                        │
│                                                      │
│  5. Compute private exponent:                         │
│     d = e⁻¹ mod φ(n)                                │
│     (modular inverse using Extended Euclidean)        │
│                                                      │
│  6. Key pair:                                         │
│     Public Key:  (n, e)                              │
│     Private Key: (n, d)                              │
│                                                      │
│  Security: Factoring n → recovering p,q → d          │
│  2048-bit RSA ≈ 112-bit security                    │
│  3072-bit RSA ≈ 128-bit security                    │
└──────────────────────────────────────────────────────┘
```

### RSA Mathematical Example

```
┌──────────────────────────────────────────────────────┐
│              RSA MATHEMATICAL EXAMPLE                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  (Small numbers for illustration)                     │
│                                                      │
│  p = 61, q = 53                                      │
│  n = 61 × 53 = 3233                                  │
│  φ(n) = (61-1)(53-1) = 3120                          │
│  e = 17                                              │
│  d = 17⁻¹ mod 3120 = 2753                            │
│                                                      │
│  Public Key:  (3233, 17)                             │
│  Private Key: (3233, 2753)                           │
│                                                      │
│  Encryption:                                         │
│    M = 65                                            │
│    C = M^e mod n = 65^17 mod 3233 = 2790            │
│                                                      │
│  Decryption:                                         │
│    M = C^d mod n = 2790^2753 mod 3233 = 65 ✓        │
│                                                      │
│  Key relationship:                                   │
│    e × d ≡ 1 mod φ(n)                               │
│    17 × 2753 = 46801 = 15 × 3120 + 1 ✓             │
└──────────────────────────────────────────────────────┘
```

### RSA Encryption and Signing

```
┌──────────────────────────────────────────────────────┐
│                RSA OPERATIONS                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ENCRYPTION:                                         │
│  ┌────────────────────────────────────────────┐      │
│  │  C = M^e mod n                             │      │
│  │  (Encrypt with public key)                 │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  DECRYPTION:                                         │
│  ┌────────────────────────────────────────────┐      │
│  │  M = C^d mod n                             │      │
│  │  (Decrypt with private key)                │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  SIGNING:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  S = Hash(M)^d mod n                       │      │
│  │  (Sign with private key)                   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  VERIFICATION:                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Hash(M) = S^e mod n                       │      │
│  │  (Verify with public key)                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ⚠ Raw RSA is deterministic:                        │
│    Same plaintext → same ciphertext                  │
│    Use OAEP padding for encryption                   │
│    Use PSS padding for signatures                    │
└──────────────────────────────────────────────────────┘
```

### RSA Padding Schemes

```
┌──────────────────────────────────────────────────────┐
│              RSA PADDING SCHEMES                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  PKCS#1 v1.5 (Legacy):                              │
│  ┌────────────────────────────────────────────┐      │
│  │ 00 02 [random padding] 00 [message]        │     │
│  │ 11+ bytes of non-zero random bytes         │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  OAEP (Optimal Asymmetric Encryption Padding):       │
│  ┌────────────────────────────────────────────┐      │
│  │                                            │      │
│  │  M' = 0x00 || label || PS || 0x01 || M    │      │
│  │  (PS = padding string of zeros)            │      │
│  │                                            │      │
│  │  r = random(20 bytes)                      │      │
│  │  G = G_hash(r, nLen-21)                    │      │
│  │  M'' = M' ⊕ G                             │      │
│  │  H = H_hash(M'', 20)                       │      │
│  │  DB = M' ⊕ H_hash(r, 20)                  │      │
│  │  EM = 0x00 || M'' || H || DB               │      │
│  │                                            │      │
│  │  C = EM^e mod n                            │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  PSS (Probabilistic Signature Scheme):               │
│  ┌────────────────────────────────────────────┐      │
│  │  M' = H Hash || salt                       │      │
│  │  H = Hash(M')                              │      │
│  │  DB = PS || 0x01 || salt                   │      │
│  │  dbMask = MGF1(H, emLen-hLen-1)           │      │
│  │  maskedDB = DB ⊕ dbMask                    │      │
│  │  EM = maskedDB || H || 0xBC                │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Elliptic Curve Cryptography (ECC)

### Mathematical Foundation

```
┌──────────────────────────────────────────────────────┐
│            ELLIPTIC CURVE MATHEMATICS                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Elliptic Curve Equation (Weierstrass form):         │
│                                                      │
│    y² = x³ + ax + b    (mod p)                      │
│                                                      │
│  where: 4a³ + 27b² ≠ 0  (no singularities)         │
│                                                      │
│                    y²                                │
│                    │         ·                       │
│                    │       ·   ·                     │
│                    │     ·       ·                   │
│                    │   ·    P     ·                  │
│                    │ ·             ·                 │
│  ─────────────────·─────────────────── x            │
│                    │                                 │
│                                                      │
│  Point Addition (P + Q = R):                         │
│  ┌────────────────────────────────────────────┐      │
│  │  If P ≠ Q:                                 │      │
│  │    λ = (y₂ - y₁)/(x₂ - x₁) mod p         │     │
│  │    x₃ = λ² - x₁ - x₂ mod p                │     │
│  │    y₃ = λ(x₁ - x₃) - y₁ mod p            │     │
│  │                                            │      │
│  │  If P = Q (point doubling):                │      │
│  │    λ = (3x₁² + a)/(2y₁) mod p             │     │
│  │    x₃ = λ² - 2x₁ mod p                    │     │
│  │    y₃ = λ(x₁ - x₃) - y₁ mod p            │     │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Scalar Multiplication:                              │
│    kP = P + P + ... + P (k times)                   │
│    Computed using double-and-add algorithm            │
│                                                      │
│  ECDLP: Given P and Q = kP, find k                   │
│  (computationally hard for large curves)             │
└──────────────────────────────────────────────────────┘
```

### Common ECC Curves

```
┌──────────────────────────────────────────────────────┐
│              ECC CURVE COMPARISON                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Curve         Bits   Security   Use Case            │
│  ──────────────────────────────────────────────────  │
│  secp256r1     256    128-bit   TLS, Bitcoin        │
│  secp384r1     384    192-bit   Government          │
│  secp521r1     521    256-bit   High security       │
│  Curve25519    255    128-bit   Signal, WireGuard   │
│  Curve448      448    224-bit   High security       │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │  Security Level Comparison:                │      │
│  │                                            │      │
│  │  ECC-256 ≈ RSA-3072                       │      │
│  │  ECC-384 ≈ RSA-7680                       │      │
│  │  ECC-521 ≈ RSA-15360                      │      │
│  │                                            │      │
│  │  ECC keys are much smaller!                │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ⚠ NIST curves (P-256, P-384) potentially          │
│    compromised by NSA backdoor concerns              │
│  ✓ Curve25519 designed for safety, audited          │
└──────────────────────────────────────────────────────┘
```

### ECC Key Exchange (ECDH)

```
┌──────────────────────────────────────────────────────┐
│              ECDH KEY EXCHANGE                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Alice                              Bob              │
│  ─────                              ───              │
│  Choose random a                    Choose random b   │
│  Compute A = aG                     Compute B = bG   │
│  (G = generator point)                              │
│                                                      │
│  Alice                              Bob              │
│  ─────                              ───              │
│  Has: (a, A)                       Has: (b, B)       │
│                                                      │
│  Exchange public keys over insecure channel          │
│                                                      │
│  Alice                              Bob              │
│  ─────                              ───              │
│  Compute S = aB                    Compute S = bA    │
│                                                      │
│  Since: aB = a(bG) = abG = b(aG) = bA              │
│                                                      │
│  Both derive same shared secret S                    │
│                                                      │
│  ⚠ Eavesdropper sees A, B, G                        │
│    Cannot compute S without a or b (ECDLP)          │
└──────────────────────────────────────────────────────┘
```

---

## Diffie-Hellman Key Exchange

### Classical DH

```
┌──────────────────────────────────────────────────────┐
│          DIFFIE-HELLMAN KEY EXCHANGE                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Public parameters: (p, g)                           │
│    p = large prime                                   │
│    g = generator (primitive root mod p)              │
│                                                      │
│  Alice                              Bob              │
│  ─────                              ───              │
│  Choose random a                   Choose random b    │
│  (1 < a < p-1)                    (1 < b < p-1)      │
│                                                      │
│  Compute A = g^a mod p            Compute B = g^b mod p│
│                                                      │
│  ────────────────────────────────────────────────────│
│  Exchange A, B over insecure channel                 │
│  ────────────────────────────────────────────────────│
│                                                      │
│  Compute K = B^a mod p           Compute K = A^b mod p│
│                                                      │
│  Since: B^a = (g^b)^a = g^(ab) = (g^a)^b = A^b     │
│                                                      │
│  Shared secret: K = g^(ab) mod p                     │
│                                                      │
│  Security: DLP (Discrete Log Problem)                │
│    Given g, p, A = g^a mod p → find a               │
│    Computationally hard for large p                  │
└──────────────────────────────────────────────────────┘
```

### DH Mathematical Example

```
┌──────────────────────────────────────────────────────┐
│          DIFFIE-HELLMAN NUMERICAL EXAMPLE             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Public parameters:                                  │
│    p = 23 (prime)                                    │
│    g = 5  (primitive root mod 23)                   │
│                                                      │
│  Alice:                                              │
│    a = 6 (private)                                  │
│    A = 5^6 mod 23 = 15625 mod 23 = 8               │
│                                                      │
│  Bob:                                                │
│    b = 15 (private)                                 │
│    B = 5^15 mod 23 = 30517578125 mod 23 = 19      │
│                                                      │
│  Shared secret:                                      │
│    Alice: K = 19^6 mod 23 = 47045881 mod 23 = 2   │
│    Bob:   K = 8^15 mod 23 = 35184372088832 mod 23 = 2│
│                                                      │
│  K = 2 ✓                                            │
│                                                      │
│  Eavesdropper knows: p=23, g=5, A=8, B=19          │
│  Must solve: 5^a ≡ 8 mod 23 → a = ?               │
│  For small p, trivial. For 2048+ bit p, infeasible │
└──────────────────────────────────────────────────────┘
```

### Diffie-Hellman Groups

| Group | Prime Size | Security | RFC |
|-------|-----------|----------|-----|
| Group 1 | 768-bit | ❌ Broken | RFC 2409 |
| Group 2 | 1024-bit | ⚠ Deprecated | RFC 2409 |
| Group 14 | 2048-bit | ✅ Secure | RFC 3526 |
| Group 15 | 3072-bit | ✅ Secure | RFC 3526 |
| Group 16 | 4096-bit | ✅ Secure | RFC 3526 |
| Group 21 | 521-bit ECC | ✅ Secure | RFC 7919 |
| Group 25 | X25519 | ✅ Secure | RFC 8446 |
| Group 32 | X448 | ✅ Secure | RFC 8446 |

---

## Digital Signatures

### Signature Process

```
┌──────────────────────────────────────────────────────┐
│              DIGITAL SIGNATURE PROCESS                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  SENDER (Signing):                                   │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Compute hash: H = Hash(Message)        │      │
│  │  2. Sign: S = Sign(PrivateKey, H)          │      │
│  │  3. Send: (Message, S, Certificate)        │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  RECEIVER (Verification):                            │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Verify certificate → extract public key│      │
│  │  2. Compute hash: H = Hash(Message)        │      │
│  │  3. Verify: Verify(PublicKey, H, S)        │      │
│  │  4. Result: Valid / Invalid                │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Properties:                                         │
│  ├─ Authentication: Only holder of private key signs │
│  ├─ Integrity: Message cannot be altered             │
│  └─ Non-repudiation: Signer cannot deny signing     │
└──────────────────────────────────────────────────────┘
```

### Signature Schemes Comparison

```
┌──────────────────────────────────────────────────────┐
│           SIGNATURE SCHEME COMPARISON                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  RSA-PSS (Recommended for RSA):                      │
│  ┌────────────────────────────────────────────┐      │
│  │  Sign:    S = (Hash(M) XOR MGF(random))   │      │
│  │              ^d mod n                       │      │
│  │  Verify:  S^e mod n == Hash(M) XOR MGF(?)  │     │
│  │  Security: EU-CMA (existential unforgeability)│    │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ECDSA (Elliptic Curve DSA):                         │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Choose random k                        │      │
│  │  2. Compute (x₁, y₁) = kG                │      │
│  │  3. r = x₁ mod n                           │      │
│  │  4. s = k⁻¹(Hash(M) + r·d) mod n          │     │
│  │  5. Signature: (r, s)                      │      │
│  │  ⚠ Requires secure random k!               │      │
│  │  ⚠ Nonce reuse leaks private key!          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  EdDSA (Ed25519/Ed448):                              │
│  ┌────────────────────────────────────────────┐      │
│  │  ✓ Deterministic nonce (no random needed)  │      │
│  │  ✓ Faster than ECDSA                       │      │
│  │  ✓ Resistant to side-channel attacks       │      │
│  │  ✓ Used in Signal, SSH, Tor                │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## Performance Comparison

```
┌──────────────────────────────────────────────────────┐
│           PERFORMANCE COMPARISON (2048-bit)           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Operation          │ RSA-2048  │ ECC-256 │ Ratio   │
│  ────────────────────────────────────────────────────│
│  Key Generation     │ ~500ms    │ ~1ms    │ 500x    │
│  Encryption         │ ~0.3ms    │ ~5ms    │ 0.06x   │
│  Decryption         │ ~10ms     │ ~3ms    │ 3x      │
│  Signing            │ ~10ms     │ ~3ms    │ 3x      │
│  Verification       │ ~0.3ms    │ ~8ms    │ 0.04x   │
│  Key Size (public)  │ 256 bytes │ 32 bytes│ 8x      │
│  Key Size (private) │ 256 bytes │ 32 bytes│ 8x      │
│  Signature Size     │ 256 bytes │ 64 bytes│ 4x      │
│                                                      │
│  ⚡ ECC is significantly faster for most operations  │
│  ⚡ ECC keys are much smaller (bandwidth savings)    │
│  ⚠ RSA encryption is faster than ECC               │
│  ⚠ RSA is better for encryption (vs signing)        │
└──────────────────────────────────────────────────────┘
```

### Security Level vs Key Size

| Security (bits) | RSA Key | ECC Key | Symmetric Key |
|-----------------|---------|---------|---------------|
| 80 | 1024 | 160 | 80 |
| 112 | 2048 | 224 | 112 |
| 128 | 3072 | 256 | 128 |
| 192 | 7680 | 384 | 192 |
| 256 | 15360 | 521 | 256 |

---

## OpenSSL Commands

### RSA Operations

```bash
# Generate RSA 2048-bit key pair
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
    -out private_key.pem

# Extract public key
openssl rsa -pubout -in private_key.pem -out public_key.pem

# View key details
openssl rsa -in private_key.pem -text -noout

# Generate with traditional command
openssl genrsa -aes256 -out private_key.pem 2048

# RSA encrypt/decrypt
echo -n "Hello" | openssl rsautl -encrypt -pubin \
    -inkey public_key.pem | base64

# RSA sign/verify
openssl dgst -sha256 -sign private_key.pem -out sig.bin message.txt
openssl dgst -sha256 -verify public_key.pem -signature sig.bin message.txt
```

### ECC Operations

```bash
# Generate ECC key pair (Curve25519)
openssl genpkey -algorithm X25519 -out x25519_private.pem

# Generate ECDSA key (P-256)
openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem

# Extract EC public key
openssl ec -in ec_private.pem -pubout -out ec_public.pem

# View EC key details
openssl ec -in ec_private.pem -text -noout

# ECDSA sign
openssl dgst -sha256 -sign ec_private.pem -out ec_sig.bin message.txt

# ECDSA verify
openssl dgst -sha256 -verify ec_public.pem -signature ec_sig.bin message.txt
```

### Diffie-Hellman

```bash
# Generate DH parameters (2048-bit)
openssl dhparam -out dhparams.pem 2048

# View DH parameters
openssl dhparam -in dhparams.pem -text -noout

# Generate DH key pair
openssl genpkey -paramfile dhparams.pem -out dh_private.pem

# Extract DH public key
openssl pkey -in dh_private.pem -pubout -out dh_public.pem
```

---

## Practical Examples

### Python RSA Example

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend

# Key generation
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
public_key = private_key.public_key()

# Encryption
ciphertext = public_key.encrypt(
    b"Secret message",
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Decryption
plaintext = private_key.decrypt(
    ciphertext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Signing
signature = private_key.sign(
    b"Message to sign",
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)

# Verification
try:
    public_key.verify(
        signature,
        b"Message to sign",
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    print("Signature valid")
except Exception:
    print("Signature invalid")
```

### Python ECC Example

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes

# Key generation
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# ECDH key exchange
other_private_key = ec.generate_private_key(ec.SECP256R1())
shared_secret = private_key.exchange(ec.ECDH(), other_private_key.public_key())

# ECDSA signing
signature = private_key.sign(
    b"Message to sign",
    ec.ECDSA(hashes.SHA256())
)

# Verification
try:
    public_key.verify(
        signature,
        b"Message to sign",
        ec.ECDSA(hashes.SHA256())
    )
    print("Signature valid")
except Exception:
    print("Signature invalid")
```

---

## Security Perspective

### Attack Techniques

```
┌──────────────────────────────────────────────────────┐
│           ASYMMETRIC ENCRYPTION ATTACKS               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. RSA Factoring Attacks:                           │
│     ├─ General Number Field Sieve (GNFS)            │
│     │   Best known algorithm for factoring          │
│     │   2048-bit: ~2^112 operations                 │
│     ├─ Special Number Field Sieve (SNFS)            │
│     │   Applies to special form numbers             │
│     └─ Quantum: Shor's algorithm (2048-bit in hours)│
│                                                      │
│  2. RSA Small Exponent Attacks:                      │
│     ├─ Wiener Attack: Small d (private exponent)    │
│     ├─ Coppersmith Attack: Small e, same message    │
│     └─ Håstad's Broadcast Attack: Same msg, multi   │
│                                                      │
│  3. ECC Attacks:                                     │
│     ├─ Pollard's Rho: O(√n) for ECDLP              │
│     │   256-bit ECC: ~2^128 operations              │
│     ├─ Invalid Curve Attack: Inject invalid points  │
│     └─ Twist Attacks: Target weak curve twists      │
│                                                      │
│  4. Side-Channel Attacks:                            │
│     ├─ Timing attacks on RSA/ECC                    │
│     ├─ Power analysis (SPA, DPA)                    │
│     └─ Fault injection (Bellcore attack)            │
│                                                      │
│  5. Implementation Flaws:                            │
│     ├─ Key reuse with different parameters          │
│     ├─ Insufficient randomness in nonce             │
│     └─ Padding oracle attacks                       │
└──────────────────────────────────────────────────────┘
```

### Defense Mechanisms

```
┌──────────────────────────────────────────────────────┐
│              DEFENSE MECHANISMS                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Use RSA-3072+ or ECC-256+                        │
│  ✓ Prefer Curve25519/Ed25519 over NIST curves       │
│  ✓ Use OAEP for encryption, PSS for signatures      │
│  ✓ Constant-time implementations                    │
│  ✓ Secure random number generation (CSPRNG)         │
│  ✓ Key validation (check point on curve)            │
│  ✓ Rotate keys regularly (1-2 years)                │
│  ✓ Use hybrid encryption (RSA/ECDH + AES)          │
│  ✓ Post-quantum: Prepare for migration              │
└──────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Fundamental

1. **Q: What is the difference between symmetric and asymmetric encryption?**
   A: Symmetric uses one shared key; asymmetric uses a key pair (public/private). Asymmetric solves key distribution but is slower.

2. **Q: Why is RSA encryption deterministic without padding?**
   A: Same plaintext always produces same ciphertext, enabling chosen-plaintext attacks. OAEP padding adds randomness.

3. **Q: What makes ECC more efficient than RSA?**
   A: ECC achieves equivalent security with smaller keys (256-bit ECC ≈ 3072-bit RSA), enabling faster operations and smaller bandwidth.

### Intermediate

4. **Q: How does Diffie-Hellman key exchange work?**
   A: Each party generates a private/public key pair using discrete log. They exchange public keys. Each computes shared secret using their private key and other's public key: g^(ab) mod p.

5. **Q: Why is EdDSA preferred over ECDSA?**
   A: EdDSA uses deterministic nonces (no CSPRNG needed), is faster, has constant-time operations, and is resistant to nonce-reuse attacks.

6. **Q: What is the difference between encryption and signing?**
   A: Encryption: anyone can encrypt with public key, only private key holder decrypts. Signing: only private key holder signs, anyone verifies with public key.

### Advanced

7. **Q: Explain the Chinese Remainder Theorem optimization in RSA.**
   A: CRT computes decryption using p and q separately: M₁ = C^dp mod p, M₂ = C^dq mod q, then combines. Speeds up decryption by ~4x.

8. **Q: What is the impact of quantum computing on RSA/ECC?**
   A: Shor's algorithm can factor large integers (breaking RSA) and solve discrete log (breaking ECC) in polynomial time, making current asymmetric crypto insecure.

9. **Q: How do you mitigate timing attacks on RSA?**
   A: Use constant-time modular exponentiation (Montgomery multiplication), blinding (multiply by random r^e before exponentiation), and side-channel resistant libraries.

---

## Hands-on Labs

### Lab 1: RSA Key Generation and Encryption

```bash
# Step 1: Generate RSA key pair
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
    -out rsa_private.pem

# Step 2: Extract public key
openssl rsa -pubout -in rsa_private.pem -out rsa_public.pem

# Step 3: Encrypt a message
echo "Top secret message" > message.txt
openssl rsautl -encrypt -pubin -inkey rsa_public.pem \
    -in message.txt -out message.enc

# Step 4: Decrypt
openssl rsautl -decrypt -inkey rsa_private.pem \
    -in message.enc -out message_decrypted.txt

# Step 5: Verify
cat message_decrypted.txt
```

### Lab 2: ECC Signing

```bash
# Step 1: Generate ECDSA key pair
openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem

# Step 2: Sign a document
openssl dgst -sha256 -sign ec_private.pem -out signature.bin document.txt

# Step 3: Verify signature
openssl dgst -sha256 -verify ec_public.pem -signature signature.bin document.txt

# Step 4: Tamper with document and verify
echo "tampered" >> document.txt
openssl dgst -sha256 -verify ec_public.pem -signature signature.bin document.txt
# Should fail
```

### Lab 3: Diffie-Hellman Key Exchange Simulation

```python
from cryptography.hazmat.primitives.asymmetric import dh
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import os

# Generate DH parameters
parameters = dh.generate_parameters(generator=2, key_size=2048)

# Alice
alice_private_key = parameters.generate_private_key()
alice_public_key = alice_private_key.public_key()

# Bob
bob_private_key = parameters.generate_private_key()
bob_public_key = bob_private_key.public_key()

# Key exchange
alice_shared_key = alice_private_key.exchange(bob_public_key)
bob_shared_key = bob_private_key.exchange(alice_public_key)

# Derive symmetric key
def derive_key(shared_key):
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"shared-key",
    ).derive(shared_key)

alice_symmetric = derive_key(alice_shared_key)
bob_symmetric = derive_key(bob_shared_key)

assert alice_symmetric == bob_symmetric
print(f"Shared key: {alice_symmetric.hex()}")
```

---

## Summary Table

| Feature | RSA | ECC | DH | ECDH | EdDSA |
|---------|-----|-----|-----|------|-------|
| Key Size | 2048+ | 256+ | 2048+ | 256+ | 256+ |
| Speed | Slow | Fast | Slow | Fast | Fastest |
| Encryption | ✅ | ✅ | ❌ | ❌ | ❌ |
| Signing | ✅ | ✅ | ❌ | ❌ | ✅ |
| Key Exchange | ✅ | ✅ | ✅ | ✅ | ❌ |
| Quantum Resistant | ❌ | ❌ | ❌ | ❌ | ❌ |
| Status | Legacy | Recommended | Legacy | Recommended | Recommended |

---

## References

- RFC 8017 (RSA PKCS#1 v2.2)
- RFC 7748 (Elliptic Curve Diffie-Hellman)
- NIST SP 800-56B (RSA Key Transport)
- SEC 2: Recommended Elliptic Curve Domain Parameters
- Handbook of Applied Cryptography, Chapter 8
