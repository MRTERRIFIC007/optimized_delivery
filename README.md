# Delivery Prediction System API Documentation

A sophisticated backend system for predicting optimal delivery times, optimizing delivery routes, and providing real-time data on weather, traffic, and local events in Ahmedabad.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [API Endpoints](#api-endpoints)
4. [Data Structures](#data-structures)
5. [Real-Time Data](#real-time-data)
6. [Authentication](#authentication)

## Overview

The Delivery Prediction System is designed to optimize the delivery workflow by predicting the best times for successful deliveries based on historical data and real-time conditions. The system analyzes patterns from past deliveries and combines them with current weather, traffic, and festival/event data to provide accurate predictions and optimal delivery routes.

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd delivery-prediction-system

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_SECRET_KEY=your_secret_key
export PERPLEXITY_API_KEY=your_api_key  # Optional for real-time data

# Run the application
python -m app --port 5002
```

## API Endpoints

### Main Dashboard

- **GET /** - Main dashboard page
  - Returns the HTML for the main dashboard with real-time data and pending orders

### Delivery Predictions

- **POST /predict** - Predict optimal delivery times for a specific person
  - Request parameters:
    - `name` (string): Customer name
    - `day` (string, optional): Day of the week (defaults to current day)
  - Response format:
    ```json
    {
      "name": "Customer Name",
      "day": "Monday",
      "optimal_times": [
        { "time": "2 PM", "failure_rate": 3.5 },
        { "time": "4 PM", "failure_rate": 4.2 },
        { "time": "11 AM", "failure_rate": 5.1 }
      ],
      "real_time_factors": {
        "traffic": {
          "congestion_level": 7,
          "status": "Heavy traffic during peak hours"
        },
        "weather": {
          "conditions": "Sunny",
          "temperature": 32,
          "precipitation": 0
        },
        "festival": {
          "name": "Cultural Fair",
          "impact": "Moderate"
        }
      }
    }
    ```

### Order Management

- **POST /add_order** - Add a new order to the pending queue

  - Request parameters:
    - `name` (string): Customer name
    - `delivery_day` (string): Day for delivery
    - `package_size` (string, optional): Package size (Small, Medium, Large)
  - Response format:
    ```json
    {
      "success": true,
      "order_id": 10001
    }
    ```

- **GET /mark_delivered/<order_id>** - Mark an order as delivered
  - URL parameters:
    - `order_id` (integer): ID of the order to mark as delivered
  - Query parameters:
    - `success` (string, optional): "true" or "false" to indicate delivery success (default: "true")
  - Response: Redirects to the main dashboard

### Route Optimization

- **POST /optimize_route** - Optimize delivery route for selected customers
  - Request parameters:
    - `selected_customers[]` (array): List of customer names to include in the route
  - Response format:
    ```json
    {
      "route": [
        "Start Location (Postman)",
        "Customer1",
        "Customer2",
        "Customer3"
      ],
      "total_distance": "15.3 km",
      "total_duration": "35 mins",
      "details": [
        {
          "from": "Start Location (Postman)",
          "from_address": "Iscon Center, Shivranjani Cross Road, Satellite, Ahmedabad, India",
          "to": "Customer1",
          "to_address": "Customer1 Address",
          "distance": "3.2 km",
          "duration": "10 mins",
          "traffic_conditions": "Normal"
        }
        // Additional route legs...
      ],
      "weather_conditions": "Sunny, 31°C",
      "traffic_summary": "Heavy traffic in several areas",
      "festival_impact": "No festivals or events affecting deliveries today"
    }
    ```

### Real-Time Data

- **GET /real_time_data** - Get real-time data for traffic, weather, and festivals
  - Query parameters:
    - `type` (string): Type of data to retrieve ('traffic', 'weather', 'festivals', or 'all')
    - `area` (string, optional): Specific area in Ahmedabad to get data for
  - Response format for `type=all`:
    ```json
    {
      "weather": {
        "temperature": {
          "current": 31,
          "feels_like": 33,
          "units": "Celsius"
        },
        "conditions": "Sunny",
        "precipitation": {
          "chance": 10,
          "type": "None"
        },
        "humidity": 65,
        "wind": {
          "speed": 12,
          "direction": "NW",
          "units": "km/h"
        },
        "warnings": ["Heat advisory: Stay hydrated"]
      },
      "traffic": {
        "Satellite": {
          "congestion_level": 7,
          "delay_minutes": 15,
          "status": "Heavy traffic",
          "peak_areas": ["Shrivranjani Junction", "Iscon Cross Roads"]
        },
        // Other areas...
        "overall_city_congestion": 6,
        "status": "Moderate congestion in several areas"
      },
      "festivals": {
        "has_festival_today": true,
        "festivals": [
          {
            "name": "Food Festival",
            "date": "2023-05-25",
            "time": "16:00 - 22:00",
            "location": "Riverfront",
            "crowd_size": "Large",
            "traffic_impact": "Moderate",
            "affected_areas": ["Satellite", "Navrangpura"]
          }
        ]
      },
      "weather_summary": "Sunny, 31°C, Heat advisory: Stay hydrated",
      "traffic_summary": "Heavy traffic in several areas, particularly in Satellite (7/10) and Navrangpura (8/10)",
      "festival_summary": "Event affecting deliveries today: Food Festival at Riverfront (Moderate impact on Satellite, Navrangpura)",
      "timestamp": "2023-05-25 14:30:45"
    }
    ```

### Geocoding

- **POST /geocode** - Geocode an address to get coordinates
  - Request parameters:
    - `address` (string): Address to geocode
  - Response format:
    ```json
    {
      "lat": 23.0225,
      "lon": 72.5714,
      "display_name": "Ahmedabad, Gujarat, India"
    }
    ```

### Chatbot Assistant

- **POST /chat** - Process a chat message from the postman
  - Request parameters (JSON):
    - `message` (string): User's message to the chatbot
  - Response format:
    ```json
    {
      "response": "The optimal delivery times for Kabir on Monday are 2 PM (3.5% failure rate), 11 AM (4.2% failure rate), and 4 PM (5.1% failure rate). Currently, there is heavy traffic in Chandkheda area which might affect your delivery."
    }
    ```

## Data Structures

### Customer Data

The system maintains fixed mappings of customers to their addresses and areas in Ahmedabad:

```json
{
  "customer_addresses": {
    "Aditya": "Near Jodhpur Cross Road, Satellite, Ahmedabad - 380015",
    "Vivaan": "Near Bopal Cross Road, Bopal, Ahmedabad - 380058",
    "Aarav": "Near Vastrapur Lake, Vastrapur, Ahmedabad - 380015",
    "Meera": "Opposite Dharnidhar Derasar, Paldi, Ahmedabad - 380007",
    "Diya": "Near Thaltej Cross Road, S.G. Highway, Ahmedabad - 380054",
    "Riya": "Near Navrangpura AMTS Bus Stop, Navrangpura, Ahmedabad - 380009",
    "Ananya": "Opposite Rajpath Club, Bodakdev, Ahmedabad - 380054",
    "Aryan": "Near Oganaj Gam, Gota, Ahmedabad - 382481",
    "Ishaan": "Opposite Rambaug Police Station, Maninagar, Ahmedabad - 380008",
    "Kabir": "Near Chandkheda Gam Bus Stop, Chandkheda, Ahmedabad - 382424"
  },
  "customer_areas": {
    "Aditya": "Satellite",
    "Vivaan": "Bopal",
    "Aarav": "Vastrapur",
    "Meera": "Paldi",
    "Diya": "Thaltej",
    "Riya": "Navrangpura",
    "Ananya": "Bodakdev",
    "Aryan": "Gota",
    "Ishaan": "Maninagar",
    "Kabir": "Chandkheda"
  }
}
```

### Order Structure

Orders in the system have the following structure:

```json
{
  "order_id": 10001,
  "name": "Kabir",
  "delivery_day": "Monday",
  "area": "Chandkheda",
  "address": "Near Chandkheda Gam Bus Stop, Chandkheda, Ahmedabad - 382424",
  "package_size": "Medium",
  "status": "Pending",
  "created_at": "2023-05-24 09:30:15"
}
```

## Real-Time Data

The system provides three types of real-time data:

### Weather Data

Weather data includes current temperature, conditions, precipitation chance, and any warnings:

```json
{
  "temperature": {
    "current": 31,
    "feels_like": 33,
    "units": "Celsius"
  },
  "conditions": "Sunny",
  "precipitation": {
    "chance": 10,
    "type": "None"
  },
  "humidity": 65,
  "wind": {
    "speed": 12,
    "direction": "NW",
    "units": "km/h"
  },
  "warnings": ["Heat advisory: Stay hydrated"]
}
```

### Traffic Data

Traffic data includes congestion levels for different areas and overall city status:

```json
{
  "Satellite": {
    "congestion_level": 7,
    "delay_minutes": 15,
    "status": "Heavy traffic",
    "peak_areas": ["Shrivranjani Junction", "Iscon Cross Roads"]
  },
  "Navrangpura": {
    "congestion_level": 8,
    "delay_minutes": 20,
    "status": "Congested due to office hours",
    "peak_areas": ["Law Garden", "Gujarat College"]
  },
  // Other areas...
  "overall_city_congestion": 6,
  "status": "Moderate congestion in several areas"
}
```

Traffic congestion is rated on a scale of 1-10:

- 1-3: Light traffic
- 4-6: Normal traffic
- 7-8: Heavy traffic
- 9-10: Severe congestion

### Festival Data

Festival data includes information about events that might affect deliveries:

```json
{
  "has_festival_today": true,
  "festivals": [
    {
      "name": "Food Festival",
      "date": "2023-05-25",
      "time": "16:00 - 22:00",
      "location": "Riverfront",
      "crowd_size": "Large",
      "traffic_impact": "Moderate",
      "affected_areas": ["Satellite", "Navrangpura"]
    }
  ]
}
```

## Authentication

The API uses Flask's session for maintaining state, such as the last route optimization. For production use, consider implementing proper authentication with JWT or OAuth.

The Perplexity API is used for fetching real-time data with a valid API key. If not provided, the system falls back to simulated data using the `_generate_mock_real_time_data` method.

```python
# Environment variables needed
FLASK_SECRET_KEY=your_secret_key
PERPLEXITY_API_KEY=your_api_key  # Optional
```
