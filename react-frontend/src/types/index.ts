// Import the interfaces we need from useStore
import { DeliveryRecord, DashboardData, Prediction } from "../store/useStore";

// Chat Types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Order Types
export interface Order {
  order_id: string;
  name: string;
  delivery_day: string;
  area: string;
  address: string;
  package_size: "Small" | "Medium" | "Large";
  status:
    | "Pending"
    | "Success"
    | "Fail"
    | "In Transit"
    | "Delivered"
    | "Failed";
  created_at: string;
}

// Real-time Data Types
export interface WeatherData {
  temperature: {
    current: number;
    feels_like: number;
    units: string;
  };
  conditions: string;
  precipitation: {
    chance: number;
    type: string;
  };
  humidity: number;
  wind?: {
    speed: number;
    direction: string;
    units: string;
  };
  warnings?: string[];
  timestamp?: string;
}

export interface TrafficAreaData {
  congestion_level: number;
  delay_minutes: number;
  status: string;
  peak_areas: string[];
  timestamp?: string;
}

// This matches the API service's TrafficData interface
export interface TrafficDataSummary {
  overall_city_congestion?: number;
  status?: string;
}

export interface TrafficData extends TrafficDataSummary {
  [area: string]: TrafficAreaData | number | string | string[] | undefined;
  congestion_level: number;
  delay_minutes: number;
  status: string;
  peak_areas: string[];
  timestamp: string;
}

export interface FestivalData {
  name: string;
  date: string;
  time: string;
  location: string;
  crowd_size?: "Small" | "Medium" | "Large" | "Very Large";
  traffic_impact: "Low" | "Moderate" | "High" | "Severe";
  affected_areas: string[];
}

export interface FestivalsData {
  festivals: FestivalData[];
  has_festival_today: boolean;
  timestamp?: string;
}

export interface RealTimeData {
  weather: WeatherData;
  traffic: TrafficData;
  festivals: FestivalsData;
  weather_summary?: string;
  traffic_summary?: string;
  festival_summary?: string;
  timestamp?: string;
}

// Route Types
export interface RouteLeg {
  from: string;
  from_address: string;
  to: string;
  to_address: string;
  distance: string;
  duration: string;
  traffic_conditions: string;
}

export interface OptimizedRoute {
  total_distance: string;
  total_duration: string;
  details: RouteLeg[];
  weather_conditions?: string;
  traffic_summary?: string;
  festival_impact?: string;
}

// We'll keep RouteDetail as an alias for RouteLeg for backward compatibility
export type RouteDetail = RouteLeg;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Store State Types
export interface StoreState {
  // Prediction state
  currentPrediction: Prediction | null;
  loading: boolean;
  error: string | null;
  getPrediction: (
    customerId: string,
    date: string
  ) => Promise<Prediction | void>;

  // Delivery history state
  deliveryHistory: DeliveryRecord[];
  loadingHistory: boolean;
  historyError: string | null;
  fetchDeliveryHistory: () => Promise<void>;

  // Dashboard state
  dashboardData: DashboardData | null;
  loadingDashboard: boolean;
  dashboardError: string | null;
  fetchDashboardData: () => Promise<void>;

  // Real-time data state
  realTimeData: RealTimeData | null;
  loadingRealTimeData: boolean;
  realTimeError: string | null;
  lastUpdated: Date | null;
  fetchRealTimeData: () => Promise<void>;

  // Orders
  pendingOrders: Order[];
  loadingOrders: boolean;
  ordersError: string | null;
  fetchPendingOrders: () => Promise<void>;
  addOrder: (
    orderData: Omit<Order, "order_id" | "status" | "created_at">
  ) => Promise<Order | null>;
  updateOrderStatus: (
    orderId: string,
    status: "Delivered" | "Failed"
  ) => Promise<{ success: boolean; error?: string }>;

  // Route optimization
  optimizedRoute: OptimizedRoute | null;
  loadingRoute: boolean;
  routeError: string | null;
  optimizeRoute: (orderIds: string[]) => Promise<{ success: boolean }>;

  // Chat
  chatMessages: ChatMessage[];
  loadingChat: boolean;
  chatError: string | null;
  sendChatMessage: (message: string) => Promise<void>;
}
