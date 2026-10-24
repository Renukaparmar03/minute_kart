import React from 'react';
import { useSettings } from '@core/context/SettingsContext';
import bagImage from '@/assets/Gemini_Generated_Image_i9f6i1i9f6i1i9f6-removebg-preview.png';

const MobileFooterMessage = ({ compact = false }) => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'Minutemart';
    if (compact) {
        // Just the bag, right under the page content - no brand text and no extra spacing
        return (
            <div className="md:hidden w-full flex justify-center px-6 pt-1 pb-20 bg-transparent overflow-hidden">
                <img src={bagImage} alt="Delivery Bag" className="w-28 h-28 object-contain drop-shadow-lg" />
            </div>
        );
    }

    return (
        <div className="md:hidden w-full flex flex-col items-center mt-6 pt-0 pb-24 px-6 bg-transparent overflow-hidden">
            <div className="w-full flex flex-col items-center">
                <img src={bagImage} alt="Delivery Bag" className="w-36 h-36 object-contain drop-shadow-lg" />
            </div>
        </div>
    );
};

export default MobileFooterMessage;

