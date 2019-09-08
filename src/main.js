import { constants } from "./js/constants/constants";
import { Tetris } from "./js/tetris";
import { element } from "./js/element";
import { Color } from "./js/constants/color";

document.addEventListener('DOMContentLoaded', () => {
  const tetris = new Tetris({
    canvas: element.tetrisCanvas,
    rows: constants.ROWS,
    cols: constants.COLS,
    squareSize: constants.SQR_SIZE
  });

  document.addEventListener('keydown', ({key}) => {
    switch (key) {
      case 'ArrowLeft': tetris.moveLeft(); break;
      case 'ArrowRight': tetris.moveRight(); break;
      case 'ArrowDown': tetris.moveDown(); break;
      case ' ': tetris.rotate(); break;
    }
  });

  tetris.on('gameover', () => {
    const tableBody = element.tableBody;
    const scoreTableData = JSON.parse(localStorage.getItem('tetrisScoreTable'));

    let markup = '';
    for (let userName in scoreTableData) if (scoreTableData.hasOwnProperty(userName)) {
      markup += `
        <tr>
          <td>${userName}</td>
          <td>${scoreTableData[userName]}</td>
        </tr>
      `
    }

    tableBody.insertAdjacentHTML('beforeend', markup);

    element.modal.classList.add('open');
  });

  tetris.on('scoreChange', score => {
    element.score.textContent = score;
  });


  tetris.on('nextTetromino', tetromino => {
    const state = tetromino.activeState;
    const rows = state.length;
    const cols = state[0].length;

    const nextTetrominoCanvas = element.nextTetrominoCanvas;
    nextTetrominoCanvas.width = rows * constants.SQR_SIZE;
    nextTetrominoCanvas.height = cols * constants.SQR_SIZE;

    for (let r = 0; r !== rows; ++r) {
      for (let c = 0; c !== cols; ++c) {
        Tetris.prototype.drawSquare.call({
          ctx: nextTetrominoCanvas.getContext('2d'),
          sqrSize: constants.SQR_SIZE
        }, c, r, state[r][c] ? tetromino.color : Color.white);
      }
    }
  })
});
