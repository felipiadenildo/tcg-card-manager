const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = loginForm.querySelector('[type=submit]');
const errorEl = document.getElementById('login-error');
const toggleBtn = document.getElementById('show-password');

// Arriving here from a 401 on the dashboard means the session ended, which
// deserves an explanation instead of a silent jump back to this page.
if (new URLSearchParams(window.location.search).has('expired')) {
  const notice = document.getElementById('login-notice');
  notice.textContent = 'Your session has ended. Log in again to continue.';
  notice.hidden = false;
}

// The eye button inside the field. aria-pressed and the label tell screen
// readers the current state, the icon swaps through CSS.
toggleBtn.addEventListener('click', () => {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  toggleBtn.setAttribute('aria-pressed', String(show));
  toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

watchCapsLock(passwordInput, document.getElementById('caps-hint'));

function showLoginError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  replayAnimation(loginForm, 'shake');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitBtn.disabled) return;

  errorEl.hidden = true;
  clearInvalid(loginForm);

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    if (!email) markInvalid(emailInput, 'Enter your email.');
    if (!password) markInvalid(passwordInput, 'Enter your password.');
    showLoginError('Enter both your email and your password.');
    (email ? passwordInput : emailInput).focus();
    return;
  }

  setBusy(submitBtn, true, 'Logging in...');
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

  // Stays busy on purpose until the collection replaces this page.
  setBusy(submitBtn, true, 'Opening your collection...');
  window.location.href = 'dashboard.php';
});
