import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { tokens } from './tokens';

const InvoiceStatusChart = ({ data, dateRange = 12 }) => {
  const [visibleSeries, setVisibleSeries] = useState({
    paid: true,
    overdue: true,
    sent: false,
    partial: false,
    draft: false
  });

  const chartData = useMemo(() => {
    // Generate buckets for the last `dateRange` months
    const now = new Date();
    const result = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYearStr = d.toLocaleString("default", { month: "short", year: "numeric" });
      result.push({
        monthYear: monthYearStr,
        sortKey: `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`,
        paid: 0, sent: 0, partial: 0, overdue: 0, draft: 0, total: 0
      });
    }

    // Populate data
    data.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      const key = `${invDate.getFullYear()}-${String(invDate.getMonth()).padStart(2, '0')}`;
      const bucket = result.find(b => b.sortKey === key);
      
      if (bucket) {
        bucket.total += 1;
        if (inv.status === 'paid') bucket.paid += 1;
        else if (inv.status === 'sent') bucket.sent += 1;
        else if (inv.status === 'partial') bucket.partial += 1;
        else if (inv.status === 'overdue') bucket.overdue += 1;
        else if (inv.status === 'draft') bucket.draft += 1;
      }
    });

    return result;
  }, [data, dateRange]);

  const handleLegendClick = (e, seriesKey) => {
    if (e.shiftKey) {
      // Isolate
      setVisibleSeries({
        paid: seriesKey === 'paid',
        sent: seriesKey === 'sent',
        partial: seriesKey === 'partial',
        overdue: seriesKey === 'overdue',
        draft: seriesKey === 'draft',
      });
    } else {
      // Toggle
      setVisibleSeries(prev => ({ ...prev, [seriesKey]: !prev[seriesKey] }));
    }
  };

  const handleLegendKeyDown = (e, seriesKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLegendClick(e, seriesKey);
    }
  };

  const renderCustomLegend = () => {
    const items = [
      { key: 'paid', label: 'Paid', color: tokens.colors.success },
      { key: 'overdue', label: 'Overdue', color: tokens.colors.danger },
      { key: 'sent', label: 'Sent', color: tokens.colors.sent },
      { key: 'partial', label: 'Partial', color: tokens.colors.warning, dash: true },
      { key: 'draft', label: 'Draft', color: tokens.colors.draft, dash: true },
    ];

    return (
      <div style={{ padding: '0 16px', marginTop: '16px' }}>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px", fontSize: "13px", fontWeight: 500, color: tokens.colors.textSecondary }}>
          {items.map((item) => {
            const isActive = visibleSeries[item.key];
            return (
              <div 
                key={item.key}
                role="button"
                tabIndex={0}
                style={{ 
                  display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", 
                  opacity: isActive ? 1 : 0.4, transition: "opacity 150ms ease",
                  outline: "none" 
                }}
                onClick={(e) => handleLegendClick(e, item.key)}
                onKeyDown={(e) => handleLegendKeyDown(e, item.key)}
                onFocus={(e) => e.target.style.outline = `2px solid ${tokens.colors.accent}`}
                onBlur={(e) => e.target.style.outline = "none"}
                aria-pressed={isActive}
              >
                <div style={{ 
                  width: "12px", height: "4px", borderRadius: "2px", 
                  backgroundColor: item.color,
                  border: item.dash ? `1px dashed ${item.color}` : 'none'
                }} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", fontSize: "11px", color: tokens.colors.borderLight, marginTop: "8px" }}>
          <span style={{color: tokens.colors.textSecondary}}>Click to toggle; Shift+Click to isolate</span>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div 
          aria-live="polite"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(8px)', 
            border: `1px solid ${tokens.colors.borderLight}`, 
            borderRadius: tokens.radii.card, 
            padding: tokens.spacing.md, 
            boxShadow: tokens.shadows.hover, 
            minWidth: "200px" 
          }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: tokens.colors.textPrimary, borderBottom: `1px solid ${tokens.colors.borderLight}`, paddingBottom: "8px", marginBottom: "8px", margin: 0 }}>
            {label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {visibleSeries.paid && <div className="flex justify-between text-sm"><span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colors.textSecondary }}><span style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.colors.success}}></span>Paid</span><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{d.paid}</span></div>}
            {visibleSeries.overdue && <div className="flex justify-between text-sm"><span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colors.textSecondary }}><span style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.colors.danger}}></span>Overdue</span><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{d.overdue}</span></div>}
            {visibleSeries.sent && <div className="flex justify-between text-sm"><span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colors.textSecondary }}><span style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.colors.sent}}></span>Sent</span><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{d.sent}</span></div>}
            {visibleSeries.partial && <div className="flex justify-between text-sm"><span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colors.textSecondary }}><span style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.colors.warning}}></span>Partial</span><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{d.partial}</span></div>}
            {visibleSeries.draft && <div className="flex justify-between text-sm"><span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colors.textSecondary }}><span style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.colors.draft}}></span>Draft</span><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{d.draft}</span></div>}
            
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${tokens.colors.borderLight}`, paddingTop: "8px", marginTop: "4px", fontSize: "14px", fontWeight: 600, color: tokens.colors.textPrimary }}>
              <span>Total Invoices</span><span>{d.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.colors.borderLight} />
          <XAxis 
            dataKey="monthYear" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: tokens.colors.textSecondary }} 
            dy={10} 
            angle={-45} 
            textAnchor="end"
            height={60}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: tokens.colors.textSecondary }} 
            dx={-10}
            allowDecimals={false}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: tokens.colors.borderLight, strokeWidth: 1, strokeDasharray: "3 3" }} 
            isAnimationActive={false}
          />
          <Legend content={renderCustomLegend} verticalAlign="top" />

          {visibleSeries.paid && <Line type="monotone" dataKey="paid" stroke={tokens.colors.success} strokeWidth={3} strokeLinecap="round" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />}
          {visibleSeries.overdue && <Line type="monotone" dataKey="overdue" stroke={tokens.colors.danger} strokeWidth={3} strokeLinecap="round" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />}
          {visibleSeries.sent && <Line type="monotone" dataKey="sent" stroke={tokens.colors.sent} strokeWidth={3} strokeLinecap="round" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />}
          {visibleSeries.partial && <Line type="monotone" dataKey="partial" stroke={tokens.colors.warning} strokeWidth={3} strokeLinecap="round" strokeDasharray="5 5" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />}
          {visibleSeries.draft && <Line type="monotone" dataKey="draft" stroke={tokens.colors.draft} strokeWidth={3} strokeLinecap="round" strokeDasharray="5 5" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />}
        </LineChart>
      </ResponsiveContainer>

      {/* Accessibility Table */}
      <table className="sr-only">
        <caption>Invoice counts per month by status</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Paid</th>
            <th>Overdue</th>
            <th>Sent</th>
            <th>Partial</th>
            <th>Draft</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map(d => (
            <tr key={d.monthYear}>
              <td>{d.monthYear}</td>
              <td>{d.paid}</td>
              <td>{d.overdue}</td>
              <td>{d.sent}</td>
              <td>{d.partial}</td>
              <td>{d.draft}</td>
              <td>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceStatusChart;
