import React, { useContext, forwardRef } from "react";
import { UserContext } from "../context/userContext";

const Template3 = forwardRef(({ invoiceData, numberToWords }, ref) => {
  const { currentUser } = useContext(UserContext);

  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );

  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  // Format account type - capitalize first letter
  const formatAccountType = (type) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  return (
    <div
      className="w-full font-sans"
      style={{
        backgroundColor: "#FFFFFF",
        fontFamily: "Arial, sans-serif",
        margin: "0 auto",
        border: "1px solid #000000",
        boxSizing: "border-box",
      }}
      ref={ref}
    >

      {/* Header with Company Info and Logo */}
      <div style={{ 
        border: "1px solid #000000",
        margin: "0",
        boxSizing: "border-box",
        width: "100%",
      }}>
        <div style={{ 
          padding: "8px", 
          backgroundColor: "#FFF8DC",
        }}>
          {/* Center - Company Name and Details */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "50px",
                fontWeight: "700",
                marginBottom: "4px",
                color: "#8B0000",
                letterSpacing: "0.5px",
                lineHeight: "1.1",
              }}
            >
              {currentUser.businessName.toUpperCase()}
            </div>
              
            <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
              <div>
                Office: {currentUser.address.street}
                {currentUser.address.city}, {currentUser.address.state} -{" "}
                {currentUser.address.zipCode}
              </div>
              <div>
                Phone: {currentUser.phone} | Email: {currentUser.email} |{" "}
                {currentUser?.taxId && `GSTIN/UIN: ${currentUser.taxId}`}
              </div>
            </div>
            </div>
        </div>
      </div>
      
      <div style={{ 
        padding: "8px",
        boxSizing: "border-box",
        border: ""
      }}>
      {/* Main Content Container */}
      <div style={{ 
        padding: "8px",
        boxSizing: "border-box",
      }}>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "6px",
            color: "#000000",
            textAlign: "center",
          }}
        >
          TAX INVOICE
        </div>

        {/* Invoice Header Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "15px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                marginBottom: "2px",
                fontWeight: "600",
              }}
            >
              {invoiceData.client.companyName}
            </div>
            <div style={{ fontSize: "12px", marginBottom: "1px" }}>
              GST No: {invoiceData.client?.gstNumber || "N/A"}
            </div>
            <div style={{ fontSize: "12px", marginBottom: "1px" }}>
              {invoiceData.client.address.street},{" "}
              {invoiceData.client.address.city},{" "}
              {invoiceData.client.address.state} -{" "}
              {invoiceData.client.address.zipCode},{" "}
              {invoiceData.client.address.country}
            </div>
            {invoiceData.client?.phone && (
              <div style={{ fontSize: "12px", marginBottom: "1px" }}>
                Phone: {invoiceData.client.phone}
              </div>
            )}
            {invoiceData.client?.email && (
              <div style={{ fontSize: "12px", marginBottom: "1px" }}>
                Email: {invoiceData.client.email}
              </div>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>
              <strong>Invoice No: {invoiceData.invoiceNumber}</strong>
            </div>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>
              <strong>
                Date:{" "}
                {new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}
              </strong>
            </div>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>
              <strong>
                Due Date:{" "}
                {new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}
              </strong>
            </div>
            {invoiceData.poNumber && (
              <div
                style={{
                  fontSize: "12px",
                  marginBottom: "2px",
                }}
              >
                <strong>PO Number: {invoiceData.poNumber}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Work Details Table - Using proper HTML table for better structure */}
        <table
          style={{
            width: "100%",
            border: "1px solid #000000",
            borderCollapse: "collapse",
            marginBottom: "15px",
            fontSize: "12px",
            boxSizing: "border-box",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#F5F5F5" }}>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "5%",
                }}
              >
                Sr. No.
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "35%",
                }}
              >
                PARTICULAR
              </th>
              {hasHSN && (
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    width: "8%",
                  }}
                >
                  HSN/SAC
                </th>
              )}
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "7%",
                }}
              >
                QTY
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "25%",
                }}
              >
                RATE
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "10%",
                }}
              >
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index}>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "6px",
                    textAlign: "center",
                    verticalAlign: "top",
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "6px",
                    verticalAlign: "top",
                  }}
                >
                  {item.description}
                </td>
                {hasHSN && (
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px",
                      textAlign: "center",
                      verticalAlign: "top",
                      fontSize: "11px",
                    }}
                  >
                    {item.hsnCode || "-"}
                  </td>
                )}
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "6px",
                    textAlign: "center",
                    verticalAlign: "top",
                  }}
                >
                  {item.quantity} {item.unitType}
                </td>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "6px",
                    verticalAlign: "top",
                    fontSize: "11px",
                    lineHeight: "1.3",
                  }}
                >
                  {item.pricingType === "tiered"
                    ? item.pricingTiers.map((tier, i) => (
                        <div key={i} style={{ marginBottom: "2px" }}>
                          {tier.minValue} –{" "}
                          {tier.maxValue !== null ? tier.maxValue : "Above"}{" "}
                          {item.unitType}: Rs. {tier.rate}{" "}
                          {tier.rateType === "unitRate"
                            ? `/ ${item.unitType}`
                            : "(slab)"}
                        </div>
                      ))
                    : `Rs. ${item.baseRate}`}
                </td>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "6px",
                    textAlign: "center",
                    verticalAlign: "top",
                  }}
                >
                  Rs. {item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ marginBottom: "15px" }}>
          {/* Sub Total */}
          {invoiceData.subtotal > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px",
                borderBottom: "1px solid #000000",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              <div>Sub Total</div>
              <div>Rs. {invoiceData.subtotal.toFixed(2)}</div>
            </div>
          )}

          {/* Discount */}
          {invoiceData.discount > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px",
                  borderBottom: "1px solid #000000",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                <div>Discount</div>
                <div>
                  - {invoiceData.discountType === "fixed" ? "Rs. " : ""}
                  {invoiceData.discount}
                  {invoiceData.discountType === "percentage" ? "%" : ""}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px",
                  borderBottom: "1px solid #000000",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                <div>Taxable Amount</div>
                <div>Rs. {taxableAmount.toFixed(2)}</div>
              </div>
            </>
          )}

          {/* Taxes */}
          {invoiceData.taxes &&
            invoiceData.taxes.length > 0 &&
            invoiceData.taxes.map((tax, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px",
                  borderBottom: "1px solid #000000",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                <div>
                  {tax.name} @{tax.rate}%
                </div>
                <div>Rs. {tax.amount.toFixed(2)}</div>
              </div>
            ))}

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px",
              borderTop: "2px solid #000000",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            <div>TOTAL</div>
            <div>Rs. {invoiceData.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* Amount in Words */}
        <div
          style={{
            marginBottom: "15px",
            border: "1px solid #000000",
            padding: "8px",
          }}
        >
          <div style={{ fontSize: "13px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Amount in words:{" "}
            </p>
            {numberToWords
              ? numberToWords(invoiceData.totalAmount)
              : `Rupees ${invoiceData.totalAmount.toFixed(2)}`}{" "}
            only
          </div>
        </div>

        {/* Payment Terms */}
        {invoiceData.paymentTerms && (
          <div
            style={{
              marginBottom: "15px",
              padding: "8px",
              backgroundColor: "#f9fafb",
              border: "1px solid #000000",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                marginBottom: "4px",
                fontSize: "13px",
              }}
            >
              Payment Terms:
            </div>
            <div style={{ fontSize: "12px", whiteSpace: "pre-line" }}>
              {invoiceData.paymentTerms}
            </div>
          </div>
        )}

        {/* Bank Details and Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: "25px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "10px",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#2c3e50",
                }}
              >
                Bank Details:
              </div>
              {currentUser.bankDetails?.accountHolderName && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>Account Holder:</strong>{" "}
                  {currentUser.bankDetails.accountHolderName}
                </div>
              )}
              {currentUser.bankDetails?.bankName && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>Bank Name:</strong> {currentUser.bankDetails.bankName}
                </div>
              )}
              {currentUser.bankDetails?.branchName && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>Branch:</strong> {currentUser.bankDetails.branchName}
                </div>
              )}
              {currentUser.bankDetails?.accountType && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>Account Type:</strong>{" "}
                  {formatAccountType(currentUser.bankDetails.accountType)}{" "}
                  Account
                </div>
              )}
              {currentUser.bankDetails?.accountNumber && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>Account No:</strong>{" "}
                  {currentUser.bankDetails.accountNumber}
                </div>
              )}
              {currentUser.bankDetails?.ifscCode && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>IFSC Code:</strong> {currentUser.bankDetails.ifscCode}
                </div>
              )}
              {currentUser.bankDetails?.upiId && (
                <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                  <strong>UPI ID:</strong> {currentUser.bankDetails.upiId}
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "right", flex: 1 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "50px",
              }}
            >
              For {currentUser.businessName}
            </div>
            <div style={{ fontSize: "13px" }}>Authorized Signatory</div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {invoiceData.notes && (
          <div
            style={{
              marginTop: "15px",
              padding: "8px",
              borderTop: "1px solid #000000",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                marginBottom: "4px",
                fontSize: "13px",
              }}
            >
              Terms & Conditions:
            </div>
            <div style={{ fontSize: "11px", whiteSpace: "pre-line" }}>
              {invoiceData.notes}
            </div>
          </div>
        )}

        {/* Standard Footer */}
        <div
          style={{
            marginTop: "30px",
            fontSize: "11px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <div>E. & O.E.</div>
          <div>Subject to {currentUser.address.city} jurisdiction</div>
          <div>This is a computer generated invoice</div>
        </div>
      </div>
      </div>
    </div>
  );
});

export default Template3;


