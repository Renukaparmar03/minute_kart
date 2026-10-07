import React from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { 
  ChevronDown,
  Smartphone
} from "lucide-react"

export default function MasterLandingPage() {
  const navigate = useNavigate()


  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-rose-500 selection:text-white">
      
      {/* ========================================== */}
      {/* HERO SECTION WITH ZOMATO BG IMAGE & SEARCH */}
      {/* ========================================== */}
      <section className="relative w-full min-h-screen bg-gray-900 text-white flex flex-col justify-between overflow-hidden">
        
        {/* Background Image & Overlays */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/images/hero_bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />

        {/* Top Header Navbar */}
        <header className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between">
          
          {/* Left: Get the App */}
          <button 
            onClick={() => {
              const el = document.getElementById("get-app-section")
              if (el) el.scrollIntoView({ behavior: "smooth" })
            }}
            className="flex items-center gap-2 text-sm sm:text-base font-semibold hover:text-rose-400 transition-colors bg-black/20 hover:bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10"
          >
            <Smartphone className="w-4 h-4 text-rose-400" />
            <span>Get the App</span>
          </button>
        </header>

        {/* Center Hero Content (Zomato-exact design) */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 w-full my-auto text-center flex flex-col items-center py-10">
          
          {/* Brand Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 flex items-center justify-center gap-1.5 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl select-none font-serif">
              minutekart
            </h1>
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 self-end mb-3 animate-pulse" />
          </motion.div>

          {/* Main Headline */}
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-4 drop-shadow-lg"
          >
            India’s #1 <br className="sm:hidden" />food delivery app
          </motion.h2>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-2xl font-medium text-gray-200 mb-8 max-w-2xl leading-relaxed drop-shadow-md"
          >
            Experience fast & easy online ordering on the Minutekart app
          </motion.p>

          {/* App Download Buttons Row */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 w-full"
          >
            {/* Google Play Button */}
            <a 
              href="#get-app-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("get-app-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-56 sm:w-auto bg-black/80 hover:bg-black text-white border border-white/20 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl backdrop-blur-md"
            >
              <svg className="w-7 h-7 fill-current text-emerald-400" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.184-.31-.443-.31-.715V2.53c0-.273.112-.532.31-.716zM15.207 13.414l2.482 2.483-12.87 7.424 10.388-9.907zm0-2.828L4.819.679l12.87 7.424-2.482 2.483zM16.621 12l2.969-1.688c.616-.35.616-1.274 0-1.624L16.621 7.05 14.138 9.533 16.621 12z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-gray-300 tracking-wider leading-none">GET IT ON</p>
                <p className="text-base font-extrabold leading-tight tracking-tight">Google Play</p>
              </div>
            </a>

            {/* App Store Button */}
            <a 
              href="#get-app-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("get-app-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-56 sm:w-auto bg-black/80 hover:bg-black text-white border border-white/20 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl backdrop-blur-md"
            >
              <svg className="w-7 h-7 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.85.96-2.93-.93.04-2.06.62-2.73 1.4-.6.69-1.12 1.79-.98 2.86 1.04.08 2.11-.55 2.75-1.33z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-gray-300 tracking-wider leading-none">Download on the</p>
                <p className="text-base font-extrabold leading-tight tracking-tight">App Store</p>
              </div>
            </a>
          </motion.div>

        </div>

        {/* Scroll Down Indicator */}
        <div className="relative z-20 pb-6 w-full flex justify-center">
          <button 
            onClick={() => {
              window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm cursor-pointer"
          >
            <span>Scroll down</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 2: BETTER FOOD FOR MORE PEOPLE      */}
      {/* ========================================== */}
      <section className="relative w-full min-h-screen py-16 bg-white overflow-hidden flex flex-col justify-center items-center selection:bg-rose-500 selection:text-white">
        
        {/* Subtle Decorative Curved Pink Swirl Lines (Zomato Background Art) */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40" 
          viewBox="0 0 1440 600" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M-100 100 C 200 400, 300 0, 100 600 S 500 500, 720 300 S 1000 100, 1500 400" 
            stroke="#f472b6" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
          />
          <path 
            d="M 1200 -50 C 1000 200, 1400 400, 1100 600" 
            stroke="#fb7185" 
            strokeWidth="1.5" 
          />
        </svg>

        {/* Floating Food Illustration 1: Burger (Left) */}
        <motion.div 
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-6 sm:left-16 lg:left-28 top-20 sm:top-24 w-32 sm:w-44 lg:w-56 pointer-events-none z-10"
        >
          <img 
            src="/images/burger_floating.png" 
            alt="Burger" 
            className="w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] rounded-full transform -rotate-12"
          />
        </motion.div>

        {/* Floating Accent 1: Tomato Slice (Bottom Left) */}
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute left-12 sm:left-24 bottom-16 w-8 sm:w-12 pointer-events-none z-10 opacity-80"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-500/80 border-2 border-rose-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md">
            🍅
          </div>
        </motion.div>

        {/* Floating Food Illustration 2: Momos in Steamer (Top Right) */}
        <motion.div 
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-6 sm:right-16 lg:right-28 top-12 sm:top-16 w-32 sm:w-44 lg:w-52 pointer-events-none z-10"
        >
          <img 
            src="/images/momos_floating.png" 
            alt="Momos Steamer" 
            className="w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] rounded-full transform rotate-6"
          />
        </motion.div>

        {/* Floating Accent 2: Tomato Slice (Middle Right) */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-12 sm:right-32 top-1/2 w-8 sm:w-10 pointer-events-none z-10"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-red-500 border-2 border-red-600 flex items-center justify-center text-white text-xs shadow-md">
            🍅
          </div>
        </motion.div>

        {/* Floating Food Illustration 3: Pizza Slice (Bottom Right) */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-8 sm:right-20 lg:right-36 bottom-16 sm:bottom-20 w-32 sm:w-44 lg:w-56 pointer-events-none z-10"
        >
          <img 
            src="/images/pizza_floating.png" 
            alt="Pizza Slice" 
            className="w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] rounded-full transform rotate-12"
          />
        </motion.div>

        {/* Main Center Content */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#ef4f5f] tracking-tight leading-tight mb-4"
          >
            Better food for <br className="hidden sm:inline" />more people
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-500 font-normal text-base sm:text-xl lg:text-2xl max-w-xl mx-auto leading-relaxed mb-16 sm:mb-20"
          >
            For over a decade, we’ve enabled our customers to discover new tastes, delivered right to their doorstep
          </motion.p>

          {/* Bottom Floating Impact Stats Bar (Exact Zomato layout) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-3xl bg-white rounded-3xl border border-gray-100/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] px-6 sm:px-10 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative z-20"
          >
            {/* Stat 1: Restaurants */}
            <div className="flex items-center gap-4 text-left w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  3,00,000+
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-400">
                  restaurants
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl shadow-inner">
                🏪
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden sm:block w-px h-10 bg-gray-200" />

            {/* Stat 2: Cities */}
            <div className="flex items-center gap-4 text-left w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  800+
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-400">
                  cities
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl shadow-inner">
                📍
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden sm:block w-px h-10 bg-gray-200" />

            {/* Stat 3: Orders Delivered */}
            <div className="flex items-center gap-4 text-left w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  3 billion+
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-400">
                  orders delivered
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shadow-inner">
                🛍️
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 3: WHAT'S WAITING FOR YOU ON THE APP */}
      {/* ========================================== */}
      <section className="relative w-full min-h-screen py-16 bg-gradient-to-b from-[#fff5f5] via-[#fff0f0] to-white flex flex-col justify-center items-center overflow-hidden selection:bg-rose-500 selection:text-white">
        
        {/* Header Content */}
        <div className="relative z-20 max-w-3xl mx-auto px-4 text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#ef4f5f] tracking-tight leading-tight mb-4"
          >
            What’s waiting for you <br />on the app?
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-500 font-normal text-base sm:text-lg max-w-md mx-auto leading-relaxed"
          >
            Our app is packed with features that enable you to experience food delivery like never before
          </motion.p>
        </div>

        {/* Feature Cards Showcase with Smartphone Center */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          
          {/* Left Cards Grid (2x2) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 z-20">
            
            {/* Card 1: Healthy */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                🥗
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Healthy</span>
            </motion.div>

            {/* Card 2: Veg Mode */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                <div className="w-8 h-4 rounded-full bg-emerald-500 p-0.5 flex items-center justify-end">
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Veg Mode</span>
            </motion.div>

            {/* Card 3: Plan a Party */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                🥳
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Plan a Party</span>
            </motion.div>

            {/* Card 4: Gift Cards */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                💌
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Gift Cards</span>
            </motion.div>

          </div>

          {/* Center Smartphone Screen */}
          <div className="relative mx-auto my-4 lg:my-0 z-30">
            {/* Phone Frame */}
            <div className="relative w-64 sm:w-72 h-[420px] sm:h-[460px] rounded-[48px] border-[10px] border-gray-900 bg-slate-900 shadow-[0_25px_60px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center overflow-hidden">
              
              {/* Top Notch */}
              <div className="absolute top-0 w-32 h-5 bg-gray-900 rounded-b-2xl z-40 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-950 mr-2" />
                <div className="w-10 h-1.5 rounded-full bg-gray-800" />
              </div>

              {/* Phone Content Screen */}
              <div className="w-full h-full bg-gradient-to-b from-rose-50/30 to-white flex flex-col items-center justify-center p-6 text-center">
                
                {/* Active Card inside Phone (Schedule Your Order) */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-3xl p-6 shadow-xl border border-rose-100 flex flex-col items-center justify-center w-48 sm:w-52 h-48 sm:h-52"
                >
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl mb-3 relative">
                    📅
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-md">
                      ⏰
                    </div>
                  </div>
                  <p className="text-base font-extrabold text-gray-900 leading-snug">
                    Schedule <br />your order
                  </p>
                </motion.div>

              </div>
            </div>
          </div>

          {/* Right Cards Grid (2x2) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 z-20">
            
            {/* Card 5: Gourmet */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                🍛
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Gourmet</span>
            </motion.div>

            {/* Card 6: Offers */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                🏷️
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Offers</span>
            </motion.div>

            {/* Card 7: Food on Train */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                🚆
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Food on Train</span>
            </motion.div>

            {/* Card 8: Collections */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col items-center justify-center text-center w-32 h-32 sm:w-36 sm:h-36 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                🍔
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Collections</span>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 4: ETERNAL / ECOSYSTEM MODULE CARDS */}
      {/* ========================================== */}
      <section className="relative w-full min-h-screen py-16 bg-white flex flex-col justify-center items-center overflow-hidden selection:bg-rose-500 selection:text-white">
        
        {/* Header Logo & Subtitle */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 text-center mb-12">
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight font-sans mb-4"
          >
            minutekart
          </motion.h2>

          {/* Subheading flanked by horizontal lines */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center gap-4 max-w-xl mx-auto"
          >
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-gray-400 whitespace-nowrap">
              EVERYTHING YOU NEED, DELIVERED IN MINUTES
            </span>
            <div className="h-px bg-gray-300 flex-1" />
          </motion.div>
        </div>

        {/* 4 Ecosystem Cards Grid (Exact Zomato layout) */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: minutekart user */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-b from-[#fff1f2] via-[#fff6f6] to-[#fff0f1] rounded-[32px] p-7 border border-rose-200/60 shadow-[0_10px_30px_rgba(225,29,72,0.04)] hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group h-full"
            >
              {/* App Icon */}
              <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-rose-500/10 mb-6 group-hover:scale-105 transition-transform overflow-hidden p-2 border border-rose-100">
                <img src="/images/minutekart_user.png" alt="minutekart user" className="w-full h-full object-contain" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-black text-gray-900 mb-2">minutekart user</h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                Get the app now to start ordering your favorite food & groceries!
              </p>

              {/* Link */}
              <div className="mt-auto flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-[#e23744] transition-colors">
                <span>Check it out</span>
                <span className="text-[10px]">▶</span>
              </div>
            </motion.div>

            {/* Card 2: minutekart restaurant */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-b from-[#f0fdf4] via-[#f7fee7] to-[#ecfdf5] rounded-[32px] p-7 border border-emerald-200/60 shadow-[0_10px_30px_rgba(16,185,129,0.04)] hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group h-full"
            >
              {/* App Icon */}
              <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-6 group-hover:scale-105 transition-transform overflow-hidden p-2 border border-emerald-100">
                <img src="/images/minutekart_partner.png" alt="minutekart restaurant" className="w-full h-full object-contain" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-black text-gray-900 mb-2">minutekart restaurant</h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                Partner with us to grow your restaurant business & manage orders!
              </p>

              {/* Link */}
              <div className="mt-auto flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">
                <span>Check it out</span>
                <span className="text-[10px]">▶</span>
              </div>
            </motion.div>

            {/* Card 3: minutekart seller */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-b from-[#fefce8] via-[#fffbeb] to-[#fef3c7]/30 rounded-[32px] p-7 border border-amber-200/60 shadow-[0_10px_30px_rgba(245,158,11,0.04)] hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group h-full"
            >
              {/* App Icon */}
              <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-amber-500/10 mb-6 group-hover:scale-105 transition-transform overflow-hidden p-2 border border-amber-100">
                <img src="/images/minutekart_partner.png" alt="minutekart seller" className="w-full h-full object-contain" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-black text-gray-900 mb-2">minutekart seller</h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                Join as a local shop & instant grocery seller partner!
              </p>

              {/* Link */}
              <div className="mt-auto flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-amber-600 transition-colors">
                <span>Check it out</span>
                <span className="text-[10px]">▶</span>
              </div>
            </motion.div>

            {/* Card 4: minutekart delivery */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-b from-[#f0fdf4] via-[#f7fee7] to-[#ecfdf5] rounded-[32px] p-7 border border-emerald-200/60 shadow-[0_10px_30px_rgba(16,185,129,0.04)] hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group h-full"
            >
              {/* App Icon */}
              <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-6 group-hover:scale-105 transition-transform overflow-hidden p-2 border border-emerald-100">
                <img src="/images/minutekart_delivery.png" alt="minutekart delivery" className="w-full h-full object-contain" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-black text-gray-900 mb-2">minutekart delivery</h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                Deliver with Minutekart & earn flexible daily income!
              </p>

              {/* Link */}
              <div className="mt-auto flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">
                <span>Check it out</span>
                <span className="text-[10px]">▶</span>
              </div>
            </motion.div>

          </div>
        </div>

      </section>

      {/* ========================================== */}
      {/* SECTION 5: DOWNLOAD THE APP NOW (QR CODE)  */}
      {/* ========================================== */}
      <section className="relative w-full min-h-screen py-16 bg-white flex flex-col justify-center items-center overflow-hidden selection:bg-rose-500 selection:text-white px-4 sm:px-6">
        
        {/* Main Card Container */}
        <div className="relative max-w-6xl w-full bg-gradient-to-r from-[#fff0f2] via-[#fff5f6] to-[#fff0f2] border border-rose-200/60 rounded-[44px] shadow-[0_20px_50px_rgba(225,29,72,0.06)] p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden">
          
          {/* Subtle Decorative Background Rings */}
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 top-0 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Content */}
          <div className="relative z-10 text-center lg:text-left flex flex-col items-center lg:items-start max-w-xl">
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4 leading-tight"
            >
              Download the app now!
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-500 font-medium text-base sm:text-xl leading-relaxed mb-10"
            >
              Experience seamless online ordering only on the Minutekart app
            </motion.p>

            {/* App Download Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              {/* Google Play Button */}
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                className="w-52 sm:w-auto bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6 fill-current text-emerald-400" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.184-.31-.443-.31-.715V2.53c0-.273.112-.532.31-.716zM15.207 13.414l2.482 2.483-12.87 7.424 10.388-9.907zm0-2.828L4.819.679l12.87 7.424-2.482 2.483zM16.621 12l2.969-1.688c.616-.35.616-1.274 0-1.624L16.621 7.05 14.138 9.533 16.621 12z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-gray-300 tracking-wider leading-none">GET IT ON</p>
                  <p className="text-sm font-extrabold leading-tight">Google Play</p>
                </div>
              </a>

              {/* App Store Button */}
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                className="w-52 sm:w-auto bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.85.96-2.93-.93.04-2.06.62-2.73 1.4-.6.69-1.12 1.79-.98 2.86 1.04.08 2.11-.55 2.75-1.33z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-gray-300 tracking-wider leading-none">Download on the</p>
                  <p className="text-sm font-extrabold leading-tight">App Store</p>
                </div>
              </a>
            </motion.div>

          </div>

          {/* Right Smartphone Frame with QR Code */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 flex-shrink-0"
          >
            <div className="relative w-64 sm:w-72 h-[380px] sm:h-[420px] border-[10px] border-gray-900 rounded-[44px] bg-white shadow-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              
              {/* Phone Notch */}
              <div className="absolute top-0 w-32 h-4.5 bg-gray-900 rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-950 mr-2" />
                <div className="w-8 h-1 rounded-full bg-gray-800" />
              </div>

              {/* Screen Text */}
              <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-5 max-w-[170px] leading-snug">
                Scan the QR code to download the app
              </p>

              {/* QR Code Container */}
              <div className="p-3.5 bg-white rounded-3xl border border-rose-200/90 shadow-md flex items-center justify-center relative group">
                
                {/* Custom SVG QR Code with Zomato Red Corner Accents */}
                <svg className="w-36 h-36 sm:w-40 sm:h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top-Left Corner Box (Red) */}
                  <rect x="5" y="5" width="26" height="26" rx="6" fill="#e23744" />
                  <rect x="9" y="9" width="18" height="18" rx="4" fill="white" />
                  <rect x="13" y="13" width="10" height="10" rx="2" fill="#e23744" />

                  {/* Top-Right Corner Box (Red) */}
                  <rect x="69" y="5" width="26" height="26" rx="6" fill="#e23744" />
                  <rect x="73" y="9" width="18" height="18" rx="4" fill="white" />
                  <rect x="77" y="13" width="10" height="10" rx="2" fill="#e23744" />

                  {/* Bottom-Left Corner Box (Red) */}
                  <rect x="5" y="69" width="26" height="26" rx="6" fill="#e23744" />
                  <rect x="9" y="73" width="18" height="18" rx="4" fill="white" />
                  <rect x="13" y="77" width="10" height="10" rx="2" fill="#e23744" />

                  {/* QR Matrix Dots Grid */}
                  <rect x="36" y="5" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="44" y="5" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="52" y="5" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="58" y="5" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="36" y="13" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="48" y="13" width="5" height="5" rx="1" fill="#e23744" />
                  <rect x="58" y="13" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="36" y="21" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="44" y="21" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="52" y="21" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="5" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="13" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="21" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="36" y="36" width="5" height="5" rx="1" fill="#e23744" />
                  <rect x="44" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="52" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="69" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="77" y="36" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="85" y="36" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="5" y="44" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="21" y="44" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="29" y="44" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="44" y="44" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="58" y="44" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="69" y="44" width="5" height="5" rx="1" fill="#e23744" />
                  <rect x="85" y="44" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="13" y="52" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="29" y="52" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="36" y="52" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="52" y="52" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="61" y="52" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="77" y="52" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="36" y="61" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="44" y="61" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="58" y="61" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="69" y="61" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="85" y="61" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="36" y="69" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="52" y="69" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="61" y="69" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="77" y="69" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="36" y="77" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="44" y="77" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="58" y="77" width="5" height="5" rx="1" fill="#e23744" />
                  <rect x="69" y="77" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="85" y="77" width="5" height="5" rx="1" fill="#1e293b" />

                  <rect x="36" y="85" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="48" y="85" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="58" y="85" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="77" y="85" width="5" height="5" rx="1" fill="#1e293b" />
                  <rect x="85" y="85" width="5" height="5" rx="1" fill="#1e293b" />
                </svg>

              </div>

            </div>
          </motion.div>

        </div>

      </section>





      {/* ========================================== */}
      {/* ZOMATO-EXACT BLACK FOOTER                  */}
      {/* ========================================== */}
      <footer className="bg-black text-gray-300 pt-16 pb-12 border-t border-gray-900 selection:bg-rose-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Logo Header Row */}
          <div className="mb-12 cursor-pointer inline-block" onClick={() => navigate("/")}>
            <h2 className="text-5xl font-black italic tracking-tighter text-white font-serif">
              minutekart
            </h2>
          </div>

          {/* Links 5-Column Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 text-sm font-normal mb-12">
            
            {/* Col 1: Eternal */}
            <div>
              <h4 className="font-bold text-white tracking-wide text-base mb-4">
                Eternal
              </h4>
              <ul className="space-y-2.5 text-gray-400 font-normal">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/food/user")}>Minutekart</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/quick")}>Quick Commerce</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/dudhwala")}>Dudhwala</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/seller")}>Hyperpure</li>
                <li className="hover:text-white cursor-pointer transition-colors">Feeding India</li>
                <li className="hover:text-white cursor-pointer transition-colors">Investor Relations</li>
              </ul>
            </div>

            {/* Col 2: For Restaurants */}
            <div>
              <h4 className="font-bold text-white tracking-wide text-base mb-4">
                For Restaurants
              </h4>
              <ul className="space-y-2.5 text-gray-400 font-normal">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/seller")}>Partner With Us</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/seller/auth")}>Apps For You</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/seller")}>Restaurant Consulting</li>
              </ul>
            </div>

            {/* Col 3: For Delivery Partners */}
            <div>
              <h4 className="font-bold text-white tracking-wide text-base mb-4">
                For Delivery Partners
              </h4>
              <ul className="space-y-2.5 text-gray-400 font-normal">
                <li className="hover:text-white cursor-pointer transition-colors">Partner With Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Apps For You</li>
              </ul>
            </div>

            {/* Col 4: Learn More */}
            <div>
              <h4 className="font-bold text-white tracking-wide text-base mb-4">
                Learn More
              </h4>
              <ul className="space-y-2.5 text-gray-400 font-normal">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/profile/privacy")}>Privacy</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/profile/terms")}>Security</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/profile/terms")}>Terms of Service</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/profile/support")}>Help & Support</li>
                <li className="hover:text-white cursor-pointer transition-colors">Report a Fraud</li>
                <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
              </ul>
            </div>

            {/* Col 5: Social Links & App Downloads */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold text-white tracking-wide text-base mb-4">
                Social Links
              </h4>
              
              {/* Circular Social Icons */}
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition-colors">in</span>
                <span className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition-colors">📷</span>
                <span className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition-colors">▶</span>
                <span className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition-colors">f</span>
                <span className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition-colors">X</span>
              </div>

              {/* App Store Buttons Stack */}
              <div className="space-y-3">
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="w-full bg-black border border-gray-700 hover:border-gray-500 text-white px-4 py-2 rounded-xl flex items-center gap-3 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.85.96-2.93-.93.04-2.06.62-2.73 1.4-.6.69-1.12 1.79-.98 2.86 1.04.08 2.11-.55 2.75-1.33z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[8px] uppercase text-gray-400 leading-none">Download on the</p>
                    <p className="text-xs font-bold leading-tight">App Store</p>
                  </div>
                </a>

                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="w-full bg-black border border-gray-700 hover:border-gray-500 text-white px-4 py-2 rounded-xl flex items-center gap-3 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current text-emerald-400" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.184-.31-.443-.31-.715V2.53c0-.273.112-.532.31-.716zM15.207 13.414l2.482 2.483-12.87 7.424 10.388-9.907zm0-2.828L4.819.679l12.87 7.424-2.482 2.483zM16.621 12l2.969-1.688c.616-.35.616-1.274 0-1.624L16.621 7.05 14.138 9.533 16.621 12z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[8px] uppercase text-gray-400 leading-none">GET IT ON</p>
                    <p className="text-xs font-bold leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Separator Line & Legal Copyright Notice */}
          <div className="pt-8 border-t border-gray-800 text-left text-[11px] sm:text-xs text-gray-400 font-normal leading-relaxed">
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners.
            <br />
            2008-2026 © Minutekart™ Ltd. All rights reserved.
          </div>

        </div>
      </footer>

    </div>
  )
}
