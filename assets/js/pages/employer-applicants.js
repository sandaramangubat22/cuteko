import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, param, escapeHtml, fmtDate, badge, toast, emptyState, setBusy } from "../ui.js";

const me = await requireRole("employer");

if (me) {
  const root = $("#applicants-root");
  const filter = $("#job-filter");
  const dialog = $("#interview-dialog");
  const interviewForm = $("#interview-form");
  const interviewError = $("#interview-error");

  let employer = null;
  let applications = [];

  const { data: employerRow } = await sb
    .from("employers")
    .select("employer_id, company_id")
    .eq("user_id", me.user.id)
    .maybeSingle();

  employer = employerRow;

  if (!employer) {
    root.innerHTML = emptyState(
      "Set up your company first",
      "You need a company profile before you can receive applicants.",
      `<a class="btn btn-teal btn-sm" href="/employer/company.html?setup=1">Set up company</a>`
    );
  } else {
    const { data: jobs } = await sb
      .from("job_posting")
      .select("job_id, job_title")
      .eq("employer_id", employer.employer_id)
      .order("date_posted", { ascending: false });

    for (const job of jobs || []) {
      const option = document.createElement("option");
      option.value = job.job_id;
      option.textContent = job.job_title;
      filter.append(option);
    }

    const preset = param("job");
    if (preset) filter.value = preset;

    async function load() {
      root.innerHTML = `<div class="skeleton" style="height:140px"></div>`;

      let query = sb
        .from("applications")
        .select(
          `application_id, application_status, application_date, cover_letter,
           job_id,
           job_seekers(first_name, last_name, phone_number, education, skills),
           resumes(resume_title, resume_file),
           job_posting(job_id, job_title)`
        )
        .order("application_date", { ascending: false });

      if (filter.value) query = query.eq("job_id", Number(filter.value));

      const { data, error } = await query;

      if (error) {
        root.innerHTML = emptyState("Could not load applicants", error.message);
        return;
      }

      applications = data || [];

      if (!applications.length) {
        root.innerHTML = emptyState(
          "No applicants yet",
          "Once candidates apply, they will show up here.",
          `<a class="btn btn-ghost btn-sm" href="/employer/dashboard.html">Back to dashboard</a>`
        );
        return;
      }

      root.innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Job</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Resume</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${applications
                .map((app) => {
                  const seeker = app.job_seekers || {};
                  const resume = app.resumes || {};
                  const job = app.job_posting || {};
                  const name = [seeker.first_name, seeker.last_name].filter(Boolean).join(" ") || "Applicant";
                  return `<tr>
                    <td>
                      <b>${escapeHtml(name)}</b>
                      <div class="muted" style="font-size:.8rem">${escapeHtml(seeker.phone_number || "")}</div>
                      <div class="muted" style="font-size:.8rem">${escapeHtml(seeker.education || "")}</div>
                    </td>
                    <td>${escapeHtml(job.job_title || "—")}</td>
                    <td>${escapeHtml(fmtDate(app.application_date))}</td>
                    <td>
                      <select data-status-for="${app.application_id}" style="min-width:130px">
                        ${["pending", "reviewed", "shortlisted", "interview", "rejected", "hired"]
                          .map((s) => `<option value="${s}"${s === app.application_status ? " selected" : ""}>${s}</option>`)
                          .join("")}
                      </select>
                    </td>
                    <td>
                      ${
                        resume.resume_file
                          ? `<button class="btn btn-ghost btn-sm" data-resume="${app.application_id}">View</button>`
                          : `<span class="muted" style="font-size:.8rem">—</span>`
                      }
                    </td>
                    <td class="actions">
                      <button class="btn btn-primary btn-sm" data-interview="${app.application_id}">Schedule</button>
                    </td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`;

      root.querySelectorAll("[data-status-for]").forEach((select) => {
        select.addEventListener("change", async () => {
          const id = Number(select.dataset.statusFor);
          const { error: updateError } = await sb
            .from("applications")
            .update({ application_status: select.value })
            .eq("application_id", id);
          if (updateError) return toast(updateError.message, "error");
          toast(`Status set to ${select.value}.`, "ok");
        });
      });

      root.querySelectorAll("[data-resume]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const app = applications.find((a) => a.application_id === Number(btn.dataset.resume));
          const path = app?.resumes?.resume_file;
          if (!path) return toast("No resume attached.", "error");
          const { data: signed, error: signError } = await sb.storage.from("resumes").createSignedUrl(path, 120);
          if (signError) return toast(signError.message, "error");
          window.open(signed.signedUrl, "_blank", "noopener");
        });
      });

      root.querySelectorAll("[data-interview]").forEach((btn) => {
        btn.addEventListener("click", () => {
          interviewForm.reset();
          interviewForm.application_id.value = btn.dataset.interview;
          interviewError.classList.add("hidden");
          dialog.showModal();
        });
      });
    }

    filter.addEventListener("change", load);
    $("#refresh").addEventListener("click", load);

    $("#interview-close").addEventListener("click", () => dialog.close());
    $("#interview-cancel").addEventListener("click", () => dialog.close());

    interviewForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      interviewError.classList.add("hidden");

      const applicationId = Number(interviewForm.application_id.value);
      const button = $("#interview-save");
      setBusy(button, true, "Scheduling…");

      const { error } = await sb.from("interviews").insert({
        application_id: applicationId,
        interview_date: interviewForm.interview_date.value,
        interview_time: interviewForm.interview_time.value || null,
        interview_type: interviewForm.interview_type.value,
        interview_location: interviewForm.interview_location.value.trim(),
        interview_status: "scheduled",
        interview_notes: interviewForm.interview_notes.value.trim() || null,
      });

      if (!error) {
        await sb
          .from("applications")
          .update({ application_status: "interview" })
          .eq("application_id", applicationId);
      }

      setBusy(button, false);

      if (error) {
        interviewError.textContent = error.message;
        interviewError.classList.remove("hidden");
        return;
      }

      dialog.close();
      toast("Interview scheduled.", "ok");
      load();
    });

    await load();
  }
}
