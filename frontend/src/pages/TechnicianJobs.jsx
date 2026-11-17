import React, { useEffect, useState } from "react";
import { Plus, Search, X, Pencil } from "lucide-react";

const API_BASE = "https://homeserve-uprh.onrender.com/api";

function TechnicianJobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    technician_id: "",
    booking_id: "",
    job_status: "Assigned",
    arrival_status: "Not Arrived",
    remarks: "",
    completion_image_url: ""
  };

  const [form, setForm] = useState(initialForm);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/technician-jobs`, {
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load jobs");
      }

      setJobs(data);
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = editingId
      ? {
          job_status: form.job_status,
          arrival_status: form.arrival_status,
          remarks: form.remarks,
          completion_image_url: form.completion_image_url
        }
      : {
          technician_id: Number(form.technician_id),
          booking_id: Number(form.booking_id)
        };

    try {
      const response = await fetch(
        editingId
          ? `${API_BASE}/technician-jobs/${editingId}`
          : `${API_BASE}/technician-jobs`,
        {
          method: editingId ? "PUT" : "POST",
          headers,
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Operation failed");
      }

      alert(editingId ? "Job updated successfully" : "Job assigned successfully");

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      fetchJobs();

    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (job) => {
    setEditingId(job.id);

    setForm({
      technician_id: job.technician_id,
      booking_id: job.booking_id,
      job_status: job.job_status,
      arrival_status: job.arrival_status,
      remarks: job.remarks || "",
      completion_image_url: job.completion_image_url || ""
    });

    setShowForm(true);
  };

  const filteredJobs = jobs.filter((job) =>
    `${job.id} ${job.technician_id} ${job.booking_id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h2>Technician Job Assignment</h2>
          <p>Assign bookings and track technician jobs</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            setEditingId(null);
            setForm(initialForm);
            setShowForm(true);
          }}
        >
          <Plus size={18} /> Assign Job
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by job, technician or booking ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">

            <div className="modal-header">
              <h3>{editingId ? "Update Job" : "Assign New Job"}</h3>

              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {!editingId && (
                <>
                  <div className="form-group">
                    <label>Technician ID</label>
                    <input
                      type="number"
                      min="1"
                      value={form.technician_id}
                      onChange={(e) =>
                        setForm({ ...form, technician_id: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Booking ID</label>
                    <input
                      type="number"
                      min="1"
                      value={form.booking_id}
                      onChange={(e) =>
                        setForm({ ...form, booking_id: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              )}

              {editingId && (
                <>
                  <div className="form-group">
                    <label>Job Status</label>
                    <select
                      value={form.job_status}
                      onChange={(e) =>
                        setForm({ ...form, job_status: e.target.value })
                      }
                    >
                      <option>Assigned</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Arrival Status</label>
                    <select
                      value={form.arrival_status}
                      onChange={(e) =>
                        setForm({ ...form, arrival_status: e.target.value })
                      }
                    >
                      <option>Not Arrived</option>
                      <option>Arrived</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Remarks</label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Completion Image URL</label>
                    <input
                      type="text"
                      value={form.completion_image_url}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          completion_image_url: e.target.value
                        })
                      }
                    />
                  </div>
                </>
              )}

              <button type="submit" className="primary-btn">
                {editingId ? "Update Job" : "Assign Job"}
              </button>

            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Technician ID</th>
              <th>Booking ID</th>
              <th>Job Status</th>
              <th>Arrival Status</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredJobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.technician_id}</td>
                <td>{job.booking_id}</td>
                <td>{job.job_status}</td>
                <td>{job.arrival_status}</td>
                <td>{job.remarks || "-"}</td>
                <td>
                  <button onClick={() => handleEdit(job)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan="7">No jobs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default TechnicianJobs;