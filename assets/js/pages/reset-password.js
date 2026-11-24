import { sb } from "../supabase.js";
import { initPage } from "../auth.js";
import { $, setBusy } from "../ui.js";

await initPage();

const form = $("#reset-form");
const errorEl = $("#reset-error");
const fallback = $("#reset-fallback");
const messageEl = $("#reset-message");
const intro = $("#reset-intro");
const submit = $("#reset-submit");

function showFallback(message) {
  form.classList.add("hidden");
  fallback.classList.remove("hidden");
  messageEl.textContent = message;
  intro.textContent = "This reset link can no longer be used.";
}

const {
  data: { session },
} = await sb.auth.getSession();

if (!session) {
  showFallback("Your reset link is invalid or has expired. Request a new one to continue.");
} else {
  form.classList.remove("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");

  const password = form.password.value;
  const confirm = form.confirm.value;

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (password !== confirm) {
    errorEl.textContent = "Passwords do not match.";
    errorEl.classList.remove("hidden");
    return;
  }

  setBusy(submit, true, "Updating…");

  const { error } = await sb.auth.updateUser({ password });

  if (error) {
    setBusy(submit, false);
    errorEl.textContent = error.message;
    errorEl.classList.remove("hidden");
    return;
  }

  await sb.auth.signOut();
  location.replace("/login.html?reset=1");
});
