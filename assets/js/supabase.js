import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
 * Safety net for password-recovery links.
 *
 * Supabase only honours `redirectTo` when the target is listed under
 * Authentication -> URL Configuration -> Redirect URLs. Otherwise the link
 * falls back to the Site URL, so a recovery token can land on the home or
 * dashboard page and the user never sees the "choose a new password" form.
 *
 * This runs before the client below can consume the token, so the hash is
 * still intact and can be forwarded to the reset page.
 */
(() => {
  if (location.pathname.startsWith("/reset-password")) return;

  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (hash.get("type") === "recovery") {
    location.replace(`/reset-password.html${location.hash}`);
  }
})();

const cfg = window.APP_CONFIG || {};

const url = cfg.SUPABASE_URL || "";
const key = cfg.SUPABASE_ANON_KEY || "";

/** True once the student pastes real credentials into assets/js/config.js */
export const isConfigured =
  Boolean(url) &&
  Boolean(key) &&
  !url.includes("YOUR-PROJECT") &&
  !key.includes("YOUR-ANON");

/** Supabase client. Falls back to a harmless placeholder so pages still render. */
export const sb = createClient(
  isConfigured ? url : "https://placeholder.supabase.co",
  isConfigured ? key : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** Show a banner on every page when credentials are missing. */
if (!isConfigured) {
  document.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("div");
    bar.className = "config-warning";
    bar.innerHTML =
      "Supabase is not configured yet — open <code>assets/js/config.js</code> and paste your Project URL + anon key.";
    document.body.prepend(bar);
  });
}
