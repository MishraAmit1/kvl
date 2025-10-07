import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Save, Truck, User, Package } from "lucide-react";
import toast from "react-hot-toast";
import loadChalanApi from "../services/loadChalanApi";
import ApiService from "../services/api";
import Shimmer from "../components/Shimmer";
import useAuthStore from "../stores/authStore";

const LoadChalanForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    chalanNumber: "", // Added this field
    bookingBranch: "",
    destinationHub: "",
    dispatchTime: "",
    vehicle: {
      vehicleId: "",
      vehicleNumber: "",
      engineNumber: "",
      chassisNumber: "",
      insurancePolicyNo: "",
      insuranceValidity: "",
    },
    ownerName: "",
    ownerAddress: "",
    driver: {
      driverId: "",
      driverName: "",
      driverMobile: "",
      driverLicenseNo: "",
      cleanerName: "",
    },
    consignments: [],
    lorryFreight: 0,
    loadingCharges: 0,
    unloadingCharges: 0,
    otherCharges: 0,
    advancePaid: 0,
    tdsDeduction: 0,
    frtPayableAt: "",
    remarks: "",
    riskNote: "",
    postingBy: "",
  });

  const [selectedConsignments, setSelectedConsignments] = useState([]);

  // Fetch existing chalan if editing
  const { data: existingChalan, isLoading: isLoadingChalan } = useQuery({
    queryKey: ["loadChalan", id],
    queryFn: () => loadChalanApi.getLoadChalanById(id),
    enabled: isEditing && Boolean(id),
  });

  // Get authentication state
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  // Fetch available data only when authenticated
  const { data: consignmentsData, isLoading: isLoadingConsignments } = useQuery(
    {
      queryKey: ["availableConsignments"],
      queryFn: () => ApiService.getConsignments({ limit: 100 }),
      enabled: isAuthenticated,
    }
  );

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["availableVehicles"],
    queryFn: () => ApiService.getVehicles({ limit: 100 }),
    enabled: isAuthenticated,
  });

  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["availableDrivers"],
    queryFn: () => ApiService.getDrivers({ limit: 100 }),
    enabled: isAuthenticated,
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? loadChalanApi.updateLoadChalan(id, data)
        : loadChalanApi.createLoadChalan(data),
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Load Chalan updated successfully"
          : "Load Chalan created successfully"
      );
      queryClient.invalidateQueries(["loadChalans"]);
      navigate("/load-chalans");
    },
    onError: (error) => {
      toast.error(error.message || "Operation failed");
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingChalan?.data) {
      const chalan = existingChalan.data;

      setFormData({
        chalanNumber: chalan.chalanNumber || "", // Added this
        bookingBranch: chalan.bookingBranch || "",
        destinationHub: chalan.destinationHub || "",
        dispatchTime: chalan.dispatchTime || "",
        vehicle: chalan.vehicle || {},
        ownerName: chalan.ownerName || "",
        ownerAddress: chalan.ownerAddress || "",
        driver: chalan.driver || {},
        consignments: chalan.consignments || [],
        lorryFreight: chalan.lorryFreight || 0,
        loadingCharges: chalan.loadingCharges || 0,
        unloadingCharges: chalan.unloadingCharges || 0,
        otherCharges: chalan.otherCharges || 0,
        advancePaid: chalan.advancePaid || 0,
        tdsDeduction: chalan.tdsDeduction || 0,
        frtPayableAt: chalan.frtPayableAt || "",
        remarks: chalan.remarks || "",
        riskNote: chalan.riskNote || "",
        postingBy: chalan.postingBy || "",
      });
      setSelectedConsignments(chalan.consignments || []);
    }
  }, [existingChalan]);

  // Effect to track selected consignments changes and remove duplicates
  useEffect(() => {
    const uniqueConsignments = selectedConsignments.filter(
      (consignment, index, self) =>
        index ===
        self.findIndex((c) => c.consignmentId === consignment.consignmentId)
    );

    if (uniqueConsignments.length !== selectedConsignments.length) {
      setSelectedConsignments(uniqueConsignments);
    }
  }, [selectedConsignments]);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleConsignmentSelect = (consignment) => {
    const isAlreadySelected = selectedConsignments.some(
      (c) => c.consignmentId === consignment._id
    );

    const isAlreadySelectedByNumber = selectedConsignments.some(
      (c) => c.consignmentNumber === consignment.consignmentNumber
    );

    if (isAlreadySelected || isAlreadySelectedByNumber) {
      toast.error(
        `Consignment ${consignment.consignmentNumber} is already selected`
      );
      return;
    }

    const newConsignment = {
      consignmentId: consignment._id,
      consignmentNumber: consignment.consignmentNumber,
      packages: consignment.packages,
      packageType: consignment.packageType,
      description: consignment.description,
      weight: consignment.actualWeight,
      freightAmount: consignment.freightAmount || 0,
      destination: consignment.toCity,
    };

    setSelectedConsignments((prev) => [...prev, newConsignment]);
  };

  const removeConsignment = (index) => {
    setSelectedConsignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate chalan number
    if (!formData.chalanNumber) {
      toast.error("Please enter a chalan number");
      return;
    }

    if (selectedConsignments.length === 0) {
      toast.error("Please select at least one consignment");
      return;
    }

    const submitData = {
      ...formData,
      consignments: selectedConsignments,
    };

    mutation.mutate(submitData);
  };

  if (isLoadingChalan || isAuthLoading) return <Shimmer />;

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  const allConsignments =
    consignmentsData?.data?.consignments || consignmentsData?.data || [];
  const allVehicles = vehiclesData?.data?.vehicles || vehiclesData?.data || [];
  const allDrivers = driversData?.data?.drivers || driversData?.data || [];

  const selectedConsignmentIds = selectedConsignments.map(
    (c) => c.consignmentId
  );

  const consignments = allConsignments.filter((c) => {
    const isAlreadySelectedById = selectedConsignmentIds.includes(c._id);
    const isAlreadySelectedByNumber = selectedConsignments.some(
      (selected) => selected.consignmentNumber === c.consignmentNumber
    );
    const isAlreadySelected =
      isAlreadySelectedById || isAlreadySelectedByNumber;
    return !isAlreadySelected;
  });

  const vehicles = allVehicles;
  const drivers = allDrivers;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/load-chalans")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to LORRY HIRE & CHALLAN
        </button>
        <div className="h-6 w-px bg-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Load Chalan" : "Create New Load Chalan"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chalan Number Field - NEW */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chalan Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.chalanNumber}
                onChange={(e) =>
                  handleInputChange(
                    "chalanNumber",
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter chalan number (e.g., LC241201001)"
                required
              />
              {/* <p className="text-xs text-gray-500 mt-1">
                Format: LC + YYMMDD + 3-digit sequence (e.g., LC241201001)
              </p> */}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Branch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bookingBranch}
                onChange={(e) =>
                  handleInputChange("bookingBranch", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Hub <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.destinationHub}
                onChange={(e) =>
                  handleInputChange("destinationHub", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispatch Time
              </label>
              <input
                type="time"
                value={formData.dispatchTime}
                onChange={(e) =>
                  handleInputChange("dispatchTime", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Vehicle Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle
              </label>
              <select
                value={formData.vehicle.vehicleId}
                onChange={(e) => {
                  const vehicle = vehicles.find(
                    (v) => v._id === e.target.value
                  );
                  handleInputChange("vehicle.vehicleId", e.target.value);
                  if (vehicle) {
                    handleInputChange(
                      "vehicle.vehicleNumber",
                      vehicle.vehicleNumber
                    );
                    handleInputChange(
                      "vehicle.engineNumber",
                      vehicle.engineNumber
                    );
                    handleInputChange(
                      "vehicle.chassisNumber",
                      vehicle.chassisNumber
                    );
                    handleInputChange("ownerName", vehicle.ownerName || "");
                    handleInputChange(
                      "ownerAddress",
                      vehicle.ownerAddress || ""
                    );
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.vehicleNumber} - {vehicle.vehicleType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                value={formData.vehicle.vehicleNumber}
                onChange={(e) =>
                  handleInputChange("vehicle.vehicleNumber", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleInputChange("ownerName", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Address
              </label>
              <input
                type="text"
                value={formData.ownerAddress}
                onChange={(e) =>
                  handleInputChange("ownerAddress", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Driver Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Driver
              </label>
              <select
                value={formData.driver.driverId}
                onChange={(e) => {
                  const driver = drivers.find((d) => d._id === e.target.value);
                  handleInputChange("driver.driverId", e.target.value);
                  if (driver) {
                    handleInputChange("driver.driverName", driver.name);
                    handleInputChange("driver.driverMobile", driver.mobile);
                    handleInputChange(
                      "driver.driverLicenseNo",
                      driver.licenseNumber
                    );
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a driver</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} - {driver.mobile}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driver.driverName}
                onChange={(e) =>
                  handleInputChange("driver.driverName", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Mobile
              </label>
              <input
                type="text"
                value={formData.driver.driverMobile}
                onChange={(e) =>
                  handleInputChange("driver.driverMobile", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Broker Name
              </label>
              <input
                type="text"
                value={formData.driver.cleanerName}
                onChange={(e) =>
                  handleInputChange("driver.cleanerName", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Consignments Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Consignments Selection
          </h2>

          {/* Available Consignments */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Consignments
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {isLoadingConsignments ? (
                <div className="text-gray-500">Loading consignments...</div>
              ) : consignments.length === 0 ? (
                <div className="text-gray-500">No available consignments</div>
              ) : (
                consignments.map((consignment) => (
                  <div
                    key={consignment._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleConsignmentSelect(consignment)}
                  >
                    <div>
                      <div className="font-medium">
                        {consignment.consignmentNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {consignment.fromCity} → {consignment.toCity} |{" "}
                        {consignment.packages} pkgs | {consignment.actualWeight}{" "}
                        kg
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Consignments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Consignments
            </label>
            {selectedConsignments.length === 0 ? (
              <div className="text-gray-500 border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                No consignments selected
              </div>
            ) : (
              <div className="space-y-2">
                {selectedConsignments.map((consignment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {consignment.consignmentNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {consignment.destination} | {consignment.packages} pkgs
                        | {consignment.weight} kg
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConsignment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Financial Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lorry Freight
              </label>
              <input
                type="number"
                value={formData.lorryFreight}
                onChange={(e) =>
                  handleInputChange(
                    "lorryFreight",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loading Charges
              </label>
              <input
                type="number"
                value={formData.loadingCharges}
                onChange={(e) =>
                  handleInputChange(
                    "loadingCharges",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unloading Charges
              </label>
              <input
                type="number"
                value={formData.unloadingCharges}
                onChange={(e) =>
                  handleInputChange(
                    "unloadingCharges",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Charges
              </label>
              <input
                type="number"
                value={formData.otherCharges}
                onChange={(e) =>
                  handleInputChange(
                    "otherCharges",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Paid
              </label>
              <input
                type="number"
                value={formData.advancePaid}
                onChange={(e) =>
                  handleInputChange(
                    "advancePaid",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TDS Deduction
              </label>
              <input
                type="number"
                value={formData.tdsDeduction}
                onChange={(e) =>
                  handleInputChange(
                    "tdsDeduction",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Freight Payable At
              </label>
              <input
                type="text"
                value={formData.frtPayableAt}
                onChange={(e) =>
                  handleInputChange("frtPayableAt", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Note
              </label>
              <select
                value={formData.riskNote}
                onChange={(e) => handleInputChange("riskNote", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select risk type</option>
                <option value="Owner's Risk">Owner's Risk</option>
                <option value="Carrier's Risk">Carrier's Risk</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/load-chalans")}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || selectedConsignments.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoadChalanForm;
