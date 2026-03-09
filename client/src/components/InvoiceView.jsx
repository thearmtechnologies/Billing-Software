import React, { useEffect, useState, useRef } from "react";
import { data, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Template1 from "../templates/Template1";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Template2 from "../templates/Template2";
import TemplateSidebar from "./TemplateSidebar";
import Template3 from "../templates/Template3";
import Template4 from "../templates/Template4";

const InvoiceView = () => {
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("template1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = useNavigate();

  const printRef = useRef(null);

  function numberToWords(num) {
    if (typeof num !== "number") return "";

    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + inWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          inWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + inWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          inWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + inWords(n % 100000) : "")
        );
      return (
        inWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + inWords(n % 10000000) : "")
      );
    }

    const [rupees, paise] = num.toFixed(2).split(".");
    let words = "";

    if (parseInt(rupees) > 0) {
      words += inWords(parseInt(rupees)) + " Rupees";
    }
    if (parseInt(paise) > 0) {
      words += " and " + inWords(parseInt(paise)) + " Paise";
    }

    return words + " Only";
  }

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

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    
    // Clone the node into a responsive container
    const cloned = element.cloneNode(true);
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.maxWidth = "210mm";
    wrapper.style.padding = "20px";
    wrapper.style.background = "#fff";
    wrapper.style.boxSizing = "border-box";
    wrapper.appendChild(cloned);
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, { scale: 2 });
    document.body.removeChild(wrapper);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(
      `${invoiceData.client?.companyName || "client"}_${
        invoiceData.invoiceNumber
      }.pdf`
    );
  };

  const handlePrint = () => {
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
          @media print {
            .print-container {
              padding: 0;
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
    switch (selectedTemplate) {
      case "template1":
        return (
          <Template1
            invoiceData={invoiceData}
            ref={printRef}
            numberToWords={numberToWords}
          />
        );
      case "template2":
        return (
          <Template2
            invoiceData={invoiceData}
            ref={printRef}
            numberToWords={numberToWords}
          />
        );
      case "template3":
        return (
          <Template3
            invoiceData={invoiceData}
            ref={printRef}
            numberToWords={numberToWords}
          />
        );
      case "template4":
        return (
          <Template4
            invoiceData={invoiceData}
            ref={printRef}
            numberToWords={numberToWords}
          />
        );
      default:
        return (
          <Template1
            invoiceData={invoiceData}
            ref={printRef}
            numberToWords={numberToWords}
          />
        );
    }
  };

  return (
    <div className="flex ">
      {console.log(data)}
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
