# Starry 的启动与初始化

## Starry 架构

Starry 基于 ArceOS 架构，在设计上强调 “复用而非耦合”。

![流程图](../static/implementation/宏内核拓展执行流图.png)

其大致执行流可划分为以下阶段：

### 初始化阶段

1. `Backbone` 初始化：系统启动后，`ArceOS Backbone` 首先完成硬件初始化、运行时构建等基础内核功能的启动，然后将执行权交给宏内核扩展模块。

2. 宏内核扩展初始化：该模块负责加载用户应用、构建地址空间、初始化任务上下文等关键功能，随后将执行流切换至用户态，开始执行应用代码。

### 程序运行阶段 (初始化后会反复执行)

1. 内核回调路径：当用户程序发起系统调用时，控制流通过 syscall 陷入内核，ArceOS 捕捉异常并识别为需宏内核处理的调用，然后转发给宏内核扩展模块。

2. 调用处理与返回：宏内核扩展完成系统调用逻辑后，将结果交由 `Backbone` 验证并通过特权级切换返回用户态，继续用户程序的运行。


## Backbone 初始化 

在 `ArceOS` 架构中，`Backbone`（骨干层）承担着整个操作系统启动过程中的基础初始化工作，确保内核运行环境就绪并为宏内核扩展提供支撑。

其初始化流程主要由 `axruntime` 模块完成，具体代码如下：
```rust
/// The main entry point of the ArceOS runtime.
///
/// It is called from the bootstrapping code in [axhal]. `cpu_id` is the ID of
/// the current CPU, and `dtb` is the address of the device tree blob. It
/// finally calls the application's `main` function after all initialization
/// work is done.
///
/// In multi-core environment, this function is called on the primary CPU,
/// and the secondary CPUs call [`rust_main_secondary`].
#[cfg_attr(not(test), unsafe(no_mangle))]
pub extern "C" fn rust_main(cpu_id: usize, dtb: usize) -> ! { ... }
```

### 启动流程步骤



1. **打印启动 Logo**

    系统首先输出启动 `logo` ，标识内核已进入初始化阶段。通过调用`ax_println`宏打印 `LOGO` 及平台信息。

    ```rust
    ax_println!("{}", LOGO);
    ax_println!(
        "\
        arch = {}\n\
        platform = {}\n\
        target = {}\n\
        build_mode = {}\n\
        log_level = {}\n\
        smp = {}\n\
        ",
        axconfig::ARCH,
        axconfig::PLATFORM,
        option_env!("AX_TARGET").unwrap_or(""),
        option_env!("AX_MODE").unwrap_or(""),
        option_env!("AX_LOG").unwrap_or(""),
        axconfig::SMP,
    );
    ```

2. **记录系统启动时间戳**

    记录系统启动时间（如果启用 `rtc` 功能）。

    ```rust
    #[cfg(feature = "rtc")]
    ax_println!(
        "Boot at {}\n",
        chrono::DateTime::from_timestamp_nanos(axhal::time::wall_time_nanos() as _),
    );
    ```
    


3. **初始化日志系统**

    通过 `axlog::init()` 初始化日志系统，并设置最大日志级别。日志级别可以通过 `AX_LOG` 环境变量配置。
    
    ```rust
    axlog::init();
    axlog::set_max_level(option_env!("AX_LOG").unwrap_or("")); // no effect if set `log-level-*` features
    info!("Logging is enabled.");
    ```

    


4. **获取内存信息**

    通过 `axhal::mem::memory_regions` 获取内存布局。

    ```rust
    info!("Found physcial memory regions:");
    for r in axhal::mem::memory_regions() {
        info!(
            "  [{:x?}, {:x?}) {} ({:?})",
            r.paddr,
            r.paddr + r.size,
            r.name,
            r.flags
        );
    }
    ```

    之后将通过 `axhal::platform_init()` 完成平台信息的设备初始化。

    ```rust
    axhal::platform_init();
    ```

5. **分页与内存分配器配置**

    通过分页，`alloc` 相关的特性，调用对应 `crate` 的初始化函数。

    ```rust
    #[cfg(feature = "alloc")]
    init_allocator();

    #[cfg(feature = "paging")]
    axmm::init_memory_management();
    ```

6. **启动多任务调度器**

    启用 `multitask` 特性时，调用 `axtask::init_scheduler()` 启动多任务调度器。

    ```rust
    #[cfg(feature = "multitask")]
    axtask::init_scheduler();
    ```


7. **功能模块加载**

    根据启用的功能模块，调用对应 `crate` 的初始化函数。

    `fs` （文件系统）， `net` (网络) ,`display`（显示）

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

8. **多核初始化**

    启用 `smp` （ Symmetric Multi-Processing ） 特性时，会对每一个 cpu 进行依次的初始化操作。

    ```rust
    #[cfg(feature = "smp")]
    self::mp::start_secondary_cpus(cpu_id);
    ```


9. **初始化中断系统**

    启用 `irq`（Interrupt Request） 特性时，调用 `init_interrupt()` 设置中断控制器与异常处理机制。

    ```rust
    #[cfg(feature = "irq")]
    {
        info!("Initialize interrupt handlers...");
        init_interrupt();
    }
    ```

9. **配置线程局部存储**

    启用 `tls` （ Thread Local Storage ） 特性且未启用 `multitask` 时，调用 `init_tls()` 来初始化线程局部存储。

    ```rust
    #[cfg(feature = "irq")]
    {
        info!("Initialize interrupt handlers...");
        init_interrupt();
    }
    ```

10. **执行全局构造函数**

    调用 `ctor_bare::register_ctor()` 执行所有标记为 `#[ctor]` 的全局构造函数（如驱动注册、设备探测等）。

    ```rust
    #[cfg(feature = "irq")]
    {
        info!("Initialize interrupt handlers...");
        init_interrupt();
    }
    ```

    下面是 `.arceos/api/arceos_posix_api/src/imp/fd_ops.rs` 文件中的注册函数。

    ```rust
    #[ctor_bare::register_ctor]
    fn init_stdio() {
        let mut fd_table = flatten_objects::FlattenObjects::new();
        fd_table
            .add_at(0, Arc::new(stdin()) as _)
            .unwrap_or_else(|_| panic!()); // stdin
        fd_table
            .add_at(1, Arc::new(stdout()) as _)
            .unwrap_or_else(|_| panic!()); // stdout
        fd_table
            .add_at(2, Arc::new(stdout()) as _)
            .unwrap_or_else(|_| panic!()); // stderr
        FD_TABLE.init_new(spin::RwLock::new(fd_table));
    }
    ```

11. **执行全局构造函数**

    确保所有 `CPU` 完成初始化，如果未完成初始化的情况下会进行 `spin_loop()` 进行自旋锁循环

    ```rust
    info!("Primary CPU {} init OK.", cpu_id);
    INITED_CPUS.fetch_add(1, Ordering::Relaxed);

    while !is_init_ok() {
        core::hint::spin_loop();
    }
    ```

    `INITED_CPUS` 是一个全局的原子变量，保存当前有多少 `CPU` 完成了初始化

12. **进入主控逻辑**

    调用 `main()` 实际的程序入口， 这里是 `Starry/src/main.rs` ，将执行流交给 `Starry` 进行，运行结束后 `ArceOS` 进行任务的退出或平台的关机。

    ```rust
    unsafe { main() };

    #[cfg(feature = "multitask")]
    axtask::exit(0);
    #[cfg(not(feature = "multitask"))]
    {
        debug!("main task exited: exit_code={}", 0);
        axhal::misc::terminate();
    }
    ```
    根据 `feature` 的相关启用情况， `ArceOS` 会进行平台的关机（整个平台终止运行，实际上的关机操作）或者当前任务的退出（后者会调度下一个任务继续执行）

## 宏内核扩展初始化

### 宏内核扩展入口

在 `ArceOS` 的初始化流程完成后，系统将进入宏内核扩展阶段，由 `main()` 函数接管，执行用户空间的主控制逻辑。

该函数位于 `Starry/src/main.rs` 中，其签名如下：

```rust
#[no_mangle]
unsafe fn main() {
    ...
}
```

### 创建初始化进程

```rust
axprocess::Process::new_init(axtask::current().id().as_u64() as _).build();
```

- 程序会获取当前线程的唯一 `Task ID`，并将其转换为 `u64` 类型。这个 `ID` 将作为进程的唯一标识（PID）用于进程管理。

    - `axprocess::Process::new_init(...)`

        程序会创建一个 `ProcessBuilder` 实例，用于构造系统的第一个进程。

    - `.build()`

        `ProcessBuilder` 调用 `build()` 构造第一个 `process` 全局保存。 可以说 `ProcessBuilder` 实际上是一个中间形态。

        - 如果没有父进程（即为 init 进程），就为当前进程新建一个：

            - Session（会话）；

            - ProcessGroup（进程组）；

        - 如果有父进程，则继承其进程组。


        ```rust
        /// Finishes the builder and returns a new [`Process`].
        pub fn build(self) -> Arc<Process> {
            let Self { pid, parent, data } = self;

            let group = parent.as_ref().map_or_else(
                || {
                    let session = Session::new(pid);
                    ProcessGroup::new(pid, &session)
                },
                |p| p.group(),
            );

            let process = Arc::new(Process {
                pid,
                is_zombie: AtomicBool::new(false),
                tg: SpinNoIrq::new(ThreadGroup::default()),
                data,
                children: SpinNoIrq::new(StrongMap::new()),
                parent: SpinNoIrq::new(parent.as_ref().map(Arc::downgrade).unwrap_or_default()),
                group: SpinNoIrq::new(group.clone()),
            });

            group.processes.lock().insert(pid, &process);

            if let Some(parent) = parent {
                parent.children.lock().insert(pid, process.clone());
            } else {
                INIT_PROC.init_once(process.clone());
            }

            process
        }
        ```

### 读取并解析环境变量

- 调用 `option_env!` 获得 `AX_TESTCASES_LIST` 环境变量中的测试文件名并逐个调用。

    ```make
    AX_TESTCASES_LIST=$(shell cat ./apps/$(AX_TESTCASE)/testcase_list | tr '\n' ',')
    ```

    例如，当 `apps/myapp/testcase_list` 的内容如下：

    ```file
    hello
    world
    ```

    执行 `make ARCH=x86_64 LOG=error AX_TESTCASE=myapp BLK=y NET=y ACCEL=n run` 时：
    
    `AX_TESTCASES_LIST` 的内容会变为 `hello,world` 字符串，然后继续处理、解析。


### 遍历测试用例

以下代码用于从环境变量中获取测试用例列表，构建测试用例 `Iterator` ，并依次执行这些测试用例：

```rust
let testcases = option_env!("AX_TESTCASES_LIST")
    .unwrap_or_else(|| "Please specify the testcases list by making user_apps")
    .split(',')
    .filter(|&x| !x.is_empty());

for testcase in testcases {
    let args = testcase
        .split_ascii_whitespace()
        .map(Into::into)
        .collect::<Vec<_>>();

    info!("run_user_app args {:?}",args);

    let exit_code = entry::run_user_app(&args, &[]);
    info!("User task {} exited with code: {:?}", testcase, exit_code);
}
```

### 执行单个测试用例

程序通过 `entry::run_user_app` 构建可运行的 `task` 并调用运行

<a name="init-user-aspace"></a>

1. **构建用户空间 , 映射内核区域**

    保证内核的指令、数据，在地址空间中是可访问的。

    通过调用 `new_user_aspace_empty()` 函数获得一个空的用户空间，然后调用 `copy_from_kernel` 将内核的区域的数据指令拷贝进用户态地址空间，使用户程序运行时不会因为缺页访问内核区而崩溃。

    ```rust
    let mut uspace = new_user_aspace_empty()
        .and_then(|mut it| {
            copy_from_kernel(&mut it)?;
            Ok(it)
        })
        .expect("Failed to create user address space");
    ```


2. **设置当前工作目录**


    这个部分是为了兼容内核比赛，使用当前进程的文件系统信息作为默认目录，之后的路径查询将以该目录为相对路径起点。

    ```rust
    let cwd = AxProcess::current().fs().cwd().to_path_buf();
    ```


3. **加载应用**


    加载并映射用户程序的 `ELF` 文件，返回入口地址。

    ```rust
    let (entry_vaddr, ustack_top) = load_user_app(&mut uspace, args, envs)
        .unwrap_or_else(|e| panic!("Failed to load user app: {}", e));
    ```

4. **构造上下文并模拟返回**

    创建用户态 `Trap` 上下文，设置返回点为用户程序入口。

    ```rust
    let uctx = UspaceContext::new(entry_vaddr.into(), ustack_top, 2333);

    let mut task = new_user_task(name, uctx, None);
    task.ctx_mut().set_page_table_root(uspace.page_table_root());
    ```

5. **初始化命名空间资源**

    ```rust
    let process_data = ProcessData::new(exe_path, Arc::new(Mutex::new(uspace)));

    FD_TABLE
        .deref_from(&process_data.ns)
        .init_new(FD_TABLE.copy_inner());
    CURRENT_DIR
        .deref_from(&process_data.ns)
        .init_new(CURRENT_DIR.copy_inner());
    CURRENT_DIR_PATH
        .deref_from(&process_data.ns)
        .init_new(CURRENT_DIR_PATH.copy_inner());
    ```

    创建新的 `ProcessData` 结构体，用于封装地址空间和路径信息。

    `uspace` 是用户程序的地址空间，使用 `Mutex` 包裹后便于后续多线程访问。具体创建流程[见上文](#init-user-aspace)。

    `exe_path` 记录可执行程序路径，其创建过程如下：

    首先通过 `args[0]` 获得执行文件的名称，对其调用 `rsplit_once()` 获得目录名以及可执行文件名称。

    ```rust
    let exe_path = args[0].clone();
    let (dir, name) = exe_path.rsplit_once('/').unwrap_or(("", &exe_path));
    ```

6. **创建新进程**   

    
    ```rust
    let tid = task.id().as_u64() as Pid;
    let process = init_proc().fork(tid).data(process_data).build();
    ```

    通过 `init_proc()` 函数获得之前 `axprocess` 通过 `init` 创建的 `proc` 变量。

    ```rust
    axprocess::Process::new_init(axtask::current().id().as_u64() as _).build();
    ```

    对 `init_proc()` 获得的 `Arc<Process>` 变量调用 `fork()` ，获得临时的 `ProcessBuilder` 。

    ```rust
    /// Creates a child [`Process`].
    pub fn fork(self: &Arc<Process>, pid: Pid) -> ProcessBuilder {
        ProcessBuilder {
            pid,
            parent: Some(self.clone()),
            data: Box::new(()),
        }
    }
    ```

    `ProcessBuilder` 调用 `data()` 将封装的 `fd_table` 等数据关联到 `ProcessBuilder` 上。

    ```rust
    impl ProcessBuilder {
        /// Sets the data associated with the [`Process`].
        pub fn data<T: Any + Send + Sync>(self, data: T) -> Self {
            Self {
                data: Box::new(data),
                ..self
            }
        }
    }
    ```
    最后调用 `build()` 函数完成新进程的创建。


7. **为新进程创建线程**   

    为这个新的进程创建一个主线程，并注册到调度系统，准备执行。

    ```rust
    let thread = process.new_thread(tid).data(ThreadData::new()).build();
    add_thread_to_table(&thread);

    task.init_task_ext(TaskExt::new(thread));   
    ```

8. **等待进程运行结束并返回退出码**

    将进程放入调度队列，并等待运行结束。

    ```rust
    let task = axtask::spawn_task(task);
    // TODO: we need a way to wait on the process but not only the main task
    task.join()
    ```


