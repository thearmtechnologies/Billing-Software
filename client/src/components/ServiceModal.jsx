import { X, Plus, Trash2, Package } from "lucide-react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DEFAULT_UNITS = [
  "km", "hour", "day", "month", "item", "kg", "piece", "service", "ton", "shift",
];

const ServiceModal = ({ service, onSave, onCancel }) => {
  const pricingTypes = ["fixed", "flat", "tiered"];

  // ── Custom Unit State (mirrors CreateInvoice) ──
  const [customUnits, setCustomUnits] = useState([]);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitShortCode, setNewUnitShortCode] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);

  useEffect(() => {
    const fetchCustomUnits = async () => {
      try {
        axios.defaults.withCredentials = true;
        const res = await axios.get(`${BASE_URL}/users/custom-units`);
        setCustomUnits(res.data.customUnits || []);
      } catch {
        console.error("Failed to fetch custom units");
      }
    };
    fetchCustomUnits();
  }, []);

  const handleUnitChange = (value) => {
    if (value === "__add_custom__") {
      setNewUnitName("");
      setNewUnitShortCode("");
      setShowAddUnitModal(true);
    } else {
      setFormData((prev) => ({ ...prev, unitType: value }));
    }
  };

  const handleAddCustomUnit = async () => {
    const trimmed = newUnitName.trim();
    if (!trimmed) {
      toast.error("Unit name is required");
      return;
    }
    setAddingUnit(true);
    try {
      const res = await axios.post(`${BASE_URL}/users/custom-units`, {
        name: trimmed,
        shortCode: newUnitShortCode.trim(),
      });
      setCustomUnits(res.data.customUnits);
      // Auto-select newly created unit
      setFormData((prev) => ({ ...prev, unitType: trimmed }));
      setShowAddUnitModal(false);
      toast.success("Custom unit added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add custom unit");
    } finally {
      setAddingUnit(false);
    }
  };

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    unitType: service?.unitType || "item",
    pricingType: service?.pricingType || "fixed",
    baseRate: service?.baseRate || "",
    pricingTiers: service?.pricingTiers || [],
    hsnCode: service?.hsnCode || "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.pricingType === "fixed" || formData.pricingType === "flat") {
      if (
        !formData.baseRate ||
        isNaN(formData.baseRate) ||
        parseFloat(formData.baseRate) <= 0
      ) {
        newErrors.baseRate = "Valid base rate is required";
      }
    } else if (formData.pricingType === "tiered") {
      if (formData.pricingTiers.length === 0) {
        newErrors.pricingTiers = "At least one pricing tier is required";
      } else {
        formData.pricingTiers.forEach((tier, index) => {
          if (
            tier.minValue === undefined ||
            tier.minValue === "" ||
            tier.rate === undefined ||
            tier.rate === ""
          ) {
            newErrors[`tier_${index}`] = "All tier fields are required";
          }
          if (
            tier.maxValue !== null &&
            parseFloat(tier.maxValue) <= parseFloat(tier.minValue)
          ) {
            newErrors[`tier_${index}`] =
              "Max value must be greater than min value";
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSave({
        ...formData,
        baseRate:
          formData.pricingType === "tiered"
            ? 0
            : parseFloat(formData.baseRate) || 0,
        pricingTiers: formData.pricingTiers.map((tier) => ({
          ...tier,
          minValue: parseFloat(tier.minValue),
          maxValue:
            tier.maxValue === "" || tier.maxValue == null
              ? null
              : parseFloat(tier.maxValue),
          rate: parseFloat(tier.rate),
        })),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addTier = () => {
    setFormData((prev) => {
      const lastTier = prev.pricingTiers[prev.pricingTiers.length - 1];
      const nextMin = lastTier?.maxValue ?? 0;

      return {
        ...prev,
        pricingTiers: [
          ...prev.pricingTiers,
          {
            minValue: nextMin,
            maxValue: null,
            rate: 0,
            rateType: "slabRate",
          },
        ],
      };
    });
  };

  const removeTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index),
    }));
  };

  const updateTier = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  };

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

  const focusProps = {
    onFocus: (e) => {
      e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
    },
    onBlur: (e) => {
      e.currentTarget.style.borderColor = "var(--border, #E5E5E7)";
      e.currentTarget.style.boxShadow = "none";
    }
  };

  const errorFocusProps = (hasError) => ({
    onFocus: (e) => {
      if (!hasError) {
        e.currentTarget.style.borderColor = "var(--accent, #0071E3)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.12)";
      } else {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.12)";
      }
    },
    onBlur: (e) => {
      e.currentTarget.style.borderColor = hasError ? "#DC2626" : "var(--border, #E5E5E7)";
      e.currentTarget.style.boxShadow = "none";
    }
  });


  return (
    <>
      {/* ── Service Form Modal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pt-8 pb-8">
        {/* Backdrop */}
        <div
          className="absolute inset-0 transition-opacity"
          onClick={onCancel}
          style={{
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
        
        {/* Modal Container */}
        <div
          className="relative bg-white transform transition-all w-full max-w-2xl"
          style={{
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light, #F0F0F2)" }}>
            <div className="flex items-center justify-between">
              <h3 style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--text-primary, #1D1D1F)",
                letterSpacing: "-0.02em",
              }}>
                {service ? "Edit Service" : "Add New Service"}
              </h3>
              <button
                onClick={onCancel}
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
          </div>

          <div style={{ overflow: "auto", flex: 1, padding: "24px" }}>
            <form id="service-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>
                    Service Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.name ? "#DC2626" : "var(--border, #E5E5E7)",
                    }}
                    {...errorFocusProps(errors.name)}
                  />
                  {errors.name && (
                    <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{errors.name}</p>
                  )}
                </div>

                {/* ── Unit of Measurement (with Custom Unit support) ── */}
                <div>
                  <label style={labelStyle}>
                    Unit of Measurement <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    name="unitType"
                    value={formData.unitType}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    style={inputStyle}
                    {...focusProps}
                  >
                    <optgroup label="Default Units">
                      {DEFAULT_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </optgroup>
                    {customUnits.length > 0 && (
                      <optgroup label="Custom Units">
                        {customUnits.map((u) => (
                          <option key={u._id} value={u.name}>
                            {u.name}{u.shortCode ? ` (${u.shortCode})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="">
                      <option value="__add_custom__">+ Add Custom Unit</option>
                    </optgroup>
                    {/* Preserve legacy / unrecognised unit values (e.g. "other") */}
                    {formData.unitType &&
                      !DEFAULT_UNITS.includes(formData.unitType) &&
                      !customUnits.some((u) => u.name === formData.unitType) &&
                      formData.unitType !== "__add_custom__" && (
                        <option value={formData.unitType} hidden>
                          {formData.unitType}
                        </option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Description <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                    borderColor: errors.description ? "#DC2626" : "var(--border, #E5E5E7)",
                  }}
                  {...errorFocusProps(errors.description)}
                />
                {errors.description && (
                  <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{errors.description}</p>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>
                    Pricing Type <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    name="pricingType"
                    value={formData.pricingType}
                    onChange={handleChange}
                    style={inputStyle}
                    {...focusProps}
                  >
                    {pricingTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>HSN Code</label>
                  <input
                    type="text"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleChange}
                    style={inputStyle}
                    {...focusProps}
                  />
                </div>
              </div>

              {(formData.pricingType === "fixed" || formData.pricingType === "flat") && (
                <div style={{ width: "50%" }}>
                  <label style={labelStyle}>
                    Base Rate <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="baseRate"
                    value={formData.baseRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    style={{
                      ...inputStyle,
                      borderColor: errors.baseRate ? "#DC2626" : "var(--border, #E5E5E7)",
                    }}
                    {...errorFocusProps(errors.baseRate)}
                    placeholder="0.00"
                  />
                  {errors.baseRate && (
                    <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{errors.baseRate}</p>
                  )}
                </div>
              )}

              {formData.pricingType === "tiered" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <label style={labelStyle}>
                      Pricing Tiers <span style={{ color: "red" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addTier}
                      style={{
                        ...btnPrimary,
                        padding: "6px 14px",
                        fontSize: "13px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--gradient-hover)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 113, 227, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--gradient-primary)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 113, 227, 0.3)";
                      }}
                    >
                      <Plus className="h-4 w-4" style={{ marginRight: "4px" }} />
                      Add Tier
                    </button>
                  </div>

                  {formData.pricingTiers.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {formData.pricingTiers.map((tier, index) => (
                        <div
                          key={index}
                          style={{
                            background: "var(--bg-page, #F7F7F8)",
                            borderRadius: "16px",
                            border: "1px solid var(--border, #E5E5E7)",
                            padding: "16px",
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: "100px" }}>
                            <label style={{ ...labelStyle, fontSize: "12px", marginBottom: "6px" }}>Min Value</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={tier.minValue}
                              onChange={(e) => updateTier(index, "minValue", e.target.value)}
                              style={{ ...inputStyle, padding: "10px 14px" }}
                              step="0.01"
                              min="0"
                              {...focusProps}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: "120px" }}>
                            <label style={{ ...labelStyle, fontSize: "12px", marginBottom: "6px" }}>Max Value</label>
                            <input
                              type="number"
                              placeholder="∞ (Empty for limits)"
                              value={tier.maxValue ?? ""}
                              onChange={(e) => updateTier(index, "maxValue", e.target.value)}
                              style={{ ...inputStyle, padding: "10px 14px" }}
                              step="0.01"
                              min="0"
                              {...focusProps}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: "100px" }}>
                            <label style={{ ...labelStyle, fontSize: "12px", marginBottom: "6px" }}>Rate (Rs. )</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={tier.rate}
                              onChange={(e) => updateTier(index, "rate", e.target.value)}
                              style={{ ...inputStyle, padding: "10px 14px" }}
                              step="0.01"
                              min="0"
                              {...focusProps}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: "120px" }}>
                            <label style={{ ...labelStyle, fontSize: "12px", marginBottom: "6px" }}>Rate Type</label>
                            <select
                              value={tier.rateType || "slabRate"}
                              onChange={(e) => updateTier(index, "rateType", e.target.value)}
                              style={{ ...inputStyle, padding: "10px 14px" }}
                              {...focusProps}
                            >
                              <option value="slabRate">Slab Rate</option>
                              <option value="unitRate">Unit Rate</option>
                            </select>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            style={{
                              background: "transparent",
                              border: "1px solid #FCA5A5",
                              color: "#DC2626",
                              padding: "10px",
                              borderRadius: "12px",
                              marginBottom: "6px",
                              cursor: "pointer",
                              transition: "all 150ms ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "41px",
                              width: "41px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#FEE2E2";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          {errors[`tier_${index}`] && (
                            <div style={{ width: "100%" }}>
                              <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "4px" }}>
                                {errors[`tier_${index}`]}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.pricingTiers && (
                    <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "12px" }}>{errors.pricingTiers}</p>
                  )}

                  {formData.pricingTiers.length === 0 && (
                    <div style={{
                      textAlign: "center",
                      background: "var(--bg-page, #F7F7F8)",
                      borderRadius: "16px",
                      border: "1px dashed var(--border, #E5E5E7)",
                      padding: "40px 20px"
                    }}>
                      <Package className="h-10 w-10" style={{ color: "var(--text-tertiary, #86868B)", margin: "0 auto 16px auto" }} />
                      <p style={{ color: "var(--text-secondary, #6E6E73)", fontSize: "14px", fontWeight: 500 }}>
                        No tiers added yet. Click &quot;Add Tier&quot; to create pricing tiers.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer Area */}
          <div
            style={{
              padding: "16px 24px",
              background: "var(--bg-page, #F7F7F8)",
              borderTop: "1px solid var(--border-light, #F0F0F2)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={btnSecondary}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover, #F0F0F2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-secondary, #FBFBFD)"; }}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="service-form"
              style={btnPrimary}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gradient-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 113, 227, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gradient-primary)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 113, 227, 0.3)";
              }}
            >
              {service ? "Update Service" : "Add Service"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Custom Unit Modal (identical to CreateInvoice) ── */}
      {showAddUnitModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setShowAddUnitModal(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: "20px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
              padding: "28px", width: "100%", maxWidth: "400px",
              animation: "fadeInScale 200ms ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary, #1D1D1F)", letterSpacing: "-0.02em" }}>
                Add Custom Unit
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUnitModal(false)}
                style={{ background: "var(--surface-secondary, #F5F5F7)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary, #6E6E73)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  Unit Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g. litre, bundle, session"
                  style={{ ...inputStyle, marginTop: 0 }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomUnit(); } }}
                  {...focusProps}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  Short Code <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
                </label>
                <input
                  value={newUnitShortCode}
                  onChange={(e) => setNewUnitShortCode(e.target.value)}
                  placeholder="e.g. ltr, bdl, sess"
                  style={{ ...inputStyle, marginTop: 0 }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomUnit(); } }}
                  {...focusProps}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setShowAddUnitModal(false)}
                style={{ ...btnSecondary, flex: 1, padding: "12px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomUnit}
                disabled={addingUnit}
                style={{ ...btnPrimary, flex: 1, padding: "12px", opacity: addingUnit ? 0.6 : 1 }}
              >
                {addingUnit ? "Saving..." : "Save Unit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceModal;