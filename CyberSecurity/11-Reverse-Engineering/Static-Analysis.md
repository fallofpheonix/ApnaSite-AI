# Static Analysis for Reverse Engineering

## Table of Contents
1. [Introduction](#introduction)
2. [Disassembly](#disassembly)
3. [Decompilation](#decompilation)
4. [String Analysis](#strings)
5. [Import/Export Tables](#imports)
6. [PE File Format](#pe)
7. [ELF File Format](#elf)
8. [Ghidra Basics](#ghidra)
9. [Security Perspective](#security)
10. [Malware Analysis Context](#malware)
11. [Interview Questions](#interview)
12. [Hands-On Labs](#labs)
13. [Summary](#summary)

---

## 1. Introduction <a name="introduction"></a>

Static analysis examines a binary without executing it. It involves analyzing the file's structure, code, and data to understand its behavior.

### Static vs Dynamic Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Analysis Approaches                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Static Analysis                     Dynamic Analysis               │
│  ┌──────────────┐                   ┌──────────────┐               │
│  │ Examine      │                   │ Run program  │               │
│  │ binary file  │                   │ in sandbox   │               │
│  │ without      │                   │ or debugger  │               │
│  │ executing    │                   │              │               │
│  └──────┬───────┘                   └──────┬───────┘               │
│         │                                   │                       │
│         ▼                                   ▼                       │
│  ┌──────────────┐                   ┌──────────────┐               │
│  │ + Complete   │                   │ + Real       │               │
│  │   code path  │                   │   behavior   │               │
│  │ + Safe       │                   │ + Handles    │               │
│  │   (no risk)  │                   │   unpacking  │               │
│  │ + Fast       │                   │ + Dynamic    │               │
│  │              │                   │   APIs       │               │
│  │ - Obfuscated │                   │ - Time-      │               │
│  │   code       │                   │   consuming  │               │
│  │ - Packed     │                   │ - Risky      │               │
│  │   binaries   │                   │ - Evasion    │               │
│  └──────────────┘                   └──────────────┘               │
│                                                                     │
│  Best Approach: Combine both for comprehensive analysis             │
└─────────────────────────────────────────────────────────────────────┘
```

### Static Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Initial Triage                                              │
│ • File type identification (file, binwalk)                         │
│ • Entropy analysis (detect packing/encryption)                      │
│ • String extraction (strings, FLOSS)                                │
│ • Hash calculation (MD5, SHA256)                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Step 2: Structural Analysis                                         │
│ • PE/ELF header analysis                                            │
│ • Import/Export table analysis                                      │
│ • Section analysis (code, data, resources)                          │
│ • Entropy per section                                               │
├─────────────────────────────────────────────────────────────────────┤
│ Step 3: Code Analysis                                               │
│ • Disassembly (objdump, IDA, Ghidra)                               │
│ • Decompilation (Hex-Rays, Ghidra, RetDec)                         │
│ • Control flow analysis                                             │
│ • Function identification                                           │
├─────────────────────────────────────────────────────────────────────┤
│ Step 4: Data Analysis                                               │
│ • Cross-references (xrefs)                                          │
│ • Data type identification                                          │
│ • String references                                                 │
│ • Constants and configurations                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Disassembly <a name="disassembly"></a>

### Disassembly Methods

```
┌─────────────────────────────────────────────────────────────────────┐
│ Method        │ Technique     │ Pros/Cons                           │
├─────────────────────────────────────────────────────────────────────┤
│ Linear        │ Decode from   │ ✅ Simple, fast                     │
│               │ start to end  │ ❌ Disassembles data as code        │
│               │               │ ❌ Cannot handle jumps              │
├─────────────────────────────────────────────────────────────────────┤
│ Recursive     │ Follow control│ ✅ Only disassembles reachable code│
│ Descent       │ flow graph    │ ✅ Handles indirect jumps           │
│               │               │ ❌ May miss code paths              │
├─────────────────────────────────────────────────────────────────────┤
│ Flow-sensitive│ Track context │ ✅ Most accurate                    │
│               │ and state     │ ❌ Complex implementation            │
│               │               │ ❌ May miss obfuscated paths        │
└─────────────────────────────────────────────────────────────────────┘
```

### objdump Disassembly

```bash
# Basic disassembly
objdump -d ./binary

# Intel syntax (easier to read)
objdump -d -M intel ./binary

# With source code (if compiled with -g)
objdump -d -S ./binary

# Disassemble specific section
objdump -d -j .text ./binary

# Demangle C++ symbols
objdump -d -C ./binary

# Filter specific address range
objdump -d --start-address=0x401000 --stop-address=0x401100 ./binary

# Example output:
# 0000000000401000 <main>:
#   401000:   55                      push   rbp
#   401001:   48 89 e5                mov    rbp,rsp
#   401004:   48 83 ec 20             sub    rsp,0x20
#   401008:   89 7d ec                mov    DWORD PTR [rbp-0x14],edi
#   40100b:   48 89 75 e0             mov    QWORD PTR [rbp-0x20],rsi
#   40100f:   c7 45 fc 00 00 00 00    mov    DWORD PTR [rbp-0x4],0x0
```

### ndisasm (Raw Binary Disassembly)

```bash
# Disassemble raw binary (no headers)
ndisasm -b 32 raw_binary.bin    # 32-bit
ndisasm -b 64 raw_binary.bin    # 64-bit

# With offset
ndisasm -b 32 -o 0x401000 raw_binary.bin

# Disassemble at offset
ndisasm -b 32 -e 0x100 raw_binary.bin  # Skip first 256 bytes
```

### Radare2 Disassembly

```bash
# Open binary
r2 -A ./binary

# Common commands:
[0x00401000]> aaa           # Analyze all
[0x00401000]> pdf @main     # Disassemble function
[0x00401000]> s 0x401000    # Seek to address
[0x00401000]> pd 20         # Disassemble 20 instructions
[0x00401000]> pdf           # Print disassembly function
[0x00401000]> axt @main     # Cross-references to main
[0x00401000]> axf @main     # Cross-references from main
```

### IDA Pro Disassembly

```
IDA Pro Disassembly View:
┌─────────────────────────────────────────────────────────────────────┐
│ IDA View-A                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ .text:00401000                                                     │
│ .text:00401000 ; =============== S U B R O U T I N E ============= │
│ .text:00401000                                                       │
│ .text:00401000 ; int __cdecl main(int argc, const char **argv)    │
│ .text:00401000 public main                                          │
│ .text:00401000 main        proc near                                │
│ .text:00401000                                                       │
│ .text:00401000 arg_0       = dword ptr  8                          │
│ .text:00401000 arg_4       = qword ptr  10h                        │
│ .text:00401000                                                       │
│ .text:00401000             push    rbp                              │
│ .text:00401001             mov     rbp, rsp                        │
│ .text:00401004             sub     rsp, 20h                        │
│ .text:00401008             mov     [rbp+arg_0], edi                │
│ .text:0040100B             mov     [rbp+arg_4], rsi                │
│ .text:0040100F             mov     [rbp+var_4], 0                  │
│ .text:00401016             lea     rax, aHelloWorld ; "Hello      │
│ .text:0040101D             mov     rdi, rax                        │
│ .text:00401020             call    _puts                           │
│ .text:00401025             mov     eax, 0                          │
│ .text:0040102A             leave                                   │
│ .text:0040102B             retn                                    │
│ .text:0040102B main        endp                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Decomilation <a name="decompilation"></a>

### Decompilation Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Decompilation Pipeline                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Binary ──→ Disassembly ──→ Control Flow ──→ Data Flow ──→ C Code  │
│             (instructions)   Recovery         Recovery    (pseudo)  │
│                                                                     │
│  Challenges:                                                        │
│  • Lost type information                                            │
│  • Compiler optimizations                                           │
│  • Missing variable names                                           │
│  • Complex control flow                                             │
│  • Inline functions                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Ghidra Decompilation

```java
// Ghidra Script Example - Find functions with specific API calls
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;
import java.util.*;

public class FindAPIUsage extends GhidraScript {
    @Override
    public void run() throws Exception {
        Listing listing = currentProgram.getListing();
        ReferenceManager refMgr = currentProgram.getReferenceManager();
        
        // Find all references to CreateFileA
        List<Reference> refs = new ArrayList<>();
        for (Reference ref : refMgr.getReferencesTo(
                toAddr("KERNEL32.dll/CreateFileA"))) {
            Function func = listing.getFunctionContaining(ref.getFromAddress());
            if (func != null) {
                println("CreateFileA called from: " + func.getName());
            }
        }
    }
}
```

### Hex-Rays Decompiler Output

```
// Original assembly:
// mov [rbp-0x10], edi          ; argc
// mov [rbp-0x18], rsi          ; argv
// mov dword ptr [rbp-0x4], 0   ; result = 0
// cmp dword ptr [rbp-0x10], 2  ; if (argc != 2)
// jnz short loc_401025
// lea rax, [rbp+arg_8]
// mov rdi, rax
// call check_password
// test eax, eax
// jnz short loc_401025
// mov dword ptr [rbp-0x4], 1   ; result = 1

// Decompiled output:
int main(int argc, char **argv)
{
    int result = 0;
    if (argc == 2)
    {
        if (!check_password(argv[1]))
            result = 1;
    }
    return result;
}
```

### RetDec (Open Source Decompiler)

```bash
# Install RetDec
git clone https://github.com/avast/retdec.git
mkdir retdec/build && cd retdec/build
cmake .. && make -j$(nproc)

# Use RetDec
retdec-decompiler ./binary
retdec-decompiler -p x86-64 -e elf ./binary  # Specify arch and format

# RetDec outputs:
# - C-like pseudocode
# - Function signatures
# - Type information
# - Control flow graphs
```

---

## 4. String Analysis <a name="strings"></a>

### Basic String Extraction

```bash
# Basic strings extraction
strings ./binary

# With minimum length
strings -n 4 ./binary

# ASCII only
strings -a ./binary

# Unicode (UTF-16) strings
strings -el ./binary

# All encodings
strings -e l ./binary    # 16-bit little-endian
strings -e L ./binary    # 32-bit little-endian
strings -e b ./binary    # 64-bit big-endian

# Output to file
strings -n 4 ./binary > strings.txt

# Sort and deduplicate
strings -n 4 ./binary | sort | uniq > strings_unique.txt
```

### FLOSS (FireEye's String Extractor)

```bash
# FLOSS extracts:
# - Static strings
# - Stack strings
# - Tight strings (encoded)
# - Decoded strings

# Install
pip install floss

# Basic usage
floss ./binary

# With analysis
floss --analysis ./binary

# Decode specific encoding
floss --decode all ./binary

# Example output:
# [!] Stack strings:
#   0x401234: "cmd.exe /c"
#   0x401240: "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
#   
# [!] Tight strings:
#   0x402000: "password123" (XOR decoded with key 0x37)
```

### String Analysis Techniques

```
┌─────────────────────────────────────────────────────────────────────┐
│ String Type            │ Indicators                                 │
├─────────────────────────────────────────────────────────────────────┤
│ C String               │ Null-terminated (0x00)                     │
│ Pascal String          │ Length prefix (first byte)                 │
│ Unicode (UTF-16)       │ Null between each ASCII character         │
│ Stack String           │ Built character by character on stack      │
│ Encoded String         │ XOR, Base64, ROT13, custom encoding       │
│ String in Resource     │ Embedded in PE resources                  │
│ String Constant Pool   │ Shared strings in .rdata section          │
└─────────────────────────────────────────────────────────────────────┘
```

### String Decoding Scripts

```python
#!/usr/bin/env python3
# string_decoder.py - Decode common obfuscation

import sys

def xor_decode(data, key):
    return bytes([b ^ key for b in data])

def rot13(s):
    result = []
    for c in s:
        if 'a' <= c <= 'z':
            result.append(chr((ord(c) - ord('a') + 13) % 26 + ord('a')))
        elif 'A' <= c <= 'Z':
            result.append(chr((ord(c) - ord('A') + 13) % 26 + ord('A')))
        else:
            result.append(c)
    return ''.join(result)

def base64_decode(s):
    import base64
    return base64.b64decode(s).decode()

# Example: Find XOR-encoded strings
with open(sys.argv[1], 'rb') as f:
    data = f.read()

# Try single-byte XOR
for key in range(256):
    decoded = xor_decode(data[0x1000:0x1020], key)
    if decoded.isascii() and decoded.isprintable():
        print(f"Key 0x{key:02x}: {decoded}")
```

---

## 5. Import/Export Tables <a name="imports"></a>

### Import Table Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│ DLL/Shared Library          │ Common Purpose                        │
├─────────────────────────────────────────────────────────────────────┤
│ KERNEL32.dll                │ Core Windows API                      │
│   - CreateFileA/W          │ File operations                       │
│   - ReadFile/WriteFile     │ File I/O                              │
│   - VirtualAlloc/Free      │ Memory management                     │
│   - CreateProcessA/W       │ Process creation                      │
│   - LoadLibrary/GetProcAddress │ Dynamic loading                   │
│   - GetTickCount           │ Timing (anti-debugging)               │
├─────────────────────────────────────────────────────────────────────┤
│ USER32.dll                  │ User interface                        │
│   - MessageBoxA/W          │ Message boxes                         │
│   - GetAsyncKeyState       │ Keylogging                            │
│   - SetWindowsHookExA/W    │ Hooking                               │
├─────────────────────────────────────────────────────────────────────┤
│ ADVAPI32.dll               │ Security and registry                 │
│   - RegSetValueExA/W       │ Registry modification                 │
│   - CryptEncrypt/Decrypt   │ Cryptography                          │
├─────────────────────────────────────────────────────────────────────┤
│ WS2_32.dll                  │ Network operations                    │
│   - socket/connect/send    │ Network communication                 │
├─────────────────────────────────────────────────────────────────────┤
│ WININET.dll                 │ Internet operations                   │
│   - InternetOpenA/W        │ HTTP connections                      │
│   - HttpSendRequestA/W     │ HTTP requests                         │
├─────────────────────────────────────────────────────────────────────┤
│ ntdll.dll                   │ NT kernel interface                   │
│   - NtCreateProcess        │ Native API (less monitored)           │
│   - NtMapViewOfSection     │ Memory mapping                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Import Table Tools

```bash
# pefile (Python)
python3 -c "
import pefile
pe = pefile.PE('binary.exe')
for entry in pe.DIRECTORY_ENTRY_IMPORT:
    print(f'\\n{entry.dll.decode()}:')
    for imp in entry.imports:
        print(f'  {imp.name.decode() if imp.name else \"Ordinal \" + str(imp.ordinal)}')
"

# dumpbin (Visual Studio)
dumpbin /imports binary.exe

# readelf (Linux)
readelf -d binary | grep NEEDED
readelf --dyn-syms binary

# pestudio (Windows GUI)
# - Shows suspicious imports
# - Highlights API commonly used by malware
# - Shows entropy per section
```

### Export Table Analysis

```bash
# Check exports
readelf --dyn-syms binary
objdump -T binary

# Example output:
#  0000000000401000     F .text  0000001a exported_function
#  0000000000402000     O .data  00000004 exported_variable

# PE exports
dumpbin /exports binary.exe

# Common export patterns in malware:
# - DllMain (required for DLLs)
# - Export with ordinal only (no name) - hiding functionality
# - Forwarded exports - redirecting to another DLL
```

---

## 6. PE File Format <a name="pe"></a>

### PE Structure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PE File Format Structure                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐                                           │
│  │ DOS Header (MZ)     │ 64 bytes                                  │
│  │ • e_magic = 0x5A4D  │ "MZ" signature                           │
│  │ • e_lfanew          │ Offset to PE header                       │
│  ├─────────────────────┤                                           │
│  │ DOS Stub            │ "This program cannot be run in DOS mode"  │
│  ├─────────────────────┤                                           │
│  │ PE Signature        │ "PE\0\0" (0x00004550)                    │
│  ├─────────────────────┤                                           │
│  │ COFF File Header    │ Machine type, number of sections          │
│  ├─────────────────────┤                                           │
│  │ Optional Header     │ Entry point, image base, subsystem        │
│  ├─────────────────────┤                                           │
│  │ Section Headers     │ .text, .data, .rdata, .rsrc, etc.         │
│  ├─────────────────────┤                                           │
│  │ Section Data        │ Actual code and data                      │
│  └─────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### PE Header Analysis

```python
#!/usr/bin/env python3
# pe_analyzer.py - Analyze PE file structure

import pefile
import sys

def analyze_pe(filename):
    pe = pefile.PE(filename)
    
    print(f"=== PE Analysis: {filename} ===")
    print(f"Machine: {hex(pe.FILE_HEADER.Machine)}")
    print(f"Sections: {pe.FILE_HEADER.NumberOfSections}")
    print(f"Timestamp: {hex(pe.FILE_HEADER.TimeDateStamp)}")
    print(f"Entry Point: {hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)}")
    print(f"Image Base: {hex(pe.OPTIONAL_HEADER.ImageBase)}")
    print(f"Subsystem: {pe.OPTIONAL_HEADER.Subsystem}")
    
    print("\n=== Sections ===")
    for section in pe.sections:
        name = section.Name.decode().rstrip('\x00')
        print(f"{name:8s} VA: {hex(section.VirtualAddress):10s} "
              f"Size: {hex(section.SizeOfRawData):10s} "
              f"Entropy: {section.get_entropy():.2f}")
    
    print("\n=== Imports ===")
    if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
        for entry in pe.DIRECTORY_ENTRY_IMPORT:
            print(f"\n{entry.dll.decode()}:")
            for imp in entry.imports:
                name = imp.name.decode() if imp.name else f"Ordinal {imp.ordinal}"
                print(f"  {name}")
    
    # Check for suspicious characteristics
    print("\n=== Security Indicators ===")
    if pe.OPTIONAL_HEADER.DllCharacteristics & 0x0020:
        print("⚠ ASLR enabled")
    if pe.OPTIONAL_HEADER.DllCharacteristics & 0x0100:
        print("✓ DEP/NX enabled")
    if pe.OPTIONAL_HEADER.DllCharacteristics & 0x0400:
        print("⚠ CFG enabled")
    
    # Check for packing indicators
    for section in pe.sections:
        if section.get_entropy() > 7.0:
            print(f"⚠ High entropy in {section.Name.decode()}: {section.get_entropy():.2f} (possible packing)")

if __name__ == "__main__":
    analyze_pe(sys.argv[1])
```

### PE Characteristics Flags

```
┌─────────────────────────────────────────────────────────────────────┐
│ COFF Characteristics (FILE_HEADER.Machine)                         │
├─────────────────────────────────────────────────────────────────────┤
│ 0x014c  │ i386 (x86)                                               │
│ 0x8664  │ AMD64 (x64)                                               │
│ 0x01c0  │ ARM                                                       │
│ 0xaa64  │ ARM64                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Section Flags (Characteristics)                                     │
├─────────────────────────────────────────────────────────────────────┤
│ 0x00000020  │ Contains executable code                             │
│ 0x00000040  │ Contains initialized data                            │
│ 0x00000080  │ Contains uninitialized data                          │
│ 0x02000000  │ Can be discarded                                      │
│ 0x04000000  │ Shared section                                        │
│ 0x10000000  │ Executable                                            │
│ 0x20000000  │ Readable                                              │
│ 0x40000000  │ Writable                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ DLL Characteristics (Optional Header)                              │
├─────────────────────────────────────────────────────────────────────┤
│ 0x0020  │ HIGH_ENTROPY_VA (64-bit ASLR)                            │
│ 0x0040  │ DYNAMIC_BASE (ASLR enabled)                              │
│ 0x0080  │ FORCE_INTEGRITY                                          │
│ 0x0100  │ NX_COMPAT (DEP enabled)                                  │
│ 0x0200  │ NO_ISOLATION                                             │
│ 0x0400  │ NO_SEH                                                   │
│ 0x0800  │ NO_BIND                                                  │
│ 0x1000  │ APPCONTAINER                                             │
│ 0x2000  │ WDM_DRIVER                                               │
│ 0x4000  │ GUARD_CF (Control Flow Guard)                            │
│ 0x8000  │ TERMINAL_SERVER_AWARE                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### PE Resources

```
┌─────────────────────────────────────────────────────────────────────┐
│ Resource Type            │ Description                              │
├─────────────────────────────────────────────────────────────────────┤
│ RT_CURSOR               │ Cursor images                            │
│ RT_BITMAP               │ Bitmap images                            │
│ RT_ICON                 │ Icon images                              │
│ RT_MENU                 │ Menus                                    │
│ RT_DIALOG               │ Dialog boxes                             │
│ RT_STRING               │ String tables                            │
│ RT_FONT                 │ Fonts                                    │
│ RT_ACCELERATOR          │ Keyboard accelerators                    │
│ RT_RCDATA               │ Raw data (config, encrypted data)        │
│ RT_MESSAGETABLE         │ Message tables                           │
│ RT_GROUP_CURSOR         │ Cursor groups                            │
│ RT_GROUP_ICON           │ Icon groups                              │
│ RT_VERSION              │ Version information                      │
│ RT_MANIFEST             │ XML manifest                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. ELF File Format <a name="elf"></a>

### ELF Structure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ELF File Format Structure                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐                                           │
│  │ ELF Header          │ 52 bytes (32-bit) / 64 bytes (64-bit)    │
│  │ • e_ident[16]      │ Magic number, class, data encoding        │
│  │ • e_type            │ ET_EXEC, ET_DYN, ET_REL                   │
│  │ • e_machine         │ EM_386, EM_X86_64                         │
│  │ • e_entry           │ Entry point address                       │
│  ├─────────────────────┤                                           │
│  │ Program Headers     │ Segments (for execution)                  │
│  │ (Segment Table)     │                                           │
│  ├─────────────────────┤                                           │
│  │ Section Headers     │ Sections (for linking)                    │
│  │ (Section Table)     │                                           │
│  ├─────────────────────┤                                           │
│  │ .text               │ Executable code                           │
│  ├─────────────────────┤                                           │
│  │ .rodata             │ Read-only data                            │
│  ├─────────────────────┤                                           │
│  │ .data               │ Initialized data                          │
│  ├─────────────────────┤                                           │
│  │ .bss                │ Uninitialized data                        │
│  ├─────────────────────┤                                           │
│  │ .plt/.got           │ Dynamic linking                           │
│  ├─────────────────────┤                                           │
│  │ .symtab/.strtab     │ Symbol table                              │
│  └─────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### ELF Header Analysis

```bash
# ELF header
readelf -h binary

# Example output:
# ELF Header:
#   Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
#   Class:                             ELF64
#   Data:                              2's complement, little endian
#   Version:                           1 (current)
#   OS/ABI:                            UNIX - System V
#   Type:                              DYN (Shared object)
#   Machine:                           Advanced Micro Devices X86-64
#   Entry point address:               0x1060
#   Start of program headers:          64 (bytes into file)
#   Start of section headers:          13456 (bytes into file)

# Section headers
readelf -S binary

# Program headers (segments)
readelf -l binary

# Dynamic section
readelf -d binary

# Symbol table
readelf -s binary
```

### ELF Section Types

```
┌─────────────────────────────────────────────────────────────────────┐
│ Section       │ Purpose                    │ Permissions            │
├─────────────────────────────────────────────────────────────────────┤
│ .text         │ Executable code           │ R-X (execute)          │
│ .plt          │ Procedure linkage table   │ R-X                    │
│ .rodata       │ Read-only data            │ R-- (read only)        │
│ .data         │ Initialized global data   │ RW- (read/write)       │
│ .bss          │ Uninitialized global data │ RW-                    │
│ .got          │ Global offset table       │ RW-                    │
│ .dynamic      │ Dynamic linking info      │ RW-                    │
│ .dynsym       │ Dynamic symbol table      │ R--                    │
│ .dynstr       │ Dynamic string table      │ R--                    │
│ .symtab       │ Symbol table              │ R--                    │
│ .strtab       │ String table              │ R--                    │
│ .shstrtab     │ Section header strings    │ R--                    │
│ .init/.fini   │ Constructor/destructor    │ R-X                    │
│ .note.*       │ Note sections             │ R--                    │
│ .debug_*      │ Debug information         │ R--                    │
└─────────────────────────────────────────────────────────────────────┘
```

### ELF Relocation and Dynamic Linking

```bash
# Check dynamic dependencies
ldd ./binary
# linux-vdso.so.1 (0x00007ffd...)
# libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
# /lib64/ld-linux-x86-64.so.2

# Check PLT/GOT
objdump -d -j .plt ./binary
objdump -R ./binary  # Relocations

# Example PLT entry:
# 0000000000401020 <printf@plt>:
#   401020:   ff 35 32 10 20 00       push   QWORD PTR [rip+0x201032]
#   401026:   ff 25 34 10 20 00       jmp    QWORD PTR [rip+0x201034]
#   40102c:   0f 1f 40 00             nop    DWORD PTR [rax+0x0]
```

---

## 8. Ghidra Basics <a name="ghidra"></a>

### Ghidra Installation and Setup

```bash
# Download Ghidra
wget https://github.com/NationalSecurityAgency/ghidra/releases/latest

# Extract
unzip ghidra_*_public.zip
cd ghidra_*_public

# Run
./ghidraRun

# First time setup:
# 1. Create project directory
# 2. Set home directory
# 3. Configure analysis options
```

### Ghidra Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Ghidra Analysis Workflow                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Import Binary                                                   │
│     File → Import File → Select binary                             │
│                                                                     │
│  2. Auto-Analysis                                                   │
│     Analysis → Auto Analysis (or 'A' shortcut)                     │
│     Options:                                                        │
│     ✓ Aggressive instruction finder                                 │
│     ✓ Aggressive match                                              │
│     ✓ Create address tables                                         │
│     ✓ Create cross-references                                       │
│     ✓ Propagate external symbols                                    │
│                                                                     │
│  3. Review Functions                                                │
│     Window → Function Graph                                         │
│     Window → Defined Strings                                       │
│     Window → Symbol Tree                                            │
│                                                                     │
│  4. Rename and Annotate                                             │
│     • Right-click → Rename Function                                │
│     • Right-click → Set Parameter Types                            │
│     • Add comments (; for plate, : for regular)                    │
│                                                                     │
│  5. Export                                                          │
│     File → Export Program                                           │
│     Formats: XML, C, Python, etc.                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Ghidra Key Features

```
┌─────────────────────────────────────────────────────────────────────┐
│ Feature                │ Description                                │
├─────────────────────────────────────────────────────────────────────┤
│ Decompiler             │ High-level C-like pseudocode              │
│ Cross-References       │ Navigate code/data references             │
│ Function ID            │ Identify compiler/library functions       │
│ Ghidra Scripting       │ Python/Java automation                    │
│ Multi-language         │ x86, ARM, MIPS, PowerPC, etc.           │
│ Version Tracking       │ Compare binary versions                   │
│ P-code                 │ Intermediate representation               │
│ Graph View             │ Control flow visualization                │
│ Listing View           │ Disassembly with annotations              │
│ Decompiler View        │ Decompiled pseudocode                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Ghidra Scripts

```python
# Ghidra Python Script Example
# Find all string references

from ghidra.program.model.symbol import ReferenceType
from ghidra.app.decompiler import DecompInterface

# Get listing
listing = currentProgram.getListing()
memory = currentProgram.getMemory()

# Find all strings
for func in listing.getFunctions(True):
    decomp = DecompInterface()
    decomp.openProgram(currentProgram)
    
    results = decomp.decompileFunction(func, 30, monitor)
    if results and results.decompileCompleted():
        code = results.getDecompiledFunction().getC()
        if "cmd.exe" in code or "password" in code:
            print(f"Interesting function: {func.getName()}")
```

---

## 9. Security Perspective <a name="security"></a>

### Vulnerability Detection in Static Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│ Vulnerable Function     │ Risk         │ Detection                  │
├─────────────────────────────────────────────────────────────────────┤
│ gets()                  │ Buffer overflow │ Search for gets calls    │
│ strcpy()                │ Buffer overflow │ Search for strcpy calls  │
│ strcat()                │ Buffer overflow │ Search for strcat calls  │
│ sprintf()               │ Format string  │ Unbounded sprintf        │
│ scanf()                 │ Buffer overflow │ %s without width         │
│ printf(user_input)      │ Format string  │ User-controlled format   │
│ system(user_input)      │ Command inject │ User-controlled command  │
│ eval(user_input)        │ Code injection │ User-controlled eval     │
└─────────────────────────────────────────────────────────────────────┘
```

### Security Feature Analysis

```bash
# Check binary security features
checksec --file=binary

# Or manually:
# RELRO:     Full RELRO (GOT is read-only)
# Stack:     Canary found (stack protection)
# NX:        NX enabled (non-executable stack)
# PIE:       PIE enabled (position independent)
# RPATH:     No RPATH
# RUNPATH:   No RUNPATH
# Symbols:   No symbols stripped

# ASM analysis for vulnerabilities:
# • No stack canary: Missing __stack_chk_fail reference
# • No PIE: Fixed addresses in binary
# • No RELRO: Writable GOT
# • No NX: Executable stack segment
```

### Malware Indicators in Static Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│ Indicator               │ Analysis                                 │
├─────────────────────────────────────────────────────────────────────┤
│ High entropy sections   │ Packed/encrypted code                    │
│ Unusual imports         │ Anti-debugging, injection APIs           │
│ String obfuscation      │ Hidden C2, commands                      │
│ No imports (dynamic)    │ API hashing, runtime resolution          │
│ Custom entry point      │ Packer stub                              │
│ Overlay data            │ Encrypted payload                        │
│ Resource anomalies      │ Embedded executables                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Malware Analysis Context <a name="malware"></a>

### Malware Static Analysis Checklist

```
□ File Identification
  □ Magic bytes, file type
  □ Hashes (MD5, SHA1, SHA256)
  □ File size, compilation timestamp

□ PE/ELF Analysis
  □ Import table review
  □ Export table review
  □ Section analysis (entropy, names)
  □ Resource analysis

□ String Analysis
  □ ASCII/Unicode strings
  □ Decoded/encrypted strings
  □ URL/IP patterns
  □ Registry keys
  □ File paths

□ Code Analysis
  □ Disassembly review
  □ Decompile key functions
  □ Identify main behavior
  □ Find C2 communication
  □ Identify persistence mechanisms

□ YARA Rules
  □ Match against known malware families
  □ Create custom rules
```

### Common Malware Patterns

```asm
; API Hashing (avoids static detection)
resolve_api:
    ; Walk PEB → LDR → InMemoryOrderModuleList
    mov eax, fs:[0x30]      ; PEB
    mov eax, [eax+0x0C]     ; PEB->Ldr
    mov esi, [eax+0x14]     ; InMemoryOrderModuleList
    
    ; Hash function names
    lodsd                   ; Get module name
    call hash_string        ; Calculate hash
    cmp eax, TARGET_HASH    ; Compare with target
    jne next_module
    
    ; Found module, now find function
    ; ... (similar process for function names)

; XOR Encryption Loop
decrypt:
    lea esi, [encrypted_data]
    mov ecx, data_length
    mov al, XOR_KEY
.loop:
    xor byte [esi], al
    inc esi
    loop .loop

; Process Hollowing
; 1. CreateProcess (suspended)
; 2. NtUnmapViewOfSection (unmap legitimate code)
; 3. VirtualAllocEx (allocate in target)
; 4. WriteProcessMemory (write malicious code)
; 5. SetThreadContext (set new entry point)
; 6. ResumeThread (execute malicious code)
```

---

## 11. Interview Questions <a name="interview"></a>

### Fundamental Questions

1. **What is the difference between disassembly and decompilation?**
   - Disassembly: Binary → Assembly code (one-to-one mapping)
   - Decompilation: Binary → High-level C-like code (lossy transformation)
   - Disassembly is more accurate; decompilation is more readable
   - Decompilation may lose type information and variable names

2. **How do you detect if a binary is packed?**
   - High entropy (>7.0) in code sections
   - Small import table with unusual APIs
   - Discrepancy between virtual and raw sizes
   - Entry point outside .text section
   - Presence of packer signatures (UPX, ASPack)

3. **What is the purpose of the GOT (Global Offset Table)?**
   - Stores addresses of dynamically linked functions
   - Enables lazy binding (resolve on first call)
   - Allows position-independent code
   - Can be modified (GOT overwrite attack)
   - Full RELRO makes GOT read-only after initialization

4. **Explain the PE section naming conventions.**
   - .text: Executable code
   - .data: Initialized global variables
   - .rdata: Read-only data (constants, strings)
   - .bss: Uninitialized global variables
   - .rsrc: Resources (icons, dialogs, etc.)
   - .reloc: Relocation information

### Advanced Questions

5. **How does position-independent code (PIC) work in x64?**
   - Uses RIP-relative addressing for all data access
   - No absolute addresses needed
   - Allows code to be loaded at any address
   - Required for ASLR and shared libraries

6. **What are cross-references (xrefs) and why are they important?**
   - Show where data/code is referenced from
   - Help understand code flow and data usage
   - Identify function calls, string references
   - Trace data flow through the program
   - Essential for understanding malware behavior

7. **How would you analyze a multi-stage dropper?**
   - Stage 1: Initial loader (usually packed)
   - Stage 2: Unpacked loader (decrypts stage 3)
   - Stage 3: Main payload
   - Use debugger to dump each stage
   - Analyze each stage separately

8. **Explain entropy analysis and its limitations.**
   - Measures randomness of data (0-8 scale)
   - High entropy (>7.0) suggests encryption/packing
   - Limitations: Compressed data also has high entropy
   - Doesn't distinguish between compression and encryption
   - Must analyze code flow for confirmation

---

## 12. Hands-On Labs <a name="labs"></a>

### Lab 1: Basic String Analysis

```bash
# Task: Analyze strings in a suspicious binary
# 1. Extract all strings
strings -n 4 suspicious.exe > strings.txt

# 2. Find URLs
grep -i "http://" strings.txt
grep -i "https://" strings.txt

# 3. Find IP addresses
grep -Eo "([0-9]{1,3}\.){3}[0-9]{1,3}" strings.txt

# 4. Find registry keys
grep -i "HKEY_" strings.txt

# 5. Find file paths
grep -i "C:\\\\" strings.txt
grep -i "/tmp/" strings.txt

# 6. Find email addresses
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" strings.txt
```

### Lab 2: Import Analysis

```bash
# Task: Analyze imports to determine functionality
# 1. List all imports
python3 -c "
import pefile
pe = pefile.PE('malware.exe')
for entry in pe.DIRECTORY_ENTRY_IMPORT:
    print(f'{entry.dll.decode()}:')
    for imp in entry.imports:
        print(f'  {imp.name.decode() if imp.name else \"Ordinal \" + str(imp.ordinal)}')
" > imports.txt

# 2. Categorize imports:
# - Network: WinHTTP, WinINet, WS2_32
# - File: CreateFile, ReadFile, WriteFile
# - Process: CreateProcess, VirtualAlloc, WriteProcessMemory
# - Registry: RegSetValue, RegCreateKey
# - Crypto: CryptEncrypt, CryptDecrypt

# 3. Determine likely malware type based on imports
```

### Lab 3: Ghidra Analysis

```bash
# Task: Decompile and analyze a function
# 1. Import binary into Ghidra
# 2. Run auto-analysis
# 3. Find main function
# 4. Decompile (Decompiler window)
# 5. Rename variables and parameters
# 6. Add comments explaining behavior
# 7. Identify:
#    - What APIs are called
#    - What strings are referenced
#    - What the function returns
#    - Any suspicious behavior
```

### Lab 4: PE Structure Analysis

```python
# Task: Write a PE analyzer script
# Create pe_analyzer.py that outputs:
# - File hashes
# - PE header information
# - Section details with entropy
# - Import table organized by DLL
# - Resource information
# - Security indicators (ASLR, DEP, CFG)

# Test on:
# - Normal executable (low entropy, expected imports)
# - Packed executable (high entropy, minimal imports)
# - DLL with exports
```

### Lab 5: YARA Rule Creation

```bash
# Task: Create YARA rules for detected patterns
# Create malware_rules.yar:

rule suspicious_strings {
    strings:
        $s1 = "cmd.exe /c" nocase
        $s2 = "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        $s3 = "password" nocase
        $s4 = "keylog" nocase
    condition:
        2 of them
}

rule network_indicators {
    strings:
        $http = "http://" nocase
        $ip = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/
    condition:
        $http and $ip
}

rule packed_binary {
    condition:
        filesize < 100KB and
        (entropy > 7.5 for 20% of filesize) and
        imports(/kernel32\.dll VirtualAlloc/)
}

# Test with:
yara malware_rules.yar suspicious.exe
```

---

## 13. Summary <a name="summary"></a>

### Tool Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tool           │ Purpose                     │ Platform            │
├─────────────────────────────────────────────────────────────────────┤
│ objdump        │ Disassembly                 │ Linux               │
│ Ghidra         │ Disassembly + Decompilation │ Cross-platform      │
│ IDA Pro        │ Professional disassembly    │ Cross-platform      │
│ Radare2        │ Scriptable disassembly      │ Cross-platform      │
│ strings        │ String extraction           │ Cross-platform      │
│ FLOSS          │ Advanced string extraction  │ Cross-platform      │
│ pefile         │ PE analysis (Python)        │ Cross-platform      │
│ readelf        │ ELF analysis                │ Linux               │
│ PE-bear        │ PE viewing                  │ Windows             │
│ pestudio       │ PE static analysis          │ Windows             │
└─────────────────────────────────────────────────────────────────────┘
```

### Static Analysis Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────┐
│ Quick Analysis Commands                                            │
├─────────────────────────────────────────────────────────────────────┤
│ File type:       file binary                                       │
│ Hashes:          md5sum binary; sha256sum binary                   │
│ Strings:         strings -n 4 binary                               │
│ ELF info:        readelf -a binary                                 │
│ ELF imports:     readelf --dyn-syms binary                         │
│ ELF sections:    readelf -S binary                                 │
│ PE imports:      python3 -c "import pefile; ..."                   │
│ Disassembly:     objdump -d -M intel binary                        │
│ Entropy:         binwalk -E binary                                 │
│ YARA scan:       yara rules.yar binary                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Study Progression

```
Beginner: Strings → File identification → Basic disassembly
    ↓
Intermediate: Import analysis → PE/ELF structure → Ghidra basics
    ↓
Advanced: Decompilation → Scripting → Vulnerability analysis → Malware
```

---

*Last Updated: 2026*
*For educational and authorized security testing purposes only*
