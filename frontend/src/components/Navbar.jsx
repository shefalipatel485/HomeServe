import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  UserCircle,
  LogOut
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const API_URL = "https://homeserve-uprh.onrender.com/api/notifications";

function Navbar() {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [unreadCount, setUnreadCount] = useState(0);

  // FETCH NOTIFICATIONS
  const fetchNotifications = async () => {

    const token = localStorage.getItem("access_token");

    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();

      const unread = data.filter(
        notification => notification.is_read === "Unread"
      );

      setUnreadCount(unread.length);

    } catch (error) {

      console.error("Notification Error:", error);

    }
  };

  // LOAD NOTIFICATIONS AND LISTEN FOR UPDATES
  useEffect(() => {

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      30000
    );

    // Instant refresh when notification is updated
    window.addEventListener(
      "notificationsUpdated",
      fetchNotifications
    );

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        "notificationsUpdated",
        fetchNotifications
      );
    };

  }, []);

  // LOGOUT
  const handleLogout = () => {

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });

  };

  // OPEN NOTIFICATIONS
  const handleNotificationClick = () => {

    navigate("/notifications");

  };

  return (

    <nav className="navbar">

      <div className="nav-left">
        <h2>HomeServe</h2>
      </div>

      <div className="nav-search">

        <Search size={18} />

        <input
          type="text"
          placeholder="Search here..."
        />

      </div>

      <div className="nav-right">

        {/* NOTIFICATION BELL */}

        <button
          onClick={handleNotificationClick}
          title="Notifications"
          style={{
            position: "relative",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "8px"
          }}
        >

          <Bell size={22} />

          {unreadCount > 0 && (

            <span
              style={{
                position: "absolute",
                top: "0px",
                right: "0px",
                background: "#dc2626",
                color: "white",
                borderRadius: "50%",
                minWidth: "18px",
                height: "18px",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                padding: "0 3px"
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>

          )}

        </button>

        {/* USER PROFILE */}

        <div className="profile">

          <UserCircle size={30} />

          <div>

            <span>
              {user?.full_name || "Admin"}
            </span>

            <small
              style={{
                display: "block",
                color: "#888"
              }}
            >
              {user?.role || "Administrator"}
            </small>

          </div>

        </div>

        {/* LOGOUT */}

        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 14px",
            background: "#fee2e2",
            color: "#dc2626",
            border: "none",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >

          <LogOut size={17} />

          Logout

        </button>

      </div>

    </nav>

  );

}

export default Navbar;