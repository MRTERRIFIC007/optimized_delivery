# Delivery Prediction System

This system predicts optimal delivery times for customers based on historical delivery data and manages pending orders.

## Features

1. **Delivery Time Prediction**: Analyze historical delivery data to predict the best times to deliver packages

   - Suggests 3 optimal delivery times based on past success rates
   - Adjusts predictions based on day of the week and customer history
   - Filters out times that have already passed for today

2. **Order Management**:

   - View pending orders
   - Add new orders
   - Mark orders as delivered or failed

3. **Web UI**:
   - User-friendly interface to interact with the system
   - Real-time predictions and order management

## Setup and Usage

1. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   ```
   http://localhost:5000
   ```

## How It Works

### Prediction Model

The system analyzes the dataset to find patterns in successful deliveries based on:

- Customer name
- Day of the week
- Time of day

It calculates success rates for each combination and recommends time slots with the highest success probability.

### Order Management

- Pending orders are stored in a JSON file (`pending_orders.json`)
- New orders are added to this file
- When orders are marked as delivered, they're removed from pending and added to the dataset

## Files

- `app.py`: Flask web application
- `delivery_predictor.py`: Prediction model and order management
- `dataset.csv`: Historical delivery data (5000 records)
- `pending_orders.json`: Current pending orders
- `templates/index.html`: Web UI template
