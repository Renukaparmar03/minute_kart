import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Loader2, Save, Bike, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';

/**
 * ProfileVehicleV2 - Vehicle Details & Assets Management.
 */
export const ProfileVehicleV2 = () => {
  const goBack = useDeliveryBackNavigation();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [vehicle, setVehicle] = useState({
    type: "Scooter",
    brand: "",
    number: "",
    rcNumber: ""
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getProfile();
      if (response?.data?.success) {
        const profile = response.data.data.profile || response.data.data || {};
        const v = profile.vehicle || {};
        setVehicle({
          type: v.type || profile.vehicleType || "Scooter",
          brand: v.brand || profile.vehicleBrand || "",
          number: v.number || profile.vehicleNumber || "",
          rcNumber: v.rcNumber || profile.rcNumber || ""
        });
      }
    } catch (e) {
      toast.error("Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!vehicle.number) {
      return toast.error("Vehicle Registration Number is required");
    }

    setIsSaving(true);
    try {
      const payload = {
        vehicle: {
          type: vehicle.type,
          brand: vehicle.brand,
          number: vehicle.number.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          rcNumber: vehicle.rcNumber.toUpperCase()
        },
        vehicleNumber: vehicle.number.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        vehicleBrand: vehicle.brand,
        vehicleType: vehicle.type
      };

      const response = await deliveryAPI.updateProfileDetails(payload);
      if (response?.data?.success) {
        toast.success("Vehicle details updated successfully in database");
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(response?.data?.message || "Update failed");
      }
    } catch (e) {
      toast.error("Failed to update vehicle details");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center font-poppins">
        <div className="flex items-center gap-2 text-[#087A45]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Loading vehicle details...</span>
        </div>
      </div>
    );
  }

  const vehicleTypes = ["Scooter", "Motorcycle", "EV / Electric Scooter", "Bicycle"];

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-poppins text-[#18332A] pb-24 max-w-md mx-auto relative">
      {/* Top Dark Green Header */}
      <div className="bg-[#087A45] text-white pt-8 pb-5 px-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <ArrowLeft className="w-6 h-6 text-white stroke-[2.2]" />
          </button>
          <h1 className="text-[19px] font-bold text-white tracking-tight">Vehicle Details</h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/20 rounded-full text-white text-xs font-semibold active:scale-95 transition-all border border-white/20"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Section 1: Vehicle Assets Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bike className="w-5 h-5 text-[#087A45]" />
            <h2 className="text-base font-bold text-[#18332A]">Vehicle Assets & Specs</h2>
          </div>

          <div className="bg-white rounded-[20px] p-5 border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            {/* Vehicle Type Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#66736E] uppercase tracking-wider block">
                Vehicle Type
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {vehicleTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVehicle({ ...vehicle, type: t })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                        vehicle.type === t
                          ? "bg-[#087A45] text-white border-[#087A45]"
                          : "bg-[#F3FBF7] text-[#18332A] border-[#D6EFE2]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-[#18332A]">
                  {vehicle.type || "Scooter"}
                </p>
              )}
            </div>

            {/* Vehicle Brand / Model */}
            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-semibold text-[#66736E] uppercase tracking-wider block">
                Vehicle Brand / Model
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={vehicle.brand}
                  placeholder="e.g. Honda Activa, TVS Jupiter"
                  onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })}
                  className="w-full bg-[#F3FBF7] border border-[#D6EFE2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#18332A] focus:outline-none focus:border-[#087A45]"
                />
              ) : (
                <p className="text-sm font-semibold text-[#18332A]">
                  {vehicle.brand || <span className="text-gray-400 font-normal italic">Not provided</span>}
                </p>
              )}
            </div>

            {/* Registration Number */}
            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-semibold text-[#66736E] uppercase tracking-wider block">
                Registration Number (Vehicle No.)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={vehicle.number}
                  placeholder="e.g. DL 01 AB 1234"
                  onChange={(e) => setVehicle({ ...vehicle, number: e.target.value.toUpperCase() })}
                  className="w-full bg-[#F3FBF7] border border-[#D6EFE2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#18332A] uppercase focus:outline-none focus:border-[#087A45]"
                />
              ) : (
                <p className="text-sm font-bold text-[#087A45] tracking-wide">
                  {vehicle.number || <span className="text-gray-400 font-normal italic">Not provided</span>}
                </p>
              )}
            </div>


          </div>
        </div>

        {/* Section 2: Verification Badge */}
        <div className="bg-white rounded-[20px] p-4 border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EAF8F1] text-[#087A45] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#18332A]">Verified Vehicle Asset</h4>
            <p className="text-[11px] text-[#66736E]">This vehicle is registered for MinuteKart order deliveries.</p>
          </div>
        </div>

        {/* Save/Cancel Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                fetchProfile();
              }}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#18332A] rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-[#087A45] hover:bg-[#066839] text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Save Vehicle Details</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileVehicleV2;
