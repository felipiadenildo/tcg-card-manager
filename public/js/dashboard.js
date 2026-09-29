const GAME_LABELS = { magic: 'Magic: The Gathering', pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!' };
const GAME_SHORT = { magic: 'MTG', pokemon: 'PKMN', yugioh: 'YGO' };
const VIEW_KEY = 'tcg-view';

let editingId = null;
let editionsRequestToken = 0;

// The full list from the API. Filtering and search only change what gets
// rendered from it, so switching filters never needs another request.
let allCards = [];
let activeGame = 'all';
let searchQuery = '';

// The tilt and foil effect follow the mouse, so they only run on devices
// with a real pointer and for users who have not asked for less motion.
const tiltEnabled = window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;

async function loadCards() {
  const { body } = await listCards();
  allCards = body.data;
  updateCounts();
  render();
}

function updateCounts() {
  document.querySelector('[data-count="all"]').textContent = allCards.length;
  Object.keys(GAME_LABELS).forEach((game) => {
    const count = allCards.filter((card) => card.card_game === game).length;
    document.querySelector(`[data-count="${game}"]`).textContent = count;
  });
}

function visibleCards() {
  const query = searchQuery.trim().toLowerCase();

  return allCards.filter((card) => {
    if (activeGame !== 'all' && card.card_game !== activeGame) return false;
    if (!query) return true;
    return [card.name_en, card.name_pt, card.edition_name]
      .some((value) => value && value.toLowerCase().includes(query));
  });
}

function render() {
  const cards = visibleCards();
  renderGrid(cards);
  renderTable(cards);

  const emptyEl = document.getElementById('empty-state');
  emptyEl.hidden = cards.length > 0;
  emptyEl.textContent = allCards.length === 0
    ? 'Your collection is empty. Add the first card with "+ New card".'
    : 'No cards match this filter.';
}

function createActionButtons(card) {
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-small btn-ghost';
  editBtn.textContent = 'Edit';
  editBtn.dataset.action = 'edit';
  editBtn.dataset.name = card.name_en;
  editBtn.setAttribute('aria-label', `Edit ${card.name_en}`);
  editBtn.addEventListener('click', () => openForm(card));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-small btn-ghost btn-ghost-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.dataset.name = card.name_en;
  deleteBtn.setAttribute('aria-label', `Delete ${card.name_en}`);
  deleteBtn.addEventListener('click', () => handleDelete(card));

  return [editBtn, deleteBtn];
}

function renderGrid(cards) {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  cards.forEach((card) => {
    const item = document.createElement('li');
    item.className = 'card-item';

    const face = document.createElement('article');
    face.className = 'tcg-card';
    face.dataset.game = card.card_game;

    const name = document.createElement('h3');
    name.className = 'tcg-card-name';
    name.textContent = card.name_en;

    const art = document.createElement('div');
    art.className = 'tcg-card-art';
    art.setAttribute('aria-hidden', 'true');
    art.textContent = GAME_SHORT[card.card_game];

    const text = document.createElement('div');
    text.className = 'tcg-card-text';

    const namePt = document.createElement('p');
    namePt.textContent = card.name_pt || '—';
    namePt.className = card.name_pt ? '' : 'faded';

    const edition = document.createElement('p');
    edition.className = 'tcg-card-edition';
    edition.textContent = card.edition_name;

    text.append(namePt, edition);

    const footer = document.createElement('footer');
    footer.className = 'tcg-card-footer';
    const game = document.createElement('span');
    game.textContent = GAME_LABELS[card.card_game];
    const code = document.createElement('span');
    code.textContent = card.edition_id.toUpperCase();
    footer.append(game, code);

    const foil = document.createElement('span');
    foil.className = 'foil';
    foil.setAttribute('aria-hidden', 'true');

    face.append(name, art, text, footer, foil);
    if (tiltEnabled) attachTilt(face);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.append(...createActionButtons(card));

    item.append(face, actions);
    grid.appendChild(item);
  });
}

function renderTable(cards) {
  const tbody = document.getElementById('cards-body');
  tbody.innerHTML = '';

  cards.forEach((card) => {
    const row = document.createElement('tr');

    const nameEnCell = document.createElement('td');
    nameEnCell.textContent = card.name_en;

    const namePtCell = document.createElement('td');
    namePtCell.textContent = card.name_pt || '—';

    const gameCell = document.createElement('td');
    const gamePill = document.createElement('span');
    gamePill.className = 'game-pill';
    gamePill.dataset.game = card.card_game;
    gamePill.textContent = GAME_LABELS[card.card_game];
    gameCell.appendChild(gamePill);

    const editionCell = document.createElement('td');
    editionCell.textContent = card.edition_name;

    const actionsCell = document.createElement('td');
    actionsCell.className = 'cell-actions';
    actionsCell.append(...createActionButtons(card));

    row.append(nameEnCell, namePtCell, gameCell, editionCell, actionsCell);
    tbody.appendChild(row);
  });
}

// Rotates the card toward the pointer and moves the foil highlight with it.
// Only CSS variables change here, the actual transform lives in style.css.
function attachTilt(face) {
  face.addEventListener('pointermove', (event) => {
    const rect = face.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    face.style.setProperty('--mx', `${x * 100}%`);
    face.style.setProperty('--my', `${y * 100}%`);
    face.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
    face.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
    face.classList.add('is-tilting');
  });

  face.addEventListener('pointerleave', () => {
    face.classList.remove('is-tilting');
    face.style.removeProperty('--rx');
    face.style.removeProperty('--ry');
  });
}

function openForm(card) {
  editingId = card ? card.id : null;
  document.getElementById('card-form-title').textContent = card ? 'Edit card' : 'New card';
  document.getElementById('card-form').reset();
  document.getElementById('card-form-error').hidden = true;

  const editionSelect = document.getElementById('edition');
  editionSelect.innerHTML = '<option value="">Select a Card Game first...</option>';
  editionSelect.disabled = true;

  document.getElementById('card-form-section').hidden = false;
  document.body.classList.add('drawer-open');

  if (card) {
    document.getElementById('name-en').value = card.name_en;
    document.getElementById('name-pt').value = card.name_pt || '';
    document.getElementById('card-game').value = card.card_game;
    loadEditions(card.card_game, card.edition_id);
  }

  document.getElementById('name-en').focus();
}

function closeForm() {
  document.getElementById('card-form-section').hidden = true;
  document.body.classList.remove('drawer-open');
  editingId = null;
}

async function loadEditions(game, selectedId) {
  const requestToken = ++editionsRequestToken;
  const editionSelect = document.getElementById('edition');

  editionSelect.disabled = true;
  editionSelect.innerHTML = '<option value="">Loading editions...</option>';

  const { body } = await fetchEditions(game);

  // A newer request may have started while this one was in flight. If so,
  // this response is stale and gets dropped instead of overwriting the
  // select with the wrong game's editions.
  if (requestToken !== editionsRequestToken) {
    return;
  }

  editionSelect.innerHTML = '<option value="">Select an edition...</option>';
  body.data.forEach((edition) => {
    const option = document.createElement('option');
    option.value = edition.id;
    option.textContent = edition.name;
    editionSelect.appendChild(option);
  });
  editionSelect.disabled = false;

  if (selectedId) {
    editionSelect.value = selectedId;
  }
}

function setView(view) {
  document.getElementById('collection').dataset.view = view;
  document.querySelectorAll('[data-view]:not(#collection)').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  });

  // Only a convenience, so a storage error just means the choice is not
  // remembered next time.
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Ignored on purpose.
  }
}

function savedView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

document.getElementById('card-game').addEventListener('change', (event) => {
  const game = event.target.value;
  const editionSelect = document.getElementById('edition');

  if (!game) {
    editionSelect.innerHTML = '<option value="">Select a Card Game first...</option>';
    editionSelect.disabled = true;
    return;
  }

  loadEditions(game);
});

document.getElementById('card-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const card = {
    name_en: document.getElementById('name-en').value,
    name_pt: document.getElementById('name-pt').value || null,
    card_game: document.getElementById('card-game').value,
    edition_id: document.getElementById('edition').value,
  };

  const { body } = editingId
    ? await updateCard({ id: editingId, ...card })
    : await createCard(card);

  if (!body.ok) {
    const errorEl = document.getElementById('card-form-error');
    errorEl.textContent = body.error;
    errorEl.hidden = false;
    return;
  }

  closeForm();
  loadCards();
});

// Same question the browser confirm() used to ask, shown in a styled
// dialog. Resolves true only for "Delete", so Esc or "Cancel" keep the card.
function confirmDialog(message) {
  const dialog = document.getElementById('confirm-dialog');
  document.getElementById('confirm-message').textContent = message;
  dialog.returnValue = '';
  dialog.showModal();

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
  });
}

async function handleDelete(card) {
  if (!(await confirmDialog(`Delete "${card.name_en}"? This cannot be undone.`))) return;
  await deleteCard(card.id);
  loadCards();
}

document.querySelectorAll('[data-filter]').forEach((chip) => {
  chip.addEventListener('click', () => {
    activeGame = chip.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((other) => {
      other.setAttribute('aria-pressed', String(other === chip));
    });
    render();
  });
});

document.getElementById('search').addEventListener('input', (event) => {
  searchQuery = event.target.value;
  render();
});

document.querySelectorAll('button[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !document.getElementById('card-form-section').hidden) {
    closeForm();
  }
});

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', closeForm);

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout();
  window.location.href = 'login.html';
});

setView(savedView());
loadCards();
