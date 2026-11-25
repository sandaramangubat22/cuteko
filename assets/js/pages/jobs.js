import { sb } from "../supabase.js";
import { initPage } from "../auth.js";
import { $, param, safeFilter, escapeHtml, jobCard, emptyState } from "../ui.js";

const form = $("#filters");
const list = $("#jobs-list");
const countEl = $("#result-count");

const SALARY_RANGES = ["", "0-15000", "15000-25000", "25000-40000", "40000-60000", "60000-"];
const salaryParam = param("salary") || "";

const state = {
  q: param("q") || "",
  location: param("location") || "",
  type: param("type") || "",
  salary: SALARY_RANGES.includes(salaryParam) ? salaryParam : "",
};

form.q.value = state.q;
form.location.value = state.location;
form.type.value = state.type;
form.salary.value = state.salary;

function syncUrl() {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.location) params.set("location", state.location);
  if (state.type) params.set("type", state.type);
  if (state.salary) params.set("salary", state.salary);
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
  if (state.salary) {
    const [lo, hi] = state.salary.split("-");
    if (lo) query = hi ? query.gte("salary_max", Number(lo)) : query.gt("salary_max", Number(lo));
    if (hi) query = query.lte("salary_min", Number(hi));
  }

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
  state.q = form.q.value.trim();
  state.location = form.location.value.trim();
  state.type = form.type.value;
  state.salary = form.salary.value;
  syncUrl();
  load();
});

$("#clear-filters").addEventListener("click", () => {
  state.q = state.location = state.type = state.salary = "";
  form.reset();
  syncUrl();
  load();
});

await initPage();
await load();
