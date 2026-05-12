import { signUp } from "./auth.js";

const signupForm = document.getElementById("signup-form");
const signupStatus = document.getElementById("signup-status");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document
    .getElementById("new-username")
    .value.trim();

  const email = document
    .getElementById("new-email")
    .value.trim();

  const password =
    document.getElementById("new-password").value;

  try {
    signupStatus.textContent = "Creating account...";

    const data = await signUp(
      email,
      password,
      username
    );

    /* Email confirmation required */
    if (!data.session) {
      signupStatus.textContent =
        "Account created. Check your email to confirm.";

      return;
    }

    signupStatus.textContent =
      "Account created. Redirecting...";

    window.location.href = "user.html";
  } catch (error) {
    signupStatus.textContent =
      error.message || "Signup failed.";
  }
});