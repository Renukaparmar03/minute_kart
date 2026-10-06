import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Edit2, Loader2, Save, Landmark, CreditCard, 
  QrCode, Camera, Upload, Trash2, CheckCircle2, ShieldCheck, Image as ImageIcon
} from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import { openCamera } from '@food/utils/imageUploadUtils';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';

/**
 * ProfileBankV2 - Bank and UPI Details Management (with UPI QR Code Scan/Upload & DB Sync).
 */
export const ProfileBankV2 = () => {
  const goBack = useDeliveryBackNavigation();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    panNumber: "",
    upiId: "",
    upiQrCode: ""
  });

  const [upiQrFile, setUpiQrFile] = useState(null);
  const [upiQrPreview, setUpiQrPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const qrFileInputRef = useRef(null);

  // Fetch profile data from DB
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getProfile();
      if (response?.data?.success) {
         const profile = response.data.data.profile || response.data.data || {};
         const bankDetails = profile?.documents?.bankDetails || profile?.bankDetails || {};
         
         const loadedUpiQr = profile?.upiQrCode || bankDetails?.upiQrCode || "";
         const loadedUpiId = profile?.upiId || bankDetails?.upiId || "";
         const loadedPan = profile?.panNumber || profile?.documents?.pan?.number || "";
         const loadedHolder = bankDetails.accountHolderName || profile?.bankAccountHolderName || "";
         const loadedAccount = bankDetails.accountNumber || profile?.bankAccountNumber || "";
         const loadedIfsc = bankDetails.ifscCode || profile?.bankIfscCode || "";
         const loadedBank = bankDetails.bankName || profile?.bankName || "";

         setForm({
            accountHolderName: loadedHolder,
            accountNumber: loadedAccount,
            ifscCode: loadedIfsc,
            bankName: loadedBank,
            panNumber: loadedPan,
            upiId: loadedUpiId,
            upiQrCode: loadedUpiQr
         });
         setUpiQrPreview(loadedUpiQr);
      }
    } catch (e) {
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle QR image file selection
  const handleQrFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      setUpiQrFile(file);
      setUpiQrPreview(URL.createObjectURL(file));
      toast.success("UPI QR image selected");
    }
  };

  // Handle Camera Capture for QR Code
  const handleCameraCapture = () => {
    openCamera({
      onSuccess: (file) => {
        if (file) {
          setUpiQrFile(file);
          setUpiQrPreview(URL.createObjectURL(file));
          toast.success("UPI QR photo captured");
        }
      },
      onError: (err) => {
        toast.error("Failed to open camera");
      }
    });
  };

  // Remove QR Code
  const handleRemoveQrCode = () => {
    setUpiQrFile(null);
    setUpiQrPreview(null);
  };

  // Save to DB
  const handleSave = async () => {
     if (!form.accountNumber || !form.ifscCode) {
        return toast.error("Account Number and IFSC Code are required");
     }

     setIsSaving(true);
     try {
        // 1. Update JSON fields (Bank, Pan, UPI ID)
        const payload = {
           documents: {
              bankDetails: {
                 accountHolderName: form.accountHolderName,
                 accountNumber: form.accountNumber,
                 ifscCode: form.ifscCode,
                 bankName: form.bankName,
                 upiId: form.upiId
              },
              pan: { number: form.panNumber }
           },
           upiId: form.upiId
        };

        await deliveryAPI.updateProfile(payload);

        // 2. Upload UPI QR Code image if a new file was selected
        if (upiQrFile) {
          const formData = new FormData();
          formData.append('upiQrCode', upiQrFile);
          await deliveryAPI.updateBankDetailsMultipart(formData);
        } else if (!upiQrPreview && form.upiQrCode) {
          // If removed
          const formData = new FormData();
          formData.append('removeUpiQrCode', 'true');
          await deliveryAPI.updateBankDetailsMultipart(formData).catch(() => {});
        }

        toast.success("Bank and UPI details saved to database");
        setIsEditing(false);
        fetchProfile(); // Refresh latest state from DB
     } catch (e) {
        toast.error("Failed to save details. Please try again.");
     } finally {
        setIsSaving(false);
     }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center font-poppins">
         <div className="flex items-center gap-2 text-[#087A45]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Loading details...</span>
         </div>
      </div>
    );
  }

  const bankFields = [
    { label: "Account Holder Name", key: "accountHolderName", placeholder: "e.g. Rohit Kumar" },
    { label: "Account Number", key: "accountNumber", placeholder: "Enter account number" },
    { label: "IFSC Code", key: "ifscCode", placeholder: "e.g. SBIN0001234" },
    { label: "Bank Name", key: "bankName", placeholder: "e.g. State Bank of India" }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-poppins text-[#18332A] pb-24 max-w-md mx-auto relative">
       {/* Top Dark Green Header */}
       <div className="bg-[#087A45] text-white pt-8 pb-5 px-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <button onClick={goBack} className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                <ArrowLeft className="w-6 h-6 text-white stroke-[2.2]" />
             </button>
             <h1 className="text-[19px] font-bold text-white tracking-tight">Bank and UPI Details</h1>
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

       {/* Hidden File Input for QR Code Upload */}
       <input 
          type="file" 
          ref={qrFileInputRef} 
          accept="image/*" 
          onChange={handleQrFileSelect} 
          className="hidden" 
       />

       <div className="px-4 py-5 space-y-6">
          {/* Section 1: Bank Account Details */}
          <div>
             <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-5 h-5 text-[#087A45]" />
                <h2 className="text-base font-bold text-[#18332A]">Bank Account Details</h2>
             </div>

             <div className="bg-white rounded-[20px] p-4 border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                {bankFields.map(({ label, key, placeholder }) => (
                   <div key={key} className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#66736E] uppercase tracking-wider block">
                         {label}
                      </label>
                      {isEditing ? (
                         <input
                            type="text"
                            value={form[key]}
                            placeholder={placeholder}
                            onChange={(e) => {
                               let val = e.target.value;
                               if (key === 'accountNumber') val = val.replace(/\D/g, '').slice(0, 18);
                               if (key === 'ifscCode') val = val.toUpperCase().slice(0, 11);
                               setForm({ ...form, [key]: val });
                            }}
                            className="w-full bg-[#F3FBF7] border border-[#D6EFE2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#18332A] focus:outline-none focus:border-[#087A45]"
                         />
                      ) : (
                         <p className="text-sm font-semibold text-[#18332A]">
                            {form[key] || <span className="text-gray-400 font-normal italic">Not provided</span>}
                         </p>
                      )}
                   </div>
                ))}
             </div>
          </div>

          {/* Section 2: UPI Payment Details */}
          <div>
             <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-[#087A45]" />
                <h2 className="text-base font-bold text-[#18332A]">UPI Payment Details</h2>
             </div>

             <div className="bg-white rounded-[20px] p-4 border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <div className="space-y-1">
                   <label className="text-[11px] font-semibold text-[#66736E] uppercase tracking-wider block">
                      UPI ID (GPay / PhonePe / Paytm)
                   </label>
                   {isEditing ? (
                      <input
                         type="text"
                         value={form.upiId}
                         placeholder="e.g. 9876543210@paytm or username@upi"
                         onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                         className="w-full bg-[#F3FBF7] border border-[#D6EFE2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#18332A] focus:outline-none focus:border-[#087A45]"
                      />
                   ) : (
                      <p className="text-sm font-semibold text-[#18332A]">
                         {form.upiId || <span className="text-gray-400 font-normal italic">Not provided</span>}
                      </p>
                   )}
                </div>

                <div className="space-y-1 pt-2">
                   <label className="text-[11px] font-semibold text-[#66736E] uppercase tracking-wider block">
                      PAN Card Number
                   </label>
                   {isEditing ? (
                      <input
                         type="text"
                         value={form.panNumber}
                         placeholder="e.g. ABCDE1234F"
                         onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                         className="w-full bg-[#F3FBF7] border border-[#D6EFE2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#18332A] focus:outline-none focus:border-[#087A45]"
                      />
                   ) : (
                      <p className="text-sm font-semibold text-[#18332A]">
                         {form.panNumber || <span className="text-gray-400 font-normal italic">Not provided</span>}
                      </p>
                   )}
                </div>
             </div>
          </div>

          {/* Section 3: UPI QR Code Scan & Upload */}
          <div>
             <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-[#087A45]" />
                <h2 className="text-base font-bold text-[#18332A]">UPI QR Code Scan</h2>
             </div>

             <div className="bg-white rounded-[20px] p-5 border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
                {upiQrPreview ? (
                   <div className="relative group w-full flex flex-col items-center">
                      <div className="w-48 h-48 rounded-2xl p-2 bg-white border-2 border-[#087A45]/30 shadow-md flex items-center justify-center overflow-hidden mb-3">
                         <img 
                            src={upiQrPreview} 
                            alt="UPI QR Code" 
                            className="w-full h-full object-contain"
                         />
                      </div>
                      <span className="text-xs font-semibold text-[#087A45] flex items-center gap-1 mb-2">
                         <CheckCircle2 className="w-4 h-4" /> UPI QR Code Attached
                      </span>
                      {isEditing && (
                         <div className="flex items-center gap-2 mt-1">
                            <button
                               type="button"
                               onClick={() => qrFileInputRef.current?.click()}
                               className="px-3 py-1.5 bg-[#EAF8F1] text-[#087A45] rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                            >
                               <Upload className="w-3.5 h-3.5" /> Change
                            </button>
                            <button
                               type="button"
                               onClick={handleRemoveQrCode}
                               className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                            >
                               <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="w-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-[#D6EFE2] rounded-2xl bg-[#F3FBF7]">
                      <div className="w-12 h-12 rounded-full bg-[#EAF8F1] text-[#087A45] flex items-center justify-center mb-2">
                         <QrCode className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#18332A] mb-1">Upload Payment QR Code</p>
                      <p className="text-xs text-[#66736E] max-w-[240px] mb-4">
                         Scan or upload GPay, PhonePe, or Paytm QR code to receive direct payments
                      </p>

                      {isEditing ? (
                         <div className="flex items-center gap-3">
                            <button
                               type="button"
                               onClick={() => qrFileInputRef.current?.click()}
                               className="px-4 py-2 bg-[#087A45] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                            >
                               <Upload className="w-4 h-4" /> Choose Image
                            </button>
                            <button
                               type="button"
                               onClick={handleCameraCapture}
                               className="px-4 py-2 bg-white text-[#087A45] border border-[#087A45] rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                            >
                               <Camera className="w-4 h-4" /> Camera
                            </button>
                         </div>
                      ) : (
                         <span className="text-xs text-gray-400 italic font-normal">Click Edit above to upload QR code</span>
                      )}
                   </div>
                )}
             </div>
          </div>

          {/* Action Buttons when editing */}
          {isEditing && (
             <div className="flex items-center gap-3 pt-2">
                <button
                   type="button"
                   onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset
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
                   <span>Save to Database</span>
                </button>
             </div>
          )}
       </div>
    </div>
  );
};

export default ProfileBankV2;
