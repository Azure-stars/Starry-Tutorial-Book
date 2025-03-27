# 硬件抽象层模块
硬件抽象层为特定平台的操作提供了统一的API。它负责指定平台的引导和初始化过程，并提供对硬件的实用操作。
## 当前支持的平台（通过Cargo特性指定）
- x86-pc：标准PC，支持x86_64指令集体系结构。  
- riscv64-qemu-virt：QEMU virt虚拟机，支持RISC-V指令集体系结构。  
- aarch64-qemu-virt：QEMU virt虚拟机，支持AArch64指令集体系结构。  
- aarch64-raspi：Raspberry Pi，支持AArch64指令集体系结构。  
- dummy：如果未选择上述任何平台，将使用dummy平台。在此平台上，大多数操作都是空操作（no-op）或未实现（unimplemented!()）。此平台主要用于Cargo测试。
## Cargo特性
- smp：启用SMP（对称多处理）支持。  
- fp_simd：启用浮点运算和SIMD支持。  
- paging：启用页面表操作。  
- irq：启用中断处理支持。