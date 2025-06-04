# ArceOS 网络层实现

## smoltcp 支持

| 功能            | 支持情况 | 备注 |
|-----------------|----------|------|
| TCP/UDP 协议    | ✅ 支持  | 完整 socket 生命周期管理 |
| DNS 查询        | ✅ 支持  | 使用 smoltcp 实验性 socket |
| IPv4 协议       | ✅ 支持  | 默认配置，广泛使用 |
| IPv6 协议       | ⚠️ 部分支持 | 有部分配置，但无 socket 使用示例 |
| Loopback 支持   | ✅ 支持  | 支持 127.0.0.1、组播加入等 |
| 多接口/多设备支持 | ⚠️ 限制中 | 仅有 `ETH0`，但代码结构允许扩展 |
| 自定义驱动支持  | ✅ 支持  | 通过 `AxNetDevice` 适配 smoltcp |
| 多线程安全       | ✅ 支持  | 使用 `Mutex + RefCell` 组合 |

## lwip 支持

| 功能项         | 支持 | 来源 / 说明 |
|----------------|------|--------------|
| TCP socket     | ✅   | 模块 `tcp` 中暴露 `TcpSocket`，推测基于 smoltcp TCP socket 封装 |
| UDP socket     | ✅   | 同上 |
| DNS 查询       | ✅   | `resolve_socket_addr` 推测封装 DNS socket |
| 网络驱动       | ✅   | `driver::init()` 非常可能初始化 smoltcp interface 和 device |
| 地址封装       | ✅   | `IpAddr`, `SocketAddr` 表示做了跨平台处理 |
| 多线程安全     | ✅   | 使用 `Mutex<()>` 实现 lwIP 风格网络临界区保护 |
| C语言绑定      | ✅   | 有 `cbindings` 模块表明目标可能包括跨语言支持或内核接口 |
| 网络栈抽象层   | ✅   | 这部分代码可能是对 smoltcp 进行高层封装并提供一致接口 |

