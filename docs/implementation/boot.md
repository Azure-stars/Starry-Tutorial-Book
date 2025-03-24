# Starry 的启动与初始化

### 版本：

https://github.com/Starry-OS/Starry-Old#53c549a

Starry初始化依次执行以下内容，这里目前只覆盖单核情况

## arch_boot::src::platform::riscv64_qemu_virt::boot.rs:

从这里的_start启动

```rust
    core::arch::asm!("
        mv      s0, a0                  // save hartid
        
        mv      s1, a1                  // save DTB pointer
        
        la      sp, {boot_stack}
        li      t0, {boot_stack_size}
        add     sp, sp, t0              // setup boot stack

        call    {init_boot_page_table}
        call    {init_mmu}              // setup boot page table and enabel MMU

        li      s2, {phys_virt_offset}  // fix up virtual high address
        add     sp, sp, s2

        mv      a0, s0
        mv      a1, s1
        la      a2, {entry}
        add     a2, a2, s2
        jalr    a2                      // call rust_entry(hartid, dtb)
        j       ."						// loop forever to prevent undefine behavior
    )
```

## arch_boot::src::platform::riscv64_qemu_virt::rust_entry.rs:

随后进入rust_entry

```rust
unsafe extern "C" fn rust_entry(cpu_id: usize, dtb: usize) {
    axhal::mem::clear_bss(); 			// Fills the `.bss` section with zeros.
    axhal::cpu::init_primary(cpu_id);   // Initializes the primary CPU for its pointer.
    axhal::platform::time::init_board_info(dtb);   //Parse DTB, initialize CPU frequency
    axtrap::init_interrupt();			// To initialize the trap vector base address(stvec)
    axlog::init();
    axlog::set_max_level(option_env!("AX_LOG").unwrap_or("")); // no effect if set `log-level-*` features

    axruntime::rust_main(cpu_id, dtb); // kernel submodules, i.e. paging/process/fs/net, initialization

    while !axruntime::is_init_ok() {
        core::hint::spin_loop();
    }

    unsafe {
        main(); // user program
    }

    axruntime::exit_main();
}
```

## axruntime::src::lib.rs:

 接着进入rust_main

```rust
pub extern "C" fn rust_main(cpu_id: usize, dtb: usize) {
 	//
    logging...................................................
    ..........................................................
    //
    
    #[cfg(feature = "alloc")]
    init_allocator();  // initializes global heap allocator

    #[cfg(feature = "paging")]
    remap_kernel_memory().expect("remap kernel memoy failed"); //enable paging, remap kernel memory

    axhal::platform_init(); // actually nothing to be done "{}"

    axprocess::init_kernel_process(); // initializes kernel process management system
    
    #[cfg(any(feature = "fs", feature = "net", feature = "display"))]
    {
        #[allow(unused_variables)]
        let all_devices = axdriver::init_drivers(); // Probes and initializes all device drivers, returns 															the [`AllDevices`] struct.

        #[cfg(feature = "fs")]
        axfs::init_filesystems(all_devices.block);  // Initializes filesystems by block devices.

        #[cfg(feature = "net")]
        axnet::init_network(all_devices.net);  		// Initializes the network subsystem by NIC devices.
    }

    #[cfg(feature = "irq")]
    init_interrupt();								// initializes time interrupt
   
    INITED_CPUS.fetch_add(1, Ordering::Relaxed);    // multi cpu
}
```



### init_allocator:

1. **选择最大空闲内存区域**：遍历所有内存区域，找到最大的空闲区域作为主堆。
2. **初始化主堆**：将最大空闲区域的物理地址转换为虚拟地址，并初始化全局分配器。
3. **添加其他空闲区域**：将剩余的空闲区域添加到分配器的内存池中，扩展可用堆空间。



### remap_kernel_memory:

1. **创建新页表并映射内存区域**：先创建新的页表结构，然后遍历所有物理内存内存区域，将每个内存区域的物理地址映射到内核虚拟地址空间（虚实地址转换，标志位设置）。
2. **映射测试用例内存**：如果启用img，还会将测试用例的物理内存（`img_start_addr`）映射到指定的虚拟地址。
3. **设置全局页表并激活**：新页表赋值给全局变量，然后CPU切换到新页表。



### init_kernel_process:

1. **创建内核进程对象**：构造一个包含进程标识、栈大小、内存空间等属性的内核进程。
2. **初始化调度器**：准备系统的任务调度机制。
3. **关联空闲任务**：将当前处理器的空闲任务（如空闲线程）绑定到该进程。
4. **注册全局进程表**：将进程添加到全局的 `PID2PC` 映射中，便于后续管理。



### init_drivers:

1. **初始化虚拟块设备**:
   1. **创建RAM磁盘**：根据配置的 `TESTCASE_MEMORY_SIZE` 初始化一个虚拟块设备。
   2. **逐块拷贝数据**：将物理内存中指定区域（`TESTCASE_MEMORY_START`）的数据按块大小（如4KB）拷贝到RAM磁盘。
   3. **地址转换**：`PHYS_VIRT_OFFSET` 是物理地址到内核虚拟地址的偏移量，用于正确访问内存。
   4. **安全拷贝**：`copy_nonoverlapping` 确保内存区域不重叠，避免数据损坏。
   5. **注册设备**：将RAM磁盘添加到 `AllDevices` 的块设备列表中。
2. **探测物理或虚拟设备**，将其注册到全局管理结构。
   1. 扫描硬件总线识别设备。
   2. 将设备添加到对应的列表（网络、块设备等）。



### init_interrupt:

1. **定义定时器间隔**/**CPU的截止时间变量**
2. **更新定时器函数**：
   1. 若当前时间超过截止时间（首次启动或处理延迟），则基于当前时间计算新的截止时间。
   2. 写入新的截止时间：`deadline + PERIODIC_INTERVAL_NANOS`，确保下一次中断间隔固定。
   3. 设置单次定时器：硬件在`deadline`时触发中断，中断处理中再次调用此函数，形成周期性触发。
3. **注册定时器中断处理函数**：
   1. **更新定时器**：调用`update_timer`设置下一次中断。
   2. **任务调度**：若启用多任务，调用`on_timer_tick`处理时间片轮转或任务切换。
4. **启用中断**



## apps::monolithic_userboot::src::main.rs

最终进入用户程序

```rust
fn main() {
    axstarry::fs_init();
    let testcase = "busybox sh";
    axstarry::run_testcase(testcase);
    axstarry::println(format!("System halted with exit code {}", 0).as_str());
}
```

