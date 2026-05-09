const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!isConfigValid()) {
    loginStatus.textContent = 'Add your Supabase anon key in auth.js before logging in.';
    return;
  }

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    loginStatus.textContent = 'Signing in...';
    await signIn({ email, password });
    loginStatus.textContent = 'Login successful. Redirecting...';
    window.location.href = 'user.html';
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});
