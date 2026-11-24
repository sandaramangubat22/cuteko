/* Shared UI helpers — no Supabase dependency. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function timeAgo(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(value);
}

export function initials(first, last) {
  const a = (first || "").trim()[0] || "";
  const b = (last || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}

export function badge(status) {
  const s = String(status || "").toLowerCase();
  return `<span class="badge ${escapeHtml(s)}">${escapeHtml(status || "—")}</span>`;
}

export function toast(message, type = "") {
  let stack = $(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.append(stack);
  }
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  stack.append(node);
  setTimeout(() => node.remove(), 4200);
}

export function param(name) {
  return new URLSearchParams(location.search).get(name);
}

export function setBusy(button, busy, label = "Please wait…") {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> ${escapeHtml(label)}`;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

/** Escape a value so it can be used safely inside a PostgREST .or() filter. */
export function safeFilter(value) {
  return String(value || "").replace(/[,()%]/g, " ").trim();
}

export function emptyState(title, text, actionHtml = "") {
  return `<div class="empty"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>${actionHtml}</div>`;
}

export function jobCard(job) {
  const company = job.companies?.company_name || "Company";
  return `
    <a class="job-card" href="/job.html?id=${encodeURIComponent(job.job_id)}">
      <h3>${escapeHtml(job.job_title)}</h3>
      <div class="company">${escapeHtml(company)}</div>
      <div class="job-meta">
        <span class="pill">${escapeHtml(job.employment_type || "—")}</span>
        <span class="pill">${escapeHtml(job.location || "—")}</span>
        ${job.salary_range ? `<span class="pill">${escapeHtml(job.salary_range)}</span>` : ""}
        <span class="pill">${escapeHtml(timeAgo(job.date_posted))}</span>
      </div>
    </a>`;
}

export function renderFooter() {
  const el = document.getElementById("app-footer");
  if (!el) return;
  const name = (window.APP_CONFIG && window.APP_CONFIG.SITE_NAME) || "Job Portal";
  el.className = "footer";
  el.innerHTML = `
    <div class="container">
      <div class="footer-compact">
        <div class="footer-brand">
          <b>Job Portal</b>
          <span>${escapeHtml(name)} — student project</span>
        </div>
        <nav class="footer-nav" aria-label="Footer">
          <a href="/jobs.html">Browse jobs</a>
          <a href="/about.html#docs">Documentation</a>
          <a href="/about.html#contact">Contact</a>
          <a href="/about.html#report">Report an issue</a>
          <a href="/login.html">Sign in</a>
        </nav>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${escapeHtml(name)}</span>
        <span>HTML, CSS, JavaScript &amp; Supabase</span>
      </div>
    </div>`;
}

export function favicon() {
  if (document.querySelector('link[rel="icon"]')) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="2" fill="#245c45"/></svg>`;
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  document.head.append(link);
}
