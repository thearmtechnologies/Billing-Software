import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Calendar,
  IndianRupee,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;

const PaymentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  
  // Loading states for actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMode: "bank-transfer",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    recordedBy: ""
  });

  // Helper function for precise decimal arithmetic
  const toPrecision = (num) => {
    return Math.round(num * 100) / 100;
  };

  // Helper function to compare amounts with tolerance
  const isAmountValidWithTolerance = (amount, maxAmount, tolerance = 0.009) => {
    const roundedAmount = toPrecision(parseFloat(amount));
    const roundedMax = toPrecision(maxAmount);
    return roundedAmount <= roundedMax + tolerance;
  };

  // Get precise remaining balance
  const getPreciseRemainingBalance = () => {
    if (!invoice) return 0;
    if (editingPayment) {
      const amountWithoutCurrentPayment = toPrecision(invoice.amountPaid - editingPayment.amountPaid);
      return toPrecision(invoice.totalAmount - amountWithoutCurrentPayment);
    } else {
      return toPrecision(invoice.totalAmount - invoice.amountPaid);
    }
  };

  useEffect(() => {
    fetchInvoiceAndPayments();
  }, [id]);

  const fetchInvoiceAndPayments = async () => {
    try {
      setLoading(true);
      const [invoiceRes, paymentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/invoices/${id}`),
        axios.get(`${import.meta.env.VITE_BASE_URL}/invoices/${id}/payments`)
      ]);
      
      setInvoice(invoiceRes.data);
      setPaymentHistory(paymentsRes.data.paymentHistory || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const remainingBalance = getPreciseRemainingBalance();
    
    // Use tolerance for floating-point precision
    if (!isAmountValidWithTolerance(amount, remainingBalance)) {
      toast.error(`Payment would exceed total amount. Maximum allowed: Rs. ${remainingBalance.toFixed(2)}`);
      return;
    }

    // Ensure amount doesn't exceed remaining balance by more than tolerance
    const finalAmount = amount > remainingBalance ? remainingBalance : amount;
    
    const paymentPayload = {
      ...paymentData,
      amount: toPrecision(finalAmount)
    };

    try {
      setIsSubmitting(true);
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/invoices/${id}/payments`,
        paymentPayload
      );
      
      toast.success("Payment added successfully");
      setShowAddPayment(false);
      setPaymentData({
        amount: "",
        paymentMode: "bank-transfer",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        recordedBy: ""
      });
      await fetchInvoiceAndPayments();
    } catch (error) {
      console.error("Payment error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to add payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Calculate remaining balance considering the current payment being edited
    const amountWithoutCurrentPayment = toPrecision(invoice.amountPaid - editingPayment.amountPaid);
    const remainingBalance = toPrecision(invoice.totalAmount - amountWithoutCurrentPayment);
    
    // Use tolerance for floating-point precision
    if (!isAmountValidWithTolerance(amount, remainingBalance)) {
      toast.error(`Payment would exceed total amount. Maximum allowed: Rs. ${remainingBalance.toFixed(2)}`);
      return;
    }

    // Ensure amount doesn't exceed remaining balance by more than tolerance
    const finalAmount = amount > remainingBalance ? remainingBalance : amount;

    const paymentPayload = {
      ...paymentData,
      amount: toPrecision(finalAmount)
    };

    try {
      setIsSubmitting(true);
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/invoices/${id}/payments/${editingPayment._id}`,
        paymentPayload
      );
      
      toast.success("Payment updated successfully");
      setEditingPayment(null);
      setPaymentData({
        amount: "",
        paymentMode: "bank-transfer",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        recordedBy: ""
      });
      await fetchInvoiceAndPayments();
    } catch (error) {
      console.error("Update payment error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (deletingPaymentId) return;
    
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        setDeletingPaymentId(paymentId);
        await axios.delete(
          `${import.meta.env.VITE_BASE_URL}/invoices/${id}/payments/${paymentId}`
        );
        
        toast.success("Payment deleted successfully");
        await fetchInvoiceAndPayments();
      } catch (error) {
        toast.error("Failed to delete payment");
      } finally {
        setDeletingPaymentId(null);
      }
    }
  };

  const startEditPayment = (payment) => {
    if (isSubmitting) return;
    setEditingPayment(payment);
    setPaymentData({
      amount: payment.amountPaid.toString(), 
      paymentMode: payment.paymentMode,
      paymentDate: format(new Date(payment.paymentDate), "yyyy-MM-dd"),
      notes: payment.notes || "",
      recordedBy: payment.recordedBy || ""
    });
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    setShowAddPayment(false);
    setPaymentData({
      amount: "",
      paymentMode: "bank-transfer",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      recordedBy: ""
    });
  };

  // Handle amount change with proper formatting
  const handleAmountChange = (e) => {
    let value = e.target.value;
    
    // Allow empty string
    if (value === "") {
      setPaymentData({ ...paymentData, amount: value });
      return;
    }
    
    // Allow only numbers and decimal point
    if (!/^(\d*\.?\d{0,2})?$/.test(value)) {
      return;
    }
    
    setPaymentData({ ...paymentData, amount: value });
  };

  // Prevent wheel event on number input
  const handleWheel = (e) => {
    e.target.blur();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "16rem" }}>
        <div
          style={{ 
            width: "3rem", 
            height: "3rem", 
            border: "3px solid #e5e7eb", 
            borderTopColor: "#2563eb", 
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}
        ></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#6b7280" }}>Invoice not found</p>
      </div>
    );
  }

  const remainingBalance = getPreciseRemainingBalance();
  const enteredAmount = paymentData.amount ? parseFloat(paymentData.amount) : 0;
  const isAmountValid = paymentData.amount && !isNaN(enteredAmount) && 
    isAmountValidWithTolerance(enteredAmount, remainingBalance);

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ 
              padding: "8px", 
              color: "#6b7280", 
              marginRight: "12px",
              borderRadius: "8px"
            }}
            className="cursor-pointer hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", margin: 0 }}>
              Payment Management
            </h1>
            <p style={{ color: "#6b7280", marginTop: "4px" }}>
              Invoice #{invoice.invoiceNumber} - {invoice.client?.companyName}
            </p>
          </div>
        </div>

        {/* Invoice Summary */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Total Amount</p>
            <p style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginTop: "4px" }}>
              Rs. {toPrecision(invoice.totalAmount).toFixed(2)}
            </p>
          </div>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Amount Paid</p>
            <p style={{ fontSize: "18px", fontWeight: "600", color: "#16a34a", marginTop: "4px" }}>
              Rs. {toPrecision(invoice.amountPaid).toFixed(2)}
            </p>
          </div>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Amount Due</p>
            <p style={{ fontSize: "18px", fontWeight: "600", color: "#ea580c", marginTop: "4px" }}>
              Rs. {toPrecision(invoice.amountDue).toFixed(2)}
            </p>
          </div>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Status</p>
            <p style={{ 
              fontSize: "18px", 
              fontWeight: "600", 
              marginTop: "4px",
              color: invoice.status === "paid" ? "#16a34a" : invoice.status === "partial" ? "#ea580c" : "#6b7280"
            }}>
              {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Button */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => setShowAddPayment(true)}
          disabled={invoice.amountPaid >= invoice.totalAmount - 0.009 || isSubmitting}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            padding: "8px 16px", 
            backgroundColor: "#2563eb", 
            color: "white", 
            borderRadius: "8px",
            border: "none",
            cursor: (invoice.amountPaid >= invoice.totalAmount - 0.009 || isSubmitting) ? "not-allowed" : "pointer",
            opacity: (invoice.amountPaid >= invoice.totalAmount - 0.009 || isSubmitting) ? 0.5 : 1
          }}
          className="hover:bg-blue-700"
        >
          <Plus style={{ width: "20px", height: "20px", marginRight: "8px" }} />
          Add Payment
        </button>
      </div>

      {/* Add/Edit Payment Form */}
      {(showAddPayment || editingPayment) && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "24px", 
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
              {editingPayment ? "Edit Payment" : "Add New Payment"}
            </h3>
            <button
              onClick={cancelEdit}
              style={{ padding: "4px", color: "#6b7280", background: "transparent", border: "none", cursor: "pointer" }}
              className="hover:bg-gray-100 rounded"
              disabled={isSubmitting}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>

          <form onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-2">
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Amount *
                  <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "8px" }}>
                    (Max: Rs. {remainingBalance.toFixed(2)})
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={paymentData.amount}
                  onChange={handleAmountChange}
                  onWheel={handleWheel}
                  disabled={isSubmitting}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: `1px solid ${
                      paymentData.amount && !isAmountValid 
                        ? '#ef4444' 
                        : '#d1d5db'
                    }`,
                    borderRadius: "8px",
                    boxSizing: "border-box"
                  }}
                  placeholder="Enter amount (e.g., 1000.50)"
                />
                {paymentData.amount && !isAmountValid && (
                  <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                    Amount exceeds remaining balance of Rs. {remainingBalance.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Payment Mode *
                </label>
                <select
                  required
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  disabled={isSubmitting}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  disabled={isSubmitting}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Recorded By
                </label>
                <input
                  type="text"
                  value={paymentData.recordedBy}
                  onChange={(e) => setPaymentData({ ...paymentData, recordedBy: e.target.value })}
                  disabled={isSubmitting}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box"
                  }}
                  placeholder="Your name"
                />
              </div>

              <div style={{ gridColumn: "span 1" }} className="md:col-span-2">
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows="3"
                  disabled={isSubmitting}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box"
                  }}
                  placeholder="Additional notes about this payment"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                type="submit"
                disabled={!paymentData.amount || !isAmountValid || isSubmitting}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  padding: "8px 16px", 
                  backgroundColor: "#2563eb", 
                  color: "white", 
                  borderRadius: "8px",
                  border: "none",
                  cursor: (!paymentData.amount || !isAmountValid || isSubmitting) ? "not-allowed" : "pointer",
                  opacity: (!paymentData.amount || !isAmountValid || isSubmitting) ? 0.5 : 1
                }}
                className="hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 style={{ width: "16px", height: "16px", marginRight: "8px", animation: "spin 1s linear infinite" }} />
                    {editingPayment ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Save style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                    {editingPayment ? "Update Payment" : "Add Payment"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSubmitting}
                style={{ 
                  padding: "8px 16px", 
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1
                }}
                className="hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment History */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>Payment History</h3>
        </div>

        {paymentHistory.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <IndianRupee style={{ width: "48px", height: "48px", color: "#9ca3af", margin: "0 auto 16px" }} />
            <p style={{ color: "#6b7280" }}>No payments recorded yet</p>
          </div>
        ) : (
          <div>
            {paymentHistory.map((payment) => (
              <div key={payment._id} style={{ borderBottom: "1px solid #f3f4f6", padding: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} className="sm:flex-row sm:justify-between sm:items-center">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", width: "100%" }} className="sm:w-auto">
                    <p style={{ fontWeight: "600", color: "#111827", fontSize: "18px", margin: 0 }} className="sm:text-base">
                      Rs. {toPrecision(payment.amountPaid).toFixed(2)}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", fontSize: "14px", color: "#6b7280", gap: "4px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar style={{ width: "16px", height: "16px", color: "#6b7280", flexShrink: 0 }} />
                        <span>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</span>
                      </div>
                      <span style={{ display: "none" }} className="sm:inline">•</span>
                      <span style={{ textTransform: "capitalize" }}>{payment.paymentMode}</span>
                      {payment.recordedBy && (
                        <>
                          <span style={{ display: "none" }} className="sm:inline">•</span>
                          <span>By {payment.recordedBy}</span>
                        </>
                      )}
                    </div>
                    {payment.notes && (
                      <p style={{ fontSize: "14px", color: "#6b7280", wordBreak: "break-word", marginTop: "4px" }}>
                        {payment.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%" }} className="sm:w-auto">
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", margin: 0 }} className="sm:text-gray-600">
                      Balance Due: Rs. {toPrecision(payment.balanceDueAfter).toFixed(2)}
                    </p>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => startEditPayment(payment)}
                        disabled={isSubmitting || deletingPaymentId === payment._id}
                        style={{ 
                          padding: "4px", 
                          color: "#6b7280", 
                          background: "transparent", 
                          border: "none", 
                          cursor: (isSubmitting || deletingPaymentId === payment._id) ? "not-allowed" : "pointer",
                          opacity: (isSubmitting || deletingPaymentId === payment._id) ? 0.5 : 1
                        }}
                        className="hover:bg-gray-100 rounded"
                      >
                        <Edit style={{ width: "16px", height: "16px" }} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment._id)}
                        disabled={isSubmitting || deletingPaymentId === payment._id}
                        style={{ 
                          padding: "4px", 
                          color: "#6b7280", 
                          background: "transparent", 
                          border: "none", 
                          cursor: (isSubmitting || deletingPaymentId === payment._id) ? "not-allowed" : "pointer",
                          opacity: (isSubmitting || deletingPaymentId === payment._id) ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center"
                        }}
                        className="hover:bg-gray-100 rounded"
                      >
                        {deletingPaymentId === payment._id ? (
                          <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add spin animation style */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentManagement;