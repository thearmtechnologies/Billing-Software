import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Landmark,
  User,
  Hash,
  MapPin as Branch,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Star,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { UserContext } from "../context/userContext";

axios.defaults.withCredentials = true;
const BASE_URL = import.meta.env.VITE_BASE_URL;

const BankDetailsForm = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialFormState = {
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "savings",
    upiId: "",
    isPrimary: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showSensitiveData, setShowSensitiveData] = useState({
    accountNumber: false,
    ifscCode: false,
    upiId: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/users/bank-accounts`);
      setBankAccounts(data.bankAccounts || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error("Failed to fetch bank accounts");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleSensitiveData = (field) => {
    setShowSensitiveData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.accountHolderName?.trim()) newErrors.accountHolderName = "Account holder name is required";
    if (!formData.bankName?.trim()) newErrors.bankName = "Bank name is required";
    
    const accountNoClean = formData.accountNumber?.replace(/\s/g, "");
    if (!accountNoClean) newErrors.accountNumber = "Account number is required";
    else if (!/^\d{9,18}$/.test(accountNoClean)) newErrors.accountNumber = "Account number must be 9-18 digits";

    if (!formData.ifscCode?.trim()) newErrors.ifscCode = "IFSC code is required";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) newErrors.ifscCode = "Invalid IFSC code format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData, ifscCode: formData.ifscCode.toUpperCase() };

      let response;
      if (editingId) {
        response = await axios.put(`${BASE_URL}/users/bank-accounts/${editingId}`, payload);
        toast.success("Bank account updated successfully!");
      } else {
        response = await axios.post(`${BASE_URL}/users/bank-accounts`, payload);
        toast.success("Bank account added successfully!");
      }
      
      setBankAccounts(response.data.bankAccounts);
      setCurrentUser(prevUser => ({ ...prevUser, bankAccounts: response.data.bankAccounts }));
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save bank account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) return;
    try {
      setLoading(true);
      const { data } = await axios.delete(`${BASE_URL}/users/bank-accounts/${id}`);
      setBankAccounts(data.bankAccounts);
      setCurrentUser(prevUser => ({ ...prevUser, bankAccounts: data.bankAccounts }));
      toast.success("Bank account deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete bank account");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      setLoading(true);
      const { data } = await axios.patch(`${BASE_URL}/users/bank-accounts/${id}/primary`);
      setBankAccounts(data.bankAccounts);
      setCurrentUser(prevUser => ({ ...prevUser, bankAccounts: data.bankAccounts }));
      toast.success("Primary account updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set primary account");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (account) => {
    setFormData(account);
    setEditingId(account._id);
    setErrors({});
    setIsFormOpen(true);
  };

  const maskAccountNumber = (accNo) => {
    if(!accNo) return "";
    return `**** ${accNo.slice(-4)}`;
  };

  // Full-page loader component
  if (loading && bankAccounts.length === 0 && !isFormOpen) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p style={{ color: "#6B7280", fontWeight: "500" }}>Loading your bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: "16px", paddingRight: "16px", paddingTop: "24px", paddingBottom: "80px", maxWidth: "896px", margin: "0 auto" }} className="md:px-6 md:py-8">
      {/* Header Section - Responsive */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }} className="sm:flex-row sm:items-center sm:justify-between md:mb-8">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="md:gap-4 w-full">
          <button 
            onClick={() => navigate("/profile")} 
            style={{ padding: "8px", marginLeft: "-8px", borderRadius: "9999px", flexShrink: 0 }}
            className="hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
          </button>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", letterSpacing: "-0.025em", margin: 0 }} className="md:text-3xl">
              Bank Accounts
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "2px", display: "none" }} className="sm:block">
              Manage your banking information for invoices
            </p>
          </div>
        </div>
        {!isFormOpen && (
          <button 
            onClick={openAddForm} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              paddingLeft: "16px", 
              paddingRight: "16px", 
              paddingTop: "10px", 
              paddingBottom: "10px", 
              backgroundColor: "#2563EB", 
              borderRadius: "12px", 
              fontWeight: "600", 
              fontSize: "14px", 
              transition: "all 150ms ease", 
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
              whiteSpace: "nowrap",
              border: "none",
              cursor: "pointer",
              color: "white"
            }}
            className="hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <Plus style={{ width: "16px", height: "16px", marginRight: "6px" }} />
            Add Account
          </button>
        )}
      </div>

      {!isFormOpen ? (
        // List View - Responsive Grid
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="md:gap-6">
          {bankAccounts.length === 0 && !loading && (
            <div style={{ textAlign: "center", paddingTop: "48px", paddingBottom: "48px", backgroundColor: "#F9FAFB", borderRadius: "16px", border: "1px dashed #E5E7EB" }} className="md:py-20">
              <Landmark style={{ width: "48px", height: "48px", color: "#9CA3AF", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "8px" }}>No bank accounts added</h3>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px", maxWidth: "320px", margin: "0 auto 24px" }}>
                Add your bank details so clients know where to send payments.
              </p>
              <button 
                onClick={openAddForm} 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  paddingLeft: "20px", 
                  paddingRight: "20px", 
                  paddingTop: "10px", 
                  paddingBottom: "10px", 
                  backgroundColor: "#111827", 
                  color: "white", 
                  borderRadius: "12px", 
                  fontWeight: "500", 
                  fontSize: "14px", 
                  border: "none",
                  cursor: "pointer",
                  transition: "all 150ms ease"
                }}
                className="hover:bg-gray-800"
              >
                Add Bank Account
              </button>
            </div>
          )}
          
          {/* Bank Cards Grid - Responsive */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: "16px" }} className="md:grid-cols-2 md:gap-6">
            {bankAccounts.map((acc) => (
              <div 
                key={acc._id} 
                style={{ 
                  position: "relative", 
                  backgroundColor: "white", 
                  borderRadius: "16px", 
                  border: `1px solid ${acc.isPrimary ? "#3B82F6" : "#E5E7EB"}`,
                  padding: "16px",
                  transition: "all 150ms ease",
                  boxShadow: acc.isPrimary ? "0 4px 6px -1px rgba(59, 130, 246, 0.1)" : "none"
                }}
                className="md:p-5 hover:shadow-lg"
              >
                {/* Primary Badge - Mobile adjusted position */}
                {acc.isPrimary && (
                  <div style={{ 
                    position: "absolute", 
                    top: "12px", 
                    right: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px", 
                    backgroundColor: "#EFF6FF", 
                    color: "#2563EB", 
                    paddingLeft: "8px", 
                    paddingRight: "8px", 
                    paddingTop: "4px", 
                    paddingBottom: "4px", 
                    borderRadius: "9999px", 
                    fontSize: "11px", 
                    fontWeight: "600", 
                    zIndex: 10 
                  }}>
                    <Star style={{ width: "12px", height: "12px", fill: "currentColor" }} />
                    Primary
                  </div>
                )}
                
                {/* Bank Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }} className="md:gap-4">
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    backgroundColor: "#F3F4F6", 
                    borderRadius: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    flexShrink: 0 
                  }} className="md:w-12 md:h-12">
                    <Landmark style={{ width: "20px", height: "20px", color: "#374151" }} className="md:w-6 md:h-6" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ 
                      fontWeight: "700", 
                      color: "#111827", 
                      fontSize: "16px", 
                      margin: 0, 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      whiteSpace: "nowrap", 
                      paddingRight: "48px" 
                    }} className="md:text-lg">
                      {acc.bankName}
                    </h3>
                    <p style={{ 
                      color: "#6B7280", 
                      fontSize: "12px", 
                      margin: 0, 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      whiteSpace: "nowrap" 
                    }} className="md:text-sm">
                      {acc.accountHolderName}
                    </p>
                  </div>
                </div>
                
                {/* Account Details - Responsive grid */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))", 
                  gap: "12px", 
                  marginBottom: "16px", 
                  backgroundColor: "#F9FAFB", 
                  padding: "12px", 
                  borderRadius: "12px" 
                }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                      Account Number
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937", fontFamily: "monospace", marginTop: "2px" }}>
                      {maskAccountNumber(acc.accountNumber)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                      IFSC Code
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937", fontFamily: "monospace", marginTop: "2px" }}>
                      {acc.ifscCode}
                    </p>
                  </div>
                  {acc.branchName && (
                    <div style={{ gridColumn: "span 2 / span 2" }} className="md:col-span-1">
                      <p style={{ fontSize: "10px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                        Branch
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                        {acc.branchName}
                      </p>
                    </div>
                  )}
                  {acc.upiId && (
                    <div style={{ gridColumn: "span 2 / span 2" }} className="md:col-span-1">
                      <p style={{ fontSize: "10px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                        UPI ID
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                        {acc.upiId}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons - Responsive layout */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", paddingTop: "8px", borderTop: "1px solid #F3F4F6" }}>
                  <button 
                    onClick={() => openEditForm(acc)} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      paddingLeft: "12px", 
                      paddingRight: "12px", 
                      paddingTop: "6px", 
                      paddingBottom: "6px", 
                      backgroundColor: "white", 
                      border: "1px solid #D1D5DB", 
                      borderRadius: "8px", 
                      color: "#374151", 
                      fontSize: "14px", 
                      fontWeight: "500", 
                      cursor: "pointer",
                      transition: "all 150ms ease"
                    }}
                    className="hover:bg-gray-50"
                  >
                    <Edit2 style={{ width: "14px", height: "14px" }} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(acc._id)} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      paddingLeft: "12px", 
                      paddingRight: "12px", 
                      paddingTop: "6px", 
                      paddingBottom: "6px", 
                      backgroundColor: "white", 
                      border: "1px solid #FECACA", 
                      borderRadius: "8px", 
                      color: "#DC2626", 
                      fontSize: "14px", 
                      fontWeight: "500", 
                      cursor: "pointer",
                      transition: "all 150ms ease"
                    }}
                    className="hover:bg-red-50"
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} /> Delete
                  </button>
                  <div style={{ flex: 1, display: "none" }} className="md:block"></div>
                  {!acc.isPrimary && (
                    <button 
                      onClick={() => handleSetPrimary(acc._id)} 
                      style={{ 
                        paddingLeft: "12px", 
                        paddingRight: "12px", 
                        paddingTop: "6px", 
                        paddingBottom: "6px", 
                        color: "#2563EB", 
                        fontSize: "14px", 
                        fontWeight: "500", 
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        marginLeft: "auto"
                      }}
                      className="md:ml-0 hover:underline"
                    >
                      Set as Primary
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Form View - Fully Responsive
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "16px", 
          border: "1px solid #E5E7EB", 
          padding: "20px", 
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" 
        }} className="md:p-6">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }} className="sm:flex-row sm:items-center sm:justify-between">
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }} className="md:text-2xl">
              {editingId ? "Edit Bank Account" : "Add Bank Account"}
            </h2>
            <button 
              onClick={() => setIsFormOpen(false)} 
              style={{ 
                color: "#6B7280", 
                fontSize: "14px", 
                fontWeight: "600", 
                background: "transparent",
                border: "none",
                cursor: "pointer",
                alignSelf: "flex-start"
              }}
              className="sm:self-auto hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* 2-column grid for larger screens */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: "16px" }} className="md:grid-cols-2">
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Account Holder Name *</label>
                <input 
                  type="text" 
                  name="accountHolderName" 
                  value={formData.accountHolderName} 
                  onChange={handleChange} 
                  style={{ 
                    width: "100%", 
                    paddingLeft: "16px", 
                    paddingRight: "16px", 
                    paddingTop: "10px", 
                    paddingBottom: "10px", 
                    border: `1px solid ${errors.accountHolderName ? "#EF4444" : "#D1D5DB"}`,
                    borderRadius: "12px",
                    outline: "none",
                    fontSize: "16px",
                    transition: "all 150ms ease",
                    boxSizing: "border-box"
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.accountHolderName && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.accountHolderName}</p>}
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Bank Name *</label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={formData.bankName} 
                  onChange={handleChange} 
                  style={{ 
                    width: "100%", 
                    paddingLeft: "16px", 
                    paddingRight: "16px", 
                    paddingTop: "10px", 
                    paddingBottom: "10px", 
                    border: `1px solid ${errors.bankName ? "#EF4444" : "#D1D5DB"}`,
                    borderRadius: "12px",
                    outline: "none",
                    fontSize: "16px",
                    transition: "all 150ms ease",
                    boxSizing: "border-box"
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.bankName && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.bankName}</p>}
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Branch Name</label>
                <input 
                  type="text" 
                  name="branchName" 
                  value={formData.branchName} 
                  onChange={handleChange} 
                  style={{ 
                    width: "100%", 
                    paddingLeft: "16px", 
                    paddingRight: "16px", 
                    paddingTop: "10px", 
                    paddingBottom: "10px", 
                    border: "1px solid #D1D5DB",
                    borderRadius: "12px",
                    outline: "none",
                    fontSize: "16px",
                    transition: "all 150ms ease",
                    boxSizing: "border-box"
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Account Number *</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showSensitiveData.accountNumber ? "text" : "password"} 
                    name="accountNumber" 
                    value={formData.accountNumber} 
                    onChange={handleChange} 
                    style={{ 
                      width: "100%", 
                      paddingLeft: "16px", 
                      paddingRight: "40px", 
                      paddingTop: "10px", 
                      paddingBottom: "10px", 
                      border: `1px solid ${errors.accountNumber ? "#EF4444" : "#D1D5DB"}`,
                      borderRadius: "12px",
                      outline: "none",
                      fontSize: "16px",
                      transition: "all 150ms ease",
                      boxSizing: "border-box"
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button 
                    type="button" 
                    onClick={() => toggleSensitiveData("accountNumber")} 
                    style={{ 
                      position: "absolute", 
                      right: "12px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      color: "#9CA3AF", 
                      background: "transparent",
                      border: "none",
                      cursor: "pointer"
                    }}
                    className="hover:text-gray-600"
                  >
                    {showSensitiveData.accountNumber ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.accountNumber && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.accountNumber}</p>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>IFSC Code *</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showSensitiveData.ifscCode ? "text" : "password"} 
                    name="ifscCode" 
                    value={formData.ifscCode} 
                    onChange={handleChange} 
                    style={{ 
                      width: "100%", 
                      paddingLeft: "16px", 
                      paddingRight: "40px", 
                      paddingTop: "10px", 
                      paddingBottom: "10px", 
                      border: `1px solid ${errors.ifscCode ? "#EF4444" : "#D1D5DB"}`,
                      borderRadius: "12px",
                      outline: "none",
                      fontSize: "16px",
                      textTransform: "uppercase",
                      transition: "all 150ms ease",
                      boxSizing: "border-box"
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button 
                    type="button" 
                    onClick={() => toggleSensitiveData("ifscCode")} 
                    style={{ 
                      position: "absolute", 
                      right: "12px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      color: "#9CA3AF", 
                      background: "transparent",
                      border: "none",
                      cursor: "pointer"
                    }}
                    className="hover:text-gray-600"
                  >
                    {showSensitiveData.ifscCode ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.ifscCode && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.ifscCode}</p>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Account Type</label>
                <select 
                  name="accountType" 
                  value={formData.accountType} 
                  onChange={handleChange} 
                  style={{ 
                    width: "100%", 
                    paddingLeft: "16px", 
                    paddingRight: "16px", 
                    paddingTop: "10px", 
                    paddingBottom: "10px", 
                    border: "1px solid #D1D5DB",
                    borderRadius: "12px",
                    outline: "none",
                    fontSize: "16px",
                    backgroundColor: "white",
                    boxSizing: "border-box"
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="salary">Salary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ gridColumn: "span 1" }} className="md:col-span-2">
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>UPI ID (Optional)</label>
                <input 
                  type="text" 
                  name="upiId" 
                  value={formData.upiId} 
                  onChange={handleChange} 
                  style={{ 
                    width: "100%", 
                    paddingLeft: "16px", 
                    paddingRight: "16px", 
                    paddingTop: "10px", 
                    paddingBottom: "10px", 
                    border: "1px solid #D1D5DB",
                    borderRadius: "12px",
                    outline: "none",
                    fontSize: "16px",
                    transition: "all 150ms ease",
                    boxSizing: "border-box"
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {!editingId && bankAccounts.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <input 
                  type="checkbox" 
                  id="isPrimary" 
                  name="isPrimary" 
                  checked={formData.isPrimary} 
                  onChange={handleChange} 
                  style={{ width: "16px", height: "16px", borderRadius: "4px" }}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrimary" style={{ fontSize: "14px", color: "#374151", fontWeight: "500", cursor: "pointer", userSelect: "none" }}>
                  Set as primary bank account
                </label>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px" }} className="sm:flex-row-reverse">
              <button 
                onClick={handleSave} 
                disabled={loading} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px", 
                  paddingLeft: "24px", 
                  paddingRight: "24px", 
                  paddingTop: "10px", 
                  paddingBottom: "10px", 
                  backgroundColor: "#2563EB", 
                  color: "white", 
                  borderRadius: "12px", 
                  fontWeight: "600", 
                  fontSize: "14px", 
                  border: "none",
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 150ms ease",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                }}
                className="hover:bg-blue-700"
              >
                {loading ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "16px", height: "16px" }} />}
                {loading ? "Saving..." : "Save Account"}
              </button>
              <button 
                onClick={() => setIsFormOpen(false)} 
                style={{ 
                  paddingLeft: "24px", 
                  paddingRight: "24px", 
                  paddingTop: "10px", 
                  paddingBottom: "10px", 
                  backgroundColor: "#F3F4F6", 
                  color: "#1F2937", 
                  borderRadius: "12px", 
                  fontWeight: "600", 
                  fontSize: "14px", 
                  border: "none",
                  cursor: "pointer",
                  transition: "all 150ms ease"
                }}
                className="hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsForm;