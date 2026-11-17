import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CalendarCheck,
  Clock,
  MapPin,
  Ban,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/bookings";
const PROVIDER_URL = "http://127.0.0.1:8000/api/providers";

const initialForm = {
  customer: "",
  service: "Home Cleaning",
  provider_id: "",
  date: "",
  time_slot: "",
  address: "",
  description: "",
  reference_image_url: "",
  amount: "",
  status: "Pending",
};

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const services = [
    "Home Cleaning",
    "Plumbing",
    "Electrician",
    "AC Repair",
    "Painting",
    "Pest Control",
    "Carpentry",
    "Appliance Repair",
  ];

  const timeSlots = [
    "09:00 AM",
    "11:00 AM",
    "01:00 PM",
    "03:00 PM",
    "05:00 PM",
  ];

  // JWT HEADERS
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // FETCH BOOKINGS
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      setBookings(data);

    } catch (error) {
      console.error(error);
      alert(error.message);

    } finally {
      setLoading(false);
    }
  };

  // FETCH APPROVED PROVIDERS
  const fetchProviders = async () => {
    try {
      const response = await fetch(PROVIDER_URL, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to fetch providers");
      }

      const data = await response.json();

      setProviders(
        data.filter(
          (provider) => provider.verification_status === "Approved"
        )
      );

    } catch (error) {
      console.error("Provider fetch error:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchProviders();
  }, []);

  // FORM CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // OPEN ADD MODAL
  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const handleEdit = (booking) => {
    setEditingId(booking.id);

    setFormData({
      customer: booking.customer || "",
      service: booking.service || "Home Cleaning",
      provider_id: booking.provider_id || "",
      date: booking.date || "",
      time_slot: booking.time_slot || "",
      address: booking.address || "",
      description: booking.description || "",
      reference_image_url: booking.reference_image_url || "",
      amount: booking.amount || "",
      status: booking.status || "Pending",
    });

    setShowModal(true);
  };

  // SAVE BOOKING
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      customer: formData.customer,
      service: formData.service,
      provider_id: formData.provider_id
        ? Number(formData.provider_id)
        : null,
      date: formData.date,
      time_slot: formData.time_slot || null,
      address: formData.address,
      description: formData.description,
      reference_image_url: formData.reference_image_url,
      amount: Number(formData.amount),
      status: formData.status,
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.detail || "Unable to save booking"
        );
      }

      alert(
        editingId
          ? "Booking updated successfully!"
          : "Booking created successfully!"
      );

      setShowModal(false);
      setEditingId(null);
      setFormData(initialForm);

      await fetchBookings();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // CANCEL BOOKING
  const handleCancel = async (booking) => {
    if (booking.status === "Cancelled") {
      alert("This booking is already cancelled.");
      return;
    }

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel ${booking.booking_code}?`
    );

    if (!confirmCancel) return;

    try {
      const response = await fetch(
        `${API_URL}/${booking.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: "Cancelled",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Unable to cancel booking");
      }

      alert("Booking cancelled successfully!");

      await fetchBookings();

    } catch (error) {
      alert(error.message);
    }
  };

  // DELETE BOOKING
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Unable to delete booking");
      }

      alert("Booking deleted successfully!");

      await fetchBookings();

    } catch (error) {
      alert(error.message);
    }
  };

  // SEARCH AND FILTER
  const filteredBookings = bookings.filter((booking) => {
    const searchText = search.toLowerCase();

    const searchMatch =
      (booking.customer || "").toLowerCase().includes(searchText) ||
      (booking.booking_code || "").toLowerCase().includes(searchText) ||
      (booking.service || "").toLowerCase().includes(searchText);

    const statusMatch =
      filterStatus === "All" || booking.status === filterStatus;

    return searchMatch && statusMatch;
  });

  // STATISTICS
  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (b) => b.status === "Pending"
  ).length;

  const confirmedBookings = bookings.filter(
    (b) => b.status === "Confirmed"
  ).length;

  const completedBookings = bookings.filter(
    (b) => b.status === "Completed"
  ).length;

  return (
    <div className="bookings-page">

      {/* HEADER */}
      <div className="bookings-header">
        <div>
          <h1>Bookings Management</h1>
          <p>Manage all your home service bookings</p>
        </div>

        <button className="add-booking-btn" onClick={handleAdd}>
          <Plus size={18} />
          Add Booking
        </button>
      </div>

      {/* STATISTICS */}
      <div className="booking-stats">

        <div className="stat-card">
          <CalendarCheck />
          <div>
            <h3>{totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <CalendarCheck />
          <div>
            <h3>{pendingBookings}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <CalendarCheck />
          <div>
            <h3>{confirmedBookings}</h3>
            <p>Confirmed</p>
          </div>
        </div>

        <div className="stat-card">
          <CalendarCheck />
          <div>
            <h3>{completedBookings}</h3>
            <p>Completed</p>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER */}
      <div className="booking-toolbar">

        <div className="booking-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search customer, service or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

      </div>

      {/* BOOKINGS TABLE */}
      <div className="booking-table-container">

        <table>

          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Provider</th>
              <th>Date & Time</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="8" className="no-data">
                  Loading bookings...
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No bookings found
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {

                const provider = providers.find(
                  (p) => p.id === booking.provider_id
                );

                return (
                  <tr key={booking.id}>

                    <td>{booking.booking_code}</td>

                    <td>{booking.customer}</td>

                    <td>{booking.service}</td>

                    <td>
                      {provider?.business_name || "Not Assigned"}
                    </td>

                    <td>
                      <div>
                        {booking.date}
                        <br />
                        <small>{booking.time_slot || "Not selected"}</small>
                      </div>
                    </td>

                    <td>
                      ₹{Number(booking.amount).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`status ${(booking.status || "").toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td>
                      <div className="booking-actions">

                        <button
                          onClick={() => handleEdit(booking)}
                          title="Edit / Reschedule"
                        >
                          <Pencil size={16} />
                        </button>

                        {booking.status !== "Cancelled" &&
                          booking.status !== "Completed" && (
                            <button
                              onClick={() => handleCancel(booking)}
                              title="Cancel Booking"
                            >
                              <Ban size={16} />
                            </button>
                          )}

                        <button
                          onClick={() => handleDelete(booking.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (

        <div className="service-modal-overlay">

          <div className="service-modal">

            <div className="modal-header">

              <h2>
                {editingId ? "Edit / Reschedule Booking" : "Add New Booking"}
              </h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                <X />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <label>Customer Name</label>

              <input
                type="text"
                name="customer"
                placeholder="Enter customer name"
                value={formData.customer}
                onChange={handleChange}
                required
              />

              <label>Service</label>

              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              >
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              <label>Service Provider</label>

              <select
                name="provider_id"
                value={formData.provider_id}
                onChange={handleChange}
              >
                <option value="">Select Provider</option>

                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.business_name}
                  </option>
                ))}
              </select>

              <label>Booking Date</label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />

              <label>Time Slot</label>

              <select
                name="time_slot"
                value={formData.time_slot}
                onChange={handleChange}
              >
                <option value="">Select Time Slot</option>

                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>

              <label>Service Address</label>

              <textarea
                name="address"
                placeholder="Enter complete service address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
              />

              <label>Booking Description</label>

              <textarea
                name="description"
                placeholder="Describe the service requirement"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />

              <label>Reference Image URL</label>

              <input
                type="url"
                name="reference_image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.reference_image_url}
                onChange={handleChange}
              />

              <label>Amount (₹)</label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                required
              />

              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <div className="modal-buttons">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>

                <button type="submit">
                  {editingId ? "Update Booking" : "Save Booking"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Bookings;