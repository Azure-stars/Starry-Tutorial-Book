# 如何使用 GitHub 贡献代码

1. **Fork 仓库：** 在 GitHub 上 fork 想要贡献的仓库到你自己的 GitHub 账户下。

2. **克隆仓库：** 将 fork 后的仓库克隆到本地：

   ```bash
   git clone <你的 fork 仓库 URL>
   cd <仓库名称>
   ```

3. **创建分支：** 创建一个新的分支并切换到该分支，可以使用命名约定，比如修复某个问题或增加新特性：

   ```bash
   git checkout -b <分支名称>
   ```

4. **修改内容：** 在本地修改代码，确保代码符合贡献仓库的贡献规范。

5. **提交变更：** 将修改的内容提交到你的 fork 仓库的新分支上：

   ```bash
   git add .
   git commit -m "描述提交的修改内容"
   git push origin <分支名称>
   ```

6. **创建 Pull Request (PR)：** 在 GitHub 页面上创建一个 PR，请求将你的修改合并到原始仓库的主分支。

7. **等待审核和合并：** 等待对方仓库的维护者审核你的 PR，并将其合并到他们的主分支。

8. **删除本地分支：** 在你的本地仓库删除已经合并的分支：

   ```bash
   git branch -d <分支名称>
   ```

9. **同步 fork 仓库：** 保持你的 fork 仓库与原始仓库同步，以便将来的贡献基于最新代码：

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main
   ```

在这个过程中，`upstream` 是原始仓库的远程引用，`origin` 是你 fork 后的远程仓库引用。这样做可以确保你在工作时始终基于最新的代码进行开发，同时也能够有效地管理你的分支和贡献。
