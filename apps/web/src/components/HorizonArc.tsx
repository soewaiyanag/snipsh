// The arc is the top of a circle this wide: the logo's ring, seen from very close.
const ARC_DIAMETER_PX = 2400

// Fills the first screen of the landing page, starting behind the header. Its light swells slowly. It never rises
// above 40rem, so its glow stays clear of the hero's last button on short screens.
export function HorizonArc() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-svh min-h-208 w-screen -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(#000_88%,transparent)]"
    >
      <div
        className="absolute top-[max(62%,40rem)] left-1/2 -translate-x-1/2 rounded-full border-t-[1.5px] border-ring bg-background shadow-horizon"
        style={{ width: ARC_DIAMETER_PX, height: ARC_DIAMETER_PX }}
      />
      {/* A stronger light over the same arc, fading in and out. Opacity alone keeps it cheap to animate. */}
      <div
        className="absolute top-[max(62%,40rem)] left-1/2 -translate-x-1/2 rounded-full opacity-0 shadow-horizon-bright motion-safe:animate-glow"
        style={{ width: ARC_DIAMETER_PX, height: ARC_DIAMETER_PX }}
      />
    </div>
  )
}
