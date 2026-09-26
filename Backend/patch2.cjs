const fs = require('fs');
let f = fs.readFileSync('src/modules/quick-commerce/controllers/admin.controller.js', 'utf8');

f = f.replace(
  `}).sort((a, b) => { if (a.rank === b.rank) return new Date(b.createdAt) - new Date(a.createdAt); return a.rank - b.rank; }); return res.json({ success: true, result: sellers });`,
  `}).sort((a, b) => { if (a.rank === b.rank) return new Date(b.createdAt) - new Date(a.createdAt); return a.rank - b.rank; });\n    let settings = await SellerRankSettings.findOne();\n    if (!settings) { settings = await SellerRankSettings.create({ globalRotationInterval: 1 }); }\n    return res.json({ success: true, result: sellers, rotationIntervalDays: settings.globalRotationInterval });`
);

f = f.replace(
  `const { sellers, categoryId } = req.body;`,
  `const { sellers, categoryId, rotationIntervalDays } = req.body;\n    if (rotationIntervalDays !== undefined) {\n      let settings = await SellerRankSettings.findOne();\n      if (settings) { settings.globalRotationInterval = Number(rotationIntervalDays); await settings.save(); } else { await SellerRankSettings.create({ globalRotationInterval: Number(rotationIntervalDays) }); }\n    }`
);

fs.writeFileSync('src/modules/quick-commerce/controllers/admin.controller.js', f);
console.log('patched');
