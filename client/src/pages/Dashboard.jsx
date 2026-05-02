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
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const generateFYOptions = () => {
  const today = new Date();
  const options = ["All"];
  const startFrom = 2022;
  const currentYear = today.getFullYear();
  
  for (let year = currentYear; year >= startFrom; year--) {
    const fyStart = new Date(year, 3, 1); // April = month 3
    if (today >= fyStart) {
      options.push(`${year}-${year + 1}`);
    }
  }
  return options;
};

const getFYDateRange = (fyString) => {
  const [startYear] = fyString.split("-").map(Number);
  return {
    from: new Date(`${startYear}-04-01T00:00:00.000Z`),
    to: new Date(`${startYear + 1}-03-31T23:59:59.999Z`),
  };
};

const filterInvoicesByFY = (invoices, fyString) => {
  if (fyString === "All") {
    console.log("Selected FY: All");
    console.log("Total invoices before filter:", invoices.length);
    console.log("Filtered invoices:", invoices.length);
    return invoices;
  }
  const { from, to } = getFYDateRange(fyString);
  const filtered = invoices.filter((inv) => {
    const d = new Date(inv.invoiceDate);
    return d >= from && d <= to;
  });
  
  console.log("Selected FY:", from, to);
  console.log("Total invoices before filter:", invoices.length);
  console.log("Filtered invoices:", filtered.length);
  
  return filtered;
};

const calculateSparklineData = (invoices, metricType) => {
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
  if (!data || data.length === 0) return <div style={{height: "40px", marginTop: "12px"}} />;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const allZero = max === 0 && min === 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: `1px solid ${tokens.colors.borderLight}`, padding: "4px 8px", borderRadius: "6px", fontSize: "11px", color: tokens.colors.textPrimary, boxShadow: tokens.shadows.soft }}>
          {payload[0].payload.monthYear}: <b>{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: "40px", width: "100%", marginTop: "12px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, bottom: 5, left: 0, right: 0}}>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: tokens.colors.borderLight, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={allZero ? tokens.colors.borderLight : color} 
            strokeWidth={1.5} 
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: "#fff", strokeWidth: 1.5 }}
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

  useEffect(() => {
    if (allInvoices.length === 0 && allClients.length === 0) return;

    const invoices = filterInvoicesByFY(allInvoices, selectedFY);
    setInvoiceData(invoices);

    const totalRevenue = invoices.reduce((sum, inv) => {
      if (inv.status === "paid") return sum + inv.totalAmount;
      else if (inv.status === "partial") return sum + inv.amountPaid;
      return sum;
    }, 0);

    const totalAmountDue = invoices.reduce((sum, inv) => {
      if (inv.status === "sent" || inv.status === "overdue" || inv.status === "partial") return sum + inv.amountDue;
      return sum;
    }, 0);

    const sentInvoices = invoices.filter(inv => inv.status === "sent").length;
    const pendingInvoices = invoices.filter(inv => inv.status === "sent" || inv.status === "overdue").length;
    const partialPayments = invoices.filter(inv => inv.status === "partial").length;
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue").length;
    const draftInvoices = invoices.filter(inv => inv.status === "draft").length;

    const uniqueClientIds = new Set(
      invoices
        .map((inv) => (typeof inv.client === "object" && inv.client ? inv.client._id : inv.client))
        .filter(Boolean)
    );
    const filteredClientsCount = uniqueClientIds.size;

    setStats({
      totalClients: filteredClientsCount,
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

  const formatCardValue = (card) => {
    if (typeof card.value === 'number') {
      if (card.title === "Total Revenue" || card.title === "Amount Due") {
        return `₹ ${card.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      }
      return card.value.toLocaleString('en-IN');
    }
    return card.value;
  };

  const getValueFontSize = (value, title) => {
    const stringValue = String(value);
    const length = stringValue.length;
    if (title === "Total Revenue" || title === "Amount Due") {
      if (length > 15) return "18px";
      if (length > 12) return "20px";
      if (length > 10) return "24px";
      return "28px";
    }
    if (length > 6) return "24px";
    if (length > 4) return "28px";
    return "32px";
  };

  const statCards = [
    { title: "Total Clients", value: stats.totalClients, icon: Users, accentText: tokens.colors.accent, accentBg: "#EFF6FF", link: "/clients", sparklineData: null },
    { title: "Total Invoices", value: stats.totalInvoices, icon: FileText, accentText: tokens.colors.success, accentBg: "#ECFDF5", link: "/invoices", sparklineData: stats.sparklines.totalInvoices },
    { title: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, accentText: tokens.colors.warning, accentBg: "#FFFBEB", link: "/invoices", sparklineData: stats.sparklines.totalRevenue },
    { title: "Amount Due", value: stats.totalAmountDue, icon: TrendingUp, accentText: tokens.colors.danger, accentBg: "#FEF2F2", link: "/invoices", sparklineData: stats.sparklines.amountDue },
    { title: "Sent Invoices", value: stats.sentInvoices, icon: FileText, accentText: "#6366F1", accentBg: "#EEF2FF", link: "/invoices", sparklineData: stats.sparklines.sentInvoices },
    { title: "Overdue", value: stats.overdueInvoices, icon: AlertTriangle, accentText: tokens.colors.danger, accentBg: "#FEF2F2", link: "/invoices", sparklineData: stats.sparklines.overdueInvoices },
    { title: "Partial", value: stats.partialPayments, icon: CreditCard, accentText: "#EA580C", accentBg: "#FFF7ED", link: "/invoices", sparklineData: stats.sparklines.partialPayments },
    { title: "Drafts", value: stats.draftInvoices, icon: FileText, accentText: tokens.colors.textSecondary, accentBg: "#F3F4F6", link: "/invoices", sparklineData: stats.sparklines.draftInvoices },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: tokens.colors.bgCanvas }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `3px solid ${tokens.colors.borderLight}`, borderTopColor: tokens.colors.accent, borderRadius: "50%", margin: "0 auto", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: "12px", color: tokens.colors.textSecondary, fontSize: "14px" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: tokens.colors.bgCanvas, minHeight: "100vh", padding: "20px 16px 40px", fontFamily: "'Inter', 'SF Pro Text', sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: "24px", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700", color: tokens.colors.textPrimary, lineHeight: "40px", letterSpacing: "-0.02em", margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "16px", color: tokens.colors.textSecondary, marginTop: "4px" }}>
              Welcome back to your billing dashboard
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/invoices/create" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", color: "white", borderRadius: "10px", fontWeight: "500", fontSize: "14px", textDecoration: "none" }}>
              <Plus style={{ width: "18px", height: "18px" }} />
              Create Invoice
            </Link>

            <div style={{ position: "relative" }}>
              <button onClick={() => setFyDropdownOpen(!fyDropdownOpen)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: tokens.colors.bgSurface, border: `1px solid ${tokens.colors.borderLight}`, borderRadius: tokens.radii.card, fontSize: "14px", fontWeight: "600", color: tokens.colors.textPrimary, cursor: "pointer", boxShadow: tokens.shadows.soft }}>
                <Calendar className="h-4 w-4" style={{ color: tokens.colors.accent }} />
                <span>{selectedFY === "All" ? "All Time" : `FY ${selectedFY}`}</span>
                <ChevronDown className="h-4 w-4" style={{ transform: fyDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
              </button>
              {fyDropdownOpen && (
                <>
                  <div onClick={() => setFyDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, backgroundColor: "white", border: `1px solid ${tokens.colors.borderLight}`, borderRadius: "12px", boxShadow: tokens.shadows.hover, minWidth: "170px", padding: "4px" }}>
                    {fyOptions.map((fy) => (
                      <button key={fy} onClick={() => { setSelectedFY(fy); setFyDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", fontSize: "14px", fontWeight: selectedFY === fy ? "700" : "500", color: selectedFY === fy ? tokens.colors.accent : tokens.colors.textPrimary, backgroundColor: selectedFY === fy ? "#EFF6FF" : "transparent", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                        {fy === "All" ? "All Time" : `FY ${fy}`} {fy === getCurrentFY() && <span style={{ marginLeft: "8px", fontSize: "11px", color: tokens.colors.success, backgroundColor: "#ECFDF5", padding: "2px 8px", borderRadius: "10px" }}>Current</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const displayValue = formatCardValue(card);
            const fontSize = getValueFontSize(displayValue, card.title);
            return (
              <Link key={index} to={card.link} className="app-card" style={{ padding: "18px", backgroundColor: "white", borderRadius: "16px", border: `1px solid ${tokens.colors.borderLight}`, textDecoration: "none", display: "block", transition: "transform 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: tokens.colors.textSecondary, marginBottom: "8px", textTransform: "uppercase" }}>{card.title}</p>
                    <p style={{ fontWeight: "700", color: tokens.colors.textPrimary, fontSize: fontSize, margin: 0 }}>{displayValue}</p>
                  </div>
                  <div style={{ backgroundColor: card.accentBg, color: card.accentText, width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: "20px", height: "20px" }} />
                  </div>
                </div>
                {card.sparklineData && <Sparkline data={card.sparklineData} color={card.accentText} />}
              </Link>
            );
          })}
        </div>

        {/* Charts and Activity */}
        <div style={{ marginBottom: "28px" }}>
          <div className="app-card" style={{ padding: "20px", backgroundColor: "white", borderRadius: "16px", border: `1px solid ${tokens.colors.borderLight}` }}>
            <UnifiedChart data={invoiceData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>Recent Activity</h2>
            <div className="flex flex-col gap-3">
              {recentInvoices.map((invoice) => {
                const StatusIcon = getStatusIcon(invoice.status);
                let colors = { bg: "#F3F4F6", text: "#6B7280" };
                if (invoice.status === "paid") colors = { bg: "#ECFDF5", text: "#10B981" };
                else if (invoice.status === "sent") colors = { bg: "#EFF6FF", text: "#0071E3" };
                else if (invoice.status === "overdue") colors = { bg: "#FEF2F2", text: "#DC2626" };

                return (
                  <div key={invoice._id} className="app-card" style={{ padding: "16px", backgroundColor: "white", borderRadius: "14px", border: `1px solid ${tokens.colors.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="flex items-center gap-3">
                      <div style={{ backgroundColor: colors.bg, padding: "8px", borderRadius: "10px" }}>
                        <StatusIcon style={{ width: "18px", height: "18px", color: colors.text }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>{invoice.invoiceNumber}</h3>
                          <span style={{ fontSize: "11px", backgroundColor: colors.bg, color: colors.text, padding: "2px 8px", borderRadius: "10px" }}>{invoice.status}</span>
                        </div>
                        <p style={{ fontSize: "13px", color: tokens.colors.textSecondary, margin: 0 }}>{invoice.client?.companyName || "Unknown Client"}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: "600", margin: 0 }}>₹ {invoice.totalAmount.toLocaleString('en-IN')}</p>
                      {invoice.amountDue > 0 && <p style={{ fontSize: "11px", color: tokens.colors.danger, margin: 0 }}>Due: ₹ {invoice.amountDue.toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>Summary</h2>
              <div className="app-card" style={{ padding: "20px", backgroundColor: "white", borderRadius: "16px", border: `1px solid ${tokens.colors.borderLight}` }}>
                <SummaryPie data={invoiceData} />
              </div>
            </div>
            
            {currentUser?.businessType?.length > 0 && (
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>Modules</h2>
                <div className="flex flex-col gap-2">
                  {currentUser.businessType.map((type) => {
                    const meta = BUSINESS_META[type] || { name: titleize(type), icon: Settings };
                    const Icon = meta.icon;
                    return (
                      <div key={type} className="app-card" style={{ padding: "14px", backgroundColor: "white", borderRadius: "12px", border: `1px solid ${tokens.colors.borderLight}`, display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ backgroundColor: "#F3F4F6", padding: "8px", borderRadius: "8px" }}><Icon size={18} /></div>
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>{meta.name}</span>
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