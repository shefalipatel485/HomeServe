import React, { useState, useEffect } from "react";

import {
  Plus, Search, Pencil, Trash2, X,
  Wrench, Paintbrush, Zap, Wind,
  Sparkles, Bug, Hammer, Settings
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/services";

// Service icons
const getServiceIcon = (name) => {
  const icons = {
    "Home Cleaning": Sparkles,
    "Plumbing": Wrench,
    "Electrician": Zap,
    "AC Repair": Wind,
    "Painting": Paintbrush,
    "Pest Control": Bug,
    "Carpentry": Hammer,
    "Appliance Repair": Settings
  };

  return icons[name] || Wrench;
};

function Services() {

  const [services, setServices] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "Cleaning",
    price: "",
    description: "",
    duration: "2 Hours",
    status: "Active"
  });

  // JWT HEADERS
  const getAuthHeaders = () => {

    const token = localStorage.getItem("access_token");

    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

  };

  // GET ALL SERVICES
  const fetchServices = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Unable to fetch services");
      }

      const data = await response.json();

      setServices(data);

    } catch (error) {

      console.error(error);
      setError(error.message || "Unable to connect with backend.");

    } finally {

      setLoading(false);

    }

  };

  // Load services when page opens
  useEffect(() => {
    fetchServices();
  }, []);

  // Search and Category Filter
  const filteredServices = services.filter(service => {

    const matchSearch = service.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      category === "All" || service.category === category;

    return matchSearch && matchCategory;

  });

  // Handle Form Input
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  // ADD AND UPDATE SERVICE
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const serviceData = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        description: form.description,
        duration: form.duration,
        status: form.status
      };

      let response;

      if (editId) {

        // UPDATE SERVICE
        response = await fetch(`${API_URL}/${editId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(serviceData)
        });

      } else {

        // ADD SERVICE
        response = await fetch(API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(serviceData)
        });

      }

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Unable to save service");
      }

      await fetchServices();

      closeForm();

      alert(
        editId
          ? "Service updated successfully!"
          : "Service added successfully!"
      );

    } catch (error) {

      console.error(error);
      alert(error.message || "Something went wrong. Please check backend.");

    }

  };

  // EDIT SERVICE
  const handleEdit = (service) => {

    setEditId(service.id);

    setForm({
      name: service.name,
      category: service.category,
      price: service.price,
      description: service.description || "",
      duration: service.duration || "2 Hours",
      status: service.status || "Active"
    });

    setShowForm(true);

  };

  // DELETE SERVICE
  const handleDelete = async (id) => {

    if (window.confirm("Are you sure you want to delete this service?")) {

      try {

        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (!response.ok) {
          throw new Error("Unable to delete service");
        }

        await fetchServices();

        alert("Service deleted successfully!");

      } catch (error) {

        console.error(error);
        alert(error.message || "Unable to delete service.");

      }

    }

  };

  // CLOSE FORM
  const closeForm = () => {

    setShowForm(false);
    setEditId(null);

    setForm({
      name: "",
      category: "Cleaning",
      price: "",
      description: "",
      duration: "2 Hours",
      status: "Active"
    });

  };

  return (

    <div className="services-page">

      <div className="services-header">

        <div>
          <h1>Services Management</h1>
          <p>Manage all your home services here.</p>
        </div>

        <button
          className="add-service-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Add New Service
        </button>

      </div>

      {/* SERVICE STATISTICS */}

      <div className="service-stats">

        <div>
          <h3>{services.length}</h3>
          <p>Total Services</p>
        </div>

        <div>
          <h3>
            {services.filter(s => s.category === "Cleaning").length}
          </h3>
          <p>Cleaning Services</p>
        </div>

        <div>
          <h3>
            {services.filter(s => s.category === "Repair").length}
          </h3>
          <p>Repair Services</p>
        </div>

      </div>

      {/* SEARCH AND FILTER */}

      <div className="service-toolbar">

        <div className="service-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >

          <option value="All">All Categories</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Repair">Repair</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Home Improvement">Home Improvement</option>

        </select>

      </div>

      {/* LOADING */}

      {loading && (
        <p>Loading services...</p>
      )}

      {/* ERROR */}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {/* SERVICES GRID */}

      {!loading && !error && (

        <div className="services-grid">

          {filteredServices.map(service => {

            const Icon = getServiceIcon(service.name);

            return (

              <div className="service-card" key={service.id}>

                <div className="service-card-top">

                  <div className="service-icon">
                    <Icon size={25} />
                  </div>

                  <span className="service-category">
                    {service.category}
                  </span>

                </div>

                <h3>{service.name}</h3>

                <p>{service.description}</p>

                <div className="service-card-bottom">

                  <h3>
                    ₹{Number(service.price).toLocaleString("en-IN")}
                  </h3>

                  <div className="service-actions">

                    <button onClick={() => handleEdit(service)}>
                      <Pencil size={17} />
                    </button>

                    <button onClick={() => handleDelete(service.id)}>
                      <Trash2 size={17} />
                    </button>

                  </div>

                </div>

              </div>

            );

          })}

          {filteredServices.length === 0 && (
            <p className="no-services">
              No services found.
            </p>
          )}

        </div>

      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="service-modal-overlay">

          <div className="service-modal">

            <div className="modal-header">

              <h2>
                {editId ? "Edit Service" : "Add New Service"}
              </h2>

              <button onClick={closeForm}>
                <X size={22} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <label>Service Name</label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter service name"
                required
              />

              <label>Category</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >

                <option value="Cleaning">Cleaning</option>
                <option value="Repair">Repair</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Home Improvement">Home Improvement</option>

              </select>

              <label>Price (₹)</label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                min="1"
                required
              />

              <label>Duration</label>

              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="Example: 2 Hours"
              />

              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter service description"
                required
              />

              <label>Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >

                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>

              </select>

              <div className="modal-buttons">

                <button
                  type="button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button type="submit">
                  {editId ? "Update Service" : "Add Service"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

export default Services;