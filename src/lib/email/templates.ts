import { appUrl } from "@/lib/app-url";

// Transactional emails: one branded layout (inline styles, table layout, so it
// renders the same in Gmail, Outlook and phone mail apps) plus a plain-text
// version of every message.

export type EmailContent = { subject: string; html: string; text: string };

const NAVY = "#0e2c3c";
const ACCENT = "#ee9f48";
const CREAM = "#f6f1e8";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout({ preview, title, paragraphs, cta, footnote }: { preview: string; title: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string }) {
  const base = appUrl();
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr><td style="border-radius:999px;background:${NAVY}"><a href="${esc(cta.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(cta.label)}</a></td></tr></table>
       <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#94a3b8">Tombol tidak bisa diklik? Buka link ini:<br><a href="${esc(cta.url)}" style="color:#b4621c;word-break:break-all">${esc(cta.url)}</a></p>`
    : "";
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td align="center" style="padding:0 0 18px"><a href="${base}"><img src="${base}/brand/email-logo.png" width="120" alt="PB Wisdom" style="display:block;border:0;width:120px;height:auto"></a></td></tr>
    <tr><td style="background:#ffffff;border-radius:28px;padding:30px 28px;box-shadow:0 12px 32px rgba(14,44,60,0.08)">
      <div style="width:44px;height:5px;border-radius:999px;background:${ACCENT};margin:0 0 18px"></div>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${NAVY};font-weight:800">${esc(title)}</h1>
      ${body}${button}
    </td></tr>
    <tr><td align="center" style="padding:18px 12px 0;font-size:12px;line-height:1.6;color:#94a3b8">
      ${footnote ? `${esc(footnote)}<br>` : ""}PB Wisdom · Klub badminton Medan · <a href="${base}" style="color:#94a3b8">${esc(base.replace(/^https?:\/\//, ""))}</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function plain({ title, paragraphs, cta, footnote }: { title: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string }) {
  return [title, "", ...paragraphs.flatMap((p) => [p, ""]), cta ? `${cta.label}: ${cta.url}\n` : "", footnote ?? "", "", `PB Wisdom · ${appUrl()}`]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function build(subject: string, parts: Parameters<typeof layout>[0]): EmailContent {
  return { subject, html: layout(parts), text: plain(parts) };
}

export const emails = {
  passwordReset: (name: string, url: string) =>
    build("Reset password akun PB Wisdom", {
      preview: "Link untuk membuat password baru, berlaku 24 jam.",
      title: "Buat password baru",
      paragraphs: [`Halo ${name},`, "Ada permintaan untuk mengganti password akun PB Wisdom kamu. Klik tombol di bawah untuk membuat password baru. Link ini berlaku 24 jam dan hanya bisa dipakai sekali."],
      cta: { label: "Buat password baru", url },
      footnote: "Tidak merasa meminta? Abaikan email ini, password kamu tidak berubah.",
    }),

  newSignup: (adminName: string, member: { name: string; email: string }) =>
    build(`Pendaftar baru: ${member.name}`, {
      preview: `${member.name} menunggu persetujuan.`,
      title: "Ada pendaftar baru",
      paragraphs: [`Halo ${adminName},`, `${member.name} (${member.email}) baru mendaftar dan menunggu persetujuan admin.`],
      cta: { label: "Tinjau pendaftar", url: `${appUrl()}/club/members?tab=menunggu` },
    }),

  approved: (name: string) =>
    build("Akun PB Wisdom kamu sudah aktif", {
      preview: "Selamat bergabung! Akunmu sudah disetujui admin.",
      title: "Selamat bergabung! 🏸",
      paragraphs: [`Halo ${name},`, "Akunmu sudah disetujui admin. Sekarang kamu bisa RSVP latihan dan event, catat skor match, lihat leaderboard dan bayar iuran lewat aplikasi."],
      cta: { label: "Buka PB Wisdom", url: appUrl() },
    }),

  feePeriodOpened: (name: string, period: { label: string; amount: string; dueDate: string; instructions: string }) =>
    build(`Iuran ${period.label} sudah dibuka`, {
      preview: `${period.amount}, jatuh tempo ${period.dueDate}.`,
      title: `Iuran ${period.label}`,
      paragraphs: [`Halo ${name},`, `Iuran ${period.label} sebesar ${period.amount} sudah dibuka, jatuh tempo ${period.dueDate}.`, `Cara bayar:\n${period.instructions}`, "Setelah transfer, upload buktinya di aplikasi supaya admin bisa memverifikasi."],
      cta: { label: "Upload bukti transfer", url: `${appUrl()}/profile/iuran` },
    }),

  feeRejected: (name: string, label: string, reason: string) =>
    build(`Bukti iuran ${label} perlu diupload ulang`, {
      preview: `Alasan: ${reason}`,
      title: "Bukti transfer ditolak",
      paragraphs: [`Halo ${name},`, `Bukti transfer iuran ${label} belum bisa diverifikasi admin.`, `Alasan: ${reason}`, "Silakan upload ulang bukti yang benar di aplikasi."],
      cta: { label: "Upload ulang", url: `${appUrl()}/profile/iuran` },
    }),

  feeOverdue: (name: string, label: string, amount: string) =>
    build(`Pengingat: iuran ${label} belum dibayar`, {
      preview: `${amount} sudah lewat jatuh tempo.`,
      title: "Iuran lewat jatuh tempo",
      paragraphs: [`Halo ${name},`, `Iuran ${label} sebesar ${amount} sudah lewat jatuh tempo dan belum tercatat lunas.`, "Kalau sudah bayar, upload buktinya di aplikasi. Kalau bayar tunai, kabari admin supaya dicatat."],
      cta: { label: "Lihat iuran saya", url: `${appUrl()}/profile/iuran` },
      footnote: "Pengingat ini dikirim paling sering sekali seminggu.",
    }),
};
