// E-ticket PDF with a QR code. The libraries are loaded only when the button is clicked.
import { bookingBreakdown, formatDate, formatDateTime, formatRM } from "./bookings.js";
import { formatTime } from "./pickup.js";

export const ticketPayload = (b) => `EXPLORE-MALAYSIA|${b.id}|${b.travelDate}|${b.travellers}`;

export async function downloadTicket(booking) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
  const qr = await QR.toDataURL(ticketPayload(booking), { margin: 1, width: 400 });
  const { subtotal, tax, hasTax, promoDiscount, groupDiscount, promoCode } = bookingBreakdown(booking);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(11, 122, 117);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(22).text("Explore Malaysia", 15, 18);
  doc.setFont("helvetica", "normal").setFontSize(11).text("E-ticket / booking confirmation", 15, 27);

  doc.setTextColor(29, 43, 42);
  doc.setFontSize(10).text("BOOKING REFERENCE", 15, 48);
  doc.setFont("helvetica", "bold").setFontSize(20).text(booking.id, 15, 57);

  doc.addImage(qr, "PNG", 148, 40, 47, 47);
  doc.setFont("helvetica", "normal").setFontSize(8).text("Show this QR code at check-in", 150, 91);

  const rows = [
    ["Package", booking.destination],
    ["Duration", booking.duration],
    ["Start date", formatDate(booking.travelDate)],
    ["End date", formatDate(booking.endDate)],
    ...(booking.pickup
      ? [["Pick-up point", booking.pickup.name], ["Pick-up time", `${formatTime(booking.pickup.time)} on ${formatDate(booking.travelDate)}`]]
      : []),
    ["Travellers", String(booking.travellers)],
    ["Lead traveller", `${booking.contactName} (${booking.contactPhone})`],
    ["Package price", `${formatRM(booking.pricePerPerson)} x ${booking.travellers}`],
  ];
  if (groupDiscount > 0) rows.push(["Group discount", `- ${formatRM(groupDiscount)}`]);
  if (promoDiscount > 0) rows.push([`Promo ${promoCode}`, `- ${formatRM(promoDiscount)}`]);
  if (hasTax) rows.push(["Subtotal", formatRM(subtotal)], ["Service tax (6%)", formatRM(tax)]);
  rows.push(["Total paid", formatRM(booking.total)]);
  if (booking.payment) rows.push(["Payment", `${booking.payment.method} (${booking.payment.account})`], ["Payment ref", booking.payment.reference], ["Paid on", formatDateTime(booking.payment.paidAt)]);

  let y = 108;
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal").setTextColor(93, 109, 108).setFontSize(10).text(k, 15, y);
    doc.setFont("helvetica", "bold").setTextColor(29, 43, 42).text(String(v), 70, y);
    doc.setDrawColor(219, 230, 228).line(15, y + 2.5, 195, y + 2.5);
    y += 9;
  });

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(93, 109, 108);
  doc.text("Please bring a valid ID. Cancellation: 100% refund 14+ days before departure, 50% for 7-13 days, none under 7 days.", 15, 282);
  doc.save(`E-ticket-${booking.id}.pdf`);
}