import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Truck,
  User,
  Package,
  Download,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import loadChalanApi from "../services/loadChalanApi";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import Shimmer from "../components/Shimmer";
import { getApiBaseUrl } from "../config/api";

const LoadChalans = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
    date: "",
    vehicleNumber: "",
    driverName: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch load chalans
  const {
    data: loadChalansData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["loadChalans", filters],
    queryFn: () => loadChalanApi.getAllLoadChalans(filters),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => loadChalanApi.deleteLoadChalan(id),
    onSuccess: () => {
      toast.success("Load Chalan deleted successfully");
      queryClient.invalidateQueries(["loadChalans"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete load chalan");
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, remarks }) =>
      loadChalanApi.updateLoadChalanStatus(id, status, remarks),
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries(["loadChalans"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term) {
      setFilters((prev) => ({
        ...prev,
        vehicleNumber: term,
        driverName: term,
        page: 1,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        vehicleNumber: "",
        driverName: "",
        page: 1,
      }));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this load chalan?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusUpdate = (id, currentStatus) => {
    const statusOrder = [
      "CREATED",
      "DISPATCHED",
      "IN_TRANSIT",
      "ARRIVED",
      "CLOSED",
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[currentIndex + 1];

    if (nextStatus) {
      statusMutation.mutate({ id, status: nextStatus });
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      await loadChalanApi.downloadPDF(id);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handlePrint = async (id) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/load-chalans/${id}/pdf`,
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
      toast.error("Failed to print PDF.");
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      CREATED: "bg-blue-100 text-blue-800",
      DISPATCHED: "bg-yellow-100 text-yellow-800",
      IN_TRANSIT: "bg-purple-100 text-purple-800",
      ARRIVED: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED":
        return <Package className="w-4 h-4" />;
      case "DISPATCHED":
        return <Truck className="w-4 h-4" />;
      case "IN_TRANSIT":
        return <Truck className="w-4 h-4" />;
      case "ARRIVED":
        return <Package className="w-4 h-4" />;
      case "CLOSED":
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (isLoading) return <Shimmer />;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  const { loadChalans = [], pagination } = loadChalansData?.data || {};

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Load Chalans</h1>
          <p className="text-muted-foreground">
            Manage truck load chalans and consignments
          </p>
        </div>
        <Link
          to="/load-chalans/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Load Chalan
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground p-4 rounded-lg border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">All Status</option>
              <option value="CREATED">Created</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="ARRIVED">Arrived</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              placeholder="Search vehicle..."
              value={filters.vehicleNumber}
              onChange={(e) =>
                handleFilterChange("vehicleNumber", e.target.value)
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <input
              type="text"
              placeholder="Search driver..."
              value={filters.driverName}
              onChange={(e) => handleFilterChange("driverName", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search by vehicle number or driver name..."
      />

      {/* Load Chalans Table */}
      <div className="bg-card text-card-foreground rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border bg-card text-card-foreground">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chalan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle & Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consignments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadChalans.map((chalan) => (
                <tr
                  key={chalan._id}
                  className="hover:bg-accent/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {chalan.chalanNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(chalan.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chalan.bookingBranch} → {chalan.destinationHub}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {chalan.vehicle?.vehicleNumber || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chalan.driver?.driverName || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chalan.ownerName || "N/A"}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {chalan.totalLRCount} LR
                      </div>
                      <div className="text-sm text-gray-500">
                        {chalan.totalPackages} packages
                      </div>
                      <div className="text-sm text-gray-500">
                        {chalan.totalWeight} kg
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ₹{chalan.totalFreight?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        Balance: ₹{chalan.balanceFreight?.toLocaleString() || 0}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          chalan.status
                        )}`}
                      >
                        {getStatusIcon(chalan.status)}
                        <span className="ml-1">{chalan.status}</span>
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/load-chalans/${chalan._id}`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/load-chalans/${chalan._id}/edit`}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDownloadPDF(chalan._id)}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handlePrint(chalan._id)}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {chalan.status === "CREATED" && (
                        <button
                          onClick={() => handleDelete(chalan._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {chalan.status !== "CLOSED" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(chalan._id, chalan.status)
                          }
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Update Status"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loadChalans.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">No load chalans found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new load chalan.
            </p>
            <div className="mt-6">
              <Link
                to="/load-chalans/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Load Chalan
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => handleFilterChange("page", page)}
        />
      )}
    </div>
  );
};

export default LoadChalans;
