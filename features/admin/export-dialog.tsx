"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportDialog() {
  const exportPdf = async () => {
    const [{ jsPDF }, report] = await Promise.all([
      import("jspdf"),
      fetch("/api/export", { method: "POST" }).then((response) => response.json())
    ]);

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(5, 5, 5);
    pdf.rect(0, 0, width, height, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.text(report.title, 56, 120, { maxWidth: width - 112 });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(197, 164, 109);
    pdf.text(`Researcher: ${report.researcher}`, 56, 178);
    pdf.text(`Date: ${new Date(report.date).toLocaleDateString()}`, 56, 202);

    report.frames.forEach((frame: any, index: number) => {
      pdf.addPage();
      pdf.setFillColor(5, 5, 5);
      pdf.rect(0, 0, width, height, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text(frame.movie, 56, 72);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(170, 170, 170);
      pdf.text(`Director: ${frame.director}`, 56, 105);
      pdf.text(`DOP: ${frame.dop}`, 56, 126);
      pdf.text(`Timecode: ${frame.timecode}`, 56, 147);
      pdf.setTextColor(197, 164, 109);
      pdf.text(`Selected answer: ${frame.annotation?.answer ?? "Not annotated"}`, 56, 182);
      pdf.setTextColor(130, 130, 130);
      pdf.text(`Frame image: ${frame.frameImage}`, 56, 226, { maxWidth: width - 112 });
      pdf.text(`${index + 1}`, width - 72, height - 48);
    });

    pdf.save("unconventional-framing-report.pdf");
  };

  return (
    <Button onClick={exportPdf}>
      <FileDown size={16} />
      Export PDF
    </Button>
  );
}
