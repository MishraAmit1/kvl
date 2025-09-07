import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useEffect } from "react";
import useAuthStore from "./stores/authStore";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import Toaster from "./components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import CustomersPage from "./pages/Customers";
import DriversPage from "./pages/Drivers";
import VehiclesPage from "./pages/Vehicles";
import ConsignmentsPage from "./pages/Consignments";
import FreightBillsPage from "./pages/FreightBillsPage";
import LoadChalansPage from "./pages/LoadChalans";
import LoadChalanForm from "./pages/LoadChalanForm";
import LoadChalanView from "./pages/LoadChalanView";

// Create a client
const queryClient = new QueryClient();

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public routes - accessible before login */}
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRedirect>
                  <Signup />
                </AuthRedirect>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthRedirect>
                  <ForgotPassword />
                </AuthRedirect>
              }
            />
            {/* Protected admin routes - only accessible after login */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/consignments" element={<ConsignmentsPage />} />
              <Route path="/freight-bills" element={<FreightBillsPage />} />
              <Route path="/load-chalans" element={<LoadChalansPage />} />
              <Route path="/load-chalans/new" element={<LoadChalanForm />} />
              <Route path="/load-chalans/:id" element={<LoadChalanView />} />
              <Route path="/load-chalans/:id/edit" element={<LoadChalanForm />} />
            </Route>

            {/* Redirect any unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
