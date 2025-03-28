import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  CircularProgress,
  SelectChangeEvent,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import useStore from "../store/useStore";

// Mock customer data until we integrate with real data
const CUSTOMERS = [
  { id: "aditya", name: "Aditya", area: "Satellite" },
  { id: "vivaan", name: "Vivaan", area: "Bopal" },
  { id: "aarav", name: "Aarav", area: "Vastrapur" },
  { id: "meera", name: "Meera", area: "Paldi" },
  { id: "diya", name: "Diya", area: "Thaltej" },
  { id: "riya", name: "Riya", area: "Navrangpura" },
  { id: "ananya", name: "Ananya", area: "Bodakdev" },
  { id: "aryan", name: "Aryan", area: "Gota" },
  { id: "ishaan", name: "Ishaan", area: "Maninagar" },
  { id: "kabir", name: "Kabir", area: "Chandkheda" },
];

const PredictionPage: React.FC = () => {
  const [customer, setCustomer] = useState<string>("");
  const [date, setDate] = useState<Date | null>(new Date());

  // Get prediction state from global store
  const { currentPrediction, loading, error, getPrediction } = useStore();

  const handleCustomerChange = (event: SelectChangeEvent) => {
    setCustomer(event.target.value as string);
  };

  const handleSubmit = () => {
    if (customer && date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      getPrediction(customer, formattedDate);
    }
  };

  // Helper function to determine color based on failure rate
  const getFailureRateColor = (rate: number) => {
    if (rate < 5) return "success.main";
    if (rate < 15) return "warning.main";
    return "error.main";
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Delivery Prediction
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Find Optimal Delivery Times
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="customer-select-label">Customer</InputLabel>
              <Select
                labelId="customer-select-label"
                id="customer-select"
                value={customer}
                label="Customer"
                onChange={handleCustomerChange}
              >
                {CUSTOMERS.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.area})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Delivery Day"
                value={date}
                onChange={(newDate) => setDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid
            item
            xs={12}
            md={2}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!customer || !date || loading}
              sx={{ height: "56px" }}
            >
              {loading ? <CircularProgress size={24} /> : "Predict"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: "error.light" }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {currentPrediction && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Prediction Results
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              {currentPrediction.customer_name} -{" "}
              {currentPrediction.customer_area}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Delivery Day: {currentPrediction.day}
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Optimal Delivery Times (Ranked)
          </Typography>

          <Grid container spacing={2}>
            {currentPrediction.optimal_times.map((timeSlot, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: getFailureRateColor(timeSlot.failure_rate),
                    position: "relative",
                    overflow: "hidden",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "5px",
                      height: "100%",
                      backgroundColor: getFailureRateColor(
                        timeSlot.failure_rate
                      ),
                    },
                  }}
                >
                  <Typography variant="h6">{timeSlot.time}</Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: getFailureRateColor(timeSlot.failure_rate),
                      fontWeight: "bold",
                    }}
                  >
                    {timeSlot.failure_rate.toFixed(1)}% failure rate
                  </Typography>

                  {timeSlot.contributing_factors && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        Contributing Factors:
                      </Typography>
                      <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                        {timeSlot.contributing_factors.weather && (
                          <li>
                            <Typography variant="body2">
                              Weather: {timeSlot.contributing_factors.weather}
                            </Typography>
                          </li>
                        )}
                        {timeSlot.contributing_factors.traffic && (
                          <li>
                            <Typography variant="body2">
                              Traffic: {timeSlot.contributing_factors.traffic}
                            </Typography>
                          </li>
                        )}
                        {timeSlot.contributing_factors.historical && (
                          <li>
                            <Typography variant="body2">
                              Historical:{" "}
                              {timeSlot.contributing_factors.historical}
                            </Typography>
                          </li>
                        )}
                      </ul>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default PredictionPage;
