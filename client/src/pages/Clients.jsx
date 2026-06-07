import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ClientModal from "../components/ClientModal";
import AppleDataTable from "../components/AppleDataTable";
import axios from "axios";

axios.defaults.withCredentials = true;
const BASE_URL = import.meta.env.VITE_BASE_URL;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        (client?.companyName?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        ) ||
        (client?.email?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        ) ||
        (client?.phone || "").includes(searchTerm),
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/users/clients`);
      setClients(response.data.clients || []);
    } catch (error) {
      toast.error("Failed to fetch clients");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        await axios.patch(
          `${BASE_URL}/users/edit-client/${editingClient._id}`,
          clientData,
        );
        toast.success("Client updated successfully");
      } else {
        await axios.post(`${BASE_URL}/users/add-client`, clientData);
        toast.success("Client created successfully");
      }
      fetchClients();
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save client");
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await axios.delete(`${BASE_URL}/users/delete-client/${clientId}`);
        toast.success("Client deleted successfully");
        fetchClients();
      } catch (error) {
        toast.error("Failed to delete client");
      }
    }
  };

  // ── Responsive column config ──
  const clientColumns = [
    {
      key: "companyName",
      label: "Company Name",
      sortable: true,
      width: "minmax(160px, 25%)",
      render: (row) => (
        <span
          style={{
            fontWeight: 500,
            color: "var(--adt-text-primary)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.companyName || "—"}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      width: "minmax(120px, 18%)",
      render: (row) => (
        <span
          style={{
            color: "var(--adt-text-secondary)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.phone || "—"}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      width: "minmax(180px, 25%)",
      render: (row) => (
        <a
          href={`mailto:${row.email}`}
          style={{
            color: "var(--adt-primary)",
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {row.email || "—"}
        </a>
      ),
    },
    {
      key: "address.city",
      label: "City",
      sortable: true,
      width: "minmax(100px, 17%)",
      render: (row) => (
        <span
          style={{
            color: "var(--adt-text-secondary)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.address?.city || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "minmax(120px, 15%)",
      align: "left",
      render: (row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="adt-action-btn adt-action-btn--primary"
            onClick={() => handleEditClient(row)}
            aria-label={`Edit ${row.companyName}`}
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
          <button
            className="adt-action-btn"
            style={{
              color: "var(--adt-text-secondary)",
              background: "transparent",
            }}
            onClick={() => navigate(`/clients/${row._id}/ledger`)}
            aria-label={`View Ledger for ${row.companyName}`}
            title="View Ledger"
          >
            <BookOpen size={15} />
          </button>
          <button
            className="adt-action-btn adt-action-btn--danger"
            onClick={() => handleDeleteClient(row._id)}
            aria-label={`Delete ${row.companyName}`}
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
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500" style={{ marginTop: "0.25rem" }}>
            Manage your client database
          </p>
        </div>
        <div style={{ marginTop: "1rem" }} className="sm:mt-0 w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" style={{ marginRight: "0.5rem" }} />
            Add Client
          </button>
        </div>
      </div>

      {/* Search - Responsive */}
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
          placeholder="Search clients..."
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
          columns={clientColumns}
          data={filteredClients}
          loading={loading}
          rowKey="_id"
          defaultSortKey="companyName"
          defaultSortDir="asc"
          emptyIcon={<Users size={48} />}
          emptyTitle="No clients found"
          emptySubtitle={
            searchTerm
              ? "Try adjusting your search terms."
              : "Get started by creating a new client."
          }
          emptyAction={
            !searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
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
                Add Client
              </button>
            )
          }
        />
      </div>

      {/* Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        handleSaveClient={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
};

export default Clients;
