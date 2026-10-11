import Image from "next/image";
import shuttleImg from "@/assets/brand/shuttle-3d.png";

// CSS float animation (globals.css) instead of motion, so this decoration
// does not pull the animation runtime into the page.
export function FloatingShuttle() {
  return (
    <Image
      src={shuttleImg}
      alt=""
      width={64}
      height={64}
      className="float-y pointer-events-none absolute -right-2 top-3 z-0 h-16 w-16 opacity-80"
    />
  );
}
