import { redirect } from "next/navigation";

// CSV downloads now sit on each period in Club → Iuran.
export default function ClubExportPage() {
  redirect("/club/iuran");
}
