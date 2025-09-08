import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ApiService from "../services/api";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import Shimmer from "../components/Shimmer";
import { toast } from "react-hot-toast";
import FreightBillForm from "./FreightBillForm";
import FreightBillDetails from "./FreightBillDetails";
import {
  Eye,
  Download,
  Printer,
  Mail,
  CheckCircle,
  BarChart3,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  "DRAFT",
  "GENERATED",
  "SENT",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
];

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATED: "bg-yellow-100 text-yellow-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const fetchFreightBills = async ({ queryKey }) => {
  const [_, { page, search, status, fromDate, toDate }] = queryKey;

  const params = {
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
  };

  if (search) params.search = search;
  if (status) params.status = status;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await ApiService.getFreightBills(params);
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

const FreightBillsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch customers and statistics
  useEffect(() => {
    // Fetch customers
    ApiService.getCustomers({ limit: 1000 })
      .then((res) => {
        setCustomers(res.data?.customers || []);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setCustomers([]);
      });

    // Fetch statistics
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await ApiService.getFreightBillStatistics();
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
      "freightBills",
      { page, search: debouncedSearch, status, fromDate, toDate },
    ],
    queryFn: fetchFreightBills,
    keepPreviousData: true,
  });

  const handleSearch = (e) => setSearch(e.target.value);
  const handleClearSearch = () => setSearch("");
  const handleStatusChange = (e) => setStatus(e.target.value);

  const handleAdd = () => {
    setModalOpen(true);
  };

  const handleView = (bill) => {
    setDetailsId(bill._id);
  };

  const handleDownloadPDF = async (bill) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/freight-bills/${bill._id}/pdf`,
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
      a.download = `FreightBill-${bill.billNumber}.pdf`;
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

  const handlePrintPDF = async (bill) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/freight-bills/${bill._id}/pdf`,
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
      toast.error(err.message || "Failed to print PDF.");
      console.error(err);
    }
  };

  const handleSendEmail = async (bill) => {
    try {
      await ApiService.sendFreightBillEmail(bill._id);
      toast.success("Bill sent via email successfully!");
      refetch();
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error(err.message || "Failed to send email.");
    }
  };

  const handleMarkPaid = async (bill) => {
    if (window.confirm(`Mark bill ${bill.billNumber} as paid?`)) {
      try {
        await ApiService.markFreightBillAsPaid(bill._id);
        toast.success("Bill marked as paid successfully!");
        refetch();
        fetchStatistics(); // Refresh stats
      } catch (err) {
        console.error("Error marking bill as paid:", err);
        toast.error(err.message || "Failed to mark bill as paid.");
      }
    }
  };

  const handleUpdateStatus = async (bill, newStatus) => {
    try {
      await ApiService.updateFreightBillStatus(bill._id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      refetch();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      await ApiService.createFreightBill(values);
      toast.success("Freight bill created successfully!");
      setModalOpen(false);
      refetch();
      fetchStatistics(); // Refresh stats
    } catch (err) {
      console.error("Error creating freight bill:", err);
      toast.error(
        err.message || "Failed to create freight bill. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    if (!data?.freightBills) return null;
    return data.freightBills.map((bill) => (
      <tr
        key={bill._id}
        className="border-b border-border hover:bg-accent/40 transition-colors"
      >
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
          <div className="font-medium">{bill.billNumber}</div>
          <div className="text-xs text-muted-foreground">
            {bill.consignments?.length || 0} consignments
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden sm:table-cell">
          {new Date(bill.billDate).toLocaleDateString()}
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden md:table-cell">
          <div>{bill.party?.name}</div>
          <div className="text-xs text-muted-foreground">
            {bill.party?.gstNumber || "No GST"}
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm hidden lg:table-cell">
          <div className="font-medium">
            ₹{bill.finalAmount?.toLocaleString()}
          </div>
          {bill.totalAmount !== bill.finalAmount && (
            <div className="text-xs text-muted-foreground">
              Base: ₹{bill.totalAmount?.toLocaleString()}
            </div>
          )}
        </td>
        <td className="px-2 sm:px-4 py-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              STATUS_COLORS[bill.status]
            }`}
          >
            {bill.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-2 sm:px-4 py-2">
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleView(bill)}
              title="View Details"
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4 text-primary" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDownloadPDF(bill)}
              title="Download PDF"
              className="h-8 w-8 hidden sm:inline-flex"
            >
              <Download className="h-4 w-4 text-primary" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handlePrintPDF(bill)}
              title="Print PDF"
              className="h-8 w-8 hidden md:inline-flex"
            >
              <Printer className="h-4 w-4 text-primary" />
            </Button>

            {bill.status !== "PAID" && bill.status !== "CANCELLED" && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSendEmail(bill)}
                  title="Send Email"
                  className="h-8 w-8 hidden md:inline-flex"
                >
                  <Mail className="h-4 w-4 text-primary" />
                </Button>

                {bill.status !== "DRAFT" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMarkPaid(bill)}
                    title="Mark as Paid"
                    className="h-8 w-8 hidden lg:inline-flex"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    ));
  }, [data?.freightBills]);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Freight Bills</h1>
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
            <FileText className="h-4 w-4 mr-2" />
            Create Bill
          </Button>
        </div>
      </div>

      {/* Statistics Card */}
      {showStats && stats && (
        <Card className="mb-4 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Freight Bill Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalBills || 0}
              </div>
              <div className="text-sm text-blue-700">Total Bills</div>
              <div className="text-xs text-muted-foreground">
                ₹{(stats.totalAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.paidBills || 0}
              </div>
              <div className="text-sm text-green-700">Paid Bills</div>
              <div className="text-xs text-muted-foreground">
                ₹{(stats.paidAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingBills || 0}
              </div>
              <div className="text-sm text-orange-700">Pending Bills</div>
              <div className="text-xs text-muted-foreground">
                ₹{(stats.pendingAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalBills > 0
                  ? Math.round((stats.paidBills / stats.totalBills) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-purple-700">Collection Rate</div>
              <div className="text-xs text-muted-foreground">
                Payment efficiency
              </div>
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
          placeholder="Search by bill number, customer..."
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
                  Bill Number
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden sm:table-cell">
                  Date
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden md:table-cell">
                  Party
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase hidden lg:table-cell">
                  Amount
                </th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium uppercase">
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
                  <td colSpan={6}>
                    <Shimmer rows={5} columns={6} />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-red-500"
                  >
                    <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                    Error loading freight bills.{" "}
                    <Button size="sm" variant="outline" onClick={refetch}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : data?.freightBills?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <div>No freight bills found.</div>
                    <Button size="sm" onClick={handleAdd} className="mt-2">
                      Create First Bill
                    </Button>
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

      {/* Create Freight Bill Modal - Update this part */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          {/* ✅ FIXED: Added proper height and overflow handling */}
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl h-[90vh] border border-border flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Freight Bill
              </h2>
            </div>

            {/* ✅ SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4">
              <FreightBillForm
                onSubmit={handleFormSubmit}
                onCancel={() => setModalOpen(false)}
                loading={formLoading}
                customers={customers}
              />
            </div>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {detailsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <FreightBillDetails
              billId={detailsId}
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

export default FreightBillsPage;
