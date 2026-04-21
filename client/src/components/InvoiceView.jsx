import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Template1 from "../templates/Template1";
import Template2 from "../templates/Template2";
import Template3 from "../templates/Template3";
import Template4 from "../templates/Template4";
import TemplateSidebar from "./TemplateSidebar";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { numberToWords } from "../utils/numberToWords";
import { UserContext } from "../context/userContext";
import { pdf, PDFViewer, BlobProvider } from "@react-pdf/renderer";
import "../styles/invoice-print.css";
import Template5PDF from "../templates/Template5PDF";
import Template1PDF from "../templates/Template1PDF";
import Template2PDF from "../templates/Template2PDF";
import Template3PDF from "../templates/Template3PDF";
import Template4PDF from "../templates/Template4PDF";
import Template6PDF from "../templates/Template6PDF";
import Template7PDF from "../templates/Template7PDF";

const InvoiceView = () => {
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("Template1PDF");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const printRef = useRef(null);
  const [signatureBase64, setSignatureBase64] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pre-fetch signature image as base64 to avoid CORS issues with @react-pdf/renderer
  useEffect(() => {
    const fetchSignatureAsBase64 = async () => {
      const sigUrl = currentUser?.signatureUrl;
      if (!sigUrl) {
        setSignatureBase64(null);
        return;
      }
      try {
        const cacheBusterUrl = sigUrl + (sigUrl.includes('?') ? '&' : '?') + `cb=${new Date().getTime()}`;
        const response = await fetch(cacheBusterUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setSignatureBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to fetch signature image:", err);
      }
    };
    fetchSignatureAsBase64();
  }, [currentUser?.signatureUrl]);

  // Pre-fetch company logo as base64 to avoid CORS issues with @react-pdf/renderer
  useEffect(() => {
    const fetchLogoAsBase64 = async () => {
      const logoUrl = currentUser?.logoUrl;
      if (!logoUrl) {
        setLogoBase64(null);
        return;
      }
      try {
        const cacheBusterUrl = logoUrl + (logoUrl.includes('?') ? '&' : '?') + `cb=${new Date().getTime()}`;
        const response = await fetch(cacheBusterUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to fetch logo image:", err);
        setLogoBase64(null);
      }
    };
    fetchLogoAsBase64();
  }, [currentUser?.logoUrl]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/invoices/${id}`,
          { withCredentials: true }
        );
        setInvoiceData(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  // ── Vector PDF generation via @react-pdf/renderer ──
  const handleDownloadPdf = async () => {
    if (!invoiceData || !currentUser) return;

    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });

      const getPdfTemplate = () => {
        let safeTemplate = selectedTemplate;
        if (currentUser?.allowedTemplates) {
          if (currentUser.allowedTemplates.length > 0 && !currentUser.allowedTemplates.includes(safeTemplate)) {
            safeTemplate = currentUser.allowedTemplates[0];
          } else if (currentUser.allowedTemplates.length === 0) {
            safeTemplate = "Template1PDF";
          }
        }
        switch (safeTemplate) {
          case "Template2PDF":
            return <Template2PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
          case "Template3PDF":
            return <Template3PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
          case "Template4PDF":
            return <Template4PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
          case "Template5PDF":
            return <Template5PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
          case "Template6PDF":
            return <Template6PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
          case "Template7PDF":
            return <Template7PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
          case "Template1PDF":
          default:
            return <Template1PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
        }
      };

      const blob = await pdf(getPdfTemplate()).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceData.client?.companyName || "client"}_${invoiceData.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded!", { id: "pdf-gen" });
    } catch (error) {
      console.error("Vector PDF generation failed:", error);
      toast.error("PDF generation failed. Please try again.", { id: "pdf-gen" });
    }
  };

  const handlePrint = async () => {
    const isPDFTemplate = ["Template1PDF", "Template2PDF", "Template3PDF", "Template4PDF", "Template5PDF", "Template6PDF", "Template7PDF"].includes(selectedTemplate);
    if (isPDFTemplate) {
      try {
        toast.loading("Preparing print...", { id: "print-pdf" });
        const getPdfTemplate = () => {
          let safeTemplate = selectedTemplate;
          if (currentUser?.allowedTemplates) {
            if (currentUser.allowedTemplates.length > 0 && !currentUser.allowedTemplates.includes(safeTemplate)) {
              safeTemplate = currentUser.allowedTemplates[0];
            } else if (currentUser.allowedTemplates.length === 0) {
              safeTemplate = "Template1PDF";
            }
          }
          switch (safeTemplate) {
            case "Template2PDF": return <Template2PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
            case "Template3PDF": return <Template3PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
            case "Template4PDF": return <Template4PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
            case "Template5PDF": return <Template5PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
            case "Template6PDF": return <Template6PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
            case "Template7PDF": return <Template7PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
            default: return <Template1PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
          }
        };

        const blob = await pdf(getPdfTemplate()).toBlob();
        const url = URL.createObjectURL(blob);

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            iframe.focus();
            iframe.contentWindow.print();
            toast.success("Printing ready", { id: "print-pdf" });
          }, 100);
        };
      } catch (error) {
        console.error("Print PDF failed:", error);
        toast.error("Failed to print PDF.", { id: "print-pdf" });
      }
      return;
    }

    const element = printRef.current;
    if (!element) return;

    const printWindow = window.open("", "_blank");

    const cssLinks = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style")
    )
      .map((node) => node.outerHTML)
      .join("");

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice Print</title>
        ${cssLinks}  <!-- ✅ Copies Tailwind + Custom CSS -->
        <style>
          @page { size: auto; margin: 10mm; }
          body { margin: 0; padding: 0; }
          .print-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
          }
          /* Print overrides */
          @media print {
            .print-container { padding: 0; }
            .invoice-root { font-size: 12pt !important; }
            tr, td, th {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            .print-keep-together {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "16rem" }}
      >
        <div
          className="animate-spin rounded-full border-b-2 border-blue-600"
          style={{ height: "3rem", width: "3rem" }}
        ></div>
      </div>
    );
  }

  if (!invoiceData) {
    return <p className="text-center text-red-500">Invoice not found</p>;
  }

  // Template Switcher
  const renderTemplate = () => {
    let safeTemplate = selectedTemplate;
    if (currentUser?.allowedTemplates) {
      if (currentUser.allowedTemplates.length > 0 && !currentUser.allowedTemplates.includes(safeTemplate)) {
        safeTemplate = currentUser.allowedTemplates[0];
      } else if (currentUser.allowedTemplates.length === 0) {
        safeTemplate = "Template1PDF";
      }
    }
    
    const getDocument = () => {
      switch (safeTemplate) {
        case "Template2PDF":
          return <Template2PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
        case "Template3PDF":
          return <Template3PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
        case "Template4PDF":
          return <Template4PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
        case "Template5PDF":
          return <Template5PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} />;
        case "Template6PDF":
          return <Template6PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
        case "Template7PDF":
          return <Template7PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
        case "Template1PDF":
        default:
          return <Template1PDF invoiceData={invoiceData} numberToWords={numberToWords} currentUser={currentUser} signatureBase64={signatureBase64} logoBase64={logoBase64} />;
      }
    };

    const document = getDocument();

    if (isMobile) {
      return (
        <div style={{ width: '100%', height: '400px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', color: '#64748b' }}>
            <FileText size={48} style={{ margin: '0 auto' }} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">PDF Preview Not Available</h3>
          <p className="text-sm text-slate-500 max-w-sm" style={{marginBottom: "24px"}}>
            Mobile browsers do not support inline PDF previews. Please open or download the PDF to view it.
          </p>
          <BlobProvider document={document}>
            {({ url, loading, error }) => {
              if (loading) return <button disabled className="px-6 py-2 bg-blue-600/50 text-white rounded-lg" style={{padding: "8px 24px"}}>Generating PDF...</button>;
              if (error) return <p className="text-red-500">Failed to generate PDF</p>;
              return (
                <div className="flex gap-3">
                  <a href={url} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors" style={{padding: "8px 24px"}}>
                    Open PDF
                  </a>
                  <button onClick={handleDownloadPdf} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow transition-colors cursor-pointer" style={{padding: "8px 24px"}}>
                    Download
                  </button>
                </div>
              );
            }}
          </BlobProvider>
        </div>
      );
    }

    return (
      <div style={{ width: '100%', height: '800px', borderRadius: '12px', overflow: 'hidden' }}>
        <PDFViewer width="100%" height="100%" className="border-0">
          {document}
        </PDFViewer>
      </div>
    );
  };

  return (
    <div className="flex ">
      {/* Main Invoice Area */}
      <div className="flex-1" style={{ padding: "1rem" }}>
        {/* Action Buttons */}
        <div className="flex justify-between" style={{ marginBottom: "1rem" }}>
          {/* Back Button */}
          <button
            onClick={() => navigate("/invoices")} 
            className="bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center cursor-pointer"
            style={{ padding: "0.5rem 1rem" }}
          >
            <ArrowLeft className="h-4 w-4" style={{ marginRight: "6px" }} />
            Back
          </button>

          <div className="flex justify-center gap-2 w-full">
            {/* Download */}
            <button
              onClick={handleDownloadPdf}
              className="bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
              style={{ padding: "0.5rem 1rem" }}
            >
              Download
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
              style={{ padding: "0.5rem 1rem" }}
            >
              Print
            </button>
          </div>
          <div className="relative group inline-block">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-gray-200 text-blue-700 rounded-full hover:bg-gray-300 transition cursor-pointer"
              style={{ padding: "8px" }}
            >
              {sidebarOpen ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

            {/* Tooltip */}
            <span
              className="absolute -translate-x-1/2 -left-[140%] w-max bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition"
              style={{ marginBottom: "8px", padding: "4px 8px" }}
            >
              {sidebarOpen ? "Hide Templates" : "View Templates"}
            </span>
          </div>
        </div>

        {/* Invoice Content */}
        <div>{renderTemplate()}</div>
      </div>

      {/* Sidebar (only visible if open) */}

      {sidebarOpen && (
        <TemplateSidebar
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}
    </div>
  );
};

export default InvoiceView;
