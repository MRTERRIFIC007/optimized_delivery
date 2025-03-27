import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { getPrediction } from "../services/api";

const PredictionForm = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [formData, setFormData] = useState({
    name: queryParams.get("name") || "",
    day: queryParams.get("day") || "",
    time: "",
  });

  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await getPrediction(formData);
      setPredictions(result);
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Failed to get prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Days of the week for the dropdown
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Time slots for the dropdown
  const timeSlots = ["Morning", "Afternoon", "Evening"];

  return (
    <div>
      <h1 className="mb-4">Delivery Time Prediction</h1>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h4>
                <i className="bi bi-graph-up me-2"></i>Predict Optimal Delivery
                Time
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <div className="form-text">Enter the customer's name.</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="day" className="form-label">
                    Day of Delivery
                  </label>
                  <select
                    className="form-select"
                    id="day"
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="time" className="form-label">
                    Time of Day (Optional)
                  </label>
                  <select
                    className="form-select"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                  >
                    <option value="">All Times</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Leave blank to see all time predictions.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Predicting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lightning-charge me-2"></i>
                      Get Prediction
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {predictions && (
            <div className="card mb-4 prediction-result">
              <div className="card-header bg-success text-white">
                <h4>
                  <i className="bi bi-check-circle me-2"></i>Prediction Results
                </h4>
              </div>
              <div className="card-body">
                <h5>Optimal Delivery Times for {predictions.name}</h5>

                {predictions.optimal_times &&
                predictions.optimal_times.length > 0 ? (
                  <div className="mt-3">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Time Slot</th>
                          <th>Success Rate</th>
                          <th>Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.optimal_times.map((prediction, index) => (
                          <tr
                            key={index}
                            className={index === 0 ? "table-success" : ""}
                          >
                            <td>
                              <strong>{prediction.time}</strong>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="progress flex-grow-1 me-2"
                                  style={{ height: "10px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      prediction.success_rate >= 80
                                        ? "bg-success"
                                        : prediction.success_rate >= 60
                                        ? "bg-info"
                                        : prediction.success_rate >= 40
                                        ? "bg-warning"
                                        : "bg-danger"
                                    }`}
                                    role="progressbar"
                                    style={{
                                      width: `${prediction.success_rate}%`,
                                    }}
                                    aria-valuenow={prediction.success_rate}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <span>{prediction.success_rate}%</span>
                              </div>
                            </td>
                            <td>
                              {index === 0 && (
                                <span className="badge bg-success">
                                  Best Option
                                </span>
                              )}
                              {prediction.notes && (
                                <p className="small text-muted mb-0 mt-1">
                                  {prediction.notes}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    No predictions available for the selected parameters.
                  </div>
                )}

                {predictions.factors && (
                  <div className="mt-4">
                    <h6>Factors Affecting Delivery:</h6>
                    <ul className="list-group">
                      {predictions.factors.map((factor, index) => (
                        <li key={index} className="list-group-item">
                          <i
                            className={`bi bi-${
                              factor.type === "positive"
                                ? "arrow-up-circle text-success"
                                : factor.type === "negative"
                                ? "arrow-down-circle text-danger"
                                : "dash-circle text-warning"
                            } me-2`}
                          ></i>
                          {factor.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;
