# 运行时模块

运行时模块为使用ArceOS的裸机应用提供了必要的运行时支持。运行时模块会在调用裸机程序的`main`函数之前进行一些初始化工作，例如初始化内存分配器、初始化文件系统等。运行时模块还在rust的语言层面提供了`no_std`支持，如设置panic handler等。使用ArceOS的裸机应用必须链接此库。

## 包功能特性

运行时模块提供了以下可选的功能特性：

- `alloc`：提供动态内存分配支持
- `paging`：提供虚拟内存操作支持
- `irq`：提供中断处理支持
- `multitask`：提供多任务（多线程）支持
- `smp`：提供多核支持，即SMP (symmetric multiprocessing)
- `fs`：提供文件系统支持
- `net`：提供网络支持
- `display`：提供图形显示支持

上述特性均为可选特性，且默认情况下均不启用。

## 导出函数

运行时模块提供了以下导出函数：

- `rust_main`: ArceOS运行时的入口点
- `rust_main_secondary`: 多核情况下的次要入口点，即其他核上ArceOS运行时的入口点

### `rust_main`

`rust_main`函数是ArceOS运行时的入口点，其原型如下：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn rust_main(cpu_id: usize, dtb: usize) -> !;
```

这个函数会被`axhal`（硬件抽象层）模块的引导代码调用，`cpu_id`是当前CPU的ID，`dtb`(device tree blob)是设备树的地址。`rust_main`函数会在初始化运行时环境完成后，调用裸机应用的`main`函数。

### `rust_main_secondary`

`rust_main_secondary`函数是多核情况下的次要入口点，在多核情况下，`axhal`会在主核上调用`rust_main`，在其他核上调用`rust_main_secondary`。其原型如下：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn rust_main_secondary(cpu_id: usize) -> !;
```

## 主要功能

在`rust_main`函数中，运行时模块会根据启用的feature进行初始化工作，主要包括：

- 初始化内存分配器
- 初始化虚拟内存管理模块
- 初始化平台设备
- 初始化多任务的调度器
- 初始化驱动模块
- 初始化文件系统
- 初始化网络模块
- 初始化图形显示模块
- 启动其他CPU核
- 初始化中断处理模块，包括设置时钟中断处理函数
- 初始化线程本地存储(TLS)
- 调用`main`函数
