import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, param, escapeHtml, fmtDate, toast, setBusy, emptyState } from "../ui.js";

const me = await requireRole("job_seeker");

if (me) {
  const form = $("#profile-form");
  const errorEl = $("#profile-error");
  const setupBanner = $("#setup-banner");

  if (param("setup")) setupBanner.classList.remove("hidden");

  const { data: seeker } = await sb
    .from("job_seekers")
    .select("*")
    .eq("user_id", me.user.id)
    .maybeSingle();

  if (seeker) {
    for (const key of [
      "first_name", "last_name", "middle_name", "gender", "phone_number",
      "date_of_birth", "address", "education", "skills", "experience", "bio",
    ]) {
      if (form[key]) form[key].value = seeker[key] || "";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.classList.add("hidden");

    if (!form.first_name.value.trim() || !form.last_name.value.trim()) {
      errorEl.textContent = "First and last name are required.";
      errorEl.classList.remove("hidden");
      return;
    }
    if (!form.phone_number.value.trim() || !form.address.value.trim()) {
      errorEl.textContent = "Phone number and address are required.";
      errorEl.classList.remove("hidden");
      return;
    }

    const payload = {
      user_id: me.user.id,
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      middle_name: form.middle_name.value.trim() || null,
      gender: form.gender.value || null,
      phone_number: form.phone_number.value.trim(),
      address: form.address.value.trim(),
      date_of_birth: form.date_of_birth.value || null,
      education: form.education.value.trim() || null,
      skills: form.skills.value.trim() || null,
      experience: form.experience.value.trim() || null,
      bio: form.bio.value.trim() || null,
    };

    const button = $("#profile-submit");
    setBusy(button, true, "Saving…");

    const query = seeker
      ? sb.from("job_seekers").update(payload).eq("seeker_id", seeker.seeker_id)
      : sb.from("job_seekers").insert(payload);

    const { error } = await query;
    setBusy(button, false);

    if (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove("hidden");
      return;
    }

    toast("Profile saved.", "ok");
    setupBanner.classList.add("hidden");
    if (!seeker) location.reload();
  });

  // ---------------- resumes ----------------
  let resumes = [];

  async function loadResumes() {
    const box = $("#resume-list");
    const { data: seekerRow } = await sb
      .from("job_seekers")
      .select("seeker_id")
      .eq("user_id", me.user.id)
      .maybeSingle();

    if (!seekerRow) {
      box.innerHTML = `<div class="muted" style="font-size:.85rem">Save your profile first, then upload a resume.</div>`;
      return;
    }

    const { data, error } = await sb
      .from("resumes")
      .select("*")
      .eq("seeker_id", seekerRow.seeker_id)
      .order("date_created", { ascending: false });

    if (error) {
      box.innerHTML = `<div class="error-text">${escapeHtml(error.message)}</div>`;
      return;
    }

    resumes = data || [];

    if (!resumes.length) {
      box.innerHTML = emptyState("No resume yet", "Upload one above so employers can review it.");
      return;
    }

    box.innerHTML = resumes
      .map(
        (r) => `
        <div class="card" style="padding:.85rem">
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div>
              <b>${escapeHtml(r.resume_title)}</b>
              ${r.is_default ? `<span class="badge active" style="margin-left:.35rem">default</span>` : ""}
              <div class="muted" style="font-size:.78rem">Uploaded ${escapeHtml(fmtDate(r.date_created))}</div>
            </div>
            <div class="row" style="gap:.35rem;flex-wrap:nowrap">
              <button class="btn btn-ghost btn-sm" data-action="view" data-id="${r.resume_id}">View</button>
              ${r.is_default ? "" : `<button class="btn btn-ghost btn-sm" data-action="default" data-id="${r.resume_id}">Make default</button>`}
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${r.resume_id}">Delete</button>
            </div>
          </div>
        </div>`
      )
      .join("");

    box.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => handleResumeAction(btn.dataset.action, Number(btn.dataset.id), seekerRow.seeker_id));
    });
  }

  async function handleResumeAction(action, id, seekerId) {
    const resume = resumes.find((r) => r.resume_id === id);
    if (!resume) return;

    if (action === "view") {
      if (!resume.resume_file) return toast("This resume has no file attached.", "error");
      const { data, error } = await sb.storage.from("resumes").createSignedUrl(resume.resume_file, 120);
      if (error) return toast(error.message, "error");
      window.open(data.signedUrl, "_blank", "noopener");
      return;
    }

    if (action === "default") {
      await sb.from("resumes").update({ is_default: false }).eq("seeker_id", seekerId);
      const { error } = await sb.from("resumes").update({ is_default: true }).eq("resume_id", id);
      if (error) return toast(error.message, "error");
      toast("Default resume updated.", "ok");
      loadResumes();
      return;
    }

    if (action === "delete") {
      if (!confirm("Delete this resume? Applications that used it will keep their record.")) return;
      if (resume.resume_file) await sb.storage.from("resumes").remove([resume.resume_file]);
      const { error } = await sb.from("resumes").delete().eq("resume_id", id);
      if (error) return toast(error.message, "error");
      toast("Resume deleted.", "ok");
      loadResumes();
    }
  }

  $("#resume-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const { data: seekerRow } = await sb
      .from("job_seekers")
      .select("seeker_id")
      .eq("user_id", me.user.id)
      .maybeSingle();

    if (!seekerRow) {
      toast("Save your profile before uploading a resume.", "error");
      return;
    }

    const file = $("#resume_file").files[0];
    if (!file) return toast("Choose a file to upload.", "error");

    const title = $("#resume_title").value.trim() || file.name;
    const button = $("#resume-submit");
    setBusy(button, true, "Uploading…");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${me.user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await sb.storage.from("resumes").upload(path, file, { upsert: false });
    if (uploadError) {
      setBusy(button, false);
      return toast(uploadError.message, "error");
    }

    const { error } = await sb.from("resumes").insert({
      seeker_id: seekerRow.seeker_id,
      resume_title: title,
      resume_file: path,
      is_default: resumes.length === 0,
    });

    setBusy(button, false);

    if (error) {
      toast(error.message, "error");
      return;
    }

    $("#resume-form").reset();
    toast("Resume uploaded.", "ok");
    loadResumes();
  });

  await loadResumes();
}
