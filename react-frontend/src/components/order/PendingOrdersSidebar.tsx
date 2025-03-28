import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Inventory as InventoryIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import useStore from "../../store/useStore";
import { useNavigate } from "react-router-dom";

interface PendingOrdersSidebarProps {
  open: boolean;
  onClose: () => void;
}

const PendingOrdersSidebar: React.FC<PendingOrdersSidebarProps> = ({
  open,
  onClose,
}) => {
  const { pendingOrders, loadingOrders, ordersError, fetchPendingOrders } =
    useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (open && pendingOrders.length === 0 && !loadingOrders) {
      fetchPendingOrders();
    }
  }, [open, pendingOrders.length, loadingOrders, fetchPendingOrders]);

  const handleViewAllOrders = () => {
    navigate("/pending-orders");
    onClose();
  };

  const getPackageSizeColor = (size: string) => {
    switch (size) {
      case "Small":
        return "success";
      case "Medium":
        return "primary";
      case "Large":
        return "error";
      default:
        return "default";
    }
  };

  const drawerWidth = 350;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Pending Orders</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loadingOrders ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : ordersError ? (
          <Typography color="error" sx={{ py: 2 }}>
            {ordersError}
          </Typography>
        ) : pendingOrders.length === 0 ? (
          <Typography sx={{ py: 2 }}>
            No pending orders to deliver today.
          </Typography>
        ) : (
          <Box>
            {/* Order summary */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
                p: 2,
                bgcolor: "primary.light",
                color: "primary.contrastText",
                borderRadius: 1,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", flex: "1 0 45%" }}
              >
                <ReceiptIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="caption">Total Orders</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {pendingOrders.length}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: "1 0 45%" }}
              >
                <ScheduleIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="caption">Delivery Day</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Order list */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Orders for Today
            </Typography>

            <List
              sx={{ mb: 2, maxHeight: "calc(100vh - 300px)", overflow: "auto" }}
            >
              {pendingOrders.map((order, index) => (
                <ListItem
                  key={order.order_id}
                  alignItems="flex-start"
                  sx={{
                    mb: 1,
                    p: 2,
                    bgcolor:
                      index % 2 === 0
                        ? "background.default"
                        : "background.paper",
                    borderRadius: 1,
                    boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {order.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={order.package_size}
                        color={getPackageSizeColor(order.package_size) as any}
                      />
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <LocationIcon
                        fontSize="small"
                        color="action"
                        sx={{ mr: 0.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {order.area}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      {order.address}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1,
                      }}
                    >
                      <Chip
                        size="small"
                        label={order.status}
                        color={
                          order.status === "Pending" ? "warning" : "default"
                        }
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => {
                          navigate(
                            `/pending-orders?highlight=${order.order_id}`
                          );
                          onClose();
                        }}
                      >
                        Details
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>

            <Button
              variant="contained"
              fullWidth
              startIcon={<ReceiptIcon />}
              onClick={handleViewAllOrders}
              sx={{ mt: 1 }}
            >
              View All Orders
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default PendingOrdersSidebar;
