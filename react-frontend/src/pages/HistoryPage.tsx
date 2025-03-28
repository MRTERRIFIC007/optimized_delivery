import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarMonthIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import useStore from "../store/useStore";
import { DeliveryRecord } from "../store/useStore";

const HistoryPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Get history state from global store
  const { deliveryHistory, loadingHistory, fetchDeliveryHistory } = useStore();

  useEffect(() => {
    // Fetch history data when component mounts
    fetchDeliveryHistory();
  }, [fetchDeliveryHistory]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const refreshData = () => {
    fetchDeliveryHistory();
  };

  // Filter data based on search term
  const filteredData = deliveryHistory.filter(
    (record) =>
      record.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm) ||
      record.delivery_time.includes(searchTerm) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Slice data for pagination
  const displayData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Delivery History
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ width: "300px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Tooltip title="Refresh Data">
            <IconButton onClick={refreshData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {loadingHistory ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CalendarMonthIcon sx={{ mr: 1, fontSize: "1rem" }} />
                        Date
                      </Box>
                    </TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <TrendingUpIcon sx={{ mr: 1, fontSize: "1rem" }} />
                        Pred. Failure
                      </Box>
                    </TableCell>
                    <TableCell>Actual Delay</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayData.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>{record.customer}</TableCell>
                      <TableCell>{record.address}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.delivery_time}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.weather_conditions || "-"}</TableCell>
                      <TableCell>{record.traffic_conditions || "-"}</TableCell>
                      <TableCell>{record.failure_reason || "-"}</TableCell>
                    </TableRow>
                  ))}

                  {displayData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {filteredData.length === 0
                            ? "No delivery history found"
                            : "No matching records found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default HistoryPage;
