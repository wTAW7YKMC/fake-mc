// 游戏常量
const BLOCK_SIZE = 32;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 50;
const VIEWPORT_WIDTH = Math.ceil(window.innerWidth / BLOCK_SIZE);
const VIEWPORT_HEIGHT = Math.ceil(window.innerHeight / BLOCK_SIZE);

// 方块类型
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

// 游戏状态
let gameState = {
    world: [],
    player: {
        x: 50,
        y: 20,
        vx: 0,
        vy: 0,
        direction: 1, // 1表示向右，-1表示向左
        animationFrame: 0,
        animationTimer: 0
    },
    camera: {
        x: 0,
        y: 0
    },
    inventory: [
        { type: BLOCK_TYPES.GRASS, count: 10 },
        { type: BLOCK_TYPES.DIRT, count: 10 },
        { type: BLOCK_TYPES.STONE, count: 10 },
        { type: BLOCK_TYPES.WOOD, count: 10 },
        { type: BLOCK_TYPES.CRAFTING_TABLE, count: 5 },
        { type: BLOCK_TYPES.FURNACE, count: 5 },
        { type: BLOCK_TYPES.CHEST, count: 5 },
        { type: BLOCK_TYPES.TORCH, count: 10 },
        { type: BLOCK_TYPES.LADDER, count: 10 }
    ],
    selectedSlot: 0,
    keys: {},
    images: {} // 存储加载的图像
};

// 加载图像资源
function loadImages(callback) {
    const imageFiles = {
        [BLOCK_TYPES.GRASS]: 'assets/grass.svg',
        [BLOCK_TYPES.DIRT]: 'assets/dirt.svg',
        [BLOCK_TYPES.STONE]: 'assets/stone.svg',
        [BLOCK_TYPES.WOOD]: 'assets/wood.svg',
        [BLOCK_TYPES.LEAVES]: 'assets/leaves.svg',
        [BLOCK_TYPES.WATER]: 'assets/water.svg',
        [BLOCK_TYPES.SAND]: 'assets/sand.svg',
        [BLOCK_TYPES.COAL]: 'assets/coal.svg',
        [BLOCK_TYPES.IRON]: 'assets/iron.svg',
        [BLOCK_TYPES.DIAMOND]: 'assets/diamond.svg',
        [BLOCK_TYPES.REDSTONE]: 'assets/redstone.svg',
        [BLOCK_TYPES.CRAFTING_TABLE]: 'assets/crafting_table.svg',
        [BLOCK_TYPES.FURNACE]: 'assets/furnace.svg',
        [BLOCK_TYPES.CHEST]: 'assets/chest.svg',
        [BLOCK_TYPES.TORCH]: 'assets/torch.svg',
        [BLOCK_TYPES.LADDER]: 'assets/ladder.svg',
        [BLOCK_TYPES.BACKGROUND_DECORATION]: 'assets/background_decoration.svg',
        player: 'assets/player_animated.svg'
    };
    
    let loadedImages = 0;
    const totalImages = Object.keys(imageFiles).length;
    
    for (const [key, path] of Object.entries(imageFiles)) {
        const img = new Image();
        img.onload = () => {
            gameState.images[key] = img;
            loadedImages++;
            if (loadedImages === totalImages) {
                callback();
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${path}`);
            loadedImages++;
            if (loadedImages === totalImages) {
                callback();
            }
        };
        img.src = path;
    }
    
    // 如果没有图像需要加载，直接回调
    if (totalImages === 0) {
        callback();
    }
}

// 初始化游戏
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gameState.ctx = canvas.getContext('2d');
    
    // 加载图像资源
    loadImages(() => {
        // 生成世界
        generateWorld();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 初始化物品栏
        initInventory();
        
        // 开始游戏循环
        gameLoop();
    });
}

// 生成随机世界
function generateWorld() {
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
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });
    
    // 鼠标事件
    document.getElementById('gameCanvas').addEventListener('mousedown', (e) => {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 转换为世界坐标
        const worldX = Math.floor((mouseX + gameState.camera.x) / BLOCK_SIZE);
        const worldY = Math.floor((mouseY + gameState.camera.y) / BLOCK_SIZE);
        
        if (e.button === 0) { // 左键挖掘
            mineBlock(worldX, worldY);
        } else if (e.button === 2) { // 右键放置
            placeBlock(worldX, worldY);
        }
    });
    
    // 阻止右键菜单
    document.getElementById('gameCanvas').addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        const canvas = document.getElementById('gameCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // 数字键选择物品栏
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            const slotIndex = parseInt(e.key) - 1;
            if (slotIndex < gameState.inventory.length) {
                gameState.selectedSlot = slotIndex;
                updateInventoryUI();
            }
        }
    });
}

// 初始化物品栏
function initInventory() {
    const inventoryElement = document.getElementById('inventory');
    inventoryElement.innerHTML = '';
    
    gameState.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        if (index === gameState.selectedSlot) {
            slot.classList.add('selected');
        }
        slot.textContent = item.count;
        
        // 使用图像或默认颜色
        if (gameState.images[item.type]) {
            slot.style.backgroundImage = `url(${gameState.images[item.type].src})`;
            slot.style.backgroundSize = 'cover';
            slot.style.backgroundColor = '';
        } else {
            // 默认颜色（如果图像未加载）
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
            slot.style.backgroundColor = defaultColors[item.type] || '#FFFFFF';
            slot.style.backgroundImage = '';
        }
        
        slot.addEventListener('click', () => {
            gameState.selectedSlot = index;
            updateInventoryUI();
        });
        inventoryElement.appendChild(slot);
    });
}

// 更新物品栏UI
function updateInventoryUI() {
    const slots = document.querySelectorAll('.inventory-slot');
    slots.forEach((slot, index) => {
        if (index === gameState.selectedSlot) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
        
        const item = gameState.inventory[index];
        slot.textContent = item.count > 0 ? item.count : '';
        
        // 使用图像或默认颜色
        if (item.count > 0) {
            if (gameState.images[item.type]) {
                slot.style.backgroundImage = `url(${gameState.images[item.type].src})`;
                slot.style.backgroundSize = 'cover';
                slot.style.backgroundColor = '';
            } else {
                // 默认颜色（如果图像未加载）
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
                    [BLOCK_TYPES.LADDER]: '#654321'
                };
                slot.style.backgroundColor = defaultColors[item.type] || '#FFFFFF';
                slot.style.backgroundImage = '';
            }
        } else {
            slot.style.backgroundColor = '';
            slot.style.backgroundImage = '';
        }
    });
}

// 挖掘方块
function mineBlock(x, y) {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const blockType = gameState.world[x][y];
        if (blockType !== BLOCK_TYPES.AIR) {
            // 添加到物品栏
            const inventoryItem = gameState.inventory.find(item => item.type === blockType);
            if (inventoryItem) {
                inventoryItem.count++;
            }
            
            // 设置为空气
            gameState.world[x][y] = BLOCK_TYPES.AIR;
            
            // 更新UI
            updateInventoryUI();
        }
    }
}

// 放置方块
function placeBlock(x, y) {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        // 检查是否有选中的方块类型且数量大于0
        if (gameState.inventory[gameState.selectedSlot] && 
            gameState.inventory[gameState.selectedSlot].count > 0) {
            
            // 只能在空气方块上放置
            if (gameState.world[x][y] === BLOCK_TYPES.AIR) {
                const blockType = gameState.inventory[gameState.selectedSlot].type;
                gameState.world[x][y] = blockType;
                gameState.inventory[gameState.selectedSlot].count--;
                
                // 更新UI
                updateInventoryUI();
            }
        }
    }
}

// 更新玩家位置
function updatePlayer() {
    // 处理输入
    gameState.player.vx = 0;
    gameState.player.vy = 0;
    
    if (gameState.keys['a'] || gameState.keys['arrowleft']) {
        gameState.player.vx = -3;
        gameState.player.direction = -1; // 向左
    }
    if (gameState.keys['d'] || gameState.keys['arrowright']) {
        gameState.player.vx = 3;
        gameState.player.direction = 1; // 向右
    }
    if (gameState.keys['w'] || gameState.keys['arrowup']) {
        gameState.player.vy = -3;
    }
    if (gameState.keys['s'] || gameState.keys['arrowdown']) {
        gameState.player.vy = 3;
    }
    
    // 更新玩家位置
    gameState.player.x += gameState.player.vx;
    gameState.player.y += gameState.player.vy;
    
    // 更新动画
    if (gameState.player.vx !== 0 || gameState.player.vy !== 0) {
        gameState.player.animationTimer++;
        if (gameState.player.animationTimer >= 10) {
            gameState.player.animationFrame = (gameState.player.animationFrame + 1) % 4;
            gameState.player.animationTimer = 0;
        }
    } else {
        gameState.player.animationFrame = 0; // 静止时回到第一帧
        gameState.player.animationTimer = 0;
    }
    
    // 边界检查
    if (gameState.player.x < 0) gameState.player.x = 0;
    if (gameState.player.x >= WORLD_WIDTH) gameState.player.x = WORLD_WIDTH - 1;
    if (gameState.player.y < 0) gameState.player.y = 0;
    if (gameState.player.y >= WORLD_HEIGHT) gameState.player.y = WORLD_HEIGHT - 1;
    
    // 更新摄像机跟随玩家
    gameState.camera.x = gameState.player.x * BLOCK_SIZE - window.innerWidth / 2;
    gameState.camera.y = gameState.player.y * BLOCK_SIZE - window.innerHeight / 2;
    
    // 边界检查
    if (gameState.camera.x < 0) gameState.camera.x = 0;
    if (gameState.camera.y < 0) gameState.camera.y = 0;
    if (gameState.camera.x > WORLD_WIDTH * BLOCK_SIZE - window.innerWidth) {
        gameState.camera.x = WORLD_WIDTH * BLOCK_SIZE - window.innerWidth;
    }
    if (gameState.camera.y > WORLD_HEIGHT * BLOCK_SIZE - window.innerHeight) {
        gameState.camera.y = WORLD_HEIGHT * BLOCK_SIZE - window.innerHeight;
    }
}

// 渲染游戏
function render() {
    const ctx = gameState.ctx;
    const canvas = ctx.canvas;
    
    // 清除画布并绘制天空背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB"); // 浅蓝色天空
    gradient.addColorStop(1, "#E0F7FA"); // 浅青色地平线
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 计算可见区域
    const startX = Math.floor(gameState.camera.x / BLOCK_SIZE);
    const startY = Math.floor(gameState.camera.y / BLOCK_SIZE);
    const endX = Math.min(WORLD_WIDTH, startX + VIEWPORT_WIDTH + 1);
    const endY = Math.min(WORLD_HEIGHT, startY + VIEWPORT_HEIGHT + 1);
    
    // 渲染方块
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            const blockType = gameState.world[x][y];
            if (blockType !== BLOCK_TYPES.AIR) {
                const blockX = x * BLOCK_SIZE - gameState.camera.x;
                const blockY = y * BLOCK_SIZE - gameState.camera.y;
                
                // 使用图像渲染方块（如果图像已加载）
            if (gameState.images[blockType]) {
                ctx.drawImage(
                    gameState.images[blockType],
                    blockX,
                    blockY,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
                // 添加边框
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                // 如果图像未加载，使用默认颜色
                const defaultColors = {
                    [BLOCK_TYPES.GRASS]: '#7CFC00',
                    [BLOCK_TYPES.DIRT]: '#8B4513',
                    [BLOCK_TYPES.STONE]: '#808080',
                    [BLOCK_TYPES.WOOD]: '#8B4513',
                    [BLOCK_TYPES.LEAVES]: '#228B22',
                    [BLOCK_TYPES.WATER]: '#4169E1',
                    [BLOCK_TYPES.SAND]: '#F0E68C',
                    [BLOCK_TYPES.COAL]: '#2C3E50',
                    [BLOCK_TYPES.IRON]: '#7F8C8D',
                    [BLOCK_TYPES.DIAMOND]: '#3498DB',
                    [BLOCK_TYPES.REDSTONE]: '#E74C3C',
                    [BLOCK_TYPES.CRAFTING_TABLE]: '#E67E22',
                    [BLOCK_TYPES.FURNACE]: '#7F8C8D',
                    [BLOCK_TYPES.CHEST]: '#8B4513',
                    [BLOCK_TYPES.TORCH]: '#FF9800',
                    [BLOCK_TYPES.LADDER]: '#654321'
                };
                
                ctx.fillStyle = defaultColors[blockType] || '#FFFFFF';
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                
                // 绘制边框
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            }
            }
        }
    }
    
    // 渲染玩家
    const playerX = gameState.player.x * BLOCK_SIZE - gameState.camera.x;
    const playerY = gameState.player.y * BLOCK_SIZE - gameState.camera.y;
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(playerX + 2, playerY + 2, BLOCK_SIZE, BLOCK_SIZE);
    
    // 使用图像渲染玩家（如果图像已加载）
    if (gameState.images.player) {
        // 保存当前上下文状态
        ctx.save();
        
        // 如果玩家向左移动，水平翻转图像
        if (gameState.player.direction === -1) {
            ctx.translate(playerX + BLOCK_SIZE, playerY);
            ctx.scale(-1, 1);
            ctx.drawImage(gameState.images.player, 0, 0, BLOCK_SIZE, BLOCK_SIZE);
        } else {
            ctx.drawImage(gameState.images.player, playerX, playerY, BLOCK_SIZE, BLOCK_SIZE);
        }
        
        // 恢复上下文状态
        ctx.restore();
    } else {
        // 如果图像未加载，使用默认的红色方块和简单动画
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(playerX, playerY, BLOCK_SIZE, BLOCK_SIZE);
        
        // 绘制边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(playerX, playerY, BLOCK_SIZE, BLOCK_SIZE);
    }
    
    // 添加玩家动画效果（腿部摆动和手臂摆动）
    if (gameState.images.player && (gameState.player.vx !== 0 || gameState.player.vy !== 0)) {
        // 这里可以添加更复杂的SVG动画逻辑
        // 由于SVG动画在Canvas中比较复杂，我们通过改变绘制位置来模拟动画
        const animationOffset = Math.sin(gameState.player.animationTimer * 0.5) * 2;
        
        // 可以在这里添加额外的动画元素
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(playerX + 10, playerY + 10 + animationOffset, 4, 4);
    }
}

// 游戏循环
function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}

// 启动游戏
window.onload = () => {
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    
    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        initGame();
    });
};