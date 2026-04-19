import React, { useContext } from "react";
import { UserContext } from "../context/userContext";

const Template4 = ({ invoiceData, ref, numberToWords }) => {
  const { currentUser } = useContext(UserContext);

  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );

  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  return (
    <div
      className="w-full font-sans print:mt-[35mm]"
      style={{ 
        padding: "20px",
        backgroundColor: "#FFFFFF", 
        fontFamily: "Arial, sans-serif",
        maxWidth: "100%"
      }}
      ref={ref}
    >
      {/* Invoice Details - Responsive Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "20px", 
        marginBottom: "25px" 
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Bill From:
          </div>
          <div style={{ fontSize: "14px", marginBottom: "4px" }}>
            <strong>{currentUser.businessName}</strong>
          </div>
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>
            {currentUser.address.street}, {currentUser.address.city}
          </div>
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>
            {currentUser.address.state} - {currentUser.address.zipCode}
          </div>
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>
            GST: {currentUser.taxId}
          </div>
          {currentUser.phone && (
            <div style={{ fontSize: "13px", marginBottom: "2px" }}>
              Phone: {currentUser.phone}
            </div>
          )}
          {currentUser.email && (
            <div style={{ fontSize: "13px" }}>
              Email: {currentUser.email}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Bill To:
          </div>
          <div style={{ fontSize: "14px", marginBottom: "4px" }}>
            <strong>{invoiceData.client.companyName}</strong>
          </div>
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>
            {invoiceData.client.address.street}, {invoiceData.client.address.city}
          </div>
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>
            {invoiceData.client.address.state} - {invoiceData.client.address.zipCode}
          </div>
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>
            GST: {invoiceData.client?.gstNumber || "N/A"}
          </div>
          {invoiceData.client?.phone && (
            <div style={{ fontSize: "13px", marginBottom: "2px" }}>
              Phone: {invoiceData.client.phone}
            </div>
          )}
          {invoiceData.client?.email && (
            <div style={{ fontSize: "13px" }}>
              Email: {invoiceData.client.email}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Metadata - Responsive Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
        gap: "15px", 
        marginBottom: "25px",
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "8px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#555" }}>
            Invoice Number
          </div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{invoiceData.invoiceNumber}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#555" }}>
            Invoice Date
          </div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>
            {new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#555" }}>
            Due Date
          </div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>
            {new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}
          </div>
        </div>
        {invoiceData.poNumber && (
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#555" }}>
              PO Number
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold" }}>{invoiceData.poNumber}</div>
          </div>
        )}
      </div>

      {/* Items Table - Responsive */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600", textAlign: "center", border: "1px solid #dee2e6" }}>
                #
              </th>
              <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600", textAlign: "left", border: "1px solid #dee2e6" }}>
                Description
              </th>
              {hasHSN && (
                <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600", textAlign: "center", border: "1px solid #dee2e6" }}>
                  HSN/SAC
                </th>
              )}
              <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600", textAlign: "center", border: "1px solid #dee2e6" }}>
                Qty
              </th>
              <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600", textAlign: "center", border: "1px solid #dee2e6" }}>
                Rate
              </th>
              <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600", textAlign: "center", border: "1px solid #dee2e6" }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "10px 8px", textAlign: "center", verticalAlign: "top", fontSize: "13px", border: "1px solid #dee2e6" }}>
                  {index + 1}
                </td>
                <td style={{ padding: "10px 8px", verticalAlign: "top", fontSize: "13px", border: "1px solid #dee2e6" }}>
                  {item.description}
                </td>
                {hasHSN && (
                  <td style={{ padding: "10px 8px", textAlign: "center", verticalAlign: "top", fontSize: "12px", border: "1px solid #dee2e6" }}>
                    {item.hsnCode || "-"}
                  </td>
                )}
                <td style={{ padding: "10px 8px", textAlign: "center", verticalAlign: "top", fontSize: "13px", border: "1px solid #dee2e6" }}>
                  {item.quantity} {item.unitType}
                </td>
                <td style={{ padding: "10px 8px", verticalAlign: "top", fontSize: "12px", lineHeight: "1.4", border: "1px solid #dee2e6" }}>
                  {item.pricingType === "tiered"
                    ? item.pricingTiers.map((tier, i) => (
                        <div key={i} style={{ marginBottom: "3px" }}>
                          {tier.minValue} – {tier.maxValue !== null ? tier.maxValue : "Above"} {item.unitType}: Rs. {tier.rate}{" "}
                          {tier.rateType === "unitRate" ? `/ ${item.unitType}` : "(slab)"}
                        </div>
                      ))
                    : `Rs. ${item.baseRate}`}
                </td>
                <td style={{ padding: "10px 8px", textAlign: "center", verticalAlign: "top", fontSize: "13px", fontWeight: "600", border: "1px solid #dee2e6" }}>
                  Rs. {item.subtotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Amount in Words & Totals - Responsive */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "20px",
        gap: "20px"
      }}>
        {/* Amount in Words */}
        <div style={{ 
          flex: "1 1 300px",
          padding: "15px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Amount in Words:
          </div>
          <div style={{ fontSize: "14px" }}>
            {numberToWords ? numberToWords(invoiceData.totalAmount) : `Rupees ${invoiceData.totalAmount.toFixed(2)}`} only
          </div>
        </div>

        {/* Totals Section */}
        <div style={{ flex: "1 1 300px", maxWidth: "400px", marginLeft: "auto" }}>
          {/* Sub Total */}
          {invoiceData.subtotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #dee2e6" }}>
              <span style={{ fontSize: "14px" }}>Sub Total</span>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>Rs. {invoiceData.subtotal.toFixed(2)}</span>
            </div>
          )}

          {/* Discount */}
          {invoiceData.discount > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #dee2e6" }}>
                <span style={{ fontSize: "14px" }}>Discount</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>
                  -Rs. {invoiceData.discount}{invoiceData.discountType === "percentage" ? "%" : ""}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #dee2e6" }}>
                <span style={{ fontSize: "14px" }}>Taxable Amount</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>Rs. {taxableAmount.toFixed(2)}</span>
              </div>
            </>
          )}

          {/* Taxes */}
          {invoiceData.taxes && invoiceData.taxes.length > 0 && invoiceData.taxes.map((tax, index) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #dee2e6" }}>
              <span style={{ fontSize: "14px" }}>{tax.name} @{tax.rate}%</span>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>Rs. {tax.amount.toFixed(2)}</span>
            </div>
          ))}

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#007bff", color: "white", borderRadius: "6px" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>TOTAL</span>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>Rs. {invoiceData.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {invoiceData.paymentTerms && (
        <div style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffeaa7",
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Payment Terms:
          </div>
          <div style={{ fontSize: "14px" }}>{invoiceData.paymentTerms}</div>
        </div>
      )}

      {/* Notes */}
      {invoiceData.notes && (
        <div style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#d1ecf1", 
          border: "1px solid #bee5eb",
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Notes:
          </div>
          <div style={{ fontSize: "14px" }}>{invoiceData.notes}</div>
        </div>
      )}

      {/* Terms and Conditions */}
      {invoiceData.termsAndConditions && (
        <div style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#e2e3e5", 
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Terms & Conditions:
          </div>
          <div style={{ fontSize: "13px" }}>{invoiceData.termsAndConditions}</div>
        </div>
      )}

      {/* Signature Area - Responsive */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "30px", 
        marginTop: "40px", 
        paddingTop: "20px", 
        borderTop: "2px solid #dee2e6" 
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>
            Bank Details:
          </div>
          {invoiceData?.bankDetails && (
            <>
              {invoiceData.bankDetails?.accountHolderName && (
                <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                  <strong>Account Holder:</strong> {invoiceData.bankDetails.accountHolderName}
                </div>
              )}
              {invoiceData.bankDetails?.bankName && (
                <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                  <strong>Bank:</strong> {invoiceData.bankDetails.bankName}
                </div>
              )}
              {invoiceData.bankDetails?.accountNumber && (
                <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                  <strong>Account No:</strong> {invoiceData.bankDetails.accountNumber}
                </div>
              )}
              {invoiceData.bankDetails?.ifscCode && (
                <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                  <strong>IFSC:</strong> {invoiceData.bankDetails.ifscCode}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "60px" }}>
            For {currentUser.businessName}
          </div>
          <div style={{ fontSize: "13px", color: "#6c757d", borderTop: "1px solid #adb5bd", paddingTop: "8px", display: "inline-block" }}>
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template4;