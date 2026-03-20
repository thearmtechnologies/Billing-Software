import React, { useMemo, useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { tokens } from './tokens';

const RevenueChart = ({ data, dateRange = 12, viewType = 'all' }) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYearStr = d.toLocaleString("default", { month: "short", year: "numeric" });
      result.push({
        monthYear: monthYearStr,
        sortKey: `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`,
        collected: 0, pending: 0, total: 0
      });
    }

    data.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      const key = `${invDate.getFullYear()}-${String(invDate.getMonth()).padStart(2, '0')}`;
      const bucket = result.find(b => b.sortKey === key);
      
      if (bucket) {
        if (inv.status === 'paid') {
          bucket.collected += inv.totalAmount;
          bucket.total += inv.totalAmount;
        } else if (inv.status === 'partial') {
          bucket.collected += inv.amountPaid;
          bucket.pending += inv.amountDue;
          bucket.total += inv.totalAmount;
        } else if (inv.status === 'sent' || inv.status === 'overdue') {
          bucket.pending += inv.amountDue;
          bucket.total += inv.totalAmount; // Some might consider total = amountDue if not paid
        }
      }
    });

    return result;
  }, [data, dateRange]);

  const scalingInfo = useMemo(() => {
    if (chartData.length === 0) return { needsScaling: false };
    const maxTotal = Math.max(...chartData.map(d => d.total));
    const maxPending = Math.max(...chartData.map(d => d.pending));
    const needsScaling = maxPending > 0 && (maxTotal / maxPending) > 10;
    return { needsScaling };
  }, [chartData]);

  const [inactiveSeries, setInactiveSeries] = useState({
    total: false,
    collected: false,
    pending: false
  });

  const toggleSeries = (key) => setInactiveSeries(p => ({ ...p, [key]: !p[key] }));

  const renderCustomLegend = () => {
    const items = [
      { key: 'total', label: 'Total Revenue', color: '#EEF2FF', border: '#C7D2FE' },
      { key: 'collected', label: 'Collected', color: tokens.colors.success },
      { key: 'pending', label: 'Pending', color: tokens.colors.warning, dash: true },
    ].filter(item => {
      if (viewType === 'bar' && item.key !== 'total') return false; // Or only show total in bar view? Spec says switch to line only or bar only.
      if (viewType === 'line' && item.key === 'total') return false;
      return true;
    });

    return (
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px", marginTop: "16px", fontSize: "13px", fontWeight: 500, color: tokens.colors.textSecondary }}>
        {items.map((item) => {
          const isActive = !inactiveSeries[item.key];
          return (
            <div 
              key={item.key} 
              style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", opacity: isActive ? 1 : 0.4, transition: "opacity 150ms ease" }}
              onClick={() => toggleSeries(item.key)}
            >
              <div style={{ 
                width: "12px", height: "12px", borderRadius: "2px", 
                backgroundColor: item.color,
                border: item.border ? `1px solid ${item.border}` : `1px solid ${item.color}`
              }} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(8px)', 
          border: `1px solid ${tokens.colors.borderLight}`, 
          borderRadius: tokens.radii.card, 
          padding: tokens.spacing.md, 
          boxShadow: tokens.shadows.hover, 
          minWidth: "220px" 
        }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: tokens.colors.textPrimary, borderBottom: `1px solid ${tokens.colors.borderLight}`, paddingBottom: "8px", marginBottom: "8px", margin: 0 }}>
            {label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
            {!inactiveSeries.collected && (viewType === 'all' || viewType === 'line') && (
              <div className="flex justify-between">
                <span style={{ color: tokens.colors.success, fontWeight: 500 }}>Collected</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tokens.colors.textPrimary }}>
                  Rs. {d.collected.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {!inactiveSeries.pending && (viewType === 'all' || viewType === 'line') && (
              <div className="flex justify-between">
                <span style={{ color: tokens.colors.warning, fontWeight: 500 }}>Pending</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tokens.colors.textPrimary }}>
                  Rs. {d.pending.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {!inactiveSeries.total && (viewType === 'all' || viewType === 'bar') && (
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: (viewType === 'all' ? `1px solid ${tokens.colors.borderLight}` : 'none'), paddingTop: (viewType === 'all' ? "8px" : "0"), marginTop: (viewType === 'all' ? "4px" : "0"), fontWeight: 600, color: "#8B5CF6" }}>
                <span>Total Revenue</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>Rs. {d.total.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const showBar = viewType === 'all' || viewType === 'bar';
  const showLine = viewType === 'all' || viewType === 'line';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: scalingInfo.needsScaling ? 20 : 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.colors.borderLight} />
          <XAxis 
            dataKey="monthYear" 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            tick={{ fontSize: 12, fill: tokens.colors.textSecondary }} 
            axisLine={false} 
            tickLine={false} 
            dy={10} 
          />
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 12, fill: tokens.colors.textSecondary }} 
            tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`} 
            axisLine={false} 
            tickLine={false} 
            dx={-10} 
          />
          {scalingInfo.needsScaling && showLine && (
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 12, fill: tokens.colors.textSecondary }} 
              tickFormatter={(v) => `Rs. ${v > 1000 ? (v/1000).toFixed(1) + 'k' : v.toFixed(0)}`} 
              axisLine={false} 
              tickLine={false} 
              dx={10} 
            />
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} isAnimationActive={false} />
          <Legend content={renderCustomLegend} verticalAlign="top" />

          {showBar && !inactiveSeries.total && (
            <Bar yAxisId="left" dataKey="total" fill="#EEF2FF" stroke="#C7D2FE" radius={[4, 4, 0, 0]} maxBarSize={50} isAnimationActive={false} />
          )}

          {showLine && !inactiveSeries.collected && (
            <Line yAxisId="left" type="monotone" dataKey="collected" stroke={tokens.colors.success} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
          )}

          {showLine && !inactiveSeries.pending && (
            <Line yAxisId={scalingInfo.needsScaling ? "right" : "left"} type="monotone" dataKey="pending" stroke={tokens.colors.warning} strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;