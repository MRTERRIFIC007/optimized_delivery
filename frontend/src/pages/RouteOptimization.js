import React, { useState, useEffect } from "react";
import { getPendingOrders, optimizeRoute } from "../services/api";

const RouteOptimization = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [startLocation, setStartLocation] = useState(
    "Start Location (Postman)"
  );
  const [optimizing, setOptimizing] = useState(false);
  const [routeResult, setRouteResult] = useState(null);

  // Fetch pending orders on component mount
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
        setError("Failed to load pending orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  const handleOrderSelection = (orderId) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleOptimizeRoute = async () => {
    if (selectedOrders.length === 0) {
      setError("Please select at least one delivery to optimize.");
      return;
    }

    setOptimizing(true);
    setError(null);

    try {
      const result = await optimizeRoute({
        orders: selectedOrders,
        start_location: startLocation,
      });

      setRouteResult(result);
      // Scroll to results
      setTimeout(() => {
        document
          .getElementById("routeResult")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Route optimization error:", err);
      setError("Failed to optimize route. Please try again.");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Route Optimization</h1>

      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h4>
            <i className="bi bi-geo-alt me-2"></i>Optimize Delivery Route
          </h4>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading pending orders...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <div className="mb-4">
                <h5>Select Deliveries to Include</h5>
                <p className="text-muted">
                  Choose multiple deliveries to create an optimized route:
                </p>

                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                  {pendingOrders.length > 0 ? (
                    pendingOrders.map((order) => (
                      <div className="col" key={order.order_id}>
                        <div
                          className={`card h-100 ${
                            selectedOrders.includes(order.order_id)
                              ? "border-success"
                              : ""
                          }`}
                        >
                          <div className="card-body">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`order-${order.order_id}`}
                                checked={selectedOrders.includes(
                                  order.order_id
                                )}
                                onChange={() =>
                                  handleOrderSelection(order.order_id)
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`order-${order.order_id}`}
                              >
                                <strong>{order.name}</strong>
                              </label>
                            </div>
                            <p className="small mt-2 mb-0">
                              <i className="bi bi-geo-alt me-1"></i>{" "}
                              {order.area}
                            </p>
                            <p className="small mb-0">
                              <i className="bi bi-clock me-1"></i>{" "}
                              {order.time_window || "Any time"}
                            </p>
                            <p className="small mb-0">
                              <i className="bi bi-box-seam me-1"></i> Order #
                              {order.order_id}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        No pending orders available for route optimization.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h5>Starting Location</h5>
                <select
                  className="form-select"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                >
                  <option value="Start Location (Postman)">
                    Default Postman Location
                  </option>
                </select>
              </div>

              <button
                className="btn btn-success"
                onClick={handleOptimizeRoute}
                disabled={optimizing || selectedOrders.length === 0}
              >
                {optimizing ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-map me-2"></i>
                    Optimize Route
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Route Result Section */}
      {routeResult && (
        <div id="routeResult" className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h4>
              <i className="bi bi-map me-2"></i>Optimized Route
            </h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Route Summary</h5>
                  </div>
                  <div className="card-body">
                    <p>
                      <strong>
                        <i className="bi bi-signpost-2 me-2"></i>Total Distance:
                      </strong>
                      <span className="badge bg-secondary ms-2">
                        {routeResult.total_distance}
                      </span>
                    </p>
                    <p>
                      <strong>
                        <i className="bi bi-clock-history me-2"></i>Estimated
                        Duration:
                      </strong>
                      <span className="badge bg-secondary ms-2">
                        {routeResult.total_time}
                      </span>
                    </p>
                    <p>
                      <strong>
                        <i className="bi bi-geo me-2"></i>Stops:
                      </strong>
                      <span className="badge bg-primary ms-2">
                        {routeResult.stops_count}
                      </span>
                    </p>
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      {routeResult.summary || "Route optimized successfully."}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Route Details</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                      {routeResult.details &&
                        routeResult.details.map((leg, index) => (
                          <div key={index} className="list-group-item">
                            <p className="fw-bold mb-1">
                              Leg {index + 1}: {leg.from} → {leg.to}
                            </p>
                            <p className="mb-1 small">
                              <span className="badge bg-secondary me-2">
                                Distance: {leg.distance}
                              </span>
                              <span className="badge bg-secondary">
                                Duration: {leg.duration}
                              </span>
                              {leg.traffic_conditions && (
                                <span
                                  className={`badge ms-2 ${
                                    leg.traffic_conditions.includes("Heavy")
                                      ? "bg-danger"
                                      : leg.traffic_conditions.includes(
                                          "Moderate"
                                        )
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {leg.traffic_conditions}
                                </span>
                              )}
                            </p>
                            <p className="small mb-0 text-muted">{leg.notes}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Route Map</h5>
                  </div>
                  <div className="card-body">
                    <div className="map-container bg-light d-flex align-items-center justify-content-center">
                      <div className="text-center">
                        <i
                          className="bi bi-map text-primary"
                          style={{ fontSize: "3rem" }}
                        ></i>
                        <p className="mt-3">
                          Interactive map will be displayed here once the React
                          Leaflet component is implemented.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimization;
