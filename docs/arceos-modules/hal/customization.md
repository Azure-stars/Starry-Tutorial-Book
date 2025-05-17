# 自定义平台细节实现

本章节将介绍用户希望自定义平台时需要添加的实现细节。

## `console` 模块 - 控制台输入输出

```
// 定义一个公开的模块 `console`，用于处理控制台的输入输出操作
pub mod console {
    /// 将输入的 u8 字节切片写入控制台
    /// 参数 `_bytes`: 一个只读的 u8 字节切片，表示要写入的数据
    pub fn write_bytes(_bytes: &[u8]) {
        // 当前功能未实现，使用宏 `unimplemented!()` 表示占位符，会在运行时触发 panic
        unimplemented!()
    }

    /// 从控制台读取字节数据到给定的可变切片中
    /// 参数 `_bytes`: 一个可变的 u8 字节切片，用于存储读取的数据
    /// 返回值: 返回读取的字节数（usize 类型）
    pub fn read_bytes(_bytes: &mut [u8]) -> usize {
        // 当前功能未实现，使用宏 `unimplemented!()` 表示占位符
        unimplemented!()
    }
}
```
- `write_bytes` 函数
    - 功能：将字节数据写入控制台。
    - 参数：&[u8] 是一个字节切片，表示输入的数据。
- `read_bytes` 函数
    - 功能：从控制台读取字节数据到可变切片中。
    - 参数：&mut [u8] 是一个可变字节切片，用于存储读取结果。
    - 返回值：返回读取的字节数（usize 类型）。



## `misc` 模块 - 杂项功能

```
// 定义一个公开的模块 `misc`，用于存放杂项功能
pub mod misc {
    /// 关闭整个系统，包括所有 CPU
    /// 返回值: `!` 表示该函数永不返回（即程序终止）
    pub fn terminate() -> ! {
        // 当前功能未实现，使用宏 `unimplemented!()` 表示占位符
        unimplemented!()
    }
}
```
- `terminate` 函数
    - 功能：关闭整个系统，包括所有 CPU。
    - 返回值：! 是 Rust 中的“永不返回”类型，表示调用此函数后程序会终止。



## `mp` 模块 - 多核处理器支持（条件编译）
```
// 当启用 "smp" 特性时，定义一个公开的模块 `mp`，用于多核处理器支持
#[cfg(feature = "smp")]
pub mod mp {
    /// 启动指定的辅助 CPU，并为其分配启动堆栈
    /// 参数 `cpu_id`: CPU 的标识号（usize 类型）
    /// 参数 `stack_top`: 启动堆栈的顶部物理地址（来自 crate::mem::PhysAddr 类型）
    pub fn start_secondary_cpu(cpu_id: usize, stack_top: crate::mem::PhysAddr) {}
}
```



- `start_secondary_cpu` 函数
    - 功能：启动指定的辅助 CPU，并为其分配堆栈。

    - 参数：cpu_id：CPU 的标识号;stack_top：堆栈顶部的物理地址（依赖于外部模块 crate::mem）。



## `mem` 模块 - 内存管理
```
// 定义一个公开的模块 `mem`，用于内存管理相关功能
pub mod mem {
    /// 返回平台特定的内存区域
    /// 返回值: 返回一个迭代器，迭代的元素类型为 crate::mem::MemRegion
    /// 访问权限: `pub(crate)` 表示该函数仅在当前 crate 内可见
    pub(crate) fn platform_regions() -> impl Iterator<Item = crate::mem::MemRegion> {
        // 返回一个空的迭代器，表示当前没有内存区域数据
        core::iter::empty()
    }
}
```


- `platform_regions` 函数
  - 功能：返回特定平台的内存区域。

  - 返回值：返回一个实现了 Iterator trait 的对象，迭代元素类型为 MemRegion。

  - 访问权限：pub(crate) 表示仅在当前 crate 内部可访问。


## `time` 模块 - 时间管理
```

// 定义一个公开的模块 `time`，用于时间管理相关功能
pub mod time {
    /// 返回当前的硬件时钟滴答数
    /// 返回值: 当前滴答数（u64 类型）
    pub fn current_ticks() -> u64 {
        // 当前返回 0，表示功能未实现
        0
    }

    /// 将硬件滴答数转换为纳秒
    /// 参数 `ticks`: 要转换的滴答数（u64 类型）
    /// 返回值: 对应的纳秒数（u64 类型）
    pub fn ticks_to_nanos(ticks: u64) -> u64 {
        // 当前直接返回输入值，未实现实际转换逻辑
        ticks
    }

    /// 将纳秒转换为硬件滴答数
    /// 参数 `nanos`: 要转换的纳秒数（u64 类型）
    /// 返回值: 对应的滴答数（u64 类型）
    pub fn nanos_to_ticks(nanos: u64) -> u64 {
        // 当前直接返回输入值，未实现实际转换逻辑
        nanos
    }

    /// 设置一个一次性定时器
    /// 当到达指定的单调时间截止点（以纳秒为单位）时，将触发定时器中断
    /// 参数 `deadline_ns`: 截止时间（纳秒，u64 类型）
    pub fn set_oneshot_timer(deadline_ns: u64) {
        // 当前为空实现，未设置具体定时器逻辑
    }

    /// 返回纪元偏移量（以纳秒为单位的墙上时间相对于单调时钟起点的偏移）
    /// 返回值: 偏移量（u64 类型）
    pub fn epochoffset_nanos() -> u64 {
        // 当前返回 0，表示功能未实现
        0
    }
}
```
- `current_ticks` 函数
    - 功能：获取当前硬件时钟的滴答数。
- `ticks_to_nanos` 函数
    - 功能：将滴答数转换为纳秒。
- `nanos_to_ticks` 函数
    - 功能：将纳秒转换为滴答数。
- `set_oneshot_timer` 函数
    - 功能：设置一次性定时器，在指定时间触发中断。
- `epochoffset_nanos` 函数
    - 功能：返回纪元时间偏移量。

## `irq` 模块 - 中断处理（条件编译）
```
// 当启用 "irq" 特性时，定义一个公开的模块 `irq`，用于中断处理
#[cfg(feature = "irq")]
pub mod irq {
    /// 中断请求（IRQ）的最大数量
    pub const MAX_IRQ_COUNT: usize = 256;

    /// 定时器中断的编号
    pub const TIMER_IRQ_NUM: usize = 0;

    /// 启用或禁用指定的中断
    /// 参数 `irq_num`: 中断编号（usize 类型）
    /// 参数 `enabled`: 是否启用（true 表示启用，false 表示禁用）
    pub fn set_enable(irq_num: usize, enabled: bool) {
        // 当前为空实现，未实现具体逻辑
    }

    /// 为指定的中断注册一个中断处理程序
    /// 参数 `irq_num`: 中断编号（usize 类型）
    /// 参数 `handler`: 中断处理程序（类型为 crate::irq::IrqHandler）
    /// 返回值: 是否注册成功（当前固定返回 false）
    pub fn register_handler(irq_num: usize, handler: crate::irq::IrqHandler) -> bool {
        // 当前固定返回 false，表示未实现注册逻辑
        false
    }

    /// 分发中断
    /// 该函数由通用中断处理程序调用，它会在中断处理表中查找并调用对应的处理程序
    /// 如有需要，还会在处理后向中断控制器发送确认信号
    /// 参数 `irq_num`: 中断编号（usize 类型）
    pub fn dispatch_irq(irq_num: usize) {
        // 当前为空实现，未实现分发逻辑
    }
}
```

- 常量
    - `MAX_IRQ_COUNT`：定义最大中断数量为 256。
    - `TIMER_IRQ_NUM`：定义定时器中断编号为 0。
- `set_enable` 函数
    - 功能：启用或禁用指定中断。
- `register_handler` 函数
    - 功能：注册中断处理程序。
- `dispatch_irq` 函数
    - 功能：分发中断，调用对应的处理程序。

## 平台初始化函数

```
/// 初始化主 CPU 的平台设备
pub fn platform_init() {
    // 当前为空实现，未实现具体初始化逻辑
}

/// 初始化辅助 CPU 的平台设备（仅在启用 "smp" 特性时编译）
#[cfg(feature = "smp")]
pub fn platform_init_secondary() {
    // 当前为空实现，未实现具体初始化逻辑
}
```


- `platform_init` 函数
    - 功能：为主 CPU 初始化平台设备。
- `platform_init_secondary` 函数
    - 功能：为辅助 CPU 初始化平台设备。
    - 条件编译：仅在启用 smp 特性时生效。


