// Broken Maze - raw HTML/JS/CSS version
// Ported from the original Processing.js version (see archive/original/).

const d = 60;
const quadrantSize = 5;
const qs = quadrantSize * d;
const gridSize = quadrantSize * 2;
const gs = gridSize * d;

let toHoriz = true;
let fromHoriz = true;
let toVert = true;
let fromVert = true;

let currentLevel = 0;
let activeQuad = [0, 0];
let balls = [];
let blocks = [];
const levels = [];

function setSubtitle(text) {
  const subtitle = document.getElementById("subtitle");
  if (!subtitle) {
    return;
  }
  subtitle.textContent = text;
}

function checkActive() {
  return (this.qx === activeQuad[0] && this.qy === activeQuad[1]);
}

function checkWalls() {
  this.canUp = true;
  this.canDown = true;
  this.canLeft = true;
  this.canRight = true;

  this.xBound = this.qx * quadrantSize;
  this.yBound = this.qy * quadrantSize;

  if (this.x <= this.xBound) {
    this.canLeft = false;
  }
  if (this.x >= this.xBound + quadrantSize - 1) {
    this.canRight = false;
  }
  if (this.y <= this.yBound) {
    this.canUp = false;
  }
  if (this.y >= this.yBound + quadrantSize - 1) {
    this.canDown = false;
  }

  const hw = levels[currentLevel].hWalls;
  if (hw) {
    for (let i = 0; i < hw.length; i++) {
      if (this.x === hw[i][0] && this.y === hw[i][1]) {
        this.canUp = false;
      }
      if (this.x === hw[i][0] && this.y === hw[i][1] - 1) {
        this.canDown = false;
      }
    }
  }

  const vw = levels[currentLevel].vWalls;
  if (vw) {
    for (let j = 0; j < vw.length; j++) {
      if (this.x === vw[j][0] && this.y === vw[j][1]) {
        this.canLeft = false;
      }
      if (this.x === vw[j][0] - 1 && this.y === vw[j][1]) {
        this.canRight = false;
      }
    }
  }
}

function Ball(x, y, gx, gy) {
  this.x = x;
  this.y = y;
  this.qx = (this.x < quadrantSize ? 0 : 1);
  this.qy = (this.y < quadrantSize ? 0 : 1);
  this.canUp = true;
  this.canDown = true;
  this.canLeft = true;
  this.canRight = true;
  this.blocksAround = [null, null, null, null];
  this.active = checkActive;
  this.goalX = gx;
  this.goalY = gy;
  this.warnUntil = 0;

  this.qxUpdate = function () {
    this.qx = (this.x < quadrantSize ? 0 : 1);
    this.qy = (this.y < quadrantSize ? 0 : 1);
  };

  this.win = function () {
    return (this.x === this.goalX && this.y === this.goalY);
  };

  this.warn = function () {
    this.warnUntil = performance.now() + 180;
    setTimeout(render, 200);
  };

  this.checkWalls = checkWalls;

  this.checkBlocks = function () {
    this.blocksAround = [null, null, null, null];
    if (blocks) {
      for (let k = 0; k < blocks.length; k++) {
        if (this.x === blocks[k].x && this.y === blocks[k].y + 1) {
          if (!blocks[k].canUp) {
            this.canUp = false;
          }
          this.blocksAround[0] = k;
        }
        if (this.x === blocks[k].x - 1 && this.y === blocks[k].y) {
          if (!blocks[k].canRight) {
            this.canRight = false;
          }
          this.blocksAround[1] = k;
        }
        if (this.x === blocks[k].x && this.y === blocks[k].y - 1) {
          if (!blocks[k].canDown) {
            this.canDown = false;
          }
          this.blocksAround[2] = k;
        }
        if (this.x === blocks[k].x + 1 && this.y === blocks[k].y) {
          if (!blocks[k].canLeft) {
            this.canLeft = false;
          }
          this.blocksAround[3] = k;
        }
      }
    }
  };

  this.move = function (direction) {
    if (direction === "up") {
      this.y--;
      if (this.blocksAround[0] !== null) {
        blocks[this.blocksAround[0]].move("up");
      }
    }
    if (direction === "down") {
      this.y++;
      if (this.blocksAround[2] !== null) {
        blocks[this.blocksAround[2]].move("down");
      }
    }
    if (direction === "left") {
      this.x--;
      if (this.blocksAround[3] !== null) {
        blocks[this.blocksAround[3]].move("left");
      }
    }
    if (direction === "right") {
      this.x++;
      if (this.blocksAround[1] !== null) {
        blocks[this.blocksAround[1]].move("right");
      }
    }
    this.qxUpdate();
  };

  this.parseInput = function (key) {
    if (key === "ArrowUp") {
      if (this.qy === activeQuad[1] && this.canUp && ((this.qy === 0 && fromHoriz) || (this.qy === 1 && toHoriz))) {
        this.move("up");
      } else if (this.qy !== activeQuad[1] && this.canDown && ((this.qy === 0 && toHoriz) || (this.qy === 1 && fromHoriz))) {
        this.move("down");
      }

      if (this.qy === activeQuad[1] && !this.canUp) {
        this.warn();
      }
      if (this.qy !== activeQuad[1] && !this.canDown) {
        this.warn();
      }
    }

    if (key === "ArrowDown") {
      if (this.qy !== activeQuad[1] && this.canUp && ((this.qy === 0 && fromHoriz) || (this.qy === 1 && toHoriz))) {
        this.move("up");
      } else if (this.qy === activeQuad[1] && this.canDown && ((this.qy === 0 && toHoriz) || (this.qy === 1 && fromHoriz))) {
        this.move("down");
      }

      if (this.qy !== activeQuad[1] && !this.canUp) {
        this.warn();
      }
      if (this.qy === activeQuad[1] && !this.canDown) {
        this.warn();
      }
    }

    if (key === "ArrowLeft") {
      if (this.qx === activeQuad[0] && this.canLeft && ((this.qx === 0 && fromVert) || (this.qx === 1 && toVert))) {
        this.move("left");
      } else if (this.qx !== activeQuad[0] && this.canRight && ((this.qx === 0 && toVert) || (this.qx === 1 && fromVert))) {
        this.move("right");
      }
      if (this.qx === activeQuad[0] && !this.canLeft) {
        this.warn();
      }
      if (this.qx !== activeQuad[0] && !this.canRight) {
        this.warn();
      }
    }

    if (key === "ArrowRight") {
      if (this.qx !== activeQuad[0] && this.canLeft && ((this.qx === 0 && fromVert) || (this.qx === 1 && toVert))) {
        this.move("left");
      } else if (this.qx === activeQuad[0] && this.canRight && ((this.qx === 0 && toVert) || (this.qx === 1 && fromVert))) {
        this.move("right");
      }
      if (this.qx !== activeQuad[0] && !this.canLeft) {
        this.warn();
      }
      if (this.qx === activeQuad[0] && !this.canRight) {
        this.warn();
      }
    }
  };

  this.draw = function (board) {
    const goal = document.createElement("div");
    goal.className = "goal";
    goal.style.left = (this.goalX * d + 2) + "px";
    goal.style.top = (this.goalY * d + 2) + "px";
    goal.style.width = (d - 4) + "px";
    goal.style.height = (d - 4) + "px";
    board.appendChild(goal);

    const ball = document.createElement("div");
    ball.className = "ball" + (this.active() ? " active" : "");
    ball.style.left = (this.x * d + d / 6) + "px";
    ball.style.top = (this.y * d + d / 6) + "px";
    ball.setAttribute("data-x", String(this.x));
    ball.setAttribute("data-y", String(this.y));
    board.appendChild(ball);
  };
}

function Block(x, y) {
  this.x = x;
  this.y = y;
  this.qx = (this.x < quadrantSize ? 0 : 1);
  this.qy = (this.y < quadrantSize ? 0 : 1);
  this.active = checkActive;
  this.canUp = true;
  this.canDown = true;
  this.canLeft = true;
  this.canRight = true;
  this.warnUntil = 0;

  this.qxUpdate = function () {
    this.qx = (this.x < quadrantSize ? 0 : 1);
    this.qy = (this.y < quadrantSize ? 0 : 1);
  };

  this.checkWalls = checkWalls;

  this.checkOtherBlocks = function () {
    for (let k = 0; k < blocks.length; k++) {
      if (this.x === blocks[k].x && this.y === blocks[k].y + 1) {
        this.canUp = false;
      }
      if (this.x === blocks[k].x && this.y === blocks[k].y - 1) {
        this.canDown = false;
      }
      if (this.x === blocks[k].x + 1 && this.y === blocks[k].y) {
        this.canLeft = false;
      }
      if (this.x === blocks[k].x - 1 && this.y === blocks[k].y) {
        this.canRight = false;
      }
    }
  };

  this.move = function (direction) {
    if (direction === "up") {
      this.y--;
    }
    if (direction === "down") {
      this.y++;
    }
    if (direction === "left") {
      this.x--;
    }
    if (direction === "right") {
      this.x++;
    }
    this.qxUpdate();
  };

  this.draw = function (board) {
    const block = document.createElement("div");
    block.className = "block" + (this.active() ? " active" : "");
    block.style.left = (this.x * d + 4) + "px";
    block.style.top = (this.y * d + 4) + "px";
    block.setAttribute("data-x", String(this.x));
    block.setAttribute("data-y", String(this.y));
    board.appendChild(block);
  };
}

function Level() {
  this.hWalls = [];
  this.vWalls = [];
  this.blocks = [];
  this.balls = [];

  this.load = function () {
    setSubtitle("Level " + (currentLevel + 1));

    activeQuad = [0, 0];
    balls = [];
    blocks = [];

    const ba = this.balls;
    if (ba) {
      for (let i = 0; i < ba.length; i++) {
        balls[i] = new Ball(ba[i][0], ba[i][1], ba[i][2], ba[i][3]);
      }
    }

    const bl = this.blocks;
    if (bl) {
      for (let k = 0; k < bl.length; k++) {
        blocks[k] = new Block(bl[k][0], bl[k][1]);
      }
    }
    render();
  };

  this.draw = function (board) {
    const hw = this.hWalls;
    if (hw) {
      for (let i = 0; i < hw.length; i++) {
        const wall = document.createElement("div");
        wall.className = "wall wall-h";
        wall.style.left = (hw[i][0] * d) + "px";
        wall.style.top = (hw[i][1] * d - 2) + "px";
        board.appendChild(wall);
      }
    }

    const vw = this.vWalls;
    if (vw) {
      for (let j = 0; j < vw.length; j++) {
        const wall = document.createElement("div");
        wall.className = "wall wall-v";
        wall.style.left = (vw[j][0] * d - 2) + "px";
        wall.style.top = (vw[j][1] * d) + "px";
        board.appendChild(wall);
      }
    }
  };
}

function globalCheck() {
  toHoriz = true;
  fromHoriz = true;
  toVert = true;
  fromVert = true;

  if (blocks) {
    for (let k = 0; k < blocks.length; k++) {
      blocks[k].checkWalls();
      blocks[k].checkOtherBlocks();
    }
  }

  for (let i = 0; i < balls.length; i++) {
    balls[i].checkWalls();
    balls[i].checkBlocks();
  }

  if (!balls[0].canUp || !balls[1].canUp || !balls[2].canDown || !balls[3].canDown) {
    fromHoriz = false;
  }
  if (!balls[0].canDown || !balls[1].canDown || !balls[2].canUp || !balls[3].canUp) {
    toHoriz = false;
  }
  if (!balls[0].canLeft || !balls[1].canRight || !balls[2].canRight || !balls[3].canLeft) {
    fromVert = false;
  }
  if (!balls[0].canRight || !balls[1].canLeft || !balls[2].canLeft || !balls[3].canRight) {
    toVert = false;
  }
}

function render() {
  const board = document.getElementById("board");
  if (!board) {
    return;
  }
  board.innerHTML = "";

  // grid cells
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      const cell = document.createElement("div");
      cell.className = "cell" + ((((i % quadrantSize) + (j % quadrantSize)) % 2 !== 0) ? " alt" : "");
      cell.style.left = (i * d) + "px";
      cell.style.top = (j * d) + "px";
      board.appendChild(cell);
    }
  }

  // quadrant dividers
  const divV = document.createElement("div");
  divV.className = "divider divider-v";
  board.appendChild(divV);
  const divH = document.createElement("div");
  divH.className = "divider divider-h";
  board.appendChild(divH);

  levels[currentLevel].draw(board);

  // goals and balls
  for (let i = 0; i < balls.length; i++) {
    balls[i].draw(board);
  }

  // blocks
  for (let k = 0; k < blocks.length; k++) {
    blocks[k].draw(board);
  }

  // mask
  drawMask(board);

  // warnings
  const now = performance.now();
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].warnUntil > now) {
      const warn = document.createElement("div");
      warn.className = "warn";
      warn.style.left = (balls[i].x * d) + "px";
      warn.style.top = (balls[i].y * d) + "px";
      board.appendChild(warn);
    }
  }
}

function drawMask(board) {
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (i !== activeQuad[0] || j !== activeQuad[1]) {
        const mask = document.createElement("div");
        mask.className = "mask";
        mask.style.left = (i * qs) + "px";
        mask.style.top = (j * qs) + "px";
        mask.style.width = qs + "px";
        mask.style.height = qs + "px";
        board.appendChild(mask);
      }
    }
  }
}

function moveBalls(keyCode) {
  globalCheck();
  for (let i = 0; i < balls.length; i++) {
    balls[i].parseInput(keyCode);
  }
}

function parseInput(key) {
  const lower = (key || "").toLowerCase();

  if (lower === "r") {
    levels[currentLevel].load();
    return;
  }
  if ((lower === "p") && currentLevel > 0) {
    currentLevel--;
    levels[currentLevel].load();
    return;
  }
  if ((lower === "n") && currentLevel < levels.length - 1) {
    currentLevel++;
    levels[currentLevel].load();
    return;
  }

  if ((lower === "a") && activeQuad[0] > 0) {
    activeQuad[0]--;
  } else if ((lower === "d") && activeQuad[0] < 1) {
    activeQuad[0]++;
  } else if ((lower === "w") && activeQuad[1] > 0) {
    activeQuad[1]--;
  } else if ((lower === "s") && activeQuad[1] < 1) {
    activeQuad[1]++;
  } else if (key && key.indexOf("Arrow") === 0) {
    moveBalls(key);
  }
}

function checkWin() {
  for (let i = 0; i < balls.length; i++) {
    if (!balls[i].win()) {
      return false;
    }
  }
  return true;
}

function checkGame() {
  if (checkWin()) {
    if (currentLevel === levels.length - 1) {
      setSubtitle("Complete!!!");
    } else {
      currentLevel++;
      levels[currentLevel].load();
    }
  }
}

// Levels data
function L() { return new Level(); }

levels[0] = L();
levels[0].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[0].hWalls = [[0,2],[1,2],[3,2],[4,2]];

levels[1] = L();
levels[1].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[1].hWalls = [[0,2],[1,2],[2,2],[4,2],[5,3],[6,3],[7,3],[8,3]];

levels[2] = L();
levels[2].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[2].hWalls = [[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[3,2],[4,2],[6,3],[2,6]];
levels[2].vWalls = [[6,2],[3,6]];

levels[3] = L();
levels[3].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[3].hWalls = [[2,1],[3,1],[5,2],[6,2],[7,4],[1,6],[9,9]];
levels[3].vWalls = [[2,1],[2,2],[7,2],[7,3],[1,6],[1,7],[6,5],[6,6]];
levels[3].blocks = [];

levels[4] = L();
levels[4].balls = [[1,1,3,4],[8,0,6,3],[7,8,5,5],[2,9,4,6]];
levels[4].hWalls = [[7,8],[2,3]];
levels[4].vWalls = [[2,1],[2,7],[4,8],[6,5],[7,2],[9,1]];
levels[4].blocks = [];

levels[5] = L();
levels[5].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[5].hWalls = [[0,2],[1,2],[3,2],[4,2]];
levels[5].blocks = [[2,0],[3,0],[2,1]];

levels[6] = L();
levels[6].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[6].hWalls = [[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[3,2],[4,2],[6,3],[2,6]];
levels[6].vWalls = [[6,2],[3,6]];
levels[6].blocks = [[2,1],[1,6]];

levels[7] = L();
levels[7].balls = [[0,0,4,4],[9,0,5,4],[9,9,5,5],[0,9,4,5]];
levels[7].hWalls = [[0,7],[7,3],[7,4],[3,8]];
levels[7].vWalls = [[7,0],[3,7]];
levels[7].blocks = [[1,0],[0,1],[3,3],[1,1],[7,8],[8,7],[5,8],[7,5]];

levels[8] = L();
levels[8].balls = [[4,4,0,0],[5,4,9,0],[5,5,9,9],[4,5,0,9]];
levels[8].hWalls = [[0,7],[7,3],[7,4],[3,8]];
levels[8].vWalls = [[2,1],[2,2],[7,2],[1,6],[1,7],[6,5],[6,6]];
levels[8].blocks = [[3,3],[1,1],[6,1],[7,8],[8,7],[5,8],[7,5],[8,0]];

levels[9] = L();
levels[9].balls = [[1,4,3,4],[8,3,6,3],[7,5,5,5],[2,6,4,6]];
levels[9].hWalls = [];
levels[9].vWalls = [];
levels[9].blocks = [[2,2],[1,8],[2,7],[7,2],[6,8],[4,7],[6,7],[6,5],[8,6]];

// Initialize
levels[currentLevel].load();

// Input
window.addEventListener("keydown", function (e) {
  const key = e.key;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(key)) {
    e.preventDefault();
  }
  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
    moveBalls(key);
    render();
    checkGame();
    render();
    return;
  }
  const lower = key.toLowerCase();
  if (["r","p","n","w","a","s","d"].includes(lower)) {
    parseInput(key);
    checkGame();
    render();
  }
});
