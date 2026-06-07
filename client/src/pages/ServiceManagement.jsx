import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Package } from "lucide-react";
import axios from "axios";
import ServiceModal from "../components/ServiceModal";
import AppleDataTable from "../components/AppleDataTable";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      axios.defaults.withCredentials = true;
      const res = await axios.get(`${BASE_URL}/services`);
      console.log(res);
      setServices(res.data.services || []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(`${BASE_URL}/services`, serviceData);
      setServices((prev) => [res.data.service, ...prev]);
      toast.success("Service added successfully");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add service:", error);
      toast.error(error.response?.data?.message || "Failed to add service. Please try again.");
      throw error;
    }
  };

  const handleUpdateService = async (serviceData) => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.patch(
        `${BASE_URL}/services/${editingService._id}`,
        serviceData
      );
      setServices((prev) =>
        prev.map((service) =>
          service._id === editingService._id ? res.data.service : service
        )
      );
      toast.success("Service updated successfully");
      setEditingService(null);
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error(error.response?.data?.message || "Failed to update service. Please try again.");
      throw error;
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        axios.defaults.withCredentials = true;
        await axios.delete(`${BASE_URL}/services/${serviceId}`);
        setServices((prev) =>
          prev.filter((service) => service._id !== serviceId)
        );
        toast.success('Service deleted successfully');
      } catch (error) {
        console.error("Failed to delete service:", error);
      }
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPricingDisplay = (service) => {
    if (service.pricingType === "fixed" || service.pricingType === "flat") {
      return `Rs. ${service.baseRate}/${getUnitDisplay(service.unitType)}`;
    } else if (service.pricingType === "tiered") {
      return `${service.pricingTiers?.length || 0} pricing tiers`;
    }
    return "Variable pricing";
  };

  const getUnitDisplay = (unit) => {
    const units = {
      km: "Kilometer",
      hour: "Hour",
      day: "Day",
      month: "Month",
      item: "Item",
      kg: "Kilogram",
      piece: "Piece",
      service: "Service",
      ton: "Ton",
      shift: "Shift",
      other: "Other",
    };
    return units[unit] || unit;
  };

  // ── Responsive column config ──
  const serviceColumns = [
    {
      key: 'name',
      label: 'Service Name',
      sortable: true,
      width: 'minmax(160px, 25%)',
      render: (row) => (
        <span
          style={{
            fontWeight: 500,
            color: 'var(--adt-text-primary)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.name}
        >
          {row.name}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      width: 'minmax(180px, 28%)',
      render: (row) => (
        <span
          style={{
            color: 'var(--adt-text-secondary)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.description || '—'}
        >
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'pricing',
      label: 'Pricing',
      width: 'minmax(140px, 18%)',
      render: (row) => (
        <span
          style={{
            color: 'var(--adt-text-primary)',
            fontWeight: 500,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={getPricingDisplay(row)}
        >
          {getPricingDisplay(row)}
        </span>
      ),
    },
    {
      key: 'unitType',
      label: 'Unit',
      sortable: true,
      width: 'minmax(100px, 12%)',
      render: (row) => (
        <span
          style={{
            color: 'var(--adt-text-secondary)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={getUnitDisplay(row.unitType)}
        >
          {getUnitDisplay(row.unitType)}
        </span>
      ),
    },
    {
      key: 'hsnCode',
      label: 'HSN Code',
      width: 'minmax(100px, 12%)',
      render: (row) => (
        <span
          style={{
            color: 'var(--adt-text-secondary)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.hsnCode || '—'}
        >
          {row.hsnCode || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'minmax(100px, 10%)',
      align: 'left',
      render: (row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="adt-action-btn adt-action-btn--primary"
            onClick={() => setEditingService(row)}
            aria-label={`Edit ${row.name}`}
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
          <button
            className="adt-action-btn adt-action-btn--danger"
            onClick={() => handleDeleteService(row._id)}
            aria-label={`Delete ${row.name}`}
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
      {/* Header - Responsive */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500" style={{ marginTop: "0.25rem" }}>
            Manage your services and pricing
          </p>
        </div>
        <div style={{ marginTop: "1rem" }} className="sm:mt-0 w-full sm:w-auto">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" style={{ marginRight: "0.5rem" }} />
            Add Service
          </button>
        </div>
      </div>

      {/* Search - Responsive like Clients page */}
      <div
        style={{
          marginTop: "1.5rem",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <Search size={18} color="#9ca3af" />
        </div>
        <input
          type="text"
          placeholder="Search services..."
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem 0.5rem 2.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Data Table */}
      <div style={{ marginTop: "1.5rem" }}>
        <AppleDataTable
          columns={serviceColumns}
          data={filteredServices}
          loading={loading}
          rowKey="_id"
          defaultSortKey="createdAt"
          defaultSortDir="desc"
          emptyIcon={<Package size={48} />}
          emptyTitle="No services found"
          emptySubtitle={
            searchTerm
              ? "Try adjusting your search terms."
              : "Get started by creating a new service."
          }
          emptyAction={
            !searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <Plus size={16} />
                Add Service
              </button>
            )
          }
        />
      </div>

      {/* Add/Edit Service Modal */}
      {(showForm || editingService) && (
        <ServiceModal
          service={editingService}
          onSave={editingService ? handleUpdateService : handleAddService}
          onCancel={() => {
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceManagement;