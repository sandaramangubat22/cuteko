import { sb } from "../supabase.js";
import { initPage, getCurrentUser, homeFor } from "../auth.js";
import { $, param, setBusy } from "../ui.js";

await initPage();

const form = $("#login-form");
const errorEl = $("#login-error");
const successEl = $("#login-success");

if (param("reset")) {
  successEl.textContent = "Password updated. Sign in with your new password.";
  successEl.classList.remove("hidden");
}

function safeNext(value) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    errorEl.textContent = "Enter your email and password.";
    errorEl.classList.remove("hidden");
    return;
  }

  const button = $("#login-submit");
  setBusy(button, true, "Signing in…");

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent =
      error.message === "Invalid login credentials"
        ? "Wrong email or password. Please try again."
        : error.message;
    errorEl.classList.remove("hidden");
    setBusy(button, false);
    return;
  }

  const me = await getCurrentUser(true);
  const next = safeNext(param("next"));
  location.replace(next || homeFor(me?.profile?.role));
});
