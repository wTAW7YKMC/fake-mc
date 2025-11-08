// 游戏常量定义
const BLOCK_SIZE = 32;
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 30;

// 方块类型常量
const BLOCK_TYPES = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  WATER: 6,
  SAND: 7,
  COAL: 8,
  IRON: 9,
  DIAMOND: 10,
  REDSTONE: 11,
  CRAFTING_TABLE: 12,
  FURNACE: 13,
  CHEST: 14,
  TORCH: 15,
  LADDER: 16,
  BACKGROUND_DECORATION: 17
};

Page({
  data: {
    // 游戏状态
    gameState: {
      world: [],
      player: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        direction: 1,
        animationFrame: 0,
        animationTimer: 0
      },
      camera: {
        x: 0,
        y: 0
      },
      keys: {},
      inventory: [
        { type: 1, count: 10 },  // 草地
        { type: 2, count: 10 },  // 泥土
        { type: 3, count: 10 },  // 石头
        { type: 4, count: 5 },   // 木头
        { type: 5, count: 5 },   // 叶子
        { type: 6, count: 3 },   // 水
        { type: 7, count: 5 },   // 沙子
        { type: 8, count: 2 },   // 煤炭
        { type: 9, count: 1 }    // 铁矿
      ],
      selectedSlot: 0
    },
    inventory: [
      { type: 1, count: 10 },  // 草地
      { type: 2, count: 10 },  // 泥土
      { type: 3, count: 10 },  // 石头
      { type: 4, count: 5 },   // 木头
      { type: 5, count: 5 },   // 叶子
      { type: 6, count: 3 },   // 水
      { type: 7, count: 5 },   // 沙子
      { type: 8, count: 2 },   // 煤炭
      { type: 9, count: 1 }    // 铁矿
    ],
    selectedSlot: 0
  },

  // 游戏循环控制变量
  gameLoopId: null,

  onLoad() {
    // 页面加载时执行
  },

  onShow() {
    // 页面显示时执行
    this.initGame();
  },

  onHide() {
    // 页面隐藏时执行
    // 停止游戏循环
    if (this.gameLoopId) {
      clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    }
  },

  onUnload() {
    // 页面卸载时执行
    // 停止游戏循环
    if (this.gameLoopId) {
      clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    }
  },

  initGame() {
    // 初始化游戏
    const { gameState } = this.data;
    
    // 初始化世界
    this.generateWorld();
    
    // 初始化玩家
    gameState.player = {
      x: Math.floor(WORLD_WIDTH / 2),
      y: Math.floor(WORLD_HEIGHT / 2),
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      direction: 1,
      animationFrame: 0,
      animationTimer: 0
    };
    
    // 初始化相机
    gameState.camera = {
      x: 0,
      y: 0
    };
    
    // 初始化选中的物品栏槽位
    gameState.selectedSlot = 0;
    
    this.setData({
      gameState,
      selectedSlot: 0
    });
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 启动游戏循环
    this.gameLoop();
  },

  // 生成随机世界
  generateWorld() {
    const { gameState } = this.data;
    gameState.world = [];
    
    // 初始化为空气
    for (let x = 0; x < WORLD_WIDTH; x++) {
      gameState.world[x] = [];
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        if (y > WORLD_HEIGHT - 5) {
          // 底层生成石头
          gameState.world[x][y] = BLOCK_TYPES.STONE;
        } else if (y > WORLD_HEIGHT - 8) {
          // 中层生成泥土
          gameState.world[x][y] = BLOCK_TYPES.DIRT;
        } else if (y > WORLD_HEIGHT - 10) {
          // 表层生成草方块
          gameState.world[x][y] = BLOCK_TYPES.GRASS;
        } else if (y > WORLD_HEIGHT - 20 && Math.random() < 0.05) {
          // 在地下生成矿物
          const rand = Math.random();
          if (rand < 0.7) {
            gameState.world[x][y] = BLOCK_TYPES.COAL;
          } else if (rand < 0.9) {
            gameState.world[x][y] = BLOCK_TYPES.IRON;
          } else {
            gameState.world[x][y] = BLOCK_TYPES.DIAMOND;
          }
        } else if (y > WORLD_HEIGHT - 25 && Math.random() < 0.02) {
          // 生成红石
          gameState.world[x][y] = BLOCK_TYPES.REDSTONE;
        } else {
          // 其他位置为空气
          gameState.world[x][y] = BLOCK_TYPES.AIR;
        }
      }
    }
    
    // 生成一些树木
    for (let i = 0; i < 5; i++) {
      const treeX = Math.floor(Math.random() * (WORLD_WIDTH - 10)) + 5;
      const treeHeight = Math.floor(Math.random() * 3) + 4;
      const treeY = WORLD_HEIGHT - 10 - treeHeight;
      
      // 树干
      for (let j = 0; j < treeHeight; j++) {
        if (treeY + j >= 0 && treeY + j < WORLD_HEIGHT) {
          gameState.world[treeX][treeY + j] = BLOCK_TYPES.WOOD;
        }
      }
      
      // 树叶
      for (let x = treeX - 2; x <= treeX + 2; x++) {
        for (let y = treeY - 2; y <= treeY; y++) {
          if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            if ((x !== treeX || y < treeY) && Math.random() < 0.7) {
              gameState.world[x][y] = BLOCK_TYPES.LEAVES;
            }
          }
        }
      }
    }
    
    // 生成沙地
    for (let x = 10; x < 20; x++) {
      for (let y = WORLD_HEIGHT - 8; y < WORLD_HEIGHT - 5; y++) {
        if (Math.random() < 0.7) {
          gameState.world[x][y] = BLOCK_TYPES.SAND;
        }
      }
    }
    
    // 在世界中随机添加背景装饰
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * WORLD_WIDTH);
      const y = Math.floor(Math.random() * (WORLD_HEIGHT / 2)); // 只在上半部分生成
      
      // 确保装饰不会覆盖重要方块
      if (gameState.world[x][y] === BLOCK_TYPES.AIR) {
        gameState.world[x][y] = BLOCK_TYPES.BACKGROUND_DECORATION;
      }
    }
    
    this.setData({
      gameState
    });
  },

  // 设置事件监听器
  setupEventListeners() {
    // 在小程序中，我们使用触摸事件而不是鼠标事件
    // 触摸事件已在WXML中绑定
  },

  // 触摸开始事件
  onTouchStart(e) {
    const { gameState } = this.data;
    const player = gameState.player;
    
    // 获取触摸点坐标
    const touch = e.touches[0];
    const canvas = wx.createSelectorQuery().select('#gameCanvas');
    
    // 计算相对于画布的坐标
    const rect = canvas.boundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // 判断触摸的是左侧还是右侧
    if (x < 150) {
      // 左侧 - 向左移动
      player.vx = -3;
      player.direction = -1;
    } else if (x > rect.width - 150) {
      // 右侧 - 向右移动
      player.vx = 3;
      player.direction = 1;
    } else {
      // 中间 - 跳跃
      if (player.vy === 0) { // 只有在地面上才能跳跃
        player.vy = -12;
      }
    }
    
    this.setData({
      gameState
    });
  },

  // 触摸移动事件
  onTouchMove(e) {
    // 处理触摸移动
  },

  // 挖掘方块
  digBlock(e) {
    const { gameState } = this.data;
    
    // 获取触摸点坐标
    const touch = e.touches[0];
    const canvas = wx.createSelectorQuery().select('#gameCanvas');
    
    // 计算相对于画布的坐标
    const rect = canvas.boundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // 转换为世界坐标
    const worldX = Math.floor((x + gameState.camera.x) / BLOCK_SIZE);
    const worldY = Math.floor((y + gameState.camera.y) / BLOCK_SIZE);
    
    // 检查坐标是否在世界范围内
    if (worldX >= 0 && worldX < WORLD_WIDTH && worldY >= 0 && worldY < WORLD_HEIGHT) {
      // 检查方块是否可以被挖掘
      const blockType = gameState.world[worldX][worldY];
      if (blockType !== BLOCK_TYPES.AIR && blockType !== BLOCK_TYPES.BACKGROUND_DECORATION) {
        // 将方块设置为空气
        gameState.world[worldX][worldY] = BLOCK_TYPES.AIR;
        
        // 添加到物品栏（如果物品栏中已经有这种方块，则增加数量）
        const inventoryIndex = gameState.inventory.findIndex(item => item.type === blockType);
        if (inventoryIndex !== -1) {
          gameState.inventory[inventoryIndex].count++;
        } else {
          // 如果物品栏中没有这种方块，则添加新的物品
          gameState.inventory.push({ type: blockType, count: 1 });
        }
        
        this.setData({
          gameState
        });
      }
    }
  },

  // 放置方块
  placeBlock(e) {
    const { gameState } = this.data;
    
    // 获取触摸点坐标
    const touch = e.touches[0];
    const canvas = wx.createSelectorQuery().select('#gameCanvas');
    
    // 计算相对于画布的坐标
    const rect = canvas.boundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // 转换为世界坐标
    const worldX = Math.floor((x + gameState.camera.x) / BLOCK_SIZE);
    const worldY = Math.floor((y + gameState.camera.y) / BLOCK_SIZE);
    
    // 检查坐标是否在世界范围内
    if (worldX >= 0 && worldX < WORLD_WIDTH && worldY >= 0 && worldY < WORLD_HEIGHT) {
      // 检查该位置是否为空气
      if (gameState.world[worldX][worldY] === BLOCK_TYPES.AIR) {
        // 获取选中的物品
        const selectedItem = gameState.inventory[gameState.selectedSlot];
        
        // 检查是否有选中的物品且数量大于0
        if (selectedItem && selectedItem.count > 0) {
          // 放置方块
          gameState.world[worldX][worldY] = selectedItem.type;
          
          // 减少物品数量
          selectedItem.count--;
          
          // 如果物品数量为0，则从物品栏中移除
          if (selectedItem.count === 0) {
            gameState.inventory.splice(gameState.selectedSlot, 1);
            
            // 如果移除了第一个物品，则选中第一个物品（如果有）
            if (gameState.selectedSlot === 0 && gameState.inventory.length > 0) {
              gameState.selectedSlot = 0;
            } else if (gameState.selectedSlot >= gameState.inventory.length) {
              // 如果移除了最后一个物品，则选中新的最后一个物品（如果有）
              gameState.selectedSlot = Math.max(0, gameState.inventory.length - 1);
            }
          }
          
          this.setData({
            gameState
          });
        }
      }
    }
  },

  // 触摸结束事件
  onTouchEnd(e) {
    const { gameState } = this.data;
    const player = gameState.player;
    
    // 停止水平移动
    player.vx = 0;
    
    this.setData({
      gameState
    });
  },

  // 移动函数
  move(direction) {
    const { gameState } = this.data;
    const player = gameState.player;
    
    if (direction === 'left') {
      player.vx = -3;
      player.direction = -1;
    } else if (direction === 'right') {
      player.vx = 3;
      player.direction = 1;
    }
    
    this.setData({
      gameState
    });
  },

  // 跳跃函数
  jump() {
    const { gameState } = this.data;
    const player = gameState.player;
    
    // 只有在地面上才能跳跃
    if (player.vy === 0) {
      player.vy = -12;
    }
    
    this.setData({
      gameState
    });
  },

  // 选择物品栏槽位
  selectSlot(e) {
    const index = e.currentTarget.dataset.index;
    const { gameState } = this.data;
    gameState.selectedSlot = index;
    
    this.setData({
      gameState,
      selectedSlot: index
    });
  },

  // 获取方块颜色
  getItemColor(type) {
    const defaultColors = {
      [BLOCK_TYPES.GRASS]: '#7CFC00',
      [BLOCK_TYPES.DIRT]: '#8B4513',
      [BLOCK_TYPES.STONE]: '#808080',
      [BLOCK_TYPES.WOOD]: '#8B4513',
      [BLOCK_TYPES.LEAVES]: '#228B22',
      [BLOCK_TYPES.WATER]: '#1E90FF',
      [BLOCK_TYPES.SAND]: '#F0E68C',
      [BLOCK_TYPES.COAL]: '#2C3E50',
      [BLOCK_TYPES.IRON]: '#7F8C8D',
      [BLOCK_TYPES.DIAMOND]: '#3498DB',
      [BLOCK_TYPES.REDSTONE]: '#E74C3C',
      [BLOCK_TYPES.CRAFTING_TABLE]: '#E67E22',
      [BLOCK_TYPES.FURNACE]: '#7F8C8D',
      [BLOCK_TYPES.CHEST]: '#8B4513',
      [BLOCK_TYPES.TORCH]: '#FF9800',
      [BLOCK_TYPES.LADDER]: '#654321',
      [BLOCK_TYPES.BACKGROUND_DECORATION]: '#27ae60'
    };
    return defaultColors[type] || '#FFFFFF';
  },

  // 游戏循环
  gameLoop() {
    // 更新游戏状态
    this.updateGame();
    
    // 渲染游戏画面
    this.render();
    
    // 继续游戏循环
    this.gameLoopId = setTimeout(() => {
      this.gameLoop();
    }, 1000 / 60); // 约60FPS
  },

  // 更新游戏状态
  updateGame() {
    // 更新玩家状态
    this.updatePlayer();
  },

  // 更新玩家状态
    updatePlayer() {
      const { gameState } = this.data;
      const player = gameState.player;
      
      // 应用重力
      player.vy += 0.5; // 重力加速度
      
      // 限制最大下落速度
      if (player.vy > 8) {
        player.vy = 8;
      }
      
      // 更新玩家位置
      player.x += player.vx;
      player.y += player.vy;
      
      // 碰撞检测
      this.checkCollisions();
      
      // 摩擦力
      player.vx *= 0.8;
      
      // 更新相机位置（跟随玩家）
      gameState.camera.x = player.x * BLOCK_SIZE - 150; // 屏幕中心
      gameState.camera.y = player.y * BLOCK_SIZE - 100; // 屏幕中心
      
      // 限制相机在世界范围内
      gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, WORLD_WIDTH * BLOCK_SIZE - 300));
      gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, WORLD_HEIGHT * BLOCK_SIZE - 200));
      
      this.setData({
        gameState
      });
    },

    // 碰撞检测
    checkCollisions() {
      const { gameState } = this.data;
      const player = gameState.player;
      
      // 计算玩家所在的方块位置
      const playerLeft = Math.floor(player.x);
      const playerRight = Math.floor(player.x + 0.9);
      const playerTop = Math.floor(player.y);
      const playerBottom = Math.floor(player.y + 1.8); // 玎家高度为1.8个方块
      
      // 检查水平碰撞
      if (player.vx > 0) { // 向右移动
        // 检查右侧是否有方块
        if (playerRight < WORLD_WIDTH && 
            (gameState.world[playerRight][playerTop] !== BLOCK_TYPES.AIR || 
             gameState.world[playerRight][playerBottom] !== BLOCK_TYPES.AIR)) {
          player.x = playerRight - 1; // 停止移动
          player.vx = 0;
        }
      } else if (player.vx < 0) { // 向左移动
        // 检查左侧是否有方块
        if (playerLeft >= 0 && 
            (gameState.world[playerLeft][playerTop] !== BLOCK_TYPES.AIR || 
             gameState.world[playerLeft][playerBottom] !== BLOCK_TYPES.AIR)) {
          player.x = playerLeft + 1; // 停止移动
          player.vx = 0;
        }
      }
      
      // 检查垂直碰撞
      if (player.vy > 0) { // 向下移动（下落）
        // 检查下方是否有方块
        if (playerBottom < WORLD_HEIGHT && 
            (gameState.world[playerLeft][playerBottom] !== BLOCK_TYPES.AIR || 
             gameState.world[playerRight][playerBottom] !== BLOCK_TYPES.AIR)) {
          player.y = playerBottom - 1.8; // 停止下落
          player.vy = 0;
        }
      } else if (player.vy < 0) { // 向上移动（跳跃）
        // 检查上方是否有方块
        if (playerTop >= 0 && 
            (gameState.world[playerLeft][playerTop] !== BLOCK_TYPES.AIR || 
             gameState.world[playerRight][playerTop] !== BLOCK_TYPES.AIR)) {
          player.y = playerTop + 1; // 停止上升
          player.vy = 0;
        }
      }
      
      this.setData({
        gameState
      });
    },

  // 渲染游戏画面
  render() {
    // 获取Canvas上下文
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 渲染游戏世界
        this.renderWorld(ctx);
        
        // 渲染玩家
        this.renderPlayer(ctx);
      });
  },

  // 渲染游戏世界
  renderWorld(ctx) {
    const { gameState } = this.data;
    
    // 渲染世界方块
    for (let x = 0; x < WORLD_WIDTH; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const blockType = gameState.world[x][y];
        if (blockType !== BLOCK_TYPES.AIR) {
          // 获取方块颜色
          const color = this.getItemColor(blockType);
          
          // 绘制方块
          ctx.fillStyle = color;
          ctx.fillRect(
            x * BLOCK_SIZE - gameState.camera.x,
            y * BLOCK_SIZE - gameState.camera.y,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
          
          // 绘制方块边框
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            x * BLOCK_SIZE - gameState.camera.x,
            y * BLOCK_SIZE - gameState.camera.y,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      }
    }
  },

  // 渲染玩家
  renderPlayer(ctx) {
    const { gameState } = this.data;
    
    // 绘制玩家
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(
      gameState.player.x * BLOCK_SIZE - gameState.camera.x,
      gameState.player.y * BLOCK_SIZE - gameState.camera.y,
      BLOCK_SIZE,
      BLOCK_SIZE * 1.5 // 玩家比方块高一点
    );
    
    // 绘制玩家眼睛
    ctx.fillStyle = '#FFFFFF';
    const eyeOffsetX = gameState.player.direction > 0 ? 5 : -5;
    ctx.fillRect(
      gameState.player.x * BLOCK_SIZE - gameState.camera.x + 5 + eyeOffsetX,
      gameState.player.y * BLOCK_SIZE - gameState.camera.y + 5,
      4,
      4
    );
  }
});