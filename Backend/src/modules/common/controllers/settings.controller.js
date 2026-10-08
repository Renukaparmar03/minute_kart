import { GlobalSettings } from '../models/settings.model.js';
import { sendResponse } from '../../../utils/response.js';
import { uploadImageBufferDetailed } from '../../../services/cloudinary.service.js';
import { FoodUser } from '../../../core/users/user.model.js';
import { FoodRestaurant } from '../../food/restaurant/models/restaurant.model.js';
import { FoodDeliveryPartner } from '../../food/delivery/models/deliveryPartner.model.js';
import { Seller } from '../../quick-commerce/seller/models/seller.model.js';
import { FoodRefreshToken } from '../../../core/refreshTokens/refreshToken.model.js';

export async function getGlobalSettings(req, res, next) {
    try {
        let settings = await GlobalSettings.findOne().lean();
        if (!settings) {
            // Create default settings if none exist
            settings = await GlobalSettings.create({
                companyName: 'Appzeto',
                email: 'admin@appzeto.com'
            });
        }
        return sendResponse(res, 200, 'Global settings fetched successfully', settings);
    } catch (error) {
        next(error);
    }
}

export async function updateGlobalSettings(req, res, next) {
    try {
        let data = {};
        if (req.body.data) {
            try {
                data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (e) {
                console.error("Error parsing settings data:", e);
                data = req.body;
            }
        } else {
            data = req.body;
        }
        
        const { companyName, email, phoneCountryCode, phoneNumber, address, state, pincode, region, logoUrl, faviconUrl, themeColor, modules, codEnabled, onlinePaymentEnabled, showLocationPopup, bannedNumbers } = data;
        
        console.log("Updating global settings with data:", data);

        // Validation
        if (companyName !== undefined && (!companyName || companyName.trim().length < 2 || companyName.trim().length > 50)) {
            return res.status(400).json({ success: false, message: 'Company name must be between 2 and 50 characters' });
        }
        
        if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }
        
        if (phoneNumber && !/^\d{7,15}$/.test(phoneNumber.trim())) {
            return res.status(400).json({ success: false, message: 'Invalid phone number (7-15 digits required)' });
        }

        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings();
        }

        if (companyName) settings.companyName = companyName;
        if (email) settings.email = email;
        if (phoneCountryCode || phoneNumber) {
            settings.phone = {
                countryCode: phoneCountryCode || settings.phone?.countryCode || '+91',
                number: phoneNumber || settings.phone?.number || ''
            };
        }
        if (address !== undefined) settings.address = address;
        if (state !== undefined) settings.state = state;
        if (pincode !== undefined) settings.pincode = pincode;
        if (region) settings.region = region;
        if (logoUrl !== undefined) {
            settings.logo = {
                url: String(logoUrl || '').trim(),
                publicId: settings.logo?.publicId || ''
            };
        }
        if (faviconUrl !== undefined) {
            settings.favicon = {
                url: String(faviconUrl || '').trim(),
                publicId: settings.favicon?.publicId || ''
            };
        }
        if (themeColor !== undefined) {
            settings.themeColor = themeColor;
        }
        if (modules !== undefined) {
            settings.modules = {
                food: modules.food !== undefined ? modules.food : settings.modules?.food,
                homeBakery: modules.homeBakery !== undefined ? modules.homeBakery : settings.modules?.homeBakery,
                quickCommerce: modules.quickCommerce !== undefined ? modules.quickCommerce : settings.modules?.quickCommerce,
                dudhwala: modules.dudhwala !== undefined ? modules.dudhwala : settings.modules?.dudhwala,
            };
        }
        if (codEnabled !== undefined) {
            settings.codEnabled = codEnabled;
        }
        if (onlinePaymentEnabled !== undefined) {
            settings.onlinePaymentEnabled = onlinePaymentEnabled;
        }
        if (showLocationPopup !== undefined) {
            settings.showLocationPopup = showLocationPopup;
        }
        if (bannedNumbers !== undefined && Array.isArray(bannedNumbers)) {
            settings.bannedNumbers = bannedNumbers;
        }
        if (data.landingPage) {
            if (!settings.landingPage) settings.landingPage = {};
            
            // Sync aliases so both forms are persisted
            const lp = { ...data.landingPage };
            if (lp.ordersCount !== undefined) lp.ordersDeliveredCount = lp.ordersCount;
            if (lp.ordersDeliveredCount !== undefined) lp.ordersCount = lp.ordersDeliveredCount;
            if (lp.playStoreUrl !== undefined) lp.googlePlayUrl = lp.playStoreUrl;
            if (lp.sec2Headline !== undefined) lp.section2Headline = lp.sec2Headline;
            if (lp.sec2Subtitle !== undefined) lp.section2Subtitle = lp.sec2Subtitle;
            if (lp.sec3Headline !== undefined) lp.section3Headline = lp.sec3Headline;
            if (lp.sec3Subtitle !== undefined) lp.section3Subtitle = lp.sec3Subtitle;
            if (lp.userAppDesc !== undefined) lp.userAppDescription = lp.userAppDesc;
            if (lp.userAppLink !== undefined) lp.userAppUrl = lp.userAppLink;
            if (lp.restaurantAppDesc !== undefined) lp.restaurantAppDescription = lp.restaurantAppDesc;
            if (lp.restaurantAppLink !== undefined) lp.restaurantAppUrl = lp.restaurantAppLink;
            if (lp.sellerAppDesc !== undefined) lp.sellerAppDescription = lp.sellerAppDesc;
            if (lp.sellerAppLink !== undefined) lp.sellerAppUrl = lp.sellerAppLink;
            if (lp.deliveryAppDesc !== undefined) lp.deliveryAppDescription = lp.deliveryAppDesc;
            if (lp.deliveryAppLink !== undefined) lp.deliveryAppUrl = lp.deliveryAppLink;

            settings.landingPage = {
                ...(settings.landingPage.toObject?.() || settings.landingPage),
                ...lp
            };
            settings.markModified('landingPage');
        }

        // Handle file uploads (supports both array from upload.any() and dictionary from upload.fields())
        if (req.files) {
            const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            for (const file of filesList) {
                if (file.fieldname === 'logo') {
                    const logoResult = await uploadImageBufferDetailed(file.buffer, 'business/logos');
                    settings.logo = {
                        url: logoResult.secure_url,
                        publicId: logoResult.public_id
                    };
                } else if (file.fieldname === 'favicon') {
                    const faviconResult = await uploadImageBufferDetailed(file.buffer, 'business/favicons');
                    settings.favicon = {
                        url: faviconResult.secure_url,
                        publicId: faviconResult.public_id
                    };
                } else {
                    // Landing page image/video fields
                    const result = await uploadImageBufferDetailed(file.buffer, 'business/landing');
                    if (!settings.landingPage) settings.landingPage = {};
                    settings.landingPage[file.fieldname] = result.secure_url;
                }
            }
        }
        settings.updatedBy = req.user ? req.user.userId : null;
        await settings.save();

        // Auto-logout for newly banned numbers
        if (bannedNumbers && Array.isArray(bannedNumbers) && bannedNumbers.length > 0) {

            try {
                const users = await FoodUser.find({ phone: { $in: bannedNumbers } }).select('_id');
                const restaurants = await FoodRestaurant.find({ ownerPhone: { $in: bannedNumbers } }).select('_id');
                const dps = await FoodDeliveryPartner.find({ phone: { $in: bannedNumbers } }).select('_id');
                const sellers = await Seller.find({ phone: { $in: bannedNumbers } }).select('_id');

                const idsToLogout = [
                    ...users.map(u => u._id),
                    ...restaurants.map(r => r._id),
                    ...dps.map(d => d._id),
                    ...sellers.map(s => s._id)
                ];

                if (idsToLogout.length > 0) {
                    await FoodRefreshToken.deleteMany({ userId: { $in: idsToLogout } });
                    // Deactivate them so auth middleware catches it
                    if (users.length > 0) {
                        await FoodUser.updateMany({ _id: { $in: users.map(u => u._id) } }, { isActive: false });
                    }
                    if (restaurants.length > 0) {
                        await FoodRestaurant.updateMany({ _id: { $in: restaurants.map(r => r._id) } }, { status: 'rejected' });
                    }
                    if (dps.length > 0) {
                        await FoodDeliveryPartner.updateMany({ _id: { $in: dps.map(d => d._id) } }, { status: 'rejected' });
                    }
                    if (sellers.length > 0) {
                        await Seller.updateMany({ _id: { $in: sellers.map(s => s._id) } }, { isActive: false });
                    }
                }
            } catch (err) {
                console.error("Error auto-logging out banned numbers:", err);
            }
        }

        return sendResponse(res, 200, 'Global settings updated successfully', settings);
    } catch (error) {
        next(error);
    }
}
