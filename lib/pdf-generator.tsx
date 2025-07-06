"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ChartData {
  kelas: string;
  santriList: Array<{
    name: string;
    hafalan: number;
    target: number;
    colorCategory: string;
  }>;
  targetJuz: number;
}

export const generateHafalanChartPDF = async (data: ChartData) => {
  try {
    // Create PDF in landscape mode
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Calculate dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const chartWidth = Math.max(800, data.santriList.length * 25); // Dynamic width based on student count
    const chartHeight = 600;

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = chartWidth;
    canvas.height = chartHeight;
    const ctx = canvas.getContext("2d")!;

    // Set background
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, chartWidth, chartHeight);

    // Title
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CAPAIAN HAFALAN AL-QUR'AN SANTRI", chartWidth / 2, 40);

    ctx.font = "20px Arial";
    ctx.fillText("HUBBUL KHOOIR", chartWidth / 2, 70);

    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 24px Arial";
    ctx.fillText(data.kelas.toUpperCase(), chartWidth / 2, 100);

    // Chart area
    const chartAreaTop = 140;
    const chartAreaBottom = chartHeight - 100;
    const chartAreaLeft = 80;
    const chartAreaRight = chartWidth - 40;
    const chartAreaHeight = chartAreaBottom - chartAreaTop;
    const chartAreaWidth = chartAreaRight - chartAreaLeft;

    // Y-axis
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartAreaLeft, chartAreaTop);
    ctx.lineTo(chartAreaLeft, chartAreaBottom);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartAreaLeft, chartAreaBottom);
    ctx.lineTo(chartAreaRight, chartAreaBottom);
    ctx.stroke();

    // Y-axis label
    ctx.save();
    ctx.translate(30, chartAreaTop + chartAreaHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#333";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("HAFALAN JUZ", 0, 0);
    ctx.restore();

    // Y-axis ticks and labels
    const maxJuz = Math.max(6, data.targetJuz + 1);
    for (let i = 0; i <= maxJuz; i++) {
      const y = chartAreaBottom - (i / maxJuz) * chartAreaHeight;

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(chartAreaLeft - 5, y);
      ctx.lineTo(chartAreaLeft, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText(i.toString(), chartAreaLeft - 8, y + 4);
    }

    // Target line
    const targetY =
      chartAreaBottom - (data.targetJuz / maxJuz) * chartAreaHeight;
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chartAreaLeft, targetY);
    ctx.lineTo(chartAreaRight, targetY);
    ctx.stroke();

    // Bars and labels
    const barWidth = Math.min(30, chartAreaWidth / data.santriList.length - 5);
    const barSpacing = chartAreaWidth / data.santriList.length;

    data.santriList.forEach((santri, index) => {
      const x =
        chartAreaLeft + index * barSpacing + barSpacing / 2 - barWidth / 2;
      const barHeight = (santri.hafalan / maxJuz) * chartAreaHeight;
      const y = chartAreaBottom - barHeight;

      // Bar color based on category
      let barColor = "#2196f3"; // Default blue
      switch (santri.colorCategory) {
        case "red":
          barColor = "#f44336";
          break;
        case "yellow":
          barColor = "#ffeb3b";
          break;
        case "green":
          barColor = "#4caf50";
          break;
        case "blue":
          barColor = "#2196f3";
          break;
        case "pink":
          barColor = "#e91e63";
          break;
      }

      // Draw bar
      ctx.fillStyle = barColor;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Bar border
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Student name (vertical)
      ctx.save();
      ctx.translate(x + barWidth / 2, chartAreaBottom + 10);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#333";
      ctx.font = "8px Arial";
      ctx.textAlign = "left";
      const displayName =
        santri.name.length > 15
          ? santri.name.substring(0, 15) + "..."
          : santri.name;
      ctx.fillText(displayName, 0, 0);
      ctx.restore();
    });

    // Legend
    const legendY = chartHeight - 60;
    const legendItems = [
      { color: "#2196f3", label: "Hafalan", type: "rect" },
      { color: "#ff9800", label: "Target", type: "line" },
    ];

    let legendX = chartWidth / 2 - 80;
    legendItems.forEach((item, index) => {
      if (item.type === "rect") {
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY, 16, 16);
      } else {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY + 8);
        ctx.lineTo(legendX + 16, legendY + 8);
        ctx.stroke();
      }

      ctx.fillStyle = "#333";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(item.label, legendX + 25, legendY + 12);

      legendX += 100;
    });

    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL("image/png");

    // Calculate scaling to fit PDF page
    const pdfWidth = pageWidth - 2 * margin;
    const pdfHeight = pageHeight - 2 * margin;
    const scaleX = pdfWidth / (chartWidth / 3.78); // Convert px to mm
    const scaleY = pdfHeight / (chartHeight / 3.78);
    const scale = Math.min(scaleX, scaleY);

    const finalWidth = (chartWidth / 3.78) * scale;
    const finalHeight = (chartHeight / 3.78) * scale;
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

    // Add summary statistics
    const totalSantri = data.santriList.length;
    const averageHafalan =
      data.santriList.reduce((sum, s) => sum + s.hafalan, 0) / totalSantri;
    const achievedTarget = data.santriList.filter(
      (s) => s.hafalan >= data.targetJuz
    ).length;
    const percentageAchieved = Math.round((achievedTarget / totalSantri) * 100);

    // Add text summary at bottom
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const summaryY = pageHeight - 15;
    pdf.text(
      `Total Santri: ${totalSantri} | Rata-rata Hafalan: ${averageHafalan.toFixed(
        1
      )} Juz | Mencapai Target: ${achievedTarget} (${percentageAchieved}%)`,
      margin,
      summaryY
    );

    // Color distribution
    const colorCounts = {
      red: data.santriList.filter((s) => s.colorCategory === "red").length,
      yellow: data.santriList.filter((s) => s.colorCategory === "yellow")
        .length,
      green: data.santriList.filter((s) => s.colorCategory === "green").length,
      blue: data.santriList.filter((s) => s.colorCategory === "blue").length,
      pink: data.santriList.filter((s) => s.colorCategory === "pink").length,
    };

    pdf.text(
      `Distribusi: 🔴${colorCounts.red} 🟡${colorCounts.yellow} 🟢${colorCounts.green} 🔵${colorCounts.blue} 🩷${colorCounts.pink}`,
      margin,
      summaryY - 5
    );

    // Save PDF
    const fileName = `Hafalan_Chart_${data.kelas.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);

    // Clean up
    canvas.remove();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Gagal membuat PDF");
  }
};

// New function to download chart as PNG/JPG
export const downloadChartAsImage = async (
  data: ChartData,
  format: "png" | "jpg" = "png"
) => {
  try {
    // Find the chart container
    const chartContainer = document.querySelector("[data-chart-container]");
    if (!chartContainer) {
      throw new Error("Chart container not found");
    }

    // Use html2canvas to capture the chart
    const canvas = await html2canvas(chartContainer as HTMLElement, {
      backgroundColor: "#f0fdf4", // Light green background like the chart
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      width: chartContainer.clientWidth,
      height: chartContainer.clientHeight,
    });

    // Convert to blob
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error("Failed to create image blob");
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Hafalan_Chart_${data.kelas.replace(/\s+/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.${format}`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);
      },
      mimeType,
      format === "jpg" ? 0.9 : 1.0
    );
  } catch (error) {
    console.error("Error downloading chart as image:", error);
    throw new Error("Gagal mendownload gambar");
  }
};
