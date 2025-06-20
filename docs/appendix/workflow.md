# 理解 starry-next 工作流
## starry-next 工作流概述
starry-next 工作流目录结构如下：
```bash
.github/workflows/
├── actions/setup-testcases/
│   └── action.yml # 用于 ci.yml 中下载 oscomp 的测例
├── ci.yml  # 持续集成
└── doc.yml # 生成文档
```

- 文件目录只是为了组织文件、方便管理, GitHub 不会根据文件名、目录顺序决定哪个先执行
- 决定工作流是否执行的唯一标准 ***on: 关键字***, 它决定了工作流执行的时机

在 starry-next 的工作流中, 只有 `ci.yml` 和 `doc.yml` 拥有 ***on: 关键字***, 且均为
```yml
on: [push, pull_request] #在提交推送或者合并请求时触发
```
`action.yml` 并没有 ***on: 关键字***, 它只是作为一个模块供 `ci.yml` 使用。
当提交推送或者合并请求时, `ci.yml` 和 `doc.yml` 这两个工作流会同时开始执行(可以在 Actions 中找到这两个工作流), 不会等待彼此。


!!! info "如果想要两个工作流有顺序, 可以在 `doc.yml` 中这样写："
    ```yml
    on:
      workflow_run:
        workflows: ["CI"] #"CI"为 “ci.yml” 中的 name 关键字
        types:
          - completed     #等待工作流 “ci.yml” 执行完毕之后再触发
    ```

!!! info "基于 GitHub Actions 工作流语法"
    具体语法可以参见 [官方文档 Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)。 为了便于读者检索，这里列出了 starry-next 的工作流中用到的关键字, 

    | 关键字                 | 作用                 | 说明                                                 |
    | ------------------- | ------------------ | -------------------------------------------------- |
    | `name`              | 定义工作流、job、step 的名称 | 用于显示名称，方便识别                                        |
    | `on`                | 触发条件               | 定义 workflow 何时被触发（如 push、pull\_request、schedule 等） |
    | `env`               | 定义环境变量             | 可以设置全局、局部或单步环境变量                                   |
    | `jobs`              | 定义任务组              | 每个 job 包含一组 step，可以并行或依赖执行                         |
    | `runs-on`           | 指定运行环境（虚拟机）        | 如：`ubuntu-latest`，`windows-latest`                 |
    | `strategy`          | 配置并行矩阵测试           | 用于组合不同版本、平台、架构等参数矩阵                                |
    | `matrix`            | 定义参数矩阵             | 自动组合多个参数值，生成多组 job                                 |
    | `fail-fast`         | 矩阵策略专用关键字        | 当矩阵中的某个 job 失败时，是否立刻停止执行其他 job                                 |
    | `steps`             | 定义任务步骤             | 每个 job 下的具体执行步骤                                    |
    | `uses`              | 使用已有 action        | 可以引用官方、第三方或本地自定义 action                            |
    | `run`               | 执行命令行脚本            | 直接执行 shell 命令                                      |
    | `with`              | 向 action 传递输入参数    | 用于配置 action 的参数                                    |
    | `if`                | 条件执行               | 控制是否执行某个 job 或 step                                |
    | `continue-on-error` | 出错是否继续             | 出错后是否允许继续执行后续步骤                                    |




## starry-next 中的持续集成 (CI)
持续集成(Continuous Integration, CI) 是一种软件开发实践, 指的是：
> 开发人员频繁地（通常是每天多次）将代码集成到主干（主分支）, 并通过自动化构建、测试流程来及时发现集成错误。

其核心目标主要有：

- 快速发现错误
- 保持代码质量
- 自动化测试和验证
- 提高团队协作效率

在 `ci.yml` 中一共有 4 个 jobs, 它们并行工作, 没有顺序 (设置顺序需要使用 need 关键字)
针对特定日期的 Rust 工具链 (nightly-2025-05-20), 以及多种架构 (x86_64, riscv64, aarch64, loongarch64) 展开测试，具体说明见下表：

| Job 名称      | 主要任务                                                                                            | 其他说明                                             |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| clippy      | 1. 代码格式检查：`cargo fmt --all -- --check`  <br> 2. Clippy 静态分析：`make clippy ARCH=${{ matrix.arch }}` | 不加载应用程序。<br>额外测试最新 Rust nightly，追踪 Rust 版本兼容性问题。 |
| build       | 构建项目：`make ARCH=${{ matrix.arch }} build`                                                       | 不加载应用程序。<br>主要用于验证各架构的构建是否成功。                    |
| test-musl   | 测试：`make test ARCH=${{ matrix.arch }}`                                                          | 加载两个应用程序：`nimbos` 和 `libc` （加载哪些应用是由 [`app_test.sh`](https://github.com/oscomp/starry-next/blob/main/scripts/app_test.sh) 所决定的）。<br>基于 musl 库环境进行测试。  |
| test-oscomp | 测试下载的 oscomp 镜像中的应用程序                                                                           | 加载镜像中的测例应用程序。<br>需要从 `image-release-url` 下载测试镜像。 |

!!! info "测例说明"

    - libc: 测试标准 C 库实现的正确性，涵盖各种 libc 接口
    - nimbos: 是一个轻量级的测试用操作系统（test OS），在很多嵌入式、操作系统内核或者裸机项目中，它被用于验证操作系统的基本功能，例如：进程调度、系统调用、内存管理、用户态程序加载等。这个测例也包含了 rust 和 c 两种语言的版本，且支持多种架构。
    - oscomp: 包含了全国大学生计算机系统能力大赛内核实现赛中的测例，具体可以参考 [testsuits-for-oskernel](https://github.com/Azure-stars/testsuits-for-oskernel)。


在 `doc.yml` 中只有一个 job

- doc: 使用 Rust 的官方文档生成命令生成文档。

通过上面的工作流可以保证每一次推送或者合并请求在涵盖多种架构和多种目标的情况下, 都是合乎语法规范、能够正确编译和构建, 而且能够通过所有测例的。随着项目的规模不断扩大, 也需要更多的测例来涵盖新增的特性和功能。

## 如何在本地测试工作流的内容
### 使用 act 进行本地工作流测试
`act` 是一个可以在本地运行 GitHub Actions 的命令行工具，适合大多数场景。首先我们需要使用官方安装脚本来安装 `act`
```bash
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | bash
sudo mv ./bin/act /usr/local/bin/act
```
具体配置和使用方法见 [act 官方文档](https://github.com/nektos/act/)

### 手动测试（默认已经完成环境配置）
首先需要配置 rust 工具链
```bash
cp .arceos/rust-toolchain.toml ./ #将工具链和 ArceOS 保持一致
```
也可以将 nightly 修改为特定版本。之后对于 `ci.yml` 中的 4 个 jobs 分别手动运行下面的脚本：

- clippy:
  ```bash
  cargo fmt --all -- --check

  ARCHES=("x86_64" "riscv64" "aarch64" "loongarch64")

  for ARCH in "${ARCHES[@]}"; doy
      make clippy ARCH=${ARCH}
  done
  ```

- build:
  ```bash
  ARCHES=("x86_64" "riscv64" "aarch64" "loongarch64")

  for ARCH in "${ARCHES[@]}"; do
      make clean
      make build ARCH=${ARCH}
  done
  ```

- test-musl:
  ```bash
  ARCHES=("x86_64" "riscv64" "aarch64" "loongarch64")

  for ARCH in "${ARCHES[@]}"; do
      echo "Running tests for ARCH=${ARCH}..."
      make test ARCH=${ARCH}
  done
  ```
- test-oscomp
  ```bash
  ARCHES=("x86_64" "riscv64" "aarch64" "loongarch64")

  for ARCH in "${ARCHES[@]}"; do
      # 下载镜像
      wget "https://github.com/Azure-stars/testsuits-for-oskernel/releases/download/v0.2/sdcard-${ARCH}.img.gz"

      # 解压镜像
      gunzip -f "sdcard-${ARCH}.img.gz"

      # 编译测试，支持 musl 和 glibc
      for LIBC in musl glibc; do
          make oscomp_test ARCH=${ARCH} LIBC=${LIBC}
      done
  done
  ```