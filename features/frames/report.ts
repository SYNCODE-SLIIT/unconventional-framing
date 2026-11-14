import type { Category, ScaleConfig } from "@/lib/scale";
import type { Frame } from "@/types/domain";

type ReportInput = {
  participant: { name: string; profession: string };
  frames: Frame[];
  answers: Record<string, Category>;
  ratings: Record<string, number>;
  scale: ScaleConfig;
};

const categoryNames: Record<Category, string> = {
  UNCONVENTIONAL: "Unconventional",
  CONVENTIONAL: "Conventional",
  NOT_SURE: "Not sure"
};

// The built-in PDF font only covers Latin text, so anything else (for example Sinhala) is left out.
const latin = (value: string) => (/^[ -ÿ]*$/.test(value) ? value : "");

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load a frame image"));
    image.src = url;
  });
}

/** Draws the picture to a canvas first, so any image type ends up as a JPEG the PDF can hold. */
async function frameToJpeg(url: string) {
  const image = await loadImage(url);
  const scale = Math.min(1, 1200 / image.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { data: canvas.toDataURL("image/jpeg", 0.85), ratio: canvas.width / canvas.height };
}

/** Builds and saves a PDF of every frame the participant answered, with their answer and number. */
export async function downloadReport({ participant, frames, answers, ratings, scale }: ReportInput) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const boxW = 420;
  const boxH = Math.round((boxW * 9) / 16);
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(20, 20, 20);
  pdf.text("My responses", margin, y + 14);
  y += 36;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(110, 110, 110);
  const subtitle = pdf.splitTextToSize(
    "Reading and Evaluating the Aesthetics of Unconventional Framing in Contemporary Sri Lankan Cinema",
    width - margin * 2
  );
  pdf.text(subtitle, margin, y);
  y += subtitle.length * 12 + 6;

  const who = [latin(participant.name), latin(participant.profession)].filter(Boolean).join("  ·  ");
  if (who) {
    pdf.setTextColor(40, 40, 40);
    pdf.text(who, margin, y);
    y += 14;
  }
  pdf.setTextColor(110, 110, 110);
  pdf.text(new Date().toLocaleDateString(), margin, y);
  y += 26;

  const answered = frames.filter((frame) => answers[frame.id] && ratings[frame.id]);

  for (let index = 0; index < answered.length; index += 1) {
    const frame = answered[index];
    const answer = answers[frame.id];
    const rating = ratings[frame.id];

    if (y + boxH + 70 > height - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFillColor(238, 238, 238);
    pdf.rect(margin, y, boxW, boxH, "F");
    try {
      const { data, ratio } = await frameToJpeg(frame.frameImage);
      const drawW = ratio >= boxW / boxH ? boxW : boxH * ratio;
      const drawH = ratio >= boxW / boxH ? boxW / ratio : boxH;
      pdf.addImage(data, "JPEG", margin + (boxW - drawW) / 2, y + (boxH - drawH) / 2, drawW, drawH);
    } catch {
      pdf.setFontSize(9);
      pdf.setTextColor(130, 130, 130);
      pdf.text("Image unavailable", margin + 12, y + 20);
    }

    const textY = y + boxH + 18;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(20, 20, 20);
    pdf.text(`Frame ${index + 1}  ·  ${latin(frame.movie)}  ·  ${frame.timecode}`, margin, textY);

    const label = latin(scale.categories[answer].labels.en[rating - 1] ?? "");
    pdf.setFont("helvetica", "normal");
    pdf.text(`My answer: ${categoryNames[answer]}   ·   Number: ${rating} of 5${label ? `  (${label})` : ""}`, margin, textY + 16);

    y += boxH + 52;
  }

  if (answered.length === 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    pdf.text("No frames were answered.", margin, y);
  }

  pdf.setFontSize(8.5);
  pdf.setTextColor(140, 140, 140);
  pdf.text("Loshan Ruwanpathirana · Kingston University London", margin, height - 24);

  pdf.save("my-responses.pdf");
}
