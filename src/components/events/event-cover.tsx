import Image from "next/image";
import type { EventType } from "@prisma/client";
import { cn } from "@/lib/utils";
import shuttle3d from "@/assets/3d/shuttle.png";
import racket3d from "@/assets/3d/racket.png";
import trophy3d from "@/assets/3d/trophy.png";

const BACKDROP: Record<EventType, string> = {
  SPARRING: "from-[#f6b46a] via-accent to-[#e48b33]",
  TOURNAMENT: "from-navy via-navy-2 to-brown",
  GATHERING: "from-accent-soft via-[#f8d8b0] to-accent",
  OTHER: "from-navy-2 via-navy to-navy",
};

/** Latest album photo when there is one, otherwise a type-colored 3D scene. */
export function EventCover({
  type,
  src,
  className,
  large = false,
}: {
  type: EventType;
  src?: string | null;
  className?: string;
  large?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-sand", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
      </div>
    );
  }
  const size = large ? "w-[118px]" : "w-[78px]";
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", BACKDROP[type], className)}>
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.14]" preserveAspectRatio="none" viewBox="0 0 400 200">
        <path d="M0 150 L400 60 M0 190 L400 100 M120 0 L170 200 M300 0 L330 200" stroke="white" strokeWidth="3" fill="none" />
      </svg>
      {type === "TOURNAMENT" ? (
        <Image src={trophy3d} alt="" className={cn("float-tilt prop-shadow absolute bottom-2 right-5", large ? "w-[84px]" : "w-[56px]")} />
      ) : type === "SPARRING" ? (
        <>
          <Image src={racket3d} alt="" className={cn("float-tilt-rev prop-shadow absolute -bottom-4 rotate-[-28deg]", large ? "right-[150px] w-[60px]" : "right-[104px] w-[42px]")} />
          <Image src={shuttle3d} alt="" className={cn("float-tilt prop-shadow absolute right-2 top-2", size)} />
        </>
      ) : (
        <Image src={shuttle3d} alt="" className={cn("float-tilt prop-shadow absolute bottom-1 right-3", size)} />
      )}
    </div>
  );
}
