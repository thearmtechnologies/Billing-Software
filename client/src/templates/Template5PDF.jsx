import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"; 

// ── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    padding: 15,
    color: "#000",
    backgroundColor: "#fff",
    lineHeight: 1.3,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  textRight: { textAlign: "right" },
  textCenter: { textAlign: "center" },

  // 1. Top Title
  mainTitle: { 
    fontSize: 14, 
    fontFamily: "Helvetica-Bold", 
    textAlign: "center", 
    marginBottom: 6, 
    textTransform: "uppercase" 
  },

  // Borders & Boxes Base
  box: { 
    borderWidth: 1, 
    borderColor: "#000", 
    marginBottom: 6 
  },
  boxRow: { flexDirection: "row" },
  
  // 2. Company Header Box
  headerColLeft: { width: "65%", padding: 4, borderRightWidth: 1, borderColor: "#000" },
  headerColRight: { width: "35%", padding: 4, justifyContent: "center" },
  businessName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  companyText: { fontSize: 7.5, color: "#222", marginBottom: 1 },
  
  // 3. Bill To & Invoice Info Box
  billToColLeft: { width: "65%", padding: 4, borderRightWidth: 1, borderColor: "#000" },
  shipToColMid: { padding: 4, borderRightWidth: 1, borderColor: "#000" },
  billToColRight: { width: "35%", padding: 4 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 3, color: "#444" },
  customerName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  customerText: { fontSize: 7.5, color: "#222", marginBottom: 1 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  metaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  metaValue: { fontSize: 8, textAlign: "right" },

  // 4. Items Table
  table: { 
    borderWidth: 1, 
    borderColor: "#000", 
    marginBottom: 6 
  },
  tableHeader: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderColor: "#000", 
    backgroundColor: "#f0f0f0" 
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#ccc" },
  tableRowLast: { flexDirection: "row" },
  
  colHeader: { padding: 3, fontSize: 7.5, fontFamily: "Helvetica-Bold", borderRightWidth: 1, borderColor: "#000", textAlign: "center" },
  colHeaderLast: { padding: 3, fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  colCell: { padding: 3, fontSize: 7.5, borderRightWidth: 1, borderColor: "#000" },
  colCellLast: { padding: 3, fontSize: 7.5 },

  wNo: { width: "5%" },
  wItem: { width: "32%" },
  wHsn: { width: "12%" },
  wQty: { width: "10%" },
  wPrice: { width: "28%" },
  wGst: { width: "12%" },
  wAmt: { width: "13%" },

  tableTotalRow: { 
    flexDirection: "row", 
    borderTopWidth: 1, 
    borderColor: "#000", 
    backgroundColor: "#f9f9f9" 
  },

  // 6. Tax Summary
  taxTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  tHsn: { width: "16%" },
  tTaxable: { width: "14%" },
  tCgstRate: { width: "10%" },
  tCgstAmt: { width: "15%" },
  tSgstRate: { width: "10%" },
  tSgstAmt: { width: "15%" },
  tTotalTax: { width: "20%" },

  // 7. Totals & Words
  bottomSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  wordsBox: { width: "55%", paddingRight: 8 },
  wordsLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  wordsText: { fontSize: 8, fontStyle: "italic", color: "#333", lineHeight: 1.3 },

  totalsBox: { width: "40%", borderWidth: 1, borderColor: "#000" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", padding: 3, borderBottomWidth: 0.5, borderColor: "#ccc" },
  totalRowLast: { flexDirection: "row", justifyContent: "space-between", padding: 3, backgroundColor: "#f0f0f0" },
  totalLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  totalValue: { fontSize: 8, textAlign: "right" },
  totalValBold: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },

  // 8. Bank Details
  bankBox: { 
    marginBottom: 6, 
    padding: 4, 
    borderWidth: 1, 
    borderColor: "#000", 
    backgroundColor: "#f8f9fa" 
  },
  bankTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  bankRow: { fontSize: 7.5, marginBottom: 1.5 },

  // 9. Footer
  footerBox: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 4 },
  termsBox: { width: "55%" },
  sigBox: { width: "35%", alignItems: "flex-end" },
  sigLine: { borderTopWidth: 1, borderColor: "#000", width: "100%", textAlign: "center", paddingTop: 3 },
});

const formatAccountType = (type) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

// ── Component ───────────────────────────────────────────────────
const Template5PDF = ({ invoiceData, currentUser, numberToWords, signatureBase64 }) => {
  // Aggregate totals for the items table bottom row
  const totalQty = invoiceData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const aggregateSubtotal = invoiceData.subtotal;

  // Dynamic Tax Components
  const appliedTaxes = Array.isArray(invoiceData.taxes) && invoiceData.taxes.length > 0
    ? invoiceData.taxes
    : [];
  const numTaxes = appliedTaxes.length || 1;

  // Aggregate Tax Summary by HSN
  const taxSummary = invoiceData.items.reduce((acc, item) => {
    const hsn = item.hsnCode || "None";
    const taxable = item.subtotal;

    const key = hsn;
    if (!acc[key]) {
      acc[key] = { 
        hsn, 
        taxable: 0, 
        totalTax: 0, 
        taxes: appliedTaxes.map(t => ({ name: t.name, rate: t.rate, amount: 0 })) 
      };
    }
    acc[key].taxable += taxable;
    
    let itemTotalTax = 0;
    acc[key].taxes.forEach(t => {
      const amt = (taxable * t.rate) / 100;
      t.amount += amt;
      itemTotalTax += amt;
    });

    acc[key].totalTax += itemTotalTax;

    return acc;
  }, {});

  const taxSummaryRows = Object.values(taxSummary);
  
  const totalTaxable = taxSummaryRows.reduce((sum, row) => sum + row.taxable, 0);
  const totalSummaryTax = taxSummaryRows.reduce((sum, row) => sum + row.totalTax, 0);

  // Calculate totals per tax type
  const taxTotals = appliedTaxes.map(tax => {
    return {
      name: tax.name,
      total: taxSummaryRows.reduce((sum, row) => {
        const matchingTax = row.taxes.find(t => t.name === tax.name);
        return sum + (matchingTax ? matchingTax.amount : 0);
      }, 0)
    };
  });
  
  const dynRateW = `${20 / numTaxes}%`;
  const dynAmtW = `${30 / numTaxes}%`;

  // Safely extract and format shipping address
  const rawShipping = invoiceData.shippingAddress || invoiceData.shipping_address || invoiceData.client?.shippingAddress;
  let shipStr = "";
  if (typeof rawShipping === "string") {
    shipStr = rawShipping;
  } else if (typeof rawShipping === "object" && rawShipping !== null) {
    const parts = [
      rawShipping.street || "",
      [rawShipping.city || "", rawShipping.state || "", rawShipping.zipCode || ""].filter(Boolean).join(" "),
      rawShipping.country || ""
    ];
    shipStr = parts.filter(Boolean).join("\n").trim();
  }
  
  const hasShipping = Boolean(shipStr && shipStr.trim() !== "");
  const displayBankDetails = invoiceData?.bankDetails;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* 1. Top Title */}
        <Text style={s.mainTitle}>Tax Invoice</Text>

        {/* 2. Company Header Box */}
        <View style={[s.box, s.boxRow]}>
          <View style={s.headerColLeft}>
            <Text style={s.businessName}>{currentUser?.businessName || "Your Company Name"}</Text>
            {currentUser?.address && (
              <Text style={s.companyText}>
                {currentUser.address.street}
                {currentUser.address.city ? `\n${currentUser.address.city}, ${currentUser.address.state} ${currentUser.address.zipCode}` : ""}
              </Text>
            )}
            <Text style={s.companyText}>Phone: {currentUser?.phone || "N/A"}</Text>
            {currentUser?.email && <Text style={s.companyText}>Email: {currentUser.email}</Text>}
            {currentUser?.customProfileFields && currentUser.customProfileFields.length > 0 && (
              <Text style={s.companyText}>
                {currentUser.customProfileFields.map((field, idx) => 
                  `${field.label}: ${field.value}${idx < currentUser.customProfileFields.length - 1 ? ' | ' : ''}`
                ).join('')}
              </Text>
            )}
          </View>
          <View style={s.headerColRight}>
            <Text style={s.sectionTitle}>GSTIN</Text>
            <Text style={[s.bold, { fontSize: 10 }]}>
              {currentUser?.taxId || "N/A"}
            </Text>
            {currentUser?.udyamNo && (
              <Text style={[s.companyText, { marginTop: 1 }]}>Udyam: {currentUser.udyamNo}</Text>
            )}
            {currentUser?.panNumber && (
              <Text style={[s.companyText, { marginTop: 1 }]}>PAN: {currentUser.panNumber}</Text>
            )}
          </View>
        </View>

        {/* 3. Bill To + Invoice Details Box */}
        <View style={[s.box, s.boxRow]}>
          <View style={{ ...s.billToColLeft, width: hasShipping ? "32.5%" : "65%" }}>
            <Text style={s.sectionTitle}>{hasShipping ? "Bill To Party:" : "Bill To:"}</Text>
            <Text style={s.customerName}>{invoiceData.client?.companyName || "Customer Name"}</Text>
            {invoiceData.client?.address && (
              <Text style={s.customerText}>
                {invoiceData.client.address.street}
                {invoiceData.client.address.city ? `\n${invoiceData.client.address.city}, ${invoiceData.client.address.state} ${invoiceData.client.address.zipCode}` : ""}
              </Text>
            )}
            <Text style={s.customerText}>Phone: {invoiceData.client?.phone || "N/A"}</Text>
            {invoiceData.client?.email && <Text style={s.customerText}>Email: {invoiceData.client.email}</Text>}
            {invoiceData.client?.gstNumber && (
              <Text style={s.customerText}>GST: {invoiceData.client.gstNumber}</Text>
            )}
            {invoiceData.client?.panNumber && (
              <Text style={s.customerText}>PAN: {invoiceData.client.panNumber}</Text>
            )}
          </View>
          {hasShipping ? (
            <View style={{ ...s.shipToColMid, width: "32.5%" }}>
              <Text style={s.sectionTitle}>Ship To Party:</Text>
              <Text style={s.customerName}>{invoiceData.client?.companyName || "Customer Name"}</Text>
              <Text style={s.customerText}>{shipStr}</Text>
            </View>
          ) : null}
          <View style={s.billToColRight}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice No:</Text>
              <Text style={s.metaValue}>{invoiceData.invoiceNumber}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date:</Text>
              <Text style={s.metaValue}>
                {new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}
              </Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Due Date:</Text>
              <Text style={s.metaValue}>
                {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString("en-GB") : "-"}
              </Text>
            </View>
            {invoiceData.poNumber && (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>PO Number:</Text>
                <Text style={s.metaValue}>{invoiceData.poNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Items Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.colHeader, s.wNo]}>#</Text>
            <Text style={[s.colHeader, s.wItem, { textAlign: "left" }]}>Item name</Text>
            <Text style={[s.colHeader, s.wHsn]}>HSN/SAC</Text>
            <Text style={[s.colHeader, s.wQty, s.textRight]}>Quantity</Text>
            <Text style={[s.colHeader, s.wPrice, s.textRight]}>Price / Unit (Rs.)</Text>
            <Text style={[s.colHeaderLast, s.wAmt, s.textRight]}>Amount (Rs.)</Text>
          </View>
          
          {invoiceData.items.map((item, index) => {
            const isLast = index === invoiceData.items.length - 1;
            return (
              <View key={index} style={isLast ? s.tableRowLast : s.tableRow}>
                <Text style={[s.colCell, s.wNo, s.textCenter]}>{index + 1}</Text>
                <View style={[s.colCell, s.wItem]}>
                  <Text>{item.description}</Text>
                  {item.notes && <Text style={{ fontSize: 6.5, color: "#555", marginTop: 1 }}>{item.notes}</Text>}
                </View>
                <Text style={[s.colCell, s.wHsn, s.textCenter]}>{item.hsnCode || "-"}</Text>
                <Text style={[s.colCell, s.wQty, s.textRight]}>{item.quantity}</Text>
                <Text style={[s.colCell, s.wPrice, s.textRight, { fontSize: item.pricingType === "tiered" ? 7 : 7.5 }]}>
                  {item.pricingType === "tiered"
                    ? item.pricingTiers
                        ?.map(
                          (t) =>
                            `${t.minValue}–${t.maxValue !== null ? t.maxValue : "Above"} ${item.unitType || ""}: Rs.\u00A0${Number(t.rate).toFixed(2)}\u00A0${t.rateType === "unitRate" ? "/\u00A0" + (item.unitType || "") : "(slab)"}`
                        )
                        .join("\n")
                    : `${Number(item.baseRate || 0).toFixed(2)}`}
                </Text>
                <Text style={[s.colCellLast, s.wAmt, s.textRight]}>{item.subtotal.toFixed(2)}</Text>
              </View>
            );
          })}
          
          {/* 5. Total Row for Items */}
          <View style={s.tableTotalRow}>
            <Text style={[s.colCell, s.wNo]}></Text>
            <Text style={[s.colCell, s.wItem, s.bold, { textAlign: "right" }]}>Total :</Text>
            <Text style={[s.colCell, s.wHsn]}></Text>
            <Text style={[s.colCell, s.wQty, s.bold, s.textRight]}>{totalQty}</Text>
            <Text style={[s.colCell, s.wPrice]}></Text>
            <Text style={[s.colCellLast, s.wAmt, s.bold, s.textRight]}>{aggregateSubtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* 6. Tax Summary Section */}
        {taxSummaryRows.length > 0 && invoiceData.totalTax > 0 && (
          <View style={{ marginBottom: 6 }}>
            <Text style={s.taxTitle}>Tax Summary</Text>
            <View style={[s.table, { marginBottom: 0 }]}>
              <View style={s.tableHeader}>
                <Text style={[s.colHeader, { width: "16%" }]}>HSN/SAC</Text>
                <Text style={[s.colHeader, { width: "14%" }, s.textRight]}>Taxable Amount</Text>
                {appliedTaxes.map((tax, idx) => (
                  <React.Fragment key={`th-${idx}`}>
                    <Text style={[s.colHeader, { width: dynRateW }, s.textRight]}>{tax.name} Rate</Text>
                    <Text style={[s.colHeader, { width: dynAmtW }, s.textRight]}>{tax.name} Amount</Text>
                  </React.Fragment>
                ))}
                <Text style={[s.colHeaderLast, { width: "20%" }, s.textRight]}>Total Tax</Text>
              </View>
              {taxSummaryRows.map((row, idx) => (
                <View key={idx} style={s.tableRow}>
                  <Text style={[s.colCell, { width: "16%" }, s.textCenter]}>{row.hsn}</Text>
                  <Text style={[s.colCell, { width: "14%" }, s.textRight]}>Rs. {row.taxable.toFixed(2)}</Text>
                  {row.taxes.map((tax, tidx) => (
                    <React.Fragment key={`td-${idx}-${tidx}`}>
                      <Text style={[s.colCell, { width: dynRateW }, s.textRight]}>{tax.rate}%</Text>
                      <Text style={[s.colCell, { width: dynAmtW }, s.textRight]}>Rs. {tax.amount.toFixed(2)}</Text>
                    </React.Fragment>
                  ))}
                  <Text style={[s.colCellLast, { width: "20%" }, s.textRight]}>Rs. {row.totalTax.toFixed(2)}</Text>
                </View>
              ))}
              <View style={s.tableTotalRow}>
                <Text style={[s.colCell, { width: "16%" }, s.bold, s.textRight]}>TOTAL</Text>
                <Text style={[s.colCell, { width: "14%" }, s.bold, s.textRight]}>Rs. {totalTaxable.toFixed(2)}</Text>
                {taxTotals.map((taxTot, idx) => (
                  <React.Fragment key={`tf-${idx}`}>
                    <Text style={[s.colCell, { width: dynRateW }]}></Text>
                    <Text style={[s.colCell, { width: dynAmtW }, s.bold, s.textRight]}>Rs. {taxTot.total.toFixed(2)}</Text>
                  </React.Fragment>
                ))}
                <Text style={[s.colCellLast, { width: "20%" }, s.bold, s.textRight]}>Rs. {totalSummaryTax.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 7. Bank Details Section */}
        {displayBankDetails && (
          <View style={s.bankBox}>
            <Text style={s.bankTitle}>Bank Details:</Text>
            {displayBankDetails?.accountHolderName && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>Account Holder:</Text> {displayBankDetails.accountHolderName}
              </Text>
            )}
            {displayBankDetails?.bankName && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>Bank Name:</Text> {displayBankDetails.bankName}
              </Text>
            )}
            {displayBankDetails?.branchName && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>Branch:</Text> {displayBankDetails.branchName}
              </Text>
            )}
            {displayBankDetails?.accountType && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>Account Type:</Text> {formatAccountType(displayBankDetails.accountType)} Account
              </Text>
            )}
            {displayBankDetails?.accountNumber && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>Account No:</Text> {displayBankDetails.accountNumber}
              </Text>
            )}
            {displayBankDetails?.ifscCode && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>IFSC Code:</Text> {displayBankDetails.ifscCode}
              </Text>
            )}
            {displayBankDetails?.upiId && (
              <Text style={s.bankRow}>
                <Text style={s.bold}>UPI ID:</Text> {displayBankDetails.upiId}
              </Text>
            )}
          </View>
        )}

        {/* 8. Totals & Words */}
        <View style={s.bottomSection}>
          <View style={s.wordsBox}>
            <Text style={s.wordsLabel}>Invoice Amount in Words:</Text>
            <Text style={s.wordsText}>
              {numberToWords ? numberToWords(invoiceData.totalAmount) : `Rupees ${(invoiceData.totalAmount || 0).toFixed(2)} only`}
            </Text>
          </View>
          
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Sub Total</Text>
              <Text style={s.totalValue}>Rs. {invoiceData.subtotal.toFixed(2)}</Text>
            </View>
            {invoiceData.discount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Discount</Text>
                <Text style={s.totalValue}>- Rs. {invoiceData.discount.toFixed(2)}</Text>
              </View>
            )}
            {appliedTaxes.length > 0 ? (
              appliedTaxes.map((tax, idx) => (
                <View key={`tax-tot-${idx}`} style={s.totalRow}>
                  <Text style={s.totalLabel}>{tax.name} @{tax.rate}%</Text>
                  <Text style={s.totalValue}>Rs. {tax.amount.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total Tax</Text>
                <Text style={s.totalValue}>Rs. {invoiceData.totalTax.toFixed(2)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { fontSize: 10 }]}>Total</Text>
              <Text style={s.totalValBold}>Rs. {invoiceData.totalAmount.toFixed(2)}</Text>
            </View>
            {invoiceData.receivedAmount > 0 && (
              <>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Received</Text>
                  <Text style={s.totalValue}>Rs. {invoiceData.receivedAmount?.toFixed(2) || "0.00"}</Text>
                </View>
                <View style={s.totalRowLast}>
                  <Text style={s.totalLabel}>Balance</Text>
                  <Text style={s.totalValBold}>Rs. {(invoiceData.totalAmount - (invoiceData.receivedAmount || 0)).toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 9. Terms & Signature Sections */}
        <View style={s.footerBox}>
          <View style={s.termsBox}>
            <Text style={s.sectionTitle}>Terms & Conditions:</Text>
            <Text style={{ fontSize: 7.5, color: "#444" }}>
              {invoiceData.notes || invoiceData.termsAndConditions || "Thanks for doing business with us!"}
            </Text>
          </View>

          <View style={s.sigBox}>
            <Text style={[s.bold, { fontSize: 9, marginBottom: signatureBase64 && invoiceData.includeSignature !== false ? 8 : 20 }]}>
              For {currentUser?.businessName || "Your Company Name"}
            </Text>
            {signatureBase64 && invoiceData.includeSignature !== false && (
              <Image 
                src={signatureBase64} 
                style={{ width: 120, height: 50, objectFit: "contain", alignSelf: "flex-end", marginBottom: 6 }} 
              />
            )}
            <View style={s.sigLine}>
              <Text style={{ fontSize: 7.5 }}>Authorized Signatory</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default Template5PDF;