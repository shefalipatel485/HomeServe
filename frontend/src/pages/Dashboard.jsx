import React, { useState, useEffect } from "react";

import {
  CalendarCheck,
  IndianRupee,
  Users,
  BriefcaseBusiness,
  Download,
  BarChart3,
  PieChart,
  Wrench,
  ShieldCheck,
  Star,
  FileBarChart
} from "lucide-react";

import DashboardCard from "../components/DashboardCard";
import RecentBookings from "../components/RecentBookings";

const API_BASE = "http://127.0.0.1:8000/api";

function Dashboard() {

  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    activeServices: 0
  });

  const [adminStats, setAdminStats] = useState({
    totalProviders: 0,
    totalTechnicians: 0,
    approvedProviders: 0,
    pendingProviders: 0,
    rejectedProviders: 0,
    providerPerformance: []
  });

  const [revenueReport, setRevenueReport] = useState({});
  const [earningsReport, setEarningsReport] = useState([]);
  const [serviceReport, setServiceReport] = useState([]);
  const [bookingReport, setBookingReport] = useState({});

  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [dateReport, setDateReport] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  const loggedInUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin = loggedInUser.role === "Super Admin";

  // FETCH DASHBOARD DATA

  const fetchDashboardData = async () => {

    try {

      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const requests = [
        fetch(`${API_BASE}/bookings`, { headers }),
        fetch(`${API_BASE}/payments`, { headers }),
        fetch(`${API_BASE}/customers`, { headers }),
        fetch(`${API_BASE}/services`, { headers })
      ];

      if (isAdmin) {

        requests.push(
          fetch(`${API_BASE}/analytics/overview`, { headers }),
          fetch(`${API_BASE}/analytics/revenue`, { headers }),
          fetch(`${API_BASE}/analytics/bookings`, { headers }),
          fetch(`${API_BASE}/analytics/provider-earnings`, { headers }),
          fetch(`${API_BASE}/analytics/services`, { headers })
        );

      }

      const responses = await Promise.all(requests);

      if (responses.slice(0, 4).some(response => !response.ok)) {
        throw new Error("Unable to fetch dashboard data");
      }

      const bookings = await responses[0].json();
      const payments = await responses[1].json();
      const customers = await responses[2].json();
      const services = await responses[3].json();

      // MAIN REVENUE

      const revenue = payments
        .filter(payment =>
          ["Completed", "Paid"].includes(payment.status)
        )
        .reduce(
          (total, payment) =>
            total + Number(payment.amount || 0),
          0
        );

      // ACTIVE SERVICES

      const activeServices = services.filter(
        service => service.status === "Active"
      ).length;

      setStats({
        totalBookings: bookings.length,
        totalRevenue: revenue,
        totalCustomers: customers.length,
        activeServices
      });

      // ADMIN ANALYTICS

      if (isAdmin) {

        const adminResponses = responses.slice(4);

        if (adminResponses.some(response => !response.ok)) {
          throw new Error("Unable to fetch admin analytics");
        }

        const analytics = await adminResponses[0].json();
        const revenueData = await adminResponses[1].json();
        const bookingData = await adminResponses[2].json();
        const earningsData = await adminResponses[3].json();
        const servicesData = await adminResponses[4].json();

        setAdminStats({
          totalProviders:
            analytics.providers?.total ??
            analytics.total_providers ?? 0,

          totalTechnicians:
            analytics.technicians?.total ??
            analytics.total_technicians ?? 0,

          approvedProviders:
            analytics.providers?.approved ??
            analytics.approved_providers ?? 0,

          pendingProviders:
            analytics.providers?.pending ??
            analytics.pending_providers ?? 0,

          rejectedProviders:
            analytics.providers?.rejected ??
            analytics.rejected_providers ?? 0,

          providerPerformance:
            analytics.provider_performance || []
        });

        setRevenueReport(revenueData);
        setBookingReport(bookingData);
        setEarningsReport(earningsData);
        setServiceReport(servicesData);

      }

      // MONTHLY ANALYTICS - LAST 6 MONTHS

      const months = [];

      for (let i = 5; i >= 0; i--) {

        const date = new Date();

        date.setDate(1);
        date.setMonth(date.getMonth() - i);

        const month = date.getMonth();
        const year = date.getFullYear();

        const monthBookings = bookings.filter(booking => {

          const bookingDate = new Date(booking.date);

          return (
            bookingDate.getMonth() === month &&
            bookingDate.getFullYear() === year
          );

        });

        const monthRevenue = payments
          .filter(payment => {

            const paymentDate = new Date(payment.date);

            return (
              paymentDate.getMonth() === month &&
              paymentDate.getFullYear() === year &&
              ["Completed", "Paid"].includes(payment.status)
            );

          })
          .reduce(
            (total, payment) =>
              total + Number(payment.amount || 0),
            0
          );

        months.push({
          month: date.toLocaleString("en-IN", {
            month: "short",
            year: "2-digit"
          }),
          bookings: monthBookings.length,
          revenue: monthRevenue
        });

      }

      setMonthlyData(months);

      // CATEGORY-WISE BOOKINGS

      const categories = {};

      bookings.forEach(booking => {

        const service = services.find(
          item => item.name === booking.service
        );

        const category = service?.category || "Other";

        categories[category] =
          (categories[category] || 0) + 1;

      });

      setCategoryData(
        Object.entries(categories).map(([name, count]) => ({
          name,
          count
        }))
      );

      // BOOKING STATUS REPORT

      const statuses = {};

      bookings.forEach(booking => {

        const status = booking.status || "Unknown";

        statuses[status] =
          (statuses[status] || 0) + 1;

      });

      setStatusData(
        Object.entries(statuses).map(([name, count]) => ({
          name,
          count
        }))
      );

    } catch (error) {

      console.error("Dashboard Error:", error);

      alert(
        "Unable to load dashboard data. Please check backend."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // DATE-WISE REPORT

  const fetchDateReport = async () => {

    if (!startDate || !endDate) {
      alert("Please select both dates.");
      return;
    }

    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    try {

      const response = await fetch(
        `${API_BASE}/analytics/date-report?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Unable to fetch date report");
      }

      const data = await response.json();

      setDateReport(data);

    } catch (error) {

      console.error("Date Report Error:", error);
      alert("Unable to load date-wise report.");

    }

  };

  // CSV EXPORT

  const exportCSV = () => {

    const rows = [];

    rows.push(["HOMESERVE ANALYTICS REPORT"]);
    rows.push([]);

    // MAIN STATISTICS

    rows.push(["MAIN STATISTICS"]);
    rows.push(["Total Bookings", stats.totalBookings]);
    rows.push(["Total Revenue", stats.totalRevenue]);
    rows.push(["Total Customers", stats.totalCustomers]);
    rows.push(["Active Services", stats.activeServices]);

    rows.push([]);

    if (isAdmin) {

      // ADMIN STATISTICS

      rows.push(["ADMIN STATISTICS"]);
      rows.push(["Total Providers", adminStats.totalProviders]);
      rows.push(["Total Technicians", adminStats.totalTechnicians]);
      rows.push(["Approved Providers", adminStats.approvedProviders]);
      rows.push(["Pending Providers", adminStats.pendingProviders]);
      rows.push(["Rejected Providers", adminStats.rejectedProviders]);

      rows.push([]);

      // REVENUE REPORT

      rows.push(["REVENUE REPORT"]);
      rows.push(["Total Revenue", revenueReport.total_revenue || 0]);
      rows.push(["Total Commission", revenueReport.total_commission || 0]);
      rows.push(["Provider Earnings", revenueReport.provider_earnings || 0]);
      rows.push(["Total Payments", revenueReport.total_payments || 0]);
      rows.push(["Completed Payments", revenueReport.completed_payments || 0]);
      rows.push(["Pending Payments", revenueReport.pending_payments || 0]);

      rows.push([]);

      // BOOKING REPORT

      rows.push(["BOOKING REPORT"]);
      rows.push(["Total Bookings", bookingReport.total_bookings || 0]);
      rows.push(["Pending", bookingReport.pending || 0]);
      rows.push(["Completed", bookingReport.completed || 0]);
      rows.push(["Cancelled", bookingReport.cancelled || 0]);

      rows.push([]);

      // PROVIDER PERFORMANCE

      rows.push(["PROVIDER PERFORMANCE"]);
      rows.push([
        "Business Name",
        "Owner",
        "City",
        "Verification Status",
        "Average Rating",
        "Total Reviews",
        "Total Bookings"
      ]);

      adminStats.providerPerformance.forEach(provider => {

        rows.push([
          provider.business_name,
          provider.owner_name,
          provider.city,
          provider.verification_status,
          provider.average_rating,
          provider.total_reviews,
          provider.total_bookings
        ]);

      });

      rows.push([]);

      // PROVIDER EARNINGS

      rows.push(["PROVIDER EARNINGS"]);
      rows.push(["Provider", "Total Payments", "Total Earnings"]);

      earningsReport.forEach(item => {

        rows.push([
          item.business_name,
          item.total_payments,
          item.total_earnings
        ]);

      });

      rows.push([]);

      // SERVICE REPORT

      rows.push(["SERVICE-WISE REPORT"]);
      rows.push(["Service", "Category", "Total Bookings"]);

      serviceReport.forEach(item => {

        rows.push([
          item.service,
          item.category,
          item.total_bookings
        ]);

      });

      rows.push([]);

    }

    // MONTHLY REPORT

    rows.push(["MONTHLY REPORT"]);
    rows.push(["Month", "Total Bookings", "Total Revenue"]);

    monthlyData.forEach(item => {

      rows.push([
        item.month,
        item.bookings,
        item.revenue
      ]);

    });

    rows.push([]);

    // CATEGORY REPORT

    rows.push(["CATEGORY-WISE BOOKINGS"]);
    rows.push(["Category", "Total Bookings"]);

    categoryData.forEach(item => {

      rows.push([
        item.name,
        item.count
      ]);

    });

    rows.push([]);

    // STATUS REPORT

    rows.push(["BOOKING STATUS REPORT"]);
    rows.push(["Status", "Total Bookings"]);

    statusData.forEach(item => {

      rows.push([
        item.name,
        item.count
      ]);

    });

    rows.push([]);

    // DATE-WISE REPORT

    rows.push(["DATE-WISE REPORT"]);
    rows.push(["Date", "Total Bookings", "Revenue"]);

    dateReport.forEach(item => {

      rows.push([
        item.date,
        item.total_bookings,
        item.revenue
      ]);

    });

    const csvContent = rows
      .map(row =>
        row.map(value =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "HomeServe_Complete_Analytics_Report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  const maxBookings = Math.max(
    ...monthlyData.map(item => item.bookings),
    1
  );

  const maxCategory = Math.max(
    ...categoryData.map(item => item.count),
    1
  );

  const maxRevenue = Math.max(
    ...monthlyData.map(item => item.revenue),
    1
  );

  return (

    <div className="dashboard">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </div>

        <button
          className="add-booking-btn"
          onClick={() => window.location.href = "/bookings"}
        >
          + Add Booking
        </button>

      </div>

      {/* MAIN STATISTICS */}

      <div className="dashboard-cards">

        <DashboardCard
          title="Total Bookings"
          value={loading ? "Loading..." : stats.totalBookings.toLocaleString("en-IN")}
          icon={<CalendarCheck size={25} color="white" />}
          color="#2563eb"
          change="Total bookings"
        />

        <DashboardCard
          title="Total Revenue"
          value={loading ? "Loading..." : `₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          icon={<IndianRupee size={25} color="white" />}
          color="#16a34a"
          change="Completed payments"
        />

        <DashboardCard
          title="Total Customers"
          value={loading ? "Loading..." : stats.totalCustomers.toLocaleString("en-IN")}
          icon={<Users size={25} color="white" />}
          color="#9333ea"
          change="Registered customers"
        />

        <DashboardCard
          title="Active Services"
          value={loading ? "Loading..." : stats.activeServices.toLocaleString("en-IN")}
          icon={<BriefcaseBusiness size={25} color="white" />}
          color="#ea580c"
          change="Available services"
        />

      </div>

      {/* SUPER ADMIN ANALYTICS */}

      {isAdmin && (

        <>

          <div className="dashboard-header" style={{ marginTop: "30px" }}>
            <div>
              <h2>Super Admin Analytics</h2>
              <p>Overall platform statistics</p>
            </div>
          </div>

          {/* ADMIN CARDS */}

          <div className="dashboard-cards">

            <DashboardCard
              title="Service Providers"
              value={adminStats.totalProviders.toLocaleString("en-IN")}
              icon={<BriefcaseBusiness size={25} color="white" />}
              color="#0891b2"
              change="Registered providers"
            />

            <DashboardCard
              title="Total Technicians"
              value={adminStats.totalTechnicians.toLocaleString("en-IN")}
              icon={<Wrench size={25} color="white" />}
              color="#7c3aed"
              change="Registered technicians"
            />

            <DashboardCard
              title="Approved Providers"
              value={adminStats.approvedProviders.toLocaleString("en-IN")}
              icon={<ShieldCheck size={25} color="white" />}
              color="#16a34a"
              change="Verified providers"
            />

          </div>

          {/* PROVIDER VERIFICATION */}

          <div className="dashboard-cards">

            <div className="dashboard-card">

              <h3>Provider Verification Status</h3>

              {[
                {
                  label: "Approved",
                  value: adminStats.approvedProviders,
                  background: "#dcfce7"
                },
                {
                  label: "Pending",
                  value: adminStats.pendingProviders,
                  background: "#fef3c7"
                },
                {
                  label: "Rejected",
                  value: adminStats.rejectedProviders,
                  background: "#fee2e2"
                }
              ].map((item, index) => (

                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "15px",
                    background: item.background,
                    borderRadius: "8px",
                    marginBottom: "12px"
                  }}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>

              ))}

            </div>

          </div>

          {/* REVENUE & PAYMENT REPORT */}

          <div className="dashboard-header" style={{ marginTop: "30px" }}>
            <div>
              <h2>Revenue & Payment Reports</h2>
              <p>Complete financial overview</p>
            </div>
          </div>

          <div className="dashboard-cards">

            <DashboardCard
              title="Total Revenue"
              value={`₹${Number(revenueReport.total_revenue || 0).toLocaleString("en-IN")}`}
              icon={<IndianRupee size={25} color="white" />}
              color="#16a34a"
              change="Completed payments"
            />

            <DashboardCard
              title="Total Commission"
              value={`₹${Number(revenueReport.total_commission || 0).toLocaleString("en-IN")}`}
              icon={<IndianRupee size={25} color="white" />}
              color="#2563eb"
              change="Platform commission"
            />

            <DashboardCard
              title="Provider Earnings"
              value={`₹${Number(revenueReport.provider_earnings || 0).toLocaleString("en-IN")}`}
              icon={<BriefcaseBusiness size={25} color="white" />}
              color="#9333ea"
              change="Provider earnings"
            />

          </div>

          {/* PAYMENT DETAILS */}

          <div className="dashboard-card">

            <h3>Payment Summary</h3>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px" }}>
              <span>Total Payments</span>
              <strong>{revenueReport.total_payments || 0}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px" }}>
              <span>Completed Payments</span>
              <strong>{revenueReport.completed_payments || 0}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px" }}>
              <span>Pending Payments</span>
              <strong>{revenueReport.pending_payments || 0}</strong>
            </div>

          </div>

          {/* BOOKING ANALYTICS */}

          <div className="dashboard-card" style={{ marginTop: "20px" }}>

            <h3>Booking Analytics</h3>

            {[
              ["Total Bookings", bookingReport.total_bookings],
              ["Pending", bookingReport.pending],
              ["Completed", bookingReport.completed],
              ["Cancelled", bookingReport.cancelled]
            ].map(([label, value], index) => (

              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <span>{label}</span>
                <strong>{value || 0}</strong>
              </div>

            ))}

          </div>

          {/* PROVIDER PERFORMANCE */}

          <div className="dashboard-card" style={{ marginTop: "20px" }}>

            <h3>
              <Star size={20} />
              Provider Performance & Ratings
            </h3>

            <div style={{ overflowX: "auto", marginTop: "20px" }}>

              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left"
              }}>

                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ padding: "12px" }}>Business Name</th>
                    <th style={{ padding: "12px" }}>Owner</th>
                    <th style={{ padding: "12px" }}>City</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px" }}>Rating</th>
                    <th style={{ padding: "12px" }}>Reviews</th>
                    <th style={{ padding: "12px" }}>Bookings</th>
                  </tr>
                </thead>

                <tbody>

                  {adminStats.providerPerformance.length === 0 ? (

                    <tr>
                      <td colSpan="7" style={{ padding: "20px", textAlign: "center" }}>
                        No provider records available.
                      </td>
                    </tr>

                  ) : (

                    adminStats.providerPerformance.map(provider => (

                      <tr key={provider.provider_id} style={{ borderBottom: "1px solid #e5e7eb" }}>

                        <td style={{ padding: "12px" }}>{provider.business_name}</td>
                        <td style={{ padding: "12px" }}>{provider.owner_name}</td>
                        <td style={{ padding: "12px" }}>{provider.city}</td>
                        <td style={{ padding: "12px" }}>{provider.verification_status}</td>
                        <td style={{ padding: "12px" }}>⭐ {provider.average_rating}</td>
                        <td style={{ padding: "12px" }}>{provider.total_reviews}</td>
                        <td style={{ padding: "12px" }}>{provider.total_bookings || 0}</td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* SERVICE-WISE REPORT */}

          <div className="dashboard-card" style={{ marginTop: "20px" }}>

            <h3>
              <BriefcaseBusiness size={20} />
              Service-wise Booking Report
            </h3>

            <div style={{ overflowX: "auto", marginTop: "15px" }}>

              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>

                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ padding: "12px" }}>Service</th>
                    <th style={{ padding: "12px" }}>Category</th>
                    <th style={{ padding: "12px" }}>Total Bookings</th>
                  </tr>
                </thead>

                <tbody>

                  {serviceReport.map((item, index) => (

                    <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px" }}>{item.service}</td>
                      <td style={{ padding: "12px" }}>{item.category}</td>
                      <td style={{ padding: "12px" }}>{item.total_bookings}</td>
                    </tr>

                  ))}

                  {serviceReport.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: "15px", textAlign: "center" }}>
                        No service records available.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* PROVIDER EARNINGS */}

          <div className="dashboard-card" style={{ marginTop: "20px" }}>

            <h3>Provider Earnings Report</h3>

            <div style={{ overflowX: "auto", marginTop: "15px" }}>

              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>

                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ padding: "12px" }}>Provider</th>
                    <th style={{ padding: "12px" }}>Payments</th>
                    <th style={{ padding: "12px" }}>Total Earnings</th>
                  </tr>
                </thead>

                <tbody>

                  {earningsReport.map(item => (

                    <tr key={item.provider_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px" }}>{item.business_name}</td>
                      <td style={{ padding: "12px" }}>{item.total_payments}</td>
                      <td style={{ padding: "12px" }}>
                        ₹{Number(item.total_earnings || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>

                  ))}

                  {earningsReport.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: "15px", textAlign: "center" }}>
                        No earnings records available.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

      {/* ANALYTICS HEADER */}

      <div className="dashboard-header" style={{ marginTop: "30px" }}>

        <div>
          <h2>Analytics & Reporting</h2>
          <p>Business performance and booking analytics</p>
        </div>

        <button className="add-booking-btn" onClick={exportCSV}>
          <Download size={17} style={{ marginRight: "8px" }} />
          Export CSV
        </button>

      </div>

      {/* MONTHLY ANALYTICS */}

      <div className="dashboard-cards">

        <div className="dashboard-card" style={{ gridColumn: "span 2" }}>

          <h3>
            <BarChart3 size={20} />
            Monthly Booking Report
          </h3>

          {loading ? (
            <p>Loading analytics...</p>
          ) : monthlyData.length === 0 ? (
            <p>No monthly data available.</p>
          ) : (

            <div style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-around",
              height: "220px",
              padding: "20px 5px",
              gap: "12px"
            }}>

              {monthlyData.map((item, index) => (

                <div key={index} style={{ flex: 1, textAlign: "center" }}>

                  <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                    {item.bookings}
                  </div>

                  <div style={{
                    height: `${Math.max((item.bookings / maxBookings) * 150, 5)}px`,
                    background: "#2563eb",
                    borderRadius: "6px 6px 0 0",
                    width: "100%",
                    maxWidth: "55px",
                    margin: "auto"
                  }} />

                  <p style={{ fontSize: "12px", marginTop: "8px" }}>
                    {item.month}
                  </p>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* MONTHLY REVENUE */}

        <div className="dashboard-card">

          <h3>
            <IndianRupee size={20} />
            Monthly Revenue
          </h3>

          {monthlyData.map((item, index) => (

            <div key={index} style={{ marginBottom: "15px" }}>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "5px"
              }}>
                <span>{item.month}</span>
                <strong>₹{item.revenue.toLocaleString("en-IN")}</strong>
              </div>

              <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "10px" }}>

                <div style={{
                  width: `${(item.revenue / maxRevenue) * 100}%`,
                  height: "8px",
                  background: "#16a34a",
                  borderRadius: "10px"
                }} />

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* CATEGORY AND STATUS REPORT */}

      <div className="dashboard-cards">

        <div className="dashboard-card">

          <h3>
            <PieChart size={20} />
            Category-wise Bookings
          </h3>

          {categoryData.length === 0 ? (

            <p>No category data available.</p>

          ) : (

            categoryData.map((item, index) => (

              <div key={index} style={{ marginBottom: "18px" }}>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px"
                }}>
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>

                <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "10px" }}>

                  <div style={{
                    width: `${(item.count / maxCategory) * 100}%`,
                    height: "10px",
                    background: "#9333ea",
                    borderRadius: "10px"
                  }} />

                </div>

              </div>

            ))

          )}

        </div>

        {/* BOOKING STATUS */}

        <div className="dashboard-card">

          <h3>
            <CalendarCheck size={20} />
            Booking Status Report
          </h3>

          {statusData.length === 0 ? (

            <p>No booking status available.</p>

          ) : (

            statusData.map((item, index) => (

              <div key={index} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px",
                marginBottom: "10px",
                background: "#f8fafc",
                borderRadius: "8px"
              }}>
                <span>{item.name}</span>
                <strong>{item.count}</strong>
              </div>

            ))

          )}

        </div>

      </div>

      {/* DATE-WISE REPORT */}

      {isAdmin && (

        <div className="dashboard-card" style={{ marginTop: "25px" }}>

          <h3>
            <FileBarChart size={20} />
            Date-wise Analytics Report
          </h3>

          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "20px",
            alignItems: "end"
          }}>

            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ display: "block", padding: "10px", marginTop: "5px" }}
              />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ display: "block", padding: "10px", marginTop: "5px" }}
              />
            </div>

            <button
              className="add-booking-btn"
              onClick={fetchDateReport}
            >
              Generate Report
            </button>

          </div>

          <div style={{ overflowX: "auto", marginTop: "20px" }}>

            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>

              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "12px" }}>Date</th>
                  <th style={{ padding: "12px" }}>Total Bookings</th>
                  <th style={{ padding: "12px" }}>Revenue</th>
                </tr>
              </thead>

              <tbody>

                {dateReport.map((item, index) => (

                  <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px" }}>{item.date}</td>
                    <td style={{ padding: "12px" }}>{item.total_bookings}</td>
                    <td style={{ padding: "12px" }}>
                      ₹{Number(item.revenue || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>

                ))}

                {dateReport.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: "15px", textAlign: "center" }}>
                      Select dates and generate report.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* RECENT BOOKINGS */}

      <RecentBookings />

    </div>

  );

}

export default Dashboard;