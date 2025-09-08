import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ApiService from "../services/api";
import DriverForm from "./DriverForm";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const fetchDrivers = async ({ queryKey }) => {
  const [_key, { page, search }] = queryKey;
  const params = new URLSearchParams({ page, limit: PAGE_SIZE });
  if (search) params.append("search", search);
  const res = await ApiService.request(`/drivers?${params.toString()}`, {
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

const DriversPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDriver, setDeleteDriver] = useState(null);
  const debouncedSearch = useDebounce(search, 400).trim();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["drivers", { page, search: debouncedSearch }],
    queryFn: fetchDrivers,
    keepPreviousData: true,
  });

  const handleSearch = (e) => setSearch(e.target.value);
  const handleClearSearch = () => setSearch("");

  const handleAdd = () => {
    setEditDriver(null);
    setModalOpen(true);
  };

  const handleEdit = (driver) => {
    setEditDriver(driver);
    setModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (editDriver) {
        await ApiService.request(`/drivers/${editDriver._id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Driver updated successfully!");
      } else {
        await ApiService.request("/drivers", {
          method: "POST",
          body: JSON.stringify(values),
        });
        toast.success("Driver added successfully!");
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to save driver. Please try again.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (driver) => setDeleteDriver(driver);

  const confirmDelete = async () => {
    if (!deleteDriver) return;
    setFormLoading(true);
    try {
      await ApiService.request(`/drivers/${deleteDriver._id}`, {
        method: "DELETE",
      });
      toast.success("Driver deleted successfully!");
      setDeleteDriver(null);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to delete driver. Please try again.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    if (!data?.drivers) return null;
    return data.drivers.map((driver) => (
      <tr
        key={driver._id}
        className="border-b border-border hover:bg-accent/40 transition-colors"
      >
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">{driver.name}</td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
          {driver.mobile}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden md:table-cell">
          {driver.email}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden lg:table-cell">
          {driver.licenseNumber}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden xl:table-cell">
          {driver.currentLocation}
        </td>
        <td className="px-2 sm:px-4 py-2">
          <div className="flex gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(driver)}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(driver)}
              disabled={formLoading}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    ));
  }, [data?.drivers, formLoading]);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Drivers</h1>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          Add Driver
        </Button>
      </div>

      <Card className="mb-4 p-3 sm:p-4">
        <SearchBar
          value={search}
          onChange={handleSearch}
          onClear={handleClearSearch}
          loading={isFetching}
          placeholder="Search by name, mobile, email, license..."
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-border bg-card text-card-foreground">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Name
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Mobile
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden md:table-cell">
                  Email
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden lg:table-cell">
                  License
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden xl:table-cell">
                  Location
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center">
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
                    colSpan={6}
                    className="px-4 py-4 text-center text-red-500"
                  >
                    Error loading drivers.{" "}
                    <Button size="sm" variant="outline" onClick={refetch}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : data?.drivers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center">
                    <span role="img" aria-label="Empty">
                      🧑‍✈️
                    </span>{" "}
                    No drivers found.
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
              {editDriver ? "Edit Driver" : "Add Driver"}
            </h2>
            <DriverForm
              initialValues={editDriver}
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
              mode={editDriver ? "edit" : "add"}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm border border-border">
            <h2 className="text-base sm:text-lg font-semibold mb-2">
              Delete Driver
            </h2>
            <p className="text-sm sm:text-base mb-4">
              Are you sure you want to delete{" "}
              <span className="font-bold">{deleteDriver.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDriver(null)}
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

export default DriversPage;
