# Assembly Language for Reverse Engineering

## Table of Contents
1. [Introduction](#introduction)
2. [x86/x64 Architecture Overview](#architecture)
3. [Registers](#registers)
4. [Common Instructions](#instructions)
5. [Addressing Modes](#addressing)
6. [Stack Operations](#stack)
7. [Function Calling Conventions](#calling)
8. [Security Perspective](#security)
9. [Malware Analysis Context](#malware)
10. [Interview Questions](#interview)
11. [Hands-On Labs](#labs)
12. [Summary](#summary)

---

## 1. Introduction <a name="introduction"></a>

Assembly language is the lowest-level programming language that directly corresponds to machine code. For reverse engineers, understanding assembly is essential for analyzing binaries, understanding program behavior, and identifying vulnerabilities.

### Why Assembly for Reverse Engineering?

```
Source Code (C/C++) → Compiler → Assembly → Assembler → Machine Code
                                                           ↓
Reverse Engineer ← Disassembler ← Machine Code (Binary)
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| Mnemonic | Human-readable instruction name (MOV, ADD, JMP) |
| Operand | Data that an instruction operates on |
| Opcode | Binary encoding of an instruction |
| Operand Size | Byte (8), Word (16), Double Word (32), Quad Word (64) |
| Endianness | Byte ordering (Little-endian: x86/x64) |

---

## 2. x86/x64 Architecture Overview <a name="architecture"></a>

### x86 Architecture (32-bit)

```
┌─────────────────────────────────────────────────────┐
│                    CPU (x86)                         │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │              Registers                       │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │   │
│  │  │ EAX  │ │ EBX  │ │ ECX  │ │ EDX  │      │   │
│  │  │ 32b  │ │ 32b  │ │ 32b  │ │ 32b  │      │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘      │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │   │
│  │  │ ESI  │ │ EDI  │ │ EBP  │ │ ESP  │      │   │
│  │  │ 32b  │ │ 32b  │ │ 32b  │ │ 32b  │      │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘      │   │
│  │  ┌──────────────────┐ ┌────────────────┐   │   │
│  │  │      EIP         │ │    EFLAGS      │   │   │
│  │  │  (Instruction    │ │   (Status)     │   │   │
│  │  │    Pointer)      │ │                │   │   │
│  │  └──────────────────┘ └────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           Memory (Flat Model)                │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ High Memory (0xFFFF_FFFF)           │   │   │
│  │  │         Stack ↓                     │   │   │
│  │  │         ...                         │   │   │
│  │  │         ↑ Heap                      │   │   │
│  │  │         BSS (Uninitialized Data)    │   │   │
│  │  │         Data (Initialized)          │   │   │
│  │  │         Text (Code)                 │   │   │
│  │  │ Low Memory (0x0000_0000)            │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### x64 Architecture (64-bit) - Extensions

```
┌───────────────────────────────────────────────────────┐
│                x64 vs x86 Changes                      │
├───────────────────────────────────────────────────────┤
│  Registers:                                           │
│  • EAX → RAX (64-bit)                                │
│  • EBX → RBX (64-bit)                                │
│  • ECX → RCX (64-bit)                                │
│  • EDX → RDX (64-bit)                                │
│  • ESI → RSI (64-bit)                                │
│  • EDI → RDI (64-bit)                                │
│  • EBP → RBP (64-bit)                                │
│  • ESP → RSP (64-bit)                                │
│                                                       │
│  New Registers:                                       │
│  • R8, R9, R10, R11, R12, R13, R14, R15             │
│                                                       │
│  Address Space:                                       │
│  • 32-bit: 4 GB virtual address space                 │
│  • 64-bit: 16 EB virtual address space                │
│                                                       │
│  Default operand size: 32-bit (not 64-bit)            │
│  New RIP-relative addressing                          │
└───────────────────────────────────────────────────────┘
```

---

## 3. Registers <a name="registers"></a>

### General-Purpose Registers

```
64-bit:  ┌─────────────────────────────────────────────┐
         │  RAX (Accumulator)                          │
         │  ├── 32-bit: EAX                            │
         │  │   ├── 16-bit: AX                         │
         │  │   │   ├── 8-bit high: AH                 │
         │  │   │   └── 8-bit low: AL                  │
         │  └── (lower 32 bits zeroed on 32-bit op)    │
         └─────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Register │ Purpose                    │ Example Usage              │
├────────────────────────────────────────────────────────────────────┤
│ RAX      │ Return value, arithmetic   │ function return value      │
│ RBX      │ Base index (callee-saved)  │ stable base pointer        │
│ RCX      │ Loop counter, 4th arg      │ string operations          │
│ RDX      │ I/O, 2nd arg               │ multiply/divide overflow   │
│ RSI      │ Source index, 2nd arg      │ string source pointer      │
│ RDI      │ Dest index, 1st arg        │ string destination pointer │
│ RBP      │ Base pointer (frame)       │ stack frame anchor         │
│ RSP      │ Stack pointer              │ top of stack               │
│ R8-R15   │ General purpose (x64)      │ extra arguments, temps     │
│ RIP      │ Instruction pointer        │ current instruction        │
│ RFLAGS   │ Status flags               │ condition codes            │
└────────────────────────────────────────────────────────────────────┘
```

### Sub-register Access

```asm
; Register hierarchy example
mov  rax, 0x1122334455667788   ; Full 64-bit RAX
; RAX = 0x1122334455667788

mov  eax, 0xAABBCCDD           ; 32-bit EAX (zero-extends to RAX)
; RAX = 0x00000000AABBCCDD

mov  ax, 0xEEFF               ; 16-bit AX
; RAX = 0x00000000AABBEEFF

mov  al, 0x11                 ; 8-bit AL (low byte)
; RAX = 0x00000000AABBEE11

mov  ah, 0x22                 ; 8-bit AH (high byte)
; RAX = 0x00000000AABB2211
```

### Flags Register (EFLAGS/RFLAGS)

```
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│31│30│29│28│27│26│25│24│23│22│21│20│19│18│17│16│15│14│13│12│11│10│9 │8 │7 │6 │5 │4 │3 │2 │1 │0 │
├─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┤
│                      Reserved                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ID │ VIP│ VIF│ AC │ VM │ RF │  0 │ NT │ IOPL│  OF │DF │ IF │ TF │ SF │ ZF │  0 │ AF │  0 │ PF │  1 │ CF │
└─────────────────────────────────────────────────────────────────────┘

Key Flags:
• CF (Carry Flag)    - unsigned overflow
• ZF (Zero Flag)     - result is zero
• SF (Sign Flag)     - result is negative
• OF (Overflow Flag) - signed overflow
• PF (Parity Flag)   - low byte has even number of 1-bits
• IF (Interrupt Flag) - interrupts enabled
```

---

## 4. Common Instructions <a name="instructions"></a>

### Data Movement

```asm
; MOV - Move data between registers, memory, immediate
mov  eax, 0x10          ; EAX = 0x10 (immediate)
mov  ebx, eax           ; EBX = EAX (register to register)
mov  [ebp-4], eax       ; [EBP-4] = EAX (register to memory)
mov  eax, [ebp-4]       ; EAX = [EBP-4] (memory to register)

; LEA - Load Effective Address (address calculation)
lea  eax, [ebx+ecx*4+8] ; EAX = EBX + ECX*4 + 8
lea  rsi, [rip+0x1234]  ; RIP-relative addressing (x64)

; XCHG - Exchange values
xchg eax, ebx           ; Swap EAX and EBX
xchg [ebp-4], eax       ; Swap EAX with memory
```

### Arithmetic

```asm
; Addition and Subtraction
add  eax, 5             ; EAX = EAX + 5
sub  eax, 3             ; EAX = EAX - 3
inc  eax                 ; EAX = EAX + 1
dec  eax                 ; EAX = EAX - 1
neg  eax                 ; EAX = -EAX (two's complement)

; Multiplication and Division
imul eax, ebx           ; EDX:EAX = EAX * EBX (signed)
imul eax, ebx, 5        ; EAX = EBX * 5 (three-operand form)
mul  ebx                 ; EDX:EAX = EAX * EBX (unsigned)

idiv ebx                 ; EAX = EDX:EAX / EBX (signed quotient)
                         ; EDX = remainder
div  ebx                 ; Unsigned division

; Shift and Rotate
shl  eax, 2             ; Shift left by 2 (multiply by 4)
shr  eax, 2             ; Shift right by 2 (unsigned divide by 4)
sar  eax, 2             ; Arithmetic shift right (preserves sign)
rol  eax, 4             ; Rotate left by 4 bits
ror  eax, 4             ; Rotate right by 4 bits
```

### Logic Operations

```asm
; Bitwise Operations
and  eax, 0xFF          ; EAX = EAX & 0xFF (mask high bits)
or   eax, 0x10          ; EAX = EAX | 0x10 (set bit 4)
xor  eax, eax           ; EAX = 0 (fast zero)
xor  eax, 0x12345678    ; XOR with immediate (common in XOR loops)
not  eax                 ; Bitwise NOT
test eax, eax            ; Sets flags without modifying (like AND)
cmp  eax, ebx            ; Sets flags without modifying (like SUB)
```

### Control Flow

```asm
; Unconditional Jump
jmp  0x401000           ; Jump to address
jmp  eax                ; Jump to address in register
jmp  [eax]              ; Jump to address in memory

; Conditional Jumps (based on flags)
je   0x401000           ; Jump if Equal (ZF=1)
jne  0x401000           ; Jump if Not Equal (ZF=0)
jg   0x401000           ; Jump if Greater (signed)
jge  0x401000           ; Jump if Greater or Equal
jl   0x401000           ; Jump if Less (signed)
jle  0x401000           ; Jump if Less or Equal
ja   0x401000           ; Jump if Above (unsigned)
jae  0x401000           ; Jump if Above or Equal
jb   0x401000           ; Jump if Below (unsigned)
jbe  0x401000           ; Jump if Below or Equal
jz   0x401000           ; Jump if Zero (= je)
jnz  0x401000           ; Jump if Not Zero (= jne)
js   0x401000           ; Jump if Sign (SF=1)
jns  0x401000           ; Jump if Not Sign
jo   0x401000           ; Jump if Overflow
jno  0x401000           ; Jump if Not Overflow

; Loop Instructions
loop 0x401000           ; ECX--; if ECX != 0, jump
loope 0x401000          ; ECX--; if ECX != 0 AND ZF=1, jump
loopne 0x401000         ; ECX--; if ECX != 0 AND ZF=0, jump
```

---

## 5. Addressing Modes <a name="addressing"></a>

### x86/x64 Addressing Modes

```
┌─────────────────────────────────────────────────────────────────────┐
│ Addressing Mode        │ Syntax            │ Effective Address     │
├─────────────────────────────────────────────────────────────────────┤
│ Register               │ mov eax, ebx      │ operand in register  │
│ Immediate              │ mov eax, 0x10     │ constant value       │
│ Direct                 │ mov eax, [0x100]  │ address              │
│ Register Indirect      │ mov eax, [ebx]    │ [EBX]                │
│ Base + Displacement    │ mov eax, [ebp+8]  │ [EBP + 8]            │
│ Indexed                │ mov eax, [ebx+ecx]│ [EBX + ECX]          │
│ Scaled Index          │ mov eax, [ebx+ecx*4] │ [EBX + ECX*4]     │
│ Base+Index+Disp       │ mov eax, [ebp+esi+8] │ [EBP + ESI + 8]   │
│ Base+Scaled+Disp      │ mov eax, [ebx+ecx*4+8]│ [EBX + ECX*4 + 8]│
│ RIP-Relative (x64)    │ mov eax, [rip+offset] │ [RIP + offset]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Practical Addressing Examples

```asm
; Base + Displacement: Accessing function parameters
my_function:
    push ebp
    mov  ebp, esp
    ; Parameters (cdecl):
    ; [ebp+8]   = first argument
    ; [ebp+12]  = second argument
    ; [ebp+16]  = third argument
    ; Local variables:
    ; [ebp-4]   = first local
    ; [ebp-8]   = second local

; Scaled Index: Array access
; int arr[10]; // 4-byte integers
; arr[i] = 0;
mov  eax, [ebp-4]        ; Load i
mov  dword [ebp+eax*4-44], 0  ; arr[i] = 0

; RIP-Relative: Position-independent code (x64)
lea  rax, [rip+0x1234]   ; Load address relative to next instruction
mov  eax, [rip+0x5678]   ; Load data relative to RIP
```

### Memory Operand Scales

```
┌───────────────────────────────────────────────────────┐
│ Scale │ Register │ Common Use                         │
├───────────────────────────────────────────────────────┤
│ 1     │ None     │ Byte access (char *)              │
│ 2     │ CX       │ Word access (short *, WCHAR *)    │
│ 4     │ DX       │ DWord access (int *, float *)     │
│ 8     │ BX       │ QWord access (long long, double)  │
└───────────────────────────────────────────────────────┘
```

---

## 6. Stack Operations <a name="stack"></a>

### Stack Fundamentals

```
                    Stack Growth Direction
                    ┌─────────────────┐
                    │   (High Addr)   │
                    ├─────────────────┤
                    │   Old Data      │ ← Previous frame
                    ├─────────────────┤
                    │   Parameters    │ ← [EBP + 8], [EBP + 12]...
                    ├─────────────────┤
   ESP/EBP →        │   Return Addr   │ ← [EBP + 4]
                    ├─────────────────┤
                    │   Saved EBP     │ ← [EBP] (current frame)
                    ├─────────────────┤
                    │   Local Var 1   │ ← [EBP - 4]
                    ├─────────────────┤
                    │   Local Var 2   │ ← [EBP - 8]
                    ├─────────────────┤
                    │   (Low Addr)    │ ← ESP
                    └─────────────────┘

    PUSH: ESP = ESP - 4, then [ESP] = value
    POP:  value = [ESP], then ESP = ESP + 4
```

### Push and Pop Operations

```asm
; PUSH operation (decrements ESP, then stores)
push eax        ; Equivalent to:
                ; sub esp, 4
                ; mov [esp], eax

push 0x10       ; Push immediate
push [ebp+8]    ; Push memory value

; POP operation (loads, then increments ESP)
pop eax         ; Equivalent to:
                ; mov eax, [esp]
                ; add esp, 4

pop ebx         ; Pop into EBX

; Common patterns
pushad          ; Push all general-purpose registers (32-bit)
popad           ; Pop all general-purpose registers

pushfq         ; Push RFLAGS (64-bit)
popfq          ; Pop RFLAGS (64-bit)
```

### Stack Frame Setup (Function Prologue)

```asm
; Standard function prologue
my_function:
    push ebp            ; Save old base pointer
    mov  ebp, esp       ; Set new base pointer
    sub  esp, 0x20      ; Allocate 32 bytes for locals
    ; Now: [ebp+8] = first param, [ebp-4] = first local

; Function epilogue
    mov  esp, ebp       ; Deallocate locals (or leave)
    pop  ebp            ; Restore old base pointer
    ret                 ; Return (pops return address)

; Alternative using LEAVE and RET
    leave               ; mov esp, ebp; pop ebp
    ret

; With callee-saved registers
my_function:
    push ebp
    mov  ebp, esp
    push ebx            ; Save callee-saved register
    push esi            ; Save callee-saved register
    sub  esp, 0x10      ; Allocate locals
    ; ... function body ...
    lea  esp, [ebp-8]   ; Restore ESP
    pop  esi            ; Restore ESI
    pop  ebx            ; Restore EBX
    pop  ebp
    ret
```

---

## 7. Function Calling Conventions <a name="calling"></a>

### x86 Calling Conventions

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Convention    │ Params      │ Cleanup │ Callee-Saved │ Used By          │
├─────────────────────────────────────────────────────────────────────────┤
│ cdecl         │ Stack (R→L) │ Caller  │ EAX,ECX,EDX │ C (default)      │
│ stdcall       │ Stack (R→L) │ Callee  │ EAX,ECX,EDX │ WinAPI           │
│ thiscall      │ this=ECX    │ Callee  │ EAX,ECX,EDX │ C++ methods      │
│ fastcall      │ ECX,EDX,stk │ Callee  │ EAX,ECX,EDX │ Performance      │
│ Microsoft x64 │ RCX,RDX,R8,R9│ Caller │ Non-volatile│ Windows x64      │
│ System V AMD64│ RDI,RSI,RDX │ Caller │ Non-volatile│ Linux/macOS x64  │
└─────────────────────────────────────────────────────────────────────────┘
```

### cdecl Example (32-bit)

```c
// C code
int add(int a, int b) {
    return a + b;
}

int result = add(5, 10);
```

```asm
; Caller side
    push 10         ; Push second argument (right to left)
    push 5          ; Push first argument
    call add        ; Call function (pushes return address)
    add  esp, 8     ; Clean up stack (caller cleanup)
    mov  [result], eax  ; Store return value

; Function implementation
add:
    push ebp            ; Prologue
    mov  ebp, esp
    mov  eax, [ebp+8]  ; a = 5
    add  eax, [ebp+12] ; a + b = 5 + 10
    pop  ebp            ; Epilogue
    ret                 ; Return (EAX = 15)
```

### stdcall Example (WinAPI)

```asm
; MessageBoxA(NULL, "Hello", "Title", MB_OK)
    push 0              ; uType = MB_OK
    push title_str      ; lpCaption
    push hello_str      ; lpText
    push 0              ; hWnd = NULL
    call MessageBoxA    ; Callee cleans stack (ret 16)

; MessageBoxA implementation
MessageBoxA:
    push ebp
    mov  ebp, esp
    ; ... function body ...
    pop  ebp
    ret 16              ; Return and clean 16 bytes (4 params * 4 bytes)
```

### x64 Calling Conventions

```
┌─────────────────────────────────────────────────────────────────────────┐
│            │ Windows x64           │ System V AMD64 (Linux/macOS)      │
├─────────────────────────────────────────────────────────────────────────┤
│ Integer    │ RCX, RDX, R8, R9     │ RDI, RSI, RDX, RCX, R8, R9       │
│ Args       │ (stack after 4th)     │ (stack after 6th)                 │
│ Floating   │ XMM0-XMM3            │ XMM0-XMM7                        │
│ Return     │ RAX                  │ RAX, RDX                         │
│ Callee-    │ RBX, RBP, RDI, RSI  │ RBX, RBP, R12-R15                │
│ Saved      │ RSP+128 red zone     │ RSP+128 red zone                 │
│ Shadow     │ 32 bytes             │ None                             │
│ Space      │ (always allocated)   │                                   │
│ Stack Align│ 16-byte aligned      │ 16-byte aligned                  │
└─────────────────────────────────────────────────────────────────────────┘
```

```asm
; Windows x64 example
; long add(long a, long b, long c, long d)
; RCX=a, RDX=b, R8=c, R9=d

add:
    push rbp
    mov  rbp, rsp
    sub  rsp, 32          ; Shadow space (32 bytes)
    mov  rax, rcx         ; a
    add  rax, rdx         ; a + b
    add  rax, r8          ; a + b + c
    add  rax, r9          ; a + b + c + d
    add  rsp, 32          ; Clean shadow space
    pop  rbp
    ret

; Linux/macOS x64 example
; long add(long a, long b, long c, long d)
; RDI=a, RSI=b, RDX=c, RCX=d

add:
    push rbp
    mov  rbp, rsp
    mov  rax, rdi         ; a
    add  rax, rsi         ; a + b
    add  rax, rdx         ; a + b + c
    add  rax, rcx         ; a + b + c + d
    pop  rbp
    ret
```

---

## 8. Security Perspective <a name="security"></a>

### Common Vulnerable Patterns

```asm
; Buffer overflow vulnerability
vulnerable_function:
    push ebp
    mov  ebp, esp
    sub  esp, 0x40        ; 64-byte local buffer
    ; Dangerous: no bounds checking
    push dword [ebp+8]    ; User-controlled size
    lea  eax, [ebp-0x40]  ; Buffer address
    push eax              ; Destination buffer
    call strcpy           ; No length limit!
    ; If input > 64 bytes, stack corruption occurs
    leave
    ret

; Format string vulnerability
    push user_input       ; User-controlled format string
    call printf           ; %n can write to arbitrary address
    add  esp, 4
```

### Stack Buffer Overflow Exploitation

```
Normal Stack:                    After Overflow:
┌──────────────┐                ┌──────────────┐
│ Return Addr  │                │ Shellcode Add │ ← Attacker controls
├──────────────┤                ├──────────────┤
│ Saved EBP    │                │ 0x90909090   │ ← NOP sled
├──────────────┤                │ 0x90909090   │
│ Buffer       │                │ \xCC\xCC\xCC │ ← Overflow
│ (64 bytes)   │                │ ...          │
└──────────────┘                │ AAAA...AAAA  │
                                └──────────────┘
```

### Return-Oriented Programming (ROP)

```asm
; ROP chains use existing code snippets ("gadgets")
; Example gadgets:
; 0x401001: pop eax; ret
; 0x401004: pop ebx; ret
; 0x401007: int 0x80; ret  (syscall on Linux)
;
; ROP Chain:
; [Gadget 1] → [Gadget 2] → [Gadget 3] → syscall
; Each gadget ends with RET, chaining to next
```

### Shellcode Analysis

```asm
; Linux x86 execve("/bin/sh") - 23 bytes
xor    eax, eax        ; EAX = 0
push   eax             ; Null terminator
push   0x68732f2f      ; "//sh"
push   0x6e69622f      ; "/bin"
mov    ebx, esp        ; EBX = pointer to "/bin//sh"
push   eax             ; NULL
push   ebx             ; pointer to "/bin//sh"
mov    ecx, esp        ; ECX = pointer to argv[]
xor    edx, edx        ; EDX = NULL (envp)
mov    al, 0x0b        ; syscall number for execve
int    0x80            ; invoke syscall
```

---

## 9. Malware Analysis Context <a name="malware"></a>

### Common Malware Patterns

```asm
; XOR Decryption Loop (common in malware)
decrypt_payload:
    lea  esi, [encrypted_data]
    mov  ecx, payload_length
    mov  al, 0x41         ; XOR key
decrypt_loop:
    xor  byte [esi], al   ; Decrypt byte
    inc  esi
    loop decrypt_loop
    jmp  decrypted_payload ; Execute decrypted code

; API Hashing (hides API calls from static analysis)
resolve_api:
    ; Walk PEB → LDR → InMemoryOrderModuleList
    mov  eax, fs:[0x30]   ; PEB
    mov  eax, [eax+0x0C]  ; PEB->Ldr
    mov  esi, [eax+0x14]  ; InMemoryOrderModuleList
    ; ... hash each function name, compare with target hash

; Process Injection Pattern
    ; 1. OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid)
    ; 2. VirtualAllocEx(hProcess, NULL, size, MEM_COMMIT, PAGE_EXECUTE_READWRITE)
    ; 3. WriteProcessMemory(hProcess, addr, shellcode, size, NULL)
    ; 4. CreateRemoteThread(hProcess, NULL, 0, addr, NULL, 0, NULL)
```

### Anti-Analysis Techniques

```asm
; Time-based anti-debugging
check_debugger:
    rdtsc                ; Read timestamp counter
    mov  ebx, eax        ; Save low part
    rdtsc
    sub  eax, ebx        ; Calculate elapsed cycles
    cmp  eax, 0x1000     ; If too fast, debugger present
    ja   is_debugged

; Check PEB.BeingDebugged
check_peb:
    mov  eax, fs:[0x30]  ; PEB address
    cmp  byte [eax+2], 0 ; BeingDebugged flag
    jne  is_debugged

; Check IsDebuggerPresent via API
    call IsDebuggerPresent
    test eax, eax
    jnz  is_debugged
```

### String Deobfuscation Patterns

```asm
; Building strings at runtime (avoids static detection)
build_string:
    push 0x00006873      ; "sh\0\0"
    push 0x2f6e6962      ; "bin/"
    push 0x2f2f2f2f      ; "////"
    mov  esp, ebx        ; EBX now points to "////bin/sh"
    ; This string doesn't appear in the binary's data section
```

---

## 10. Interview Questions <a name="interview"></a>

### Fundamental Questions

1. **What is the difference between x86 and x64?**
   - x86 uses 32-bit registers and address space (4GB)
   - x64 extends registers to 64-bit, adds R8-R15, 16EB address space
   - x64 uses RIP-relative addressing for position-independent code

2. **Explain the stack and its growth direction.**
   - Stack grows from high addresses to low addresses
   - PUSH decrements ESP before storing
   - POP loads then increments ESP
   - Stack is LIFO (Last In, First Out)

3. **What is the difference between cdecl and stdcall?**
   - cdecl: Caller cleans stack, allows variable arguments
   - stdcall: Callee cleans stack (ret N), used by WinAPI
   - cdecl uses EAX for return value

4. **How does a function call work in assembly?**
   - Push arguments (right to left in cdecl)
   - CALL instruction pushes return address and jumps
   - Function prologue saves EBP, sets up frame
   - Function epilogue restores EBP, returns

### Advanced Questions

5. **What is ROP and how is it used in exploitation?**
   - Return-Oriented Programming chains existing code gadgets
   - Each gadget ends with RET
   - Bypasses DEP/NX by reusing executable code
   - Used to construct arbitrary operations without injecting code

6. **How do you detect anti-debugging techniques?**
   - Check PEB.BeingDebugged (fs:[0x30]+2 on x86, gs:[0x60]+2 on x64)
   - Use timing checks (RDTSC, GetTickCount)
   - Monitor API calls (IsDebuggerPresent, CheckRemoteDebuggerPresent)
   - Hardware breakpoint detection (DR7 register)

7. **Explain the difference between LEA and MOV.**
   - LEA computes address without accessing memory
   - MOV accesses memory (reads/writes data)
   - LEA is often used for arithmetic: LEA EAX, [EBX+ECX*4+8]
   - MOV is used for data transfer: MOV EAX, [EBX+ECX*4+8]

---

## 11. Hands-On Labs <a name="labs"></a>

### Lab 1: Basic Register Operations

```asm
; Exercise: What are the values after each instruction?
section .text
global _start

_start:
    mov  eax, 0x10       ; EAX = ?
    mov  ebx, 0x20       ; EBX = ?
    add  eax, ebx        ; EAX = ?
    xor  ebx, ebx        ; EBX = ?
    mov  ecx, eax        ; ECX = ?
    not  eax              ; EAX = ?

; Use GDB to step through and verify
; gdb ./lab1
; (gdb) break _start
; (gdb) run
; (gdb) stepi
; (gdb) info registers
```

### Lab 2: Stack Frame Analysis

```asm
; Exercise: Trace the stack operations
section .text
global _start

_start:
    push 0x0A
    push 0x14
    push 0x1E
    mov  eax, [esp]      ; EAX = ? (top of stack)
    mov  ebx, [esp+4]    ; EBX = ?
    add  esp, 12         ; ESP moved by ? bytes
    pop  ecx             ; ECX = ? (what value?)
```

### Lab 3: Function Call Analysis

```c
// Compile: gcc -m32 -o lab3 lab3.c
// Analyze the compiled assembly
int add_numbers(int a, int b, int c) {
    return a + b + c;
}

int main() {
    int result = add_numbers(1, 2, 3);
    return result;
}
```

```asm
; Lab 3 Tasks:
; 1. Use objdump -d lab3 to disassemble
; 2. Identify function prologue/epilogue
; 3. Trace argument passing on the stack
; 4. Verify return value in EAX
; 5. Use GDB: break add_numbers, step through
```

### Lab 4: Shellcode Analysis

```bash
# Generate shellcode for analysis
# msfvenom -p linux/x86/exec CMD="/bin/sh" -f asm
# Or use pre-written shellcode from shell-storm.org

# Analyze with GDB:
# gdb --args ./shellcode_loader "$(cat shellcode.bin)"
# (gdb) break *0x0804XXXX  # After shellcode is loaded
# (gdb) stepi through each instruction
```

### Lab 5: XOR Decryption Challenge

```asm
; Challenge: Decrypt the message
section .data
    encrypted: db 0x36, 0x27, 0x22, 0x32, 0x36, 0x21, 0x36, 0x24
               db 0x34, 0x21, 0x27, 0x34, 0x24, 0x36, 0x00
    key equ 0x41

section .text
global _start
_start:
    ; TODO: Write XOR decryption loop
    ; Hint: Use LODSB or indexed addressing
    ; Run in GDB and examine memory to see decrypted string
```

---

## 12. Summary <a name="summary"></a>

### Quick Reference Table

```
┌─────────────────────────────────────────────────────────────────────┐
│ Category         │ Key Points                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Registers        │ EAX=return, ECX=counter, ESP=stack, EBP=frame   │
│ Instructions     │ MOV, PUSH/POP, ADD/SUB, CMP/JMP, CALL/RET      │
│ Addressing       │ [base+index*scale+disp] is most complex form     │
│ Stack            │ Grows downward, PUSH decr, POP incr              │
│ Calling          │ cdecl (caller cleans), stdcall (callee cleans)   │
│ Flags            │ ZF=zero, SF=sign, CF=carry, OF=overflow          │
│ Security         │ Buffer overflows, ROP, shellcode patterns        │
│ Malware          │ XOR loops, API hashing, process injection        │
└─────────────────────────────────────────────────────────────────────┘
```

### Study Progression

```
Beginner: Registers → MOV/ADD/SUB → Basic addressing → Stack ops
    ↓
Intermediate: Function calls → Calling conventions → String operations
    ↓
Advanced: Shellcode → ROP → Anti-debugging → Malware patterns
```

### Tools for Assembly Analysis

| Tool | Purpose |
|------|---------|
| `objdump -d` | Disassemble binary |
| `gdb` | Dynamic analysis, step through code |
| `radare2` | Interactive disassembly, analysis |
| `IDA Pro` | Professional disassembly/decompilation |
| `nasm` | Assemble .asm files |
| `xxd` | Hex dump for raw binary inspection |

---

*Last Updated: 2026*
*For educational and authorized security testing purposes only*
