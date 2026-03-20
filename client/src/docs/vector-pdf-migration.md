# Vector PDF Migration Note

## Current Implementation (v1)

PDF generation now uses **`@react-pdf/renderer`** (client-side) for true vector PDFs.

### How it works
1. `Template1PDF.jsx` is a `@react-pdf/renderer` version of the invoice template
2. `handleDownloadPdf()` in `InvoiceView.jsx` calls `pdf(<Template1PDF />).toBlob()`
3. The blob is downloaded as a `.pdf` file via `URL.createObjectURL`

### Benefits
- **Selectable, crisp text** — no rasterization artifacts
- **Small file size** — vector PDF vs embedded image
- **Native A4 page handling** — `@react-pdf/renderer` handles page breaks natively

---

## Raster Fallback (html2canvas + jsPDF)

The old raster approach has been removed from `handleDownloadPdf`. To re-enable as a fallback:

```js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const handleDownloadPdfRaster = async () => {
  const element = printRef.current;
  if (!element) return;

  const wrapper = document.createElement("div");
  wrapper.style.width = "210mm";
  wrapper.style.padding = "20px";
  wrapper.style.background = "#fff";
  wrapper.style.boxSizing = "border-box";
  wrapper.appendChild(element.cloneNode(true));
  document.body.appendChild(wrapper);

  const canvas = await html2canvas(wrapper, { scale: 2 });
  document.body.removeChild(wrapper);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
  pdf.save("invoice.pdf");
};
```

---

## Server-Side Puppeteer (Future Option)

If you later need pixel-perfect page matching with the browser template:

1. Install `puppeteer` on the server: `npm install puppeteer`
2. Add a new API route: `POST /api/v1/invoices/:id/pdf`
3. The endpoint renders the invoice HTML in headless Chrome and returns the PDF
4. Advantage: exact browser rendering fidelity
5. Disadvantage: ~400MB Chromium dependency, higher server memory usage

### Trade-offs

| Approach | Text quality | File size | Server load | Complexity |
|----------|-------------|-----------|-------------|------------|
| @react-pdf (current) | Vector/crisp | Small | None | Medium |
| Puppeteer | Pixel-perfect | Small | High | High |
| html2canvas (old) | Raster/blurry | Large | None | Low |

---

## Extending to Other Templates

To add vector PDF for Template2, Template3, Template4:
1. Create `Template2PDF.jsx`, etc., following the `Template1PDF.jsx` pattern
2. In `InvoiceView.jsx`, switch on `selectedTemplate` in `handleDownloadPdf` to render the appropriate PDF template
3. Each PDF template should accept the same props: `invoiceData`, `numberToWords`, `currentUser`, `copyType`
