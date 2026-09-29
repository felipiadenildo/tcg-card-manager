const GAME_LABELS = { magic: 'Magic: The Gathering', pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!' };

let editingId = null;
let editionsRequestToken = 0;

// A 401 means the session ended (logged out in another tab, or expired), so
// the only useful next step is the login page. Returns true when it redirects.
function redirectIfLoggedOut(status) {
  if (status !== 401) return false;
  window.location.href = 'login.html';
  return true;
}

function showListError(message) {
  const errorEl = document.getElementById('list-error');
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function loadCards() {
  const { status, body } = await listCards();
  if (redirectIfLoggedOut(status)) return;

  if (!body.ok) {
    showListError(`Could not load the cards. ${body.error}`);
    return;
  }

  renderTable(body.data);
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
    gameCell.textContent = GAME_LABELS[card.card_game];

    const editionCell = document.createElement('td');
    editionCell.textContent = card.edition_name;

    const actionsCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openForm(card));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => handleDelete(card));

    actionsCell.append(editBtn, deleteBtn);
    row.append(nameEnCell, namePtCell, gameCell, editionCell, actionsCell);
    tbody.appendChild(row);
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

  if (card) {
    document.getElementById('name-en').value = card.name_en;
    document.getElementById('name-pt').value = card.name_pt || '';
    document.getElementById('card-game').value = card.card_game;
    loadEditions(card.card_game, card.edition_id);
  }
}

function closeForm() {
  document.getElementById('card-form-section').hidden = true;
  editingId = null;
}

async function loadEditions(game, selectedId) {
  const requestToken = ++editionsRequestToken;
  const editionSelect = document.getElementById('edition');

  editionSelect.disabled = true;
  editionSelect.innerHTML = '<option value="">Loading editions...</option>';

  const { status, body } = await fetchEditions(game);

  // A newer request may have started while this one was in flight. If so,
  // this response is stale and gets dropped instead of overwriting the
  // select with the wrong game's editions.
  if (requestToken !== editionsRequestToken) {
    return;
  }

  if (redirectIfLoggedOut(status)) return;

  if (!body.ok) {
    editionSelect.innerHTML = '<option value="">Could not load editions</option>';
    const errorEl = document.getElementById('card-form-error');
    errorEl.textContent = `${body.error} Pick the card game again to retry.`;
    errorEl.hidden = false;
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

  // Disabled while the request runs, so a double click cannot save the same
  // new card twice.
  const saveBtn = event.target.querySelector('[type=submit]');
  saveBtn.disabled = true;

  const { status, body } = editingId
    ? await updateCard({ id: editingId, ...card })
    : await createCard(card);

  saveBtn.disabled = false;
  if (redirectIfLoggedOut(status)) return;

  if (!body.ok) {
    const errorEl = document.getElementById('card-form-error');
    errorEl.textContent = body.error;
    errorEl.hidden = false;
    return;
  }

  closeForm();
  showListError('');
  loadCards();
});

async function handleDelete(card) {
  if (!confirm(`Delete "${card.name_en}"? This cannot be undone.`)) return;

  const { status, body } = await deleteCard(card.id);
  if (redirectIfLoggedOut(status)) return;

  showListError(body.ok ? '' : `Could not delete "${card.name_en}". ${body.error}`);
  loadCards();
}

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', closeForm);

document.getElementById('logout-btn').addEventListener('click', async () => {
  const { body } = await logout();

  if (!body.ok) {
    showListError(`Could not log out. ${body.error}`);
    return;
  }

  window.location.href = 'login.html';
});

loadCards();
