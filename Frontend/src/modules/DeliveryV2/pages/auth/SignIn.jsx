import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { ShieldCheck, Phone, ArrowRight, Loader2, ConciergeBell, Soup, Utensils, Home } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { deliveryAPI } from "@food/api"
import { clearModuleAuth, isModuleAuthenticated } from "@food/utils/auth"
import { useCompanyName } from "@food/hooks/useCompanyName"
import { toast } from "sonner"
import { motion } from "framer-motion"
import zozomenLogo from "@/assets/zozomenLogo.png"
import { loadBusinessSettings, getCachedSettings } from "@common/utils/businessSettings"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


// Common country codes
const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
]

export default function DeliverySignIn() {
  const companyName = useCompanyName()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const referralCode = searchParams.get("ref") || ""
  const inputRef = useRef(null)

  const [formData, setFormData] = useState(() => {
    return {
      phone: sessionStorage.getItem("deliverySignInPhone") || "",
      countryCode: "+91",
    }
  })

  // Pre-fill form from sessionStorage if data exists (e.g., when coming back from OTP)
  useEffect(() => {
    const stored = sessionStorage.getItem("deliveryAuthData")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.phone) {
          const phoneDigits = data.phone.replace("+91", "").trim()
          setFormData(prev => ({
            ...prev,
            phone: phoneDigits
          }))
        }
      } catch (err) {
        debugError("Error parsing stored auth data:", err)
      }
    }
  }, [])

  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [logoUrl, setLogoUrl] = useState(() => getCachedSettings()?.logo?.url || null)

  useEffect(() => {
    if (isModuleAuthenticated("delivery")) {
      navigate("/food/delivery", { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await loadBusinessSettings()
        if (settings?.logo?.url) setLogoUrl(settings.logo.url)
      } catch (e) {}
    }
    fetchSettings()
  }, [])

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required"
    }
    const digitsOnly = phone.replace(/\D/g, "")
    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits"
    }
    return ""
  }

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    setError("")

    const phoneError = validatePhone(formData.phone)
    if (phoneError) {
      setError(phoneError)
      return
    }

    const fullPhone = `${formData.countryCode} ${formData.phone}`.trim()

    try {
      setIsSending(true)
      clearModuleAuth("delivery")

      await deliveryAPI.sendOTP(fullPhone, "login")

      const authData = {
        method: "phone",
        phone: fullPhone,
        isSignUp: false,
        purpose: "login",
        module: "delivery",
      }
      sessionStorage.setItem("deliveryAuthData", JSON.stringify(authData))
      
      if (referralCode) {
        try {
          const existingSignupDetails = JSON.parse(sessionStorage.getItem("deliverySignupDetails") || "{}")
          sessionStorage.setItem("deliverySignupDetails", JSON.stringify({
            ...existingSignupDetails,
            ref: referralCode
          }))
        } catch (e) {}
      }

      navigate("/food/delivery/otp", { replace: true })
    } catch (err) {
      debugError("Send OTP Error:", err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send OTP. Please try again."
      toast.error(message)
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setFormData({
      ...formData,
      phone: value,
    })
    sessionStorage.setItem("deliverySignInPhone", value)
  }

  const isValidPhone = !validatePhone(formData.phone)
  const isSubmitDisabled = isSending || !isValidPhone

  const handleInputFocus = (e) => {
    // Scroll input smoothly into center view on mobile keyboard pop-up
    setTimeout(() => {
      e.target?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full relative flex items-center justify-center font-sans overflow-y-auto bg-[#f5f8f2] py-8 px-4">
      {/* Background Ambient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, 25, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#86bf24] blur-[110px] opacity-25"
        />
        <motion.div
          animate={{
            x: [0, -35, 0],
            y: [0, -45, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full bg-[#73a61d] blur-[120px] opacity-20"
        />
      </div>

      {/* Main Centered Card Container */}
      <div className="w-full max-w-[400px] bg-white relative z-10 overflow-hidden rounded-[36px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12)] border border-white/60 flex flex-col my-auto transition-all">
        
        {/* Card Header Section */}
        <div className="relative bg-gradient-to-br from-[#86bf24] to-[#73a61d] pt-8 pb-14 px-6 text-white text-center overflow-hidden">
          {/* Subtle Background Decorative Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-10, -6, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 left-6"
            >
              <ConciergeBell className="w-14 h-14" strokeWidth={1} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0], rotate: [10, 14, 10] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-4 right-6"
            >
              <Soup className="w-12 h-12" strokeWidth={1} />
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-2xl font-black tracking-tight uppercase mb-1 drop-shadow-sm">
              {companyName}
            </h1>
            <div className="flex items-center gap-2 justify-center opacity-90">
              <div className="h-[1px] w-6 bg-white/70" />
              <p className="text-[11px] font-extrabold tracking-[0.15em] uppercase whitespace-nowrap">
                Delivery Partner Portal
              </p>
              <div className="h-[1px] w-6 bg-white/70" />
            </div>
            <div className="h-1 w-8 bg-white/80 rounded-full mt-2" />
          </div>

          {/* S-Curve / Wave Divider at Header Bottom */}
          <div className="absolute -bottom-1 left-0 w-full leading-[0] pointer-events-none">
            <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="w-full h-14 block">
              <path
                fill="#ffffff"
                d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,208C672,224,768,224,864,202.7C960,181,1056,139,1152,133.3C1248,128,1344,160,1392,176L1440,192L1440,280L1392,280C1344,280,1248,280,1152,280C1056,280,960,280,864,280C768,280,672,280,576,280C480,280,384,280,288,280C192,280,96,280,48,280L0,280Z"
              />
            </svg>
          </div>
        </div>

        {/* Circular Logo Badge overlapping Header & Form */}
        <div className="relative -mt-14 flex justify-center z-20">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-[0_12px_30px_rgba(134,191,36,0.25)] flex items-center justify-center overflow-hidden p-1"
          >
            <img
              src={logoUrl || zozomenLogo}
              alt="Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
        </div>

        {/* Form Body Block */}
        <div className="px-6 pt-5 pb-8 flex flex-col">
          {/* Header Title with Green Arrow Accents (Image 2 style) */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[#86bf24] font-black text-xl leading-none">&gt;</span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Welcome Back!
              </h2>
              <span className="text-[#86bf24] font-black text-xl leading-none">&lt;</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Login to your delivery partner account
            </p>
            <div className="h-1 w-8 bg-[#86bf24] mx-auto mt-2 rounded-full" />
          </div>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              {/* Phone Input Box matching Image 2 */}
              <div className="flex items-center border border-gray-200 rounded-2xl p-2 bg-gray-50/60 focus-within:bg-white focus-within:border-[#86bf24] focus-within:ring-2 focus-within:ring-[#86bf24]/20 transition-all shadow-sm">
                <div className="bg-[#f1f9e6] p-2.5 rounded-xl flex items-center justify-center shrink-0 text-[#86bf24]">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex items-center pl-3 pr-3 border-r border-gray-200">
                  <span className="text-sm font-bold text-gray-700">+91</span>
                </div>
                <input
                  ref={inputRef}
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  onFocus={handleInputFocus}
                  className="w-full bg-transparent pl-3 pr-2 py-2 text-base font-bold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-500 mt-2 px-1">{error}</p>
              )}
            </div>

            {/* Action Button matching Image 2 */}
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 uppercase ${
                !isSubmitDisabled
                  ? "bg-[#86bf24] hover:bg-[#73a61d] text-white shadow-lg shadow-[#86bf24]/30 active:scale-[0.98]"
                  : "bg-gray-100 cursor-not-allowed text-gray-400 shadow-none opacity-60"
              }`}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
              ) : (
                <>
                  Get Verification Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Terms Link */}
          <div className="text-center pt-6">
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              By continuing, you agree to our <br />
              <Link to="/food/delivery/terms" className="text-[#86bf24] font-bold hover:underline">
                Terms & Conditions
              </Link>
              ,{" "}
              <Link to="/food/delivery/privacy" className="text-[#86bf24] font-bold hover:underline">
                Privacy Policy
              </Link>
              {" "}and{" "}
              <Link to="/food/delivery/support" className="text-[#86bf24] font-bold hover:underline">
                Support
              </Link>
            </p>
          </div>

          <div className="pt-4 text-center">
            <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
              &copy; {new Date().getFullYear()} {companyName.toUpperCase()} DELIVERY PARTNER
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



