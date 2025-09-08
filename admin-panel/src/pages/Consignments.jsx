import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ApiService from "../services/api";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import Shimmer from "../components/Shimmer";
import { toast } from "react-hot-toast";
import ConsignmentForm from "./ConsignmentForm";
import ConsignmentDetails from "./ConsignmentDetails";
import {
  Truck, // Instead of TruckIcon
  Download, // Instead of DocumentDownloadIcon
  Printer, // Instead of PrinterIcon
  Eye, // Instead of EyeIcon
  Pencil, // Instead of PencilIcon
  Trash2, // Instead of TrashIcon
  BarChart3, // Instead of ChartBarIcon
} from "lucide-react";
const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  "BOOKED",
  "ASSIGNED",
  "SCHEDULED",
  "IN_TRANSIT",
  "DELIVERED_UNCONFIRMED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_COLORS = {
  BOOKED: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  SCHEDULED: "bg-purple-100 text-purple-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  DELIVERED_UNCONFIRMED: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const fetchConsignments = async ({ queryKey }) => {
  const [_, { page, search, status, fromDate, toDate }] = queryKey;

  const params = {
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
  };

  if (search) params.search = search;
  if (status) params.status = status;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await ApiService.getConsignments(params);
  return res.data;
};

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const Consignments = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editConsignment, setEditConsignment] = useState(null);
  const [viewConsignment, setViewConsignment] = useState(null);
  const [deleteConsignment, setDeleteConsignment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch resources for form dropdowns
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    // Fetch all customers
    ApiService.getCustomers({ limit: 1000 })
      .then((res) => {
        setCustomers(res.data?.customers || []);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setCustomers([]);
      });

    // Fetch all vehicles
    ApiService.getVehicles({ limit: 1000 })
      .then((res) => {
        setVehicles(res.data?.vehicles || []);
      })
      .catch((err) => {
        console.error("Error fetching vehicles:", err);
        setVehicles([]);
      });

    // Fetch all drivers
    ApiService.getDrivers({ limit: 1000 })
      .then((res) => {
        setDrivers(res.data?.drivers || []);
      })
      .catch((err) => {
        console.error("Error fetching drivers:", err);
        setDrivers([]);
      });

    // Fetch statistics
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await ApiService.getConsignmentStatistics();
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, status, fromDate, toDate]);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [
      "consignments",
      { page, search: debouncedSearch, status, fromDate, toDate },
    ],
    queryFn: fetchConsignments,
    keepPreviousData: true,
  });

  const handleSearch = (e) => setSearch(e.target.value);
  const handleClearSearch = () => setSearch("");
  const handleStatusChange = (e) => setStatus(e.target.value);

  const handleAdd = () => {
    setEditConsignment(null);
    setModalOpen(true);
  };

  const handleEdit = (consignment) => {
    if (consignment.status === "DELIVERED") {
      toast.error("Cannot edit delivered consignment");
      return;
    }

    // Transform for form initial values
    setEditConsignment({
      ...consignment,
      consignor:
        consignment.consignor?.customerId?._id ||
        consignment.consignor?.customerId ||
        "",
      consignee:
        consignment.consignee?.customerId?._id ||
        consignment.consignee?.customerId ||
        "",
      vehicle: consignment.vehicle?.vehicleId || "",
      driver: consignment.vehicle?.driverId || "",
    });
    setModalOpen(true);
  };

  const handleView = (consignment) => {
    setDetailsId(consignment._id);
  };

  const handleDelete = async (consignment) => {
    if (consignment.status === "DELIVERED") {
      toast.error("Cannot delete delivered consignment");
      return;
    }

    if (
      window.confirm(`Delete consignment ${consignment.consignmentNumber}?`)
    ) {
      try {
        await ApiService.deleteConsignment(consignment._id);
        toast.success("Consignment deleted successfully!");
        refetch();
      } catch (err) {
        toast.error(err?.message || "Failed to delete consignment");
      }
    }
  };

  const handleDownloadPDF = async (consignment) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/consignments/${
          consignment._id
        }/pdf`,
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
      a.download = `consignment-${consignment.consignmentNumber}.pdf`;
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

  const handlePrintPDF = async (consignment) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/consignments/${
          consignment._id
        }/pdf`,
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

  // Add/Edit submit handler with validation
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      // Get customer objects
      const consignorCustomer = customers.find(
        (c) => c._id === values.consignor
      );
      const consigneeCustomer = customers.find(
        (c) => c._id === values.consignee
      );

      if (!consignorCustomer || !consigneeCustomer) {
        toast.error("Please select valid consignor and consignee");
        return;
      }

      // Format the data for backend
      const formattedValues = {
        ...values,
        // Convert customer IDs to complete objects
        consignor: {
          customerId: consignorCustomer._id,
          name: consignorCustomer.name,
          address: consignorCustomer.address,
          mobile: consignorCustomer.mobile,
          email: consignorCustomer.email || "",
          gstNumber: consignorCustomer.gstNumber || "",
        },
        consignee: {
          customerId: consigneeCustomer._id,
          name: consigneeCustomer.name,
          address: consigneeCustomer.address,
          mobile: consigneeCustomer.mobile,
          email: consigneeCustomer.email || "",
          gstNumber: consigneeCustomer.gstNumber || "",
        },
        // Convert string numbers to actual numbers
        packages: parseInt(values.packages) || 0,
        actualWeight: parseFloat(values.actualWeight) || 0,
        chargedWeight: parseFloat(values.chargedWeight) || 0,
        value: parseFloat(values.value) || 0,
        freight: parseFloat(values.freight) || 0,
        hamali: parseFloat(values.hamali) || 0,
        stCharges: parseFloat(values.stCharges) || 0,
        doorDelivery: parseFloat(values.doorDelivery) || 0,
        otherCharges: parseFloat(values.otherCharges) || 0,
        riskCharges: parseFloat(values.riskCharges) || 0,
        serviceTax: parseFloat(values.serviceTax) || 0,
        // Convert boolean values
        insurance: values.insurance === "Yes" ? true : false,
        typeOfPickup: values.typeOfPickup || "GODOWN",
        typeOfDelivery: values.typeOfDelivery || "GODOWN",
      };

      // Remove blank vehicle/driver fields
      if (!formattedValues.vehicle) delete formattedValues.vehicle;
      if (!formattedValues.driver) delete formattedValues.driver;

      if (editConsignment) {
        await ApiService.updateConsignment(
          editConsignment._id,
          formattedValues
        );
        toast.success("Consignment updated successfully!");
      } else {
        await ApiService.createConsignment(formattedValues);
        toast.success("Consignment added successfully!");
      }
      setModalOpen(false);
      refetch();
      fetchStatistics(); // Refresh stats
    } catch (err) {
      console.error("Error saving consignment:", err);
      // Show specific validation errors
      if (err.message.includes("mobile number")) {
        toast.error(err.message);
      } else if (err.message.includes("email")) {
        toast.error(err.message);
      } else if (err.message.includes("GST")) {
        toast.error(err.message);
      } else if (err.message.includes("weight")) {
        toast.error(err.message);
      } else {
        toast.error(
          err?.message || "Failed to save consignment. Please check all fields."
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    if (!data?.consignments) return null;
    return data.consignments.map((c) => (
      <tr
        key={c._id}
        className="border-b border-border hover:bg-accent/40 transition-colors"
      >
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
          <div className="font-medium">{c.consignmentNumber}</div>
          {c.paymentStatus && (
            <span
              className={`text-xs px-1 py-0.5 rounded ${
                c.paymentStatus === "PAID"
                  ? "bg-green-100 text-green-700"
                  : c.paymentStatus === "BILLED"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {c.paymentStatus}
            </span>
          )}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden sm:table-cell">
          {c.bookingDate ? new Date(c.bookingDate).toLocaleDateString() : "-"}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden md:table-cell">
          <div>{c.consignor?.name}</div>
          <div className="text-xs text-muted-foreground">
            {c.consignor?.mobile}
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden lg:table-cell">
          <div>{c.consignee?.name}</div>
          <div className="text-xs text-muted-foreground">
            {c.consignee?.mobile}
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-muted-foreground" />
            {c.fromCity} → {c.toCity}
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden xl:table-cell">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              STATUS_COLORS[c.status]
            }`}
          >
            {c.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-2 sm:px-4 py-2">
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleView(c)}
              title="View"
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDownloadPDF(c)}
              title="Download"
              disabled={formLoading}
              className="h-8 w-8 hidden sm:inline-flex"
            >
              <Download className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleEdit(c)}
              title="Edit"
              disabled={formLoading || c.status === "DELIVERED"}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handlePrintPDF(c)}
              title="Print"
              className="h-8 w-8 hidden md:inline-flex"
            >
              <Printer className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(c)}
              title="Delete"
              disabled={formLoading || c.status === "DELIVERED"}
              className="h-8 w-8 hidden lg:inline-flex"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </td>
      </tr>
    ));
  }, [data?.consignments, formLoading]);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Consignments</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowStats(!showStats)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </Button>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            Add Consignment
          </Button>
        </div>
      </div>

      {/* Statistics Card */}
      {showStats && stats && (
        <Card className="mb-4 p-4">
          <h3 className="font-semibold mb-3">Consignment Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.statusWise?.map((stat) => (
              <div key={stat._id} className="text-center">
                <div className="text-2xl font-bold">{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat._id}</div>
                <div className="text-xs">
                  ₹{stat.totalValue?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Payment Status</h4>
            <div className="grid grid-cols-3 gap-4">
              {stats.paymentWise?.map((stat) => (
                <div key={stat._id} className="text-center">
                  <div className="text-xl font-bold">{stat.count}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat._id}
                  </div>
                  <div className="text-xs">
                    ₹{stat.totalValue?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-4 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <SearchBar
          value={search}
          onChange={handleSearch}
          onClear={handleClearSearch}
          loading={isFetching}
          placeholder="Search by number, customer, city..."
          className="flex-1"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            placeholder="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            placeholder="To Date"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setSearch("");
              setStatus("");
            }}
            className="text-sm"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-border bg-card text-card-foreground">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Number
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden sm:table-cell">
                  Date
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden md:table-cell">
                  Consignor
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden lg:table-cell">
                  Consignee
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Route
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden xl:table-cell">
                  Status
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <Shimmer rows={5} columns={7} />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-4 text-center text-red-500"
                  >
                    Error loading consignments.{" "}
                    <Button size="sm" variant="outline" onClick={refetch}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : data?.consignments?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center">
                    <span role="img" aria-label="Empty">
                      📦
                    </span>{" "}
                    No consignments found.
                  </td>
                </tr>
              ) : (
                tableRows
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={data?.pagination?.page || 1}
          totalPages={data?.pagination?.pages || 1}
          onPageChange={setPage}
          total={data?.pagination?.total || 0}
          pageSize={PAGE_SIZE}
        />
      </Card>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg sm:max-w-xl md:max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              {editConsignment ? "Edit Consignment" : "Add Consignment"}
            </h2>
            <ConsignmentForm
              initialValues={editConsignment}
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
              mode={editConsignment ? "edit" : "add"}
              customers={customers}
              vehicles={vehicles}
              drivers={drivers}
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <ConsignmentDetails
              consignmentId={detailsId}
              onClose={() => setDetailsId(null)}
              onRefresh={() => {
                refetch();
                fetchStatistics();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Consignments;
