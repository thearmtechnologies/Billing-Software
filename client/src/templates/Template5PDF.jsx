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
    padding: 25,
    color: "#000",
    backgroundColor: "#fff",
    lineHeight: 1.4,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  textRight: { textAlign: "right" },
  textCenter: { textAlign: "center" },

  // 1. Top Title
  mainTitle: { 
    fontSize: 16, 
    fontFamily: "Helvetica-Bold", 
    textAlign: "center", 
    marginBottom: 8, 
    textTransform: "uppercase" 
  },

  // Borders & Boxes Base
  box: { 
    borderWidth: 1, 
    borderColor: "#000", 
    marginBottom: 10 
  },
  boxRow: { flexDirection: "row" },
  
  // 2. Company Header Box
  headerColLeft: { width: "65%", padding: 6, borderRightWidth: 1, borderColor: "#000" },
  headerColRight: { width: "35%", padding: 6, justifyContent: "center" },
  businessName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  companyText: { fontSize: 9, color: "#222" },
  
  // 3. Bill To & Invoice Info Box
  billToColLeft: { width: "65%", padding: 6, borderRightWidth: 1, borderColor: "#000" },
  billToColRight: { width: "35%", padding: 6 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#444" },
  customerName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  customerText: { fontSize: 9, color: "#222" },

  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  metaLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  metaValue: { fontSize: 9, textAlign: "right" },

  // 4. Items Table
  table: { 
    borderWidth: 1, 
    borderColor: "#000", 
    marginBottom: 10 
  },
  tableHeader: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderColor: "#000", 
    backgroundColor: "#f0f0f0" 
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ccc" },
  tableRowLast: { flexDirection: "row" },
  
  colHeader: { padding: 4, fontSize: 8, fontFamily: "Helvetica-Bold", borderRightWidth: 1, borderColor: "#000", textAlign: "center" },
  colHeaderLast: { padding: 4, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center" },
  colCell: { padding: 4, fontSize: 8, borderRightWidth: 1, borderColor: "#000" },
  colCellLast: { padding: 4, fontSize: 8 },

  wNo: { width: "5%" },
  wItem: { width: "32%" },
  wHsn: { width: "12%" },
  wQty: { width: "10%" },
  wPrice: { width: "14%" },
  wGst: { width: "12%" },
  wAmt: { width: "15%" },

  tableTotalRow: { 
    flexDirection: "row", 
    borderTopWidth: 1, 
    borderColor: "#000", 
    backgroundColor: "#f9f9f9" 
  },

  // 6. Tax Summary
  taxTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  tHsn: { width: "16%" },
  tTaxable: { width: "14%" },
  tCgstRate: { width: "10%" },
  tCgstAmt: { width: "15%" },
  tSgstRate: { width: "10%" },
  tSgstAmt: { width: "15%" },
  tTotalTax: { width: "20%" },

  // 7. Totals & Words
  bottomSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  wordsBox: { width: "55%", paddingRight: 10 },
  wordsLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  wordsText: { fontSize: 9, fontStyle: "italic", color: "#333", lineHeight: 1.5 },

  totalsBox: { width: "40%", borderWidth: 1, borderColor: "#000" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", padding: 5, borderBottomWidth: 1, borderColor: "#ccc" },
  totalRowLast: { flexDirection: "row", justifyContent: "space-between", padding: 5, backgroundColor: "#f0f0f0" },
  totalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalValBold: { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" },

  // 8 & 9. Footer
  footerBox: { flexDirection: "row", justifyContent: "space-between", marginTop: "auto", paddingTop: 10 },
  termsBox: { width: "55%" },
  sigBox: { width: "35%", alignItems: "flex-end", paddingTop: 30 },
  sigLine: { borderTopWidth: 1, borderColor: "#000", width: "100%", textAlign: "center", paddingTop: 4 },
});

// ── Component ───────────────────────────────────────────────────
const Template5PDF = ({ invoiceData, currentUser, numberToWords, signatureBase64 }) => {
  // Aggregate totals for the items table bottom row
  const totalQty = invoiceData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const aggregateSubtotal = invoiceData.subtotal;

  // Aggregate Tax Summary by HSN / Tax Rate
  // Since we shouldn't change the calculation logic globally, we just group the existing items for display
  const taxSummary = invoiceData.items.reduce((acc, item) => {
    const hsn = item.hsnCode || "None";
    const taxable = item.subtotal;
    const taxRate = item.taxRate || 0;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;
    const taxAmt = (taxable * taxRate) / 100;
    const cgstAmt = taxAmt / 2;
    const sgstAmt = taxAmt / 2;

    const key = `${hsn}-${taxRate}`;
    if (!acc[key]) {
      acc[key] = { hsn, taxable: 0, cgstRate, cgstAmt: 0, sgstRate, sgstAmt: 0, totalTax: 0 };
    }
    acc[key].taxable += taxable;
    acc[key].cgstAmt += cgstAmt;
    acc[key].sgstAmt += sgstAmt;
    acc[key].totalTax += taxAmt;
    return acc;
  }, {});

  const taxSummaryRows = Object.values(taxSummary);
  
  const totalTaxable = taxSummaryRows.reduce((sum, row) => sum + row.taxable, 0);
  const totalCgst = taxSummaryRows.reduce((sum, row) => sum + row.cgstAmt, 0);
  const totalSgst = taxSummaryRows.reduce((sum, row) => sum + row.sgstAmt, 0);
  const totalSummaryTax = taxSummaryRows.reduce((sum, row) => sum + row.totalTax, 0);

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
          </View>
          <View style={s.headerColRight}>
            <Text style={s.sectionTitle}>GSTIN</Text>
            <Text style={[s.bold, { fontSize: 11 }]}>{currentUser?.taxId || "N/A"}</Text>
          </View>
        </View>

        {/* 3. Bill To + Invoice Details Box */}
        <View style={[s.box, s.boxRow]}>
          <View style={s.billToColLeft}>
            <Text style={s.sectionTitle}>Bill To:</Text>
            <Text style={s.customerName}>{invoiceData.client?.companyName || "Customer Name"}</Text>
            {invoiceData.client?.address && (
              <Text style={s.customerText}>
                {invoiceData.client.address.street}
                {invoiceData.client.address.city ? `\n${invoiceData.client.address.city}, ${invoiceData.client.address.state} ${invoiceData.client.address.zipCode}` : ""}
              </Text>
            )}
            <Text style={s.customerText}>Phone: {invoiceData.client?.phone || "N/A"}</Text>
          </View>
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
          </View>
        </View>

        {/* 4. Items Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.colHeader, s.wNo]}>#</Text>
            <Text style={[s.colHeader, s.wItem, { textAlign: "left" }]}>Item name</Text>
            <Text style={[s.colHeader, s.wHsn]}>HSN/SAC</Text>
            <Text style={[s.colHeader, s.wQty, s.textRight]}>Quantity</Text>
            <Text style={[s.colHeader, s.wPrice, s.textRight]}>Price / Unit (Rs. )</Text>
            <Text style={[s.colHeader, s.wGst, s.textRight]}>GST (Rs. )</Text>
            <Text style={[s.colHeaderLast, s.wAmt, s.textRight]}>Amount (Rs. )</Text>
          </View>
          
          {invoiceData.items.map((item, index) => {
            const isLast = index === invoiceData.items.length - 1;
            const taxAmt = ((item.subtotal * (item.taxRate || 0)) / 100);
            return (
              <View key={index} style={isLast ? s.tableRowLast : s.tableRow}>
                <Text style={[s.colCell, s.wNo, s.textCenter]}>{index + 1}</Text>
                <View style={[s.colCell, s.wItem]}>
                  <Text style={s.bold}>{item.description}</Text>
                  {item.notes && <Text style={{ fontSize: 7, color: "#555", marginTop: 2 }}>{item.notes}</Text>}
                </View>
                <Text style={[s.colCell, s.wHsn, s.textCenter]}>{item.hsnCode || "-"}</Text>
                <Text style={[s.colCell, s.wQty, s.textRight]}>{item.quantity}</Text>
                <Text style={[s.colCell, s.wPrice, s.textRight]}>{item.baseRate.toFixed(2)}</Text>
                <Text style={[s.colCell, s.wGst, s.textRight]}>
                  {taxAmt.toFixed(2)}{"\n"}
                  <Text style={{ fontSize: 6, color: "#666" }}>({item.taxRate || 0}%)</Text>
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
            <Text style={[s.colCell, s.wGst]}></Text>
            <Text style={[s.colCellLast, s.wAmt, s.bold, s.textRight]}>{aggregateSubtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* 6. Tax Summary Section */}
        {taxSummaryRows.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={s.taxTitle}>Tax Summary</Text>
            <View style={[s.table, { marginBottom: 0 }]}>
              <View style={s.tableHeader}>
                <Text style={[s.colHeader, s.tHsn]}>HSN/SAC</Text>
                <Text style={[s.colHeader, s.tTaxable, s.textRight]}>Taxable Amount</Text>
                <Text style={[s.colHeader, s.tCgstRate, s.textRight]}>CGST Rate</Text>
                <Text style={[s.colHeader, s.tCgstAmt, s.textRight]}>CGST Amount</Text>
                <Text style={[s.colHeader, s.tSgstRate, s.textRight]}>SGST Rate</Text>
                <Text style={[s.colHeader, s.tSgstAmt, s.textRight]}>SGST Amount</Text>
                <Text style={[s.colHeaderLast, s.tTotalTax, s.textRight]}>Total Tax</Text>
              </View>
              {taxSummaryRows.map((row, idx) => (
                <View key={idx} style={s.tableRow}>
                  <Text style={[s.colCell, s.tHsn, s.textCenter]}>{row.hsn}</Text>
                  <Text style={[s.colCell, s.tTaxable, s.textRight]}>Rs. {row.taxable.toFixed(2)}</Text>
                  <Text style={[s.colCell, s.tCgstRate, s.textRight]}>{row.cgstRate}%</Text>
                  <Text style={[s.colCell, s.tCgstAmt, s.textRight]}>Rs. {row.cgstAmt.toFixed(2)}</Text>
                  <Text style={[s.colCell, s.tSgstRate, s.textRight]}>{row.sgstRate}%</Text>
                  <Text style={[s.colCell, s.tSgstAmt, s.textRight]}>Rs. {row.sgstAmt.toFixed(2)}</Text>
                  <Text style={[s.colCellLast, s.tTotalTax, s.textRight]}>Rs. {row.totalTax.toFixed(2)}</Text>
                </View>
              ))}
              <View style={s.tableTotalRow}>
                <Text style={[s.colCell, s.tHsn, s.bold, s.textRight]}>TOTAL</Text>
                <Text style={[s.colCell, s.tTaxable, s.bold, s.textRight]}>Rs. {totalTaxable.toFixed(2)}</Text>
                <Text style={[s.colCell, s.tCgstRate]}></Text>
                <Text style={[s.colCell, s.tCgstAmt, s.bold, s.textRight]}>Rs. {totalCgst.toFixed(2)}</Text>
                <Text style={[s.colCell, s.tSgstRate]}></Text>
                <Text style={[s.colCell, s.tSgstAmt, s.bold, s.textRight]}>Rs. {totalSgst.toFixed(2)}</Text>
                <Text style={[s.colCellLast, s.tTotalTax, s.bold, s.textRight]}>Rs. {totalSummaryTax.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 7. Totals & Words Right Side block */}
        <View style={s.bottomSection}>
          <View style={s.wordsBox}>
            <Text style={s.wordsLabel}>Invoice Amount in Words:</Text>
            <Text style={s.wordsText}>
              {numberToWords ? numberToWords(invoiceData.totalAmount) : "Amount in words not available."}
            </Text>
          </View>
          
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Sub Total</Text>
              <Text style={s.totalValue}>{invoiceData.subtotal.toFixed(2)}</Text>
            </View>
            {invoiceData.discount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Discount</Text>
                <Text style={s.totalValue}>- {invoiceData.discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total Tax</Text>
              <Text style={s.totalValue}>{invoiceData.totalTax.toFixed(2)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { fontSize: 11 }]}>Total</Text>
              <Text style={s.totalValBold}>Rs. {invoiceData.totalAmount.toFixed(2)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Received</Text>
              <Text style={s.totalValue}>{invoiceData.receivedAmount?.toFixed(2) || "0.00"}</Text>
            </View>
            <View style={s.totalRowLast}>
              <Text style={s.totalLabel}>Balance</Text>
              <Text style={s.totalValBold}>Rs. {(invoiceData.totalAmount - (invoiceData.receivedAmount || 0)).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 8. Terms & 9. Signature Sections */}
        <View style={s.footerBox}>
          <View style={s.termsBox}>
            <Text style={s.sectionTitle}>Terms & Conditions:</Text>
            <Text style={{ fontSize: 8, color: "#444" }}>
              {invoiceData.notes || "Thanks for doing business with us!"}
            </Text>
          </View>

          <View style={s.sigBox}>
            <Text style={[s.bold, { fontSize: 10, marginBottom: signatureBase64 && invoiceData.includeSignature !== false ? 10 : 35 }]}>
              For {currentUser?.businessName || "Your Company Name"}
            </Text>
            {signatureBase64 && invoiceData.includeSignature !== false && (
              <Image 
                src={signatureBase64} 
                style={{ width: 100, height: 35, objectFit: "contain", alignSelf: "flex-end", marginBottom: 10 }} 
              />
            )}
            <View style={s.sigLine}>
              <Text style={s.sectionTitle}>Authorized Signatory</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default Template5PDF;