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

这里列出了 starry-next 的工作流中用到的关键字, 便于读者检索

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
针对特定日期的 Rust 工具链 (nightly-2025-05-20), 以及多种架构 (x86_64, riscv64, aarch64, loongarch64)

- clippy: 进行代码格式检查 `cargo fmt --all -- --check` 和 Clippy 静态代码分析 `make clippy ARCH=${{ matrix.arch }}` (还对最新的 nightly 版本进行测试, 以便追踪由于版本更新带来的 bug)
- build: 构建项目 `make ARCH=${{ matrix.arch }} build`
- test-musl: 运行 musl 库的测试 `make test ARCH=${{ matrix.arch }}`
- test-oscomp: 下载 image-release-url 中的 oscomp 测例镜像, 然后进行测试。

在 `doc.yml` 中只有一个 job

- doc: 使用 Rust 的官方文档生成命令生成文档。

通过上面的工作流可以保证每一次推送或者合并请求在涵盖多种架构和多种目标的情况下, 都是合乎语法规范、能够正确编译和构建, 而且能够通过所有测例的。随着项目的规模不断扩大, 也需要更多的测例来涵盖新增的特性和功能。