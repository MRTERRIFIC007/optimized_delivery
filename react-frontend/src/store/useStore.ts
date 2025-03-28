import { create } from "zustand";
import apiService from "../services/api";
import {
  customerMap,
  customerAddresses,
  customerAreas,
} from "../utils/customerData";
import {
  ChatMessage,
  StoreState,
  Order,
  RealTimeData,
  OptimizedRoute,
} from "../types/index";

// Constants
const API_BASE_URL = "http://localhost:5002";

// Store interfaces
export interface DeliveryRecord {
  id: string;
  date: string;
  customer: string;
  address: string;
  status: "Delivered" | "Failed";
  delivery_time: string;
  failure_reason?: string;
  weather_conditions?: string;
  traffic_conditions?: string;
}

export interface DashboardData {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  average_delivery_time: string;
  delivery_success_rate: number;
  recent_activities: Array<{
    action: string;
    time: string;
    details: string;
  }>;
  delivery_by_area: Record<string, number>;
  failure_by_reason: Record<string, number>;
}

// Extended prediction interface
export interface Prediction {
  customer_id: string;
  customer_name: string;
  customer_area: string;
  day: string;
  optimal_times: Array<{
    time: string;
    failure_rate: number;
    contributing_factors?: {
      weather?: string;
      traffic?: string;
      historical?: string;
    };
  }>;
  real_time_factors?: {
    weather?: {
      conditions: string;
      temperature: number | string;
      precipitation: number;
    };
    traffic?: {
      congestion_level: number;
      status: string;
    };
    festival?: {
      name: string;
      impact: string;
    };
  };
}

// Mock data
const mockDeliveryHistory: DeliveryRecord[] = [
  {
    id: "DL-1001",
    date: "2023-06-15",
    customer: "Aditya",
    address: customerAddresses["Aditya"],
    status: "Delivered",
    delivery_time: "10:15 AM",
    weather_conditions: "Clear",
    traffic_conditions: "Light",
  },
  {
    id: "DL-1002",
    date: "2023-06-15",
    customer: "Vivaan",
    address: customerAddresses["Vivaan"],
    status: "Failed",
    delivery_time: "12:45 PM",
    failure_reason: "Traffic Congestion",
    weather_conditions: "Rainy",
    traffic_conditions: "Heavy",
  },
  {
    id: "DL-1003",
    date: "2023-06-14",
    customer: "Aarav",
    address: customerAddresses["Aarav"],
    status: "Delivered",
    delivery_time: "2:30 PM",
    weather_conditions: "Partly Cloudy",
    traffic_conditions: "Moderate",
  },
  {
    id: "DL-1004",
    date: "2023-06-14",
    customer: "Meera",
    address: customerAddresses["Meera"],
    status: "Delivered",
    delivery_time: "3:15 PM",
    weather_conditions: "Clear",
    traffic_conditions: "Light",
  },
  {
    id: "DL-1005",
    date: "2023-06-13",
    customer: "Diya",
    address: customerAddresses["Diya"],
    status: "Failed",
    delivery_time: "5:45 PM",
    failure_reason: "Severe Weather",
    weather_conditions: "Thunderstorm",
    traffic_conditions: "Moderate",
  },
];

const mockDashboardData: DashboardData = {
  total_deliveries: 125,
  successful_deliveries: 112,
  failed_deliveries: 13,
  average_delivery_time: "28 minutes",
  delivery_success_rate: 89.6,
  recent_activities: [
    {
      action: "Delivery",
      time: "10:15 AM",
      details: "Package delivered to Aditya",
    },
    {
      action: "Failed Delivery",
      time: "12:45 PM",
      details: "Delivery to Vivaan failed due to traffic",
    },
    {
      action: "Route Optimized",
      time: "1:30 PM",
      details: "Optimized routes for 8 deliveries",
    },
    {
      action: "Weather Alert",
      time: "2:15 PM",
      details: "Heavy rain expected in Downtown",
    },
  ],
  delivery_by_area: {
    Satellite: 28,
    Bopal: 15,
    Vastrapur: 20,
    Paldi: 12,
    Thaltej: 18,
    Navrangpura: 14,
    Bodakdev: 16,
    Gota: 8,
    Maninagar: 10,
    Chandkheda: 9,
  },
  failure_by_reason: {
    "Traffic Congestion": 5,
    "Severe Weather": 4,
    "Customer Unavailable": 2,
    "Vehicle Issues": 1,
    Other: 1,
  },
};

// Add mock real-time data at the top with other mock data
const mockRealTimeData: RealTimeData = {
  weather: {
    temperature: {
      current: 32,
      feels_like: 34,
      units: "°C",
    },
    conditions: "Partly Cloudy",
    precipitation: {
      chance: 20,
      type: "rain",
    },
    humidity: 65,
    wind: {
      speed: 10,
      direction: "NW",
      units: "km/h",
    },
    warnings: [],
    timestamp: new Date().toISOString(),
  },
  traffic: {
    congestion_level: 6,
    delay_minutes: 15,
    status: "Moderate traffic across the city",
    peak_areas: ["Thaltej Junction", "SG Highway"],
    timestamp: new Date().toISOString(),
    overall_city_congestion: 6,
    Satellite: {
      congestion_level: 5,
      delay_minutes: 10,
      status: "Regular traffic flow",
      peak_areas: ["Iscon Cross Roads", "Jodhpur Crossroad"],
    },
    Navrangpura: {
      congestion_level: 7,
      delay_minutes: 18,
      status: "Moderate congestion",
      peak_areas: ["Law Garden", "Gujarat College"],
    },
    Thaltej: {
      congestion_level: 8,
      delay_minutes: 25,
      status: "Heavy traffic",
      peak_areas: ["Thaltej Junction", "Drive-In Road"],
    },
    Bodakdev: {
      congestion_level: 6,
      delay_minutes: 15,
      status: "Moderate congestion",
      peak_areas: ["Rajpath Club Road", "Science City Road"],
    },
    Bopal: {
      congestion_level: 4,
      delay_minutes: 8,
      status: "Regular traffic flow",
      peak_areas: ["Bopal Circle"],
    },
  },
  festivals: {
    festivals: [
      {
        name: "Diwali Festival",
        date: new Date().toISOString().split("T")[0],
        time: "18:00 - 22:00",
        location: "Kankaria Lake",
        crowd_size: "Large",
        traffic_impact: "High",
        affected_areas: ["Maninagar", "Khokhra"],
      },
      {
        name: "Navratri Celebration",
        date: new Date().toISOString().split("T")[0],
        time: "19:00 - 00:00",
        location: "GMDC Ground",
        crowd_size: "Very Large",
        traffic_impact: "Severe",
        affected_areas: ["Vastrapur", "Bodakdev", "Satellite"],
      },
    ],
    has_festival_today: true,
    timestamp: new Date().toISOString(),
  },
  weather_summary:
    "Partly cloudy with a 20% chance of rain. Temperature around 32°C.",
  traffic_summary:
    "Moderate to heavy traffic in Thaltej and Navrangpura areas. Expect delays of 15-25 minutes.",
  festival_summary:
    "Diwali Festival at Kankaria Lake and Navratri Celebration at GMDC Ground affecting multiple areas with high to severe traffic impact.",
  timestamp: new Date().toISOString(),
};

// Create store
const useStore = create<StoreState>((set, get) => ({
  // Initial state
  chatMessages: [],
  pendingOrders: [],
  realTimeData: null,
  optimizedRoute: null,
  loadingRealTimeData: false,
  chatError: null,
  ordersError: null,
  routeError: null,
  loadingRoute: false,
  loadingChat: false,
  loading: false,
  error: null,
  currentPrediction: null,
  loadingHistory: false,
  historyError: null,
  deliveryHistory: [],
  loadingDashboard: false,
  dashboardError: null,
  dashboardData: null,
  loadingOrders: false,
  lastUpdated: null,
  realTimeError: null,

  // Chat actions
  sendChatMessage: async (message: string) => {
    set({ loadingChat: true, chatError: null });
    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, userMessage],
      }));

      const response = await apiService.sendChatMessage(message);
      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.data.content || "",
          timestamp: response.data.timestamp || new Date().toISOString(),
        };
        set((state) => ({
          chatMessages: [...state.chatMessages, assistantMessage],
        }));
      } else {
        set({ chatError: response.error || "Failed to send message" });
      }
    } catch (error) {
      set({ chatError: "An error occurred while sending the message" });
    } finally {
      set({ loadingChat: false });
    }
  },

  // Order actions
  fetchPendingOrders: async () => {
    set({ loadingOrders: true, ordersError: null });
    try {
      const response = await apiService.getPendingOrders();
      if (response.success && response.data) {
        const storeOrders: Order[] = response.data.map((apiOrder) => ({
          order_id: apiOrder.order_id,
          name: apiOrder.name,
          delivery_day: apiOrder.delivery_day,
          area: apiOrder.area,
          address: apiOrder.address,
          package_size: apiOrder.package_size,
          status: mapApiStatusToStoreStatus(apiOrder.status),
          created_at: apiOrder.created_at,
        }));
        set({ pendingOrders: storeOrders });
      } else {
        set({ ordersError: response.error || "Failed to fetch orders" });
      }
    } catch (error) {
      set({ ordersError: "An error occurred while fetching orders" });
    } finally {
      set({ loadingOrders: false });
    }
  },

  addOrder: async (
    orderData: Omit<Order, "order_id" | "status" | "created_at">
  ) => {
    try {
      const response = await apiService.addOrder(orderData);
      if (response.success && response.data) {
        const apiOrder = response.data;
        const storeOrder: Order = {
          order_id: apiOrder.order_id,
          name: apiOrder.name,
          delivery_day: apiOrder.delivery_day,
          area: apiOrder.area,
          address: apiOrder.address,
          package_size: apiOrder.package_size,
          status: mapApiStatusToStoreStatus(apiOrder.status),
          created_at: apiOrder.created_at,
        };

        // Refresh the orders list after successful addition
        await get().fetchPendingOrders();
        return storeOrder;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Real-time data actions
  fetchRealTimeData: async () => {
    try {
      set({ loadingRealTimeData: true, realTimeError: null });
      const response = await apiService.getRealTimeData();

      if (response.success && response.data) {
        const apiData = response.data;

        // Create a valid RealTimeData object with complete required fields by type casting
        const storeRealTimeData: RealTimeData = {
          weather: {
            temperature: apiData.weather.temperature,
            conditions: apiData.weather.conditions,
            precipitation: apiData.weather.precipitation || {
              chance: 0,
              type: "none",
            },
            humidity: apiData.weather.humidity,
            // Use as any to bypass type checking for wind property
            wind: (apiData.weather as any).wind || {
              speed: 0,
              direction: "N/A",
              units: "km/h",
            },
            warnings: apiData.weather.warnings,
            timestamp: apiData.weather.timestamp,
          },
          // Use type casting to satisfy the TypeScript compiler
          traffic: apiData.traffic as unknown as RealTimeData["traffic"],
          festivals: apiData.festivals as unknown as RealTimeData["festivals"],
          weather_summary: apiData.weather_summary,
          traffic_summary: apiData.traffic_summary,
          festival_summary: apiData.festival_summary,
          timestamp: apiData.timestamp,
        };

        set({
          realTimeData: storeRealTimeData,
          loadingRealTimeData: false,
          realTimeError: null,
          lastUpdated: new Date(),
        });
      } else {
        throw new Error(response.error || "Failed to fetch real-time data");
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error);

      // FALLBACK: Use mock data when the API fails
      console.log("Using mock real-time data as fallback");
      set({
        realTimeData: mockRealTimeData,
        loadingRealTimeData: false,
        realTimeError: "Could not connect to server. Using cached data.",
        lastUpdated: new Date(),
      });
    }
  },

  // Route optimization actions
  optimizeRoute: async (orderIds: string[]) => {
    set({ loadingRoute: true, routeError: null });
    try {
      const response = await apiService.optimizeRoute(orderIds);
      if (response.success && response.data) {
        // Even if there's an error message, use the mock route data
        const route: OptimizedRoute = response.data;
        set({
          optimizedRoute: route,
          loadingRoute: false,
          // Display the error message if one exists
          routeError: response.error || null,
        });
      }
      return { success: response.success };
    } catch (error) {
      set({
        loadingRoute: false,
        routeError: "Failed to optimize route",
      });
      return { success: false };
    }
  },

  // Predictions
  getPrediction: async (customerId, date) => {
    set({ loading: true, error: null });
    try {
      const customerName = customerMap[customerId] || customerId;
      console.log(
        `Getting prediction for customer: ${customerName} (ID: ${customerId}) on ${date}`
      );

      // Get prediction from the backend
      const result = await apiService.getPrediction(customerName, date);
      console.log("Prediction API response:", result);

      // Create a prediction that extends the API result with customer info
      const prediction: Prediction = {
        ...result,
        customer_id: customerId,
      };

      set({ currentPrediction: prediction, loading: false });
      return prediction;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error getting prediction:", err);
      set({ error: errorMessage, loading: false });
      throw err;
    }
  },

  // Delivery history
  fetchDeliveryHistory: async () => {
    set({ loadingHistory: true, historyError: null });
    try {
      // In a real implementation, we would fetch from the API
      // For now, use the mock data since this endpoint is not in the backend docs
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay
      set({ deliveryHistory: mockDeliveryHistory, loadingHistory: false });
    } catch (error) {
      set({
        historyError:
          error instanceof Error
            ? error.message
            : "An error occurred fetching delivery history",
        loadingHistory: false,
      });
    }
  },

  // Dashboard data
  fetchDashboardData: async () => {
    set({ loadingDashboard: true, dashboardError: null });
    try {
      // In a real implementation, we would fetch from the API
      // For now, use the mock data since this endpoint is not in the backend docs
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate API delay
      set({ dashboardData: mockDashboardData, loadingDashboard: false });
    } catch (error) {
      set({
        dashboardError:
          error instanceof Error
            ? error.message
            : "An error occurred fetching dashboard data",
        loadingDashboard: false,
      });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const result = await apiService.updateOrderStatus(orderId, status);
      if (result.success) {
        // Refresh the orders list after successful update
        await get().fetchPendingOrders();
      }
      return result;
    } catch (error) {
      return { success: false, error: "Failed to update order status" };
    }
  },
}));

// Helper function to map API status to store status
function mapApiStatusToStoreStatus(apiStatus: string): Order["status"] {
  switch (apiStatus) {
    case "Pending":
      return "Pending";
    case "In Transit":
      return "In Transit";
    case "Delivered":
      return "Delivered";
    case "Failed":
      return "Failed";
    case "Success":
      return "Success";
    case "Fail":
      return "Fail";
    default:
      return "Pending";
  }
}

// Helper function to generate simple AI responses when API is unavailable
function getAIResponse(message: string): string {
  const messageL = message.toLowerCase();

  if (
    messageL.includes("hello") ||
    messageL.includes("hi") ||
    messageL.includes("namaste")
  ) {
    return "Namaste! How can I assist you with the delivery prediction system today?";
  } else if (messageL.includes("weather")) {
    return "I'm showing moderate weather conditions with temperature around 32°C. There's a slight chance of rain in the evening. Humidity is at 65% and precipitation chance is 20%.";
  } else if (messageL.includes("traffic")) {
    return "Current traffic is heavy on Thaltej Cross Road and SG Highway with congestion level 8/10. Navrangpura area shows moderate congestion (level 5/10), while Paldi and other areas have light traffic conditions. Expected delays of up to 20 minutes in Thaltej area.";
  } else if (messageL.includes("route") || messageL.includes("optimize")) {
    return "I can help optimize your delivery route to avoid traffic congestion. The current optimized route for today includes:\n\n1. Start at Distribution Center\n2. Delivery to Aditya (Satellite) - 2.1 km\n3. Delivery to Vivaan (Bopal) - 3.5 km\n4. Delivery to Aarav (Vastrapur) - 2.7 km\n5. Return to Distribution Center - 4.2 km\n\nTotal distance: 12.5 km\nEstimated time: 35 minutes";
  } else if (messageL.includes("festival") || messageL.includes("diwali")) {
    return "There is a Diwali celebration today at Kankaria Lake from 6:00 PM to 10:00 PM. This may cause increased traffic in Maninagar and Khokhra areas. Traffic impact is rated as 'High'. There's also a Navratri Festival at GMDC Ground affecting Vastrapur, Bodakdev and Satellite areas with 'Severe' traffic impact. I recommend completing deliveries to these areas before 5:00 PM to avoid delays.";
  } else if (messageL.includes("aditya")) {
    return "Aditya is located in Satellite area near Jodhpur Cross Road. Based on historical data, the optimal delivery time is between 15:00-16:30 with a 12% failure rate. Aditya usually prefers contactless delivery with a notification 10 minutes before arrival. There's currently a medium-sized package pending for delivery today.";
  } else if (messageL.includes("vivaan")) {
    return "Vivaan is located in Bopal area near Bopal Cross Road. The optimal delivery time is between 13:00-15:00 with a failure rate of 18% during this window. Vivaan is typically available on weekday afternoons and prefers delivery to the security desk at the apartment complex. There's a small package pending for delivery.";
  } else if (
    messageL.includes("today") &&
    (messageL.includes("deliver") || messageL.includes("order"))
  ) {
    return "Today's pending deliveries are:\n\n1. Aditya - Satellite - Medium package - Optimal time: 15:00\n2. Vivaan - Bopal - Small package - Optimal time: 13:00\n3. Aarav - Vastrapur - Large package - Optimal time: 10:30\n\nToday's traffic conditions suggest starting with Aarav in the morning, followed by Vivaan, and ending with Aditya in the afternoon for optimal efficiency.";
  } else if (
    messageL.includes("deliver") ||
    messageL.includes("package") ||
    messageL.includes("order")
  ) {
    return "There are 3 pending deliveries in the system. For specific order status, please check the Orders section or provide the customer name. The overall delivery success rate is currently at 89.6% with an average delivery time of 28 minutes.";
  } else if (messageL.includes("dashboard") || messageL.includes("show me")) {
    return "The dashboard shows that we have:\n- Total Deliveries: 125\n- Success Rate: 89.6%\n- Average Time: 28 minutes\n- Failed Deliveries: 13\n\nMost deliveries are in Satellite (28) and Vastrapur (20) areas. The main failure reasons are Traffic Congestion (5) and Severe Weather (4). There's currently heavy traffic in Thaltej and a Diwali celebration at Kankaria Lake scheduled for this evening.";
  } else if (messageL.includes("thank")) {
    return "You're welcome! Let me know if you need any other assistance with your deliveries.";
  } else {
    return "I understand you're asking about the delivery system. I can help with information about deliveries, customers, traffic conditions, optimal delivery times, and route optimization. Could you please provide more specific details about what you need help with?";
  }
}

// Export both default and named export for backward compatibility
export { useStore };
export default useStore;
