// A product is out of stock when its own stock (or, for variant products, every variant's stock) is 0.
export const isQuickProductOutOfStock = (product) => {
  if (!product) return false;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    return variants.every((variant) => Number(variant?.stock ?? Infinity) <= 0);
  }
  return Number(product.stock ?? Infinity) <= 0;
};
