import { redirect } from "next/navigation";

// Events are managed together with weekly training on the Agenda page.
export default function ClubEventsPage() {
  redirect("/club/jadwal");
}
