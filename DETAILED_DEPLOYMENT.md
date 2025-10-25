# 详细部署指南

本文档将指导你如何将沙盒游戏部署到GitHub Pages，使其可以通过互联网访问。

## 方法一：使用GitHub CLI（推荐）

### 1. 安装GitHub CLI

访问 https://cli.github.com/ 下载并安装GitHub CLI。

### 2. 登录到GitHub CLI

打开终端并运行：
```bash
gh auth login
```

按照提示登录到你的GitHub账户。

### 3. 创建仓库并推送代码

在项目根目录下运行：
```bash
gh repo create sandbox-game --public --push --source .
```

这将创建一个名为"sandbox-game"的公共仓库，并推送所有代码。

### 4. 启用GitHub Pages

运行以下命令启用GitHub Pages：
```bash
gh repo edit --enable-pages
```

或者手动启用：
1. 访问仓库的Settings页面
2. 向下滚动到"Pages"部分
3. 在"Source"下拉菜单中选择"main"分支
4. 点击"Save"按钮

## 方法二：使用传统Git命令

### 1. 在GitHub上创建仓库

1. 登录到你的GitHub账户
2. 点击右上角的"+"号，选择"New repository"
3. 为仓库命名（例如：sandbox-game）
4. 选择设为公开（Public）
5. 不要初始化README、.gitignore或license
6. 点击"Create repository"

### 2. 推送代码到GitHub

创建仓库后，使用以下命令推送代码：

```bash
# 添加远程仓库（替换your-username和your-repo-name为实际值）
git remote add origin https://github.com/your-username/your-repo-name.git

# 设置主分支
git branch -M main

# 推送代码到GitHub
git push -u origin main
```

### 3. 启用GitHub Pages

1. 在GitHub仓库页面，点击"Settings"选项卡
2. 向下滚动到"Pages"部分
3. 在"Source"下拉菜单中选择"main"分支
4. 点击"Save"按钮
5. 等待几分钟，GitHub Pages将会构建并部署你的网站

## 方法三：使用提供的批处理文件

Windows用户可以使用项目中的`deploy.bat`文件：

1. 编辑`deploy.bat`文件，将`your-github-username`和`your-repo-name`替换为你的实际用户名和仓库名
2. 双击运行`deploy.bat`文件
3. 按照屏幕上的指示完成部署

## 访问你的游戏

部署完成后，你可以在以下URL访问你的游戏：
```
https://你的用户名.github.io/仓库名/
```

例如，如果你的用户名是"example"，仓库名是"sandbox-game"，那么访问地址将是：
```
https://example.github.io/sandbox-game/
```

## 更新部署

如果你对游戏进行了修改并希望更新在线版本，只需执行以下命令：

```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "Update game"

# 推送到GitHub
git push
```

GitHub Pages会自动检测到新的提交并重新部署网站。

## 故障排除

### 1. 推送失败

如果推送时遇到权限问题，请确保：
- 你已正确登录到GitHub
- 仓库名称正确
- 你有该仓库的写入权限

### 2. 页面未显示

如果部署后页面未显示：
- 确保GitHub Pages已正确启用
- 检查仓库是否包含`index.html`文件
- 等待几分钟让GitHub Pages完成构建过程

### 3. 游戏功能异常

如果游戏在GitHub Pages上运行异常：
- 检查浏览器控制台是否有错误信息
- 确保所有文件都已正确推送
- 验证文件路径是否正确

## 其他部署选项

除了GitHub Pages，你还可以考虑以下部署选项：

1. **Netlify** - 提供免费的静态网站托管，支持自动部署
2. **Vercel** - 现代化的前端部署平台，支持一键部署
3. **Firebase Hosting** - Google提供的快速、安全的托管服务

这些平台通常提供更高级的功能，如自定义域名、SSL证书和全球CDN。