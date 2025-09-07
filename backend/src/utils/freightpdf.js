export const generateFreightBillPDF = async (freightBill) => {
  try {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

    // Create buffer to return
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Comprehensive null checks
    if (!freightBill) {
      throw new Error("Freight bill data is required");
    }

    if (!freightBill.party) {
      throw new Error("Freight bill party information is missing");
    }

    if (!freightBill.party.name) {
      throw new Error("Party name is required");
    }

    if (!freightBill.consignments || !Array.isArray(freightBill.consignments)) {
      throw new Error("Freight bill must have consignments array");
    }

    if (freightBill.consignments.length === 0) {
      throw new Error("Freight bill must have at least one consignment");
    }

    console.log("PDF Generation - Freight Bill Data:", {
      billNumber: freightBill.billNumber,
      partyName: freightBill.party.name,
      consignmentsCount: freightBill.consignments.length,
      finalAmount: freightBill.finalAmount,
    });

    // === WATERMARK (very light, behind everything) ===
    {
      const pageW = doc.page.width;
      const pageH = doc.page.height;

      doc.save();

      // Very faint brand red
      doc.fillColor("#D11A1A").opacity(0.06); // 6% opacity
      doc.font("Helvetica-Bold");

      const wmSize = 260; // size adjust: 220–300
      doc.fontSize(wmSize);

      // Rotate around center so placement consistent
      doc.rotate(-30, { origin: [pageW / 2, pageH / 2] });

      const wmText = "KVL";
      const wmWidth = doc.widthOfString(wmText);

      // Center the text on the page
      const x = (pageW - wmWidth) / 2;
      const y = (pageH - wmSize) / 2; // approx vertical center
      doc.text(wmText, x, y);

      doc.restore(); // reset rotation/opacity so rest of PDF is unaffected
    }
    // === END WATERMARK ===

    // Clean, professional KVL logo using filled polygons (no stroke fuzz)
    const drawKVLLogo = (doc, x, y, opts = {}) => {
      const h = opts.height ?? 18; // overall height
      const color = opts.color ?? "#D11A1A"; // brand red
      const t = opts.thickness ?? Math.max(2, Math.round(h * 0.2)); // weight ~20%
      const gap = opts.gap ?? Math.round(h * 0.06); // K bar gap from slants
      const skew = opts.skew ?? Math.max(1, h * 0.09); // L top slant

      // helper: draw a thick band between two points as a filled quad
      const band = (x1, y1, x2, y2, w) => {
        const dx = x2 - x1,
          dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len,
          ny = dx / len; // unit normal
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

      // K: vertical bar (solid)
      doc.rect(x, y, t, h).fill();

      // K: two slanted arms (solid bands)
      const kJointX = x + t + gap;
      const kJointY = y + h * 0.5;
      const kEndX = x + h * 0.52; // reach a bit right for boldness
      band(kJointX, kJointY, kEndX, y + h * 0.12, t); // upper arm
      band(kJointX, kJointY, kEndX, y + h * 0.88, t); // lower arm

      // V: check-mark (two solid bands, deeper apex)
      const vLeftX = x + h * 0.6;
      const vLeftY = y + h * 0.14;
      const vApexX = x + h * 0.78;
      const vApexY = y + h * 0.72; // deeper apex for that 'tick' look
      const vRightX = x + h * 1.05;
      const vRightY = y + h * 0.1;
      band(vLeftX, vLeftY, vApexX, vApexY, t);
      band(vApexX, vApexY, vRightX, vRightY, t);

      // L: vertical with slanted top + foot (all filled)
      const lX = x + h * 1.12; // slight shift to the right for spacing
      // Slanted-top vertical (parallelogram)
      doc
        .moveTo(lX, y)
        .lineTo(lX + t, y + skew)
        .lineTo(lX + t, y + h)
        .lineTo(lX, y + h)
        .closePath()
        .fill();

      // L foot (long base)
      const footLen = h * 0.5;
      doc.rect(lX, y + h - t, footLen, t).fill();

      doc.restore();
    };

    const formatDate = (date) => {
      if (!date) return "N/A";
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${d.getFullYear()}`;
      } catch (error) {
        console.error("Date formatting error:", error);
        return "N/A";
      }
    };

    const formatNumber = (num) => {
      if (num === null || num === undefined || isNaN(num)) return "0";
      return Number(num).toString();
    };

    const formatDecimal = (num, decimals = 2) => {
      if (num === null || num === undefined || isNaN(num)) return "0.00";
      return Number(num).toFixed(decimals);
    };

    // Enhanced number to words conversion function
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

      const scales = ["", "Thousand", "Lakh", "Crore"];

      const convertGroup = (n) => {
        let result = "";

        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + " Hundred ";
          n %= 100;
        }

        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + " ";
          n %= 10;
        }

        if (n > 0) {
          result += ones[n] + " ";
        }

        return result;
      };

      let number = Math.floor(num);
      let words = "";
      let scaleIndex = 0;

      // Handle Indian numbering system (Lakhs and Crores)
      if (number >= 10000000) {
        const crores = Math.floor(number / 10000000);
        words += convertGroup(crores) + "Crore ";
        number %= 10000000;
      }

      if (number >= 100000) {
        const lakhs = Math.floor(number / 100000);
        words += convertGroup(lakhs) + "Lakh ";
        number %= 100000;
      }

      if (number >= 1000) {
        const thousands = Math.floor(number / 1000);
        words += convertGroup(thousands) + "Thousand ";
        number %= 1000;
      }

      if (number > 0) {
        words += convertGroup(number);
      }

      return words.trim();
    };

    // === Outer Border ===
    doc.rect(20, 20, 802, 555).stroke();

    // === Header ===
    const margin = 20;
    const pageWidth = doc.page.width;

    // Much larger KVL Logo at the left
    drawKVLLogo(doc, margin + 5, margin + 5, { height: 45, color: "#FF0000" });

    doc
      .fontSize(13)
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("Mob : 9737138629", pageWidth - 150, margin + 12);
    doc.fontSize(13).text("SUBJECT TO VAPI JURISDICTION ONLY", 0, margin + 9, {
      align: "center",
      width: pageWidth,
    });

    // Company name with special styling - larger, bold, spaced letters
    doc
      .fontSize(20)
      .fillColor("#FF0000")
      .font("Helvetica-Bold")
      .text("KASHI VISHWANATH LOGISTICS", {
        align: "center",
        characterSpacing: 1, // Add letter spacing
      });
    doc
      .fontSize(13)
      .fillColor("black")
      .text("FLEET OWNERS & TRANSPORT CONTRACTORS", 0, margin + 49, {
        align: "center",
      });
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(
        "Plot No. 66, Gala No. 01, Vapi Processing Compound Near Sunita Textile 1st Phase GIDC",
        0,
        margin + 69,
        { align: "center" }
      )
      .text("Vapi-396 195 (Gujarat)", 0, margin + 84, { align: "center" });

    doc.moveTo(20, 120).lineTo(822, 120).stroke();

    // === FREIGHT BILL ROW ===
    const topY = 130;
    const lineHeight = 14;

    // Centered Title "FREIGHT BILL"
    doc.fontSize(14).font("Helvetica-Bold").text("FREIGHT BILL", 20, topY, {
      align: "center",
      width: 802,
    });

    // Left Section: Party's Name & Address
    const leftX = 25;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Party's Name & Address", leftX, topY + lineHeight);

    // Safe party data access
    const partyName = freightBill.party?.name || "N/A";
    const partyAddress = freightBill.party?.address || "N/A";

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(partyName, leftX, topY + lineHeight * 2, {
        width: 400,
      })
      .text(partyAddress, leftX, topY + lineHeight * 3, {
        width: 400,
      });

    // Right Section: Bill Info
    const rightX = 550;

    doc.font("Helvetica-Bold").text("Bill No.:", rightX, topY + lineHeight * 2);
    doc
      .font("Helvetica")
      .text(
        freightBill.billNumber || "N/A",
        rightX + 60,
        topY + lineHeight * 2
      );

    doc
      .font("Helvetica-Bold")
      .text("Bill Date:", rightX, topY + lineHeight * 3);
    doc
      .font("Helvetica")
      .text(
        formatDate(freightBill.billDate),
        rightX + 60,
        topY + lineHeight * 3
      );

    doc
      .font("Helvetica-Bold")
      .text("Billing Branch:", rightX, topY + lineHeight * 4);
    doc
      .font("Helvetica")
      .text(
        freightBill.billingBranch || "N/A",
        rightX + 80,
        topY + lineHeight * 4
      );

    doc.moveTo(20, 200).lineTo(822, 200).stroke();

    // === Main Table ===
    const tableY = 200;
    const colX = [20, 90, 160, 230, 300, 370, 440, 510, 580, 650, 755, 822];
    const rowHeight = 28;

    const headers = [
      "Consignment No.",
      "Consignment Date",
      "Destination",
      "Charged Weight",
      "Rate",
      "Freight",
      "Charge Statical",
      "Hamali",
      "Local Collection",
      "Door Delivery Charge",
      "GRAND TOTAL",
    ];

    // Draw headers
    headers.forEach((header, i) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(header, colX[i] + 2, tableY + 6, {
          width: colX[i + 1] - colX[i] - 4,
          align: "center",
        });
    });

    // Draw vertical lines for data rows (first 9 rows)
    for (let i = 0; i < colX.length; i++) {
      doc
        .moveTo(colX[i], tableY)
        .lineTo(colX[i], tableY + 9 * rowHeight)
        .stroke();
    }

    // Draw horizontal lines for data rows (first 9 rows)
    for (let i = 1; i <= 9; i++) {
      doc
        .moveTo(colX[0], tableY + i * rowHeight)
        .lineTo(colX[colX.length - 1], tableY + i * rowHeight)
        .stroke();
    }

    // Fill consignment data with proper error handling
    let currentY = tableY + rowHeight;
    let totalGrandTotal = 0;

    // Validate consignments array before processing
    const validConsignments = freightBill.consignments.filter(
      (consignment) => consignment && typeof consignment === "object"
    );

    if (validConsignments.length === 0) {
      throw new Error("No valid consignments found in freight bill");
    }

    validConsignments.forEach((consignment, index) => {
      if (index < 8) {
        // Max 8 rows
        try {
          doc.font("Helvetica").fontSize(9);

          // Safe data extraction with fallbacks
          const consignmentNumber = consignment.consignmentNumber || "N/A";
          const consignmentDate =
            consignment.consignmentDate || consignment.bookingDate;
          const destination =
            consignment.destination || consignment.toCity || "N/A";
          const chargedWeight = consignment.chargedWeight || 0;
          const rate = consignment.rate || 0;
          const freight = consignment.freight || 0;
          const stCharges = consignment.stCharges || 0;
          const hamali = consignment.hamali || 0;
          const otherCharges = consignment.otherCharges || 0;
          const doorDelivery = consignment.doorDelivery || 0;
          const grandTotal = consignment.grandTotal || 0;

          // Consignment No
          doc.text(consignmentNumber, colX[0] + 2, currentY + 8, {
            width: colX[1] - colX[0] - 4,
            align: "center",
          });

          // Date
          doc.text(formatDate(consignmentDate), colX[1] + 2, currentY + 8, {
            width: colX[2] - colX[1] - 4,
            align: "center",
          });

          // Destination
          doc.text(destination, colX[2] + 2, currentY + 8, {
            width: colX[3] - colX[2] - 4,
            align: "center",
          });

          // Weight
          doc.text(formatNumber(chargedWeight), colX[3] + 2, currentY + 8, {
            width: colX[4] - colX[3] - 4,
            align: "center",
          });

          // Rate
          doc.text(formatDecimal(rate), colX[4] + 2, currentY + 8, {
            width: colX[5] - colX[4] - 4,
            align: "center",
          });

          // Freight
          doc.text(formatNumber(freight), colX[5] + 2, currentY + 8, {
            width: colX[6] - colX[5] - 4,
            align: "center",
          });

          // ST Charges
          doc.text(formatNumber(stCharges), colX[6] + 2, currentY + 8, {
            width: colX[7] - colX[6] - 4,
            align: "center",
          });

          // Hamali
          doc.text(formatNumber(hamali), colX[7] + 2, currentY + 8, {
            width: colX[8] - colX[7] - 4,
            align: "center",
          });

          // Other charges
          doc.text(formatNumber(otherCharges), colX[8] + 2, currentY + 8, {
            width: colX[9] - colX[8] - 4,
            align: "center",
          });

          // Door Delivery
          doc.text(formatNumber(doorDelivery), colX[9] + 2, currentY + 8, {
            width: colX[10] - colX[9] - 4,
            align: "center",
          });

          // Grand Total
          doc.text(formatNumber(grandTotal), colX[10] + 2, currentY + 8, {
            width: colX[11] - colX[10] - 4,
            align: "center",
          });

          totalGrandTotal += Number(grandTotal) || 0;
          currentY += rowHeight;
        } catch (consignmentError) {
          console.error(
            `Error processing consignment ${index}:`,
            consignmentError
          );
          // Continue with next consignment instead of failing completely
        }
      }
    });

    // === Final Row: Amount in Words & Total ===
    const tenthRowY = tableY + 9 * rowHeight;

    // Draw the final row structure - Modified for single column layout
    // Left border for amount in words section
    doc
      .moveTo(colX[0], tenthRowY)
      .lineTo(colX[0], tenthRowY + rowHeight)
      .stroke();
    // Separator between amount in words and total sections
    doc
      .moveTo(colX[9], tenthRowY)
      .lineTo(colX[9], tenthRowY + rowHeight)
      .stroke();
    // Separator between TOTAL label and amount
    doc
      .moveTo(colX[10], tenthRowY)
      .lineTo(colX[10], tenthRowY + rowHeight)
      .stroke();
    // Right border
    doc
      .moveTo(colX[11], tenthRowY)
      .lineTo(colX[11], tenthRowY + rowHeight)
      .stroke();
    // Bottom border
    doc
      .moveTo(colX[0], tenthRowY + rowHeight)
      .lineTo(colX[11], tenthRowY + rowHeight)
      .stroke();

    // Amount in Words - spans from first column to 9th column (single wide section)
    const finalAmount = freightBill.finalAmount || 0;
    const amountInWords = `Amount in Words: Rupees ${numberToWords(
      finalAmount
    )} Only`;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(amountInWords, colX[0] + 5, tenthRowY + 8, {
        width: colX[9] - colX[0] - 10,
      });

    // TOTAL label
    doc.fontSize(13).text("TOTAL", colX[9] + 4, tenthRowY + 8, {
      width: colX[10] - colX[9],
      align: "center",
    });

    // Final amount
    doc.text(
      formatNumber(freightBill.finalAmount),
      colX[10] + 2,
      tenthRowY + 6,
      {
        width: colX[11] - colX[10] - 4,
        align: "center",
      }
    );

    // === Footer Section ===
    const footerY = tableY + 10 * rowHeight + 25;

    // LEFT
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("black")
      .text("PAN NO : AWDPM1568J", 30, footerY);
    doc.font("Helvetica").text("A/C PAYEE CHEQUE/RTGS/NEFT", 30, footerY + 18);
    doc.text('In Favour of "KASHI VISHWANATH LOGISTICS"', 30, footerY + 36);

    // Bank Details Box
    const boxWidth = 220;
    const boxHeight = 80;
    const boxYOffset = 18;
    const boxX = margin + (pageWidth - margin * 2 - boxWidth) / 2;
    const boxY = footerY - boxYOffset;

    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8).stroke();

    const lineSpacing = 18;

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("HDFC BANK", boxX, boxY + 15, {
        align: "center",
        width: boxWidth,
      });
    doc
      .font("Helvetica")
      .fontSize(13)
      .text("A/C.NO. 50200099907585", boxX, boxY + 15 + lineSpacing, {
        align: "center",
        width: boxWidth,
      });
    doc.text("IFSC: HDFC0005681", boxX, boxY + 15 + lineSpacing * 2, {
      align: "center",
      width: boxWidth,
    });

    // RIGHT SIGNATURE
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#FF0000")
      .text("For, KASHI VISHWANATH LOGISTICS", 550, footerY + 6);

    // GST Number if available
    if (freightBill.party && freightBill.party.gstNumber) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("black")
        .text(`GST No : ${"24AWDPM1568J1ZF"}`, 30, footerY + 54);
    }

    doc.end();

    // Return buffer with proper error handling
    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0) {
            reject(new Error("Generated PDF buffer is empty"));
          } else {
            console.log(
              "PDF generated successfully, buffer size:",
              buffer.length
            );
            resolve(buffer);
          }
        } catch (error) {
          console.error("Error creating PDF buffer:", error);
          reject(new Error("Failed to create PDF buffer"));
        }
      });

      doc.on("error", (error) => {
        console.error("PDFKit error:", error);
        reject(new Error(`PDF generation failed: ${error.message}`));
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        reject(new Error("PDF generation timeout"));
      }, 30000); // 30 seconds timeout
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};
