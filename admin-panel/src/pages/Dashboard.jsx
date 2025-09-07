import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import ApiService from "../services/api";
import { toast } from "react-hot-toast";
import {
  Users,
  Truck,
  FileText,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  RefreshCw,
  Eye,
  Plus,
} from "lucide-react";

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    const [
      consignmentStats,
      freightStats,
      customers,
      vehicles,
      drivers,
      recentConsignments,
      recentFreightBills,
    ] = await Promise.all([
      ApiService.getConsignmentStatistics(),
      ApiService.getFreightBillStatistics(),
      ApiService.getCustomers({ limit: 5 }),
      ApiService.getVehicles({ limit: 10 }),
      ApiService.getDrivers({ limit: 10 }),
      ApiService.getConsignments({ limit: 5, page: 1 }),
      ApiService.getFreightBills({ limit: 5, page: 1 }),
    ]);

    return {
      consignmentStats: consignmentStats.data,
      freightStats: freightStats.data,
      customers: customers.data?.customers || [],
      vehicles: vehicles.data?.vehicles || [],
      drivers: drivers.data?.drivers || [],
      recentConsignments: recentConsignments.data?.consignments || [],
      recentFreightBills: recentFreightBills.data?.freightBills || [],
      totalCustomers: customers.data?.pagination?.total || 0,
      totalVehicles: vehicles.data?.pagination?.total || 0,
      totalDrivers: drivers.data?.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", refreshKey],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Dashboard refreshed!");
  };

  // Calculate metrics
  const metrics = React.useMemo(() => {
    if (!data) return null;

    const { consignmentStats, freightStats } = data;

    // Consignment metrics
    const totalConsignments =
      consignmentStats?.statusWise?.reduce(
        (sum, item) => sum + item.count,
        0
      ) || 0;
    const deliveredConsignments =
      consignmentStats?.statusWise?.find((item) => item._id === "DELIVERED")
        ?.count || 0;
    const inTransitConsignments =
      consignmentStats?.statusWise?.find((item) => item._id === "IN_TRANSIT")
        ?.count || 0;
    const pendingConsignments = totalConsignments - deliveredConsignments;

    // Revenue metrics
    const totalRevenue = freightStats?.totalAmount || 0;
    const paidRevenue = freightStats?.paidAmount || 0;
    const pendingRevenue = freightStats?.pendingAmount || 0;
    const collectionRate =
      totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

    // Vehicle metrics
    const availableVehicles =
      data.vehicles?.filter((v) => v.status === "AVAILABLE").length || 0;
    const onTripVehicles =
      data.vehicles?.filter((v) => v.status === "ON_TRIP").length || 0;
    const maintenanceVehicles =
      data.vehicles?.filter((v) => v.status === "MAINTENANCE").length || 0;

    // Driver metrics
    const availableDrivers =
      data.drivers?.filter((d) => d.status === "AVAILABLE").length || 0;
    const onTripDrivers =
      data.drivers?.filter((d) => d.status === "ON_TRIP").length || 0;

    return {
      totalConsignments,
      deliveredConsignments,
      inTransitConsignments,
      pendingConsignments,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      collectionRate,
      availableVehicles,
      onTripVehicles,
      maintenanceVehicles,
      availableDrivers,
      onTripDrivers,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground mb-4">
          There was an error loading the dashboard data.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your logistics
            operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Consignments */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Consignments
              </p>
              <p className="text-2xl md:text-3xl font-bold">
                {metrics?.totalConsignments || 0}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {metrics?.deliveredConsignments || 0} delivered
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <p className="text-2xl md:text-3xl font-bold">
                ₹{(metrics?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {metrics?.collectionRate || 0}% collected
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Active Vehicles */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Vehicles
              </p>
              <p className="text-2xl md:text-3xl font-bold">
                {data?.totalVehicles || 0}
              </p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Truck className="h-3 w-3 mr-1" />
                {metrics?.onTripVehicles || 0} on trip
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Customers
              </p>
              <p className="text-2xl md:text-3xl font-bold">
                {data?.totalCustomers || 0}
              </p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                Active clients
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consignment Status Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consignment Status
            </h3>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {data?.consignmentStats?.statusWise?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item._id === "DELIVERED"
                        ? "bg-green-500"
                        : item._id === "IN_TRANSIT"
                        ? "bg-blue-500"
                        : item._id === "BOOKED"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="text-sm font-medium">
                    {item._id.replace("_", " ")}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.count}</div>
                  <div className="text-xs text-muted-foreground">
                    ₹{item.totalValue?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Analytics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Analytics
            </h3>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Paid Amount</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  ₹{(metrics?.paidRevenue || 0).toLocaleString()}
                </div>
                <div className="text-xs text-green-600">
                  {metrics?.collectionRate || 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm font-medium">Pending Amount</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  ₹{(metrics?.pendingRevenue || 0).toLocaleString()}
                </div>
                <div className="text-xs text-orange-600">
                  {100 - (metrics?.collectionRate || 0)}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Total Bills</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {data?.freightStats?.totalBills || 0}
                </div>
                <div className="text-xs text-blue-600">Generated</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* Fleet Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vehicle Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Fleet
            </h3>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Available</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {metrics?.availableVehicles || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">On Trip</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {metrics?.onTripVehicles || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Maintenance</span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {metrics?.maintenanceVehicles || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Driver Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Driver Status
            </h3>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Available</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {metrics?.availableDrivers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">On Trip</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {metrics?.onTripDrivers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Total Drivers</span>
              </div>
              <span className="text-lg font-bold text-gray-600">
                {data?.totalDrivers || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              New Consignment
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Freight Bill
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Truck className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consignments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Consignments
            </h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {data?.recentConsignments?.slice(0, 5).map((consignment) => (
              <div
                key={consignment._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/40 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {consignment.consignmentNumber}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        consignment.status === "DELIVERED"
                          ? "bg-green-100 text-green-700"
                          : consignment.status === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {consignment.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {consignment.fromCity} → {consignment.toCity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(consignment.bookingDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    ₹{consignment.grandTotal?.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {consignment.chargedWeight} kg
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentConsignments ||
              data.recentConsignments.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent consignments</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Freight Bills */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Freight Bills
            </h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {data?.recentFreightBills?.slice(0, 5).map((bill) => (
              <div
                key={bill._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/40 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {bill.billNumber}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        bill.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : bill.status === "SENT"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bill.party?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(bill.billDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    ₹{bill.finalAmount?.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bill.consignments?.length || 0} items
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentFreightBills ||
              data.recentFreightBills.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent freight bills</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Delivery Performance</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                On-time Delivery
              </span>
              <span className="text-sm font-medium">
                {metrics?.deliveredConsignments && metrics?.totalConsignments
                  ? Math.round(
                      (metrics.deliveredConsignments /
                        metrics.totalConsignments) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${
                    metrics?.deliveredConsignments && metrics?.totalConsignments
                      ? (metrics.deliveredConsignments /
                          metrics.totalConsignments) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Collection Rate</h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Payment Collection
              </span>
              <span className="text-sm font-medium">
                {metrics?.collectionRate || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${metrics?.collectionRate || 0}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fleet Utilization</h3>
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Vehicles in Use
              </span>
              <span className="text-sm font-medium">
                {data?.totalVehicles && metrics?.onTripVehicles
                  ? Math.round(
                      (metrics.onTripVehicles / data.totalVehicles) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    data?.totalVehicles && metrics?.onTripVehicles
                      ? (metrics.onTripVehicles / data.totalVehicles) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Info */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Auto-refresh: 30s</span>
            <span>•</span>
            <span>System Status: Online</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
