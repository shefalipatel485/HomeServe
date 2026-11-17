import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Search
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/notifications";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
  });

  const fetchNotifications = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load notifications");
      }

      setNotifications(data);

      // Notify Navbar to refresh unread count
      window.dispatchEvent(
        new Event("notificationsUpdated")
      );

    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/read`, {
        method: "PUT",
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to update notification");
      }

      await fetchNotifications();

      window.dispatchEvent(
        new Event("notificationsUpdated")
      );

    } catch (error) {
      alert(error.message);
    }
  };

  const filteredNotifications = notifications.filter((item) =>
    `${item.title} ${item.message} ${item.notification_type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const unreadCount = notifications.filter(
    (item) => item.is_read === "Unread"
  ).length;

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>View your latest updates and notifications</p>
        </div>

        <div>
          <Bell size={24} />
          <span>{unreadCount} Unread</span>
        </div>
      </div>

      <div className="search-box">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Type</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredNotifications.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.message}</td>
                <td>{item.notification_type}</td>

                <td>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "-"}
                </td>

                <td>{item.is_read}</td>

                <td>
                  {item.is_read === "Unread" && (
                    <button
                      title="Mark as Read"
                      onClick={() => markAsRead(item.id)}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {filteredNotifications.length === 0 && (
              <tr>
                <td colSpan="6">No notifications found</td>
              </tr>
            )}
          </tbody>
        </table>

      </div>

    </div>
  );
}

export default Notifications;