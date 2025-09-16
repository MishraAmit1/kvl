import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ApiService from "../services/api";
import { toast } from "react-hot-toast";
import {
  Download,
  Mail,
  CheckCircle,
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Printer,
  Edit,
  Eye,
} from "lucide-react";

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATED: "bg-yellow-100 text-yellow-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const FreightBillDetails = ({ billId, onClose, onRefresh }) => {
  const [billDetails, setBillDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    billNumber: "",
    billDate: "",
    billingBranch: "",
  });
  useEffect(() => {
    if (billDetails && editModal) {
      setEditForm({
        billNumber: billDetails.billNumber || "",
        billDate: billDetails.billDate
          ? new Date(billDetails.billDate).toISOString().split("T")[0]
          : "",
        billingBranch: billDetails.billingBranch || "",
      });
    }
  }, [billDetails, editModal]);

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getFreightBillById(billId);
      setBillDetails(response.data);
    } catch (err) {
      console.error("Error fetching bill details:", err);
      setError(err.message || "Failed to load bill details");
      toast.error(err.message || "Failed to load bill details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/freight-bills/${billId}/pdf`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FreightBill-${billDetails.billNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error(err?.message || "Failed to download PDF.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/freight-bills/${billId}/pdf`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error("Failed to fetch PDF for print.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err?.message || "Failed to print PDF.");
      console.error(err);
    }
  };

  const handleSendEmail = async (email = null) => {
    try {
      setActionLoading(true);
      await ApiService.sendFreightBillEmail(billId, email);
      toast.success("Bill sent via email successfully!");
      setEmailModal(false);
      setCustomEmail("");
      fetchBillDetails(); // Refresh to update status
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error(err.message || "Failed to send email.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (window.confirm(`Mark bill ${billDetails.billNumber} as paid?`)) {
      try {
        setActionLoading(true);
        await ApiService.markFreightBillAsPaid(billId);
        toast.success("Bill marked as paid successfully!");
        fetchBillDetails(); // Refresh bill details
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error("Error marking bill as paid:", err);
        toast.error(err.message || "Failed to mark bill as paid.");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(true);
      await ApiService.updateFreightBillStatus(billId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchBillDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div className="mt-2">Loading bill details...</div>
      </div>
    );
  }

  if (error || !billDetails) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <div className="text-red-500 mb-4">
          {error || "No bill details found"}
        </div>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {billDetails.billNumber}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_COLORS[billDetails.status]
              }`}
            >
              {billDetails.status.replace("_", " ")}
            </span>
            <span className="text-muted-foreground text-sm">
              Generated on {new Date(billDetails.billDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModal(true)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={actionLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            disabled={actionLoading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (
                window.confirm("Are you sure you want to delete this bill?")
              ) {
                try {
                  await ApiService.deleteFreightBill(billId);
                  toast.success("Bill deleted successfully!");
                  onClose();
                  onRefresh();
                } catch (err) {
                  toast.error("Delete failed: " + err.message);
                }
              }
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Delete Bill
          </Button>
          {billDetails.status !== "PAID" &&
            billDetails.status !== "CANCELLED" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailModal(true)}
                  disabled={actionLoading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>

                {billDetails.status !== "DRAFT" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMarkPaid}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Paid
                  </Button>
                )}
              </>
            )}

          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Party Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Party Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {billDetails.party?.name}
                  </div>
                  <div>
                    <strong>Address:</strong> {billDetails.party?.address}
                  </div>
                  {billDetails.party?.gstNumber && (
                    <div>
                      <strong>GST Number:</strong> {billDetails.party.gstNumber}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Billing Branch:</strong> {billDetails.billingBranch}
                  </div>
                  <div>
                    <strong>Bill Date:</strong>{" "}
                    {new Date(billDetails.billDate).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Created By:</strong>{" "}
                    {billDetails.createdBy?.username || "System"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Consignments */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Consignments ({billDetails.consignments?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Consignment No</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Destination</th>
                    <th className="p-2 text-right">Weight (kg)</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Freight</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billDetails.consignments?.map((consignment, index) => (
                    <tr key={index} className="border-b hover:bg-accent/40">
                      <td className="p-2 font-medium">
                        {consignment.consignmentNumber}
                      </td>
                      <td className="p-2">
                        {new Date(
                          consignment.consignmentDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="p-2">{consignment.destination}</td>
                      <td className="p-2 text-right">
                        {consignment.chargedWeight}
                      </td>
                      <td className="p-2 text-right">
                        ₹{consignment.rate?.toLocaleString()}
                      </td>
                      <td className="p-2 text-right">
                        ₹{consignment.freight?.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-medium">
                        ₹{consignment.grandTotal?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-medium">
                    <td colSpan={6} className="p-2 text-right">
                      Subtotal:
                    </td>
                    <td className="p-2 text-right">
                      ₹{billDetails.totalAmount?.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Adjustments */}
          {billDetails.adjustments?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Adjustments
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billDetails.adjustments.map((adj, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{adj.type.replace("_", " ")}</td>
                        <td className="p-2">{adj.description}</td>
                        <td
                          className={`p-2 text-right font-medium ${
                            adj.type === "DISCOUNT"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {adj.type === "DISCOUNT" ? "- " : "+ "}₹
                          {Math.abs(adj.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bill Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Bill Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Consignments Total:</span>
                <span>₹{billDetails.totalAmount?.toLocaleString()}</span>
              </div>

              {billDetails.adjustments?.map((adj, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {adj.type.replace("_", " ")}:
                  </span>
                  <span
                    className={
                      adj.type === "DISCOUNT"
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {adj.type === "DISCOUNT" ? "- " : "+ "}₹
                    {Math.abs(adj.amount).toLocaleString()}
                  </span>
                </div>
              ))}

              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Final Amount:</span>
                <span className="text-primary">
                  ₹{billDetails.finalAmount?.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          {billDetails.status !== "PAID" &&
            billDetails.status !== "CANCELLED" && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {billDetails.status === "DRAFT" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate("GENERATED")}
                      disabled={actionLoading}
                    >
                      Generate Bill
                    </Button>
                  )}

                  {billDetails.status === "GENERATED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setEmailModal(true)}
                      disabled={actionLoading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send to Customer
                    </Button>
                  )}

                  {["GENERATED", "SENT"].includes(billDetails.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusUpdate("PARTIALLY_PAID")}
                      disabled={actionLoading}
                    >
                      Mark Partially Paid
                    </Button>
                  )}
                </div>
              </Card>
            )}

          {/* Bill Statistics */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Bill Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Consignments:</span>
                <span className="font-medium">
                  {billDetails.consignments?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Weight:</span>
                <span className="font-medium">
                  {billDetails.consignments?.reduce(
                    (sum, c) => sum + (c.chargedWeight || 0),
                    0
                  )}{" "}
                  kg
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Rate:</span>
                <span className="font-medium">
                  ₹
                  {billDetails.consignments?.length > 0
                    ? Math.round(
                        billDetails.totalAmount /
                          billDetails.consignments.reduce(
                            (sum, c) => sum + (c.chargedWeight || 0),
                            0
                          )
                      )
                    : 0}
                  /kg
                </span>
              </div>
              <div className="flex justify-between">
                <span>Adjustments:</span>
                <span className="font-medium">
                  {billDetails.adjustments?.length || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Status History */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Status History
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>
                  Created:{" "}
                  {new Date(billDetails.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span>
                  Last Updated:{" "}
                  {new Date(billDetails.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    billDetails.status === "PAID"
                      ? "bg-green-500"
                      : billDetails.status === "SENT"
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`}
                ></div>
                <span>Current: {billDetails.status.replace("_", " ")}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Bill via Email
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEmailModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder={
                    billDetails.party?.customerId?.email ||
                    "Enter email address"
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Leave empty to use customer's default email
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEmailModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSendEmail(customEmail || null)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Freight Bill</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Bill Number</label>
                <input
                  type="text"
                  value={editForm.billNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, billNumber: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Bill Date</label>
                <input
                  type="date"
                  value={editForm.billDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, billDate: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Billing Branch</label>
                <input
                  type="text"
                  value={editForm.billingBranch}
                  onChange={(e) =>
                    setEditForm({ ...editForm, billingBranch: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await ApiService.updateFreightBill(billId, editForm);
                    toast.success("Bill updated successfully!");
                    setEditModal(false);
                    fetchBillDetails();
                    onRefresh();
                  } catch (err) {
                    toast.error("Update failed: " + err.message);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreightBillDetails;
