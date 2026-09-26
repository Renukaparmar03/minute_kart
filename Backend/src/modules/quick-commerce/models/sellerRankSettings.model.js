import mongoose from 'mongoose';

const sellerRankSettingsSchema = new mongoose.Schema({
  globalRotationInterval: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

export const SellerRankSettings = mongoose.model('SellerRankSettings', sellerRankSettingsSchema, 'quick_seller_rank_settings');
