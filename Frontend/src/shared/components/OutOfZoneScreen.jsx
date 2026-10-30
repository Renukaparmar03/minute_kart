// Full-screen "we are not operating in this zone" screen shown when the user's location
// is outside every zone the admin has created.
const BANNER_SRC = '/assets/outeofzone.png'

export default function OutOfZoneScreen({ onChangeLocation }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden bg-[#eaf6ea]">
      {/* Blurred copy of the banner fills the space beside the banner on wide screens */}
      <img
        src={BANNER_SRC}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
      />
      {/* Box is always full height and never wider than the banner at that height, so the banner
          fills top to bottom and only its left/right edges get trimmed on tall phones */}
      <div
        className="relative h-dvh"
        style={{ width: 'min(100vw, 28rem, calc(100dvh * 899 / 1600))' }}
      >
        <img
          src={BANNER_SRC}
          alt="We are currently not operating in this zone"
          className="h-full w-full object-cover object-center"
        />
        {/* Covers the button drawn in the banner. Sized in dvh because the banner's rendered
            width is always 100dvh * 899/1600, even when the box crops its sides. */}
        <button
          type="button"
          onClick={onChangeLocation}
          className="absolute left-1/2 top-[90.5%] h-[5.8%] -translate-x-1/2 flex items-center justify-center gap-[0.5em] rounded-full border-2 border-white/80 bg-linear-to-b from-[#FFA31A] via-[#FF8A00] to-[#F26B00] px-[0.8em] font-bold text-white shadow-[0_4px_12px_rgba(242,107,0,0.45),inset_0_2px_0_rgba(255,255,255,0.35)] active:scale-[0.97] transition-transform"
          style={{ width: 'calc(100dvh * 899 / 1600 * 0.56)', fontSize: 'calc(100dvh * 899 / 1600 * 0.033)' }}
        >
          <svg viewBox="0 0 24 24" className="h-[1.3em] w-[1.3em] shrink-0" fill="currentColor" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span className="whitespace-nowrap">Change your location</span>
          <svg viewBox="0 0 24 24" className="h-[1.1em] w-[1.1em] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
