import React, { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import CreateOrder from "./CreateOrder";

const PendingOrders: React.FC = () => {
  const {
    pendingOrders,
    fetchPendingOrders,
    optimizeRoute,
    updateOrderStatus,
  } = useStore();
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const handleOptimizeRoute = async () => {
    if (selectedOrders.length === 0) {
      setError("Please select at least one order to optimize route");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await optimizeRoute(selectedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize route");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    status: "Delivered" | "Failed"
  ) => {
    try {
      await updateOrderStatus(orderId, status);
      await fetchPendingOrders(); // Refresh the list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <div className="pending-orders">
      <div className="header">
        <h2>Pending Orders</h2>
        <div className="actions">
          <button
            className="create-order-btn"
            onClick={() => setShowCreateOrder(true)}
          >
            Create New Order
          </button>
          <button
            className="optimize-route-btn"
            onClick={handleOptimizeRoute}
            disabled={loading || selectedOrders.length === 0}
          >
            {loading ? "Optimizing..." : "Optimize Route"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="orders-list">
        {pendingOrders.map((order) => (
          <div
            key={order.order_id}
            className={`order-card ${
              selectedOrders.includes(order.order_id) ? "selected" : ""
            }`}
          >
            <div className="order-header">
              <input
                type="checkbox"
                checked={selectedOrders.includes(order.order_id)}
                onChange={() => toggleOrderSelection(order.order_id)}
              />
              <h3>Order #{order.order_id}</h3>
            </div>
            <div className="order-details">
              <p>
                <strong>Customer:</strong> {order.name}
              </p>
              <p>
                <strong>Area:</strong> {order.area}
              </p>
              <p>
                <strong>Address:</strong> {order.address}
              </p>
              <p>
                <strong>Package Size:</strong> {order.package_size}
              </p>
              <p>
                <strong>Delivery Day:</strong> {order.delivery_day}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
            </div>
            <div className="order-actions">
              <button
                className="delivered-btn"
                onClick={() => handleStatusUpdate(order.order_id, "Delivered")}
              >
                Mark as Delivered
              </button>
              <button
                className="failed-btn"
                onClick={() => handleStatusUpdate(order.order_id, "Failed")}
              >
                Mark as Failed
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateOrder && (
        <CreateOrder onClose={() => setShowCreateOrder(false)} />
      )}
    </div>
  );
};

export default PendingOrders;
