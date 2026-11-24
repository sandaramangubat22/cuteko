import { sb } from "../supabase.js";
import { requireRole } from "../auth.js";
import { $, param, toast, setBusy } from "../ui.js";

const me = await requireRole("employer");

if (me) {
  const form = $("#company-form");
  const errorEl = $("#company-error");

  if (param("setup")) $("#setup-banner").classList.remove("hidden");

  const { data: employer } = await sb
    .from("employers")
    .select("*, companies(*)")
    .eq("user_id", me.user.id)
    .maybeSingle();

  const company = employer?.companies || null;

  if (employer) {
    form.first_name.value = employer.first_name || "";
    form.last_name.value = employer.last_name || "";
    form.position.value = employer.position || "";
    form.phone_number.value = employer.phone_number || "";
  }
  if (company) {
    form.company_name.value = company.company_name || "";
    form.industry.value = company.industry || "";
    form.company_address.value = company.company_address || "";
    form.contact_email.value = company.contact_email || "";
    form.contact_number.value = company.contact_number || "";
    form.company_website.value = company.company_website || "";
    form.company_description.value = company.company_description || "";
  } else {
    form.contact_email.value = me.user.email || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.classList.add("hidden");

    const companyPayload = {
      company_name: form.company_name.value.trim(),
      industry: form.industry.value.trim(),
      company_address: form.company_address.value.trim(),
      contact_email: form.contact_email.value.trim(),
      contact_number: form.contact_number.value.trim(),
      company_website: form.company_website.value.trim(),
      company_description: form.company_description.value.trim() || null,
    };

    const employerPayload = {
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      position: form.position.value.trim(),
      phone_number: form.phone_number.value.trim(),
    };

    if (!companyPayload.company_name || !companyPayload.industry || !companyPayload.company_address) {
      errorEl.textContent = "Company name, industry, and address are required.";
      errorEl.classList.remove("hidden");
      return;
    }
    if (!employerPayload.first_name || !employerPayload.last_name || !employerPayload.position) {
      errorEl.textContent = "Your name and position are required.";
      errorEl.classList.remove("hidden");
      return;
    }

    const button = $("#company-submit");
    setBusy(button, true, "Saving…");

    try {
      if (employer) {
        const { error: companyError } = await sb
          .from("companies")
          .update(companyPayload)
          .eq("company_id", employer.company_id);
        if (companyError) throw companyError;

        const { error: employerError } = await sb
          .from("employers")
          .update(employerPayload)
          .eq("employer_id", employer.employer_id);
        if (employerError) throw employerError;
      } else {
        const { data: created, error: companyError } = await sb
          .from("companies")
          .insert({ ...companyPayload, owner_id: me.user.id })
          .select("company_id")
          .single();
        if (companyError) throw companyError;

        const { error: employerError } = await sb.from("employers").insert({
          user_id: me.user.id,
          company_id: created.company_id,
          ...employerPayload,
        });
        if (employerError) throw employerError;
      }

      toast("Company profile saved.", "ok");
      $("#setup-banner").classList.add("hidden");
      if (!employer) {
        setTimeout(() => location.replace("/employer/dashboard.html"), 600);
      }
    } catch (err) {
      errorEl.textContent = err.message || "Could not save the company profile.";
      errorEl.classList.remove("hidden");
    } finally {
      setBusy(button, false);
    }
  });
}
