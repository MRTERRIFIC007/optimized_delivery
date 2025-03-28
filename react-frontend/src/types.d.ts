declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.json" {
  const content: any;
  export default content;
}

// Store import
declare module "../store/useStore" {
  import { Zustand } from "zustand";

  // Include the store state interface
  export interface StoreState {
    realTimeData: any;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    fetchRealTimeData: () => void;
    dashboardData: any;
    loadingDashboard: boolean;
    fetchDashboardData: () => void;
  }

  const useStore: () => StoreState;
  export default useStore;
}

// Component imports
declare module "../components/dashboard/WeatherCard" {
  const WeatherCard: React.FC<any>;
  export default WeatherCard;
}

declare module "../components/dashboard/TrafficCard" {
  const TrafficCard: React.FC<any>;
  export default TrafficCard;
}

declare module "../components/dashboard/FestivalCard" {
  const FestivalCard: React.FC<any>;
  export default FestivalCard;
}

declare module "../components/dashboard/DashboardHeader" {
  const DashboardHeader: React.FC<any>;
  export default DashboardHeader;
}
