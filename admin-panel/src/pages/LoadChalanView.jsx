import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import toast from "react-hot-toast";
import loadChalanApi from "../services/loadChalanApi";
import Shimmer from "../components/Shimmer";
import { getApiBaseUrl } from "../config/api";

const LoadChalanView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: loadChalanData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["loadChalan", id],
    queryFn: () => loadChalanApi.getLoadChalanById(id),
  });

  const handleDownloadPDF = async () => {
    try {
      await loadChalanApi.downloadPDF(id);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handlePrint = async () => {
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

  if (isLoading) return <Shimmer />;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">Failed to load load chalan details.</p>
        </div>
      </div>
    );
  }

  const loadChalan = loadChalanData?.data;

  if (!loadChalan) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Not Found
          </h2>
          <p className="text-gray-600">Load chalan not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/load-chalans")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to LORRY HIRE & CHALLAN
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900">
            Load Chalan: {loadChalan.chalanNumber}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Load Chalan Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chalan Number
            </label>
            <p className="text-sm text-gray-900 font-semibold">
              {loadChalan.chalanNumber}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <p className="text-sm text-gray-900">
              {new Date(loadChalan.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {loadChalan.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Branch
            </label>
            <p className="text-sm text-gray-900">{loadChalan.bookingBranch}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <p className="text-sm text-gray-900">
              {loadChalan.vehicle?.vehicleNumber || "N/A"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <p className="text-sm text-gray-900">
              {loadChalan.driver?.driverName || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadChalanView;
