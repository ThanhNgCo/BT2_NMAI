var grid = {width: 10, height: 8};

var walls = [
    {x:1,y:1},{x:2,y:1},{x:3,y:1},{x:4,y:1},{x:5,y:1},
    {x:4,y:2},{x:5,y:2},{x:6,y:2},{x:7,y:2},
    {x:7,y:3},
    {x:4,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4},
    {x:1,y:5},{x:2,y:5},{x:3,y:5},{x:4,y:5},{x:5,y:5}
];

function setupFixedMaze(){
    for(var i = 0; i < grid.width; i++){
        grid[i] = [];
        for(var j = 0; j < grid.height; j++){
            grid[i][j] = 1;
        }
    }
    for(var k = 0; k < walls.length; k++){
        grid[walls[k].x][walls[k].y] = 0;
    }
}
//Điểm S và G
var source      = {x: 0, y: 3};
var destination = {x: 9, y: 3};

//Thuật toán A*

function distance(a, b){
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

class ACell {
    constructor(x, y, parent, g){
        this.x = x; this.y = y;
        this.parent = parent;
        this.isConsidered = false;
        this.g = g; this.f = 0;
    }
    evaluateFValue(dest){
        this.f = this.g + Math.abs(this.x - dest.x) + Math.abs(this.y - dest.y);
    }
}

var gridDetail = [];
var openList   = [];
var closeList  = [];
var considered = [];
var cellConsidered = 0;
var result = null;

function initialize(){
    for(var i = 0; i < grid.width; i++){
        var row = [];
        for(var j = 0; j < grid.height; j++){
            row.push(new ACell(i, j, null, 0));
        }
        gridDetail.push(row);
    }
}

function isNode(x, y, node){ return (x === node.x && y === node.y); }
function isWall(x, y){ return (grid[x][y] === 0); }
function isInsideGrid(x, y){ return (x > -1 && x < grid.width && y > -1 && y < grid.height); }

function pathTracing(){
    var tx = gridDetail[destination.x][destination.y].parent.x;
    var ty = gridDetail[destination.x][destination.y].parent.y;
    var path = [{x: destination.x, y: destination.y}];
    while(tx !== source.x || ty !== source.y){
        var p = gridDetail[tx][ty];
        tx = p.parent.x; ty = p.parent.y;
        path.push({x: p.x, y: p.y});
    }
    path.push({x: source.x, y: source.y});
    return path;
}

function samePositionInList(c, list){
    for(var i = 0; i < list.length; i++)
        if(list[i].x == c.x && list[i].y == c.y)
            return {cell: list[i], index: i};
    return null;
}

function insertIntoOpenList(c){
    var i = 0;
    while(i < openList.length && openList[i].f < c.f) i++;
    if(i === openList.length) openList.push(c);
    else openList.splice(i, 0, c);
}

function updateCell(x, y, parent, g){
    gridDetail[x][y].parent = parent;
    gridDetail[x][y].g = g;
    gridDetail[x][y].evaluateFValue(destination);
}

function cost(r){
    var c = 0;
    for(var i = 1; i < r.length; i++) c += distance(r[i], r[i-1]);
    return c;
}

function AStarAlgorithm(){
    initialize();
    insertIntoOpenList(gridDetail[source.x][source.y]);
    while(openList.length > 0){
        var current = openList.shift();
        cellConsidered++;
        gridDetail[current.x][current.y].isConsidered = true;
        if(isNode(current.x, current.y, destination)) return pathTracing();

        var candidate = [
            {x:current.x,   y:current.y-1},
            {x:current.x-1, y:current.y},
            {x:current.x+1, y:current.y},
            {x:current.x,   y:current.y+1},
            {x:current.x-1, y:current.y-1},
            {x:current.x-1, y:current.y+1},
            {x:current.x+1, y:current.y-1},
            {x:current.x+1, y:current.y+1}
        ];

        var neighbors = [];
        for(let i = 0; i < candidate.length; i++){
            if(isInsideGrid(candidate[i].x, candidate[i].y) && !isWall(candidate[i].x, candidate[i].y)){
                neighbors.push(candidate[i]);
                if(!samePositionInList(candidate[i], considered))
                    considered.push({x: candidate[i].x, y: candidate[i].y});
            }
        }

        neighbors.forEach(successor => {
            var scDist = current.g + distance(successor, current);
            var sO = samePositionInList(successor, openList);
            var sC = samePositionInList(successor, closeList);
            if(sO !== null){
                if(sO.cell.g > scDist){
                    updateCell(successor.x, successor.y, current, scDist);
                    openList.splice(sO.index, 1);
                    insertIntoOpenList(gridDetail[successor.x][successor.y]);
                }
            } else if(sC !== null){
                if(sC.cell.g > scDist){
                    updateCell(successor.x, successor.y, current, scDist);
                    closeList.splice(sC.index, 1);
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

var cellWidth  = 40;
var cellHeight = 40;
var indexConsidered = 0;


function drawLabels(){
    strokeWeight(1);
    textSize(18);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);

    // Ô S 
    stroke(0);
    fill(255, 0, 0);
    rect(source.x * cellWidth, source.y * cellHeight, cellWidth, cellHeight);
    noStroke();
    fill(255);
    text("S", source.x * cellWidth + cellWidth/2, source.y * cellHeight + cellHeight/2);

    // Ô G
    stroke(0);
    fill(230, 0, 172);
    rect(destination.x * cellWidth, destination.y * cellHeight, cellWidth, cellHeight);
    noStroke();
    fill(255);
    text("G", destination.x * cellWidth + cellWidth/2, destination.y * cellHeight + cellHeight/2);

    // Luôn khôi phục stroke đen sau khi vẽ xong
    stroke(0);
    strokeWeight(1);
}

var cellColors = [];

function initCellColors(){
    for(var i = 0; i < grid.width; i++){
        cellColors[i] = [];
        for(var j = 0; j < grid.height; j++){
            cellColors[i][j] = null; // null = màu mặc định theo grid
        }
    }
}

function drawFrame(){
    stroke(0);
    strokeWeight(1);
    for(var i = 0; i < grid.width; i++){
        for(var j = 0; j < grid.height; j++){
            if(cellColors[i][j] !== null){
                fill(cellColors[i][j]);
            } else {
                fill(grid[i][j] == 1 ? 255 : 0);
            }
            rect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
        }
    }
    drawLabels();
}

function setup(){
    setupFixedMaze();
    var canvas = createCanvas(grid.width * cellWidth + 1, grid.height * cellHeight + 1);
    canvas.parent('sketch-holder');
    initCellColors();

    result = AStarAlgorithm();
    if(result){
        $("#result").text(result.length);
        $("#considered").text(cellConsidered);
        $("#cost").text(Math.floor(cost(result) * 1000) / 1000);
    } else {
        $("#result").text("Không tìm thấy đường!");
    }

    drawFrame();
    loop();
}

function draw(){
    frameRate(10);
    if(!result){ noLoop(); return; }

    if(considered[indexConsidered]){
        var node = considered[indexConsidered];
        if(!isNode(node.x, node.y, source) && !isNode(node.x, node.y, destination)){
            cellColors[node.x][node.y] = gridDetail[node.x][node.y].isConsidered
                ? color(255, 119, 51)   // cam: đã xét (closed)
                : color(255, 255, 77);  // vàng: đang xét (open)
        }
        indexConsidered++;
    } else {
        // Vẽ đường đi
        var pathToDraw = result.slice(1, result.length - 1);
        for(var i = 0; i < pathToDraw.length; i++){
            cellColors[pathToDraw[i].x][pathToDraw[i].y] = color(0, 255, 0);
        }
        drawFrame();
        noLoop();
        return;
    }

    drawFrame();
}

$("#reload").on("click", function(){
    location.reload();
});
