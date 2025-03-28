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
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  TextField,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  LocalShipping as ShippingIcon,
} from "@mui/icons-material";
import useStore from "../store/useStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Order } from "../services/api";
import { getCustomerAreaAndAddress } from "../utils/customerData";
import CreateOrder from "../components/orders/CreateOrder";

const PendingOrdersPage: React.FC = () => {
  const {
    pendingOrders,
    loadingOrders,
    ordersError,
    fetchPendingOrders,
    updateOrderStatus,
    optimizeRoute,
    addOrder,
  } = useStore();

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const searchParams = new URLSearchParams(location.search);
  const highlightedOrderId = searchParams.get("highlight");

  // Local state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDay, setFilterDay] = useState<string>("");
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<"Delivered" | "Failed">(
    "Delivered"
  );
  const [deliveryOrderId, setDeliveryOrderId] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  // Load orders on mount
  useEffect(() => {
    if (pendingOrders.length === 0 && !loadingOrders) {
      fetchPendingOrders();
    }
  }, [pendingOrders.length, loadingOrders, fetchPendingOrders]);

  // Scroll to highlighted order if provided
  useEffect(() => {
    if (highlightedOrderId) {
      const element = document.getElementById(`order-${highlightedOrderId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        element.style.backgroundColor = theme.palette.primary.light;
        setTimeout(() => {
          element.style.backgroundColor = "";
          element.style.transition = "background-color 1s";
        }, 2000);
      }
    }
  }, [highlightedOrderId, pendingOrders, theme.palette.primary.light]);

  // Checkbox selection handlers
  const handleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((order) => order.order_id));
    }
  };

  // Filter orders
  const filteredOrders = pendingOrders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.area.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === "" || order.area === filterArea;
    const matchesStatus = filterStatus === "" || order.status === filterStatus;
    const matchesDay =
      filterDay === "" ||
      (filterDay === "Today" &&
        order.delivery_day ===
          new Date().toLocaleDateString("en-US", { weekday: "long" })) ||
      (filterDay !== "Today" && order.delivery_day.includes(filterDay));

    return matchesSearch && matchesArea && matchesStatus && matchesDay;
  });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Dialog handlers
  const openDeliveryDialog = (orderId: string) => {
    setDeliveryOrderId(orderId);
    setDeliveryStatus("Delivered");
    setShowDeliveryDialog(true);
  };

  const closeDeliveryDialog = () => {
    setShowDeliveryDialog(false);
  };

  const handleDeliverySubmit = async () => {
    try {
      const result = await updateOrderStatus(deliveryOrderId, deliveryStatus);
      if (result.success) {
        setSnackbarMessage(
          `Order ${deliveryOrderId} marked as ${deliveryStatus}`
        );
        setSnackbarOpen(true);
        setShowDeliveryDialog(false);
        await fetchPendingOrders(); // Refresh the list
      } else {
        setSnackbarMessage(
          `Error updating order: ${result.error || "Unknown error"}`
        );
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("An error occurred updating the order status");
      setSnackbarOpen(true);
    }
  };

  // Route optimization
  const handleOptimizeRoute = async () => {
    if (selectedOrderIds.length === 0) return;

    try {
      const result = await optimizeRoute(selectedOrderIds);
      if (result.success) {
        navigate("/route");
      }
    } catch (error) {
      setSnackbarMessage("An error occurred optimizing the route");
      setSnackbarOpen(true);
    }
  };

  // Extract unique areas for filtering
  const areas = Array.from(
    new Set(pendingOrders.map((order) => order.area))
  ).sort();

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Create order handler
  const handleCreateOrder = async (
    orderData: Omit<Order, "order_id" | "status">
  ) => {
    try {
      const result = await addOrder(orderData);
      if (result) {
        setSnackbarMessage("Order created successfully");
        setSnackbarOpen(true);
        setShowCreateOrder(false);
        await fetchPendingOrders(); // Refresh the list
      }
    } catch (error) {
      setSnackbarMessage("Failed to create order");
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Pending Orders
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        View and manage all pending orders for delivery
      </Typography>

      {ordersError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {ordersError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Filters and actions */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
              }}
            >
              {/* Search */}
              <TextField
                placeholder="Search orders..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Area filter */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="area-filter-label">Area</InputLabel>
                <Select
                  labelId="area-filter-label"
                  value={filterArea}
                  label="Area"
                  onChange={(e) => setFilterArea(e.target.value)}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status filter */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Transit">In Transit</MenuItem>
                </Select>
              </FormControl>

              {/* Day filter */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="day-filter-label">Day</InputLabel>
                <Select
                  labelId="day-filter-label"
                  value={filterDay}
                  label="Day"
                  onChange={(e) => setFilterDay(e.target.value)}
                >
                  <MenuItem value="">All Days</MenuItem>
                  <MenuItem value="Today">Today</MenuItem>
                  <MenuItem value="Monday">Monday</MenuItem>
                  <MenuItem value="Tuesday">Tuesday</MenuItem>
                  <MenuItem value="Wednesday">Wednesday</MenuItem>
                  <MenuItem value="Thursday">Thursday</MenuItem>
                  <MenuItem value="Friday">Friday</MenuItem>
                  <MenuItem value="Saturday">Saturday</MenuItem>
                  <MenuItem value="Sunday">Sunday</MenuItem>
                </Select>
              </FormControl>

              {/* Refresh button */}
              <Button
                variant="outlined"
                size="medium"
                startIcon={<RefreshIcon />}
                onClick={() => fetchPendingOrders()}
                disabled={loadingOrders}
              >
                Refresh
              </Button>

              {/* Create Order button */}
              <Button
                variant="contained"
                size="medium"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateOrder(true)}
                color="primary"
              >
                Create Order
              </Button>

              {/* Actions with selected orders */}
              {selectedOrderIds.length > 0 && (
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<ShippingIcon />}
                  onClick={handleOptimizeRoute}
                  disabled={selectedOrderIds.length === 0}
                  color="secondary"
                >
                  Optimize Route ({selectedOrderIds.length})
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Orders table */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ width: "100%", overflow: "hidden" }}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">
                Orders{" "}
                {filteredOrders.length > 0 && `(${filteredOrders.length})`}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      selectedOrderIds.length === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    indeterminate={
                      selectedOrderIds.length > 0 &&
                      selectedOrderIds.length < filteredOrders.length
                    }
                    onChange={handleSelectAll}
                    disabled={filteredOrders.length === 0}
                  />
                }
                label="Select All"
              />
            </Box>
            <Divider />

            {loadingOrders ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingOrders.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body1">
                  No pending orders available.
                </Typography>
              </Box>
            ) : filteredOrders.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body1">
                  No orders match your filters.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader aria-label="pending orders table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={
                              selectedOrderIds.length === paginatedOrders.length
                            }
                            indeterminate={
                              selectedOrderIds.length > 0 &&
                              selectedOrderIds.length < paginatedOrders.length
                            }
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Area</TableCell>
                        <TableCell>Delivery Day</TableCell>
                        <TableCell>Package Size</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow
                          key={order.order_id}
                          id={`order-${order.order_id}`}
                          hover
                          selected={selectedOrderIds.includes(order.order_id)}
                          sx={{
                            "&.Mui-selected": {
                              backgroundColor:
                                theme.palette.primary.light + "30",
                            },
                            ...(order.order_id === highlightedOrderId && {
                              backgroundColor:
                                theme.palette.primary.light + "50",
                            }),
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedOrderIds.includes(
                                order.order_id
                              )}
                              onChange={() =>
                                handleOrderSelection(order.order_id)
                              }
                            />
                          </TableCell>
                          <TableCell>{order.order_id}</TableCell>
                          <TableCell>
                            <Box sx={{ fontWeight: "bold" }}>{order.name}</Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {order.address}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={order.area}
                              color="primary"
                              variant="outlined"
                              icon={<LocationIcon fontSize="small" />}
                            />
                          </TableCell>
                          <TableCell>{order.delivery_day}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={order.package_size}
                              color={
                                order.package_size === "Small"
                                  ? "success"
                                  : order.package_size === "Medium"
                                  ? "primary"
                                  : "error"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={order.status}
                              color={
                                order.status === "Pending" ? "warning" : "info"
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openDeliveryDialog(order.order_id)}
                              startIcon={<CheckCircleIcon />}
                            >
                              Mark Status
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredOrders.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Mark as delivered dialog */}
      <Dialog open={showDeliveryDialog} onClose={closeDeliveryDialog}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <FormControl component="fieldset">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={deliveryStatus === "Delivered"}
                      onChange={() => setDeliveryStatus("Delivered")}
                    />
                  }
                  label="Delivered Successfully"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={deliveryStatus === "Failed"}
                      onChange={() => setDeliveryStatus("Failed")}
                    />
                  }
                  label="Delivery Failed"
                />
              </FormGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeliveryDialog}>Cancel</Button>
          <Button onClick={handleDeliverySubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Order Dialog */}
      {showCreateOrder && (
        <CreateOrder onClose={() => setShowCreateOrder(false)} />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default PendingOrdersPage;
