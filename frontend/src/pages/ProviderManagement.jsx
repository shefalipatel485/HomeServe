import React, { useEffect, useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  RefreshCw
} from "lucide-react";
import "./ProviderManagement.css";
const API_URL = "http://127.0.0.1:8000/api/providers";

function ProviderManagement() {

  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json"
  });

  // Fetch Providers
  const fetchProviders = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error("Unable to load providers");
      }

      const data = await response.json();
      setProviders(data);

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Approve Provider
  const approveProvider = async (id) => {

    if (!window.confirm("Are you sure you want to approve this provider?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}/approve`, {
        method: "PUT",
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Approval failed");
      }

      alert("Provider approved successfully!");
      fetchProviders();

    } catch (error) {
      alert(error.message);
    }
  };

  // Reject Provider
  const rejectProvider = async (id) => {

    const reason = window.prompt("Enter rejection reason:");

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}/reject?rejection_reason=${encodeURIComponent(reason)}`,
        {
          method: "PUT",
          headers: getHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Rejection failed");
      }

      alert("Provider rejected successfully!");
      fetchProviders();

    } catch (error) {
      alert(error.message);
    }
  };

  // Search Filter
  const filteredProviders = providers.filter((provider) =>
    provider.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    provider.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="provider-page">

      {/* Header */}
      <div className="provider-header">
        <div>
          <h2>Provider Management</h2>
          <p>Manage and verify service providers</p>
        </div>

        <button onClick={fetchProviders} className="refresh-btn">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="provider-stats">

        <div className="provider-stat-card">
          <Building2 size={25} />
          <div>
            <h3>{providers.length}</h3>
            <p>Total Providers</p>
          </div>
        </div>

        <div className="provider-stat-card">
          <Clock size={25} />
          <div>
            <h3>
              {providers.filter(p => p.verification_status === "Pending").length}
            </h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="provider-stat-card">
          <CheckCircle size={25} />
          <div>
            <h3>
              {providers.filter(p => p.verification_status === "Approved").length}
            </h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="provider-stat-card">
          <XCircle size={25} />
          <div>
            <h3>
              {providers.filter(p => p.verification_status === "Rejected").length}
            </h3>
            <p>Rejected</p>
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="provider-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search by business name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Provider Table */}
      <div className="provider-table-container">

        <table className="provider-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Business Name</th>
              <th>City</th>
              <th>Base Price</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="6">Loading providers...</td>
              </tr>

            ) : filteredProviders.length === 0 ? (

              <tr>
                <td colSpan="6">No providers found</td>
              </tr>

            ) : (

              filteredProviders.map((provider) => (

                <tr key={provider.id}>

                  <td>#{provider.id}</td>

                  <td>{provider.business_name}</td>

                  <td>{provider.city}</td>

                  <td>₹{provider.base_price}</td>

                  <td>
                    <span
                      className={`provider-status ${provider.verification_status?.toLowerCase()}`}
                    >
                      {provider.verification_status}
                    </span>
                  </td>

                  <td>

                    {provider.verification_status === "Pending" ? (

                      <div className="provider-actions">

                        <button
                          className="approve-btn"
                          onClick={() => approveProvider(provider.id)}
                        >
                          <CheckCircle size={15} />
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => rejectProvider(provider.id)}
                        >
                          <XCircle size={15} />
                          Reject
                        </button>

                      </div>

                    ) : (

                      <span>-</span>

                    )}

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default ProviderManagement;