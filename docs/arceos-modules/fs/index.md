# ArceOS 文件系统

`axfs` 模块负责接入不同来源的文件系统，并为用户提供统一的文件系统功能调用接口，使得其他的模块在调用时无需关心具体的文件系统细节，同时也为文件系统接入 ArceOS 中提供了统一的接口。

<center>
    <img src="/../../static/arceos-modules/fs/文件系统结构图.png" height="80%" width="80%">
</center>

本模块的是基于虚拟文件系统 [axfs_vfs](https://github.com/arceos-org/axfs_crates/tree/main/axfs_vfs) 元件实现的，它提供了一个虚拟文件系统的抽象层。在这层抽象层之上，`axfs` 对其进行了封装，为用户提供了统一的文件系统功能调用接口，如文件读写、目录操作等。

具体来说，文件系统章节将会介绍如下内容：

1. ArceOS 文件系统兼容层的具体实现
2. `axfs` 模块的启动与初始化
3. 如何向 ArceOS 中接入新的文件系统
4. 关键结构体字段与 API 以及基本示例代码
5. `axfs` 模块 `Features` 的配置策略

## TODO

最后，目前 ArceOS 的文件系统模块还处于开发阶段，部分功能还没有实现，欢迎大家提出 PR！

- 改进对 `devfs/shmfs/procfs` 等特殊文件系统支持，对支持 libc 的一些功能有重要作用 
- 支持文件/目录的**软\硬链接**功能
- 支持获取文件系统信息
- 支持文件/目录的**时间戳**功能
