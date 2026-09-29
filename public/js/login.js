const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = loginForm.querySelector('[type=submit]');
const errorEl = document.getElementById('login-error');
const screen = document.querySelector('.screen');

// Arriving here from a 401 on the dashboard means the session ended, which
// deserves an explanation instead of a silent jump back to this page.
if (new URLSearchParams(window.location.search).has('expired')) {
  const notice = document.getElementById('login-notice');
  notice.textContent = 'Your session ended. Press Start to log in again.';
  notice.hidden = false;
}

document.getElementById('show-password').addEventListener('change', (event) => {
  passwordInput.type = event.target.checked ? 'text' : 'password';
});

watchCapsLock(passwordInput, document.getElementById('caps-hint'));

// Errors show in the text box and shake the screen, the way the games
// reacted to a wrong move. The shake is skipped for reduced motion.
function showLoginError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  replayAnimation(screen, 'shake');
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

  setBusy(submitBtn, true, 'Now loading');
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
  setBusy(submitBtn, true, 'Loading cards');
  window.location.href = 'dashboard.php';
});
