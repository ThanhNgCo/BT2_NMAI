var grid = {width: 10, height: 8};
var markTable = [];

function gridInitialize(){
    for(var i = 0 ; i < grid.width ; i ++){
        var row = [];
        var mark = [];
        for(var j = 0 ; j < grid.height ; j ++){
            row.push(1); // Mặc định là đường đi (1)
            mark.push(false);
        }
        grid[i] = row;
        markTable.push(mark);
    }
    
    // Tự tạo vật cản (0 là tường)
    grid[4][2] = 0;
    grid[4][3] = 0;
    grid[4][4] = 0;
    grid[4][5] = 0;
}

// Bỏ mazeGenerating cũ, thay bằng init đơn giản
function simpleGridInit(){
    gridInitialize();
}

function isInsideGrid(x, y){
    return (x > -1 && x < grid.width && y > -1 && y < grid.height);
}

class cell{
    constructor(x, y, parent, g){
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.isConsidered = false;
        this.g = g;
    }

    evaluateFValue(destination, source){
        // Cố định hàm Manhattan (heuristic4)
        this.f = this.g + Math.abs(this.x - destination.x) + Math.abs(this.y - destination.y);
    }
}

var gridDetail = [];
var openList = [];
var closeList = [];

var source = {x: 0, y: 0}; // Điểm đầu cố định
var destination = {x: 9, y: 7}; // Điểm cuối cố định

var considered = [];
var cellConsidered = 0;
var result = null;

function initialize(){
    gridDetail = [];
    for(var i = 0 ; i < grid.width ; i ++){
        var row = []
        for(var j = 0 ; j < grid.height ; j ++){
            var cellDetail = new cell(i, j, null, null);
            row.push(cellDetail)
        }
        gridDetail.push(row);
    }
}

function isNode(x, y, node){
    return (x === node.x && y === node.y);
}

function isWall(x, y){
    return (grid[x][y] === 0);
}

function pathTracing(){
    var temp_x = gridDetail[destination.x][destination.y].parent.x;
    var temp_y = gridDetail[destination.x][destination.y].parent.y;
    var path = [];
    path.push({x: destination.x, y: destination.y});
    while(temp_x !== source.x || temp_y !== source.y){
        var parent = gridDetail[temp_x][temp_y];
        temp_x = parent.parent.x;
        temp_y = parent.parent.y;
        path.push({x: parent.x, y: parent.y});
    }
    path.push({x: source.x, y: source.y});
    return path;
}

function samePositionInList(cell, list){
    for(var i = 0 ; i < list.length ; i ++){
        if(list[i].x == cell.x && list[i].y == cell.y) return {cell:list[i], index:i};
    }
    return null;
}

function insertIntoOpenList(cell){
    var i = 0;
    while(i < openList.length && openList[i].f < cell.f) i ++;
    if(i === openList.length) openList.push(cell);
    else openList.splice(i, 0, cell);
}

function updateOpenList(index, cell){
    openList.splice(index, 1);
    insertIntoOpenList(cell);
}

function updateCell(x, y, parent, g){
    gridDetail[x][y].parent = parent;
    gridDetail[x][y].g = g;
    gridDetail[x][y].evaluateFValue(destination, source);
}

function cost(result){
    var c = 0;
    for(var i = 1 ; i < result.length ; i ++){
        c += Math.sqrt((result[i].x - result[i-1].x)**2 + (result[i].y - result[i-1].y)**2);
    }
    return c;
}

function AStarAlgorithm(){
    initialize();
    insertIntoOpenList(gridDetail[source.x][source.y]);
    while(openList.length > 0){
        var current = openList.shift();
        cellConsidered ++;
        gridDetail[current.x][current.y].isConsidered = true;
        if(isNode(current.x, current.y, destination)) return pathTracing();

        // Mặc định cho phép đi chéo
        var candidate = [
            {x:current.x, y:current.y - 1}, {x:current.x - 1, y:current.y}, 
            {x:current.x + 1, y:current.y}, {x:current.x, y:current.y + 1},
            {x:current.x - 1, y:current.y - 1}, {x:current.x - 1, y:current.y + 1},
            {x:current.x + 1, y:current.y - 1}, {x:current.x + 1, y:current.y + 1}
        ];

        var neighbors = [];
        for(let i = 0 ; i < candidate.length ; i ++){
            if(isInsideGrid(candidate[i].x, candidate[i].y) && !isWall(candidate[i].x, candidate[i].y)){
                neighbors.push(candidate[i]);
                if(!samePositionInList(candidate[i], considered)) considered.push({x : candidate[i].x, y : candidate[i].y});
            }
        }

        neighbors.forEach(successor => {
            var d = Math.sqrt((successor.x - current.x)**2 + (successor.y - current.y)**2);
            var scDist = current.g + d;
            var samePositionO = samePositionInList(successor, openList);
            var samePositionC = samePositionInList(successor, closeList);

            if(samePositionO !== null){
                if(samePositionO.cell.g > scDist){
                    updateCell(successor.x, successor.y, current, scDist);
                    updateOpenList(samePositionO.index, gridDetail[successor.x][successor.y]);
                }
            } else if(samePositionC !== null){
                if(samePositionC.cell.g > scDist){
                    updateCell(successor.x, successor.y, current, scDist);
                    closeList.splice(samePositionC.index, 1);
                    insertIntoOpenList(gridDetail[successor.x][successor.y]);
                }
            } else {
                updateCell(successor.x, successor.y, current, scDist);
                insertIntoOpenList(gridDetail[successor.x][successor.y]);
            }
        });
        closeList.push(current);
    }
    return null;
}

// UI & P5
var cellWidth = 50; // Tăng kích thước ô cho dễ nhìn vì lưới nhỏ
var cellHeight = 50;

function setup(){
    simpleGridInit();
    var canvas = createCanvas(grid.width * cellWidth + 1, grid.height * cellHeight + 1);
    canvas.parent('sketch-holder');
    
    result = AStarAlgorithm();
    $("#result").text(result ? result.length : 0);
    $("#considered").text(cellConsidered);
    $("#cost").text(result ? Math.floor(cost(result) * 1000) / 1000 : 0);
}

var indexConsidered = 0;
function draw(){
    frameRate(10); 
    // Vẽ lưới cơ bản
    for(var i = 0 ; i < grid.width ; i ++){
        for(var j = 0 ; j < grid.height ; j ++){
            fill(grid[i][j] == 1 ? 255 : 0);
            rect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
        }
    }

    // Vẽ quá trình xét duyệt
    for(var k=0; k < indexConsidered; k++){
        if(considered[k]){
            var node = considered[k];
            if(!isNode(node.x, node.y, source) && !isNode(node.x, node.y, destination)){
                fill(gridDetail[node.x][node.y].isConsidered ? [255, 119, 51] : [255, 255, 77]);
                rect(node.x * cellWidth, node.y * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    if(indexConsidered < considered.length){
        indexConsidered++;
    } else if(result) {
        // Vẽ đường đi cuối cùng
        for(var i = 0 ; i < result.length ; i ++){
            if(!isNode(result[i].x, result[i].y, source) && !isNode(result[i].x, result[i].y, destination)){
                fill(0, 255, 0);
                rect(result[i].x * cellWidth, result[i].y * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    // Vẽ Source và Destination
    fill(255, 0, 0);
    rect(source.x * cellWidth, source.y * cellHeight, cellWidth, cellHeight);
    fill(230, 0, 172);
    rect(destination.x * cellWidth, destination.y * cellHeight, cellWidth, cellHeight);
}

$("#reload").on("click", function(){ location.reload(); });
