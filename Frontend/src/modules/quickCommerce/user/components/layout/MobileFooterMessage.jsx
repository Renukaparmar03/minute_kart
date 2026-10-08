import React from 'react';
import { useSettings } from '@core/context/SettingsContext';
import bagImage from '@/assets/Gemini_Generated_Image_i9f6i1i9f6i1i9f6-removebg-preview.png';

const MobileFooterMessage = () => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'Minutemart';
    return (
        <div className="md:hidden w-full flex flex-col items-center mt-6 pt-0 pb-24 px-6 bg-transparent overflow-hidden">
            <div className="w-full flex flex-col items-center">
                <img src={bagImage} alt="Delivery Bag" className="w-36 h-36 object-contain mb-4 drop-shadow-lg" />

                <div className="w-full h-[1px] bg-slate-200 mt-2 mb-4"></div>

                <div className="text-slate-300 font-black text-2xl tracking-tighter text-center">
                    {appName}
                </div>
            </div>
        </div>
    );
};

export default MobileFooterMessage;

