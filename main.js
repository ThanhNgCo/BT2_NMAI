// --- CẤU HÌNH ---
const COLS = 10;
const ROWS = 8;
const CELL_SIZE = 60; // Kích thước mỗi ô (pixel)
const WALL_COLOR = 50;
const EMPTY_COLOR = 255;
const PATH_COLOR = [255, 0, 0]; // Màu đỏ
const VISITED_COLOR = [173, 216, 230]; // Màu xanh nhạt
const START_COLOR = [0, 255, 0]; // Xanh lá
const GOAL_COLOR = [0, 0, 255]; // Xanh dương

// Tọa độ Start (S) và Goal (G) theo đề bài (cột, hàng)
// S tại hàng 3, cột 0 -> x=0, y=3
let startPos = { x: 0, y: 3 }; 
// G tại hàng 3, cột 9 -> x=9, y=3
let endPos = { x: 9, y: 3 };

let grid = []; // Lưu trạng thái bản đồ (0: Tường, 1: Đường)
let animationList = []; // Danh sách các ô sẽ tô màu lần lượt
let finalPath = []; // Đường đi kết quả
let isRunning = false;
let animationIndex = 0;

// --- P5.JS SETUP & DRAW ---

function setup() {
    let canvas = createCanvas(COLS * CELL_SIZE, ROWS * CELL_SIZE);
    canvas.parent('sketch-holder');
    initMap(); // Khởi tạo bản đồ cứng
    noLoop(); // Chỉ vẽ lại khi cần thiết hoặc khi chạy animation
    drawGrid(); // Vẽ tĩnh lần đầu
}

function draw() {
    if (isRunning && animationList.length > 0) {
        // Animation logic: Vẽ từng bước
        // Tăng tốc độ vẽ bằng cách vẽ nhiều ô trong 1 frame nếu cần
        let stepsPerFrame = 1; 
        
        for(let i=0; i<stepsPerFrame; i++){
            if(animationIndex < animationList.length){
                let node = animationList[animationIndex];
                
                // Vẽ ô đang xét (Visited)
                fill(VISITED_COLOR);
                rect(node.x * CELL_SIZE, node.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Vẽ lại S và G đè lên nếu bị che
                drawSpecialNodes();
                drawWalls(); // Vẽ lại tường để không bị đè
                
                animationIndex++;
            } else {
                // Đã vẽ xong các điểm duyệt, giờ vẽ đường đi (Path)
                drawPath();
                isRunning = false;
                noLoop();
                document.getElementById("status").innerText = "Hoàn thành!";
                document.getElementById("cost").innerText = finalPath.length > 0 ? finalPath.length - 1 : "Không tìm thấy";
                break;
            }
        }
    }
}

// Hàm khởi tạo bản đồ với chướng ngại vật cứng (theo đề bài trước)
function initMap() {
    grid = [];
    for (let x = 0; x < COLS; x++) {
        grid[x] = [];
        for (let y = 0; y < ROWS; y++) {
            grid[x][y] = 1; // Mặc định là đường đi
        }
    }

    // Đặt tường (Obstacles) - Chuyển từ logic Python (row, col) sang JS (x=col, y=row)
    // Python: OBSTACLES.extend([(1, c) for c in range(1, 6)]) -> Row 1, Cols 1-5
    addWall(1, 5, 1); // Row 1: x từ 1 đến 5
    
    // Row 2: Cols 4-7
    addWall(4, 7, 2);
    
    // Row 3: Col 7
    addWall(7, 7, 3);
    
    // Row 4: Cols 4-7
    addWall(4, 7, 4);
    
    // Row 5: Cols 1-5
    addWall(1, 5, 5);
}

// Hàm phụ để thêm tường theo dải
function addWall(startX, endX, rowY) {
    for (let x = startX; x <= endX; x++) {
        grid[x][rowY] = 0; // 0 là tường
    }
}

function drawGrid() {
    background(255);
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            stroke(0);
            if (grid[x][y] === 0) {
                fill(WALL_COLOR); // Tường màu đen
            } else {
                fill(EMPTY_COLOR); // Đường màu trắng
            }
            rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
    drawSpecialNodes();
}

function drawSpecialNodes() {
    // Vẽ Start
    fill(START_COLOR);
    rect(startPos.x * CELL_SIZE, startPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("S", startPos.x * CELL_SIZE + CELL_SIZE/2, startPos.y * CELL_SIZE + CELL_SIZE/2);

    // Vẽ Goal
    fill(GOAL_COLOR);
    rect(endPos.x * CELL_SIZE, endPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    fill(255);
    text("G", endPos.x * CELL_SIZE + CELL_SIZE/2, endPos.y * CELL_SIZE + CELL_SIZE/2);
}

function drawWalls(){
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            if (grid[x][y] === 0) {
                fill(WALL_COLOR);
                rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawPath() {
    if (finalPath.length === 0) return;
    
    noFill();
    stroke(PATH_COLOR);
    strokeWeight(5);
    beginShape();
    for (let p of finalPath) {
        // Vẽ đường nối tâm các ô
        vertex(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
    }
    endShape();
    strokeWeight(1); // Reset stroke
}

// --- THUẬT TOÁN A* (Logic chính) ---

class Node {
    constructor(x, y, parent = null) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.g = 0;
        this.f = 0;
    }
}

function heuristic(a, b) {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function runAlgorithm() {
    // Reset trạng thái trước khi chạy
    initMap();
    drawGrid();
    animationList = [];
    finalPath = [];
    animationIndex = 0;
    
    // A* Logic
    let openSet = [];
    let closedSet = []; // Dùng để kiểm tra tránh lặp vô tận
    
    let startNode = new Node(startPos.x, startPos.y);
    startNode.f = heuristic(startPos, endPos);
    openSet.push(startNode);
    
    let found = false;
    let finalNode = null;

    // Chạy toàn bộ thuật toán trong bộ nhớ trước để lấy danh sách vẽ
    while (openSet.length > 0) {
        // 1. Lấy nút có f thấp nhất
        let lowestIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        let current = openSet[lowestIndex];

        // Lưu vào danh sách để animation vẽ sau
        animationList.push({x: current.x, y: current.y});

        // 2. Kiểm tra đích
        if (current.x === endPos.x && current.y === endPos.y) {
            finalNode = current;
            found = true;
            break;
        }

        // Xóa current khỏi OpenSet, thêm vào ClosedSet
        openSet.splice(lowestIndex, 1);
        closedSet.push(current);

        // 3. Duyệt lân cận (4 hướng: Lên, Xuống, Trái, Phải)
        let neighbors = [];
        let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (let d of dirs) {
            let nx = current.x + d[0];
            let ny = current.y + d[1];

            // Kiểm tra biên và tường
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[nx][ny] === 1) {
                neighbors.push(new Node(nx, ny, current));
            }
        }

        for (let neighbor of neighbors) {
            // Nếu đã duyệt qua rồi thì bỏ qua (Graph Search standard)
            if (closedSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                continue;
            }

            let tempG = current.g + 1;
            let existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

            if (!existingNode) {
                neighbor.g = tempG;
                neighbor.f = neighbor.g + heuristic(neighbor, endPos);
                openSet.push(neighbor);
            } else if (tempG < existingNode.g) {
                existingNode.g = tempG;
                existingNode.f = existingNode.g + heuristic(existingNode, endPos);
                existingNode.parent = current;
            }
        }
    }

    // Truy vết đường đi
    if (found) {
        let temp = finalNode;
        while (temp) {
            finalPath.push({x: temp.x, y: temp.y});
            temp = temp.parent;
        }
        finalPath.reverse(); // Đảo ngược để đi từ S đến G
    }

    // Kích hoạt animation
    isRunning = true;
    document.getElementById("status").innerText = "Đang chạy...";
    loop(); // Bắt đầu vòng lặp vẽ của p5.js
}

function resetGrid() {
    initMap();
    drawGrid();
    document.getElementById("status").innerText = "Sẵn sàng";
    document.getElementById("cost").innerText = "0";
    isRunning = false;
    noLoop();
}