# 动态内存分配模块接口

## axalloc 全局内存分配器模块

### GlobalAllocator 全局内存分配器特性

#### 1. `new` 
```rust
/// Creates an empty [`GlobalAllocator`].
pub const fn new() -> Self {
    Self {
        balloc: SpinNoIrq::new(DefaultByteAllocator::new()),
        palloc: SpinNoIrq::new(BitmapPageAllocator::new()),
    }
}
```
- **功能**：创建一个空的 `GlobalAllocator` 实例，初始化字节分配器 `balloc` 和页分配器 `palloc`。
- **用例**：在初始化全局分配器时，可能会使用该接口创建一个新的分配器实例。

#### 2. `name` 
```rust
pub const fn name(&self) -> &'static str {
    cfg_if::cfg_if! {
        if #[cfg(feature = "slab")] {
            "slab"
        } else if #[cfg(feature = "buddy")] {
            "buddy"
        } else if #[cfg(feature = "tlsf")] {
            "TLSF"
        }
    }
}
```
- **功能**：返回当前全局分配器的名称。
- **用例**：在需要获取全局分配器名称的地方调用该接口，例如在日志记录或调试信息中。

#### 3. `init` 
```rust
/// Initializes the allocator with the given region.
///
/// It firstly adds the whole region to the page allocator, then allocates
/// a small region (32 KB) to initialize the byte allocator. Therefore,
/// the given region must be larger than 32 KB.
pub fn init(&self, start_vaddr: usize, size: usize) {
    assert!(size > MIN_HEAP_SIZE);
    let init_heap_size = MIN_HEAP_SIZE;
    self.palloc.lock().init(start_vaddr, size);
    let heap_ptr = self
        .alloc_pages(init_heap_size / PAGE_SIZE, PAGE_SIZE)
        .unwrap();
    self.balloc.lock().init(heap_ptr, init_heap_size);
}
```
- **功能**：初始化全局分配器，需要提供起始虚拟地址和大小。它首先将整个区域添加到页分配器，然后分配一个小区域（32 KB）来初始化字节分配器。因此，给定的区域必须大于 32 KB。
- **用例**：在初始化全局分配器时调用该接口。

#### 4. `add_memory` 
```rust
pub fn add_memory(&self, start_vaddr: usize, size: usize) -> AllocResult {
    self.balloc.lock().add_memory(start_vaddr, size)
}
```
- **功能**：向全局分配器添加内存区域，需要提供起始虚拟地址和大小。
- **用例**：在需要动态添加内存区域的情况下调用该接口。

#### 5. `alloc` 
```rust
unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
    if let Ok(ptr) = GlobalAllocator::alloc(self, layout) {
        ptr.as_ptr()
    } else {
        alloc::alloc::handle_alloc_error(layout)
    }
}
```
- **功能**：根据给定的 `Layout` 分配内存，返回一个指向分配内存的指针。如果分配失败，调用 `handle_alloc_error` 处理错误。
- **用例**：在需要动态分配内存的地方调用该接口，例如在 `arceos/modules/axdma/src/dma.rs` 中，`DmaAllocator` 的 `alloc_coherent_bytes` 方法可能会间接使用该接口进行内存分配。

#### 6. `alloc_pages`
```rust
pub fn alloc_pages(&self, num_pages: usize, align_pow2: usize) -> AllocResult<usize> {
    self.palloc.lock().alloc_pages(num_pages, align_pow2)
}
```
- **功能**：分配指定数量和对齐要求的页面，返回分配的起始虚拟地址。
- **用例**：在需要分配页面的地方调用该接口。

#### 7. `dealloc` 
```rust
unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
    GlobalAllocator::dealloc(self, NonNull::new(ptr).expect("dealloc null ptr"), layout)
}
```
- **功能**：释放之前分配的内存，需要提供指向内存的指针和 `Layout`。
- **用例**：在不再需要使用分配的内存时调用该接口。

#### 8. `dealloc_pages` 
```rust
/// [`alloc_pages`]: GlobalAllocator::alloc_pages
pub fn dealloc_pages(&self, pos: usize, num_pages: usize) {
    self.palloc.lock().dealloc_pages(pos, num_pages)
}
```
- **功能**：释放之前分配的连续页面，需要提供页面的起始地址和页面数量。
- **用例**：在不再需要使用分配的连续页面时调用该接口。

#### 9. `used_bytes` 
```rust
/// Returns the number of allocated bytes in the byte allocator.
pub fn used_bytes(&self) -> usize {
    self.balloc.lock().used_bytes()
}
```
- **功能**：返回字节分配器中已分配的字节数。
- **用例**：在监控内存使用情况时调用该接口，例如在内存统计工具中使用。

#### 10. `used_pages` 
```rust
/// Returns the number of allocated pages in the page allocator.
pub fn used_pages(&self) -> usize {
    self.palloc.lock().used_pages()
}
```
- **功能**：返回页分配器中已分配的页面数。
- **用例**：在监控内存使用情况时调用该接口，例如在内存统计工具中使用。

#### 11. `vailable_bytes`
```rust
/// Returns the number of available bytes in the byte allocator.
pub fn available_bytes(&self) -> usize {
    self.balloc.lock().available_bytes()
}
```
- **功能**：返回字节分配器中可用的字节数。
- **用例**：在监控内存使用情况时调用该接口，例如在内存统计工具中使用。

### GlobalPage 全局页面特性

#### 1. `alloc`
```rust
pub fn alloc() -> AxResult<Self>
```

- **功能**：分配指定数量和对齐要求的页面，返回分配的起始虚拟地址。
- **用例**：在需要分配页面的地方调用该接口，例如在 `arceos/modules/axhal/src/paging.rs` 中，`alloc_frame` 函数调用该接口分配单个页面。

#### 2. `alloc_zero`

```rust
pub fn alloc_zero() -> AxResult<Self>
```

- **功能**：分配指定数量和对齐要求的页面，并将其内容清零，返回分配的起始虚拟地址。

#### 3. `alloc_contiguous`

```rust
pub fn alloc_contiguous(num_pages: usize, align_pow2: usize) -> AxResult<Self>
```

- **功能**：分配连续的指定数量和对齐要求的页面，返回分配的起始虚拟地址。

#### 4. `start_vaddr`

```rust
pub fn start_vaddr(&self) -> VirtAddr
```
- **功能**：返回分配的页面的起始虚拟地址。

#### 5. `start_paddr`

```rust
pub fn start_paddr<F>(&self, virt_to_phys: F) -> PhysAddr
```
- **功能**：根据提供的虚拟地址到物理地址转换函数，返回分配的页面的起始物理地址。

#### 6. `size`
```rust
pub fn size(&self) -> usize
```
- **功能**：返回分配的页面的大小。

#### 7. `as_ptr`

```rust
pub fn as_ptr(&self) -> *const u8
```

- **功能**：返回分配的页面的指针。

#### 8. `as_mut_ptr`
```rust
pub fn as_mut_ptr(&self) -> *mut u8
```
- **功能**：返回分配的页面的可变指针。

#### 9. `fill`
```rust
pub fn fill(&mut self, byte: u8)
```
- **功能**：将分配的页面的内容填充为指定的值。

#### 10. `zero`

```rust
pub fn zero(&mut self)
```
- **功能**：将分配的页面的内容清零。

#### 11. `as_slice`

```rust
pub fn as_slice(&self) -> &[u8]
```
- **功能**：返回分配的页面的切片。
#### 12. `as_mut_slice`
```rust
pub fn as_mut_slice(&mut self) -> &mut [u8]
```
- **功能**：返回分配的页面的可变切片。

### 接口

#### 1. `global_allocator`
```rust
pub fn global_allocator() -> &'static GlobalAllocator {
    &GLOBAL_ALLOCATOR
}
```
- **功能**：返回全局分配器的引用。
- **用例**：在需要全局分配器的地方调用该接口。

#### 2. `global_init`
```rust
pub fn global_init(start_vaddr: usize, size: usize) {
    debug!(
        "initialize global allocator at: [{:#x}, {:#x})",
        start_vaddr,
        start_vaddr + size
    );
    GLOBAL_ALLOCATOR.init(start_vaddr, size);
}
```
- **功能**：初始化全局分配器，需要提供起始虚拟地址和大小。
- **用例**：在初始化全局分配器时调用该接口。

## axdma 模块

### DmaAllocator DMA 分配器特性

#### 1 `alloc_coherent` 
```rust
pub unsafe fn alloc_coherent(layout: Layout) -> AllocResult<DMAInfo>;
```
- **功能**：根据给定的 `Layout` 分配连贯内存，并返回一个 `DMAInfo` 结构体，包含 CPU 地址和总线地址。

#### 2 `dealloc_coherent` 
```rust
pub unsafe fn dealloc_coherent(dma: DMAInfo, layout: Layout);
```
- **功能**：释放之前通过 `alloc_coherent` 分配的连贯内存。

#### 3 `phys_to_bus` 
```rust
pub const fn phys_to_bus(paddr: PhysAddr) -> BusAddr {
    BusAddr::new((paddr.as_usize() + axconfig::plat::PHYS_BUS_OFFSET) as u64)
}
```
- **功能**：将物理地址转换为总线地址，通过在物理地址上加上一个偏移量来实现。

#### 4 `virt_to_bus` 
```rust
const fn virt_to_bus(addr: VirtAddr) -> BusAddr {
    let paddr = virt_to_phys(addr);
    phys_to_bus(paddr)
}
```
- **功能**：将虚拟地址转换为总线地址，先将虚拟地址转换为物理地址，再调用 `phys_to_bus` 方法将物理地址转换为总线地址。
