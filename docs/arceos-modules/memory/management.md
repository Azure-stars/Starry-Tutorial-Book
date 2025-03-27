# 内存管理机制

描述如何实现内存管理，包括 linear、lazy alloc 等内容

## 核心数据结构
`AddrSpace` 结构体是内存管理的核心，包含以下主要字段：
```rust
pub struct AddrSpace {
    va_range: VirtAddrRange,
    areas: MemorySet<Backend>,
    pt: PageTable,
}
```
- `va_range`：表示虚拟地址范围，定义了该地址空间的起始和结束地址。
- `areas`：管理多个内存区域，每个区域有不同的属性和映射方式。
- `pt`：页表，负责将虚拟地址映射到物理地址。

## 线性映射（Linear Mapping）
线性映射是指虚拟地址和物理地址之间存在固定的偏移关系。在 `AddrSpace` 中，通过 `map_linear` 方法实现线性映射：
```rust
pub fn map_linear(
    &mut self,
    start_vaddr: VirtAddr,
    start_paddr: PhysAddr,
    size: usize,
    flags: MappingFlags,
) -> AxResult {
    self.validate_region(start_vaddr, size)?;
    if !start_paddr.is_aligned_4k() {
        return ax_err!(InvalidInput, "address not aligned");
    }

    let offset = start_vaddr.as_usize() - start_paddr.as_usize();
    let area = MemoryArea::new(start_vaddr, size, flags, Backend::new_linear(offset));
    self.areas
        .map(area, &mut self.pt, false)
        .map_err(mapping_err_to_ax_err)?;
    Ok(())
}
```
- **步骤**：
  1. **验证地址范围**：确保起始虚拟地址和大小在地址空间范围内，且地址对齐。
  2. **计算偏移量**：计算虚拟地址和物理地址之间的固定偏移量。
  3. **创建内存区域**：使用 `MemoryArea::new` 创建一个新的内存区域，并指定线性映射的后端 `Backend::new_linear(offset)`。
  4. **映射内存区域**：调用 `MemorySet` 的 `map` 方法将内存区域映射到页表中。

## 延迟分配（Lazy Alloc）
延迟分配是指在实际访问内存时才进行物理内存的分配。在 `AddrSpace` 中，通过 `map_alloc` 方法实现延迟分配：
```rust
pub fn map_alloc(
    &mut self,
    start: VirtAddr,
    size: usize,
    flags: MappingFlags,
    populate: bool,
) -> AxResult {
    self.validate_region(start, size)?;

    let area = MemoryArea::new(start, size, flags, Backend::new_alloc(populate));
    self.areas
        .map(area, &mut self.pt, false)
        .map_err(mapping_err_to_ax_err)?;
    Ok(())
}
```
- **步骤**：
  1. **验证地址范围**：确保起始虚拟地址和大小在地址空间范围内，且地址对齐。
  2. **创建内存区域**：使用 `MemoryArea::new` 创建一个新的内存区域，并指定延迟分配的后端 `Backend::new_alloc(populate)`。
  3. **映射内存区域**：调用 `MemorySet` 的 `map` 方法将内存区域映射到页表中。

## 延迟分配的实现细节
### 页面错误处理
当访问未映射的页面时，会触发页面错误。`AddrSpace` 通过 `handle_page_fault` 方法处理页面错误：
```rust
pub fn handle_page_fault(&mut self, vaddr: VirtAddr, access_flags: MappingFlags) -> bool {
    if !self.va_range.contains(vaddr) {
        return false;
    }
    if let Some(area) = self.areas.find(vaddr) {
        let orig_flags = area.flags();
        if orig_flags.contains(access_flags) {
            return area
               .backend()
               .handle_page_fault(vaddr, orig_flags, &mut self.pt);
        }
    }
    false
}
```
- **步骤**：
  1. **检查地址范围**：确保虚拟地址在地址空间范围内。
  2. **查找内存区域**：查找包含该虚拟地址的内存区域。
  3. **检查访问权限**：检查访问权限是否合法。
  4. **处理页面错误**：调用内存区域后端的 `handle_page_fault` 方法处理页面错误。