import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, escapeHtml, fmtDate, badge, toast, emptyState } from "../ui.js";

const me = await requireRole("employer");

if (me) {
  const { data: employer } = await sb
    .from("employers")
    .select("*, companies(company_name)")
    .eq("user_id", me.user.id)
    .maybeSingle();

  if (!employer) {
    $("#setup-banner").classList.remove("hidden");
    $("#jobs-root").innerHTML = emptyState(
      "No company profile yet",
      "Complete your company details to start posting jobs.",
      `<a class="btn btn-teal btn-sm" href="/employer/company.html?setup=1">Set up company</a>`
    );
  } else {
    $("#greeting").textContent = `${employer.companies?.company_name || "Employer"} dashboard`;

    const { data: jobs, error } = await sb
      .from("job_posting")
      .select("*, applications(count)")
      .eq("employer_id", employer.employer_id)
      .order("date_posted", { ascending: false });

    if (error) {
      $("#jobs-root").innerHTML = emptyState("Could not load jobs", error.message);
    } else if (!jobs?.length) {
      $("#jobs-root").innerHTML = emptyState(
        "No job posts yet",
        "Create your first posting and start receiving applications.",
        `<a class="btn btn-primary btn-sm" href="/employer/post-job.html">Post a job</a>`
      );
    } else {
      const applicantTotal = jobs.reduce((sum, j) => sum + (j.applications?.[0]?.count || 0), 0);
      $("#stat-jobs").textContent = jobs.length;
      $("#stat-open").textContent = jobs.filter((j) => j.job_status === "open").length;
      $("#stat-applicants").textContent = applicantTotal;

      const { count: hiredCount } = await sb
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobs.map((j) => j.job_id))
        .eq("application_status", "hired");
      $("#stat-hired").textContent = hiredCount ?? 0;

      $("#jobs-root").innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Job title</th>
                <th>Status</th>
                <th>Posted</th>
                <th>Deadline</th>
                <th>Applicants</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${jobs
                .map((job) => {
                  const count = job.applications?.[0]?.count || 0;
                  return `<tr>
                    <td><b>${escapeHtml(job.job_title)}</b>
                      <div class="muted" style="font-size:.8rem">${escapeHtml(job.location || "")} · ${escapeHtml(job.employment_type || "")}</div>
                    </td>
                    <td>${badge(job.job_status)}</td>
                    <td>${escapeHtml(fmtDate(job.date_posted))}</td>
                    <td>${escapeHtml(fmtDate(job.application_deadline))}</td>
                    <td><b>${count}</b></td>
                    <td class="actions">
                      <a class="btn btn-ghost btn-sm" href="/employer/applicants.html?job=${job.job_id}">Applicants</a>
                      <a class="btn btn-ghost btn-sm" href="/employer/post-job.html?id=${job.job_id}">Edit</a>
                      <button class="btn btn-ghost btn-sm" data-toggle="${job.job_id}" data-status="${job.job_status}">
                        ${job.job_status === "open" ? "Close" : "Reopen"}
                      </button>
                    </td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`;

      $("#jobs-root").querySelectorAll("[data-toggle]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const next = btn.dataset.status === "open" ? "closed" : "open";
          const { error: updateError } = await sb
            .from("job_posting")
            .update({ job_status: next })
            .eq("job_id", Number(btn.dataset.toggle));
          if (updateError) return toast(updateError.message, "error");
          toast(`Job ${next === "open" ? "reopened" : "closed"}.`, "ok");
          location.reload();
        });
      });
    }
  }
}
