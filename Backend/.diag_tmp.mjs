import 'dotenv/config';
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const zones = await db.collection('quick_zones').find({}, { projection: { name: 1, isActive: 1 } }).toArray().catch(() => []);
const colls = (await db.listCollections().toArray()).map(c => c.name).filter(n => /zone|seller|offer|experience|best|product/i.test(n));
console.log('collections:', colls.join(', '));
console.log('zones:', JSON.stringify(zones));
const sellers = await db.collection('sellers').find({}, { projection: { shopName: 1, fcId: 1, isActive: 1, zoneId: 1, 'shopInfo.zoneId': 1, location: 1 } }).toArray().catch(() => []);
console.log('sellers:', sellers.map(s => `${s._id} fc=${s.fcId} active=${s.isActive} zone=${s.zoneId || s.shopInfo?.zoneId} loc=${s.location?.latitude},${s.location?.longitude}`).join('\n'));
const prodColl = colls.find(n => /^quick_products$/.test(n)) || colls.find(n => /product/i.test(n));
const bySeller = await db.collection(prodColl).aggregate([{ $group: { _id: '$sellerId', n: { $sum: 1 } } }]).toArray();
console.log(prodColl, 'by seller:', JSON.stringify(bySeller));
for (const name of colls.filter(n => /offer_sections|best_seller|experience/.test(n))) {
  const secs = await db.collection(name).find({}).toArray();
  for (const s of secs) {
    const cfg = s.config?.[s.displayType] || s.config || {};
    const ids = (s.productIds || cfg.productIds || []).map(String);
    const prods = ids.length ? await db.collection(prodColl).find({ _id: { $in: ids.filter(i => /^[0-9a-f]{24}$/.test(i)).map(i => new mongoose.Types.ObjectId(i)) } }, { projection: { sellerId: 1 } }).toArray() : [];
    const sellerCounts = {};
    prods.forEach(p => { sellerCounts[String(p.sellerId)] = (sellerCounts[String(p.sellerId)] || 0) + 1; });
    console.log(`${name} | ${s.title || s.displayType} | status=${s.status} | type=${s.displayType} | productIds=${ids.length} | cats=${(s.categoryIds || cfg.categoryIds || []).length} subcats=${(cfg.subcategoryIds || []).length} | sellers=${JSON.stringify(sellerCounts)}`);
  }
}
await mongoose.disconnect();
