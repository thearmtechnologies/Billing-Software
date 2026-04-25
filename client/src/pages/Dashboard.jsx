import React, { useState, useEffect, useContext } from "react";
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
} from "lucide-react";
import axios from "axios";
import { UserContext } from "../context/userContext";
import UnifiedChart from "../components/UnifiedChart";
import SummaryPie from "../components/SummaryPie";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { tokens } from "../components/tokens";

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
  const [invoiceData, setInvoiceData] = useState([]);

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

      setStats({
        totalClients: clients.clients?.length || clients.length || 0,
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid": return CheckCircle;
      case "sent": return Clock;
      case "overdue": return AlertTriangle;
      case "partial": return CreditCard;
      default: return FileText;
    }
  };

  // Format value with proper sizing
  const formatCardValue = (card) => {
    if (typeof card.value === 'number') {
      if (card.title === "Total Revenue" || card.title === "Amount Due") {
        return `₹ ${card.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      }
      return card.value.toLocaleString('en-IN');
    }
    return card.value;
  };

  // Determine font size based on value length
  const getValueFontSize = (value, title) => {
    const stringValue = String(value);
    const length = stringValue.length;
    
    if (title === "Total Revenue" || title === "Amount Due") {
      if (length > 15) return "18px";
      if (length > 12) return "20px";
      if (length > 10) return "24px";
      return "28px";
    }
    
    // For numbers
    if (length > 6) return "24px";
    if (length > 4) return "28px";
    return "32px";
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
      value: stats.totalRevenue,
      icon: DollarSign,
      accentText: tokens.colors.warning,
      accentBg: "#FFFBEB",
      link: "/invoices",
      sparklineData: stats.sparklines.totalRevenue,
    },
    {
      title: "Amount Due",
      value: stats.totalAmountDue,
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
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          minHeight: "100vh",
          backgroundColor: tokens.colors.bgCanvas
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div 
            style={{ 
              width: "40px", 
              height: "40px", 
              border: `3px solid ${tokens.colors.borderLight}`,
              borderTopColor: tokens.colors.accent,
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin 0.8s linear infinite"
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ marginTop: "12px", color: tokens.colors.textSecondary, fontSize: "14px" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: tokens.colors.bgCanvas, 
      minHeight: "100vh", 
      padding: "20px 16px 40px",
      fontFamily: "'Inter', 'SF Pro Text', sans-serif"
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ 
                fontSize: "28px", 
                fontWeight: "700", 
                color: tokens.colors.textPrimary, 
                lineHeight: "1.2", 
                letterSpacing: "-0.02em", 
                margin: 0 
              }}>
                Dashboard
              </h1>
              <p style={{ 
                fontSize: "14px", 
                color: tokens.colors.textSecondary, 
                marginTop: "4px" 
              }}>
                Welcome back to your billing dashboard
              </p>
            </div>
            <Link
              to="/invoices/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                backgroundColor: tokens.colors.accent,
                color: "white",
                borderRadius: "10px",
                fontWeight: "500",
                fontSize: "14px",
                textDecoration: "none",
                transition: "all 150ms ease",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#005bb5";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.accent;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Plus style={{ width: "18px", height: "18px" }} />
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "16px",
          marginBottom: "28px"
        }}>
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const displayValue = formatCardValue(card);
            const fontSize = getValueFontSize(displayValue, card.title);
            
            return (
              <Link
                key={index}
                to={card.link}
                style={{
                  padding: "18px",
                  backgroundColor: "white",
                  borderRadius: "16px",
                  border: `1px solid ${tokens.colors.borderLight}`,
                  textDecoration: "none",
                  display: "block",
                  transition: "all 200ms ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = tokens.colors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = tokens.colors.borderLight;
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: "13px", 
                      fontWeight: "600", 
                      color: tokens.colors.textSecondary, 
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {card.title}
                    </p>
                    <p style={{ 
                      fontWeight: "700", 
                      color: tokens.colors.textPrimary, 
                      fontSize: fontSize,
                      lineHeight: "1.2",
                      margin: 0,
                      wordBreak: "break-word"
                    }}>
                      {displayValue}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: card.accentBg,
                      color: card.accentText,
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: "12px"
                    }}
                  >
                    <Icon style={{ width: "20px", height: "20px" }} />
                  </div>
                </div>
                {card.sparklineData && (
                  <Sparkline data={card.sparklineData} color={card.accentText} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Unified Chart */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              border: `1px solid ${tokens.colors.borderLight}`,
              padding: "20px",
              transition: "all 200ms ease"
            }}
          >
            <UnifiedChart data={invoiceData} />
            <div style={{ 
              marginTop: "16px", 
              backgroundColor: "#EEF2FF", 
              borderRadius: "10px", 
              padding: "12px 16px" 
            }}>
              <p style={{ 
                fontSize: "13px", 
                color: tokens.colors.accent, 
                margin: 0,
                lineHeight: "1.4"
              }}>
                💡 <strong>Insight:</strong> Track your billing trends. Use the controls above to explore different time ranges and data views.
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr",
          gap: "28px"
        }}>
          {/* Recent Activity */}
          <div>
            <h2 style={{ 
              fontSize: "20px", 
              fontWeight: "600", 
              color: tokens.colors.textPrimary, 
              marginBottom: "16px" 
            }}>
              Recent Activity
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      style={{
                        backgroundColor: "white",
                        borderRadius: "14px",
                        border: `1px solid ${tokens.colors.borderLight}`,
                        padding: "16px",
                        transition: "all 150ms ease"
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        alignItems: "flex-start", 
                        justifyContent: "space-between", 
                        flexWrap: "wrap", 
                        gap: "12px" 
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            backgroundColor: pillColors.bg, 
                            borderRadius: "10px", 
                            width: "36px", 
                            height: "36px", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            flexShrink: 0 
                          }}>
                            <StatusIcon style={{ width: "18px", height: "18px", color: pillColors.text }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                              <h3 style={{ 
                                fontSize: "15px", 
                                fontWeight: "600", 
                                color: tokens.colors.textPrimary, 
                                margin: 0 
                              }}>
                                {invoice.invoiceNumber}
                              </h3>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                padding: "3px 8px",
                                borderRadius: "20px",
                                backgroundColor: pillColors.bg,
                                color: pillColors.text,
                                textTransform: "capitalize"
                              }}>
                                {invoice.status}
                              </span>
                            </div>
                            <p style={{ 
                              fontSize: "13px", 
                              color: tokens.colors.textSecondary, 
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {invoice.client?.companyName || "Unknown Client"}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ 
                            fontSize: "16px", 
                            fontWeight: "600", 
                            color: tokens.colors.textPrimary, 
                            margin: 0,
                            fontVariantNumeric: "tabular-nums"
                          }}>
                            ₹ {invoice.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                          {(invoice.status === 'partial' || invoice.status === 'sent' || invoice.status === 'overdue') && invoice.amountDue > 0 && (
                            <p style={{ 
                              fontSize: "11px", 
                              color: invoice.status === 'overdue' ? tokens.colors.danger : tokens.colors.textSecondary, 
                              margin: "4px 0 0 0"
                            }}>
                              Due: ₹ {invoice.amountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "48px 20px", 
                  backgroundColor: "white", 
                  borderRadius: "16px", 
                  border: `1px solid ${tokens.colors.borderLight}` 
                }}>
                  <FileText style={{ width: "48px", height: "48px", color: "#9CA3AF", margin: "0 auto 12px" }} />
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
                  borderRadius: "10px",
                  transition: "all 150ms ease",
                  marginTop: "4px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                  e.currentTarget.style.color = tokens.colors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = tokens.colors.textSecondary;
                }}
              >
                View all invoices →
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Snapshot Summary */}
            <div>
              <h2 style={{ 
                fontSize: "20px", 
                fontWeight: "600", 
                color: tokens.colors.textPrimary, 
                marginBottom: "16px" 
              }}>
                Invoice Summary
              </h2>
              <div style={{
                backgroundColor: "white",
                borderRadius: "16px",
                border: `1px solid ${tokens.colors.borderLight}`,
                padding: "20px"
              }}>
                <SummaryPie data={invoiceData} />
              </div>
            </div>

            {/* Business Modules */}
            {Array.isArray(currentUser?.businessType) && currentUser.businessType.length > 0 && (
              <div>
                <h2 style={{ 
                  fontSize: "20px", 
                  fontWeight: "600", 
                  color: tokens.colors.textPrimary, 
                  marginBottom: "16px" 
                }}>
                  Business Modules
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(currentUser.businessType || []).map((type) => {
                    const meta = BUSINESS_META[type] || { name: titleize(type), icon: Settings };
                    const Icon = meta.icon;
                    return (
                      <div
                        key={type}
                        style={{
                          backgroundColor: "white",
                          borderRadius: "14px",
                          border: `1px solid ${tokens.colors.borderLight}`,
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          transition: "all 150ms ease"
                        }}
                      >
                        <div style={{ 
                          backgroundColor: "#F3F4F6", 
                          borderRadius: "10px", 
                          width: "40px", 
                          height: "40px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Icon style={{ width: "20px", height: "20px", color: "#6B7280" }} />
                        </div>
                        <div>
                          <h3 style={{ 
                            fontSize: "14px", 
                            fontWeight: "600", 
                            color: tokens.colors.textPrimary, 
                            margin: 0 
                          }}>
                            {meta.name}
                          </h3>
                          <p style={{ 
                            fontSize: "12px", 
                            color: tokens.colors.textSecondary, 
                            margin: "2px 0 0 0" 
                          }}>
                            Active module
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;