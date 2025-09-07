import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import ApiService from "../services/api";
import { TruckIcon } from "@heroicons/react/outline";

const PublicTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");
    setTrackingData(null);

    try {
      const response = await ApiService.trackConsignment(trackingNumber.trim());
      setTrackingData(response.data);
    } catch (err) {
      setError("Consignment not found. Please check the tracking number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Consignment</h1>
          <p className="text-muted-foreground">
            Enter your consignment number to track your shipment
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) =>
                  setTrackingNumber(e.target.value.toUpperCase())
                }
                placeholder="Enter Consignment Number (e.g., CN2024001)"
                className="text-lg"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Tracking..." : "Track Shipment"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {trackingData && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <h2 className="font-semibold text-lg mb-3">
                  Tracking Information
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Consignment Number:
                    </span>
                    <span className="font-medium">
                      {trackingData.consignmentNumber}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        trackingData.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : trackingData.status === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {trackingData.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Route:</span>
                    <span className="font-medium flex items-center gap-1">
                      <TruckIcon className="h-4 w-4" />
                      {trackingData.route}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Date:</span>
                    <span className="font-medium">
                      {new Date(trackingData.bookingDate).toLocaleDateString()}
                    </span>
                  </div>

                  {trackingData.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Estimated Delivery:
                      </span>
                      <span className="font-medium">
                        {new Date(
                          trackingData.estimatedDelivery
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {trackingData.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Delivered On:
                      </span>
                      <span className="font-medium text-green-600">
                        {new Date(
                          trackingData.deliveryDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PublicTracking;
