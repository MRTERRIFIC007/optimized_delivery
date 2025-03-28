import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  Alert,
  Chip,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  DirectionsCar as CarIcon,
  Timer as TimerIcon,
  LocationOn as LocationIcon,
  Traffic as TrafficIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { TrafficData, TrafficAreaData } from "../../types/index";

interface TrafficCardProps {
  data?: TrafficData | null;
  summary?: string;
  loading?: boolean;
  error?: string | null;
}

const TrafficCard: React.FC<TrafficCardProps> = ({
  data,
  summary,
  loading = false,
  error = null,
}) => {
  // Helper function to determine congestion badge color
  const getCongestionColor = (level: number) => {
    if (level <= 3) return "success";
    if (level <= 6) return "warning";
    return "error";
  };

  // Type guard function to check if value is TrafficAreaData
  const isTrafficAreaData = (value: any): value is TrafficAreaData => {
    return (
      typeof value === "object" &&
      value !== null &&
      "congestion_level" in value &&
      "delay_minutes" in value &&
      "status" in value
    );
  };

  // Render loading state
  if (loading) {
    return (
      <Card elevation={3}>
        <CardHeader
          title={<Skeleton variant="text" width="60%" />}
          sx={{ bgcolor: "error.main", color: "white" }}
        />
        <CardContent>
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={6} key={i}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={35}
                    height={35}
                    sx={{ mr: 1 }}
                  />
                  <Skeleton variant="text" width="70%" />
                </Box>
              </Grid>
            ))}
          </Grid>

          <Skeleton variant="rectangular" height={50} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card elevation={3}>
        <CardHeader
          title="Traffic"
          sx={{ bgcolor: "error.main", color: "white" }}
        />
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Unable to load traffic data. Please try refreshing.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Render no data state
  if (!data) {
    return (
      <Card elevation={3}>
        <CardHeader
          title="Traffic"
          sx={{ bgcolor: "error.main", color: "white" }}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No traffic data available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Filter out entries that aren't areas (like special keys)
  const areas = Object.entries(data).filter(
    ([key, value]) =>
      key !== "overall_city_congestion" &&
      key !== "status" &&
      isTrafficAreaData(value)
  );

  // Sort areas by congestion level (highest first)
  const sortedAreas = [...areas].sort((a, b) => {
    const aData = a[1] as TrafficAreaData;
    const bData = b[1] as TrafficAreaData;
    return (bData.congestion_level || 0) - (aData.congestion_level || 0);
  });

  // Take only the top 6 areas for display
  const topAreas = sortedAreas.slice(0, 6);

  return (
    <Card elevation={3}>
      <CardHeader
        title="Traffic"
        sx={{ bgcolor: "error.main", color: "white" }}
      />
      <CardContent>
        {summary && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {summary}
          </Typography>
        )}

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ display: "flex", alignItems: "center", mb: 1 }}
          >
            <TrafficIcon fontSize="small" sx={{ mr: 1 }} />
            Congestion by Area:
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (Scale: 1-10, where 10 is severe)
            </Typography>
          </Typography>

          <Grid container spacing={1.5}>
            {topAreas.map(([area, areaData]) => {
              const typedAreaData = areaData as TrafficAreaData;
              return (
                <Grid item xs={6} key={area}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      transition: "background-color 0.2s",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Tooltip
                      title={`${typedAreaData.delay_minutes} min delay, ${typedAreaData.status}`}
                      arrow
                    >
                      <Chip
                        label={`${typedAreaData.congestion_level}/10`}
                        color={getCongestionColor(
                          typedAreaData.congestion_level
                        )}
                        size="small"
                        sx={{ mr: 1, minWidth: "45px" }}
                      />
                    </Tooltip>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight:
                          typedAreaData.congestion_level > 6
                            ? "bold"
                            : "normal",
                      }}
                    >
                      {area}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {typeof data.overall_city_congestion === "number" && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2, mb: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: "medium", mr: 1 }}>
                Overall City Status:
              </Typography>
              <Chip
                label={`${data.overall_city_congestion}/10`}
                color={getCongestionColor(data.overall_city_congestion)}
                size="small"
                sx={{ mr: 1 }}
              />
              {data.status && (
                <Typography variant="body2">- {data.status}</Typography>
              )}
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficCard;
