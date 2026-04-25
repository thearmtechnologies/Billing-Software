import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppleDataTable from '../components/AppleDataTable';
import axios from 'axios';
import * as XLSX from "xlsx";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
axios.defaults.withCredentials = true;

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#111827" },
  subtitle: { fontSize: 11, color: "#4B5563", marginBottom: 3 },
  table: { display: "flex", flexDirection: "column", width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#E5E7EB", borderBottomWidth: 0, borderRightWidth: 0 },
  tableRow: { display: "flex", flexDirection: "row" },
  tableColHeader: { borderStyle: "solid", borderWidth: 1, borderColor: "#E5E7EB", borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: "#F9FAFB", padding: 6 },
  tableCol: { borderStyle: "solid", borderWidth: 1, borderColor: "#E5E7EB", borderLeftWidth: 0, borderTopWidth: 0, padding: 6, minHeight: 24 },
  tableCellHeader: { fontWeight: "bold", fontSize: 10, color: "#111827" },
  tableCell: { fontSize: 9, color: "#374151" }
});

const LedgerPDF = ({ clientInfo, ledgerData }) => {
  const totalBilled = ledgerData.reduce((acc, curr) => acc + curr.debit, 0);
  const totalPaid = ledgerData.reduce((acc, curr) => acc + curr.credit, 0);
  const currentBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{clientInfo?.name || "Client Ledger"}</Text>
        {clientInfo?.phone && <Text style={styles.subtitle}>{clientInfo.phone}</Text>}
        {clientInfo?.email && <Text style={styles.subtitle}>{clientInfo.email}</Text>}
      </View>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, width: '12%'}}><Text style={styles.tableCellHeader}>Date</Text></View>
          <View style={{...styles.tableColHeader, width: '14%'}}><Text style={styles.tableCellHeader}>Type</Text></View>
          <View style={{...styles.tableColHeader, width: '28%'}}><Text style={styles.tableCellHeader}>Description</Text></View>
          <View style={{...styles.tableColHeader, width: '12%'}}><Text style={styles.tableCellHeader}>Reference</Text></View>
          <View style={{...styles.tableColHeader, width: '11%'}}><Text style={styles.tableCellHeader}>Debit (Rs. )</Text></View>
          <View style={{...styles.tableColHeader, width: '11%'}}><Text style={styles.tableCellHeader}>Credit (Rs. )</Text></View>
          <View style={{...styles.tableColHeader, width: '12%'}}><Text style={styles.tableCellHeader}>Balance (Rs. )</Text></View>
        </View>
        {ledgerData.map((row, i) => (
          <View style={styles.tableRow} key={i}>
            <View style={{...styles.tableCol, width: '12%'}}><Text style={styles.tableCell}>{new Date(row.date).toLocaleDateString("en-GB")}</Text></View>
            <View style={{...styles.tableCol, width: '14%'}}><Text style={styles.tableCell}>{row.type}</Text></View>
            <View style={{...styles.tableCol, width: '28%'}}><Text style={styles.tableCell}>{row.description}</Text></View>
            <View style={{...styles.tableCol, width: '12%'}}><Text style={styles.tableCell}>{row.reference || "-"}</Text></View>
            <View style={{...styles.tableCol, width: '11%'}}><Text style={styles.tableCell}>{row.debit > 0 ? row.debit.toFixed(2) : "-"}</Text></View>
            <View style={{...styles.tableCol, width: '11%'}}><Text style={styles.tableCell}>{row.credit > 0 ? row.credit.toFixed(2) : "-"}</Text></View>
            <View style={{...styles.tableCol, width: '12%'}}><Text style={styles.tableCell}>{row.balance.toFixed(2)}</Text></View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 20, padding: 15, borderStyle: "solid", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 4, width: '40%', alignSelf: 'flex-end', backgroundColor: "#F9FAFB" }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#4B5563" }}>Total Billed</Text>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#111827" }}>Rs. {totalBilled.toFixed(2)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#059669" }}>Total Received</Text>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#059669" }}>Rs. {totalPaid.toFixed(2)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderColor: "#E5E7EB" }}>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#111827" }}>Balance Due</Text>
          <Text style={{ fontSize: 12, fontWeight: "bold", color: "#E11D48" }}>Rs. {currentBalance.toFixed(2)}</Text>
        </View>
      </View>

    </Page>
  </Document>
  );
};

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ClientLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ledgerData, setLedgerData] = useState([]);
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/users/client/${id}/ledger`);
      setLedgerData(response.data.ledger);
      setClientInfo(response.data.client);
    } catch (error) {
      toast.error('Failed to fetch ledger details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    setIsExportModalOpen(true);
  };

  const handleExportExcel = () => {
    const data = ledgerData.map(row => ({
      Date: new Date(row.date).toLocaleDateString('en-GB'),
      Type: row.type,
      Description: row.description,
      Reference: row.reference || '-',
      'Debit (Rs. )': row.debit > 0 ? row.debit : null,
      'Credit (Rs. )': row.credit > 0 ? row.credit : null,
      'Balance (Rs. )': row.balance
    }));

    const totalBilled = ledgerData.reduce((acc, curr) => acc + curr.debit, 0);
    const totalPaid = ledgerData.reduce((acc, curr) => acc + curr.credit, 0);
    const currentBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;

    data.push({});
    data.push({
      Date: '',
      Type: '',
      Description: 'SUMMARY',
      Reference: '',
      'Debit (Rs. )': '',
      'Credit (Rs. )': '',
      'Balance (Rs. )': ''
    });
    data.push({
      Date: '',
      Type: '',
      Description: 'Total Billed',
      Reference: '',
      'Debit (Rs. )': '',
      'Credit (Rs. )': '',
      'Balance (Rs. )': totalBilled
    });
    data.push({
      Date: '',
      Type: '',
      Description: 'Total Received',
      Reference: '',
      'Debit (Rs. )': '',
      'Credit (Rs. )': '',
      'Balance (Rs. )': totalPaid
    });
    data.push({
      Date: '',
      Type: '',
      Description: 'Balance Due',
      Reference: '',
      'Debit (Rs. )': '',
      'Credit (Rs. )': '',
      'Balance (Rs. )': currentBalance
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Client Ledger");
    XLSX.writeFile(workbook, `${clientInfo?.name || "Client"}_Ledger.xlsx`);
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "excel") {
        handleExportExcel();
      } else {
        const blob = await pdf(<LedgerPDF clientInfo={clientInfo} ledgerData={ledgerData} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${clientInfo?.name || "Client"}_Ledger.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`Ledger exported as ${exportFormat.toUpperCase()}`);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export ledger");
    } finally {
      setIsExporting(false);
    }
  };

  const ledgerColumns = [
    {
      key: 'date',
      label: 'Date',
      width: '12%',
      render: (row) => <span className="text-gray-900 font-medium whitespace-nowrap">{new Date(row.date).toLocaleDateString('en-GB')}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      width: '14%',
      render: (row) => (
        <span 
          className={`text-xs font-medium rounded-full whitespace-nowrap ${row.type === 'Invoice Generated' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
          style={{ padding: "4px 8px", display: "inline-block" }}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      width: '30%',
      render: (row) => (
        <div 
          className="text-gray-600 text-sm whitespace-normal" 
          style={{ maxWidth: '100%', wordWrap: 'break-word', minWidth: '150px' }}
        >
          {row.description}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Ref / Mode',
      width: '14%',
      render: (row) => (
        <div 
          className="font-mono text-xs bg-gray-100 rounded inline-block truncate" 
          style={{ maxWidth: '100%', padding: "4px 8px" }}
          title={row.reference || '-'}
        >
          {row.reference || '-'}
        </div>
      ),
    },
    {
      key: 'debit',
      label: 'Debit (Rs. )',
      width: '10%',
      align: 'right',
      render: (row) => row.debit > 0 ? <span className="text-gray-900 font-medium whitespace-nowrap">{row.debit.toFixed(2)}</span> : <span className="text-gray-400">-</span>,
    },
    {
      key: 'credit',
      label: 'Credit (Rs. )',
      width: '10%',
      align: 'right',
      render: (row) => row.credit > 0 ? <span className="text-gray-900 font-medium whitespace-nowrap">{row.credit.toFixed(2)}</span> : <span className="text-gray-400">-</span>,
    },
    {
      key: 'balance',
      label: 'Balance (Rs. )',
      width: '10%',
      align: 'right',
      render: (row) => <span className="font-bold text-gray-900 whitespace-nowrap">{row.balance.toFixed(2)}</span>,
    },
  ];

  const totalBilled = ledgerData.reduce((acc, curr) => acc + curr.debit, 0);
  const totalPaid = ledgerData.reduce((acc, curr) => acc + curr.credit, 0);
  const currentBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "400px",
        padding: "32px 24px"
      }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 style={{ 
            width: "48px", 
            height: "48px", 
            color: "#3B82F6", 
            margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: "#6B7280", fontSize: "14px" }}>Loading ledger data...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl print-container" style={{ padding: "32px 24px" }}>
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between print-hidden"
        style={{ marginBottom: "32px", gap: "16px" }}
      >
        <div className="flex items-center" style={{ gap: "16px" }}>
          <button 
            onClick={() => navigate('/clients')} 
            className="bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm flex items-center justify-center"
            style={{ padding: "8px", width: "40px", height: "40px", cursor: "pointer" }}
            aria-label="Back to Clients"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight leading-tight">
              {clientInfo ? clientInfo.name : 'Client Ledger'}
            </h1>
            <p className="text-base text-gray-500" style={{ marginTop: "4px" }}>
              {clientInfo ? (
                <>
                  {clientInfo.phone || 'No Phone'}
                  {clientInfo.panNumber && ` • PAN: ${clientInfo.panNumber}`}
                </>
              ) : 'Loading details...'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ padding: "8px 16px", gap: "8px", height: "40px", cursor: "pointer" }}
        >
          <Download className="w-4 h-4" />
          Print / Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3" 
        style={{ gap: "24px", marginBottom: "32px" }}
      >
        {/* Total Billed */}
        <div 
          className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center transition-transform hover:-translate-y-1 duration-300 print:shadow-none print:border-gray-200 print:rounded-none"
          style={{ padding: "24px", gap: "20px" }}
        >
          <div 
            className="rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 print:hidden"
            style={{ width: "56px", height: "56px" }}
          >
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500" style={{ marginBottom: "4px" }}>Total Billed</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight print:text-xl">
              Rs. {totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        {/* Total Received */}
        <div 
          className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center transition-transform hover:-translate-y-1 duration-300 print:shadow-none print:border-gray-200 print:rounded-none"
          style={{ padding: "24px", gap: "20px" }}
        >
          <div 
            className="rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 print:hidden"
            style={{ width: "56px", height: "56px" }}
          >
            <TrendingDown className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500" style={{ marginBottom: "4px" }}>Total Received</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight print:text-xl">
              Rs. {totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Balance Due */}
        <div 
          className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center transition-transform hover:-translate-y-1 duration-300 print:bg-white print:shadow-none print:border-gray-200 print:rounded-none"
          style={{ padding: "24px", gap: "20px" }}
        >
          <div 
            className={`rounded-full flex items-center justify-center flex-shrink-0 print:hidden ${currentBalance > 0 ? 'bg-rose-50' : 'bg-gray-100'}`}
            style={{ width: "56px", height: "56px" }}
          >
            <Wallet className={`w-6 h-6 ${currentBalance > 0 ? 'text-rose-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500" style={{ marginBottom: "4px" }}>Balance Due</p>
            <p className={`text-2xl lg:text-3xl font-bold tracking-tight print:text-xl ${currentBalance > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              Rs. {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-1">
            <AppleDataTable
            columns={ledgerColumns}
            data={ledgerData}
            loading={loading}
            rowKey={(row) => (row.paymentId || row.invoiceId) + row.type + row.date}
            defaultSortKey="date"
            defaultSortDir="asc"
            emptyIcon={<BookOpen size={48} />}
            emptyTitle="No transactions yet"
            emptySubtitle="This client does not have any invoices or payments recorded."
            />
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ padding: "16px" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isExporting) {
              setIsExportModalOpen(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200"
            style={{ padding: "24px", border: "1px solid #f3f4f6" }}
          >
            <h3 
              className="text-2xl font-bold text-gray-900 tracking-tight"
              style={{ marginBottom: "20px" }}
            >
              Export Ledger As
            </h3>
            
            <div 
              className="flex flex-col" 
              style={{ marginBottom: "24px", gap: "12px" }}
            >
              <label 
                className={`flex items-center border rounded-2xl cursor-pointer transition-all duration-200 group ${exportFormat === "pdf" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50/50"} ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ padding: "16px" }}
              >
                <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="exportFormat" 
                    value="pdf" 
                    checked={exportFormat === "pdf"} 
                    onChange={() => !isExporting && setExportFormat("pdf")} 
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    disabled={isExporting}
                  />
                </div>
                <span 
                  className={`font-semibold tracking-tight transition-colors ${exportFormat === "pdf" ? "text-blue-900" : "text-gray-700 group-hover:text-gray-900"}`}
                  style={{ marginLeft: "12px" }}
                >
                  PDF Document
                </span>
                {exportFormat === "pdf" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </label>

              <label 
                className={`flex items-center border rounded-2xl cursor-pointer transition-all duration-200 group ${exportFormat === "excel" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50/50"} ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ padding: "16px" }}
              >
                <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="exportFormat" 
                    value="excel" 
                    checked={exportFormat === "excel"} 
                    onChange={() => !isExporting && setExportFormat("excel")} 
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    disabled={isExporting}
                  />
                </div>
                <span 
                  className={`font-semibold tracking-tight transition-colors ${exportFormat === "excel" ? "text-blue-900" : "text-gray-700 group-hover:text-gray-900"}`}
                  style={{ marginLeft: "12px" }}
                >
                  Excel (.xlsx)
                </span>
                {exportFormat === "excel" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </label>
            </div>

            <div className="flex justify-end" style={{ gap: "12px" }}>
              <button 
                onClick={() => !isExporting && setIsExportModalOpen(false)} 
                className="text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                style={{ padding: "10px 20px", cursor: isExporting ? "not-allowed" : "pointer", opacity: isExporting ? 0.5 : 1 }}
                disabled={isExporting}
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteExport} 
                disabled={isExporting}
                className="text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                style={{ 
                  padding: "10px 24px", 
                  gap: "8px", 
                  cursor: isExporting ? "not-allowed" : "pointer",
                  opacity: isExporting ? 0.7 : 1
                }}
              >
                {isExporting ? (
                  <>
                    <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.8s linear infinite" }} />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClientLedger;