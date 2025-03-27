# 虚拟内存管理模块接口

## 1. 结构体概述
`AddrSpace` 结构体表示虚拟内存地址空间，包含虚拟地址范围、内存区域集合以及页表。通过该结构体提供的接口，可以对虚拟内存地址空间进行管理，包括创建、映射、解除映射、读写数据等操作。

## 2. 接口文档

### 2.1 基本信息查询接口
- **`base(&self) -> VirtAddr`**
    - **功能**：返回地址空间的基地址。
    - **参数**：无
    - **返回值**：`VirtAddr` 类型的基地址

- **`end(&self) -> VirtAddr`**
    - **功能**：返回地址空间的结束地址。
    - **参数**：无
    - **返回值**：`VirtAddr` 类型的结束地址

- **`size(&self) -> usize`**
    - **功能**：返回地址空间的大小。
    - **参数**：无
    - **返回值**：`usize` 类型的地址空间大小

- **`page_table(&self) -> &PageTable`**
    - **功能**：返回内部页表的引用。
    - **参数**：无
    - **返回值**：`&PageTable` 类型的页表引用

- **`page_table_root(&self) -> PhysAddr`**
    - **功能**：返回内部页表的根物理地址。
    - **参数**：无
    - **返回值**：`PhysAddr` 类型的页表根物理地址

- **`contains_range(&self, start: VirtAddr, size: usize) -> bool`**
    - **功能**：检查地址空间是否包含给定的地址范围。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始地址
        - `size`：`usize` 类型的地址范围大小
    - **返回值**：`bool` 类型，表示是否包含该地址范围

### 2.2 创建与初始化接口
- **`new_empty(base: VirtAddr, size: usize) -> AxResult<Self>`**
    - **功能**：创建一个新的空地址空间。
    - **参数**：
        - `base`：`VirtAddr` 类型的基地址
        - `size`：`usize` 类型的地址空间大小
    - **返回值**：`AxResult<Self>` 类型，表示创建结果

### 2.3 页表映射操作接口
- **`copy_mappings_from(&mut self, other: &AddrSpace) -> AxResult`**
    - **功能**：从另一个地址空间复制页表映射。
    - **参数**：
        - `other`：`&AddrSpace` 类型的另一个地址空间引用
    - **返回值**：`AxResult` 类型，表示操作结果
    - **注意事项**：复制的页表项在丢弃时会被清除，可能会影响原页表。可使用 `clear_mappings` 解决。

- **`clear_mappings(&mut self, range: VirtAddrRange)`**
    - **功能**：清除给定地址范围内的页表映射。
    - **参数**：
        - `range`：`VirtAddrRange` 类型的地址范围
    - **返回值**：无

### 2.4 内存区域管理接口
- **`find_free_area(&self, hint: VirtAddr, size: usize, limit: VirtAddrRange) -> Option<VirtAddr>`**
    - **功能**：查找一个可以容纳给定大小的空闲区域。
    - **参数**：
        - `hint`：`VirtAddr` 类型的提示地址
        - `size`：`usize` 类型的所需大小
        - `limit`：`VirtAddrRange` 类型的限制范围
    - **返回值**：`Option<VirtAddr>` 类型，表示空闲区域的起始地址，如果未找到则返回 `None`

- **`map_linear(&mut self, start_vaddr: VirtAddr, start_paddr: PhysAddr, size: usize, flags: MappingFlags) -> AxResult`**
    - **功能**：添加一个新的线性映射。
    - **参数**：
        - `start_vaddr`：`VirtAddr` 类型的起始虚拟地址
        - `start_paddr`：`PhysAddr` 类型的起始物理地址
        - `size`：`usize` 类型的映射大小
        - `flags`：`MappingFlags` 类型的映射标志
    - **返回值**：`AxResult` 类型，表示操作结果

- **`map_alloc(&mut self, start: VirtAddr, size: usize, flags: MappingFlags, populate: bool) -> AxResult`**
    - **功能**：添加一个新的分配映射。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始虚拟地址
        - `size`：`usize` 类型的映射大小
        - `flags`：`MappingFlags` 类型的映射标志
        - `populate`：`bool` 类型，表示是否预填充
    - **返回值**：`AxResult` 类型，表示操作结果

- **`populate_area(&mut self, start: VirtAddr, size: usize) -> AxResult`**
    - **功能**：用物理帧填充指定区域。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始虚拟地址
        - `size`：`usize` 类型的区域大小
    - **返回值**：`AxResult` 类型，表示操作结果

- **`unmap(&mut self, start: VirtAddr, size: usize) -> AxResult`**
    - **功能**：移除指定虚拟地址范围内的映射。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始虚拟地址
        - `size`：`usize` 类型的地址范围大小
    - **返回值**：`AxResult` 类型，表示操作结果

- **`unmap_user_areas(&mut self) -> AxResult`**
    - **功能**：移除地址空间中的用户区域映射。
    - **参数**：无
    - **返回值**：`AxResult` 类型，表示操作结果

### 2.5 数据读写接口
- **`read(&self, start: VirtAddr, buf: &mut [u8]) -> AxResult`**
    - **功能**：从地址空间中读取数据。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始虚拟地址
        - `buf`：`&mut [u8]` 类型的缓冲区
    - **返回值**：`AxResult` 类型，表示操作结果

- **`write(&self, start: VirtAddr, buf: &[u8]) -> AxResult`**
    - **功能**：向地址空间中写入数据。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始虚拟地址
        - `buf`：`&[u8]` 类型的缓冲区
    - **返回值**：`AxResult` 类型，表示操作结果

### 2.6 映射保护与验证接口
- **`protect(&mut self, start: VirtAddr, size: usize, flags: MappingFlags) -> AxResult`**
    - **功能**：更新指定虚拟地址范围内的映射。
    - **参数**：
        - `start`：`VirtAddr` 类型的起始虚拟地址
        - `size`：`usize` 类型的地址范围大小
        - `flags`：`MappingFlags` 类型的映射标志
    - **返回值**：`AxResult` 类型，表示操作结果

- **`check_region_access(&self, range: VirtAddrRange, access_flags: MappingFlags) -> bool`**
    - **功能**：检查对指定内存区域的访问是否有效。
    - **参数**：
        - `range`：`VirtAddrRange` 类型的内存区域范围
        - `access_flags`：`MappingFlags` 类型的访问标志
    - **返回值**：`bool` 类型，表示访问是否有效

### 2.7 异常处理接口
- **`handle_page_fault(&mut self, vaddr: VirtAddr, access_flags: MappingFlags) -> bool`**
    - **功能**：处理给定地址的页错误。
    - **参数**：
        - `vaddr`：`VirtAddr` 类型的虚拟地址
        - `access_flags`：`MappingFlags` 类型的访问标志
    - **返回值**：`bool` 类型，表示页错误是否处理成功

### 2.8 克隆接口
- **`clone_or_err(&mut self) -> AxResult<Self>`**
    - **功能**：克隆一个 `AddrSpace`，通过在新页表中重新映射所有内存区域并复制用户空间的数据。
    - **参数**：无
    - **返回值**：`AxResult<Self>` 类型，表示克隆结果

### 2.9 调试与清理接口
- **`fmt(&self, f: &mut fmt::Formatter) -> fmt::Result`**
    - **功能**：实现 `Debug` 特性，用于格式化输出 `AddrSpace` 的信息。
    - **参数**：
        - `f`：`&mut fmt::Formatter` 类型的格式化器
    - **返回值**：`fmt::Result` 类型，表示格式化结果

- **`drop(&mut self)`**
    - **功能**：实现 `Drop` 特性，在 `AddrSpace` 被丢弃时清除所有映射。
    - **参数**：无
    - **返回值**：无


