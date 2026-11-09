// Simulated e-mail. There is no mail server, so "sent" e-mails are saved in localStorage and can be read in
// the Inbox page. To send real e-mails later, replace sendMail() with a call to your server (e.g. Resend, SendGrid).

const KEY = "explore-malaysia-mail";

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};
const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-200))); // keep the newest 200
  } catch {
    /* storage not available - ignore */
  }
};

export function sendMail(to, subject, body) {
  const mail = { id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, to, subject, body, sentAt: Date.now(), read: false };
  write([...read(), mail]);
  return mail;
}

export const getMail = (email) => read().filter((m) => m.to === email).sort((a, b) => b.sentAt - a.sentAt);
export const unreadCount = (email) => getMail(email).filter((m) => !m.read).length;
export const markMailRead = (id) => write(read().map((m) => (m.id === id ? { ...m, read: true } : m)));
export const deleteMail = (id) => write(read().filter((m) => m.id !== id));
