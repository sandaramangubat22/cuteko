import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, $$, escapeHtml, fmtDate, badge, toast, emptyState } from "../ui.js";

const me = await requireRole("admin");

if (me) {
  // ---------- tabs ----------
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      for (const name of ["companies", "users", "jobs", "feedback"]) {
        $(`#panel-${name}`).classList.toggle("hidden", name !== tab.dataset.tab);
      }
    });
  });

  // ---------- stats ----------
  async function loadStats() {
    const [users, companies, jobs, applications] = await Promise.all([
      sb.from("users").select("*", { count: "exact", head: true }),
      sb.from("companies").select("*", { count: "exact", head: true }),
      sb.from("job_posting").select("*", { count: "exact", head: true }),
      sb.from("applications").select("*", { count: "exact", head: true }),
    ]);
    $("#stat-users").textContent = users.count ?? 0;
    $("#stat-companies").textContent = companies.count ?? 0;
    $("#stat-jobs").textContent = jobs.count ?? 0;
    $("#stat-applications").textContent = applications.count ?? 0;
  }

  // ---------- companies ----------
  async function loadCompanies() {
    const panel = $("#panel-companies");
    const { data, error } = await sb
      .from("companies")
      .select("*")
      .order("date_registered", { ascending: false })
      .limit(100);

    if (error) {
      panel.innerHTML = emptyState("Could not load companies", error.message);
      return;
    }
    if (!data.length) {
      panel.innerHTML = emptyState("No companies yet", "Companies appear here after employers sign up.");
      return;
    }

    panel.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Company</th><th>Industry</th><th>Contact</th><th>Status</th><th>Registered</th><th></th></tr></thead>
          <tbody>
            ${data
              .map(
                (c) => `<tr>
                  <td><b>${escapeHtml(c.company_name)}</b>
                    <div class="muted" style="font-size:.8rem">${escapeHtml(c.company_address || "")}</div>
                  </td>
                  <td>${escapeHtml(c.industry || "—")}</td>
                  <td>${escapeHtml(c.contact_email || "—")}</td>
                  <td>${badge(c.company_status)}</td>
                  <td>${escapeHtml(fmtDate(c.date_registered))}</td>
                  <td class="actions">
                    <button class="btn btn-ghost btn-sm" data-company="${c.company_id}" data-next="${c.company_status === "active" ? "suspended" : "active"}">
                      ${c.company_status === "active" ? "Suspend" : "Approve"}
                    </button>
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    panel.querySelectorAll("[data-company]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const { error: updateError } = await sb
          .from("companies")
          .update({ company_status: btn.dataset.next })
          .eq("company_id", Number(btn.dataset.company));
        if (updateError) return toast(updateError.message, "error");
        toast(`Company ${btn.dataset.next}.`, "ok");
        loadCompanies();
        loadStats();
      });
    });
  }

  // ---------- users ----------
  async function loadUsers() {
    const panel = $("#panel-users");
    const { data, error } = await sb
      .from("users")
      .select("*")
      .order("date_registered", { ascending: false })
      .limit(100);

    if (error) {
      panel.innerHTML = emptyState("Could not load users", error.message);
      return;
    }
    if (!data.length) {
      panel.innerHTML = emptyState("No users yet", "Accounts appear here after sign-up.");
      return;
    }

    panel.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Registered</th><th></th></tr></thead>
          <tbody>
            ${data
              .map(
                (u) => `<tr>
                  <td><b>${escapeHtml(u.username)}</b></td>
                  <td>${escapeHtml(u.email)}</td>
                  <td><span class="badge ${escapeHtml(u.role)}">${escapeHtml(u.role.replace("_", " "))}</span></td>
                  <td>${badge(u.account_status)}</td>
                  <td>${escapeHtml(fmtDate(u.date_registered))}</td>
                  <td class="actions">
                    <button class="btn btn-ghost btn-sm" data-user="${u.user_id}" data-next="${u.account_status === "active" ? "suspended" : "active"}">
                      ${u.account_status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    panel.querySelectorAll("[data-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const { error: updateError } = await sb
          .from("users")
          .update({ account_status: btn.dataset.next })
          .eq("user_id", btn.dataset.user);
        if (updateError) return toast(updateError.message, "error");
        toast(`Account ${btn.dataset.next}.`, "ok");
        loadUsers();
      });
    });
  }

  // ---------- jobs ----------
  async function loadJobs() {
    const panel = $("#panel-jobs");
    const { data, error } = await sb
      .from("job_posting")
      .select("*, companies(company_name)")
      .order("date_posted", { ascending: false })
      .limit(100);

    if (error) {
      panel.innerHTML = emptyState("Could not load jobs", error.message);
      return;
    }
    if (!data.length) {
      panel.innerHTML = emptyState("No job posts yet", "Employers' postings will appear here.");
      return;
    }

    panel.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Job</th><th>Company</th><th>Type</th><th>Status</th><th>Posted</th><th></th></tr></thead>
          <tbody>
            ${data
              .map(
                (j) => `<tr>
                  <td><b>${escapeHtml(j.job_title)}</b>
                    <div class="muted" style="font-size:.8rem">${escapeHtml(j.location || "")}</div>
                  </td>
                  <td>${escapeHtml(j.companies?.company_name || "—")}</td>
                  <td>${escapeHtml(j.employment_type || "—")}</td>
                  <td>${badge(j.job_status)}</td>
                  <td>${escapeHtml(fmtDate(j.date_posted))}</td>
                  <td class="actions">
                    <a class="btn btn-ghost btn-sm" href="/job.html?id=${j.job_id}">View</a>
                    <button class="btn btn-ghost btn-sm" data-job="${j.job_id}" data-next="${j.job_status === "open" ? "closed" : "open"}">
                      ${j.job_status === "open" ? "Close" : "Reopen"}
                    </button>
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    panel.querySelectorAll("[data-job]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const { error: updateError } = await sb
          .from("job_posting")
          .update({ job_status: btn.dataset.next })
          .eq("job_id", Number(btn.dataset.job));
        if (updateError) return toast(updateError.message, "error");
        toast(`Job ${btn.dataset.next}.`, "ok");
        loadJobs();
        loadStats();
      });
    });
  }

  // ---------- feedback ----------
  async function loadFeedback() {
    const panel = $("#panel-feedback");
    const { data, error } = await sb
      .from("feedback")
      .select("*")
      .order("date_sent", { ascending: false })
      .limit(100);

    if (error) {
      panel.innerHTML = emptyState(
        "Could not load feedback",
        error.code === "42P01"
          ? "The feedback table is missing. Re-run the latest docs/schema.sql in Supabase."
          : error.message
      );
      return;
    }
    if (!data.length) {
      panel.innerHTML = emptyState("No reports yet", "Messages sent from the About page appear here.");
      return;
    }

    panel.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>From</th><th>Type</th><th>Message</th><th>Page</th><th>Status</th><th>Sent</th></tr></thead>
          <tbody>
            ${data
              .map(
                (f) => `<tr>
                  <td>
                    <b>${escapeHtml(f.name || "Anonymous")}</b>
                    <div class="muted" style="font-size:.8rem">${escapeHtml(f.email || "—")}</div>
                  </td>
                  <td>${badge(f.category)}</td>
                  <td style="max-width:340px">
                    <div style="white-space:pre-line">${escapeHtml(f.message)}</div>
                  </td>
                  <td class="muted" style="font-size:.8rem">${escapeHtml(f.page_url || "—")}</td>
                  <td>
                    <select data-feedback="${f.feedback_id}" style="min-width:120px">
                      ${["new", "read", "resolved"]
                        .map((s) => `<option value="${s}"${s === f.feedback_status ? " selected" : ""}>${s}</option>`)
                        .join("")}
                    </select>
                  </td>
                  <td>${escapeHtml(fmtDate(f.date_sent))}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    panel.querySelectorAll("[data-feedback]").forEach((select) => {
      select.addEventListener("change", async () => {
        const { error: updateError } = await sb
          .from("feedback")
          .update({ feedback_status: select.value })
          .eq("feedback_id", Number(select.dataset.feedback));
        if (updateError) return toast(updateError.message, "error");
        toast(`Report marked ${select.value}.`, "ok");
      });
    });
  }

  await Promise.all([loadStats(), loadCompanies(), loadUsers(), loadJobs(), loadFeedback()]);
}
