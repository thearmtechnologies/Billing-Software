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
    padding: 40,
    color: "#000",
    backgroundColor: "#fff",
  },
  // Main Border Container
  mainContainer: {
    borderWidth: 1,
    borderColor: "#000",
    margin: "auto auto",
    width: "100%",
  },
  // Header Section
  headerTop: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  headerLeft: { flex: 1 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerRight: { flex: 1, textAlign: "right" },
  
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  bold: { fontFamily: "Helvetica-Bold" },

  // Work Order / Reference Bar
  infoBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
  },

  // Party Table (Bill To / Ship To)
  partyTable: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  partyCol: {
    flex: 1,
    padding: 5,
  },
  partyLabel: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 4,
    fontSize: 10,
  },

  // Items Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 25,
  },
  th: {
    padding: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 9,
  },
  td: {
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 9,
    lineHeight: 1.2,
  },
  
  // Footer Sections
  footerRow: {
    flexDirection: "row",
  },
  footerLeft: {
    width: "65%",
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  footerRight: {
    width: "35%",
  },
  financialRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
  },
  bankTitle: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginTop: 10,
    marginBottom: 4,
  },
  grandTotal: {
    backgroundColor: "#f0f0f0",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  // Signature section styles
  signatureSection: {
    padding: 5,
    alignItems: "center",
    marginTop: "auto",
    width: "100%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderColor: "#000",
    width: "80%",
    marginTop: 5,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 8,
    marginTop: 4,
  }
});

// Column Widths
const COL = { sr: "6%", desc: "44%", hsn: "15%", time: "15%", amt: "20%" };

const Template7PDF = ({ invoiceData, numberToWords, currentUser, signatureBase64 }) => {
  console.log("TEMPLATE7 invoiceData:", invoiceData);

  const rawShipping =
    invoiceData.shippingAddress ||
    invoiceData.shipping_address ||
    invoiceData.client?.shippingAddress ||
    "";

  let shipStr = "";

  if (typeof rawShipping === "string") {
    shipStr = rawShipping.trim();
  } else if (typeof rawShipping === "object" && rawShipping !== null) {
    const parts = [
      rawShipping.street,
      [rawShipping.city, rawShipping.state, rawShipping.zipCode].filter(Boolean).join(", "),
      rawShipping.country,
    ];
    shipStr = parts.filter(Boolean).join("\n").trim();
  }

  const hasShipping = shipStr.length > 0;

  console.log("Shipping extracted:", shipStr, hasShipping);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.mainContainer}>
          
          {/* Header */}
          <View style={s.headerTop}>
            <View style={s.headerLeft}>
              <Text>GSTIN NO: {currentUser?.taxId || "-"}</Text>
              <Text>UDHYAM NO: {currentUser?.udyamNo || "-"}
                {currentUser?.panNumber ? ` | PAN: ${currentUser.panNumber}` : ""}
              </Text>
            </View>
            <View style={s.headerCenter}>
              <Text style={s.title}>TAX INVOICE</Text>
              {invoiceData?.reverseCharge && <Text style={{ fontSize: 8 }}>REVERSE CHARGE</Text>}
            </View>
            <View style={s.headerRight}>
              <Text style={s.bold}>INVOICE NO: {invoiceData?.invoiceNumber}</Text>
              <Text style={s.bold}>DATE: {invoiceData?.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB") : "-"}</Text>
            </View>
          </View>

          {/* Info Bar */}
          <View style={s.infoBar}>
            <Text style={{ flex: 1 }}>WORK ORDER NO: {invoiceData?.workOrderNo || "-"}</Text>
            <Text style={{ flex: 1 }}>REFERENCE: {invoiceData?.reference || "-"}</Text>
          </View>

          {/* Party Details (Bill To / Ship To) */}
          <View style={s.partyTable}>
            {/* Bill To */}
            <View style={[s.partyCol, { borderRightWidth: 1, borderColor: "#000" }]}>
              <Text style={s.partyLabel}>BILL TO PARTY</Text>
              <Text style={s.bold}>NAME: {invoiceData.client?.companyName}</Text>
              <Text>ADDRESS: {invoiceData.client?.address?.street}</Text>
              <Text>{invoiceData.client?.address?.city}, {invoiceData.client?.address?.state} - {invoiceData.client?.address?.zipCode}</Text>
              <Text style={s.bold}>GSTIN: {invoiceData.client?.gstNumber}</Text>
              <Text>PAN NO: {invoiceData.client?.panNumber || invoiceData.client?.panNo || "-"}</Text>
              <Text>PLACE OF SUPPLY: {invoiceData.client?.address?.state || "-"}</Text>
            </View>
            
            {/* Ship To */}
            <View style={s.partyCol}>
              <Text style={s.partyLabel}>SHIP TO PARTY</Text>
              {hasShipping ? (
                <>
                  <Text style={s.bold}>NAME: {invoiceData.shippingAddress?.name || invoiceData.client?.companyName}</Text>
                  <Text>ADDRESS: {shipStr}</Text>
                </>
              ) : (
                <>
                  <Text style={s.bold}>NAME: {invoiceData.client?.companyName || "-"}</Text>
                  <Text>ADDRESS: -</Text>
                </>
              )}
              <Text style={[s.bold, { marginTop: 4 }]}>SAC CODE: {invoiceData.items?.[0]?.hsnCode || "-"}</Text>
            </View>
          </View>

          {/* Items Table Header */}
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: COL.sr }]}>Sr. No.</Text>
            <Text style={[s.th, { width: COL.desc }]}>Description of Work</Text>
            <Text style={[s.th, { width: COL.hsn }]}>HSN/SAC</Text>
            <Text style={[s.th, { width: COL.time }]}>Time/Unit</Text>
            <Text style={[s.th, { width: COL.amt, borderRightWidth: 0 }]}>Amount</Text>
          </View>

          {/* Items Table Body */}
          {invoiceData.items?.map((item, index) => (
            <View key={index} style={s.tableRow} wrap={false}>
              <View style={[s.td, { width: COL.sr, textAlign: "center" }]}>
                <Text>{index + 1}</Text>
              </View>
              <View style={[s.td, { width: COL.desc }]}>
                <Text style={s.bold}>{item.description}</Text>
                {item.notes && <Text style={{ fontSize: 7, marginTop: 2 }}>{item.notes}</Text>}
              </View>
              <View style={[s.td, { width: COL.hsn, textAlign: "center" }]}>
                <Text>{item.hsnCode || "-"}</Text>
              </View>
              <View style={[s.td, { width: COL.time, textAlign: "center" }]}>
                <Text>{item.quantity} {item.unitType || item.unit || ""}</Text>
              </View>
              <View style={[s.td, { width: COL.amt, textAlign: "right", borderRightWidth: 0 }]}>
                <Text>Rs. {item.subtotal?.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {/* Financials & Footer */}
          <View style={s.footerRow}>
            {/* Left Column: Bank & Amount in Words */}
            <View style={s.footerLeft}>
              <Text style={s.bold}>AMOUNT IN WORDS:</Text>
              <Text style={{ marginBottom: 10 }}>{numberToWords(invoiceData.totalAmount || 0)}</Text>
              
              {invoiceData?.bankDetails && (
                <>
                  <Text style={s.bankTitle}>BANK DETAILS FOR PAYMENT</Text>
                  <Text>BANK NAME: {invoiceData.bankDetails.bankName || "-"}</Text>
                  <Text>AC NAME: {invoiceData.bankDetails.accountHolderName || "-"}</Text>
                  <Text>AC NO: {invoiceData.bankDetails.accountNumber || "-"}</Text>
                  <Text>IFSC CODE: {invoiceData.bankDetails.ifscCode || "-"}</Text>
                  <Text>BRANCH: {invoiceData.bankDetails.branchName || "-"}</Text>
                </>
              )}
              
              <View style={{ marginTop: 20 }}>
                <Text style={s.bold}>CUSTOMER RECEIVING</Text>
                <View style={{ borderBottomWidth: 1, width: 150, marginTop: 20 }} />
              </View>
            </View>

            {/* Right Column: Totals */}
            <View style={s.footerRight}>
              <View style={s.financialRow}>
                <Text style={{ flex: 1 }}>BASIC AMOUNT:</Text>
                <Text>{invoiceData.subtotal?.toFixed(2)}</Text>
              </View>
              
              {invoiceData.taxes?.map((tax, i) => (
                <View key={i} style={s.financialRow}>
                  <Text style={{ flex: 1 }}>TAX ({tax.name}) {tax.rate}%:</Text>
                  <Text>{tax.amount?.toFixed(2)}</Text>
                </View>
              ))}

              <View style={s.financialRow}>
                <Text style={{ flex: 1 }}>ADMIN CHARGE:</Text>
                <Text>{invoiceData.adminCharge || "0.00"}</Text>
              </View>

              <View style={s.financialRow}>
                <Text style={{ flex: 1 }}>ROUND OFF:</Text>
                <Text>{invoiceData.roundOff || "0.00"}</Text>
              </View>

              <View style={[s.financialRow, s.grandTotal, { borderBottomWidth: 0 }]}>
                <Text style={{ flex: 1 }}>GRAND TOTAL:</Text>
                <Text>Rs. {invoiceData.totalAmount?.toFixed(2)}</Text>
              </View>
              
              {/* Signature Area - Always shows line even without signature */}
              <View style={s.signatureSection}>
                {signatureBase64 && invoiceData.includeSignature !== false && (
                  <Image src={signatureBase64} style={{ width: 100, height: 40, marginBottom: 4 }} />
                )}
                <View style={s.signatureLine} />
                <Text style={s.signatureText}>Authorized Signatory</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={{ textAlign: "center", fontSize: 8, marginTop: 10 }}>
          This is a Computer Generated Invoice
        </Text>
      </Page>
    </Document>
  );
};

export default Template7PDF;