import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, param, toast, setBusy } from "../ui.js";

const me = await requireRole("employer");

if (me) {
  const jobId = param("id");
  const form = $("#job-form");
  const errorEl = $("#job-error");

  const { data: employer } = await sb
    .from("employers")
    .select("employer_id, company_id")
    .eq("user_id", me.user.id)
    .maybeSingle();

  if (!employer) {
    location.replace("/employer/company.html?setup=1");
  } else {
    if (jobId) {
      $("#page-title").textContent = "Edit job post";
      $("#job-submit").textContent = "Save changes";

      const { data: job, error } = await sb
        .from("job_posting")
        .select("*")
        .eq("job_id", jobId)
        .maybeSingle();

      if (error || !job) {
        errorEl.textContent = error?.message || "Job not found.";
        errorEl.classList.remove("hidden");
      } else {
        for (const key of [
          "job_title", "employment_type", "location", "salary_min", "salary_max",
          "application_deadline", "job_status", "job_description",
          "qualifications", "skills_required",
        ]) {
          if (form[key]) form[key].value = job[key] ?? "";
        }
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorEl.classList.add("hidden");

      if (!form.job_title.value.trim() || !form.employment_type.value || !form.location.value.trim()) {
        errorEl.textContent = "Job title, employment type, and location are required.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (!form.job_description.value.trim()) {
        errorEl.textContent = "Add a job description so applicants know what to expect.";
        errorEl.classList.remove("hidden");
        return;
      }
      const salaryMin = form.salary_min.value === "" ? null : Number(form.salary_min.value);
      const salaryMax = form.salary_max.value === "" ? null : Number(form.salary_max.value);
      if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
        errorEl.textContent = "Minimum salary cannot be higher than the maximum.";
        errorEl.classList.remove("hidden");
        return;
      }

      const payload = {
        company_id: employer.company_id,
        employer_id: employer.employer_id,
        job_title: form.job_title.value.trim(),
        employment_type: form.employment_type.value,
        location: form.location.value.trim(),
        salary_min: salaryMin,
        salary_max: salaryMax,
        application_deadline: form.application_deadline.value || null,
        job_status: form.job_status.value,
        job_description: form.job_description.value.trim(),
        qualifications: form.qualifications.value.trim() || null,
        skills_required: form.skills_required.value.trim() || null,
      };

      const button = $("#job-submit");
      setBusy(button, true, jobId ? "Saving…" : "Publishing…");

      const query = jobId
        ? sb.from("job_posting").update(payload).eq("job_id", jobId)
        : sb.from("job_posting").insert(payload);

      const { error } = await query;
      setBusy(button, false);

      if (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove("hidden");
        return;
      }

      toast(jobId ? "Job updated." : "Job posted.", "ok");
      setTimeout(() => location.replace("/employer/dashboard.html"), 500);
    });
  }
}
