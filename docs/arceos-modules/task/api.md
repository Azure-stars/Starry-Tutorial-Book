# 任务调度接口

#### 1. 任务类型定义
```rust
cfg_if::cfg_if! {
    if #[cfg(feature = "sched_rr")] {
        const MAX_TIME_SLICE: usize = 5;
        pub(crate) type AxTask = scheduler::RRTask<TaskInner, MAX_TIME_SLICE>;
        pub(crate) type Scheduler = scheduler::RRScheduler<TaskInner, MAX_TIME_SLICE>;
    } else if #[cfg(feature = "sched_cfs")] {
        pub(crate) type AxTask = scheduler::CFSTask<TaskInner>;
        pub(crate) type Scheduler = scheduler::CFScheduler<TaskInner>;
    } else {
        // If no scheduler features are set, use FIFO as the default.
        pub(crate) type AxTask = scheduler::FifoTask<TaskInner>;
        pub(crate) type Scheduler = scheduler::FifoScheduler<TaskInner>;
    }
}
```
根据不同的 Cargo 特性，可以选择不同的任务类型和调度器：  
* 如果启用 sched_rr 特性，使用轮转调度（RR）；
* 如果启用 sched_cfs 特性，使用完全公平调度（CFS）；
* 否则，使用先进先出调度（FIFO）作为默认调度算法。  

#### 2. 任务调度器初始化
```rust
/// Initializes the task scheduler (for the primary CPU).
pub fn init_scheduler() {
    info!("Initialize scheduling...");

    crate::run_queue::init();
    #[cfg(feature = "irq")]
    crate::timers::init();

    info!("  use {} scheduler.", Scheduler::scheduler_name());
}

/// Initializes the task scheduler for secondary CPUs.
pub fn init_scheduler_secondary() {
    crate::run_queue::init_secondary();
    #[cfg(feature = "irq")]
    crate::timers::init();
}
```
init_scheduler 函数用于初始化主 CPU 的任务调度器；  
init_scheduler_secondary 函数用于初始化辅助 CPU 的任务调度器。初始化过程包括运行队列的初始化和定时器的初始化（如果启用了 irq 特性）。  
用例：在系统启动时调用 init_scheduler 函数：
```rust
fn main() {
    init_scheduler();~~~~
    // 其他初始化操作
}
```

#### 3. 任务创建
```rust
/// Adds the given task to the run queue, returns the task reference.
pub fn spawn_task(task: TaskInner) -> AxTaskRef {
    let task_ref = task.into_arc();
    select_run_queue::<NoPreemptIrqSave>(&task_ref).add_task(task_ref.clone());
    task_ref
}

/// Spawns a new task with the given parameters.
///
/// Returns the task reference.
pub fn spawn_raw<F>(f: F, name: String, stack_size: usize) -> AxTaskRef
where
    F: FnOnce() + Send + 'static,
{
    spawn_task(TaskInner::new(f, name, stack_size))
}

/// Spawns a new task with the default parameters.
///
/// The default task name is an empty string. The default task stack size is
/// [`axconfig::TASK_STACK_SIZE`].
///
/// Returns the task reference.
pub fn spawn<F>(f: F) -> AxTaskRef
where
    F: FnOnce() + Send + 'static,
{
    spawn_raw(f, "".into(), axconfig::TASK_STACK_SIZE)
}
```
spawn_task 函数将一个 TaskInner 类型的任务添加到运行队列中，并返回任务的引用；  
spawn_raw 函数根据给定的任务入口函数、任务名称和栈大小创建一个新任务，并调用 spawn_task 函数将其添加到运行队列中；  
spawn 函数使用默认的任务名称和栈大小创建新任务。  
用例：创建一个新任务：
```rust
fn task_function() {
    // 任务逻辑
}

fn main() {
    init_scheduler();
    let task = spawn(task_function);
    // 其他操作
}
```

#### 4. 任务调度相关操作
```rust
/// Current task gives up the CPU time voluntarily, and switches to another
/// ready task.
pub fn yield_now() {
    current_run_queue::<NoPreemptIrqSave>().yield_current()
}

/// Current task is going to sleep for the given duration.
///
/// If the feature `irq` is not enabled, it uses busy-wait instead.
pub fn sleep(dur: core::time::Duration) {
    sleep_until(axhal::time::wall_time() + dur);
}

/// Current task is going to sleep, it will be woken up at the given deadline.
///
/// If the feature `irq` is not enabled, it uses busy-wait instead.
pub fn sleep_until(deadline: axhal::time::TimeValue) {
    #[cfg(feature = "irq")]
    current_run_queue::<NoPreemptIrqSave>().sleep_until(deadline);
    #[cfg(not(feature = "irq"))]
    axhal::time::busy_wait_until(deadline);
}

/// Exits the current task.
pub fn exit(exit_code: i32) -> ! {
    current_run_queue::<NoPreemptIrqSave>().exit_current(exit_code)
}
```
yield_now 函数使当前任务主动放弃 CPU 时间，切换到另一个就绪任务；  
sleep 函数使当前任务休眠指定的时间；  
sleep_until 函数使当前任务休眠到指定的截止时间，如果未启用 irq 特性，将使用忙等待方式；  
exit 函数用于终止当前任务。  
用例：任务主动放弃 CPU 时间：
```rust
fn task_function() {
    // 任务逻辑
    yield_now();
    // 继续执行任务逻辑
}
```