async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json();
  return { status: response.status, body };
}

function login(email, password) {
  return apiRequest('/api/login.php', { method: 'POST', body: JSON.stringify({ email, password }) });
}

function logout() {
  return apiRequest('/api/logout.php', { method: 'POST' });
}

function listCards() {
  return apiRequest('/api/cards.php');
}

function createCard(card) {
  return apiRequest('/api/cards.php', { method: 'POST', body: JSON.stringify(card) });
}

function updateCard(card) {
  return apiRequest('/api/cards.php', { method: 'PUT', body: JSON.stringify(card) });
}

function deleteCard(id) {
  return apiRequest('/api/cards.php', { method: 'DELETE', body: JSON.stringify({ id }) });
}

function fetchEditions(game) {
  return apiRequest(`/api/editions.php?game=${encodeURIComponent(game)}`);
}
