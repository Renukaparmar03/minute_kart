import { QuickProduct } from '../models/product.model.js';
import { logger } from '../../../utils/logger.js';

const clampedSubtract = (field, qty) => ({ $max: [0, { $subtract: [field, qty] }] });

const applyDelta = async (item, sign) => {
  const qty = Math.max(0, Number(item?.quantity) || 0);
  if (!qty || !item?.productId) return false;

  const variantSku = item.variantSku || '';
  const filter = { _id: item.productId };

  if (sign < 0) {
    // Reserve: only succeed if enough stock is left (atomic, so concurrent orders can't oversell)
    if (variantSku) {
      filter.variants = { $elemMatch: { sku: variantSku, stock: { $gte: qty } } };
    } else {
      filter.stock = { $gte: qty };
    }
  }

  const bump = (field) => (sign < 0 ? clampedSubtract(field, qty) : { $add: [field, qty] });

  const update = [
    {
      $set: {
        stock: bump({ $ifNull: ['$stock', 0] }),
        ...(variantSku
          ? {
              variants: {
                $map: {
                  input: { $ifNull: ['$variants', []] },
                  as: 'v',
                  in: {
                    $cond: [
                      { $eq: ['$$v.sku', variantSku] },
                      { $mergeObjects: ['$$v', { stock: bump({ $ifNull: ['$$v.stock', 0] }) }] },
                      '$$v',
                    ],
                  },
                },
              },
            }
          : {}),
      },
    },
  ];

  const result = await QuickProduct.updateOne(filter, update);
  return result.modifiedCount > 0 || (sign > 0 && result.matchedCount > 0);
};

/**
 * Atomically takes `quantity` units of stock for each line. If any line can't be fulfilled
 * everything already reserved is put back and the offending line is returned in `failed`.
 */
export const reserveQuickStock = async (items = []) => {
  const reserved = [];
  for (const item of items) {
    const ok = await applyDelta(item, -1);
    if (!ok) {
      await releaseQuickStock(reserved);
      return { ok: false, failed: item, reserved: [] };
    }
    reserved.push(item);
  }
  return { ok: true, failed: null, reserved };
};

export const releaseQuickStock = async (items = []) => {
  for (const item of items) {
    try {
      await applyDelta(item, 1);
    } catch (error) {
      logger.error(`Failed to restore quick stock for ${item?.productId}: ${error?.message || error}`);
    }
  }
};

/** Put stock back for a cancelled order (idempotent via the order's `stockReleased` flag). */
export const releaseStockForCancelledOrder = async (order) => {
  try {
    if (!order || order.stockReleased) return;
    if (!['quick', 'mixed'].includes(order.orderType)) return;
    if (!String(order.orderStatus || '').startsWith('cancelled')) return;

    const model = order.constructor;
    const claimed = await model.updateOne(
      { _id: order._id, stockReleased: { $ne: true } },
      { $set: { stockReleased: true } },
    );
    if (!claimed.modifiedCount) return;
    order.stockReleased = true;

    const lines = (order.items || [])
      .filter((item) => item?.type === 'quick' && item?.itemId)
      .map((item) => ({ productId: item.itemId, variantSku: item.variantSku || '', quantity: item.quantity }));
    await releaseQuickStock(lines);
  } catch (error) {
    logger.error(`releaseStockForCancelledOrder failed: ${error?.message || error}`);
  }
};
