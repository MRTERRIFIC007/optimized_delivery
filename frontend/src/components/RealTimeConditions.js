import React, { useState, useEffect } from "react";
import WeatherCard from "./WeatherCard";
import TrafficCard from "./TrafficCard";
import FestivalCard from "./FestivalCard";
import { getRealTimeData } from "../services/api";

const RealTimeConditions = () => {
  const [realTimeData, setRealTimeData] = useState({
    weather: null,
    traffic: null,
    festivals: null,
    weather_summary: "",
    traffic_summary: "",
    festival_summary: "",
    timestamp: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch real-time data
  const fetchRealTimeData = async () => {
    try {
      setRefreshing(true);
      const data = await getRealTimeData();
      setRealTimeData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching real-time data:", err);
      setError("Failed to load real-time data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchRealTimeData();
  }, []);

  // Format timestamp if available
  const formattedTime = realTimeData.timestamp
    ? new Date(realTimeData.timestamp).toLocaleTimeString()
    : "N/A";

  return (
    <div className="card mb-4">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h4>
          <i className="bi bi-clock-history me-2"></i>Real-time Conditions
        </h4>
        <div>
          {realTimeData.timestamp && (
            <small className="me-3 text-light">
              Last updated: {formattedTime}
            </small>
          )}
          <button
            className="btn btn-sm btn-outline-light"
            onClick={fetchRealTimeData}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Refreshing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading real-time conditions...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row">
            <div className="col-md-4">
              <WeatherCard
                data={realTimeData.weather}
                summary={realTimeData.weather_summary}
              />
            </div>
            <div className="col-md-4">
              <TrafficCard
                data={realTimeData.traffic}
                summary={realTimeData.traffic_summary}
              />
            </div>
            <div className="col-md-4">
              <FestivalCard
                data={realTimeData.festivals}
                summary={realTimeData.festival_summary}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeConditions;
