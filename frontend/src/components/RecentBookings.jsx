import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

const API_URL = "https://homeserve-uprh.onrender.com/api/bookings";

function RecentBookings() {

  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  // FETCH BOOKINGS FROM DATABASE WITH JWT
  const fetchBookings = async () => {

    try {

      setLoading(true);

      const token = localStorage.getItem("access_token");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Unable to fetch bookings");
      }

      const data = await response.json();

      setBookings(data);

    } catch (error) {

      console.error("Recent Bookings Error:", error);
      alert("Unable to load recent bookings.");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // SEARCH AND FILTER
  const filteredBookings = bookings
    .filter((booking) => {

      const bookingId = booking.booking_code || "";
      const customerName = booking.customer || "";

      const matchesSearch =
        customerName.toLowerCase().includes(search.toLowerCase()) ||
        bookingId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "All" || booking.status === status;

      return matchesSearch && matchesStatus;

    })
    .slice(0, 5);

  // DATE FORMAT
  const formatDate = (date) => {

    if (!date) return "";

    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  };

  return (

    <div className="recent-bookings">

      <div className="booking-header">

        <div>
          <h2>Recent Bookings</h2>
          <p>Manage your latest customer bookings</p>
        </div>

        <div className="booking-actions">

          <div className="booking-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

        </div>

      </div>

      {/* BOOKINGS TABLE */}

      <div className="table-container">

        <table>

          <thead>

            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="6" className="no-data">
                  Loading bookings...
                </td>
              </tr>

            ) : filteredBookings.length > 0 ? (

              filteredBookings.map((booking) => (

                <tr key={booking.id}>

                  <td>{booking.booking_code}</td>

                  <td>{booking.customer}</td>

                  <td>{booking.service}</td>

                  <td>{formatDate(booking.date)}</td>

                  <td>
                    ₹{Number(booking.amount).toLocaleString("en-IN")}
                  </td>

                  <td>

                    <span
                      className={`status ${booking.status.toLowerCase()}`}
                    >
                      {booking.status}
                    </span>

                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="6" className="no-data">
                  No bookings found
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default RecentBookings;