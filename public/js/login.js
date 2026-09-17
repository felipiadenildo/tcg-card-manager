document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  const { body } = await login(email, password);

  if (!body.ok) {
    errorEl.textContent = body.error;
    errorEl.hidden = false;
    return;
  }

  window.location.href = 'dashboard.php';
});
