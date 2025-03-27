# Delivery Prediction System

This system predicts optimal delivery times for customers based on historical delivery data, manages pending orders, visualizes delivery routes, and provides an AI-powered delivery assistant.

## Features

1. **Delivery Time Prediction**:

   - Analyzes historical delivery data to predict the best times to deliver packages
   - Suggests optimal delivery times based on past success rates
   - Adjusts predictions based on day of the week and customer history
   - Filters out times that have already passed for today

2. **Order Management**:

   - View pending orders
   - Add new orders with fixed customer-area mapping
   - Mark orders as delivered or failed
   - Track delivery status and failure rates

3. **Route Optimization & Visualization**:

   - Interactive map using Leaflet
   - Real-time route optimization and visualization
   - Turn-by-turn directions with directional arrows
   - Detailed markers showing delivery sequence
   - Start point visualization with the postman location
   - Address geocoding for accurate location display

4. **AI-Powered Delivery Assistant**:

   - Natural language chatbot interface using Perplexity AI
   - Contextual awareness of current deliveries and routes
   - Ability to answer questions about customer preferences
   - Suggestions for optimal delivery times and routes
   - Fallback to comprehensive mock responses when needed

5. **Web UI**:
   - Modern, responsive interface with Bootstrap
   - Real-time predictions and order management
   - Interactive route visualization
   - Comprehensive dashboard view of all system features

## Setup and Usage

1. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables:

   Create a `.env` file with the following variables:

   ```
   PERPLEXITY_API_KEY=your_api_key_here
   FLASK_SECRET_KEY=your_secret_key_here
   ```

3. Run the application:

   ```
   python app.py --port=5000
   ```

4. Open your browser and go to:
   ```
   http://localhost:5000
   ```

## How It Works

### Prediction Model

The system analyzes the dataset to find patterns in successful deliveries based on:

- Customer name
- Day of the week
- Time of day
- Area of delivery

It calculates success rates for each combination and recommends time slots with the highest success probability.

### Order Management

- Pending orders are stored in a JSON file (`pending_orders.json`)
- Each customer is assigned to a fixed area for consistency
- New orders automatically use the correct area based on the customer
- When orders are marked as delivered, they're removed from pending and added to the dataset

### Route Visualization

- Utilizes Leaflet for interactive map visualization
- Implements Leaflet Routing Machine for real road-based routes
- Shows directional arrows with Polyline Decorator
- Provides clear markers for each delivery point
- Falls back to direct polylines when routing is unavailable
- Includes customer information and delivery details in popups

### AI Delivery Assistant

- Built using the Perplexity API (sonar model)
- Provides natural language interface for postmen
- Answers questions about deliveries, routes, and customers
- Integrates context from current delivery data and optimized routes
- Offers detailed information about optimal delivery times and customer preferences
- Implements robust fallback to mock responses when API is unavailable

## Files

- `app.py`: Flask web application
- `delivery_predictor.py`: Prediction model and order management
- `chatbot_assistant.py`: AI delivery assistant integration
- `dataset.csv`: Historical delivery data
- `pending_orders.json`: Current pending orders
- `templates/index.html`: Web UI template with map and chatbot integration
- `.env`: Environment variables for API keys (not included in repository)

## Security

- API keys are stored in environment variables
- Session management for maintaining route optimization context
- Error handling for all external API calls

## Future Enhancements

- Voice interface for hands-free operation
- Integration with real traffic data for more accurate route estimation
- Mobile application for on-the-go delivery management
- Expanded AI capabilities for predictive delivery planning
