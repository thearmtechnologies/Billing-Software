import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Save,
  Building,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Lock,
  User,
  Clock,
  CheckCircle,
  ChevronRight,
  Landmark,
  FileDigit,
  Hash,
  Trash2,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import BrandingCard from "../components/BrandingCard";
import SignatureCard from "../components/SignatureCard";

axios.defaults.withCredentials = true;
const BASE_URL = import.meta.env.VITE_BASE_URL;

const Profile = () => {
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    phone: "",
    email: "",
    taxId: "",
    panNumber: "",
    udyamNo: "",
    hsnCode: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    },
    invoicePreferences: {
      prefix: "",
      suffix: "",
      addressBehavior: "billing_and_shipping",
    },
    customProfileFields: [],
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [changePassword, setChangePassword] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      await Promise.all([fetchProfile(), fetchBankDetails()]);
      setPageLoading(false);
    };
    fetchData();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/users/profile`);

      setFormData({
        name: data.name || "",
        businessName: data.businessName || "",
        phone: data.phone || "",
        email: data.email || "",
        taxId: data.taxId || "",
        panNumber: data.panNumber || "",
        udyamNo: data.udyamNo || "",
        hsnCode: data.hsnCode || "",
        address: {
          street: data.address?.street || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          zipCode: data.address?.zipCode || "",
          country: data.address?.country || "India",
        },
        invoicePreferences: {
          prefix: data.invoicePreferences?.prefix || "",
          suffix: data.invoicePreferences?.suffix || "",
          addressBehavior: data.invoicePreferences?.addressBehavior || "billing_and_shipping",
        },
        customProfileFields: data.customProfileFields || [],
      });
      setLogoUrl(data.logoUrl || '');
      setSignatureUrl(data.signatureUrl || '');
    } catch (err) {
      toast.error("Failed to fetch profile");
      console.error(err);
    }
  };

  const fetchBankDetails = async () => {
    try {
      setBankLoading(true);
      const { data } = await axios.get(`${BASE_URL}/users/bank-accounts`);
      setBankDetails(data.bankAccounts);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Failed to fetch bank details:", err);
      }
    } finally {
      setBankLoading(false);
    }
  };

  // Handle top-level field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-format Udyam Number and PAN to uppercase
    if (name === "udyamNo" || name === "panNumber") {
      const upValue = value.toUpperCase();
      setFormData((prev) => ({ ...prev, [name]: upValue }));
      
      if (name === "panNumber") {
        if (upValue && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upValue)) {
          setErrors(prev => ({ ...prev, panNumber: "Enter a valid PAN Card Number" }));
        } else {
          setErrors(prev => { const newE = { ...prev }; delete newE.panNumber; return newE; });
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle address field changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  // Handle invoice preferences changes
  const handleInvoicePreferencesChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      invoicePreferences: { ...prev.invoicePreferences, [name]: value },
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankDetailsClick = () => {
    navigate("/bank-details");
  };

  const isBankDetailsComplete = () => {
    if (!bankDetails || bankDetails.length === 0) return false;
    return true;
  };

  const handleAddCustomField = () => {
    if (formData.customProfileFields.length < 6) {
      setFormData(prev => ({
        ...prev,
        customProfileFields: [...prev.customProfileFields, { label: "", value: "" }]
      }));
    } else {
      toast.error("Maximum 6 custom fields allowed");
    }
  };

  const handleCustomFieldChange = (index, field, value) => {
    const newFields = [...formData.customProfileFields];
    newFields[index][field] = value;
    setFormData(prev => ({ ...prev, customProfileFields: newFields }));
  };

  const handleRemoveCustomField = (index) => {
    const newFields = formData.customProfileFields.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, customProfileFields: newFields }));
  };

  // Save changes
  const handleSave = async () => {
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      toast.error("Enter a valid PAN Card Number");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData };
      payload.customProfileFields = payload.customProfileFields.filter(f => f.label.trim() && f.value.trim());

      if (changePassword) {
        payload.currentPassword = passwordFields.currentPassword;
        payload.newPassword = passwordFields.newPassword;
        payload.confirmNewPassword = passwordFields.confirmNewPassword;
      }

      const { data } = await axios.patch(
        `${BASE_URL}/users/update-profile`,
        payload
      );

      setCurrentUser(data.user);
      toast.success("Profile updated successfully!");
      setChangePassword(false);
    } catch (err) {
      const message = err.response?.data?.message || "Update failed!";
      toast.error(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (pageLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid rgba(0, 113, 227, 0.15)",
            borderTopColor: "var(--accent, #0071E3)",
            borderRadius: "50%",
            animation: "spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "0px" }} className="flex flex-col gap-6">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
        style={{ marginBottom: "24px" }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 className="text-2xl font-bold text-gray-900">
            Business Settings
          </h2>
          <p className="text-gray-600">
            Configure your business information and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
          style={{ padding: "8px 16px" }}
        >
          <Save className="w-5 h-5" style={{ marginRight: "8px" }} />
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Branding & Signature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrandingCard 
          currentLogoUrl={logoUrl} 
          onLogoChange={(url) => {
            setLogoUrl(url);
            if (currentUser) {
              const newUrl = url ? `${url.split('?')[0]}?t=${Date.now()}` : '';
              setCurrentUser({ ...currentUser, logoUrl: newUrl });
            }
          }} 
        />
        <SignatureCard 
          currentSignatureUrl={signatureUrl} 
          onSignatureChange={(url) => {
            setSignatureUrl(url);
            if (currentUser) {
              const newUrl = url ? `${url.split('?')[0]}?t=${Date.now()}` : '';
              setCurrentUser({ ...currentUser, signatureUrl: newUrl });
            }
          }} 
        />
      </div>

      {/* Business Info */}
      <div
        className="app-card border-none"
        style={{ padding: "24px" }}
      >
        <h3
          className="text-lg font-semibold text-gray-900"
          style={{ marginBottom: "16px" }}
        >
          Business Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <Building
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="Enter your business name"
            />
          </div>

          {/* Name */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <User className="w-4 h-4 inline" style={{ marginRight: "8px" }} />
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="Your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <Phone
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="10-digit phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <Mail className="w-4 h-4 inline" style={{ marginRight: "8px" }} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full border border-gray-300 rounded-lg bg-gray-100"
              style={{ padding: "10px" }}
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <MapPin
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              Business Address
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["street", "city", "state", "zipCode", "country"].map(
                (field) => (
                  <input
                    key={field}
                    type="text"
                    name={field}
                    value={formData.address[field]}
                    onChange={handleAddressChange}
                    className="form-input"
                    style={{ padding: "10px" }}
                    placeholder={field
                      .replace("zipCode", "Zip Code")
                      .replace("street", "Street / Building")
                      .replace("city", "City")
                      .replace("state", "State")
                      .replace("country", "Country")}
                  />
                )
              )}
            </div>
          </div>

          {/* Tax ID */}
          <div className="md:col-span-2">
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <CreditCard
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              Tax ID / GST Number
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="Enter tax ID or GST number"
            />
          </div>

          {/* PAN Card Number */}
          <div className="md:col-span-2">
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <CreditCard
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              PAN Card Number
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              className={`form-input ${errors?.panNumber ? '!border-red-500' : ''}`}
              style={{ padding: "10px" }}
              placeholder="Enter PAN Card Number"
              maxLength={10}
            />
            {errors?.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
          </div>


          {/* Udyam Number */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <FileDigit
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              Udyam Number
            </label>
            <input
              type="text"
              name="udyamNo"
              value={formData.udyamNo}
              onChange={handleChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="UDYAM-XX-XX-XXXXXXX"
            />
            <p className="text-xs text-gray-500" style={{marginTop: '4px'}}>
              Format: UDYAM-XX-XX-XXXXXXX
            </p>
          </div>

          {/* HSN Code */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              <Hash
                className="w-4 h-4 inline"
                style={{ marginRight: "8px" }}
              />
              HSN Code
            </label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="Enter HSN Code (4-8 digits)"
            />
              <p className="text-xs text-gray-500" style={{marginTop: '4px'}}>
              Harmonized System of Nomenclature code for your products
            </p>
          </div>

          {/* Custom Profile Fields */}
          <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <label className="form-label mb-0" style={{ marginBottom: "0px" }}>
                <FileDigit className="w-4 h-4 inline" style={{ marginRight: "8px" }} />
                Custom Details
              </label>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-1 inline" /> Add Field
              </button>
            </div>
            
            {formData.customProfileFields.map((field, index) => (
              <div key={index} className="flex gap-4 mb-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleCustomFieldChange(index, "label", e.target.value)}
                    placeholder="Label (e.g. Website)"
                    className="form-input"
                    style={{ padding: "10px" }}
                  />
                </div>
                <div className="flex-[2]">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(index, "value", e.target.value)}
                    placeholder="Value (e.g. xyz.com)"
                    className="form-input"
                    style={{ padding: "10px" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded mt-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {formData.customProfileFields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">
                No custom details added yet. Click "Add Field" to add items like Website, CIN, License No, etc.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Invoice Preferences Section */}
      <div
        className="app-card border-none"
        style={{ padding: "24px" }}
      >
        <h3
          className="text-lg font-semibold text-gray-900"
          style={{ marginBottom: "16px" }}
        >
          Invoice Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prefix */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              Invoice Number Prefix
            </label>
            <input
              type="text"
              name="prefix"
              value={formData.invoicePreferences.prefix}
              onChange={handleInvoicePreferencesChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="e.g. INV-"
            />
          </div>

          {/* Suffix */}
          <div>
            <label
              className="form-label"
              style={{ marginBottom: "8px" }}
            >
              Invoice Number Suffix
            </label>
            <input
              type="text"
              name="suffix"
              value={formData.invoicePreferences.suffix}
              onChange={handleInvoicePreferencesChange}
              className="form-input"
              style={{ padding: "10px" }}
              placeholder="e.g. -2025"
            />
          </div>
        </div>

        {/* Address Behavior Options */}
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
          <h4 className="text-sm font-medium text-gray-900" style={{ marginBottom: "16px" }}>
            Invoice Address Display
          </h4>
          <div className="flex flex-col gap-5">
            {/* Option 1 */}
            <label className="flex items-start cursor-pointer group">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="radio"
                  name="addressBehavior"
                  value="billing_only"
                  checked={formData.invoicePreferences.addressBehavior === "billing_only"}
                  onChange={handleInvoicePreferencesChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-gray-900 block">Billing address only</span>
                <span className="text-gray-500 block mt-1">Use the client billing address for invoices. Do not show shipping address fields unless needed.</span>
              </div>
            </label>

            {/* Option 2 */}
            <label className="flex items-start cursor-pointer group">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="radio"
                  name="addressBehavior"
                  value="billing_and_shipping"
                  checked={formData.invoicePreferences.addressBehavior === "billing_and_shipping"}
                  onChange={handleInvoicePreferencesChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-gray-900 block">Billing + Shipping when different (Default)</span>
                <span className="text-gray-500 block mt-1">Show a toggle in invoice creation to optionally add a different shipping address.</span>
              </div>
            </label>

            {/* Option 3 */}
            <label className="flex items-start cursor-pointer group">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="radio"
                  name="addressBehavior"
                  value="always_both"
                  checked={formData.invoicePreferences.addressBehavior === "always_both"}
                  onChange={handleInvoicePreferencesChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-gray-900 block">Always show both</span>
                <span className="text-gray-500 block mt-1">Always show both billing and shipping address fields directly.</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div
        className="app-card border-none"
        style={{ padding: "24px" }}
      >
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "16px" }}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lock
              className="w-5 h-5 text-gray-700"
              style={{ marginRight: "8px" }}
            />
            Password
          </h3>
          {!changePassword && (
            <button
              onClick={() => setChangePassword(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Change Password
            </button>
          )}
        </div>

        {!changePassword ? (
          <p className="text-gray-700" style={{ letterSpacing: "2px" }}>
            ••••••••
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["currentPassword", "newPassword", "confirmNewPassword"].map(
              (field) => (
                <input
                  key={field}
                  type="password"
                  name={field}
                  value={passwordFields[field]}
                  onChange={handlePasswordChange}
                  className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ padding: "10px" }}
                  placeholder={field
                    .replace("currentPassword", "Current Password")
                    .replace("newPassword", "New Password")
                    .replace("confirmNewPassword", "Confirm New Password")}
                />
              )
            )}
          </div>
        )}
      </div>

         {/* Bank Details Section */}
      <div 
        className="app-card border-none"
        style={{ padding: "24px" }}
      >
        <h3
          className="text-lg font-semibold text-gray-900"
          style={{ marginBottom: "16px" }}
        >
          Account Settings
        </h3>
        
        {/* Bank Details Item */}
        <div 
          onClick={handleBankDetailsClick}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            padding: "16px", 
            border: "1px solid #e5e7eb", 
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          className="hover:bg-gray-50"
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div 
              style={{ 
                width: "48px", 
                height: "48px", 
                backgroundColor: "#dbeafe", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                marginRight: "16px"
              }}
            >
              <Landmark style={{ width: "24px", height: "24px", color: "#2563eb" }} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Bank Details</h4>
              <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                {bankLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : isBankDetailsComplete() ? (
                  <>
                    <CheckCircle style={{ width: "16px", height: "16px", color: "#10b981", marginRight: "8px" }} />
                    <span className="text-sm text-green-600">Completed</span>
                  </>
                ) : (
                  <>
                    <Clock style={{ width: "16px", height: "16px", color: "#f97316", marginRight: "8px" }} />
                    <span className="text-sm text-orange-600">Bank details pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight style={{ width: "20px", height: "20px", color: "#9ca3af" }} />
        </div>
      </div>
    </div>
  );
};

export default Profile;