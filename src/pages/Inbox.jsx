import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { deleteMail, getMail, markMailRead } from "../mail.js";
import { formatDateTime } from "../bookings.js";

// Simulated inbox: shows the e-mails the system "sent" (welcome, booking confirmation, cancellation, password).
export default function Inbox() {
  const { user } = useAuth();
  const [mails, setMails] = useState(() => getMail(user.email));

  const open = (m) => {
    if (m.read) return;
    markMailRead(m.id);
    setMails(getMail(user.email));
  };
  const remove = (id) => {
    deleteMail(id);
    setMails(getMail(user.email));
  };

  return (
    <section className="container section narrow">
      <h1 className="page-title">Inbox</h1>
      <p className="page-sub">E-mails from Explore Malaysia. (Demo: they are stored in this browser, nothing is sent to a real mailbox.)</p>

      {mails.length === 0 ? (
        <>
          <StatusMessage type="info" title="No messages yet.">Booking confirmations will appear here.</StatusMessage>
          <Link to="/packages" className="btn btn-primary">Browse packages</Link>
        </>
      ) : (
        <ul className="mail-list">
          {mails.map((m) => (
            <li key={m.id}>
              <details className={m.read ? "mail-item" : "mail-item unread"} onToggle={(e) => e.target.open && open(m)}>
                <summary>
                  <span>{!m.read && "● "}{m.subject}</span>
                  <span className="muted small">{formatDateTime(m.sentAt)}</span>
                </summary>
                <pre className="mail-body">{m.body}</pre>
                <button type="button" className="btn-link" onClick={() => remove(m.id)}>Delete</button>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
