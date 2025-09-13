import { Consignment } from "../models/consignment.model.js";
import { FreightBill } from "../models/freightbill.model.js";

export const generateConsignmentNumber = async () => {
  const year = new Date().getFullYear();

  // Find the last consignment number for current year
  const lastConsignment = await Consignment.findOne({
    consignmentNumber: { $regex: `^KVL-${year}-` },
  }).sort({ consignmentNumber: -1 });

  let nextNumber = 1;
  if (lastConsignment) {
    const lastNumber = parseInt(
      lastConsignment.consignmentNumber.split("-")[2]
    );
    nextNumber = lastNumber + 1;
  }

  return `KVL-${year}-${nextNumber.toString().padStart(6, "0")}`;
};

export const generateFreightBillNumber = async () => {
  const currentYear = new Date().getFullYear();
  // Find the latest bill for the current year only
  const latestBill = await FreightBill.findOne({
    billNumber: { $regex: `^KVL${currentYear}` },
  })
    .sort({ createdAt: -1 })
    .select("billNumber");

  let nextNumber = 1;

  if (latestBill && latestBill.billNumber) {
    // Extract the 5-digit number after KVL<Year>
    const match = latestBill.billNumber.match(
      new RegExp(`^KVL${currentYear}(\\d{5})$`)
    );
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  // Format: KVL + Year + 5-digit zero-padded number
  return `KVL${currentYear}${nextNumber.toString().padStart(5, "0")}`;
};
