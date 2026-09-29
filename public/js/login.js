document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  const submitBtn = event.target.querySelector('[type=submit]');

  // Disabled while the request runs, so the user can tell something is
  // happening and cannot send the same login twice.
  errorEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  const { body } = await login(email, password);

  if (!body.ok) {
    errorEl.textContent = body.error;
    errorEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in';
    return;
  }

  window.location.href = 'dashboard.php';
});
