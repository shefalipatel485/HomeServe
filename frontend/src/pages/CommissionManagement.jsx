import React, { useEffect, useState } from "react";

const API_URL = "https://homeserve-uprh.onrender.com/api/commission";

function CommissionManagement() {
  const [commission, setCommission] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchCommission();
  }, []);

  const fetchCommission = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unable to fetch commission settings");
      }

      const data = await response.json();

      setCommission(data.commission_percentage);
      setUpdatedAt(data.updated_at || "");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCommission = async (e) => {
    e.preventDefault();

    if (commission < 0 || commission > 100) {
      alert("Commission must be between 0 and 100");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          commission_percentage: Number(commission)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Commission update failed");
      }

      setCommission(data.commission_percentage);
      setUpdatedAt(data.updated_at || "");

      alert("Commission percentage updated successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <h3>Loading commission settings...</h3>;
  }

  return (
    <div className="page-container">
      <h2>Commission Management</h2>

      <div className="form-container">
        <h3>Platform Commission Settings</h3>

        <form onSubmit={updateCommission}>
          <div className="form-group">
            <label>Commission Percentage (%)</label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Updating..." : "Update Commission"}
          </button>
        </form>

        <div style={{ marginTop: "20px" }}>
          <h3>Current Commission: {commission}%</h3>

          {updatedAt && (
            <p>
              Last Updated: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommissionManagement;