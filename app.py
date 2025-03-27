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

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
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
    
    return render_template('index.html', 
                          pending_orders=pending_orders,
                          current_day=current_day,
                          names=names,
                          todays_orders=todays_orders,
                          grouped_todays_orders=grouped_todays_orders,
                          grouped_pending_orders=grouped_pending_list)

@app.route('/predict', methods=['POST'])
def predict():
    """Predict optimal delivery times for a person"""
    name = request.form.get('name')
    day = request.form.get('day', datetime.now().strftime('%A'))
    
    optimal_times = predictor.predict_optimal_times(name, day)
    
    return jsonify({
        'name': name,
        'day': day,
        'optimal_times': optimal_times
    })

@app.route('/add_order', methods=['POST'])
def add_order():
    """Add a new order to the pending stack"""
    name = request.form.get('name')
    delivery_day = request.form.get('delivery_day')
    package_size = request.form.get('package_size')
    
    # Area is now determined by customer name, so we don't need to pass it
    order_id = predictor.add_order(name, delivery_day, package_size=package_size)
    
    return jsonify({
        'success': True,
        'order_id': order_id
    })

@app.route('/mark_delivered/<int:order_id>')
def mark_delivered(order_id):
    """Mark an order as delivered"""
    success = request.args.get('success', 'true').lower() == 'true'
    result = predictor.mark_delivered(order_id, success)
    
    return redirect(url_for('index'))

@app.route('/chat', methods=['POST'])
def chat():
    """Process a chat message from the postman"""
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400
        
    message = request.json.get('message', '')
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Get current context
    current_context = {}
    
    # If we have an active route optimization, include it
    if 'last_route_optimization' in session:
        current_context['optimized_route'] = session['last_route_optimization']
    
    # Process the query through the chatbot
    response = chatbot.process_query(message, current_context)
    
    return jsonify({
        'response': response
    })

@app.route('/optimize_route', methods=['POST'])
def optimize_route():
    """Optimize delivery route for selected customers"""
    selected_customers = request.form.getlist('selected_customers[]')
    
    # Check if any customers were selected
    if not selected_customers or len(selected_customers) == 0:
        # If no customers selected, get today's orders
        todays_orders = predictor.get_todays_orders()
        
        # Count customers
        customer_counts = {}
        for order in todays_orders:
            name = order['name']
            if name in customer_counts:
                customer_counts[name] += 1
            else:
                customer_counts[name] = 1
                
        # Create list with customers repeated based on their order count
        selected_customers = []
        for name, count in customer_counts.items():
            selected_customers.extend([name] * count)
    
    # Optimize the delivery route
    optimal_route = predictor.optimize_delivery_route(selected_customers)
    
    # Enhance the response with address information for UI display
    if 'route' in optimal_route:
        areas = []
        addresses = []
        distances = []
        coordinates = []
        
        # Extract customer info
        for i, customer in enumerate(optimal_route['route']):
            # Extract customer name without the parcel count
            name = customer.split(' (')[0] if ' (' in customer else customer
            
            # Get area and address info
            area = predictor.customer_areas.get(name, "Unknown")
            address = predictor.customer_addresses.get(name, "Unknown address")
            
            # Get coordinates for this customer or location
            if name == "Start Location (Postman)":
                area = "Satellite"  # Postman location is in Satellite
                address = predictor.default_location
                coords = predictor.area_coordinates.get("Satellite", [23.0225, 72.5714])
            else:
                coords = predictor.get_customer_coordinates(name)
            
            areas.append(area)
            addresses.append(address)
            coordinates.append(coords)
            
            # Extract distances from route details if available
            if 'details' in optimal_route and i < len(optimal_route['details']):
                leg = optimal_route['details'][i]
                distance = leg.get('distance', '').replace(' km', '')
                distances.append(distance)
        
        # Add the areas, addresses, coordinates and distances to the response
        optimal_route['areas'] = areas
        optimal_route['addresses'] = addresses
        optimal_route['coordinates'] = coordinates
        optimal_route['distances'] = distances
    
    # Store the optimized route in session for chatbot context
    session['last_route_optimization'] = optimal_route
    
    return jsonify(optimal_route)

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

@app.route('/schedule_for_today', methods=['POST'])
def schedule_for_today():
    """Schedule selected pending orders for today and update the optimized route"""
    # Get the selected order IDs from the form
    selected_order_ids = request.form.getlist('selected_orders[]')
    
    if not selected_order_ids or len(selected_order_ids) == 0:
        return jsonify({
            'success': False, 
            'message': 'No orders selected'
        }), 400
    
    # Convert to integers
    selected_order_ids = [int(order_id) for order_id in selected_order_ids]
    
    # Get all pending orders
    pending_orders = predictor.get_pending_orders()
    
    # Filter to only include selected orders
    scheduled_orders = [order for order in pending_orders if order.get('order_id', order.get('id')) in selected_order_ids]
    
    # Verify we found all the selected orders
    if len(scheduled_orders) != len(selected_order_ids):
        return jsonify({
            'success': False,
            'message': 'Some selected orders were not found in pending orders'
        }), 400
    
    # Update the orders to be scheduled for today
    for order in scheduled_orders:
        # Set the delivery day to today
        today = datetime.now().strftime('%A')
        order['delivery_day'] = today
        
        # Update the order in the predictor
        predictor.update_order(order.get('order_id', order.get('id')), {'delivery_day': today})
    
    # Extract customer names for route optimization, counting repeated customers
    customer_counts = {}
    for order in scheduled_orders:
        name = order['name']
        if name in customer_counts:
            customer_counts[name] += 1
        else:
            customer_counts[name] = 1
    
    # Create the expanded list with customers repeated based on their order count
    customer_names = []
    for name, count in customer_counts.items():
        customer_names.extend([name] * count)
    
    # Optimize the delivery route for these customers
    optimal_route = predictor.optimize_delivery_route(customer_names)
    
    # Enhance the response with address information for UI display, matching optimize_route
    if 'route' in optimal_route:
        areas = []
        addresses = []
        distances = []
        coordinates = []
        
        # Extract customer info
        for i, customer in enumerate(optimal_route['route']):
            # Extract customer name without the parcel count
            name = customer.split(' (')[0] if ' (' in customer else customer
            
            # Get area and address info
            area = predictor.customer_areas.get(name, "Unknown")
            address = predictor.customer_addresses.get(name, "Unknown address")
            
            # Get coordinates for this customer or location
            if name == "Start Location (Postman)":
                area = "Satellite"  # Postman location is in Satellite
                address = predictor.default_location
                coords = predictor.area_coordinates.get("Satellite", [23.0225, 72.5714])
            else:
                coords = predictor.get_customer_coordinates(name)
            
            areas.append(area)
            addresses.append(address)
            coordinates.append(coords)
            
            # Extract distances from route details if available
            if 'details' in optimal_route and i < len(optimal_route['details']):
                leg = optimal_route['details'][i]
                distance = leg.get('distance', '').replace(' km', '')
                distances.append(distance)
        
        # Add the areas, addresses, coordinates and distances to the response
        optimal_route['areas'] = areas
        optimal_route['addresses'] = addresses
        optimal_route['coordinates'] = coordinates
        optimal_route['distances'] = distances
    
    # Store the optimized route in session for chatbot context
    session['last_route_optimization'] = optimal_route
    
    # Return success response with optimized route
    return jsonify({
        'success': True,
        'message': f'Successfully scheduled {len(scheduled_orders)} orders for today',
        'optimized_route': optimal_route,
        'customer_counts': customer_counts
    })

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Delivery Prediction System')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    args = parser.parse_args()
    
    app.run(debug=True, port=args.port) 