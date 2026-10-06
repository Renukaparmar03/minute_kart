import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Tag, ShoppingCart, Truck, ChevronRight } from "lucide-react"
import { useAuth } from "@core/context/AuthContext"
import DraggableModuleSwitcher from "../../../common/components/DraggableModuleSwitcher"

export default function BottomNavigation() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const pathname = location.pathname
  const profileSource = new URLSearchParams(location.search).get("from")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let initialHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      if (initialHeight - currentHeight > 150) {
        setIsKeyboardOpen(true)
      } else {
        setIsKeyboardOpen(false)
        if (currentHeight > initialHeight) {
          initialHeight = currentHeight
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (Math.abs(currentScrollY - lastScrollY) < 5) return

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Check active routes - support both /user/* and /* paths
  const isBakery = pathname.startsWith("/food/user/bakery")
  const isUnder250 = pathname === "/food/under-250" || pathname.startsWith("/food/user/under-250")
  const isCart =
    pathname === "/food/user/cart" ||
    pathname.startsWith("/food/user/cart")
  const isDelivery =
    !isBakery &&
    !isUnder250 &&
    !isCart &&
    (pathname === "/food" ||
      pathname === "/food/" ||
      pathname === "/food/user" ||
      (pathname.startsWith("/food/user") &&
        !pathname.includes("/bakery") &&
        !pathname.includes("/under-250") &&
        !pathname.includes("/cart")))

  if (isKeyboardOpen) return null

  return (
    <>
      <DraggableModuleSwitcher />
      <div 
        className={`md:hidden fixed left-0 right-0 bottom-0 z-50 transition-all duration-300 ease-in-out bg-white dark:bg-[#1a1a1a] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-gray-800 ${isVisible ? "translate-y-0" : "translate-y-full"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-2">
        {/* Delivery Tab */}
        <Link
          to="/food/user"
          replace
          className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
        >
          <Truck 
            className={`h-[26px] w-[26px] ${isDelivery ? "text-gray-900 dark:text-white" : "text-gray-500"}`} 
            strokeWidth={isDelivery ? 2 : 1.5} 
            fill={isDelivery ? "#FDE047" : "none"} 
          />
          <span className={`text-[10px] tracking-wide ${isDelivery ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-500"}`}>
            Delivery
          </span>
        </Link>

        {/* Under 250 Tab */}
        <Link
          to="/food/user/under-250"
          replace
          className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
        >
          <Tag 
            className={`h-[26px] w-[26px] ${isUnder250 ? "text-gray-900 dark:text-white" : "text-gray-500"}`} 
            strokeWidth={isUnder250 ? 2 : 1.5} 
            fill={isUnder250 ? "#FDE047" : "none"} 
          />
          <span className={`text-[10px] tracking-wide ${isUnder250 ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-500"}`}>
            Under 250
          </span>
        </Link>

        {/* Cart Tab */}
        <Link
          to="/food/user/cart"
          replace
          className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
        >
          <ShoppingCart 
            className={`h-[26px] w-[26px] ${isCart ? "text-gray-900 dark:text-white" : "text-gray-500"}`} 
            strokeWidth={isCart ? 2 : 1.5} 
            fill={isCart ? "#FDE047" : "none"} 
          />
          <span className={`text-[10px] tracking-wide ${isCart ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-500"}`}>
            Cart
          </span>
        </Link>

        {/* Minutemart Link Button (styled like Zomato button) */}
        <Link
          to="/quick"
          className="flex items-center justify-center bg-[#E23744] text-white px-3.5 py-1.5 rounded-[10px] shadow-sm transition-all active:scale-95 ml-2 h-9"
        >
          <span className="font-black text-[13px] tracking-tight lowercase">minutemart</span>
        </Link>
      </div>
    </div>
    </>
  )
}
