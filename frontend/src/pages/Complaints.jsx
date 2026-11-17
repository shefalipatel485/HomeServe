import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  X
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/complaints";

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    booking_id: "",
    subject: "",
    description: "",
    status: "Open",
    admin_response: ""
  };

  const [form, setForm] = useState(initialForm);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
  });

  const fetchComplaints = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load complaints");
      }

      setComplaints(data);
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = editingId
      ? {
          status: form.status,
          admin_response: form.admin_response
        }
      : {
          booking_id: form.booking_id
            ? Number(form.booking_id)
            : null,
          subject: form.subject,
          description: form.description
        };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Operation failed");
      }

      alert(editingId
        ? "Complaint updated successfully"
        : "Complaint submitted successfully"
      );

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      fetchComplaints();

    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (complaint) => {
    setEditingId(complaint.id);

    setForm({
      booking_id: complaint.booking_id || "",
      subject: complaint.subject,
      description: complaint.description,
      status: complaint.status,
      admin_response: complaint.admin_response || ""
    });

    setShowForm(true);
  };

  const filteredComplaints = complaints.filter((item) =>
    `${item.subject} ${item.description} ${item.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const isAdmin =
    JSON.parse(localStorage.getItem("user") || "{}").role === "Super Admin";

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h2>Complaint Management</h2>
          <p>Submit and manage customer complaints</p>
        </div>

        {!isAdmin && (
          <button
            className="primary-btn"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              setShowForm(true);
            }}
          >
            <Plus size={18} /> Submit Complaint
          </button>
        )}
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">

            <div className="modal-header">
              <h3>
                {editingId ? "Update Complaint" : "Submit Complaint"}
              </h3>

              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {!editingId && (
                <>
                  <div className="form-group">
                    <label>Booking ID (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.booking_id}
                      onChange={(e) =>
                        setForm({ ...form, booking_id: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              )}

              {editingId && isAdmin && (
                <>
                  <div className="form-group">
                    <label>Resolution Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Admin Response</label>
                    <textarea
                      value={form.admin_response}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          admin_response: e.target.value
                        })
                      }
                    />
                  </div>
                </>
              )}

              <button type="submit" className="primary-btn">
                {editingId ? "Update Complaint" : "Submit Complaint"}
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
              <th>Customer ID</th>
              <th>Booking ID</th>
              <th>Subject</th>
              <th>Description</th>
              <th>Status</th>
              <th>Admin Response</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {filteredComplaints.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.user_id}</td>
                <td>{item.booking_id || "-"}</td>
                <td>{item.subject}</td>
                <td>{item.description}</td>
                <td>{item.status}</td>
                <td>{item.admin_response || "-"}</td>

                {isAdmin && (
                  <td>
                    <button onClick={() => handleEdit(item)}>
                      <Pencil size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {filteredComplaints.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7}>
                  No complaints found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Complaints;