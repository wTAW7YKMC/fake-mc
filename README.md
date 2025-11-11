# 沙盒游戏 (Sandbox Game)

这是一个类似Minecraft的简单沙盒游戏，使用HTML5 Canvas和JavaScript构建。

## 功能特性

- 随机生成的世界地图，包含草地、泥土、石头、树木和水池
- 玩家可以通过WASD键或方向键自由移动
- 鼠标左键挖掘方块，右键放置方块
- 物品栏系统，可以收集和放置不同类型的方块
- 数字键1-4切换不同的方块类型
- 玩家动画效果和物理移动系统
- 挖掘进度条和粒子效果
- 动态背景和光照效果
- 背景音乐和音效

## 如何运行游戏

### 方法1：使用Python启动本地服务器（推荐）
1. 确保您已安装Python 3.x
2. 双击项目根目录下的`start_server.bat`文件
3. 或者在命令行中运行以下命令：
   ```bash
   python -m http.server 8000
   ```
4. 在浏览器中访问 http://localhost:8000

### 方法2：使用VS Code Live Server扩展
1. 在VS Code中打开项目文件夹
2. 右键点击`index.html`文件
3. 选择"Open with Live Server"

### 方法3：使用其他本地服务器工具
您可以使用XAMPP、WAMP或其他本地服务器工具来运行游戏。

## 如何游玩

1. 使用WASD键或方向键控制玩家移动
2. 鼠标左键点击方块进行挖掘（带有进度条）
3. 鼠标右键点击空位置放置方块
4. 使用数字键1-9在不同的方块类型之间切换
5. 享受改进的物理移动系统和视觉效果

## 技术实现

- HTML5 Canvas用于渲染游戏画面
- JavaScript实现游戏逻辑
- CSS用于界面样式
- Web Audio API用于音效和背景音乐
- 详细技术规格请参阅 [技术规格文档](TECHNICAL_SPECIFICATION.md)

## 浏览器兼容性

该项目在现代浏览器中运行良好，包括Chrome、Firefox、Safari和Edge。

## 许可证

本项目为开源项目，可用于学习和参考。