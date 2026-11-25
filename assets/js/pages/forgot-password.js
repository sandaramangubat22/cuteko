import { sb } from "../supabase.js";
import { initPage } from "../auth.js";
import { $, setBusy } from "../ui.js";

await initPage();

const form = $("#forgot-form");
const errorEl = $("#forgot-error");
const successEl = $("#forgot-success");
const submit = $("#forgot-submit");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  const email = form.email.value.trim();
  if (!email) {
    errorEl.textContent = "Enter the email address on your account.";
    errorEl.classList.remove("hidden");
    return;
  }

  setBusy(submit, true, "Sending…");

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/reset-password.html`,
  });

  setBusy(submit, false);

  if (error) {
    errorEl.textContent =
      error.status === 429
        ? "Too many reset emails requested. Please wait a few minutes and try again."
        : error.message;
    errorEl.classList.remove("hidden");
    return;
  }

  form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
  successEl.textContent =
    "If that email is registered, a reset link is on its way. Check your inbox and spam folder.";
  successEl.classList.remove("hidden");
});
