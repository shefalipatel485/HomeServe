
import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  CreditCard,
  CheckCircle,
  Clock
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/payments";

// JWT AUTH HEADERS
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
};

function Payments() {

  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customer: "",
    bookingId: "",
    date: "",
    amount: "",
    method: "UPI",
    status: "Pending"
  });

  // FETCH PAYMENTS
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Unable to fetch payments");
      }

      const data = await response.json();

      setPayments(data);

    } catch (error) {
      console.error("Fetch Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // STATISTICS
  const totalRevenue = payments
    .filter((p) => p.status === "Completed")
    .reduce((total, p) => total + Number(p.amount), 0);

  const completedPayments = payments.filter(
    (p) => p.status === "Completed"
  ).length;

  const pendingPayments = payments.filter(
    (p) => p.status === "Pending"
  ).length;

  // SEARCH AND FILTER
  const filteredPayments = payments.filter((payment) => {

    const searchMatch =
      payment.payment_code.toLowerCase().includes(search.toLowerCase()) ||
      payment.customer.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      filter === "All" || payment.status === filter;

    return searchMatch && statusMatch;
  });

  // FORM CHANGE
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ADD / UPDATE PAYMENT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentData = {
      customer: form.customer,
      booking_id: form.bookingId,
      date: form.date,
      amount: Number(form.amount),
      method: form.method,
      status: form.status
    };

    try {

      let response;

      if (editId) {

        response = await fetch(`${API_URL}/${editId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(paymentData)
        });

      } else {

        response = await fetch(API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(paymentData)
        });

      }

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Payment operation failed");
      }

      alert(
        editId
          ? "Payment updated successfully!"
          : "Payment added successfully!"
      );

      closeForm();
      fetchPayments();

    } catch (error) {
      console.error("Save Error:", error);
      alert(error.message);
    }
  };

  // EDIT PAYMENT
  const handleEdit = (payment) => {

    setForm({
      customer: payment.customer,
      bookingId: payment.booking_id,
      date: payment.date,
      amount: payment.amount,
      method: payment.method,
      status: payment.status
    });

    setEditId(payment.id);
    setShowForm(true);
  };

  // DELETE PAYMENT
  const handleDelete = async (id) => {

    if (window.confirm("Are you sure you want to delete this payment?")) {

      try {

        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (!response.ok) {
          throw new Error("Unable to delete payment");
        }

        alert("Payment deleted successfully!");

        fetchPayments();

      } catch (error) {
        console.error("Delete Error:", error);
        alert(error.message);
      }

    }
  };

  // CLOSE FORM
  const closeForm = () => {

    setShowForm(false);
    setEditId(null);

    setForm({
      customer: "",
      bookingId: "",
      date: "",
      amount: "",
      method: "UPI",
      status: "Pending"
    });

  };

  return (

    <div className="payments-page">

      <div className="payments-header">

        <div>
          <h1>Payments Management</h1>
          <p>Manage and track all customer payments.</p>
        </div>

        <button
          className="payment-add-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          Add Payment
        </button>

      </div>


      {/* STATISTICS */}

      <div className="payment-stats">

        <div className="payment-stat-card">
          <IndianRupee size={28} />
          <div>
            <p>Total Revenue</p>
            <h2>₹{totalRevenue.toLocaleString("en-IN")}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <CheckCircle size={28} />
          <div>
            <p>Completed Payments</p>
            <h2>{completedPayments}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <Clock size={28} />
          <div>
            <p>Pending Payments</p>
            <h2>{pendingPayments}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <CreditCard size={28} />
          <div>
            <p>Total Transactions</p>
            <h2>{payments.length}</h2>
          </div>
        </div>

      </div>


      {/* SEARCH AND FILTER */}

      <div className="payment-toolbar">

        <div className="payment-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search payment or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Payments</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

      </div>


      {/* PAYMENTS TABLE */}

      <div className="payment-table-container">

        <table className="payment-table">

          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Customer</th>
              <th>Booking ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="8" className="payment-empty">
                  Loading payments...
                </td>
              </tr>

            ) : (

              filteredPayments.map((payment) => (

                <tr key={payment.id}>

                  <td>{payment.payment_code}</td>

                  <td>{payment.customer}</td>

                  <td>{payment.booking_id}</td>

                  <td>{payment.date}</td>

                  <td className="payment-amount">
                    ₹{Number(payment.amount).toLocaleString("en-IN")}
                  </td>

                  <td>{payment.method}</td>

                  <td>
                    <span
                      className={`payment-status ${payment.status.toLowerCase()}`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td>

                    <div className="payment-actions">

                      <button
                        className="payment-edit-btn"
                        onClick={() => handleEdit(payment)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="payment-delete-btn"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

            {!loading && filteredPayments.length === 0 && (

              <tr>
                <td colSpan="8" className="payment-empty">
                  No payments found.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>


      {/* ADD / EDIT PAYMENT MODAL */}

      {showForm && (

        <div className="payment-modal-overlay">

          <div className="payment-modal">

            <div className="payment-modal-header">

              <h2>
                {editId ? "Edit Payment" : "Add New Payment"}
              </h2>

              <button onClick={closeForm}>
                <X size={22} />
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <label>Customer Name</label>

              <input
                type="text"
                name="customer"
                placeholder="Enter customer name"
                value={form.customer}
                onChange={handleChange}
                required
              />


              <label>Booking ID</label>

              <input
                type="text"
                name="bookingId"
                placeholder="Enter booking ID"
                value={form.bookingId}
                onChange={handleChange}
                required
              />


              <label>Payment Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />


              <label>Amount (₹)</label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                min="1"
                required
              />


              <label>Payment Method</label>

              <select
                name="method"
                value={form.method}
                onChange={handleChange}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>


              <label>Payment Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>


              <div className="payment-form-buttons">

                <button
                  type="button"
                  className="payment-cancel-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="payment-save-btn"
                >
                  {editId ? "Update Payment" : "Save Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

export default Payments;