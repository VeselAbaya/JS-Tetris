import { TetrominoStates } from "./tetrominoStates";
import { Color } from "../constants/color";

export class Tetromino {
  /**
   * @typedef {'I' | 'O' | 'T' | 'J' | 'L' | 'S' | 'Z'} TetrominoName
   * @param {TetrominoName} name
   * @param {Color} color
   */
  constructor(name, color) {
    /** @type {string} */ this.name = name.toUpperCase();
    /** @type {Color} */ this.color = color;

    /** @type {Array<TetrominoState>} */ this.states = TetrominoStates[this.name];
    /** @type {number} */ this.activeStateIndex = 0;
    /** @type {number} */ this.boardX = 0;
    /** @type {number} */ this.boardY = -2;
  }

  /**
   * @returns {TetrominoState} - Active state
   */
  get activeState() {
    return this.states[this.activeStateIndex];
  }

  moveDown() {
    ++this.boardY;
  }

  moveRight() {
    ++this.boardX;
  }

  moveLeft() {
    --this.boardX;
  }

  rotate() {
    this.activeStateIndex = ++this.activeStateIndex % this.states.length;
  }
}
