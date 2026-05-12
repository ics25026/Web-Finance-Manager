
import { signIn } from "./auth.js";

const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    loginStatus.textContent = 'Signing in...';
    await signIn( email, password );
    loginStatus.textContent = 'Login successful. Redirecting...';
    window.location.href = 'user.html';
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});
