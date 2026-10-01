import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Landmark,
  CreditCard,
  FileText,
  Bike,
  Globe,
  Bell,
  ShieldCheck,
  CircleHelp,
  LogOut,
  CheckCircle2,
  Loader2,
  User
} from "lucide-react";
import { deliveryAPI } from "@food/api";
import { toast } from "sonner";
import { clearModuleAuth } from "@food/utils/auth";
import useDeliveryBackNavigation from "../hooks/useDeliveryBackNavigation";

export const ProfileV2 = () => {
  const navigate = useNavigate();
  const goBack = useDeliveryBackNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await deliveryAPI.getProfile();
        if (response?.data?.success && response?.data?.data?.profile) {
          setProfile(response.data.data.profile);
        }
      } catch (error) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    if (logoutSubmitting) return;
    setShowLogoutConfirm(false);
    try {
      setLogoutSubmitting(true);
      await deliveryAPI.logout();
    } catch (error) {}
    clearModuleAuth("delivery");
    localStorage.removeItem("app:isOnline");
    toast.success("Logged out successfully");
    navigate("/food/delivery/login", { replace: true });
    setLogoutSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center font-poppins">
        <div className="flex items-center gap-2 text-[#087A45]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: "bank",
      label: "Bank Details",
      icon: Landmark,
      action: () => navigate("/food/delivery/profile/bank")
    },
    {
      id: "upi",
      label: "UPI Details",
      icon: CreditCard,
      action: () => navigate("/food/delivery/profile/bank")
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      action: () => navigate("/food/delivery/profile/documents")
    },
    {
      id: "vehicle",
      label: "Vehicle Details",
      icon: Bike,
      action: () => navigate("/food/delivery/profile/details")
    },
    {
      id: "languages",
      label: "Languages",
      icon: Globe,
      rightText: "English",
      action: () => {}
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      action: () => navigate("/food/delivery/notifications")
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: ShieldCheck,
      action: () => navigate("/food/delivery/privacy")
    },
    {
      id: "support",
      label: "Support",
      icon: CircleHelp,
      action: () => navigate("/food/delivery/help/tickets")
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      isDanger: true,
      action: () => setShowLogoutConfirm(true)
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#18332A] font-poppins pb-24 max-w-md mx-auto relative">
      {/* 1. Header Bar */}
      <div className="bg-[#087A45] text-white pt-8 pb-10 px-4 flex items-center gap-4">
        <button
          onClick={goBack}
          className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 text-white stroke-[2.2]" />
        </button>
        <h1 className="text-[19px] font-bold text-white tracking-tight">
          Profile
        </h1>
      </div>

      <div className="px-4 space-y-4 -mt-6 relative z-10">
        {/* 2. Profile Info Card */}
        <div className="bg-white rounded-[20px] border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* Profile Avatar */}
              <div className="relative">
                {profile?.profileImage?.url ? (
                  <img
                    src={profile.profileImage.url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#087A45]/30 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#EAF8F1] border-2 border-[#087A45]/30 flex items-center justify-center text-[#087A45]">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Rider Info */}
              <div className="flex flex-col">
                <h2 className="text-[#18332A] font-bold text-[17px] leading-snug">
                  {profile?.name || "Rohit Kumar"}
                </h2>
                <span className="text-[#66736E] text-xs font-medium mt-0.5">
                  Delivery Partner
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087A45] fill-[#087A45]" />
                  <span className="text-[#087A45] text-xs font-bold">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => navigate("/food/delivery/profile/details")}
              className="border border-[#087A45] text-[#087A45] hover:bg-[#EAF8F1] font-semibold text-xs py-1.5 px-4 rounded-full active:scale-95 transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* 3. Menu List Section */}
        <div className="bg-white rounded-[20px] border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] divide-y divide-[#E5ECE8] overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  item.isDanger ? "text-red-500 hover:bg-red-50/50" : "text-[#18332A]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      item.isDanger
                        ? "bg-red-50 text-red-500"
                        : "bg-[#F3FBF7] text-[#087A45]"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span
                    className={`text-sm ${
                      item.isDanger ? "font-bold text-red-500" : "font-semibold text-[#18332A]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#66736E]">
                  {item.rightText && (
                    <span className="text-xs font-medium text-[#66736E] mr-1">
                      {item.rightText}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 ${item.isDanger ? "text-red-400" : "text-gray-400"}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout Confirm Popup */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center px-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Do you want to log out?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              You will be signed out from your delivery account.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-bold"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                disabled={logoutSubmitting}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white font-bold disabled:opacity-60"
              >
                {logoutSubmitting ? "Logging out..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileV2;
