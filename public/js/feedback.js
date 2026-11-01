// Feedback helpers shared by the login page and the dashboard: busy
// buttons, a notice for slow requests, toast messages, field errors and an
// offline banner. The logic is the same in every theme, only style.css
// decides how each state looks.

const SLOW_REQUEST_MS = 5000;
const TOAST_MS = 6000;

let pendingRequests = 0;
let slowTimer = null;

// Wraps an API call so the page can show that something is in progress
// (the "is-loading" class on <html>), plus a "still working" notice when
// the answer takes longer than usual. Resolves to whatever the call does.
async function track(request) {
  pendingRequests += 1;
  document.documentElement.classList.add('is-loading');
  if (pendingRequests === 1) {
    slowTimer = setTimeout(() => toggleSlowNotice(true), SLOW_REQUEST_MS);
  }

  try {
    return await request;
  } finally {
    pendingRequests -= 1;
    if (pendingRequests === 0) {
      clearTimeout(slowTimer);
      toggleSlowNotice(false);
      document.documentElement.classList.remove('is-loading');
    }
  }
}

function toggleSlowNotice(show) {
  const notice = document.getElementById('slow-notice');
  if (notice) notice.hidden = !show;
}

// Puts a button in its busy state: disabled, marked aria-busy, and showing
// a spinner next to a label that says what is happening. The original
// content comes back when busy is false.
function setBusy(button, busy, label) {
  if (busy) {
    if (button.dataset.idleHtml === undefined) {
      button.dataset.idleHtml = button.innerHTML;
    }
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = label;
    button.replaceChildren(spinner, text);
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('is-busy');
    return;
  }

  if (button.dataset.idleHtml !== undefined) {
    // Restores markup this page wrote itself, never text from the API.
    button.innerHTML = button.dataset.idleHtml;
    delete button.dataset.idleHtml;
  }
  button.disabled = false;
  button.removeAttribute('aria-busy');
  button.classList.remove('is-busy');
}

// Shows a message in the #toasts region. Errors use role="alert" and stay
// until dismissed or replaced, successes use role="status" and fade after
// a few seconds, so nothing important disappears before it can be read.
function notify(message, type = 'success') {
  const region = document.getElementById('toasts');
  // One message of each kind at a time, the newest one is what matters.
  clearToasts(type);

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const text = document.createElement('p');
  text.textContent = message;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Dismiss message');
  close.textContent = '×';
  close.addEventListener('click', () => toast.remove());

  toast.append(text, close);
  region.appendChild(toast);

  if (type !== 'error') {
    setTimeout(() => toast.remove(), TOAST_MS);
  }
  return toast;
}

function clearToasts(type) {
  const selector = type ? `.toast-${type}` : '.toast';
  document.querySelectorAll(`#toasts ${selector}`).forEach((toast) => toast.remove());
}

// Marks a field as invalid for assistive tech and for the CSS, with an
// optional message in the element named by the field's data-error-id.
// The mark clears itself as soon as the user changes the field.
function markInvalid(field, message) {
  field.setAttribute('aria-invalid', 'true');
  const errorEl = field.dataset.errorId && document.getElementById(field.dataset.errorId);
  if (errorEl && message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  const clear = () => {
    field.removeAttribute('aria-invalid');
    if (errorEl) errorEl.hidden = true;
  };
  field.addEventListener('input', clear, { once: true });
  field.addEventListener('change', clear, { once: true });
}

function clearInvalid(form) {
  form.querySelectorAll('[aria-invalid]').forEach((field) => {
    field.removeAttribute('aria-invalid');
    const errorEl = field.dataset.errorId && document.getElementById(field.dataset.errorId);
    if (errorEl) errorEl.hidden = true;
  });
}

// Replays a short CSS animation (a shake on a wrong password, for example).
// Removing and re-adding the class restarts it on repeated errors.
function replayAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
}

// Shows the #offline-banner whenever the browser reports no connection.
function watchConnection() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  const update = () => {
    banner.hidden = navigator.onLine;
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

// Shows a hint while Caps Lock is on, the most common reason a correct
// password gets rejected.
function watchCapsLock(input, hint) {
  const update = (event) => {
    if (typeof event.getModifierState === 'function') {
      hint.hidden = !event.getModifierState('CapsLock');
    }
  };
  input.addEventListener('keydown', update);
  input.addEventListener('keyup', update);
  input.addEventListener('blur', () => {
    hint.hidden = true;
  });
}

// Used whenever the API answers 401: the session is gone, so the user goes
// back to the login page, which explains why.
function goToLogin() {
  window.location.href = 'login.html?expired=1';
}

// Sends the user where the API error belongs: a message about the English
// name marks that field, and so on. Returns the field, or null.
function fieldForError(message) {
  if (/english name|characters/i.test(message)) return document.getElementById('name-en');
  if (/card game/i.test(message)) return document.getElementById('card-game');
  if (/edition/i.test(message)) return document.getElementById('edition');
  return null;
}

watchConnection();
