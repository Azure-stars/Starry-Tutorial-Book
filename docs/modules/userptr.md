# UserPtr 封装

在内核空间中处理来自用户空间的指针时，需要进行检查以确保指针的合法性。

在 Linux 中，用户空间指针使用 `__user` 标记，且需要使用 `copy_from_user` 和 `copy_to_user` 等函数进行数据传输。在 Starry 中，我们提供了 `UserPtr<T>` 与 `UserConstPtr<T>` 两种类型用于处理用户空间的指针。

`usize` 类型可以直接 `into` 转换为 `UserPtr<T>` 或 `UserConstPtr<T>`。`UserPtr::get` 方法会执行对目标地址的检查（包括是否对齐、对应页是否加载且用户可访问），成功后返回 `*mut T`（或 `*const T`）。由于在 Starry 中用户与内核 **共享地址空间**，之后可以直接使用该指针写入 / 读出数据。

注意 `UserPtr::get` 假设用户仅会访问目标指针处 `size_of::<T>()` 大小的内存区域。如果指针对应区域是定长数组或其他类型，你需要使用如下的方法来获取指针：

- `UserPtr::get_as(Layout) -> *mut T`：检查目标区域指定布局是否合法（布局包括对齐和大小），成功后返回 `*mut T`；
- `UserPtr::get_as_array(length) -> *mut T`：相当于 `UserPtr::get_as(Layout::new::<[T; length]>())`；
- `UserPtr::get_as_bytes(length) -> *mut T`：相当于 `UserPtr::get_as(Layout::new::<[u8; length]>())`。
- `UserPtr::get_as_null_terminated() -> &'static mut [T]`：检查目标区域是否以 `T::default()` 结尾，成功后返回 `&'static mut [T]`。
- `UserConstPtr::<c_char>::get_as_str() -> &'static str`：检查目标区域是否是合法的 C 风格字符串，成功后返回 `&'static str`。相当于 `UserConstPtr::<c_char>::get_as_null_terminated()`。
