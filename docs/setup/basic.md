# Starry 运行基本应用

## 基本应用结构

基本应用位于项目的 `apps`目录下，每个应用都是一个文件夹，文件夹名即为应用名。每个应用文件夹下应当包含至少以下内容：

- `Makefile`：编译应用的 Makefile 文件，需要提供 `build`和 `clean`两个目标，分别用于编译和清理应用。
- `testcase_list`：应用的测试用例列表，每行一个测试用例名，其中测例名对应的文件应当在执行 `make build`后生成。

项目默认提供了 `junior`，`libc`和 `nimbos`三个基本应用，分别对应了 `apps/junior`，`apps/libc`和 `apps/nimbos`三个文件夹。

## 运行基本应用

运行基本应用前需要先获取依赖仓库：

```bash
./scripts/get_deps.sh
```

然后执行以下命令，来在特定平台上测试指定的应用：

```bash
# 为指定平台编译指定应用
make ARCH={arch} AX_TESTCASE={app_name} user_apps
# 切换到指定平台时需要重新生成配置
make ARCH={arch} defconfig
# 编译内核并运行指定应用
make ARCH={arch} LOG={log} AX_TESTCASE={app_name} BLK=y NET=y ACCEL=n run
```

其中：

- `{arch}`为平台名，取值可以是 `riscv64`, `x86_64`, `aarch64`, `loongarch64`之一；
- `{app_name}`为应用名，应该为前述 `apps`目录下的应用文件夹名，例如 `junior`, `libc`, `nimbos`等。
- `{log}`为日志等级，取值可以是 `off`, `error`, `warn`, `info`, `debug`, `trace`之一。

特别地，对于 `libc`应用，运行时应当启用 `fp_simd`特性：

```bash
make ARCH={arch} AX_TESTCASE=libc BLK=y NET=y FEATURES=fp_simd ACCEL=n run
```

如果只想编译**内核**而不运行，可以将上述的 `run` 命令替换为 `build`，例如：

```bash
make ARCH={arch} LOG={log} AX_TESTCASE={app_name} BLK=y NET=y ACCEL=n build
```

## 编写自己的应用

### 添加简单的c程序

`libc`这个应用提供了编译单个源文件的c程序的功能，如果你想添加一个简单的c程序，可以直接在`apps/libc/c`目录下新建一个c文件，然后在`testcase_list`文件中添加该文件的名字即可。

### 添加预编译的二进制程序

`bin`这个应用提供了添加预编译的二进制程序的功能，如果你想添加一个预编译的二进制程序，可以直接在`apps/bin/{arch}`目录下添加你的二进制程序，然后在`testcase_list`文件中添加该文件的名字即可。

### 完全自定义应用

上面我们已经介绍了两种简单的添加测试用例的方法，如果你希望更进一步了解其中的原理，或者有添加复杂应用的需求，可以参考如下指引：

1. 在 `apps`目录下新建一个文件夹，文件夹名即为应用名，例如 `myapp`:

   ```bash
   mkdir apps/myapp && cd apps/myapp
   ```

2. 在该文件夹下新建 `Makefile`文件，需要包括 `build`和 `clean`两个目标，内容如下：

   ```makefile
   all: build

   build:
       @echo "Building myapp with arch $(ARCH)"

   clean:
       @echo "Cleaning myapp"
   ```

3. 在该文件夹下新建 `testcase_list`文件，列出所有测试用例的名字，每行一个，例如：

   ```text
   hello
   ```

4. 编写应用程序，例如在该文件夹下新建 `hello.c`文件，内容如下：

   ```c
   #include "unistd.h"

   int main()
   {
       char msg[] = "Hello, World!\n";
       write(1, msg, sizeof(msg));
       return 0;
   }
   ```

5. 在 `Makefile`中添加编译 `hello`的目标，例如：

   ```makefile
    CC = $(ARCH)-linux-musl-gcc
    CFLAGS = -static

    TARGET_DIR = build/$(ARCH)
    TARGET = $(TARGET_DIR)/hello

    all: build

    prepare:
        mkdir -p $(TARGET_DIR)

    build: prepare $(TARGET)

    $(TARGET): hello.c
        $(CC) $(CFLAGS) -o $@ $^

    clean:
        rm -f $(TARGET)

    .PHONY: all prepare build clean
   ```

   关于Makefile的几点提示：

   - 编译用户程序时，会指定`ARCH`变量，需要以此考虑交叉编译工具链的选择；
   - 需要提供`build`目标，编译生成的文件需要放在`build/$(ARCH)`目录下；
   - 需要提供`clean`目标，用于清理编译生成的文件。
   - 如果你希望拷贝上面的Makefile示例，需要注意Makefile中的缩进是用制表符而不是空格。

6. 尝试编译和运行该应用，在**项目根目录**下执行：

   ```bash
   make ARCH=x86_64 AX_TESTCASE=myapp user_apps
   make ARCH=x86_64 defconfig
   make ARCH=x86_64 LOG=error AX_TESTCASE=myapp BLK=y NET=y ACCEL=n run
   ```
