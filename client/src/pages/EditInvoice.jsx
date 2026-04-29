import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  X,
  Copy,
  GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ItemLabel from "../components/ItemLabel";

axios.defaults.withCredentials = true;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DEFAULT_UNITS = [
  "km",
  "hour",
  "day",
  "month",
  "item",
  "kg",
  "piece",
  "service",
  "ton",
  "shift",
];
const pricingTypes = ["fixed", "flat", "tiered"];

const generateId = () => Math.random().toString(36).substring(2, 9);

const SortableItemWrapper = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(attributes, listeners)}
    </div>
  );
};

const EditInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [Itemtotals, setItemTotals] = useState([]);
  const [totals, setTotals] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [collapsedItems, setCollapsedItems] = useState([]);
  const [invoicePreferences, setInvoicePreferences] = useState({
    prefix: "",
    suffix: "",
    addressBehavior: "billing_and_shipping",
  });
  const [customUnits, setCustomUnits] = useState([]);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [addUnitForIndex, setAddUnitForIndex] = useState(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitShortCode, setNewUnitShortCode] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);
  const [isShippingDifferent, setIsShippingDifferent] = useState(false);
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleCollapse = (id) => {
    setCollapsedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    client: "",
    shippingAddress: "",
    items: [],
    discount: "",
    discountType: "fixed",
    taxes: [],
    notes: "",
    dueDate: "",
    status: "draft",
    bankDetails: null,
    includeLogo: true,
    includeSignature: true,
    customFields: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const clientsData = await fetchClients();
        await fetchServices();
        await fetchBankAccounts();
        await fetchCustomUnits();
        const prefs = await fetchProfile();
        await fetchInvoice(prefs, clientsData);
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/clients`);
      setClients(res.data.clients);
      return res.data.clients;
    } catch {
      toast.error("Failed to fetch clients");
      return [];
    }
  };

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/services`);
      setServices(res.data.services);
    } catch {
      toast.error("Failed to fetch services");
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/bank-accounts`);
      setBankAccounts(res.data.bankAccounts || []);
    } catch {
      toast.error("Failed to fetch bank accounts");
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

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/profile`);
      if (res.data.invoicePreferences) {
        const prefs = {
          prefix: res.data.invoicePreferences.prefix || "",
          suffix: res.data.invoicePreferences.suffix || "",
          addressBehavior:
            res.data.invoicePreferences.addressBehavior ||
            "billing_and_shipping",
        };
        setInvoicePreferences(prefs);
        return prefs;
      }
      if (res.data.allowedTemplates) {
        setAllowedTemplates(res.data.allowedTemplates);
      }
    } catch {
      console.error("Failed to fetch profile");
    }
    return { prefix: "", suffix: "", addressBehavior: "billing_and_shipping" };
  };

  const fetchCustomUnits = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/custom-units`);
      setCustomUnits(res.data.customUnits || []);
    } catch {
      console.error("Failed to fetch custom units");
    }
  };

  const handleUnitChange = (index, value) => {
    if (value === "__add_custom__") {
      setAddUnitForIndex(index);
      setNewUnitName("");
      setNewUnitShortCode("");
      setShowAddUnitModal(true);
    } else {
      handleItemChange(index, "unitType", value);
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
      if (addUnitForIndex !== null) {
        handleItemChange(addUnitForIndex, "unitType", trimmed);
      }
      setShowAddUnitModal(false);
      toast.success("Custom unit added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add custom unit");
    } finally {
      setAddingUnit(false);
    }
  };

  const fetchInvoice = async (prefs, clientsData) => {
    try {
      const res = await axios.get(`${BASE_URL}/invoices/${id}`);
      const invoice = res.data;

      let editableInvoiceNumber = invoice.invoiceNumber || "";
      const currentPrefix = prefs?.prefix || invoicePreferences.prefix;
      const currentSuffix = prefs?.suffix || invoicePreferences.suffix;
      const currentAddressBehavior = prefs?.addressBehavior || invoicePreferences.addressBehavior;

      if (currentPrefix && editableInvoiceNumber.startsWith(currentPrefix)) {
        editableInvoiceNumber = editableInvoiceNumber.slice(currentPrefix.length);
      }
      if (currentSuffix && editableInvoiceNumber.endsWith(currentSuffix)) {
        editableInvoiceNumber = editableInvoiceNumber.slice(0, -currentSuffix.length);
      }

      let shippingAddress = invoice.shippingAddress || "";
      if (!shippingAddress && currentAddressBehavior === "always_both" && invoice.client) {
        const clientList = clientsData || clients;
        const selectedClient = clientList.find((c) => c._id === (invoice.client._id || invoice.client));
        if (selectedClient) {
          const addr = selectedClient.address;
          shippingAddress = [
            addr.street,
            addr.city,
            addr.state,
            addr.zipCode,
            addr.country,
          ]
            .filter(Boolean)
            .join(", ");
        }
      }

      let bankAccountsList = bankAccounts;
      if (bankAccountsList.length === 0) {
        try {
          const bankRes = await axios.get(`${BASE_URL}/users/bank-accounts`);
          bankAccountsList = bankRes.data.bankAccounts || [];
          setBankAccounts(bankAccountsList);
        } catch (err) {
          console.error("Failed to fetch bank accounts:", err);
        }
      }

      let matchedBankDetails = invoice.bankDetails || null;
      if (matchedBankDetails && bankAccountsList.length > 0) {
        if (matchedBankDetails._id) {
          const found = bankAccountsList.find(b => b._id === matchedBankDetails._id);
          if (found) matchedBankDetails = found;
        }
        else if (matchedBankDetails.accountNumber) {
          const found = bankAccountsList.find(b =>
            b.accountNumber === matchedBankDetails.accountNumber ||
            b.accountNumber?.slice(-4) === matchedBankDetails.accountNumber?.slice(-4)
          );
          if (found) matchedBankDetails = found;
        }
        else if (!matchedBankDetails._id) {
          matchedBankDetails = { ...matchedBankDetails, _id: null };
        }
      }

      setFormData({
        invoiceNumber: editableInvoiceNumber,
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split("T")[0] : "",
        client: invoice.client?._id || invoice.client || "",
        shippingAddress: shippingAddress,
        items: (invoice.items || []).map((item) => ({ ...item, id: item.id || generateId() })),
        discount: invoice.discount || "",
        discountType: invoice.discountType || "fixed",
        taxes: invoice.taxes || [],
        notes: invoice.notes || "",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
        status: invoice.status || "draft",
        bankDetails: matchedBankDetails,
        includeLogo: invoice.includeLogo !== false,
        includeSignature: invoice.includeSignature !== false,
        customFields: invoice.customFields || [],
      });

      if (shippingAddress.trim()) {
        setIsShippingDifferent(true);
      }
    } catch (error) {
      toast.error("Failed to fetch invoice details");
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "client") {
      const selectedClient = clients.find((c) => c._id === value);
      if (
        selectedClient &&
        invoicePreferences.addressBehavior === "always_both" &&
        !formData.shippingAddress
      ) {
        const addr = selectedClient.address;
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.state,
          addr.zipCode,
          addr.country,
        ]
          .filter(Boolean)
          .join(", ");
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          shippingAddress: formattedAddress,
        }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
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
                description:
                  selectedService.description || selectedService.name,
                hsnCode: selectedService.hsnCode,
                unitType: selectedService.unitType,
                pricingType: selectedService.pricingType,
                baseRate: selectedService.baseRate || 0,
                pricingTiers: selectedService.pricingTiers || [],
              }
            : item,
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
          id: generateId(),
          service: "",
          description: "",
          quantity: 1,
          unitType: "item",
          pricingType: "fixed",
          baseRate: 0,
          pricingTiers: [],
          notes: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const duplicateItem = (index) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const duplicatedItem = JSON.parse(JSON.stringify(newItems[index]));
      duplicatedItem.id = generateId();
      newItems.splice(index + 1, 0, duplicatedItem);
      return { ...prev, items: newItems };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.items.findIndex((item) => item.id === active.id);
        const newIndex = prev.items.findIndex((item) => item.id === over.id);
        
        return {
          ...prev,
          items: arrayMove(prev.items, oldIndex, newIndex),
        };
      });
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
                maxValue: null,
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
          : item,
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
          t.maxValue === "" || t.maxValue == null
            ? Infinity
            : Number(t.maxValue),
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
          return tier.rate;
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

  const calculateTotals = (
    items,
    discount = 0,
    discountType = "fixed",
    taxes = [],
  ) => {
    let subtotal = 0;

    const updatedItems = items.map((item) => {
      let baseAmount = 0;
      if (item.pricingType === "flat") {
        baseAmount = item.baseRate || 0;
      } else if (
        item.pricingType === "tiered" &&
        item.pricingTiers?.length > 0
      ) {
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

    return {
      updatedItems,
      subtotal,
      discount,
      discountType,
      discountAmount,
      taxes: updatedTaxes,
      totalTax,
      totalAmount,
    };
  };

  useEffect(() => {
    const { updatedItems, ...newTotals } = calculateTotals(
      formData.items,
      Number(formData.discount || 0),
      formData.discountType,
      formData.taxes,
    );
    setItemTotals(updatedItems);
    setTotals(newTotals);
  }, [
    formData.items,
    formData.discount,
    formData.discountType,
    formData.taxes,
  ]);

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
        if (
          item.pricingType !== "tiered" &&
          (item.baseRate === null || item.baseRate < 0 || item.baseRate === "")
        ) {
          errors[`item_${index}_baseRate`] = "Base Rate is required";
          isValid = false;
        }
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const cleanPayload = (payload) => {
    let finalShippingAddress = payload.shippingAddress;
    if (
      invoicePreferences.addressBehavior === "billing_only" ||
      (invoicePreferences.addressBehavior === "billing_and_shipping" &&
        !isShippingDifferent)
    ) {
      finalShippingAddress = "";
    }

    return {
      ...payload,
      shippingAddress: finalShippingAddress,
      invoiceNumber: `${invoicePreferences.prefix}${payload.invoiceNumber}${invoicePreferences.suffix}`,
      items: payload.items.map((item) => {
        const cleanedItem = { ...item };
        delete cleanedItem.id;
        if (!cleanedItem.service) delete cleanedItem.service;
        return cleanedItem;
      }),
      customFields: (payload.customFields || []).filter(f => f.label?.trim() && f.value?.trim()),
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
      await axios.patch(`${BASE_URL}/invoices/update-invoice/${id}`, payload);
      toast.success("Invoice updated successfully!");
      navigate("/invoices");
    } catch (error) {
      toast.error("Failed to update invoice");
    } finally {
      setLoading(false);
    }
  };

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
    },
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
      e.currentTarget.style.borderColor = hasError
        ? "#DC2626"
        : "var(--border, #E5E5E7)";
      e.currentTarget.style.boxShadow = "none";
    },
  });

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
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px 16px 60px 16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
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
            color: "var(--text-secondary, #6E6E73)",
            cursor: "pointer",
            transition: "all 150ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            flexShrink: 0,
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
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 28px)",
              fontWeight: 700,
              color: "var(--text-primary, #1D1D1F)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Edit Invoice
          </h1>
          <p
            style={{
              color: "var(--text-secondary, #6E6E73)",
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
            Update the details of this invoice
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {/* Invoice Details Card */}
        <div style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
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
                  borderColor: validationErrors.invoiceNumber
                    ? "#DC2626"
                    : "var(--border, #E5E5E7)",
                }}
                {...errorFocusProps(validationErrors.invoiceNumber)}
              >
                {invoicePreferences.prefix && (
                  <span
                    style={{
                      padding: "12px 12px",
                      background: "var(--surface-secondary, #FBFBFD)",
                      borderRight: "1px solid var(--border, #E5E5E7)",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {invoicePreferences.prefix}
                  </span>
                )}
                <input
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    padding: "12px 12px",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    color: "var(--text-primary, #1D1D1F)",
                    outline: "none",
                  }}
                />
                {invoicePreferences.suffix && (
                  <span
                    style={{
                      padding: "12px 12px",
                      background: "var(--surface-secondary, #FBFBFD)",
                      borderLeft: "1px solid var(--border, #E5E5E7)",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {invoicePreferences.suffix}
                  </span>
                )}
              </div>
              {validationErrors.invoiceNumber && (
                <p
                  style={{
                    color: "#DC2626",
                    fontSize: "12px",
                    marginTop: "6px",
                  }}
                >
                  {validationErrors.invoiceNumber}
                </p>
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
                  borderColor: validationErrors.invoiceDate
                    ? "#DC2626"
                    : "var(--border, #E5E5E7)",
                }}
                {...errorFocusProps(validationErrors.invoiceDate)}
              />
              {validationErrors.invoiceDate && (
                <p
                  style={{
                    color: "#DC2626",
                    fontSize: "12px",
                    marginTop: "6px",
                  }}
                >
                  {validationErrors.invoiceDate}
                </p>
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
                  borderColor: validationErrors.dueDate
                    ? "#DC2626"
                    : "var(--border, #E5E5E7)",
                }}
                {...errorFocusProps(validationErrors.dueDate)}
              />
              {validationErrors.dueDate && (
                <p
                  style={{
                    color: "#DC2626",
                    fontSize: "12px",
                    marginTop: "6px",
                  }}
                >
                  {validationErrors.dueDate}
                </p>
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
                  borderColor: validationErrors.client
                    ? "#DC2626"
                    : "var(--border, #E5E5E7)",
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
                <p
                  style={{
                    color: "#DC2626",
                    fontSize: "12px",
                    marginTop: "6px",
                  }}
                >
                  {validationErrors.client}
                </p>
              )}
            </div>

            {invoicePreferences.addressBehavior !== "billing_only" && (
              <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                {invoicePreferences.addressBehavior ===
                  "billing_and_shipping" && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      marginBottom: "12px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isShippingDifferent}
                      onChange={(e) => setIsShippingDifferent(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "10px",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--text-primary, #1D1D1F)",
                      }}
                    >
                      Shipping address is different
                    </span>
                  </label>
                )}

                {(invoicePreferences.addressBehavior === "always_both" ||
                  isShippingDifferent) && (
                  <div>
                    <label style={labelStyle}>
                      Shipping Address (Optional)
                    </label>
                    <textarea
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      style={{
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                      placeholder="Enter separate shipping address (if different from client address)..."
                      {...focusProps}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Bank Account</label>
              {bankAccounts.length > 0 ? (
                <select
                  name="bankAccount"
                  value={formData.bankDetails?._id || ""}
                  onChange={handleBankChange}
                  style={inputStyle}
                  {...focusProps}
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bankName} - **** {b.accountNumber?.slice(-4)}{" "}
                      {b.isPrimary ? "(Primary)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#6E6E73" }}>
                    No bank accounts found.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      background: "#F5F5F7",
                      border: "none",
                      color: "#0071E3",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Add Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2
            style={{
              fontSize: "clamp(18px, 4vw, 20px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginTop: "4px",
            }}
          >
            Invoice Items
          </h2>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={formData.items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {formData.items.map((item, index) => {
                const isCollapsed = collapsedItems.includes(item.id);
                return (
                  <SortableItemWrapper key={item.id} id={item.id}>
                    {(attributes, listeners) => (
                      <div
                        style={{
                          ...cardStyle,
                          padding: "0",
                          border: "1px solid var(--border-light, #F0F0F2)",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                          transition: "all 200ms ease",
                        }}
                      >
                        {/* Header Toggle */}
                        <div
                          style={{
                            padding: "14px 16px",
                            background: isCollapsed
                              ? "transparent"
                              : "var(--bg-page, #F7F7F8)",
                            borderBottom: isCollapsed
                              ? "none"
                              : "1px solid var(--border-light, #F0F0F2)",
                            borderRadius: isCollapsed ? "20px" : "20px 20px 0 0",
                            transition: "all 200ms ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", alignItems: "center", gap: "8px" }}>
                            <div {...attributes} {...listeners} style={{ cursor: "grab", display: "flex", alignItems: "center", color: "var(--text-tertiary)", padding: "4px" }}>
                              <GripVertical size={18} />
                            </div>
                            <div onClick={() => toggleCollapse(item.id)} style={{ cursor: "pointer", flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "var(--text-tertiary, #86868B)",
                                  flexShrink: 0,
                                }}
                              >
                                {index + 1}.
                              </span>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "var(--text-primary, #1D1D1F)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                                title={item.description || "New Item"}
                      >
                        {item.description || (
                          <span
                            style={{
                              color: "var(--text-tertiary, #86868B)",
                              fontStyle: "italic",
                            }}
                          >
                            New Item
                          </span>
                        )}
                      </span>
                    </div>
                    {isCollapsed && item.quantity > 0 && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary, #6E6E73)",
                          marginTop: "4px",
                        }}
                      >
                        Qty: {item.quantity}{" "}
                        {item.unitType !== "item" ? item.unitType : ""}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => toggleCollapse(item.id)}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      Rs. {(Itemtotals[index]?.subtotal || 0).toFixed(2)}
                    </span>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "var(--surface, #FFFFFF)",
                        border: "1px solid var(--border, #E5E5E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 200ms ease",
                      }}
                    >
                      {isCollapsed ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronUp size={14} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                {!isCollapsed && (
                  <div
                    style={{
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      background: "var(--surface, #FFFFFF)",
                      borderRadius: "0 0 20px 20px",
                    }}
                  >
                    {/* Service Type */}
                    <div>
                      <label
                        style={{
                          ...labelStyle,
                          fontSize: "11px",
                          marginBottom: "6px",
                        }}
                      >
                        Service
                      </label>
                      <select
                        value={item.service || ""}
                        onChange={(e) =>
                          handleServiceChange(index, e.target.value)
                        }
                        style={{
                          ...inputStyle,
                          marginTop: 0,
                          padding: "10px 12px",
                        }}
                        {...focusProps}
                      >
                        <option value="">Custom (Manual)</option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description Field */}
                    <div>
                      <label
                        style={{
                          ...labelStyle,
                          fontSize: "11px",
                          marginBottom: "6px",
                        }}
                      >
                        Item Description{" "}
                        <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <input
                        placeholder="e.g. Website Design, Server Hosting..."
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        style={{
                          ...inputStyle,
                          marginTop: 0,
                          padding: "10px 12px",
                          borderColor: validationErrors[
                            `item_${index}_description`
                          ]
                            ? "#DC2626"
                            : "var(--border, #E5E5E7)",
                        }}
                        {...errorFocusProps(
                          validationErrors[`item_${index}_description`],
                        )}
                      />
                    </div>

                    {/* Qty & Unit Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "11px",
                            marginBottom: "6px",
                          }}
                        >
                          Qty <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", +e.target.value)
                          }
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 12px",
                            borderColor: validationErrors[
                              `item_${index}_quantity`
                            ]
                              ? "#DC2626"
                              : "var(--border, #E5E5E7)",
                          }}
                          {...errorFocusProps(
                            validationErrors[`item_${index}_quantity`],
                          )}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "11px",
                            marginBottom: "6px",
                          }}
                        >
                          Unit
                        </label>
                        <select
                          value={
                            DEFAULT_UNITS.includes(item.unitType) ||
                            customUnits.some((u) => u.name === item.unitType)
                              ? item.unitType
                              : item.unitType
                          }
                          onChange={(e) =>
                            handleUnitChange(index, e.target.value)
                          }
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 12px",
                          }}
                          {...focusProps}
                        >
                          <optgroup label="Default Units">
                            {DEFAULT_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </optgroup>
                          {customUnits.length > 0 && (
                            <optgroup label="Custom Units">
                              {customUnits.map((u) => (
                                <option key={u._id} value={u.name}>
                                  {u.name}
                                  {u.shortCode ? ` (${u.shortCode})` : ""}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="">
                            <option value="__add_custom__">
                              + Add Custom Unit
                            </option>
                          </optgroup>
                          {item.unitType &&
                            !DEFAULT_UNITS.includes(item.unitType) &&
                            !customUnits.some(
                              (u) => u.name === item.unitType,
                            ) &&
                            item.unitType !== "__add_custom__" && (
                              <option value={item.unitType} hidden>
                                {item.unitType}
                              </option>
                            )}
                        </select>
                      </div>
                    </div>

                    {/* Pricing Type & HSN Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "11px",
                            marginBottom: "6px",
                          }}
                        >
                          Pricing Type
                        </label>
                        <select
                          value={item.pricingType}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "pricingType",
                              e.target.value,
                            )
                          }
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 12px",
                          }}
                          {...focusProps}
                        >
                          {pricingTypes.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "11px",
                            marginBottom: "6px",
                          }}
                        >
                          HSN/SAC <span style={{ fontWeight: 400 }}>(opt)</span>
                        </label>
                        <input
                          placeholder="-"
                          value={item.hsnCode || ""}
                          onChange={(e) =>
                            handleItemChange(index, "hsnCode", e.target.value)
                          }
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 12px",
                          }}
                          {...focusProps}
                        />
                      </div>
                    </div>

                    {/* Rate & Item Total */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      {item.pricingType !== "tiered" ? (
                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              fontSize: "11px",
                              marginBottom: "6px",
                            }}
                          >
                            Rate (Rs.){" "}
                            <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.baseRate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "baseRate",
                                +e.target.value,
                              )
                            }
                            style={{
                              ...inputStyle,
                              marginTop: 0,
                              padding: "10px 12px",
                              borderColor: validationErrors[
                                `item_${index}_baseRate`
                              ]
                                ? "#DC2626"
                                : "var(--border, #E5E5E7)",
                            }}
                            {...errorFocusProps(
                              validationErrors[`item_${index}_baseRate`],
                            )}
                          />
                        </div>
                      ) : (
                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              fontSize: "11px",
                              marginBottom: "6px",
                            }}
                          >
                            Rate
                          </label>
                          <div
                            style={{
                              ...inputStyle,
                              marginTop: 0,
                              padding: "10px 12px",
                              background: "var(--bg-page, #F7F7F8)",
                              color: "var(--text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            Tiered Pricing
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "11px",
                            marginBottom: "6px",
                          }}
                        >
                          Item Total
                        </label>
                        <div
                          style={{
                            ...inputStyle,
                            marginTop: 0,
                            padding: "10px 12px",
                            background: "var(--bg-page, #F7F7F8)",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          Rs. {(Itemtotals[index]?.subtotal || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => duplicateItem(index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          color: "var(--text-primary, #1D1D1F)",
                          background: "var(--surface-secondary, #F5F5F7)",
                          border: "1px solid var(--border, #E5E5E7)",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          padding: "10px",
                          borderRadius: "12px",
                          transition: "all 150ms ease",
                          flex: 1,
                        }}
                      >
                        <Copy size={16} /> Duplicate
                      </button>

                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            color: "#DC2626",
                            background: "#FEF2F2",
                            border: "1px solid #FEE2E2",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                            padding: "10px",
                            borderRadius: "12px",
                            transition: "all 150ms ease",
                            flex: 1,
                          }}
                        >
                          <Trash2 size={16} /> Remove Item
                        </button>
                      )}
                    </div>

                    {/* Validation errors summary */}
                    {(validationErrors[`item_${index}_description`] ||
                      validationErrors[`item_${index}_quantity`] ||
                      validationErrors[`item_${index}_baseRate`]) && (
                      <div
                        style={{
                          color: "#DC2626",
                          fontSize: "11px",
                          paddingLeft: "4px",
                        }}
                      >
                        Please ensure description, valid quantity, and rate are
                        provided.
                      </div>
                    )}

                    {/* Tiered Pricing Config */}
                    {item.pricingType === "tiered" && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "12px",
                          background: "var(--bg-page, #F7F7F8)",
                          borderRadius: "12px",
                          border: "1px solid var(--border-light, #F0F0F2)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            Tiered Rates
                          </h4>
                          <button
                            type="button"
                            onClick={() => addTier(index)}
                            style={{
                              ...btnSecondary,
                              padding: "6px 12px",
                              fontSize: "12px",
                              borderRadius: "8px",
                            }}
                          >
                            <Plus size={12} style={{ marginRight: "4px" }} />{" "}
                            Add Tier
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {item.pricingTiers.map((tier, tIndex) => (
                            <div
                              key={tIndex}
                              style={{
                                background: "#fff",
                                padding: "10px",
                                borderRadius: "10px",
                                border: "1px solid var(--border, #E5E5E7)",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flex: "2 1 min(200px, 100%)",
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="Min"
                                  value={tier.minValue}
                                  onChange={(e) =>
                                    handleTierChange(
                                      index,
                                      tIndex,
                                      "minValue",
                                      +e.target.value,
                                    )
                                  }
                                  style={{
                                    ...inputStyle,
                                    marginTop: 0,
                                    padding: "10px",
                                    fontSize: "13px",
                                    flex: 1,
                                    minWidth: "60px",
                                  }}
                                  {...focusProps}
                                />
                                <span
                                  style={{
                                    fontWeight: 500,
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  -
                                </span>
                                <input
                                  type="number"
                                  value={tier.maxValue ?? ""}
                                  onChange={(e) =>
                                    handleTierChange(
                                      index,
                                      tIndex,
                                      "maxValue",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Max"
                                  style={{
                                    ...inputStyle,
                                    marginTop: 0,
                                    padding: "10px",
                                    fontSize: "13px",
                                    flex: 1,
                                    minWidth: "60px",
                                  }}
                                  {...focusProps}
                                />
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flex: "2 1 min(200px, 100%)",
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="Rate"
                                  value={tier.rate}
                                  onChange={(e) =>
                                    handleTierChange(
                                      index,
                                      tIndex,
                                      "rate",
                                      +e.target.value,
                                    )
                                  }
                                  style={{
                                    ...inputStyle,
                                    marginTop: 0,
                                    padding: "10px",
                                    fontSize: "13px",
                                    flex: 1,
                                    minWidth: "60px",
                                  }}
                                  {...focusProps}
                                />
                                <select
                                  value={tier.rateType || "slabRate"}
                                  onChange={(e) =>
                                    handleTierChange(
                                      index,
                                      tIndex,
                                      "rateType",
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    ...inputStyle,
                                    marginTop: 0,
                                    padding: "10px",
                                    fontSize: "13px",
                                    flex: 1,
                                    minWidth: "80px",
                                  }}
                                  {...focusProps}
                                >
                                  <option value="slabRate">Slab</option>
                                  <option value="unitRate">Unit</option>
                                </select>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flex: "1 1 min(120px, 100%)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => deleteTier(index, tIndex)}
                                  style={{
                                    width: "100%",
                                    background: "#FEF2F2",
                                    border: "1px solid #FEE2E2",
                                    color: "#DC2626",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    padding: "10px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "40px",
                                    transition: "all 200ms ease",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#FEE2E2")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "#FEF2F2")
                                  }
                                >
                                  <Trash2
                                    size={14}
                                    style={{ marginRight: "6px" }}
                                  />{" "}
                                  Remove Tier
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            </SortableItemWrapper>
                );
              })}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addItem}
            style={{
              ...btnSecondary,
              padding: "14px",
              width: "100%",
              borderStyle: "dashed",
              borderColor: "var(--border, #E5E5E7)",
            }}
          >
            <Plus size={16} style={{ marginRight: "8px" }} /> Add Another Item
          </button>
        </div>

        {/* Global Configuration & Totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={cardStyle}>
            <h3
              style={{
                fontSize: "clamp(16px, 4vw, 18px)",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Discounts & Taxes
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Global Discount</label>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="number"
                  name="discount"
                  value={formData.discount || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{
                    ...inputStyle,
                    marginTop: 0,
                    flex: "2",
                    minWidth: "120px",
                  }}
                  {...focusProps}
                />
                <select
                  name="discountType"
                  value={formData.discountType || "fixed"}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    marginTop: 0,
                    flex: "1",
                    minWidth: "100px",
                  }}
                  {...focusProps}
                >
                  <option value="fixed">Fixed (Rs.)</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <label style={labelStyle}>Taxes Applied</label>
                <button
                  type="button"
                  onClick={addTax}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent, #0071E3)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Tax
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {formData.taxes?.map((tax, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Tax Name"
                      value={tax.name}
                      onChange={(e) =>
                        handleTaxChange(index, "name", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        marginTop: 0,
                        flex: "2",
                        minWidth: "120px",
                      }}
                      {...focusProps}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                        flex: "1",
                        minWidth: "80px",
                      }}
                    >
                      <input
                        type="number"
                        placeholder="0"
                        value={tax.rate}
                        onChange={(e) =>
                          handleTaxChange(index, "rate", +e.target.value)
                        }
                        style={{
                          ...inputStyle,
                          marginTop: 0,
                          paddingRight: "28px",
                        }}
                        {...focusProps}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "12px",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        %
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTax(index)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#DC2626",
                        padding: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
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

          {/* Custom Fields for Template7PDF */}
          {(allowedTemplates.length === 0 || allowedTemplates.includes("Template7PDF")) && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: 600, margin: 0, color: "var(--text-primary, #1D1D1F)" }}>
                  Custom Fields <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-secondary, #6E6E73)" }}>(Template 7)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, customFields: [...prev.customFields, { label: "", value: "" }] }))}
                  style={{ background: "transparent", border: "none", color: "var(--accent, #0071E3)", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
                >
                  + Add Field
                </button>
              </div>
              {formData.customFields.length === 0 && (
                <p style={{ fontSize: "13px", color: "var(--text-tertiary, #86868B)", margin: 0 }}>No custom fields added. Click "+ Add Field" to add transport, vehicle, PO details etc.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {formData.customFields.map((cf, cfIdx) => (
                  <div key={cfIdx} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Label (e.g. Vehicle No.)"
                      value={cf.label}
                      onChange={(e) => {
                        const updated = [...formData.customFields];
                        updated[cfIdx] = { ...updated[cfIdx], label: e.target.value };
                        setFormData(prev => ({ ...prev, customFields: updated }));
                      }}
                      style={{ ...inputStyle, marginTop: 0, flex: "1", minWidth: "120px" }}
                      {...focusProps}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. GJ06AB1234)"
                      value={cf.value}
                      onChange={(e) => {
                        const updated = [...formData.customFields];
                        updated[cfIdx] = { ...updated[cfIdx], value: e.target.value };
                        setFormData(prev => ({ ...prev, customFields: updated }));
                      }}
                      style={{ ...inputStyle, marginTop: 0, flex: "1.5", minWidth: "140px" }}
                      {...focusProps}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, customFields: prev.customFields.filter((_, i) => i !== cfIdx) }));
                      }}
                      style={{ background: "transparent", border: "none", color: "#DC2626", padding: "8px", cursor: "pointer", flexShrink: 0 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={cardStyle}>
            <h3
              style={{
                fontSize: "clamp(16px, 4vw, 18px)",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Display Preferences
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    background: formData.includeLogo
                      ? "var(--accent, #34C759)"
                      : "var(--border, #E5E5E7)",
                    borderRadius: "12px",
                    transition: "background 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: formData.includeLogo ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      background: "#fff",
                      borderRadius: "50%",
                      transition:
                        "left 0.3s cubic-bezier(0.2, 0.85, 0.32, 1.2)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                </div>
                <input
                  type="checkbox"
                  name="includeLogo"
                  checked={formData.includeLogo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [e.target.name]: e.target.checked,
                    }))
                  }
                  style={{ display: "none" }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  Include Logo
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    background: formData.includeSignature
                      ? "var(--accent, #34C759)"
                      : "var(--border, #E5E5E7)",
                    borderRadius: "12px",
                    transition: "background 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: formData.includeSignature ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      background: "#fff",
                      borderRadius: "50%",
                      transition:
                        "left 0.3s cubic-bezier(0.2, 0.85, 0.32, 1.2)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                </div>
                <input
                  type="checkbox"
                  name="includeSignature"
                  checked={formData.includeSignature}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [e.target.name]: e.target.checked,
                    }))
                  }
                  style={{ display: "none" }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  Include Signature
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              ...cardStyle,
              background: "var(--surface-secondary, #FBFBFD)",
              border: "none",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(16px, 4vw, 18px)",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Summary
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Subtotal</span>
                <span>Rs. {(totals?.subtotal ?? 0).toFixed(2)}</span>
              </div>

              {totals?.discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#059669",
                  }}
                >
                  <span>Discount</span>
                  <span>- Rs. {(totals?.discountAmount ?? 0).toFixed(2)}</span>
                </div>
              )}

              <div
                style={{
                  borderTop: "1px solid var(--border, #E5E5E7)",
                  padding: "8px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {totals?.taxes?.map((tax, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>
                      {tax.name || "Tax"} ({tax.rate}%)
                    </span>
                    <span>+ Rs. {(tax.amount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--border, #E5E5E7)",
                  paddingTop: "16px",
                  marginTop: "4px",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(16px, 4vw, 18px)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Total Amount
                </span>
                <span
                  style={{
                    fontSize: (() => {
                      const len = (totals?.totalAmount ?? 0).toFixed(2).length;
                      if (len > 18) return "13px";
                      if (len > 14) return "16px";
                      if (len > 10) return "20px";
                      return "clamp(22px, 5vw, 28px)";
                    })(),
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    textAlign: "right",
                    wordBreak: "break-all",
                    minWidth: 0,
                  }}
                >
                  Rs. {(totals?.totalAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...btnPrimary,
                width: "100%",
                marginTop: "24px",
                padding: "14px 20px",
                fontSize: "15px",
              }}
            >
              {loading ? "Updating Invoice..." : "Update Invoice"}
            </button>
          </div>
        </div>
      </form>

      {/* Add Custom Unit Modal */}
      {showAddUnitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowAddUnitModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              boxShadow:
                "0 24px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text-primary, #1D1D1F)",
                  letterSpacing: "-0.02em",
                }}
              >
                Add Custom Unit
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUnitModal(false)}
                style={{
                  background: "var(--surface-secondary, #F5F5F7)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    ...labelStyle,
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Unit Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g. litre, bundle, session"
                  style={{ ...inputStyle, marginTop: 0 }}
                  autoFocus
                  {...focusProps}
                />
              </div>
              <div>
                <label
                  style={{
                    ...labelStyle,
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Short Code <span style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={newUnitShortCode}
                  onChange={(e) => setNewUnitShortCode(e.target.value)}
                  placeholder="e.g. ltr, bdl, sess"
                  style={{ ...inputStyle, marginTop: 0 }}
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
                style={{
                  ...btnPrimary,
                  flex: 1,
                  padding: "12px",
                  opacity: addingUnit ? 0.6 : 1,
                }}
              >
                {addingUnit ? "Saving..." : "Save Unit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditInvoice;