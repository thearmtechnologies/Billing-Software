import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ClientModal from '../components/ClientModal';
import AppleDataTable from '../components/AppleDataTable';
import axios from 'axios';
axios.defaults.withCredentials = true;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      (client?.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client?.phone || '').includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/clients`);
      console.log(response)
      setClients(response.data.clients);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        await axios.patch(`${BASE_URL}/users/edit-client/${editingClient._id}`, clientData);
        toast.success('Client updated successfully');
      } else {
        await axios.post(`${BASE_URL}/users/add-client`, clientData);
        toast.success('Client created successfully');
      }
      fetchClients();
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast.error('Failed to save client');
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`${BASE_URL}/users/delete-client/${clientId}`);
        toast.success('Client deleted successfully');
        fetchClients();
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

  // ── Column config ──
  const clientColumns = [
    {
      key: 'companyName',
      label: 'Company Name',
      sortable: true,
      width: '25%',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--adt-text-primary)' }}>
          {row.companyName}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '18%',
      render: (row) => (
        <span style={{ color: 'var(--adt-text-secondary)' }}>{row.phone || '—'}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: '25%',
      render: (row) => (
        <span style={{ color: 'var(--adt-text-secondary)' }}>{row.email || '—'}</span>
      ),
    },
    {
      key: 'address.city',
      label: 'City',
      sortable: true,
      width: '17%',
      render: (row) => (
        <span style={{ color: 'var(--adt-text-secondary)' }}>
          {row.address?.city || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '15%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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
            style={{ color: 'var(--adt-text-secondary)', background: 'transparent' }}
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
    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500" style={{ marginTop: '0.25rem' }}>
            Manage your client database
          </p>
        </div>
        <div style={{ marginTop: '1rem' }} className="sm:mt-0 w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" style={{ marginRight: '0.5rem' }} />
            Add Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative" style={{ marginTop: '1.5rem' }}>
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{paddingLeft: '12px'}}>
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          className="block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <AppleDataTable
          columns={clientColumns}
          data={filteredClients}
          loading={loading}
          rowKey="_id"
          defaultSortKey="companyName"
          defaultSortDir="asc"
          emptyIcon={<Users size={48} />}
          emptyTitle="No clients found"
          emptySubtitle={searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new client.'}
          emptyAction={
            !searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" style={{ marginRight: '0.5rem' }} />
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
