import { sb } from "../supabase.js";
import { initPage, getCurrentUser } from "../auth.js";
import { $, setBusy } from "../ui.js";

await initPage();

const cfg = window.APP_CONFIG || {};
const contactEmail = cfg.CONTACT_EMAIL || "careers@mistjobportal.test";
const contactLink = $("#contact-email");
if (contactLink) {
  contactLink.textContent = contactEmail;
  contactLink.href = `mailto:${contactEmail}`;
}

const me = await getCurrentUser();
const form = $("#report-form");
const errorEl = $("#report-error");
const successEl = $("#report-success");
const submit = $("#report-submit");

if (me) {
  form.name.value = me.profile?.username || "";
  form.email.value = me.user?.email || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  const message = form.message.value.trim();
  if (message.length < 10) {
    errorEl.textContent = "Please describe the issue in at least 10 characters.";
    errorEl.classList.remove("hidden");
    return;
  }

  setBusy(submit, true, "Sending…");

  const { error } = await sb.from("feedback").insert({
    user_id: me?.user?.id || null,
    name: form.name.value.trim() || null,
    email: form.email.value.trim() || null,
    category: form.category.value,
    message,
    page_url: location.pathname + location.search,
  });

  setBusy(submit, false);

  if (error) {
    errorEl.textContent =
      error.code === "42P01"
        ? "The feedback table is not installed yet. Run the latest docs/schema.sql in Supabase."
        : error.message;
    errorEl.classList.remove("hidden");
    return;
  }

  form.reset();
  if (me) {
    form.name.value = me.profile?.username || "";
    form.email.value = me.user?.email || "";
  }
  successEl.textContent = "Report sent. Thank you — it is now visible in the admin console.";
  successEl.classList.remove("hidden");
});
