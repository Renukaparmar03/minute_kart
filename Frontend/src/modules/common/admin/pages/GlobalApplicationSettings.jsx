import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ChevronRight, 
  Save, 
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from "sonner";
import { adminAPI } from "@/services/api";
import { setCachedSettings } from "@/modules/common/utils/businessSettings";
import { cn } from "@/lib/utils";
import { compressImage } from "@/shared/utils/imageCompression";

const SectionCard = ({ title, children, id }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8" id={id}>
    {title && (
      <div className="px-8 py-4 border-b border-gray-100 bg-gray-50/30">
        <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-tight">{title}</h3>
      </div>
    )}
    <div className="p-8">
      {children}
    </div>
  </div>
);

const InputField = ({ label, name, value, onChange, placeholder, info }) => {
  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors shadow-sm";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5";
  
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, name === 'themeColor' && "pl-10")}
        />
        {name === 'themeColor' && (
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-200 shadow-sm"
            style={{ backgroundColor: value || '#0a0a0a' }}
          />
        )}
      </div>
      {info && (
        <div className="mt-2 bg-[#FFF8F0] border border-orange-100 rounded-lg px-4 py-2 flex items-center gap-2">
           <span className="text-[11px] text-gray-500 italic">Example: {info.prefix}</span>
           <span className="text-[11px] bg-[#00BFA5] text-white px-2 py-0.5 rounded font-bold">{value || info.default}</span>
        </div>
      )}
    </div>
  );
};

const ImageUploadBox = ({ title, size, preview, onUpload, onClear }) => {
  const fileInputRef = useRef(null);
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between px-0.5">
          <label className="text-xs font-bold text-gray-500">{title}({size})</label>
       </div>
       <div className="aspect-[2/1] w-full rounded-xl border border-dashed border-gray-300 bg-gray-50/50 relative overflow-hidden group hover:border-indigo-300 transition-colors cursor-pointer flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
          {preview ? (
            <img src={preview} alt={title} className="w-full h-full object-contain p-6" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                <p className="text-[11px] font-bold uppercase tracking-widest">Upload Image</p>
                <Upload size={24} strokeWidth={1.5} />
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
             <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-8 h-8 rounded-lg bg-[#E6F8F6] text-[#00BFA5] shadow-sm border border-[#C2EFE9] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={14} />
             </button>
             {preview && (
               <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="w-8 h-8 rounded-lg bg-[#FFF1F1] text-[#FF4D4D] shadow-sm border border-[#FEDADA] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
               </button>
             )}
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files[0]) onUpload(e.target.files[0]); }} />
       </div>
    </div>
  );
};

const GlobalApplicationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  // Landing Page State
  const [landingData, setLandingData] = useState({
    heroHeadline: "India’s #1 food delivery app",
    heroSubtitle: "Experience fast & easy online ordering on the Minutekart app",
    heroBgImage: "/images/hero_bg.png",
    heroBgVideo: "",
    playStoreUrl: "#get-app-section",
    appStoreUrl: "#get-app-section",
    qrCodeImage: "",
    qrCodeText: "Scan the QR code to download the app",
    restaurantsCount: "3,00,000+",
    citiesCount: "800+",
    ordersCount: "3 billion+",
    sec2Headline: "Better food for more people",
    sec2Subtitle: "For over a decade, we’ve enabled our customers to discover new tastes, delivered right to their doorstep",
    sec3Headline: "What’s waiting for you on the app?",
    sec3Subtitle: "Our app is packed with features that enable you to experience food delivery like never before",
    userAppTitle: "minutekart user",
    userAppDesc: "Get the app now to start ordering your favorite food & groceries!",
    userAppIcon: "/images/minutekart_user.png",
    userAppLink: "/food/user",
    restaurantAppTitle: "minutekart restaurant",
    restaurantAppDesc: "Partner with us to grow your restaurant business & manage orders!",
    restaurantAppIcon: "/images/minutekart_partner.png",
    restaurantAppLink: "/seller",
    sellerAppTitle: "minutekart seller",
    sellerAppDesc: "Join as a local shop & instant grocery seller partner!",
    sellerAppIcon: "/images/minutekart_partner.png",
    sellerAppLink: "/seller",
    deliveryAppTitle: "minutekart delivery",
    deliveryAppDesc: "Deliver with Minutekart & earn flexible daily income!",
    deliveryAppIcon: "/images/minutekart_delivery.png",
    deliveryAppLink: "#"
  });

  const [landingFiles, setLandingFiles] = useState({});
  const [landingPreviews, setLandingPreviews] = useState({});

  const [formData, setFormData] = useState({
    companyName: "",
    themeColor: "#0a0a0a",
    email: "",
    phoneNumber: "",
    address: "",
    bannedNumbers: [],
    showLocationPopup: true,
  });
  const [newBannedNumber, setNewBannedNumber] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBusinessSettings();
      const settings = response?.data?.data || response?.data;

      if (settings) {
        setFormData({
          companyName: settings.companyName || "",
          themeColor: settings.themeColor || "#0a0a0a",
          email: settings.email || "",
          phoneNumber: settings.phone?.number || "",
          address: settings.address || "",
          bannedNumbers: settings.bannedNumbers || [],
          showLocationPopup: settings.showLocationPopup ?? true,
        });

        if (settings.logo?.url) setLogoPreview(settings.logo.url);
        if (settings.favicon?.url) setFaviconPreview(settings.favicon.url);

        if (settings.landingPage) {
          setLandingData(prev => ({
            ...prev,
            ...settings.landingPage
          }));
          if (settings.landingPage.heroBgImage) setLandingPreviews(p => ({ ...p, heroBgImage: settings.landingPage.heroBgImage }));
          if (settings.landingPage.qrCodeImage) setLandingPreviews(p => ({ ...p, qrCodeImage: settings.landingPage.qrCodeImage }));
          if (settings.landingPage.userAppIcon) setLandingPreviews(p => ({ ...p, userAppIcon: settings.landingPage.userAppIcon }));
          if (settings.landingPage.restaurantAppIcon) setLandingPreviews(p => ({ ...p, restaurantAppIcon: settings.landingPage.restaurantAppIcon }));
          if (settings.landingPage.sellerAppIcon) setLandingPreviews(p => ({ ...p, sellerAppIcon: settings.landingPage.sellerAppIcon }));
          if (settings.landingPage.deliveryAppIcon) setLandingPreviews(p => ({ ...p, deliveryAppIcon: settings.landingPage.deliveryAppIcon }));
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLandingChange = (name, value) => {
    setLandingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLandingFileUpload = (fieldName, file) => {
    setLandingFiles(prev => ({ ...prev, [fieldName]: file }));
    const reader = new FileReader();
    reader.onload = () => {
      setLandingPreviews(prev => ({ ...prev, [fieldName]: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddBannedNumber = () => {
    const trimmed = newBannedNumber.trim();
    if (!trimmed) return;
    
    if (!/^\d{10}$/.test(trimmed)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    
    if (formData.bannedNumbers.includes(trimmed)) {
      toast.error("Number is already banned");
      return;
    }
    setFormData(prev => ({
      ...prev,
      bannedNumbers: [...prev.bannedNumbers, trimmed]
    }));
    setNewBannedNumber("");
  };

  const handleRemoveBannedNumber = (numberToRemove) => {
    setFormData(prev => ({
      ...prev,
      bannedNumbers: prev.bannedNumbers.filter(n => n !== numberToRemove)
    }));
  };

  const handleUpdate = async () => {
    try {
      if (!formData.companyName.trim()) {
        toast.error("Application name is required");
        return;
      }
      setSaving(true);
      const dataToSend = {
        companyName: formData.companyName.trim(),
        themeColor: formData.themeColor,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        bannedNumbers: formData.bannedNumbers,
        showLocationPopup: formData.showLocationPopup,
        landingPage: landingData,
      };

      const files = {
        ...landingFiles
      };
      if (logoFile) files.logo = logoFile;
      if (faviconFile) files.favicon = faviconFile;

      const response = await adminAPI.updateBusinessSettings(dataToSend, files);
      const updatedSettings = response?.data?.data || response?.data;

      if (updatedSettings) {
        setCachedSettings(updatedSettings);
      }
      toast.success('Landing Page & Global Configuration saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file) => {
    const compressed = await compressImage(file);
    setLogoFile(compressed);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result || ''));
    reader.readAsDataURL(compressed);
  };

  const handleFaviconUpload = (file) => {
    setFaviconFile(file);
    const reader = new FileReader();
    reader.onload = () => setFaviconPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/landing')) return 'landing';
    return 'landing';
  });

  useEffect(() => {
    if (location.pathname.includes('/landing')) {
      setActiveTab('landing');
    }
  }, [location.pathname]);


  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 uppercase tracking-wider">GLOBAL APPLICATION SETTINGS</h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">Manage core application details, branding assets & security settings</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
           <span>Common</span>
           <ChevronRight size={12} strokeWidth={3} />
           <span className="text-gray-600">Global Settings</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-10 pb-32">
        
        {/* Basic Identification */}
        <SectionCard title="Application Identification">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <InputField label="App Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="AppZeto" />
              <InputField label="Admin Theme Color" name="themeColor" value={formData.themeColor} onChange={handleChange} placeholder="#0a0a0a" />
              <InputField label="Support Email" name="email" value={formData.email} onChange={handleChange} placeholder="admin@appzeto.com" />
              <InputField label="Support Phone" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="0000000000" />
              <InputField label="Office Address" name="address" value={formData.address} onChange={handleChange} placeholder="Main Street, NY" />
           </div>
        </SectionCard>

        {/* Media Assets */}
        <SectionCard title="Image Section">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <ImageUploadBox title="Brand Logo" size="750px x 100px" preview={logoPreview} onUpload={handleLogoUpload} onClear={() => { setLogoPreview(null); setLogoFile(null); }} />
              <ImageUploadBox title="Favicon" size="80px x 80px" preview={faviconPreview} onUpload={handleFaviconUpload} onClear={() => { setFaviconPreview(null); setFaviconFile(null); }} />
           </div>
        </SectionCard>


        {/* Banned Numbers */}
        <SectionCard title="Banned Numbers">
          <div className="space-y-6">
            <div className="flex items-end gap-4 max-w-md">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number to Ban</label>
                <input
                  type="text"
                  value={newBannedNumber}
                  onChange={(e) => setNewBannedNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBannedNumber()}
                />
              </div>
              <button 
                onClick={handleAddBannedNumber}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors border border-red-200"
              >
                Ban
              </button>
            </div>
            
            {formData.bannedNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {formData.bannedNumbers.map(number => (
                  <div key={number} className="flex items-center gap-2 bg-red-50 border border-red-100 pl-3 pr-2 py-1.5 rounded-lg">
                    <span className="text-sm font-semibold text-red-700">{number}</span>
                    <button 
                      onClick={() => handleRemoveBannedNumber(number)}
                      className="p-1 hover:bg-red-200 rounded text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No numbers are currently banned.</p>
            )}
          </div>
        </SectionCard>


      </div>

      {/* Persistence Controls */}
      <div className="fixed bottom-10 right-10 z-50">
         <button onClick={handleUpdate} disabled={saving} className="bg-[#00BFA5] text-white px-6 h-16 rounded-full flex items-center justify-center gap-3 font-bold uppercase tracking-wider shadow-[0_15px_40px_rgba(0,191,165,0.4)] hover:bg-[#00AC95] active:scale-90 transition-all disabled:opacity-50">
            {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            <span>Save Settings</span>
         </button>
      </div>

    </div>
  );
};

export default GlobalApplicationSettings;
