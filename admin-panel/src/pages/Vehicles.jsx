import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ApiService from "../services/api";
import VehicleForm from "./VehicleForm";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const fetchVehicles = async ({ queryKey }) => {
  const [_key, { page, search }] = queryKey;
  const params = new URLSearchParams({ page, limit: PAGE_SIZE });
  if (search) params.append("search", search);
  const res = await ApiService.request(`/vehicles?${params.toString()}`, {
    method: "GET",
  });
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

const VehiclesPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteVehicle, setDeleteVehicle] = useState(null);
  const debouncedSearch = useDebounce(search, 400).trim();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["vehicles", { page, search: debouncedSearch }],
    queryFn: fetchVehicles,
    keepPreviousData: true,
  });

  const handleSearch = (e) => setSearch(e.target.value);
  const handleClearSearch = () => setSearch("");

  const handleAdd = () => {
    setEditVehicle(null);
    setModalOpen(true);
  };

  const handleEdit = (vehicle) => {
    setEditVehicle(vehicle);
    setModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (editVehicle) {
        await ApiService.request(`/vehicles/${editVehicle._id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Vehicle updated successfully!");
      } else {
        await ApiService.request("/vehicles", {
          method: "POST",
          body: JSON.stringify(values),
        });
        toast.success("Vehicle added successfully!");
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error("Failed to save vehicle. Please try again.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (vehicle) => setDeleteVehicle(vehicle);

  const confirmDelete = async () => {
    if (!deleteVehicle) return;
    setFormLoading(true);
    try {
      await ApiService.request(`/vehicles/${deleteVehicle._id}`, {
        method: "DELETE",
      });
      toast.success("Vehicle deleted successfully!");
      setDeleteVehicle(null);
      refetch();
    } catch (err) {
      toast.error("Failed to delete vehicle. Please try again.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    if (!data?.vehicles) return null;
    return data.vehicles.map((vehicle) => (
      <tr
        key={vehicle._id}
        className="border-b border-border hover:bg-accent/40 transition-colors"
      >
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
          {vehicle.vehicleNumber}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
          {vehicle.vehicleType}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden md:table-cell">
          {vehicle.lengthFeet}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden lg:table-cell">
          {vehicle.flooringType}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden xl:table-cell">
          {vehicle.flooringMaterial}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden sm:table-cell">
          {vehicle.capacityValue} {vehicle.capacityUnit}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden 2xl:table-cell">
          {vehicle.engineNumber || "-"}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden 2xl:table-cell">
          {vehicle.chassisNumber || "-"}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden 2xl:table-cell">
          {vehicle.insurancePolicyNo || "-"}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden 2xl:table-cell">
          {vehicle.insuranceValidity ? new Date(vehicle.insuranceValidity).toLocaleDateString() : "-"}
        </td>
        <td className="px-2 sm:px-4 py-2">
          <div className="flex gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(vehicle)}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(vehicle)}
              disabled={formLoading}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    ));
  }, [data?.vehicles, formLoading]);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Vehicles</h1>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          Add Vehicle
        </Button>
      </div>

      <Card className="mb-4 p-3 sm:p-4">
        <SearchBar
          value={search}
          onChange={handleSearch}
          onClear={handleClearSearch}
          loading={isFetching}
          placeholder="Search by number, type, engine, chassis, insurance..."
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-border bg-card text-card-foreground">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Number
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Type
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden md:table-cell">
                  Length
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden lg:table-cell">
                  Flooring Type
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden xl:table-cell">
                  Flooring Material
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden sm:table-cell">
                  Capacity
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden 2xl:table-cell">
                  Engine Number
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden 2xl:table-cell">
                  Chassis Number
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden 2xl:table-cell">
                  Insurance Policy No
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden 2xl:table-cell">
                  Insurance Validity
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-4 text-center">
                    <span className="inline-block animate-spin mr-2 align-middle">
                      <svg
                        className="h-5 w-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                    </span>
                    Loading...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-4 text-center text-red-500"
                  >
                    Error loading vehicles.{" "}
                    <Button size="sm" variant="outline" onClick={refetch}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : data?.vehicles?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-4 text-center">
                    <span role="img" aria-label="Empty">
                      🚚
                    </span>{" "}
                    No vehicles found.
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
          <div className="bg-card rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              {editVehicle ? "Edit Vehicle" : "Add Vehicle"}
            </h2>
            <VehicleForm
              initialValues={editVehicle}
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
              mode={editVehicle ? "edit" : "add"}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm border border-border">
            <h2 className="text-base sm:text-lg font-semibold mb-2">
              Delete Vehicle
            </h2>
            <p className="text-sm sm:text-base mb-4">
              Are you sure you want to delete{" "}
              <span className="font-bold">{deleteVehicle.vehicleNumber}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteVehicle(null)}
                disabled={formLoading}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={formLoading}
                className="text-sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
