// 俄罗斯方块游戏逻辑
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const COLORS = [
    '#00FFFF', // I
    '#FFFF00', // O
    '#AA00FF', // T
    '#FFA500', // L
    '#0000FF', // J
    '#00FF00', // S
    '#FF0000'  // Z
];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;
let score = 0;
let gameOver = false;
let timer = null;
let seconds = 0;
let isPaused = false;

function initGame() {
    createBoard();
    spawnPiece();
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('start-tetris-btn').addEventListener('click', startGame);
    document.getElementById('pause-tetris-btn').addEventListener('click', togglePause);
}

function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    gameBoard.style.width = COLS * BLOCK_SIZE + 'px';
    gameBoard.style.height = ROWS * BLOCK_SIZE + 'px';
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${row}-${col}`;
            cell.style.width = BLOCK_SIZE + 'px';
            cell.style.height = BLOCK_SIZE + 'px';
            gameBoard.appendChild(cell);
        }
    }
}

function spawnPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentPiece = {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
        y: 0
    };
    
    if (collision()) {
        gameOver = true;
        clearInterval(timer);
        document.getElementById('message').textContent = '游戏结束！';
    }
}

function draw() {
    // 清除当前绘制
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.getElementById(`cell-${row}-${col}`);
            cell.style.backgroundColor = board[row][col] ? board[row][col] : '';
        }
    }
    
    // 绘制当前方块
    if (currentPiece) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const y = currentPiece.y + row;
                    const x = currentPiece.x + col;
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                        const cell = document.getElementById(`cell-${y}-${x}`);
                        cell.style.backgroundColor = currentPiece.color;
                    }
                }
            }
        }
    }
}

function movePiece(dx, dy) {
    if (gameOver || isPaused) return;
    
    currentPiece.x += dx;
    currentPiece.y += dy;
    
    if (collision()) {
        currentPiece.x -= dx;
        currentPiece.y -= dy;
        
        if (dy === 1) {
            mergePiece();
            clearLines();
            spawnPiece();
        }
    }
    
    draw();
}

function rotatePiece() {
    if (gameOver || isPaused) return;
    
    const originalShape = currentPiece.shape;
    const rows = currentPiece.shape.length;
    const cols = currentPiece.shape[0].length;
    
    // 转置矩阵
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            rotated[col][rows - 1 - row] = currentPiece.shape[row][col];
        }
    }
    
    currentPiece.shape = rotated;
    
    if (collision()) {
        currentPiece.shape = originalShape;
    }
    
    draw();
}

function collision() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const y = currentPiece.y + row;
                const x = currentPiece.x + col;
                
                if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const y = currentPiece.y + row;
                const x = currentPiece.x + col;
                if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                    board[y][x] = currentPiece.color;
                }
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        let isLineComplete = true;
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col]) {
                isLineComplete = false;
                break;
            }
        }
        
        if (isLineComplete) {
            linesCleared++;
            // 移除该行
            board.splice(row, 1);
            // 在顶部添加新行
            board.unshift(Array(COLS).fill(0));
            row++; // 重新检查当前行
        }
    }
    
    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

function updateScore(lines) {
    const points = [0, 40, 100, 300, 1200];
    score += points[lines];
    document.getElementById('tetris-score').textContent = `得分: ${score}`;
}

function handleKeyPress(e) {
    if (gameOver || isPaused) return;
    
    switch (e.keyCode) {
        case 37: // 左箭头
            movePiece(-1, 0);
            break;
        case 39: // 右箭头
            movePiece(1, 0);
            break;
        case 40: // 下箭头
            movePiece(0, 1);
            break;
        case 38: // 上箭头
            rotatePiece();
            break;
        case 32: // 空格
            hardDrop();
            break;
    }
}

function hardDrop() {
    while (!collision()) {
        currentPiece.y++;
    }
    currentPiece.y--;
    mergePiece();
    clearLines();
    spawnPiece();
    draw();
}

function startGame() {
    if (gameOver) {
        resetGame();
    }
    
    if (!timer) {
        timer = setInterval(() => {
            if (!isPaused) {
                movePiece(0, 1);
            }
        }, 1000);
    }
    
    isPaused = false;
    document.getElementById('message').textContent = '';
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('message').textContent = isPaused ? '游戏已暂停' : '';
}

function resetGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    seconds = 0;
    gameOver = false;
    isPaused = false;
    document.getElementById('tetris-score').textContent = '得分: 0';
    document.getElementById('timer').textContent = '用时: 0:00';
    document.getElementById('message').textContent = '';
    clearInterval(timer);
    timer = null;
    createBoard();
    spawnPiece();
    draw();
}

// 初始化游戏
window.onload = initGame;