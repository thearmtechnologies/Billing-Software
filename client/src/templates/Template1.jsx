import React, { useContext, forwardRef } from "react";
import { UserContext } from "../context/userContext";

const Template1 = forwardRef(({ invoiceData, numberToWords }, ref) => {
  const { currentUser } = useContext(UserContext);

  const hasHSN = invoiceData.items.some(
    (item) => item.hsnCode && item.hsnCode.trim() !== ""
  );

  const taxableAmount = invoiceData.subtotal - (invoiceData.discount || 0);

  // Calculate how many empty rows we need to maintain fixed height
  const totalRows = 8; // Fixed number of rows like in reference
  const emptyRows = Math.max(0, totalRows - invoiceData.items.length);

  // Format account type - capitalize first letter
  const formatAccountType = (type) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  return (
    <div
      ref={ref}
      className="w-full font-sans"
      style={{
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: "15px",
        fontFamily: "Arial, sans-serif",
        margin: "0 auto",
        maxWidth: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Header with Logo and Company Name */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #000",
          paddingBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {currentUser.logo && (
            <img
              src={currentUser.logo}
              alt="Logo"
              style={{ height: "80px", width: "80px" }}
            />
          )}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "50px",
                fontWeight: "bold",
                letterSpacing: "2px",
              }}
            >
              {currentUser.businessName.toUpperCase()}
            </div>
            {/* Company Details in Header */}
            <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
              <div>
                Office: {currentUser.address.street}
                {currentUser.address.city}, {currentUser.address.state} -{" "}
                {currentUser.address.zipCode}
              </div>
              <div>
                Phone: {currentUser.phone} | Email: {currentUser.email} |{" "}
                {currentUser?.taxId && `GSTIN/UIN: ${currentUser.taxId}`} | {" "}
                {currentUser?.udyamNo && `Udyam No.: ${currentUser.udyamNo}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAX INVOICE Header */}
      <div className="flex flex-col items-center">
        <div
          style={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >
          TAX INVOICE
        </div>
        <div style={{ fontSize: "12px", marginBottom: "20px" }}>
          (ORIGINAL FOR RECIPIENT)
        </div>
      </div>

      {/* Company and Buyer Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "15px",
        }}
      >
        {/* Buyer Details */}
        <div>
          <table
            style={{
              width: "100%",
              fontSize: "12px",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "8px",
                    width: "100%",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      fontSize: "16px",
                    }}
                  >
                    Bill To:
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                    {invoiceData.client.companyName}
                  </div>
                  <div style={{ fontSize: "14px" }}>{invoiceData.client.address.street}</div>
                  <div style={{ fontSize: "14px" }}>
                    {invoiceData.client.address.city},{" "}
                    {invoiceData.client.address.state} -{" "}
                    {invoiceData.client.address.zipCode}
                  </div>
                  {invoiceData.client?.gstNumber && (
                    <div style={{ fontSize: "14px" }}>GSTIN/UIN: {invoiceData.client?.gstNumber}</div>
                  )}
                  <div style={{ fontSize: "14px" }}>
                    State Name: {invoiceData.client.address.state}, Code:{" "}
                    {invoiceData.client.address.zipCode.substring(0, 2)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Column - Invoice Details */}
        <div>
          <table
            style={{
              width: "100%",
              fontSize: "14px",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    fontWeight: "bold",
                    width: "30%",
                  }}
                >
                  Invoice No.
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    width: "20%",
                  }}
                >
                  {invoiceData.invoiceNumber}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    fontWeight: "bold",
                    width: "20%",
                  }}
                >
                  Invoice Date
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    width: "30%",
                  }}
                >
                  {new Date(invoiceData.invoiceDate).toLocaleDateString(
                    "en-GB"
                  )}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Due Date
                </td>
                <td
                  style={{ border: "1px solid #000", padding: "6px" }}
                  colSpan="3"
                >
                  {new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Items Table with Proper Borders */}
      <div style={{ overflowX: "auto", marginBottom: "15px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th
                style={{
                  borderTop: "1px solid #000",
                  borderLeft: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "5%",
                }}
              >
                Sr. No.
              </th>
              <th
                style={{
                  borderTop: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "40%",
                }}
              >
                Description of Goods
              </th>
              {hasHSN && (
                <th
                  style={{
                    borderTop: "1px solid #000",
                    borderRight: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "8px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                    width: "10%",
                  }}
                >
                  HSN/SAC
                </th>
              )}
              <th
                style={{
                  borderTop: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "10%",
                }}
              >
                Quantity
              </th>
              <th
                style={{
                  borderTop: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "15%",
                }}
              >
                Rate
              </th>
              <th
                style={{
                  borderTop: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "10%",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Actual Items */}
            {invoiceData.items.map((item, index) => (
              <tr key={index} style={{ height: "auto", minHeight: "35px" }}>
                <td
                  style={{
                    borderLeft: "1px solid #000",
                    borderRight: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                    verticalAlign: "top",
                    fontSize: "14px",
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    borderRight: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "6px",
                    verticalAlign: "top",
                    fontSize: "14px",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>{item.description}</div>
                  {item.notes && (
                    <div style={{ fontSize: "12px", marginTop: "2px" }}>
                      {item.notes}
                    </div>
                  )}
                </td>
                {hasHSN && (
                  <td
                    style={{
                      borderRight: "1px solid #000",
                      borderBottom: "1px solid #000",
                      padding: "6px",
                      textAlign: "center",
                      verticalAlign: "top",
                      fontSize: "14px",
                    }}
                  >
                    {item.hsnCode || ""}
                  </td>
                )}
                <td
                  style={{
                    borderRight: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                    verticalAlign: "top",
                    fontSize: "14px",
                  }}
                >
                  {item.quantity} {item.unitType}
                </td>
                <td
                  style={{
                    borderRight: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                    verticalAlign: "top",
                    fontSize: "14px",
                  }}
                >
                  {item.pricingType === "tiered" ? (
                    <div>
                      {item.pricingTiers.map((tier, i) => (
                        <div key={i} style={{ marginBottom: "1px" }}>
                          {tier.minValue} –{" "}
                          {tier.maxValue !== null ? tier.maxValue : "Above"}{" "}
                          {item.unitType}: ₹{tier.rate.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    `₹${(item.baseRate || 0).toFixed(2)}`
                  )}
                </td>
                <td
                  style={{
                    borderRight: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                    verticalAlign: "top",
                    fontSize: "14px",
                  }}
                >
                  ₹{item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Empty Rows - With proper borders */}
            {Array.from({ length: emptyRows }).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: "35px" }}>
                <td style={{ 
                  borderLeft: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px" 
                }}>&nbsp;</td>
                <td style={{ 
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px" 
                }}>&nbsp;</td>
                {hasHSN && <td style={{ 
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px" 
                }}>&nbsp;</td>}
                <td style={{ 
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px" 
                }}>&nbsp;</td>
                <td style={{ 
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px" 
                }}>&nbsp;</td>
                <td style={{ 
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px" 
                }}>&nbsp;</td>
              </tr>
            ))}

            {/* Tax Rows */}
            <tr>
              <td
                colSpan={hasHSN ? 3 : 2}
                style={{
                  borderLeft: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {invoiceData.taxes && invoiceData.taxes.length > 0 && (
                  <div>
                    {invoiceData.taxes.map((tax, idx) => (
                      <div key={idx}>
                        {tax.name} @{tax.rate}%
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td
                style={{
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
                colSpan={2}
              >
                &nbsp;
              </td>
              <td
                style={{
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {invoiceData.taxes && invoiceData.taxes.length > 0 && (
                  <div>
                    {invoiceData.taxes.map((tax, idx) => (
                      <div key={idx}>₹ {tax.amount.toFixed(2)}</div>
                    ))}
                  </div>
                )}
              </td>
            </tr>

            {/* Total Row */}
            <tr>
              <td
                colSpan={hasHSN ? 3 : 2}
                style={{
                  borderLeft: "1px solid #000",
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                Total
              </td>
              <td
                style={{
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px",
                  textAlign: "center",
                  fontSize: "15px",
                }}
                colSpan={2}
              >
                &nbsp;
              </td>
              <td
                style={{
                  borderRight: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                ₹ {invoiceData.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div style={{ marginBottom: "15px", fontSize: "14px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
          Amount Chargeable (in words)
        </div>
        <div style={{ fontWeight: "bold" }}>
          INR {numberToWords ? numberToWords(invoiceData.totalAmount) : invoiceData.totalAmount.toFixed(2)} Only
        </div>
      </div>

      {/* Compact Tax Breakdown Table */}
      {invoiceData.taxes && invoiceData.taxes.length > 0 && (
        <div style={{ overflowX: "auto", marginBottom: "15px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              minWidth: "500px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                    width: "15%",
                  }}
                >
                  HSN/SAC
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                    width: "25%",
                  }}
                >
                  Taxable Value
                </th>
                {invoiceData.taxes.map((tax, taxIndex) => (
                  <React.Fragment key={taxIndex}>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "center",
                        width: "8%",
                      }}
                    >
                      {tax.name} Rate
                    </th>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "center",
                        width: "12%",
                      }}
                    >
                      {tax.name} Amount
                    </th>
                  </React.Fragment>
                ))}
                  <th
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                    width: "15%",
                  }}
                >
                  Total Tax Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => {
                const itemTaxableAmount = item.subtotal - (item.discount || 0);
                const itemTotalTax = invoiceData.taxes.reduce((total, tax) => {
                  return total + (itemTaxableAmount * tax.rate) / 100;
                }, 0);

                return (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "center",
                      }}
                    >
                      {item.hsnCode || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "right",
                      }}
                    >
                      {itemTaxableAmount.toFixed(2)}
                    </td>
                    {invoiceData.taxes.map((tax, taxIndex) => {
                      const taxAmount = (itemTaxableAmount * tax.rate) / 100;
                      return (
                        <React.Fragment key={taxIndex}>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "6px",
                              textAlign: "center",
                            }}
                          >
                            {tax.rate}%
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "6px",
                              textAlign: "right",
                            }}
                          >
                            {taxAmount.toFixed(2)}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "right",
                      }}
                    >
                      {itemTotalTax.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                  }}
                >
                  {taxableAmount.toFixed(2)}
                </td>
                {invoiceData.taxes.map((tax, taxIndex) => (
                  <React.Fragment key={taxIndex}>
                    <td
                      style={{ border: "1px solid #000", padding: "6px" }}
                    ></td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "right",
                      }}
                    >
                      {tax.amount.toFixed(2)}
                    </td>
                  </React.Fragment>
                ))}
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                  }}
                >
                  {invoiceData.totalTax.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tax Amount in Words */}
      {invoiceData.totalTax > 0 && (
        <div style={{ marginBottom: "15px", fontSize: "12px" }}>
          <div style={{ marginBottom: "5px" }}>
            Tax Amount (in words): <span style={{fontWeight: "bold"}}>
              INR {numberToWords ? numberToWords(invoiceData.totalTax) : invoiceData.totalTax.toFixed(2)} Only
            </span>
          </div>
        </div>
      )}

      {/* Bank Details and Signature */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "15px",
        }}
      >
        {/* Bank Details */}
        {currentUser.bankDetails && (
          <div
            style={{
              fontSize: "14px",
              border: "1px solid #000",
              padding: "12px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "15px",
              }}
            >
              Company's Bank Details
            </div>
            {currentUser.bankDetails?.bankName && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>Account Holder:</strong> {currentUser.bankDetails.accountHolderName}
              </div>
            )}
            {currentUser.bankDetails?.bankName && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>Bank Name:</strong> {currentUser.bankDetails.bankName}
              </div>
            )}
            {currentUser.bankDetails?.branchName && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>Branch</strong>{" "}
                {currentUser.bankDetails.branchName}
              </div>
            )}
            {currentUser.bankDetails?.bankName && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>Account Type:</strong> {formatAccountType(currentUser.bankDetails.accountType)}{" "}
                  Account
              </div>
            )}
            {currentUser.bankDetails?.accountNumber && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>A/c No.:</strong>{" "}
                {currentUser.bankDetails.accountNumber}
              </div>
            )}
            {currentUser.bankDetails?.ifscCode && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>IFSC:</strong>{" "}
                {currentUser.bankDetails.ifscCode}
              </div>
            )}
            {currentUser.bankDetails?.upiId && (
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>
                <strong>UPI ID:</strong> {currentUser.bankDetails.upiId}
              </div>
            )}
          </div>
        )}

        {/* Signature */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "80px",
              fontSize: "13px",
            }}
          >
            for {currentUser.businessName}
          </div>
          <div
            style={{
              borderTop: "1px solid #000",
              paddingTop: "8px",
              display: "inline-block",
              minWidth: "200px",
              fontSize: "12px",
            }}
          >
            Authorised Signatory
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {invoiceData.notes && (
        <div style={{ fontSize: "11px", marginBottom: "10px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
            Terms & Conditions:
          </div>
          <div style={{ whiteSpace: "pre-line" }}>{invoiceData.notes}</div>
        </div>
      )}

      {/* Company Footer */}
      <div
        style={{
          borderTop: "2px solid #000",
          marginTop: "30px",
          paddingTop: "12px",
          fontSize: "11px",
        }}
      ></div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "12px" }}>
        <div style={{ fontWeight: "bold" }}>
          This is a Computer Generated Invoice
        </div>
      </div>
    </div>
  );
});

export default Template1;