// Mock REST API.
// The data is served as JSON from /api/packages.json (see public/api/packages.json).
// To use an online mock API instead (e.g. MockAPI.io / json-server), only change this URL.
export const API_URL = "/api/packages.json";

export const CATEGORY_IMAGES = {
  Beach: "/images/beach.png",
  Nature: "/images/nature.png",
  Heritage: "/images/heritage.png",
  Adventure: "/images/adventure.png",
  City: "/images/city.png",
};

// Changes made by the admin (Admin dashboard > Packages) are kept in localStorage and applied on top of the JSON file.
const ADMIN_KEY = "explore-malaysia-package-admin";
export const readOverrides = () => {
  try {
    const v = JSON.parse(localStorage.getItem(ADMIN_KEY));
    return { added: v?.added || [], edited: v?.edited || {}, hidden: v?.hidden || [] };
  } catch {
    return { added: [], edited: {}, hidden: [] };
  }
};
export const writeOverrides = (value) => {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(value));
  } catch {
    /* storage not available - ignore */
  }
};

let packagesPromise = null;
function loadBase() {
  if (!packagesPromise) {
    packagesPromise = fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        packagesPromise = null;
        throw err;
      });
  }
  return packagesPromise;
}

// One shared, cached request for the package list (list, details and booking pages all use it, so the JSON is
// downloaded once). A failed request is not cached. Hidden packages are left out unless includeHidden is true.
export async function fetchPackages({ includeHidden = false } = {}) {
  const base = await loadBase();
  const { added, edited, hidden } = readOverrides();
  const all = [...base, ...added].map((p) => ({ ...p, ...(edited[p.id] || {}), hidden: hidden.includes(p.id) }));
  return includeHidden ? all : all.filter((p) => !p.hidden);
}
