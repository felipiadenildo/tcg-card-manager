const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = loginForm.querySelector('[type=submit]');
const errorEl = document.getElementById('login-error');

// Arriving here from a 401 on the dashboard means the session ended, which
// deserves an explanation instead of a silent jump back to this page.
if (new URLSearchParams(window.location.search).has('expired')) {
  const notice = document.getElementById('login-notice');
  notice.textContent = 'Your session has ended. Please sign in again.';
  notice.hidden = false;
}

document.getElementById('show-password').addEventListener('change', (event) => {
  passwordInput.type = event.target.checked ? 'text' : 'password';
});

watchCapsLock(passwordInput, document.getElementById('caps-hint'));

function showLoginError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitBtn.disabled) return;

  errorEl.hidden = true;
  clearInvalid(loginForm);

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // The form is novalidate so these messages match the rest of the page,
  // instead of the browser's own tooltip, which differs between browsers
  // and is easy to miss.
  if (!email || !password) {
    if (!email) markInvalid(emailInput, 'Enter your email address.');
    if (!password) markInvalid(passwordInput, 'Enter your password.');
    showLoginError('Enter both your email and your password.');
    (email ? passwordInput : emailInput).focus();
    return;
  }

  setBusy(submitBtn, true, 'Signing in...');
  const { status, body } = await track(login(email, password));

  if (!body.ok) {
    setBusy(submitBtn, false);
    showLoginError(body.error);

    // A 401 here is a wrong email or password. Both fields get marked,
    // since the API does not say which one was wrong, and the password is
    // selected so it can be typed again straight away.
    if (status === 401) {
      markInvalid(emailInput);
      markInvalid(passwordInput);
      passwordInput.focus();
      passwordInput.select();
    }
    return;
  }

  // Stays busy on purpose until the dashboard replaces this page.
  setBusy(submitBtn, true, 'Opening the card list...');
  window.location.href = 'dashboard.php';
});
