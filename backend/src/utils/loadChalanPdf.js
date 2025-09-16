export const generateLoadChalanPDF = async (loadChalan) => {
  try {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 15,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (error) =>
      console.error("PDF generation stream error:", error)
    );

    // --- Validations ---
    if (!loadChalan) throw new Error("Load chalan data is requiblack");
    if (!Array.isArray(loadChalan.consignments))
      throw new Error("Load chalan must have consignments array");
    if (loadChalan.consignments.length === 0)
      throw new Error("Load chalan must have at least one consignment");

    // === WATERMARK (very light) ===
    {
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      doc.save();
      doc.fillColor("#D11A1A").opacity(0.06);
      doc.font("Helvetica-Bold").fontSize(150);
      doc.rotate(-30, { origin: [pageW / 2, pageH / 2] });
      const wmText = "KVL";
      const wmWidth = doc.widthOfString(wmText);
      const x = (pageW - wmWidth) / 2;
      const y = (pageH - 150) / 2;
      doc.text(wmText, x, y);
      doc.restore();
      doc.opacity(1);
    }

    // === Helpers ===
    const drawKVLLogo = (doc, x, y, opts = {}) => {
      const h = opts.height ?? 18;
      const color = opts.color ?? "#D11A1A";
      const t = opts.thickness ?? Math.max(2, Math.round(h * 0.2));
      const gap = opts.gap ?? Math.round(h * 0.06);
      const skew = opts.skew ?? Math.max(1, h * 0.09);

      const band = (x1, y1, x2, y2, w) => {
        const dx = x2 - x1,
          dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len,
          ny = dx / len;
        const hw = w / 2;
        doc
          .moveTo(x1 + nx * hw, y1 + ny * hw)
          .lineTo(x2 + nx * hw, y2 + ny * hw)
          .lineTo(x2 - nx * hw, y2 - ny * hw)
          .lineTo(x1 - nx * hw, y1 - ny * hw)
          .closePath()
          .fill();
      };

      doc.save();
      doc.fillColor(color).miterLimit(2).lineJoin("miter").lineCap("butt");

      // K
      doc.rect(x, y, t, h).fill();
      const kJointX = x + t + gap;
      const kJointY = y + h * 0.5;
      const kEndX = x + h * 0.52;
      band(kJointX, kJointY, kEndX, y + h * 0.12, t);
      band(kJointX, kJointY, kEndX, y + h * 0.88, t);

      // V
      const vLeftX = x + h * 0.6,
        vLeftY = y + h * 0.14;
      const vApexX = x + h * 0.78,
        vApexY = y + h * 0.72;
      const vRightX = x + h * 1.05,
        vRightY = y + h * 0.1;
      band(vLeftX, vLeftY, vApexX, vApexY, t);
      band(vApexX, vApexY, vRightX, vRightY, t);

      // L
      const lX = x + h * 1.12;
      doc
        .moveTo(lX, y)
        .lineTo(lX + t, y + skew)
        .lineTo(lX + t, y + h)
        .lineTo(lX, y + h)
        .closePath()
        .fill();
      const footLen = h * 0.5;
      doc.rect(lX, y + h - t, footLen, t).fill();

      doc.restore();
    };

    const formatDate = (date) => {
      if (!date) return "N/A";
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        return `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}/${d.getFullYear()}`;
      } catch {
        return "N/A";
      }
    };

    const formatNumber = (num) =>
      num === null || num === undefined || isNaN(num)
        ? "0"
        : String(Number(num));
    const formatDecimal = (num, decimals = 2) =>
      num === null || num === undefined || isNaN(num)
        ? (0).toFixed(decimals)
        : Number(num).toFixed(decimals);
    const money = (n) => formatDecimal(Number(n || 0), 2);

    const numberToWords = (num) => {
      if (!num || num === 0) return "Zero";
      const ones = [
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
      const tens = [
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
      const convert = (n) => {
        let s = "";
        if (n >= 100) {
          s += ones[Math.floor(n / 100)] + " Hundblack ";
          n %= 100;
        }
        if (n >= 20) {
          s += tens[Math.floor(n / 10)] + " ";
          n %= 10;
        }
        if (n > 0) s += ones[n] + " ";
        return s;
      };
      let n = Math.floor(num),
        w = "";
      if (n >= 10000000) {
        const c = Math.floor(n / 10000000);
        w += convert(c) + "Crore ";
        n %= 10000000;
      }
      if (n >= 100000) {
        const l = Math.floor(n / 100000);
        w += convert(l) + "Lakh ";
        n %= 100000;
      }
      if (n >= 1000) {
        const t = Math.floor(n / 1000);
        w += convert(t) + "Thousand ";
        n %= 1000;
      }
      if (n > 0) w += convert(n);
      return w.trim();
    };

    // === Page Border ===
    doc.rect(15, 15, 810, 565).stroke();

    // === Header ===
    const margin = 15;
    const pageWidth = doc.page.width;

    drawKVLLogo(doc, margin + 5, margin + 5, { height: 30, color: "#D11A1A" });

    // Mobile
    doc
      .fontSize(10)
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("Mob : 9737138629", pageWidth - 150, margin + 8);

    // Challan badge (compact, square corners, black value + border)
    {
      const label = "Challan:";
      const value = loadChalan.chalanNumber || "N/A";

      const labelFS = 10;
      const valueFS = 12;

      doc.font("Helvetica-Bold").fontSize(labelFS);
      const labelW = doc.widthOfString(label);
      doc.fontSize(valueFS);
      const valueW = doc.widthOfString(value);

      const padX = 8;
      const boxH = 22;

      let boxW = labelW + valueW + padX * 2 + 12; // spacing between label & value
      boxW = Math.max(140, Math.min(boxW, 180)); // clamp width (no lamba box)

      const boxX = pageWidth - boxW - 20; // align to right border inside page
      const boxY = margin + 30; // thoda niche

      // black border
      doc.save();
      doc.lineWidth(1.3).strokeColor("#D11A1A");
      doc.rect(boxX, boxY, boxW, boxH).stroke();
      doc.restore();

      // text
      const labelX = boxX + padX;
      const textY = boxY + 4;

      doc
        .font("Helvetica-Bold")
        .fontSize(labelFS)
        .fillColor("#111827")
        .text(label, labelX, textY, { lineBreak: false });

      doc
        .font("Helvetica-Bold")
        .fontSize(valueFS)
        .fillColor("#D11A1A")
        .text(value, labelX + labelW + 8, boxY + 3, { lineBreak: false });
    }

    // Company title
    doc
      .fontSize(14)
      .fillColor("#D11A1A")
      .font("Helvetica-Bold")
      .text("KASHI VISHWANATH LOGISTICS", 0, margin + 12, {
        align: "center",
        width: pageWidth,
        characterSpacing: 1,
      });

    doc
      .fontSize(10)
      .fillColor("black")
      .text("FLEET OWNERS & TRANSPORT CONTRACTORS", 0, margin + 30, {
        align: "center",
        width: pageWidth,
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Plot No. 66, Gala No. 01, Vapi Processing Compound Near Sunita Textile 1st Phase GIDC",
        0,
        margin + 44,
        { align: "center", width: pageWidth }
      )
      .text("Vapi-396 195 (Gujarat)", 0, margin + 56, {
        align: "center",
        width: pageWidth,
      });

    doc.moveTo(15, 80).lineTo(825, 78).stroke();

    // === Title ===
    const titleY = 90;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("LOAD CHALLAN", 15, titleY, { align: "center", width: 810 });

    // === Trip Info: 2 lines, no background ===
    const infoX = 20;
    const infoY = titleY + 20;
    const midX = 420; // second column start
    const labelFS = 10;
    const valueFS = 12;
    const rowGap = 18;

    const putKV = (label, value, x, y, labelW = 50, valW = 360) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(labelFS)
        .fillColor("#374151")
        .text(label, x, y, { width: labelW, align: "left" });
      doc
        .font("Helvetica-Bold")
        .fontSize(valueFS)
        .fillColor("#111827")
        .text(value, x + labelW + 6, y, {
          width: valW - labelW - 6,
          align: "left",
          lineBreak: false,
        });
    };

    // Row 1
    putKV(
      "Date:",
      formatDate(loadChalan.date),
      infoX,
      infoY,
      45,
      midX - infoX - 10
    );
    putKV(
      "Truck:",
      loadChalan.vehicle?.vehicleNumber || "N/A",
      midX,
      infoY,
      55,
      390
    );

    // Row 2
    putKV(
      "From:",
      loadChalan.bookingBranch || "N/A",
      infoX,
      infoY + rowGap,
      45,
      midX - infoX - 10
    );
    putKV(
      "To:",
      loadChalan.destinationHub || "N/A",
      midX,
      infoY + rowGap,
      30,
      390
    );

    // === Owner & Driver: clean 2-column (no bg) ===
    const ownerY = infoY + rowGap + 20;
    const col1X = 20;
    const col2X = 420;
    const col1LabelW = 95;
    const col2LabelW = 105;
    const rowH = 18;

    const ownerNameVal = loadChalan.ownerName || "N/A";
    const driverPhone =
      loadChalan.driver?.driverMobile || loadChalan.driver?.mobile || "";
    const driverNameVal = `${loadChalan.driver?.driverName || "N/A"}${
      driverPhone ? ` - ${driverPhone}` : ""
    }`;
    const panNoVal =
      loadChalan.vehicle?.ownerAadhaarNumber ||
      loadChalan.ownerAadhaarNumber ||
      loadChalan.vehicle?.vehicleId?.ownerAadhaarNumber ||
      "N/A"; // fallback to N/A instead of hardcoded

    const cleanerVal = loadChalan.driver?.cleanerName || "-";

    const ownerAddressVal = loadChalan.ownerAddress || "N/A";
    const licenceVal = loadChalan.driver?.driverLicenseNo || "N/A";
    const driverPhVal = loadChalan.driver?.driverMobile || "N/A";
    const validityDate = new Date();
    validityDate.setFullYear(validityDate.getFullYear() + 1);
    const validityVal = formatDate(validityDate);

    const putKV2 = (label, value, x, y, labelW, valW) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(labelFS)
        .fillColor("#374151")
        .text(label, x, y, { width: labelW, align: "left" });
      doc
        .font("Helvetica-Bold")
        .fontSize(valueFS)
        .fillColor("#111827")
        .text(value, x + labelW + 6, y, {
          width: valW - labelW - 6,
          align: "left",
          lineBreak: false,
        });
    };

    // Left column (your order)
    let yL = ownerY;
    putKV2(
      "Owner Name:",
      ownerNameVal,
      col1X,
      yL,
      col1LabelW,
      midX - col1X - 10
    );
    yL += rowH;
    putKV2(
      "Driver Name:",
      driverNameVal,
      col1X,
      yL,
      col1LabelW,
      midX - col1X - 10
    );
    yL += rowH;
    putKV2("Pan No.:", panNoVal, col1X, yL, col1LabelW, midX - col1X - 10);
    yL += rowH;
    putKV2(
      "Cleaner Name:",
      cleanerVal,
      col1X,
      yL,
      col1LabelW,
      midX - col1X - 10
    );
    yL += rowH;

    // Right column
    let yR = ownerY;
    putKV2("Owner Address:", ownerAddressVal, col2X, yR, col2LabelW, 390);
    yR += rowH;
    putKV2("Driver Licence:", licenceVal, col2X, yR, col2LabelW, 390);
    yR += rowH;
    putKV2("Driver Ph.No.:", driverPhVal, col2X, yR, col2LabelW, 390);
    yR += rowH;
    putKV2("Validity:", validityVal, col2X, yR, col2LabelW, 390);
    yR += rowH;

    // Divider before main content
    const lineBeforeTableY = Math.max(yL, yR) + 6;
    doc.moveTo(15, lineBeforeTableY).lineTo(825, lineBeforeTableY).stroke();

    // === Layout: Left Table + Right Charges Panel ===
    const contentX = 15;
    const contentW = 810;
    const gutter = 14;
    const chargesPanelW = 210; // right panel width
    const tableW = contentW - chargesPanelW - gutter;

    // === Consignment Table (LEFT) ===
    const tableX = contentX;
    const tableY = lineBeforeTableY + 10;
    const headerH = 22;
    const rowHeight = 22;

    const borderDark = "#6b7280"; // darker borders
    const gridMid = "#9aa4b2"; // medium grid

    const wLR = 110,
      wPkgs = 50,
      wPack = 105,
      wWt = 60,
      wCwt = 85,
      wVal = 60;
    const wDest = tableW - (wLR + wPkgs + wPack + wWt + wCwt + wVal);
    const columns = [
      { label: "LR No.", width: wLR, align: "center" },
      { label: "Pkgs.", width: wPkgs, align: "center" },
      { label: "Pack Type", width: wPack, align: "center" },
      { label: "Weight", width: wWt, align: "right" },
      { label: "Charged Weight", width: wCwt, align: "right" },
      { label: "Value", width: wVal, align: "right" },
      { label: "Destination", width: wDest, align: "left" },
    ];
    let runX = tableX;
    columns.forEach((c) => {
      c.x = runX;
      runX += c.width;
    });

    // Header
    doc.save();
    doc.rect(tableX, tableY, tableW, headerH).fill("#f5f7fa");
    doc.restore();
    doc.lineWidth(1.0).strokeColor(borderDark);
    doc
      .moveTo(tableX, tableY)
      .lineTo(tableX + tableW, tableY)
      .stroke();
    doc
      .moveTo(tableX, tableY + headerH)
      .lineTo(tableX + tableW, tableY + headerH)
      .stroke();

    columns.forEach((col) => {
      doc
        .fillColor("#1f2937")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(col.label, col.x + 4, tableY + 5, {
          width: col.width - 8,
          align: col.align,
        });
    });

    // Body rows
    doc.lineWidth(0.8).strokeColor(gridMid);
    let bodyY = tableY + headerH;
    for (let r = 0; r < 6; r++) {
      if (r % 2 === 0)
        doc.rect(tableX, bodyY, tableW, rowHeight).fill("#fcfdff").stroke();
      else doc.rect(tableX, bodyY, tableW, rowHeight).stroke();
      bodyY += rowHeight;
    }

    // Vertical lines
    doc.strokeColor(borderDark).lineWidth(0.9);
    doc
      .moveTo(tableX, tableY)
      .lineTo(tableX, tableY + headerH + 6 * rowHeight)
      .stroke();
    columns.forEach((col) => {
      const xRight = col.x + col.width;
      doc
        .moveTo(xRight, tableY)
        .lineTo(xRight, tableY + headerH + 6 * rowHeight)
        .stroke();
    });

    // Fill data (with proper chargedWeight & value)
    let currentY = tableY + headerH;
    let totalPackages = 0,
      totalWeight = 0,
      totalChargedWeight = 0,
      totalValue = 0;

    const validConsignments = loadChalan.consignments.filter(
      (c) => c && typeof c === "object"
    );
    validConsignments.forEach((c, idx) => {
      if (idx >= 6) return;
      doc.font("Helvetica").fillColor("#111827");

      const consignmentNumber = c.consignmentNumber || "N/A";
      const packages =
        c.packages ?? c.packageCount ?? c.consignmentId?.packages ?? 0;
      const packType =
        c.packageType ||
        c.description ||
        c.consignmentId?.methodOfPacking ||
        "N/A";
      const weight =
        c.weight ?? c.actualWeight ?? c.consignmentId?.actualWeight ?? 0;

      // REAL Charged Weight
      const chargedWeight =
        c.chargedWeight ??
        c.consignmentId?.chargedWeight ??
        c.consignment?.chargedWeight ??
        weight;

      // REAL Value (goods value)
      const value =
        c.value ??
        c.declablackValue ??
        c.consignmentId?.value ??
        c.consignmentId?.declablackValue ??
        0;

      const destination =
        c.destination || c.toCity || c.consignmentId?.toCity || "N/A";

      // LR No
      doc.fontSize(8).text(consignmentNumber, columns[0].x + 4, currentY + 5, {
        width: columns[0].width - 8,
        align: "center",
      });

      // Packages
      doc
        .fontSize(8)
        .text(formatNumber(packages), columns[1].x + 4, currentY + 5, {
          width: columns[1].width - 8,
          align: "center",
        });

      // Pack Type
      doc.fontSize(8).text(packType, columns[2].x + 4, currentY + 5, {
        width: columns[2].width - 8,
        align: "center",
      });

      // Weight
      doc
        .fontSize(8)
        .text(formatNumber(weight), columns[3].x + 4, currentY + 5, {
          width: columns[3].width - 8,
          align: "right",
        });

      // Charged Weight
      doc
        .fontSize(8)
        .text(formatNumber(chargedWeight), columns[4].x + 4, currentY + 5, {
          width: columns[4].width - 8,
          align: "right",
        });

      // Value (bigger font for emphasis)
      doc
        .fontSize(10)
        .text(formatNumber(value), columns[5].x + 4, currentY + 5, {
          width: columns[5].width - 8,
          align: "right",
        });

      // Destination
      doc.fontSize(8).text(destination, columns[6].x + 4, currentY + 5, {
        width: columns[6].width - 8,
        align: "left",
      });

      totalPackages += Number(packages) || 0;
      totalWeight += Number(weight) || 0;
      totalChargedWeight += Number(chargedWeight) || 0;
      totalValue += Number(value) || 0;

      currentY += rowHeight;
    });

    // Summary row
    const summaryY = tableY + headerH + 6 * rowHeight;
    doc.save();
    doc.lineWidth(1.0).strokeColor(borderDark).fillColor("#eef2f7");
    doc.rect(tableX, summaryY, tableW, rowHeight).fillAndStroke();
    doc.restore();

    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("TOTAL", columns[0].x + 6, summaryY + 5, {
        width: columns[0].width - 8,
      });
    doc.text(formatNumber(totalPackages), columns[1].x + 4, summaryY + 5, {
      width: columns[1].width - 8,
      align: "center",
    });
    doc.text(formatNumber(totalWeight), columns[3].x + 4, summaryY + 5, {
      width: columns[3].width - 8,
      align: "right",
    });
    doc.text(formatNumber(totalChargedWeight), columns[4].x + 4, summaryY + 5, {
      width: columns[4].width - 8,
      align: "right",
    });
    // Value total a little bigger too
    doc
      .fontSize(10)
      .text(formatNumber(totalValue), columns[5].x + 4, summaryY + 5, {
        width: columns[5].width - 8,
        align: "right",
      });

    // === Charges Summary (RIGHT) — separate boxed panel with perfect dotted leaders ===
    const chargesX = tableX + tableW + gutter;
    const chargesTop = tableY;
    const chargesBottom = summaryY + rowHeight;
    const chargesH = chargesBottom - chargesTop;

    // Model values
    const lf = Number(loadChalan.lorryFreight ?? loadChalan.totalFreight ?? 0);
    const otherFrt = Number(loadChalan.otherCharges ?? 0);
    const addLoading = Number(loadChalan.loadingCharges ?? 0);
    const addUnloading = Number(loadChalan.unloadingCharges ?? 0);
    const totalFrt = lf + otherFrt + addLoading + addUnloading;
    const lessAdvance = Number(loadChalan.advancePaid ?? 0);
    const lessRTGS = Number(loadChalan.rtgsPaid ?? 0);
    const lessTDS = Number(loadChalan.tdsDeduction ?? 0);
    const balanceFrt = totalFrt - lessAdvance - lessRTGS - lessTDS;

    // Panel box
    doc.save();
    doc.lineWidth(1.1).strokeColor(borderDark);
    doc.rect(chargesX, chargesTop, chargesPanelW, chargesH).stroke();
    doc
      .rect(chargesX, chargesTop, chargesPanelW, 24)
      .fillOpacity(1)
      .fill("#f5f7fa");
    doc.restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111827")
      .text("Freight / Charges Summary", chargesX + 8, chargesTop + 6, {
        width: chargesPanelW - 16,
        align: "left",
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Amount", chargesX, chargesTop + 6, {
        width: chargesPanelW - 8,
        align: "right",
      });

    // Fixed geometry for perfect leader lines (same for all rows)
    const labelColW = chargesPanelW - 70; // left area for label
    const amountColW = 58; // right area for amount
    const leaderStartX = chargesX + 8 + labelColW + 2;
    const leaderEndX = chargesX + chargesPanelW - 8 - amountColW - 4;

    let py = chargesTop + 28;
    const rowGapCharges = Math.max(
      12,
      Math.min(15, Math.floor((chargesH - 36) / 9))
    );
    const dottedColor = "#8b949e";

    const prow = (label, value, { color = "black", bold = false } = {}) => {
      // label
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(color)
        .text(label, chargesX + 8, py, { width: labelColW - 4, align: "left" });

      // dotted leader (fixed start/end)
      doc.save().dash(1, { space: 2 }).strokeColor(dottedColor).lineWidth(0.7);
      doc
        .moveTo(leaderStartX, py + 10)
        .lineTo(leaderEndX, py + 10)
        .stroke();
      doc.restore();

      // amount (right aligned in fixed box)
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(color)
        .text(money(value), chargesX + chargesPanelW - 8 - amountColW, py, {
          width: amountColW,
          align: "right",
        });

      py += rowGapCharges;
    };

    const psep = () => {
      doc.save().dash(1, { space: 2 }).strokeColor(borderDark);
      doc
        .moveTo(chargesX + 6, py - 3)
        .lineTo(chargesX + chargesPanelW - 6, py - 3)
        .stroke();
      doc.restore();
    };

    psep();
    prow("Lorry Freight", lf);
    prow("Other Freight", otherFrt);
    prow("Add Loading", addLoading);
    prow("Add UnLoading", addUnloading);
    psep();
    prow("Total. :", totalFrt, { color: "#0033CC", bold: true });
    prow("Less Advance", lessAdvance, { color: "#D11A1A" });
    prow("Less RTGS", lessRTGS, { color: "#D11A1A" });
    prow("Less TDS.", lessTDS, { color: "#D11A1A" });
    psep();
    prow("Balance Freight :", balanceFrt, { bold: true });

    // === Footer below both panels ===
    const footerStartY = chargesBottom + 15;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#111827")
      .text("Balance in words:", 20, footerStartY);
    const balanceInWords = `Rupees ${numberToWords(
      Math.round(balanceFrt)
    )} Only`;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(balanceInWords, 130, footerStartY);

    // Additional info box
    const additionalInfoY = footerStartY + 25;
    doc.rect(15, additionalInfoY, 400, 60).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#111827")
      .text("Additional Information:", 20, additionalInfoY + 5);

    doc
      .font("Helvetica")
      .fontSize(8)
      .text("Engine No:", 20, additionalInfoY + 25);
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        loadChalan.vehicle?.engineNumber ||
          loadChalan.vehicle?.vehicleId?.engineNumber ||
          "N/A",
        80,
        additionalInfoY + 25
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .text("Chassis No:", 20, additionalInfoY + 40);
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        loadChalan.vehicle?.chassisNumber ||
          loadChalan.vehicle?.vehicleId?.chassisNumber ||
          "N/A",
        80,
        additionalInfoY + 40
      );

    // Signatures
    const signatureY = 540;
    doc.rect(50, signatureY - 20, 200, 40).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Sign. of Driver or Owner", 50, signatureY + 25, {
        width: 200,
        align: "center",
      });

    doc.rect(575, signatureY - 20, 200, 40).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Sign. of Desp. Officer", 575, signatureY + 25, {
        width: 200,
        align: "center",
      });

    doc.end();

    // Return buffer
    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0)
            throw new Error("Generated PDF buffer is empty");
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      });
      setTimeout(() => reject(new Error("PDF generation timeout")), 30000);
    });
  } catch (error) {
    console.error("Error generating Load Chalan PDF:", error);
    throw error;
  }
};
