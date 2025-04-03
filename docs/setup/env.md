# 实验环境配置

## 在 Docker 下运行

若选择在 Docker 环境下开发，请执行如下指令

```bash
git clone git@github.com:oscomp/starry-next.git
cd starry-next

./scripts/get_deps.sh
cd .arceos
docker build -t starry -f ./Dockerfile .
cd ..

# 在项目根目录下构建容器
docker run -it -v $(pwd):/starry -w /starry starry bash
```

!!! note
    若 Docker pull 或 Docker build 出现超时等问题，可能是因为缺乏代理上网的配置。可以参考如下资料：
    
    ```markdown
    Docker pull
        1. 使用代理：https://docs.docker.com/reference/cli/docker/image/pull/#proxy-configuration
        2. 换用可用国内源（自行查找）
    Docker build: 使用代理 https://docs.docker.com/engine/cli/proxy/#build-with-a-proxy-configuration
    Docker run: 也可以使用代理选项，相关操作与 build 类似，可以自行查阅资料
    ```

Dockerfile 内容请参考 [ArceOS-Dockerfile](https://github.com/oscomp/arceos/blob/main/Dockerfile) 。


## 本地环境配置

### 配置 Rust 开发环境

首先安装 Rust 版本管理器 rustup 和 Rust 包管理器 cargo，这里我们用官方的安装脚本来安装：

```bash
curl https://sh.rustup.rs -sSf | sh
```

如果通过官方的脚本下载失败了，可以在浏览器的地址栏中输入 [https://sh.rustup.rs](https://sh.rustup.rs/) 来下载脚本，在本地运行即可。


可通过如下命令安装 rustc 的 nightly 版本。

```bash
rustup install nightly
```

再次确认一下我们安装了正确的 rustc 版本（以下为一个示例）：

```bash
rustc --version
rustc 1.83.0 (90b35a623 2024-11-26)
```

### 安装必要依赖

```bash
echo "deb http://apt.llvm.org/jammy/ llvm-toolchain-jammy-19 main" | sudo tee -a /etc/apt/sources.list
wget -qO- https://apt.llvm.org/llvm-snapshot.gpg.key | sudo tee /etc/apt/trusted.gpg.d/apt.llvm.org.asc
sudo apt-get update
sudo apt-get install -y --no-install-recommends libclang-19-dev wget make python3 \
        xz-utils python3-venv ninja-build bzip2 meson cmake dosfstools build-essential \
        pkg-config libglib2.0-dev git libslirp-dev  \
sudo rm -rf /var/lib/apt/lists/*
```

### 安装QEMU

```bash
# 安装与qemu相关的软件包
wget https://download.qemu.org/qemu-9.2.1.tar.xz
tar xf qemu-9.2.1.tar.xz \
    && cd qemu-9.2.1 \
    && ./configure --prefix=/qemu-bin-9.2.1 \
        --target-list=loongarch64-softmmu,riscv64-softmmu,aarch64-softmmu,x86_64-softmmu,loongarch64-linux-user,riscv64-linux-user,aarch64-linux-user,x86_64-linux-user \
        --enable-gcov --enable-debug --enable-slirp \
    && make -j$(nproc) \
    && make install
# export PATH for qemu
# export PATH="/qemu-bin-9.2.1/bin:$PATH"
# 测试是否正确安装
qemu-system-x86_64 --version

rm -rf qemu-9.2.1 qemu-9.2.1.tar.xz
```

### 安装 musl cross 工具链

```bash
wget https://musl.cc/aarch64-linux-musl-cross.tgz
wget https://musl.cc/riscv64-linux-musl-cross.tgz
wget https://musl.cc/x86_64-linux-musl-cross.tgz
wget https://github.com/LoongsonLab/oscomp-toolchains-for-oskernel/releases/download/loongarch64-linux-musl-cross-gcc-13.2.0/loongarch64-linux-musl-cross.tgz
# install
tar zxf aarch64-linux-musl-cross.tgz
tar zxf riscv64-linux-musl-cross.tgz
tar zxf x86_64-linux-musl-cross.tgz
tar zxf loongarch64-linux-musl-cross.tgz

rm -f *.tgz

# export PATH for cross compile toolchain
# export PATH="/x86_64-linux-musl-cross/bin:/aarch64-linux-musl-cross/bin:/riscv64-linux-musl-cross/bin:/loongarch64-linux-musl-cross/bin:$PATH"
```

### 配置仓库内环境

```bash
# 若还未拉取 Starry Next 仓库
git clone git@github.com:oscomp/starry-next.git
cd starry-next

# 拉取基座仓库 ArceOS
./scripts/get_deps.sh

# 配置 Rust 环境
cd .arceos
rustup target add x86_64-unknown-linux-musl
rustup target add aarch64-unknown-linux-musl
rustup target add riscv64gc-unknown-linux-musl
rustup target add x86_64-unknown-none  
rustup target add riscv64gc-unknown-none-elf
rustup target add aarch64-unknown-none
rustup target add aarch64-unknown-none-softfloat
rustup component add llvm-tools-preview
cargo install cargo-binutils axconfig-gen
cd ..
```
