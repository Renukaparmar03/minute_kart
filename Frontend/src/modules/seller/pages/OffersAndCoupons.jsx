import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  MoreVertical, 
  Tag, 
  Percent, 
  Gift, 
  Calendar, 
  Loader2, 
  Trash2, 
  Check, 
  X,
  Sparkles,
  Ticket
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@food/components/ui/button";
import sellerApi from "../services/sellerApi";

export default function OffersAndCoupons() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'scheduled' | 'ended'
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    discountType: "flat", // 'flat' | 'percentage'
    discountValue: "",
    minOrderValue: "199",
    maxDiscount: "",
    validTill: "",
    description: "",
  });

  const loadCoupons = async (tab = activeTab) => {
    try {
      setIsLoading(true);
      const res = await sellerApi.getCoupons(tab);
      const data = res?.data?.result || res?.data?.data || res?.data || [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons(activeTab);
  }, [activeTab]);

  const handleToggleStatus = async (couponId) => {
    try {
      const res = await sellerApi.toggleCoupon(couponId);
      toast.success(res?.data?.message || "Status updated");
      loadCoupons(activeTab);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await sellerApi.deleteCoupon(couponId);
      toast.success(res?.data?.message || "Coupon deleted");
      loadCoupons(activeTab);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete coupon");
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Enter coupon code");
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error("Enter valid discount value");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim() || (formData.discountType === "flat" ? `Flat ₹${formData.discountValue} Off` : `${formData.discountValue}% Off`),
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue || 0),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        validTill: formData.validTill ? new Date(formData.validTill) : undefined,
        description: formData.description.trim() || `Min. Order ₹${formData.minOrderValue || 0}`,
      };

      const res = await sellerApi.createCoupon(payload);
      toast.success(res?.data?.message || "Offer created successfully!");
      setShowCreateModal(false);
      setFormData({
        title: "",
        code: "",
        discountType: "flat",
        discountValue: "",
        minOrderValue: "199",
        maxDiscount: "",
        validTill: "",
        description: "",
      });
      loadCoupons(activeTab);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "30 Sep 2026";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "30 Sep 2026";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-36 relative font-sans">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#0d6832] via-[#11843b] to-[#16a34a] text-white pt-4 pb-4 px-4 shadow-md relative">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={() => navigate("/seller")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold tracking-wide">Offers & Coupons</h1>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto w-full px-4 pt-4 flex-1 flex flex-col">
        {/* Tabs */}
        <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 flex items-center mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 rounded-full text-sm font-bold text-center transition-all ${
              activeTab === "active"
                ? "bg-[#11843b] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex-1 py-2 rounded-full text-sm font-bold text-center transition-all ${
              activeTab === "scheduled"
                ? "bg-[#11843b] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setActiveTab("ended")}
            className={`flex-1 py-2 rounded-full text-sm font-bold text-center transition-all ${
              activeTab === "ended"
                ? "bg-[#11843b] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Ended
          </button>
        </div>

        {/* Coupons List */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#16a34a] mb-2" />
            <p className="text-sm font-semibold text-slate-500">Loading offers...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm my-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Ticket className="w-7 h-7 text-[#16a34a]" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No {activeTab} offers</h3>
            <p className="text-xs text-slate-500 max-w-[240px]">
              Create new discounts & promo codes to boost your store sales.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon, idx) => {
              const isFlat = coupon.discountType === "flat" || !coupon.discountType;
              const bgColors = [
                { bg: "bg-amber-50 border-amber-200 text-amber-600", badge: "bg-[#11843b]" },
                { bg: "bg-emerald-50 border-emerald-200 text-emerald-600", badge: "bg-[#11843b]" },
                { bg: "bg-orange-50 border-orange-200 text-orange-600", badge: "bg-[#11843b]" },
              ];
              const theme = bgColors[idx % bgColors.length];

              return (
                <div
                  key={coupon._id || idx}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative flex items-center justify-between gap-3"
                >
                  {/* Left Icon Badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${theme.bg}`}>
                    {isFlat ? (
                      <Ticket className="w-6 h-6" />
                    ) : (
                      <Percent className="w-6 h-6" />
                    )}
                  </div>

                  {/* Middle Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                      {coupon.title || (isFlat ? `Flat ₹${coupon.discountValue} Off` : `${coupon.discountValue}% Off`)}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                      {coupon.description || `Min. Order ₹${coupon.minOrderValue || 0}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {activeTab === "scheduled" ? "Starts" : "Valid till"} {formatDate(coupon.validTill)}
                      </span>
                      {coupon.code && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                          {coupon.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(coupon._id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all shadow-sm active:scale-95 ${
                        coupon.isActive !== false
                          ? "bg-[#11843b] hover:bg-[#0e692f]"
                          : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {coupon.isActive !== false ? "Apply" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Sticky Action Button */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 z-30 max-w-md mx-auto">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-[#11843b] hover:bg-[#0e692f] text-white py-3.5 px-6 rounded-full font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Create New Offer
        </button>
      </div>

      {/* Create New Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#16a34a]" />
                <h2 className="text-lg font-bold text-slate-900">Create New Offer</h2>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Coupon Title</label>
                <input
                  type="text"
                  placeholder="e.g. Flat ₹20 Off"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16a34a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLAT20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold uppercase outline-none focus:border-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#16a34a] bg-white"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 20"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Min. Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 199"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valid Till Date</label>
                <input
                  type="date"
                  value={formData.validTill}
                  onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16a34a]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#11843b] hover:bg-[#0e692f] text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Publish Offer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
