const STORAGE_KEY = "heckers-state-v1";
const STATS_KEY = "heckers-stats-v1";
const HISTORY_KEY = "heckers-history-v1";

const boardEl = document.querySelector("#board");
const turnBadge = document.querySelector("#turnBadge");
const scoreText = document.querySelector("#scoreText");
const moveList = document.querySelector("#moveList");
const coachOutput = document.querySelector("#coachOutput");
const whiteTimer = document.querySelector("#whiteTimer");
const blackTimer = document.querySelector("#blackTimer");
const difficultyEl = document.querySelector("#difficulty");
const cityInput = document.querySelector("#cityInput");

const initialBoard = () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 8; c += 1) if ((r + c) % 2 === 1) board[r][c] = { color: "black", king: false };
  }
  for (let r = 5; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) if ((r + c) % 2 === 1) board[r][c] = { color: "white", king: false };
  }
  return board;
};

let state = loadState() || {
  board: initialBoard(),
  turn: "white",
  selected: null,
  legalMoves: [],
  mode: "ai",
  moves: [],
  snapshots: [],
  forcedFrom: null,
  winner: null,
  timers: { white: 180, black: 180 },
  lastTick: Date.now()
};

let stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{"wins":0,"streak":0,"games":0}');
let timerId = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && parsed.board ? parsed : null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, selected: null, legalMoves: [] }));
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function inside(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function directions(piece) {
  if (piece.king) return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  return piece.color === "white" ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
}

function pieceMoves(board, r, c, capturesOnly = false) {
  const piece = board[r][c];
  if (!piece) return [];
  const captures = [];
  const quiet = [];
  for (const [dr, dc] of directions(piece)) {
    const nr = r + dr;
    const nc = c + dc;
    const jr = r + dr * 2;
    const jc = c + dc * 2;
    if (inside(nr, nc) && !board[nr][nc] && !capturesOnly) {
      quiet.push({ from: [r, c], to: [nr, nc], capture: null, score: 1 });
    }
    if (inside(jr, jc) && board[nr]?.[nc] && board[nr][nc].color !== piece.color && !board[jr][jc]) {
      captures.push({ from: [r, c], to: [jr, jc], capture: [nr, nc], score: 6 });
    }
  }
  return captures.length ? captures : quiet;
}

function allMoves(board, color) {
  const captures = [];
  const quiet = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (board[r][c]?.color === color) {
        const moves = pieceMoves(board, r, c);
        for (const move of moves) (move.capture ? captures : quiet).push(move);
      }
    }
  }
  return captures.length ? captures : quiet;
}

function legalForSquare(r, c) {
  if (state.forcedFrom && (state.forcedFrom[0] !== r || state.forcedFrom[1] !== c)) return [];
  const moves = allMoves(state.board, state.turn);
  return moves.filter((move) => move.from[0] === r && move.from[1] === c);
}

function notation([r, c]) {
  return `${String.fromCharCode(97 + c)}${8 - r}`;
}

function applyMove(move, actor = "player") {
  const before = cloneBoard(state.board);
  const piece = state.board[move.from[0]][move.from[1]];
  state.board[move.from[0]][move.from[1]] = null;
  if (move.capture) state.board[move.capture[0]][move.capture[1]] = null;
  state.board[move.to[0]][move.to[1]] = piece;
  if ((piece.color === "white" && move.to[0] === 0) || (piece.color === "black" && move.to[0] === 7)) piece.king = true;

  const extraCaptures = move.capture ? pieceMoves(state.board, move.to[0], move.to[1], true).filter((m) => m.capture) : [];
  state.snapshots.push({ board: before, turn: state.turn, timers: { ...state.timers }, moves: [...state.moves] });
  state.moves.push({
    color: piece.color,
    text: `${piece.color === "white" ? "White" : "Black"}: ${notation(move.from)}-${notation(move.to)}${move.capture ? " x" : ""}`,
    actor
  });

  if (extraCaptures.length) {
    state.forcedFrom = move.to;
    state.selected = move.to;
    state.legalMoves = extraCaptures;
    explainMove(move, true);
  } else {
    state.forcedFrom = null;
    state.selected = null;
    state.legalMoves = [];
    state.turn = state.turn === "white" ? "black" : "white";
    explainMove(move, false);
  }
  checkGameOver();
  saveState();
  render();
  maybeAiTurn();
}

function checkGameOver() {
  const whitePieces = countPieces("white");
  const blackPieces = countPieces("black");
  if (!whitePieces || !allMoves(state.board, "white").length) state.winner = "black";
  if (!blackPieces || !allMoves(state.board, "black").length) state.winner = "white";
  if (state.winner) finishGame(`${state.winner === "white" ? "Белые" : "Черные"} победили`);
}

function finishGame(summary) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.unshift({
    date: new Date().toLocaleString("ru-RU"),
    summary,
    moves: state.moves.length,
    city: cityInput.value || "Алматы"
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
  stats.games += 1;
  if (state.winner === "white") {
    stats.wins += 1;
    stats.streak += 1;
  } else {
    stats.streak = 0;
  }
  coachOutput.textContent = buildPostGameCoach();
  saveState();
}

function countPieces(color) {
  return state.board.flat().filter((piece) => piece?.color === color).length;
}

function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = board[r][c];
      if (!piece) continue;
      const value = piece.king ? 5 : 3;
      const center = 3.5 - Math.abs(3.5 - c);
      score += (piece.color === "black" ? 1 : -1) * (value + center * 0.12);
    }
  }
  return score;
}

function simulate(board, move) {
  const next = cloneBoard(board);
  const piece = next[move.from[0]][move.from[1]];
  next[move.from[0]][move.from[1]] = null;
  if (move.capture) next[move.capture[0]][move.capture[1]] = null;
  next[move.to[0]][move.to[1]] = piece;
  if ((piece.color === "white" && move.to[0] === 0) || (piece.color === "black" && move.to[0] === 7)) piece.king = true;
  return next;
}

function chooseAiMove() {
  const moves = allMoves(state.board, "black");
  const level = Number(difficultyEl.value);
  if (!moves.length) return null;
  if (level === 1) return moves[Math.floor(Math.random() * moves.length)];
  const ranked = moves.map((move) => {
    const next = simulate(state.board, move);
    const danger = allMoves(next, "white").filter((m) => m.capture).length;
    const promotion = move.to[0] === 7 ? 2 : 0;
    const score = evaluateBoard(next) + (move.capture ? 4 : 0) + promotion - danger * (level === 3 ? 1.7 : 0.8);
    return { move, score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0].move;
}

function maybeAiTurn() {
  if (state.mode !== "ai" || state.turn !== "black" || state.winner) return;
  setTimeout(() => {
    const move = chooseAiMove();
    if (move) applyMove(move, "ai");
  }, 420);
}

function onSquareClick(r, c) {
  if (state.winner || (state.mode === "ai" && state.turn === "black")) return;
  const piece = state.board[r][c];
  const activeMove = state.legalMoves.find((move) => move.to[0] === r && move.to[1] === c);
  if (activeMove) {
    applyMove(activeMove);
    return;
  }
  if (piece?.color === state.turn) {
    state.selected = [r, c];
    state.legalMoves = legalForSquare(r, c);
    if (!state.legalMoves.length) coachOutput.textContent = "Эта фигура сейчас заперта. Попробуйте другую диагональ или найдите обязательное взятие.";
    else analyzeSelection();
    render();
  }
}

function analyzeSelection() {
  const captures = state.legalMoves.filter((move) => move.capture);
  const best = state.legalMoves.slice().sort((a, b) => (b.capture ? 2 : 0) - (a.capture ? 2 : 0) + b.to[0] - a.to[0])[0];
  coachOutput.textContent = captures.length
    ? `Есть обязательное взятие: ${notation(best.from)}-${notation(best.to)}. После него проверьте, доступна ли серия.`
    : `Лучший спокойный ход: ${notation(best.from)}-${notation(best.to)}. Он сохраняет темп и не отдает фигуру сразу.`;
}

function explainMove(move, chain) {
  if (chain) {
    coachOutput.textContent = `Серия продолжается: после ${notation(move.from)}-${notation(move.to)} нужно добрать следующую фигуру.`;
    return;
  }
  const opponentCaptures = allMoves(state.board, state.turn).filter((m) => m.capture);
  if (move.capture) coachOutput.textContent = `Хорошее взятие на ${notation(move.to)}. Материальный баланс стал ${countPieces("white")} : ${countPieces("black")}.`;
  else if (opponentCaptures.length) coachOutput.textContent = `Осторожно: соперник получил ${opponentCaptures.length} вариант взятия. Это типичный момент для AI Coach.`;
  else coachOutput.textContent = `Позиция стабильна. Следующая цель: занять центр и подготовить проход в дамки.`;
}

function buildPostGameCoach() {
  const captures = state.moves.filter((move) => move.text.includes("x")).length;
  return `Разбор партии: ${captures} взятий, ${state.moves.length} полуходов. Самая важная идея: в быстрых дуэлях ценнее сохранять цепочки взятий, чем просто идти в дамки.`;
}

function render() {
  boardEl.innerHTML = "";
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = document.createElement("button");
      square.type = "button";
      square.className = `square ${(r + c) % 2 ? "dark-square" : ""}`;
      if (state.selected?.[0] === r && state.selected?.[1] === c) square.classList.add("selected");
      const legal = state.legalMoves.find((move) => move.to[0] === r && move.to[1] === c);
      if (legal) square.classList.add(legal.capture ? "capture-hint" : "hint");
      square.addEventListener("click", () => onSquareClick(r, c));
      const piece = state.board[r][c];
      if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.className = `piece ${piece.color} ${piece.king ? "king" : ""}`;
        square.appendChild(pieceEl);
      }
      boardEl.appendChild(square);
    }
  }
  turnBadge.textContent = state.winner ? `Победа: ${state.winner === "white" ? "белые" : "черные"}` : `Ход ${state.turn === "white" ? "белых" : "черных"}`;
  scoreText.textContent = `${countPieces("white")} : ${countPieces("black")}`;
  moveList.innerHTML = state.moves.slice(-18).map((move) => `<li>${move.text}</li>`).join("") || "<li>Партия готова к старту</li>";
  document.querySelector("#movesStat").textContent = state.moves.length;
  document.querySelector("#winsStat").textContent = stats.wins;
  document.querySelector("#streakStat").textContent = stats.streak;
  renderHistory();
  renderLeaderboard();
  updateTimers();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  document.querySelector("#historyList").innerHTML = history.length
    ? history.map((game) => `<article><span>${game.summary}<br><small>${game.date}</small></span><strong>${game.moves}</strong></article>`).join("")
    : "<article><span>Сыграйте первую партию</span><strong>0</strong></article>";
}

function renderLeaderboard() {
  const city = cityInput.value || "Алматы";
  const players = [
    ["Aruzhan", 1840],
    ["Miras", 1775],
    ["Вы", 1600 + stats.wins * 24 + stats.streak * 9],
    ["Dana", 1535],
    ["Timur", 1480]
  ].sort((a, b) => b[1] - a[1]);
  document.querySelector("#leaderboard").innerHTML = players
    .map((player, index) => `<article><span>${index + 1}. ${player[0]}<br><small>${city} league</small></span><strong>${player[1]}</strong></article>`)
    .join("");
}

function tick() {
  if (!state.winner) {
    const now = Date.now();
    const delta = Math.floor((now - state.lastTick) / 1000);
    if (delta > 0) {
      state.timers[state.turn] = Math.max(0, state.timers[state.turn] - delta);
      state.lastTick = now;
      if (state.timers[state.turn] === 0) {
        state.winner = state.turn === "white" ? "black" : "white";
        finishGame("Победа по времени");
      }
      saveState();
      updateTimers();
    }
  }
}

function updateTimers() {
  whiteTimer.textContent = formatTime(state.timers.white);
  blackTimer.textContent = formatTime(state.timers.black);
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function newGame() {
  state = {
    board: initialBoard(),
    turn: "white",
    selected: null,
    legalMoves: [],
    mode: state.mode,
    moves: [],
    snapshots: [],
    forcedFrom: null,
    winner: null,
    timers: { white: 180, black: 180 },
    lastTick: Date.now()
  };
  coachOutput.textContent = "Новая партия началась. Контролируйте центр и не забывайте про обязательные взятия.";
  saveState();
  render();
}

function showToast(text) {
  const toast = document.querySelector("#toast");
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

document.querySelector("#newGameButton").addEventListener("click", newGame);
document.querySelector("#hintButton").addEventListener("click", () => {
  const moves = allMoves(state.board, state.turn);
  if (!moves.length) return;
  const move = moves.slice().sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0))[0];
  state.selected = move.from;
  state.legalMoves = [move];
  coachOutput.textContent = `Подсказка: сыграйте ${notation(move.from)}-${notation(move.to)}${move.capture ? " со взятием" : ""}.`;
  render();
});
document.querySelector("#undoButton").addEventListener("click", () => {
  const snapshot = state.snapshots.pop();
  if (!snapshot) return showToast("Пока нечего отменять");
  state.board = snapshot.board;
  state.turn = snapshot.turn;
  state.timers = snapshot.timers;
  state.moves = snapshot.moves;
  state.winner = null;
  state.selected = null;
  state.legalMoves = [];
  saveState();
  render();
});
document.querySelector("#shareButton").addEventListener("click", async () => {
  const url = `${location.href.split("#")[0]}#room=${Math.random().toString(36).slice(2, 8)}`;
  await navigator.clipboard?.writeText(url).catch(() => null);
  showToast("Ссылка на матч скопирована. WebSocket-комната описана в README как следующий шаг.");
});
document.querySelector("#coachButton").addEventListener("click", () => {
  const moves = allMoves(state.board, state.turn);
  coachOutput.textContent = moves.some((move) => move.capture)
    ? "В позиции есть обязательное взятие. В шашках это главный фильтр выбора хода."
    : "Сейчас нет обязательных взятий. Ищите ход, который держит центр и не ставит фигуру под удар.";
});
document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("heckers-theme", document.body.classList.contains("dark") ? "dark" : "light");
});
document.querySelector("#proButton").addEventListener("click", () => document.querySelector("#proDialog").showModal());
document.querySelector("#closePro").addEventListener("click", () => document.querySelector("#proDialog").close());
difficultyEl.addEventListener("change", saveState);
cityInput.addEventListener("input", renderLeaderboard);

document.querySelectorAll("#modeGroup button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#modeGroup button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    document.querySelector("#gameTitle").textContent = state.mode === "training" ? "Тренировка с подсказками" : state.mode === "local" ? "Матч на одном экране" : "Быстрая дуэль";
    saveState();
    maybeAiTurn();
  });
});

document.querySelectorAll(".tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.tab}Tab`).classList.add("active");
  });
});

if (localStorage.getItem("heckers-theme") === "dark") document.body.classList.add("dark");
timerId = setInterval(tick, 1000);
render();
maybeAiTurn();
