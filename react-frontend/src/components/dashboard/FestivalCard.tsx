import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Skeleton,
  Divider,
  Stack,
} from "@mui/material";
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Traffic as TrafficIcon,
  EventBusy as NoEventIcon,
} from "@mui/icons-material";
import { FestivalsData, FestivalData } from "../../services/api";
import { format } from "date-fns";

interface FestivalCardProps {
  data?: FestivalsData | null;
  summary?: string;
  loading?: boolean;
  error?: string | null;
}

const FestivalCard: React.FC<FestivalCardProps> = ({
  data,
  summary,
  loading = false,
  error = null,
}) => {
  // Helper function to determine impact badge color
  const getImpactColor = (impact: string) => {
    const impactLower = impact.toLowerCase();
    if (impactLower === "low") return "success";
    if (impactLower === "moderate") return "warning";
    return "error"; // High or Severe
  };

  // Helper to format date to readable form
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Helper to check if date is today
  const isToday = (dateString: string) => {
    try {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      return dateString === todayString;
    } catch (e) {
      return false;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card elevation={3}>
        <CardHeader
          title={<Skeleton variant="text" width="60%" />}
          sx={{ bgcolor: "success.main", color: "white" }}
        />
        <CardContent>
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={100} />
          </Box>

          <Box>
            <Skeleton variant="rectangular" height={100} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card elevation={3}>
        <CardHeader
          title="Events & Festivals"
          sx={{ bgcolor: "success.main", color: "white" }}
        />
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Unable to load festival data. Please try refreshing.
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
          title="Events & Festivals"
          sx={{ bgcolor: "success.main", color: "white" }}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No festival data available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Get today's festivals
  const todayFestivals =
    data.festivals?.filter(
      (festival) => festival.date && isToday(festival.date)
    ) || [];

  // Check if we have any festivals today
  const hasFestivalsToday =
    data.has_festival_today || todayFestivals.length > 0;

  return (
    <Card elevation={3}>
      <CardHeader
        title="Events & Festivals"
        sx={{ bgcolor: "success.main", color: "white" }}
      />
      <CardContent>
        {summary && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {summary}
          </Typography>
        )}

        {hasFestivalsToday && todayFestivals.length > 0 ? (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {todayFestivals.map((festival, index) => (
              <Box
                key={`${festival.name}-${index}`}
                sx={{
                  p: 1.5,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "success.light",
                  boxShadow: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <EventIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "success.main" }}
                  />
                  {festival.name}
                </Typography>

                <Stack spacing={0.5}>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <LocationIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "text.secondary" }}
                    />
                    {festival.location}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <TimeIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "text.secondary" }}
                    />
                    {festival.time}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    <TrafficIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "text.secondary" }}
                    />
                    <Chip
                      label={`${festival.traffic_impact} impact`}
                      color={getImpactColor(festival.traffic_impact)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {festival.affected_areas &&
                      festival.affected_areas.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Areas: {festival.affected_areas.join(", ")}
                        </Typography>
                      )}
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 3,
              bgcolor: "background.paper",
              borderRadius: 1,
              mt: 2,
              textAlign: "center",
            }}
          >
            <NoEventIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              No festivals or events scheduled for today
            </Typography>

            {data.festivals && data.festivals.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {data.festivals.length} upcoming event
                {data.festivals.length !== 1 ? "s" : ""} in the next days
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FestivalCard;
