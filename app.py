from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import pandas as pd
from delivery_predictor import DeliveryPredictor
from datetime import datetime
import argparse
import requests
import json
import os
from chatbot_assistant import DeliveryChatbot
from dotenv import load_dotenv
from flask_cors import CORS  # Import CORS
import logging

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:3002"]}})
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key')  # Required for session
predictor = DeliveryPredictor()

# Initialize chatbot with Perplexity API key from environment variable
perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY")
chatbot = DeliveryChatbot(predictor, perplexity_api_key)

# Add a custom Jinja2 filter for dictionary update
@app.template_filter('dict_concat')
def dict_concat(d1, d2):
    d = d1.copy()
    d.update(d2)
    return d

# Add current datetime function to template context
@app.context_processor
def inject_now():
    return {'now': datetime.now}

# Load pending orders from JSON file
def load_pending_orders():
    try:
        with open('pending_orders.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# Save pending orders to JSON file
def save_pending_orders(orders):
    with open('pending_orders.json', 'w') as f:
        json.dump(orders, f, indent=2)

@app.route('/')
def index():
    """Main dashboard page"""
    # Get current day
    current_day = datetime.now().strftime('%A')
    
    # Get pending orders
    pending_orders = predictor.get_pending_orders()
    
    # Get names for dropdown
    names = sorted(list(set([order['name'] for order in pending_orders])))
    
    # Get today's orders for route optimization
    todays_orders = predictor.get_todays_orders()
    
    # Group today's orders by customer and count parcels
    grouped_orders = {}
    for order in todays_orders:
        customer_name = order['name']
        if customer_name in grouped_orders:
            # Increment parcel count for existing customer
            grouped_orders[customer_name]['parcel_count'] += 1
        else:
            # Copy the order and add parcel count
            grouped_order = order.copy()
            grouped_order['parcel_count'] = 1
            grouped_orders[customer_name] = grouped_order
    
    # Convert grouped orders dict to list
    grouped_todays_orders = list(grouped_orders.values())
    
    # Group pending orders by customer name and delivery day
    grouped_pending_orders = {}
    
    for order in pending_orders:
        key = f"{order['name']}_{order['delivery_day']}"
        if key in grouped_pending_orders:
            grouped_pending_orders[key]['orders'].append(order)
        else:
            grouped_pending_orders[key] = {
                'name': order['name'],
                'delivery_day': order['delivery_day'],
                'area': order['area'],
                'address': order['address'],
                'orders': [order]
            }
    
    # Convert to list for the template
    grouped_pending_list = list(grouped_pending_orders.values())
    
    # Get real-time data
    real_time_data = {
        'weather': predictor.get_real_time_data('weather'),
        'traffic': predictor.get_real_time_data('traffic'),
        'festivals': predictor.get_real_time_data('festivals')
    }
    
    # Create summary data for display
    weather_summary = predictor._get_weather_summary(real_time_data['weather']) if hasattr(predictor, '_get_weather_summary') else "Weather data unavailable"
    traffic_summary = predictor._get_traffic_summary(real_time_data['traffic']) if hasattr(predictor, '_get_traffic_summary') else "Traffic data unavailable"
    festival_summary = predictor._get_festival_summary(real_time_data['festivals']) if hasattr(predictor, '_get_festival_summary') else "Festival data unavailable"
    
    real_time_summary = {
        'weather': weather_summary,
        'traffic': traffic_summary,
        'festivals': festival_summary
    }
    
    return render_template('index.html', 
                          pending_orders=pending_orders,
                          current_day=current_day,
                          names=names,
                          todays_orders=todays_orders,
                          grouped_todays_orders=grouped_todays_orders,
                          grouped_pending_orders=grouped_pending_list,
                          real_time_data=real_time_data,
                          real_time_summary=real_time_summary)

@app.route('/predict', methods=['POST'])
def predict():
    """Predict optimal delivery times for a person"""
    # Check if data is coming as JSON or form data
    if request.is_json:
        data = request.json
        name = data.get('name')
        day = data.get('day', datetime.now().strftime('%A'))
    else:
        name = request.form.get('name')
        day = request.form.get('day', datetime.now().strftime('%A'))
    
    if not name:
        return jsonify({"error": "Name parameter is required"}), 400
    
    # Convert to title case for consistency
    name = name.title()
    
    # Log the request for debugging
    print(f"Prediction request received: name={name}, day={day}")
    
    optimal_times = predictor.predict_optimal_times(name, day)
    
    # Log the result
    print(f"Prediction result: {optimal_times}")
    
    # Add real-time factors that influenced the prediction
    customer_area = predictor.customer_areas.get(name)
    real_time_factors = {}
    
    if customer_area:
        # Get traffic data for this area
        traffic_data = predictor.get_real_time_data('traffic', customer_area)
        if traffic_data and 'congestion_level' in traffic_data:
            real_time_factors['traffic'] = {
                'congestion_level': traffic_data['congestion_level'],
                'status': traffic_data['status']
            }
    
    # Get weather data
    weather_data = predictor.get_real_time_data('weather')
    if weather_data:
        real_time_factors['weather'] = {
            'conditions': weather_data.get('conditions', 'Unknown'),
            'temperature': weather_data.get('temperature', {}).get('current', 'N/A'),
            'precipitation': weather_data.get('precipitation', {}).get('chance', 0)
        }
    
    # Check if any festivals are affecting this area
    festival_data = predictor.get_real_time_data('festivals')
    if festival_data and festival_data.get('has_festival_today', False):
        for festival in festival_data.get('festivals', []):
            if festival.get('date') == datetime.now().strftime("%Y-%m-%d"):
                if customer_area in festival.get('affected_areas', []):
                    real_time_factors['festival'] = {
                        'name': festival.get('name', 'Unknown event'),
                        'impact': festival.get('traffic_impact', 'Low')
                    }
                    break
    
    response_data = {
        'customer_name': name,
        'customer_area': customer_area or "Unknown area",
        'day': day,
        'optimal_times': optimal_times,
        'real_time_factors': real_time_factors
    }
    
    return jsonify(response_data)

@app.route('/pending_orders', methods=['GET'])
def get_pending_orders():
    try:
        orders = load_pending_orders()
        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add_order', methods=['POST'])
def add_order():
    try:
        order_data = request.json
        orders = load_pending_orders()
        
        # Generate a new order ID
        new_order_id = str(max([int(order['order_id']) for order in orders], default=10000) + 1)
        
        # Create new order
        new_order = {
            'order_id': new_order_id,
            'name': order_data['name'],
            'delivery_day': order_data['delivery_day'],
            'area': order_data['area'],
            'address': order_data['address'],
            'package_size': order_data['package_size'],
            'status': 'Pending',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Add to orders list and save
        orders.append(new_order)
        save_pending_orders(orders)
        
        return jsonify(new_order)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update_order_status/<order_id>', methods=['POST'])
def update_order_status(order_id):
    try:
        status_data = request.json
        orders = load_pending_orders()
        
        # Find and update the order
        for order in orders:
            if str(order['order_id']) == str(order_id):
                order['status'] = status_data['status']
                break
        
        # Save updated orders
        save_pending_orders(orders)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/mark_delivered/<int:order_id>')
def mark_delivered(order_id):
    """Mark an order as delivered"""
    success = request.args.get('success', 'true').lower() == 'true'
    result = predictor.mark_delivered(order_id, success)
    
    return redirect(url_for('index'))

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"error": "No message provided"}), 400

        message = data["message"]
        if not message.strip():
            return jsonify({"error": "Empty message"}), 400

        # Get current context
        current_context = {
            "real_time_data": {
                "weather": predictor.get_real_time_data("weather"),
                "traffic": predictor.get_real_time_data("traffic"),
                "festivals": predictor.get_real_time_data("festivals")
            }
        }

        # Process the message
        response = chatbot.process_query(message, current_context)

        return jsonify({"response": response})

    except Exception as e:
        logging.exception("Error in chat endpoint")
        # Return a helpful error message
        return jsonify({
            "error": "An error occurred processing your request",
            "details": str(e)
        }), 500

@app.route('/optimize_route', methods=['POST'])
def optimize_route():
    try:
        order_ids = request.json.get('order_ids', [])
        orders = load_pending_orders()
        
        # Filter orders by IDs
        selected_orders = [order for order in orders if str(order['order_id']) in order_ids]
        
        # Get route optimization from predictor
        optimized_route = predictor.optimize_route(selected_orders)
        
        return jsonify(optimized_route)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/real_time_data', methods=['GET'])
def get_real_time_data():
    """Get real-time data for traffic, weather, and festivals"""
    data_type = request.args.get('type')
    area = request.args.get('area')
    
    if data_type in ['traffic', 'weather', 'festivals']:
        data = predictor.get_real_time_data(data_type, area)
        return jsonify(data)
    elif data_type == 'all':
        # Get all types of real-time data
        data = {
            'weather': predictor.get_real_time_data('weather'),
            'traffic': predictor.get_real_time_data('traffic'),
            'festivals': predictor.get_real_time_data('festivals'),
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Add summaries
        if hasattr(predictor, '_get_weather_summary'):
            data['weather_summary'] = predictor._get_weather_summary(data['weather'])
        if hasattr(predictor, '_get_traffic_summary'):
            data['traffic_summary'] = predictor._get_traffic_summary(data['traffic'])
        if hasattr(predictor, '_get_festival_summary'):
            data['festival_summary'] = predictor._get_festival_summary(data['festivals'])
            
        return jsonify(data)
    else:
        return jsonify({'error': 'Invalid data type. Use "traffic", "weather", "festivals", or "all"'}), 400

@app.route('/geocode', methods=['POST'])
def geocode():
    """Geocode an address to get coordinates"""
    address = request.form.get('address')
    
    if not address:
        return jsonify({'error': 'No address provided'}), 400
    
    try:
        # Use Nominatim for geocoding
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={address}&limit=1"
        headers = {
            'User-Agent': 'DeliveryPredictionSystem/1.0'
        }
        
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if data and len(data) > 0:
            result = data[0]
            return jsonify({
                'lat': float(result['lat']),
                'lon': float(result['lon']),
                'display_name': result['display_name']
            })
        else:
            return jsonify({'error': 'Address not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Delivery Prediction System')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    args = parser.parse_args()
    
    app.run(debug=True, port=args.port) 