const GRID_SIZE = 10;
const ROUND_SIZE = 4;
const SAVE_KEY = "pokemon-word-search-state-v1";
const MUSIC_FILE = "music-palettetown.mp3";
const CELEBRATION_FILE = "celebration.mp3";
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 }
];

const GEN1_NAMES = [
  "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie",
  "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate",
  "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina",
  "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff",
  "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett",
  "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag",
  "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell",
  "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro",
  "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder",
  "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb",
  "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing",
  "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu",
  "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados",
  "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto",
  "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo",
  "Mew"
];

const GEN1_POKEMON = GEN1_NAMES.map((name, index) => {
  const id = index + 1;
  return {
    id,
    name,
    searchName: normalizePokemonName(name),
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    cry: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
  };
});

const pokemonById = new Map(GEN1_POKEMON.map((pokemon) => [pokemon.id, pokemon]));

const elements = {
  board: document.getElementById("board"),
  counter: document.getElementById("counter"),
  foundList: document.getElementById("found-list"),
  menuButton: document.getElementById("menu-button"),
  menuOverlay: document.getElementById("menu-overlay"),
  closeMenuButton: document.getElementById("close-menu-button"),
  roundsCompleted: document.getElementById("rounds-completed"),
  criesToggle: document.getElementById("cries-toggle"),
  musicToggle: document.getElementById("music-toggle"),
  newRoundButton: document.getElementById("new-round-button"),
  resetButton: document.getElementById("reset-button"),
  completionOverlay: document.getElementById("completion-overlay"),
  completionRoundsText: document.getElementById("completion-rounds-text"),
  completionNewRoundButton: document.getElementById("completion-new-round-button")
};

let state = loadState();
let activeSelection = null;
let pointerDown = false;
let activePointerId = null;
let highlightedPokemonId = null;
let highlightTimer = null;
let currentCry = null;
let currentCelebration = null;
let bgMusic = null;
let hasUserInteracted = false;
let fadeTimer = null;
let boardCells = [];

render();
syncAudioControls();
applyCompletionState();

document.addEventListener("pointerdown", handleFirstInteraction, { once: false });
document.addEventListener("keydown", handleFirstInteraction, { once: false });
document.addEventListener("pointermove", handlePointerMove);
document.addEventListener("pointerup", handleDocumentPointerUp);

elements.menuButton.addEventListener("click", () => setMenuOpen(true));
elements.closeMenuButton.addEventListener("click", () => setMenuOpen(false));
elements.menuOverlay.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeMenu === "true") {
    setMenuOpen(false);
  }
});

elements.criesToggle.addEventListener("change", () => {
  state.preferences.criesMuted = elements.criesToggle.checked;
  if (state.preferences.criesMuted) {
    stopCry();
  }
  saveState();
});

elements.musicToggle.addEventListener("change", () => {
  state.preferences.musicMuted = elements.musicToggle.checked;
  if (state.preferences.musicMuted) {
    stopCelebration();
    stopMusic();
  } else {
    maybeStartMusic();
  }
  saveState();
});

elements.newRoundButton.addEventListener("click", () => startNewRound());
elements.resetButton.addEventListener("click", () => resetRound());
elements.completionNewRoundButton.addEventListener("click", () => startNewRound());
window.addEventListener("beforeunload", () => saveState());

function normalizePokemonName(value) {
  return String(value || "")
    .replace(/♀/g, "F")
    .replace(/♂/g, "M")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizePreferences(preferences = {}) {
  if ("criesMuted" in preferences || "musicMuted" in preferences) {
    return {
      criesMuted: Boolean(preferences.criesMuted),
      musicMuted: Boolean(preferences.musicMuted)
    };
  }

  return {
    criesMuted: Boolean(preferences.muted),
    musicMuted: "musicEnabled" in preferences ? !Boolean(preferences.musicEnabled) : false
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return createInitialState();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.round) {
      return createInitialState();
    }
    const round = hydrateRound(parsed.round);
    return {
      roundsCompleted: Number.isInteger(parsed.roundsCompleted) ? parsed.roundsCompleted : 0,
      usedPokemonIds: normalizeUsedPokemonIds(parsed.usedPokemonIds, round.pokemonIds),
      preferences: normalizePreferences(parsed.preferences),
      round
    };
  } catch {
    return createInitialState();
  }
}

function normalizeUsedPokemonIds(value, currentRoundIds = []) {
  const validIds = Array.isArray(value) ? value.filter((id) => pokemonById.has(id)) : [];
  const seen = new Set();
  const ordered = [];

  [...validIds, ...currentRoundIds].forEach((id) => {
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    ordered.push(id);
  });

  return ordered;
}

function hydrateRound(round) {
  const pokemonIds = Array.isArray(round.pokemonIds) ? round.pokemonIds.filter((id) => pokemonById.has(id)).slice(0, ROUND_SIZE) : [];
  const placements = Array.isArray(round.placements) ? round.placements.map(hydratePlacement).filter(Boolean) : [];
  const grid = Array.isArray(round.grid) ? round.grid.map((row) => Array.isArray(row) ? row.slice(0, GRID_SIZE) : []) : [];
  const validGrid = grid.length === GRID_SIZE && grid.every((row) => row.length === GRID_SIZE && row.every((cell) => typeof cell === "string" && cell.length === 1));
  const validRound = pokemonIds.length === ROUND_SIZE && placements.length === ROUND_SIZE && validGrid;

  if (!validRound) {
    return generateRound();
  }

  return {
    gridSize: GRID_SIZE,
    pokemonIds,
    grid,
    placements,
    foundIds: Array.isArray(round.foundIds) ? round.foundIds.filter((id) => pokemonById.has(id)) : [],
    foundOrder: Array.isArray(round.foundOrder) ? round.foundOrder.filter((id) => pokemonById.has(id)) : [],
    completed: Boolean(round.completed),
    awardedCompletion: Boolean(round.awardedCompletion)
  };
}

function hydratePlacement(placement) {
  if (!placement || !pokemonById.has(placement.pokemonId) || !Array.isArray(placement.cells)) {
    return null;
  }
  return {
    pokemonId: placement.pokemonId,
    cells: placement.cells.filter((cell) => Array.isArray(cell) && cell.length === 2).map(([row, col]) => [row, col])
  };
}

function createInitialState() {
  const { round, nextUsedPokemonIds } = buildRound();
  return {
    roundsCompleted: 0,
    preferences: normalizePreferences(),
    usedPokemonIds: nextUsedPokemonIds,
    round
  };
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function generateRound(usedPokemonIds = []) {
  return buildRound(usedPokemonIds).round;
}

function buildRound(usedPokemonIds = []) {
  const { selected, nextUsedPokemonIds } = pickRoundPokemon(usedPokemonIds);
  const words = selected.map((pokemon) => ({ pokemonId: pokemon.id, text: pokemon.searchName }));
  const { grid, placements } = generateBoard(words);
  return {
    round: {
      gridSize: GRID_SIZE,
      pokemonIds: selected.map((pokemon) => pokemon.id),
      grid,
      placements,
      foundIds: [],
      foundOrder: [],
      completed: false,
      awardedCompletion: false
    },
    nextUsedPokemonIds
  };
}

function pickRoundPokemon(usedPokemonIds = []) {
  const usedSet = new Set(usedPokemonIds.filter((id) => pokemonById.has(id)));
  const unseen = GEN1_POKEMON.filter((pokemon) => !usedSet.has(pokemon.id));

  if (unseen.length >= ROUND_SIZE) {
    const selected = shuffle([...unseen]).slice(0, ROUND_SIZE);
    return {
      selected,
      nextUsedPokemonIds: [...usedPokemonIds, ...selected.map((pokemon) => pokemon.id)]
    };
  }

  const selected = shuffle([...unseen]);
  const selectedIds = new Set(selected.map((pokemon) => pokemon.id));
  const refillPool = GEN1_POKEMON.filter((pokemon) => !selectedIds.has(pokemon.id));
  const refill = shuffle([...refillPool]).slice(0, ROUND_SIZE - selected.length);
  const refillIds = refill.map((pokemon) => pokemon.id);

  return {
    selected: [...selected, ...refill],
    nextUsedPokemonIds: refillIds
  };
}

function generateBoard(words) {
  while (true) {
    const grid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => ""));
    const placements = [];
    const orderedWords = shuffle([...words]).sort((a, b) => b.text.length - a.text.length);
    let failed = false;

    for (const word of orderedWords) {
      let placed = false;

      for (let attempt = 0; attempt < 300; attempt += 1) {
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);
        const cells = [];
        let valid = true;

        for (let index = 0; index < word.text.length; index += 1) {
          const row = startRow + (direction.dr * index);
          const col = startCol + (direction.dc * index);
          if (!isInsideBoard(row, col)) {
            valid = false;
            break;
          }
          const existing = grid[row][col];
          const letter = word.text[index];
          if (existing && existing !== letter) {
            valid = false;
            break;
          }
          cells.push([row, col]);
        }

        if (!valid) {
          continue;
        }

        cells.forEach(([row, col], index) => {
          grid[row][col] = word.text[index];
        });

        placements.push({ pokemonId: word.pokemonId, cells });
        placed = true;
        break;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (failed) {
      continue;
    }

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = randomLetter();
        }
      }
    }

    return { grid, placements };
  }
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function randomLetter() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function isInsideBoard(row, col) {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

function render() {
  renderCounter();
  renderBoard();
  renderFoundList();
  renderCompletionSummary();
  syncAudioControls();
  elements.roundsCompleted.textContent = String(state.roundsCompleted);
  saveState();
}

function renderCounter() {
  elements.counter.textContent = `${state.round.foundIds.length} / ${ROUND_SIZE}`;
}

function renderBoard() {
  const foundCells = new Set(
    state.round.placements
      .filter((placement) => state.round.foundIds.includes(placement.pokemonId))
      .flatMap((placement) => placement.cells.map(([row, col]) => `${row}:${col}`))
  );
  const previewCells = new Set((activeSelection?.cells || []).map(([row, col]) => `${row}:${col}`));

  if (boardCells.length !== GRID_SIZE * GRID_SIZE) {
    elements.board.innerHTML = "";
    boardCells = [];

    state.round.grid.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.dataset.row = String(rowIndex);
        cell.dataset.col = String(colIndex);
        cell.addEventListener("pointerdown", handlePointerDown);
        cell.addEventListener("pointerenter", handlePointerEnter);
        cell.addEventListener("pointerup", handlePointerUp);
        elements.board.appendChild(cell);
        boardCells.push(cell);
      });
    });
  }

  boardCells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const letter = state.round.grid[row][col];
    const key = `${row}:${col}`;
    const animated = highlightedPokemonId !== null && state.round.placements.some((placement) => (
      placement.pokemonId === highlightedPokemonId
      && placement.cells.some(([placementRow, placementCol]) => placementRow === row && placementCol === col)
    ));
    cell.textContent = letter;
    cell.setAttribute("aria-label", `Row ${row + 1} column ${col + 1} ${letter}`);
    cell.classList.toggle("found", foundCells.has(key));
    cell.classList.toggle("preview", previewCells.has(key));
    cell.classList.toggle("success-flash", animated);
  });
}

function renderFoundList() {
  elements.foundList.innerHTML = "";

  for (const pokemonId of state.round.pokemonIds) {
    const slot = document.createElement("div");
    const pokemon = pokemonById.get(pokemonId);
    const found = state.round.foundIds.includes(pokemonId);
    slot.className = found ? "sprite-slot" : "sprite-slot unfound";
    slot.setAttribute("aria-label", found ? `${pokemon.name} found` : `${pokemon.name} not found`);
    slot.classList.toggle("success-flash", highlightedPokemonId === pokemonId);

    const sprite = document.createElement("img");
    sprite.className = "pokemon-sprite";
    sprite.src = pokemon.sprite;
    sprite.alt = `${pokemon.name} sprite`;
    sprite.loading = "lazy";

    slot.appendChild(sprite);
    elements.foundList.appendChild(slot);
  }
}

function renderCompletionSummary() {
  elements.completionRoundsText.textContent = `Rounds completed: ${state.roundsCompleted}`;
}

function handlePointerDown(event) {
  if (!(event.currentTarget instanceof HTMLElement) || state.round.completed || isMenuOpen()) {
    return;
  }
  handleFirstInteraction();
  pointerDown = true;
  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  activeSelection = { start: [row, col], cells: [[row, col]] };
  renderBoard();
}

function handlePointerEnter(event) {
  if (!pointerDown || !(event.currentTarget instanceof HTMLElement) || !activeSelection) {
    return;
  }
  updateSelection(Number(event.currentTarget.dataset.row), Number(event.currentTarget.dataset.col));
}

function handlePointerMove(event) {
  if (!pointerDown || !activeSelection || event.pointerId !== activePointerId) {
    return;
  }

  const cell = getCellFromPoint(event.clientX, event.clientY);
  if (!cell) {
    return;
  }

  updateSelection(Number(cell.dataset.row), Number(cell.dataset.col));
}

function handlePointerUp(event) {
  if (!(event.currentTarget instanceof HTMLElement) || !pointerDown || !activeSelection) {
    return;
  }
  commitSelection();
}

function handleDocumentPointerUp(event) {
  if (!pointerDown || !activeSelection || event.pointerId !== activePointerId) {
    return;
  }

  const cell = getCellFromPoint(event.clientX, event.clientY);
  if (cell) {
    updateSelection(Number(cell.dataset.row), Number(cell.dataset.col));
  }

  commitSelection();
}

function updateSelection(row, col) {
  const path = buildPath(activeSelection.start, [row, col]);
  const nextCells = path || [activeSelection.start];
  if (sameCells(activeSelection.cells, nextCells)) {
    return;
  }
  activeSelection.cells = nextCells;
  renderBoard();
}

function getCellFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const cell = target.closest(".cell");
  return cell instanceof HTMLElement ? cell : null;
}

function buildPath(start, end) {
  const [startRow, startCol] = start;
  const [endRow, endCol] = end;
  const rowDelta = endRow - startRow;
  const colDelta = endCol - startCol;
  const stepRow = Math.sign(rowDelta);
  const stepCol = Math.sign(colDelta);
  const rowDistance = Math.abs(rowDelta);
  const colDistance = Math.abs(colDelta);

  if (!(rowDistance === 0 || colDistance === 0 || rowDistance === colDistance)) {
    return null;
  }

  const steps = Math.max(rowDistance, colDistance);
  const cells = [];
  for (let index = 0; index <= steps; index += 1) {
    cells.push([startRow + (stepRow * index), startCol + (stepCol * index)]);
  }
  return cells;
}

function commitSelection() {
  const selectedCells = activeSelection?.cells || [];
  pointerDown = false;
  activePointerId = null;
  activeSelection = null;

  if (!selectedCells.length) {
    renderBoard();
    return;
  }

  const match = state.round.placements.find((placement) => {
    if (state.round.foundIds.includes(placement.pokemonId)) {
      return false;
    }
    return sameCells(placement.cells, selectedCells) || sameCells([...placement.cells].reverse(), selectedCells);
  });

  if (match) {
    markPokemonFound(match.pokemonId);
  } else {
    renderBoard();
  }
}

function sameCells(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every(([row, col], index) => row === b[index][0] && col === b[index][1]);
}

function markPokemonFound(pokemonId) {
  if (state.round.completed || state.round.foundIds.includes(pokemonId)) {
    renderBoard();
    return;
  }

  state.round.foundIds = [...state.round.foundIds, pokemonId];
  state.round.foundOrder = [...state.round.foundOrder, pokemonId];
  triggerFoundAnimation(pokemonId);
  playCryForPokemon(pokemonId);

  if (state.round.foundIds.length === ROUND_SIZE) {
    state.round.completed = true;
    if (!state.round.awardedCompletion) {
      state.roundsCompleted += 1;
      state.round.awardedCompletion = true;
    }
    stopCry();
    fadeOutMusic();
    playCelebration();
  }

  render();
  applyCompletionState();
}

function triggerFoundAnimation(pokemonId) {
  highlightedPokemonId = pokemonId;
  if (highlightTimer) {
    clearTimeout(highlightTimer);
  }
  highlightTimer = window.setTimeout(() => {
    highlightedPokemonId = null;
    highlightTimer = null;
    renderBoard();
    renderFoundList();
  }, 650);
}

function startNewRound() {
  stopCry();
  stopCelebration();
  stopMusic();
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
  highlightedPokemonId = null;
  boardCells = [];
  activeSelection = null;
  pointerDown = false;
  activePointerId = null;
  const { round, nextUsedPokemonIds } = buildRound(state.usedPokemonIds);
  state.round = round;
  state.usedPokemonIds = nextUsedPokemonIds;
  setMenuOpen(false);
  render();
  applyCompletionState();
  maybeStartMusic();
}

function resetRound() {
  stopCry();
  stopCelebration();
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
  highlightedPokemonId = null;
  activeSelection = null;
  pointerDown = false;
  activePointerId = null;
  state.round.foundIds = [];
  state.round.foundOrder = [];
  state.round.completed = false;
  setMenuOpen(false);
  render();
  applyCompletionState();
  maybeStartMusic();
}

function applyCompletionState() {
  elements.completionOverlay.hidden = !state.round.completed;
}

function setMenuOpen(open) {
  elements.menuOverlay.hidden = !open;
  elements.menuButton.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.classList.toggle("menu-open", open);
}

function isMenuOpen() {
  return !elements.menuOverlay.hidden;
}

function syncAudioControls() {
  elements.criesToggle.checked = state.preferences.criesMuted;
  elements.musicToggle.checked = state.preferences.musicMuted;
}

function handleFirstInteraction() {
  hasUserInteracted = true;
  maybeStartMusic();
}

function maybeStartMusic() {
  if (!hasUserInteracted || state.preferences.musicMuted || state.round.completed) {
    return;
  }
  if (!bgMusic) {
    bgMusic = new Audio(MUSIC_FILE);
    bgMusic.loop = true;
    bgMusic.volume = 0.55;
  }
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
  bgMusic.volume = 0.55;
  bgMusic.play().catch(() => {});
}

function stopMusic() {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

function fadeOutMusic() {
  if (!bgMusic) {
    return;
  }
  if (fadeTimer) {
    clearInterval(fadeTimer);
  }
  fadeTimer = setInterval(() => {
    if (!bgMusic) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      return;
    }
    if (bgMusic.volume <= 0.05) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      stopMusic();
      return;
    }
    bgMusic.volume = Math.max(0, bgMusic.volume - 0.05);
  }, 90);
}

function playCryForPokemon(pokemonId) {
  if (state.preferences.criesMuted) {
    return;
  }
  const pokemon = pokemonById.get(pokemonId);
  stopCelebration();
  stopCry();
  currentCry = new Audio(pokemon.cry);
  currentCry.volume = 0.325;
  currentCry.play().catch(() => {});
}

function stopCry() {
  if (currentCry) {
    currentCry.pause();
    currentCry.currentTime = 0;
    currentCry = null;
  }
}

function playCelebration() {
  if (state.preferences.musicMuted) {
    return;
  }
  stopCelebration();
  currentCelebration = new Audio(CELEBRATION_FILE);
  currentCelebration.volume = 0.8;
  currentCelebration.play().catch(() => {});
}

function stopCelebration() {
  if (currentCelebration) {
    currentCelebration.pause();
    currentCelebration.currentTime = 0;
    currentCelebration = null;
  }
}
