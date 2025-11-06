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
    // 玩家属性优化
    player: {
        x: 50,
        y: 20,
        vx: 0,        // 水平速度
        vy: 0,        // 垂直速度
        ax: 0,        // 水平加速度
        ay: 0,        // 垂直加速度
        direction: 1, // 1表示向右，-1表示向左
        animationFrame: 0,
        animationTimer: 0
    }
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

// 添加背景音乐
function playBackgroundMusic() {
    if (!gameState.audioContext) return;
    
    // 创建音频振荡器
    const oscillator = gameState.audioContext.createOscillator();
    const gainNode = gameState.audioContext.createGain();
    
    // 设置振荡器类型和频率（使用低频振荡创造环境音效果）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(110, gameState.audioContext.currentTime); // A2
    
    // 设置音量
    gainNode.gain.setValueAtTime(0.1, gameState.audioContext.currentTime);
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(gameState.audioContext.destination);
    
    // 开始播放
    oscillator.start();
    
    // 5秒后逐渐降低音量并停止
    gainNode.gain.exponentialRampToValueAtTime(0.01, gameState.audioContext.currentTime + 5);
    oscillator.stop(gameState.audioContext.currentTime + 5);
    
    // 循环播放
    setTimeout(playBackgroundMusic, 5000);
}

// 在initGame函数中添加启动背景音乐
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 初始化世界
    generateWorld();
    
    // 初始化玩家
    gameState.player = {
        x: Math.floor(WORLD_WIDTH / 2),
        y: Math.floor(WORLD_HEIGHT / 2),
        vx: 0,
        vy: 0,
        ax: 0, // 加速度
        ay: 0, // 加速度
        direction: 1, // 1表示向右，-1表示向左
        animationFrame: 0, // 动画帧
        animationTimer: 0  // 动画计时器
    };
    
    // 初始化相机
    gameState.camera = {
        x: 0,
        y: 0
    };
    
    // 初始化按键状态
    gameState.keys = {};
    
    // 初始化物品栏
    gameState.inventory = [
        { type: 1, count: 10 },  // 草地
        { type: 2, count: 10 },  // 泥土
        { type: 3, count: 10 },  // 石头
        { type: 4, count: 5 },   // 木头
        { type: 5, count: 5 },   // 叶子
        { type: 6, count: 3 },   // 水
        { type: 7, count: 5 },   // 沙子
        { type: 8, count: 2 },   // 煤炭
        { type: 9, count: 1 }    // 铁矿
    ];
    
    // 初始化选中的物品栏槽位
    gameState.selectedSlot = 0;
    
    // 创建音效上下文
    gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新物品栏UI
    updateInventoryUI();
    
    // 启动背景音乐
    playBackgroundMusic();
    
    // 开始游戏循环
    gameLoop();
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
            // 设置挖掘动画
            playerAnimations.mining = true;
            playerAnimations.miningProgress = 0;
            playerAnimations.miningX = worldX;
            playerAnimations.miningY = worldY;
        } else if (e.button === 2) { // 右键放置
            placeBlock(worldX, worldY);
        }
    });
    
    // 鼠标抬起事件，取消挖掘
    document.getElementById('gameCanvas').addEventListener('mouseup', (e) => {
        if (e.button === 0) { // 左键
            playerAnimations.mining = false;
            playerAnimations.miningProgress = 0;
        }
    });
    
    // 鼠标离开画布，取消挖掘
    document.getElementById('gameCanvas').addEventListener('mouseleave', () => {
        playerAnimations.mining = false;
        playerAnimations.miningProgress = 0;
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
            // 添加粒子效果
            createParticles(x * BLOCK_SIZE - gameState.camera.x, y * BLOCK_SIZE - gameState.camera.y, blockType);
            
            // 添加到物品栏
            const inventoryItem = gameState.inventory.find(item => item.type === blockType);
            if (inventoryItem) {
                inventoryItem.count++;
            }
            
            // 设置为空气
            gameState.world[x][y] = BLOCK_TYPES.AIR;
            
            // 播放音效（如果支持）
            try {
                // 创建简单的点击音效
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'square';
                oscillator.frequency.value = 200 + Math.random() * 100;
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                }, 100);
            } catch (e) {
                // 音频上下文可能不可用，静默失败
            }
            
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
                
                // 添加放置动画
                createPlaceAnimation(x * BLOCK_SIZE - gameState.camera.x, y * BLOCK_SIZE - gameState.camera.y);
                
                // 播放放置音效
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 150 + Math.random() * 50;
                    gainNode.gain.value = 0.1;
                    
                    oscillator.start();
                    setTimeout(() => {
                        oscillator.stop();
                    }, 150);
                } catch (e) {
                    // 音频上下文可能不可用，静默失败
                }
                
                // 更新UI
                updateInventoryUI();
            }
        }
    }
}

// 添加玩家动画状态
let playerAnimations = {
    mining: false,
    miningProgress: 0,
    miningX: 0,
    miningY: 0
};

// 更新玩家位置
function updatePlayer() {
    // 处理输入 - 应用加速度
    const acceleration = 0.5;
    const maxSpeed = 5;
    const friction = 0.85;
    
    // 水平移动
    if (gameState.keys['a'] || gameState.keys['arrowleft']) {
        gameState.player.ax = -acceleration;
        gameState.player.direction = -1; // 向左
    } else if (gameState.keys['d'] || gameState.keys['arrowright']) {
        gameState.player.ax = acceleration;
        gameState.player.direction = 1; // 向右
    } else {
        gameState.player.ax = 0;
    }
    
    // 垂直移动（简化版本，实际游戏中可能需要重力）
    if (gameState.keys['w'] || gameState.keys['arrowup']) {
        gameState.player.ay = -acceleration;
    } else if (gameState.keys['s'] || gameState.keys['arrowdown']) {
        gameState.player.ay = acceleration;
    } else {
        gameState.player.ay = 0;
    }
    
    // 更新速度
    gameState.player.vx += gameState.player.ax;
    gameState.player.vy += gameState.player.ay;
    
    // 限制最大速度
    if (gameState.player.vx > maxSpeed) gameState.player.vx = maxSpeed;
    if (gameState.player.vx < -maxSpeed) gameState.player.vx = -maxSpeed;
    if (gameState.player.vy > maxSpeed) gameState.player.vy = maxSpeed;
    if (gameState.player.vy < -maxSpeed) gameState.player.vy = -maxSpeed;
    
    // 应用摩擦力
    if (gameState.player.ax === 0) {
        gameState.player.vx *= friction;
        // 当速度非常小时停止移动
        if (Math.abs(gameState.player.vx) < 0.1) gameState.player.vx = 0;
    }
    
    if (gameState.player.ay === 0) {
        gameState.player.vy *= friction;
        // 当速度非常小时停止移动
        if (Math.abs(gameState.player.vy) < 0.1) gameState.player.vy = 0;
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
    
    // 更新挖掘动画
    if (playerAnimations.mining) {
        playerAnimations.miningProgress += 0.1;
        if (playerAnimations.miningProgress >= 1) {
            // 挖掘完成
            mineBlock(playerAnimations.miningX, playerAnimations.miningY);
            playerAnimations.mining = false;
            playerAnimations.miningProgress = 0;
        }
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
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算可见区域
    const startX = Math.floor(gameState.camera.x / BLOCK_SIZE);
    const startY = Math.floor(gameState.camera.y / BLOCK_SIZE);
    const endX = Math.min(WORLD_WIDTH, startX + Math.ceil(canvas.width / BLOCK_SIZE) + 1);
    const endY = Math.min(WORLD_HEIGHT, startY + Math.ceil(canvas.height / BLOCK_SIZE) + 1);
    
    // 绘制背景（天空）
    const timeOfDay = (Date.now() / 100000) % 1; // 简单的时间循环
    const skyColorValue = Math.sin(timeOfDay * Math.PI * 2) * 50 + 150; // 明暗变化
    ctx.fillStyle = `rgb(${skyColorValue}, ${skyColorValue}, ${skyColorValue * 1.2})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制云朵
    drawCloud(ctx, 100 - (gameState.camera.x * 0.1) % canvas.width, 50 - gameState.camera.y * 0.1, 60, 30);
    drawCloud(ctx, 300 - (gameState.camera.x * 0.1) % canvas.width, 80 - gameState.camera.y * 0.1, 80, 40);
    drawCloud(ctx, 500 - (gameState.camera.x * 0.1) % canvas.width, 60 - gameState.camera.y * 0.1, 70, 35);
    
    // 绘制背景装饰物（草、花等）
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            if (y > 0 && world[y - 1][x] === 0 && world[y][x] === 1) { // 方块上方为空气
                if (Math.random() < 0.1) { // 10%概率出现草
                    ctx.fillStyle = '#2E8B57';
                    ctx.fillRect(
                        x * BLOCK_SIZE - gameState.camera.x,
                        (y - 1) * BLOCK_SIZE - gameState.camera.y,
                        BLOCK_SIZE / 4,
                        BLOCK_SIZE / 2
                    );
                } else if (Math.random() < 0.02) { // 2%概率出现花
                    // 花茎
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(
                        x * BLOCK_SIZE + BLOCK_SIZE / 2 - 1 - gameState.camera.x,
                        (y - 1) * BLOCK_SIZE - gameState.camera.y,
                        2,
                        BLOCK_SIZE / 3
                    );
                    // 花朵
                    ctx.fillStyle = '#FF69B4';
                    ctx.beginPath();
                    ctx.arc(
                        x * BLOCK_SIZE + BLOCK_SIZE / 2 - gameState.camera.x,
                        (y - 1) * BLOCK_SIZE - 5 - gameState.camera.y,
                        4,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }
    }
    
    // 绘制方块
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            const blockType = world[y][x];
            if (blockType !== 0) { // 不是空气
                // 根据方块类型设置颜色
                switch (blockType) {
                    case 1: // 草地
                        ctx.fillStyle = '#7CFC00';
                        break;
                    case 2: // 泥土
                        ctx.fillStyle = '#8B4513';
                        break;
                    case 3: // 石头
                        ctx.fillStyle = '#808080';
                        break;
                    case 4: // 木头
                        ctx.fillStyle = '#8B4513';
                        break;
                    case 5: // 叶子
                        ctx.fillStyle = '#228B22';
                        break;
                    case 6: // 水
                        ctx.fillStyle = '#1E90FF';
                        break;
                    case 7: // 沙子
                        ctx.fillStyle = '#F0E68C';
                        break;
                    case 8: // 煤炭
                        ctx.fillStyle = '#2F4F4F';
                        break;
                    case 9: // 铁矿
                        ctx.fillStyle = '#C0C0C0';
                        break;
                    case 10: // 钻石
                        ctx.fillStyle = '#00BFFF';
                        break;
                    default:
                        ctx.fillStyle = '#FF0000'; // 未知方块用红色表示
                }
                
                // 应用光照效果（简单的Y轴光照）
                const lightLevel = Math.max(0.3, 1 - (y / WORLD_HEIGHT) * 0.7); // 顶部更亮，底部更暗
                const currentFillStyle = ctx.fillStyle;
                const rgbValues = currentFillStyle.match(/\d+/g);
                if (rgbValues && rgbValues.length >= 3) {
                    ctx.fillStyle = `rgb(${Math.floor(rgbValues[0] * lightLevel)}, ${Math.floor(rgbValues[1] * lightLevel)}, ${Math.floor(rgbValues[2] * lightLevel)})`;
                }
                
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
    
    // 绘制挖掘进度条
    if (playerAnimations.mining) {
        const screenX = playerAnimations.miningX * BLOCK_SIZE - gameState.camera.x;
        const screenY = playerAnimations.miningY * BLOCK_SIZE - gameState.camera.y;
        
        // 进度条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX, screenY - 10, BLOCK_SIZE, 5);
        
        // 进度条前景
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(screenX, screenY - 10, BLOCK_SIZE * playerAnimations.miningProgress, 5);
    }
    
    // 渲染粒子系统
    renderParticles();
}

// 绘制云朵
function drawCloud(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 10, 15, 0, Math.PI * 2);
    ctx.fill();
}

// 游戏循环
function gameLoop() {
    updatePlayer();
    updateParticles(); // 更新粒子系统
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

// 粒子系统
let particles = [];

// 创建挖掘粒子效果
function createParticles(x, y, blockType) {
    const particleCount = 8;
    const colors = {
        [BLOCK_TYPES.GRASS]: ['#7CFC00', '#228B22', '#8B4513'],
        [BLOCK_TYPES.DIRT]: ['#8B4513', '#A0522D', '#654321'],
        [BLOCK_TYPES.STONE]: ['#808080', '#A9A9A9', '#696969'],
        [BLOCK_TYPES.WOOD]: ['#8B4513', '#A0522D', '#654321'],
        [BLOCK_TYPES.LEAVES]: ['#228B22', '#32CD32', '#006400'],
        [BLOCK_TYPES.WATER]: ['#1E90FF', '#00BFFF', '#87CEEB'],
        [BLOCK_TYPES.SAND]: ['#F0E68C', '#FFD700', '#DAA520'],
        [BLOCK_TYPES.COAL]: ['#2C3E50', '#34495E', '#1C2833'],
        [BLOCK_TYPES.IRON]: ['#7F8C8D', '#95A5A6', '#BDC3C7'],
        [BLOCK_TYPES.DIAMOND]: ['#3498DB', '#5DADE2', '#85C1E9'],
        [BLOCK_TYPES.REDSTONE]: ['#E74C3C', '#EC7063', '#F1948A'],
        [BLOCK_TYPES.CRAFTING_TABLE]: ['#E67E22', '#EB984E', '#F0B27A'],
        [BLOCK_TYPES.FURNACE]: ['#7F8C8D', '#95A5A6', '#BDC3C7'],
        [BLOCK_TYPES.CHEST]: ['#8B4513', '#A0522D', '#654321'],
        [BLOCK_TYPES.TORCH]: ['#FF9800', '#FFA500', '#FFB347'],
        [BLOCK_TYPES.LADDER]: ['#654321', '#8B4513', '#A0522D']
    };
    
    const blockColors = colors[blockType] || ['#FFFFFF', '#CCCCCC', '#999999'];
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x + BLOCK_SIZE / 2,
            y: y + BLOCK_SIZE / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: blockColors[Math.floor(Math.random() * blockColors.length)],
            size: Math.random() * 3 + 2,
            life: 30 // 粒子存在时间
        });
    }
}

// 创建放置动画
function createPlaceAnimation(x, y) {
    // 简单的放置动画效果
    particles.push({
        x: x + BLOCK_SIZE / 2,
        y: y + BLOCK_SIZE / 2,
        vx: 0,
        vy: 0,
        color: '#FFFFFF',
        size: BLOCK_SIZE,
        life: 15,
        expand: true // 标记为扩展动画
    });
}

// 更新粒子系统
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // 更新粒子位置
        p.x += p.vx;
        p.y += p.vy;
        
        // 减少生命值
        p.life--;
        
        // 如果粒子生命结束，移除它
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 渲染粒子系统
function renderParticles() {
    const ctx = gameState.ctx;
    
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // 保存当前上下文
        ctx.save();
        
        // 设置粒子颜色和透明度
        if (p.expand) {
            // 扩展动画，逐渐变透明
            const alpha = p.life / 15;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            
            // 计算当前大小（从0到完整大小）
            const currentSize = (1 - p.life / 15) * p.size;
            ctx.fillRect(
                p.x - currentSize / 2, 
                p.y - currentSize / 2, 
                currentSize, 
                currentSize
            );
        } else {
            // 普通粒子效果
            const alpha = p.life / 30;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(
                p.x - p.size / 2, 
                p.y - p.size / 2, 
                p.size, 
                p.size
            );
        }
        
        // 恢复上下文
        ctx.restore();
    }
}