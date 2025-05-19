# ArceOS 文件系统接口

本文介绍了 ArceOS 的文件系统接口设计，主要面向使用 `axfs` 模块构建操作系统内核的开发者，涉及的内容包括：

1. 关键结构体与关联函数
2. 基于根目录的 `[std::fs]-like` API
3. `axfs` 模块 `feature` 配置策略

## 关键结构体与关联函数

对使用 `axfs` 模块的开发者来说，需要关注的主要结构体有：

1. `File`：具体的文件对象，提供了对文件的打开和读写等操作。
2. `Directory`：具体的目录对象，提供了对目录的增删改查等操作。
3. `DirEntry`：目录项，用于表示目录中的文件名和类型等信息。
4. `FileAttr`：文件属性，包括文件类型、权限、大小等信息


### 文件操作

`File` 结构体表示打开的文件对象：

- `node`：表示文件节点的引用，使用 `WithCap` 包装，增加了对文件的权限控制功能。具体参考[cap_access](https://github.com/arceos-org/cap_access)。
- `is_append`：表示文件是否以追加模式打开。例如 `open("/tmp/xxx", "a")` 打开文件时，`is_append` 为 `true`，并且 `offset` 指向文件末尾。
- `offset`：文件指针，表示文件的读写位置。

```rust
/// An opened file object, with open permissions and a cursor.
pub struct File {
    node: WithCap<VfsNodeRef>,
    is_append: bool,
    offset: u64,
}
```

`File` 实现了如下的函数：
```rust
fn access_node(&self, cap: Cap) -> AxResult<&VfsNodeRef>;

fn _open_at(dir: Option<&VfsNodeRef>, path: &str, opts: &OpenOptions) -> AxResult<Self>;

/// Opens a file at the path relative to the current directory. Returns a
/// [`File`] object.
pub fn open(path: &str, opts: &OpenOptions) -> AxResult<Self>;

/// Truncates the file to the specified size.
pub fn truncate(&self, size: u64) -> AxResult;

/// Reads the file at the current position. Returns the number of bytes
/// read.
///
/// After the read, the cursor will be advanced by the number of bytes read.
pub fn read(&mut self, buf: &mut [u8]) -> AxResult<usize>;

/// Reads the file at the given position. Returns the number of bytes read.
///
/// It does not update the file cursor.
pub fn read_at(&self, offset: u64, buf: &mut [u8]) -> AxResult<usize>;

/// Writes the file at the current position. Returns the number of bytes
/// written.
///
/// After the write, the cursor will be advanced by the number of bytes
/// written.
pub fn write(&mut self, buf: &[u8]) -> AxResult<usize>;

/// Writes the file at the given position. Returns the number of bytes
/// written.
///
/// It does not update the file cursor.
pub fn write_at(&self, offset: u64, buf: &[u8]) -> AxResult<usize>;

/// Flushes the file, writes all buffered data to the underlying device.
pub fn flush(&self) -> AxResult;

/// Sets the cursor of the file to the specified offset. Returns the new
/// position after the seek.
pub fn seek(&mut self, pos: SeekFrom) -> AxResult<u64>;


/// Gets the file attributes.
pub fn get_attr(&self) -> AxResult<FileAttr>;
```

解释一下 `File` 中的部分函数：

- `truncate`：将文件截断或扩展到指定大小，若文件小于指定大小，则在文件末尾填充零。
- `flush`：将文件的缓冲区数据刷新到底层设备，确保数据持久化。
- `seek`：设置文件的读写位置，返回新的位置。`SeekFrom` 是一个枚举类型，表示相对位置，可以是文件开头、当前文件位置或文件末尾，与 `std::io::SeekFrom` 类似。
- `get_attr`：获取文件的属性，返回 `FileAttr` 结构体，包含文件的权限、类型、大小等信息。


### 目录操作

`Directory` 结构体表示打开的目录对象：

- `node`：表示目录节点的引用，使用 `WithCap` 包装，增加了对目录的权限控制功能。具体参考[cap_access](https://github.com/arceos-org/cap_access)。
- `entry_idx`：表示当前目录项的索引位置。

```rust
/// An opened directory object, with open permissions and a cursor for
/// [`read_dir`](Directory::read_dir).
pub struct Directory {
    node: WithCap<VfsNodeRef>,
    entry_idx: usize,
}
```

`Directory` 实现了如下的函数：
```rust
fn access_node(&self, cap: Cap) -> AxResult<&VfsNodeRef>;

fn _open_dir_at(dir: Option<&VfsNodeRef>, path: &str, opts: &OpenOptions) -> AxResult<Self>;

fn access_at(&self, path: &str) -> AxResult<Option<&VfsNodeRef>>;

/// Opens a directory at the path relative to the current directory.
/// Returns a [`Directory`] object.
pub fn open_dir(path: &str, opts: &OpenOptions) -> AxResult<Self>;

/// Opens a directory at the path relative to this directory. Returns a
/// [`Directory`] object.
pub fn open_dir_at(&self, path: &str, opts: &OpenOptions) -> AxResult<Self>;

/// Opens a file at the path relative to this directory. Returns a [`File`]
/// object.
pub fn open_file_at(&self, path: &str, opts: &OpenOptions) -> AxResult<File>;

/// Creates an empty file at the path relative to this directory.
pub fn create_file(&self, path: &str) -> AxResult<VfsNodeRef>;

/// Creates an empty directory at the path relative to this directory.
pub fn create_dir(&self, path: &str) -> AxResult;

/// Removes a file at the path relative to this directory.
pub fn remove_file(&self, path: &str) -> AxResult;

/// Removes a directory at the path relative to this directory.
pub fn remove_dir(&self, path: &str) -> AxResult;

/// Reads directory entries starts from the current position into the
/// given buffer. Returns the number of entries read.
///
/// After the read, the cursor will be advanced by the number of entries
/// read.
pub fn read_dir(&mut self, dirents: &mut [DirEntry]) -> AxResult<usize>;

/// Rename a file or directory to a new name.
/// Delete the original file if `old` already exists.
///
/// This only works then the new path is in the same mounted fs.
pub fn rename(&self, old: &str, new: &str) -> AxResult;
```

上述函数根据注释信息已经能够见名知意，这里不再加以赘述了。

### 目录项

`DirEntry` 结构体表示目录项，其中包含了文件名和文件属性等信息。它是 `axfs_vfs::VfsDirEntry` 的别名。

目前内部仅记录两个字段：

- `d_type`：表示文件类型，使用 `VfsNodeType` 枚举类型。
- `d_name`：表示文件名，使用一个长度为 63 的字节数组存储文件名。

```rust
/// Alias of [`axfs_vfs::VfsDirEntry`].
pub type DirEntry = axfs_vfs::VfsDirEntry;

/// Directory entry.
pub struct VfsDirEntry {
    d_type: VfsNodeType,
    d_name: [u8; 63],
}

pub enum VfsNodeType {
    /// FIFO (named pipe)
    Fifo = 0o1,
    /// Character device
    CharDevice = 0o2,
    /// Directory
    Dir = 0o4,
    /// Block device
    BlockDevice = 0o6,
    /// Regular file
    File = 0o10,
    /// Symbolic link
    SymLink = 0o12,
    /// Socket
    Socket = 0o14,
}
```

!!! caution "文件名长度限制"

    目前 Arceos 中的文件名长度限制为 63 字节，实际使用中可能会遇到一些问题，例如 `lwext4` 文件系统中，文件名长度限制为 255 字节，因此在使用 `lwext4` 文件系统时，可能会遇到文件名过长的问题。

### 文件属性

`FileAttr` 结构体表示文件或目录的属性，包含了文件的权限、类型、大小和分配的块数等信息。它是 `axfs_vfs::VfsNodeAttr` 的别名。

内部实现的具体函数请参考 [axfs_vfs::VfsNodeAttr](https://github.com/arceos-org/axfs_crates/blob/main/axfs_vfs/src/structs.rs)。

```rust
/// Alias of [`axfs_vfs::VfsNodeAttr`].
pub type FileAttr = axfs_vfs::VfsNodeAttr;

/// Node (file/directory) attributes.
pub struct VfsNodeAttr {
    /// File permission mode.
    mode: VfsNodePerm,
    /// File type.
    ty: VfsNodeType,
    /// Total size, in bytes.
    size: u64,
    /// Number of 512B blocks allocated.
    blocks: u64,
}

bitflags::bitflags! {
    /// Node (file/directory) permission mode.
    #[derive(Debug, Clone, Copy)]
    pub struct VfsNodePerm: u16 {
        /// Owner has read permission.
        const OWNER_READ = 0o400;
        /// Owner has write permission.
        const OWNER_WRITE = 0o200;
        /// Owner has execute permission.
        const OWNER_EXEC = 0o100;

        /// Group has read permission.
        const GROUP_READ = 0o40;
        /// Group has write permission.
        const GROUP_WRITE = 0o20;
        /// Group has execute permission.
        const GROUP_EXEC = 0o10;

        /// Others have read permission.
        const OTHER_READ = 0o4;
        /// Others have write permission.
        const OTHER_WRITE = 0o2;
        /// Others have execute permission.
        const OTHER_EXEC = 0o1;
    }
}
```

`axfs` 模块提供了对文件、目录进行直接操作的接口，现在只需要将根目录 `ROOT` 暴露给开发者就可以得到一个完整的文件系统 API 了。


## `[std::fs]-like` API

除了上一节中操作文件和目录的 API 之外，ArceOS 还提供了一套类似于 Rust 标准库的文件系统 API，这样也简化了开发者在 ArceOS 基础上实现 rust 标准库的工作。参考 [rust 官方 std::fs](https://doc.rust-lang.org/std/fs/index.html)

![文件系统 API](../../static/arceos-modules/fs/文件系统API.png)

```rust
// file operations

/// Read the entire contents of a file into a bytes vector.
pub fn read(path: &str) -> io::Result<Vec<u8>>;

/// Read the entire contents of a file into a string.
pub fn read_to_string(path: &str) -> io::Result<String>;

/// Write a slice as the entire contents of a file.
pub fn write<C: AsRef<[u8]>>(path: &str, contents: C) -> io::Result<()>;

/// Removes a file from the filesystem.
pub fn remove_file(path: &str) -> io::Result<()>;


// dir operations

/// Returns an iterator over the entries within a directory.
pub fn read_dir(path: &str) -> io::Result<ReadDir>;

/// Creates a new, empty directory at the provided path.
pub fn create_dir(path: &str) -> io::Result<()>;

/// Recursively create a directory and all of its parent components if they
/// are missing.
pub fn create_dir_all(path: &str) -> io::Result<()>;

/// Removes an empty directory.
pub fn remove_dir(path: &str) -> io::Result<()>;

// misc

/// Given a path, query the file system to get information about a file,
/// directory, etc.
pub fn metadata(path: &str) -> io::Result<Metadata>;

/// Returns the canonical, absolute form of a path with all intermediate
/// components normalized.
pub fn canonicalize(path: &str) -> io::Result<String>;

/// check whether absolute path exists.
pub fn absolute_path_exists(path: &str) -> bool;

/// Returns the current working directory as a [`String`].
pub fn current_dir() -> io::Result<String>;

/// Changes the current working directory to the specified path.
pub fn set_current_dir(path: &str) -> io::Result<()>;

/// Rename a file or directory to a new name.
/// Delete the original file if `old` already exists.
///
/// This only works then the new path is in the same mounted fs.
pub fn rename(old: &str, new: &str) -> io::Result<()>;
```

!!! caution "基本元件 `axio`"

    这里的 io 是 [axio](https://github.com/arceos-org/axio)，它类似于 Rust 标准库的 `std::io`，提供了在 `no_std` 环境下基本 IO 操作的接口。`axio` 属于 ArceOS 的基本元件之一，作为一个独立的 crate 发布，类似的元件还有 [axfs_crates](https://github.com/arceos-org/axfs_crates), [axmm_crates](https://github.com/arceos-org/axmm_crates) 等。体现了 ArceOS 的模块化设计理念。

上面的代码可以分为以下三个部分：

1. 文件操作：`read`、`read_to_string`、`write`、`remove_file`。
2. 目录操作：`read_dir`、`create_dir`、`create_dir_all`、`remove_dir`。
3. 其他操作：`metadata`、`canonicalize`、`absolute_path_exists`、`current_dir`、`set_current_dir`、`rename`。

下面详细解释部分接口：

1. `create_dir_all`：创建路径上的所有目录，功能类似于 `mkdir -p /path/to/dir`
2. `metadata`：获取指定路径的元数据，返回 `Metadata` 结构体，其中包含文件类型、大小、读写权限等信息。
3. `canonicalize`：将指定路径进行规范化处理，效果如下：
    ```rust
    assert_eq!(canonicalize("/path/./to//foo"), "/path/to/foo");
    assert_eq!(canonicalize("/./path/to/../bar.rs"), "/path/bar.rs");
    assert_eq!(canonicalize("./foo/./bar"), "foo/bar");
    ```


## Features 配置策略
在模块层中的 `axfs` 中，会根据应用程序提供的配置，静态选择所需的文件系统，进行初始化并挂载。

使用了 rust 语言提供的 `Cargo.toml` 中的 `features` 来控制需要加入内核的文件系统。

```toml
# modules/axfs/Cargo.toml
[features]
devfs = ["dep:axfs_devfs"]
ramfs = ["dep:axfs_ramfs"]
procfs = ["dep:axfs_ramfs"]
sysfs = ["dep:axfs_ramfs"]
lwext4_rs = ["dep:lwext4_rust"]
fatfs = ["dep:fatfs"]
myfs = ["dep:crate_interface"]
use-ramdisk = []

default = ["devfs", "ramfs", "fatfs", "procfs", "sysfs"]
```

### 特殊的文件系统

ArceOS 是一个兼容 linux 接口的组件化内核，因此需要挂载 `devfs`、`procfs` 和 `sysfs` 三个特殊的文件系统：

1. `devfs`：设备文件系统，提供了对设备的访问接口，目前的 `devfs` 仅实现了 `/dev/null` 和 `/dev/zero` 设备文件，具体参考[axfs_vfs::axfs_devfs](https://github.com/arceos-org/axfs_crates/tree/main/axfs_devfs)。
2. `procfs`：是一个基于内存的文件系统，提供了对进程信息的访问接口，目前的实现有待开发中。
3. `sysfs`：系统文件系统，提供了对系统信息的访问接口，目前有待开发中。

这些文件系统是内核的一部分，提供了对内核数据结构的访问接口，用于在内核和用户空间之间传递特定信息或实现特定功能。

如果在 Arceos 中启用了 `axfs` 模块的 feature，那么初始化文件系统时，会在根目录中对它们进行挂载。

```rust
pub(crate) fn init_rootfs(disk: crate::dev::Disk) {
    // ...

    #[cfg(feature = "devfs")]
    root_dir
        .mount("/dev", mounts::devfs())
        .expect("failed to mount devfs at /dev");

    #[cfg(feature = "ramfs")]
    root_dir
        .mount("/tmp", mounts::ramfs())
        .expect("failed to mount ramfs at /tmp");

    // Mount another ramfs as procfs
    #[cfg(feature = "procfs")]
    root_dir // should not fail
        .mount("/proc", mounts::procfs().unwrap())
        .expect("fail to mount procfs at /proc");

    // Mount another ramfs as sysfs
    #[cfg(feature = "sysfs")]
    root_dir // should not fail
        .mount("/sys", mounts::sysfs().unwrap())
        .expect("fail to mount sysfs at /sys");

    // ...
}
```

### 根文件系统

根文件系统是操作系统的基础文件系统，其他文件系统都需要挂载在根文件系统上。

在 ArceOS 中，开发者通过改变 feature 选择具体的文件系统类型作为根文件系统。默认情况下，根文件系统选择的优先级顺序依次为 `myfs`、`lwext4_rs`、`fatfs`。如果没有选择任何一个文件系统的 `feature`，则编译错误。

```rust
pub(crate) fn init_rootfs(disk: crate::dev::Disk) {
    cfg_if::cfg_if! {
        if #[cfg(feature = "myfs")] { // override the default filesystem
            let main_fs = fs::myfs::new_myfs(disk);
        } else if #[cfg(feature = "lwext4_rs")] {
            static EXT4_FS: LazyInit<Arc<fs::lwext4_rust::Ext4FileSystem>> = LazyInit::new();
            EXT4_FS.init_once(Arc::new(fs::lwext4_rust::Ext4FileSystem::new(disk)));
            let main_fs = EXT4_FS.clone();
        } else if #[cfg(feature = "fatfs")] {
            static FAT_FS: LazyInit<Arc<fs::fatfs::FatFileSystem>> = LazyInit::new();
            FAT_FS.init_once(Arc::new(fs::fatfs::FatFileSystem::new(disk)));
            FAT_FS.init();
            let main_fs = FAT_FS.clone();
        }
    }

    let root_dir = RootDirectory::new(main_fs);

    // ...
}
```

### 使用自定义的文件系统

ArceOS 允许开发者在用户应用中使用自定义的文件系统，只需要完成两个步骤：

1. 在用户应用的 `Cargo.toml` 中添加对 `myfs` 的 feature，一般通过对 `axstd/myfs` 的依赖来实现。
2. 实现 `MyFileSystemIfImpl` 接口

```rust
/// The interface to define custom filesystems in user apps.
#[crate_interface::def_interface]
pub trait MyFileSystemIf {
    /// Creates a new instance of the filesystem with initialization.
    ///
    /// TODO: use generic disk type
    fn new_myfs(disk: Disk) -> Arc<dyn VfsOps>;
}

pub(crate) fn new_myfs(disk: Disk) -> Arc<dyn VfsOps> {
    crate_interface::call_interface!(MyFileSystemIf::new_myfs(disk))
}
```

下面以 ArceOS 项目下的 `examples/shell` 为例，演示如何使用自定义的文件系统。

1. 添加对 `myfs` 的依赖
    ```toml
    # examples/shell/Cargo.toml

    [features]
    use-ramfs = ["axstd/myfs", "dep:axfs_vfs", "dep:axfs_ramfs", "dep:crate_interface"]
    default = []

    [dependencies]
    axfs_vfs = { version = "0.1", optional = true }
    axfs_ramfs = { version = "0.1", optional = true }
    crate_interface = { version = "0.1", optional = true }
    axstd = { workspace = true, features = ["alloc", "fs"], optional = true }
    ```
2. 实现 `MyFileSystemIfImpl` 接口
    ```rust
    // examples/shell/src/ramfs.rs

    struct MyFileSystemIfImpl;

    #[crate_interface::impl_interface]
    impl MyFileSystemIf for MyFileSystemIfImpl {
        fn new_myfs(_disk: AxDisk) -> Arc<dyn VfsOps> {
            Arc::new(RamFileSystem::new())
        }
    }
    ```

这里 `#[crate_interface::impl_interface]` 是 `crate_interface` 提供的宏，用于实现接口。它会自动生成一个实现了 `MyFileSystemIf` 接口的结构体 `MyFileSystemIfImpl`，并将其注册到 `crate_interface` 中。

随后，当 ArceOS 启动时，会自动调用 `MyFileSystemIfImpl::new_myfs` 函数来创建文件系统实例，并将其挂载到根目录上。

```rust
pub(crate) fn init_rootfs(disk: crate::dev::Disk) {
    cfg_if::cfg_if! {
        if #[cfg(feature = "myfs")] { // override the default filesystem
            let main_fs = fs::myfs::new_myfs(disk);
        } else if #[cfg(feature = "lwext4_rs")] {
            // ...
        } else if #[cfg(feature = "fatfs")] {
            // ...
        }
    }

    let root_dir = RootDirectory::new(main_fs);
}
```
