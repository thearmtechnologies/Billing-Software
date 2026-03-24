import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 20, // Template 3 has less outer padding, relies on border
    color: "#000",
    backgroundColor: "#fff",
    lineHeight: 1.4,
  },
  bold: { fontFamily: "Helvetica-Bold" },

  // Outer Wrapper
  outerBorder: {
    borderWidth: 1,
    borderColor: "#000",
    flex: 1,
  },

  /* ── Header ────────────────────────────────────── */
  headerWrap: {
    backgroundColor: "#FFF8DC",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#000",
    // alignItems: "center",
  },
  companyName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#8B0000",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  companyDetails: {
    fontSize: 10,
    // textAlign: "center",
  },

  /* ── Main Content Container ───────────────────────── */
  mainContainer: {
    padding: 10,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    // textAlign: "center",
    marginBottom: 10,
  },

  /* ── Invoice Headers ───────────────────────────── */
  metaWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  billToCol: { width: "50%" },
  metaCol: { width: "50%", alignItems: "flex-end" },
  textRow: { fontSize: 9, marginBottom: 2 },
  billToName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  metaBoldRow: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },

  /* ── Items Table ───────────────────────────────── */
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  th: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
  },
  thLast: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  td: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderColor: "#000",
  },
  tdLast: {
    padding: 4,
    fontSize: 8,
  },

  /* ── Totals Section ────────────────────────────── */
  calcWrapper: {
    marginBottom: 15,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  calcRowTopBorder: {
    borderTopWidth: 2,
    borderColor: "#000",
    borderBottomWidth: 0,
  },
  calcLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  calcValue: { fontFamily: "Helvetica-Bold", fontSize: 9 },

  /* ── Amount in Words ───────────────────────────── */
  wordsBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 6,
    marginBottom: 15,
  },
  wordsPrefix: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 2 },
  
  /* ── Payment Terms ─────────────────────────────── */
  termsBox: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#000",
    padding: 6,
    marginBottom: 15,
  },
  termsPrefix: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 2 },

  /* ── Bank & Sig ────────────────────────────────── */
  bankSigWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  bankBox: {
    width: "50%",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 4,
    padding: 8,
  },
  bankTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#2c3e50" },
  sigBox: {
    width: "45%",
    alignItems: "flex-end",
  },
  sigFor: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 35 },
  sigLabel: { fontSize: 9 },

  /* ── T&C & Footer ──────────────────────────────── */
  tcBox: {
    marginTop: 15,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: "#000",
  },
  tcPrefix: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 2 },
  footer: {
    marginTop: 20,
    alignItems: "center",
    color: "#666",
  },
  footerText: { fontSize: 8, marginBottom: 2 },
});

// Format account type
const formatAccountType = (type) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const Template3PDF = ({ invoiceData, currentUser, numberToWords, signatureBase64, logoBase64 }) => {
  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );

  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  // Column Distribution matching HTML
  const col = hasHSN
    ? { sr: "6%", items: "38%", hsn: "10%", qty: "8%", rate: "25%", amt: "13%" }
    : { sr: "6%", items: "48%", qty: "8%", rate: "25%", amt: "13%" };

  let displayBankDetails = invoiceData?.bankDetails;
  if (!displayBankDetails) {
    if (currentUser?.bankAccounts && currentUser.bankAccounts.length > 0) {
      displayBankDetails = currentUser.bankAccounts.find(a => a.isPrimary) || currentUser.bankAccounts[0];
    } else if (currentUser?.bankDetails) {
      displayBankDetails = currentUser.bankDetails;
    }
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.outerBorder}>
          
          {/* Header */}
          <View style={s.headerWrap} fixed>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {(logoBase64 && invoiceData.includeLogo !== false) ? (
                <Image
                  src={logoBase64}
                  style={{ width: 56, height: 40, maxWidth: 56, maxHeight: 40, marginRight: 8 }}
                />
              ) : null}
              <View>
                <Text style={s.companyName}>{currentUser?.businessName?.toUpperCase() || ""}</Text>
                <View style={s.companyDetails}>
                  <Text>
                    Office: {currentUser?.address?.street || ""} {currentUser?.address?.city || ""},{" "}
                    {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""}
                  </Text>
                  <Text>
                    Phone: {currentUser?.phone || ""} | Email: {currentUser?.email || ""} |{" "}
                    {currentUser?.taxId ? `GSTIN/UIN: ${currentUser.taxId}` : ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={s.mainContainer}>
            <Text style={s.invoiceTitle}>TAX INVOICE</Text>

            {/* Bill To & Meta Data */}
            <View style={s.metaWrapper}>
              <View style={s.billToCol}>
                <Text style={s.billToName}>{invoiceData.client?.companyName || ""}</Text>
                <Text style={s.textRow}>GST No: {invoiceData.client?.gstNumber || "N/A"}</Text>
                <Text style={s.textRow}>
                  {invoiceData.client?.address?.street || ""},{" "}
                  {invoiceData.client?.address?.city || ""},{" "}
                  {invoiceData.client?.address?.state || ""} -{" "}
                  {invoiceData.client?.address?.zipCode || ""},{" "}
                  {invoiceData.client?.address?.country || ""}
                </Text>
                {invoiceData.client?.phone && (
                  <Text style={s.textRow}>Phone: {invoiceData.client.phone}</Text>
                )}
                {invoiceData.client?.email && (
                  <Text style={s.textRow}>Email: {invoiceData.client.email}</Text>
                )}
              </View>
              
              <View style={s.metaCol}>
                <Text style={s.metaBoldRow}>Invoice No: {invoiceData.invoiceNumber}</Text>
                <Text style={s.metaBoldRow}>
                  Date: {new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}
                </Text>
                <Text style={s.metaBoldRow}>
                  Due Date: {new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}
                </Text>
                {invoiceData.poNumber && (
                  <Text style={s.metaBoldRow}>PO Number: {invoiceData.poNumber}</Text>
                )}
              </View>
            </View>

            {/* Items Table */}
            <View style={s.table}>
              <View style={s.tableHeaderRow} fixed>
                <Text style={[s.th, { width: col.sr }]}>Sr. No.</Text>
                <Text style={[s.th, { width: col.items }]}>PARTICULAR</Text>
                {hasHSN && <Text style={[s.th, { width: col.hsn }]}>HSN/SAC</Text>}
                <Text style={[s.th, { width: col.qty }]}>QTY</Text>
                <Text style={[s.th, { width: col.rate }]}>RATE</Text>
                <Text style={[s.thLast, { width: col.amt }]}>AMOUNT</Text>
              </View>

              {invoiceData.items.map((item, index) => {
                const isLast = index === invoiceData.items.length - 1;
                return (
                  <View key={index} style={isLast ? [s.tableRow, { borderBottomWidth: 0 }] : s.tableRow} wrap={false}>
                    <Text style={[s.td, { width: col.sr, textAlign: "center" }]}>{index + 1}</Text>
                    <View style={[s.td, { width: col.items }]}>
                      <Text>{item.description}</Text>
                    </View>
                    {hasHSN && (
                      <Text style={[s.td, { width: col.hsn, textAlign: "center" }]}>{item.hsnCode || "-"}</Text>
                    )}
                    <Text style={[s.td, { width: col.qty, textAlign: "center" }]}>
                      {item.quantity} {item.unitType || ""}
                    </Text>
                    <View style={[s.td, { width: col.rate }]}>
                      {item.pricingType === "tiered"
                        ? item.pricingTiers?.map(
                            (t, i) => (
                              <Text key={i} style={{ marginBottom: 2 }}>
                                {t.minValue} – {t.maxValue !== null ? t.maxValue : "Above"}{" "}
                                {item.unitType}: Rs. {t.rate}{" "}
                                {t.rateType === "unitRate" ? `/ ${item.unitType}` : "(slab)"}
                              </Text>
                            )
                          )
                        : <Text>Rs. {(item.baseRate || 0).toFixed(2)}</Text>}
                    </View>
                    <Text style={[s.tdLast, { width: col.amt, textAlign: "center" }]}>
                      Rs. {item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Totals Section */}
            <View style={s.calcWrapper} wrap={false}>
              {invoiceData.subtotal > 0 && (
                <View style={s.calcRow}>
                  <Text style={s.calcLabel}>Sub Total</Text>
                  <Text style={s.calcValue}>Rs. {invoiceData.subtotal.toFixed(2)}</Text>
                </View>
              )}

              {invoiceData.discount > 0 && (
                <>
                  <View style={s.calcRow}>
                    <Text style={s.calcLabel}>Discount</Text>
                    <Text style={s.calcValue}>
                      - {invoiceData.discountType === "fixed" ? "Rs. " : ""}
                      {invoiceData.discount}
                      {invoiceData.discountType === "percentage" ? "%" : ""}
                    </Text>
                  </View>
                  <View style={s.calcRow}>
                    <Text style={s.calcLabel}>Taxable Amount</Text>
                    <Text style={s.calcValue}>Rs. {taxableAmount.toFixed(2)}</Text>
                  </View>
                </>
              )}

              {invoiceData.taxes && invoiceData.taxes.map((tax, index) => (
                <View key={index} style={s.calcRow}>
                  <Text style={s.calcLabel}>{tax.name} @{tax.rate}%</Text>
                  <Text style={s.calcValue}>Rs. {(tax.amount || 0).toFixed(2)}</Text>
                </View>
              ))}

              <View style={[s.calcRow, s.calcRowTopBorder]}>
                <Text style={s.calcLabel}>TOTAL</Text>
                <Text style={s.calcValue}>Rs. {invoiceData.totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Amount in Words */}
            <View style={s.wordsBox} wrap={false}>
              <Text style={s.wordsPrefix}>Amount in words: </Text>
              <Text style={{ fontSize: 9 }}>
                {numberToWords
                  ? numberToWords(invoiceData.totalAmount)
                  : `Rupees ${(invoiceData.totalAmount || 0).toFixed(2)}`} only
              </Text>
            </View>

            {/* Payment Terms */}
            {invoiceData.paymentTerms && (
              <View style={s.termsBox} wrap={false}>
                <Text style={s.termsPrefix}>Payment Terms:</Text>
                <Text style={{ fontSize: 8 }}>{invoiceData.paymentTerms}</Text>
              </View>
            )}

            {/* Bank Details & Footer */}
            <View style={s.bankSigWrapper} wrap={false}>
              <View style={s.bankBox}>
                <Text style={s.bankTitle}>Bank Details:</Text>
                {displayBankDetails?.accountHolderName && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>Account Holder:</Text> {displayBankDetails.accountHolderName}
                  </Text>
                )}
                {displayBankDetails?.bankName && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>Bank Name:</Text> {displayBankDetails.bankName}
                  </Text>
                )}
                {displayBankDetails?.branchName && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>Branch:</Text> {displayBankDetails.branchName}
                  </Text>
                )}
                {displayBankDetails?.accountType && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>Account Type:</Text> {formatAccountType(displayBankDetails.accountType)} Account
                  </Text>
                )}
                {displayBankDetails?.accountNumber && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>Account No:</Text> {displayBankDetails.accountNumber}
                  </Text>
                )}
                {displayBankDetails?.ifscCode && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>IFSC Code:</Text> {displayBankDetails.ifscCode}
                  </Text>
                )}
                {displayBankDetails?.upiId && (
                  <Text style={s.textRow}>
                    <Text style={s.bold}>UPI ID:</Text> {displayBankDetails.upiId}
                  </Text>
                )}
              </View>

              <View style={s.sigBox}>
                <Text style={[s.sigFor, (signatureBase64 && invoiceData.includeSignature !== false) ? { marginBottom: 10 } : {}]}>For {currentUser?.businessName || ""}</Text>
                {signatureBase64 && invoiceData.includeSignature !== false && (
                  <Image 
                    src={signatureBase64} 
                    style={{ width: 100, height: 60, maxWidth: 100, maxHeight: 60, alignSelf: "flex-end", marginBottom: 10 }} 
                  />
                )}
                <Text style={s.sigLabel}>Authorized Signatory</Text>
              </View>
            </View>

            {/* Terms and Conditions */}
            {invoiceData.notes && (
              <View style={s.tcBox} wrap={false}>
                <Text style={s.tcPrefix}>Terms & Conditions:</Text>
                <Text style={{ fontSize: 8 }}>{invoiceData.notes}</Text>
              </View>
            )}

            {/* Standard Footer */}
            <View style={s.footer} fixed>
              <Text style={s.footerText}>E. & O.E.</Text>
              {currentUser?.address?.city && (
                <Text style={s.footerText}>Subject to {currentUser.address.city} jurisdiction</Text>
              )}
              <Text style={s.footerText}>This is a computer generated invoice</Text>
            </View>

          </View>
        </View>
      </Page>
    </Document>
  );
};

export default Template3PDF;
