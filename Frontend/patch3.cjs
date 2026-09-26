const fs = require('fs');
let f = fs.readFileSync('src/modules/quickCommerce/admin/pages/SellerRankManagement.jsx', 'utf8');

f = f.replace(
  '<option value="">All</option>\\n                        {categories.filter(c => c.name !== \\'All\\').map(cat => (',
  '{categories.map(cat => ('
);

f = f.replace(
  'setCategories(cats.filter(c => c.type === \\'header\\' || c.level === 0 || !c.parentId));',
  'const filteredCats = cats.filter(c => c.type === \\'header\\' || c.level === 0 || !c.parentId);\n                setCategories(filteredCats);\n                const allCategory = filteredCats.find(c => c.name.toLowerCase() === \\'all\\');\n                if (allCategory) {\n                    setSelectedCategoryId(allCategory.id || allCategory._id);\n                } else if (filteredCats.length > 0 && !selectedCategoryId) {\n                    setSelectedCategoryId(filteredCats[0].id || filteredCats[0]._id);\n                }'
);

fs.writeFileSync('src/modules/quickCommerce/admin/pages/SellerRankManagement.jsx', f);
console.log('patched dropdown');
