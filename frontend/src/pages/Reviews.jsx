import React, { useEffect, useState } from "react";
import { Plus, Search, Star, X } from "lucide-react";

const API_URL = "https://homeserve-uprh.onrender.com/api/reviews";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const initialForm = {
    provider_id: "",
    booking_id: "",
    rating: 5,
    comment: ""
  };

  const [form, setForm] = useState(initialForm);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
  });

  const fetchReviews = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load reviews");
      }

      setReviews(data);
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          provider_id: Number(form.provider_id),
          booking_id: Number(form.booking_id),
          rating: Number(form.rating),
          comment: form.comment
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to submit review");
      }

      alert("Review submitted successfully!");

      setShowForm(false);
      setForm(initialForm);
      fetchReviews();

    } catch (error) {
      alert(error.message);
    }
  };

  const filteredReviews = reviews.filter((review) =>
    `${review.provider_id} ${review.comment || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h2>Rating & Reviews</h2>
          <p>Manage customer ratings and provider reviews</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Add Review
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">

            <div className="modal-header">
              <h3>Add Review</h3>

              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Provider ID</label>
                <input
                  type="number"
                  min="1"
                  value={form.provider_id}
                  onChange={(e) =>
                    setForm({ ...form, provider_id: e.target.value })
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

              <div className="form-group">
                <label>Rating</label>
                <select
                  value={form.rating}
                  onChange={(e) =>
                    setForm({ ...form, rating: e.target.value })
                  }
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Average</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={form.comment}
                  onChange={(e) =>
                    setForm({ ...form, comment: e.target.value })
                  }
                  placeholder="Write your review..."
                />
              </div>

              <button type="submit" className="primary-btn">
                Submit Review
              </button>

            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Review ID</th>
              <th>Customer ID</th>
              <th>Provider ID</th>
              <th>Booking ID</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id}>
                <td>{review.id}</td>
                <td>{review.user_id}</td>
                <td>{review.provider_id}</td>
                <td>{review.booking_id}</td>
                <td>
                  <Star size={15} fill="currentColor" />
                  {review.rating}/5
                </td>
                <td>{review.comment || "-"}</td>
                <td>
                  {review.created_at
                    ? new Date(review.created_at).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}

            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan="7">No reviews found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Reviews;