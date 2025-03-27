# 多核调度机制实现

#### 1. 多核调度机制
ArceOS 支持多核调度，采用了 per-cpu run queue 机制。每个 CPU 都有自己的运行队列，任务可以在不同的 CPU 之间迁移。在 unblock_task 函数中，会根据 CPU ID 来判断是否需要重新调度：
```rust
let cpu_id = self.inner.cpu_id;
if resched && cpu_id == this_cpu_id() {
    #[cfg(feature = "preempt")]
    crate::current().set_preempt_pending(true);
}
```

#### 2. 特性配置
通过 axtask 模块的特性配置，可以开启多核调度支持：
```toml
smp = ["kspin/smp"]
```
其中，kspin/smp 表示使用支持多核的自旋锁，确保在多核环境下的并发安全。

#### 3. 运行队列管理
在多核系统中，每个 CPU 都有自己的运行队列AxRunQueue，通过percpu_static宏定义：
```rust
percpu_static! {
    RUN_QUEUE: LazyInit<AxRunQueue> = LazyInit::new(),
    // 其他CPU相关的静态变量
}
```
功能：每个 CPU 的运行队列独立管理该 CPU 上的任务，避免了多核之间的竞争。

#### 4. 任务分配
select_run_queue函数根据任务的 CPU 亲和性和负载均衡算法选择合适的运行队列：
```rust
#[inline]
pub(crate) fn select_run_queue<G: BaseGuard>(task: &AxTaskRef) -> AxRunQueueRef<'static, G> {
    let irq_state = G::acquire();
    #[cfg(feature = "smp")]
    {
        let index = select_run_queue_index(task.cpumask());
        AxRunQueueRef {
            inner: get_run_queue(index),
            state: irq_state,
            _phantom: core::marker::PhantomData,
        }
    }
    #[cfg(not(feature = "smp"))]
    {
        AxRunQueueRef {
            inner: unsafe { RUN_QUEUE.current_ref_mut_raw() },
            state: irq_state,
            _phantom: core::marker::PhantomData,
        }
    }
}
```
功能：在多核系统中，根据任务的 CPU 亲和性和负载均衡算法选择合适的运行队列，将任务分配到相应的 CPU 上执行。

#### 5. 任务迁移
当任务的 CPU 亲和性发生变化时，需要将任务迁移到合适的 CPU 上执行，通过migrate_current方法实现：
```rust
#[cfg(feature = "smp")]
pub fn migrate_current(&mut self, migration_task: AxTaskRef) {
    let curr = &self.current_task;
    curr.set_state(TaskState::Ready);
    self.inner.switch_to(crate::current(), migration_task);
}
```
功能：将当前任务迁移到合适的 CPU 上执行，确保任务在正确的 CPU 上运行。