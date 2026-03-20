import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from './tokens';

const SummaryPie = ({ data }) => {
  const pieData = useMemo(() => {
    let paid = 0, sent = 0, partial = 0, overdue = 0, draft = 0;
    data.forEach(inv => {
      if (inv.status === 'paid') paid++;
      else if (inv.status === 'sent') sent++;
      else if (inv.status === 'partial') partial++;
      else if (inv.status === 'overdue') overdue++;
      else if (inv.status === 'draft') draft++;
    });

    return [
      { name: 'Paid', value: paid, color: tokens.colors.success },
      { name: 'Sent', value: sent, color: tokens.colors.sent },
      { name: 'Partial', value: partial, color: tokens.colors.warning },
      { name: 'Overdue', value: overdue, color: tokens.colors.danger },
      { name: 'Draft', value: draft, color: tokens.colors.draft },
    ].filter(item => item.value > 0);
  }, [data]);

  const totalInvoices = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${tokens.colors.borderLight}`,
          borderRadius: tokens.radii.card,
          padding: '12px',
          boxShadow: tokens.shadows.hover,
          fontSize: '14px',
          fontWeight: 500,
          color: tokens.colors.textPrimary
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }}></span>
            <span>{d.name}:</span>
            <span style={{ fontWeight: 600 }}>{d.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="600">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>;
  }

  return (
    <div style={{ width: '100%', height: '240px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <div style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontWeight: 500 }}>Total</div>
        <div style={{ fontSize: '20px', color: tokens.colors.textPrimary, fontWeight: 700 }}>{totalInvoices}</div>
      </div>
    </div>
  );
};

export default SummaryPie;
