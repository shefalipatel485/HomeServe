import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/customers";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  status: "Active",
};

function Customers() {

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  // JWT HEADERS
  const getAuthHeaders = () => {

    const token = localStorage.getItem("access_token");

    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

  };

  // FETCH CUSTOMERS
  const fetchCustomers = async () => {

    try {

      setLoading(true);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();

      setCustomers(data);

    } catch (error) {

      console.error("Fetch Error:", error);
      alert(error.message);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

  };

  // OPEN ADD MODAL
  const handleAdd = () => {

    setEditingId(null);
    setFormData(initialForm);
    setShowModal(true);

  };

  // OPEN EDIT MODAL
  const handleEdit = (customer) => {

    setEditingId(customer.id);

    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      status: customer.status,
    });

    setShowModal(true);

  };

  // ADD / UPDATE CUSTOMER
  const handleSubmit = async (e) => {

    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      status: formData.status,
    };

    try {

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Unable to save customer"
        );

      }

      alert(
        editingId
          ? "Customer updated successfully!"
          : "Customer added successfully!"
      );

      setShowModal(false);
      setFormData(initialForm);
      setEditingId(null);

      await fetchCustomers();

    } catch (error) {

      console.error("Save Error:", error);
      alert(error.message);

    }

  };

  // DELETE CUSTOMER
  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmDelete) return;

    try {

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      const result = await response.json();

      if (!response.ok) {

        throw new Error(
          result.detail || "Unable to delete customer"
        );

      }

      alert("Customer deleted successfully!");

      await fetchCustomers();

    } catch (error) {

      console.error("Delete Error:", error);
      alert(error.message);

    }

  };

  // SEARCH AND FILTER
  const filteredCustomers = customers.filter((customer) => {

    const searchMatch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search);

    const statusMatch =
      filterStatus === "All" ||
      customer.status === filterStatus;

    return searchMatch && statusMatch;

  });

  // STATISTICS
  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.status === "Inactive"
  ).length;

  return (

    <div className="customers-page">

      {/* HEADER */}
      <div className="customers-header">

        <div>
          <h1>Customers Management</h1>
          <p>Manage your customers and their information</p>
        </div>

        <button className="add-customer-btn" onClick={handleAdd}>
          <Plus size={18} />
          Add Customer
        </button>

      </div>

      {/* STATISTICS */}
      <div className="customer-stats">

        <div className="stat-card">
          <Users size={25} />
          <div>
            <h3>{totalCustomers}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <Users size={25} />
          <div>
            <h3>{activeCustomers}</h3>
            <p>Active Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <Users size={25} />
          <div>
            <h3>{inactiveCustomers}</h3>
            <p>Inactive Customers</p>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER */}
      <div className="customer-toolbar">

        <div className="customer-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

      </div>

      {/* CUSTOMER TABLE */}
      <div className="customer-table-container">

        <table>

          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="7" className="no-data">
                  Loading customers...
                </td>
              </tr>

            ) : filteredCustomers.length === 0 ? (

              <tr>
                <td colSpan="7" className="no-data">
                  No customers found
                </td>
              </tr>

            ) : (

              filteredCustomers.map((customer) => (

                <tr key={customer.id}>

                  <td>#{customer.id}</td>

                  <td>{customer.name}</td>

                  <td>{customer.email}</td>

                  <td>{customer.phone}</td>

                  <td>{customer.city}</td>

                  <td>
                    <span
                      className={`status ${customer.status.toLowerCase()}`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td>
                    <div className="customer-actions">

                      <button
                        onClick={() => handleEdit(customer)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(customer.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </td>

                </tr>

              ))

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
                {editingId ? "Edit Customer" : "Add New Customer"}
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
                name="name"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <label>City</label>

              <input
                type="text"
                name="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
                required
              />

              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="modal-buttons">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit">
                  {editingId ? "Update Customer" : "Save Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

export default Customers;