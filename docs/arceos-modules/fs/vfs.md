# ArceOS 文件系统实现

## 文件系统兼容层

`axfs_vfs` 是 `ArceOS` 使用的虚拟文件操作系统接口。

上层的文件系统需要实现 `trait VfsOps`，其文件和目录需要实现 `trait VfsNodeOps`。

详见 https://docs.rs/axfs_vfs/latest/axfs_vfs/

## 接入不同文件系统

### axfs_ramfs

https://docs.rs/axfs_ramfs/latest/axfs_ramfs/

### axfs_devfs

https://docs.rs/axfs_devfs/latest/axfs_devfs/

### fatfs

基于 https://github.com/rafalh/rust-fatfs 实现

### lwext4_rust

基于 https://github.com/Azure-stars/lwext4_rust 实现