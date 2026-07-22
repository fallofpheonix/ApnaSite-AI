# Hashing

## Layer Position in Security Model

```
┌───────────────────────────────────────────────────────┐
│                APPLICATION LAYER                       │
│        (Code Signing, File Integrity, Passwords)      │
├───────────────────────────────────────────────────────┤
│           ► HASHING FUNCTIONS ◄                       │
│  ┌───────────────────────────────────────────────┐    │
│  │  MD5 │ SHA-1 │ SHA-256 │ SHA-3 │ bcrypt      │    │
│  └───────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────┤
│              SESSION LAYER                            │
│        (HMAC, TLS Handshake, Key Derivation)         │
├───────────────────────────────────────────────────────┤
│           DIGITAL SIGNATURES                          │
│        (RSA-PSS, ECDSA, EdDSA)                       │
├───────────────────────────────────────────────────────┤
│              STORAGE LAYER                            │
│        (Password Hashing, Checksums)                  │
└───────────────────────────────────────────────────────┘
```

## Overview

A hash function maps arbitrary-size input to fixed-size output. It is a one-way function used for integrity verification, password storage, digital signatures, and data structures.

```
  Input (any size)
      │
      │  "Hello, World!"
      │
      ▼
┌─────────────────┐
│                 │
│   HASH FUNCTION │
│   H(x)          │
│                 │
└────────┬────────┘
         │
         │  Fixed-size output
         ▼
┌─────────────────────────────────────────────────┐
│  "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f" │
└─────────────────────────────────────────────────┘
         (256-bit / 64 hex characters)
```

---

## Hash Functions

### MD5 (Message Digest 5)

```
┌──────────────────────────────────────────────────────┐
│                    MD5 STRUCTURE                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Input: Message M (arbitrary length)                 │
│  Output: 128-bit hash (16 bytes, 32 hex chars)      │
│                                                      │
│  Padding:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  M || 1 || 0...0 || [64-bit length]        │     │
│  │  Pad to multiple of 512 bits               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Processing: 512-bit blocks                          │
│  ┌────────────────────────────────────────────┐      │
│  │  Initialize: A=0x67452301, B=0xEFCDAB89   │      │
│  │             C=0x98BADCFE, D=0x10325476    │      │
│  │                                            │      │
│  │  4 rounds of 16 operations each:           │      │
│  │  Round 1: F(B,C,D) = (B∧C) ∨ (¬B∧D)     │      │
│  │  Round 2: G(B,C,D) = (B∧D) ∨ (C∧¬D)     │      │
│  │  Round 3: H(B,C,D) = B ⊕ C ⊕ D          │      │
│  │  Round 4: I(B,C,D) = C ⊕ (B ∨ ¬D)       │      │
│  │                                            │      │
│  │  Each round: a = b + ((a + F(b,c,d) + X[k] + t[i]) <<< s) │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Output: A || B || C || D (128 bits)                │
│                                                      │
│  ⚠ BROKEN: Collision found in <2^18 operations     │
│  ⚠ Used in: File checksums (legacy only)            │
└──────────────────────────────────────────────────────┘
```

### SHA-1 (Secure Hash Algorithm 1)

```
┌──────────────────────────────────────────────────────┐
│                   SHA-1 STRUCTURE                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Input: Message M (arbitrary length)                 │
│  Output: 160-bit hash (20 bytes, 40 hex chars)      │
│                                                      │
│  Block size: 512 bits                                │
│  Rounds: 80                                          │
│                                                      │
│  Padding:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  M || 1 || 0...0 || [64-bit length]        │     │
│  │  Pad to multiple of 512 bits               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Initialization:                                     │
│  H₀ = 0x67452301                                    │
│  H₁ = 0xEFCDAB89                                    │
│  H₂ = 0x98BADCFE                                    │
│  H₃ = 0x10325476                                    │
│  H₄ = 0xC3D2E1F0                                    │
│                                                      │
│  80 rounds:                                          │
│  ┌────────────────────────────────────────────┐      │
│  │  For t = 0 to 15: W[t] = block[t]          │      │
│  │  For t = 16 to 79:                         │      │
│  │    W[t] = (W[t-3] ⊕ W[t-8] ⊕ W[t-14]    │      │
│  │           ⊕ W[t-16]) <<< 1                │      │
│  │                                            │      │
│  │  Ch(B,C,D) = (B ∧ C) ⊕ (¬B ∧ D)         │      │
│  │  Maj(B,C,D) = (A ∧ B) ⊕ (A ∧ C) ⊕ (B ∧ C)│
│  │  Parity(B,C,D) = A ⊕ B ⊕ C               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ⚠ BROKEN: SHAttered attack (2017, Google/CWI)     │
│  ⚠ Collision cost: ~$110K on AWS                    │
│  ⚠ Removed from TLS 1.3, SSH                       │
└──────────────────────────────────────────────────────┘
```

### SHA-2 Family

```
┌──────────────────────────────────────────────────────┐
│                 SHA-2 FAMILY                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  SHA-256:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Output: 256 bits (32 bytes)               │      │
│  │  Block size: 512 bits                       │      │
│  │  Rounds: 64                                 │      │
│  │  Security: 128-bit                          │      │
│  │                                            │      │
│  │  K = {0x428a2f98, 0x71374491, ...} (64 constants)│
│  │  H = {0x6a09e667, 0xbb67ae85, ...} (8 init values)│
│  │                                            │      │
│  │  Σ₀(x) = ROTR²(x) ⊕ ROTR¹³(x) ⊕ ROTR²²(x)│
│  │  Σ₁(x) = ROTR⁶(x) ⊕ ROTR¹¹(x) ⊕ ROTR²⁵(x)│
│  │  σ₀(x) = ROTR⁷(x) ⊕ ROTR¹⁸(x) ⊕ SHR³(x)│
│  │  σ₁(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)│
│  └────────────────────────────────────────────┘      │
│                                                      │
│  SHA-384:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Output: 384 bits                           │      │
│  │  Block size: 1024 bits                      │      │
│  │  Rounds: 80                                 │      │
│  │  Security: 192-bit                          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  SHA-512:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  Output: 512 bits                           │      │
│  │  Block size: 1024 bits                      │      │
│  │  Rounds: 80                                 │      │
│  │  Security: 256-bit                          │      │
│  │  Note: Uses 80-bit words (vs 32 for SHA-256)│     │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  SHA-512/256:                                        │
│  ┌────────────────────────────────────────────┐      │
│  │  SHA-512 truncated to 256 bits             │      │
│  │  Faster than SHA-256 on 64-bit systems     │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ✅ All SHA-2 variants currently secure              │
└──────────────────────────────────────────────────────┘
```

### SHA-3 (Keccak)

```
┌──────────────────────────────────────────────────────┐
│                 SHA-3 (KECCAK)                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Sponge Construction:                                │
│  ┌────────────────────────────────────────────┐      │
│  │                                            │      │
│  │  ┌─────────────────────────────────┐       │      │
│  │  │         ABSORBING PHASE         │       │      │
│  │  │                                 │       │      │
│  │  │  Input blocks ──► Sponge ──► State│      │      │
│  │  │  (rate r bits)    (b bits)      │       │      │
│  │  │                                 │       │      │
│  │  └─────────────────────────────────┘       │      │
│  │           │                                │      │
│  │           ▼                                │      │
│  │  ┌─────────────────────────────────┐       │      │
│  │  │         SQUEEZING PHASE         │       │      │
│  │  │                                 │       │      │
│  │  │  Sponge ──► Output blocks       │       │      │
│  │  │  (capacity c = b - r)           │       │      │
│  │  │                                 │       │      │
│  │  └─────────────────────────────────┘       │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Keccak-f[1600] permutation:                         │
│  ┌────────────────────────────────────────────┐      │
│  │  State: 5×5 array of 64-bit words         │      │
│  │  b = 1600 bits (5 × 5 × 64)               │      │
│  │                                            │      │
│  │  5 steps per round (24 rounds):            │      │
│  │  1. θ (theta): Column parity mixing        │      │
│  │  2. ρ (rho): Bitwise rotation              │      │
│  │  3. π (pi): Lane permutation               │      │
│  │  4. χ (chi): Non-linear mixing             │      │
│  │  5. ι (iota): Round constant addition      │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  SHA-3 Variants:                                     │
│  ├─ SHA3-224: 224-bit output, r=1152, c=448        │
│  ├─ SHA3-256: 256-bit output, r=1088, c=512        │
│  ├─ SHA3-384: 384-bit output, r=832, c=768         │
│  └─ SHA3-512: 512-bit output, r=576, c=1024        │
│                                                      │
│  ✅ Resistant to length extension attacks            │
│  ✅ Different construction from SHA-2 (diversity)   │
│  ✅ NIST standard since 2015                        │
└──────────────────────────────────────────────────────┘
```

---

## HMAC (Hash-based Message Authentication Code)

```
┌──────────────────────────────────────────────────────┐
│                  HMAC STRUCTURE                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  HMAC(K, M) = H((K' ⊕ opad) || H((K' ⊕ ipad) || M))│
│                                                      │
│  Where:                                              │
│  ├─ K' = K padded/hashed to block size               │
│  ├─ ipad = 0x36 repeated                             │
│  ├─ opad = 0x5c repeated                             │
│  └─ H = hash function (SHA-256, etc.)               │
│                                                      │
│  Process:                                            │
│  ┌────────────────────────────────────────────┐      │
│  │  1. If |K| > block_size, K' = H(K)        │      │
│  │     Else K' = K padded with zeros          │      │
│  │                                            │      │
│  │  2. Inner hash: H((K' ⊕ ipad) || M)       │      │
│  │                                            │      │
│  │  3. Outer hash: H((K' ⊕ opad) || inner)   │      │
│  │                                            │      │
│  │  Output: HMAC value (output size = hash)   │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Properties:                                         │
│  ├─ Security based on hash function properties       │
│  ├─ Resistant to length extension attacks            │
│  ├─ Provably secure if underlying compression       │
│  │   function is a PRF                               │
│  └─ Used in: TLS, IPSec, SSH, API auth              │
│                                                      │
│  ⚠ Timing attacks: Use constant-time comparison     │
└──────────────────────────────────────────────────────┘
```

### HMAC Applications

```
┌──────────────────────────────────────────────────────┐
│              HMAC USE CASES                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. API Authentication:                              │
│     ├─ HMAC-SHA256(api_secret, timestamp + method + url)│
│     ├─ Signature in header                           │
│     └─ Server recomputes and compares                │
│                                                      │
│  2. TLS Record MAC:                                  │
│     ├─ HMAC-SHA256 in TLS 1.2                        │
│     ├─ Poly1305 in TLS 1.3 (ChaCha20)               │
│     └─ Prevents record tampering                     │
│                                                      │
│  3. Key Derivation:                                  │
│     ├─ HKDF = HMAC-based Extract-and-Expand KDF     │
│     └─ Used in TLS 1.3 key schedule                  │
│                                                      │
│  4. Webhook Verification:                            │
│     ├─ GitHub: X-Hub-Signature = HMAC-SHA1          │
│     ├─ Stripe: Stripe-Signature = HMAC-SHA256       │
│     └─ Verify payload integrity                      │
│                                                      │
│  5. Token Generation:                                │
│     ├─ JWT: HMAC-SHA256(header + "." + payload)      │
│     └─ Session tokens                                │
└──────────────────────────────────────────────────────┘
```

---

## Password Hashing

### Why Not Regular Hashes for Passwords?

```
┌──────────────────────────────────────────────────────┐
│           PASSWORD HASHING PROBLEM                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Bad: Plain SHA-256(password)                        │
│  ┌────────────────────────────────────────────┐      │
│  │  Password: "password123"                   │      │
│  │  SHA-256: ef92b778bafe771e89245b89ecbc08a4│      │
│  │           4a428f2b43e2d8a5f75d51f25a3b8f4b│      │
│  │                                            │      │
│  │  Problems:                                 │      │
│  │  ├─ Too fast: Billions of hashes/sec       │      │
│  │  ├─ No salt: Same password → same hash     │      │
│  │  ├─ Rainbow table attacks                  │      │
│  │  └─ No key stretching                      │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Good: Password hash function                       │
│  ┌────────────────────────────────────────────┐      │
│  │  ├─ Slow by design (key stretching)        │      │
│  │  ├─ Salted (unique per password)           │      │
│  │  ├─ Memory-hard (resistant to GPU/ASIC)    │      │
│  │  └─ Adaptive (can increase cost over time) │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### bcrypt

```
┌──────────────────────────────────────────────────────┐
│                    bcrypt                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Based on Blowfish block cipher                      │
│                                                      │
│  Format: $2b$cost$salt+hash                          │
│  Example: $2b$12$LJ3m4ys3LhdoQ5zKk4N8Gu4uL9v4S7Hw │
│           │││ │                                      │
│           │││ └─ 22-char salt + 31-char hash         │
│           ││└─ Cost factor (2^12 = 4096 iterations)  │
│           │└─ Version (b = Blowfish)                 │
│           └─ Algorithm identifier                    │
│                                                      │
│  Algorithm:                                          │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Expand key schedule using salt          │      │
│  │  2. Perform 2^cost rounds of encryption    │      │
│  │  3. Each round uses XOR, substitution,      │      │
│  │     and key-dependent permutation           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Properties:                                         │
│  ├─ Adaptive cost (increase over time)              │
│  ├─ Salted (16 bytes random)                        │
│  ├─ 72-byte password limit                          │
│  └─ Output: 60 characters                           │
│                                                      │
│  Cost Factor Selection:                              │
│  ├─ Cost 12: ~250ms (recommended minimum)           │
│  ├─ Cost 14: ~1.5s                                  │
│  └─ Adjust to hardware speed                        │
└──────────────────────────────────────────────────────┘
```

### scrypt

```
┌──────────────────────────────────────────────────────┐
│                    scrypt                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Memory-hard key derivation function                 │
│                                                      │
│  scrypt(password, salt, N, r, p, dkLen)             │
│                                                      │
│  Parameters:                                         │
│  ├─ N: CPU/memory cost parameter (power of 2)       │
│  ├─ r: Block size (8 typical)                       │
│  ├─ p: Parallelization factor (1 typical)           │
│  └─ dkLen: Derived key length                        │
│                                                      │
│  Algorithm:                                          │
│  ┌────────────────────────────────────────────┐      │
│  │  1. PBKDF2-SHA256 for initial key          │      │
│  │  2. ROMix: Memory-hard mixing function     │      │
│  │     ├─ Fill B[0..N-1] using BlockMix       │      │
│  │     ├─ For i = 0 to N-1:                   │      │
│  │     │   j = Integerify(B[i]) mod N         │      │
│  │     │   B[i] = B[i] ⊕ B[j]               │      │
│  │     └─ Output: B[N-1]                      │      │
│  │  3. PBKDF2-SHA256 for final key            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Memory Usage: N × 128 × r bytes                    │
│  Example: N=2^20, r=8 → 1 GB                       │
│                                                      │
│  ✅ Resistant to GPU/ASIC attacks                    │
│  ✅ Used in Litecoin, Tresorit, Keybase             │
└──────────────────────────────────────────────────────┘
```

### Argon2

```
┌──────────────────────────────────────────────────────┐
│                    Argon2                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Winner of Password Hashing Competition (2015)       │
│                                                      │
│  Variants:                                           │
│  ├─ Argon2d: Data-dependent memory access           │
│  │   └─ Resistant to GPU cracking                   │
│  ├─ Argon2i: Data-independent memory access         │
│  │   └─ Resistant to side-channel attacks           │
│  └─ Argon2id: Hybrid (RECOMMENDED)                  │
│      └─ First pass: Argon2i, rest: Argon2d          │
│                                                      │
│  Parameters:                                         │
│  ├─ Time cost (t): Number of iterations             │
│  ├─ Memory cost (m): Memory usage in KB             │
│  ├─ Parallelism (p): Number of threads              │
│  └─ Salt: 16 bytes (minimum)                        │
│                                                      │
│  Algorithm:                                          │
│  ┌────────────────────────────────────────────┐      │
│  │  1. H₀ = Argon2_hash(P, S, T, m, p, tag)  │      │
│  │  2. Generate initial blocks B[0..p-1]      │      │
│  │  3. For each pass:                         │      │
│  │     For each lane:                         │      │
│  │       For each column:                     │      │
│  │         Compute pseudo-random index j      │      │
│  │         B[i][j] = G(B[i][j], B[i'][j'])  │      │
│  │         (G is mixing function)             │      │
│  │  4. XOR all final blocks                   │      │
│  │  5. Output: hash                           │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Recommended Parameters (2024):                      │
│  ├─ Interactive login: m=64MB, t=2, p=4            │
│  ├─ Server-side: m=256MB, t=3, p=4                 │
│  └─ Cold storage: m=1GB, t=4, p=4                  │
│                                                      │
│  ✅ Memory-hard (ASIC/GPU resistant)                │
│  ✅ Parallelizable                                   │
│  ✅ Winner of PHC                                    │
└──────────────────────────────────────────────────────┘
```

### Password Hashing Comparison

| Feature | bcrypt | scrypt | Argon2id |
|---------|--------|--------|----------|
| Year | 1999 | 2009 | 2015 |
| Memory Hard | ❌ | ✅ | ✅ |
| GPU Resistant | Partial | ✅ | ✅ |
| ASIC Resistant | Partial | ✅ | ✅ |
| Side-Channel | ✅ | ❌ | ✅ |
| Adaptive | ✅ | ✅ | ✅ |
| Recommendation | Legacy | Good | Best |

---

## Rainbow Tables

### How Rainbow Tables Work

```
┌──────────────────────────────────────────────────────┐
│              RAINBOW TABLE ATTACK                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Pre-computation phase (offline):                    │
│  ┌────────────────────────────────────────────┐      │
│  │                                            │      │
│  │  Chain: hash → reduce → hash → reduce ...  │      │
│  │                                            │      │
│  │  P₁ ──H──► H₁ ──R₁──► P₂ ──H──► H₂ ──R₂──► P₃│
│  │  │                                        │   │  │
│  │  │  Store only P₁ and P₃ (chain endpoints)│  │  │
│  │  │                                        │   │  │
│  │  └────────────────────────────────────────┘   │  │
│  │                                            │   │  │
│  │  Table structure:                           │      │
│  │  ┌─────────┬─────────┐                     │      │
│  │  │ Start   │ End     │                     │      │
│  │  ├─────────┼─────────┤                     │      │
│  │  │ P₁      │ P₃      │                     │      │
│  │  │ P₄      │ P₇      │                     │      │
│  │  │ ...     │ ...     │                     │      │
│  │  └─────────┴─────────┘                     │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Attack phase (online):                              │
│  ┌────────────────────────────────────────────┐      │
│  │  Given hash H:                             │      │
│  │  1. Try reducing H directly (k=0)         │      │
│  │  2. Try H₂ → R₂ → H₁ → R₁ (k=1)        │      │
│  │  3. Try for k = n to 1                     │      │
│  │  4. For each candidate:                     │      │
│  │     Hash the candidate and compare         │      │
│  │  5. If match found: password recovered!    │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Space-Time Tradeoff:                                │
│  ├─ Small table: Fast lookup, more computation      │
│  ├─ Large table: Slow lookup, less computation      │
│  └─ Rainbow tables: Optimal balance                 │
│                                                      │
│  ⚠ Defeated by salt!                                │
│     Salt makes rainbow tables infeasible             │
└──────────────────────────────────────────────────────┘
```

### Rainbow Table Size

| Password Length | Charset | Table Size | Time to Generate |
|----------------|---------|------------|------------------|
| 1-6 | [a-z0-9] | 2.4 GB | 3 min |
| 1-7 | [a-z0-9] | 15 GB | 20 min |
| 1-8 | [a-z0-9] | 88 GB | 2 hours |
| 1-9 | [a-z0-9] | 520 GB | 12 hours |
| 1-10 | [a-z0-9] | 3 TB | 3 days |

---

## Collision Attacks

### Birthday Attack

```
┌──────────────────────────────────────────────────────┐
│                BIRTHDAY ATTACK                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Birthday Paradox:                                   │
│  For n-bit hash, collision expected after ~2^(n/2)  │
│  operations (not 2^n as intuition suggests)          │
│                                                      │
│  Algorithm:                                          │
│  ┌────────────────────────────────────────────┐      │
│  │  1. Generate random messages M₁, M₂, ...  │      │
│  │  2. Hash each: H(Mᵢ)                      │      │
│  │  3. Store (H(Mᵢ), Mᵢ) in hash table      │      │
│  │  4. When duplicate hash found:             │      │
│  │     Collision: M₁ ≠ M₂ but H(M₁) = H(M₂)│      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Complexity:                                         │
│  ├─ MD5: 2^64 operations (found in seconds)         │
│  ├─ SHA-1: 2^80 operations (SHAttered: 2^63)       │
│  ├─ SHA-256: 2^128 operations (infeasible)          │
│  └─ SHA-3-256: 2^128 operations (infeasible)        │
│                                                      │
│  Collision vs Preimage:                              │
│  ├─ Collision: Find any M₁, M₂ where H(M₁) = H(M₂)│
│  ├─ Second preimage: Given M₁, find M₂ where       │
│  │   H(M₁) = H(M₂)                                 │
│  └─ Preimage: Given H, find M where H(M) = H       │
└──────────────────────────────────────────────────────┘
```

### Real-World Collision Attacks

```
┌──────────────────────────────────────────────────────┐
│           REAL-WORLD HASH ATTACKS                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  MD5 Collisions:                                     │
│  ├─ 2004: Wang et al. (first practical attack)      │
│  ├─ 2008: Sotirov et al. (Rogue CA certificate)    │
│  │   └─ Used MD5 collision to forge SSL cert        │
│  ├─ 2012: Flame malware (MD5 prefix collision)      │
│  │   └─ Forged Microsoft code signing certificate   │
│  └─ 2019: chosen-prefix collision in 2^39 ops      │
│                                                      │
│  SHA-1 Collisions:                                   │
│  ├─ 2017: SHAttered (Google/CWI)                    │
│  │   ├─ First practical SHA-1 collision             │
│  │   ├─ Two different PDFs with same SHA-1          │
│  │   └─ Cost: ~$110K on AWS cloud                   │
│  ├─ 2020: chosen-prefix collision (Leurent/Peyrin)  │
│  │   └─ Cost: ~$45K on GPU cluster                 │
│  └─ Impact: TLS, SSH, PGP/GPG, code signing        │
│                                                      │
│  Practical Attacks:                                  │
│  ├─ Certificate forgery                              │
│  ├─ Software supply chain (code signing)            │
│  ├─ Document authentication bypass                  │
│  └─ Git commit forgery                               │
│                                                      │
│  Defenses:                                           │
│  ├─ Migrate to SHA-256+                              │
│  ├─ Use collision-resistant hashes for signatures    │
│  └─ Prefix with random nonce for domain separation   │
└──────────────────────────────────────────────────────┘
```

---

## OpenSSL Commands

### Hashing Operations

```bash
# MD5 (INSECURE - for verification only)
echo -n "Hello" | openssl dgst -md5

# SHA-1 (INSECURE)
echo -n "Hello" | openssl dgst -sha1

# SHA-256 (RECOMMENDED)
echo -n "Hello" | openssl dgst -sha256

# SHA-3
echo -n "Hello" | openssl dgst -sha3-256

# Hash a file
openssl dgst -sha256 file.txt

# Compare hashes
echo -n "password" | openssl dgst -sha256 | awk '{print $NF}'
```

### HMAC Operations

```bash
# HMAC-SHA256
echo -n "message" | openssl dgst -sha256 -hmac "secret_key"

# HMAC with binary key
echo -n "message" | openssl dgst -sha256 \
    -mac HMAC -macopt hexkey:0123456789abcdef

# HMAC for API authentication
HMAC=$(echo -n "$(date +%s)GET/api/data" | \
    openssl dgst -sha256 -hmac "api_secret" | awk '{print $NF}')
```

### Password Hashing

```bash
# Generate bcrypt hash
openssl passwd -6 -salt "randomsalt" "mypassword"
# -6 = SHA-512, -5 = SHA-256, -1 = MD5 (DON'T USE)

# Apache htpasswd (bcrypt)
htpasswd -B -c .htpasswd username

# Python bcrypt example (command line)
python3 -c "
import bcrypt
password = b'mypassword'
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password, salt)
print(hashed.decode())
"
```

---

## Practical Examples

### Python Hashing

```python
import hashlib
import hmac
import os

# Basic hashing
def hash_sha256(message: bytes) -> str:
    return hashlib.sha256(message).hexdigest()

def hash_sha3(message: bytes) -> str:
    return hashlib.sha3_256(message).hexdigest()

# HMAC
def compute_hmac(key: bytes, message: bytes) -> str:
    return hmac.new(key, message, hashlib.sha256).hexdigest()

def verify_hmac(key: bytes, message: bytes, signature: str) -> bool:
    expected = hmac.new(key, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

# File hashing
def hash_file(filepath: str, algorithm: str = 'sha256') -> str:
    h = hashlib.new(algorithm)
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

# Password hashing
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

# Argon2
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=3,
    memory_cost=256000,  # 256 MB
    parallelism=4
)

def argon2_hash(password: str) -> str:
    return ph.hash(password)

def argon2_verify(password: str, hash: str) -> bool:
    try:
        ph.verify(hash, password)
        return True
    except Exception:
        return False
```

### Integrity Verification Script

```bash
#!/bin/bash
# File integrity checker

HASH_FILE="$1"
CHECKSUMS_FILE="checksums.sha256"

# Generate checksums
generate_checksums() {
    find "$1" -type f -exec sha256sum {} \; > "$CHECKSUMS_FILE"
    echo "Checksums saved to $CHECKSUMS_FILE"
}

# Verify checksums
verify_checksums() {
    sha256sum -c "$CHECKSUMS_FILE"
}

# Usage
case "$1" in
    generate)
        generate_checksums "${2:-.}"
        ;;
    verify)
        verify_checksums
        ;;
    *)
        echo "Usage: $0 {generate|verify} [directory]"
        ;;
esac
```

---

## Security Perspective

### Attack Techniques

```
┌──────────────────────────────────────────────────────┐
│               HASHING ATTACKS                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Rainbow Table Attack:                            │
│     ├─ Pre-computed hash lookups                     │
│     ├─ Defeated by: salt (unique per password)       │
│     └─ Speed: O(1) lookup                            │
│                                                      │
│  2. Brute Force:                                     │
│     ├─ Try all possible inputs                       │
│     ├─ Speed depends on hash function speed          │
│     └─ Defeated by: key stretching (bcrypt, Argon2) │
│                                                      │
│  3. Dictionary Attack:                               │
│     ├─ Try common passwords                          │
│     ├─ Speed: 10-100 billion/sec for fast hashes     │
│     └─ Defeated by: slow hash functions              │
│                                                      │
│  4. Length Extension Attack:                         │
│     ├─ MD5, SHA-1, SHA-2 vulnerable                  │
│     ├─ H(secret ‖ msg ‖ padding ‖ extension)        │
│     └─ Defeated by: HMAC, SHA-3                      │
│                                                      │
│  5. Side-Channel Attacks:                            │
│     ├─ Cache-timing attacks on bcrypt                │
│     ├─ Branch prediction attacks                     │
│     └─ Defeated by: constant-time implementations   │
│                                                      │
│  6. Hash Collision Attacks:                          │
│     ├─ MD5: Practical (seconds)                      │
│     ├─ SHA-1: Practical ($45K)                       │
│     └─ SHA-256: Infeasible (2^128 ops)              │
└──────────────────────────────────────────────────────┘
```

### Defense Mechanisms

```
┌──────────────────────────────────────────────────────┐
│              DEFENSE MECHANISMS                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Use SHA-256+ for integrity checking               │
│  ✓ Use HMAC for message authentication               │
│  ✓ Use bcrypt/Argon2 for password storage            │
│  ✓ Add random salt to all password hashes            │
│  ✓ Increase bcrypt cost factor over time             │
│  ✓ Use Argon2id for new applications                 │
│  ✓ Verify file integrity with SHA-256 checksums     │
│  ✓ Never use MD5 or SHA-1 for security purposes      │
│  ✓ Use constant-time comparison for hash verification│
│  ✓ Use domain separation (different keys for different│
│    purposes)                                          │
└──────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Fundamental

1. **Q: What is the difference between a hash function and encryption?**
   A: Hash functions are one-way (no key, no decryption). Encryption is two-way (key required, reversible).

2. **Q: Why are MD5 and SHA-1 considered insecure?**
   A: Practical collision attacks exist. MD5 collisions take seconds; SHA-1 collisions cost ~$45K. Both violate collision resistance.

3. **Q: What makes a good password hash function?**
   A: Slow by design (key stretching), salted, memory-hard (resistant to GPU/ASIC), and adaptive (cost can increase).

### Intermediate

4. **Q: How does salt prevent rainbow table attacks?**
   A: Salt makes each password hash unique. Rainbow tables are precomputed for specific hash functions; salt forces attacker to create new table for each salt.

5. **Q: What is the difference between bcrypt and Argon2?**
   A: Argon2 is memory-hard (uses RAM to prevent GPU attacks); bcrypt uses CPU-only. Argon2 is the PHC winner and generally recommended.

6. **Q: What is a length extension attack?**
   A: Given H(secret ‖ message), attacker can compute H(secret ‖ message ‖ padding ‖ extension) without knowing the secret. Affects MD5, SHA-1, SHA-2.

### Advanced

7. **Q: How do you choose bcrypt cost factor?**
   A: Benchmark to find cost that takes ~100ms per hash on your hardware. Increase cost over time as hardware gets faster.

8. **Q: What is the difference between collision and preimage resistance?**
   A: Collision: find any two inputs with same hash. Preimage: given hash, find any input. Second preimage: given specific input, find another with same hash.

9. **Q: How does HKDF work for key derivation?**
   A: HKDF uses HMAC in two steps: Extract (derive pseudo-random key from input key material) and Expand (derive multiple keys of desired length).

---

## Hands-on Labs

### Lab 1: File Integrity Checking

```bash
# Step 1: Create test files
echo "Original content" > file1.txt
echo "Original content" > file2.txt

# Step 2: Generate checksums
sha256sum file1.txt file2.txt > checksums.txt
cat checksums.txt

# Step 3: Tamper with file
echo "Tampered content" >> file1.txt

# Step 4: Verify integrity
sha256sum -c checksums.txt
# file1.txt: FAILED
# file2.txt: OK
```

### Lab 2: Password Hashing Comparison

```python
import bcrypt
import time

password = "StrongPassword123!"

# Measure bcrypt cost factors
for cost in [10, 12, 14]:
    start = time.time()
    bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=cost))
    elapsed = time.time() - start
    print(f"Cost {cost}: {elapsed:.3f}s")

# Argon2
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=256000, parallelism=4)
start = time.time()
ph.hash(password)
elapsed = time.time() - start
print(f"Argon2id: {elapsed:.3f}s")
```

### Lab 3: HMAC API Authentication

```python
import hmac
import hashlib
import time

API_SECRET = "super_secret_key_12345"

def create_api_signature(method: str, path: str, body: str = "") -> dict:
    timestamp = str(int(time.time()))
    message = f"{timestamp}{method}{path}{body}"
    signature = hmac.new(
        API_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return {
        "timestamp": timestamp,
        "signature": signature,
        "method": method,
        "path": path
    }

def verify_api_signature(sig_data: dict, body: str = "") -> bool:
    message = f"{sig_data['timestamp']}{sig_data['method']}{sig_data['path']}{body}"
    expected = hmac.new(
        API_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, sig_data["signature"])

# Usage
sig = create_api_signature("GET", "/api/users")
print(f"Signature: {sig['signature']}")
print(f"Valid: {verify_api_signature(sig)}")
```

---

## Summary Table

| Hash Function | Output | Speed | Security | Use Case |
|--------------|--------|-------|----------|----------|
| MD5 | 128-bit | Fast | ❌ Broken | Checksums only |
| SHA-1 | 160-bit | Fast | ❌ Broken | Legacy systems |
| SHA-256 | 256-bit | Medium | ✅ Secure | General hashing |
| SHA-384 | 384-bit | Medium | ✅ Secure | High security |
| SHA-512 | 512-bit | Fast* | ✅ Secure | High security |
| SHA3-256 | 256-bit | Medium | ✅ Secure | Alternative to SHA-2 |
| bcrypt | N/A | Slow | ✅ Secure | Passwords (legacy) |
| scrypt | N/A | Slow | ✅ Secure | Passwords |
| Argon2id | N/A | Slow | ✅ Secure | Passwords (best) |

---

## References

- FIPS 180-4 (SHA-2)
- FIPS 202 (SHA-3)
- RFC 2104 (HMAC)
- RFC 7914 (scrypt)
- Argon2 RFC 9106
- bcrypt: A Adaptive Password Hashing Function
