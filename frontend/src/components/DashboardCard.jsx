import React from "react";

function DashboardCard({ title, value, icon, color, change }) {
  return (
    <div className="dashboard-card">

      <div className="card-info">
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{change}</span>
      </div>

      <div
        className="card-icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

    </div>
  );
}

export default DashboardCard;