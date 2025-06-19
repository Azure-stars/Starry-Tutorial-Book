# 一个案例快速上手 Starry

在[环境配置](env.md)之后，我们通过一个例子来了解启动 Starry 宏内核大概都需要做什么准备工作。

##  克隆 [ArceOS](https://github.com/oscomp/arceos)

Starry 宏内核基于 ArceOS 运行，因而需要克隆特定 commit 号的 ArceOS 到  Starry 仓库中，即 `./.arceos/`。具体细节参考脚本文件 [`get_deps.sh`](https://github.com/oscomp/starry-next/blob/main/scripts/get_deps.sh)。执行下面的指令实现克隆 [ArceOS](https://github.com/oscomp/arceos)：
```bash
./scripts/get_deps.sh
```

## 创建应用程序镜像

在启动 Starry 宏内核之前，我们需要编译应用程序(C/rust)生成对应架构的可执行文件(ELF 文件)，并将他们挂载到 `./mnt/` 临时文件夹下，生成一个可读、写、执行的镜像文件 `disk.img`, 最终将该镜像文件移动到 `./.arceos/` 中，供 ArceOS 文件系统使用。以应用 `nimbos` 为例，具体可以参考 Starry 的 [Makefile](https://github.com/oscomp/starry-next/blob/main/Makefile) 中的 `user_apps` 指令、应用的 [Makefile](https://github.com/oscomp/starry-next/blob/main/apps/nimbos/Makefile) 文件，以及脚本文件 [`build_img.sh`](https://github.com/oscomp/starry-next/blob/main/build_img.sh)。 执行下面的指令实现应用程序 `nimbos` 的镜像创建：
```bash
make ARCH=riscv64 AX_TESTCASE=nimbos user_apps
```

## 定义配置文件

此外我们还需要对应的平台(PLAT_NAME)、指令架构(ARCH)、是否启用对称多处理器架构(SMP) 来生成相应的配置文件。 具体可以参考 [`config.mk`](https://github.com/oscomp/arceos/blob/main/scripts/make/config.mk)，执行下面的指令，能够生成配置文件 `./axconfig.toml`，(由于没有指定平台，则使用默认的 `QEMU` 平台):
```bash
make ARCH=riscv64 defconfig
```

!!! info "QEMU (Quick EMUlator)"

    QEMU 是一个非常强大的、开源的通用虚拟化和硬件仿真工具。在本项目中，它被用来实现硬件仿真：

    - 可以完全模拟一整台机器，包括 CPU、内存、磁盘、网卡、串口等。
    - 支持多架构（x86、ARM、RISC-V、LoongArch 等），可以在 x86 机器上模拟 RISC-V 硬件。

## 启动 Starry 宏内核

至此，我们已经做好了启动 Starry 宏内核的准备，接着我们要把整个工作空间进行构建，具体可以参考[cargo.mk](https://github.com/oscomp/arceos/blob/main/scripts/make/cargo.mk)中的 `cargo_build` 指令。在本例中构建完成后会生成一个可执行文件 `starry-next_riscv64-qemu-virt.elf`。通过 `rust-objcopy` 指令将这个 ELF 文件转化为转换成裸二进制镜像（BIN 文件）。 最终启用 QEMU 来调用这个二进制镜像，在模拟器中启动 Starry 宏内核。 以上的过程只需要通过执行下面的指令便可启动（具体细节请参考 ArceOS 的 [Makefile](https://github.com/oscomp/arceos/blob/main/Makefile)）：
```bash
make ARCH=riscv64 AX_TESTCASE=nimbos BLK=y NET=y ACCEL=n run
```

## 预期输出
```

       d8888                            .d88888b.   .d8888b.
      d88888                           d88P" "Y88b d88P  Y88b
     d88P888                           888     888 Y88b.
    d88P 888 888d888  .d8888b  .d88b.  888     888  "Y888b.
   d88P  888 888P"   d88P"    d8P  Y8b 888     888     "Y88b.
  d88P   888 888     888      88888888 888     888       "888
 d8888888888 888     Y88b.    Y8b.     Y88b. .d88P Y88b  d88P
d88P     888 888      "Y8888P  "Y8888   "Y88888P"   "Y8888P"

Hello world from user mode program!
Hello, world!
Hello, I am process 6.
Back in process 6, iteration 0.
Back in process 6, iteration 1.
Back in process 6, iteration 2.
Back in process 6, iteration 3.
Back in process 6, iteration 4.
yield passed!
into sleep test!
current time_usec = -38
time_msec = -38 after sleeping 1 seconds, delta = -1000000us!
simple_sleep passed!
```