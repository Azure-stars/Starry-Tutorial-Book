# 模块接口与用例

## 体系架构相关的类型和操作


### 结构体

- `ExtendedState`  
  任务的扩展状态，例如浮点运算（FP）和SIMD状态。

- `FxsaveArea`  
  一个512字节的内存区域，用于FXSAVE/FXRSTOR指令，以保存和恢复x87 FPU、MMX、XMM和MXCSR寄存器。

- `GdtStruct`  
  全局描述符表（GDT）的封装，最多支持16个条目。

- `IdtStruct`  
  中断描述符表（IDT）的封装。

- `TaskContext`  
  任务保存的硬件状态。

- `TrapFrame`  
  当发生陷阱（中断或异常）时保存的寄存器。

- `UspaceContext`  `uspace`
  进入用户空间的上下文。

### 函数

- `cpu_init`  
  初始化当前CPU的状态。

- `disable_irqs`  
  使当前CPU忽略中断。

- `enable_irqs`  
  允许当前CPU响应中断。

- `flush_tlb`  
  刷新TLB（翻译后备缓冲器）。

- `halt`  
  暂停当前CPU。

- `init_gdt`  
  初始化每个CPU的TSS和GDT结构，并将它们加载到当前CPU中。

- `init_idt`  
  初始化全局IDT并将其加载到当前CPU中。

- `init_syscall``uspace`  
  初始化系统调用支持并设置系统调用处理程序。

- `irqs_enabled`  
  返回当前CPU是否被允许响应中断。

- `read_page_table_root`  
  读取存储当前页面表根的寄存器。

- `read_thread_pointer`  
  读取当前CPU的线程指针。

- `tss_get_rsp0`  
  返回当前TSS的特权级别0的堆栈指针（RSP0）。

- `tss_set_rsp0` ⚠  
  设置当前TSS的特权级别0的堆栈指针（RSP0）。

- `wait_for_irqs`  
  放松当前CPU并等待中断。

- `write_page_table_root` ⚠  
  写入寄存器以更新当前页面表根。

- `write_thread_pointer` ⚠  
  写入当前CPU的线程指针。

## 控制台输入和输出

### 函数

- `read_bytes`  
  从控制台读取字节到给定的可变切片中。返回读取的字节数。

- `write_bytes`  
  将字节切片写入控制台。

## CPU相关操作

### 函数

- `current_task_ptr`  
  获取当前任务的指针，具有抢占安全性。

- `set_current_task_ptr` ⚠  
  设置当前任务的指针，具有抢占安全性。

- `this_cpu_id`  
  返回当前CPU的ID。

- `this_cpu_is_bsp`  
  返回当前CPU是否为主CPU（也称为引导处理器或BSP）。

## 中断管理 `irq`

### 函数

- `register_handler`  
  为指定的IRQ注册一个中断处理程序。

- `set_enable`  
  启用或禁用指定的IRQ。

### 类型别名

- `IrqHandler`  
  中断处理程序的类型。

## 物理内存管理

### 重导出

- `pub use memory_addr::MemoryAddr;`  
- `pub use memory_addr::PAGE_SIZE_4K;`  
- `pub use memory_addr::PhysAddr;`  
- `pub use memory_addr::VirtAddr;`

### 结构体

- `MemRegion`  
  物理内存区域。

- `MemRegionFlags`  
  物理内存区域的标志。

### 函数

- `memory_regions`  
  返回所有物理内存区域的迭代器。

- `phys_to_virt`  
  将物理地址转换为虚拟地址。

- `virt_to_phys`  
  将虚拟地址转换为物理地址。

## 杂项操作(例如终止系统)

### 函数

- `terminate`  
  关闭整个系统（在QEMU中），包括所有CPU。

## 多核操作`smp`

### 函数

- `start_secondary_cpu`  
  使用其引导堆栈启动指定的次级CPU。

## 页面表操作`paging`

### 重导出

- `pub use page_table_multiarch::MappingFlags;`  
- `pub use page_table_multiarch::PageSize;`  
- `pub use page_table_multiarch::PagingError;`  
- `pub use page_table_multiarch::PagingResult;`

### 结构体

- `PagingHandlerImpl`  
  `[PagingHandler]`的实现，为`[page_table_multiarch]` crate提供物理内存操作。

### 函数

- `kernel_page_table_root`  
  获取内核页面表的根物理地址。

- `set_kernel_page_table_root`  
  保存内核页面表的根物理地址，可能在上下文切换时使用。

### 类型别名

- `PageTable`  
  特定于架构的页面表。

## 时间相关操作

### 结构体

- `Duration`  
  表示时间跨度的Duration类型，通常用于系统超时。

### 常量

- `MICROS_PER_SEC`  
  每秒的微秒数。

- `MILLIS_PER_SEC`  
  每秒的毫秒数。

- `NANOS_PER_MICROS`  
  每微秒的纳秒数。

- `NANOS_PER_MILLIS`  
  每毫秒的纳秒数。

- `NANOS_PER_SEC`  
  每秒的纳秒数。

- `TIMER_IRQ_NUMirq`  
  定时器IRQ编号。

### 函数

- `busy_wait`  
  忙等待指定的持续时间。

- `busy_wait_until`  
  忙等待直到达到指定的截止时间。

- `current_ticks`  
  返回当前硬件时钟的tick数。

- `epochoffset_nanos`  
  返回相对于单调时钟起点的纪元偏移量（以纳秒为单位，即挂钟时间偏移）。

- `monotonic_time`  
  返回系统启动以来经过的时间，以`TimeValue`表示。

- `monotonic_time_nanos`  
  返回系统启动以来经过的纳秒数。

- `nanos_to_ticks`  
  将纳秒转换为硬件tick数。

- `set_oneshot_timerirq`  
  设置一次性定时器。

- `ticks_to_nanos`  
  将硬件tick数转换为纳秒。

- `wall_time`  
  返回自纪元以来经过的时间（也称为实时时间），以`TimeValue`表示。

- `wall_time_nanos`  
  返回自纪元以来经过的纳秒数（也称为实时时间）。

### 类型别名

- `TimeValue`  
  系统时钟的测量值。

## 线程局部存储`tls`

### x86_64 布局
```

对齐    --> +-------------------------+- static_tls_offset
分配        |                         | \
            | .tdata                  |  |
| 地址      |                         |  |
| 向上增长  + - - - - - - - - - - - - +   > 静态 TLS 块
v           |                         |  |  (长度: static_tls_size)
            | .tbss                   |  |
            |                         |  |
            +-------------------------+  |
            | / 填充 / / / / / / / / / | /
            +-------------------------+
   tls_ptr -+-> 自身指针 (void *)    | \
(tp_offset) |                         |  |
            | 自定义 TCB 格式         |   > 线程控制块 (TCB)
            | (可能被某个 libC 使用)  |  |  (长度: TCB_SIZE)
            |                         |  |
            |                         | /
            +-------------------------+- (总长度: tls_area_size)
```
### AArch64 & RISC-V 布局

```
            +-------------------------+
            |                         | \
            | 自定义 TCB 格式         |  |
            | (可能被某个 libC 使用)  |   > 线程控制块 (TCB)
            |                         |  |  (长度: TCB_SIZE)
            |                         | /
   tls_ptr -+-------------------------+
(tp_offset) | GAP_ABOVE_TP            |
            +-------------------------+- static_tls_offset
            |                         | \
            | .tdata                  |  |
            |                         |  |
            + - - - - - - - - - - - - +   > 静态 TLS 块
            |                         |  |  (长度: static_tls_size)
            | .tbss                   |  |
            |                         | /
            +-------------------------+- (总长度: tls_area_size)
```

## 陷阱处理

### 静态数据

- `IRQ`  
  IRQ 处理函数片段。

- `PAGE_FAULT`  
  页面错误处理函数片段。

- `SYSCALL` `uspace`  
  系统调用处理函数片段。

### 属性宏

- `register_trap_handler`  
  注册陷阱处理程序

## 初始化

### 函数

- `platform_init`  
  初始化主 CPU 的平台设备。

- `platform_init_secondary` `smp` 
  初始化次要 CPU 的平台设备。

