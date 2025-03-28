import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Divider,
  Paper,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Container,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Thermostat as ThermostatIcon,
  DirectionsCar as DirectionsCarIcon,
  Celebration as CelebrationIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { formatDistanceToNow } from "date-fns";

// Components
import WeatherCard from "../components/dashboard/WeatherCard";
import TrafficCard from "../components/dashboard/TrafficCard";
import FestivalCard from "../components/dashboard/FestivalCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";

// Store
import useStore, { DashboardData } from "../store/useStore";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

interface ActivityItemProps {
  activity: {
    action: string;
    time: string;
    details: string;
  };
  index: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get data from store
  const {
    realTimeData,
    loadingRealTimeData,
    realTimeError,
    lastUpdated,
    fetchRealTimeData,
    dashboardData,
    loadingDashboard,
    dashboardError,
    fetchDashboardData,
  } = useStore();

  // Combined loading state
  const isLoading = loadingRealTimeData || loadingDashboard;

  useEffect(() => {
    // Fetch real-time data when component mounts
    fetchRealTimeData();
    fetchDashboardData();

    // Set up timer to refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 5 * 60 * 1000);

    // Clean up timer on unmount
    return () => clearInterval(interval);
  }, [fetchRealTimeData, fetchDashboardData]);

  // Helper function to refresh all data
  const handleRefresh = () => {
    fetchRealTimeData();
    fetchDashboardData();
  };

  // Main data summary
  const totalDeliveries = dashboardData?.total_deliveries || 0;
  const successRate = dashboardData?.delivery_success_rate || 0;
  const averageDelay = dashboardData?.average_delivery_time || "0 min";
  const failedDeliveries = dashboardData?.failed_deliveries || 0;

  // Stats for display
  const stats = [
    {
      title: "Total Deliveries",
      value: totalDeliveries,
      color: theme.palette.primary.main,
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      color: theme.palette.success.main,
    },
    {
      title: "Average Time",
      value: averageDelay,
      color: theme.palette.info.main,
    },
    {
      title: "Failed Deliveries",
      value: failedDeliveries,
      color: theme.palette.error.main,
    },
  ];

  // Helper function to extract pie chart data
  const getPieChartData = (data: DashboardData | null) => {
    if (!data || !data.failure_by_reason) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [100],
            backgroundColor: ["#e0e0e0"],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: Object.keys(data.failure_by_reason),
      datasets: [
        {
          data: Object.values(data.failure_by_reason),
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Line chart data for delivery success over time
  const successRateData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Success Rate (%)",
        data: [85, 87, 89, 92, 86, 90, 88],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Bar chart data for deliveries by area
  const deliveriesByAreaData = {
    labels: Object.keys(dashboardData?.delivery_by_area || {}),
    datasets: [
      {
        label: "Deliveries",
        data: Object.values(dashboardData?.delivery_by_area || {}),
        backgroundColor: "rgba(75, 192, 192, 0.7)",
      },
    ],
  };

  // Pie chart data for failure reasons
  const failureReasonsData = getPieChartData(dashboardData);

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Delivery Success Rate Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(0, 85 - 5),
        max: 100,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Deliveries by Area",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Failure Reasons",
      },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with refresh button */}
      <DashboardHeader
        loading={isLoading}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      />

      {/* Error messages if any */}
      {(dashboardError || realTimeError) && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {dashboardError || realTimeError}
        </Alert>
      )}

      {/* Real-time data cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <WeatherCard
              data={realTimeData?.weather}
              loading={loadingRealTimeData}
              error={realTimeError}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TrafficCard
              data={realTimeData?.traffic}
              loading={loadingRealTimeData}
              error={realTimeError}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FestivalCard
              data={realTimeData?.festivals}
              loading={loadingRealTimeData}
              error={realTimeError}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Delivery tips based on real-time data */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <TipsAndUpdatesIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Delivery Tips & Updates
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="ul" sx={{ pl: 2 }}>
                {realTimeData?.weather && (
                  <Typography component="li" variant="body2" paragraph>
                    Current weather: {realTimeData.weather.conditions},{" "}
                    {realTimeData.weather.temperature.current}°
                    {realTimeData.weather.temperature.units}.{" "}
                    {realTimeData.weather.conditions
                      .toLowerCase()
                      .includes("rain") &&
                      "Consider providing water-proof packaging today."}
                    {realTimeData.weather.conditions
                      .toLowerCase()
                      .includes("snow") &&
                      "Drive cautiously and allow extra time for deliveries."}
                  </Typography>
                )}
                <Typography component="li" variant="body2" paragraph>
                  Check weather forecasts before planning your routes.
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  Avoid highly congested areas (7+ traffic level) when possible.
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  Plan around festival areas, as traffic patterns may change
                  unexpectedly.
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  Use the prediction system to find optimal delivery windows for
                  each customer.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderTop: `4px solid ${stat.color}`,
                height: "100%",
              }}
            >
              <Typography variant="h6" gutterBottom>
                {stat.title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: stat.color,
                }}
              >
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Success Rate Chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ height: "300px" }}>
              <Line data={successRateData} options={lineOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Failure Reasons Chart */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ height: "300px" }}>
              <Pie data={failureReasonsData} options={pieOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Deliveries by Area */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ height: "300px" }}>
              <Bar data={deliveriesByAreaData} options={barOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Stack spacing={2} sx={{ py: 1 }}>
          {dashboardData?.recent_activities?.map((activity, index) => (
            <ActivityItem key={index} activity={activity} index={index} />
          ))}
          {(!dashboardData?.recent_activities ||
            dashboardData.recent_activities.length === 0) && (
            <Typography variant="body2" color="text.secondary" align="center">
              No recent activity to display
            </Typography>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, index }) => {
  let backgroundColor = "#f0f0f0";
  let icon = <AccessTimeIcon />;

  // Determine background color and icon based on activity type
  switch (activity.action) {
    case "Delivery":
      backgroundColor = "#e8f5e9"; // light green
      icon = <CheckIcon />;
      break;
    case "Failed Delivery":
      backgroundColor = "#ffebee"; // light red
      icon = <CloseIcon />;
      break;
    case "Route Optimized":
      backgroundColor = "#e3f2fd"; // light blue
      icon = <TrendingUpIcon />;
      break;
    case "Weather Alert":
      backgroundColor = "#fff3e0"; // light orange
      icon = <ThermostatIcon />;
      break;
    default:
      break;
  }

  return (
    <Card elevation={1} sx={{ backgroundColor }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="flex-start">
          <Box sx={{ mr: 1 }}>{icon}</Box>
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle2" component="div">
                {activity.action}
              </Typography>
              <Chip
                label={activity.time}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 20 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {activity.details}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
