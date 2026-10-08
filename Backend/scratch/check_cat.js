import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/minutekart';

async function check() {
  await mongoose.connect(MONGO_URI);

  const QuickCategory = mongoose.model('quick_category', new mongoose.Schema({ parentId: mongoose.Schema.Types.Mixed, name: String, slug: String, isActive: Boolean }), 'quick_categories');
  const QuickProduct = mongoose.model('quick_product', new mongoose.Schema({ categoryId: mongoose.Schema.Types.Mixed, subcategoryId: mongoose.Schema.Types.Mixed, headerId: mongoose.Schema.Types.Mixed, name: String, sellerId: mongoose.Schema.Types.Mixed, isActive: Boolean }), 'quick_products');

  // Search for Personal Care category
  const categories = await QuickCategory.find({ name: { $regex: /personal/i } }).lean();
  console.log('Personal Care Categories matching /personal/i:', categories.map(c => ({ id: c._id, name: c.name, slug: c.slug, parentId: c.parentId })));

  for (const cat of categories) {
    const catId = cat._id;
    const catObjId = mongoose.Types.ObjectId.isValid(catId) ? new mongoose.Types.ObjectId(catId) : catId;

    const subCats = await QuickCategory.find({ $or: [{ parentId: catObjId }, { parentId: String(catId) }] }).lean();
    console.log(`\n--- Main Category: "${cat.name}" (${cat._id}) ---`);
    console.log(`Subcategories count: ${subCats.length}`);
    subCats.forEach(s => console.log(' Subcat:', s._id, '| Name:', s.name));

    const subCatIds = subCats.map(s => s._id);
    const allIds = [catObjId, String(catId), ...subCatIds, ...subCatIds.map(id => String(id))];

    const prods = await QuickProduct.find({
      $or: [
        { categoryId: { $in: allIds } },
        { subcategoryId: { $in: allIds } },
        { headerId: { $in: allIds } }
      ]
    }).lean();

    console.log(`Total Products under "${cat.name}" & its subcategories: ${prods.length}`);
    
    // Group products by subcategory
    const subMap = {};
    prods.forEach(p => {
      const pSubId = String(p.subcategoryId || p.categoryId || 'none');
      subMap[pSubId] = (subMap[pSubId] || 0) + 1;
      console.log(' Product:', p.name, '| categoryId:', p.categoryId, '| subcategoryId:', p.subcategoryId, '| headerId:', p.headerId);
    });

    console.log('\nProducts count grouped by categoryId/subcategoryId:');
    console.log(subMap);
  }

  process.exit(0);
}

check().catch(console.error);
