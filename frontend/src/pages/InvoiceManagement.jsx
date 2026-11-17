import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  IndianRupee
} from "lucide-react";

const API_URL = "https://homeserve-uprh.onrender.com/api/invoices";

function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    payment_id: "",
    booking_id: "",
    customer_name: "",
    service_name: "",
    subtotal: "",
    discount: 0,
    tax: 0
  });

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(API_URL, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Invoice loading error:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const createInvoice = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...form,
          payment_id: Number(form.payment_id),
          subtotal: Number(form.subtotal),
          discount: Number(form.discount),
          tax: Number(form.tax)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Invoice generated successfully!");

        setShowForm(false);

        setForm({
          payment_id: "",
          booking_id: "",
          customer_name: "",
          service_name: "",
          subtotal: "",
          discount: 0,
          tax: 0
        });

        fetchInvoices();
      } else {
        alert(data.detail || "Unable to generate invoice");
      }
    } catch (error) {
      alert("Server connection failed");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API_URL}/${id}/status?status=${status}`,
        {
          method: "PUT",
          headers
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Invoice status updated");
        fetchInvoices();
      } else {
        alert(data.detail || "Status update failed");
      }
    } catch (error) {
      alert("Server connection failed");
    }
  };

  const deleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers
      });

      const data = await response.json();

      if (response.ok) {
        alert("Invoice deleted successfully");
        fetchInvoices();
      } else {
        alert(data.detail || "Delete failed");
      }
    } catch (error) {
      alert("Server connection failed");
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    `${invoice.invoice_number} ${invoice.customer_name} ${invoice.booking_id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalRevenue = invoices.reduce(
    (total, invoice) => total + Number(invoice.total_amount || 0),
    0
  );

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h2>Invoice Management</h2>
          <p>Generate and manage customer invoices</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          Generate Invoice
        </button>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <FileText size={25} />
          <h3>{invoices.length}</h3>
          <p>Total Invoices</p>
        </div>

        <div className="stat-card">
          <IndianRupee size={25} />
          <h3>₹{totalRevenue.toFixed(2)}</h3>
          <p>Total Invoice Amount</p>
        </div>
      </div>

      <div className="table-container">

        <div className="table-header">
          <h3>Invoice Records</h3>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Customer</th>
              <th>Booking ID</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              {user?.role === "Super Admin" && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.customer_name}</td>
                <td>{invoice.booking_id}</td>
                <td>{invoice.service_name}</td>
                <td>₹{Number(invoice.total_amount).toFixed(2)}</td>

                <td>
                  {user?.role === "Super Admin" ? (
                    <select
                      value={invoice.status}
                      onChange={(e) =>
                        updateStatus(invoice.id, e.target.value)
                      }
                    >
                      <option value="Generated">Generated</option>
                      <option value="Paid">Paid</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  ) : (
                    invoice.status
                  )}
                </td>

                <td>
                  {invoice.issued_at
                    ? new Date(invoice.issued_at).toLocaleDateString()
                    : "-"}
                </td>

                {user?.role === "Super Admin" && (
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteInvoice(invoice.id)}
                      title="Delete Invoice"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h3>Generate Invoice</h3>

              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createInvoice}>

              <input
                type="number"
                name="payment_id"
                placeholder="Payment ID"
                value={form.payment_id}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="booking_id"
                placeholder="Booking ID"
                value={form.booking_id}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="customer_name"
                placeholder="Customer Name"
                value={form.customer_name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="service_name"
                placeholder="Service Name"
                value={form.service_name}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                step="0.01"
                name="subtotal"
                placeholder="Service Charges"
                value={form.subtotal}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                step="0.01"
                name="discount"
                placeholder="Discount"
                value={form.discount}
                onChange={handleChange}
              />

              <input
                type="number"
                step="0.01"
                name="tax"
                placeholder="Tax"
                value={form.tax}
                onChange={handleChange}
              />

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Generate Invoice
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default InvoiceManagement;