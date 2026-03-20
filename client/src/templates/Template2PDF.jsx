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
    padding: 30,
    color: "#000",
    backgroundColor: "#fff",
    lineHeight: 1.4,
  },
  bold: { fontFamily: "Helvetica-Bold" },

  /* ── Header ────────────────────────────────────── */
  headerWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: { width: "50%" },
  headerRight: { width: "50%", textAlign: "right" },
  createdLabel: { fontSize: 8, color: "#4B5563", marginBottom: 3 },
  brandNameRow: { flexDirection: "row", alignItems: "center" },
  brandOrange: { color: "#F97316", fontFamily: "Helvetica-Bold", fontSize: 10 },
  brandDark: { fontFamily: "Helvetica-Bold", fontSize: 10, marginLeft: 3 },
  invoiceTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  invoiceSub: { fontSize: 8, color: "#4B5563" },

  /* ── Sections ──────────────────────────────────── */
  sectionBox: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 15,
  },
  sectionHeader: {
    padding: 6,
    backgroundColor: "#E9D5FF",
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
  },
  sectionHeaderTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  sectionBody: {
    padding: 8,
  },
  textRow: { fontSize: 10, marginBottom: 2 },

  /* ── 3-col Meta Info ───────────────────────────── */
  metaWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  metaBlock: { width: "30%" },
  metaLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  metaValue: { fontSize: 10 },

  /* ── Items Table ───────────────────────────────── */
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#E9D5FF",
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
    padding: 6,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  td: { fontSize: 9 },

  /* ── Calculation Box ───────────────────────────── */
  calcWrapper: { marginBottom: 15 },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#E9D5FF",
    padding: 6,
  },
  calcRowBorderTop: {
    borderTopWidth: 2,
    borderColor: "#D1D5DB",
  },
  calcLabel: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  calcValue: { fontSize: 10 },

  /* ── 2-col Bottom ──────────────────────────────── */
  bottomWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  bankBox: {
    width: "48%",
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 4,
  },
  sigBox: {
    width: "48%",
    textAlign: "right",
  },
  bankTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#2c3e50" },
  bankRow: { fontSize: 9, marginBottom: 2 },
  sigLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 40 },
  sigLine: { fontSize: 9, color: "#4B5563" },
});

// Format account type
const formatAccountType = (type) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const Template2PDF = ({ invoiceData, currentUser, numberToWords, copyType, signatureBase64 }) => {
  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );

  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  // Column Distribution
  const col = hasHSN
    ? { sr: "8%", items: "38%", hsn: "12%", qty: "10%", rate: "18%", amt: "14%" }
    : { sr: "8%", items: "48%", qty: "12%", rate: "18%", amt: "14%" };

  let displayBankDetails = invoiceData?.bankDetails;
  if (!displayBankDetails) {
    if (currentUser?.bankAccounts && currentUser.bankAccounts.length > 0) {
      displayBankDetails = currentUser.bankAccounts.find(a => a.isPrimary) || currentUser.bankAccounts[0];
    } else if (currentUser?.bankDetails) {
      displayBankDetails = currentUser.bankDetails;
    }
  }

  const copyLabel = copyType || "ORIGINAL FOR RECIPIENT";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* 1. Header */}
        <View style={s.headerWrap}>
          <View style={s.headerLeft}>
            <Text style={s.createdLabel}>Created using</Text>
            <View style={s.brandNameRow}>
              <Text style={s.brandOrange}>ARM Technologies </Text>
              <Text style={s.brandDark}>Billing Software</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>TAX INVOICE</Text>
            <Text style={s.invoiceSub}>{copyLabel}</Text>
          </View>
        </View>

        {/* 2. Company Info Section */}
        <View style={s.sectionBox}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>
              {currentUser?.businessName?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={s.sectionBody}>
            <Text style={s.textRow}>
              {currentUser?.address?.street || ""}, {currentUser?.address?.city || ""},{" "}
              {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""},{" "}
              {currentUser?.address?.country || ""}
            </Text>
            <Text style={s.textRow}>GST No: {currentUser?.taxId || "N/A"}</Text>
            <Text style={s.textRow}>Mobile: {currentUser?.phone || "N/A"}</Text>
            <Text style={s.textRow}>Email: {currentUser?.email || "N/A"}</Text>
          </View>
        </View>

        {/* 3. Invoice Details Grid */}
        <View style={s.metaWrapper}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Invoice No.</Text>
            <Text style={s.metaValue}>{invoiceData.invoiceNumber}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Invoice Date</Text>
            <Text style={s.metaValue}>
              {new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}
            </Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Due Date</Text>
            <Text style={s.metaValue}>
              {new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}
            </Text>
          </View>
        </View>

        {/* 4. Bill To Section */}
        <View style={s.sectionBox}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>BILL TO</Text>
          </View>
          <View style={s.sectionBody}>
            <Text style={[s.textRow, s.bold]}>
              {invoiceData.client?.companyName?.toUpperCase() || ""}
            </Text>
            <Text style={s.textRow}>
              {invoiceData.client?.address?.street || ""},{" "}
              {invoiceData.client?.address?.city || ""},{" "}
              {invoiceData.client?.address?.state || ""} -{" "}
              {invoiceData.client?.address?.zipCode || ""},{" "}
              {invoiceData.client?.address?.country || ""}
            </Text>
            <Text style={s.textRow}>GST No: {invoiceData.client?.gstNumber || "N/A"}</Text>
            {invoiceData.client?.phone && (
              <Text style={s.textRow}>Phone: {invoiceData.client.phone}</Text>
            )}
            {invoiceData.client?.email && (
              <Text style={s.textRow}>Email: {invoiceData.client.email}</Text>
            )}
          </View>
        </View>

        {/* 5. Items Table */}
        <View style={s.sectionBox}>
          <View style={s.tableHeaderRow} fixed>
            <Text style={[s.th, { width: col.sr, textAlign: "center" }]}>S.NO.</Text>
            <Text style={[s.th, { width: col.items }]}>ITEMS</Text>
            {hasHSN && <Text style={[s.th, { width: col.hsn, textAlign: "center" }]}>HSN/SAC</Text>}
            <Text style={[s.th, { width: col.qty, textAlign: "center" }]}>QTY</Text>
            <Text style={[s.th, { width: col.rate, textAlign: "center" }]}>RATE</Text>
            <Text style={[s.th, { width: col.amt, textAlign: "center" }]}>AMOUNT</Text>
          </View>
          
          {invoiceData.items.map((item, index) => (
            <View key={index} style={s.tableRow} wrap={false}>
              <Text style={[s.td, { width: col.sr, textAlign: "center" }]}>{index + 1}</Text>
              <View style={[s.td, { width: col.items }]}>
                <Text>{item.description}</Text>
                {item.notes && <Text style={{ fontSize: 7, marginTop: 2, color: "#555" }}>{item.notes}</Text>}
              </View>
              {hasHSN && (
                <Text style={[s.td, { width: col.hsn, textAlign: "center" }]}>
                  {item.hsnCode || "-"}
                </Text>
              )}
              <Text style={[s.td, { width: col.qty, textAlign: "center" }]}>
                {item.quantity} {item.unitType || ""}
              </Text>
              <Text style={[s.td, { width: col.rate, textAlign: "center" }]}>
                {item.pricingType === "tiered"
                  ? item.pricingTiers?.map(
                      (t) =>
                        `${t.minValue}–${t.maxValue !== null ? t.maxValue : "Above"} ${item.unitType}: Rs. ${t.rate}`
                    ).join("\n")
                  : `Rs. ${(item.baseRate || 0).toFixed(2)}`}
              </Text>
              <Text style={[s.td, { width: col.amt, textAlign: "center" }]}>
                Rs. {item.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* 6. Calculation Section */}
        <View style={s.calcWrapper} wrap={false}>
          {invoiceData.subtotal > 0 && (
            <View style={s.calcRow}>
              <Text style={[s.calcLabel, { width: "80%" }]}>Sub Total:</Text>
              <Text style={[s.calcValue, { width: "20%", textAlign: "right" }]}>
                Rs. {invoiceData.subtotal.toFixed(2)}
              </Text>
            </View>
          )}

          {invoiceData.discount > 0 && (
            <View wrap={false}>
              <View style={s.calcRow}>
                <Text style={[s.calcLabel, { width: "80%" }]}>Discount:</Text>
                <Text style={[s.calcValue, { width: "20%", textAlign: "right" }]}>
                  - {invoiceData.discountType === "fixed" ? "Rs. " : ""}
                  {invoiceData.discount}
                  {invoiceData.discountType === "percentage" ? "%" : ""}
                </Text>
              </View>
              <View style={s.calcRow}>
                <Text style={[s.calcLabel, { width: "80%" }]}>Taxable Amount:</Text>
                <Text style={[s.calcValue, { width: "20%", textAlign: "right" }]}>
                  Rs. {taxableAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {invoiceData.taxes && invoiceData.taxes.map((tax, index) => (
            <View key={index} style={s.calcRow}>
              <Text style={[s.calcLabel, { width: "80%" }]}>
                {tax.name} @{tax.rate}%:
              </Text>
              <Text style={[s.calcValue, { width: "20%", textAlign: "right" }]}>
                Rs. {(tax.amount || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[s.calcRow, s.calcRowBorderTop]}>
            <Text style={[s.calcLabel, { width: "80%" }]}>TOTAL:</Text>
            <Text style={[s.calcValue, { width: "20%", textAlign: "right" }]}>
              Rs. {invoiceData.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 7. Amount in Words */}
        <View style={[s.sectionBox, { marginBottom: 15 }]} wrap={false}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>Total Amount (in words)</Text>
          </View>
          <View style={s.sectionBody}>
            <Text style={s.textRow}>
              {numberToWords
                ? numberToWords(invoiceData.totalAmount)
                : `Rupees ${(invoiceData.totalAmount || 0).toFixed(2)} only`}
            </Text>
          </View>
        </View>

        {/* 8. Payment Terms */}
        {invoiceData.paymentTerms && (
          <View style={[s.sectionBox, { backgroundColor: "#f9fafb" }]} wrap={false}>
            <View style={s.sectionBody}>
              <Text style={[s.calcLabel, { marginBottom: 4 }]}>Payment Terms:</Text>
              <Text style={s.textRow}>{invoiceData.paymentTerms}</Text>
            </View>
          </View>
        )}

        {/* 9. Bank details & Signature */}
        <View style={s.bottomWrapper} wrap={false}>
          <View style={s.bankBox}>
            <Text style={s.bankTitle}>Bank Details</Text>
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

          <View style={s.sigBox}>
            <Text style={[s.sigLabel, signatureBase64 ? { marginBottom: 10 } : {}]}>For {currentUser?.businessName || ""},</Text>
            {signatureBase64 && (
              <Image 
                src={signatureBase64} 
                style={{ width: 100, height: 40, objectFit: "contain", alignSelf: "flex-end", marginBottom: 10 }} 
              />
            )}
            <Text style={s.sigLine}>Authorized Signatory</Text>
          </View>
        </View>

        {/* 10. Terms and Conditions */}
        {invoiceData.notes && (
          <View style={{ borderTopWidth: 1, borderColor: "#D1D5DB", paddingTop: 8, marginTop: 'auto' }}>
            <Text style={[s.calcLabel, { marginBottom: 4 }]}>Terms & Conditions:</Text>
            <Text style={[s.textRow, { color: "#4B5563" }]}>{invoiceData.notes}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
};

export default Template2PDF;
