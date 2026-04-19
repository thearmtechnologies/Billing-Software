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

  // ── Column config ──
  const serviceColumns = [
    {
      key: 'name',
      label: 'Service Name',
      sortable: true,
      width: '20%',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--adt-text-primary)' }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      width: '28%',
      render: (row) => (
        <span
          className="block sm:truncate"
          style={{
            color: 'var(--adt-text-secondary)',
          }}
          title={row.description}
        >
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'pricing',
      label: 'Pricing',
      width: '18%',
      render: (row) => (
        <span style={{ color: 'var(--adt-text-primary)', fontWeight: 500 }}>
          {getPricingDisplay(row)}
        </span>
      ),
    },
    {
      key: 'unitType',
      label: 'Unit',
      sortable: true,
      width: '12%',
      render: (row) => (
        <span style={{ color: 'var(--adt-text-secondary)' }}>
          {getUnitDisplay(row.unitType)}
        </span>
      ),
    },
    {
      key: 'hsnCode',
      label: 'HSN Code',
      width: '12%',
      render: (row) => (
        <span style={{ color: 'var(--adt-text-secondary)' }}>
          {row.hsnCode || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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
      {/* Header — Matching Clients style */}
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
            className="inline-flex items-center justify-center w-full sm:w-auto border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            style={{
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "0.625rem",
              paddingBottom: "0.625rem",
            }}
          >
            <Plus className="h-4 w-4" style={{ marginRight: "0.5rem" }} />
            Add Service
          </button>
        </div>
      </div>

      {/* Search — Matching Clients style */}
      <div className="relative" style={{ marginTop: "1.5rem" }}>
        <div
          className="absolute inset-y-0 left-0 flex items-center pointer-events-none"
          style={{ paddingLeft: "12px" }}
        >
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search services..."
          className="block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          style={{
            paddingLeft: "2.5rem",
            paddingRight: "0.75rem",
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
                className="inline-flex items-center border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                }}
              >
                <Plus className="h-4 w-4" style={{ marginRight: "0.5rem" }} />
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
