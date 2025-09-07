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
  // Find the latest freight bill
  const latestBill = await FreightBill.findOne()
    .sort({ createdAt: -1 })
    .select("billNumber");

  let nextNumber = 1;

  if (latestBill && latestBill.billNumber) {
    // Extract the number part
    const match = latestBill.billNumber.match(/FB(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  // Format: FB + 4-digit number (e.g., FB0001)
  return `FB${nextNumber.toString().padStart(4, "0")}`;
};
