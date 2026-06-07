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
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  companyDetails: {
    fontSize: 10,
    marginTop: 8,
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
    paddingTop: 3,
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
    padding: 2,
    fontSize: 9,
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
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 4,
    padding: 0,
  },
  sigBox: {
    width: "100%",
    alignItems: "flex-end",
  },
  sigBoxFull: {
    width: "100%",
    alignItems: "flex-end",
  },
  sigFor: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 35 },
  sigLabel: { fontSize: 9 },
  bankTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#2c3e50",
  },

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

  /* ── Custom Fields Container ───────────────────── */
  customFieldsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  customFieldColumn: {
    width: "48%",
  },
  customFieldItem: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    textAlign: "left",
  },
  customFieldValue: {
    fontFamily: "Helvetica",
  },
});

// Format account type
const formatAccountType = (type) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

// Helper: Check if unit is time-based
const isTimeBasedUnit = (unitType) => {
  const timeUnits = ["hour", "hours", "hr", "hrs", "minute", "minutes", "min", "mins"];
  return timeUnits.includes(unitType?.toLowerCase().trim());
};

// Helper: Format time quantity with 2-digit minutes to human-readable format
// Converts "4.30" to "4hrs 30mins" or "30mins" if hours is 0
const formatTimeQuantity = (quantityDisplay, quantity, unitType) => {
  // Priority: use quantityDisplay if available (string with format like "4.30")
  let timeString = quantityDisplay;
  
  // If quantityDisplay is not available, try to create from quantity
  if (!timeString && quantity) {
    timeString = quantity.toString();
  }
  
  if (!timeString) return "0";
  
  // Parse the time notation (e.g., "4.30" or "4.3")
  const [hours, minutes = "0"] = timeString.split(".");
  const hrs = parseInt(hours, 10) || 0;
  const mins = parseInt(minutes, 10) || 0;
  
  // Build the formatted string
  const parts = [];
  if (hrs > 0) {
    parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
  }
  if (mins > 0) {
    parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  }
  
  // If both hours and minutes are 0, show "0"
  if (parts.length === 0) return "0";
  
  return parts.join(" ");
};

// Helper: Get display quantity for an item
const getDisplayQuantity = (item) => {
  const unitType = item.unitType || "";
  
  // Check if it's a time-based unit
  if (isTimeBasedUnit(unitType)) {
    // Try to use quantityDisplay first, then fallback to quantity
    const formatted = formatTimeQuantity(item.quantityDisplay, item.quantity, unitType);
    return formatted;
  }
  
  // For non-time units, use quantityDisplay if available, otherwise quantity
  if (item.quantityDisplay) {
    return item.quantityDisplay;
  }
  return item.quantity || 0;
};

// ── Helper: Check if invoice has any taxes ──────────────────────
const hasAnyTaxes = (invoiceData) => {
  return invoiceData.taxes && invoiceData.taxes.length > 0;
};

const Template3PDF = ({
  invoiceData,
  currentUser,
  numberToWords,
  signatureBase64,
  logoBase64,
}) => {
  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== "",
  );

  const hasTaxes = hasAnyTaxes(invoiceData);
  const invoiceTypeLabel = hasTaxes ? "TAX INVOICE" : "INVOICE";

  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  // Column Distribution matching HTML
  const col = hasHSN
    ? { sr: "6%", items: "38%", hsn: "10%", qty: "8%", rate: "25%", amt: "13%" }
    : { sr: "6%", items: "48%", qty: "8%", rate: "25%", amt: "13%" };

  let displayBankDetails = invoiceData?.bankDetails;

  const customFields = invoiceData.customFields || [];
  const halfLength = Math.ceil(customFields.length / 2);
  const leftCustomFields = customFields.slice(0, halfLength);
  const rightCustomFields = customFields.slice(halfLength);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.outerBorder}>
          {/* Header */}
          <View
            style={[
              s.headerWrap,
              { flexDirection: "row", alignItems: "center" },
            ]}
            fixed
          >
            {(logoBase64 || currentUser?.logo || currentUser?.logoUrl) &&
              invoiceData.includeLogo !== false && (
                <Image
                  src={logoBase64 || currentUser?.logo || currentUser?.logoUrl}
                  style={{
                    height: "100%",
                    width: 90,
                    objectFit: "contain",
                  }}
                />
              )}
            <View
              style={{
                flex: 1,
                paddingLeft:
                  (logoBase64 || currentUser?.logo || currentUser?.logoUrl) &&
                  invoiceData.includeLogo !== false
                    ? 10
                    : 0,
              }}
            >
              <View style={{ textAlign: "center", width: "100%" }}>
                <Text
                  style={[
                    s.companyName,
                    { marginBottom: 4, textAlign: "left" },
                  ]}
                >
                  {currentUser?.businessName?.toUpperCase() || ""}
                </Text>
                <View style={[s.companyDetails, { textAlign: "left" }]}>
                  <Text>
                    Office: {currentUser?.address?.street || ""}{" "}
                    {currentUser?.address?.city || ""},{" "}
                    {currentUser?.address?.state || ""} -{" "}
                    {currentUser?.address?.zipCode || ""}
                  </Text>
                  <Text>
                    Phone: {currentUser?.phone || ""} | Email:{" "}
                    {currentUser?.email || ""} |{" "}
                    {currentUser?.taxId
                      ? `GSTIN/UIN: ${currentUser.taxId}`
                      : ""}
                    {currentUser?.udyamNo
                      ? ` | Udyam No.: ${currentUser.udyamNo}`
                      : ""}
                    {currentUser?.panNumber
                      ? ` | PAN: ${currentUser.panNumber}`
                      : ""}
                  </Text>
                  {currentUser?.customProfileFields &&
                    currentUser.customProfileFields.length > 0 && (
                      <Text>
                        {currentUser.customProfileFields
                          .map(
                            (field, idx) =>
                              `${field.label}: ${field.value}${idx < currentUser.customProfileFields.length - 1 ? " | " : ""}`,
                          )
                          .join("")}
                      </Text>
                    )}
                </View>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={s.mainContainer}>
            {invoiceData.shippingAddress ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{ flex: 1, alignItems: "flex-start", paddingTop: 4 }}
                  >
                    <Text style={s.metaBoldRow}>
                      Invoice No: {invoiceData.invoiceNumber}
                    </Text>
                    <Text style={s.metaBoldRow}>
                      Date:{" "}
                      {new Date(invoiceData.invoiceDate).toLocaleDateString(
                        "en-GB",
                      )}
                    </Text>
                    {invoiceData.poNumber && (
                      <Text style={s.metaBoldRow}>
                        PO Number: {invoiceData.poNumber}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={[
                        s.invoiceTitle,
                        { textAlign: "center", marginBottom: 0 },
                      ]}
                    >
                      {invoiceTypeLabel}
                    </Text>
                  </View>

                  <View
                    style={{ flex: 1, alignItems: "flex-end", paddingTop: 4 }}
                  >
                    <Text style={s.metaBoldRow}>
                      Due Date:{" "}
                      {new Date(invoiceData.dueDate).toLocaleDateString(
                        "en-GB",
                      )}
                    </Text>
                  </View>
                </View>

                {/* CUSTOM FIELDS SECTION - Two Column Layout (When shipping address exists) */}
                {customFields.length > 0 && (
                  <View style={s.customFieldsRow}>
                    {/* Left Column - below Invoice No/Date */}
                    <View style={s.customFieldColumn}>
                      {leftCustomFields.map((cf, cfIdx) => (
                        <Text key={cfIdx} style={s.customFieldItem}>
                          {cf.label || ""}:{" "}
                          <Text style={s.customFieldValue}>{cf.value || ""}</Text>
                        </Text>
                      ))}
                    </View>
                    {/* Right Column - below Due Date */}
                    <View style={s.customFieldColumn}>
                      {rightCustomFields.map((cf, cfIdx) => (
                        <Text key={cfIdx} style={s.customFieldItem}>
                          {cf.label || ""}:{" "}
                          <Text style={s.customFieldValue}>{cf.value || ""}</Text>
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* Bill To & Ship To Data */}
                <View style={[s.metaWrapper, { marginBottom: 15 }]}>
                  <View style={[s.billToCol, { paddingRight: 10 }]}>
                    <Text style={s.billToName}>Bill To:</Text>
                    <Text style={[s.billToName, { marginTop: 4 }]}>
                      {invoiceData.client?.companyName || ""}
                    </Text>
                    <Text style={s.textRow}>
                      GST No: {invoiceData.client?.gstNumber || "N/A"}
                    </Text>
                    {invoiceData.client?.panNumber && (
                      <Text style={s.textRow}>
                        PAN: {invoiceData.client.panNumber}
                      </Text>
                    )}
                    <Text style={s.textRow}>
                      {invoiceData.client?.address?.street || ""},{" "}
                      {invoiceData.client?.address?.city || ""},{" "}
                      {invoiceData.client?.address?.state || ""} -{" "}
                      {invoiceData.client?.address?.zipCode || ""},{" "}
                      {invoiceData.client?.address?.country || ""}
                    </Text>
                    {invoiceData.client?.phone && (
                      <Text style={s.textRow}>
                        Phone: {invoiceData.client.phone}
                      </Text>
                    )}
                    {invoiceData.client?.email && (
                      <Text style={s.textRow}>
                        Email: {invoiceData.client.email}
                      </Text>
                    )}
                  </View>

                  <View style={s.billToCol}>
                    <Text style={s.billToName}>Ship To:</Text>
                    {typeof invoiceData.shippingAddress === "string" ? (
                      invoiceData.shippingAddress.split("\n").map((line, i) => (
                        <Text key={i} style={s.textRow}>
                          {line}
                        </Text>
                      ))
                    ) : (
                      <View style={{ marginTop: 4 }}>
                        {invoiceData.shippingAddress.street && (
                          <Text style={s.textRow}>
                            {invoiceData.shippingAddress.street}
                          </Text>
                        )}
                        <Text style={s.textRow}>
                          {invoiceData.shippingAddress.city || ""},{" "}
                          {invoiceData.shippingAddress.state || ""} -{" "}
                          {invoiceData.shippingAddress.zipCode || ""},{" "}
                          {invoiceData.shippingAddress.country || ""}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={[s.invoiceTitle, { textAlign: "center" }]}>
                  {invoiceTypeLabel}
                </Text>

                {/* Bill To & Meta Data */}
                <View style={s.metaWrapper}>
                  <View style={s.billToCol}>
                    <Text style={s.billToName}>
                      {invoiceData.client?.companyName || ""}
                    </Text>
                    <Text style={s.textRow}>
                      {invoiceData.client?.address?.street || ""},{" "}
                      {invoiceData.client?.address?.city || ""},{" "}
                      {invoiceData.client?.address?.state || ""} -{" "}
                      {invoiceData.client?.address?.zipCode || ""},{" "}
                      {invoiceData.client?.address?.country || ""}
                    </Text>
                    <Text style={s.textRow}>
                      <Text style={s.bold}>GST No:</Text>{" "}
                      {invoiceData.client?.gstNumber || "N/A"}
                    </Text>

                    {invoiceData.client?.panNumber && (
                      <Text style={s.textRow}>
                        <Text style={s.bold}>PAN:</Text>{" "}
                        {invoiceData.client.panNumber}
                      </Text>
                    )}

                    {invoiceData.client?.phone && (
                      <Text style={s.textRow}>
                        <Text style={s.bold}>Phone:</Text>{" "}
                        {invoiceData.client.phone}
                      </Text>
                    )}

                    {invoiceData.client?.email && (
                      <Text style={s.textRow}>
                        <Text style={s.bold}>Email:</Text>{" "}
                        {invoiceData.client.email}
                      </Text>
                    )}
                  </View>

                  <View style={s.metaCol}>
                    <Text
                      style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}
                    >
                      Invoice No:{" "}
                      <Text style={{ fontFamily: "Helvetica" }}>
                        {invoiceData.invoiceNumber}
                      </Text>
                    </Text>

                    <Text
                      style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}
                    >
                      Date:{" "}
                      <Text style={{ fontFamily: "Helvetica" }}>
                        {new Date(invoiceData.invoiceDate).toLocaleDateString(
                          "en-GB",
                        )}
                      </Text>
                    </Text>

                    <Text
                      style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}
                    >
                      Due Date:{" "}
                      <Text style={{ fontFamily: "Helvetica" }}>
                        {new Date(invoiceData.dueDate).toLocaleDateString(
                          "en-GB",
                        )}
                      </Text>
                    </Text>
                    
                    {/* CUSTOM FIELDS - When no shipping address, show in meta column */}
                    {customFields.length > 0 &&
                      customFields.map((cf, cfIdx) => (
                        <Text
                          key={cfIdx}
                          style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}
                        >
                          {cf.label || ""}:{" "}
                          <Text style={{ fontFamily: "Helvetica" }}>
                            {cf.value || ""}
                          </Text>
                        </Text>
                      ))}
                  </View>
                </View>
              </>
            )}

            {/* Items Table */}
            <View style={s.table}>
              <View style={s.tableHeaderRow} fixed>
                <Text style={[s.th, { width: col.sr }]}>Sr. No.</Text>
                <Text style={[s.th, { width: col.items }]}>PARTICULAR</Text>
                {hasHSN && (
                  <Text style={[s.th, { width: col.hsn }]}>HSN/SAC</Text>
                )}
                <Text style={[s.th, { width: col.qty }]}>QTY</Text>
                <Text style={[s.th, { width: col.rate }]}>RATE</Text>
                <Text style={[s.thLast, { width: col.amt }]}>AMOUNT</Text>
              </View>

              {invoiceData.items.map((item, index) => {
                const isLast = index === invoiceData.items.length - 1;
                const displayQuantity = getDisplayQuantity(item);
                const unitType = item.unitType || "";
                
                return (
                  <View
                    key={index}
                    style={
                      isLast
                        ? [s.tableRow, { borderBottomWidth: 0 }]
                        : s.tableRow
                    }
                    wrap={false}
                  >
                    <Text
                      style={[s.td, { width: col.sr, textAlign: "center" }]}
                    >
                      {index + 1}
                    </Text>
                    <View style={[s.td, { width: col.items }]}>
                      <Text>{item.description}</Text>
                    </View>
                    {hasHSN && (
                      <Text
                        style={[s.td, { width: col.hsn, textAlign: "center" }]}
                      >
                        {item.hsnCode || "-"}
                      </Text>
                    )}
                    <Text
                      style={[s.td, { width: col.qty, textAlign: "center" }]}
                    >
                      {displayQuantity} {!isTimeBasedUnit(unitType) && `${unitType}`}
                    </Text>
                    <View style={[s.td, { width: col.rate }]}>
                      {item.pricingType === "tiered" ? (
                        item.pricingTiers?.map((t, i) => (
                          <Text
                            key={i}
                            style={{ fontSize: 8 }}
                          >{`${t.minValue}–${t.maxValue !== null ? t.maxValue : "Above"} ${unitType}: Rs.\u00A0${Number(t.rate).toFixed(2)}\u00A0${t.rateType === "unitRate" ? "/\u00A0" + unitType : "(slab)"}`}</Text>
                        ))
                      ) : (
                        <Text>Rs. {(item.baseRate || 0).toFixed(2)}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        s.tdLast,
                        { width: col.amt, textAlign: "center" },
                      ]}
                    >
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
                  <Text style={s.calcValue}>
                    Rs. {invoiceData.subtotal.toFixed(2)}
                  </Text>
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
                    <Text style={s.calcValue}>
                      Rs. {taxableAmount.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}

              {invoiceData.taxes &&
                invoiceData.taxes.map((tax, index) => (
                  <View key={index} style={s.calcRow}>
                    <Text style={s.calcLabel}>
                      {tax.name} @{tax.rate}%
                    </Text>
                    <Text style={s.calcValue}>
                      Rs. {(tax.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}

              <View style={[s.calcRow, s.calcRowTopBorder]}>
                <Text style={s.calcLabel}>TOTAL</Text>
                <Text style={s.calcValue}>
                  Rs. {invoiceData.totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Amount in Words */}
            <View style={s.wordsBox} wrap={false}>
              <Text style={s.wordsPrefix}>Amount in words: </Text>
              <Text style={{ fontSize: 9 }}>
                {numberToWords
                  ? numberToWords(invoiceData.totalAmount)
                  : `Rupees ${(invoiceData.totalAmount || 0).toFixed(2)}`}
              </Text>
            </View>

            {/* Payment Terms */}
            {invoiceData.paymentTerms && (
              <View style={s.termsBox} wrap={false}>
                <Text style={s.termsPrefix}>Payment Terms:</Text>
                <Text style={{ fontSize: 8 }}>{invoiceData.paymentTerms}</Text>
              </View>
            )}

            {/* Bank Details & Signature - Fixed Alignment */}
            <View style={s.bankSigWrapper} wrap={false}>
              {/* Bank Details - Only render if exists */}
              {displayBankDetails && (
                <View style={s.bankBox}>
                  <Text style={s.bankTitle}>Bank Details:</Text>
                  {displayBankDetails?.accountHolderName && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>Account Holder:</Text>{" "}
                      {displayBankDetails.accountHolderName}
                    </Text>
                  )}
                  {displayBankDetails?.bankName && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>Bank Name:</Text>{" "}
                      {displayBankDetails.bankName}
                    </Text>
                  )}
                  {displayBankDetails?.branchName && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>Branch:</Text>{" "}
                      {displayBankDetails.branchName}
                    </Text>
                  )}
                  {displayBankDetails?.accountType && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>Account Type:</Text>{" "}
                      {formatAccountType(displayBankDetails.accountType)}{" "}
                      Account
                    </Text>
                  )}
                  {displayBankDetails?.accountNumber && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>Account No:</Text>{" "}
                      {displayBankDetails.accountNumber}
                    </Text>
                  )}
                  {displayBankDetails?.ifscCode && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>IFSC Code:</Text>{" "}
                      {displayBankDetails.ifscCode}
                    </Text>
                  )}
                  {displayBankDetails?.upiId && (
                    <Text style={s.textRow}>
                      <Text style={s.bold}>UPI ID:</Text>{" "}
                      {displayBankDetails.upiId}
                    </Text>
                  )}
                </View>
              )}

              {/* Signature Box - Always on the right side */}
              {/* If bank details exist, width is 48%; if not, width is 100% and aligned right */}
              <View style={displayBankDetails ? s.sigBox : s.sigBoxFull}>
                <Text
                  style={[
                    s.sigFor,
                    signatureBase64 && invoiceData.includeSignature !== false
                      ? { marginBottom: 10 }
                      : {},
                  ]}
                >
                  For {currentUser?.businessName || ""}
                </Text>
                {signatureBase64 && invoiceData.includeSignature !== false && (
                  <Image
                    src={signatureBase64}
                    style={{
                      width: 140,
                      height: 40,
                      objectFit: "contain",
                      marginBottom: 10,
                      alignSelf: "flex-end",
                    }}
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
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default Template3PDF;