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
    fontSize: 9,
    padding: 30,
    paddingTop: "45mm",
    color: "#000",
    backgroundColor: "#fff",
    lineHeight: 1.4,
  },
  bold: { fontFamily: "Helvetica-Bold" },

  /* ── Bill From / To ────────────────────────────── */
  topGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  halfBox: { width: "48%" },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  companyName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  textRow: { fontSize: 9, marginBottom: 2 },

  /* ── Meta Info (Rounded Box) ───────────────────── */
  metaBox: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  metaItem: { width: "23%" },
  metaLabel: { fontSize: 8, color: "#555", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },

  /* ── Items Table ───────────────────────────────── */
  tableContainer: {
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
  },
  tableRow: {
    flexDirection: "row",
  },
  th: {
    padding: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  td: {
    padding: 8,
    fontSize: 9,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderTopWidth: 0,
  },

  /* ── Totals Section ────────────────────────────── */
  totalsWrapper: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  totalsBox: { width: "50%" },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#dee2e6",
  },
  calcMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 6,
    marginTop: 4,
  },
  calcLabel: { fontSize: 9 },
  calcValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  calcMainText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#fff" },

  /* ── Colored Blocks ────────────────────────────── */
  coloredBlock: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  blockTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  blockBody: { fontSize: 9 },

  wordBlock: { backgroundColor: "#f8f9fa" },
  termBlock: { backgroundColor: "#fff3cd", borderColor: "#ffeaa7", borderWidth: 1 },
  noteBlock: { backgroundColor: "#d1ecf1", borderColor: "#bee5eb", borderWidth: 1 },
  tcBlock:   { backgroundColor: "#e2e3e5" },

  /* ── Bank & Sig ────────────────────────────────── */
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "#dee2e6",
  },
  bankBox: { width: "60%" },
  sigBox: { width: "35%", alignItems: "center" },
  sigFor: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 40 },
  sigLine: {
    fontSize: 9, 
    color: "#6c757d", 
    borderTopWidth: 1, 
    borderColor: "#adb5bd", 
    paddingTop: 5,
    width: "100%",
    textAlign: "center"
  },
});

const formatAccountType = (type) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const Template4PDF = ({ invoiceData, currentUser, numberToWords, signatureBase64 }) => {
  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );
  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  const col = hasHSN
    ? { sr: "6%", desc: "38%", hsn: "12%", qty: "10%", rate: "20%", amt: "14%" }
    : { sr: "6%", desc: "48%", qty: "12%", rate: "20%", amt: "14%" };

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
        
        {/* 1. Bill From & Bill To */}
        <View style={s.topGrid}>
          {/* Bill From */}
          <View style={s.halfBox}>
            <Text style={s.sectionTitle}>Bill From:</Text>
            <Text style={s.companyName}>{currentUser?.businessName || ""}</Text>
            <Text style={s.textRow}>
              {currentUser?.address?.street || ""}, {currentUser?.address?.city || ""}
            </Text>
            <Text style={s.textRow}>
              {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""}
            </Text>
            <Text style={s.textRow}>GST: {currentUser?.taxId || "N/A"}</Text>
            {currentUser?.phone && <Text style={s.textRow}>Phone: {currentUser.phone}</Text>}
            {currentUser?.email && <Text style={s.textRow}>Email: {currentUser.email}</Text>}
          </View>

          {/* Bill To */}
          <View style={s.halfBox}>
            <Text style={s.sectionTitle}>Bill To:</Text>
            <Text style={s.companyName}>{invoiceData.client?.companyName || ""}</Text>
            <Text style={s.textRow}>
              {invoiceData.client?.address?.street || ""}, {invoiceData.client?.address?.city || ""}
            </Text>
            <Text style={s.textRow}>
              {invoiceData.client?.address?.state || ""} - {invoiceData.client?.address?.zipCode || ""}
            </Text>
            <Text style={s.textRow}>GST: {invoiceData.client?.gstNumber || "N/A"}</Text>
            {invoiceData.client?.phone && <Text style={s.textRow}>Phone: {invoiceData.client.phone}</Text>}
            {invoiceData.client?.email && <Text style={s.textRow}>Email: {invoiceData.client.email}</Text>}
          </View>
        </View>

        {/* 2. Metadata Block */}
        <View style={s.metaBox}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Invoice Number</Text>
            <Text style={s.metaValue}>{invoiceData.invoiceNumber}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Invoice Date</Text>
            <Text style={s.metaValue}>{new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Due Date</Text>
            <Text style={s.metaValue}>{new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}</Text>
          </View>
          {invoiceData.poNumber && (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>PO Number</Text>
              <Text style={s.metaValue}>{invoiceData.poNumber}</Text>
            </View>
          )}
        </View>

        {/* 3. Items Table */}
        <View style={s.tableContainer}>
          <View style={s.tableHeaderRow} fixed>
            <Text style={[s.th, { width: col.sr, textAlign: "center" }]}>#</Text>
            <Text style={[s.th, { width: col.desc, textAlign: "left", borderLeftWidth: 0 }]}>Description</Text>
            {hasHSN && <Text style={[s.th, { width: col.hsn, textAlign: "center", borderLeftWidth: 0 }]}>HSN/SAC</Text>}
            <Text style={[s.th, { width: col.qty, textAlign: "center", borderLeftWidth: 0 }]}>Qty</Text>
            <Text style={[s.th, { width: col.rate, textAlign: "center", borderLeftWidth: 0 }]}>Rate</Text>
            <Text style={[s.th, { width: col.amt, textAlign: "center", borderLeftWidth: 0 }]}>Amount</Text>
          </View>

          {invoiceData.items.map((item, index) => (
            <View key={index} style={s.tableRow} wrap={false}>
              <Text style={[s.td, { width: col.sr, textAlign: "center" }]}>{index + 1}</Text>
              <View style={[s.td, { width: col.desc, borderLeftWidth: 0 }]}>
                <Text>{item.description}</Text>
              </View>
              {hasHSN && (
                <Text style={[s.td, { width: col.hsn, textAlign: "center", borderLeftWidth: 0 }]}>
                  {item.hsnCode || "-"}
                </Text>
              )}
              <Text style={[s.td, { width: col.qty, textAlign: "center", borderLeftWidth: 0 }]}>
                {item.quantity} {item.unitType || ""}
              </Text>
              <View style={[s.td, { width: col.rate, borderLeftWidth: 0 }]}>
                {item.pricingType === "tiered"
                  ? item.pricingTiers?.map(
                      (t, i) => (
                        <Text key={i} style={{ marginBottom: 2 }}>
                          {t.minValue} – {t.maxValue !== null ? t.maxValue : "Above"} {item.unitType}: Rs. {t.rate} {t.rateType === "unitRate" ? `/ ${item.unitType}` : "(slab)"}
                        </Text>
                      )
                    )
                  : <Text>Rs. {(item.baseRate || 0).toFixed(2)}</Text>}
              </View>
              <Text style={[s.td, { width: col.amt, textAlign: "center", fontFamily: "Helvetica-Bold", borderLeftWidth: 0 }]}>
                Rs. {item.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Totals */}
        <View style={s.totalsWrapper} wrap={false}>
          <View style={s.totalsBox}>
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
                    -Rs. {invoiceData.discount}{invoiceData.discountType === "percentage" ? "%" : ""}
                  </Text>
                </View>
                <View style={s.calcRow}>
                  <Text style={s.calcLabel}>Taxable Amount</Text>
                  <Text style={s.calcValue}>Rs. {taxableAmount.toFixed(2)}</Text>
                </View>
              </>
            )}

            {invoiceData.taxes && invoiceData.taxes.length > 0 && invoiceData.taxes.map((tax, index) => (
              <View key={index} style={s.calcRow}>
                <Text style={s.calcLabel}>{tax.name} @{tax.rate}%</Text>
                <Text style={s.calcValue}>Rs. {(tax.amount || 0).toFixed(2)}</Text>
              </View>
            ))}

            <View style={s.calcMainRow}>
              <Text style={s.calcMainText}>TOTAL</Text>
              <Text style={s.calcMainText}>Rs. {invoiceData.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 5. Info Blocks */}
        <View style={[s.coloredBlock, s.wordBlock]} wrap={false}>
          <Text style={s.blockTitle}>Amount in Words:</Text>
          <Text style={s.blockBody}>
            {numberToWords ? numberToWords(invoiceData.totalAmount) : `Rupees ${(invoiceData.totalAmount || 0).toFixed(2)}`} only
          </Text>
        </View>

        {invoiceData.paymentTerms && (
          <View style={[s.coloredBlock, s.termBlock]} wrap={false}>
            <Text style={s.blockTitle}>Payment Terms:</Text>
            <Text style={s.blockBody}>{invoiceData.paymentTerms}</Text>
          </View>
        )}

        {invoiceData.notes && (
          <View style={[s.coloredBlock, s.noteBlock]} wrap={false}>
            <Text style={s.blockTitle}>Notes:</Text>
            <Text style={s.blockBody}>{invoiceData.notes}</Text>
          </View>
        )}

        {invoiceData.termsAndConditions && (
          <View style={[s.coloredBlock, s.tcBlock]} wrap={false}>
            <Text style={s.blockTitle}>Terms & Conditions:</Text>
            <Text style={s.blockBody}>{invoiceData.termsAndConditions}</Text>
          </View>
        )}

        {/* 6. Footer (Bank & Sign) */}
        <View style={s.footerRow} wrap={false}>
          <View style={s.bankBox}>
            <Text style={s.sectionTitle}>Bank Details:</Text>
            {displayBankDetails?.accountHolderName && (
              <Text style={s.textRow}>
                <Text style={s.bold}>Account Holder:</Text> {displayBankDetails.accountHolderName}
              </Text>
            )}
            {displayBankDetails?.bankName && (
              <Text style={s.textRow}>
                <Text style={s.bold}>Bank:</Text> {displayBankDetails.bankName}
              </Text>
            )}
            {displayBankDetails?.accountNumber && (
              <Text style={s.textRow}>
                <Text style={s.bold}>Account No:</Text> {displayBankDetails.accountNumber}
              </Text>
            )}
            {displayBankDetails?.ifscCode && (
              <Text style={s.textRow}>
                <Text style={s.bold}>IFSC:</Text> {displayBankDetails.ifscCode}
              </Text>
            )}
          </View>
          <View style={s.sigBox}>
            <Text style={[s.sigFor, signatureBase64 ? { marginBottom: 10 } : {}]}>For {currentUser?.businessName || ""}</Text>
            {signatureBase64 && (
              <Image 
                src={signatureBase64} 
                style={{ width: 100, height: 40, objectFit: "contain", alignSelf: "center", marginBottom: 10 }} 
              />
            )}
            <Text style={s.sigLine}>Authorized Signatory</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default Template4PDF;
