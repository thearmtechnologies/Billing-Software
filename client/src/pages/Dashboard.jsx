import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Settings,
  Calendar,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import { UserContext } from "../context/userContext";
import UnifiedChart from "../components/UnifiedChart";
import SummaryPie from "../components/SummaryPie";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { tokens } from "../components/tokens";

/* ── Financial Year Helpers ─────────────────────────────────── */
const getCurrentFY = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 3=Apr
  const year = now.getFullYear();
  // April (3) onwards → FY starts this year; Jan-Mar → FY started previous year
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const generateFYOptions = () => {
  const now = new Date();
  const currentStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const options = [];
  // Generate from 2022-2023 up to currentFY + 1 (next FY)
  const startFrom = 2022;
  const endAt = currentStartYear + 1;
  for (let y = endAt; y >= startFrom; y--) {
    options.push(`${y}-${y + 1}`);
  }
  return options;
};

const getFYDateRange = (fyString) => {
  const [startYear] = fyString.split("-").map(Number);
  return {
    from: new Date(startYear, 3, 1),       // April 1
    to: new Date(startYear + 1, 2, 31, 23, 59, 59, 999), // March 31 end-of-day
  };
};

const filterInvoicesByFY = (invoices, fyString) => {
  const { from, to } = getFYDateRange(fyString);
  return invoices.filter((inv) => {
    const d = new Date(inv.invoiceDate);
    return d >= from && d <= to;
  });
};

const calculateSparklineData = (invoices, metricType) => {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      monthYear: `${d.getFullYear()}-${d.getMonth()}`,
      value: 0
    });
  }

  invoices.forEach(inv => {
    const invDate = new Date(inv.invoiceDate);
    const key = `${invDate.getFullYear()}-${invDate.getMonth()}`;
    const bucket = result.find(r => r.monthYear === key);
    if (bucket) {
      if (metricType === 'totalInvoices') bucket.value += 1;
      else if (metricType === 'totalRevenue') {
        if (inv.status === 'paid') bucket.value += inv.totalAmount;
        else if (inv.status === 'partial') bucket.value += inv.amountPaid;
      }
      else if (metricType === 'amountDue') {
        if (inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial') bucket.value += inv.amountDue;
      }
      else if (metricType === 'sentInvoices' && inv.status === 'sent') bucket.value += 1;
      else if (metricType === 'overdueInvoices' && inv.status === 'overdue') bucket.value += 1;
      else if (metricType === 'partialPayments' && inv.status === 'partial') bucket.value += 1;
      else if (metricType === 'draftInvoices' && inv.status === 'draft') bucket.value += 1;
    }
  });

  return result;
};

const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return <div style={{height: "60px", marginTop: "16px"}} />;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const allZero = max === 0 && min === 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: `1px solid ${tokens.colors.borderLight}`, padding: "4px 8px", borderRadius: "6px", fontSize: "12px", color: tokens.colors.textPrimary, boxShadow: tokens.shadows.soft }}>
          {payload[0].payload.monthYear}: <b>{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: "60px", width: "100%", marginTop: "16px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, bottom: 5, left: 0, right: 0}}>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: tokens.colors.borderLight, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={allZero ? tokens.colors.borderLight : color} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser } = useContext(UserContext);

  const BUSINESS_META = {
    "crane-hiring": { name: "Crane Hire Services", icon: Settings },
    finance: { name: "Finance", icon: DollarSign },
    "barber-salon": { name: "Barber Salons", icon: Users },
    "food-stall": { name: "Food Stalls", icon: Calendar },
  };

  const titleize = (s) =>
    s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    partialPayments: 0,
    sentInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
    totalAmountDue: 0,
    sparklines: {},
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);

  const fyOptions = useMemo(() => generateFYOptions(), []);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clientsRes, invoicesRes] = await Promise.all([
        axios.get(`${BASE_URL}/users/clients`, { withCredentials: true }),
        axios.get(`${BASE_URL}/invoices`, { withCredentials: true }),
      ]);

      const clientsData = clientsRes.data || {};
      const clients = Array.isArray(clientsData) ? clientsData : (Array.isArray(clientsData.clients) ? clientsData.clients : []);
      
      const invoicesData = invoicesRes.data || [];
      const invoices = Array.isArray(invoicesData) ? invoicesData : (Array.isArray(invoicesData.invoices) ? invoicesData.invoices : (Array.isArray(invoicesData.data) ? invoicesData.data : []));

      setAllInvoices(invoices);
      setAllClients(clients);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recompute stats whenever FY selection or raw data changes
  useEffect(() => {
    if (allInvoices.length === 0 && allClients.length === 0) return;

    const invoices = filterInvoicesByFY(allInvoices, selectedFY);
    setInvoiceData(invoices);

    // Calculate comprehensive stats
    const totalRevenue = invoices.reduce((sum, inv) => {
      if (inv.status === "paid") {
        return sum + inv.totalAmount;
      } else if (inv.status === "partial") {
        return sum + inv.amountPaid;
      }
      return sum;
    }, 0);

    const totalAmountDue = invoices.reduce((sum, inv) => {
      if (inv.status === "sent" || inv.status === "overdue" || inv.status === "partial") {
        return sum + inv.amountDue;
      }
      return sum;
    }, 0);

    const sentInvoices = invoices.filter(inv => inv.status === "sent").length;
    const pendingInvoices = invoices.filter(inv => inv.status === "sent" || inv.status === "overdue").length;
    const partialPayments = invoices.filter(inv => inv.status === "partial").length;
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue").length;
    const draftInvoices = invoices.filter(inv => inv.status === "draft").length;

    // Count unique clients in this FY's invoices
    const uniqueClientIds = new Set(invoices.map(inv => inv.client?._id || inv.client).filter(Boolean));

    setStats({
      totalClients: uniqueClientIds.size,
      totalInvoices: invoices.length,
      totalRevenue,
      pendingInvoices,
      partialPayments,
      sentInvoices,
      overdueInvoices,
      draftInvoices,
      totalAmountDue,
      sparklines: {
        totalInvoices: calculateSparklineData(invoices, 'totalInvoices'),
        totalRevenue: calculateSparklineData(invoices, 'totalRevenue'),
        amountDue: calculateSparklineData(invoices, 'amountDue'),
        sentInvoices: calculateSparklineData(invoices, 'sentInvoices'),
        overdueInvoices: calculateSparklineData(invoices, 'overdueInvoices'),
        partialPayments: calculateSparklineData(invoices, 'partialPayments'),
        draftInvoices: calculateSparklineData(invoices, 'draftInvoices'),
      }
    });

    // Show recent invoices (all statuses except draft)
    const recentInvoicesArr = invoices
      .filter((inv) => inv.status !== "draft")
      .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
      .slice(0, 6);

    setRecentInvoices(recentInvoicesArr);
  }, [allInvoices, allClients, selectedFY]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid": return CheckCircle;
      case "sent": return Clock;
      case "overdue": return AlertTriangle;
      case "partial": return CreditCard;
      default: return FileText;
    }
  };

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      accentText: tokens.colors.accent,
      accentBg: "#EFF6FF",
      link: "/clients",
      sparklineData: null,
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices,
      icon: FileText,
      accentText: tokens.colors.success,
      accentBg: "#ECFDF5",
      link: "/invoices",
      sparklineData: stats.sparklines.totalInvoices,
    },
    {
      title: "Total Revenue",
      value: `Rs. ${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      accentText: tokens.colors.warning,
      accentBg: "#FFFBEB",
      link: "/invoices",
      sparklineData: stats.sparklines.totalRevenue,
    },
    {
      title: "Amount Due",
      value: `Rs. ${stats.totalAmountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      accentText: tokens.colors.danger,
      accentBg: "#FEF2F2",
      link: "/invoices",
      sparklineData: stats.sparklines.amountDue,
    },
    {
      title: "Sent Invoices",
      value: stats.sentInvoices,
      icon: FileText,
      accentText: "#6366F1",
      accentBg: "#EEF2FF",
      link: "/invoices",
      sparklineData: stats.sparklines.sentInvoices,
    },
    {
      title: "Overdue",
      value: stats.overdueInvoices,
      icon: AlertTriangle,
      accentText: tokens.colors.danger,
      accentBg: "#FEF2F2",
      link: "/invoices",
      sparklineData: stats.sparklines.overdueInvoices,
    },
    {
      title: "Partial",
      value: stats.partialPayments,
      icon: CreditCard,
      accentText: "#EA580C",
      accentBg: "#FFF7ED",
      link: "/invoices",
      sparklineData: stats.sparklines.partialPayments,
    },
    {
      title: "Drafts",
      value: stats.draftInvoices,
      icon: FileText,
      accentText: tokens.colors.textSecondary,
      accentBg: "#F3F4F6",
      link: "/invoices",
      sparklineData: stats.sparklines.draftInvoices,
    },
  ];

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: tokens.colors.bgCanvas }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: tokens.colors.accent }}></div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: tokens.colors.bgCanvas, minHeight: "100vh", padding: `${tokens.spacing.xl} 0`, fontFamily: "'Inter', 'SF Pro Text', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: tokens.spacing.lg }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700", color: tokens.colors.textPrimary, lineHeight: "40px", letterSpacing: "-0.02em", margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "16px", color: tokens.colors.textSecondary, marginTop: "4px" }}>
              Welcome to your billing dashboard
            </p>
          </div>
          <div className="mt-4 sm:mt-0" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
            <Link
              to="/invoices/create"
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-1" />
              Create Invoice
            </Link>

            {/* Financial Year Filter */}
            <div style={{ position: "relative" }}>
              <button
                id="fy-filter-btn"
                onClick={() => setFyDropdownOpen((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  backgroundColor: tokens.colors.bgSurface,
                  border: `1px solid ${tokens.colors.borderLight}`,
                  borderRadius: tokens.radii.card,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: tokens.colors.textPrimary,
                  cursor: "pointer",
                  boxShadow: tokens.shadows.soft,
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tokens.colors.accent;
                  e.currentTarget.style.boxShadow = tokens.shadows.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tokens.colors.borderLight;
                  e.currentTarget.style.boxShadow = tokens.shadows.soft;
                }}
              >
                <Calendar className="h-4 w-4" style={{ color: tokens.colors.accent, flexShrink: 0 }} />
                <span>FY {selectedFY}</span>
                <ChevronDown className="h-4 w-4" style={{ color: tokens.colors.textSecondary, flexShrink: 0, transform: fyDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }} />
              </button>

              {fyDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown on outside click */}
                  <div
                    onClick={() => setFyDropdownOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      zIndex: 50,
                      backgroundColor: tokens.colors.bgSurface,
                      border: `1px solid ${tokens.colors.borderLight}`,
                      borderRadius: tokens.radii.card,
                      boxShadow: tokens.shadows.hover,
                      minWidth: "170px",
                      padding: "4px",
                      maxHeight: "260px",
                      overflowY: "auto",
                    }}
                  >
                    {fyOptions.map((fy) => (
                      <button
                        key={fy}
                        onClick={() => {
                          setSelectedFY(fy);
                          setFyDropdownOpen(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          fontSize: "14px",
                          fontWeight: selectedFY === fy ? "700" : "500",
                          color: selectedFY === fy ? tokens.colors.accent : tokens.colors.textPrimary,
                          backgroundColor: selectedFY === fy ? "#EFF6FF" : "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "background-color 100ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedFY !== fy) e.currentTarget.style.backgroundColor = "#F3F4F6";
                        }}
                        onMouseLeave={(e) => {
                          if (selectedFY !== fy) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        FY {fy}
                        {fy === getCurrentFY() && (
                          <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: "600", color: tokens.colors.success, backgroundColor: "#ECFDF5", padding: "2px 8px", borderRadius: "9999px" }}>
                            Current
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards Grid - Responsive: 1 column on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" style={{ marginBottom: tokens.spacing.xl }}>
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const valStr = String(card.value);
            const dynamicFontSize = valStr.length >= 15 ? "clamp(18px, 3vw, 24px)" : valStr.length >= 11 ? "clamp(24px, 4vw, 32px)" : "clamp(28px, 5vw, 42px)";

            return (
              <Link
                key={index}
                to={card.link}
                className="app-card"
                style={{
                  padding: tokens.spacing.lg,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  outline: "none",
                }}
                tabIndex={0}
              >
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: "15px", fontWeight: "600", color: tokens.colors.textSecondary, marginBottom: "6px" }}>
                        {card.title}
                      </p>
                      <p style={{ 
                        fontWeight: "700", 
                        color: tokens.colors.textPrimary, 
                        lineHeight: "1.2",
                        fontSize: dynamicFontSize,
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                        letterSpacing: "-0.02em"
                      }}>
                        {card.value}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: card.accentBg,
                        color: card.accentText,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginLeft: tokens.spacing.sm,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  {card.sparklineData && (
                    <Sparkline data={card.sparklineData} color={card.accentText} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Unified Chart */}
        <div style={{ marginBottom: tokens.spacing.xl }}>
          <div
            className="app-card"
            style={{
              padding: "1.5rem",
            }}
          >
            <UnifiedChart data={invoiceData} />
            <div style={{ marginTop: tokens.spacing.md, backgroundColor: "#EEF2FF", borderRadius: "8px", padding: "12px 16px" }}>
              <p style={{ fontSize: "13px", color: tokens.colors.accent, margin: 0 }}>
                💡 <strong>Insight:</strong> Manage your billing trends. Use the controls above to explore ranges and data views.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md }}>
              Recent Activity
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.sm }}>
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  let pillColors = { bg: "#F3F4F6", text: "#6B7280" };
                  if (invoice.status === "paid") pillColors = { bg: "#ECFDF5", text: "#10B981" };
                  else if (invoice.status === "sent") pillColors = { bg: "#EFF6FF", text: "#0071E3" };
                  else if (invoice.status === "overdue") pillColors = { bg: "#FEF2F2", text: "#DC2626" };
                  else if (invoice.status === "partial") pillColors = { bg: "#FFFBEB", text: "#F59E0B" };

                  return (
                    <div
                      key={invoice._id}
                      className="app-card"
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: tokens.spacing.md, flex: 1, minWidth: 0 }}>
                        <div className="hidden sm:flex" style={{ backgroundColor: pillColors.bg, color: pillColors.text, borderRadius: "50%", width: "40px", height: "40px", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 style={{ fontSize: "15px", fontWeight: "600", color: tokens.colors.textPrimary, margin: 0 }}>
                              {invoice.invoiceNumber}
                            </h3>
                            <span
                              className={`badge ${invoice.status === 'paid' ? 'badge-paid' : invoice.status === 'overdue' ? 'badge-overdue' : invoice.status === 'sent' ? 'badge-active' : ''}`}
                              style={invoice.status === 'partial' || invoice.status === 'draft' ? {
                                backgroundColor: pillColors.bg,
                                color: pillColors.text,
                                border: 'none'
                              } : {}}
                              aria-label={`Status: ${invoice.status}`}
                            >
                              {invoice.status}
                            </span>
                          </div>
                          <p style={{ fontSize: "13px", color: tokens.colors.textSecondary, margin: 0 }}>
                            {invoice.client?.companyName || "Unknown Client"} 
                            {(invoice.status === 'partial' || invoice.status === 'sent' || invoice.status === 'overdue') && invoice.amountDue && (
                              <span style={{ marginLeft: "8px", color: invoice.status === 'overdue' ? tokens.colors.danger : tokens.colors.textSecondary }}>
                                • Due: Rs. {invoice.amountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", paddingLeft: tokens.spacing.md, flexShrink: 0 }}>
                        <p style={{ fontSize: "16px", fontWeight: "600", color: tokens.colors.textPrimary, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                          Rs. {invoice.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", backgroundColor: tokens.colors.bgSurface, borderRadius: tokens.radii.card, border: `1px solid ${tokens.colors.borderLight}` }}>
                  <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p style={{ color: tokens.colors.textSecondary, fontSize: "14px" }}>No recent activity</p>
                </div>
              )}

              <Link
                to="/invoices"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px",
                  color: tokens.colors.textSecondary,
                  fontSize: "14px",
                  fontWeight: "500",
                  textDecoration: "none",
                  backgroundColor: "transparent",
                  borderRadius: "8px",
                  transition: "color 150ms ease, background-color 150ms ease",
                  marginTop: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)";
                  e.currentTarget.style.color = tokens.colors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = tokens.colors.textSecondary;
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${tokens.colors.accent}`;
                  e.currentTarget.style.outlineOffset = "2px";
                }}
                onBlur={(e) => e.currentTarget.style.outline = "none"}
              >
                View all invoices &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column Content */}
          <div>
            <div style={{ marginBottom: tokens.spacing.xl }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md }}>
                Snapshot Summary
              </h2>
              <div className="app-card" style={{ padding: tokens.spacing.lg }}>
                <SummaryPie data={invoiceData} />
              </div>
            </div>

            {/* Business Types Panel */}
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md }}>
                Business Modules
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.sm }}>
                {(Array.isArray(currentUser?.businessType) ? currentUser.businessType : []).map((type) => {
                  const meta = BUSINESS_META[type] || { name: titleize(type), icon: Settings };
                  const Icon = meta.icon;
                  return (
                    <div
                      key={type}
                      className="app-card"
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: tokens.spacing.md,
                      }}
                    >
                      <div style={{ backgroundColor: "#F3F4F6", color: "#6B7280", borderRadius: "10px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: "600", color: tokens.colors.textPrimary, margin: 0 }}>
                          {meta.name}
                        </h3>
                        <p style={{ fontSize: "12px", color: tokens.colors.textSecondary, margin: "2px 0 0 0" }}>
                          Active module
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;