const fs = require('fs');
let f = fs.readFileSync('src/modules/quickCommerce/admin/pages/SellerRankManagement.jsx', 'utf8');

f = f.replace(
  'const [isSaving, setIsSaving] = useState(false);',
  'const [isSaving, setIsSaving] = useState(false);\n    const [rotationIntervalDays, setRotationIntervalDays] = useState(1);'
);

f = f.replace(
  'let fetchedSellers = res.data.result || [];',
  'let fetchedSellers = res.data.result || [];\n                if (res.data.rotationIntervalDays !== undefined) {\n                    setRotationIntervalDays(res.data.rotationIntervalDays);\n                }'
);

f = f.replace(
  'categoryId: selectedCategoryId || undefined',
  'categoryId: selectedCategoryId || undefined,\n                rotationIntervalDays: Number(rotationIntervalDays)'
);

f = f.replace(
  '<button\n                        onClick={handleSave}',
  '<div className="flex items-center gap-2 mr-4">\n                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rotation Days:</label>\n                        <input\n                            type="number"\n                            min="1"\n                            value={rotationIntervalDays}\n                            onChange={(e) => setRotationIntervalDays(e.target.value)}\n                            className="w-20 px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-[#0c831f]"\n                        />\n                    </div>\n                    <button\n                        onClick={handleSave}'
);

fs.writeFileSync('src/modules/quickCommerce/admin/pages/SellerRankManagement.jsx', f);
console.log('frontend patched');
