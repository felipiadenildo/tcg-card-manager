// Requests give up after this long, so a server that never answers ends in
// an error message instead of a page that looks stuck forever.
const REQUEST_TIMEOUT_MS = 15000;

// Always resolves to { status, body }, and body always has the { ok, error }
// shape the API uses, even when the request never reached PHP (network
// down, timeout, a proxy error page instead of JSON). Callers only ever need
// to check body.ok.
async function apiRequest(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });

    try {
      const body = await response.json();
      return { status: response.status, body };
    } catch {
      return {
        status: response.status,
        body: { ok: false, error: 'The server sent an unexpected response. Please try again.' },
      };
    }
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'The server took too long to answer. Please try again.'
      : 'Could not reach the server. Check your connection and try again.';
    return { status: 0, body: { ok: false, error: message } };
  } finally {
    clearTimeout(timer);
  }
}

// Paths are relative on purpose, so the app keeps working when it is served
// from a subfolder or behind a proxy that adds a path prefix.

function login(email, password) {
  return apiRequest('api/login.php', { method: 'POST', body: JSON.stringify({ email, password }) });
}

function logout() {
  return apiRequest('api/logout.php', { method: 'POST' });
}

function listCards() {
  return apiRequest('api/cards.php');
}

function createCard(card) {
  return apiRequest('api/cards.php', { method: 'POST', body: JSON.stringify(card) });
}

function updateCard(card) {
  return apiRequest('api/cards.php', { method: 'PUT', body: JSON.stringify(card) });
}

function deleteCard(id) {
  return apiRequest('api/cards.php', { method: 'DELETE', body: JSON.stringify({ id }) });
}

function fetchEditions(game) {
  return apiRequest(`api/editions.php?game=${encodeURIComponent(game)}`);
}
