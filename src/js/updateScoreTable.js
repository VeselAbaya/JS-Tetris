export const updateScoreTable = (userName, score) => {
  if (!localStorage.getItem('tetrisScoreTable')) {
    localStorage.setItem('tetrisScoreTable', '{}');
  }

  const scoreTable = JSON.parse(localStorage.getItem('tetrisScoreTable'));

  scoreTable[userName] = score;
  localStorage.setItem('tetrisScoreTable', JSON.stringify(scoreTable));
};
