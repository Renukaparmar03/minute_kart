// Full-screen "we are not operating in this zone" screen shown when the user's location
// is outside every zone the admin has created.
export default function OutOfZoneScreen({ onChangeLocation }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#eaf6ea] flex justify-center">
      <div className="relative h-full w-full max-w-md">
        <img
          src="/assets/outeofzone.png"
          alt="We are currently not operating in this zone"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/40 to-transparent">
          <button
            type="button"
            onClick={onChangeLocation}
            className="w-full rounded-xl bg-[#DC021B] py-3.5 text-base font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
          >
            Change your location
          </button>
        </div>
      </div>
    </div>
  )
}
