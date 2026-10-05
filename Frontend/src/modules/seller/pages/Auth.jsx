import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Store, Phone, KeyRound, ArrowLeft, Loader2, ConciergeBell, Soup, Utensils, Home } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@food/components/ui/button";
import { useCompanyName } from "@food/hooks/useCompanyName";
import { setAuthData } from "@food/utils/auth";
import { useAuth } from "@core/context/AuthContext";
import { sellerApi } from "../services/sellerApi";
import { registerWebPushForCurrentModule } from "@food/utils/firebaseMessaging";
import zozomenLogo from "@/assets/zozomenLogo.png"
import { loadBusinessSettings, getCachedSettings } from "@common/utils/businessSettings"

const DEFAULT_COUNTRY_CODE = "+91";

export default function SellerAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const companyName = useCompanyName();
  const [step, setStep] = useState("phone");
  const [authMode, setAuthMode] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState(() => sessionStorage.getItem("sellerAuthPhone") || "");
  const [otp, setOtp] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState(() => getCachedSettings()?.logo?.url || null)
  const [keyboardInset, setKeyboardInset] = useState(0)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await loadBusinessSettings()
        if (settings?.logo?.url) setLogoUrl(settings.logo.url)
      } catch (e) {}
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return undefined

    const updateKeyboardInset = () => {
      const viewport = window.visualViewport
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      setKeyboardInset(inset > 0 ? inset : 0)
    }

    updateKeyboardInset()
    window.visualViewport.addEventListener("resize", updateKeyboardInset)
    window.visualViewport.addEventListener("scroll", updateKeyboardInset)

    return () => {
      window.visualViewport.removeEventListener("resize", updateKeyboardInset)
      window.visualViewport.removeEventListener("scroll", updateKeyboardInset)
    }
  }, [])



  const nextSellerPath =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/seller")
      ? location.state.from
      : "/seller";

  const maskedPhone = useMemo(() => {
    if (phone.length < 4) return `${DEFAULT_COUNTRY_CODE} ${phone}`;
    return `${DEFAULT_COUNTRY_CODE} ${phone.slice(0, 2)}******${phone.slice(-2)}`;
  }, [phone]);

  const validatePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length !== 10) return "Enter a valid 10-digit mobile number";
    if (!["6", "7", "8", "9"].includes(digits[0])) return "Enter a valid Indian mobile number";
    return "";
  };

  const handleSendOtp = async () => {

    const validation = validatePhone(phone);
    if (validation) {
      toast.error(validation);
      return;
    }

    try {
      setIsLoading(true);
      const fullPhone = `${DEFAULT_COUNTRY_CODE} ${phone}`.trim();
      const response = await sellerApi.requestOtp(fullPhone, authMode);
      const payload = response?.data?.result || response?.data?.data || response?.data || {};
      const devOtp = payload?.otp || null;
      const deliveryMode = payload?.deliveryMode || "sms";
      const resolvedPhone = String(payload?.phone || fullPhone).trim();

      toast.success("OTP sent to your seller number.");
      setOtpPhone(resolvedPhone);
      setOtp("");
      setStep("otp");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = String(otp || "").replace(/\D/g, "").slice(0, 4);
    if (code.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      const verifyPhone = String(otpPhone || `${DEFAULT_COUNTRY_CODE} ${phone}`.trim()).trim();
      let fcmToken = null;
      let platform = "web";
      try {
        if (window.flutter_inappwebview?.callHandler) {
          platform = "mobile";
          for (const handler of ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"]) {
            const token = await window.flutter_inappwebview.callHandler(handler, { module: "seller" });
            if (typeof token === "string" && token.trim()) {
              fcmToken = token.trim();
              break;
            }
          }
        } else if (window.MobileApp?.getFcmToken) {
          platform = "mobile";
          fcmToken = String(await Promise.resolve(window.MobileApp.getFcmToken()) || "").trim() || null;
        } else {
          fcmToken = localStorage.getItem("fcm_web_registered_token_seller") || null;
        }
      } catch (error) {
        console.warn("Unable to read seller FCM token during login", error);
      }
      const response = await sellerApi.verifyOtp(verifyPhone, code, fcmToken, platform);
      const data = response?.data?.result || response?.data?.data || response?.data || {};
      const accessToken = data?.accessToken || data?.token;
      const refreshToken = data?.refreshToken || null;
      const sellerUser = data?.seller || data?.user || data?.data?.seller || data?.data?.user;

      if (!accessToken) {
        throw new Error("Login succeeded but no access token was returned");
      }

      setAuthData("seller", accessToken, sellerUser, refreshToken);

      login({
        ...sellerUser,
        name:
          sellerUser?.name ||
          "Seller",
        shopName:
          sellerUser?.shopName ||
          sellerUser?.name ||
          "Store",
        phone:
          sellerUser?.phone ||
          `${DEFAULT_COUNTRY_CODE} ${phone}`.trim(),
        email: sellerUser?.email || "",
        token: accessToken,
        role: "seller",
      });
      // Access token is now stored, so web/native FCM registration can persist this device.
      await registerWebPushForCurrentModule("/seller").catch((error) => {
        console.warn("Seller FCM registration after login failed", error);
      });

      const isApproved = sellerUser?.approved !== false && (!sellerUser?.approvalStatus || sellerUser?.approvalStatus === "approved");

      toast.success(
        !isApproved
          ? "OTP verified. Continue your seller setup."
          : "Seller login successful",
      );

      if (!isApproved) {
        if (sellerUser?.onboardingSubmitted) {
          navigate("/seller/pending");
        } else {
          navigate("/seller/onboarding");
        }
      } else {
        navigate(nextSellerPath);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled =
    isLoading ||
    (step === "phone" && phone.length !== 10) ||
    (step === "otp" && otp.length !== 4);

  return (
    <div
      className={`h-[100dvh] bg-white flex flex-col relative font-sans ${keyboardInset > 50 ? 'overflow-hidden justify-center' : 'overflow-y-auto'}`}
      style={{ paddingBottom: keyboardInset ? `${keyboardInset + 24}px` : undefined }}
    >
      <div className="flex-1 max-w-[420px] mx-auto w-full px-6 flex flex-col pt-12 relative z-20">
        
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logoUrl || zozomenLogo} alt="Logo" className="h-12 w-auto object-contain" />
          <div className="flex flex-col items-start leading-none gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {companyName}
            </h1>
            <p className="text-[15px] font-semibold text-slate-500">
              Seller Partner
            </p>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-[26px] font-extrabold text-gray-900 mb-1">
            {authMode === "login" ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {authMode === "login" ? "Login to your Seller Account" : "Register a new Seller Partner account"}
          </p>
        </div>

        {step === "phone" ? (
          <>
            {/* Toggle Switch */}
            <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100 mb-8 mx-auto w-full max-w-[300px]">
              <button 
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold text-center transition-all ${
                  authMode === 'login' 
                    ? 'bg-[#16a34a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button 
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold text-center transition-all ${
                  authMode === 'register' 
                    ? 'bg-[#16a34a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            <div className="space-y-6">
              {/* Mobile Number Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 pl-1">Mobile Number</label>
                <div className="flex items-center border border-gray-200 rounded-2xl p-2 bg-white focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a] transition-all">
                  <div className="p-2 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#16a34a]" />
                  </div>
                  <div className="flex items-center pl-1 pr-3 border-r border-gray-200">
                    <span className="text-sm text-gray-700 font-semibold">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
                      sessionStorage.setItem("sellerAuthPhone", val);
                    }}
                    className="w-full bg-transparent pl-3 pr-2 py-2 text-sm text-gray-900 font-semibold outline-none placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Login Button */}
              <Button
                onClick={handleSendOtp}
                disabled={isSubmitDisabled}
                className={`w-full py-6 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                  !isSubmitDisabled
                  ? "bg-[#11843b] hover:bg-[#0e692f] text-white shadow-lg shadow-[#16a34a]/20 active:scale-[0.98]"
                  : "bg-gray-100 cursor-not-allowed opacity-50 text-gray-400 shadow-none"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                ) : (
                  <>
                    Get Verification Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              {/* Register Link */}
              <div className="text-center pt-2">
                {authMode === 'login' ? (
                  <p className="text-sm text-gray-500 font-medium">
                    New to {companyName}? <button onClick={() => setAuthMode('register')} className="text-[#16a34a] font-bold hover:underline">Register Now</button>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 font-medium">
                    Already have an account? <button onClick={() => setAuthMode('login')} className="text-[#16a34a] font-bold hover:underline">Login</button>
                  </p>
                )}
              </div>
            </div>

            <div className="text-center mt-auto pt-8 pb-6 space-y-3">
              <div className="text-center">
                <p className="text-[12px] text-gray-500 font-medium mb-1">
                  By continuing, you agree to our
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-[#cc2532] dark:text-red-500">
                  <Link to="/seller/terms" className="hover:underline">
                    Terms & Conditions
                  </Link>
                  <span className="text-gray-400 font-normal">•</span>
                  <Link to="/seller/privacy" className="hover:underline">
                    Privacy Policy
                  </Link>
                  <span className="text-gray-400 font-normal">•</span>
                  <Link to="/seller/support" className="hover:underline">
                    Support
                  </Link>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
                &copy; {new Date().getFullYear()} {companyName.toUpperCase()} SELLER PORTAL
              </p>
            </div>
          </>
        ) : (
          <>
            {/* OTP Verification Layout */}
            <div className="flex justify-center mb-8">
               <button
                 onClick={() => {
                   setStep("phone");
                   setOtp("");
                   setOtpPhone("");
                 }}
                 className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 px-4 py-2 rounded-full"
               >
                 <ArrowLeft className="w-4 h-4" /> Back to Login
               </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-[24px] font-extrabold text-gray-900 mb-2">Verify OTP</h2>
              <p className="text-sm text-gray-500 font-medium">
                Sent to <span className="text-[#16a34a] font-bold">{maskedPhone}</span>
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between gap-3 sm:gap-4 max-w-[280px] mx-auto">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      let newOtp = otp.split("");
                      newOtp[index] = val;
                      setOtp(newOtp.join("").slice(0, 4));
                      if (val && index < 3) {
                        e.target.nextElementSibling?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[index] && index > 0) {
                        e.target.previousElementSibling?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                      if (pastedData) {
                        setOtp(pastedData);
                      }
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-2xl focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white text-gray-900 transition-all outline-none"
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={isSubmitDisabled}
                className={`w-full py-6 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                  !isSubmitDisabled
                  ? "bg-[#11843b] hover:bg-[#0e692f] text-white shadow-lg shadow-[#16a34a]/20 active:scale-[0.98]"
                  : "bg-gray-100 cursor-not-allowed opacity-50 text-gray-400 shadow-none"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                ) : (
                  "Login"
                )}
              </Button>
            </div>
            
            <div className="text-center mt-auto pt-8 pb-6 space-y-3">
              <div className="text-center">
                <p className="text-[12px] text-gray-500 font-medium mb-1">
                  By continuing, you agree to our
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-[#cc2532] dark:text-red-500">
                  <Link to="/seller/terms" className="hover:underline">
                    Terms & Conditions
                  </Link>
                  <span className="text-gray-400 font-normal">•</span>
                  <Link to="/seller/privacy" className="hover:underline">
                    Privacy Policy
                  </Link>
                  <span className="text-gray-400 font-normal">•</span>
                  <Link to="/seller/support" className="hover:underline">
                    Support
                  </Link>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
                &copy; {new Date().getFullYear()} {companyName.toUpperCase()} SELLER PORTAL
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}




