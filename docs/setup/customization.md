# Starry 的自定义配置

***这篇主要是 Starry-Old 的配置说明， starry-next 待补充***

## make 选项

Starry 通过 make 时的选项进行自定义配置。

```sh
make OPTION1=<option1> OPTION2=<option2>,<option3> [command]
```

常用选项如下：

- `A` ：指定运行在 Starry 上的程序 (*starry-next 中为 `APP` ，目前使用 `AX_TESTCASE` 选项代替*)
- `ARCH` ：指定目标架构，当前可用 `x86_64 | aarch64 | riscv64` (*starry-next 额外支持 loongarch64*)
- `PLATFORM` ：指定目标平台，可用 `aarch64-raspi4 | aarch64-phytiumpi | aarch64-bsta1000b | aarch64-rk3588j` (*starry-next 暂不支持*)
- `BLK` ： qemu 选项，是否启用块设备，选项为 `y | n` ，需要存储及文件系统时必须开启
- `NET` ： qemu 选项，是否启用网络设备，选项为 `y | n` ，一般需要开启
- `LOG` ：输出到控制台的日志等级，选项为 `off | error | warn | info | debug | trace`
- `FEATURES` ：启用 ArceOS 的特性，用逗号分隔

## 可用特性

特性分为 `ax_feat | lib_feat | app_feat` , `FEATURES` 的内容会被 Makefile 分成 `ax_feat` 和 `lib_feat` ，其中 `lib_feat` 包括： `fp_simd alloc multitask fs net fd pipe select epoll irq sched_rr sched_cfs` 。

- `img` 特性用于加载 `build_img.sh` 生成的镜像文件，配合 `A=monolithic_userboot` 可进入含 busybox 等程序及文件的 shell ；将 `disk.img` 文件挂载后，可将其他文件复制进磁盘文件，在 shell 中可访问。
- `lwext4_rust` 特性用于支持 ext4 文件系统。可用的还有 `ext4_rs | another_ext4` 。

*fat32 文件系统的 disk.img 可直接挂载到开发机器环境上写入文件，在重新 make 后内容可用； ext4 文件系统镜像添加文件需先保存至 `testcases/<arch>_<target>_<lib>` ，然后重新执行 `build_img.sh`*
