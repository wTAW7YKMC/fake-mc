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
    WATER: 6
};

// 方块颜色
const BLOCK_COLORS = {
    [BLOCK_TYPES.AIR]: '#87CEEB',
    [BLOCK_TYPES.GRASS]: '#7CFC00',
    [BLOCK_TYPES.DIRT]: '#8B4513',
    [BLOCK_TYPES.STONE]: '#808080',
    [BLOCK_TYPES.WOOD]: '#8B4513',
    [BLOCK_TYPES.LEAVES]: '#228B22',
    [BLOCK_TYPES.WATER]: '#4169E1'
};

// 游戏状态
let gameState = {
    world: [],
    player: {
        x: 50,
        y: 20,
        vx: 0,
        vy: 0
    },
    camera: {
        x: 0,
        y: 0
    },
    inventory: [
        { type: BLOCK_TYPES.GRASS, count: 10 },
        { type: BLOCK_TYPES.DIRT, count: 10 },
        { type: BLOCK_TYPES.STONE, count: 10 },
        { type: BLOCK_TYPES.WOOD, count: 10 }
    ],
    selectedSlot: 0,
    keys: {}
};

// 初始化游戏
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gameState.ctx = canvas.getContext('2d');
    
    // 生成世界
    generateWorld();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化物品栏
    initInventory();
    
    // 开始游戏循环
    gameLoop();
}

// 生成随机世界
function generateWorld() {
    // 初始化为空气
    for (let x = 0; x < WORLD_WIDTH; x++) {
        gameState.world[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            gameState.world[x][y] = BLOCK_TYPES.AIR;
        }
    }
    
    // 生成地形
    for (let x = 0; x < WORLD_WIDTH; x++) {
        // 地表高度使用噪声函数生成
        const surfaceHeight = Math.floor(WORLD_HEIGHT / 2 + Math.sin(x / 10) * 5);
        
        // 生成草地层
        gameState.world[x][surfaceHeight] = BLOCK_TYPES.GRASS;
        
        // 生成泥土层
        for (let y = surfaceHeight + 1; y < surfaceHeight + 5 && y < WORLD_HEIGHT; y++) {
            gameState.world[x][y] = BLOCK_TYPES.DIRT;
        }
        
        // 生成石头层
        for (let y = surfaceHeight + 5; y < WORLD_HEIGHT; y++) {
            gameState.world[x][y] = BLOCK_TYPES.STONE;
        }
        
        // 随机生成树木
        if (Math.random() < 0.05 && surfaceHeight > 5) {
            const treeHeight = 4 + Math.floor(Math.random() * 3);
            for (let i = 1; i <= treeHeight; i++) {
                if (surfaceHeight - i >= 0) {
                    gameState.world[x][surfaceHeight - i] = BLOCK_TYPES.WOOD;
                }
            }
            // 生成树叶
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = surfaceHeight - treeHeight - 1 + dy;
                    if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                        if (gameState.world[nx][ny] === BLOCK_TYPES.AIR && Math.random() < 0.7) {
                            gameState.world[nx][ny] = BLOCK_TYPES.LEAVES;
                        }
                    }
                }
            }
        }
        
        // 随机生成水池
        if (Math.random() < 0.03) {
            const poolWidth = 3 + Math.floor(Math.random() * 4);
            const poolDepth = 2 + Math.floor(Math.random() * 3);
            for (let px = Math.max(0, x - poolWidth); px < Math.min(WORLD_WIDTH, x + poolWidth); px++) {
                for (let py = surfaceHeight; py < Math.min(WORLD_HEIGHT, surfaceHeight + poolDepth); py++) {
                    if (Math.abs(px - x) < poolWidth && py < surfaceHeight + poolDepth) {
                        gameState.world[px][py] = BLOCK_TYPES.WATER;
                    }
                }
            }
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
        slot.style.backgroundColor = BLOCK_COLORS[item.type];
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
        slot.textContent = gameState.inventory[index].count;
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
        gameState.player.vx = -5;
    }
    if (gameState.keys['d'] || gameState.keys['arrowright']) {
        gameState.player.vx = 5;
    }
    if (gameState.keys['w'] || gameState.keys['arrowup']) {
        gameState.player.vy = -5;
    }
    if (gameState.keys['s'] || gameState.keys['arrowdown']) {
        gameState.player.vy = 5;
    }
    
    // 更新玩家位置
    gameState.player.x += gameState.player.vx;
    gameState.player.y += gameState.player.vy;
    
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
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
                ctx.fillStyle = BLOCK_COLORS[blockType];
                ctx.fillRect(
                    x * BLOCK_SIZE - gameState.camera.x,
                    y * BLOCK_SIZE - gameState.camera.y,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
                
                // 绘制边框
                ctx.strokeStyle = '#000';
                ctx.strokeRect(
                    x * BLOCK_SIZE - gameState.camera.x,
                    y * BLOCK_SIZE - gameState.camera.y,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        }
    }
    
    // 渲染玩家
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(
        gameState.player.x * BLOCK_SIZE - gameState.camera.x,
        gameState.player.y * BLOCK_SIZE - gameState.camera.y,
        BLOCK_SIZE,
        BLOCK_SIZE
    );
}

// 游戏循环
function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}

// 启动游戏
window.onload = initGame;