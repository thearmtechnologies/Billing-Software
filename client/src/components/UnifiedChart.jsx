import React, { useState, useRef } from "react";
import InvoiceStatusChart from "./InvoiceStatusChart";
import RevenueChart from "./RevenueChart";
import { Download, FileImage, FileText, Image as ImageIcon } from "lucide-react";
import { tokens } from "./tokens";

const UnifiedChart = ({ data }) => {
  const [dataView, setDataView] = useState("status");
  const [dateRange, setDateRange] = useState(12); // 3, 6, 12
  const [viewType, setViewType] = useState("all"); // 'all', 'bar', 'line'
  const [showExportOptions, setShowExportOptions] = useState(false);
  const chartWrapperRef = useRef(null);

  const exportAsSVG = () => {
    if (!chartWrapperRef.current) return;
    const svgNode = chartWrapperRef.current.querySelector('svg');
    if (!svgNode) return;

    // Clone node to add background and styling inline before export
    const svgClone = svgNode.cloneNode(true);
    // Force specific transparent background to white for export
    svgClone.style.backgroundColor = 'white';
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chart_${dataView}_${dateRange}m.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
  };

  const segmentContainerStyle = {
    display: "flex", 
    backgroundColor: "rgba(118, 118, 128, 0.12)", 
    borderRadius: "8px", 
    padding: "2px"
  };

  const getSegmentStyle = (isActive) => ({
    borderRadius: "6px", 
    fontSize: "13px", 
    padding: "4px 12px", 
    border: "none", 
    cursor: "pointer", 
    transition: "all 150ms ease",
    fontWeight: isActive ? 600 : 500,
    color: isActive ? tokens.colors.textPrimary : tokens.colors.textSecondary,
    backgroundColor: isActive ? tokens.colors.bgSurface : "transparent",
    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b" style={{ borderColor: tokens.colors.borderLight, marginBottom: tokens.spacing.lg }}>
        
        {/* Left: Primary Toggle */}
        <div style={segmentContainerStyle} className="mb-4 md:mb-0 w-max">
          <button
            onClick={() => setDataView("status")}
            style={getSegmentStyle(dataView === "status")}
          >
            Invoice Status
          </button>
          <button
            onClick={() => setDataView("revenue")}
            style={getSegmentStyle(dataView === "revenue")}
          >
            Revenue & Collections
          </button>
        </div>

        {/* Right: Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Revenue specific view type toggle */}
          {dataView === "revenue" && (
            <div style={segmentContainerStyle}>
              <button
                onClick={() => setViewType("all")}
                style={getSegmentStyle(viewType === "all")}
              >
                All
              </button>
              <button
                onClick={() => setViewType("bar")}
                style={getSegmentStyle(viewType === "bar")}
              >
                Bar
              </button>
              <button
                onClick={() => setViewType("line")}
                style={getSegmentStyle(viewType === "line")}
              >
                Line
              </button>
            </div>
          )}

          {/* Date Presets */}
          <div style={segmentContainerStyle}>
             <button
              onClick={() => setDateRange(3)}
              style={getSegmentStyle(dateRange === 3)}
            >
              3M
            </button>
            <button
              onClick={() => setDateRange(6)}
              style={getSegmentStyle(dateRange === 6)}
            >
              6M
            </button>
            <button
              onClick={() => setDateRange(12)}
              style={getSegmentStyle(dateRange === 12)}
            >
              12M
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "6px", border: `1px solid ${tokens.colors.borderLight}`,
                backgroundColor: tokens.colors.bgSurface, color: tokens.colors.textSecondary,
                fontSize: "13px", fontWeight: 500, cursor: "pointer"
              }}
            >
              <Download size={16} /> Export
            </button>

            {showExportOptions && (
              <div 
                style={{ 
                  position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 50,
                  backgroundColor: tokens.colors.bgSurface, border: `1px solid ${tokens.colors.borderLight}`,
                  borderRadius: tokens.radii.card, boxShadow: tokens.shadows.hover, minWidth: '140px',
                  padding: "4px"
                }}
              >
                <div 
                  role="button"
                  onClick={exportAsSVG}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '6px' }}
                  className="hover:bg-gray-50 text-gray-700"
                >
                  <FileImage size={16} className="text-gray-400" /> Export SVG
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <div style={{ height: "400px", width: "100%" }} ref={chartWrapperRef}>
        {dataView === "status" ? (
          <InvoiceStatusChart data={data} dateRange={dateRange} />
        ) : (
          <RevenueChart data={data} dateRange={dateRange} viewType={viewType} />
        )}
      </div>
    </div>
  );
};

export default UnifiedChart;