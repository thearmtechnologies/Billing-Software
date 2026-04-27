import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserContext } from '../context/userContext';
import { Lock, Eye, EyeOff, Search, FileText } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminUsers = () => {
  const { currentUser } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal states
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Template Modal states
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedUserForTemplates, setSelectedUserForTemplates] = useState(null);
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  const [savingTemplates, setSavingTemplates] = useState(false);

  const availableTemplates = [
    { id: "Template1PDF", name: "Template 1" },
    { id: "Template2PDF", name: "Template 2" },
    { id: "Template3PDF", name: "Template 3" },
    { id: "Template4PDF", name: "Template 4" },
    { id: "Template5PDF", name: "Template 5" },
    { id: "Template6PDF", name: "Template 6" },
    { id: "Template7PDF", name: "Template 7" },
    { id: "Template8PDF", name: "Template 8" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/users`, {
        withCredentials: true
      });
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    try {
      setResetting(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/admin/reset-password/${selectedUser._id}`,
        { newPassword },
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success("Password updated successfully");
        setModalOpen(false);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setResetting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
      
      const { data } = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/admin/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success(`Role updated successfully`);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const openTemplateModal = (user) => {
    setSelectedUserForTemplates(user);
    if (user.allowedTemplates) {
      setAllowedTemplates(user.allowedTemplates);
    } else {
      // Undefined or missing means all are allowed by default, but let's initialize to all selected for editing
      setAllowedTemplates(availableTemplates.map(t => t.id));
    }
    setTemplateModalOpen(true);
  };

  const toggleTemplateSelection = (templateId) => {
    setAllowedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  const handleSaveTemplates = async (e) => {
    e.preventDefault();
    try {
      setSavingTemplates(true);
      const { data } = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/admin/users/${selectedUserForTemplates._id}/templates`,
        { allowedTemplates },
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success("Templates updated successfully");
        setTemplateModalOpen(false);
        fetchUsers(); // Refresh the list to get new allowedTemplates array
      }
    } catch (error) {
      console.error('Error updating templates:', error);
      toast.error(error.response?.data?.message || 'Failed to update templates');
    } finally {
      setSavingTemplates(false);
    }
  };

  // Only allow admin
  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center" style={{ gap: '16px' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>User Management</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage users and reset their login passwords.
          </p>
        </div>
      </div>

      {/* Cards & Content */}
      <div className="app-card">
        {/* Search Header */}
        <div className="border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-secondary)]" style={{ padding: '16px' }}>
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" style={{ left: '12px' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input text-sm"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center" style={{ padding: '48px' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] text-sm font-medium border-b border-[var(--border)]">
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', width: '25%' }}>Name</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', width: '30%' }}>Email</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap' }}>Templates</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap' }}>Status</th>
                  <th className="text-right" style={{ padding: '16px', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-colors">
                      <td className="font-medium text-[var(--text-primary)]" style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        {user.name}
                        {user.role === 'admin' && <span className="text-xs bg-purple-100 text-purple-700 font-bold rounded-full" style={{ marginLeft: '8px', padding: '2px 8px' }}>Admin</span>}
                      </td>
                      <td className="text-[var(--text-secondary)]" style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </td>
                      <td className="text-[var(--text-secondary)]" style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        {user.allowedTemplates ? (user.allowedTemplates.length > 0 ? `${user.allowedTemplates.length}` : 'None') : 'All (Default)'}
                      </td>
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                         <span className={`inline-flex items-center rounded-full text-xs font-medium border ${
                            user.isActive !== false ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                          }`} style={{ padding: '2px 10px' }}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                      </td>
                      <td className="text-right" style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}
                          className="inline-flex items-center font-medium rounded-md"
                          style={{ color: user.role === 'admin' ? '#ef4444' : '#10b981', background: 'var(--surface-secondary)', gap: '6px', fontSize: '14px', padding: '6px 12px', border: '1px solid var(--border)', marginRight: '8px' }}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => openTemplateModal(user)}
                          className="inline-flex items-center font-medium rounded-md"
                          style={{ color: '#0071E3', background: 'var(--surface-secondary)', gap: '6px', fontSize: '14px', padding: '6px 12px', border: '1px solid var(--border)', marginRight: '8px' }}
                        >
                          <FileText style={{ width: '16px', height: '16px' }} />
                          Assign Templates
                        </button>
                        <button
                          onClick={() => openResetModal(user)}
                          className="inline-flex items-center font-medium rounded-md"
                          style={{ color: 'var(--color-primary)', background: 'var(--surface-secondary)', gap: '6px', fontSize: '14px', padding: '6px 12px', border: '1px solid var(--border)' }}
                        >
                          <Lock style={{ width: '16px', height: '16px' }} />
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-[var(--text-secondary)] font-medium" style={{ padding: '32px' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ padding: '16px' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-gray-100 flex justify-between items-center" style={{ padding: '20px' }}>
              <h3 className="font-semibold text-lg text-gray-900">Reset Password</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ padding: '4px' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p className="text-sm text-gray-600" style={{ marginBottom: '16px' }}>
                  You are resetting the password for <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
                </p>
                <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '4px' }}>
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    style={{ right: '12px' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-xs text-red-500" style={{ marginTop: '4px' }}>Password must be at least 6 characters long.</p>
                )}
              </div>

              <div className="flex justify-end" style={{ paddingTop: '8px', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors"
                  style={{ padding: '8px 16px' }}
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting || newPassword.length < 6}
                  className="btn-primary"
                  style={{ padding: '8px 16px', width: 'auto' }}
                >
                  {resetting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Assignment Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ padding: '16px' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-gray-100 flex justify-between items-center" style={{ padding: '20px' }}>
              <h3 className="font-semibold text-lg text-gray-900">Assign Templates</h3>
              <button 
                onClick={() => setTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ padding: '4px' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveTemplates} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p className="text-sm text-gray-600" style={{ marginBottom: '16px' }}>
                  Select the templates <strong>{selectedUserForTemplates?.name}</strong> is allowed to use. 
                </p>

                <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {availableTemplates.map((template) => (
                    <label key={template.id} className="flex items-center hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" style={{ padding: '12px 16px', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={allowedTemplates.includes(template.id)}
                        onChange={() => toggleTemplateSelection(template.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span className="text-sm font-medium text-gray-700">{template.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center" style={{ paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAllowedTemplates([])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setTemplateModalOpen(false)}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors"
                    style={{ padding: '8px 16px' }}
                    disabled={savingTemplates}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTemplates}
                    className="btn-primary"
                    style={{ padding: '8px 16px', width: 'auto' }}
                  >
                    {savingTemplates ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Templates"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;