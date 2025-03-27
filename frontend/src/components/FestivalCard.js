import React from "react";

const FestivalCard = ({ data, summary }) => {
  // Handle empty or invalid data
  if (!data) {
    return (
      <div className="card h-100 real-time-card">
        <div className="card-header bg-success text-white">
          <h5>
            <i className="bi bi-calendar-event me-2"></i>Events & Festivals
          </h5>
        </div>
        <div className="card-body">
          <p className="text-center py-4">
            <i className="bi bi-exclamation-circle me-2"></i>
            Festival data unavailable
          </p>
        </div>
      </div>
    );
  }

  // Extract the relevant data with fallbacks
  const hasFestival = data.has_festival_today === true;
  const festivals = Array.isArray(data.festivals) ? data.festivals : [];

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Filter festivals for today
  const todaysFestivals = festivals.filter(
    (festival) => festival.date === today
  );

  // Function to get badge class based on traffic impact
  const getImpactBadgeClass = (impact) => {
    if (!impact || impact.toLowerCase() === "low") return "bg-success";
    if (impact.toLowerCase() === "moderate") return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="card h-100 real-time-card">
      <div className="card-header bg-success text-white">
        <h5>
          <i className="bi bi-calendar-event me-2"></i>Events & Festivals
        </h5>
      </div>
      <div className="card-body">
        {summary && <p className="mb-2">{summary}</p>}

        <div className="mt-3">
          {hasFestival && todaysFestivals.length > 0 ? (
            todaysFestivals.map((festival, index) => (
              <div className="alert alert-success py-2 px-3 mb-2" key={index}>
                <p className="mb-1">
                  <strong>{festival.name || "Event"}</strong>
                </p>
                <p className="mb-1 small">
                  <i className="bi bi-geo-alt me-1"></i>{" "}
                  {festival.location || "Various locations"}
                </p>
                <p className="mb-1 small">
                  <i className="bi bi-clock me-1"></i>{" "}
                  {festival.time || "All day"}
                </p>
                <p className="mb-0 small">
                  <span
                    className={`badge ${getImpactBadgeClass(
                      festival.traffic_impact
                    )}`}
                  >
                    {festival.traffic_impact || "Low"} impact
                  </span>

                  {festival.affected_areas &&
                    festival.affected_areas.length > 0 && (
                      <span className="small ms-2">
                        <i className="bi bi-geo-fill me-1"></i>
                        Affecting: {festival.affected_areas.join(", ")}
                      </span>
                    )}
                </p>
              </div>
            ))
          ) : (
            <div className="alert alert-light py-2 px-3 mb-0">
              <div className="text-center py-2">
                <i
                  className="bi bi-calendar-x text-muted"
                  style={{ fontSize: "2rem" }}
                ></i>
                <p className="mb-0 mt-2">
                  No festivals or events scheduled for today
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FestivalCard;
