import { sb } from "../supabase.js";
import { initPage } from "../auth.js";
import { $, param, safeFilter, escapeHtml, jobCard, emptyState, toast } from "../ui.js";

const form = $("#filters");
const list = $("#jobs-list");
const countEl = $("#result-count");

function readAmount(value) {
  const raw = String(value ?? "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : "";
}

function formatPeso(value) {
  const digits = String(value ?? "")
    .replace(/[^0-9]/g, "")
    .slice(0, 7)
    .replace(/^0+(?=\d)/, "");
  return digits ? `₱${Number(digits).toLocaleString("en-PH")}` : "";
}

const state = {
  q: param("q") || "",
  location: param("location") || "",
  type: param("type") || "",
  min: readAmount(param("salary_min")),
  max: readAmount(param("salary_max")),
};

form.q.value = state.q;
form.location.value = state.location;
form.type.value = state.type;
form.salary_min.value = formatPeso(state.min);
form.salary_max.value = formatPeso(state.max);

for (const input of [form.salary_min, form.salary_max]) {
  input.addEventListener("input", () => {
    input.value = formatPeso(input.value);
  });
}

function syncUrl() {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.location) params.set("location", state.location);
  if (state.type) params.set("type", state.type);
  if (state.min !== "") params.set("salary_min", state.min);
  if (state.max !== "") params.set("salary_max", state.max);
  const qs = params.toString();
  history.replaceState(null, "", "/jobs.html" + (qs ? `?${qs}` : ""));
}

async function load() {
  list.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;

  let query = sb
    .from("job_posting")
    .select("job_id, job_title, employment_type, salary_min, salary_max, location, date_posted, companies(company_name)")
    .eq("job_status", "open")
    .order("date_posted", { ascending: false })
    .limit(60);

  if (state.q) {
    const q = safeFilter(state.q);
    query = query.or(`job_title.ilike.%${q}%,job_description.ilike.%${q}%,skills_required.ilike.%${q}%`);
  }
  if (state.location) query = query.ilike("location", `%${safeFilter(state.location)}%`);
  if (state.type) query = query.eq("employment_type", state.type);
  if (state.min !== "") query = query.gte("salary_max", state.min);
  if (state.max !== "") query = query.lte("salary_min", state.max);

  const { data, error } = await query;

  if (error) {
    countEl.textContent = "Could not load jobs.";
    list.innerHTML = emptyState("Something went wrong", error.message);
    return;
  }

  countEl.textContent = data.length === 1 ? "1 open position" : `${data.length} open positions`;

  if (!data.length) {
    list.innerHTML = emptyState(
      "No matching jobs",
      "Try a different keyword, location, employment type, or salary range.",
      `<a class="btn btn-ghost btn-sm" href="/jobs.html">Reset filters</a>`
    );
    return;
  }

  list.innerHTML = data.map(jobCard).join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const min = readAmount(form.salary_min.value);
  const max = readAmount(form.salary_max.value);
  if (min !== "" && max !== "" && min > max) {
    toast("Minimum salary can't be higher than the maximum.");
    return;
  }
  state.q = form.q.value.trim();
  state.location = form.location.value.trim();
  state.type = form.type.value;
  state.min = min;
  state.max = max;
  syncUrl();
  load();
});

$("#clear-filters").addEventListener("click", () => {
  state.q = state.location = state.type = "";
  state.min = state.max = "";
  form.reset();
  syncUrl();
  load();
});

await initPage();
await load();
