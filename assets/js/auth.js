import { sb, isConfigured } from "./supabase.js";
import { escapeHtml, initials, renderFooter, favicon, toast } from "./ui.js";

const ROLE_HOME = {
  job_seeker: "/dashboard.html",
  employer: "/employer/dashboard.html",
  admin: "/admin/dashboard.html",
};

const ROLE_LABEL = {
  job_seeker: "Job seeker",
  employer: "Employer",
  admin: "Admin",
};

export function homeFor(role) {
  return ROLE_HOME[role] || "/";
}

export function roleLabel(role) {
  return ROLE_LABEL[role] || "Guest";
}

let cache = null;

/** Returns { session, user, profile } or null. */
export async function getCurrentUser(force = false) {
  if (!isConfigured) return null;
  if (cache && !force) return cache;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    cache = null;
    return null;
  }

  const { data: profile } = await sb
    .from("users")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  cache = { session, user: session.user, profile: profile || null };
  return cache;
}

/** Redirects to login when signed out, or to the correct dashboard when the role is wrong. */
export async function requireRole(...roles) {
  const me = await getCurrentUser(true);
  if (!me) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/login.html?next=${next}`);
    return null;
  }
  const role = me.profile?.role;
  if (roles.length && !roles.includes(role)) {
    location.replace(role ? homeFor(role) : "/login.html");
    return null;
  }

  favicon();
  await renderHeader();
  renderFooter();
  return me;
}

export async function signOut() {
  await sb.auth.signOut();
  cache = null;
  location.href = "/";
}

/**
 * Opens the "job seeker or employer?" dialog.
 * Pass onPick to handle the choice inline; otherwise it goes to the register page.
 */
export function askRole({ title, intro, onPick } = {}) {
  let dialog = document.getElementById("role-dialog");

  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "role-dialog";
    dialog.className = "modal";
    dialog.innerHTML = `
      <div class="modal-head">
        <h3 id="role-dialog-title">How will you use the portal?</h3>
        <button class="btn btn-ghost btn-sm" type="button" data-close>Close</button>
      </div>
      <div class="modal-body">
        <p class="muted" id="role-dialog-intro">
          Pick the account type that fits you. You can always browse jobs without an account.
        </p>
        <div class="role-choice">
          <button type="button" data-role="job_seeker">
            <span>
              <b>I'm a job seeker</b>
              <span>Browse openings, apply with a resume, track every application.</span>
            </span>
          </button>
          <button type="button" data-role="employer">
            <span>
              <b>I'm an employer</b>
              <span>Post jobs, review applicants, and schedule interviews.</span>
            </span>
          </button>
        </div>
      </div>`;
    document.body.append(dialog);

    dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  const titleEl = dialog.querySelector("#role-dialog-title");
  const introEl = dialog.querySelector("#role-dialog-intro");
  if (title) titleEl.textContent = title;
  if (intro) introEl.textContent = intro;

  dialog.querySelectorAll("[data-role]").forEach((button) => {
    button.onclick = () => {
      const role = button.dataset.role;
      dialog.close();
      if (onPick) onPick(role);
      else location.href = `/register.html?role=${encodeURIComponent(role)}`;
    };
  });

  if (!dialog.open) dialog.showModal();
  return dialog;
}

/** Renders the shared header for the current user (or guest). */
export async function renderHeader() {
  const el = document.getElementById("app-header");
  if (!el) return;

  const me = await getCurrentUser();
  const role = me?.profile?.role || null;
  const display = me?.profile?.username || me?.user?.email || "";
  const path = location.pathname;

  const links = [
    { href: "/jobs.html", label: "Browse jobs" },
    { href: "/about.html", label: "Help & docs" },
  ];

  if (role === "job_seeker") {
    links.push({ href: "/dashboard.html", label: "Dashboard" });
    links.push({ href: "/profile.html", label: "My profile" });
  } else if (role === "employer") {
    links.push({ href: "/employer/dashboard.html", label: "Dashboard" });
    links.push({ href: "/employer/post-job.html", label: "Post a job" });
    links.push({ href: "/employer/company.html", label: "Company" });
  } else if (role === "admin") {
    links.push({ href: "/admin/dashboard.html", label: "Admin" });
  }

  const navLinks = links
    .map((l) => {
      const active = path === l.href || (l.href !== "/" && path.startsWith(l.href.replace(".html", ""))) ? " active" : "";
      return `<a class="nav-link${active}" href="${l.href}">${escapeHtml(l.label)}</a>`;
    })
    .join("");

  const userBlock = me
    ? `<div class="nav-user">
         <span class="avatar">${escapeHtml(initials(display, ""))}</span>
         <span class="who">
           <b>${escapeHtml(display)}</b>
           <span>${escapeHtml(roleLabel(role))}</span>
         </span>
         <button class="btn btn-ghost btn-sm" type="button" data-action="logout">Log out</button>
       </div>`
    : `<div class="nav-user">
         <a class="btn btn-ghost btn-sm" href="/login.html">Sign in</a>
         <button class="btn btn-primary btn-sm" type="button" data-action="signup">Create account</button>
       </div>`;

  el.className = "site-header";
  el.innerHTML = `
    <div class="container nav">
      <a class="brand" href="/" aria-label="Job Portal home">
        <span class="brand-text">Job Portal</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">Menu</button>
      <nav class="nav-links" id="nav-links">
        ${navLinks}
        ${userBlock}
      </nav>
    </div>`;

  el.querySelector('[data-action="logout"]')?.addEventListener("click", signOut);

  const toggle = el.querySelector(".nav-toggle");
  const nav = el.querySelector(".nav-links");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
}

/** Header + footer + favicon in one call. */
export async function initPage() {
  favicon();
  await renderHeader();
  renderFooter();

  if (!initPage.signupBound) {
    initPage.signupBound = true;
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest('[data-action="signup"]');
      if (!trigger) return;
      event.preventDefault();
      askRole();
    });
  }
}

export { sb, toast };
