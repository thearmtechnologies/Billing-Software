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
  Star
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

  // Masking helper
  const maskAcountNumber = (accNo) => {
    if(!accNo) return "";
    return `**** ${accNo.slice(-4)}`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button onClick={() => navigate("/profile")} style={{ padding: "8px", marginRight: "16px", background: "transparent", border: "1px solid #E5E5E7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px" }} className="hover:bg-gray-100 transition-colors">
            <ArrowLeft style={{ width: "20px", height: "20px", color: "#1D1D1F" }} />
          </button>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1D1D1F", letterSpacing: "-0.03em" }}>Bank Accounts</h2>
            <p style={{ color: "#6E6E73", fontSize: "15px", marginTop: "4px" }}>Manage your banking information for invoices</p>
          </div>
        </div>
        {!isFormOpen && (
          <button onClick={openAddForm} style={{ display: "flex", alignItems: "center", padding: "10px 20px", backgroundColor: "#0071E3", color: "white", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-blue-600">
            <Plus style={{ width: "18px", height: "18px", marginRight: "6px" }} />
            Add Account
          </button>
        )}
      </div>

      {!isFormOpen ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {bankAccounts.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#FBFBFD", borderRadius: "20px", border: "1px dashed #E5E5E7" }}>
              <Landmark style={{ width: "48px", height: "48px", color: "#86868B", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1D1D1F", marginBottom: "8px" }}>No bank accounts added</h3>
              <p style={{ color: "#6E6E73", fontSize: "15px", marginBottom: "24px" }}>Add your bank details so clients know where to send payments.</p>
              <button onClick={openAddForm} style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", backgroundColor: "#1D1D1F", color: "white", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                Add Bank Account
              </button>
            </div>
          )}
          
          {bankAccounts.map((acc) => (
            <div key={acc._id} style={{ display: "flex", flexDirection: "column", backgroundColor: "#FFFFFF", borderRadius: "20px", border: acc.isPrimary ? "2px solid #0071E3" : "1px solid #E5E5E7", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", transition: "all 0.2s", position: "relative" }}>
              {acc.isPrimary && (
                <div style={{ position: "absolute", top: "24px", right: "24px", display: "flex", alignItems: "center", backgroundColor: "#E8F2FF", color: "#0071E3", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                  <Star style={{ width: "14px", height: "14px", marginRight: "4px", fill: "#0071E3" }} />
                  Primary
                </div>
              )}
              
              <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", backgroundColor: "#F5F5F7", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "16px" }}>
                  <Landmark style={{ width: "24px", height: "24px", color: "#1D1D1F" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1D1D1F" }}>{acc.bankName}</h3>
                  <p style={{ color: "#6E6E73", fontSize: "14px" }}>{acc.accountHolderName}</p>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#86868B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Account Number</p>
                  <p style={{ fontSize: "15px", color: "#1D1D1F", fontWeight: "500", fontVariantNumeric: "tabular-nums" }}>{maskAcountNumber(acc.accountNumber)}</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#86868B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>IFSC Code</p>
                  <p style={{ fontSize: "15px", color: "#1D1D1F", fontWeight: "500" }}>{acc.ifscCode}</p>
                </div>
                {acc.branchName && (
                  <div>
                    <p style={{ fontSize: "12px", color: "#86868B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Branch</p>
                    <p style={{ fontSize: "15px", color: "#1D1D1F", fontWeight: "500" }}>{acc.branchName}</p>
                  </div>
                )}
                {acc.upiId && (
                  <div>
                    <p style={{ fontSize: "12px", color: "#86868B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>UPI ID</p>
                    <p style={{ fontSize: "15px", color: "#1D1D1F", fontWeight: "500" }}>{acc.upiId}</p>
                  </div>
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #F0F0F2", paddingTop: "16px" }}>
                <button onClick={() => openEditForm(acc)} style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "transparent", border: "1px solid #E5E5E7", borderRadius: "10px", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-gray-50">
                  <Edit2 style={{ width: "16px", height: "16px", marginRight: "6px" }} /> Edit
                </button>
                <button onClick={() => handleDelete(acc._id)} style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "transparent", border: "1px solid #FCA5A5", borderRadius: "10px", fontSize: "13px", fontWeight: "600", color: "#DC2626", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-red-50">
                  <Trash2 style={{ width: "16px", height: "16px", marginRight: "6px" }} /> Delete
                </button>
                <div style={{ flex: 1 }}></div>
                {!acc.isPrimary && (
                  <button onClick={() => handleSetPrimary(acc._id)} style={{ padding: "8px 16px", background: "transparent", border: "none", fontSize: "13px", fontWeight: "600", color: "#0071E3", cursor: "pointer" }} className="hover:underline">
                    Set as Primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "white", borderRadius: "24px", border: "1px solid #E5E5E7", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1D1D1F" }}>{editingId ? "Edit Bank Account" : "Add Bank Account"}</h3>
            <button onClick={() => setIsFormOpen(false)} style={{ background: "transparent", border: "none", color: "#6E6E73", fontSize: "14px", fontWeight: "600", cursor: "pointer" }} className="hover:text-gray-900">Cancel</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }} className="md:grid-cols-2">
            <div className="md:col-span-2">
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>Account Holder Name *</label>
              <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: `1px solid ${errors.accountHolderName ? "#DC2626" : "#E5E5E7"}`, borderRadius: "12px", outline: "none", transition: "all 0.2s", fontSize: "15px" }} className="focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              {errors.accountHolderName && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "4px" }}>{errors.accountHolderName}</p>}
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>Bank Name *</label>
              <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: `1px solid ${errors.bankName ? "#DC2626" : "#E5E5E7"}`, borderRadius: "12px", outline: "none", fontSize: "15px" }} className="focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              {errors.bankName && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "4px" }}>{errors.bankName}</p>}
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>Branch Name</label>
              <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: "1px solid #E5E5E7", borderRadius: "12px", outline: "none", fontSize: "15px" }} className="focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>Account Number *</label>
              <div style={{ position: "relative" }}>
                <input type={showSensitiveData.accountNumber ? "text" : "password"} name="accountNumber" value={formData.accountNumber} onChange={handleChange} style={{ width: "100%", padding: "12px 40px 12px 16px", border: `1px solid ${errors.accountNumber ? "#DC2626" : "#E5E5E7"}`, borderRadius: "12px", outline: "none", fontSize: "15px" }} className="focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={() => toggleSensitiveData("accountNumber")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#86868B", cursor: "pointer" }}>
                  {showSensitiveData.accountNumber ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.accountNumber && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "4px" }}>{errors.accountNumber}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>IFSC Code *</label>
              <div style={{ position: "relative" }}>
                <input type={showSensitiveData.ifscCode ? "text" : "password"} name="ifscCode" value={formData.ifscCode} onChange={handleChange} style={{ width: "100%", padding: "12px 40px 12px 16px", border: `1px solid ${errors.ifscCode ? "#DC2626" : "#E5E5E7"}`, borderRadius: "12px", outline: "none", fontSize: "15px", textTransform: "uppercase" }} className="focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={() => toggleSensitiveData("ifscCode")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#86868B", cursor: "pointer" }}>
                  {showSensitiveData.ifscCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.ifscCode && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "4px" }}>{errors.ifscCode}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>Account Type</label>
              <select name="accountType" value={formData.accountType} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: "1px solid #E5E5E7", borderRadius: "12px", outline: "none", fontSize: "15px", backgroundColor: "white" }}>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="salary">Salary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1D1D1F", marginBottom: "6px" }}>UPI ID (Optional)</label>
              <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: "1px solid #E5E5E7", borderRadius: "12px", outline: "none", fontSize: "15px" }} />
            </div>

            {!editingId && bankAccounts.length > 0 && (
              <div className="md:col-span-2" style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
                <input type="checkbox" id="isPrimary" name="isPrimary" checked={formData.isPrimary} onChange={handleChange} style={{ width: "18px", height: "18px", marginRight: "10px", accentColor: "#0071E3" }} />
                <label htmlFor="isPrimary" style={{ fontSize: "14px", color: "#1D1D1F", userSelect: "none", cursor: "pointer" }}>Set as primary bank account</label>
              </div>
            )}

            <div className="md:col-span-2" style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setIsFormOpen(false)} style={{ padding: "12px 24px", background: "#F2F2F7", color: "#1D1D1F", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={loading} style={{ display: "flex", alignItems: "center", padding: "12px 24px", background: "#0071E3", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                <Save style={{ width: "18px", height: "18px", marginRight: "8px" }} />
                {loading ? "Saving..." : "Save Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsForm;
