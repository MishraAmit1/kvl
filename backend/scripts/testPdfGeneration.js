import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { Writable } from "stream";
// Import your Consignment model - adjust path as needed
import { Consignment } from "../src/models/consignment.model.js";
import { Customer } from "../src/models/customer.model.js";
import { Vehicle } from "../src/models/vehicle.model.js";
import { Driver } from "../src/models/driver.model.js";
// MongoDB connection - adjust your connection string
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://amsmisho:4tiSUTTlNheVCOmS@cluster0.rpm4unw.mongodb.net/kvl";

// Mock response object for testing
class MockResponse extends Writable {
  constructor() {
    super();
    this.headers = {};
    this.statusCode = 200;
    this.data = [];
  }

  setHeader(key, value) {
    this.headers[key] = value;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.data.push(data);
    return this;
  }

  _write(chunk, encoding, callback) {
    // Ignore PDF data for testing
    callback();
  }
}

// Test PDF generation for a single consignment
async function testSinglePDF(consignment) {
  const mockRes = new MockResponse();
  const errors = [];
  const warnings = [];

  try {
    // Check for critical missing data
    if (!consignment.consignmentNumber) {
      errors.push("Missing consignment number");
    }

    // Check numeric fields
    const numericFields = [
      "freight",
      "hamali",
      "stCharges",
      "doorDelivery",
      "otherCharges",
      "riskCharges",
      "serviceTax",
      "grandTotal",
      "actualWeight",
      "chargedWeight",
      "value",
      "rate",
      "packages",
    ];

    numericFields.forEach((field) => {
      const value = consignment[field];
      if (value !== undefined && value !== null) {
        if (isNaN(Number(value))) {
          errors.push(`Invalid ${field}: "${value}" is not a number`);
        } else if (value < 0) {
          warnings.push(`Negative ${field}: ${value}`);
        }
      }
    });

    // Check required nested objects
    if (!consignment.consignor || typeof consignment.consignor !== "object") {
      errors.push("Missing or invalid consignor object");
    } else {
      if (!consignment.consignor.name) warnings.push("Missing consignor name");
      if (!consignment.consignor.mobile)
        warnings.push("Missing consignor mobile");
    }

    if (!consignment.consignee || typeof consignment.consignee !== "object") {
      errors.push("Missing or invalid consignee object");
    } else {
      if (!consignment.consignee.name) warnings.push("Missing consignee name");
      if (!consignment.consignee.mobile)
        warnings.push("Missing consignee mobile");
    }

    // Check dates
    if (consignment.bookingDate) {
      const date = new Date(consignment.bookingDate);
      if (isNaN(date.getTime())) {
        errors.push(`Invalid booking date: ${consignment.bookingDate}`);
      }
    }

    // Try to create a minimal PDF to test for crashes
    const doc = new PDFDocument();
    doc.pipe(mockRes);

    // Test critical operations that might fail
    doc.text(consignment.consignmentNumber || "TEST");
    doc.text(String(consignment.freight || 0));
    doc.text(consignment.consignor?.name || "N/A");
    doc.text(consignment.consignee?.name || "N/A");

    doc.end();

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [...errors, `PDF Generation Error: ${error.message}`],
      warnings,
    };
  }
}

// Main test function
async function testAllConsignments() {
  console.log("🔍 Starting PDF Generation Test...\n");

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Get all consignments
    const consignments = await Consignment.find({})
      .populate("consignor.customerId")
      .populate("consignee.customerId")
      .populate("vehicle.vehicleId")
      .populate("vehicle.driverId")
      .lean();

    console.log(`📦 Found ${consignments.length} consignments to test\n`);

    const results = {
      total: consignments.length,
      successful: 0,
      failed: 0,
      withWarnings: 0,
      failedConsignments: [],
      consignmentsWithWarnings: [],
    };

    // Test each consignment
    for (let i = 0; i < consignments.length; i++) {
      const consignment = consignments[i];
      process.stdout.write(`Testing ${i + 1}/${consignments.length}... `);

      const testResult = await testSinglePDF(consignment);

      if (!testResult.success) {
        results.failed++;
        results.failedConsignments.push({
          id: consignment._id,
          number: consignment.consignmentNumber || "NO_NUMBER",
          errors: testResult.errors,
          warnings: testResult.warnings,
          data: {
            freight: consignment.freight,
            hasConsignor: !!consignment.consignor,
            hasConsignee: !!consignment.consignee,
            status: consignment.status,
          },
        });
        console.log("❌ FAILED");
      } else if (testResult.warnings.length > 0) {
        results.successful++;
        results.withWarnings++;
        results.consignmentsWithWarnings.push({
          id: consignment._id,
          number: consignment.consignmentNumber,
          warnings: testResult.warnings,
        });
        console.log("⚠️  SUCCESS (with warnings)");
      } else {
        results.successful++;
        console.log("✅ SUCCESS");
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Consignments: ${results.total}`);
    console.log(
      `✅ Successful: ${results.successful} (${(
        (results.successful / results.total) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `❌ Failed: ${results.failed} (${(
        (results.failed / results.total) *
        100
      ).toFixed(1)}%)`
    );
    console.log(`⚠️  With Warnings: ${results.withWarnings}`);

    // Show failed consignments details
    if (results.failed > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("❌ FAILED CONSIGNMENTS DETAILS");
      console.log("=".repeat(60));

      results.failedConsignments.forEach((fc, index) => {
        console.log(`\n${index + 1}. Consignment: ${fc.number} (ID: ${fc.id})`);
        console.log("   Errors:");
        fc.errors.forEach((error) => console.log(`   - ${error}`));
        if (fc.warnings.length > 0) {
          console.log("   Warnings:");
          fc.warnings.forEach((warning) => console.log(`   - ${warning}`));
        }
        console.log("   Debug Info:", JSON.stringify(fc.data, null, 2));
      });
    }

    // Show warnings if any
    if (
      results.withWarnings > 0 &&
      results.consignmentsWithWarnings.length <= 10
    ) {
      console.log("\n" + "=".repeat(60));
      console.log("⚠️  CONSIGNMENTS WITH WARNINGS (First 10)");
      console.log("=".repeat(60));

      results.consignmentsWithWarnings.slice(0, 10).forEach((cw, index) => {
        console.log(`\n${index + 1}. Consignment: ${cw.number}`);
        cw.warnings.forEach((warning) => console.log(`   - ${warning}`));
      });
    }

    // Save detailed report
    const fs = require("fs");
    const reportPath = `./pdf-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run the test
console.log("🚀 KVL PDF Generation Test Script\n");
testAllConsignments();
