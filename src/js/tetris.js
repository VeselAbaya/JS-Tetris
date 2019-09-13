import { Color } from "./constants/color";
import { Tetromino } from "./tetromino/tetromino";
import { TetrominoType } from "./tetromino/tetrominoType";
import { EventEmitter } from "events";
import { updateScoreTable } from "./updateScoreTable";

/**
 * @emits Tetris#gameover
 * @emits Tetris#scoreChange
 * @emits Tetris#nextTetromino
 */
export class Tetris extends EventEmitter {
  /**
   * @param {HTMLCanvasElement} opts.canvas
   * @param {number} opts.rows
   * @param {number} opts.cols
   * @param {number} opts.squareSize - Size of one cell in px
   */
  constructor(opts) {
    super();
    /** @type {HTMLCanvasElement} */ this.canvas = opts.canvas;
    /** @type {number} */ this.rows = opts.rows;
    /** @type {number} */ this.cols = opts.cols;
    /** @type {number} */ this.sqrSize = opts.squareSize;

    /** @type {CanvasRenderingContext2D} */ this.ctx = this.canvas.getContext('2d');

    /** @type {number | null} */ this.timerId = null;
    /** @type {boolean} */ this.gameOver = false;
    /** @type {number} */ this.stepDurationMs = 1000;
    /** @type {number} */ this.score = 0;

    /**
     * @type {Array<Array<Color>>}
     * @description board[row][col] !== white only when some tetromino locked on that position
     * */
    this.board = new Array(this.rows);

    // creating the board
    for (let r = 0; r !== this.rows; ++r) {
      this.board[r] = new Array(this.cols).fill(Color.white);
      for (let c = 0; c !== this.cols; ++c) {
        this.drawSquare(c, r, Color.white);
      }
    }
  }

  start() {
    /** @type {Tetromino} */ this.activeTetromino = this.genRandomTetromino();
    /** @type {Tetromino} */ this.nextTetromino = this.genRandomTetromino();
    this.emit('nextTetromino', this.nextTetromino);
    this.drawTetromino(this.activeTetromino);
    this.startFalling(this.activeTetromino);
  }

  genRandomTetromino() {
    const tetrominoTypes = Object.keys(TetrominoType);
    const colors = Object.keys(Color).filter(color => color !== Color.black && color !== Color.white);

    const newTetromino = new Tetromino(
      tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)],
      colors[Math.floor(Math.random() * colors.length)]
    );

    if (newTetromino.name !== TetrominoType.O) {
      newTetromino.activeStateIndex = Math.floor(Math.random() * 4);
    }

    newTetromino.boardX = Math.floor(this.cols/2 - newTetromino.activeState.length/2);
    return newTetromino;
  }

  /**
   * @description Draws square on specific board-coordinates position
   * @param {number} boardX - Board-coordinates x-position
   * @param {number} boardY - Board-coordinates y-position
   * @param {Color} color
   */
  drawSquare(boardX, boardY, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(boardX * this.sqrSize, boardY * this.sqrSize, this.sqrSize, this.sqrSize);

    this.ctx.strokeStyle = Color.black;
    this.ctx.strokeRect(boardX * this.sqrSize, boardY * this.sqrSize, this.sqrSize, this.sqrSize);
  }

  /** @param {Tetromino} tetromino */
  drawTetromino(tetromino) {
    const tetrominoState = tetromino.activeState;

    for (let r = 0; r !== tetrominoState.length; ++r) {
      for (let c = 0; c !== tetrominoState.length; ++c) {
        if (tetrominoState[r][c]) {
          this.drawSquare(tetromino.boardX + c, tetromino.boardY + r, tetromino.color);
        }
      }
    }
  }

  /** @param {Tetromino} tetromino */
  undrawTetramino(tetromino) {
    const tetrominoState = tetromino.activeState;

    for (let r = 0; r !== tetrominoState.length; ++r) {
      for (let c = 0; c !== tetrominoState.length; ++c) {
        if (tetrominoState[r][c]) {
          this.drawSquare(tetromino.boardX + c, tetromino.boardY + r, Color.white);
        }
      }
    }
  }

  incrementScore() {
    this.score += 1;
    this.emit('scoreChange', this.score);
    if (this.stepDurationMs !== 200) {
      this.stepDurationMs -= 10;
    }
  }

  /** @param {Tetromino} tetromino */
  lockTetromino(tetromino) {
    const tetrominoState = tetromino.activeState;

    for (let r = 0; r !== tetrominoState.length; ++r) {
      for (let c = 0; c !== tetrominoState.length; ++c) {
        if (tetrominoState[r][c]) {
          if (tetromino.boardY + r < 0) {
            const userName = prompt(
              `Game Over. Your final score: ${this.score}. Input your name`,
              'last-user'
            ) || 'last-user';

            updateScoreTable(userName, this.score);

            clearInterval(this.timerId);
            this.gameOver = true;
            this.emit('gameover');
            return;
          }

          this.board[tetromino.boardY + r][tetromino.boardX + c] = tetromino.color;
        }
      }
    }

    // remove full rows
    for (let r = 0; r !== this.rows; ++r) {
      if (this.board[r].every(color => color !== Color.white)) {
        this.incrementScore();

        // move down all higher rows
        for (let y = r; y > 1; --y) {
          for (let c = 0; c !== this.cols; ++c) {
            this.board[y][c] = this.board[y-1][c];
          }
        }

        // top board hasn't higher row, so make it empty
        this.board[0] = new Array(this.cols).fill(Color.white);
        
        // redraw the board
        this.board.forEach((row, boardY)=> {
          row.forEach((color, boardX) => {
            this.drawSquare(boardX, boardY, color);
          })
        });
      }
    }

    clearInterval(this.timerId);
  }

  /**
   * @param {number} deltaX - difference between current x and future x
   * @param {number} deltaY - difference between current y and future y
   * @param {Tetromino} tetromino
   * @returns {boolean} - true if there collision
   */
  collision(deltaX, deltaY, tetromino) {
    const tetrominoState = tetromino.activeState;

    for (let r = 0; r !== tetrominoState.length; ++r) {
      for (let c = 0; c !== tetrominoState.length; ++c) {
        if (tetrominoState[r][c]) {
          const newX = tetromino.boardX + c + deltaX;
          const newY = tetromino.boardY + r + deltaY;

          // wall collision
          if (newX < 0 || newX >= this.cols || newY >= this.rows) {
            return true;
          }

          // is there already an another tetromino
          if (newY >= 0 && this.board[newY][newX] !== Color.white) {
            return true;
          }
        }
      }
    }

    return false;
  }

  moveDown() {
    if (!this.collision(0, 1, this.activeTetromino)) {
      this.undrawTetramino(this.activeTetromino);
      this.activeTetromino.moveDown();

      clearInterval(this.timerId);
      this.startFalling(this.activeTetromino);

      this.drawTetromino(this.activeTetromino);
    }
    else {
      this.lockTetromino(this.activeTetromino);

      if (!this.gameOver) {
        clearInterval(this.timerId);

        this.activeTetromino = this.nextTetromino;
        this.drawTetromino(this.activeTetromino);
        this.startFalling(this.activeTetromino);

        this.nextTetromino = this.genRandomTetromino();
        this.emit('nextTetromino', this.nextTetromino);
      }
    }
  }

  moveRight() {
    if (!this.collision(1, 0, this.activeTetromino)) {
      this.undrawTetramino(this.activeTetromino);
      this.activeTetromino.moveRight();
      this.drawTetromino(this.activeTetromino);
    }
  }

  moveLeft() {
    if (!this.collision(-1, 0, this.activeTetromino)) {
      this.undrawTetramino(this.activeTetromino);
      this.activeTetromino.moveLeft();
      this.drawTetromino(this.activeTetromino);
    }
  }

  rotate() {
    const copyTetromino = Object.assign(Object.create(Tetromino.prototype), this.activeTetromino);
    copyTetromino.rotate();

    if (this.collision(0, 0, copyTetromino)) {
      if (copyTetromino.boardX < this.cols / 2) {
        copyTetromino.boardX += 1;
      }
      else if (copyTetromino.boardX > this.cols / 2) {
        copyTetromino.boardX -= 1;
      }

      // if we go out of the bottom border
      if (copyTetromino.boardY + copyTetromino.activeState.length > this.rows) {
        copyTetromino.boardY = this.rows - copyTetromino.activeState.length;
      }
    }

    if (!this.collision(0, 0, copyTetromino)) {
      this.undrawTetramino(this.activeTetromino);
      this.activeTetromino = copyTetromino;
      this.drawTetromino(this.activeTetromino);
    }
  }

  /**
   * Tetromino starts falling down
   * @param {Tetromino} tetromino
   */
  startFalling(tetromino) {
    this.timerId = setInterval(() => {
      this.moveDown();
    }, this.stepDurationMs);
  }
}
