import { useCallback, useEffect, useMemo, useState } from "react";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { CATEGORY_IMAGES, fetchPackages, readOverrides, writeOverrides } from "../api.js";
import { STATUS_LABELS, cancelBooking, formatDate, formatRM, getAllBookings, getPromos, savePromos } from "../bookings.js";

const TABS = ["Overview", "Bookings", "Packages", "Promo codes", "Check-in"];

// Admin dashboard (demo admin login: see README). All data lives in this browser (localStorage).
export default function Admin() {
  const [tab, setTab] = useState("Overview");
  const [bookings, setBookings] = useState(() => getAllBookings());
  const reload = useCallback(() => setBookings(getAllBookings()), []);

  return (
    <section className="container section">
      <h1 className="page-title">Admin dashboard</h1>
      <p className="page-sub">Manage bookings, packages and promo codes.</p>
      <div className="admin-tabs" role="group" aria-label="Admin sections">
        {TABS.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === "Overview" && <Overview bookings={bookings} />}
      {tab === "Bookings" && <Bookings bookings={bookings} reload={reload} />}
      {tab === "Packages" && <Packages />}
      {tab === "Promo codes" && <Promos />}
      {tab === "Check-in" && <CheckIn bookings={bookings} />}
    </section>
  );
}

/* ---------- overview ---------- */
function Overview({ bookings }) {
  const stats = useMemo(() => {
    const paid = bookings.filter((b) => b.status === "paid");
    const sum = (list, f) => list.reduce((t, b) => t + (f(b) || 0), 0);
    const byPackage = {};
    paid.forEach((b) => {
      byPackage[b.destination] = (byPackage[b.destination] || 0) + b.total;
    });
    return {
      count: bookings.length,
      paid: paid.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      revenue: sum(paid, (b) => b.total),
      tax: sum(paid, (b) => b.tax),
      discounts: sum(paid, (b) => (b.groupDiscount || 0) + (b.promoDiscount || 0)),
      travellers: sum(paid, (b) => b.travellers),
      top: Object.entries(byPackage).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [bookings]);
  const max = stats.top[0]?.[1] || 1;

  return (
    <>
      <div className="stat-grid">
        <div className="stat"><span>Total bookings</span><strong>{stats.count}</strong></div>
        <div className="stat"><span>Paid bookings</span><strong>{stats.paid}</strong></div>
        <div className="stat"><span>Awaiting payment</span><strong>{stats.pending}</strong></div>
        <div className="stat"><span>Revenue (incl. tax)</span><strong>{formatRM(stats.revenue)}</strong></div>
        <div className="stat"><span>Service tax collected (6%)</span><strong>{formatRM(stats.tax)}</strong></div>
        <div className="stat"><span>Discounts given</span><strong>{formatRM(stats.discounts)}</strong></div>
        <div className="stat"><span>Paid travellers</span><strong>{stats.travellers}</strong></div>
      </div>
      <h2>Revenue by package</h2>
      {stats.top.length === 0 ? <p className="muted">No paid bookings yet.</p> : stats.top.map(([name, value]) => (
        <div className="bar-row" key={name}>
          <span>{name}</span>
          <div><div className="bar" style={{ width: `${(value / max) * 100}%` }} /></div>
          <strong>{formatRM(value)}</strong>
        </div>
      ))}
    </>
  );
}

/* ---------- bookings ---------- */
function Bookings({ bookings, reload }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const list = bookings.filter((b) => (filter === "all" || b.status === filter) && `${b.id} ${b.userEmail} ${b.contactName} ${b.destination}`.toLowerCase().includes(query.trim().toLowerCase()));

  const exportCsv = () => {
    const head = ["Reference", "Status", "Customer", "Email", "Phone", "Package", "Travel date", "Travellers", "Subtotal", "Tax", "Total", "Promo"];
    const rows = list.map((b) => [b.id, b.status, b.contactName, b.userEmail, b.contactPhone, b.destination, b.travelDate, b.travellers, b.subtotal ?? b.total, b.tax ?? 0, b.total, b.promoCode || ""]);
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "bookings.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="admin-actions" style={{ marginBottom: "1rem" }}>
        <input aria-label="Search bookings" placeholder="Search reference, name, email, package" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </div>
      {list.length === 0 ? <StatusMessage type="info" title="No bookings found." /> : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Package</th><th>Travel date</th><th>Pax</th><th>Total</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.contactName}<br /><span className="muted small">{b.userEmail}</span></td>
                  <td>{b.destination}</td>
                  <td>{formatDate(b.travelDate)}</td>
                  <td>{b.travellers}</td>
                  <td>{formatRM(b.total)}</td>
                  <td><span className={`pill pill-${b.status}`}>{STATUS_LABELS[b.status]}</span></td>
                  <td>
                    {(b.status === "paid" || b.status === "pending") && (confirmId === b.id ? (
                      <span className="admin-actions">
                        <button type="button" className="btn-link" onClick={() => { cancelBooking(b.id); setConfirmId(""); reload(); }}>Confirm cancel</button>
                        <button type="button" className="btn-link" onClick={() => setConfirmId("")}>Keep</button>
                      </span>
                    ) : <button type="button" className="btn-link" onClick={() => setConfirmId(b.id)}>Cancel</button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">Cancelling a paid booking applies the normal refund rules and e-mails the customer.</p>
    </>
  );
}

/* ---------- packages ---------- */
const EMPTY_PKG = { destination: "", category: "Beach", duration: "", price: "", description: "" };

function Packages() {
  const [packages, setPackages] = useState([]);
  const [editingId, setEditingId] = useState(null); // number | "new" | null
  const [form, setForm] = useState(EMPTY_PKG);
  const [errors, setErrors] = useState({});
  const refresh = useCallback(() => fetchPackages({ includeHidden: true }).then(setPackages), []);
  useEffect(() => { refresh(); }, [refresh]);

  const startEdit = (p) => { setEditingId(p ? p.id : "new"); setForm(p ? { destination: p.destination, category: p.category, duration: p.duration, price: String(p.price), description: p.description } : EMPTY_PKG); setErrors({}); };

  const save = (e) => {
    e.preventDefault();
    const found = {};
    if (!form.destination.trim()) found.destination = "Destination is required.";
    if (!/^\d+\s*days?(\s*\d+\s*nights?)?$/i.test(form.duration.trim())) found.duration = 'Use a format like "3 Days 2 Nights".';
    if (!(Number(form.price) > 0)) found.price = "Enter a price above 0.";
    if (form.description.trim().length < 10) found.description = "Add a short description (use commas between activities).";
    setErrors(found);
    if (Object.keys(found).length) return;
    const data = { destination: form.destination.trim(), category: form.category, duration: form.duration.trim(), price: Number(form.price), description: form.description.trim() };
    const ov = readOverrides();
    if (editingId === "new") {
      const id = Math.max(0, ...packages.map((p) => p.id)) + 1;
      ov.added.push({ id, ...data });
    } else if (ov.added.some((p) => p.id === editingId)) {
      ov.added = ov.added.map((p) => (p.id === editingId ? { id: p.id, ...data } : p));
    } else {
      ov.edited[editingId] = data;
    }
    writeOverrides(ov);
    setEditingId(null);
    refresh();
  };

  const toggleHidden = (p) => {
    const ov = readOverrides();
    ov.hidden = p.hidden ? ov.hidden.filter((id) => id !== p.id) : [...ov.hidden, p.id];
    writeOverrides(ov);
    refresh();
  };

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      {editingId === null ? (
        <button type="button" className="btn btn-primary" style={{ marginBottom: "1rem" }} onClick={() => startEdit(null)}>+ Add package</button>
      ) : (
        <form className="admin-form" onSubmit={save} noValidate>
          <h2>{editingId === "new" ? "New package" : "Edit package"}</h2>
          <FormField id="destination" label="Destination" value={form.destination} onChange={set} error={errors.destination} />
          <div className="form-row">
            <FormField id="category" as="select" label="Category" value={form.category} onChange={set}>
              {Object.keys(CATEGORY_IMAGES).map((c) => <option key={c}>{c}</option>)}
            </FormField>
            <FormField id="duration" label="Duration" placeholder="3 Days 2 Nights" value={form.duration} onChange={set} error={errors.duration} />
            <FormField id="price" label="Price per person (RM)" type="number" min="1" value={form.price} onChange={set} error={errors.price} />
          </div>
          <FormField id="description" as="textarea" rows="3" label="Description (activities separated by commas)" value={form.description} onChange={set} error={errors.description} />
          <div className="admin-actions">
            <button type="submit" className="btn btn-primary">Save package</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Destination</th><th>Category</th><th>Duration</th><th>Price</th><th>Visible</th><th /></tr></thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.destination}</td><td>{p.category}</td><td>{p.duration}</td><td>{formatRM(p.price)}</td>
                <td>{p.hidden ? "Hidden" : "Yes"}</td>
                <td className="admin-actions">
                  <button type="button" className="btn-link" onClick={() => startEdit(p)}>Edit</button>
                  <button type="button" className="btn-link" onClick={() => toggleHidden(p)}>{p.hidden ? "Show" : "Hide"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">Hidden packages disappear from the website but existing bookings are not affected. Price changes only apply to new bookings.</p>
    </>
  );
}

/* ---------- promo codes ---------- */
function Promos() {
  const [promos, setPromos] = useState(() => getPromos());
  const [form, setForm] = useState({ code: "", type: "percent", value: "" });
  const [error, setError] = useState("");
  const update = (list) => { savePromos(list); setPromos(list); };

  const add = (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    if (!/^[A-Z0-9]{3,15}$/.test(code)) return setError("Code must be 3-15 letters or numbers.");
    if (promos.some((p) => p.code === code)) return setError("This code already exists.");
    if (!(value > 0) || (form.type === "percent" && value > 100)) return setError(form.type === "percent" ? "Percent must be between 1 and 100." : "Enter an amount above 0.");
    setError("");
    update([...promos, form.type === "percent" ? { code, percent: value, active: true, label: `${value}% off your trip` } : { code, amountOff: value, active: true, label: `RM ${value} off your trip` }]);
    setForm({ code: "", type: "percent", value: "" });
  };

  return (
    <>
      <form className="admin-form" onSubmit={add} noValidate>
        <div className="form-row">
          <FormField id="code" label="New code" placeholder="RAYA20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <FormField id="type" as="select" label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percent">Percent off</option>
            <option value="amount">Fixed RM off</option>
          </FormField>
          <FormField id="value" label={form.type === "percent" ? "Percent" : "Amount (RM)"} type="number" min="1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        {error && <span className="error-text">{error}</span>}
        <div><button type="submit" className="btn btn-primary">Add promo code</button></div>
      </form>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th /></tr></thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.code}>
                <td><strong>{p.code}</strong></td><td>{p.label}</td><td>{p.active ? "Active" : "Disabled"}</td>
                <td className="admin-actions">
                  <button type="button" className="btn-link" onClick={() => update(promos.map((x) => (x.code === p.code ? { ...x, active: !x.active } : x)))}>{p.active ? "Disable" : "Enable"}</button>
                  <button type="button" className="btn-link" onClick={() => update(promos.filter((x) => x.code !== p.code))}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- check-in ---------- */
function CheckIn({ bookings }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const verify = (e) => {
    e.preventDefault();
    // accepts the booking reference, or the whole text read from the e-ticket QR code
    const ref = text.trim().split("|")[text.includes("|") ? 1 : 0]?.trim().toUpperCase();
    const b = bookings.find((x) => x.id.toUpperCase() === ref);
    setResult(b ? { b } : { notFound: true });
  };

  return (
    <>
      <form className="admin-form" onSubmit={verify}>
        <FormField id="ref" label="Booking reference or scanned QR text" placeholder="EM-261104-ABCDE" value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} />
        <div><button type="submit" className="btn btn-primary">Verify ticket</button></div>
      </form>
      {result?.notFound && <StatusMessage type="error" title="Ticket not found.">No booking matches this reference.</StatusMessage>}
      {result?.b && (
        result.b.status === "paid" ? (
          <StatusMessage type="success" title="Valid ticket: paid and confirmed">
            {result.b.contactName} · {result.b.destination} · {formatDate(result.b.travelDate)} · {result.b.travellers} traveller(s)
          </StatusMessage>
        ) : (
          <StatusMessage type="error" title={`Not valid: ${STATUS_LABELS[result.b.status]}`}>{result.b.contactName} · {result.b.destination}</StatusMessage>
        )
      )}
    </>
  );
}
