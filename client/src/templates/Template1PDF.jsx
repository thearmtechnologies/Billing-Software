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
    fontSize: 10,
    padding: 30,
    color: "#000",
    backgroundColor: "#fff",
  },

  /* ── Header ────────────────────────────────────── */
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 8,
    marginBottom: 14,
    gap: 12,
  },
  headerRowWithLogo: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 8,
    marginBottom: 14,
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
  headerDetails: { fontSize: 9, lineHeight: 1.4 },

  /* ── Tax Invoice Title ─────────────────────────── */
  titleBlock: { alignItems: "center", marginBottom: 10 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, marginTop: 2 },

  /* ── Two-column layout ─────────────────────────── */
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 12 },
  halfCol: { flex: 1 },

  /* ── Bill-To box ───────────────────────────────── */
  billToBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
  },
  billToLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  bodyText: { fontSize: 10, marginBottom: 1 },

  /* ── Invoice meta table ────────────────────────── */
  metaTable: { borderWidth: 1, borderColor: "#000" },
  metaRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000" },
  metaRowLast: { flexDirection: "row" },
  metaCellLabel: {
    padding: 5,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 10,
    width: "30%",
  },
  metaCellValue: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000",
    width: "20%",
  },
  metaCellValueWide: {
    padding: 5,
    fontSize: 10,
    flex: 1,
  },

  /* ── Items table ───────────────────────────────── */
  table: { marginBottom: 12 },
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
    minHeight: 22,
  },

  // Column header cells
  th: {
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  thLast: {
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  // Data cells
  td: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  tdLast: {
    padding: 5,
    fontSize: 10,
  },
  tdCenter: { textAlign: "center" },
  tdRight: { textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },

  /* ── Totals ────────────────────────────────────── */
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  amountInWords: { fontSize: 10, marginBottom: 10 },
  amountInWordsBold: { fontFamily: "Helvetica-Bold", fontSize: 10 },

  /* ── Tax-breakdown table (compact) ─────────────── */
  taxTable: { marginBottom: 10 },
  taxTh: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  taxTd: {
    padding: 4,
    fontSize: 8,
    borderWidth: 1,
    borderColor: "#000",
  },

  /* ── Bank details + signature ──────────────────── */
  bankSigRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  bankBox: { flex: 1, borderWidth: 1, borderColor: "#000", padding: 10 },
  bankTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 6 },
  bankLine: { fontSize: 10, marginBottom: 2 },
  sigBox: { flex: 1, alignItems: "flex-end", justifyContent: "flex-end" },
  sigLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 60, textAlign: "center" },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 6,
    fontSize: 10,
    textAlign: "center",
    width: "100%",
  },

  /* ── Footer ────────────────────────────────────── */
  footerLine: { borderTopWidth: 2, borderTopColor: "#000", marginTop: 20, paddingTop: 8 },
  footerText: { textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 9 },

  /* ── Notes ──────────────────────────────────────── */
  notesBlock: { marginBottom: 8 },
  notesTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 3 },
  notesBody: { fontSize: 9 },
});

// Column widths (percentages)
const COL = { sr: "6%", desc: "38%", hsn: "10%", qty: "10%", rate: "18%", amt: "12%" };
const COL_NO_HSN = { sr: "6%", desc: "48%", qty: "10%", rate: "20%", amt: "16%" };

// ── Helper: format account type ─────────────────────────────────
const fmtAcct = (t) =>
  t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "";

// ── Component ───────────────────────────────────────────────────
const Template1PDF = ({ invoiceData, numberToWords, currentUser, copyType, signatureBase64, logoBase64 }) => {
  let displayBankDetails = invoiceData?.bankDetails;

  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );
  const col = hasHSN ? COL : COL_NO_HSN;
  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  const copyLabel = copyType || "ORIGINAL FOR RECIPIENT";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ═══ HEADER ═══ */}
        {/* When a logo is available: left-align row so logo sits left of company info.
            When no logo: keep the centered layout unchanged. */}
        {(logoBase64 && invoiceData.includeLogo !== false) ? (
          <View style={s.headerRowWithLogo}>
            <View style={s.logoContainer}>
              <Image
                src={logoBase64}
                style={s.logo}
              />
            </View>
            <View style={s.headerCenterWithLogo}>
              <Text style={s.businessName}>
                {currentUser?.businessName?.toUpperCase() || ""}
              </Text>
              <View style={{ width: "100%" }}>
                <Text style={s.headerDetails}>
                  Office: {currentUser?.address?.street ? currentUser.address.street + ", " : ""}
                  {currentUser?.address?.city || ""}, {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""}
                </Text>
              </View>
              <Text style={s.headerDetails}>
                Phone: {currentUser?.phone || ""} | Email: {currentUser?.email || ""} | {currentUser?.taxId ? `GSTIN/UIN: ${currentUser.taxId}` : ""}
              </Text>
              {(currentUser?.taxId || currentUser?.udyamNo || currentUser?.panNumber) && (
                <Text style={s.headerDetails}>
                  {/* {currentUser?.taxId ? `GSTIN/UIN: ${currentUser.taxId}` : ""} */}
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
              <View style={{ width: "100%" }}>
                <Text style={s.headerDetails}>
                  Office: {currentUser?.address?.street ? currentUser.address.street + ", " : ""}
                  {currentUser?.address?.city || ""}, {currentUser?.address?.state || ""} - {currentUser?.address?.zipCode || ""}
                </Text>
              </View>
              <Text style={s.headerDetails}>
                Phone: {currentUser?.phone || ""} | Email: {currentUser?.email || ""}
              </Text>
              {(currentUser?.taxId || currentUser?.udyamNo || currentUser?.panNumber) && (
                <Text style={s.headerDetails}>
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
        <View style={[s.titleBlock, { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }]}>
          <View style={{ flex: 1, alignItems: "flex-start", paddingTop: 4 }}>
            {invoiceData.shippingAddress && (
              <>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                  Invoice No: <Text style={{ fontFamily: "Helvetica" }}>{invoiceData.invoiceNumber || "-"}</Text>
                </Text>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>
                  Invoice Date: <Text style={{ fontFamily: "Helvetica" }}>{invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB") : "-"}</Text>
                </Text>
              </>
            )}
          </View>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>TAX INVOICE</Text>
            <Text style={s.subtitle}>({copyLabel})</Text>
          </View>

          <View style={{ flex: 1, alignItems: "flex-end", paddingTop: 4 }}>
            {invoiceData.shippingAddress && (
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>
                Due Date: <Text style={{ fontFamily: "Helvetica" }}>{invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString("en-GB") : "-"}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* ═══ BILL TO + SHIP TO ═══ */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12, justifyContent: "space-between" }}>
          {/* Left: Bill To */}
          <View style={[s.billToBox, { flex: 1 }]}>
            <Text style={s.billToLabel}>Bill To:</Text>
            <Text style={s.clientName}>{invoiceData.client?.companyName || ""}</Text>
            <View style={{ width: "100%" }}>
              {((invoiceData.client?.address?.street || ""))
                .replace(/(.{50})/g, "$1\n")
                .split("\n")
                .filter((l) => l.trim().length > 0)
                .map((line, i) => (
                  <Text key={`bill-${i}`} style={s.bodyText}>
                    {line}
                  </Text>
                ))}
            </View>
            <View style={{ width: "100%" }}>
              <Text style={s.bodyText}>
                {invoiceData.client?.address?.city || ""},{" "}
                {invoiceData.client?.address?.state || ""} -{" "}
                {invoiceData.client?.address?.zipCode || ""}
              </Text>
            </View>
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
                invoiceData.shippingAddress.split("\n").map((chunk, chunkIdx) => (
                  <View key={chunkIdx} style={{ width: "100%" }}>
                    {((chunk || ""))
                      .replace(/(.{50})/g, "$1\n")
                      .split("\n")
                      .filter((l) => l.trim().length > 0)
                      .map((line, i) => (
                        <Text key={`str-${chunkIdx}-${i}`} style={s.bodyText}>
                          {line}
                        </Text>
                      ))}
                  </View>
                ))
              ) : (
                <>
                  {invoiceData.shippingAddress.street && (
                    <View style={{ width: "100%" }}>
                      {((invoiceData.shippingAddress.street || ""))
                        .replace(/(.{50})/g, "$1\n")
                        .split("\n")
                        .filter((l) => l.trim().length > 0)
                        .map((line, i) => (
                          <Text key={`ship-${i}`} style={s.bodyText}>
                            {line}
                          </Text>
                        ))}
                    </View>
                  )}
                  {(invoiceData.shippingAddress.city || invoiceData.shippingAddress.state || invoiceData.shippingAddress.zipCode) && (
                    <View style={{ width: "100%" }}>
                      <Text style={s.bodyText}>
                        {[
                          invoiceData.shippingAddress.city,
                          invoiceData.shippingAddress.state,
                          invoiceData.shippingAddress.zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    </View>
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
                  <Text style={{ fontSize: 8, marginTop: 1 }}>{item.notes}</Text>
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
              <Text style={[s.td, s.tdRight, { width: col.rate, fontSize: item.pricingType === "tiered" ? 7.5 : 10, paddingHorizontal: item.pricingType === "tiered" ? 2 : 5 }]}>
                {item.pricingType === "tiered"
                  ? item.pricingTiers
                      ?.map(
                        (t) =>
                          `${t.minValue}–${t.maxValue !== null ? t.maxValue : "Above"} ${item.unitType || ""}: Rs. ${Number(t.rate).toFixed(2)} ${t.rateType === "unitRate" ? "/ " + (item.unitType || "") : "(slab)"}`.replace(/ /g, "\u00A0")
                      )
                      .join("\n")
                  : `Rs. ${(item.baseRate || 0).toFixed(2)}`}
              </Text>
              <Text style={[s.tdLast, s.tdRight, { width: col.amt }]}>
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
                  s.tdRight,
                  { width: hasHSN ? "54%" : "54%", flexDirection: "column" },
                ]}
              >
                {invoiceData.taxes.map((tax, idx) => (
                  <Text key={idx} style={s.bold}>
                    {tax.name} @{tax.rate}%
                  </Text>
                ))}
              </View>
              <Text style={[s.td, s.tdCenter, { width: "28%" }]}> </Text>
              <View style={[s.tdLast, s.tdRight, { width: "18%", flexDirection: "column" }]}>
                {invoiceData.taxes.map((tax, idx) => (
                  <Text key={idx} style={s.bold}>
                    Rs.  {tax.amount.toFixed(2)}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Total row */}
          <View style={s.tableRow} wrap={false}>
            <Text style={[s.td, s.tdRight, s.totalLabel, { width: "54%" }]}>
              Total
            </Text>
            <Text style={[s.td, s.tdCenter, { width: "28%" }]}> </Text>
            <Text style={[s.tdLast, s.tdRight, s.totalLabel, { width: "18%" }]}>
              Rs.  {invoiceData.totalAmount.toFixed(2)}
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

        {/* ═══ TAX BREAKDOWN TABLE ═══ */}
        {invoiceData.taxes && invoiceData.taxes.length > 0 && (
          <View style={s.taxTable} wrap={false}>
            {/* Header */}
            <View style={{ flexDirection: "row" }}>
              <Text style={[s.taxTh, { width: "15%" }]}>HSN/SAC</Text>
              <Text style={[s.taxTh, { width: "20%" }]}>Taxable Value</Text>
              {invoiceData.taxes.map((tax, i) => (
                <React.Fragment key={i}>
                  <Text style={[s.taxTh, { width: "10%" }]}>{tax.name} Rate</Text>
                  <Text style={[s.taxTh, { width: "15%" }]}>{tax.name} Amt</Text>
                </React.Fragment>
              ))}
              <Text style={[s.taxTh, { width: "15%" }]}>Total Tax</Text>
            </View>

            {/* Data rows */}
            {invoiceData.items.map((item, index) => {
              const itemTaxable = item.subtotal - (item.discount || 0);
              const itemTotalTax = invoiceData.taxes.reduce(
                (acc, tax) => acc + (itemTaxable * tax.rate) / 100,
                0
              );
              return (
                <View key={item._id || `tax-${index}`} style={{ flexDirection: "row" }}>
                  <Text style={[s.taxTd, { width: "15%", textAlign: "center" }]}>
                    {item.hsnCode || "-"}
                  </Text>
                  <Text style={[s.taxTd, { width: "20%", textAlign: "right" }]}>
                    {itemTaxable.toFixed(2)}
                  </Text>
                  {invoiceData.taxes.map((tax, ti) => {
                    const amt = (itemTaxable * tax.rate) / 100;
                    return (
                      <React.Fragment key={ti}>
                        <Text style={[s.taxTd, { width: "10%", textAlign: "center" }]}>
                          {tax.rate}%
                        </Text>
                        <Text style={[s.taxTd, { width: "15%", textAlign: "right" }]}>
                          {amt.toFixed(2)}
                        </Text>
                      </React.Fragment>
                    );
                  })}
                  <Text style={[s.taxTd, { width: "15%", textAlign: "right" }]}>
                    {itemTotalTax.toFixed(2)}
                  </Text>
                </View>
              );
            })}

            {/* Total row */}
            <View style={{ flexDirection: "row", backgroundColor: "#f0f0f0" }}>
              <Text
                style={[s.taxTd, { width: "15%", textAlign: "center", fontFamily: "Helvetica-Bold" }]}
              >
                Total
              </Text>
              <Text
                style={[s.taxTd, { width: "20%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}
              >
                {taxableAmount.toFixed(2)}
              </Text>
              {invoiceData.taxes.map((tax, ti) => (
                <React.Fragment key={ti}>
                  <Text style={[s.taxTd, { width: "10%" }]}> </Text>
                  <Text
                    style={[
                      s.taxTd,
                      { width: "15%", textAlign: "right", fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {tax.amount.toFixed(2)}
                  </Text>
                </React.Fragment>
              ))}
              <Text
                style={[
                  s.taxTd,
                  { width: "15%", textAlign: "right", fontFamily: "Helvetica-Bold" },
                ]}
              >
                {invoiceData.totalTax.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Tax in words */}
        {invoiceData.totalTax > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10 }}>
              Tax Amount (in words):{" "}
              <Text style={s.amountInWordsBold}>
                INR{" "}
                {numberToWords
                  ? numberToWords(invoiceData.totalTax)
                  : invoiceData.totalTax.toFixed(2)}{" "}
                
              </Text>
            </Text>
          </View>
        )}

        {/* ═══ BANK DETAILS + SIGNATURE ═══ */}
        <View style={s.bankSigRow} wrap={false}>
          {displayBankDetails && (
            <View style={s.bankBox}>
              <Text style={s.bankTitle}>Company&apos;s Bank Details</Text>
              {displayBankDetails.accountHolderName && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Account Holder:</Text>{" "}
                  {displayBankDetails.accountHolderName}
                </Text>
              )}
              {displayBankDetails.bankName && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Bank Name:</Text>{" "}
                  {displayBankDetails.bankName}
                </Text>
              )}
              {displayBankDetails.branchName && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Branch:</Text>{" "}
                  {displayBankDetails.branchName}
                </Text>
              )}
              {displayBankDetails.accountType && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>Account Type:</Text>{" "}
                  {fmtAcct(displayBankDetails.accountType)} Account
                </Text>
              )}
              {displayBankDetails.accountNumber && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>A/c No.:</Text>{" "}
                  {displayBankDetails.accountNumber}
                </Text>
              )}
              {displayBankDetails.ifscCode && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>IFSC:</Text>{" "}
                  {displayBankDetails.ifscCode}
                </Text>
              )}
              {displayBankDetails.upiId && (
                <Text style={s.bankLine}>
                  <Text style={s.bold}>UPI ID:</Text>{" "}
                  {displayBankDetails.upiId}
                </Text>
              )}
            </View>
          )}

          <View style={s.sigBox}>
            <View style={{ width: 220, alignItems: "center" }}>
              <Text style={[s.sigLabel, (signatureBase64 && invoiceData.includeSignature !== false) ? { marginBottom: 10 } : {}]}>
                for {currentUser?.businessName || ""}
              </Text>
              {signatureBase64 && invoiceData.includeSignature !== false && (
                <Image 
                  src={signatureBase64} 
                  style={{ width: 160, height: 60, objectFit: "contain", marginBottom: 10 }} 
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

export default Template1PDF;
