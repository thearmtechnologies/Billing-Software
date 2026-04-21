import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 15,
    color: "#000",
    backgroundColor: "#fff",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  topSmallText: {
    fontSize: 8,
    color: "#333",
    fontFamily: "Helvetica-Bold",
  },
  blueBar: {
    backgroundColor: "#1976D2",
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  blueBarText: {
    color: "#FFF",
    fontSize: 9.5,
    textAlign: "center",
  },
  mainBox: {
    borderWidth: 1,
    borderColor: "#000",
    flex: 1, 
  },
  // Recipient / Supplier forms
  leftRow: {
    borderTopWidth: 1,
    borderColor: "#000",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  leftRowCentered: {
    borderTopWidth: 1,
    borderColor: "#000",
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  recipientRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#000",
  },
  recipientLabel: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    width: "30%",
    borderRightWidth: 1,
    borderColor: "#000",
  },
  recipientValue: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    width: "70%",
    justifyContent: "center",
  },
  rightMetaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  rightMetaLabel: {
    width: "45%",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  rightMetaValue: {
    width: "55%",
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#000",
  },
  footerLeft: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  bankTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
    textDecoration: "underline",
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#F4F4F4",
  },
  th: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 8.5,
  },
  td: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 8.5,
  },
});

const Template7PDF = ({ invoiceData, numberToWords, currentUser, signatureBase64, logoBase64 }) => {
  const items = invoiceData.items || [];

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getServicePeriod = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${monthNames[d.getMonth()]} - ${d.getFullYear()}`;
  };

  const formatAmt = (num) => (num != null ? Number(num).toFixed(2) : "0.00");
  const subtotal = invoiceData.subtotal || 0;
  
  // Col mapping enforces rigid right-hand borders that integrate cleanly into row widths
  const colDims = { sr: "6%", desc: "40%", hsn: "11%", qty: "7%", unit: "7%", rate: "14%", total: "15%" };
  const leftOffset = 100 - parseInt(colDims.total); // exactly 85% aligning Total boundaries

  const numToWordsStr = numberToWords ? numberToWords(Math.round(invoiceData.totalAmount || 0)) : "";
  const wordsFormatted = numToWordsStr.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* HEADER Section */}
        {(logoBase64 && invoiceData.includeLogo !== false) ? (
          <View style={{ flexDirection: "row", paddingHorizontal: 15, marginBottom: 12, marginTop: 5 }}>
            {/* Logo on the left */}
            <View style={{ width: 85, justifyContent: "center", alignItems: "flex-start" }}>
              <Image src={logoBase64} style={{ width: 80, height: 80, objectFit: "contain" }} />
            </View>
            
            {/* Text on the right */}
            <View style={{ flex: 1, paddingLeft: 10, justifyContent: "center" }}>
              {/* Top Row: GSTIN & Udyam */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: -2 }}>
                  <Text style={{ fontSize: 9, color: "#2E5B7E", fontFamily: "Helvetica-Bold" }}>GSTIN : 24JWWPS0589B1ZV</Text>
                  <Text style={{ fontSize: 9, color: "#2E5B7E", fontFamily: "Helvetica-Bold" }}>UDYAM NO : GJ-06-0011080</Text>
              </View>
              
              {/* Brand Name */}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 36, color: "#E04F3D", letterSpacing: 1.5, marginTop: 5 }}>
                    R C MECHANICALS
                  </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: "column", paddingHorizontal: 15, marginBottom: 12, marginTop: 5, justifyContent: "center" }}>
            {/* Top Row: GSTIN & Udyam */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: -2 }}>
                <Text style={{ fontSize: 9, color: "#2E5B7E", fontFamily: "Helvetica-Bold" }}>GSTIN : 24JWWPS0589B1ZV</Text>
                <Text style={{ fontSize: 9, color: "#2E5B7E", fontFamily: "Helvetica-Bold" }}>UDYAM NO : GJ-06-0011080</Text>
            </View>
            
            {/* Brand Name perfectly centered across full width */}
            <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 36, color: "#E04F3D", letterSpacing: 1.5, marginTop: 5 }}>
                  R C MECHANICALS
                </Text>
            </View>
          </View>
        )}

        {/* BLUE ADDRESS BAR */}
        <View style={{ backgroundColor: "#1D70B8", marginHorizontal: 15, paddingVertical: 4, borderRadius: 2 }}>
          <Text style={{ color: "#FFF", fontSize: 9.5, textAlign: "center" }}>
            Third Floor, T-7, Golden Square Mall, Beside D-Mart, Near ABC Circle, Bholav, Bharuch, Gujarat 392001, India.
          </Text>
        </View>

        {/* CONTACT STRIP */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, paddingHorizontal: 15 }}>
          <Text style={{ color: "#E04F3D", fontSize: 9, fontFamily: "Helvetica-Bold" }}>E-mail: rcmechanicals21@gmail.com</Text>
          <Text style={{ color: "#E04F3D", fontSize: 9, fontFamily: "Helvetica-Bold" }}>Mob.: 8601941900, 9458760060</Text>
        </View>
        <View style={{ height: 1, backgroundColor: "#E04F3D", marginHorizontal: 15, marginBottom: 10 }} />

        {/* MAIN BORDERED BOX */}
        <View style={s.mainBox}>
          
          {/* TITLE & ORIGINAL TAB */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#000", position: "relative", backgroundColor: "#F9F9F9" }}>
            <View style={{ flex: 1, paddingVertical: 6, alignItems: "center", justifyContent: "center" }}>
              <Text style={[s.bold, { fontSize: 11, letterSpacing: 1 }]}>TAX INVOICE</Text>
            </View>
            <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, borderLeftWidth: 1, borderColor: "#000", justifyContent: "center", backgroundColor: "#FFF" }}>
              <Text style={{ textAlign: "center", fontSize: 9 }}>Original</Text>
            </View>
          </View>

          {/* SPLIT GRID: LEFT (Supplier+Recipient+Financials) | RIGHT (Invoice Meta) */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" }}>
            
            {/* LEFT HALF */}
            <View style={{ width: "50%", borderRightWidth: 1, borderColor: "#000" }}>
              
              {/* Supplier Info */}
              <View style={{ paddingVertical: 6, paddingHorizontal: 8 }}>
                <Text style={[s.bold, { fontSize: 13, marginBottom: 4 }]}>{currentUser?.businessName || "R C MECHANICALS"}</Text>
                <Text style={{ lineHeight: 1.3 }}>{currentUser?.address?.street || "Third Floor, T-7, Golden Square Mall, Beside D-Mart"}</Text>
                <Text style={{ lineHeight: 1.3, marginTop: 2 }}>{currentUser?.address?.city || "Near ABC Circle, Bholav, Bharuch"}, {currentUser?.address?.state || "Gujarat"} {currentUser?.address?.postalCode || "392001"}</Text>
              </View>

              {/* Supplier Meta */}
              <View style={s.leftRow}><Text style={s.bold}>GSTIN : {currentUser?.taxId || "-"}</Text></View>

              {/* Recipient Title */}
              <View style={s.leftRowCentered}>
                <Text style={[s.bold, { textDecoration: "underline" }]}>Details of Recipient of Service</Text>
              </View>

              {/* Recipient Info */}
              <View style={s.recipientRow}>
                <View style={s.recipientLabel}><Text>Name</Text></View>
                <View style={s.recipientValue}><Text style={s.bold}>{invoiceData.client?.companyName || "-"}</Text></View>
              </View>
              <View style={s.recipientRow}>
                <View style={s.recipientLabel}><Text>Address</Text></View>
                <View style={s.recipientValue}>
                  <Text style={{ lineHeight: 1.3 }}>{invoiceData.client?.address?.street || "-"}</Text>
                  {invoiceData.client?.address?.city && <Text style={{ marginTop: 2 }}>{invoiceData.client?.address?.city}</Text>}
                </View>
              </View>
              <View style={s.recipientRow}>
                <View style={s.recipientLabel}><Text>State</Text></View>
                <View style={s.recipientValue}><Text>{invoiceData.client?.address?.state || "Gujarat"}</Text></View>
              </View>
              <View style={s.recipientRow}>
                <View style={s.recipientLabel}><Text>State code</Text></View>
                <View style={s.recipientValue}><Text>{invoiceData.client?.address?.stateCode || "24"}</Text></View>
              </View>
              <View style={s.recipientRow}>
                <View style={s.recipientLabel}><Text>GSTIN</Text></View>
                <View style={s.recipientValue}><Text style={s.bold}>{invoiceData.client?.gstNumber || "-"}</Text></View>
              </View>

              {/* Financials & Bank Details (Restored) */}
              <View style={s.footerLeft}>
                <Text style={s.bold}>AMOUNT IN WORDS:</Text>
                <Text style={{ marginBottom: 8 }}>{numToWordsStr} Rupees Only.</Text>
                
                {invoiceData?.bankDetails && (
                  <View style={{ marginTop: 5 }}>
                    <Text style={s.bankTitle}>BANK DETAILS FOR PAYMENT</Text>
                    <View style={{ gap: 2 }}>
                      <Text>BANK NAME: {invoiceData.bankDetails.bankName || "-"}</Text>
                      <Text>AC NAME: {invoiceData.bankDetails.accountHolderName || "-"}</Text>
                      <Text>AC NO: {invoiceData.bankDetails.accountNumber || "-"}</Text>
                      <Text>IFSC CODE: {invoiceData.bankDetails.ifscCode || "-"}</Text>
                      <Text>BRANCH: {invoiceData.bankDetails.branchName || "-"}</Text>
                    </View>
                  </View>
                )}
                
                <View style={{ marginTop: 20, marginBottom: 10 }}>
                  <Text style={s.bold}>CUSTOMER RECEIVING</Text>
                  <View style={{ borderBottomWidth: 1, width: 120, marginTop: 20 }} />
                </View>
              </View>

              {/* Description Of Service Note */}
              <View style={[s.leftRow, { flex: 1 }]}>
                <Text style={{ lineHeight: 1.3 }}>
                  <Text style={s.bold}>Description Of Service : </Text>
                  {invoiceData.notes || "Annual Rate Contract for maintenance and related activities."}
                </Text>
              </View>

            </View>

            {/* RIGHT HALF */}
            <View style={{ width: "50%" }}>
              <View style={s.rightMetaRow}>
                <View style={s.rightMetaLabel}><Text>Serial No. of Invoice</Text></View>
                <View style={s.rightMetaValue}><Text>{invoiceData.invoiceNumber || "-"}</Text></View>
              </View>
              <View style={s.rightMetaRow}>
                <View style={s.rightMetaLabel}><Text>Date of Invoice</Text></View>
                <View style={s.rightMetaValue}><Text>{formatDate(invoiceData.invoiceDate)}</Text></View>
              </View>
              <View style={s.rightMetaRow}>
                <View style={s.rightMetaLabel}><Text>Place of Supply</Text></View>
                <View style={s.rightMetaValue}><Text>{invoiceData.client?.address?.city || "-"}</Text></View>
              </View>
              <View style={s.rightMetaRow}>
                <View style={s.rightMetaLabel}><Text>Work Order No.</Text></View>
                <View style={s.rightMetaValue}><Text>{invoiceData.workOrderNo || "-"}</Text></View>
              </View>
              <View style={s.rightMetaRow}>
                <View style={s.rightMetaLabel}><Text>Work Order Date</Text></View>
                <View style={s.rightMetaValue}><Text>{formatDate(invoiceData.workOrderDate)}</Text></View>
              </View>
              {/* Inherits transparent background stretching inherently downward aligned with left cols intrinsic height limit */}
              <View style={{ flex: 1 }} />
            </View>

          </View>

          {/* ITEM TABLE HEADER */}
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: colDims.sr }]}>Sr.No</Text>
            <Text style={[s.th, { width: colDims.desc }]}>Description of Services</Text>
            <Text style={[s.th, { width: colDims.hsn }]}>HSN / SAC</Text>
            <Text style={[s.th, { width: colDims.qty }]}>Qty.</Text>
            <Text style={[s.th, { width: colDims.unit }]}>Unit</Text>
            <Text style={[s.th, { width: colDims.rate }]}>Unit Rate</Text>
            <Text style={[s.th, { width: colDims.total, borderRightWidth: 0 }]}>Total Amount</Text>
          </View>

          {/* ITEM ROWS */}
          {items.map((item, index) => (
            <View key={index} style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" }}>
              <View style={[s.td, { width: colDims.sr }]}><Text style={{ textAlign: "center" }}>{index + 1}</Text></View>
              <View style={[s.td, { width: colDims.desc }]}>
                <Text style={{ lineHeight: 1.3 }}>{item.description}</Text>
                {item.notes && <Text style={{ marginTop: 4, fontSize: 8 }}>{item.notes}</Text>}
              </View>
              <View style={[s.td, { width: colDims.hsn }]}><Text style={{ textAlign: "center" }}>{item.hsnCode || "-"}</Text></View>
              <View style={[s.td, { width: colDims.qty }]}><Text style={{ textAlign: "center" }}>{item.quantity != null ? Number(item.quantity).toFixed(3) : "0.000"}</Text></View>
              <View style={[s.td, { width: colDims.unit }]}><Text style={{ textAlign: "center" }}>{item.unitType || "UOM"}</Text></View>
              <View style={[s.td, { width: colDims.rate }]}><Text style={{ textAlign: "right" }}>{item.baseRate != null ? Number(item.baseRate).toFixed(2) : "0.00"}</Text></View>
              <View style={[s.td, { width: colDims.total, borderRightWidth: 0 }]}><Text style={{ textAlign: "right" }}>{item.subtotal != null ? Number(item.subtotal).toFixed(2) : "0.00"}</Text></View>
            </View>
          ))}

          {/* TOTALS SECTIONS */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#000", backgroundColor: "#FAFAFA" }}>
            <View style={{ width: `${leftOffset}%`, borderRightWidth: 1, borderColor: "#000", paddingVertical: 5, paddingHorizontal: 6, justifyContent: "center" }}>
              <Text style={[s.bold, { textAlign: "right" }]}>Total Taxable Value ====&gt;</Text>
            </View>
            <View style={{ width: colDims.total, paddingVertical: 5, paddingHorizontal: 4, justifyContent: "center" }}>
              <Text style={[s.bold, { textAlign: "right" }]}>{formatAmt(subtotal)}</Text>
            </View>
          </View>

          {invoiceData.taxes && invoiceData.taxes.map((tax, i) => (
            <View key={`tax-${i}`} style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#000", backgroundColor: "#FAFAFA" }}>
              <View style={{ width: `${leftOffset}%`, borderRightWidth: 1, borderColor: "#000", paddingVertical: 5, paddingHorizontal: 6, justifyContent: "center" }}>
                <Text style={[s.bold, { textAlign: "right" }]}>{tax.name} : {tax.rate}% ==========&gt;</Text>
              </View>
              <View style={{ width: colDims.total, paddingVertical: 5, paddingHorizontal: 4, justifyContent: "center" }}>
                <Text style={{ textAlign: "right" }}>{formatAmt(tax.amount)}</Text>
              </View>
            </View>
          ))}

          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#000", backgroundColor: "#F5F5F5" }}>
            <View style={{ width: `${leftOffset}%`, borderRightWidth: 1, borderColor: "#000", paddingVertical: 5, paddingHorizontal: 6, justifyContent: "center" }}>
              <Text style={[s.bold, { textAlign: "right" }]}>TOTAL BILL VALUE (IN FIGURE)</Text>
            </View>
            <View style={{ width: colDims.total, paddingVertical: 5, paddingHorizontal: 4, justifyContent: "center" }}>
              <Text style={[s.bold, { textAlign: "right" }]}>
                {invoiceData.totalAmount != null ? Math.round(invoiceData.totalAmount).toLocaleString("en-IN") : "0"}
              </Text>
            </View>
          </View>

          {/* AMOUNT IN WORDS */}
          {/* Note: Left col matches strictly to "Desc" column width ensuring vertical borders map flawlessly downward linearly */}
          <View style={{ flexDirection: "row", backgroundColor: "#FAFAFA" }}>
            <View style={{ width: "46%", paddingVertical: 6, paddingHorizontal: 6, borderRightWidth: 1, borderColor: "#000", justifyContent: "center" }}>
              <Text style={[s.bold, { textAlign: "center", fontSize: 8.5 }]}>TOTAL BILL VALUE (IN WORDS)</Text>
            </View>
            <View style={{ width: "54%", paddingVertical: 6, paddingHorizontal: 8, justifyContent: "center" }}>
              <Text style={s.bold}>{wordsFormatted ? `${wordsFormatted} Rupees Only.` : "-"}</Text>
            </View>
          </View>

        </View>

        {/* FOOTER SIGNATURE AREA */}
        <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 12, marginTop: 5 }}>
          <View style={{ flex: 1 }}>
            {/* Optional left footer content can go here */}
          </View>
          <View style={{ width: "45%", alignItems: "center" }}>
            <Text style={s.bold}>For {currentUser?.businessName || "R C MECHANICALS"}</Text>
            
            <View style={{ height: 65, justifyContent: "center", alignItems: "center", marginVertical: 8 }}>
              {signatureBase64 ? (
                <Image src={signatureBase64} style={{ maxWidth: 140, maxHeight: 60, objectFit: "contain" }} />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: "#1565C0", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 6, color: "#1565C0", textAlign: "center" }}>{currentUser?.businessName || "STAMP"}</Text>
                </View>
              )}
            </View>

            <Text style={s.bold}>Authorised signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default Template7PDF;