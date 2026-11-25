import { sb } from "../supabase.js";
import { initPage, getCurrentUser, askRole } from "../auth.js";
import { $, param, setBusy } from "../ui.js";

await initPage();

const form = $("#register-form");
const errorEl = $("#register-error");
const successEl = $("#register-success");

const roleInput = (value) => form.querySelector(`input[name="role"][value="${value}"]`);
const preset = param("role");

if (preset === "job_seeker" || preset === "employer") {
  roleInput(preset).checked = true;
} else {
  askRole({
    title: "How will you use the portal?",
    intro: "Choose an account type and we'll fill in the form for you.",
    onPick: (role) => {
      roleInput(role).checked = true;
      form.username.focus();
    },
  });
}

function showError(message) {
  successEl.classList.add("hidden");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  const role = form.querySelector('input[name="role"]:checked').value;
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirm = form.confirm.value;

  if (username.length < 3) return showError("Username must be at least 3 characters.");
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) return showError("Username can only use letters, numbers, dots, dashes, and underscores.");
  if (!email) return showError("Enter your email address.");
  if (password.length < 6) return showError("Password must be at least 6 characters.");
  if (password !== confirm) return showError("Passwords do not match.");

  const button = $("#register-submit");
  setBusy(button, true, "Creating account…");

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { username, role },
      emailRedirectTo: `${location.origin}/login.html`,
    },
  });

  if (error) {
    setBusy(button, false);
    showError(
      error.message === "User already registered"
        ? "That email is already registered. Try signing in instead."
        : error.message
    );
    return;
  }

  if (data.session) {
    const me = await getCurrentUser(true);
    if (me?.profile?.role === "employer") {
      location.replace("/employer/company.html?setup=1");
    } else {
      location.replace("/profile.html?setup=1");
    }
    return;
  }

  setBusy(button, false);
  form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
  successEl.textContent =
    "Account created. Check your email inbox for a confirmation link, then sign in.";
  successEl.classList.remove("hidden");
});
