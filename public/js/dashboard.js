const GAME_LABELS = { magic: 'Magic: The Gathering', pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!' };

// Fixed markup, never built from user data, so it is safe to set as HTML.
const ICONS = {
  edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>',
  delete: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
};

const cardForm = document.getElementById('card-form');
const formDialog = document.getElementById('card-form-section');
const tbody = document.getElementById('cards-body');

let editingId = null;
let editionsRequestToken = 0;

// Set as soon as the user types or picks something, so closing the form
// can ask before throwing that work away.
let formDirty = false;
cardForm.addEventListener('input', () => {
  formDirty = true;
});

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

// Replaces the table body with a message and a retry button, so a failed
// load never looks like an empty list.
function renderListError(message) {
  document.getElementById('card-count').textContent = 'The card list could not be loaded.';

  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 5;
  cell.className = 'list-error';

  const text = document.createElement('p');
  text.setAttribute('role', 'alert');
  text.textContent = `The card list could not be loaded. ${message}`;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'btn btn-secondary';
  retry.textContent = 'Try again';
  retry.addEventListener('click', async () => {
    setBusy(retry, true, 'Loading...');
    await loadCards();
  });

  cell.append(text, retry);
  row.appendChild(cell);
  tbody.replaceChildren(row);
}

function renderTable(cards) {
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
    row.dataset.id = card.id;

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
    editBtn.dataset.action = 'edit';
    editBtn.dataset.name = card.name_en;
    editBtn.addEventListener('click', () => openForm(card));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger-outline btn-small';
    deleteBtn.innerHTML = `${ICONS.delete}<span>Delete</span>`;
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

// Lists every problem at the top of the form, each one a link that moves
// focus to its field, and marks the fields themselves. Focus goes to the
// summary so keyboard and screen reader users land on it right away.
function showFormErrors(errors) {
  const summary = document.getElementById('error-summary');
  const list = summary.querySelector('ul');
  list.innerHTML = '';

  errors.forEach(({ field, message }) => {
    const item = document.createElement('li');
    if (field) {
      markInvalid(field, message);
      const link = document.createElement('a');
      link.href = `#${field.id}`;
      link.textContent = message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        field.focus();
      });
      item.appendChild(link);
    } else {
      item.textContent = message;
    }
    list.appendChild(item);
  });

  summary.hidden = false;
  summary.focus();
}

function hideFormErrors() {
  document.getElementById('error-summary').hidden = true;
  clearInvalid(cardForm);
}

// Checked before sending, so the most common mistakes get a clear message
// next to the right field without waiting for the server.
function validateForm(card) {
  const errors = [];
  if (!card.name_en.trim()) {
    errors.push({ field: document.getElementById('name-en'), message: 'Enter the card name in English.' });
  }
  if (card.name_en.length > 150) {
    errors.push({ field: document.getElementById('name-en'), message: 'Names can be at most 150 characters long.' });
  }
  if (!card.card_game) {
    errors.push({ field: document.getElementById('card-game'), message: 'Choose the card game.' });
  } else if (!card.edition_id) {
    errors.push({ field: document.getElementById('edition'), message: 'Choose the edition.' });
  }
  return errors;
}

function openForm(card) {
  editingId = card ? card.id : null;
  document.getElementById('card-form-title').textContent = card ? `Edit "${card.name_en}"` : 'New card';
  cardForm.reset();
  hideFormErrors();
  resetEditionSelect();

  formDirty = false;
  document.getElementById('discard-bar').hidden = true;

  // A modal dialog opens in front of the list, wherever the user clicked,
  // so there is no scrolling to find the form. Focus stays inside it and
  // returns to the button that opened it when it closes.
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
  document.getElementById('discard-bar').hidden = true;
}

// Every way of leaving the form (Cancel, the X button, Esc) goes through
// here. Unsaved changes get a question first instead of disappearing, and
// nothing closes while a save is still running.
function requestCloseForm() {
  if (cardForm.querySelector('[type=submit]').disabled) return;

  if (formDirty) {
    document.getElementById('discard-bar').hidden = false;
    document.getElementById('keep-editing-btn').focus();
    return;
  }

  closeForm();
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

  hideFormErrors();
  const errors = validateForm(card);
  if (errors.length > 0) {
    showFormErrors(errors);
    return;
  }

  // Disabled while the request runs, so a double click cannot save the
  // same new card twice.
  setBusy(saveBtn, true, 'Saving...');
  const { status, body } = await track(editingId
    ? updateCard({ id: editingId, ...card })
    : createCard(card));
  setBusy(saveBtn, false);

  if (status === 401) return goToLogin();

  if (!body.ok) {
    showFormErrors([{ field: fieldForError(body.error), message: body.error }]);
    return;
  }

  const message = editingId ? `Changes to "${card.name_en}" were saved.` : `"${card.name_en}" was added.`;
  closeForm();
  clearToasts('error');
  await loadCards();
  notify(message);

  // The list was redrawn, so the button that opened the form is gone.
  document.getElementById('main').focus();
});

// Asks for confirmation and, if confirmed, runs the delete while the dialog
// stays open with a busy "Deleting..." button, so the user sees the request
// finish instead of a dialog that closes before anything happened.
// Resolves to the API result, or null when the user kept the card.
function confirmAndDelete(card) {
  const dialog = document.getElementById('confirm-dialog');
  const form = dialog.querySelector('form');
  const confirmBtn = form.querySelector('[value=confirm]');
  const cancelBtn = form.querySelector('[value=cancel]');
  let running = false;

  document.getElementById('confirm-message').textContent =
    `"${card.name_en}" will be removed from the list. This cannot be undone.`;

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
    const row = tbody.querySelector(`tr[data-id="${card.id}"]`);
    if (row) row.classList.add('is-removing');
    await new Promise((resolve) => setTimeout(resolve, 250));
    clearToasts('error');
    await loadCards();
    notify(`"${card.name_en}" was deleted.`);
  } else {
    await loadCards();
    notify(`"${card.name_en}" could not be deleted. ${result.body.error}`, 'error');
  }

  // The button that had focus may no longer exist, so focus moves back to
  // the top of the list instead of getting lost at the start of the page.
  document.getElementById('main').focus();
}

document.getElementById('new-card-btn').addEventListener('click', () => openForm(null));
document.getElementById('cancel-card-btn').addEventListener('click', requestCloseForm);
document.getElementById('close-form-btn').addEventListener('click', requestCloseForm);

// Esc on a modal dialog closes it by default. Here it asks first, like the
// other ways out of the form.
formDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  requestCloseForm();
});

document.getElementById('keep-editing-btn').addEventListener('click', () => {
  document.getElementById('discard-bar').hidden = true;
  document.getElementById('name-en').focus();
});
document.getElementById('discard-btn').addEventListener('click', closeForm);

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', async () => {
  setBusy(logoutBtn, true, 'Signing out...');
  const { body } = await track(logout());

  if (!body.ok) {
    setBusy(logoutBtn, false);
    notify(`Could not sign out. ${body.error}`, 'error');
    return;
  }

  window.location.href = 'login.html';
});

loadCards();
