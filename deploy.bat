@echo off
echo 正在部署沙盒游戏到GitHub Pages...

REM 设置你的GitHub用户名和仓库名
set USERNAME=wTAW7YKMC
set REPONAME=sandbox-game
echo 请确保你已经按照DEPLOYMENT.md中的说明在GitHub上创建了仓库

REM 添加远程仓库
git remote add origin https://github.com/%USERNAME%/%REPONAME%.git

REM 设置主分支
git branch -M main

REM 推送代码到GitHub
git push -u origin main

echo.
echo 推送完成！现在请按照以下步骤启用GitHub Pages：
echo 1. 访问 https://github.com/%USERNAME%/%REPONAME%/settings
echo 2. 向下滚动到"Pages"部分
echo 3. 在"Source"下拉菜单中选择"main"分支
echo 4. 点击"Save"按钮
echo 5. 等待几分钟，你的游戏将在 https://%USERNAME%.github.io/%REPONAME%/ 上线

pause