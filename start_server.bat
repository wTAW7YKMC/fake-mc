@echo off
echo 正在启动Fake Minecraft游戏服务器...
echo 请确保您已安装Python 3.x
echo.
echo 如果服务器启动失败，请尝试以下方法：
echo 1. 安装Python 3.x并确保它已添加到PATH环境变量
echo 2. 使用VS Code Live Server扩展打开index.html
echo 3. 使用其他本地服务器工具（如XAMPP）启动服务器
echo.
pause
python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo 服务器启动失败，请尝试使用其他方法启动
    echo.
    pause
)