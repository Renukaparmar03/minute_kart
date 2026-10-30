// Full-screen "we are not operating in this zone" screen shown when the user's location
// is outside every zone the admin has created.
const BANNER_SRC = '/assets/outeofzone.png'

export default function OutOfZoneScreen({ onChangeLocation }) {
  return (
    <div 
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden bg-[#eaf6ea]"
      style={{
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        paddingBottom: "max(var(--safe-area-bottom, 3.25rem), env(safe-area-inset-bottom, 3.25rem), 3.25rem)",
        paddingLeft: "max(12px, env(safe-area-inset-left, 12px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 12px))",
      }}
    >
      {/* Blurred copy of the banner fills the space beside the banner on wide screens */}
      <img
        src={BANNER_SRC}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
      />
      {/* Box fits within the safe viewport height so the button is never cut off by mobile system navigation */}
      <div
        className="relative h-full max-h-full aspect-[899/1600] max-w-[min(100vw,28rem)] flex items-center justify-center"
      >
        <img
          src={BANNER_SRC}
          alt="We are currently not operating in this zone"
          className="h-full w-full object-contain object-center select-none pointer-events-none"
        />
        {/* Covers the button drawn in the banner */}
        <button
          type="button"
          onClick={onChangeLocation}
          className="absolute left-1/2 top-[91.6%] h-[5.8%] w-[56%] -translate-x-1/2 flex items-center justify-center gap-[0.5em] rounded-full border-2 border-white/80 bg-linear-to-b from-[#FFA31A] via-[#FF8A00] to-[#F26B00] px-[0.8em] font-bold text-white shadow-[0_4px_12px_rgba(242,107,0,0.45),inset_0_2px_0_rgba(255,255,255,0.35)] active:scale-[0.97] transition-transform text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          style={{ fontSize: 'clamp(11px, 2.2vh, 15px)' }}
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
