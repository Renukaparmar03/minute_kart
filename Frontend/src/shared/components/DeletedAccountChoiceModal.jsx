import { Loader2, RotateCcw, UserPlus } from "lucide-react"

// Shown after OTP login when the phone belongs to an account the user deleted earlier.
// They can bring the old account back or start fresh (old orders stay on the old account).
export default function DeletedAccountChoiceModal({ deletedAccount, loadingAction, onRestore, onCreateNew }) {
  const deletedOn = deletedAccount?.deletedAt
    ? new Date(deletedAccount.deletedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null
  const isBusy = Boolean(loadingAction)

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1a1a] p-5 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Welcome back{deletedAccount?.name ? `, ${deletedAccount.name}` : ""}!</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          You deleted your account with this number{deletedOn ? ` on ${deletedOn}` : ""}. Do you want to restore it or create a new account?
        </p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onRestore}
            disabled={isBusy}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-[#379702] bg-[#379702] px-4 py-3 text-left text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {loadingAction === "restore" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <RotateCcw className="h-5 w-5 shrink-0" />}
            <span>
              <span className="block font-semibold">Restore old account</span>
              <span className="block text-xs text-white/80">Get back your profile, addresses and order history</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            disabled={isBusy}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-gray-900 dark:text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {loadingAction === "new" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <UserPlus className="h-5 w-5 shrink-0" />}
            <span>
              <span className="block font-semibold">Create new account</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Start fresh. Your old account will not be accessible.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
