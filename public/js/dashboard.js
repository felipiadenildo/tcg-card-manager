const GAME_LABELS = { magic: 'Magic: The Gathering', pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!' };

const cardForm = document.getElementById('card-form');
const tbody = document.getElementById('cards-body');
const formError = document.getElementById('card-form-error');
const formDialog = document.getElementById('card-form-section');

let editingId = null;
let editionsRequestToken = 0;

async function loadCards() {
  tbody.setAttribute('aria-busy', 'true');
  const { status, body } = await track(listCards());
  tbody.removeAttribute('aria-busy');

  if (status === 401) return goToLogin();

  if (!body.ok) {
    renderListError(body.error);
    return;
  }

  renderTable(body.data);
}

// A single row holding the message and a retry button, so a failed load
// never looks like an empty box.
function renderListError(message) {
  document.getElementById('card-count').textContent = '';

  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 5;
  cell.className = 'list-state';

  const text = document.createElement('p');
  text.className = 'list-error';
  text.setAttribute('role', 'alert');
  text.textContent = `Could not load the cards! ${message}`;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Try again';
  retry.addEventListener('click', async () => {
    setBusy(retry, true, 'Now loading');
    await loadCards();
  });

  cell.append(text, retry);
  row.appendChild(cell);
  tbody.replaceChildren(row);
}

function renderTable(cards) {
  tbody.innerHTML = '';
  document.getElementById('card-count').textContent = `x${String(cards.length).padStart(2, '0')}`;

  if (cards.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty';
    cell.textContent = 'No cards in the box yet.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  cards.forEach((card) => {
    const row = document.createElement('tr');
    row.dataset.id = card.id;

    const nameEnCell = document.createElement('td');
    nameEnCell.textContent = card.name_en;

    const namePtCell = document.createElement('td');
    namePtCell.textContent = card.name_pt || '—';

    const gameCell = document.createElement('td');
    const gameBadge = document.createElement('span');
    gameBadge.className = 'game-badge';
    gameBadge.dataset.game = card.card_game;
    gameBadge.textContent = GAME_LABELS[card.card_game];
    gameCell.appendChild(gameBadge);

    const editionCell = document.createElement('td');
    editionCell.textContent = card.edition_name;

    const actionsCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${card.name_en}`);
    editBtn.dataset.action = 'edit';
    editBtn.dataset.name = card.name_en;
    editBtn.addEventListener('click', () => openForm(card));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${card.name_en}`);
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.name = card.name_en;
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

function showFormError(message, field) {
  formError.textContent = message;
  formError.hidden = false;
  if (field) {
    markInvalid(field, message);
    field.focus();
  }
}

function hideFormError() {
  formError.hidden = true;
  clearInvalid(cardForm);
}

function openForm(card) {
  editingId = card ? card.id : null;
  document.getElementById('card-form-title').textContent = card ? 'Edit card' : 'New card';
  cardForm.reset();
  hideFormError();
  resetEditionSelect();

  // The form pops up as a menu window in front of the list, wherever the
  // user clicked, so there is no scrolling to find it. Focus stays inside
  // it and goes back to the button that opened it when it closes.
  formDialog.showModal();

  if (card) {
    document.getElementById('name-en').value = card.name_en;
    document.getElementById('name-pt').value = card.name_pt || '';
    document.getElementById('card-game').value = card.card_game;
    loadEditions(card.card_game, card.edition_id);
  }

  document.getElementById('name-en').focus();
}

function closeForm() {
  formDialog.close();
  editingId = null;
  editionsRequestToken += 1;
}

// Esc closes the window like Cancel, except while a save is running.
formDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  if (!cardForm.querySelector('[type=submit]').disabled) closeForm();
});

function resetEditionSelect() {
  const editionSelect = document.getElementById('edition');
  editionSelect.innerHTML = '<option value="">Select a Card Game first...</option>';
  editionSelect.disabled = true;
  editionSelect.classList.remove('is-loading-select');
  document.getElementById('retry-editions').hidden = true;
}

async function loadEditions(game, selectedId) {
  const requestToken = ++editionsRequestToken;
  const editionSelect = document.getElementById('edition');
  const retry = document.getElementById('retry-editions');

  editionSelect.disabled = true;
  editionSelect.innerHTML = '<option value="">Now loading...</option>';
  editionSelect.classList.add('is-loading-select');
  retry.hidden = true;

  const { status, body } = await track(fetchEditions(game));

  // A newer request may have started while this one was in flight. If so,
  // this response is stale and gets dropped instead of overwriting the
  // select with the wrong game's editions.
  if (requestToken !== editionsRequestToken) {
    return;
  }

  editionSelect.classList.remove('is-loading-select');
  if (status === 401) return goToLogin();

  if (!body.ok) {
    editionSelect.innerHTML = '<option value="">Editions could not be loaded</option>';
    markInvalid(editionSelect, `Could not load the editions! ${body.error}`);
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
  setBusy(saveBtn, true, 'Saving');
  const { status, body } = await track(editingId
    ? updateCard({ id: editingId, ...card })
    : createCard(card));
  setBusy(saveBtn, false);

  if (status === 401) return goToLogin();

  if (!body.ok) {
    showFormError(body.error, fieldForError(body.error));
    return;
  }

  const message = editingId ? `${card.name_en} was updated!` : `${card.name_en} was put in the box!`;
  closeForm();
  clearToasts('error');
  await loadCards();
  notify(message);
});

// Asks "Yes / No" in the game style text box and, on "Yes", runs the delete
// while the box stays open with "Deleting" on the button, so it never
// closes before the server answered. Resolves to the API result, or null
// when the card was kept.
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
      setBusy(confirmBtn, true, 'Deleting');
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
    const row = tbody.querySelector(`tr[data-id="${card.id}"]`);
    if (row) row.classList.add('is-removing');
    await new Promise((resolve) => setTimeout(resolve, 400));
    clearToasts('error');
    await loadCards();
    notify(`${card.name_en} was removed from the box.`);
  } else {
    await loadCards();
    notify(`Could not delete "${card.name_en}"! ${result.body.error}`, 'error');
  }
}

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', closeForm);

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', async () => {
  setBusy(logoutBtn, true, 'Logging out');
  const { body } = await track(logout());

  if (!body.ok) {
    setBusy(logoutBtn, false);
    notify(`Could not log out! ${body.error}`, 'error');
    return;
  }

  window.location.href = 'login.html';
});

loadCards();
