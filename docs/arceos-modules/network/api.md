# ArceOS 网络层接口

## sys_socket
创建一个新的套接字。首先，检查传入的域（domain）和套接字类型（s_type）。如果它们有效，则创建一个套接字并设置相应的标志（如非阻塞和关闭时执行）。然后，将套接字分配给当前进程的文件描述符表。

## sys_bind
将套接字绑定到指定的地址（addr）。如果套接字已经绑定成功，则返回绑定操作的结果。这里会使用 socket_address_from 将地址从内存中获取并绑定。

## sys_listen
使服务器套接字开始监听传入的连接请求。此操作主要针对服务端，允许该套接字接受连接。

## sys_accept4
接受一个连接请求，返回新的套接字描述符用于与客户端进行通信。如果套接字被连接，调用 socket.accept 完成连接接收并返回新的文件描述符。处理 flags 标志（例如非阻塞）。

## sys_connect
客户端套接字连接到指定地址。如果套接字未连接，调用 socket.connect 来连接到目标地址。

## sys_get_sock_name
获取套接字的本地地址。如果套接字有效且绑定成功，则返回地址信息。

## sys_getpeername
获取已连接套接字的远程地址。如果套接字处于连接状态，则返回与该套接字相连接的远程主机的地址。

## sys_sendto
向指定的目标地址发送数据。如果套接字未绑定，sendto 会自动绑定套接字。此操作向指定地址发送数据，并处理各种错误情况（如被中断、需要重试等）。

## sys_recvfrom
从套接字接收数据。如果接收成功，返回接收到的数据和发送方的地址。此操作也会处理常见的错误（如套接字未连接、连接重置等）。

## sys_sendmsg
发送一个消息，其中包括数据和地址。消息通过 sendto 发送，处理消息头的 iovec。

## sys_set_sock_opt
设置套接字的选项，如 IP 层、套接字层、TCP 层等。通过 setsockopt 设置套接字的一些配置选项。

## sys_get_sock_opt
获取套接字的配置选项（如 SO_RCVBUF、SO_RCVBUF）。通过 getsockopt 获取套接字配置。

## sys_shutdown
关闭套接字的读取、写入或双向功能（SHUT_RD、SHUT_WR、SHUT_RDWR）。根据 how 参数的不同，执行相应的关闭操作。

## sys_socketpair
创建一对 UNIX 域套接字（AF_UNIX）。通过 make_socketpair 创建一对可以在进程间进行通信的套接字，并返回它们的文件描述符。