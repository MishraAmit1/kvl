import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import ApiService from "../services/api";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  CheckCircle2,
  User,
  FileText,
  DollarSign,
} from "lucide-react";

const FreightBillForm = ({
  onSubmit,
  onCancel,
  loading,
  customers = [],
  initialBill = null,
}) => {
  const [customer, setCustomer] = useState(
    initialBill?.party?.customerId || ""
  );
  const [unbilledConsignments, setUnbilledConsignments] = useState([]);
  const [selectedConsignments, setSelectedConsignments] = useState([]);
  const [adjustments, setAdjustments] = useState(
    initialBill?.adjustments || []
  );
  const [billingBranch, setBillingBranch] = useState(
    initialBill?.billingBranch || "Vapi"
  );
  const [loadingConsignments, setLoadingConsignments] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);

  // Fetch unbilled consignments when customer changes
  useEffect(() => {
    if (customer) {
      setLoadingConsignments(true);

      // Get customer details
      const selectedCustomer = customers.find((c) => c._id === customer);
      setCustomerDetails(selectedCustomer);

      console.log("Fetching unbilled consignments for customer:", customer);

      ApiService.getUnbilledConsignments(customer)
        .then((res) => {
          console.log("Unbilled consignments response:", res);
          if (res.success && res.data) {
            setUnbilledConsignments(res.data.consignments || []);
            if (res.data.consignments?.length === 0) {
              toast("No unbilled consignments found for this customer", {
                icon: "ℹ️",
                duration: 3000,
              });
            }
          } else {
            setUnbilledConsignments([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching unbilled consignments:", err);
          toast.error(err.message || "Failed to fetch unbilled consignments");
          setUnbilledConsignments([]);
        })
        .finally(() => {
          setLoadingConsignments(false);
        });
    } else {
      setUnbilledConsignments([]);
      setCustomerDetails(null);
    }
  }, [customer, customers]);

  // Calculate total amount
  const totalAmount = selectedConsignments.reduce(
    (sum, consignment) => sum + (consignment.grandTotal || 0),
    0
  );

  // Add adjustment
  const handleAddAdjustment = () => {
    setAdjustments([
      ...adjustments,
      { type: "DISCOUNT", description: "", amount: 0 },
    ]);
  };

  // Update adjustment
  const handleAdjustmentChange = (index, field, value) => {
    const newAdjustments = [...adjustments];
    if (field === "amount") {
      const numValue = parseFloat(value) || 0;
      newAdjustments[index][field] = numValue;
    } else {
      newAdjustments[index][field] = value;
    }
    setAdjustments(newAdjustments);
  };

  // Remove adjustment
  const handleRemoveAdjustment = (index) => {
    const newAdjustments = adjustments.filter((_, i) => i !== index);
    setAdjustments(newAdjustments);
  };

  // Calculate final amount with proper validation
  const finalAmount = Math.max(
    0,
    adjustments.reduce((total, adj) => {
      const amount = Math.abs(adj.amount || 0);
      return adj.type === "DISCOUNT" ? total - amount : total + amount;
    }, totalAmount)
  );

  // Handle consignment selection
  const handleConsignmentToggle = (consignment, checked) => {
    if (checked) {
      setSelectedConsignments([...selectedConsignments, consignment]);
    } else {
      setSelectedConsignments(
        selectedConsignments.filter((c) => c._id !== consignment._id)
      );
    }
  };

  // Handle select all consignments
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedConsignments(unbilledConsignments);
    } else {
      setSelectedConsignments([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Enhanced validation
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }

    if (!billingBranch?.trim()) {
      toast.error("Please enter billing branch");
      return;
    }

    if (selectedConsignments.length === 0) {
      toast.error("Please select at least one consignment");
      return;
    }

    // Validate adjustments
    const invalidAdjustments = adjustments.filter(
      (adj) => adj.amount !== 0 && (!adj.description?.trim() || adj.amount < 0)
    );

    if (invalidAdjustments.length > 0) {
      toast.error(
        "Please provide valid description and positive amount for all adjustments"
      );
      return;
    }

    if (finalAmount < 0) {
      toast.error("Final amount cannot be negative");
      return;
    }

    const billData = {
      customerId: customer,
      billingBranch: billingBranch.trim(),
      consignmentIds: selectedConsignments.map((c) => c._id),
      adjustments: adjustments.filter(
        (adj) => adj.amount !== 0 && adj.description?.trim()
      ),
    };

    console.log("Submitting bill data:", billData);
    onSubmit(billData);
  };

  return (
    // ✅ REMOVED: max-h-[80vh] overflow-y-auto to prevent dual scrollbars
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 items-center gap-2">
            <User className="h-4 w-4" />
            Select Customer *
          </label>
          <select
            value={customer}
            onChange={(e) => {
              setCustomer(e.target.value);
              setSelectedConsignments([]);
            }}
            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            disabled={loading}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} - {c.mobile}
              </option>
            ))}
          </select>

          {/* Customer Details Preview */}
          {customerDetails && (
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Name:</strong> {customerDetails.name}
                </div>
                <div>
                  <strong>Mobile:</strong> {customerDetails.mobile}
                </div>
                <div>
                  <strong>Email:</strong>{" "}
                  {customerDetails.email || "Not provided"}
                </div>
                <div>
                  <strong>GST:</strong>{" "}
                  {customerDetails.gstNumber || "Not provided"}
                </div>
              </div>
              <div className="mt-2">
                <strong>Address:</strong> {customerDetails.address}
              </div>
            </div>
          )}
        </div>

        {/* Billing Branch */}
        <div>
          <label className="block text-sm font-medium mb-2 items-center gap-2">
            <FileText className="h-4 w-4" />
            Billing Branch *
          </label>
          <Input
            value={billingBranch}
            onChange={(e) => setBillingBranch(e.target.value)}
            disabled={loading}
            placeholder="Enter billing branch"
            className="text-sm"
            required
          />
        </div>

        {/* Unbilled Consignments */}
        {customer && (
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Unbilled Consignments
              {selectedConsignments.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({selectedConsignments.length} selected)
                </span>
              )}
            </h3>

            {loadingConsignments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Loading consignments...
                </div>
              </div>
            ) : unbilledConsignments.length === 0 ? (
              <div className="text-center text-muted-foreground p-6 border rounded-md">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No unbilled consignments found</p>
                <p className="text-sm mt-1">
                  This customer has no delivered consignments that haven't been
                  billed yet.
                </p>
              </div>
            ) : (
              <div className="border rounded-md">
                {/* Header with Select All */}
                <div className="bg-muted p-3 border-b flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedConsignments.length ===
                        unbilledConsignments.length &&
                      unbilledConsignments.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-medium text-sm">
                    Select All ({unbilledConsignments.length} consignments)
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    Total: ₹
                    {unbilledConsignments
                      .reduce((sum, c) => sum + c.grandTotal, 0)
                      .toLocaleString()}
                  </span>
                </div>

                {/* ✅ FIXED: Reduced max height and better scrolling */}
                <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {unbilledConsignments.map((consignment) => (
                    <div
                      key={consignment._id}
                      className={`p-3 border-b last:border-b-0 hover:bg-accent/40 transition-colors ${
                        selectedConsignments.some(
                          (c) => c._id === consignment._id
                        )
                          ? "bg-accent/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedConsignments.some(
                            (c) => c._id === consignment._id
                          )}
                          onChange={(e) =>
                            handleConsignmentToggle(
                              consignment,
                              e.target.checked
                            )
                          }
                          className="mt-1 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">
                                {consignment.consignmentNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  consignment.bookingDate
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                ₹{consignment.grandTotal.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {consignment.chargedWeight} kg
                              </div>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {consignment.fromCity} → {consignment.toCity}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {consignment.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Adjustments */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Adjustments
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddAdjustment}
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Adjustment
            </Button>
          </div>

          {adjustments.length === 0 ? (
            <div className="text-center text-muted-foreground p-4 border rounded-md text-sm">
              No adjustments added. Click "Add Adjustment" to add discounts or
              extra charges.
            </div>
          ) : (
            <div className="space-y-3">
              {adjustments.map((adj, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-2 p-3 border rounded-md"
                >
                  <select
                    value={adj.type}
                    onChange={(e) =>
                      handleAdjustmentChange(index, "type", e.target.value)
                    }
                    className="rounded-md border border-border bg-background text-foreground px-2 py-1 text-sm"
                  >
                    <option value="DISCOUNT">Discount</option>
                    <option value="EXTRA_CHARGE">Extra Charge</option>
                    <option value="FUEL_SURCHARGE">Fuel Surcharge</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <Input
                    placeholder="Description (required)"
                    value={adj.description}
                    onChange={(e) =>
                      handleAdjustmentChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    className="flex-1 text-sm"
                    required={adj.amount !== 0}
                  />

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount"
                      value={adj.amount || ""}
                      onChange={(e) =>
                        handleAdjustmentChange(index, "amount", e.target.value)
                      }
                      className="w-32 text-sm"
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveAdjustment(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {selectedConsignments.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Bill Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>
                  Selected Consignments ({selectedConsignments.length}):
                </span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>

              {adjustments
                .filter((adj) => adj.amount !== 0)
                .map((adj, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>
                      {adj.type.replace("_", " ")}: {adj.description}
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
                  ₹{finalAmount.toLocaleString()}
                </span>
              </div>

              {finalAmount < 0 && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Final amount cannot be negative
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              loading ||
              selectedConsignments.length === 0 ||
              finalAmount < 0 ||
              !customer ||
              !billingBranch?.trim()
            }
            className="w-full sm:w-auto"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Bill...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Create Freight Bill
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FreightBillForm;
