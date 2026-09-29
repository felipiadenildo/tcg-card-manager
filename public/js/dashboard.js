const GAME_LABELS = { magic: 'Magic: The Gathering', pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!' };

// Fixed markup, never built from user data, so it is safe to set as HTML.
const ICONS = {
  edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>',
  delete: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
};

let editingId = null;
let editionsRequestToken = 0;

async function loadCards() {
  const { status, body } = await listCards();

  // The session can expire while the page is open. Sending the user back
  // to sign in is clearer than showing an empty list with no explanation.
  if (status === 401) {
    window.location.href = 'login.html';
    return;
  }

  renderTable(body.data);
}

function showStatus(message) {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.hidden = false;
}

function hideStatus() {
  document.getElementById('status-message').hidden = true;
}

function renderTable(cards) {
  const tbody = document.getElementById('cards-body');
  tbody.innerHTML = '';
  document.getElementById('card-count').textContent =
    cards.length === 1 ? '1 card in the list' : `${cards.length} cards in the list`;

  if (cards.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty';
    cell.textContent = 'There are no cards yet. Use "Add a card" to create the first one.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  cards.forEach((card) => {
    const row = document.createElement('tr');

    const nameEnCell = document.createElement('td');
    nameEnCell.textContent = card.name_en;
    nameEnCell.className = 'cell-name';

    const namePtCell = document.createElement('td');
    namePtCell.textContent = card.name_pt || '—';

    const gameCell = document.createElement('td');
    const gameTag = document.createElement('span');
    gameTag.className = 'game-tag';
    gameTag.dataset.game = card.card_game;
    gameTag.textContent = GAME_LABELS[card.card_game];
    gameCell.appendChild(gameTag);

    const editionCell = document.createElement('td');
    editionCell.textContent = card.edition_name;

    const actionsCell = document.createElement('td');
    actionsCell.className = 'cell-actions';

    // Every row has an "Edit" and a "Delete" button. The aria-label adds the
    // card name, so a screen reader announces which card each one acts on.
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary btn-small';
    editBtn.innerHTML = `${ICONS.edit}<span>Edit</span>`;
    editBtn.setAttribute('aria-label', `Edit ${card.name_en}`);
    editBtn.addEventListener('click', () => openForm(card));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger-outline btn-small';
    deleteBtn.innerHTML = `${ICONS.delete}<span>Delete</span>`;
    deleteBtn.setAttribute('aria-label', `Delete ${card.name_en}`);
    deleteBtn.addEventListener('click', () => handleDelete(card));

    actionsCell.append(editBtn, deleteBtn);

    // Read by the CSS on small screens, where each row stacks into a block
    // and the column headers are no longer visible above the values.
    nameEnCell.dataset.label = 'Name (EN)';
    namePtCell.dataset.label = 'Name (PT)';
    gameCell.dataset.label = 'Game';
    editionCell.dataset.label = 'Edition';

    row.append(nameEnCell, namePtCell, gameCell, editionCell, actionsCell);
    tbody.appendChild(row);
  });
}

function openForm(card) {
  editingId = card ? card.id : null;
  document.getElementById('card-form-title').textContent = card ? `Edit "${card.name_en}"` : 'New card';
  document.getElementById('card-form').reset();
  document.getElementById('card-form-error').hidden = true;
  hideStatus();

  const editionSelect = document.getElementById('edition');
  editionSelect.innerHTML = '<option value="">Select a Card Game first...</option>';
  editionSelect.disabled = true;

  const section = document.getElementById('card-form-section');
  section.hidden = false;

  if (card) {
    document.getElementById('name-en').value = card.name_en;
    document.getElementById('name-pt').value = card.name_pt || '';
    document.getElementById('card-game').value = card.card_game;
    loadEditions(card.card_game, card.edition_id);
  }

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('name-en').focus({ preventScroll: true });
}

function closeForm() {
  document.getElementById('card-form-section').hidden = true;
  editingId = null;
  document.getElementById('new-card-btn').focus();
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

  editionSelect.innerHTML = '<option value="">Choose an edition</option>';
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

  const saveBtn = event.target.querySelector('[type=submit]');
  const card = {
    name_en: document.getElementById('name-en').value,
    name_pt: document.getElementById('name-pt').value || null,
    card_game: document.getElementById('card-game').value,
    edition_id: document.getElementById('edition').value,
  };

  // Disabled while the request runs, so a double click cannot save the
  // same new card twice.
  saveBtn.disabled = true;
  const { body } = editingId
    ? await updateCard({ id: editingId, ...card })
    : await createCard(card);
  saveBtn.disabled = false;

  if (!body.ok) {
    const errorEl = document.getElementById('card-form-error');
    errorEl.textContent = body.error;
    errorEl.hidden = false;
    return;
  }

  const message = editingId ? `Changes to "${card.name_en}" were saved.` : `"${card.name_en}" was added.`;
  closeForm();
  await loadCards();
  showStatus(message);
});

// Same question the browser confirm() used to ask, shown in a dialog with
// clearly named buttons. Resolves true only for "Delete card", so Esc or
// "Keep card" both leave the card untouched.
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
  if (!(await confirmDialog(`"${card.name_en}" will be removed from the list. This cannot be undone.`))) return;
  await deleteCard(card.id);
  await loadCards();
  showStatus(`"${card.name_en}" was deleted.`);

  // The button that had focus no longer exists, so focus moves back to the
  // top of the list instead of getting lost at the start of the page.
  document.getElementById('main').focus();
}

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', closeForm);

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout();
  window.location.href = 'login.html';
});

loadCards();
