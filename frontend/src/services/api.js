import axios from "axios";

// Create an axios instance with default settings
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5002",
  headers: {
    "Content-Type": "application/json",
  },
});

// API functions for real-time data
export const getRealTimeData = async (type = "all") => {
  try {
    const response = await api.get(`/real_time_data?type=${type}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    throw error;
  }
};

// API functions for delivery predictions
export const getPrediction = async (params) => {
  try {
    const response = await api.post("/predict", params);
    return response.data;
  } catch (error) {
    console.error("Error getting prediction:", error);
    throw error;
  }
};

// API functions for pending orders
export const getPendingOrders = async (day = null) => {
  try {
    const url = day ? `/pending_orders?day=${day}` : "/pending_orders";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    throw error;
  }
};

// API functions for route optimization
export const optimizeRoute = async (params) => {
  try {
    const response = await api.post("/optimize_route", params);
    return response.data;
  } catch (error) {
    console.error("Error optimizing route:", error);
    throw error;
  }
};

// API functions for the chatbot assistant
export const sendChatMessage = async (message) => {
  try {
    const response = await api.post("/chat", { message });
    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

export default api;
