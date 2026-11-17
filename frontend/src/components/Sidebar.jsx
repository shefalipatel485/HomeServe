import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarCheck,
  Users,
  CreditCard,
  FileText,
  Wrench,
  ClipboardList,
  Bell,
  Star,
  MessageSquareWarning,
  Percent,
  Wallet,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-menu">

        <h4>MENU</h4>

        <NavLink to="/" end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/services">
          <BriefcaseBusiness size={20} />
          <span>Services</span>
        </NavLink>

        <NavLink to="/bookings">
          <CalendarCheck size={20} />
          <span>Bookings</span>
        </NavLink>

        <NavLink to="/customers">
          <Users size={20} />
          <span>Customers</span>
        </NavLink>

        <NavLink to="/payments">
          <CreditCard size={20} />
          <span>Payments</span>
        </NavLink>

        <NavLink to="/invoices">
          <FileText size={20} />
          <span>Invoices</span>
        </NavLink>

        <NavLink to="/commission">
          <Percent size={20} />
          <span>Commission Management</span>
        </NavLink>

        <NavLink to="/provider-earnings">
          <Wallet size={20} />
          <span>Provider Earnings</span>
        </NavLink>

        <NavLink to="/technicians">
          <Wrench size={20} />
          <span>Technicians</span>
        </NavLink>

        <NavLink to="/technician-jobs">
          <ClipboardList size={20} />
          <span>Technician Jobs</span>
        </NavLink>

        <NavLink to="/notifications">
          <Bell size={20} />
          <span>Notifications</span>
        </NavLink>

        <NavLink to="/reviews">
          <Star size={20} />
          <span>Reviews & Ratings</span>
        </NavLink>

        <NavLink to="/complaints">
          <MessageSquareWarning size={20} />
          <span>Complaints</span>
        </NavLink>

        <h4>OTHER</h4>

        <a href="#settings">
          <Settings size={20} />
          <span>Settings</span>
        </a>

        <a href="#help">
          <HelpCircle size={20} />
          <span>Help & Support</span>
        </a>

        <a href="#logout">
          <LogOut size={20} />
          <span>Logout</span>
        </a>

      </div>
    </div>
  );
}

export default Sidebar;