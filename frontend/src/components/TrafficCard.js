import React from "react";

const TrafficCard = ({ data, summary }) => {
  // Handle empty or invalid data
  if (!data) {
    return (
      <div className="card h-100 real-time-card">
        <div className="card-header bg-danger text-white">
          <h5>
            <i className="bi bi-sign-intersection-fill me-2"></i>Traffic
          </h5>
        </div>
        <div className="card-body">
          <p className="text-center py-4">
            <i className="bi bi-exclamation-circle me-2"></i>
            Traffic data unavailable
          </p>
        </div>
      </div>
    );
  }

  // Get the overall city congestion if available
  const overallCongestion = data.overall_city_congestion || null;
  const overallStatus = data.status || null;

  // Filter out special keys that aren't areas
  const areas = Object.entries(data).filter(
    ([key, value]) =>
      key !== "overall_city_congestion" &&
      key !== "status" &&
      typeof value === "object"
  );

  // Function to get badge class based on congestion level
  const getBadgeClass = (congestion) => {
    if (congestion <= 3) return "bg-success";
    if (congestion <= 6) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="card h-100 real-time-card">
      <div className="card-header bg-danger text-white">
        <h5>
          <i className="bi bi-sign-intersection-fill me-2"></i>Traffic
        </h5>
      </div>
      <div className="card-body">
        {summary && <p className="mb-2">{summary}</p>}

        <div className="mt-3">
          <p className="mb-1">
            <strong>Congestion by Area:</strong>
            <small className="text-muted ms-1">
              (Scale: 1-10, where 10 is severe)
            </small>
          </p>

          <div className="row">
            {areas.length > 0 ? (
              // Display up to 6 areas
              areas.slice(0, 6).map(([area, areaData]) => {
                const congestion = areaData.congestion_level || 5;

                return (
                  <div className="col-6 mb-2" key={area}>
                    <div className="d-flex align-items-center">
                      <div className="me-2">
                        <span className={`badge ${getBadgeClass(congestion)}`}>
                          {congestion}/10
                        </span>
                      </div>
                      <div className="small">{area}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12">
                <p className="small text-muted">
                  No area-specific traffic data available
                </p>
              </div>
            )}
          </div>

          {/* Display overall city status if available */}
          {(overallCongestion || overallStatus) && (
            <div className="alert alert-secondary mt-2 mb-0 py-2">
              <p className="mb-0 small">
                <strong>Overall City Status:</strong>
                {overallCongestion && (
                  <span
                    className={`badge ${getBadgeClass(overallCongestion)} ms-1`}
                  >
                    {overallCongestion}/10
                  </span>
                )}
                {overallStatus && ` - ${overallStatus}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficCard;
