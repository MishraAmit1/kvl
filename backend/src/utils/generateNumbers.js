import { Consignment } from "../models/consignment.model.js";
import { FreightBill } from "../models/freightbill.model.js";

export const generateConsignmentNumber = async () => {
  // Find the last consignment number that starts with KVL-
  const lastConsignment = await Consignment.findOne({
    consignmentNumber: { $regex: "^KVL-" },
  }).sort({ consignmentNumber: -1 });

  let nextNumber = 796; // Starting number

  if (lastConsignment) {
    // Extract the number part after KVL-
    const match = lastConsignment.consignmentNumber.match(/^KVL-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `KVL-${nextNumber}`;
};

export const generateFreightBillNumber = async () => {
  const now = new Date();
  let year = now.getFullYear();
  const month = now.getMonth() + 1; // month is 0-indexed

  // 🟢 Financial year logic:
  // Jan–Mar → previous year as start
  // Apr–Dec → current year as start
  let fyStart, fyEnd;
  if (month <= 3) {
    // Jan, Feb, Mar → FY = (prevYear - currentYear)
    fyStart = year - 1;
    fyEnd = year;
  } else {
    // Apr–Dec → FY = (currentYear - nextYear)
    fyStart = year;
    fyEnd = year + 1;
  }

  const fyString = `${fyStart}-${fyEnd}`;

  // Find last bill for this financial year
  const latestBill = await FreightBill.findOne({
    billNumber: { $regex: `^KVL/${fyString}/` },
  })
    .sort({ createdAt: -1 })
    .select("billNumber");

  let nextNumber = 1;

  if (latestBill && latestBill.billNumber) {
    // Extract trailing number after KVL/FY/
    const match = latestBill.billNumber.match(
      new RegExp(`^KVL/${fyString}/(\\d+)$`)
    );
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  // Final formatted number
  return `KVL/${fyString}/${nextNumber}`;
};
