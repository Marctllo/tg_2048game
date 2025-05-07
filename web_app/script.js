
document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  if (tg && tg.expand) tg.expand();

  const boardSize = 4;
  let board = [];
  let score = 0;
  let bonusGrid = {};
  let pendingDelete = false;
  let timerInterval;
  let remainingTime = 120;
  let bonusMultiplier = 1;

  const gameBoard = document.getElementById("game-board");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const restartBtn = document.getElementById("restart-button");
  const bonusUI = document.getElementById("bonus-container");

  const bonusSpawnChance = 0.1;
  const bonusTypes = ["multiplier", "delete", "extraTime"];

  let touchStartX = null;
  let touchStartY = null;

  function getTileColor(val) {
    if (val === 0) return "#cdc1b4";
    const lvl = Math.log2(val);
    const ratio = Math.min((lvl - 1) / 10, 1);
    return `rgb(${Math.floor(200 + ratio * 55)}, ${Math.floor(200 - ratio * 100)}, ${Math.floor(200 - ratio * 100)})`;
  }

  function initBoard() {
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
    bonusGrid = {};
    gameBoard.innerHTML = '';
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const tile = document.createElement('div');
        tile.id = `tile-${i}-${j}`;
        tile.className = 'tile';
        tile.addEventListener('click', () => onTileClick(i, j));
        gameBoard.appendChild(tile);
      }
    }
  }

  function spawnNumberTile() {
    const empty = [];
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === 0 && !bonusGrid[`${i}-${j}`]) empty.push({ i, j });
      }
    }
    if (!empty.length) return;
    const { i, j } = empty[Math.floor(Math.random() * empty.length)];
    board[i][j] = Math.random() < 0.9 ? 2 : 4;
  }

  function spawnBonusTile() {
    const empty = [];
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === 0 && !bonusGrid[`${i}-${j}`]) empty.push({ i, j });
      }
    }
    if (!empty.length) return;
    const { i, j } = empty[Math.floor(Math.random() * empty.length)];
    const type = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
    bonusGrid[`${i}-${j}`] = { type };
  }

  function bonusIcon(type) {
    if (type === 'multiplier') return '×2';
    if (type === 'delete') return '✕';
    if (type === 'extraTime') return '+⏱';
    return '';
  }

  function updateBoard() {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const tile = document.getElementById(`tile-${i}-${j}`);
        const key = `${i}-${j}`;
        if (board[i][j] !== 0) {
          tile.textContent = board[i][j];
          tile.style.backgroundColor = getTileColor(board[i][j]);
        } else if (bonusGrid[key]) {
          tile.textContent = bonusIcon(bonusGrid[key].type);
          tile.style.backgroundColor = '#f9cb22';
        } else {
          tile.textContent = '';
          tile.style.backgroundColor = getTileColor(0);
        }
      }
    }
    scoreEl.textContent = score;
  }

  function merge(arr) {
    const filtered = arr.filter(x => x);
    for (let k = 0; k < filtered.length - 1; k++) {
      if (filtered[k] === filtered[k + 1]) {
        filtered[k] = (filtered[k] + filtered[k + 1]) * bonusMultiplier;
        score += filtered[k];
        filtered[k + 1] = 0;
        bonusMultiplier = 1;
      }
    }
    const result = filtered.filter(x => x);
    while (result.length < boardSize) result.push(0);
    return result;
  }

  function moveRowWise(transform) {
    let moved = false;
    for (let i = 0; i < boardSize; i++) {
      const old = board[i].slice();
      board[i] = transform(board[i]);
      if (!moved && board[i].some((v, idx) => v !== old[idx])) moved = true;
    }
    return moved;
  }

  function moveColWise(transform) {
    let moved = false;
    for (let j = 0; j < boardSize; j++) {
      const col = board.map(r => r[j]);
      const old = col.slice();
      const merged = transform(col);
      merged.forEach((v, i) => board[i][j] = v);
      if (!moved && merged.some((v, i) => v !== old[i])) moved = true;
    }
    return moved;
  }

  function moveLeft()  { return moveRowWise(row => merge(row)); }
  function moveRight() { return moveRowWise(row => merge(row.slice().reverse()).reverse()); }
  function moveUp()    { return moveColWise(col => merge(col)); }
  function moveDown()  { return moveColWise(col => merge(col.slice().reverse()).reverse()); }

  function isGameOver() {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === 0) return false;
        if (j < boardSize - 1 && board[i][j] === board[i][j + 1]) return false;
        if (i < boardSize - 1 && board[i][j] === board[i + 1][j]) return false;
      }
    }
    return true;
  }

  function onTileClick(i, j) {
    const key = `${i}-${j}`;
    if (pendingDelete) {
      if (board[i][j] !== 0) {
        board[i][j] = 0;
        pendingDelete = false;
        showBonusMsg('Клетка удалена!');
        updateBoard();
      }
      return;
    }
    if (!bonusGrid[key]) return;
    const { type } = bonusGrid[key];
    delete bonusGrid[key];
    if (type === 'multiplier') {
      bonusMultiplier = 2;
      showBonusMsg('Множитель ×2 активирован!');
    } else if (type === 'extraTime') {
      remainingTime += 15;
      showBonusMsg('+15 секунд к таймеру!');
    } else if (type === 'delete') {
      pendingDelete = true;
      showBonusMsg('Выберите плитку для удаления!');
    }
    updateBoard();
  }

  function showBonusMsg(msg) {
    const e = document.createElement('div');
    e.className = 'bonus-message';
    e.textContent = msg;
    bonusUI.appendChild(e);
    setTimeout(() => bonusUI.removeChild(e), 2000);
  }

  function startTimer() {
    clearInterval(timerInterval);
    updateTimer();
    timerInterval = setInterval(() => {
      remainingTime--;
      updateTimer();
      if (remainingTime <= 0) endGame('time');
    }, 1000);
  }

  function updateTimer() {
    const m = Math.floor(remainingTime / 60);
    const s = remainingTime % 60;
    timerEl.textContent = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
  }

  function endGame(reason) {
    clearInterval(timerInterval);
    const msg = reason === 'time' ? 'Время истекло!' : 'Нет ходов!';
    alert(`Игра окончена! ${msg} Ваш счет: ${score}`);
    const nick = prompt('Введите ваш ник:');
    tg.sendData(JSON.stringify({ score, nickname: nick }));
  }

  function handleMove(direction) {
    let moved;
    switch(direction) {
      case 'left':  moved = moveLeft();  break;
      case 'right': moved = moveRight(); break;
      case 'up':    moved = moveUp();    break;
      case 'down':  moved = moveDown();  break;
    }
    if (!moved) return;
    spawnNumberTile();
    if (Math.random() < bonusSpawnChance) spawnBonusTile();
    updateBoard();
    if (isGameOver()) endGame('nomoves');
  }

  document.addEventListener('keydown', e => {
    const dir = e.key.replace('Arrow', '').toLowerCase();
    if (['left','right','up','down'].includes(dir)) handleMove(dir);
  });

  gameBoard.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: false });
  gameBoard.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  gameBoard.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 30 ? 'right' : dx < -30 ? 'left' : '');
    } else {
      handleMove(dy > 30 ? 'down' : dy < -30 ? 'up' : '');
    }
    touchStartX = touchStartY = null;
  }, { passive: false });

  function startGame() {
    score = 0; bonusMultiplier = 1; pendingDelete = false;
    remainingTime = 120;
    initBoard();
    spawnNumberTile();
    spawnNumberTile();
    spawnBonusTile();
    updateBoard();
    startTimer();
  }

  restartBtn.addEventListener('click', startGame);

  // Запуск
  startGame();
});

