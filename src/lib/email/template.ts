import type { NotificationType } from "@prisma/client";
import { appUrl } from "@/lib/app-url";

/**
 * Transactional email for every in-app notification. Table layout, inline
 * styles, and the club palette from globals.css so it holds up in mail clients.
 */

const NAVY = "#0e2c3c";
const ACCENT = "#ee9f48";
const CREAM = "#f6f2ea";
const SLATE = "#475569";
const MUTED = "#64748b";

const TYPE_STYLE: Record<NotificationType, { kicker: string; badgeBg: string; badgeColor: string }> = {
  IURAN: { kicker: "Iuran", badgeBg: "#fbe7cf", badgeColor: "#b4621c" },
  EVENT: { kicker: "Event", badgeBg: "#efe8dc", badgeColor: NAVY },
  MATCH: { kicker: "Match", badgeBg: NAVY, badgeColor: ACCENT },
  ANNOUNCEMENT: { kicker: "Pengumuman", badgeBg: "#fbe7cf", badgeColor: "#634f33" },
  SYSTEM: { kicker: "Akun", badgeBg: "#efe8dc", badgeColor: NAVY },
};

const FONT = "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif";
const DISPLAY = "'Bricolage Grotesque', 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif";

export type NotificationEmailInput = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
};

export function emailCtaLabel(href: string) {
  if (href.startsWith("/profile/iuran") || href.startsWith("/club/iuran")) return "Buka iuran";
  if (href.startsWith("/play")) return "Buka Play";
  if (href.startsWith("/events")) return "Lihat event";
  if (href.startsWith("/club")) return "Buka Club Admin";
  if (href.startsWith("/notifications")) return "Baca pengumuman";
  return "Buka PB Wisdom";
}

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(href: string, base: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}

export function renderNotificationEmail(input: NotificationEmailInput, base = appUrl()) {
  const style = TYPE_STYLE[input.type];
  const href = input.href ? absoluteUrl(input.href, base) : null;
  const cta = href ? emailCtaLabel(input.href ?? "/") : null;
  const bodyHtml = esc(input.body).replaceAll("\n", "<br />");
  const preheader = input.body.replace(/\s+/g, " ").slice(0, 140);
  const logo = `${base}/brand/logo.png`;
  const subject = input.title;

  const button = href
    ? `<tr>
            <td style="padding:24px 28px 32px;">
              <a href="${esc(href)}" target="_blank" style="display:inline-block;background:${NAVY};color:#ffffff;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;text-decoration:none;padding:16px 26px;border-radius:999px;">${esc(cta ?? "Buka PB Wisdom")}</a>
            </td>
          </tr>`
    : `<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(subject)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:${CREAM};color:${NAVY};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};background-image:repeating-linear-gradient(-18deg, rgba(238,159,72,0.12) 0px, rgba(238,159,72,0.12) 18px, transparent 18px, transparent 36px);">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
          <tr>
            <td align="center" style="padding:4px 0 22px;">
              <a href="${esc(base)}/" target="_blank" style="text-decoration:none;">
                <img src="${esc(logo)}" width="168" alt="PB Wisdom" style="display:block;width:168px;max-width:168px;height:auto;border:0;outline:none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:28px;box-shadow:0 10px 28px rgba(14,44,60,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="6" style="background:${ACCENT};border-radius:28px 28px 0 0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:26px 28px 0;font-family:${FONT};">
                    <span style="display:inline-block;background:${style.badgeBg};color:${style.badgeColor};font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;padding:7px 12px;border-radius:999px;">${esc(style.kicker)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 28px 0;font-family:${DISPLAY};font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:${NAVY};">${esc(input.title)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 28px 0;font-family:${FONT};font-size:15px;line-height:1.65;color:${SLATE};">${bodyHtml}</td>
                </tr>
                ${button}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
              <strong style="color:${NAVY};">PB Wisdom</strong> · Medan · Est. 2023<br />
              Email ini untuk member yang terdaftar di klub.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "PB Wisdom",
    style.kicker,
    "",
    input.title,
    "",
    input.body,
    href ? `\n${cta}: ${href}` : "",
    "",
    "PB Wisdom Medan · Est. 2023",
  ].join("\n");

  return { subject, html, text };
}

export type EmailSample = NotificationEmailInput & { id: string; group: string };

/** One example of every notification the app creates, with the real copy. */
export const EMAIL_SAMPLES: EmailSample[] = [
  {
    id: "iuran-open",
    group: "Iuran",
    type: "IURAN",
    title: "Iuran September dibuka",
    body: "Silakan bayar Rp150.000 sebelum jatuh tempo.",
    href: "/profile/iuran",
  },
  {
    id: "iuran-updated",
    group: "Iuran",
    type: "IURAN",
    title: "Iuran September diperbarui",
    body: "Rp150.000, jatuh tempo 05/10/2026.",
    href: "/profile/iuran",
  },
  {
    id: "iuran-late",
    group: "Iuran",
    type: "IURAN",
    title: "Iuran September terlambat",
    body: "Segera bayar dan upload bukti transfer.",
    href: "/profile/iuran",
  },
  {
    id: "iuran-verified",
    group: "Iuran",
    type: "IURAN",
    title: "Iuran diverifikasi",
    body: "Pembayaranmu sudah dicatat. Terima kasih!",
    href: "/profile/iuran",
  },
  {
    id: "iuran-rejected",
    group: "Iuran",
    type: "IURAN",
    title: "Bukti iuran ditolak",
    body: "Alasan: nominal tidak sesuai. Silakan upload ulang.",
    href: "/profile/iuran",
  },
  {
    id: "iuran-cash",
    group: "Iuran",
    type: "IURAN",
    title: "Iuran dicatat lunas",
    body: "Iuran September sudah dicatat lunas oleh admin. Terima kasih!",
    href: "/profile/iuran",
  },
  {
    id: "event-new",
    group: "Event",
    type: "EVENT",
    title: "Event baru: Sparring Internal Wisdom",
    body: "Cek detail & RSVP di tab Events.",
    href: "/events/contoh",
  },
  {
    id: "event-changed",
    group: "Event",
    type: "EVENT",
    title: "Sparring Internal Wisdom berubah",
    body: "Jadwal baru: Sabtu 18 Okt, 19:00 · GOR Unimed",
    href: "/events/contoh",
  },
  {
    id: "event-promoted-quota",
    group: "Event",
    type: "EVENT",
    title: "Kamu dapat tempat di Sparring Internal Wisdom",
    body: "Kuota ditambah, RSVP-mu sekarang GOING.",
    href: "/events/contoh",
  },
  {
    id: "event-promoted-slot",
    group: "Event",
    type: "EVENT",
    title: "Kamu dapat tempat di Sparring Internal Wisdom",
    body: "Ada slot kosong, RSVP-mu sekarang GOING.",
    href: "/events/contoh",
  },
  {
    id: "event-paid",
    group: "Event",
    type: "EVENT",
    title: "Pembayaran event diterima",
    body: "Biaya Sparring Internal Wisdom sudah dicatat lunas.",
    href: "/events/contoh",
  },
  {
    id: "match-pending",
    group: "Match",
    type: "MATCH",
    title: "Skor baru menunggu verifikasi",
    body: "Ganda · 30-26",
    href: "/play",
  },
  {
    id: "match-disputed",
    group: "Match",
    type: "MATCH",
    title: "Skor match dilaporkan salah",
    body: '30-26 · "Skor tim kami harusnya 30"',
    href: "/play",
  },
  {
    id: "match-kept",
    group: "Match",
    type: "MATCH",
    title: "Laporan skor dicek: skor tetap",
    body: "Admin menyatakan skor 30-26 sudah benar.",
    href: "/play",
  },
  {
    id: "match-removed",
    group: "Match",
    type: "MATCH",
    title: "Match yang dilaporkan dihapus",
    body: "Skor 30-26 dihapus. Catat ulang dengan skor yang benar.",
    href: "/play",
  },
  {
    id: "match-confirmed",
    group: "Match",
    type: "MATCH",
    title: "Hasil match disahkan",
    body: "Skor 30-26 masuk leaderboard.",
    href: "/play",
  },
  {
    id: "match-rejected",
    group: "Match",
    type: "MATCH",
    title: "Skor match ditolak admin",
    body: "Skor 30-26 tidak disahkan. Cek lagi dan catat ulang bila perlu.",
    href: "/play",
  },
  {
    id: "announcement",
    group: "Pengumuman",
    type: "ANNOUNCEMENT",
    title: "Ganti lapangan Sabtu ini",
    body: "Latihan Sabtu pindah sementara ke GOR Unimed karena Merdeka booked. Datang 15 menit lebih awal ya!",
    href: "/notifications",
  },
  {
    id: "welcome",
    group: "Akun",
    type: "SYSTEM",
    title: "Welcome to PB Wisdom!",
    body: "Akunmu sudah disetujui. Selamat bergabung.",
    href: "/",
  },
  {
    id: "admin-granted",
    group: "Akun",
    type: "SYSTEM",
    title: "Kamu sekarang admin PB Wisdom",
    body: "Menu Club Admin sudah bisa kamu buka dari ikon perisai di atas.",
    href: "/club",
  },
  {
    id: "admin-revoked",
    group: "Akun",
    type: "SYSTEM",
    title: "Peran admin dicabut",
    body: "Akunmu kembali menjadi member biasa.",
    href: "/",
  },
];
