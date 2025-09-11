import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ApiService from "../services/api";
import CustomerForm from "./CustomerForm";
import { toast } from "react-hot-toast";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

const fetchCustomers = async ({ queryKey }) => {
  const [_key, { page, search }] = queryKey;
  const params = new URLSearchParams({ page, limit: PAGE_SIZE });
  if (search) params.append("search", search);
  const res = await ApiService.request(`/customers?${params.toString()}`, {
    method: "GET",
  });
  return res.data;
};

// Debounce hook
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

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  const debouncedSearch = useDebounce(search, 400).trim();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["customers", { page, search: debouncedSearch }],
    queryFn: fetchCustomers,
    keepPreviousData: true,
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  const handleClearSearch = () => setSearch("");

  const handleAdd = () => {
    setEditCustomer(null);
    setModalOpen(true);
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (editCustomer) {
        await ApiService.request(`/customers/${editCustomer._id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Customer updated successfully!");
      } else {
        await ApiService.request("/customers", {
          method: "POST",
          body: JSON.stringify(values),
        });
        toast.success("Customer added successfully!");
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to save customer. Please try again.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (customer) => {
    setDeleteCustomer(customer);
  };

  const confirmDelete = async () => {
    if (!deleteCustomer) return;
    setFormLoading(true);
    try {
      await ApiService.request(`/customers/${deleteCustomer._id}`, {
        method: "DELETE",
      });
      toast.success("Customer deleted successfully!");
      setDeleteCustomer(null);
      refetch();
    } catch (err) {
      toast.error(
        err?.message || "Failed to delete customer. Please try again."
      );
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    if (!data?.customers) return null;
    return data.customers.map((customer) => (
      <tr
        key={customer._id}
        className="border-b border-border hover:bg-accent/40 transition-colors"
      >
        <td className="px-4 py-2">{customer.name}</td>
        <td className="px-4 py-2">{customer.mobile}</td>
        <td className="px-4 py-2">{customer.city}</td>
        <td className="px-4 py-2">{customer.customerType}</td>
        <td className="px-4 py-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(customer)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="ml-2"
            onClick={() => handleDelete(customer)}
            disabled={formLoading}
          >
            Delete
          </Button>
        </td>
      </tr>
    ));
  }, [data?.customers, formLoading]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={handleAdd}>Add Customer</Button>
      </div>
      <Card className="mb-4 p-4">
        <SearchBar
          value={search}
          onChange={handleSearch}
          onClear={handleClearSearch}
          loading={isFetching}
          placeholder="Search by name, mobile, city..."
        />
      </Card>
      <Card className="overflow-x-auto">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-border bg-card text-card-foreground">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Mobile
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  City
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
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
                    Error loading customers.{" "}
                    <Button size="sm" variant="outline" onClick={refetch}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : data?.customers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center">
                    <span role="img" aria-label="Empty">
                      📭
                    </span>{" "}
                    No customers found.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <h2 className="text-xl font-semibold mb-4">
              {editCustomer ? "Edit Customer" : "Add Customer"}
            </h2>
            <CustomerForm
              initialValues={editCustomer}
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
              mode={editCustomer ? "edit" : "add"}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-sm border border-border">
            <h2 className="text-lg font-semibold mb-2">Delete Customer</h2>
            <p className="mb-4">
              Are you sure you want to delete{" "}
              <span className="font-bold">{deleteCustomer.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteCustomer(null)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={formLoading}
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

export default CustomersPage;
