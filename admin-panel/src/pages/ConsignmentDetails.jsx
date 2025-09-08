import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import ApiService from "../services/api";
import { toast } from "react-hot-toast";
import {
  Download,
  X,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

const STATUS_COLORS = {
  BOOKED: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  SCHEDULED: "bg-purple-100 text-purple-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  DELIVERED_UNCONFIRMED: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  try {
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return timeString;
  } catch (error) {
    return timeString;
  }
};

function Timeline({ status, timeline }) {
  return (
    <div className="space-y-3">
      {timeline.map((item, i) => {
        const isActive = item.status === status;
        const isCompleted = timeline.findIndex((t) => t.status === status) > i;

        return (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {item.status.replace("_", " ")}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
              {item.date && (
                <div className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ConsignmentDetails = ({ consignmentId, onClose, onRefresh }) => {
  const [consignment, setConsignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionModal, setActionModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const reload = () => {
    setLoading(true);
    ApiService.getConsignmentById(consignmentId)
      .then((res) => {
        setConsignment(res.data);
        setError("");
        if (onRefresh) onRefresh();
      })
      .catch((err) => {
        console.error("Error loading consignment:", err);
        setError("Failed to load consignment.");
        setConsignment(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [consignmentId]);

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/consignments/${consignmentId}/pdf`,
        { method: "GET", credentials: "include" }
      );

      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consignment-${consignment?.consignmentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error(err?.message || "Failed to download PDF.");
    }
  };

  // ✅ NEW: Status update handler
  const handleStatusUpdate = async (newStatus, additionalData = {}) => {
    setActionLoading(true);
    try {
      await ApiService.updateConsignmentStatus(consignmentId, {
        status: newStatus,
        ...additionalData,
      });
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      reload();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ ENHANCED: Assign Vehicle/Driver Modal
  const AssignModal = () => {
    const [vehicle, setVehicle] = useState("");
    const [driver, setDriver] = useState("");
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      Promise.all([
        ApiService.getVehicles({ status: "AVAILABLE" }),
        ApiService.getDrivers({ status: "AVAILABLE" }),
      ])
        .then(([vehiclesRes, driversRes]) => {
          setVehicles(vehiclesRes.data?.vehicles || []);
          setDrivers(driversRes.data?.drivers || []);
        })
        .catch((err) => {
          console.error("Error fetching data:", err);
          toast.error(err?.message || "Failed to load vehicles/drivers");
        })
        .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setActionLoading(true);
      try {
        await ApiService.assignVehicleToConsignment(consignmentId, {
          vehicleId: vehicle,
          driverId: driver,
        });
        toast.success("Vehicle/Driver assigned!");
        setActionModal(null);
        reload();
      } catch (err) {
        toast.error(err.message || "Failed to assign vehicle/driver.");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Assign Vehicle & Driver</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setActionModal(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Vehicle *</label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNumber} - {v.vehicleType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Driver *</label>
                <select
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                  required
                >
                  <option value="">Select driver</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} - {d.mobile}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActionModal(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // ✅ ENHANCED: Schedule Pickup Modal
  const ScheduleModal = () => {
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [pickupInstructions, setPickupInstructions] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      setActionLoading(true);
      try {
        await ApiService.schedulePickup(consignmentId, {
          pickupDate: `${pickupDate}T${pickupTime}:00`,
          pickupTime,
          pickupInstructions,
        });
        toast.success("Pickup scheduled!");
        setActionModal(null);
        reload();
      } catch (err) {
        toast.error(err.message || "Failed to schedule pickup.");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Pickup
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setActionModal(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Pickup Date *</label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Pickup Time *</label>
              <Input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Instructions</label>
              <textarea
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                rows="3"
                placeholder="Special pickup instructions..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionModal(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ✅ NEW: Delivery Confirmation Modal with Proof
  const DeliveryConfirmModal = () => {
    const [proofOfDelivery, setProofOfDelivery] = useState("");
    const [deliveredBy, setDeliveredBy] = useState(
      consignment?.vehicle?.driverName || ""
    );

    const handleSubmit = async (e) => {
      e.preventDefault();
      setActionLoading(true);
      try {
        await ApiService.updateConsignmentStatus(consignmentId, {
          status: "DELIVERED",
          proofOfDelivery,
          deliveredBy,
        });
        toast.success("Delivery confirmed with proof!");
        setActionModal(null);
        reload();
      } catch (err) {
        toast.error(err.message || "Failed to confirm delivery.");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Delivery
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setActionModal(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-2">
                Proof of Delivery *
              </label>
              <Input
                type="text"
                value={proofOfDelivery}
                onChange={(e) => setProofOfDelivery(e.target.value)}
                placeholder="POD number, signature, photo reference..."
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                Enter proof reference (e.g., POD123, Signature received, Photo
                taken)
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Delivered By</label>
              <Input
                type="text"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
                placeholder="Name of person who delivered"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionModal(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Confirming..." : "Confirm Delivery"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ✅ NEW: In Transit Modal with Actual Pickup Details
  const InTransitModal = () => {
    const [actualPickupDate, setActualPickupDate] = useState("");
    const [actualPickupTime, setActualPickupTime] = useState("");
    const [transitNotes, setTransitNotes] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      setActionLoading(true);
      try {
        await ApiService.updateConsignmentStatus(consignmentId, {
          status: "IN_TRANSIT",
          actualPickupDate: `${actualPickupDate}T${actualPickupTime}:00`,
          actualPickupTime,
          transitNotes,
        });
        toast.success("Consignment marked as In Transit!");
        setActionModal(null);
        reload();
      } catch (err) {
        toast.error(err.message || "Failed to mark In Transit.");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Mark In Transit
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setActionModal(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scheduled Info */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Scheduled Pickup:</div>
            <div className="text-sm text-muted-foreground">
              {consignment.pickupDate
                ? new Date(consignment.pickupDate).toLocaleDateString()
                : "Not scheduled"}{" "}
              at {formatTime(consignment.pickupTime) || "No time set"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-2">
                Actual Pickup Date *
              </label>
              <Input
                type="date"
                value={actualPickupDate}
                onChange={(e) => setActualPickupDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Actual Pickup Time *
              </label>
              <Input
                type="time"
                value={actualPickupTime}
                onChange={(e) => setActualPickupTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Transit Notes</label>
              <textarea
                value={transitNotes}
                onChange={(e) => setTransitNotes(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                rows="3"
                placeholder="Any notes about pickup or transit conditions..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionModal(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Updating..." : "Mark In Transit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div className="mt-2">Loading consignment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <div className="text-red-500">{error}</div>
        <Button onClick={reload} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!consignment) {
    return (
      <div className="p-6 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <div>No consignment found.</div>
      </div>
    );
  }

  // ✅ ENHANCED: Timeline construction with all statuses
  const timeline = [
    {
      status: "BOOKED",
      date: consignment.bookingDate,
      description: "Booking confirmed",
    },
  ];

  if (consignment.vehicle?.vehicleId) {
    timeline.push({
      status: "ASSIGNED",
      date: consignment.updatedAt,
      description: `Vehicle ${consignment.vehicle.vehicleNumber} assigned`,
    });
  }

  if (consignment.pickupDate) {
    timeline.push({
      status: "SCHEDULED",
      date: consignment.pickupDate,
      description: `Pickup scheduled for ${
        formatTime(consignment.pickupTime) || "TBD"
      }`,
    });
  }

  if (
    ["IN_TRANSIT", "DELIVERED_UNCONFIRMED", "DELIVERED"].includes(
      consignment.status
    )
  ) {
    timeline.push({
      status: "IN_TRANSIT",
      date:
        consignment.actualPickupDate ||
        consignment.pickupDate ||
        consignment.updatedAt,
      description: consignment.actualPickupTime
        ? `In transit (Picked up at ${formatTime(
            consignment.actualPickupTime
          )})`
        : "Shipment in transit",
    });
  }

  if (["DELIVERED_UNCONFIRMED", "DELIVERED"].includes(consignment.status)) {
    timeline.push({
      status: "DELIVERED_UNCONFIRMED",
      date: consignment.deliveryDate,
      description: "Delivered - awaiting confirmation",
    });
  }

  if (consignment.status === "DELIVERED") {
    timeline.push({
      status: "DELIVERED",
      date: consignment.deliveryDate,
      description: consignment.proofOfDelivery
        ? `Delivered successfully (POD: ${consignment.proofOfDelivery})`
        : "Delivered successfully",
    });
  }

  // ✅ ENHANCED: Action buttons based on status
  const actions = [];

  if (consignment.status === "BOOKED" && !consignment.vehicle?.vehicleId) {
    actions.push(
      <Button
        key="assign"
        size="sm"
        variant="outline"
        onClick={() => setActionModal({ type: "assign" })}
      >
        <Truck className="h-4 w-4 mr-2" />
        Assign Vehicle/Driver
      </Button>
    );
  }

  if (
    consignment.status === "ASSIGNED" &&
    consignment.vehicle?.vehicleId &&
    !consignment.pickupDate
  ) {
    actions.push(
      <Button
        key="schedule"
        size="sm"
        variant="outline"
        onClick={() => setActionModal({ type: "schedule" })}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Schedule Pickup
      </Button>
    );
  }

  if (consignment.status === "SCHEDULED" && consignment.pickupDate) {
    actions.push(
      <Button
        key="intransit"
        size="sm"
        variant="outline"
        onClick={() => setActionModal({ type: "intransit" })}
      >
        <Truck className="h-4 w-4 mr-2" />
        Mark In Transit
      </Button>
    );
  }

  if (consignment.status === "IN_TRANSIT") {
    actions.push(
      <Button
        key="unconfirmed"
        size="sm"
        variant="outline"
        onClick={() => handleStatusUpdate("DELIVERED_UNCONFIRMED")}
        disabled={actionLoading}
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Mark Delivered (Unconfirmed)
      </Button>
    );
  }

  if (consignment.status === "DELIVERED_UNCONFIRMED") {
    actions.push(
      <Button
        key="confirm"
        size="sm"
        variant="outline"
        onClick={() => setActionModal({ type: "confirmDelivery" })}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Confirm with POD
      </Button>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {consignment.consignmentNumber}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_COLORS[consignment.status]
              }`}
            >
              {consignment.status.replace("_", " ")}
            </span>
            {consignment.paymentStatus && (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  consignment.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : consignment.paymentStatus === "BILLED"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {consignment.paymentStatus}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Booking Branch:</span>{" "}
                {consignment.bookingBranch}
              </div>
              <div>
                <span className="font-medium">Booking Date:</span>{" "}
                {new Date(consignment.bookingDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Route:</span>{" "}
                {consignment.fromCity} → {consignment.toCity}
              </div>
              <div>
                <span className="font-medium">Description:</span>{" "}
                {consignment.description}
              </div>
            </div>
          </Card>

          {/* Party Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Consignor</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {consignment.consignor?.name}
                </div>
                <div>
                  <span className="font-medium">Mobile:</span>{" "}
                  {consignment.consignor?.mobile}
                </div>
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {consignment.consignor?.address}
                </div>
                {consignment.consignor?.gstNumber && (
                  <div>
                    <span className="font-medium">GST:</span>{" "}
                    {consignment.consignor.gstNumber}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Consignee</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {consignment.consignee?.name}
                </div>
                <div>
                  <span className="font-medium">Mobile:</span>{" "}
                  {consignment.consignee?.mobile}
                </div>
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {consignment.consignee?.address}
                </div>
                {consignment.consignee?.gstNumber && (
                  <div>
                    <span className="font-medium">GST:</span>{" "}
                    {consignment.consignee.gstNumber}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Shipment & Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Shipment Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Packages:</span>{" "}
                  {consignment.packages}
                </div>
                <div>
                  <span className="font-medium">Weight:</span>{" "}
                  {consignment.actualWeight} / {consignment.chargedWeight} kg
                </div>
                <div>
                  <span className="font-medium">Value:</span> ₹
                  {consignment.value?.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Insurance:</span>{" "}
                  {consignment.insurance ? "Yes" : "No"}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Charges</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Freight:</span>
                  <span>₹{consignment.freight?.toLocaleString()}</span>
                </div>
                {consignment.hamali > 0 && (
                  <div className="flex justify-between">
                    <span>Hamali:</span>
                    <span>₹{consignment.hamali?.toLocaleString()}</span>
                  </div>
                )}
                {/* Show other charges if > 0 */}
                <div className="border-t pt-1 flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>₹{consignment.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Vehicle & Driver */}
          {consignment.vehicle?.vehicleId && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle & Driver
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Vehicle:</span>{" "}
                  {consignment.vehicle.vehicleNumber}
                </div>
                <div>
                  <span className="font-medium">Driver:</span>{" "}
                  {consignment.vehicle.driverName}
                </div>
                <div>
                  <span className="font-medium">Driver Mobile:</span>{" "}
                  {consignment.vehicle.driverMobile}
                </div>
                {/* Additional Vehicle Details */}
                {consignment.vehicle.engineNumber && (
                  <div>
                    <span className="font-medium">Engine No:</span>{" "}
                    {consignment.vehicle.engineNumber}
                  </div>
                )}
                {consignment.vehicle.chassisNumber && (
                  <div>
                    <span className="font-medium">Chassis No:</span>{" "}
                    {consignment.vehicle.chassisNumber}
                  </div>
                )}
                {consignment.vehicle.insurancePolicyNo && (
                  <div>
                    <span className="font-medium">Insurance:</span>{" "}
                    {consignment.vehicle.insurancePolicyNo}
                  </div>
                )}
                {consignment.vehicle.insuranceValidity && (
                  <div>
                    <span className="font-medium">Valid Until:</span>{" "}
                    {new Date(
                      consignment.vehicle.insuranceValidity
                    ).toLocaleDateString()}
                  </div>
                )}
                {consignment.pickupDate && (
                  <div>
                    <span className="font-medium">Scheduled Pickup:</span>{" "}
                    {new Date(consignment.pickupDate).toLocaleDateString()} at{" "}
                    {formatTime(consignment.pickupTime)}
                  </div>
                )}
                {consignment.actualPickupDate && (
                  <div>
                    <span className="font-medium">Actual Pickup:</span>{" "}
                    {new Date(
                      consignment.actualPickupDate
                    ).toLocaleDateString()}{" "}
                    at {formatTime(consignment.actualPickupTime)}
                  </div>
                )}
                {consignment.deliveryDate && (
                  <div>
                    <span className="font-medium">Delivery:</span>{" "}
                    {new Date(consignment.deliveryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              {consignment.transitNotes && (
                <div className="mt-3 p-2 bg-muted rounded">
                  <span className="font-medium">Transit Notes:</span>{" "}
                  {consignment.transitNotes}
                </div>
              )}
            </Card>
          )}

          {/* Delivery Information */}
          {(consignment.status === "DELIVERED" ||
            consignment.status === "DELIVERED_UNCONFIRMED") && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Delivery Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {consignment.deliveryDate && (
                  <div>
                    <span className="font-medium">Delivery Date:</span>{" "}
                    {new Date(consignment.deliveryDate).toLocaleDateString()}
                  </div>
                )}
                {consignment.deliveryTime && (
                  <div>
                    <span className="font-medium">Delivery Time:</span>{" "}
                    {consignment.deliveryTime}
                  </div>
                )}
                {consignment.deliveredBy && (
                  <div>
                    <span className="font-medium">Delivered By:</span>{" "}
                    {consignment.deliveredBy}
                  </div>
                )}
                {consignment.proofOfDelivery && (
                  <div className="col-span-2">
                    <span className="font-medium">Proof of Delivery:</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {consignment.proofOfDelivery}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Additional Information */}
          {(consignment.pan ||
            consignment.invoiceNumber ||
            consignment.eWayBillNumber) && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {consignment.pan && (
                  <div>
                    <span className="font-medium">PAN:</span> {consignment.pan}
                  </div>
                )}
                {consignment.invoiceNumber && (
                  <div>
                    <span className="font-medium">Invoice:</span>{" "}
                    {consignment.invoiceNumber}
                  </div>
                )}
                {consignment.eWayBillNumber && (
                  <div>
                    <span className="font-medium">E-Way Bill:</span>{" "}
                    {consignment.eWayBillNumber}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status Timeline
            </h3>
            <Timeline status={consignment.status} timeline={timeline} />
          </Card>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="space-y-2">{actions}</div>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Weight:</span>
                <span>{consignment.chargedWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span>₹{consignment.value?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">
                  ₹{consignment.grandTotal?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    consignment.paymentStatus === "PAID"
                      ? "bg-green-100 text-green-700"
                      : consignment.paymentStatus === "BILLED"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {consignment.paymentStatus || "UNBILLED"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* Modals */}
      {actionModal?.type === "assign" && <AssignModal />}
      {actionModal?.type === "schedule" && <ScheduleModal />}
      {actionModal?.type === "intransit" && <InTransitModal />}
      {actionModal?.type === "confirmDelivery" && <DeliveryConfirmModal />}
    </div>
  );
};

export default ConsignmentDetails;
