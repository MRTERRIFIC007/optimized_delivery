import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Route as RouteIcon,
  DirectionsCar as CarIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
  Speed as SpeedIcon,
  Traffic as TrafficIcon,
  Map as MapIcon,
  Refresh as RefreshIcon,
  Warehouse as WarehouseIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import useStore from "../store/useStore";
import MapComponent from "../components/map/MapComponent";

const RouteOptimizationPage: React.FC = () => {
  const {
    pendingOrders,
    loadingOrders,
    ordersError,
    fetchPendingOrders,
    optimizedRoute,
    loadingRoute,
    routeError,
    optimizeRoute,
    realTimeData,
    loadingRealTimeData,
    realTimeError,
    fetchRealTimeData,
  } = useStore();

  // Local state for selected orders
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Add state to control map visibility
  const [showMap, setShowMap] = useState<boolean>(false);

  // Load orders and real-time data on mount
  useEffect(() => {
    fetchPendingOrders();
    if (!realTimeData) {
      fetchRealTimeData();
    }
  }, [fetchPendingOrders, fetchRealTimeData, realTimeData]);

  // Handle checkbox selection
  const handleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Select all orders
  const handleSelectAll = () => {
    if (selectedOrderIds.length === pendingOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map((order) => order.order_id));
    }
  };

  // Handle route optimization
  const handleOptimizeRoute = async () => {
    if (selectedOrderIds.length === 0) return;
    await optimizeRoute(selectedOrderIds);
  };

  // Group orders by area
  const ordersByArea = pendingOrders.reduce<
    Record<string, typeof pendingOrders>
  >((acc, order) => {
    if (!acc[order.area]) {
      acc[order.area] = [];
    }
    acc[order.area].push(order);
    return acc;
  }, {});

  // Format distance/duration for display
  const formatDistanceDuration = (distance?: string, duration?: string) => {
    if (!distance && !duration) return "-";
    return `${distance || "?"} (${duration || "?"})`;
  };

  // Handle map toggle
  const handleToggleMap = () => {
    setShowMap(!showMap);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Route Optimization
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Select orders and optimize the delivery route for maximum efficiency
      </Typography>

      {/* Show error alerts only if we don't have an optimized route */}
      {!optimizedRoute && (ordersError || routeError || realTimeError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {ordersError || routeError || realTimeError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left side - Order selection */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">Select Orders</Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                  sx={{ mr: 1 }}
                >
                  {selectedOrderIds.length === pendingOrders.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchPendingOrders}
                  disabled={loadingOrders}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loadingOrders ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingOrders.length === 0 ? (
              <Alert severity="info">No pending orders to deliver</Alert>
            ) : (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {selectedOrderIds.length} of {pendingOrders.length} orders
                  selected
                </Typography>

                {Object.entries(ordersByArea).map(([area, orders]) => (
                  <Box key={area} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "bold",
                        mb: 1,
                      }}
                    >
                      <LocationIcon
                        color="primary"
                        fontSize="small"
                        sx={{ mr: 0.5 }}
                      />
                      {area} ({orders.length})
                    </Typography>

                    <FormGroup>
                      {orders.map((order) => (
                        <FormControlLabel
                          key={order.order_id}
                          control={
                            <Checkbox
                              checked={selectedOrderIds.includes(
                                order.order_id
                              )}
                              onChange={() =>
                                handleOrderSelection(order.order_id)
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">
                                {order.name} - {order.package_size} package
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {order.address || "No address provided"}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                ))}

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<RouteIcon />}
                  onClick={handleOptimizeRoute}
                  disabled={loadingRoute || selectedOrderIds.length === 0}
                  sx={{ mt: 2 }}
                >
                  {loadingRoute ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Optimize Route"
                  )}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right side - Optimized route display */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Optimized Route
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {loadingRoute ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  py: 8,
                }}
              >
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Calculating optimal route...</Typography>
              </Box>
            ) : !optimizedRoute ? (
              <Alert severity="info" sx={{ my: 2 }}>
                Select orders and click "Optimize Route" to see the optimized
                delivery path.
              </Alert>
            ) : (
              <Box>
                {/* Show warning if there's an error but we have mock route data */}
                {routeError && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {routeError}
                  </Alert>
                )}

                <Card
                  sx={{
                    mb: 3,
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={4}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <SpeedIcon sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="caption">Distance</Typography>
                            <Typography variant="h6">
                              {optimizedRoute.total_distance}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <TimeIcon sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="caption">Duration</Typography>
                            <Typography variant="h6">
                              {optimizedRoute.total_duration}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <TrafficIcon sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="caption">Stops</Typography>
                            <Typography variant="h6">
                              {optimizedRoute?.details?.length || 0}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Route Details
                </Typography>

                <List>
                  {optimizedRoute?.details?.map((leg, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          bgcolor:
                            index % 2 === 0
                              ? "background.default"
                              : "background.paper",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemIcon>
                          {index === 0 ? (
                            <WarehouseIcon color="primary" />
                          ) : (
                            <HomeIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography fontWeight="bold">
                                {leg.from}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {leg.from_address}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 1,
                                }}
                              >
                                <ArrowIcon color="action" sx={{ mx: 2 }} />
                                <Chip
                                  size="small"
                                  label={`${leg.distance} / ${leg.duration}`}
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={leg.traffic_conditions || "Unknown"}
                                  color={
                                    leg.traffic_conditions === "Heavy"
                                      ? "error"
                                      : leg.traffic_conditions === "Moderate"
                                      ? "warning"
                                      : "success"
                                  }
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>

                      {/* Destination for the last leg */}
                      {index === (optimizedRoute?.details?.length || 0) - 1 && (
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            bgcolor:
                              (index + 1) % 2 === 0
                                ? "background.default"
                                : "background.paper",
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemIcon>
                            <HomeIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography fontWeight="bold">
                                  {leg.to}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {leg.to_address}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      )}
                    </React.Fragment>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleToggleMap}
                >
                  {showMap ? "Hide Map" : "View on Map"}
                </Button>

                {showMap && (
                  <Box sx={{ mt: 3, height: 400, width: "100%" }}>
                    <MapComponent />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RouteOptimizationPage;
