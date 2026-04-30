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
    fontSize: 8,
    paddingTop: 15,
    paddingBottom: 20,
    paddingLeft: 25,
    paddingRight: 25,
    color: "#000",
    backgroundColor: "#fff",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  
  // Layout utilities
  row: {
    flexDirection: "row",
  },
  
  // Borders
  borderTop: { borderTopWidth: 1, borderColor: "#000" },
  borderBottom: { borderBottomWidth: 1, borderColor: "#000" },
  borderLeft: { borderLeftWidth: 1, borderColor: "#000" },
  borderRight: { borderRightWidth: 1, borderColor: "#000" },
  
  // specific sections
  blueBar: {
    backgroundColor: "#1D70B8",
    paddingVertical: 3,
    borderRadius: 2,
  },
  blueBarText: {
    color: "#FFF",
    fontSize: 8,
    textAlign: "center",
  },

  // Tables - COMPACT VERSION
  th: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 7.5,
  },
  td: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 7.5,
  },

  // Grid rows - The fundamental fix for broken borders
  gridRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  headerGridRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
  }, 
  
  // Labels - COMPACT
  metaLabel: {
    width: "40%",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 7.5,
  },
  metaValue: {
    width: "60%",
    paddingVertical: 3,
    paddingHorizontal: 4,
    justifyContent: "center",
    fontSize: 7.5,
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

  const formatAmt = (num) => (num != null ? Number(num).toFixed(2) : "0.00");
  const subtotal = invoiceData.subtotal || 0;
  
  // COMPACT column widths - optimized
  const colDims = { sr: "5%", desc: "34%", hsn: "10%", qty: "7%", unit: "7%", rate: "22%", total: "15%" };
  const leftOffset = 100 - parseInt(colDims.total); 

  const numToWordsStr = numberToWords ? numberToWords(Math.round(invoiceData.totalAmount || 0)) : "";
  const wordsFormatted = numToWordsStr.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const bankDetails = invoiceData.selectedBankAccount || currentUser?.bankAccounts?.[0] || {};
  const client = invoiceData.client || {};
  const clientAddr = client.address || {};
  const userAddr = currentUser?.address || {};

  return (
    <Document>
      <Page size="A4" style={s.page} wrap={false}>
        
        {/* HEADER — matches reference image exactly */}
        <View style={{ flexDirection: "row", marginTop: 2, marginBottom: 4, alignItems: "center" }} wrap={false}>
          
          {/* LEFT: Logo */}
          {(logoBase64 && invoiceData.includeLogo !== false) && (
            <View style={{ width: 50, height: 50, flexShrink: 0, justifyContent: "center", alignItems: "center", marginRight: 8 }}>
              <Image src={logoBase64} style={{ maxWidth: 48, maxHeight: 48 }} />
            </View>
          )}

          {/* RIGHT: GSTIN/UDYAM row + Business Name */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            {/* GSTIN and UDYAM on same line */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 7.5, color: "#2E5B7E", fontFamily: "Helvetica-Bold" }}>
                GSTIN : {currentUser?.taxId || "-"}
              </Text>
              <Text style={{ fontSize: 7.5, color: "#2E5B7E", fontFamily: "Helvetica-Bold" }}>
                UDYAM NO : {currentUser?.udyamNo || "-"}
              </Text>
            </View>
            {/* Large Red Business Name */}
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 20, color: "#E04F3D", letterSpacing: 1 }}>
              {currentUser?.businessName || "BUSINESS NAME"}
            </Text>
          </View>

        </View>

        {/* Blue Address Bar */}
        <View style={s.blueBar} wrap={false}>
          <Text style={s.blueBarText}>
            {userAddr.street ? `${userAddr.street}, ` : ""}{userAddr.city ? `${userAddr.city}, ` : ""}{userAddr.state ? `${userAddr.state} ` : ""}{userAddr.postalCode || ""}
          </Text>
        </View>

        {/* Email and Mobile */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }} wrap={false}>
          <Text style={{ color: "#E04F3D", fontSize: 7.5, fontFamily: "Helvetica-Bold" }}>E-mail: {currentUser?.email || "-"}</Text>
          <Text style={{ color: "#E04F3D", fontSize: 7.5, fontFamily: "Helvetica-Bold" }}>Mob.: {currentUser?.phone || "-"}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: "#E04F3D", marginBottom: 5 }} wrap={false} />

        {/* TITLE ROW - COMPACT */}
        <View style={[s.headerGridRow, { backgroundColor: "#F9F9F9" }]} wrap={false}>
          <View style={{ flex: 1, paddingVertical: 3, alignItems: "center", justifyContent: "center" }}>
            <Text style={[s.bold, { fontSize: 10, letterSpacing: 1 }]}>TAX INVOICE</Text>
          </View>
          <View style={{ width: 70, borderLeftWidth: 1, borderColor: "#000", justifyContent: "center", backgroundColor: "#FFF" }}>
            <Text style={{ textAlign: "center", fontSize: 7.5 }}>Original</Text>
          </View>
        </View>

        {/* SUPPLIER + META GRID - COMPACT */}
        <View style={s.gridRow} wrap={false}>
          {/* LEFT SIDE: Supplier Details */}
          <View style={{ width: "50%", borderRightWidth: 1, borderColor: "#000" }}>
             <View style={{ padding: 4, borderBottomWidth: 1, borderColor: "#000" }}>
               <Text style={[s.bold, { fontSize: 10, marginBottom: 2 }]}>{currentUser?.businessName || "Supplier Name"}</Text>
               <Text style={{ fontSize: 7.5, lineHeight: 1.2 }}>{userAddr.street || ""}</Text>
               <Text style={{ fontSize: 7.5, lineHeight: 1.2, marginTop: 1 }}>{userAddr.city ? `${userAddr.city}, ` : ""}{userAddr.state ? `${userAddr.state} ` : ""}{userAddr.postalCode || ""}</Text>
             </View>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>GSTIN</Text></View>
               <View style={s.metaValue}><Text style={s.bold}>{currentUser?.taxId || "-"}</Text></View>
             </View>
             <View style={s.row}>
               <View style={s.metaLabel}><Text>UDYAM NO</Text></View>
               <View style={s.metaValue}><Text>{currentUser?.udyamNo || "-"}</Text></View>
             </View>
          </View>

          {/* RIGHT SIDE: Meta Data */}
          <View style={{ width: "50%" }}>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>Serial No. of Invoice</Text></View>
               <View style={s.metaValue}><Text>{invoiceData.invoiceNumber || "-"}</Text></View>
             </View>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>Date of Invoice</Text></View>
               <View style={s.metaValue}><Text>{formatDate(invoiceData.invoiceDate)}</Text></View>
             </View>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>Place of Supply</Text></View>
               <View style={s.metaValue}><Text>{invoiceData.placeOfSupply || clientAddr.state || clientAddr.city || "-"}</Text></View>
             </View>
             {/* CUSTOM FIELDS — rendered dynamically from invoiceData.customFields */}
             {invoiceData.customFields && invoiceData.customFields.length > 0 && (
               invoiceData.customFields.map((cf, cfIdx) => (
                 <View key={`cf-${cfIdx}`} style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
                   <View style={s.metaLabel}><Text>{cf.label || ""}</Text></View>
                   <View style={s.metaValue}><Text>{cf.value || ""}</Text></View>
                 </View>
               ))
             )}
          </View>
        </View>

        {/* RECIPIENT BLOCK TITLE */}
        <View style={s.gridRow} wrap={false}>
          <View style={{ paddingVertical: 3, paddingHorizontal: 5, flex: 1 }}>
            <Text style={[s.bold, { textDecoration: "underline", fontSize: 8 }]}>Details of Recipient of Service</Text>
          </View>
        </View>
        
        {/* RECIPIENT BLOCK DATA - COMPACT */}
        <View style={s.gridRow} wrap={false}>
          <View style={{ width: "50%", borderRightWidth: 1, borderColor: "#000" }}>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>Name</Text></View>
               <View style={s.metaValue}><Text style={s.bold}>{client.companyName || "-"}</Text></View>
             </View>
             <View style={s.row}>
               <View style={s.metaLabel}><Text>Address</Text></View>
               <View style={s.metaValue}>
                  <Text style={{ fontSize: 7.5, lineHeight: 1.2 }}>{clientAddr.street || "-"}</Text>
                  {clientAddr.city && <Text style={{ fontSize: 7.5, marginTop: 1 }}>{clientAddr.city}</Text>}
               </View>
             </View>
          </View>
          <View style={{ width: "50%" }}>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>State</Text></View>
               <View style={s.metaValue}><Text>{clientAddr.state || "-"}</Text></View>
             </View>
             <View style={[s.row, { borderBottomWidth: 1, borderColor: "#000" }]}>
               <View style={s.metaLabel}><Text>State code</Text></View>
               <View style={s.metaValue}><Text>{clientAddr.zipCode || clientAddr.stateCode || client.stateCode || (client.gstin || client.gstNumber ? String(client.gstin || client.gstNumber).substring(0, 2) : "-")}</Text></View>
             </View>
             <View style={s.row}>
               <View style={s.metaLabel}><Text>GSTIN</Text></View>
               <View style={s.metaValue}><Text style={s.bold}>{client.gstin || client.gstNumber || "-"}</Text></View>
             </View>
          </View>
        </View>

        {/* SERVICE PERIOD - COMPACT */}
        {/* <View style={s.gridRow} wrap={false}>
           <View style={{ paddingVertical: 3, paddingHorizontal: 5, flex: 1, flexDirection: "row" }}>
              <Text style={{ fontSize: 7.5 }}>Service Rendered Period : </Text>
              <Text style={[s.bold, { fontSize: 7.5 }]}>{invoiceData.servicePeriod || "-"}</Text>
           </View>
        </View> */}

        {/* DESCRIPTION NOTE - COMPACT */}
        {invoiceData.notes ? (
          <View style={s.gridRow} wrap={false}>
             <View style={{ paddingVertical: 3, paddingHorizontal: 5, flex: 1 }}>
                <Text style={[s.bold, { fontSize: 7.5 }]}>Terms & Conditions : </Text>
                <Text style={{ fontSize: 7.5, lineHeight: 1.2, marginTop: 2 }}>
                  {invoiceData.notes}
                </Text>
             </View>
          </View>
        ) : null}

        {/* ITEM TABLE HEADER - COMPACT */}
        <View style={[s.gridRow, { backgroundColor: "#F4F4F4" }]} wrap={false}>
          <Text style={[s.th, { width: colDims.sr }]}>Sr.No</Text>
          <Text style={[s.th, { width: colDims.desc }]}>Description of Services</Text>
          <Text style={[s.th, { width: colDims.hsn }]}>HSN/SAC</Text>
          <Text style={[s.th, { width: colDims.qty }]}>Qty.</Text>
          <Text style={[s.th, { width: colDims.unit }]}>Unit</Text>
          <Text style={[s.th, { width: colDims.rate }]}>Unit Rate</Text>
          <Text style={[s.th, { width: colDims.total, borderRightWidth: 0 }]}>Total Amount</Text>
        </View>

        {/* ITEMS MAP - COMPACT with minimal padding */}
        {items.map((item, index) => (
          <View key={index} style={s.gridRow} wrap={false}>
            <View style={[s.td, { width: colDims.sr, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ textAlign: "center" }}>{index + 1}</Text>
            </View>
            <View style={[s.td, { width: colDims.desc, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ fontSize: 7.5, lineHeight: 1.2 }}>{item.description}</Text>
              {item.notes && <Text style={{ marginTop: 2, fontSize: 6.5 }}>{item.notes}</Text>}
            </View>
            <View style={[s.td, { width: colDims.hsn, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ textAlign: "center" }}>{item.hsnCode || "-"}</Text>
            </View>
            <View style={[s.td, { width: colDims.qty, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ textAlign: "center" }}>{item.quantity != null ? Number(item.quantity).toFixed(3) : "0.000"}</Text>
            </View>
            <View style={[s.td, { width: colDims.unit, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ textAlign: "center" }}>{item.unitType || "-"}</Text>
            </View>
            <View style={[s.td, { width: colDims.rate, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ textAlign: "right", fontSize: item.pricingType === "tiered" ? 6.5 : 7.5 }}>
                {item.pricingType === "tiered"
                  ? item.pricingTiers
                      ?.map(
                        (t) =>
                          `${t.minValue}–${t.maxValue !== null ? t.maxValue : "Above"} ${item.unitType || ""}: Rs.${Number(t.rate).toFixed(2)}${t.rateType === "unitRate" ? "/" + (item.unitType || "") : ""}`
                      )
                      .join("\n")
                  : item.baseRate != null ? Number(item.baseRate).toFixed(2) : "0.00"}
              </Text>
            </View>
            <View style={[s.td, { width: colDims.total, borderRightWidth: 0, justifyContent: "center", paddingVertical: 2 }]}>
              <Text style={{ textAlign: "right" }}>{item.subtotal != null ? Number(item.subtotal).toFixed(2) : "0.00"}</Text>
            </View>
          </View>
        ))}

        {/* TOTALS SECTIONS - COMPACT */}
        <View style={[s.gridRow, { backgroundColor: "#FAFAFA" }]} wrap={false}>
          <View style={{ width: `${leftOffset}%`, borderRightWidth: 1, borderColor: "#000", paddingVertical: 3, paddingHorizontal: 4, justifyContent: "center" }}>
            <Text style={[s.bold, { textAlign: "right", fontSize: 7.5 }]}>Total Taxable Value =====&gt;</Text>
          </View>
          <View style={{ width: colDims.total, paddingVertical: 3, paddingHorizontal: 3, justifyContent: "center" }}>
            <Text style={[s.bold, { textAlign: "right", fontSize: 7.5 }]}>{formatAmt(subtotal)}</Text>
          </View>
        </View>

        {invoiceData.taxes && invoiceData.taxes.map((tax, i) => (
          <View key={`tax-${i}`} style={[s.gridRow, { backgroundColor: "#FAFAFA" }]} wrap={false}>
            <View style={{ width: `${leftOffset}%`, borderRightWidth: 1, borderColor: "#000", paddingVertical: 3, paddingHorizontal: 4, justifyContent: "center" }}>
              <Text style={[s.bold, { textAlign: "right", fontSize: 7.5 }]}>{tax.name} : {tax.rate}% ==========&gt;</Text>
            </View>
            <View style={{ width: colDims.total, paddingVertical: 3, paddingHorizontal: 3, justifyContent: "center" }}>
              <Text style={{ textAlign: "right", fontSize: 7.5 }}>{formatAmt(tax.amount)}</Text>
            </View>
          </View>
        ))}

        <View style={[s.gridRow, { backgroundColor: "#F5F5F5" }]} wrap={false}>
          <View style={{ width: `${leftOffset}%`, borderRightWidth: 1, borderColor: "#000", paddingVertical: 3, paddingHorizontal: 4, justifyContent: "center" }}>
            <Text style={[s.bold, { textAlign: "right", fontSize: 8 }]}>TOTAL BILL VALUE (IN FIGURE)</Text>
          </View>
          <View style={{ width: colDims.total, paddingVertical: 3, paddingHorizontal: 3, justifyContent: "center" }}>
            <Text style={[s.bold, { textAlign: "right", fontSize: 9 }]}>
              {invoiceData.totalAmount != null ? Math.round(invoiceData.totalAmount).toLocaleString("en-IN") : "0"}
            </Text>
          </View>
        </View>

        {/* AMOUNT IN WORDS - COMPACT */}
        <View style={[s.gridRow, { backgroundColor: "#FAFAFA" }]} wrap={false}>
          <View style={{ width: "40%", paddingVertical: 4, paddingHorizontal: 4, borderRightWidth: 1, borderColor: "#000", justifyContent: "center" }}>
            <Text style={[s.bold, { textAlign: "center", fontSize: 7.5 }]}>TOTAL BILL VALUE (IN WORDS)</Text>
          </View>
          <View style={{ width: "60%", paddingVertical: 4, paddingHorizontal: 6, justifyContent: "center" }}>
            <Text style={[s.bold, { fontSize: 7.5 }]}>{wordsFormatted ? `${wordsFormatted} Rupees Only.` : "-"}</Text>
          </View>
        </View>

        {/* BANK DETAILS & SIGNATURE - COMPACT */}
        <View style={{ flexDirection: "row", paddingVertical: 8, marginTop: 3 }} wrap={false}>
          
          <View style={{ flex: 1, paddingRight: 8 }}>
            {invoiceData.bankDetails && (
              <View>
                <Text style={[s.bold, { textDecoration: "underline", marginBottom: 4, fontSize: 8 }]}>BANK DETAILS FOR PAYMENT</Text>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 7.5 }}><Text style={s.bold}>Bank Name:</Text> {invoiceData.bankDetails.bankName || "-"}</Text>
                  <Text style={{ fontSize: 7.5 }}><Text style={s.bold}>A/C Name:</Text> {invoiceData.bankDetails.accountHolderName || "-"}</Text>
                  <Text style={{ fontSize: 7.5 }}><Text style={s.bold}>A/C No:</Text> {invoiceData.bankDetails.accountNumber || "-"}</Text>
                  <Text style={{ fontSize: 7.5 }}><Text style={s.bold}>IFSC Code:</Text> {invoiceData.bankDetails.ifscCode || "-"}</Text>
                  <Text style={{ fontSize: 7.5 }}><Text style={s.bold}>Branch:</Text> {invoiceData.bankDetails.branchName || "-"}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ width: "45%", alignItems: "center" }}>
            <Text style={[s.bold, { fontSize: 8 }]}>For {currentUser?.businessName || "R C MECHANICALS"}</Text>
            
            <View style={{ height: 50, justifyContent: "center", alignItems: "center", marginVertical: 4 }}>
              {signatureBase64 ? (
                <Image src={signatureBase64} style={{ maxWidth: 120, maxHeight: 45 }} />
              ) : (
                <View style={{ height: 25 }}></View>
              )}
            </View>

            <Text style={[s.bold, { fontSize: 8 }]}>Authorised signatory</Text>
          </View>

        </View>

      </Page>
    </Document>
  );
};

export default Template7PDF;