const signupForm = document.getElementById('signup-form');
const signupStatus = document.getElementById('signup-status');

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!isConfigValid()) {
    signupStatus.textContent = 'Add your Supabase anon key in auth.js before signing up.';
    return;
  }

  const username = document.getElementById('new-username').value.trim();
  const email = document.getElementById('new-email').value.trim();
  const password = document.getElementById('new-password').value;

  try {
    signupStatus.textContent = 'Creating account...';
    const result = await signUp({ username, email, password });

    signupStatus.textContent = result.needsEmailConfirmation
      ? result.message
      : 'Account created. Redirecting to dashboard...';

    if (!result.needsEmailConfirmation) {
      window.location.href = 'user.html';
    }
  } catch (error) {
    signupStatus.textContent = error.message;
  }
});
