import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RealTimeConditions from "../components/RealTimeConditions";
import { getPendingOrders } from "../services/api";

const Dashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pending orders for today
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        const data = await getPendingOrders(today);
        setPendingOrders(data);
      } catch (err) {
        console.error("Error fetching pending orders:", err);
        setError("Failed to load pending orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Delivery Prediction System</h1>

      {/* Real-time Conditions Dashboard */}
      <RealTimeConditions />

      {/* Pending Orders Section */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h4>
            <i className="bi bi-box-seam me-2"></i>Today's Pending Orders
          </h4>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading pending orders...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : pendingOrders.length === 0 ? (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No pending orders for today.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Area</th>
                    <th>Time Window</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td>{order.name}</td>
                      <td>{order.area}</td>
                      <td>{order.time_window || "Any time"}</td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === "Pending"
                              ? "bg-warning"
                              : order.status === "Out for Delivery"
                              ? "bg-info"
                              : order.status === "Delayed"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/predict?name=${order.name}&day=${order.delivery_day}`}
                          className="btn btn-sm btn-outline-primary me-1"
                        >
                          <i className="bi bi-graph-up me-1"></i> Predict
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="card mb-4">
        <div className="card-header bg-secondary text-white">
          <h4>
            <i className="bi bi-lightning-charge me-2"></i>Quick Actions
          </h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i
                    className="bi bi-graph-up text-primary"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <h5 className="mt-3">Predict Delivery</h5>
                  <p className="text-muted">
                    Find the optimal delivery time for a customer
                  </p>
                  <Link to="/predict" className="btn btn-primary">
                    Make Prediction
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i
                    className="bi bi-geo-alt text-success"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <h5 className="mt-3">Optimize Route</h5>
                  <p className="text-muted">
                    Find the most efficient delivery route
                  </p>
                  <Link to="/optimize" className="btn btn-success">
                    Plan Route
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i
                    className="bi bi-chat-dots text-info"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <h5 className="mt-3">AI Assistant</h5>
                  <p className="text-muted">
                    Get help and insights from our AI assistant
                  </p>
                  <Link to="/chat" className="btn btn-info text-white">
                    Ask Assistant
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
