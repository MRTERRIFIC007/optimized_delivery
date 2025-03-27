import React from "react";

const WeatherCard = ({ data, summary }) => {
  // Handle empty or invalid data
  if (!data) {
    return (
      <div className="card h-100 real-time-card">
        <div className="card-header bg-info text-white">
          <h5>
            <i className="bi bi-cloud me-2"></i>Weather
          </h5>
        </div>
        <div className="card-body">
          <p className="text-center py-4">
            <i className="bi bi-exclamation-circle me-2"></i>
            Weather data unavailable
          </p>
        </div>
      </div>
    );
  }

  // Extract the relevant data with fallbacks
  const temperature = data.temperature?.current || "N/A";
  const units = data.temperature?.units || "C";
  const conditions = data.conditions || "Unknown";
  const humidity = data.humidity || "N/A";

  // Precipitation data
  const precipChance = data.precipitation?.chance || 0;
  const precipType = data.precipitation?.type || "precipitation";

  // Warnings
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];

  return (
    <div className="card h-100 real-time-card">
      <div className="card-header bg-info text-white">
        <h5>
          <i className="bi bi-cloud me-2"></i>Weather
        </h5>
      </div>
      <div className="card-body">
        {summary && <p className="mb-1">{summary}</p>}

        <div className="d-flex align-items-center mt-2">
          <div className="me-3">
            <h3>
              {temperature}°{units}
            </h3>
          </div>
          <div>
            <p className="mb-0">
              <strong>{conditions}</strong>
            </p>
            <p className="mb-0 small">
              <i className="bi bi-droplet-half text-primary"></i> Humidity:{" "}
              {humidity}%
            </p>

            {precipChance > 0 && (
              <p className="mb-0 small">
                <i className="bi bi-cloud-rain text-primary"></i> {precipChance}
                % chance of {precipType}
              </p>
            )}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="alert alert-warning mt-2 mb-0 py-2">
            <p className="mb-0">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              <strong>Warning:</strong> {warnings[0]}
            </p>

            {warnings.length > 1 && (
              <>
                {warnings.length === 2 ? (
                  <p className="mb-0 small mt-1">
                    <i className="bi bi-info-circle me-1"></i> {warnings[1]}
                  </p>
                ) : (
                  <p className="mb-0 small mt-1">
                    <i className="bi bi-info-circle me-1"></i>{" "}
                    {warnings.length - 1} more warning
                    {warnings.length > 2 ? "s" : ""}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
