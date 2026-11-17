import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Wrench
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/technicians";

function TechnicianManagement() {
  const [technicians, setTechnicians] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    user_id: "",
    provider_id: "",
    skills: "",
    experience: 0,
    availability: "Available",
    status: "Active"
  };

  const [form, setForm] = useState(initialForm);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
  });

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      if (!response.ok) throw new Error("Failed to load technicians");

      const data = await response.json();
      setTechnicians(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load technicians");
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      user_id: Number(form.user_id),
      provider_id: form.provider_id
        ? Number(form.provider_id)
        : null,
      skills: form.skills,
      experience: Number(form.experience),
      availability: form.availability,
      status: form.status
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(
            editingId
              ? {
                  provider_id: payload.provider_id,
                  skills: payload.skills,
                  experience: payload.experience,
                  availability: payload.availability,
                  status: payload.status
                }
              : payload
          )
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Operation failed");
      }

      alert(editingId
        ? "Technician updated successfully"
        : "Technician added successfully"
      );

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      fetchTechnicians();

    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (technician) => {
    setEditingId(technician.id);

    setForm({
      user_id: technician.user_id,
      provider_id: technician.provider_id || "",
      skills: technician.skills || "",
      experience: technician.experience || 0,
      availability: technician.availability,
      status: technician.status
    });

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this technician?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Delete failed");
      }

      alert("Technician deleted successfully");
      fetchTechnicians();

    } catch (error) {
      alert(error.message);
    }
  };

  const filteredTechnicians = technicians.filter((technician) =>
    `${technician.user_id} ${technician.skills || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h2>Technician Management</h2>
          <p>Manage technicians and their availability</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            setEditingId(null);
            setForm(initialForm);
            setShowForm(true);
          }}
        >
          <Plus size={18} /> Add Technician
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search technician..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">

            <div className="modal-header">
              <h3>
                {editingId ? "Edit Technician" : "Add Technician"}
              </h3>

              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {!editingId && (
                <div className="form-group">
                  <label>Technician User ID</label>
                  <input
                    type="number"
                    value={form.user_id}
                    onChange={(e) =>
                      setForm({ ...form, user_id: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Provider ID</label>
                <input
                  type="number"
                  value={form.provider_id}
                  onChange={(e) =>
                    setForm({ ...form, provider_id: e.target.value })
                  }
                  placeholder="Enter Provider ID"
                />
              </div>

              <div className="form-group">
                <label>Skills</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) =>
                    setForm({ ...form, skills: e.target.value })
                  }
                  placeholder="Plumbing, Electrical, Cleaning..."
                />
              </div>

              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) =>
                    setForm({ ...form, availability: e.target.value })
                  }
                >
                  <option>Available</option>
                  <option>Busy</option>
                  <option>Unavailable</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <button type="submit" className="primary-btn">
                {editingId ? "Update Technician" : "Save Technician"}
              </button>

            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Provider ID</th>
              <th>Skills</th>
              <th>Experience</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredTechnicians.map((technician) => (
              <tr key={technician.id}>
                <td>{technician.id}</td>
                <td>{technician.user_id}</td>
                <td>{technician.provider_id || "-"}</td>
                <td>{technician.skills || "-"}</td>
                <td>{technician.experience} Years</td>
                <td>{technician.availability}</td>
                <td>{technician.status}</td>

                <td>
                  <button onClick={() => handleEdit(technician)}>
                    <Pencil size={16} />
                  </button>

                  <button onClick={() => handleDelete(technician.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredTechnicians.length === 0 && (
              <tr>
                <td colSpan="8">No technicians found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default TechnicianManagement;