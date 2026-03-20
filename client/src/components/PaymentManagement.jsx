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
  IndianRupee
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
  
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMode: "bank-transfer",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    recordedBy: ""
  });

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

  // Frontend validation function for ADD payment
  const validateAddPaymentAmount = (amount) => {
    if (!invoice) return false;
    const remainingBalance = invoice.totalAmount - invoice.amountPaid;
    return parseFloat(amount) <= remainingBalance;
  };

  // Frontend validation function for EDIT payment
  const validateEditPaymentAmount = (amount) => {
    if (!invoice || !editingPayment) return false;
    // Subtract the original payment amount first, then add the new amount
    const amountWithoutCurrentPayment = invoice.amountPaid - editingPayment.amountPaid;
    const remainingBalance = invoice.totalAmount - amountWithoutCurrentPayment;
    return parseFloat(amount) <= remainingBalance;
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    // Convert amount to number before sending
    const paymentPayload = {
      ...paymentData,
      amount: parseFloat(paymentData.amount) // Convert string to number
    };

    console.log("Sending payment data:", paymentPayload);
    
    // Frontend validation
    if (!validateAddPaymentAmount(paymentData.amount)) {
      const remainingBalance = invoice.totalAmount - invoice.amountPaid;
      toast.error(`Payment would exceed total amount. Maximum allowed: Rs. ${remainingBalance.toFixed(2)}`);
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/invoices/${id}/payments`,
        paymentPayload // Send the converted payload
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
      fetchInvoiceAndPayments();
    } catch (error) {
      console.error("Payment error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to add payment");
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();

    // Convert amount to number before sending
    const paymentPayload = {
      ...paymentData,
      amount: parseFloat(paymentData.amount) // Convert string to number
    };

    // Frontend validation for edit - use different calculation
    if (!validateEditPaymentAmount(paymentData.amount)) {
      const amountWithoutCurrentPayment = invoice.amountPaid - editingPayment.amountPaid;
      const remainingBalance = invoice.totalAmount - amountWithoutCurrentPayment;
      toast.error(`Payment would exceed total amount. Maximum allowed: Rs. ${remainingBalance.toFixed(2)}`);
      return;
    }

    try {
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
      fetchInvoiceAndPayments();
    } catch (error) {
      console.error("Update payment error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update payment");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_BASE_URL}/invoices/${id}/payments/${paymentId}`
        );
        
        toast.success("Payment deleted successfully");
        fetchInvoiceAndPayments();
      } catch (error) {
        toast.error("Failed to delete payment");
      }
    }
  };

  const startEditPayment = (payment) => {
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

  // Prevent wheel event on number input to stop accidental value changes
  const handleWheel = (e) => {
    e.target.blur();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "16rem" }}>
        <div
          className="animate-spin rounded-full border-b-2 border-blue-600"
          style={{ height: "3rem", width: "3rem" }}
        ></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  // Calculate remaining balance for display - DIFFERENT FOR ADD VS EDIT
  const getRemainingBalance = () => {
    if (editingPayment) {
      const amountWithoutCurrentPayment = invoice.amountPaid - editingPayment.amountPaid;
      return invoice.totalAmount - amountWithoutCurrentPayment;
    } else {
      return invoice.totalAmount - invoice.amountPaid;
    }
  };

  const remainingBalance = getRemainingBalance();
  const isAmountValid = paymentData.amount && parseFloat(paymentData.amount) <= remainingBalance;

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
          >
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Management
            </h1>
            <p className="text-gray-600">
              Invoice #{invoice.invoiceNumber} - {invoice.client?.companyName}
            </p>
          </div>
        </div>

        {/* Invoice Summary */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr", 
          gap: "16px",
          marginBottom: "24px"
        }} className="md:grid-cols-4">
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-lg font-semibold text-gray-900">
              Rs. {invoice.totalAmount?.toFixed(2)}
            </p>
          </div>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p className="text-sm text-gray-600">Amount Paid</p>
            <p className="text-lg font-semibold text-green-600">
              Rs. {invoice.amountPaid?.toFixed(2)}
            </p>
          </div>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p className="text-sm text-gray-600">Amount Due</p>
            <p className="text-lg font-semibold text-orange-600">
              Rs. {invoice.amountDue?.toFixed(2)}
            </p>
          </div>
          <div style={{ 
            backgroundColor: "white", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-lg font-semibold ${
              invoice.status === "paid" ? "text-green-600" :
              invoice.status === "partial" ? "text-orange-600" :
              "text-gray-600"
            }`}>
              {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Button */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => setShowAddPayment(true)}
          disabled={invoice.amountPaid >= invoice.totalAmount}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            padding: "8px 16px", 
            backgroundColor: "#2563eb", 
            color: "white", 
            borderRadius: "8px"
          }}
          className="cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h3 className="text-lg font-semibold">
              {editingPayment ? "Edit Payment" : "Add New Payment"}
            </h3>
            <button
              onClick={cancelEdit}
              style={{ padding: "4px", color: "#6b7280" }}
              className="hover:bg-gray-100 rounded"
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>

          <form onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: "8px" }}>
                  Amount *
                  <span className="ml-2 text-sm text-gray-500">
                    (Max: Rs. {remainingBalance.toFixed(2)})
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  onWheel={handleWheel} // Prevent scroll wheel from changing value
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: `1px solid ${
                      paymentData.amount && !isAmountValid 
                        ? '#ef4444' 
                        : '#d1d5db'
                    }`,
                    borderRadius: "8px"
                  }}
                  placeholder="Enter amount"
                />
                {paymentData.amount && !isAmountValid && (
                  <p className="text-red-600 text-sm mt-1">
                    Amount exceeds remaining balance of Rs. {remainingBalance.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: "8px" }}>
                  Payment Mode *
                </label>
                <select
                  required
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px"
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
                <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: "8px" }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px"
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: "8px" }}>
                  Recorded By
                </label>
                <input
                  type="text"
                  value={paymentData.recordedBy}
                  onChange={(e) => setPaymentData({ ...paymentData, recordedBy: e.target.value })}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px"
                  }}
                  placeholder="Your name"
                />
              </div>

              <div style={{ gridColumn: "span 1" }} className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: "8px" }}>
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows="3"
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db",
                    borderRadius: "8px"
                  }}
                  placeholder="Additional notes about this payment"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                type="submit"
                disabled={!paymentData.amount || !isAmountValid}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  padding: "8px 16px", 
                  backgroundColor: "#2563eb", 
                  color: "white", 
                  borderRadius: "8px",
                  opacity: (!paymentData.amount || !isAmountValid) ? 0.5 : 1
                }}
                className="cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed"
              >
                <Save style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                {editingPayment ? "Update Payment" : "Add Payment"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                style={{ 
                  padding: "8px 16px", 
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  borderRadius: "8px"
                }}
                className="cursor-pointer hover:bg-gray-50"
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
        <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </div>

        {paymentHistory.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <IndianRupee style={{ width: "48px", height: "48px", color: "#9ca3af", margin: "0 auto 16px" }} />
            <p className="text-gray-500">No payments recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paymentHistory.map((payment) => (
              <div key={payment._id} style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Rs. {payment.amountPaid?.toFixed(2)}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <Calendar style={{ width: "16px", height: "16px", color: "#6b7280" }} />
                        <span className="text-sm text-gray-600">
                          {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          • {payment.paymentMode}
                        </span>
                        {payment.recordedBy && (
                          <span className="text-sm text-gray-500">
                            • By {payment.recordedBy}
                          </span>
                        )}
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-600" style={{ marginTop: "4px" }}>
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p className="text-sm text-gray-600">
                      Balance Due: Rs. {payment.balanceDueAfter?.toFixed(2)}
                    </p>
                    <button
                      onClick={() => startEditPayment(payment)}
                      style={{ padding: "4px", color: "#6b7280" }}
                      className="hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Edit style={{ width: "16px", height: "16px" }} />
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment._id)}
                      style={{ padding: "4px", color: "#6b7280" }}
                      className="hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Trash2 style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;