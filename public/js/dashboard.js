const GAME_LABELS = { magic: 'Magic: The Gathering', pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!' };

let editingId = null;
let editionsRequestToken = 0;

async function loadCards() {
  const { body } = await listCards();
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

async function handleDelete(card) {
  if (!confirm(`Delete "${card.name_en}"? This cannot be undone.`)) return;
  await deleteCard(card.id);
  loadCards();
}

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', closeForm);

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout();
  window.location.href = 'login.html';
});

loadCards();
