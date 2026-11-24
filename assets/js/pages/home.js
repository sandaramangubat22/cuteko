import { initPage } from "../auth.js";
import { $ } from "../ui.js";

function wireSearch() {
  $("#hero-search").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const q = String(form.get("q") || "").trim();
    const loc = String(form.get("location") || "").trim();
    if (q) params.set("q", q);
    if (loc) params.set("location", loc);
    location.href = "/jobs.html" + (params.toString() ? `?${params}` : "");
  });
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || data.countryName || "";
  } catch {
    return "";
  }
}

function wireLocation() {
  const form = $("#hero-search");
  const input = form.querySelector('[name="location"]');
  const button = $("#geo-locate");
  const note = $("#geo-note");

  const showNote = (text, isError = false) => {
    note.textContent = text;
    note.classList.toggle("is-error", isError);
    note.classList.remove("hidden");
  };

  input.addEventListener("input", () => note.classList.add("hidden"));

  button.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showNote("This browser cannot share a location. Type a city instead.", true);
      return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Locating…";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const place = await reverseGeocode(latitude, longitude);
        input.value = place || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        button.disabled = false;
        button.textContent = label;
        showNote(place ? `Location set to ${place}.` : "Location set from your device.");
      },
      (error) => {
        button.disabled = false;
        button.textContent = label;
        showNote(
          error.code === error.PERMISSION_DENIED
            ? "Location access was blocked. Allow it in your browser or type a city."
            : "Could not get your location. Type a city instead.",
          true
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

await initPage();
wireSearch();
wireLocation();
