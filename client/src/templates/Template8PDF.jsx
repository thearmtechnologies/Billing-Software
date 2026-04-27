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
    fontSize: 9, // Slightly reduced base font to fit more content
    padding: 25,
    paddingTop: 20,
    paddingBottom: 20,
    color: "#000",
    backgroundColor: "#fff",
  },

  /* ── Header ────────────────────────────────────── */
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 6,
    marginBottom: 8,
    gap: 12,
  },
  headerRowWithLogo: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 6,
    marginBottom: 8,
    gap: 14,
  },
  logoContainer: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { maxWidth: 72, maxHeight: 72 },
  headerCenter: { textAlign: "center", flex: 1 },
  headerCenterWithLogo: { textAlign: "left", flex: 1 },
  businessName: { fontSize: 28, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  headerDetails: { fontSize: 9, lineHeight: 1.3 },
  headerDetailsSmall: { fontSize: 9, lineHeight: 1.2 },

  /* ── Tax Invoice Title ─────────────────────────── */
  titleBlock: { alignItems: "center", marginBottom: 6 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 8, marginTop: 1 },

  /* ── Two-column layout ─────────────────────────── */
  twoCol: { flexDirection: "row", gap: 10, marginBottom: 8 },
  halfCol: { flex: 1 },

  /* ── Bill-To box ───────────────────────────────── */
  billToBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 6,
  },
  billToLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  clientName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  bodyText: { fontSize: 8, marginBottom: 1, lineHeight: 1.2 },

  /* ── Invoice meta table ────────────────────────── */
  metaTable: { borderWidth: 1, borderColor: "#000" },
  metaRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000" },
  metaRowLast: { flexDirection: "row" },
  metaCellLabel: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 8,
    width: "30%",
  },
  metaCellValue: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    width: "20%",
  },
  metaCellValueWide: {
    padding: 4,
    fontSize: 8,
    flex: 1,
  },

  /* ── Items table ───────────────────────────────── */
  table: { marginBottom: 8 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 20,
  },

  // Column header cells
  th: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  thLast: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  // Data cells
  td: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  tdLast: {
    padding: 4,
    fontSize: 8,
  },
  tdCenter: { textAlign: "center" },
  tdRight: { textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },

  /* ── Totals ────────────────────────────────────── */
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  amountInWords: { fontSize: 8, marginBottom: 6 },
  amountInWordsBold: { fontFamily: "Helvetica-Bold", fontSize: 8 },

  /* ── Tax-breakdown table (compact) ─────────────── */
  taxTable: { marginBottom: 6 },
  taxTh: {
    padding: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  taxTd: {
    padding: 3,
    fontSize: 7,
    borderWidth: 1,
    borderColor: "#000",
  },

  /* ── Bank details + signature ──────────────────── */
  bankSigRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  bankBox: { flex: 1, borderWidth: 1, borderColor: "#000", padding: 5 },
  bankTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 4 },
  bankLine: { fontSize: 7.5, marginBottom: 1.5, lineHeight: 1.2 },
  sigBox: { flex: 1, alignItems: "flex-end", justifyContent: "flex-end" },
  sigLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 30, textAlign: "center" },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 4,
    fontSize: 8,
    textAlign: "center",
    width: "100%",
  },

  /* ── Footer ────────────────────────────────────── */
  footerLine: { borderTopWidth: 1.5, borderTopColor: "#000", marginTop: 8, paddingTop: 5 },
  footerText: { textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 7 },

  /* ── Notes ──────────────────────────────────────── */
  notesBlock: { marginBottom: 6 },
  notesTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 2 },
  notesBody: { fontSize: 7, lineHeight: 1.2 },

  /* ── Tiered pricing container ──────────────────── */
  tierContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 1,
  },
  tierText: {
    fontSize: 7,
    fontFamily: "Helvetica",
    textAlign: "right",
  },
});

// ── Helper: Check if any item has tiered pricing ────────────────
const hasAnyTieredPricing = (items) => {
  return items.some(item => 
    item.pricingType === "tiered" && 
    item.pricingTiers && 
    item.pricingTiers.length > 0
  );
};

// ── Helper: Get column widths based on tiered pricing presence ──
const getColumnWidths = (hasHSN, hasTiered) => {
  if (hasTiered) {
    // With tiered pricing - increased rate column width for better tier display
    if (hasHSN) {
      return { sr: "6%", desc: "32%", hsn: "8%", qty: "8%", rate: "28%", amt: "18%" };
    } else {
      return { sr: "6%", desc: "42%", qty: "8%", rate: "26%", amt: "18%" };
    }
  } else {
    // Without tiered pricing - balanced columns with more space for amount
    if (hasHSN) {
      return { sr: "6%", desc: "38%", hsn: "10%", qty: "10%", rate: "14%", amt: "22%" };
    } else {
      return { sr: "6%", desc: "48%", qty: "10%", rate: "14%", amt: "22%" };
    }
  }
};

// ── Helper: format account type ─────────────────────────────────
const fmtAcct = (t) =>
  t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "";

// ── Helper: render tiered pricing lines ─────────────────────────
const renderTieredLines = (tiers, unitType) => {
  if (!tiers || tiers.length === 0) return null;
  
  return tiers.map((tier, idx) => {
    let rangeText = "";
    if (tier.maxValue !== null && tier.maxValue !== undefined && tier.maxValue !== "") {
      rangeText = `${tier.minValue} – ${tier.maxValue} ${unitType || ""}`;
    } else {
      rangeText = `Above ${tier.minValue} ${unitType || ""}`;
    }
    const slabText = tier.rateType === "unitRate" ? `/ ${unitType || ""}` : "(slab)";
    return (
      <Text key={idx} style={s.tierText}>
        {rangeText}: Rs. {Number(tier.rate).toFixed(2)} {slabText}
      </Text>
    );
  });
};

// ── Helper to format multiline text ─────────────────────────────
const formatMultilineText = (text, style) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => (
    <Text key={idx} style={style}>{line}</Text>
  ));
};

// ── Component ───────────────────────────────────────────────────
const Template8PDF = ({ invoiceData, numberToWords, currentUser, copyType, signatureBase64, logoBase64 }) => {
  let displayBankDetails = invoiceData?.bankDetails;

  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );
  const hasTiered = hasAnyTieredPricing(invoiceData.items);
  const col = getColumnWidths(hasHSN, hasTiered);
  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  const copyLabel = copyType || "ORIGINAL FOR RECIPIENT";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ═══ HEADER ═══ */}
        {(logoBase64 && invoiceData.includeLogo !== false) ? (
          <View style={s.headerRowWithLogo}>
            <View style={s.logoContainer}>
              <Image src={logoBase64} style={s.logo} />
            </View>
            <View style={s.headerCenterWithLogo}>
              <Text style={s.businessName}>
                {currentUser?.businessName?.toUpperCase() || ""}
              </Text>
              <Text style={s.headerDetails}>
                Office: {currentUser?.address?.street ? currentUser.address.street + ", " : ""}
                {currentUser?.address?.city || ""}, {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""}
              </Text>
              <Text style={s.headerDetails}>
                Phone: {currentUser?.phone || ""} | Email: {currentUser?.email || ""} | {currentUser?.taxId ? `GSTIN/UIN: ${currentUser.taxId}` : ""}
              </Text>
              {(currentUser?.taxId || currentUser?.udyamNo || currentUser?.panNumber) && (
                <Text style={s.headerDetailsSmall}>
                  {currentUser?.taxId && (currentUser?.udyamNo || currentUser?.panNumber) ? " | " : ""}
                  {currentUser?.udyamNo ? `Udyam No.: ${currentUser.udyamNo}` : ""}
                  {currentUser?.udyamNo && currentUser?.panNumber ? " | " : ""}
                  {currentUser?.panNumber ? `PAN: ${currentUser.panNumber}` : ""}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={s.headerRow}>
            <View style={s.headerCenter}>
              <Text style={s.businessName}>
                {currentUser?.businessName?.toUpperCase() || ""}
              </Text>
              <Text style={s.headerDetails}>
                Office: {currentUser?.address?.street ? currentUser.address.street + ", " : ""}
                {currentUser?.address?.city || ""}, {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""}
              </Text>
              <Text style={s.headerDetails}>
                Phone: {currentUser?.phone || ""} | Email: {currentUser?.email || ""}
              </Text>
              {(currentUser?.taxId || currentUser?.udyamNo || currentUser?.panNumber) && (
                <Text style={s.headerDetailsSmall}>
                  {currentUser?.taxId ? `GSTIN/UIN: ${currentUser.taxId}` : ""}
                  {currentUser?.taxId && (currentUser?.udyamNo || currentUser?.panNumber) ? " | " : ""}
                  {currentUser?.udyamNo ? `Udyam No.: ${currentUser.udyamNo}` : ""}
                  {currentUser?.udyamNo && currentUser?.panNumber ? " | " : ""}
                  {currentUser?.panNumber ? `PAN: ${currentUser.panNumber}` : ""}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ═══ TITLE ═══ */}
        <View style={[s.titleBlock, { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }]}>
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
              Invoice No: <Text style={{ fontFamily: "Helvetica" }}>{invoiceData.invoiceNumber || "-"}</Text>
            </Text>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
              Invoice Date: <Text style={{ fontFamily: "Helvetica" }}>{invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB") : "-"}</Text>
            </Text>
          </View>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>TAX INVOICE</Text>
            <Text style={s.subtitle}>({copyLabel})</Text>
          </View>

          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
              Due Date: <Text style={{ fontFamily: "Helvetica" }}>{invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString("en-GB") : "-"}</Text>
            </Text>
          </View>
        </View>

        {/* ═══ BILL TO + SHIP TO ═══ */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 8, justifyContent: "space-between" }}>
          {/* Left: Bill To */}
          <View style={[s.billToBox, { flex: 1 }]}>
            <Text style={s.billToLabel}>Bill To:</Text>
            <Text style={s.clientName}>{invoiceData.client?.companyName || ""}</Text>
            {formatMultilineText(invoiceData.client?.address?.street || "", s.bodyText)}
            <Text style={s.bodyText}>
              {invoiceData.client?.address?.city || ""},{" "}
              {invoiceData.client?.address?.state || ""} -{" "}
              {invoiceData.client?.address?.zipCode || ""}
            </Text>
            {invoiceData.client?.gstNumber && (
              <Text style={s.bodyText}>GSTIN/UIN: {invoiceData.client.gstNumber}</Text>
            )}
            {invoiceData.client?.panNumber && (
              <Text style={s.bodyText}>PAN: {invoiceData.client.panNumber}</Text>
            )}
            <Text style={s.bodyText}>
              State Name: {invoiceData.client?.address?.state || ""}, Code:{" "}
              {invoiceData.client?.address?.zipCode?.substring(0, 2) || ""}
            </Text>
          </View>

          {/* Right: Ship To or Invoice Details */}
          {invoiceData.shippingAddress ? (
            <View style={[s.billToBox, { flex: 1 }]}>
              <Text style={s.billToLabel}>Ship To:</Text>
              {typeof invoiceData.shippingAddress === "string" ? (
                formatMultilineText(invoiceData.shippingAddress, s.bodyText)
              ) : (
                <>
                  {formatMultilineText(invoiceData.shippingAddress.street || "", s.bodyText)}
                  {(invoiceData.shippingAddress.city || invoiceData.shippingAddress.state || invoiceData.shippingAddress.zipCode) && (
                    <Text style={s.bodyText}>
                      {[
                        invoiceData.shippingAddress.city,
                        invoiceData.shippingAddress.state,
                        invoiceData.shippingAddress.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  )}
                </>
              )}
            </View>
          ) : (
            <View style={[s.billToBox, { flex: 1 }]}>
              <Text style={s.billToLabel}>Invoice Details:</Text>
              <Text style={s.bodyText}>
                <Text style={s.bold}>Invoice No: </Text>
                {invoiceData.invoiceNumber || "-"}
              </Text>
              <Text style={s.bodyText}>
                <Text style={s.bold}>Invoice Date: </Text>
                {invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB") : "-"}
              </Text>
              <Text style={s.bodyText}>
                <Text style={s.bold}>Due Date: </Text>
                {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString("en-GB") : "-"}
              </Text>
            </View>
          )}
        </View>

        {/* ═══ ITEMS TABLE ═══ */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeaderRow} fixed>
            <Text style={[s.th, { width: col.sr }]}>Sr.</Text>
            <Text style={[s.th, { width: col.desc }]}>Description of Goods</Text>
            {hasHSN && <Text style={[s.th, { width: col.hsn }]}>HSN/SAC</Text>}
            <Text style={[s.th, { width: col.qty }]}>Qty</Text>
            <Text style={[s.th, { width: col.rate }]}>Rate</Text>
            <Text style={[s.thLast, { width: col.amt }]}>Amount</Text>
          </View>

          {/* Data rows */}
          {invoiceData.items.map((item, index) => (
            <View
              key={item._id || `item-${index}`}
              style={s.tableRow}
              wrap={false}
            >
              <Text style={[s.td, s.tdCenter, { width: col.sr }]}>
                {index + 1}
              </Text>
              <View style={[s.td, { width: col.desc }]}>
                <Text style={s.bold}>{item.description}</Text>
                {item.notes && (
                  <Text style={{ fontSize: 7, marginTop: 1 }}>{item.notes}</Text>
                )}
              </View>
              {hasHSN && (
                <Text style={[s.td, s.tdCenter, { width: col.hsn }]}>
                  {item.hsnCode || ""}
                </Text>
              )}
              <Text style={[s.td, s.tdCenter, { width: col.qty }]}>
                {item.quantity} {item.unitType || ""}
              </Text>
              <View style={[s.td, s.tdRight, { width: col.rate, paddingHorizontal: 2, justifyContent: "center" }]}>
                {item.pricingType === "tiered" && item.pricingTiers && item.pricingTiers.length > 0 ? (
                  <View style={s.tierContainer}>
                    {renderTieredLines(item.pricingTiers, item.unitType)}
                  </View>
                ) : (
                  <Text style={{ fontSize: 8 }}>Rs. {(item.baseRate || 0).toFixed(2)}</Text>
                )}
              </View>
              <Text style={[s.tdLast, s.tdRight, { width: col.amt, fontWeight: 'bold' }]}>
                Rs. {item.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Tax rows */}
          {invoiceData.taxes && invoiceData.taxes.length > 0 && (
            <View style={s.tableRow} wrap={false}>
              <View
                style={[
                  s.td,
                  { 
                    width: hasHSN 
                      ? `${parseFloat(col.sr) + parseFloat(col.desc) + parseFloat(col.hsn)}%` 
                      : `${parseFloat(col.sr) + parseFloat(col.desc)}%`,
                    flexDirection: "column",
                    textAlign: "right",
                    paddingRight: 4
                  }
                ]}
              >
                {invoiceData.taxes.map((tax, idx) => (
                  <Text key={idx} style={[s.bold, { textAlign: "right", fontSize: 7 }]}>
                    {tax.name} @{tax.rate}%
                  </Text>
                ))}
              </View>
              <Text style={[s.td, s.tdCenter, { width: col.qty }]}> </Text>
              <Text style={[s.td, s.tdCenter, { width: col.rate }]}> </Text>
              <View style={[s.tdLast, s.tdRight, { width: col.amt, flexDirection: "column" }]}>
                {invoiceData.taxes.map((tax, idx) => (
                  <Text key={idx} style={[s.bold, { textAlign: "right", fontSize: 7 }]}>
                    Rs. {tax.amount.toFixed(2)}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Total row */}
          <View style={s.tableRow} wrap={false}>
            <View
              style={[
                s.td,
                s.tdRight,
                { 
                  width: hasHSN 
                    ? `${parseFloat(col.sr) + parseFloat(col.desc) + parseFloat(col.hsn)}%` 
                    : `${parseFloat(col.sr) + parseFloat(col.desc)}%`,
                }
              ]}
            >
              <Text style={[s.totalLabel, { textAlign: "right" }]}>Total</Text>
            </View>
            <Text style={[s.td, s.tdCenter, { width: col.qty }]}> </Text>
            <Text style={[s.td, s.tdCenter, { width: col.rate }]}> </Text>
            <Text style={[s.tdLast, s.tdRight, s.totalLabel, { width: col.amt }]}>
              Rs. {invoiceData.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ═══ AMOUNT IN WORDS ═══ */}
        <View style={s.amountInWords}>
          <Text style={s.amountInWordsBold}>Amount Chargeable (in words)</Text>
          <Text style={s.amountInWordsBold}>
            INR{" "}
            {numberToWords
              ? numberToWords(invoiceData.totalAmount)
              : invoiceData.totalAmount.toFixed(2)}{" "}
          </Text>
        </View>

        {/* ═══ BANK DETAILS + SIGNATURE ═══ */}
        <View style={s.bankSigRow} wrap={false}>
          {displayBankDetails && (
            <View style={s.bankBox}>
              <Text style={s.bankTitle}>Company Bank Details</Text>
              {displayBankDetails.accountHolderName && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>A/c Holder:</Text> {displayBankDetails.accountHolderName}
                </Text>
              )}
              {displayBankDetails.bankName && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Bank:</Text> {displayBankDetails.bankName}
                </Text>
              )}
              {displayBankDetails.branchName && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Branch:</Text> {displayBankDetails.branchName}
                </Text>
              )}
              {displayBankDetails.accountType && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Type:</Text> {fmtAcct(displayBankDetails.accountType)}
                </Text>
              )}
              {displayBankDetails.accountNumber && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>A/c No.:</Text> {displayBankDetails.accountNumber}
                </Text>
              )}
              {displayBankDetails.ifscCode && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>IFSC:</Text> {displayBankDetails.ifscCode}
                </Text>
              )}
              {displayBankDetails.upiId && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>UPI ID:</Text> {displayBankDetails.upiId}
                </Text>
              )}
            </View>
          )}

          <View style={s.sigBox}>
            <View style={{ width: 200, alignItems: "center" }}>
              <Text style={[s.sigLabel, (signatureBase64 && invoiceData.includeSignature !== false) ? { marginBottom: 8 } : {}]}>
                for {currentUser?.businessName || ""}
              </Text>
              {signatureBase64 && invoiceData.includeSignature !== false && (
                <Image 
                  src={signatureBase64} 
                  style={{ width: 140, height: 50, objectFit: "contain", marginBottom: 6 }} 
                />
              )}
              <View style={s.sigLine}>
                <Text>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ TERMS ═══ */}
        {invoiceData.notes && (
          <View style={s.notesBlock}>
            <Text style={s.notesTitle}>Terms & Conditions:</Text>
            <Text style={s.notesBody}>{invoiceData.notes}</Text>
          </View>
        )}

        {/* ═══ FOOTER ═══ */}
        <View style={s.footerLine}>
          <Text style={s.footerText}>This is a Computer Generated Invoice</Text>
        </View>
      </Page>
    </Document>
  );
};

export default Template8PDF;