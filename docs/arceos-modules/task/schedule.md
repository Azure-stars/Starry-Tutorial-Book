# 任务调度机制

#### 1. 调度算法选择
通过 Cargo 特性选择不同的调度算法，如 sched_fifo、sched_cfs 和 sched_rr。不同的调度算法在任务调度时采用不同的策略，例如：  
* FIFO：按照任务到达的顺序依次执行，直到任务完成或阻塞。
* RR：每个任务被分配一个固定的时间片，当时间片用完后，任务被暂停，下一个任务开始执行。
* CFS：通过计算每个任务的虚拟运行时间，优先选择虚拟运行时间最短的任务执行，以保证公平性。

#### 2. 任务状态管理
任务有四种状态：Running、Ready、Blocked和Exited，定义在arceos/modules/axtask/src/task.rs中，通过 put_task_with_state 函数实现任务状态的转换和任务的插入操作：  
```rust
#[repr(u8)]
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum TaskState {
    Running = 1,
    Ready = 2,
    Blocked = 3,
    Exited = 4,
}
```
Running：任务正在 CPU 上执行；  
Ready：任务已经准备好执行，等待调度器分配 CPU 时间；  
Blocked：任务因为某些原因（如等待 I/O、等待锁等）被阻塞，暂时不能执行；  
Exited：任务已经执行完毕，等待资源回收。  

#### 3. 调度核心逻辑
调度的核心逻辑在arceos/modules/axtask/src/run_queue.rs的AxRunQueue结构体中实现，主要包括任务添加、任务唤醒、任务切换等操作。  
##### 3.1 任务添加
```rust
impl<G: BaseGuard> AxRunQueueRef<'_, G> {
    pub fn add_task(&mut self, task: AxTaskRef) {
        debug!(
            "task add: {} on run_queue {}",
            task.id_name(),
            self.inner.cpu_id
        );
        assert!(task.is_ready());
        self.inner.scheduler.lock().add_task(task);
    }
}
```
功能：将一个就绪状态的任务添加到调度器的就绪队列中。  

##### 3.2 任务唤醒
```rust
impl<G: BaseGuard> AxRunQueueRef<'_, G> {
    pub fn unblock_task(&mut self, task: AxTaskRef, resched: bool) {
        let task_id_name = task.id_name();
        if self
            .inner
            .put_task_with_state(task, TaskState::Blocked, resched)
        {
            let cpu_id = self.inner.cpu_id;
            debug!("task unblock: {} on run_queue {}", task_id_name, cpu_id);
            if resched && cpu_id == this_cpu_id() {
                #[cfg(feature = "preempt")]
                crate::current().set_preempt_pending(true);
            }
        }
    }
}
```
功能：将一个阻塞状态的任务唤醒，使其进入就绪状态，并根据需要设置抢占标志。  

##### 3.3 任务切换
```rust
impl AxRunQueue {
    fn resched(&mut self) {
        let next = self
            .scheduler
            .lock()
            .pick_next_task()
            .unwrap_or_else(|| unsafe {
                IDLE_TASK.current_ref_raw().get_unchecked().clone()
            });
        assert!(
            next.is_ready(),
            "next {} is not ready: {:?}",
            next.id_name(),
            next.state()
        );
        self.switch_to(crate::current(), next);
    }

    fn switch_to(&mut self, prev_task: CurrentTask, next_task: AxTaskRef) {
        // 任务切换逻辑
    }
}
```
功能：resched方法选择下一个要执行的任务，并调用switch_to方法进行任务切换。

#### 4. 定时器处理
如果启用了 irq 特性，任务调度模块会处理定时器事件。在 on_timer_tick 函数中，会检查定时器事件并更新调度器状态：
```rust
/// Handles periodic timer ticks for the task manager.
///
/// For example, advance scheduler states, checks timed events, etc.
#[cfg(feature = "irq")]
#[doc(cfg(feature = "irq"))]
pub fn on_timer_tick() {
    use kernel_guard::NoOp;
    crate::timers::check_events();
    // Since irq and preemption are both disabled here,
    // we can get current run queue with the default `kernel_guard::NoOp`.
    current_run_queue::<NoOp>().scheduler_timer_tick();
}
```