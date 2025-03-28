import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import {
  customerMap,
  getCustomerAreaAndAddress,
} from "../../utils/customerData";

interface CreateOrderProps {
  onClose: () => void;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ onClose }) => {
  const { addOrder, fetchPendingOrders } = useStore();
  const [formData, setFormData] = useState({
    name: "",
    delivery_day: "",
    area: "",
    address: "",
    package_size: "Small" as "Small" | "Medium" | "Large",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await addOrder(formData);
      if (result) {
        // Refresh pending orders
        await fetchPendingOrders();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerName = e.target.value;
    if (customerName) {
      const { area, address } = getCustomerAreaAndAddress(customerName);
      setFormData((prev) => ({
        ...prev,
        name: customerName,
        area,
        address,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "",
        area: "",
        address: "",
      }));
    }
  };

  return (
    <div className="create-order-modal">
      <div className="modal-content">
        <h2>Create New Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Customer Name</label>
            <select
              id="name"
              value={formData.name}
              onChange={handleCustomerChange}
              required
            >
              <option value="">Select Customer</option>
              {Object.entries(customerMap).map(([name, data]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="delivery_day">Delivery Day</label>
            <select
              id="delivery_day"
              value={formData.delivery_day}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  delivery_day: e.target.value,
                }))
              }
              required
            >
              <option value="">Select Day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="area">Area</label>
            <input
              type="text"
              id="area"
              value={formData.area}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, area: e.target.value }))
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="package_size">Package Size</label>
            <select
              id="package_size"
              value={formData.package_size}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  package_size: e.target.value as "Small" | "Medium" | "Large",
                }))
              }
              required
            >
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
