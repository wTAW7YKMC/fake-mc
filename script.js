// 简单的Simplex噪声实现（简化版）
class SimplexNoise {
    constructor() {
        this.grad3 = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        this.perm = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }

    noise2D(xin, yin) {
        let n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (xin + yin) * F2; // Hairy factor for 2D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = xin - X0; // The x,y distances from the cell origin
        const y0 = yin - Y0;
        
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1; j1 = 0; // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        } else {
            i1 = 0; j1 = 1; // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        }
        
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;
        
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
        
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
}

// 游戏常量
const BLOCK_SIZE = 32;
const WORLD_WIDTH = 200; // 扩大世界宽度以容纳更多生物群系
const WORLD_HEIGHT = 100; // 增加世界高度以支持纵向分层
const VIEWPORT_WIDTH = Math.ceil(window.innerWidth / BLOCK_SIZE);
const VIEWPORT_HEIGHT = Math.ceil(window.innerHeight / BLOCK_SIZE);

// 生物群系类型
const BIOME_TYPES = {
    PLAINS: 0,    // 平原
    FOREST: 1,    // 森林
    DESERT: 2     // 荒漠
};

// 纵向分层
const LAYER_TYPES = {
    SURFACE: 0,   // 地表 (Y=60~100)
    UNDERGROUND: 1, // 地下 (Y=20~60)
    CAVE: 2,      // 洞穴 (Y=-20~20)
    ABYSS: 3      // 深渊 (Y<-20)
};

// 重力参数
const GRAVITY_PARAMS = {
    [LAYER_TYPES.SURFACE]: 1.0,    // 地表正常重力
    [LAYER_TYPES.UNDERGROUND]: 0.95, // 地下轻微重力降低
    [LAYER_TYPES.CAVE]: 0.9,      // 洞穴重力降低10%
    [LAYER_TYPES.ABYSS]: 0.8       // 深渊重力降低20%
};

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
    biomeMap: [], // 生物群系地图
    layerMap: [], // 纵向分层地图
    structures: [], // 结构点信息
    terrainFeatures: [], // 动态地形元素
    // 玩家属性优化
    player: {
        x: 100, // 调整到世界中心
        y: 80,  // 调整到地表附近
        vx: 0,        // 水平速度
        vy: 0,        // 垂直速度
        ax: 0,        // 水平加速度
        ay: 0,        // 垂直加速度
        direction: 1, // 1表示向右，-1表示向左
        animationFrame: 0,
        animationTimer: 0,
        currentBiome: BIOME_TYPES.PLAINS, // 当前生物群系
        currentLayer: LAYER_TYPES.SURFACE, // 当前分层
        gravityMultiplier: 1.0 // 重力乘数
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
    
    // 初始化物品栏
    initInventory();
    
    // 更新物品栏UI
    updateInventoryUI();
    
    // 启动背景音乐
    playBackgroundMusic();
    
    // 开始游戏循环
    gameLoop();
}

// 生成生物群系地图
function generateBiomeMap() {
    // 使用噪声生成生物群系分布
    const biomeNoise = new SimplexNoise();
    
    for (let x = 0; x < WORLD_WIDTH; x++) {
        gameState.biomeMap[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            // 使用噪声值决定生物群系
            const noiseValue = biomeNoise.noise2D(x * 0.01, y * 0.01);
            
            if (noiseValue < -0.3) {
                gameState.biomeMap[x][y] = BIOME_TYPES.DESERT; // 荒漠
            } else if (noiseValue < 0.3) {
                gameState.biomeMap[x][y] = BIOME_TYPES.PLAINS; // 平原
            } else {
                gameState.biomeMap[x][y] = BIOME_TYPES.FOREST; // 森林
            }
        }
    }
    
    // 平滑生物群系过渡
    smoothBiomeMap();
}

// 平滑生物群系过渡
function smoothBiomeMap() {
    const smoothedMap = [];
    
    for (let x = 0; x < WORLD_WIDTH; x++) {
        smoothedMap[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            // 检查周围8个格子的生物群系
            const neighbors = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                        neighbors.push(gameState.biomeMap[nx][ny]);
                    }
                }
            }
            
            // 使用多数投票决定当前格子的生物群系
            const biomeCounts = {};
            neighbors.forEach(biome => {
                biomeCounts[biome] = (biomeCounts[biome] || 0) + 1;
            });
            
            let maxCount = 0;
            let dominantBiome = gameState.biomeMap[x][y];
            
            for (const biome in biomeCounts) {
                if (biomeCounts[biome] > maxCount) {
                    maxCount = biomeCounts[biome];
                    dominantBiome = parseInt(biome);
                }
            }
            
            smoothedMap[x][y] = dominantBiome;
        }
    }
    
    gameState.biomeMap = smoothedMap;
}

// 生成纵向分层地图
function generateLayerMap() {
    for (let x = 0; x < WORLD_WIDTH; x++) {
        gameState.layerMap[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y >= 60) {
                gameState.layerMap[x][y] = LAYER_TYPES.SURFACE; // 地表
            } else if (y >= 20) {
                gameState.layerMap[x][y] = LAYER_TYPES.UNDERGROUND; // 地下
            } else if (y >= -20) {
                gameState.layerMap[x][y] = LAYER_TYPES.CAVE; // 洞穴
            } else {
                gameState.layerMap[x][y] = LAYER_TYPES.ABYSS; // 深渊
            }
        }
    }
}

// 生成随机世界（泰拉瑞亚/星露谷风格）
function generateWorld() {
    const world = [];
    const biomeMap = [];
    const layerMap = [];
    
    // 初始化世界数组
    for (let x = 0; x < WORLD_WIDTH; x++) {
        world[x] = [];
        biomeMap[x] = [];
        layerMap[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            world[x][y] = BLOCK_TYPES.AIR;
            biomeMap[x][y] = 'plains'; // 默认生物群系
            layerMap[x][y] = 'surface'; // 默认分层
        }
    }
    
    // 生成生物群系地图
    generateBiomeMap(biomeMap);
    
    // 生成分层地图
    generateLayerMap(layerMap);
    
    // 基于生物群系和分层生成基础地形
    generateBaseTerrain(world, biomeMap, layerMap);
    
    // 生成生物群系特色结构
    generateBiomeFeatures(world, biomeMap, layerMap);
    
    // 生成结构点（废弃小屋、树洞、枯井）
    const structures = generateStructures(world, biomeMap, layerMap);
    
    // 生成动态地形元素（河流、悬崖）
    const terrainFeatures = generateDynamicTerrain(world, biomeMap, layerMap);
    
    // 更新游戏状态
    gameState.world = world;
    gameState.biomeMap = biomeMap;
    gameState.layerMap = layerMap;
    gameState.structures = structures;
    gameState.terrainFeatures = terrainFeatures;
}

// 生成结构点（废弃小屋、树洞、枯井）
function generateStructures(world, biomeMap, layerMap) {
    const structures = [];
    
    // 平原：废弃小屋
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * (WORLD_WIDTH - 8)) + 4;
        const y = findSurfaceHeight(world, x);
        
        if (y > 0 && biomeMap[x][y] === 'plains' && layerMap[x][y] === 'surface') {
            generateAbandonedHouse(world, x, y);
            structures.push({type: 'abandoned_house', x, y});
        }
    }
    
    // 森林：树洞
    for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * (WORLD_WIDTH - 4)) + 2;
        const y = findSurfaceHeight(world, x);
        
        if (y > 0 && biomeMap[x][y] === 'forest' && layerMap[x][y] === 'surface') {
            generateTreeHole(world, x, y);
            structures.push({type: 'tree_hole', x, y});
        }
    }
    
    // 荒漠：枯井
    for (let i = 0; i < 2; i++) {
        const x = Math.floor(Math.random() * (WORLD_WIDTH - 4)) + 2;
        const y = findSurfaceHeight(world, x);
        
        if (y > 0 && biomeMap[x][y] === 'desert' && layerMap[x][y] === 'surface') {
            generateDryWell(world, x, y);
            structures.push({type: 'dry_well', x, y});
        }
    }
    
    return structures;
}

// 查找地表高度
function findSurfaceHeight(world, x) {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        if (world[x][y] !== BLOCK_TYPES.AIR) {
            return y;
        }
    }
    return -1;
}

// 生成废弃小屋
function generateAbandonedHouse(world, startX, startY) {
    const width = 6;
    const height = 4;
    
    // 清理区域
    for (let x = startX - 1; x <= startX + width; x++) {
        for (let y = startY; y <= startY + height; y++) {
            if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                world[x][y] = BLOCK_TYPES.AIR;
            }
        }
    }
    
    // 地基
    for (let x = startX; x < startX + width; x++) {
        if (x >= 0 && x < WORLD_WIDTH && startY >= 0) {
            world[x][startY] = BLOCK_TYPES.WOOD;
        }
    }
    
    // 墙壁
    for (let y = startY + 1; y < startY + height; y++) {
        if (startX >= 0 && startX < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            world[startX][y] = BLOCK_TYPES.WOOD;
        }
        if (startX + width - 1 >= 0 && startX + width - 1 < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            world[startX + width - 1][y] = BLOCK_TYPES.WOOD;
        }
    }
    
    // 屋顶
    for (let x = startX; x < startX + width; x++) {
        if (x >= 0 && x < WORLD_WIDTH && startY + height >= 0 && startY + height < WORLD_HEIGHT) {
            world[x][startY + height] = BLOCK_TYPES.WOOD;
        }
    }
    
    // 门（留空）
    if (startX + 2 >= 0 && startX + 2 < WORLD_WIDTH && startY + 1 >= 0 && startY + 1 < WORLD_HEIGHT) {
        world[startX + 2][startY + 1] = BLOCK_TYPES.AIR;
    }
    
    // 内部物品：工作台和箱子
    if (startX + 1 >= 0 && startX + 1 < WORLD_WIDTH && startY + 1 >= 0 && startY + 1 < WORLD_HEIGHT) {
        world[startX + 1][startY + 1] = BLOCK_TYPES.WORKBENCH;
    }
    if (startX + 4 >= 0 && startX + 4 < WORLD_WIDTH && startY + 1 >= 0 && startY + 1 < WORLD_HEIGHT) {
        world[startX + 4][startY + 1] = BLOCK_TYPES.CHEST;
    }
}

// 生成树洞
function generateTreeHole(world, startX, startY) {
    // 生成大树
    const treeHeight = 8 + Math.floor(Math.random() * 4);
    
    // 树干
    for (let y = startY + 1; y <= startY + treeHeight; y++) {
        if (startX >= 0 && startX < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            world[startX][y] = BLOCK_TYPES.WOOD;
        }
    }
    
    // 树叶
    for (let x = startX - 3; x <= startX + 3; x++) {
        for (let y = startY + treeHeight - 2; y <= startY + treeHeight + 2; y++) {
            if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                if (Math.abs(x - startX) + Math.abs(y - (startY + treeHeight)) <= 3) {
                    world[x][y] = BLOCK_TYPES.LEAVES;
                }
            }
        }
    }
    
    // 树洞（在树干中间）
    const holeY = startY + Math.floor(treeHeight / 2);
    if (startX >= 0 && startX < WORLD_WIDTH && holeY >= 0 && holeY < WORLD_HEIGHT) {
        world[startX][holeY] = BLOCK_TYPES.AIR;
        
        // 树洞内的宝箱
        if (holeY + 1 >= 0 && holeY + 1 < WORLD_HEIGHT) {
            world[startX][holeY + 1] = BLOCK_TYPES.CHEST;
        }
    }
}

// 生成枯井
function generateDryWell(world, startX, startY) {
    const depth = 10;
    
    // 井口
    for (let x = startX - 1; x <= startX + 1; x++) {
        for (let y = startY; y <= startY + 1; y++) {
            if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                world[x][y] = BLOCK_TYPES.STONE;
            }
        }
    }
    
    // 井身（向下挖空）
    for (let y = startY + 1; y <= startY + depth; y++) {
        if (startX >= 0 && startX < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            world[startX][y] = BLOCK_TYPES.AIR;
            
            // 井壁
            if (startX - 1 >= 0 && startX - 1 < WORLD_WIDTH) {
                world[startX - 1][y] = BLOCK_TYPES.STONE;
            }
            if (startX + 1 >= 0 && startX + 1 < WORLD_WIDTH) {
                world[startX + 1][y] = BLOCK_TYPES.STONE;
            }
        }
    }
    
    // 井底（通往地下通道）
    const bottomY = startY + depth;
    if (bottomY >= 0 && bottomY < WORLD_HEIGHT) {
        // 横向通道
        for (let x = startX - 3; x <= startX + 3; x++) {
            if (x >= 0 && x < WORLD_WIDTH) {
                world[x][bottomY] = BLOCK_TYPES.AIR;
                if (bottomY + 1 >= 0 && bottomY + 1 < WORLD_HEIGHT) {
                    world[x][bottomY + 1] = BLOCK_TYPES.AIR;
                }
            }
        }
        
        // 通道内的矿物
        for (let i = 0; i < 5; i++) {
            const mineralX = startX - 2 + Math.floor(Math.random() * 5);
            const mineralY = bottomY - 1;
            if (mineralX >= 0 && mineralX < WORLD_WIDTH && mineralY >= 0 && mineralY < WORLD_HEIGHT) {
                world[mineralX][mineralY] = BLOCK_TYPES.IRON_ORE;
            }
        }
    }
}

// 生成动态地形元素（河流、悬崖）
function generateDynamicTerrain(world, biomeMap, layerMap) {
    const terrainFeatures = [];
    
    // 生成河流
    generateRivers(world, biomeMap, layerMap, terrainFeatures);
    
    // 生成悬崖
    generateCliffs(world, biomeMap, layerMap, terrainFeatures);
    
    return terrainFeatures;
}

// 生成河流
function generateRivers(world, biomeMap, layerMap, terrainFeatures) {
    const riverCount = 2;
    
    for (let riverIndex = 0; riverIndex < riverCount; riverIndex++) {
        const startY = 30 + Math.floor(Math.random() * 40); // 河流起始高度
        let currentY = startY;
        
        for (let x = 0; x < WORLD_WIDTH; x++) {
            // 河流蜿蜒
            const yVariation = Math.sin(x * 0.1 + riverIndex * Math.PI) * 3;
            currentY = Math.max(10, Math.min(WORLD_HEIGHT - 10, startY + yVariation));
            
            // 河流宽度（3-5格）
            const riverWidth = 3 + Math.floor(Math.random() * 3);
            
            for (let offset = -Math.floor(riverWidth/2); offset <= Math.floor(riverWidth/2); offset++) {
                const riverY = currentY + offset;
                
                if (x >= 0 && x < WORLD_WIDTH && riverY >= 0 && riverY < WORLD_HEIGHT) {
                    // 清除原有方块，生成水
                    if (layerMap[x][riverY] === 'surface' || layerMap[x][riverY] === 'underground') {
                        world[x][riverY] = BLOCK_TYPES.WATER;
                        
                        // 记录河流特征
                        terrainFeatures.push({
                            type: 'river',
                            x, y: riverY,
                            biome: biomeMap[x][riverY],
                            layer: layerMap[x][riverY]
                        });
                    }
                }
            }
        }
    }
}

// 生成悬崖
function generateCliffs(world, biomeMap, layerMap, terrainFeatures) {
    const cliffCount = 5;
    
    for (let i = 0; i < cliffCount; i++) {
        const cliffX = Math.floor(Math.random() * (WORLD_WIDTH - 20)) + 10;
        const surfaceY = findSurfaceHeight(world, cliffX);
        
        if (surfaceY > 0 && surfaceY < WORLD_HEIGHT - 10) {
            const cliffHeight = 5 + Math.floor(Math.random() * 8);
            
            // 创建悬崖（垂直落差）
            for (let y = surfaceY; y > surfaceY - cliffHeight; y--) {
                if (cliffX >= 0 && cliffX < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                    // 悬崖边缘使用石头
                    world[cliffX][y] = BLOCK_TYPES.STONE;
                    
                    // 记录悬崖特征
                    terrainFeatures.push({
                        type: 'cliff',
                        x: cliffX, y,
                        height: cliffHeight,
                        biome: biomeMap[cliffX][y],
                        layer: layerMap[cliffX][y]
                    });
                }
            }
            
            // 在悬崖另一侧创建平台（需要搭建或使用钩爪）
            const platformX = cliffX + 1;
            const platformY = surfaceY - cliffHeight + 2;
            
            if (platformX >= 0 && platformX < WORLD_WIDTH && platformY >= 0 && platformY < WORLD_HEIGHT) {
                // 平台上的特殊资源
                world[platformX][platformY] = BLOCK_TYPES.GOLD_ORE;
                
                terrainFeatures.push({
                    type: 'cliff_platform',
                    x: platformX, y: platformY,
                    resource: 'gold_ore'
                });
            }
        }
    }
}

// 生成基础地形
function generateBaseTerrain(world, biomeMap, layerMap) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const biome = biomeMap[x][y];
            const layer = layerMap[x][y];
            
            // 根据分层和生物群系生成方块
            if (layer === 'surface') {
                // 地表层 (Y=60~100)
                if (y >= WORLD_HEIGHT - 5) {
                    // 底层生成基岩
                    world[x][y] = BLOCK_TYPES.STONE;
                } else if (y >= WORLD_HEIGHT - 10) {
                    // 根据生物群系生成地表方块
                    if (biome === 'desert') {
                        world[x][y] = BLOCK_TYPES.SAND;
                    } else if (biome === 'forest') {
                        world[x][y] = BLOCK_TYPES.GRASS;
                    } else {
                        world[x][y] = BLOCK_TYPES.GRASS; // 平原
                    }
                } else if (y >= WORLD_HEIGHT - 15) {
                    // 地下层顶部
                    world[x][y] = BLOCK_TYPES.DIRT;
                } else {
                    // 空气
                    world[x][y] = BLOCK_TYPES.AIR;
                }
            } else if (layer === 'underground') {
                // 地下层 (Y=20~60)
                if (Math.random() < 0.1) {
                    // 生成矿物
                    const rand = Math.random();
                    if (rand < 0.6) {
                        world[x][y] = BLOCK_TYPES.COAL;
                    } else if (rand < 0.85) {
                        world[x][y] = BLOCK_TYPES.IRON_ORE;
                    } else {
                        world[x][y] = BLOCK_TYPES.GOLD_ORE;
                    }
                } else {
                    world[x][y] = BLOCK_TYPES.STONE;
                }
            } else if (layer === 'cave') {
                // 洞穴层 (Y=-20~20)
                if (Math.random() < 0.3) {
                    // 洞穴空间
                    world[x][y] = BLOCK_TYPES.AIR;
                } else if (Math.random() < 0.1) {
                    // 稀有矿物
                    world[x][y] = BLOCK_TYPES.REDSTONE;
                } else {
                    world[x][y] = BLOCK_TYPES.STONE;
                }
            } else {
                // 深渊层 (Y<-20)
                if (Math.random() < 0.5) {
                    // 深渊空间
                    world[x][y] = BLOCK_TYPES.AIR;
                } else {
                    // 深渊岩石
                    world[x][y] = BLOCK_TYPES.STONE;
                }
            }
        }
    }
}

// 生成生物群系特色结构
function generateBiomeFeatures(world, biomeMap, layerMap) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const biome = biomeMap[x][y];
            const layer = layerMap[x][y];
            
            if (layer === 'surface' && y < WORLD_HEIGHT - 10) {
                // 平原：生成草丛
                if (biome === 'plains' && Math.random() < 0.05) {
                    if (world[x][y] === BLOCK_TYPES.AIR && 
                        world[x][y+1] === BLOCK_TYPES.GRASS) {
                        world[x][y] = BLOCK_TYPES.BACKGROUND_DECORATION;
                    }
                }
                
                // 森林：生成树木
                if (biome === 'forest' && Math.random() < 0.02) {
                    generateTree(world, x, y - 1);
                }
                
                // 荒漠：生成仙人掌
                if (biome === 'desert' && Math.random() < 0.03) {
                    if (world[x][y] === BLOCK_TYPES.AIR && 
                        world[x][y+1] === BLOCK_TYPES.SAND) {
                        generateCactus(world, x, y);
                    }
                }
            }
        }
    }
}

// 生成树木
function generateTree(world, x, y) {
    const treeHeight = Math.floor(Math.random() * 3) + 4;
    
    // 树干
    for (let j = 0; j < treeHeight; j++) {
        if (y - j >= 0 && y - j < WORLD_HEIGHT) {
            world[x][y - j] = BLOCK_TYPES.WOOD;
        }
    }
    
    // 树叶
    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -3; dy <= 0; dy++) {
            const nx = x + dx;
            const ny = y - treeHeight + dy;
            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                if ((dx !== 0 || dy < 0) && Math.random() < 0.7) {
                    world[nx][ny] = BLOCK_TYPES.LEAVES;
                }
            }
        }
    }
}

// 生成仙人掌
function generateCactus(world, x, y) {
    const cactusHeight = Math.floor(Math.random() * 2) + 3;
    
    for (let j = 0; j < cactusHeight; j++) {
        if (y - j >= 0 && y - j < WORLD_HEIGHT) {
            world[x][y - j] = BLOCK_TYPES.WOOD; // 暂时用木头表示仙人掌
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
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        // 鼠标事件
        canvas.addEventListener('mousedown', (e) => {
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
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // 左键
                playerAnimations.mining = false;
                playerAnimations.miningProgress = 0;
            }
        });
        
        // 鼠标离开画布，取消挖掘
        canvas.addEventListener('mouseleave', () => {
            playerAnimations.mining = false;
            playerAnimations.miningProgress = 0;
        });
        
        // 阻止右键菜单
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
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
    
    // 检测玩家当前所在的分层，应用对应的重力参数
    const playerX = Math.floor(gameState.player.x);
    const playerY = Math.floor(gameState.player.y);
    let currentLayer = 'surface'; // 默认分层
    
    if (playerX >= 0 && playerX < WORLD_WIDTH && playerY >= 0 && playerY < WORLD_HEIGHT) {
        currentLayer = gameState.layerMap[playerX][playerY];
        
        // 根据分层设置重力乘数
        switch (currentLayer) {
            case 'surface':
                gameState.player.gravityMultiplier = 1.0; // 地表正常重力
                break;
            case 'underground':
                gameState.player.gravityMultiplier = 1.0; // 地下正常重力
                break;
            case 'cave':
                gameState.player.gravityMultiplier = 0.9; // 洞穴重力降低10%
                break;
            case 'abyss':
                gameState.player.gravityMultiplier = 1.2; // 深渊重力增加20%
                break;
            default:
                gameState.player.gravityMultiplier = 1.0;
        }
        
        // 更新玩家当前分层信息
        gameState.player.currentLayer = currentLayer;
        
        // 更新玩家当前生物群系信息
        gameState.player.currentBiome = gameState.biomeMap[playerX][playerY];
    }
    
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
    
    // 应用分层重力效果
    gameState.player.ay += 0.2 * gameState.player.gravityMultiplier; // 基础重力
    
    // 更新速度
    gameState.player.vx += gameState.player.ax;
    gameState.player.vy += gameState.player.ay;
    
    // 限制最大速度（考虑重力乘数）
    const adjustedMaxSpeed = maxSpeed * (currentLayer === 'cave' ? 1.1 : 1.0); // 洞穴中移动更快
    if (gameState.player.vx > adjustedMaxSpeed) gameState.player.vx = adjustedMaxSpeed;
    if (gameState.player.vx < -adjustedMaxSpeed) gameState.player.vx = -adjustedMaxSpeed;
    if (gameState.player.vy > adjustedMaxSpeed) gameState.player.vy = adjustedMaxSpeed;
    if (gameState.player.vy < -adjustedMaxSpeed) gameState.player.vy = -adjustedMaxSpeed;
    
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
    
    // 更新HUD显示
    updateHUD();
}

// 更新HUD显示
function updateHUD() {
    const layerElement = document.getElementById('currentLayer');
    const biomeElement = document.getElementById('currentBiome');
    const gravityElement = document.getElementById('gravityInfo');
    
    if (layerElement) {
        layerElement.textContent = getLayerDisplayName(gameState.player.currentLayer);
        layerElement.setAttribute('data-layer', gameState.player.currentLayer);
    }
    
    if (biomeElement) {
        biomeElement.textContent = getBiomeDisplayName(gameState.player.currentBiome);
        biomeElement.setAttribute('data-biome', gameState.player.currentBiome);
    }
    
    if (gravityElement) {
        const gravityLevel = getGravityLevel(gameState.player.gravityMultiplier);
        gravityElement.textContent = gravityLevel;
        gravityElement.setAttribute('data-gravity', gravityLevel.toLowerCase());
    }
}

// 获取分层显示名称
function getLayerDisplayName(layer) {
    switch (layer) {
        case 'surface': return '地表';
        case 'underground': return '地下';
        case 'cave': return '洞穴';
        case 'abyss': return '深渊';
        default: return '未知';
    }
}

// 获取生物群系显示名称
function getBiomeDisplayName(biome) {
    switch (biome) {
        case 'forest': return '森林';
        case 'desert': return '沙漠';
        case 'snow': return '雪地';
        default: return '平原';
    }
}

// 获取重力等级
function getGravityLevel(multiplier) {
    if (multiplier < 0.95) return '低重力';
    if (multiplier > 1.05) return '高重力';
    return '正常重力';
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
            if (y > 0 && gameState.world[y - 1][x] === 0 && gameState.world[y][x] === 1) { // 方块上方为空气
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
            const blockType = gameState.world[y][x];
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
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
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