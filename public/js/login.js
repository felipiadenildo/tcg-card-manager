const loginForm = document.getElementById('login-form');
const submitBtn = loginForm.querySelector('[type=submit]');

document.getElementById('show-password').addEventListener('change', (event) => {
  document.getElementById('password').type = event.target.checked ? 'text' : 'password';
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  // The form is novalidate so this message matches the rest of the page,
  // instead of the browser's own tooltip, which differs between browsers
  // and is easy to miss.
  if (!email || !password) {
    errorEl.textContent = 'Enter both your email and your password.';
    errorEl.hidden = false;
    return;
  }

  errorEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  const { body } = await login(email, password);

  if (!body.ok) {
    errorEl.textContent = body.error;
    errorEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
    return;
  }

  window.location.href = 'dashboard.php';
});
