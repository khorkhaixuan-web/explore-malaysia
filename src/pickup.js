// NEW FEATURE: Pick-up points and pick-up times.
// Each package has its own pick-up points, and each point has its own departure times (24-hour "HH:MM").
// The data lives here so the package details page, booking form, summary, receipt and e-ticket all read the same list.
// To change a point or time, only edit this file.

// Library of pick-up locations (reused by many packages).
const PLACES = {
  klSentral: { name: "KL Sentral", address: "Level 1, Pick-up Bay B, Kuala Lumpur" },
  klia: { name: "KLIA Terminal 1", address: "Arrival Hall, Door 3, Sepang" },
  bukitBintang: { name: "Pavilion KL, Bukit Bintang", address: "Main Entrance, Jalan Bukit Bintang, Kuala Lumpur" },
  langkawiAirport: { name: "Langkawi International Airport", address: "Arrival Hall, Padang Matsirat, Langkawi" },
  kuahJetty: { name: "Kuah Jetty", address: "Jetty Ticket Counter, Kuah, Langkawi" },
  penangAirport: { name: "Penang International Airport", address: "Arrival Hall, Bayan Lepas, Penang" },
  komtar: { name: "KOMTAR", address: "Lobby A, Jalan Penang, George Town" },
  penangSentral: { name: "Penang Sentral", address: "Main Concourse, Butterworth" },
  ipohStation: { name: "Ipoh Railway Station", address: "Front Entrance, Jalan Panglima Bukit Gantang Wahab, Ipoh" },
  tanahRata: { name: "Tanah Rata Bus Terminal", address: "Main Terminal, Tanah Rata, Cameron Highlands" },
  melakaSentral: { name: "Melaka Sentral", address: "Platform Level, Jalan Tun Razak, Melaka" },
  kualaBesut: { name: "Kuala Besut Jetty", address: "Jetty Waiting Hall, Besut, Terengganu" },
  kotaBharuAirport: { name: "Sultan Ismail Petra Airport", address: "Arrival Hall, Pengkalan Chepa, Kota Bharu" },
  kuchingAirport: { name: "Kuching International Airport", address: "Arrival Hall, Kuching, Sarawak" },
  kuchingSentral: { name: "Kuching Sentral", address: "Main Terminal, Jalan Penrissen, Kuching" },
  kkAirport: { name: "Kota Kinabalu International Airport", address: "Terminal 1 Arrival Hall, Kota Kinabalu" },
  suriaSabah: { name: "Suria Sabah Mall", address: "Main Entrance, Jalan Tun Fuad Stephens, Kota Kinabalu" },
  jerantut: { name: "Jerantut Bus Station", address: "Main Terminal, Jerantut, Pahang" },
  mersingJetty: { name: "Mersing Jetty", address: "Tioman Ferry Counter, Mersing, Johor" },
  tawauAirport: { name: "Tawau Airport", address: "Arrival Hall, Tawau, Sabah" },
  sempornaJetty: { name: "Semporna Town Jetty", address: "Jetty Waiting Hall, Semporna, Sabah" },
};

// package id -> list of [place, [times]]
const PACKAGE_PICKUPS = {
  1: [["langkawiAirport", ["08:30", "11:00", "14:00"]], ["kuahJetty", ["09:00", "13:30"]]],
  2: [["penangAirport", ["09:00", "12:00", "15:00"]], ["komtar", ["08:30", "10:30"]], ["penangSentral", ["09:30", "13:00"]]],
  3: [["klSentral", ["07:30", "09:00"]], ["ipohStation", ["09:30", "12:00"]], ["tanahRata", ["11:00", "14:00"]]],
  4: [["klSentral", ["08:00", "10:00"]], ["klia", ["07:30", "09:30"]], ["melakaSentral", ["09:30", "13:00"]]],
  5: [["kualaBesut", ["08:00", "10:00", "14:00"]], ["kotaBharuAirport", ["07:00", "11:00"]]],
  6: [["kuchingAirport", ["09:00", "13:00"]], ["kuchingSentral", ["09:30", "14:00"]]],
  7: [["kkAirport", ["07:00", "09:30", "13:00"]], ["suriaSabah", ["07:30", "10:00"]]],
  8: [["klSentral", ["06:30", "08:00"]], ["jerantut", ["10:30", "13:30"]]],
  9: [["klia", ["09:00", "12:00"]], ["klSentral", ["08:30", "10:30", "14:00"]], ["bukitBintang", ["09:00", "13:00"]]],
  10: [["klSentral", ["05:30", "07:00"]], ["mersingJetty", ["08:00", "10:30", "14:00"]]],
  11: [["ipohStation", ["09:00", "11:30"]], ["klSentral", ["08:00", "09:30"]]],
  12: [["tawauAirport", ["09:00", "12:30"]], ["sempornaJetty", ["08:00", "14:00"]]],
};

// Packages added later from the Admin page have no entry above, so they use these default points.
const DEFAULT_PICKUPS = [["klSentral", ["08:00", "10:00"]], ["klia", ["09:00", "12:00"]]];

// Returns [{ id, name, address, times: ["08:30", ...] }, ...] for one package.
export function getPickupOptions(pkg) {
  const list = (pkg && PACKAGE_PICKUPS[pkg.id]) || DEFAULT_PICKUPS;
  return list.map(([key, times]) => ({ id: key, ...PLACES[key], times }));
}

// "13:30" -> "1:30 PM"
export function formatTime(hhmm = "") {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Checks the chosen point + time against the package's real options. Returns { pointError, timeError }.
export function validatePickup(pkg, pointId, time) {
  const point = getPickupOptions(pkg).find((p) => p.id === pointId);
  const result = {};
  if (!pointId) result.pointError = "Please choose a pick-up point.";
  else if (!point) result.pointError = "This pick-up point is not available for this package.";
  if (!time) result.timeError = "Please choose a pick-up time.";
  else if (point && !point.times.includes(time)) result.timeError = "This pick-up time is not available at the chosen point.";
  return result;
}

// What is saved inside the booking (a snapshot, so later changes to the list do not alter old bookings).
export function buildPickup(pkg, pointId, time) {
  const point = getPickupOptions(pkg).find((p) => p.id === pointId);
  return point ? { id: point.id, name: point.name, address: point.address, time } : null;
}