import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import ItemLabel from "../components/ItemLabel";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const unitTypes = [
  "km", "hour", "day", "month", "item", "kg", "piece", "service", "ton", "shift", "other",
];
const pricingTypes = ["fixed", "flat", "tiered"];
const discountTypes = ["percentage", "fixed"];
const taxTypes = ["percentage", "fixed"];
const tierRateTypes = ["slabRate", "unitRate"];

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [Itemtotals, setItemTotals] = useState([]);
  const [totals, setTotals] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [collapsedItems, setCollapsedItems] = useState([]);
  const [invoicePreferences, setInvoicePreferences] = useState({ prefix: "", suffix: "" });
  
  const toggleCollapse = (index) => {
    setCollapsedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    client: "",
    items: [
      {
        service: "",
        description: "",
        hsnCode: "",
        quantity: 1,
        unitType: "item",
        pricingType: "fixed",
        baseRate: 0,
        pricingTiers: [],
        notes: "",
      },
    ],
    discount: "",
    discountType: "fixed",
    taxes: [],
    notes: "",
    dueDate: "",
    status: "draft",
    bankDetails: null,
    includeLogo: true,
    includeSignature: true,
  });

  useEffect(() => {
    fetchClients();
    fetchServices();
    fetchBankAccounts();
    fetchProfile();

    const today = new Date();
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);

    setFormData((prev) => ({
      ...prev,
      invoiceDate: today.toISOString().split("T")[0],
      dueDate: defaultDueDate.toISOString().split("T")[0],
    }));
  }, []);

  const fetchClients = async () => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(`${BASE_URL}/users/clients`);
      setClients(res.data.clients);
    } catch {
      toast.error("Failed to fetch clients");
    }
  };

  const fetchServices = async () => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(`${BASE_URL}/services`);
      setServices(res.data.services);
    } catch {
      toast.error("Failed to fetch services");
    }
  };

  const fetchBankAccounts = async () => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(`${BASE_URL}/users/bank-accounts`);
      const accounts = res.data.bankAccounts || [];
      setBankAccounts(accounts);
      const primary = accounts.find((a) => a.isPrimary);
      if (primary) {
        setFormData((prev) => ({ ...prev, bankDetails: primary }));
      } else if (accounts.length > 0) {
        setFormData((prev) => ({ ...prev, bankDetails: accounts[0] }));
      }
    } catch {
      toast.error("Failed to fetch bank accounts");
    }
  };

  const fetchProfile = async () => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(`${BASE_URL}/users/profile`);
      if (res.data.invoicePreferences) {
        setInvoicePreferences({
          prefix: res.data.invoicePreferences.prefix || "",
          suffix: res.data.invoicePreferences.suffix || "",
        });
      }
    } catch {
      console.error("Failed to fetch profile");
    }
  };

  const handleBankChange = (e) => {
    const accountId = e.target.value;
    if (!accountId) {
      setFormData((prev) => ({ ...prev, bankDetails: null }));
      return;
    }
    const selected = bankAccounts.find((a) => a._id === accountId);
    setFormData((prev) => ({ ...prev, bankDetails: selected || null }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleServiceChange = (index, serviceId) => {
    if (!serviceId) {
      handleItemChange(index, "customItem", true);
      return;
    }
    const selectedService = services.find((s) => s._id === serviceId);
    if (selectedService) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index
            ? {
                ...item,
                service: serviceId,
                description: selectedService.name,
                hsnCode: selectedService.hsnCode,
                unitType: selectedService.unitType,
                pricingType: selectedService.pricingType,
                baseRate: selectedService.baseRate || 0,
                pricingTiers: selectedService.pricingTiers || [],
              }
            : item
        ),
      }));
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          service: "",
          description: "",
          hsnCode: "",
          quantity: 1,
          unitType: "item",
          pricingType: "fixed",
          baseRate: 0,
          pricingTiers: [],
          notes: "",
        },
      ],
    }));
    // Make sure new item isn't collapsed
    setCollapsedItems((prev) => prev.filter((i) => i !== formData.items.length));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
      // Adjust collapsed items after removal
      setCollapsedItems((prev) => 
        prev.filter((i) => i !== index).map((i) => i > index ? i - 1 : i)
      );
    }
  };

  const addTier = (itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === itemIndex) {
          const lastTier = item.pricingTiers[item.pricingTiers.length - 1];
          const nextMin = lastTier?.maxValue ?? 0;
          return {
            ...item,
            pricingTiers: [
              ...item.pricingTiers,
              {
                minValue: nextMin,
                maxValue: null, // null = Infinity
                rate: 0,
                rateType: "slabRate",
              },
            ],
          };
        }
        return item;
      }),
    }));
  };

  const deleteTier = (itemIndex, tierIndex) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              pricingTiers: item.pricingTiers.filter((_, t) => t !== tierIndex),
            }
          : item
      ),
    }));
  };

  const handleTierChange = (itemIndex, tierIndex, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      const tiers = [...items[itemIndex].pricingTiers];
      const currentTier = { ...tiers[tierIndex], error: "" };

      if (field === "minValue") {
        if (tierIndex === 0) {
          currentTier.minValue = Math.max(value, 0);
        } else {
          const prevTier = tiers[tierIndex - 1];
          const minAllowed = prevTier?.maxValue ?? 0;
          currentTier.minValue = Math.max(value, minAllowed);
        }

        if (
          currentTier.maxValue !== null &&
          currentTier.maxValue < currentTier.minValue
        ) {
          currentTier.error = "Max should be greater";
        }
      } else if (field === "maxValue") {
        if (value === "" || value === null) {
          currentTier.maxValue = null;
        } else {
          currentTier.maxValue = Number(value);
          if (currentTier.maxValue < currentTier.minValue) {
            currentTier.error = "Max should be greater";
          }
        }
      } else {
        currentTier[field] = value;
      }

      tiers[tierIndex] = currentTier;
      items[itemIndex].pricingTiers = tiers;
      return { ...prev, items };
    });
  };

  const handleTaxChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedTaxes = [...prev.taxes];
      updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
      return { ...prev, taxes: updatedTaxes };
    });
  };

  const addTax = () => {
    setFormData((prev) => ({
      ...prev,
      taxes: [...prev.taxes, { name: "", rate: 0, amount: 0 }],
    }));
  };

  const removeTax = (index) => {
    setFormData((prev) => {
      const updatedTaxes = [...prev.taxes];
      updatedTaxes.splice(index, 1);
      return { ...prev, taxes: updatedTaxes };
    });
  };

  const calcTieredAmount = (item) => {
    const qty = Number(item.quantity) || 0;
    if (!item.pricingTiers?.length || qty <= 0) return 0;

    const tiers = [...item.pricingTiers]
      .map((t) => ({
        ...t,
        minValue: Number(t.minValue ?? 0),
        maxValue:
          t.maxValue === "" || t.maxValue == null ? Infinity : Number(t.maxValue),
        rate: Number(t.rate ?? 0),
        rateType: t.rateType || "slabRate",
      }))
      .sort((a, b) => a.minValue - b.minValue);

    let total = 0;
    let lastCoveredMax = 0;

    for (const tier of tiers) {
      if (qty < tier.minValue) continue;

      if (tier.rateType === "slabRate") {
        if (qty <= tier.maxValue) {
          return tier.rate; // pure slab uses total as the rate
        } else {
          total = tier.rate;
          lastCoveredMax = tier.maxValue;
        }
      } else {
        const start = Math.max(tier.minValue, lastCoveredMax);
        const end = Math.min(qty, tier.maxValue);
        const applicableQty = Math.max(0, end - start);
        total += applicableQty * tier.rate;

        if (qty <= tier.maxValue) return total;
      }
    }

    return total;
  };

  const calculateTotals = (items, discount = 0, discountType = "fixed", taxes = []) => {
    let subtotal = 0;

    const updatedItems = items.map((item) => {
      let baseAmount = 0;
      if (item.pricingType === "flat") {
        baseAmount = item.baseRate || 0;
      } else if (item.pricingType === "tiered" && item.pricingTiers?.length > 0) {
        baseAmount = calcTieredAmount(item);
      } else {
        baseAmount = (item.quantity || 0) * (item.baseRate || 0);
      }
      subtotal += baseAmount;
      return { ...item, subtotal: baseAmount };
    });

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);

    let totalTax = 0;
    const updatedTaxes = (taxes || []).map((tax) => {
      const rate = Number(tax.rate || 0);
      const amount = (afterDiscount * rate) / 100;
      totalTax += amount;
      return { ...tax, amount };
    });

    const totalAmount = afterDiscount + totalTax;

    return { updatedItems, subtotal, discount, discountType, discountAmount, taxes: updatedTaxes, totalTax, totalAmount };
  };

  useEffect(() => {
    const { updatedItems, ...newTotals } = calculateTotals(
      formData.items,
      Number(formData.discount || 0),
      formData.discountType,
      formData.taxes
    );
    setItemTotals(updatedItems);
    setTotals(newTotals);
  }, [formData.items, formData.discount, formData.discountType, formData.taxes]);

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!formData.client || formData.client === "") {
      errors.client = "Client is required";
      isValid = false;
    }
    if (!formData.invoiceNumber?.trim()) {
      errors.invoiceNumber = "Invoice Number is required";
      isValid = false;
    }
    if (!formData.invoiceDate) {
      errors.invoiceDate = "Invoice Date is required";
      isValid = false;
    }
    if (!formData.dueDate) {
      errors.dueDate = "Due Date is required";
      isValid = false;
    }

    if (!formData.items.length) {
      toast.error("Please add at least one item");
      isValid = false;
    } else {
      formData.items.forEach((item, index) => {
        if (!item.description?.trim()) {
          errors[`item_${index}_description`] = "Description is required";
          isValid = false;
        }
        if (!item.quantity || item.quantity < 0) {
          errors[`item_${index}_quantity`] = "Quantity is required";
          isValid = false;
        }
        if (item.pricingType !== "tiered" && (item.baseRate === null || item.baseRate < 0 || item.baseRate === "")) {
          errors[`item_${index}_baseRate`] = "Base Rate is required";
          isValid = false;
        }
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const cleanPayload = (payload) => {
    return {
      ...payload,
      invoiceNumber: `${invoicePreferences.prefix}${payload.invoiceNumber}${invoicePreferences.suffix}`,
      items: payload.items.map((item) => {
        const cleanedItem = { ...item };
        if (!cleanedItem.service) delete cleanedItem.service;
        return cleanedItem;
      }),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    setLoading(true);

    try {
      const payload = cleanPayload(formData);
      await axios.post(`${BASE_URL}/invoices/create-invoice`, payload);
      toast.success("Invoice created successfully!");
      navigate("/invoices");
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };


  /* ── Apple-Style Tokens ── */
  const cardStyle = {
    background: "var(--surface, #FFFFFF)",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)",
    padding: "24px",
    border: "1px solid var(--border-light, #F0F0F2)",
  };

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
    padding: "12px 24px",
    borderRadius: "12px",
    background: "var(--accent, #0071E3)",
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
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px 80px 24px" }}>
      {/* Header */}
      <div className="flex items-center" style={{ marginBottom: "32px" }}>
        <button
          onClick={() => navigate("/invoices")}
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E5E5E7)",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "16px",
            color: "var(--text-secondary, #6E6E73)",
            cursor: "pointer",
            transition: "all 150ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary, #1D1D1F)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary, #6E6E73)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary, #1D1D1F)", letterSpacing: "-0.03em" }}>
            Create Invoice
          </h1>
          <p style={{ color: "var(--text-secondary, #6E6E73)", fontSize: "15px", marginTop: "4px" }}>
            Fill in the details to generate a new invoice
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Invoice Details Card */}
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <label style={labelStyle}>
                Invoice Number <span style={{ color: "red" }}>*</span>
              </label>
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  ...inputStyle, 
                  padding: 0, 
                  overflow: "hidden", 
                  borderColor: validationErrors.invoiceNumber ? "#DC2626" : "var(--border, #E5E5E7)" 
                }}
                {...errorFocusProps(validationErrors.invoiceNumber)}
              >
                {invoicePreferences.prefix && (
                  <span style={{ padding: "12px 16px", background: "var(--surface-secondary, #FBFBFD)", borderRight: "1px solid var(--border, #E5E5E7)", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>
                    {invoicePreferences.prefix}
                  </span>
                )}
                <input
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    color: "var(--text-primary, #1D1D1F)",
                    outline: "none",
                  }}
                />
                {invoicePreferences.suffix && (
                  <span style={{ padding: "12px 16px", background: "var(--surface-secondary, #FBFBFD)", borderLeft: "1px solid var(--border, #E5E5E7)", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>
                    {invoicePreferences.suffix}
                  </span>
                )}
              </div>
              {validationErrors.invoiceNumber && (
                <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{validationErrors.invoiceNumber}</p>
              )}
            </div>
            
            <div>
              <label style={labelStyle}>
                Invoice Date <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.invoiceDate ? "#DC2626" : "var(--border, #E5E5E7)",
                }}
                {...errorFocusProps(validationErrors.invoiceDate)}
              />
              {validationErrors.invoiceDate && (
                <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{validationErrors.invoiceDate}</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>
                Due Date <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.dueDate ? "#DC2626" : "var(--border, #E5E5E7)",
                }}
                {...errorFocusProps(validationErrors.dueDate)}
              />
              {validationErrors.dueDate && (
                <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{validationErrors.dueDate}</p>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Client <span style={{ color: "red" }}>*</span>
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.client ? "#DC2626" : "var(--border, #E5E5E7)",
                }}
                {...errorFocusProps(validationErrors.client)}
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              {validationErrors.client && (
                <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "6px" }}>{validationErrors.client}</p>
              )}
            </div>
            
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Bank Account
              </label>
              {bankAccounts.length > 0 ? (
                <select
                  name="bankAccount"
                  value={formData.bankDetails?._id || ""}
                  onChange={handleBankChange}
                  style={inputStyle}
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bankName} - **** {b.accountNumber?.slice(-4)} {b.isPrimary ? "(Primary)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", color: "#6E6E73" }}>No bank accounts found.</span>
                  <button type="button" onClick={() => navigate("/profile")} style={{ padding: "6px 12px", borderRadius: "8px", background: "#F5F5F7", border: "none", color: "#0071E3", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    Add Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em", marginTop: "8px" }}>
            Invoice Items
          </h2>
          
          {formData.items.map((item, index) => {
            const isCollapsed = collapsedItems.includes(index);
            return (
              <div key={index} style={{
                ...cardStyle, 
                padding: "0",
                border: "1px solid var(--border-light, #F0F0F2)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                transition: "all 200ms ease"
              }}>
                {/* Header Toggle */}
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCollapse(index)}
                  style={{ 
                    padding: "16px 20px",
                    background: isCollapsed ? "transparent" : "var(--bg-page, #F7F7F8)",
                    borderBottom: isCollapsed ? "none" : "1px solid var(--border-light, #F0F0F2)",
                    borderRadius: isCollapsed ? "20px" : "20px 20px 0 0",
                    transition: "all 200ms ease"
                  }}
                >
                  <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-tertiary, #86868B)", minWidth: "20px" }}>
                      {index + 1}.
                    </span>
                    <span style={{ 
                      fontSize: "15px", 
                      fontWeight: 600, 
                      color: "var(--text-primary, #1D1D1F)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {item.description || <span style={{ color: "var(--text-tertiary, #86868B)", fontStyle: "italic" }}>New Item</span>}
                    </span>
                    {isCollapsed && item.quantity > 0 && (
                      <span style={{ fontSize: "13px", color: "var(--text-secondary, #6E6E73)", whiteSpace: "nowrap" }}>
                        × {item.quantity} {item.unitType !== "item" ? item.unitType : ""}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      Rs. {(Itemtotals[index]?.subtotal || 0).toFixed(2)}
                    </span>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", background: "var(--surface, #FFFFFF)",
                      border: "1px solid var(--border, #E5E5E7)", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "transform 200ms ease"
                    }}>
                      {isCollapsed ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronUp className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                {!isCollapsed && (
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--surface, #FFFFFF)", borderRadius: "0 0 20px 20px" }}>
                    
                    {/* Row 1: Service Type, Description, Action */}
                    <div className="flex flex-col md:flex-row items-end gap-3 w-full">
                      {/* Service Template */}
                      <div style={{ flex: "0 0 160px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Service</label>
                        <select
                          value={item.service || ""}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                          style={{ ...inputStyle, marginTop: 0, padding: "10px 14px", height: "42px" }}
                          {...focusProps}
                        >
                          <option value="">Custom (Manual)</option>
                          {services.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Description Field */}
                      <div style={{ flex: "1 1 auto", minWidth: "0" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item Description <span style={{ color: "#DC2626" }}>*</span></label>
                        <input
                          placeholder="e.g. Website Design, Server Hosting..."
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 14px",
                            height: "42px",
                            borderColor: validationErrors[`item_${index}_description`] ? "#DC2626" : "var(--border, #E5E5E7)",
                          }}
                          {...errorFocusProps(validationErrors[`item_${index}_description`])}
                        />
                      </div>

                      {/* Remove Button (Desktop) */}
                      <div className="hidden md:flex items-center pb-[2px]">
                        {formData.items.length > 1 ? (
                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => removeItem(index)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center", height: "38px", width: "38px", color: "#DC2626", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px", transition: "all 150ms ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        ) : (
                          <div style={{ width: "38px" }}></div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Inline Controls Row */}
                    <div className="flex flex-wrap items-end gap-3 w-full">
                      {/* Qty */}
                      <div style={{ flex: "1 1 80px", minWidth: "80px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qty <span style={{ color: "#DC2626" }}>*</span></label>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", +e.target.value)}
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 14px",
                            height: "42px",
                            borderColor: validationErrors[`item_${index}_quantity`] ? "#DC2626" : "var(--border, #E5E5E7)",
                          }}
                          {...errorFocusProps(validationErrors[`item_${index}_quantity`])}
                        />
                      </div>

                      {/* Unit */}
                      <div style={{ flex: "1 1 100px", minWidth: "100px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unit</label>
                        <select
                          value={item.unitType}
                          onChange={(e) => handleItemChange(index, "unitType", e.target.value)}
                          style={{ ...inputStyle, marginTop: 0, padding: "10px 14px", height: "42px" }}
                          {...focusProps}
                        >
                          {unitTypes.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>

                      {/* Pricing Type */}
                      <div style={{ flex: "1 1 120px", minWidth: "120px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pricing Type</label>
                        <select
                          value={item.pricingType}
                          onChange={(e) => handleItemChange(index, "pricingType", e.target.value)}
                          style={{ ...inputStyle, marginTop: 0, padding: "10px 14px", height: "42px" }}
                          {...focusProps}
                        >
                          {pricingTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>

                      {/* HSN Code (Opt) */}
                      <div style={{ flex: "1 1 100px", minWidth: "100px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>HSN/SAC <span style={{ fontWeight: 400, textTransform: "none" }}>(opt)</span></label>
                        <input
                          placeholder="-"
                          value={item.hsnCode || ""}
                          onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                          style={{ ...inputStyle, marginTop: 0, padding: "10px 14px", height: "42px" }}
                          {...focusProps}
                        />
                      </div>

                      {/* Base Rate */}
                      {item.pricingType !== "tiered" ? (
                        <div style={{ flex: "1 1 110px", minWidth: "110px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rate (Rs. ) <span style={{ color: "#DC2626" }}>*</span></label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.baseRate}
                            onChange={(e) => handleItemChange(index, "baseRate", +e.target.value)}
                            style={{
                              ...inputStyle,
                              marginTop: 0,
                              padding: "10px 14px",
                              height: "42px",
                              textAlign: "right",
                              borderColor: validationErrors[`item_${index}_baseRate`] ? "#DC2626" : "var(--border, #E5E5E7)",
                            }}
                            {...errorFocusProps(validationErrors[`item_${index}_baseRate`])}
                          />
                        </div>
                      ) : (
                        <div style={{ flex: "1 1 110px", minWidth: "110px", textAlign: "right", color: "var(--text-secondary)", fontSize: "14px", alignSelf: "center", paddingBottom: "10px" }}>
                          Tiered
                        </div>
                      )}

                      {/* Item Total Display */}
                      <div style={{ flex: "1 1 120px", minWidth: "120px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #6E6E73)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item Total</label>
                        <div style={{ 
                          height: "42px", 
                          display: "flex", 
                          alignItems: "center", 
                          padding: "0 14px", 
                          background: "var(--bg-page, #F7F7F8)", 
                          borderRadius: "12px", 
                          border: "1px solid transparent",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontVariantNumeric: "tabular-nums",
                          width: "100%",
                          justifyContent: "flex-end"
                        }}>
                          Rs. {(Itemtotals[index]?.subtotal || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Remove Button Row */}
                    {formData.items.length > 1 && (
                      <div className="flex md:hidden justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          style={{
                            display: "flex", alignItems: "center", gap: "6px", color: "#DC2626", background: "transparent", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, padding: "6px 10px", borderRadius: "8px", transition: "all 150ms ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Trash2 className="h-4 w-4" /> <span>Remove Item</span>
                        </button>
                      </div>
                    )}

                    {/* Validation errors for inline row */}
                    {(validationErrors[`item_${index}_description`] || validationErrors[`item_${index}_quantity`] || validationErrors[`item_${index}_baseRate`]) && (
                      <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "-4px", paddingLeft: "4px" }}>
                        Please ensure description, valid quantity, and rate are provided.
                      </div>
                    )}

                    {/* Tiered Pricing Config inside Item */}
                    {item.pricingType === "tiered" && (
                      <div style={{ marginTop: "8px", padding: "16px", background: "var(--bg-page, #F7F7F8)", borderRadius: "12px", border: "1px solid var(--border-light, #F0F0F2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Tiered Rates</h4>
                          <button
                            type="button"
                            onClick={() => addTier(index)}
                            style={{ ...btnSecondary, padding: "4px 10px", fontSize: "12px", borderRadius: "8px" }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Tier
                          </button>
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {item.pricingTiers.map((tier, tIndex) => (
                            <div key={tIndex} className="flex flex-wrap sm:flex-nowrap gap-2 items-center" style={{ background: "#fff", padding: "8px", borderRadius: "8px", border: "1px solid var(--border, #E5E5E7)" }}>
                              <div style={{ flex: 1, minWidth: "70px" }}>
                                <input type="number" placeholder="Min Qty" value={tier.minValue} onChange={(e) => handleTierChange(index, tIndex, "minValue", +e.target.value)} style={{ ...inputStyle, marginTop: 0, padding: "6px 10px", fontSize: "12px" }} {...focusProps} />
                              </div>
                              <span style={{ color: "var(--text-tertiary)" }}>-</span>
                              <div style={{ flex: 1, minWidth: "70px" }}>
                                <input type="number" value={tier.maxValue ?? ""} onChange={(e) => handleTierChange(index, tIndex, "maxValue", e.target.value)} placeholder="Max (∞)" style={{ ...inputStyle, marginTop: 0, padding: "6px 10px", fontSize: "12px" }} {...focusProps} />
                              </div>
                              <div style={{ flex: 1, minWidth: "80px" }}>
                                <input type="number" placeholder="Rate Rs. " value={tier.rate} onChange={(e) => handleTierChange(index, tIndex, "rate", +e.target.value)} style={{ ...inputStyle, marginTop: 0, padding: "6px 10px", fontSize: "12px" }} {...focusProps} />
                              </div>
                              <div style={{ flex: 1, minWidth: "90px" }}>
                                <select value={tier.rateType || "slabRate"} onChange={(e) => handleTierChange(index, tIndex, "rateType", e.target.value)} style={{ ...inputStyle, marginTop: 0, padding: "6px 10px", fontSize: "12px" }} {...focusProps}>
                                  <option value="slabRate">Slab Rate</option>
                                  <option value="unitRate">Unit Rate</option>
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteTier(index, tIndex)}
                                style={{
                                  background: "#FEF2F2", border: "none", color: "#DC2626", borderRadius: "6px", cursor: "pointer", height: "30px", width: "30px", display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addItem}
            style={{ ...btnSecondary, padding: "14px", width: "100%", borderStyle: "dashed", borderColor: "var(--border, #E5E5E7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover, #F0F0F2)"; e.currentTarget.style.borderColor = "var(--accent, #0071E3)"; color: "var(--accent, #0071E3)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-secondary, #FBFBFD)"; e.currentTarget.style.borderColor = "var(--border, #E5E5E7)"; color: "var(--text-primary)" }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Another Item
          </button>
        </div>

        {/* Global Configuration & Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }} className="max-md:grid-cols-1">
          
          <div style={{ ...cardStyle, flex: 1 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Discounts & Taxes</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Global Discount</label>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{ ...inputStyle, marginTop: 0, flex: 2 }}
                  {...focusProps}
                />
                <select
                  name="discountType"
                  value={formData.discountType || "fixed"}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                  {...focusProps}
                >
                  <option value="fixed">Fixed (Rs. )</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={labelStyle}>Taxes Applied</label>
                <button
                  type="button"
                  onClick={addTax}
                  style={{ background: "transparent", border: "none", color: "var(--accent, #0071E3)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  + Add Tax
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {formData.taxes?.map((tax, index) => (
                  <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Tax Name (e.g. CGST)"
                      value={tax.name}
                      onChange={(e) => handleTaxChange(index, "name", e.target.value)}
                      style={{ ...inputStyle, marginTop: 0, flex: 2 }}
                      {...focusProps}
                    />
                    <div style={{ display: "flex", alignItems: "center", position: "relative", flex: 1 }}>
                      <input
                        type="number"
                        placeholder="0"
                        value={tax.rate}
                        onChange={(e) => handleTaxChange(index, "rate", +e.target.value)}
                        style={{ ...inputStyle, marginTop: 0, paddingRight: "28px" }}
                        {...focusProps}
                      />
                      <span style={{ position: "absolute", right: "12px", color: "var(--text-tertiary)" }}>%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTax(index)}
                      style={{ background: "transparent", border: "none", color: "#DC2626", padding: "8px", cursor: "pointer" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <label style={labelStyle}>Additional Notes / Terms</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Payment terms, bank details, or thank you note..."
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                {...focusProps}
              />
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Display Preferences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", userSelect: "none" }}>
                <div style={{
                  position: "relative",
                  width: "44px",
                  height: "24px",
                  background: formData.includeLogo ? "var(--accent, #34C759)" : "var(--border, #E5E5E7)",
                  borderRadius: "12px",
                  transition: "background 0.3s ease",
                }}>
                  <div style={{
                    position: "absolute",
                    top: "2px",
                    left: formData.includeLogo ? "22px" : "2px",
                    width: "20px",
                    height: "20px",
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.3s cubic-bezier(0.2, 0.85, 0.32, 1.2)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }} />
                </div>
                <input
                  type="checkbox"
                  name="includeLogo"
                  checked={formData.includeLogo}
                  onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>Include Logo</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", userSelect: "none" }}>
                <div style={{
                  position: "relative",
                  width: "44px",
                  height: "24px",
                  background: formData.includeSignature ? "var(--accent, #34C759)" : "var(--border, #E5E5E7)",
                  borderRadius: "12px",
                  transition: "background 0.3s ease",
                }}>
                  <div style={{
                    position: "absolute",
                    top: "2px",
                    left: formData.includeSignature ? "22px" : "2px",
                    width: "20px",
                    height: "20px",
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.3s cubic-bezier(0.2, 0.85, 0.32, 1.2)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }} />
                </div>
                <input
                  type="checkbox"
                  name="includeSignature"
                  checked={formData.includeSignature}
                  onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>Include Signature</span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <div style={{ ...cardStyle, background: "var(--surface-secondary, #FBFBFD)", border: "none", minWidth: "300px", width: "100%", maxWidth: "500px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Summary</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Subtotal</span>
                <span>Rs. {(totals?.subtotal ?? 0).toFixed(2)}</span>
              </div>
              
              {(totals?.discountAmount > 0) && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                  <span>Discount</span>
                  <span>- Rs. {(totals?.discountAmount ?? 0).toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ borderTop: "1px solid var(--border, #E5E5E7)", padding: "8px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                {totals?.taxes?.map((tax, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                    <span>{tax.name || 'Tax'} ({tax.rate}%)</span>
                    <span>+ Rs. {(tax.amount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border, #E5E5E7)", paddingTop: "20px", marginTop: "4px" }}>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>Total Amount</span>
                <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Rs. {(totals?.totalAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...btnPrimary, width: "100%", marginTop: "32px", padding: "16px", fontSize: "16px" }}
              onMouseEnter={(e) => {
                if(!loading) {
                  e.currentTarget.style.background = "var(--accent-hover, #0077ED)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 113, 227, 0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if(!loading) {
                  e.currentTarget.style.background = "var(--accent, #0071E3)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 113, 227, 0.3)";
                }
              }}
            >
              {loading ? "Generating Invoice..." : "Create Invoice"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default CreateInvoice;
