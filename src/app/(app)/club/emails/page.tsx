import { requireAdminPage } from "@/lib/authz";
import { EMAIL_SAMPLES, renderNotificationEmail } from "@/lib/email/template";
import { AdminHeader } from "@/components/club/admin-header";
import { EmailFrame } from "@/components/club/email-frame";

export default async function EmailTemplatesPage() {
  await requireAdminPage();

  const groups = [...new Set(EMAIL_SAMPLES.map((sample) => sample.group))];

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AdminHeader
        title="Template email"
        desc="Satu layout untuk setiap notifikasi: logo, warna navy dan oranye, serta tombol ke halaman yang sama di aplikasi."
      />

      {groups.map((group) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{group}</h2>
          {EMAIL_SAMPLES.filter((sample) => sample.group === group).map((sample) => {
            const mail = renderNotificationEmail(sample);
            return (
              <article
                key={sample.id}
                className="overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-[0_10px_28px_rgba(14,44,60,0.06)]"
              >
                <div className="border-b border-sand px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-ink">Subjek</p>
                  <p className="mt-0.5 text-sm font-bold text-navy">{mail.subject}</p>
                </div>
                <EmailFrame html={mail.html} title={mail.subject} />
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
