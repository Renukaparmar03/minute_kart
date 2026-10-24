import { useParams, Link } from "react-router-dom"
import { Download, ArrowLeft, FileText, Printer, CheckCircle2 } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import ScrollReveal from "@food/components/user/ScrollReveal"
import { Card, CardContent } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { Badge } from "@food/components/ui/badge"
import { useOrders } from "@food/context/OrdersContext"
import { useCompanyName } from "@food/hooks/useCompanyName"
import { orderAPI } from "@food/api"
import { customerApi } from "@/modules/quickCommerce/user/services/customerApi"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import { pdfSafe, buildInvoiceBreakdown } from "@food/utils/invoiceUtils"

export default function OrderInvoice() {
  const companyName = useCompanyName() || "Minutekart"
  const { orderId } = useParams()
  const { getOrderById } = useOrders()
  const [order, setOrder] = useState(() => (typeof getOrderById === "function" ? getOrderById(orderId) : null))
  const [loading, setLoading] = useState(!order)
  const [error, setError] = useState(null)
  const invoiceRef = useRef(null)

  useEffect(() => {
    if (order) return

    const fetchOrder = async () => {
      try {
        setLoading(true)
        let found = null

        // 1. Try Food Order API
        try {
          const response = await orderAPI.getOrderDetails(orderId)
          if (response?.data?.success && response.data?.data?.order) {
            found = response.data.data.order
          } else if (response?.data?.order) {
            found = response.data.order
          }
        } catch {
          // Food lookup failed, proceed to quick commerce fallback
        }

        // 2. Try Quick Commerce API
        if (!found) {
          try {
            const qcRes = await customerApi.getOrder(orderId)
            if (qcRes?.data?.data) {
              found = qcRes.data.data
            } else if (qcRes?.data?.order) {
              found = qcRes.data.order
            } else if (qcRes?.order) {
              found = qcRes.order
            }
          } catch {
            // QC lookup failed
          }
        }

        if (found) {
          setOrder(found)
          setError(null)
        } else {
          setError("Order not found")
        }
      } catch (err) {
        setError("Failed to load invoice details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, order])

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString("en-IN")
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return String(dateString)
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return String(dateString)
    }
  }

  // Safe pricing derivations
  const orderIdDisplay = order?.orderId || order?.id || order?._id || orderId || "N/A"
  const items = Array.isArray(order?.items) ? order.items : []
  const { rows: breakdownRows, discount, grandTotal } = buildInvoiceBreakdown(order)
  const breakdownDisplay = [...breakdownRows, ...(discount > 0 ? [["Discount", -discount]] : [])]
  const money = (v) => `${v < 0 ? "- " : ""}Rs. ${Math.abs(v).toFixed(2)}`
  
  const paymentMethod = String(
    order?.paymentMethod?.type ||
    order?.paymentMethod ||
    order?.payment?.method ||
    "Online"
  ).replace(/_/g, " ").toUpperCase()

  const addressText =
    order?.address?.formattedAddress ||
    [
      order?.address?.street,
      order?.address?.additionalDetails,
      order?.address?.city,
      order?.address?.state,
      order?.address?.zipCode,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Address not available"

  const customerName = order?.userName || order?.customer?.name || order?.address?.name || "Customer"
  const customerPhone = order?.userPhone || order?.customer?.phone || order?.address?.phone || ""

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 40
      let y = 54

      // Top Header Banner
      doc.setFillColor(18, 18, 18)
      doc.rect(0, 0, pageWidth, 110, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.text(pdfSafe(companyName), margin, 48)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Tax Invoice & Order Receipt", margin, 68)

      doc.text("Order Invoice", pageWidth - margin, 48, { align: "right" })
      doc.text(pdfSafe(`Invoice Ref: INV-${orderIdDisplay}`), pageWidth - margin, 68, { align: "right" })
      doc.text(pdfSafe(`Date: ${formatDate(order?.createdAt)}`), pageWidth - margin, 86, { align: "right" })

      // Billing & Order Snapshot
      y = 140
      doc.setTextColor(17, 24, 39)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text("Billed To", margin, y)
      doc.text("Order Details", margin + (pageWidth - margin * 2 - 24) / 2 + 24, y)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      const billedToLines = [
        customerName,
        customerPhone ? `Phone: ${customerPhone}` : "",
        addressText,
      ].map(pdfSafe).filter(Boolean)

      const snapshotLines = [
        `Order ID: ${orderIdDisplay}`,
        `Status: ${String(order?.status || "COMPLETED").toUpperCase()}`,
        `Payment: ${paymentMethod}`,
        `Store / Restaurant: ${order?.restaurant || order?.restaurantName || companyName}`,
      ].map(pdfSafe)

      const colGap = 24
      const colWidth = (pageWidth - margin * 2 - colGap) / 2
      const rightColX = margin + colWidth + colGap

      let billedY = y + 16
      billedToLines.forEach((line) => {
        const lines = doc.splitTextToSize(line, colWidth)
        doc.text(lines, margin, billedY)
        billedY += lines.length * 13
      })

      let snapshotY = y + 16
      snapshotLines.forEach((line) => {
        const lines = doc.splitTextToSize(line, colWidth)
        doc.text(lines, rightColX, snapshotY)
        snapshotY += lines.length * 13
      })

      y = Math.max(billedY, snapshotY) + 16
      doc.setDrawColor(229, 231, 235)
      doc.line(margin, y, pageWidth - margin, y)
      y += 16

      // Items Table
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        head: [["Item Description", "Qty", "Price", "Total"]],
        body: items.map((item) => {
          const baseName = item?.name || item?.foodName || "Item"
          const name = pdfSafe(item?.variantName ? `${baseName} (${item.variantName})` : baseName) || "Item"
          const qty = Number(item?.quantity ?? item?.qty ?? 1)
          const price = Number(item?.price ?? 0)
          return [
            name,
            String(qty),
            `Rs. ${price.toFixed(2)}`,
            `Rs. ${(price * qty).toFixed(2)}`,
          ]
        }),
        theme: "striped",
        headStyles: {
          fillColor: [18, 18, 18],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 7,
          textColor: [31, 41, 55],
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "center", cellWidth: 45 },
          2: { halign: "right", cellWidth: 90 },
          3: { halign: "right", cellWidth: 90 },
        },
      })

      y = (doc.lastAutoTable?.finalY || y) + 20

      // Totals
      const totalsXLabel = pageWidth - margin - 180
      const totalsXValue = pageWidth - margin
      const totals = breakdownDisplay.map(([label, value]) => [label, money(value)])

      if (y + totals.length * 15 + 60 > pageHeight - 80) {
        doc.addPage()
        y = margin
        doc.setTextColor(17, 24, 39)
      }

      doc.setFontSize(10)
      totals.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal")
        doc.text(label, totalsXLabel, y)
        doc.text(value, totalsXValue, y, { align: "right" })
        y += 15
      })

      doc.setDrawColor(18, 18, 18)
      doc.line(totalsXLabel, y + 2, totalsXValue, y + 2)
      y += 18
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Total Paid", totalsXLabel, y)
      doc.text(money(grandTotal), totalsXValue, y, { align: "right" })

      // Footer
      const footerY = pageHeight - 50
      doc.setDrawColor(229, 231, 235)
      doc.line(margin, footerY - 14, pageWidth - margin, footerY - 14)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text(pdfSafe(`${companyName} - System generated order tax invoice`), margin, footerY)
      doc.text("Thank you for ordering with us!", pageWidth - margin, footerY, { align: "right" })

      doc.save(`${companyName}_Invoice_${orderIdDisplay}.pdf`)
      toast.success("Invoice downloaded successfully!")
    } catch (err) {
      console.error("PDF generation error:", err)
      toast.error("Failed to generate PDF")
    }
  }

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-10 h-10 border-3 border-[#DC021B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading invoice details...</p>
        </div>
      </AnimatedPage>
    )
  }

  if (error || !order) {
    return (
      <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center py-20">
          <h1 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
            {error || "Order Not Found"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">We couldn&apos;t find invoice details for this order ID.</p>
          <Link to="/food/user/orders">
            <Button className="bg-[#DC021B] hover:bg-[#b50216] text-white">Back to Orders</Button>
          </Link>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-3 sm:p-6 lg:p-8">
      {/* Inline Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-printable-card, #invoice-printable-card * {
            visibility: visible;
          }
          #invoice-printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2 no-print">
            <div className="flex items-center gap-3">
              <Link to={`/food/user/orders/${orderId}`}>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-white dark:bg-neutral-800 shadow-sm border dark:border-neutral-700">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">Tax Invoice</h1>
                <p className="text-xs sm:text-sm text-gray-500">Order #{orderIdDisplay}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2 text-xs sm:text-sm h-10 rounded-xl"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="bg-[#DC021B] hover:bg-[#B30216] text-white flex items-center gap-2 text-xs sm:text-sm h-10 rounded-xl shadow-md cursor-pointer"
              >
                <Download className="h-4 w-4 text-white" />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <Card id="invoice-printable-card" ref={invoiceRef} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-neutral-800 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-8 md:p-10">
              {/* Header */}
              <div className="border-b border-slate-200 dark:border-neutral-800 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-6 w-6 text-[#DC021B]" />
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{companyName}</h2>
                  </div>
                  <p className="text-xs text-gray-500">Tax Invoice & Order Receipt</p>
                </div>
                <div className="text-left sm:text-right">
                  <Badge className="bg-emerald-500 text-white font-bold px-3 py-1 text-xs">
                    {String(order?.status || "CONFIRMED").toUpperCase()}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Invoice #: <span className="font-bold text-gray-800 dark:text-gray-200">INV-{orderIdDisplay}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Date: {formatDate(order?.createdAt)}
                  </p>
                </div>
              </div>

              {/* Billed To / Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-xs sm:text-sm">
                <div className="bg-slate-50 dark:bg-neutral-900/60 p-4 rounded-xl">
                  <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-2 text-[11px]">Billed To</h3>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">{customerName}</p>
                  {customerPhone && <p className="text-gray-600 dark:text-gray-400 mt-0.5">Phone: {customerPhone}</p>}
                  <p className="text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{addressText}</p>
                </div>
                <div className="bg-slate-50 dark:bg-neutral-900/60 p-4 rounded-xl">
                  <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-2 text-[11px]">Order Snapshot</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Store / Source:</strong> {order?.restaurant || companyName}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    <strong className="text-gray-900 dark:text-white">Payment Method:</strong> {paymentMethod}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    <strong className="text-gray-900 dark:text-white">Order Type:</strong> {String(order?.orderType || "delivery").toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-3">Order Items</h3>
                <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-neutral-800/80 text-gray-700 dark:text-gray-300 font-semibold border-b border-slate-200 dark:border-neutral-800">
                      <tr>
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {items.map((item, idx) => {
                        const qty = Number(item?.quantity ?? item?.qty ?? 1)
                        const price = Number(item?.price ?? 0)
                        const name = item?.variantName
                          ? `${item?.name || item?.foodName || "Item"} (${item.variantName})`
                          : item?.name || item?.foodName || "Item"
                        return (
                          <tr key={item?.id || item?._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/50">
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{name}</td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{qty}</td>
                            <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">₹{price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                              ₹{(price * qty).toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">No item details available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
                  {breakdownDisplay.map(([label, value]) => (
                    <div
                      key={label}
                      className={`flex justify-between ${label === "Discount" ? "text-emerald-600 font-medium" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      <span>{label}:</span>
                      <span className={label === "Discount" ? "" : "font-medium text-gray-900 dark:text-white"}>
                        {value < 0 ? "- " : ""}₹{Math.abs(value).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-gray-900 dark:border-white pt-2.5 mt-2 flex justify-between text-base font-extrabold text-gray-900 dark:text-white">
                    <span>Total Paid:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 dark:border-neutral-800 pt-6 text-center text-xs text-gray-400">
                <p>This is a computer-generated tax invoice for your order.</p>
                <p className="mt-1">For questions or support regarding this order, please visit Help & Support in your app.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <div className="flex gap-3 no-print">
          <Link to={`/food/user/orders/${orderId}`} className="flex-1">
            <Button variant="outline" className="w-full h-11 rounded-xl">
              Track Order
            </Button>
          </Link>
          <Link to="/food/user/orders" className="flex-1">
            <Button variant="outline" className="w-full h-11 rounded-xl">
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    </AnimatedPage>
  )
}
