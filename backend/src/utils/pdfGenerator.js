export const generateConsignmentPDF = async (consignment, res) => {
  if (!consignment) {
    return res.status(404).json({ error: "Consignment not found" });
  }
  // Pipe PDF to response
  // ✅ Generate RANDOM but SAFE filename — consignmentNumber se independent!
  const randomString = Math.random().toString(36).substring(2, 8); // e.g. "a7b9c2"
  const timestamp = Date.now(); // Extra uniqueness
  const safeFileName = `consignment_${randomString}_${timestamp}.pdf`;

  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

  // ✅ SET HEADERS ONLY ONCE — with SAFE filename
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFileName}"`
  );
  doc.pipe(res);

  // === WATERMARK FUNCTION (Reusable) ===
  const addWatermark = () => {
    const pageW = doc.page.width;
    const pageH = doc.page.height;

    doc.save();
    doc.fillColor("#D11A1A").opacity(0.06);
    doc.font("Helvetica-Bold");
    const wmSize = 260;
    doc.fontSize(wmSize);
    doc.rotate(-30, { origin: [pageW / 2, pageH / 2] });

    const wmText = "KVL";
    const wmWidth = doc.widthOfString(wmText);
    const x = (pageW - wmWidth) / 2;
    const y = (pageH - wmSize) / 2;
    doc.text(wmText, x, y);

    doc.restore();
  };

  // === DRAW LOGO FUNCTION (Reusable) ===
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

    doc.rect(x, y, t, h).fill();

    const kJointX = x + t + gap;
    const kJointY = y + h * 0.5;
    const kEndX = x + h * 0.52;
    band(kJointX, kJointY, kEndX, y + h * 0.12, t);
    band(kJointX, kJointY, kEndX, y + h * 0.88, t);

    const vLeftX = x + h * 0.6;
    const vLeftY = y + h * 0.14;
    const vApexX = x + h * 0.78;
    const vApexY = y + h * 0.72;
    const vRightX = x + h * 1.05;
    const vRightY = y + h * 0.1;
    band(vLeftX, vLeftY, vApexX, vApexY, t);
    band(vApexX, vApexY, vRightX, vRightY, t);

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

  // === DATE & NUMBER FORMATTERS ===
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ✅ YEH NAYA FUNCTION ADD KARO (formatDate ke baad, drawCheckbox ke pehle)
  const formatDecimal = (num, decimals = 2) =>
    num === null || num === undefined || isNaN(num)
      ? (0).toFixed(decimals)
      : Number(num).toFixed(decimals);

  const drawCheckbox = (x, y, checked) => {
    doc.rect(x, y, 10, 10).stroke();
    if (checked) {
      doc
        .rect(x + 2, y + 2, 6, 6)
        .fill("black")
        .stroke();
      doc.fillColor("black");
    }
  };

  // === MAIN LAYOUT RENDERER ===
  const renderPage = (copyType) => {
    addWatermark();

    const startX = 20;
    const startY = 20;
    const rowHeight = 17;
    const totalRows = 6;
    const totalHeight = rowHeight * totalRows;
    const totalWidth = 842 - 2 * startX;

    const leftColWidth = 220;
    const rightColWidth = 180;
    const centerColWidth = totalWidth - leftColWidth - rightColWidth;

    const centerX = startX + leftColWidth;
    const rightX = centerX + centerColWidth;

    const checkboxSize = 9;

    // Outer border
    doc.rect(startX, startY, totalWidth, totalHeight).stroke();

    // Horizontal lines for left panel
    for (let i = 1; i < totalRows; i++) {
      doc
        .moveTo(startX, startY + i * rowHeight)
        .lineTo(centerX, startY + i * rowHeight)
        .stroke();
    }

    // Vertical separators
    doc
      .moveTo(centerX, startY)
      .lineTo(centerX, startY + totalHeight)
      .stroke();
    doc
      .moveTo(rightX, startY)
      .lineTo(rightX, startY + totalHeight)
      .stroke();

    // Right panel horizontal line
    const rightRowHeight = totalHeight / 2;
    doc
      .moveTo(rightX, startY + rightRowHeight)
      .lineTo(rightX + rightColWidth, startY + rightRowHeight)
      .stroke();

    // LEFT PANEL TEXT
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("Subject to VAPI Jurisdiction", startX + 5, startY + 5);
    doc.text(
      "Goods are Carried at Owners risk only",
      startX + 5,
      startY + rowHeight + 5
    );
    doc.text("Insurance Company", startX + 5, startY + 2 * rowHeight + 5);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.insurance?.company || "",
        startX + 100,
        startY + 2 * rowHeight + 5
      );
    doc
      .font("Helvetica")
      .text("Insurance Policy No.", startX + 5, startY + 3 * rowHeight + 5);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.insurance?.policyNo || "",
        startX + 100,
        startY + 3 * rowHeight + 5
      );
    doc
      .font("Helvetica")
      .text("Value Rs.", startX + 5, startY + 4 * rowHeight + 5);

    doc
      .font("Helvetica")
      .text("Type of Pkg up:", startX + 5, startY + 5 * rowHeight + 5);

    const row6Y = startY + 5 * rowHeight + 5;
    let xCursor = startX + 90;
    drawCheckbox(xCursor, row6Y, consignment?.typeOfPickup === "GODOWN");
    doc.text("GODOWN", xCursor + checkboxSize + 5, row6Y);
    xCursor += 80;
    drawCheckbox(xCursor, row6Y, consignment?.typeOfPickup === "DOOR");
    doc.text("DOOR", xCursor + checkboxSize + 5, row6Y);

    // CENTER PANEL TEXT
    doc.fillColor("black").font("Helvetica-Bold").fontSize(16);
    drawKVLLogo(doc, centerX + 6, startY + 4, { height: 28, color: "#D11A1A" });

    doc
      .fillColor("#D11A1A")
      .text("KASHI VISHWANATH LOGISTICS", centerX + 50, startY + 5, {
        width: centerColWidth - 60,
        align: "center",
      });

    doc.fillColor("black").font("Helvetica-Bold").fontSize(11);
    doc.text(
      "FLEET OWNERS & TRANSPORT CONTRACTORS",
      centerX + 5,
      startY + rowHeight + 5,
      {
        width: centerColWidth - 10,
        align: "center",
      }
    );
    doc.text(
      "Plot No. 66, Gala No. 20, Vapi Processing Compound Near",
      centerX + 5,
      startY + 2 * rowHeight + 5,
      { width: centerColWidth - 10, align: "center" }
    );
    doc.text(
      "Sunita Textile 1st Phase GIDC Vapi-396 195 (Gujarat)",
      centerX + 5,
      startY + 3 * rowHeight + 5,
      {
        width: centerColWidth - 10,
        align: "center",
      }
    );
    doc.text(
      "Email : kashivishwanathlogistics@gmail.com",
      centerX + 5,
      startY + 4 * rowHeight + 5,
      {
        width: centerColWidth - 10,
        align: "center",
      }
    );
    doc.text("Mob.: 9737138629", centerX + 5, startY + 5 * rowHeight + 5, {
      width: centerColWidth - 10,
      align: "center",
    });

    // === RIGHT PANEL TEXT === (YAHAN CHANGE HOGA HAR PAGE KE LIYE)
    doc.font("Helvetica-Bold").fontSize(9).fillColor("black");
    doc.text(copyType, rightX + 5, startY + 5, {
      width: rightColWidth - 10,
      align: "center",
    });
    doc.fillColor("black");
    doc.text("CONSIGNMENT NOTE", rightX + 5, startY + rightRowHeight + 10, {
      width: rightColWidth - 10,
      align: "center",
    });

    doc.font("Times-Bold").fontSize(12).fillColor("#141414");
    doc.text(
      consignment?.consignmentNumber || "742",
      rightX + 5,
      startY + rightRowHeight + 30,
      {
        width: rightColWidth - 10,
        align: "center",
      }
    );

    // === ROW 7 and 8 ===
    const row7Y = startY + totalHeight;
    const twoRowHeight = rowHeight;

    const col1Width = leftColWidth;
    const col2Width = centerColWidth / 2;
    const col3Width = centerColWidth / 2 + rightColWidth;

    doc.rect(startX, row7Y, totalWidth, 2 * twoRowHeight).stroke();
    doc
      .moveTo(startX, row7Y + twoRowHeight)
      .lineTo(startX + totalWidth, row7Y + twoRowHeight)
      .stroke();
    doc
      .moveTo(startX + col1Width, row7Y)
      .lineTo(startX + col1Width, row7Y + 2 * twoRowHeight)
      .stroke();
    doc
      .moveTo(startX + col1Width + col2Width, row7Y)
      .lineTo(startX + col1Width + col2Width, row7Y + 2 * twoRowHeight)
      .stroke();

    // ROW 7
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("Type of Delivery:", startX + 5, row7Y + 5);

    let checkX = startX + 90;
    const checkY = row7Y + 2;
    drawCheckbox(checkX, checkY, consignment?.typeOfDelivery === "GODOWN");
    doc.text("GODOWN", checkX + checkboxSize + 5, row7Y + 5);

    checkX += 80;
    drawCheckbox(checkX, checkY, consignment?.typeOfDelivery === "DOOR");
    doc.text("DOOR", checkX + checkboxSize + 5, row7Y + 5);

    const col2StartX = startX + col1Width + 5;
    doc.text("BOOKING BRANCH:", col2StartX, row7Y + 5);
    doc
      .font("Helvetica-Bold")
      .text(consignment?.bookingBranch || "", col2StartX + 110, row7Y + 5);

    const col3StartX = startX + col1Width + col2Width + 5;
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("DATE:", col3StartX, row7Y + 5);
    doc
      .font("Helvetica-Bold")
      .text(
        formatDate(consignment?.bookingDate) || "",
        col3StartX + 40,
        row7Y + 5
      );

    // ROW 8
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("From:", startX + 5, row7Y + twoRowHeight + 5);
    doc
      .font("Helvetica-Bold")
      .text(consignment?.fromCity || "", startX + 50, row7Y + twoRowHeight + 5);

    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("TO:", col2StartX, row7Y + twoRowHeight + 5);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.toCity || "",
        col2StartX + 35,
        row7Y + twoRowHeight + 5
      );

    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("VEHICLE:", col3StartX, row7Y + twoRowHeight + 5);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.vehicle?.vehicleNumber || "",
        col3StartX + 60,
        row7Y + twoRowHeight + 5
      );

    // === CONSIGNOR/CONSIGNEE SECTION ===
    const totalHeightRow3 = 95;
    const mainRowHeight = 60;
    const subRowHeight = (totalHeightRow3 - mainRowHeight) / 2;

    const row9Y = row7Y + 2 * twoRowHeight;
    const twoColWidth = totalWidth / 2;

    doc.rect(startX, row9Y, totalWidth, totalHeightRow3).stroke();
    doc
      .moveTo(startX + twoColWidth, row9Y)
      .lineTo(startX + twoColWidth, row9Y + totalHeightRow3)
      .stroke();
    doc
      .moveTo(startX, row9Y + mainRowHeight)
      .lineTo(startX + totalWidth, row9Y + mainRowHeight)
      .stroke();
    doc
      .moveTo(startX, row9Y + mainRowHeight + subRowHeight)
      .lineTo(startX + totalWidth, row9Y + mainRowHeight + subRowHeight)
      .stroke();

    const paddingMain = 15;
    const paddingSub = 7;

    // CONSIGNOR & CONSIGNEE
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("CONSIGNOR:", startX + 5, row9Y + paddingMain);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.consignor?.name || "",
        startX + 85,
        row9Y + paddingMain
      );
    doc
      .font("Helvetica")
      .text(
        consignment?.consignor?.address || "",
        startX + 5,
        row9Y + paddingMain + 15,
        {
          width: twoColWidth - 10,
        }
      );

    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("CONSIGNEE:", startX + twoColWidth + 5, row9Y + paddingMain);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.consignee?.name || "",
        startX + twoColWidth + 85,
        row9Y + paddingMain
      );
    doc
      .font("Helvetica")
      .text(
        consignment?.consignee?.address || "",
        startX + twoColWidth + 5,
        row9Y + paddingMain + 15,
        {
          width: twoColWidth - 10,
        }
      );

    // Tel./Mob. No.
    const telY = row9Y + mainRowHeight + paddingSub;
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("Tel./Mob. No.:", startX + 5, telY);
    doc
      .font("Helvetica-Bold")
      .text(consignment?.consignor?.mobile || "", startX + 85, telY);

    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("Tel./Mob. No.:", startX + twoColWidth + 5, telY);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.consignee?.mobile || "",
        startX + twoColWidth + 85,
        telY
      );

    // G.S.T. No.
    const gstY = row9Y + mainRowHeight + subRowHeight + paddingSub;
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("G.S.T. No.:", startX + 5, gstY);
    doc
      .font("Helvetica-Bold")
      .text(consignment?.consignor?.gstNumber || "", startX + 85, gstY);

    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("G.S.T. No.:", startX + twoColWidth + 5, gstY);
    doc
      .font("Helvetica-Bold")
      .text(
        consignment?.consignee?.gstNumber || "",
        startX + twoColWidth + 85,
        gstY
      );

    // === MAIN TABLE ===
    const tableX = startX;
    const tableY = row9Y + totalHeightRow3;
    const tableW = 802;
    const tableH = 250;

    const colWidths = [50, 65, 300, 80, 80, 70, 50, 15, 50, 15];
    const colX = [tableX];
    for (let i = 0; i < colWidths.length; i++)
      colX.push(colX[i] + colWidths[i]);

    doc.rect(tableX, tableY, tableW, tableH).stroke();
    const headerHeight = 25;
    doc.rect(tableX, tableY, tableW, headerHeight).stroke();

    const tableRowHeight = (tableH - headerHeight) / 10;
    const yAtRow = (r) => tableY + headerHeight + r * tableRowHeight;

    const invoiceTopLiftPX = 32;
    const invoiceBottomDropPX = 22;
    const invTopY = yAtRow(7) - invoiceTopLiftPX;
    const invBottomY = yAtRow(8) + invoiceBottomDropPX;
    const cnoteBottomY = yAtRow(9);

    [1, 2, 3, 5, 6].forEach((i) => {
      doc
        .moveTo(colX[i], tableY)
        .lineTo(colX[i], tableY + tableH)
        .stroke();
    });
    doc.moveTo(colX[4], tableY).lineTo(colX[4], invTopY).stroke();

    for (let r = 1; r <= 10; r++) {
      const y = yAtRow(r);
      if (r === 1) {
        doc
          .moveTo(colX[6], y)
          .lineTo(tableX + tableW, y)
          .stroke();
      } else {
        doc
          .moveTo(colX[5], y)
          .lineTo(tableX + tableW, y)
          .stroke();
      }
    }

    [7, 8, 9].forEach((r) => {
      const y = yAtRow(r);
      doc.moveTo(colX[2], y).lineTo(colX[3], y).stroke();
    });

    [invTopY, invBottomY, cnoteBottomY].forEach((y) => {
      doc.moveTo(colX[3], y).lineTo(colX[5], y).stroke();
    });

    // Header labels
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Packages", colX[0] + 2, tableY + 8, {
      width: colWidths[0],
      align: "center",
    });
    doc.text("Method of\npacking", colX[1] + 2, tableY + 3, {
      width: colWidths[1],
      align: "center",
    });
    doc.text("Description of (Said to contain)", colX[2] + 2, tableY + 8, {
      width: colWidths[2],
    });
    doc.text("Actual Weight", colX[3] + 2, tableY + 8, {
      width: colWidths[3],
      align: "center",
    });
    doc.text("Charged Weight", colX[4] + 2, tableY + 8, {
      width: colWidths[4],
      align: "center",
    });
    doc.text("Rate\nPer Kg", colX[5] + 2, tableY + 3, {
      width: colWidths[5],
      align: "center",
    });

    doc.text("FREIGHT", colX[6], tableY + 3, {
      width: colWidths[6] + colWidths[7] + colWidths[8] + colWidths[9],
      align: "center",
    });

    const freightTitleLineY = tableY + 14;
    doc
      .moveTo(colX[6], freightTitleLineY)
      .lineTo(tableX + tableW, freightTitleLineY)
      .stroke();

    [7, 8, 9].forEach((i) => {
      doc
        .moveTo(colX[i], freightTitleLineY)
        .lineTo(colX[i], tableY + tableH)
        .stroke();
    });

    const subHeaderY = freightTitleLineY + 2;
    doc.fontSize(7);
    doc.text("Rs. Total", colX[6] + 2, subHeaderY + 2, {
      width: colWidths[6],
      align: "center",
    });
    doc.text("Ps.", colX[7] + 2, subHeaderY + 2, {
      width: colWidths[7],
      align: "center",
    });
    doc.text("Rs. Paid", colX[8] + 2, subHeaderY + 2, {
      width: colWidths[8],
      align: "center",
    });
    doc.text("Ps.", colX[9] + 2, subHeaderY + 2, {
      width: colWidths[9],
      align: "center",
    });

    // Add toPay text in Rs. Paid column center (rotated)
    if (consignment?.toPay) {
      doc.save();
      const rsPaidCenterX = colX[8] + colWidths[8] / 2;
      const rsPaidCenterY = tableY + headerHeight + (tableH - headerHeight) / 2;
      doc.translate(rsPaidCenterX, rsPaidCenterY);
      doc.rotate(-45);
      doc.fontSize(20).font("Helvetica-Bold").fillColor("#D11A1A").opacity(0.3);
      doc.text(consignment.toPay, -30, -10, {
        width: 60,
        align: "center",
      });
      doc.restore();
    }

    // First data row
    const contentY = tableY + headerHeight + 8;
    doc.fontSize(10).font("Helvetica").fillColor("black");

    doc.text(consignment?.packages?.toString() || "", colX[0] + 2, contentY, {
      width: colWidths[0] - 4,
      align: "center",
    });
    doc.text(consignment?.methodOfPacking || "Cartoon", colX[1] + 2, contentY, {
      width: colWidths[1] - 4,
      align: "center",
    });
    doc.text(consignment?.description || "", colX[2] + 4, contentY, {
      width: colWidths[2] - 8,
    });

    doc.text(
      consignment?.actualWeight?.toLocaleString("en-IN") || "",
      colX[3] + 2,
      contentY,
      { width: colWidths[3] - 4, align: "center" }
    );
    doc.text(
      consignment?.chargedWeight?.toLocaleString("en-IN") || "",
      colX[4] + 2,
      contentY,
      { width: colWidths[4] - 4, align: "center" }
    );

    // Replace the calculation with direct field access
    // ✅ UPDATED RATE LOGIC
    const rateValue = consignment?.rate;
    let rateDisplay = ""; // Default blank (not "-")

    if (
      rateValue !== null &&
      rateValue !== undefined &&
      rateValue !== "" &&
      rateValue !== 0
    ) {
      const numValue = Number(rateValue);
      if (!isNaN(numValue) && numValue > 0) {
        // Valid number → show with .00
        rateDisplay = formatDecimal(numValue);
      } else if (typeof rateValue === "string" && rateValue.trim() !== "") {
        // Non-empty string like "RATE" → show as is
        rateDisplay = rateValue;
      }
    }

    doc.text(rateDisplay, colX[5] + 2, contentY, {
      width: colWidths[5] - 4,
      align: "center",
    });

    const freightValue = consignment?.freight || 0;
    doc.text(formatDecimal(freightValue), colX[6] + 2, contentY, {
      width: colWidths[6] - 4,
      align: "center",
    });

    // Description bottom
    const descX = colX[2] + 4;
    const descRow7Y = yAtRow(7) + 4;
    const descRow8Y = yAtRow(8) + 4;
    const descRow9Y = yAtRow(9) + 4;

    // RISK section
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("RISK", colX[2] + 4, tableY + headerHeight + tableRowHeight * 6.5);
    const riskCheckY = tableY + headerHeight + tableRowHeight * 6.5 - 2;
    drawCheckbox(descX + 40, riskCheckY, consignment?.risk === "OWNER_RISK");
    doc
      .font("Helvetica")
      .fontSize(7)
      .text("OWNER RISK", descX + 55, riskCheckY + 2);
    drawCheckbox(descX + 120, riskCheckY, consignment?.risk === "CARRIER_RISK");
    doc.text("CARRIER RISK", descX + 135, riskCheckY + 2);

    // GST PAYABLE BY section
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("GST PAYABLE BY", descX, descRow7Y);
    const gstCheckY = descRow7Y + 5;
    drawCheckbox(
      descX + 80,
      gstCheckY,
      consignment?.gstPayableBy === "CONSIGNER"
    );
    doc
      .font("Helvetica")
      .fontSize(7)
      .text("CONSIGNOR", descX + 95, gstCheckY + 2);
    drawCheckbox(
      descX + 150,
      gstCheckY,
      consignment?.gstPayableBy === "CONSIGNEE"
    );
    doc.text("CONSIGNEE", descX + 165, gstCheckY + 2);
    drawCheckbox(
      descX + 220,
      gstCheckY,
      consignment?.gstPayableBy === "TRANSPORTER"
    );
    doc.text("TRANSPORTER", descX + 235, gstCheckY + 2);

    // PAN and GST numbers
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(
      `PAN NO. ${consignment?.pan || "AWDPM1568J"}`,
      descX,
      descRow8Y + 3
    );
    doc.text("GST NO. 24AWDPM1568J1ZF", descX + 150, descRow8Y + 3);

    doc.text("E-way Bill No.:", descX, descRow9Y);
    doc
      .font("Helvetica-Bold")
      .text(consignment?.eWayBillNumber || "", descX + 80, descRow9Y);

    // Merged block content
    const mergedLeftX = colX[3] + 8;
    const mergedCellW = colWidths[3] + colWidths[4] - 16;
    const invContentPadTop = 6;
    const invoiceLineGap = 10;

    const invBlockTopY = invTopY + invContentPadTop;
    doc.font("Helvetica").fontSize(10);
    const invLines = [
      `Invoice No.: ${consignment?.invoiceNumber || ""}`,
      `Date: ${formatDate(consignment?.bookingDate) || ""}`,
      `Value: ${
        consignment?.value != null ? formatDecimal(consignment.value) : ""
      }`,
    ];
    doc.text(invLines.join("\n"), mergedLeftX, invBlockTopY, {
      width: mergedCellW,
      lineGap: invoiceLineGap,
    });

    const cNoteY = invBottomY + 6;
    doc.text(
      `C. Note No.: ${consignment?.consignmentNumber || ""}`,
      mergedLeftX,
      cNoteY,
      { width: mergedCellW }
    );

    // Calculate all charges
    const hamali = consignment?.hamali || 0;
    const stCharges = consignment?.stCharges || 0;
    const doorDelivery = consignment?.doorDelivery || 0;
    const otherCharges = consignment?.otherCharges || 0;
    const riskCharges = consignment?.riskCharges || 0;
    const freight = consignment?.freight || 0;

    const chargesSubtotal =
      hamali + stCharges + doorDelivery + otherCharges + riskCharges;

    const totalWithFreight = freight + chargesSubtotal;

    const serviceTax = consignment?.serviceTax || 0;
    const grandTotal = consignment?.grandTotal || totalWithFreight + serviceTax;

    // Display charges
    const charges = [
      { label: "Hamali", value: hamali },
      { label: "S.T. Ch.", value: stCharges },
      { label: "DOOR DELIVERY", value: doorDelivery },
      { label: "Other Charges", value: otherCharges },
      { label: "Risk Charges", value: riskCharges },
      { label: "TOTAL", value: totalWithFreight, bold: true },
    ];

    charges.forEach((charge, index) => {
      const chargeY = tableY + headerHeight + (index + 2) * tableRowHeight + 4;
      doc.fontSize(8).font(charge.bold ? "Helvetica-Bold" : "Helvetica");
      doc.text(charge.label, colX[5] + 2, chargeY + 2, {
        width: colWidths[5] - 4,
        align: "center",
      });
      doc.text(formatDecimal(charge.value), colX[6] + 2, chargeY + 2, {
        width: colWidths[6] - 4,
        align: "center",
      });
    });

    const serviceTaxY = tableY + headerHeight + 8 * tableRowHeight + 4;
    const grandTotalY = tableY + headerHeight + 9 * tableRowHeight + 4;

    doc.fontSize(8).font("Helvetica");
    doc.text("Service Tax", colX[5] + 2, serviceTaxY + 2, {
      width: colWidths[5] - 4,
      align: "center",
    });
    doc.text(formatDecimal(serviceTax), colX[6] + 2, serviceTaxY + 2, {
      width: colWidths[6] - 4,
      align: "center",
    });

    doc
      .font("Helvetica-Bold")
      .text("Grand Total", colX[5] + 2, grandTotalY + 2, {
        width: colWidths[5] - 4,
        align: "center",
      });
    doc.text(formatDecimal(grandTotal), colX[6] + 2, grandTotalY + 2, {
      width: colWidths[6] - 4,
      align: "center",
    });

    // BOTTOM STRIP
    const stripY = tableY - 8 + tableH + 8;
    const stripH = 42;

    doc.rect(startX, stripY, totalWidth, stripH).stroke();

    doc.fontSize(9).font("Helvetica").fillColor("black");
    doc.text("Signature of Consignor", startX + 5, stripY + stripH - 14);

    const sigLineY = stripY + stripH - 9;
    const sigLineStartX = startX + 115;
    const sigLineEndX = startX + 360;
    doc.moveTo(sigLineStartX, sigLineY).lineTo(sigLineEndX, sigLineY).stroke();

    doc.fillColor("#D11A1A").font("Helvetica-Bold").fontSize(12);
    doc.text("KASHI VISHWANATH LOGISTICS", startX, stripY + stripH - 18, {
      width: totalWidth - 10,
      align: "right",
    });
  };

  // === RENDER ALL 3 PAGES ===
  // Page 1: CONSIGNEE COPY
  renderPage("CONSIGNEE COPY");

  // Page 2: DRIVER COPY
  doc.addPage();
  renderPage("DRIVER COPY");

  // Page 3: CONSIGNOR COPY
  doc.addPage();
  renderPage("CONSIGNOR COPY");

  doc.end();
};
