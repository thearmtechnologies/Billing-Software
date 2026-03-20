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
    },
  });

  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/users/profile`);

        setFormData({
          name: data.name || "",
          businessName: data.businessName || "",
          phone: data.phone || "",
          email: data.email || "",
          taxId: data.taxId || "",
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
          },
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

    fetchProfile();
    fetchBankDetails();

  }, [token]);

  // Handle top-level field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-format Udyam Number to uppercase
    if (name === "udyamNo") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
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

  // Save changes
  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = { ...formData };

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

  return (
    <div style={{ padding: "20px" }} className="flex flex-col gap-6">
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
          className="flex items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          style={{ padding: "8px 16px" }}
        >
          <Save className="w-5 h-5" style={{ marginRight: "8px" }} />
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Branding & Signature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrandingCard currentLogoUrl={logoUrl} onLogoChange={(url) => setLogoUrl(url)} />
        <SignatureCard currentSignatureUrl={signatureUrl} onSignatureChange={(url) => setSignatureUrl(url)} />
      </div>

      {/* Business Info */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
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
              className="block text-sm font-medium text-gray-700"
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
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="Enter your business name"
            />
          </div>

          {/* Name */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
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
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="Your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
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
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="10-digit phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
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
              className="block text-sm font-medium text-gray-700"
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
                    className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="block text-sm font-medium text-gray-700"
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
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="Enter tax ID or GST number"
            />
          </div>


          {/* Udyam Number */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
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
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="block text-sm font-medium text-gray-700"
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
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="Enter HSN Code (4-8 digits)"
            />
            <p className="text-xs text-gray-500" style={{marginTop: '4px'}}>
              Harmonized System of Nomenclature code for your products
            </p>
          </div>

        </div>
      </div>

      {/* Invoice Preferences Section */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
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
              className="block text-sm font-medium text-gray-700"
              style={{ marginBottom: "8px" }}
            >
              Invoice Number Prefix
            </label>
            <input
              type="text"
              name="prefix"
              value={formData.invoicePreferences.prefix}
              onChange={handleInvoicePreferencesChange}
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="e.g. INV-"
            />
          </div>

          {/* Suffix */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ marginBottom: "8px" }}
            >
              Invoice Number Suffix
            </label>
            <input
              type="text"
              name="suffix"
              value={formData.invoicePreferences.suffix}
              onChange={handleInvoicePreferencesChange}
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ padding: "10px" }}
              placeholder="e.g. -2025"
            />
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
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
        className="bg-white rounded-lg shadow-sm border border-gray-200"
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
                {isBankDetailsComplete() ? (
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
