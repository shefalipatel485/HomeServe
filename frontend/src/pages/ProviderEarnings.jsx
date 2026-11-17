import React, { useEffect, useState } from "react";

const API_URL = "https://homeserve-uprh.onrender.com/api/provider/earnings";

function ProviderEarnings() {
  const [earnings, setEarnings] = useState({
    provider_id: 0,
    total_revenue: 0,
    total_commission: 0,
    total_earnings: 0,
    total_payments: 0
  });

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to fetch provider earnings");
      }

      setEarnings(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h3>Loading earnings...</h3>;
  }

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <div className="page-container">
      <h2>My Earnings</h2>

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <h3>Total Revenue</h3>
          <h2>{formatAmount(earnings.total_revenue)}</h2>
        </div>

        <div className="dashboard-card">
          <h3>Platform Commission</h3>
          <h2>{formatAmount(earnings.total_commission)}</h2>
        </div>

        <div className="dashboard-card">
          <h3>My Earnings</h3>
          <h2>{formatAmount(earnings.total_earnings)}</h2>
        </div>

        <div className="dashboard-card">
          <h3>Total Payments</h3>
          <h2>{earnings.total_payments}</h2>
        </div>

      </div>

      <div className="form-container" style={{ marginTop: "25px" }}>
        <h3>Earnings Summary</h3>

        <p>
          <strong>Total Revenue:</strong>{" "}
          {formatAmount(earnings.total_revenue)}
        </p>

        <p>
          <strong>Platform Commission:</strong>{" "}
          {formatAmount(earnings.total_commission)}
        </p>

        <p>
          <strong>Net Provider Earnings:</strong>{" "}
          {formatAmount(earnings.total_earnings)}
        </p>

        <p>
          <strong>Completed/Paid Payments:</strong>{" "}
          {earnings.total_payments}
        </p>
      </div>
    </div>
  );
}

export default ProviderEarnings;