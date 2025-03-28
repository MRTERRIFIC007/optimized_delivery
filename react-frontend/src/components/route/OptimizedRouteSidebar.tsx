import React, { useState, useEffect } from "react";
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
  ArrowForward as ArrowIcon,
  Warehouse as WarehouseIcon,
  Home as HomeIcon,
  Map as MapIcon,
  WatchLater as TimeIcon,
  Speed as SpeedIcon,
  Traffic as TrafficIcon,
} from "@mui/icons-material";
import useStore from "../../store/useStore";
import { useNavigate } from "react-router-dom";

interface OptimizedRouteSidebarProps {
  open: boolean;
  onClose: () => void;
}

const OptimizedRouteSidebar: React.FC<OptimizedRouteSidebarProps> = ({
  open,
  onClose,
}) => {
  const { optimizedRoute, loadingRoute, routeError } = useStore();
  const navigate = useNavigate();

  const handleViewFullRoute = () => {
    navigate("/route");
    onClose();
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
          <Typography variant="h6">Optimized Route</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loadingRoute ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : routeError ? (
          <Typography color="error" sx={{ py: 2 }}>
            {routeError}
          </Typography>
        ) : !optimizedRoute ? (
          <Typography sx={{ py: 2 }}>
            No route has been optimized yet. Go to the Route page to create one.
          </Typography>
        ) : (
          <Box>
            {/* Route summary */}
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
                <SpeedIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="caption">Distance</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {optimizedRoute.total_distance}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: "1 0 45%" }}
              >
                <TimeIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="caption">Est. Time</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {optimizedRoute.total_duration}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: "1 0 45%" }}
              >
                <TrafficIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="caption">Stops</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {optimizedRoute?.details?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Route legs */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Route Details
            </Typography>

            <List
              sx={{ mb: 2, maxHeight: "calc(100vh - 300px)", overflow: "auto" }}
            >
              {optimizedRoute?.details?.map((leg, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      mb: 0.5,
                      p: 1,
                      bgcolor:
                        index % 2 === 0
                          ? "background.default"
                          : "background.paper",
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {index === 0 ? (
                        <WarehouseIcon color="primary" fontSize="small" />
                      ) : (
                        <HomeIcon color="primary" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="bold">
                          {leg.from}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" display="block">
                          {leg.from_address}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      my: 0.5,
                      pl: 4,
                    }}
                  >
                    <ArrowIcon color="action" fontSize="small" sx={{ mx: 1 }} />
                    <Chip
                      size="small"
                      label={`${leg.distance} | ${leg.duration}`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={leg.traffic_conditions || "Normal"}
                      color={
                        leg.traffic_conditions === "Heavy"
                          ? "error"
                          : leg.traffic_conditions === "Moderate"
                          ? "warning"
                          : "success"
                      }
                      sx={{ ml: 0.5 }}
                    />
                  </Box>

                  {/* Show final destination for the last leg */}
                  {index === (optimizedRoute?.details?.length || 0) - 1 && (
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        mb: 0.5,
                        p: 1,
                        bgcolor:
                          (index + 1) % 2 === 0
                            ? "background.default"
                            : "background.paper",
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <HomeIcon color="secondary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="bold">
                            {leg.to}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" display="block">
                            {leg.to_address}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </React.Fragment>
              ))}
            </List>

            <Button
              variant="contained"
              fullWidth
              startIcon={<MapIcon />}
              onClick={handleViewFullRoute}
              sx={{ mt: 1 }}
            >
              View Full Route Details
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default OptimizedRouteSidebar;
