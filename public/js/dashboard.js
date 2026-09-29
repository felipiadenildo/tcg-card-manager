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

const collection = document.getElementById('collection');
const cardForm = document.getElementById('card-form');
const formError = document.getElementById('card-form-error');

async function loadCards() {
  collection.setAttribute('aria-busy', 'true');
  const { status, body } = await track(listCards());
  collection.removeAttribute('aria-busy');

  if (status === 401) return goToLogin();

  if (!body.ok) {
    showListError(body.error);
    return;
  }

  document.getElementById('list-error').hidden = true;
  allCards = body.data;
  updateCounts();
  render();
}

// Replaces the skeleton cards with a message and a retry button, so a
// failed load never looks like an empty collection.
function showListError(message) {
  document.getElementById('cards-grid').innerHTML = '';
  document.getElementById('cards-body').innerHTML = '';
  document.getElementById('empty-state').hidden = true;
  document.getElementById('list-error-message').textContent = `The collection could not be loaded. ${message}`;
  document.getElementById('list-error').hidden = false;
  setBusy(document.getElementById('retry-list'), false);
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
  // While the load error is on screen there is no list to filter.
  if (!document.getElementById('list-error').hidden) return;

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
    item.dataset.id = card.id;

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
    row.dataset.id = card.id;

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

function showFormError(message, field) {
  formError.textContent = message;
  formError.hidden = false;
  replayAnimation(cardForm, 'shake');
  if (field) {
    markInvalid(field, message);
    field.focus();
  }
}

function hideFormError() {
  formError.hidden = true;
  clearInvalid(cardForm);
}

function isSaving() {
  return cardForm.querySelector('[type=submit]').disabled;
}

function openForm(card) {
  editingId = card ? card.id : null;
  document.getElementById('card-form-title').textContent = card ? 'Edit card' : 'New card';
  cardForm.reset();
  hideFormError();
  resetEditionSelect();

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
  editionsRequestToken += 1;
}

function resetEditionSelect() {
  const editionSelect = document.getElementById('edition');
  editionSelect.innerHTML = '<option value="">Select a Card Game first...</option>';
  editionSelect.disabled = true;
  document.getElementById('edition-spinner').hidden = true;
  document.getElementById('retry-editions').hidden = true;
}

async function loadEditions(game, selectedId) {
  const requestToken = ++editionsRequestToken;
  const editionSelect = document.getElementById('edition');
  const spinner = document.getElementById('edition-spinner');
  const retry = document.getElementById('retry-editions');

  editionSelect.disabled = true;
  editionSelect.innerHTML = '<option value="">Loading editions...</option>';
  spinner.hidden = false;
  retry.hidden = true;

  const { status, body } = await track(fetchEditions(game));

  // A newer request may have started while this one was in flight. If so,
  // this response is stale and gets dropped instead of overwriting the
  // select with the wrong game's editions.
  if (requestToken !== editionsRequestToken) {
    return;
  }

  spinner.hidden = true;
  if (status === 401) return goToLogin();

  if (!body.ok) {
    editionSelect.innerHTML = '<option value="">Editions could not be loaded</option>';
    markInvalid(editionSelect, `The editions could not be loaded. ${body.error}`);
    retry.hidden = false;
    retry.onclick = () => loadEditions(game, selectedId);
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

  if (!game) {
    editionsRequestToken += 1;
    resetEditionSelect();
    return;
  }

  loadEditions(game);
});

cardForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const saveBtn = cardForm.querySelector('[type=submit]');
  if (saveBtn.disabled) return;

  const card = {
    name_en: document.getElementById('name-en').value,
    name_pt: document.getElementById('name-pt').value || null,
    card_game: document.getElementById('card-game').value,
    edition_id: document.getElementById('edition').value,
  };

  hideFormError();
  if (!card.name_en.trim()) return showFormError('Enter the English name.', document.getElementById('name-en'));
  if (!card.card_game) return showFormError('Choose a card game.', document.getElementById('card-game'));
  if (!card.edition_id) return showFormError('Choose an edition.', document.getElementById('edition'));

  // Disabled while the request runs, so a double click cannot save the
  // same new card twice.
  setBusy(saveBtn, true, 'Saving...');
  const { status, body } = await track(editingId
    ? updateCard({ id: editingId, ...card })
    : createCard(card));
  setBusy(saveBtn, false);

  if (status === 401) return goToLogin();

  if (!body.ok) {
    showFormError(body.error, fieldForError(body.error));
    return;
  }

  const message = editingId ? `"${card.name_en}" was updated.` : `"${card.name_en}" joined your collection.`;
  closeForm();
  clearToasts('error');
  await loadCards();
  notify(message);
});

// Asks for confirmation and, on "Delete", runs the request while the dialog
// stays open with a busy button, so it never closes before the server
// answered. Resolves to the API result, or null when the card was kept.
function confirmAndDelete(card) {
  const dialog = document.getElementById('confirm-dialog');
  const form = dialog.querySelector('form');
  const confirmBtn = form.querySelector('[value=confirm]');
  const cancelBtn = form.querySelector('[value=cancel]');
  let running = false;

  document.getElementById('confirm-message').textContent = `Delete "${card.name_en}"? This cannot be undone.`;

  return new Promise((resolve) => {
    const onSubmit = async (event) => {
      if (event.submitter?.value !== 'confirm') return;
      event.preventDefault();
      running = true;
      setBusy(confirmBtn, true, 'Deleting...');
      cancelBtn.disabled = true;

      const result = await track(deleteCard(card.id));

      setBusy(confirmBtn, false);
      cancelBtn.disabled = false;
      running = false;
      resolve(result);
      dialog.close();
    };
    // Esc is ignored while the request runs, it cannot be taken back.
    const onCancel = (event) => {
      if (running) event.preventDefault();
    };
    const onClose = () => {
      form.removeEventListener('submit', onSubmit);
      dialog.removeEventListener('cancel', onCancel);
      resolve(null);
    };

    form.addEventListener('submit', onSubmit);
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onClose, { once: true });
    dialog.showModal();
  });
}

async function handleDelete(card) {
  const result = await confirmAndDelete(card);
  if (!result) return;

  if (result.status === 401) return goToLogin();

  if (result.body.ok) {
    // The card dissolves before the list reloads without it.
    document.querySelectorAll(`[data-id="${card.id}"]`).forEach((el) => el.classList.add('is-removing'));
    await new Promise((resolve) => setTimeout(resolve, 450));
    clearToasts('error');
    await loadCards();
    notify(`"${card.name_en}" was removed from your collection.`);
  } else {
    await loadCards();
    notify(`"${card.name_en}" could not be deleted. ${result.body.error}`, 'error');
  }
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
  const drawer = document.getElementById('card-form-section');
  if (event.key === 'Escape' && !drawer.hidden && !isSaving()) {
    closeForm();
  }
});

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', closeForm);

document.getElementById('retry-list').addEventListener('click', (event) => {
  setBusy(event.currentTarget, true, 'Loading...');
  loadCards();
});

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', async () => {
  setBusy(logoutBtn, true, 'Logging out...');
  const { body } = await track(logout());

  if (!body.ok) {
    setBusy(logoutBtn, false);
    notify(`Could not log out. ${body.error}`, 'error');
    return;
  }

  window.location.href = 'login.html';
});

setView(savedView());
loadCards();
