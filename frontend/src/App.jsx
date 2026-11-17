import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import CommissionManagement from "./pages/CommissionManagement";
import ProviderEarnings from "./pages/ProviderEarnings";
import TechnicianManagement from "./pages/TechnicianManagement";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Reviews from "./pages/Reviews";
import Complaints from "./pages/Complaints";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Bookings from "./pages/Bookings";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import ProviderManagement from "./pages/ProviderManagement";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TechnicianJobs from "./pages/TechnicianJobs";
import InvoiceManagement from "./pages/InvoiceManagement";

import "./App.css";

// Protected Route
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Super Admin Route
function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.role !== "Super Admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Main Layout
function MainLayout() {
  return (
    <>
      <Navbar />

      <div className="main-layout">
        <Sidebar />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/services" element={<Services />} />

            <Route path="/bookings" element={<Bookings />} />

            <Route path="/customers" element={<Customers />} />

            <Route path="/payments" element={<Payments />} />

            <Route
              path="/commission"
              element={
                <AdminRoute>
                  <CommissionManagement />
                </AdminRoute>
              }
            />

            <Route
              path="/provider-earnings"
              element={<ProviderEarnings />}
            />

            <Route
              path="/invoices"
              element={<InvoiceManagement />}
            />

            <Route
              path="/technicians"
              element={<TechnicianManagement />}
            />

            <Route
              path="/reviews"
              element={<Reviews />}
            />

            <Route
              path="/complaints"
              element={<Complaints />}
            />

            <Route
              path="/technician-jobs"
              element={<TechnicianJobs />}
            />

            <Route
              path="/notifications"
              element={<Notifications />}
            />

            <Route
              path="/providers"
              element={
                <AdminRoute>
                  <ProviderManagement />
                </AdminRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  const token = localStorage.getItem("access_token");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <Register />}
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;