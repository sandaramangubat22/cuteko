import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, escapeHtml, fmtDate, badge, emptyState } from "../ui.js";

const me = await requireRole("job_seeker");
if (me) {
  const name = me.profile?.username || "there";
  $("#greeting").textContent = `Welcome back, ${name}`;

  const { data: seeker } = await sb
    .from("job_seekers")
    .select("seeker_id")
    .eq("user_id", me.user.id)
    .maybeSingle();

  const root = $("#applications-root");

  if (!seeker) {
    root.innerHTML = emptyState(
      "Your profile is not set up yet",
      "Add your details and a resume so employers can review your applications.",
      `<a class="btn btn-primary btn-sm" href="/profile.html?setup=1">Complete profile</a>`
    );
  } else {
    const { data, error } = await sb
      .from("applications")
      .select(
        "application_id, application_status, application_date, cover_letter, job_posting(job_id, job_title, location, employment_type, companies(company_name)), interviews(interview_date, interview_time, interview_status)"
      )
      .eq("seeker_id", seeker.seeker_id)
      .order("application_date", { ascending: false });

    if (error) {
      root.innerHTML = emptyState("Could not load applications", error.message);
    } else if (!data?.length) {
      root.innerHTML = emptyState(
        "No applications yet",
        "Browse open roles and send your first application.",
        `<a class="btn btn-primary btn-sm" href="/jobs.html">Browse jobs</a>`
      );
    } else {
      const total = data.length;
      const progress = data.filter((a) =>
        ["pending", "reviewed", "shortlisted", "interview"].includes(a.application_status)
      ).length;
      const interviews = data.reduce((sum, a) => sum + (a.interviews?.length || 0), 0);
      const hired = data.filter((a) => a.application_status === "hired").length;

      $("#stat-total").textContent = total;
      $("#stat-progress").textContent = progress;
      $("#stat-interviews").textContent = interviews;
      $("#stat-hired").textContent = hired;

      root.innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Interview</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map((app) => {
                  const job = app.job_posting || {};
                  const company = job.companies?.company_name || "—";
                  const interview = app.interviews?.[0];
                  return `<tr>
                    <td>
                      <b>${escapeHtml(job.job_title || "Job removed")}</b>
                      <div class="muted" style="font-size:.8rem">${escapeHtml(job.location || "")}</div>
                    </td>
                    <td>${escapeHtml(company)}</td>
                    <td>${escapeHtml(fmtDate(app.application_date))}</td>
                    <td>${badge(app.application_status)}</td>
                    <td>${
                      interview
                        ? `${escapeHtml(fmtDate(interview.interview_date))}${interview.interview_time ? ` · ${escapeHtml(String(interview.interview_time).slice(0, 5))}` : ""}`
                        : "—"
                    }</td>
                    <td class="actions">
                      ${job.job_id ? `<a class="btn btn-ghost btn-sm" href="/job.html?id=${job.job_id}">View job</a>` : ""}
                    </td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`;
    }
  }
}
