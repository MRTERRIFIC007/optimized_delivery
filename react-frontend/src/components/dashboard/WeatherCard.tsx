import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Alert,
  Divider,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Opacity as HumidityIcon,
  BrokenImage as UnknownIcon,
  Grain as SnowIcon,
  Thunderstorm as StormIcon,
  WaterDrop as RainIcon,
  Air as WindIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { WeatherData } from "../../services/api";

interface WeatherCardProps {
  data?: WeatherData | null;
  summary?: string;
  loading?: boolean;
  error?: string | null;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  data,
  summary,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();

  // Helper function to determine weather icon based on conditions
  const getWeatherIcon = (conditions: string) => {
    const condition = conditions.toLowerCase();
    if (condition.includes("sun") || condition.includes("clear")) {
      return <SunnyIcon fontSize="large" sx={{ color: "orange" }} />;
    } else if (condition.includes("cloud")) {
      return <CloudyIcon fontSize="large" sx={{ color: "grey.500" }} />;
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
      return <RainIcon fontSize="large" sx={{ color: "primary.main" }} />;
    } else if (condition.includes("snow")) {
      return <SnowIcon fontSize="large" sx={{ color: "info.light" }} />;
    } else if (condition.includes("thunder") || condition.includes("storm")) {
      return <StormIcon fontSize="large" sx={{ color: "error.main" }} />;
    } else {
      return <UnknownIcon fontSize="large" sx={{ color: "grey.400" }} />;
    }
  };

  // Helper function to determine temperature color
  const getTempColor = (temp: number) => {
    if (temp < 0) return theme.palette.info.dark; // Cold
    if (temp < 10) return theme.palette.info.main; // Cool
    if (temp < 20) return theme.palette.success.main; // Mild
    if (temp < 30) return theme.palette.success.dark; // Warm
    if (temp < 35) return theme.palette.warning.main; // Hot
    return theme.palette.error.main; // Very hot
  };

  // Render loading state
  if (loading) {
    return (
      <Card elevation={3}>
        <CardHeader
          title={<Skeleton variant="text" width="60%" />}
          sx={{ bgcolor: "info.main", color: "white" }}
        />
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ mr: 2 }}
            />
            <Skeleton variant="text" width="80%" />
          </Box>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card elevation={3}>
        <CardHeader
          title="Weather"
          sx={{ bgcolor: "info.main", color: "white" }}
        />
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Unable to load weather data. Please try refreshing.
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
          title="Weather"
          sx={{ bgcolor: "info.main", color: "white" }}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No weather data available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Render actual data
  const { temperature, conditions, humidity, precipitation, warnings } = data;

  // Extract temperature with fallbacks
  const temp =
    typeof temperature === "object" && temperature?.current !== undefined
      ? temperature.current
      : typeof temperature === "number"
      ? temperature
      : null;

  const tempUnits =
    typeof temperature === "object" ? temperature?.units || "C" : "C";

  // Format precipitation data if available
  const hasPrecipitation =
    precipitation && precipitation.chance && precipitation.chance > 0;

  return (
    <Card elevation={3}>
      <CardHeader
        title="Weather"
        sx={{ bgcolor: "info.main", color: "white" }}
      />
      <CardContent>
        {summary && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {summary}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
          <Box sx={{ mr: 3 }}>
            {temp !== null && (
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontWeight: "bold",
                  color: getTempColor(temp),
                }}
              >
                {temp}°{tempUnits}
              </Typography>
            )}
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              {getWeatherIcon(conditions)}
              <Typography
                variant="body1"
                component="div"
                sx={{ ml: 1, fontWeight: "bold" }}
              >
                {conditions}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <HumidityIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
              <Typography variant="body2">Humidity: {humidity}%</Typography>
            </Box>

            {hasPrecipitation && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <RainIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {precipitation.chance}% chance of {precipitation.type}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {warnings && warnings.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" icon={<WarningIcon />} sx={{ py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                {warnings[0]}
              </Typography>
            </Alert>

            {warnings.length > 1 && (
              <Box sx={{ mt: 1 }}>
                {warnings.length === 2 ? (
                  <Alert severity="info" icon={<InfoIcon />} sx={{ py: 0.75 }}>
                    <Typography variant="body2">{warnings[1]}</Typography>
                  </Alert>
                ) : (
                  <Alert severity="info" icon={<InfoIcon />} sx={{ py: 0.75 }}>
                    <Typography variant="body2">
                      {warnings.length - 1} more warnings
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherCard;
