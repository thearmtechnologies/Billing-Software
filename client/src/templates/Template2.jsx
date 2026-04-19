import React, { useContext } from "react";
import { UserContext } from "../context/userContext";

const Template2 = ({ invoiceData, ref, numberToWords }) => {
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
      className="w-full"
      style={{
        backgroundColor: "#FFFFFF",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
      ref={ref}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{ fontSize: "12px", marginBottom: "5px", color: "#4B5563" }}
          >
            Created using
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#F97316", fontWeight: "bold" }}>
              ARM Technologies
            </span>
            <span style={{ fontWeight: "bold" }}>Billing Software</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            TAX INVOICE
          </div>
          <div style={{ fontSize: "12px", color: "#4B5563" }}>
            ORIGINAL FOR RECIPIENT
          </div>
        </div>
      </div>

      {/* Company Info Section */}
      <div style={{ border: "1px solid #D1D5DB", marginBottom: "20px" }}>
        <div
          style={{
            padding: "8px",
            backgroundColor: "#E9D5FF",
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {currentUser.businessName.toUpperCase()}
          </div>
        </div>
        <div style={{ padding: "12px" }}>
          <div style={{ fontSize: "14px", marginBottom: "2px" }}>
            {currentUser.address.street}, {currentUser.address.city},{" "}
            {currentUser.address.state} - {currentUser.address.zipCode},{" "}
            {currentUser.address.country}
          </div>
          <div style={{ fontSize: "14px", marginBottom: "2px" }}>
            GST No: {currentUser.taxId}
          </div>
          <div style={{ fontSize: "14px", marginBottom: "2px" }}>
            Mobile: {currentUser.phone}
          </div>
          <div style={{ fontSize: "14px" }}>Email: {currentUser.email}</div>
        </div>
      </div>

      {/* Invoice Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}
          >
            Invoice No.
          </div>
          <div style={{ fontSize: "14px" }}>{invoiceData.invoiceNumber}</div>
        </div>
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}
          >
            Invoice Date
          </div>
          <div style={{ fontSize: "14px" }}>
            {new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}
          >
            Due Date
          </div>
          <div style={{ fontSize: "14px" }}>
            {new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div style={{ border: "1px solid #D1D5DB", marginBottom: "20px" }}>
        <div
          style={{
            padding: "8px",
            backgroundColor: "#E9D5FF",
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <div style={{ fontWeight: "bold" }}>BILL TO</div>
        </div>
        <div style={{ padding: "8px" }}>
          <div
            style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}
          >
            {invoiceData.client.companyName.toUpperCase()}
          </div>
          <div style={{ fontSize: "14px", marginBottom: "2px" }}>
            {invoiceData.client.address.street},{" "}
            {invoiceData.client.address.city},{" "}
            {invoiceData.client.address.state} -{" "}
            {invoiceData.client.address.zipCode},{" "}
            {invoiceData.client.address.country}
          </div>
          <div style={{ fontSize: "14px", marginBottom: "2px" }}>
            GST No: {invoiceData.client?.gstNumber || "N/A"}
          </div>
          {invoiceData.client?.phone && (
            <div style={{ fontSize: "14px", marginBottom: "2px" }}>
              Phone: {invoiceData.client.phone}
            </div>
          )}
          {invoiceData.client?.email && (
            <div style={{ fontSize: "14px" }}>
              Email: {invoiceData.client.email}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div style={{ border: "1px solid #D1D5DB", marginBottom: "20px" }}>
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: hasHSN
              ? "0.3fr 2fr 0.5fr 0.4fr 1.2fr 0.6fr"
              : "0.3fr 2fr 0.4fr 1.2fr 0.6fr",
            gap: "8px",
            padding: "8px",
            fontWeight: "600",
            backgroundColor: "#E9D5FF",
            borderBottom: "1px solid #D1D5DB",
            fontSize: "14px",
          }}
        >
          <div style={{ textAlign: "center" }}>S.NO.</div>
          <div>ITEMS</div>
          {hasHSN && <div style={{ textAlign: "center" }}>HSN/SAC</div>}
          <div style={{ textAlign: "center" }}>QTY</div>
          <div style={{ textAlign: "center" }}>RATE</div>
          <div style={{ textAlign: "center" }}>AMOUNT</div>
        </div>

        {/* Table Rows */}
        {invoiceData.items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: hasHSN
                ? "0.3fr 2fr 0.5fr 0.4fr 1.2fr 0.6fr"
                : "0.3fr 2fr 0.4fr 1.2fr 0.6fr",
              gap: "8px",
              padding: "8px",
              fontSize: "14px",
              borderBottom: "1px solid #D1D5DB",
              alignItems: "start",
            }}
          >
            <div style={{ textAlign: "center" }}>{index + 1}</div>
            <div>{item.description}</div>
            {hasHSN && (
              <div style={{ textAlign: "center", fontSize: "12px" }}>
                {item.hsnCode || "-"}
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              {item.quantity} {item.unitType}
            </div>
            <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
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
            </div>
            <div style={{ textAlign: "center" }}>Rs. {item.subtotal}</div>
          </div>
        ))}
      </div>

      {/* Calculation Section */}
      <div style={{ marginBottom: "20px" }}>
        {invoiceData.subtotal > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "5fr 1fr",
              gap: "8px",
              padding: "8px",
              fontWeight: "600",
              backgroundColor: "#E9D5FF",
            }}
          >
            <div>Sub Total:</div>
            <div>Rs. {invoiceData.subtotal.toFixed(2)}</div>
          </div>
        )}

        {invoiceData.discount > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "5fr 1fr",
                gap: "8px",
                padding: "8px",
                fontWeight: "600",
                backgroundColor: "#E9D5FF",
              }}
            >
              <div>Discount:</div>
              <div>
                - {invoiceData.discountType === "fixed" ? "Rs. " : ""}
                {invoiceData.discount}
                {invoiceData.discountType === "percentage" ? "%" : ""}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "5fr 1fr",
                gap: "8px",
                padding: "8px",
                fontWeight: "600",
                backgroundColor: "#E9D5FF",
              }}
            >
              <div>Taxable Amount:</div>
              <div>Rs. {taxableAmount.toFixed(2)}</div>
            </div>
          </>
        )}

        {invoiceData.taxes &&
          invoiceData.taxes.length > 0 &&
          invoiceData.taxes.map((tax, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "5fr 1fr",
                gap: "8px",
                padding: "8px",
                fontWeight: "600",
                backgroundColor: "#E9D5FF",
              }}
            >
              <div>
                {tax.name} @{tax.rate}%:
              </div>
              <div>Rs. {tax.amount.toFixed(2)}</div>
            </div>
          ))}

        {/* Total Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "5fr 1fr",
            gap: "8px",
            padding: "8px",
            fontWeight: "600",
            backgroundColor: "#E9D5FF",
            borderTop: "2px solid #D1D5DB",
          }}
        >
          <div>TOTAL:</div>
          <div>Rs. {invoiceData.totalAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Amount in Words */}
      <div style={{ border: "1px solid #D1D5DB", marginBottom: "20px" }}>
        <div
          style={{
            padding: "8px",
            fontWeight: "600",
            backgroundColor: "#E9D5FF",
            borderBottom: "1px solid #D1D5DB",
            fontSize: "14px",
          }}
        >
          Total Amount (in words)
        </div>
        <div style={{ padding: "8px", fontSize: "14px" }}>
          {numberToWords
            ? numberToWords(invoiceData.totalAmount)
            : `Rupees ${invoiceData.totalAmount.toFixed(2)} only`}
        </div>
      </div>

      {/* Payment Terms */}
      {invoiceData.paymentTerms && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f9fafb",
            border: "1px solid #D1D5DB",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "5px" }}>
            Payment Terms:
          </div>
          <div style={{ fontSize: "13px" }}>{invoiceData.paymentTerms}</div>
        </div>
      )}

      {/* Bank Details and Signature */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          {invoiceData?.bankDetails && (
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "12px",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "10px",
                  color: "#2c3e50",
                }}
              >
                Bank Details
              </div>
              {invoiceData.bankDetails?.accountHolderName && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>Account Holder:</strong>{" "}
                  {invoiceData.bankDetails.accountHolderName}
                </div>
              )}
              {invoiceData.bankDetails?.bankName && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>Bank Name:</strong> {invoiceData.bankDetails.bankName}
                </div>
              )}
              {invoiceData.bankDetails?.branchName && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>Branch:</strong> {invoiceData.bankDetails.branchName}
                </div>
              )}
              {invoiceData.bankDetails?.accountType && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>Account Type:</strong>{" "}
                  {formatAccountType(invoiceData.bankDetails.accountType)} Account
                </div>
              )}
              {invoiceData.bankDetails?.accountNumber && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>Account No:</strong>{" "}
                  {invoiceData.bankDetails.accountNumber}
                </div>
              )}
              {invoiceData.bankDetails?.ifscCode && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>IFSC Code:</strong> {invoiceData.bankDetails.ifscCode}
                </div>
              )}
              {invoiceData.bankDetails?.upiId && (
                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <strong>UPI ID:</strong> {invoiceData.bankDetails.upiId}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "60px",
            }}
          >
            For {currentUser.businessName},
          </div>
          <div style={{ fontSize: "12px", color: "#4B5563" }}>
            Authorized Signatory
          </div>
          {/* {invoiceData.notes && (
            <div style={{ marginTop: "20px", fontSize: "11px", fontStyle: "italic" }}>
              <div><strong>Notes:</strong> {invoiceData.notes}</div>
            </div>
          )} */}
        </div>
      </div>

      {/* Terms and Conditions */}
      {invoiceData.notes && (
        <div style={{ padding: "10px", borderTop: "1px solid #D1D5DB" }}>
          <div style={{ fontWeight: "600", marginBottom: "5px" }}>
            Terms & Conditions:
          </div>
          <div style={{ fontSize: "12px", whiteSpace: "pre-line" }}>
            {invoiceData.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default Template2;
