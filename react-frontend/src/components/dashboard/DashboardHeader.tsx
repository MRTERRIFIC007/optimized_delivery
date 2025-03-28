import React from "react";
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Refresh as RefreshIcon, Chat as ChatIcon } from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import useStore from "../../store/useStore";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = "Delivery Dashboard",
  subtitle = "Real-time overview of delivery operations and prediction analytics",
  loading = false,
  lastUpdated = null,
  onRefresh,
}) => {
  const theme = useTheme();
  const { sendChatMessage } = useStore();

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "Not yet updated";
    return `Last updated ${formatDistanceToNow(lastUpdated, {
      addSuffix: true,
    })}`;
  };

  const handleChatHelp = () => {
    sendChatMessage("What does this dashboard show me?");
  };

  return (
    <Box
      sx={{
        mb: 4,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
      }}
    >
      <Box>
        {loading ? (
          <>
            <Skeleton variant="text" width={300} height={45} />
            <Skeleton variant="text" width={240} />
          </>
        ) : (
          <>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom={Boolean(subtitle)}
              sx={{ fontWeight: "bold" }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          mt: { xs: 2, sm: 0 },
          gap: 1,
        }}
      >
        <Tooltip title="Ask for help with the dashboard">
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={handleChatHelp}
            sx={{ mr: { xs: 0, sm: 1 } }}
          >
            Ask Assistant
          </Button>
        </Tooltip>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh Data
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            ml: { xs: 0, sm: 2 },
            mt: { xs: 1, sm: 0 },
            display: "block",
          }}
        >
          {loading ? "Updating..." : getLastUpdatedText()}
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardHeader;
