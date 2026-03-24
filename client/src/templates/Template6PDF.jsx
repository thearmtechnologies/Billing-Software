import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 20,
    color: "#000",
    backgroundColor: "#fff",
  },
  
  // Main Border Container
  container: {
    borderWidth: 1,
    borderColor: "#000",
    flex: 1,
  },

  bold: { fontFamily: "Helvetica-Bold" },
  textRight: { textAlign: "right" },
  textCenter: { textAlign: "center" },

  // Header Section
  titleBar: {
    backgroundColor: "#eef2ff",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 4,
    alignItems: "center",
  },
  titleText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },

  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  headerLeft: {
    width: "60%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#000",
  },
  headerRight: {
    width: "40%",
    padding: 6,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 9,
    width: 65,
  },
  headerValue: {
    flex: 1,
  },
  flexRow: {
    flexDirection: "row",
    marginBottom: 2,
  },

  // Info Bar (GSTIN, Invoice No, Date)
  infoBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#000",
    fontFamily: "Helvetica-Bold",
  },
  infoCell: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
  },

  // Table Styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0047ab", // Dark Blue from design
    color: "#fff",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 25,
  },
  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 8.5,
  },

  // Column Widths
  wSno: { width: "4%" },
  wQty: { width: "7%" },
  wDesc: { width: "27%" },
  wBatch: { width: "8%" },
  wExp: { width: "8%" },
  wHsn: { width: "12%" },
  wRate: { width: "12%" },
  wDisc: { width: "7%" },
  wAmt: { width: "15%", borderRightWidth: 0 },

  // Watermark (Centered Background Text)
  watermark: {
    position: "absolute",
    top: "35%",
    left: "25%",
    fontSize: 80,
    color: "#eee",
    transform: "rotate(-30deg)",
    zIndex: -1,
    opacity: 0.5,
    fontFamily: "Helvetica-Bold",
  },

  // Bottom Section
  bottomContainer: {
    flexDirection: "row",
    flexGrow: 1,
  },
  bottomLeft: {
    width: "75%",
    padding: 8,
    borderRightWidth: 1,
    borderColor: "#000",
  },
  bottomRight: {
    width: "25%",
  },

  totalsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
  },
  totalLabel: { width: "60%", fontFamily: "Helvetica" },
  totalVal: { width: "40%", textAlign: "right" },

  // Footer / Grand Total
  footerBar: {
    flexDirection: "row",
    backgroundColor: "#1a5fb4",
    color: "#fff",
    padding: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  grandTotalText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },

  termsTitle: {
    textDecoration: "underline",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  termsText: {
    fontSize: 8,
    marginBottom: 2,
  },

  signatureArea: {
    marginTop: 20,
    alignItems: "flex-end",
    paddingRight: 20,
  }
});

const safeText = (value, fallback = "") => (value ? String(value) : fallback);

const Template6PDF = ({ invoiceData, currentUser, numberToWords, signatureBase64 }) => {
  const items = Array.isArray(invoiceData?.items) ? invoiceData.items : [];
  
  const subtotal = Number(invoiceData?.subtotal) || 0;
  const totalTax = Number(invoiceData?.totalTax) || 0;
  const discount = Number(invoiceData?.discount) || 0;
  const grandTotal = Number(invoiceData?.totalAmount) || (subtotal + totalTax - discount);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.container}>
          
          {/* Watermark */}
          <Text style={s.watermark}>Billing</Text>

          {/* Title */}
          <View style={s.titleBar}>
            <Text style={s.titleText}>SALE BILL</Text>
          </View>

          {/* Header: Company & Party Details */}
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <Text style={s.companyName}>{safeText(currentUser?.businessName || "Billing")}</Text>
              <Text style={{ fontSize: 8, marginBottom: 5 }}>
                {safeText(currentUser?.address?.street)}{"\n"}
                {safeText(currentUser?.address?.city)} {safeText(currentUser?.address?.state)}
              </Text>
              <Text>State Code : {safeText(currentUser?.stateCode || "07- Delhi")}</Text>
              <Text>Phone : {safeText(currentUser?.phone)}</Text>
              <Text>E-mail Id : {safeText(currentUser?.email)}</Text>
              <Text>Website : {safeText(currentUser?.website || "www.general.com")}</Text>
            </View>

            <View style={s.headerRight}>
              <View style={s.flexRow}>
                <Text style={s.headerLabel}>Party Name</Text>
                <Text style={[s.headerValue, s.bold]}>: {safeText(invoiceData?.client?.companyName)}</Text>
              </View>
              <View style={s.flexRow}>
                <Text style={s.headerLabel}>Party Add.</Text>
                <Text style={s.headerValue}>: {safeText(invoiceData?.client?.address?.street)}</Text>
              </View>
              <View style={s.flexRow}>
                <Text style={s.headerLabel}>State Code</Text>
                <Text style={s.headerValue}>: {safeText(invoiceData?.client?.address?.state)}</Text>
              </View>
              <View style={s.flexRow}>
                <Text style={s.headerLabel}>Phone No.</Text>
                <Text style={s.headerValue}>: {safeText(invoiceData?.client?.phone)}</Text>
              </View>
              <View style={s.flexRow}>
                <Text style={s.headerLabel}>E-mail ID</Text>
                <Text style={s.headerValue}>: {safeText(invoiceData?.client?.email)}</Text>
              </View>
            </View>
          </View>

          {/* Info Bar */}
          <View style={s.infoBar}>
            <View style={[s.infoCell, { width: "40%" }]}>
              <Text>GSTIN : {safeText(currentUser?.taxId)}</Text>
            </View>
            <View style={[s.infoCell, { width: "30%" }]}>
              <Text>Invoice No. : {safeText(invoiceData?.invoiceNumber)}</Text>
            </View>
            <View style={[s.infoCell, { width: "30%", borderRightWidth: 0 }]}>
              <Text>Invoice Date : {invoiceData?.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB") : ""}</Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.wSno, s.textCenter]}>S.No.</Text>
            <Text style={[s.tableCell, s.wQty, s.textCenter]}>Qty.</Text>
            <Text style={[s.tableCell, s.wDesc]}>Description</Text>
            <Text style={[s.tableCell, s.wBatch, s.textCenter]}>Batch</Text>
            <Text style={[s.tableCell, s.wExp, s.textCenter]}>Exp</Text>
            <Text style={[s.tableCell, s.wHsn, s.textCenter]}>HSN</Text>
            <Text style={[s.tableCell, s.wRate, s.textRight]}>Rate</Text>
            <Text style={[s.tableCell, s.wDisc, s.textCenter]}>Dis. %</Text>
            <Text style={[s.tableCell, s.wAmt, s.textRight]}>Amount</Text>
          </View>

          {/* Table Body */}
          {items.map((item, index) => (
            <View key={index} style={s.tableRow}>
              <Text style={[s.tableCell, s.wSno, s.textCenter]}>{index + 1}</Text>
              <Text style={[s.tableCell, s.wQty, s.textCenter]}>{Number(item.quantity).toFixed(2)}</Text>
              <Text style={[s.tableCell, s.wDesc]}>{safeText(item.description)}</Text>
              <Text style={[s.tableCell, s.wBatch]}>{safeText(item.batch)}</Text>
              <Text style={[s.tableCell, s.wExp]}>{safeText(item.exp)}</Text>
              <Text style={[s.tableCell, s.wHsn, s.textCenter]}>{safeText(item.hsnCode)}</Text>
              <Text style={[s.tableCell, s.wRate, s.textRight]}>{Number(item.baseRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              <Text style={[s.tableCell, s.wDisc, s.textCenter]}>{Number(item.discountPercent || 0).toFixed(2)}</Text>
              <Text style={[s.tableCell, s.wAmt, s.textRight]}>{Number(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}

          {/* Spacing to push content to bottom */}
          <View style={{ flexGrow: 1, borderBottomWidth: 1, borderColor: "#000" }} />

          {/* Bottom Section */}
          <View style={s.bottomContainer}>
            <View style={s.bottomLeft}>
              <Text style={{ fontSize: 8, marginBottom: 10 }}>GST {grandTotal.toFixed(2)} * 0% = 0 SGST,</Text>
              
              <Text style={s.termsTitle}>Terms & Conditions:</Text>
              <Text style={s.termsText}>1) Goods once sold will not be taken back or exchanged.</Text>
              <Text style={s.termsText}>2) Bills not paid due date will attract 24% interest.</Text>
              <Text style={s.termsText}>3) All disputes subject to Jurisdiction only.</Text>
              <Text style={s.termsText}>4) Prescribed Sales Tax declaration will be given.</Text>

              <View style={s.signatureArea}>
                <Text style={s.bold}>For {safeText(currentUser?.businessName || "Billing")}</Text>
                {signatureBase64 && invoiceData.includeSignature !== false ? (
                  <Image 
                    src={signatureBase64} 
                    style={{ width: 180, height: 60, objectFit: "contain", alignSelf: "flex-end", marginBottom: 10, marginTop: 10 }} 
                  />
                ) : (
                  <View style={{ height: 60 }} />
                )}
                <Text style={{ fontSize: 9 }}>Authorised Signatory</Text>
              </View>
            </View>

            <View style={s.bottomRight}>
              <View style={s.totalsRow}>
                <Text style={s.totalLabel}>Sub Total</Text>
                <Text style={s.totalVal}>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={s.totalsRow}>
                <Text style={s.totalLabel}>Bill Dis</Text>
                <Text style={s.totalVal}>{discount.toFixed(2)}</Text>
              </View>
              <View style={s.totalsRow}>
                <Text style={s.totalLabel}>SGST</Text>
                <Text style={s.totalVal}>{(totalTax / 2).toFixed(2)}</Text>
              </View>
              <View style={[s.totalsRow, { borderBottomWidth: 0 }]}>
                <Text style={s.totalLabel}>CGST</Text>
                <Text style={s.totalVal}>{(totalTax / 2).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Final Footer Bar */}
          <View style={s.footerBar}>
            <Text style={s.grandTotalText}>
              Rs. {typeof numberToWords === "function" ? numberToWords(grandTotal) : ""} only
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[s.grandTotalText, { marginRight: 10 }]}>Grand Total</Text>
              <Text style={[s.grandTotalText, { fontSize: 14 }]}>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};

export default Template6PDF;    