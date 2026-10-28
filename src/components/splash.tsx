import Image from "next/image";
import logoLight from "@/assets/brand/logo-light.png";

// Shown when the installed app (PWA) launches, once per launch. The markup is
// always in the HTML but hidden; this script runs during parsing, before the
// first paint, and flips html[data-splash] so there is no flash of the page.
// Browser tabs and reloads inside the same launch skip it.
const SHOW_MS = 1300;
const EXIT_MS = 420;
const script = `(function(){try{
var r=document.documentElement;
var app=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
if(!app||sessionStorage.getItem("pbw-splash"))return;
sessionStorage.setItem("pbw-splash","1");
r.dataset.splash="in";
setTimeout(function(){r.dataset.splash="out";setTimeout(function(){delete r.dataset.splash},${EXIT_MS})},${SHOW_MS});
}catch(e){}})()`;

export function Splash() {
  return (
    <>
      <div className="splash" aria-hidden>
        <div className="splash-logo">
          <Image src={logoLight} alt="" priority sizes="220px" className="h-auto w-[220px]" />
        </div>
        <span className="splash-bar" />
      </div>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}
