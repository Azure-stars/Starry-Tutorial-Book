# 运行时模块

运行时模块为使用 ArceOS 的裸机应用提供了必要的运行时支持。运行时模块会在调用裸机程序的 `main`函数之前进行一些初始化工作，例如初始化内存分配器、初始化文件系统等。运行时模块还在 rust 的语言层面提供了 `no_std`支持，如设置 panic handler 等。使用 ArceOS 的裸机应用必须链接此库。

## 包功能特性

运行时模块提供了以下可选的功能特性：

- `alloc`：提供动态内存分配支持
- `paging`：提供虚拟内存操作支持
- `irq`：提供中断处理支持
- `multitask`：提供多任务（多线程）支持
- `smp`：提供多核支持，即 SMP (symmetric multiprocessing)
- `fs`：提供文件系统支持
- `net`：提供网络支持
- `display`：提供图形显示支持

上述特性均为可选特性，且默认情况下均不启用。

## 导出函数

运行时模块提供了以下导出函数：

- `rust_main`: ArceOS 运行时的入口点
- `rust_main_secondary`: 多核情况下的次要入口点，即其他核上 ArceOS 运行时的入口点

### `rust_main`

`rust_main`函数是 ArceOS 运行时的入口点，其原型如下：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn rust_main(cpu_id: usize, dtb: usize) -> !;
```

这个函数会被 `axhal`（硬件抽象层）模块的引导代码调用，`cpu_id`是当前 CPU 的 ID，`dtb`(device tree blob)是设备树的地址。`rust_main`函数会在初始化运行时环境完成后，调用裸机应用的 `main`函数。

### `rust_main_secondary`

`rust_main_secondary`函数是多核情况下的次要入口点，在多核情况下，`axhal`会在主核上调用 `rust_main`，在其他核上调用 `rust_main_secondary`。其原型如下：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn rust_main_secondary(cpu_id: usize) -> !;
```

## 主要功能

在 `rust_main`函数中，运行时模块会根据启用的 feature 进行初始化工作，feature与功能的对应关系如下：

- 不需要feature：初始化平台设备、初始化驱动模块

  ```rust
    info!("Initialize platform devices...");
    axhal::platform_init();
  ```
  ```rust
  let all_devices = axdriver::init_drivers();
  ```
- alloc：初始化内存分配器、虚拟内存管理模块

  ```rust
      #[cfg(feature = "alloc")]
      init_allocator();
  ```
- paging：启用页表操作支持。

  ```rust
      #[cfg(feature = "paging")]
      axmm::init_memory_management();
  ```
- multitask：初始化多任务的调度器

  ```rust
      #[cfg(feature = "multitask")]
      axtask::init_scheduler();
  ```
- fs：初始化文件系统
- net：初始化网络模块
- display：初始化图形显示模块

  ```rust
    #[cfg(any(feature = "fs", feature = "net", feature = "display"))]
    {
        #[allow(unused_variables)]
        let all_devices = axdriver::init_drivers();

        #[cfg(feature = "fs")]
        axfs::init_filesystems(all_devices.block);

        #[cfg(feature = "net")]
        axnet::init_network(all_devices.net);

        #[cfg(feature = "display")]
        axdisplay::init_display(all_devices.display);
    }
  ```
- smp：启用对称多处理（SMP）支持，启动其他 CPU 核

  ```rust
      #[cfg(feature = "smp")]
      self::mp::start_secondary_cpus(cpu_id);
  ```
- irq：初始化中断处理模块，包括设置时钟中断处理函数

  ```rust
    #[cfg(feature = "irq")]
    {
        info!("Initialize interrupt handlers...");
        init_interrupt();
    }

  ```
- tls：初始化线程本地存储(TLS)，但同时需要未启用 multitask

  ```rust
    #[cfg(all(feature = "tls", not(feature = "multitask")))]
    {
        info!("Initialize thread local storage...");
        init_tls();
    }
  ```
- rtc：启用实时时钟（Real-Time Clock），打印启动时间

  ```
      #[cfg(feature = "rtc")]
      ax_println!(
          "Boot at {}\n",
          chrono::DateTime::from_timestamp_nanos(axhal::time::wall_time_nanos() as _),
      );
  ```
