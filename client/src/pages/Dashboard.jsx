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
  Receipt,
  Wallet,
  Building2,
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
  const month = now.getMonth();
  const year = now.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const generateFYOptions = () => {
  const today = new Date();
  const options = ["All"];
  const startFrom = 2022;
  const currentYear = today.getFullYear();
  
  for (let year = currentYear; year >= startFrom; year--) {
    const fyStart = new Date(year, 3, 1);
    if (today >= fyStart) {
      options.push(`${year}-${year + 1}`);
    }
  }
  return options;
};

const getFYDateRange = (fyString) => {
  if (fyString === "All") return null;
  const [startYear] = fyString.split("-").map(Number);
  return {
    from: new Date(`${startYear}-04-01T00:00:00.000Z`),
    to: new Date(`${startYear + 1}-03-31T23:59:59.999Z`),
  };
};

const filterInvoicesByFY = (invoices, fyString) => {
  if (fyString === "All") return invoices;
  const { from, to } = getFYDateRange(fyString);
  return invoices.filter((inv) => {
    const d = new Date(inv.invoiceDate);
    return d >= from && d <= to;
  });
};

const calculateSparklineData = (invoices, metricType) => {
  if (!invoices || invoices.length === 0) return [];
  
  let endDate = new Date();
  if (invoices.length > 0) {
    const maxTime = Math.max(...invoices.map(inv => new Date(inv.invoiceDate).getTime()));
    if (!isNaN(maxTime)) {
      endDate = new Date(maxTime);
    }
  }

  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
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
      if (metricType === 'totalInvoiceValue') bucket.value += inv.totalAmount;
      else if (metricType === 'amountReceived') {
        if (inv.status === 'paid') bucket.value += inv.totalAmount;
        else if (inv.status === 'partial') bucket.value += inv.amountPaid;
      }
      else if (metricType === 'amountDue') {
        if (inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial') bucket.value += inv.amountDue;
      }
      else if (metricType === 'overdueAmount') {
        if (inv.status === 'overdue') bucket.value += inv.amountDue;
      }
    }
  });

  return result;
};

const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return <div style={{ height: "36px", marginTop: "8px" }} />;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const allZero = max === 0 && min === 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.98)', 
          border: `1px solid #E2E8F0`, 
          padding: "4px 8px", 
          borderRadius: "8px", 
          fontSize: "11px", 
          color: "#0F172A", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", 
          fontWeight: 500 
        }}>
          {payload[0].payload.monthYear}: <b>{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: "36px", width: "100%", marginTop: "8px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={allZero ? "#E2E8F0" : color} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 3.5, fill: color, stroke: "#fff", strokeWidth: 2 }}
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
    totalInvoiceValue: 0,
    amountReceived: 0,
    amountDue: 0,
    overdueAmount: 0,
    fullyPaid: 0,
    partiallyPaid: 0,
    unpaidInvoices: 0,
    sentInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
    sparklines: {},
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [selectedFY, setSelectedFY] = useState("All");
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    if (allInvoices.length === 0 && allClients.length === 0) return;

    const invoices = filterInvoicesByFY(allInvoices, selectedFY);
    setInvoiceData(invoices);

    // Financial metrics
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const amountReceived = invoices.reduce((sum, inv) => {
      if (inv.status === "paid") return sum + inv.totalAmount;
      else if (inv.status === "partial") return sum + inv.amountPaid;
      return sum;
    }, 0);
    
    const amountDue = invoices.reduce((sum, inv) => {
      if (inv.status === "sent" || inv.status === "overdue" || inv.status === "partial") return sum + inv.amountDue;
      return sum;
    }, 0);
    
    const overdueAmount = invoices.reduce((sum, inv) => {
      if (inv.status === "overdue") return sum + inv.amountDue;
      return sum;
    }, 0);

    // Operational metrics
    const fullyPaid = invoices.filter(inv => inv.status === "paid").length;
    const partiallyPaid = invoices.filter(inv => inv.status === "partial").length;
    const unpaidInvoices = invoices.filter(inv => inv.status === "sent").length;
    const sentInvoices = invoices.filter(inv => inv.status === "sent").length;
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue").length;
    const draftInvoices = invoices.filter(inv => inv.status === "draft").length;
    const totalClientsCount = allClients.length;

    setStats({
      totalClients: totalClientsCount,
      totalInvoices: invoices.length,
      totalInvoiceValue,
      amountReceived,
      amountDue,
      overdueAmount,
      fullyPaid,
      partiallyPaid,
      unpaidInvoices,
      sentInvoices,
      overdueInvoices,
      draftInvoices,
      sparklines: {
        totalInvoiceValue: calculateSparklineData(invoices, 'totalInvoiceValue'),
        amountReceived: calculateSparklineData(invoices, 'amountReceived'),
        amountDue: calculateSparklineData(invoices, 'amountDue'),
        overdueAmount: calculateSparklineData(invoices, 'overdueAmount'),
      }
    });

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

  const formatCurrency = (value) => {
    return `₹ ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatNumber = (value) => {
    return value.toLocaleString('en-IN');
  };

  // Check if mobile view
  const isMobile = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#F8FAFC" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `3px solid #E2E8F0`, borderTopColor: "#3B82F6", borderRadius: "50%", margin: "0 auto", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: "12px", color: "#64748B", fontSize: "14px" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Financial cards configuration
  const financialCards = [
    { 
      title: "Total Invoice Value", 
      value: stats.totalInvoiceValue, 
      icon: Receipt, 
      helperText: "Total value of all invoices",
      colorScheme: { bg: "#EFF6FF", icon: "#3B82F6", gradient: "linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)", sparkline: "#3B82F6" },
      format: formatCurrency
    },
    { 
      title: "Amount Received", 
      value: stats.amountReceived, 
      icon: Wallet, 
      helperText: "Collected payments",
      colorScheme: { bg: "#ECFDF5", icon: "#10B981", gradient: "linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)", sparkline: "#10B981" },
      format: formatCurrency
    },
    { 
      title: "Amount Due", 
      value: stats.amountDue, 
      icon: TrendingUp, 
      helperText: "Pending payments",
      colorScheme: { bg: "#FFFBEB", icon: "#F59E0B", gradient: "linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)", sparkline: "#F59E0B" },
      format: formatCurrency
    },
    { 
      title: "Overdue Amount", 
      value: stats.overdueAmount, 
      icon: AlertTriangle, 
      helperText: "Past due invoices",
      colorScheme: { bg: "#FEF2F2", icon: "#EF4444", gradient: "linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 100%)", sparkline: "#EF4444" },
      format: formatCurrency
    },
  ];

  // Operational cards configuration - Added Unpaid Invoices
  const operationalCards = [
    { title: "Total Clients", value: stats.totalClients, icon: Building2, format: formatNumber },
    { title: "Invoices", value: stats.totalInvoices, icon: FileText, format: formatNumber },
    { title: "Unpaid Invoices", value: stats.unpaidInvoices, icon: Clock, format: formatNumber },
    { title: "Fully Paid", value: stats.fullyPaid, icon: CheckCircle, format: formatNumber },
    { title: "Partially Paid", value: stats.partiallyPaid, icon: CreditCard, format: formatNumber },
    { title: "Drafts", value: stats.draftInvoices, icon: FileText, format: formatNumber },
  ];

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Header - Fully Responsive */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "16px", 
          marginBottom: "24px", 
          paddingTop: "8px"
        }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", lineHeight: "32px", letterSpacing: "-0.02em", margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
              Welcome back to your billing dashboard
            </p>
          </div>
          
          {/* Action Buttons Row - Responsive */}
          <div style={{ 
            display: "flex", 
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <Link 
              to="/invoices/create" 
              className="btn-primary"
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                padding: "10px 16px", 
                color: "white", 
                borderRadius: "12px", 
                fontWeight: "500", 
                fontSize: "14px", 
                textDecoration: "none",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
            >
              <Plus size={16} />
              Create Invoice
            </Link>

            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setFyDropdownOpen(!fyDropdownOpen)} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  padding: "8px 14px", 
                  backgroundColor: "white", 
                  border: `1px solid #E2E8F0`, 
                  borderRadius: "12px", 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  color: "#1E293B", 
                  cursor: "pointer", 
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                <Calendar size={14} color="#3B82F6" />
                <span>{selectedFY === "All" ? "All Time" : `FY ${selectedFY}`}</span>
                <ChevronDown size={12} style={{ transform: fyDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
              </button>
              {fyDropdownOpen && (
                <>
                  <div onClick={() => setFyDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{ 
                    position: "absolute", 
                    right: 0, 
                    top: "calc(100% + 8px)", 
                    zIndex: 50, 
                    backgroundColor: "white", 
                    border: `1px solid #E2E8F0`, 
                    borderRadius: "12px", 
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", 
                    minWidth: "160px", 
                    padding: "6px" 
                  }}>
                    {fyOptions.map((fy) => (
                      <button 
                        key={fy} 
                        onClick={() => { setSelectedFY(fy); setFyDropdownOpen(false); }} 
                        style={{ 
                          display: "block", 
                          width: "100%", 
                          textAlign: "left", 
                          padding: "8px 12px", 
                          fontSize: "12px", 
                          fontWeight: selectedFY === fy ? "600" : "500", 
                          color: selectedFY === fy ? "#3B82F6" : "#334155", 
                          backgroundColor: selectedFY === fy ? "#EFF6FF" : "transparent", 
                          border: "none", 
                          borderRadius: "8px", 
                          cursor: "pointer"
                        }}
                      >
                        {fy === "All" ? "All Time" : `FY ${fy}`}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Financial Cards Section - Responsive Grid */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ marginBottom: "12px", paddingLeft: "4px" }}>
            <h2 style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B", marginBottom: "2px" }}>Financial Overview</h2>
            <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Key revenue and payment metrics</p>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "16px"
          }}>
            {financialCards.map((card, index) => {
              const Icon = card.icon;
              const displayValue = card.format(card.value);
              const mobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
              
              return (
                <div 
                  key={index}
                  style={{ 
                    background: card.colorScheme.gradient,
                    borderRadius: "20px",
                    border: "1px solid rgba(226, 232, 240, 0.6)",
                    padding: "16px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                  }}
                  onMouseEnter={(e) => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 20px 25px -12px rgba(0,0,0,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px", letterSpacing: "-0.01em" }}>{card.title}</p>
                      <p style={{ 
                        fontWeight: "700", 
                        color: "#0F172A", 
                        fontSize: mobile ? "20px" : "24px",
                        lineHeight: 1.2, 
                        margin: 0, 
                        letterSpacing: "-0.02em",
                        wordBreak: "break-word"
                      }}>{displayValue}</p>
                      <p style={{ fontSize: "11px", color: "#64748B", marginTop: "6px", fontWeight: "450" }}>{card.helperText}</p>
                    </div>
                    <div style={{ 
                      backgroundColor: card.colorScheme.bg, 
                      padding: "8px", 
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: "12px"
                    }}>
                      <Icon size={18} style={{ color: card.colorScheme.icon }} />
                    </div>
                  </div>
                  {stats.sparklines[card.title === "Total Invoice Value" ? "totalInvoiceValue" : 
                                    card.title === "Amount Received" ? "amountReceived" :
                                    card.title === "Amount Due" ? "amountDue" : "overdueAmount"] && 
                    <Sparkline 
                      data={stats.sparklines[card.title === "Total Invoice Value" ? "totalInvoiceValue" : 
                                              card.title === "Amount Received" ? "amountReceived" :
                                              card.title === "Amount Due" ? "amountDue" : "overdueAmount"]} 
                      color={card.colorScheme.sparkline} 
                    />
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Cards Section - Responsive with Unpaid Invoices */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ marginBottom: "12px", paddingLeft: "4px" }}>
            <h2 style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B", marginBottom: "2px" }}>Operational Metrics</h2>
            <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Invoice and client activity</p>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "10px"
          }}>
            {operationalCards.map((card, index) => {
              const Icon = card.icon;
              const displayValue = card.format(card.value);
              
              return (
                <div 
                  key={index}
                  style={{ 
                    background: "white",
                    borderRadius: "14px",
                    border: "1px solid #EFF2F6",
                    padding: "12px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                  }}
                  onMouseEnter={(e) => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#EFF2F6";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: "500", color: "#64748B", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{card.title}</p>
                      <p style={{ fontWeight: "700", color: "#1E293B", fontSize: "20px", lineHeight: 1.2, margin: 0 }}>{displayValue}</p>
                    </div>
                    <div style={{ 
                      backgroundColor: "#F8FAFC", 
                      padding: "6px", 
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Icon size={14} style={{ color: "#94A3B8" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Section - Responsive */}
        <div style={{ marginBottom: "24px", overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "20px", 
            border: "1px solid #EFF2F6",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            minWidth: "280px"
          }}>
            <UnifiedChart data={invoiceData} />
          </div>
        </div>

        {/* Recent Activity and Summary - Responsive Stacking */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "24px"
        }}>
          {/* Recent Activity */}
          <div style={{ width: "100%" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0F172A", marginBottom: "16px" }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentInvoices.length === 0 ? (
                <div style={{ 
                  padding: "32px", 
                  textAlign: "center", 
                  backgroundColor: "white", 
                  borderRadius: "16px",
                  border: "1px solid #EFF2F6",
                  color: "#64748B",
                  fontSize: "14px"
                }}>
                  No recent invoices
                </div>
              ) : (
                recentInvoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  let colors = { bg: "#F1F5F9", text: "#475569", label: "Draft" };
                  if (invoice.status === "paid") colors = { bg: "#ECFDF5", text: "#10B981", label: "Paid" };
                  else if (invoice.status === "sent") colors = { bg: "#EFF6FF", text: "#3B82F6", label: "Sent" };
                  else if (invoice.status === "overdue") colors = { bg: "#FEF2F2", text: "#EF4444", label: "Overdue" };
                  else if (invoice.status === "partial") colors = { bg: "#FFFBEB", text: "#F59E0B", label: "Partial" };

                  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 500;

                  return (
                    <div 
                      key={invoice._id} 
                      style={{ 
                        padding: "14px", 
                        backgroundColor: "white", 
                        borderRadius: "14px", 
                        border: "1px solid #EFF2F6", 
                        display: "flex", 
                        flexDirection: isSmallScreen ? "column" : "row",
                        justifyContent: "space-between", 
                        alignItems: isSmallScreen ? "flex-start" : "center",
                        gap: isSmallScreen ? "12px" : "0",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ backgroundColor: colors.bg, padding: "8px", borderRadius: "10px" }}>
                          <StatusIcon size={16} color={colors.text} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#0F172A" }}>{invoice.invoiceNumber}</h3>
                            <span style={{ fontSize: "10px", fontWeight: "600", backgroundColor: colors.bg, color: colors.text, padding: "2px 8px", borderRadius: "20px" }}>{colors.label}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#64748B", margin: "4px 0 0 0" }}>{invoice.client?.companyName || "Unknown Client"}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: isSmallScreen ? "left" : "right", marginLeft: isSmallScreen ? "36px" : "0" }}>
                        <p style={{ fontWeight: "600", margin: 0, color: "#0F172A", fontSize: "14px" }}>₹ {invoice.totalAmount.toLocaleString('en-IN')}</p>
                        {invoice.amountDue > 0 && <p style={{ fontSize: "10px", color: "#EF4444", margin: "2px 0 0 0", fontWeight: "500" }}>Due: ₹ {invoice.amountDue.toLocaleString('en-IN')}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary and Modules */}
          <div style={{ width: "100%" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0F172A", marginBottom: "16px" }}>Summary</h2>
              <div style={{ 
                backgroundColor: "white", 
                borderRadius: "20px", 
                border: "1px solid #EFF2F6",
                padding: "16px"
              }}>
                <SummaryPie data={invoiceData} />
              </div>
            </div>
            
            {currentUser?.businessType?.length > 0 && (
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0F172A", marginBottom: "16px" }}>Modules</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {currentUser.businessType.map((type) => {
                    const meta = BUSINESS_META[type] || { name: titleize(type), icon: Settings };
                    const Icon = meta.icon;
                    return (
                      <div 
                        key={type} 
                        style={{ 
                          padding: "12px 16px", 
                          backgroundColor: "white", 
                          borderRadius: "14px", 
                          border: "1px solid #EFF2F6", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px"
                        }}
                      >
                        <div style={{ backgroundColor: "#F8FAFC", padding: "8px", borderRadius: "10px" }}>
                          <Icon size={16} color="#64748B" />
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#1E293B" }}>{meta.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;