let size;
let pieces = [];
let board = [];
let Piece;
let mousePositionOnClick = new Array(2).fill(0);
let clickedPieceIndex = new Array(2).fill(-1);
let imageSetting;
let character;
let queueGif;
let moves = [];
let animation = {
  piece: -1,
  start: [0, 0],
  end: [0, 0],
  pos: 0,
  path: []
};

// connectivity
let port = 19280;
let ipv4 = "111.111.1.111";
let socket = io(`http://${ipv4}:${port}`);
// start match
socket.on('startMatch', (data) => {

  if (socket.id == data.white) {
    character = 'white';
    board = data.board;
  } else {
    character = 'black';
    board = data.board.reverse();
  }

  console.log("you are playing as " + character);
});

socket.on('chessMove', (data) => {
  board = data.board;
  moves = data.moves;
  let move = strToMove(moves[moves.length - 1]);

  // animation
  animateMove(move.piece, move.oldIndex, move.newIndex);

  // reset variables
  clickedPieceIndex.fill(-1);
})

function preload() {
  // queue gif
  queueGif = loadImage("https://c.tenor.com/EHDW7RwsUk0AAAAC/just-a-second-please-eric-cartman.gif");

  // load white pieces
  pieces.push(loadImage("https://i.imgur.com/5aAQo9B.png")); // pawn
  pieces.push(loadImage("https://i.imgur.com/Ogp0HUg.png")); // bishop
  pieces.push(loadImage("https://i.imgur.com/oNQGgMN.png")); // knight
  pieces.push(loadImage("https://i.imgur.com/AGjBZ8z.png")); // rook
  pieces.push(loadImage("https://i.imgur.com/aEHn0os.png")); // queen
  pieces.push(loadImage("https://i.imgur.com/8kjIzyd.png")); // king
  
  // load black pieces
  pieces.push(loadImage("https://i.imgur.com/IUHGYCI.png")); // pawn
  pieces.push(loadImage("https://i.imgur.com/yE35P0i.png")); // bishop
  pieces.push(loadImage("https://i.imgur.com/qicpw7C.png")); // knight
  pieces.push(loadImage("https://i.imgur.com/p9JXeQp.png")); // rook
  pieces.push(loadImage("https://i.imgur.com/rR3SSLj.png")); // queen
  pieces.push(loadImage("https://i.imgur.com/IDq7IiT.png")); // king
}

function setup() {
  size = windowHeight - 120;
  createCanvas(size, size);

  Piece = {
    P: 0,
    B: 1,
    N: 2,
    R: 3,
    Q: 4,
    K: 5,
    p: 6,
    b: 7,
    n: 8,
    r: 9,
    q: 10,
    k: 11
  };
  imageSetting = {
    centered: "Centered",
    mousePoint: "Mouse Point"
  };
}

function draw() {
  if (gameIsLive()) {
    background('#eeeed2');

    // draw board
    fill('#018786'); // cf6679 - nice variant
    rectMode(CORNER);
    noStroke();

    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let x = i; if (j % 2 == 1) x -= 1;
        if (i % 2 == 1) {
          rect(x * (size / 8), j * (size / 8), size / 8);
        }
      }
    }

    // highlight selected piece
    if (clickedPieceIndex[0] != -1) { // if a piece is selected
      paintSquare(clickedPieceIndex[0], clickedPieceIndex[1], 'rgba(0, 255, 200, 0.5)');
    }

    // highlight previous move
    highlightPreviousMove();

    // display pieces on board
    displayPieces(board);

    // dragging pieces
  if (mouseIsPressed) {
    if (mousePositionOnClick[0] != 0 && mousePositionOnClick[1] != 0 && clickedPieceIndex[0] != -1) {
      displayPiece(board[clickedPieceIndex[1]][clickedPieceIndex[0]], mouseX, mouseY, imageSetting.mousePoint);
    }
  }

  // CURSOR
  if (verifyBoundaries() && board[getIndexOnMouse()[1]][getIndexOnMouse()[0]] != -1) {
    cursor('grab');
  } else {
    cursor(ARROW);
  }

  } else {
    imageMode(CENTER);
    image(queueGif, size / 2, size / 2);
  }
}

function displayPiece(piece, posX, posY, setting) {
  if (piece == -1)
    return;

  imageMode(CENTER);
  let x; let y;

  if (setting == imageSetting.centered) {
    x = posX * (size / 8) + (size / 16);
    y = posY * (size / 8) + (size / 16);
  } else if (setting == imageSetting.mousePoint) {
    x = posX; y = posY;
  }

  image(pieces[piece], x, y, size / 8 - 5, size / 8 - 5);
}

function displayPieces(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i == clickedPieceIndex[0] && j == clickedPieceIndex[1] && mouseIsPressed) { // ignore dragged piece
        continue;
      }
      displayPiece(matrix[j][i], i, j, imageSetting.centered);
    }
  }
}

function verifyBoundaries() {
  return !(mouseX < 0 || mouseX > size || mouseY < 0 || mouseY > size);
}

function getIndexOnMouse() {
  let x = Math.floor(mouseX / (size / 8));
  let y = Math.floor(mouseY / (size / 8));

  return [x, y];
}

function mousePressed() {
  if (gameIsLive() && verifyBoundaries()) {
    let indexX = getIndexOnMouse()[0]; let indexY = getIndexOnMouse()[1];
    mousePositionOnClick[0] = mouseX; mousePositionOnClick[1] = mouseY;

    // deselect piece
    if (indexX == clickedPieceIndex[0] && indexY == clickedPieceIndex[1]) {
      clickedPieceIndex = [-1, -1];
      return;
    }  
    // request move
    else if (clickedPieceIndex[0] != -1) {
      requestMove(board[clickedPieceIndex[1]][clickedPieceIndex[0]], clickedPieceIndex, [indexY, indexX]);
      clickedPieceIndex = [-1, -1];
    }

    if (board[indexY][indexX] != -1) {
      // get clicked piece information (piece, pos)
      clickedPieceIndex[0] = indexX; clickedPieceIndex[1] = indexY;
    }
  }
}

function mouseReleased() {
  if (gameIsLive()) {
    if (verifyBoundaries()) {
      let piece;
      if (clickedPieceIndex[0] != -1) {
        piece = board[clickedPieceIndex[1]][clickedPieceIndex[0]];
        let pos = [getIndexOnMouse()[1], getIndexOnMouse()[0]];
        
        requestMove(piece, clickedPieceIndex, pos);
      }
    }
  }
}

function moveToStr(piece, oldIndex, newIndex) {
  let move = "";
  move += piece.toString() + "/" + oldIndex[1].toString() + "/" + oldIndex[0].toString() + "/";
  if (board[newIndex[0]][newIndex[1]] != -1)
    move += 'x' + "/" + board[newIndex[0]][newIndex[1]].toString() + "/";
  else 
    move += '-' + "/";
  move += newIndex[0].toString() + "/" + newIndex[1].toString();

  return move;
}

function strToMove(str) {
  let move = {
    piece: -1,
    oldIndex: [],
    newIndex: [],
    eatMove: false,
    eatenPiece: -1
  };
   // example str = 4/7/3/x/11/0/4
  let spaces = 0;
  if (str[1] != '/') {
    move.piece = parseInt(str[0] + str[1]);
    spaces++;
  } else {
    move.piece = parseInt(str[0]);
  }
  move.oldIndex = [parseInt(str[2 + spaces]), parseInt(str[4 + spaces])];
  if (str[6 + spaces] == 'x') { // if eat move
    move.eatMove = true;
  }
  if (move.eatMove) {
    if (str[9 + spaces] != '/') {
      move.eatenPiece = parseInt(str[8 + spaces] + str[9 + spaces]);
      spaces++;
    } else {
      move.eatenPiece = parseInt(str[8 + spaces]);
    }

    move.newIndex = [parseInt(str[10 + spaces]), parseInt(str[12 + spaces])];
  } else {
    move.newIndex = [parseInt(str[8 + spaces]), parseInt(str[10 + spaces])];
  }

  return move;
}

function requestMove(piece, oldIndex, newIndex) {
  // save move as phrase
  let move = moveToStr(piece, oldIndex, newIndex);

  // report to server
  socket.emit('requestMove', move);
}

function gameIsLive() {
  return board.length > 0;
}

function highlightPreviousMove() {
  if (moves.length == 0) {
    return;
  }

  let move = strToMove(moves[moves.length - 1]);

  if ((move.piece < 6 && character == 'black') || (move.piece > 5 && character == 'white')) {
    move = getFlippedMove(move);
  }

  paintSquare(move.oldIndex[1], move.oldIndex[0], 'rgba(240,230,140, 0.5)');
  paintSquare(move.newIndex[1], move.newIndex[0], 'rgba(240,230,140, 0.5)');
}

function getFlippedMove(move) {
  let flipped = move;
  flipped.oldIndex[0] = 7 - flipped.oldIndex[0];
  flipped.newIndex[0] = 7 - flipped.newIndex[0];

  return flipped;
}

function paintSquare(x, y, color) {
  fill(color);

  rect(x * (size / 8), y * (size / 8), size / 8);
}

function animateMove(piece, startIndex, endIndex) {
  let startX = (startIndex[1] + 1) * (size / 8) - (size / 16);
  let startY = (startIndex[0] + 1) * (size / 8) - (size / 16);
  
  let endX = (endIndex[1] + 1) * (size / 8) - (size / 16);
  let endY = (endIndex[0] + 1) * (size / 8) - (size / 16);

  // create path


  animation.piece = piece;
  animation.start = [startY, startX];
  animation.end = [endY, endX];
  animation.pos = 0;
  
}