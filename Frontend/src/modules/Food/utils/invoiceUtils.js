// Shared helpers for the PDF / printable order invoices (food + quick commerce).

// jsPDF's built-in fonts only support Latin-1; anything else renders with broken letter-spacing
// and overflows into neighbouring columns, so keep printable ASCII only.
export const pdfSafe = (value) =>
  String(value ?? "")
    .replace(/₹/g, "Rs. ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// Accepts either a normalised order (flat fee fields) or a raw API order (fees under `pricing`).
export const buildInvoiceBreakdown = (order) => {
  const pricing = order?.pricing || {}
  const pick = (...vals) => {
    const found = vals.find((v) => num(v) > 0)
    return found === undefined ? 0 : num(found)
  }

  const items = Array.isArray(order?.items) ? order.items : []
  const itemsTotal = items.reduce((sum, item) => sum + num(item?.price) * num(item?.quantity ?? item?.qty ?? 1), 0)
  const subtotal = pick(order?.subtotal, pricing.subtotal, order?.itemTotal, order?.itemsPrice) || itemsTotal

  const rows = [
    ["Subtotal", subtotal],
    ["Delivery Fee", pick(order?.deliveryFee, pricing.deliveryFee, order?.deliveryCharge)],
    ["Platform Fee", pick(order?.platformFee, pricing.platformFee)],
    ["Packaging Fee", pick(order?.packagingFee, pricing.packagingFee)],
  ]
  const handlingFee = pick(order?.handlingFee, pricing.handlingFee)
  if (handlingFee > 0) rows.push(["Handling Fee", handlingFee])
  rows.push(["GST & Taxes", pick(order?.gst, order?.tax, order?.taxes, pricing.tax, pricing.gstAmount, pricing.gst)])
  const tip = pick(order?.deliveryTip, pricing.deliveryTip)
  if (tip > 0) rows.push(["Delivery Tip", tip])

  const discount = pick(order?.discount, order?.couponDiscount, pricing.discount)
  const computed = rows.reduce((sum, [, v]) => sum + v, 0) - discount
  // pricing.total is the authoritative order total (payment.amountDue can be 0/partial for wallet or paid orders)
  const stored = pick(order?.total, pricing.total, order?.grandTotal)
  const grandTotal = stored > 0 ? stored : computed
  // Reconcile any charge that isn't itemised above so the invoice always adds up
  const gap = Math.round((grandTotal - computed) * 100) / 100
  if (Math.abs(gap) >= 0.01) rows.push(["Other Charges", gap])

  return { rows, discount, grandTotal }
}
