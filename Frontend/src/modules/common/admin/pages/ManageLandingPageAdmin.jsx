import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  Save, 
  Loader2,
  Upload,
  X,
  Layout,
  Smartphone,
  BarChart3,
  QrCode,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from "sonner";
import { adminAPI } from "@/services/api";
import { setCachedSettings } from "@/modules/common/utils/businessSettings";
import { cn } from "@/lib/utils";

const SectionCard = ({ title, icon: Icon, children, id }) => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md" id={id}>
    {title && (
      <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-rose-500" />}
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">{title}</h3>
      </div>
    )}
    <div className="p-8">
      {children}
    </div>
  </div>
);

const InputField = ({ label, name, value, onChange, placeholder, info }) => {
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all shadow-sm";
  const labelClass = "block text-xs font-extrabold text-gray-600 uppercase tracking-wider mb-2";
  
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {info && (
        <p className="mt-1.5 text-[11px] text-gray-400 font-medium">{info}</p>
      )}
    </div>
  );
};

const ImageUploadBox = ({ title, size, preview, onUpload, onClear }) => {
  const fileInputRef = useRef(null);
  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between px-0.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title} ({size})</label>
       </div>
       <div 
         className="aspect-[2.5/1] w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 relative overflow-hidden group hover:border-rose-300 hover:bg-rose-50/20 transition-all cursor-pointer flex items-center justify-center" 
         onClick={() => fileInputRef.current?.click()}
       >
          {preview ? (
            <img src={preview} alt={title} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                <Upload size={28} strokeWidth={1.5} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Click to Upload Image</p>
            </div>
          )}
          
          <div className="absolute top-3 right-3 flex items-center gap-2">
             <button 
               onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} 
               className="w-8 h-8 rounded-xl bg-white/90 text-gray-700 shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
             >
                <Upload size={14} />
             </button>
             {preview && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onClear(); }} 
                 className="w-8 h-8 rounded-xl bg-white/90 text-red-600 shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
               >
                  <X size={14} />
               </button>
             )}
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files[0]) onUpload(e.target.files[0]); }} />
       </div>
    </div>
  );
};

const ColumnEditor = ({ colKey, colTitleKey, titleLabel, landingData, onTitleChange, onItemChange, onAddItem, onRemoveItem }) => (
  <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-6">
    <div>
      <InputField 
        label={titleLabel} 
        name={colTitleKey} 
        value={landingData[colTitleKey]} 
        onChange={onTitleChange} 
        placeholder="Column Heading..." 
      />
    </div>

    <div className="space-y-3">
      <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-wider">
        Column Links (Add / Edit / Delete)
      </label>
      
      {(landingData[colKey] || []).map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-extrabold text-gray-400 w-5 text-center">{idx + 1}.</span>
          <input
            type="text"
            placeholder="Link Title (e.g. Food Delivery)"
            value={item.title || ''}
            onChange={(e) => onItemChange(colKey, idx, 'title', e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 bg-white focus:border-rose-500 outline-none"
          />
          <input
            type="text"
            placeholder="Target URL (e.g. /food/user)"
            value={item.url || ''}
            onChange={(e) => onItemChange(colKey, idx, 'url', e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-white focus:border-rose-500 outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => onRemoveItem(colKey, idx)}
            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100 shrink-0"
            title="Delete this link"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onAddItem(colKey)}
        className="w-full py-2.5 px-4 border border-dashed border-rose-300 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/30 hover:bg-rose-50 flex items-center justify-center gap-2 transition-all mt-2"
      >
        <Plus size={14} />
        <span>Add New Link to {landingData[colTitleKey] || 'Column'}</span>
      </button>
    </div>
  </div>
);

const SocialMediaEditor = ({ landingData, onItemChange, onAddItem, onRemoveItem }) => (
  <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-6">
    <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">🌐 Social Media Profile Links (Add / Edit / Delete)</h4>
    
    <div className="space-y-3">
      {(landingData.socialItems || []).map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-extrabold text-gray-400 w-5 text-center">{idx + 1}.</span>
          <input
            type="text"
            placeholder="Platform Name (e.g. LinkedIn, Instagram, WhatsApp)"
            value={item.platform || ''}
            onChange={(e) => onItemChange('socialItems', idx, 'platform', e.target.value)}
            className="w-1/3 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 bg-white focus:border-rose-500 outline-none"
          />
          <input
            type="text"
            placeholder="Profile URL (e.g. https://instagram.com/yourhandle)"
            value={item.url || ''}
            onChange={(e) => onItemChange('socialItems', idx, 'url', e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-white focus:border-rose-500 outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => onRemoveItem('socialItems', idx)}
            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100 shrink-0"
            title="Delete this social link"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onAddItem('socialItems')}
        className="w-full py-2.5 px-4 border border-dashed border-rose-300 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/30 hover:bg-rose-50 flex items-center justify-center gap-2 transition-all mt-2"
      >
        <Plus size={14} />
        <span>Add New Social Media Profile</span>
      </button>
    </div>
  </div>
);

export default function ManageLandingPageAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [landingData, setLandingData] = useState({
    heroHeadline: "India’s #1 food delivery app",
    heroSubtitle: "Experience fast & easy online ordering on the Minutekart app",
    heroBgImage: "/images/hero_bg.png",
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
    deliveryAppLink: "#",
    footerCopyright: "2008-2026 © Minutekart™ Ltd. All rights reserved.",
    footerDisclaimer: "By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners.",
    socialLinkedin: "#",
    socialInstagram: "#",
    socialYoutube: "#",
    socialFacebook: "#",
    socialTwitter: "#",
    socialItems: [
      { platform: "LinkedIn", url: "#" },
      { platform: "Instagram", url: "#" },
      { platform: "YouTube", url: "#" },
      { platform: "Facebook", url: "#" },
      { platform: "Twitter / X", url: "#" }
    ],
    linkMinutekart: "/food/user",
    linkQuickCommerce: "/quick",
    linkDudhwala: "/dudhwala",
    linkHyperpure: "/seller",
    linkFeedingIndia: "#",
    linkInvestorRelations: "#",
    linkPartnerRestaurant: "/seller",
    linkAppsRestaurant: "/seller/auth",
    linkConsultingRestaurant: "/seller",
    linkPartnerDelivery: "#",
    linkAppsDelivery: "#",
    linkPrivacy: "/profile/privacy",
    linkSecurity: "/profile/terms",
    linkTerms: "/profile/terms",
    linkHelp: "/profile/support",
    linkReportFraud: "#",
    linkBlog: "#",
    col1Title: "Eternal",
    col2Title: "For Restaurants",
    col3Title: "For Delivery Partners",
    col4Title: "Learn More",
    col5Title: "Social Links",
    col1Items: [
      { title: "Minutekart", url: "/food/user" },
      { title: "Quick Commerce", url: "/quick" },
      { title: "Dudhwala", url: "/dudhwala" },
      { title: "Hyperpure", url: "/seller" },
      { title: "Feeding India", url: "#" },
      { title: "Investor Relations", url: "#" }
    ],
    col2Items: [
      { title: "Partner With Us", url: "/seller" },
      { title: "Apps For You", url: "/seller/auth" },
      { title: "Restaurant Consulting", url: "/seller" }
    ],
    col3Items: [
      { title: "Partner With Us", url: "#" },
      { title: "Apps For You", url: "#" }
    ],
    col4Items: [
      { title: "Privacy", url: "/profile/privacy" },
      { title: "Security", url: "/profile/terms" },
      { title: "Terms of Service", url: "/profile/terms" },
      { title: "Help & Support", url: "/profile/support" },
      { title: "Report a Fraud", url: "#" },
      { title: "Blog", url: "#" }
    ]
  });

  const [fullSettings, setFullSettings] = useState({});
  const [landingFiles, setLandingFiles] = useState({});
  const [landingPreviews, setLandingPreviews] = useState({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBusinessSettings();
      const settings = response?.data?.data || response?.data;

      if (settings) {
        setFullSettings(settings);
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
      console.error('Fetch landing settings error:', err);
      toast.error('Failed to load landing settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLandingChange = (name, value) => {
    setLandingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColumnItemChange = (colName, index, field, value) => {
    setLandingData(prev => {
      const items = [...(prev[colName] || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [colName]: items };
    });
  };

  const addColumnItem = (colName) => {
    setLandingData(prev => {
      const items = [...(prev[colName] || [])];
      if (colName === 'socialItems') {
        items.push({ platform: "Instagram", url: "#" });
      } else {
        items.push({ title: "New Link", url: "#" });
      }
      return { ...prev, [colName]: items };
    });
  };

  const removeColumnItem = (colName, index) => {
    setLandingData(prev => {
      const items = [...(prev[colName] || [])];
      items.splice(index, 1);
      return { ...prev, [colName]: items };
    });
  };

  const handleLandingFileUpload = (fieldName, file) => {
    setLandingFiles(prev => ({ ...prev, [fieldName]: file }));
    const reader = new FileReader();
    reader.onload = () => {
      setLandingPreviews(prev => ({ ...prev, [fieldName]: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const dataToSend = {
        ...fullSettings,
        companyName: fullSettings.companyName || "Minutekart",
        landingPage: landingData,
      };

      const response = await adminAPI.updateBusinessSettings(dataToSend, landingFiles);
      const updatedSettings = response?.data?.data || response?.data;

      if (updatedSettings) {
        setCachedSettings(updatedSettings);
      }
      toast.success('Landing Page settings saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save landing settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
              <Layout size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider">MANAGE LANDING PAGE</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">Control live headlines, hero background images, impact counters, app download URLs & ecosystem cards for http://localhost:5173/</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
           <span>Settings</span>
           <ChevronRight size={12} strokeWidth={3} />
           <span className="text-rose-600 font-extrabold">Manage Landing Page</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-8 pb-32">
        
        {/* HERO & HEADLINES */}
        <SectionCard title="1. Hero Section & Main Headlines" icon={Smartphone}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <InputField label="Hero Headline" name="heroHeadline" value={landingData.heroHeadline} onChange={handleLandingChange} placeholder="India’s #1 food delivery app" info="Main hero banner heading text" />
              <InputField label="Hero Subtitle" name="heroSubtitle" value={landingData.heroSubtitle} onChange={handleLandingChange} placeholder="Experience fast & easy online ordering on the Minutekart app" info="Hero banner sub-heading text" />
              <InputField label="Section 2 Headline" name="sec2Headline" value={landingData.sec2Headline} onChange={handleLandingChange} placeholder="Better food for more people" />
              <InputField label="Section 2 Subtitle" name="sec2Subtitle" value={landingData.sec2Subtitle} onChange={handleLandingChange} placeholder="For over a decade, we’ve enabled our customers..." />
              <InputField label="Section 3 Headline" name="sec3Headline" value={landingData.sec3Headline} onChange={handleLandingChange} placeholder="What’s waiting for you on the app?" />
              <InputField label="Section 3 Subtitle" name="sec3Subtitle" value={landingData.sec3Subtitle} onChange={handleLandingChange} placeholder="Our app is packed with features..." />
           </div>
           <div className="mt-8">
              <ImageUploadBox 
                title="Hero Background Banner Image" 
                size="1920px x 1080px" 
                preview={landingPreviews.heroBgImage || landingData.heroBgImage} 
                onUpload={(file) => handleLandingFileUpload('heroBgImage', file)} 
                onClear={() => {
                  setLandingPreviews(prev => ({ ...prev, heroBgImage: null }));
                  setLandingFiles(prev => ({ ...prev, heroBgImage: null }));
                  handleLandingChange('heroBgImage', '');
                }} 
              />
           </div>
        </SectionCard>

        {/* APP COUNTS & IMPACT STATS */}
        <SectionCard title="2. Impact Statistics & App Counters" icon={BarChart3}>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              <InputField label="Restaurants Counter" name="restaurantsCount" value={landingData.restaurantsCount} onChange={handleLandingChange} placeholder="3,00,000+" />
              <InputField label="Cities Counter" name="citiesCount" value={landingData.citiesCount} onChange={handleLandingChange} placeholder="800+" />
              <InputField label="Orders Delivered Counter" name="ordersCount" value={landingData.ordersCount} onChange={handleLandingChange} placeholder="3 billion+" />
           </div>
        </SectionCard>

        {/* APP LINKS & QR CODE */}
        <SectionCard title="3. App Store Download Links & QR Code" icon={QrCode}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mb-8">
              <InputField label="Google Play Store URL" name="playStoreUrl" value={landingData.playStoreUrl} onChange={handleLandingChange} placeholder="https://play.google.com/store/apps/details?id=..." />
              <InputField label="Apple App Store URL" name="appStoreUrl" value={landingData.appStoreUrl} onChange={handleLandingChange} placeholder="https://apps.apple.com/app/id..." />
              <InputField label="QR Code Phone Screen Text" name="qrCodeText" value={landingData.qrCodeText} onChange={handleLandingChange} placeholder="Scan the QR code to download the app" />
           </div>
           <div className="max-w-md">
              <ImageUploadBox 
                title="Custom QR Code Image" 
                size="400px x 400px" 
                preview={landingPreviews.qrCodeImage || landingData.qrCodeImage} 
                onUpload={(file) => handleLandingFileUpload('qrCodeImage', file)} 
                onClear={() => {
                  setLandingPreviews(prev => ({ ...prev, qrCodeImage: null }));
                  setLandingFiles(prev => ({ ...prev, qrCodeImage: null }));
                  handleLandingChange('qrCodeImage', '');
                }} 
              />
           </div>
        </SectionCard>

        {/* ECOSYSTEM MODULE CARDS */}
        <SectionCard title="4. Ecosystem Module App Cards" icon={Layers}>
           <div className="space-y-8">
              {/* User App Card */}
              <div className="p-6 border border-rose-100 rounded-2xl bg-rose-50/20 space-y-6">
                 <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-2">📱 1. Minutekart User App Card</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="App Title" name="userAppTitle" value={landingData.userAppTitle} onChange={handleLandingChange} placeholder="minutekart user" />
                    <InputField label="App Description" name="userAppDesc" value={landingData.userAppDesc} onChange={handleLandingChange} placeholder="Get the app now..." />
                    <InputField label="Redirect Link" name="userAppLink" value={landingData.userAppLink} onChange={handleLandingChange} placeholder="/food/user" />
                 </div>
                 <div className="max-w-xs">
                    <ImageUploadBox 
                      title="User App Icon Image" 
                      size="200px x 200px" 
                      preview={landingPreviews.userAppIcon || landingData.userAppIcon} 
                      onUpload={(file) => handleLandingFileUpload('userAppIcon', file)} 
                      onClear={() => {
                        setLandingPreviews(prev => ({ ...prev, userAppIcon: null }));
                        setLandingFiles(prev => ({ ...prev, userAppIcon: null }));
                        handleLandingChange('userAppIcon', '');
                      }} 
                    />
                 </div>
              </div>

              {/* Restaurant App Card */}
              <div className="p-6 border border-emerald-100 rounded-2xl bg-emerald-50/20 space-y-6">
                 <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-2">🏪 2. Minutekart Restaurant App Card</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="App Title" name="restaurantAppTitle" value={landingData.restaurantAppTitle} onChange={handleLandingChange} placeholder="minutekart restaurant" />
                    <InputField label="App Description" name="restaurantAppDesc" value={landingData.restaurantAppDesc} onChange={handleLandingChange} placeholder="Partner with us..." />
                    <InputField label="Redirect Link" name="restaurantAppLink" value={landingData.restaurantAppLink} onChange={handleLandingChange} placeholder="/seller" />
                 </div>
                 <div className="max-w-xs">
                    <ImageUploadBox 
                      title="Restaurant App Icon Image" 
                      size="200px x 200px" 
                      preview={landingPreviews.restaurantAppIcon || landingData.restaurantAppIcon} 
                      onUpload={(file) => handleLandingFileUpload('restaurantAppIcon', file)} 
                      onClear={() => {
                        setLandingPreviews(prev => ({ ...prev, restaurantAppIcon: null }));
                        setLandingFiles(prev => ({ ...prev, restaurantAppIcon: null }));
                        handleLandingChange('restaurantAppIcon', '');
                      }} 
                    />
                 </div>
              </div>

              {/* Seller App Card */}
              <div className="p-6 border border-amber-100 rounded-2xl bg-amber-50/20 space-y-6">
                 <h4 className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-2">🛍️ 3. Minutekart Seller App Card</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="App Title" name="sellerAppTitle" value={landingData.sellerAppTitle} onChange={handleLandingChange} placeholder="minutekart seller" />
                    <InputField label="App Description" name="sellerAppDesc" value={landingData.sellerAppDesc} onChange={handleLandingChange} placeholder="Join as a local shop..." />
                    <InputField label="Redirect Link" name="sellerAppLink" value={landingData.sellerAppLink} onChange={handleLandingChange} placeholder="/seller" />
                 </div>
                 <div className="max-w-xs">
                    <ImageUploadBox 
                      title="Seller App Icon Image" 
                      size="200px x 200px" 
                      preview={landingPreviews.sellerAppIcon || landingData.sellerAppIcon} 
                      onUpload={(file) => handleLandingFileUpload('sellerAppIcon', file)} 
                      onClear={() => {
                        setLandingPreviews(prev => ({ ...prev, sellerAppIcon: null }));
                        setLandingFiles(prev => ({ ...prev, sellerAppIcon: null }));
                        handleLandingChange('sellerAppIcon', '');
                      }} 
                    />
                 </div>
              </div>

              {/* Delivery App Card */}
              <div className="p-6 border border-blue-100 rounded-2xl bg-blue-50/20 space-y-6">
                 <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2">🛵 4. Minutekart Delivery App Card</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="App Title" name="deliveryAppTitle" value={landingData.deliveryAppTitle} onChange={handleLandingChange} placeholder="minutekart delivery" />
                    <InputField label="App Description" name="deliveryAppDesc" value={landingData.deliveryAppDesc} onChange={handleLandingChange} placeholder="Deliver with Minutekart..." />
                    <InputField label="Redirect Link" name="deliveryAppLink" value={landingData.deliveryAppLink} onChange={handleLandingChange} placeholder="#" />
                 </div>
                 <div className="max-w-xs">
                    <ImageUploadBox 
                      title="Delivery App Icon Image" 
                      size="200px x 200px" 
                      preview={landingPreviews.deliveryAppIcon || landingData.deliveryAppIcon} 
                      onUpload={(file) => handleLandingFileUpload('deliveryAppIcon', file)} 
                      onClear={() => {
                        setLandingPreviews(prev => ({ ...prev, deliveryAppIcon: null }));
                        setLandingFiles(prev => ({ ...prev, deliveryAppIcon: null }));
                        handleLandingChange('deliveryAppIcon', '');
                      }} 
                    />
                 </div>
              </div>
           </div>
        </SectionCard>

         {/* FOOTER LINKS, SOCIAL PROFILES & LEGAL */}
        <SectionCard title="5. Footer Links, Social Profiles & Legal Information" icon={Layout}>
           <div className="space-y-8">
              
              {/* Social Profiles */}
               <SocialMediaEditor 
                 landingData={landingData} 
                 onItemChange={handleColumnItemChange} 
                 onAddItem={addColumnItem} 
                 onRemoveItem={removeColumnItem} 
               />

              {/* Dynamic Footer Link Columns */}
              <div className="space-y-6">
                 <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">🔗 Editable Footer Columns & Links</h4>
                 
                 <ColumnEditor 
                   colKey="col1Items" 
                   colTitleKey="col1Title" 
                   titleLabel="Column 1 Title (e.g. Eternal)" 
                   landingData={landingData} 
                   onTitleChange={handleLandingChange} 
                   onItemChange={handleColumnItemChange} 
                   onAddItem={addColumnItem} 
                   onRemoveItem={removeColumnItem} 
                 />

                 <ColumnEditor 
                   colKey="col2Items" 
                   colTitleKey="col2Title" 
                   titleLabel="Column 2 Title (e.g. For Restaurants)" 
                   landingData={landingData} 
                   onTitleChange={handleLandingChange} 
                   onItemChange={handleColumnItemChange} 
                   onAddItem={addColumnItem} 
                   onRemoveItem={removeColumnItem} 
                 />

                 <ColumnEditor 
                   colKey="col3Items" 
                   colTitleKey="col3Title" 
                   titleLabel="Column 3 Title (e.g. For Delivery Partners)" 
                   landingData={landingData} 
                   onTitleChange={handleLandingChange} 
                   onItemChange={handleColumnItemChange} 
                   onAddItem={addColumnItem} 
                   onRemoveItem={removeColumnItem} 
                 />

                 <ColumnEditor 
                   colKey="col4Items" 
                   colTitleKey="col4Title" 
                   titleLabel="Column 4 Title (e.g. Learn More)" 
                   landingData={landingData} 
                   onTitleChange={handleLandingChange} 
                   onItemChange={handleColumnItemChange} 
                   onAddItem={addColumnItem} 
                   onRemoveItem={removeColumnItem} 
                 />
              </div>

              {/* Copyright & Legal Disclaimer */}
              <div className="space-y-4">
                 <InputField label="Footer Legal Disclaimer Text" name="footerDisclaimer" value={landingData.footerDisclaimer} onChange={handleLandingChange} placeholder="By continuing past this page, you agree to our..." info="Legal disclaimer notice shown at footer bottom" />
                 <InputField label="Footer Copyright Text" name="footerCopyright" value={landingData.footerCopyright} onChange={handleLandingChange} placeholder="2008-2026 © Minutekart™ Ltd. All rights reserved." info="Copyright statement text" />
              </div>

           </div>
        </SectionCard>

      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-10 right-10 z-50">
         <button 
           onClick={handleUpdate} 
           disabled={saving} 
           className="bg-rose-500 text-white px-8 h-16 rounded-full flex items-center justify-center gap-3 font-extrabold uppercase tracking-wider shadow-[0_15px_40px_rgba(244,63,94,0.4)] hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50"
         >
            {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            <span>Save Landing Page Settings</span>
         </button>
      </div>

    </div>
  );
}
