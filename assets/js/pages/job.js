import { sb } from "../supabase.js";
import { initPage, getCurrentUser } from "../auth.js";
import { $, param, escapeHtml, fmtDate, badge, toast, setBusy } from "../ui.js";

const jobId = param("id");
const root = $("#job-root");

function fail(title, message, action = "") {
  root.innerHTML = `
    <div class="empty" style="margin-top:1rem">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
      ${action || `<a class="btn btn-ghost btn-sm" href="/jobs.html">Browse jobs</a>`}
    </div>`;
}

function section(title, text) {
  if (!text) return "";
  return `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>`;
}

function renderJob(job) {
  const company = job.companies || {};
  const employer = job.employers || {};
  const posted = fmtDate(job.date_posted);
  const deadline = job.application_deadline ? fmtDate(job.application_deadline) : "Open until filled";
  const website = company.company_website
    ? `<a href="${escapeHtml(/^https?:\/\//.test(company.company_website) ? company.company_website : `https://${company.company_website}`)}"
         target="_blank" rel="noopener noreferrer">${escapeHtml(company.company_website)}</a>`
    : "—";

  document.title = `${job.job_title} — MIST Job Portal`;

  root.innerHTML = `
    <div class="page-head" style="padding-top:0">
      <div>
        <h1>${escapeHtml(job.job_title)}</h1>
        <p>${escapeHtml(company.company_name || "Company")} · ${escapeHtml(job.location || "—")}</p>
        <div class="job-meta" style="margin-top:.6rem">
          ${badge(job.job_status)}
          <span class="pill">${escapeHtml(job.employment_type || "—")}</span>
          ${job.salary_range ? `<span class="pill">${escapeHtml(job.salary_range)}</span>` : ""}
          <span class="pill">Posted ${escapeHtml(posted)}</span>
          <span class="pill">Deadline: ${escapeHtml(deadline)}</span>
        </div>
      </div>
    </div>

    <div class="detail-layout">
      <article class="card pad-lg prose">
        <h2 style="margin-top:0">Job description</h2>
        <p>${escapeHtml(job.job_description || "No description provided.")}</p>
        ${section("Qualifications", job.qualifications)}
        ${section("Skills required", job.skills_required)}

        <hr class="divider">
        <h3>About the company</h3>
        <p>${escapeHtml(company.company_description || "No company description provided.")}</p>
        <dl class="detail-list">
          <div><dt>Industry</dt><dd>${escapeHtml(company.industry || "—")}</dd></div>
          <div><dt>Address</dt><dd>${escapeHtml(company.company_address || "—")}</dd></div>
          <div><dt>Website</dt><dd>${website}</dd></div>
          <div><dt>Contact</dt><dd>${escapeHtml(company.contact_email || "—")}</dd></div>
          <div><dt>Posted by</dt><dd>${escapeHtml([employer.first_name, employer.last_name].filter(Boolean).join(" ") || "—")}${employer.position ? ` · ${escapeHtml(employer.position)}` : ""}</dd></div>
        </dl>
      </article>

      <aside class="stack apply-card" id="apply-panel">
        <div class="card">
          <div class="row">
            <div class="company-logo">${escapeHtml((company.company_name || "C").slice(0, 2).toUpperCase())}</div>
            <div>
              <b>${escapeHtml(company.company_name || "Company")}</b>
              <div class="muted" style="font-size:.85rem">${escapeHtml(company.industry || "")}</div>
            </div>
          </div>
          <hr class="divider">
          <div class="muted" style="font-size:.85rem">Checking your application status…</div>
        </div>
      </aside>
    </div>`;
}

function isClosed(job) {
  if (job.job_status !== "open") return true;
  if (!job.application_deadline) return false;
  return new Date(`${job.application_deadline}T23:59:59`) < new Date();
}

async function renderApplyPanel(job) {
  const panel = $("#apply-panel");
  if (!panel) return;

  if (isClosed(job)) {
    panel.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Applications closed</h3>
        <p class="muted">This posting is no longer accepting applications.</p>
        <a class="btn btn-ghost btn-block" href="/jobs.html">Browse other jobs</a>
      </div>`;
    return;
  }

  const me = await getCurrentUser(true);

  if (!me) {
    panel.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Ready to apply?</h3>
        <p class="muted">Sign in to your job seeker account to send an application.</p>
        <a class="btn btn-primary btn-block" href="/login.html?next=${encodeURIComponent(`/job.html?id=${job.job_id}`)}">Sign in to apply</a>
        <p class="center muted" style="margin:.75rem 0 0;font-size:.85rem">
          New here? <a href="/register.html?role=job_seeker">Create an account</a>
        </p>
      </div>`;
    return;
  }

  const role = me.profile?.role;

  if (role !== "job_seeker") {
    panel.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">You're signed in as ${escapeHtml(role === "employer" ? "an employer" : "an admin")}</h3>
        <p class="muted">Only job seeker accounts can apply to a posting.</p>
        <a class="btn btn-ghost btn-block" href="${role === "employer" ? "/employer/dashboard.html" : "/admin/dashboard.html"}">Go to dashboard</a>
      </div>`;
    return;
  }

  const { data: seeker } = await sb
    .from("job_seekers")
    .select("seeker_id")
    .eq("user_id", me.user.id)
    .maybeSingle();

  if (!seeker) {
    panel.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Complete your profile first</h3>
        <p class="muted">We need your name, contact details, and a resume before you can apply.</p>
        <a class="btn btn-primary btn-block" href="/profile.html?setup=1">Complete profile</a>
      </div>`;
    return;
  }

  const { data: existing } = await sb
    .from("applications")
    .select("application_id, application_status, application_date")
    .eq("job_id", job.job_id)
    .eq("seeker_id", seeker.seeker_id)
    .maybeSingle();

  if (existing) {
    panel.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Application sent</h3>
        <p class="muted">You applied on ${escapeHtml(fmtDate(existing.application_date))}.</p>
        <div class="row" style="margin-bottom:.75rem">${badge(existing.application_status)}</div>
        <a class="btn btn-ghost btn-block" href="/dashboard.html">Track my applications</a>
      </div>`;
    return;
  }

  const { data: resumes } = await sb
    .from("resumes")
    .select("resume_id, resume_title, is_default")
    .eq("seeker_id", seeker.seeker_id)
    .order("date_created", { ascending: false });

  const resumeOptions = (resumes || [])
    .map(
      (r) =>
        `<option value="${r.resume_id}"${r.is_default ? " selected" : ""}>${escapeHtml(r.resume_title)}${r.is_default ? " (default)" : ""}</option>`
    )
    .join("");

  panel.innerHTML = `
    <div class="card">
      <h3 style="margin-top:0">Apply for this job</h3>
      <form class="form" id="apply-form">
        ${
          resumes?.length
            ? `<div class="field">
                 <label for="resume_id">Resume</label>
                 <select id="resume_id" name="resume_id">${resumeOptions}</select>
                 <span class="hint">Or upload a new one below.</span>
               </div>`
            : `<div class="field">
                 <label for="resume_file">Resume (PDF or DOCX)</label>
                 <input id="resume_file" name="resume_file" type="file" accept=".pdf,.doc,.docx" required>
               </div>`
        }
        ${
          resumes?.length
            ? `<div class="field">
                 <label for="resume_file_optional">Upload a new resume (optional)</label>
                 <input id="resume_file_optional" name="resume_file" type="file" accept=".pdf,.doc,.docx">
               </div>`
            : ""
        }
        <div class="field">
          <label for="cover_letter">Cover letter (optional)</label>
          <textarea id="cover_letter" name="cover_letter" rows="4"
            placeholder="Tell the employer why you're a good fit…"></textarea>
        </div>
        <p class="error-text hidden" id="apply-error"></p>
        <button class="btn btn-primary btn-block" type="submit" id="apply-submit">Submit application</button>
        <p class="hint center" style="margin:0">Your profile and resume are shared with this employer.</p>
      </form>
    </div>`;

  const form = $("#apply-form");
  const errorEl = $("#apply-error");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.classList.add("hidden");

    const button = $("#apply-submit");
    setBusy(button, true, "Submitting…");

    try {
      const fileInput = form.querySelector('input[name="resume_file"]');
      const file = fileInput?.files?.[0] || null;
      let resumeId = form.resume_id?.value ? Number(form.resume_id.value) : null;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${me.user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await sb.storage.from("resumes").upload(path, file, { upsert: false });
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);

        const { data: created, error: resumeError } = await sb
          .from("resumes")
          .insert({
            seeker_id: seeker.seeker_id,
            resume_title: file.name,
            resume_file: path,
            is_default: !resumes?.length,
          })
          .select("resume_id")
          .single();
        if (resumeError) throw resumeError;
        resumeId = created.resume_id;
      }

      if (!resumeId) throw new Error("Please choose or upload a resume.");

      const { error } = await sb.from("applications").insert({
        seeker_id: seeker.seeker_id,
        job_id: job.job_id,
        resume_id: resumeId,
        cover_letter: form.cover_letter.value.trim() || null,
      });

      if (error) {
        if (error.code === "23505") throw new Error("You have already applied to this job.");
        throw error;
      }

      toast("Application submitted successfully.", "ok");
      await renderApplyPanel(job);
    } catch (err) {
      errorEl.textContent = err.message || "Something went wrong.";
      errorEl.classList.remove("hidden");
      setBusy(button, false);
    }
  });
}

async function main() {
  await initPage();

  if (!jobId) {
    fail("Job not found", "The link is missing a job id.");
    return;
  }

  const { data: job, error } = await sb
    .from("job_posting")
    .select(
      "*, companies(company_name, industry, company_address, company_website, company_description, contact_email), employers(first_name, last_name, position)"
    )
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) {
    fail("Could not load this job", error.message);
    return;
  }
  if (!job) {
    fail("Job not found", "This posting may have been removed or is not published.");
    return;
  }

  renderJob(job);
  await renderApplyPanel(job);
}

await main();
