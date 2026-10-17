import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export async function exportElementToPDF(
  element: HTMLElement,
  filename: string,
  title?: string,
) {
  // Scroll ke atas dulu (kadang bantu render lebih stabil)
  window.scrollTo(0, 0);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  // Cover
  if (title) {
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0);
    pdf.text(title, pdfWidth / 2, 30, { align: "center" });

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100);
    pdf.text(
      `Dibuat: ${new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      pdfWidth / 2,
      38,
      { align: "center" },
    );

    pdf.text("Content Plan - Chatmedia", pdfWidth / 2, 44, {
      align: "center",
    });

    pdf.setDrawColor(200);
    pdf.line(margin, 50, pdfWidth - margin, 50);
  }

  // Multi-halaman
  const imgWidth = pdfWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = title ? 55 : margin;

  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight - position - margin;

  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imgHeight + margin;
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - margin * 2;
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Halaman ${i} dari ${pageCount}  ·  Chatmedia ${new Date().getFullYear()}`,
      pdfWidth / 2,
      pdfHeight - 5,
      { align: "center" },
    );
  }

  pdf.save(`${filename}.pdf`);
}
