// Builds a suggested day-by-day itinerary from a package's duration and description, so it also works for
// packages added later in the Admin dashboard.

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function buildItinerary(pkg) {
  const dayCount = parseInt(/(\d+)\s*day/i.exec(pkg.duration || "")?.[1], 10) || 1;

  // "A, B, C and D." -> ["A", "B", "C", "D"]
  const parts = String(pkg.description || "").replace(/\.\s*$/, "").split(/,\s*/);
  const last = parts.pop() || "";
  const andAt = last.search(/\s+and\s+/i);
  const activities = [...parts, ...(andAt > 0 ? [last.slice(0, andAt), last.slice(andAt).replace(/^\s+and\s+/i, "")] : [last])]
    .map((t) => cap(t.trim()))
    .filter(Boolean);

  const days = Array.from({ length: dayCount }, (_, i) => ({ day: i + 1, items: [] }));
  activities.forEach((a, i) => days[Math.min(dayCount - 1, Math.floor((i * dayCount) / activities.length))].items.push(a));

  if (dayCount === 1) {
    days[0].items.unshift("Morning pick-up from your hotel");
    days[0].items.push("Drop-off and farewell");
  } else {
    days[0].items.unshift(`Arrival in ${pkg.destination.split(",")[0]} and hotel check-in`);
    days[dayCount - 1].items.push("Breakfast, check-out and departure");
  }
  days.forEach((d) => d.items.length === 0 && d.items.push("Free time to relax or explore at your own pace"));
  return days;
}
