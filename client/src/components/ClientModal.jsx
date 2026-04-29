import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
axios.defaults.withCredentials = true;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ClientModal = ({ isOpen, onClose, client, handleSaveClient }) => {
  const emptyForm = {
    companyName: "",
    email: "",
    phone: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "India" },
    gstNumber: "",
    panNumber: "",
    notes: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setFormData({ ...client, address: client.address || emptyForm.address });
    } else {
      setFormData(emptyForm);
    }
    setStep(1);
    setErrors({});
  }, [client, isOpen]);

  const validateStep = () => {
    const stepErrors = {};
    if (step === 1) {
      if (!formData.companyName.trim()) {
        stepErrors.companyName = "Company name is required";
      }
      if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
        stepErrors.phone = "Enter a valid 10-digit Indian mobile number";
      }
    } else if (step === 2) {
      if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
        stepErrors.panNumber = "Enter a valid PAN Card Number";
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      
      if (sanitized && !/^[6-9]\d{9}$/.test(sanitized)) {
        setErrors((prev) => ({ ...prev, phone: "Enter a valid 10-digit Indian mobile number" }));
      } else {
        setErrors((prev) => {
          const newE = { ...prev };
          delete newE.phone;
          return newE;
        });
      }
    } else if (name === "panNumber") {
      const upValue = value.toUpperCase();
      setFormData((prev) => ({ ...prev, [name]: upValue }));
      
      if (upValue && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upValue)) {
        setErrors((prev) => ({ ...prev, panNumber: "Enter a valid PAN Card Number" }));
      } else {
        setErrors((prev) => {
          const newE = { ...prev };
          delete newE.panNumber;
          return newE;
        });
      }
    } else if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (validateStep()) {
      setStep(2);
    } else {
      toast.error("Please fix errors before proceeding.");
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return toast.error("Please fill required fields.");

    setLoading(true);
    await handleSaveClient(formData);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  /* ── Apple-Style Tokens ── */
  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid var(--border, #E5E5E7)",
    background: "var(--surface, #FFFFFF)",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "var(--text-primary, #1D1D1F)",
    transition: "all 200ms ease",
    outline: "none",
    marginTop: "6px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary, #6E6E73)",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 20px",
    borderRadius: "12px",
    background: "var(--gradient-primary)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "all 200ms ease",
    boxShadow: "0 1px 3px rgba(0, 113, 227, 0.3)",
    letterSpacing: "-0.006em",
  };

  const btnSecondary = {
    ...btnPrimary,
    background: "var(--surface-secondary, #FBFBFD)",
    color: "var(--text-primary, #1D1D1F)",
    border: "1px solid var(--border, #E5E5E7)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white transform transition-all"
        style={{
          width: "500px",
          height: "600px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <form
          onSubmit={(e) => {
            if (step === 2) {
              handleSubmit(e);
            } else {
              e.preventDefault();
            }
          }}
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-light, #F0F0F2)",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--text-primary, #1D1D1F)",
                letterSpacing: "-0.02em",
              }}
            >
              {client ? "Edit Client" : "Add New Client"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary, #86868B)",
                padding: "4px",
                borderRadius: "50%",
                transition: "all 150ms ease",
                display: "flex",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--border-light, #F0F0F2)";
                e.currentTarget.style.color = "var(--text-primary, #1D1D1F)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-tertiary, #86868B)";
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ padding: "20px 24px 0 24px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background: step >= 1 ? "var(--accent, #0071E3)" : "var(--border-light, #F0F0F2)",
                  transition: "background 300ms ease",
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background: step >= 2 ? "var(--accent, #0071E3)" : "var(--border-light, #F0F0F2)",
                  transition: "background 300ms ease",
                }}
              />
            </div>
          </div>

          {/* Steps Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {step === 1 && (
              <>
                <div>
                  <label style={labelStyle}>
                    Company Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.companyName ? "#DC2626" : "var(--border, #E5E5E7)",
                    }}
                    onFocus={(e) => {
                      if (!errors.companyName) {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      } else {
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.12)";
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = errors.companyName ? "#DC2626" : "var(--border, #E5E5E7)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {errors.companyName && (
                    <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>
                      {errors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.phone ? "#DC2626" : "var(--border, #E5E5E7)",
                    }}
                    onFocus={(e) => {
                      if (!errors.phone) {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      } else {
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.12)";
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = errors.phone ? "#DC2626" : "var(--border, #E5E5E7)";
                      e.currentTarget.style.boxShadow = "none";
                      
                      if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
                        setErrors((prev) => ({ ...prev, phone: "Enter a valid 10-digit Indian mobile number" }));
                      } else {
                        setErrors((prev) => {
                          const newE = { ...prev };
                          delete newE.phone;
                          return newE;
                        });
                      }
                    }}
                  />
                  {errors.phone && (
                    <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>
                      {errors.phone}
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                    <label style={labelStyle}>GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                    <label style={labelStyle}>PAN Card Number</label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      style={{
                        ...inputStyle,
                        borderColor: errors.panNumber ? "#DC2626" : "var(--border, #E5E5E7)",
                      }}
                      onFocus={(e) => {
                        if (!errors.panNumber) {
                          e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                        } else {
                          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.12)";
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = errors.panNumber ? "#DC2626" : "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      maxLength={10}
                    />
                    {errors.panNumber && (
                      <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>
                        {errors.panNumber}
                      </p>
                    )}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Area */}
          <div
            style={{
              padding: "16px 24px",
              background: "var(--bg-page, #F7F7F8)",
              borderTop: "1px solid var(--border-light, #F0F0F2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={btnSecondary}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover, #F0F0F2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-secondary, #FBFBFD)"; }}
            >
              Cancel
            </button>

            <div style={{ display: "flex", gap: "12px" }}>
              {step === 2 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  style={btnSecondary}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover, #F0F0F2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-secondary, #FBFBFD)"; }}
                >
                  Previous
                </button>
              )}

              {step === 2 ? (
                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "var(--gradient-hover)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 113, 227, 0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "var(--gradient-primary)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 113, 227, 0.3)";
                    }
                  }}
                >
                  {loading ? "Saving..." : client ? "Update Client" : "Create Client"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={Object.keys(errors).length > 0}
                  style={{
                    ...btnPrimary,
                    opacity: Object.keys(errors).length > 0 ? 0.6 : 1,
                    cursor: Object.keys(errors).length > 0 ? "not-allowed" : "pointer"
                  }}
                  onMouseEnter={(e) => {
                    if (Object.keys(errors).length === 0) {
                      e.currentTarget.style.background = "var(--gradient-hover)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 113, 227, 0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (Object.keys(errors).length === 0) {
                      e.currentTarget.style.background = "var(--gradient-primary)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 113, 227, 0.3)";
                    }
                  }}
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
