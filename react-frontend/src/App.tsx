import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Fab,
  Tooltip,
} from "@mui/material";
import {
  Route as RouteIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import PendingOrders from "./components/orders/PendingOrders";
import MapComponent from "./components/map/MapComponent";
import "./styles/orders.css";

// Import layouts
import MainLayout from "./layouts/MainLayout";

// Import pages
import Dashboard from "./pages/Dashboard";
import PredictionPage from "./pages/PredictionPage";
import HistoryPage from "./pages/HistoryPage";
import ChatPage from "./pages/ChatPage";
import RouteOptimizationPage from "./pages/RouteOptimizationPage";
import PendingOrdersPage from "./pages/PendingOrdersPage";

// Import components
import ChatComponent from "./components/chat/ChatComponent";
import { OptimizedRouteSidebar } from "./components/route";
import { PendingOrdersSidebar } from "./components/order";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [routeSidebarOpen, setRouteSidebarOpen] = useState(false);
  const [ordersSidebarOpen, setOrdersSidebarOpen] = useState(false);

  const handleToggleRouteSidebar = () => {
    setRouteSidebarOpen(!routeSidebarOpen);
    if (!routeSidebarOpen) setOrdersSidebarOpen(false);
  };

  const handleToggleOrdersSidebar = () => {
    setOrdersSidebarOpen(!ordersSidebarOpen);
    if (!ordersSidebarOpen) setRouteSidebarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/route" element={<RouteOptimizationPage />} />
            <Route path="/pending-orders" element={<PendingOrdersPage />} />

            <Route
              path="/settings"
              element={<div>Settings Page (Coming Soon)</div>}
            />
            <Route path="/help" element={<div>Help Page (Coming Soon)</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <ChatComponent />

        <Tooltip title="View optimized route">
          <Fab
            color="primary"
            size="medium"
            onClick={handleToggleRouteSidebar}
            sx={{
              position: "fixed",
              bottom: 140,
              right: 20,
              display: { xs: "none", sm: "flex" },
            }}
          >
            <RouteIcon />
          </Fab>
        </Tooltip>

        <Tooltip title="View pending orders">
          <Fab
            color="secondary"
            size="medium"
            onClick={handleToggleOrdersSidebar}
            sx={{
              position: "fixed",
              bottom: 80,
              right: 20,
              display: { xs: "none", sm: "flex" },
            }}
          >
            <ReceiptIcon />
          </Fab>
        </Tooltip>

        <OptimizedRouteSidebar
          open={routeSidebarOpen}
          onClose={() => setRouteSidebarOpen(false)}
        />

        <PendingOrdersSidebar
          open={ordersSidebarOpen}
          onClose={() => setOrdersSidebarOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;
