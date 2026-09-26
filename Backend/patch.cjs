const fs = require('fs');
let f = fs.readFileSync('src/modules/quick-commerce/controllers/admin.controller.js', 'utf8');

f = f.replace('import { Seller } from \\'../seller/models/seller.model.js\\';', 'import { Seller } from \\'../seller/models/seller.model.js\\';\\nimport { SellerRankSettings } from \\'../models/sellerRankSettings.model.js\\';');

f = f.replace(
  '}).sort((a, b) => { if (a.rank === b.rank) return new Date(b.createdAt) - new Date(a.createdAt); return a.rank - b.rank; }); return res.json({ success: true, result: sellers });',
  '}).sort((a, b) => { if (a.rank === b.rank) return new Date(b.createdAt) - new Date(a.createdAt); return a.rank - b.rank; });\\n    let settings = await SellerRankSettings.findOne();\\n    if (!settings) { settings = await SellerRankSettings.create({ globalRotationInterval: 1 }); }\\n    return res.json({ success: true, result: sellers, rotationIntervalDays: settings.globalRotationInterval });'
);

f = f.replace(
  'const { sellers, categoryId } = req.body;\\n    if (!Array.isArray(sellers)) {\\n      return res.status(400).json({ success: false, message: \\'Invalid payload\\' });\\n    }\\n    const updatePromises = sellers.map(seller => { if (categoryId) { const updatePath = `categoryRanks.${categoryId}`; return Seller.findByIdAndUpdate(seller._id, { $set: { [updatePath]: seller.rank } }); } else { return Seller.findByIdAndUpdate(seller._id, { rank: seller.rank }); } });',
  'const { sellers, categoryId, rotationIntervalDays } = req.body;\\n    if (rotationIntervalDays !== undefined) {\\n      let settings = await SellerRankSettings.findOne();\\n      if (settings) { settings.globalRotationInterval = Number(rotationIntervalDays); await settings.save(); } else { await SellerRankSettings.create({ globalRotationInterval: Number(rotationIntervalDays) }); }\\n    }\\n    if (sellers && Array.isArray(sellers)) {\\n      const updatePromises = sellers.map(seller => { if (categoryId) { const updatePath = `categoryRanks.${categoryId}`; return Seller.findByIdAndUpdate(seller._id, { $set: { [updatePath]: seller.rank } }); } else { return Seller.findByIdAndUpdate(seller._id, { rank: seller.rank }); } });\\n      await Promise.all(updatePromises);\\n    }'
);

f = f.replace('await Promise.all(updatePromises);\\n    await Promise.all(updatePromises);', 'await Promise.all(updatePromises);');

fs.writeFileSync('src/modules/quick-commerce/controllers/admin.controller.js', f);
console.log('patched');
