import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Eye,
  Trash2,
  Pencil,
  Search,
  MoreHorizontal,
  FileText,
  IndianRupee,
  Bell,
  X,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import axios from "axios";
import AppleDataTable from "../components/AppleDataTable";
import emailjs from '@emailjs/browser';
axios.defaults.withCredentials = true;

const statusOptions = ["draft", "sent", "paid", "partial", "overdue", "cancelled"];

// Apple-inspired status badge configuration
const statusColors = {
  draft: {
    bg: "#F5F5F7",
    text: "#6E6E73",
    dot: "#86868B",
  },
  sent: {
    bg: "#EFF6FF",
    text: "#0071E3",
    dot: "#0071E3",
  },
  paid: {
    bg: "#ECFDF5",
    text: "#059669",
    dot: "#059669",
  },
  partial: {
    bg: "#FFFBEB",
    text: "#D97706",
    dot: "#D97706",
  },
  overdue: {
    bg: "#FEF2F2",
    text: "#DC2626",
    dot: "#DC2626",
  },
  cancelled: {
    bg: "#F5F5F7",
    text: "#86868B",
    dot: "#86868B",
  },
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);

  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleOpenEmailModal = (invoice) => {
    setEmailInvoice(invoice);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailInvoice || !emailInvoice.client?.email) {
      toast.error("Client email not found. Please update client details.");
      return;
    }

    setIsSendingEmail(true);
    try {
      // TODO: Replace with your actual EmailJS credentials
      const serviceId = "YOUR_SERVICE_ID";
      const templateId = "YOUR_TEMPLATE_ID";
      const publicKey = "YOUR_PUBLIC_KEY";

      const templateParams = {
        to_email: emailInvoice.client.email,
        to_name: emailInvoice.client.companyName || "Customer",
        invoice_number: emailInvoice.invoiceNumber,
        amount: emailInvoice.totalAmount,
        due_date:  emailInvoice.dueDate ? new Date(emailInvoice.dueDate).toLocaleDateString("en-GB") : ""
      };

      // Un-comment and configure this when ready:
      // await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      console.log("EmailJS Params:", templateParams);
      toast.success(`Email sent to ${emailInvoice.client.email}`);
      setShowEmailModal(false);
      setEmailInvoice(null);
    } catch (error) {
      console.error("Email send error:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Fetch invoices
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply search + filter whenever dependencies change
  useEffect(() => {
    let filtered = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const invoiceDateFormatted = format(invoiceDate, "dd-MM-yyyy");
      const invoiceDateReadable = format(invoiceDate, "MMM dd, yyyy");

      // Search match
      const matchesSearch =
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.client?.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoiceDateFormatted.includes(searchTerm) ||
        invoiceDateReadable.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Month filter
    if (monthFilter !== "all") {
      filtered = filtered.filter(
        (invoice) =>
          new Date(invoice.invoiceDate).getMonth() + 1 === parseInt(monthFilter)
      );
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(
        (invoice) =>
          new Date(invoice.invoiceDate).getFullYear() === parseInt(yearFilter)
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, monthFilter, yearFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/invoices`
      );

      const sortedData = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setInvoices(sortedData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  // Update invoice status
  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/invoices/update-invoice/${invoiceId}`,
        { status: newStatus }
      );
      toast.success(`Status updated to ${newStatus}`);
      fetchInvoices();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await axios.delete(
          `${
            import.meta.env.VITE_BASE_URL
          }/invoices/delete-invoice/${invoiceId}`
        );
        toast.success("Invoice deleted successfully");
        fetchInvoices();
      } catch (error) {
        toast.error("Failed to delete invoice");
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
      setOpenActionId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ── Shared Styles ── */
  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border, #E5E5E7)',
    background: 'var(--surface, #FFFFFF)',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: 'var(--text-primary, #1D1D1F)',
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
    outline: 'none',
    width: '100%',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5 L6 7.5 L9 4.5' stroke='%2386868b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  };

  const actionDropdownStyle = {
    position: 'absolute',
    right: 0,
    zIndex: 20,
    marginTop: '4px',
    width: '200px',
    background: 'var(--surface, #FFFFFF)',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--border, #E5E5E7)',
    overflow: 'hidden',
    padding: '4px',
  };

  const actionItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 450,
    color: 'var(--text-primary, #1D1D1F)',
    textDecoration: 'none',
    transition: 'background 150ms ease',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
  };

  const statusDropdownStyle = {
    position: 'absolute',
    zIndex: 20,
    marginTop: '6px',
    minWidth: '140px',
    background: 'var(--surface, #FFFFFF)',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--border, #E5E5E7)',
    overflow: 'hidden',
    padding: '4px',
  };

  // ── Column config ──
  const invoiceColumns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      width: '14%',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #1D1D1F)', fontSize: '13px' }}>
          #{row.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'client.companyName',
      label: 'Customer',
      sortable: true,
      width: '22%',
      render: (row) => (
        <span style={{ color: 'var(--text-primary, #1D1D1F)', fontSize: '13px' }}>
          {row.client?.companyName || "No Client"}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      width: '14%',
      align: 'right',
      render: (row) => (
        <span style={{
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary, #1D1D1F)',
          fontSize: '13px',
        }}>
          Rs. {row.totalAmount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '14%',
      render: (row) => {
        const colors = statusColors[row.status] || statusColors.draft;
        return (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(
                  openDropdownId === row._id ? null : row._id
                );
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '999px',
                border: 'none',
                background: colors.bg,
                color: colors.text,
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 180ms ease',
                letterSpacing: '0.01em',
                minWidth: '80px',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(0.96)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: colors.dot,
                  flexShrink: 0,
                }}
              />
              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            </button>

            {openDropdownId === row._id && (
              <div style={statusDropdownStyle}>
                {statusOptions.map(
                  (status) =>
                    status !== row.status && (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(row._id, status);
                          setOpenDropdownId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: statusColors[status]?.text || '#6E6E73',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          transition: 'background 150ms ease',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = statusColors[status]?.bg || '#F5F5F7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: statusColors[status]?.dot || '#86868B',
                            flexShrink: 0,
                          }}
                        />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    )
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'invoiceDate',
      label: 'Date',
      sortable: true,
      width: '14%',
      render: (row) => (
        <span style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: '13px' }}>
          {format(new Date(row.invoiceDate), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      width: '14%',
      render: (row) => (
        <span style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: '13px' }}>
          {row.dueDate ? format(new Date(row.dueDate), "MMM dd, yyyy") : "-"}
        </span>
      ),
    },
    {
      key: 'notify',
      label: 'Notify',
      width: '7%',
      align: 'center',
      render: (row) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let isOverdueOrDueToday = false;
        if (row.dueDate) {
          const due = new Date(row.dueDate);
          due.setHours(0, 0, 0, 0);
          isOverdueOrDueToday = due <= today;
        }
        const isPending = row.status !== "paid" && row.status !== "cancelled";

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEmailModal(row);
            }}
            disabled={!isPending}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isPending ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              opacity: isPending ? 1 : 0.4
            }}
            title={isOverdueOrDueToday && isPending ? "Invoice Overdue/Due - Send Reminder" : "Send Reminder"}
          >
            <Bell size={18} color={isOverdueOrDueToday && isPending ? "#DC2626" : "#86868B"} />
          </button>
        );
      }
    },
    {
      key: 'actions',
      label: '',
      width: '7%',
      render: (row) => (
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionId(
                openActionId === row._id ? null : row._id
              );
            }}
            className="adt-action-btn"
            aria-label="More actions"
            title="Actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {openActionId === row._id && (
            <div style={actionDropdownStyle}>
              {/* View */}
              <Link
                to={`/invoices/${row._id}`}
                style={actionItemStyle}
                onClick={() => setOpenActionId(null)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-light, #F0F0F2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Eye style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                View Invoice
              </Link>

              {/* Manage Payment */}
              <Link
                to={`/invoices/${row._id}/payments`}
                style={actionItemStyle}
                onClick={() => setOpenActionId(null)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-light, #F0F0F2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <IndianRupee style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                Manage Payments
              </Link>

              {/* Edit */}
              <Link
                to={`/invoices/edit/${row._id}`}
                style={actionItemStyle}
                onClick={() => setOpenActionId(null)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-light, #F0F0F2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Pencil style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                Edit Invoice
              </Link>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border, #E5E5E7)', margin: '2px 8px' }} />

              {/* Delete */}
              <button
                onClick={() => {
                  handleDeleteInvoice(row._id);
                  setOpenActionId(null);
                }}
                style={{
                  ...actionItemStyle,
                  color: '#DC2626',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 style={{ width: '15px', height: '15px' }} />
                Delete Invoice
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary, #1D1D1F)',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Invoices
          </h1>
          <p
            style={{
              marginTop: '4px',
              fontSize: '14px',
              color: 'var(--text-secondary, #6E6E73)',
              fontWeight: 400,
            }}
          >
            Manage your invoices right here
          </p>
        </div>
        <Link
          to="/invoices/create"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'var(--accent, #0071E3)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 200ms ease',
            boxShadow: '0 1px 3px rgba(0, 113, 227, 0.3)',
            border: 'none',
            letterSpacing: '-0.006em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-hover, #0077ED)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 113, 227, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent, #0071E3)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 113, 227, 0.3)';
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Create Invoice
        </Link>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--text-tertiary, #86868B)',
            }}
          >
            <Search style={{ width: '16px', height: '16px' }} />
          </div>
          <input
            type="text"
            placeholder="Search invoices..."
            style={{
              ...inputStyle,
              paddingLeft: '40px',
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent, #0071E3)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border, #E5E5E7)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ flex: '0 0 auto', width: '160px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent, #0071E3)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border, #E5E5E7)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="all">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div style={{ flex: '0 0 auto', width: '150px' }}>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={selectStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent, #0071E3)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border, #E5E5E7)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="all">All Months</option>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div style={{ flex: '0 0 auto', width: '120px' }}>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={selectStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent, #0071E3)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border, #E5E5E7)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="all">All Years</option>
            {[2025, 2024, 2023, 2022].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <AppleDataTable
        columns={invoiceColumns}
        data={filteredInvoices}
        loading={loading}
        rowKey="_id"
        defaultSortKey="invoiceDate"
        defaultSortDir="desc"
        emptyIcon={<FileText size={48} />}
        emptyTitle="No invoices found"
        emptySubtitle={
          searchTerm || statusFilter !== "all" || monthFilter !== "all" || yearFilter !== "all"
            ? "Try adjusting your search or filter criteria."
            : "Get started by creating your first invoice."
        }
        emptyAction={
          !searchTerm &&
          statusFilter === "all" &&
          monthFilter === "all" &&
          yearFilter === "all" && (
            <Link
              to="/invoices/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'var(--accent, #0071E3)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 200ms ease',
                boxShadow: '0 1px 3px rgba(0, 113, 227, 0.3)',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Create Invoice
            </Link>
          )
        }
      />

      {/* Email Confirmation Modal */}
      {showEmailModal && emailInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1D1D1F' }}>Send Reminder Email</h3>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={20} color="#6E6E73" />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#6E6E73', marginBottom: '16px', lineHeight: 1.5 }}>
              You are about to send a pending bill reminder to <strong>{emailInvoice.client?.companyName}</strong> ({emailInvoice.client?.email || 'No email found'}).
            </p>
            <div style={{ background: '#F5F5F7', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', color: '#1D1D1F', border: '1px solid #E5E5E7' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#6E6E73' }}>Email Preview:</p>
              <p style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>
                "Dear {emailInvoice.client?.companyName},<br/><br/>Your bill for invoice #{emailInvoice.invoiceNumber} amounting to Rs. {emailInvoice.totalAmount} is pending. Please clear it by {emailInvoice.dueDate ? new Date(emailInvoice.dueDate).toLocaleDateString('en-GB') : '-'}.<br/><br/>Thank you."
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #E5E5E7', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#1D1D1F' }}
                disabled={isSendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#0071E3', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: isSendingEmail ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={isSendingEmail || !emailInvoice.client?.email}
              >
                {isSendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;