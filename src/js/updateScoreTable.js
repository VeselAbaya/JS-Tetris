export const updateScoreTable = (userName, score) => {
  let scoreTable = JSON.parse(localStorage.getItem('tetrisScoreTable'));
  if (!scoreTable) {
    localStorage.setItem('tetrisScoreTable', '{}');
    scoreTable = {};
  }

  scoreTable[userName] = score;
  localStorage.setItem('tetrisScoreTable', JSON.stringify(scoreTable));
};
