# 部署到GitHub Pages

按照以下步骤将你的沙盒游戏部署到GitHub Pages上，使其可以通过互联网访问：

## 步骤1：在GitHub上创建仓库

1. 登录到你的GitHub账户
2. 点击右上角的"+"号，选择"New repository"
3. 为仓库命名（例如：sandbox-game）
4. 选择设为公开（Public）
5. 不要初始化README、.gitignore或license
6. 点击"Create repository"

## 步骤2：推送代码到GitHub

创建仓库后，你会看到一个页面提供了几种推送现有仓库的方法。使用以下命令：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 步骤3：启用GitHub Pages

1. 在GitHub仓库页面，点击"Settings"选项卡
2. 向下滚动到"Pages"部分
3. 在"Source"下拉菜单中选择"main"分支
4. 点击"Save"按钮
5. 等待几分钟，GitHub Pages将会构建并部署你的网站

## 步骤4：访问你的游戏

部署完成后，你可以在以下URL访问你的游戏：
```
https://你的用户名.github.io/仓库名/
```

例如，如果你的用户名是"example"，仓库名是"sandbox-game"，那么访问地址将是：
```
https://example.github.io/sandbox-game/
```

## 注意事项

- 部署可能需要几分钟时间
- 如果你更新了代码，只需使用`git push`命令推送更改即可
- GitHub Pages是免费的静态网站托管服务