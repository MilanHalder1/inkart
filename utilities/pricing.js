'use strict';

exports.getUnitPrice = (product, quantity) => {

  let price =
    product.discountedPrice &&
    product.discountedPrice < product.basePrice
      ? product.discountedPrice
      : product.basePrice;

  if (
    product.quantityPricing &&
    product.quantityPricing.length
  ) {

    const slabs = [...product.quantityPricing]
      .sort((a, b) => a.minQty - b.minQty);

    for (const slab of slabs) {
      if (quantity >= slab.minQty) {
        price = slab.pricePerUnit;
      }
    }
  }

  return price;
};