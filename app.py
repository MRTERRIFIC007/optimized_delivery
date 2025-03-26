from flask import Flask, render_template, request, jsonify, redirect, url_for
import pandas as pd
from delivery_predictor import DeliveryPredictor
from datetime import datetime

app = Flask(__name__)
predictor = DeliveryPredictor()

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
    
    return render_template('index.html', 
                          pending_orders=pending_orders,
                          current_day=current_day,
                          names=names,
                          todays_orders=todays_orders)

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

@app.route('/optimize_route', methods=['POST'])
def optimize_route():
    """Optimize delivery route for selected customers"""
    selected_customers = request.form.getlist('selected_customers[]')
    
    if not selected_customers:
        # If no customers selected, get today's orders
        todays_orders = predictor.get_todays_orders()
        selected_customers = [order['name'] for order in todays_orders]
    
    optimal_route = predictor.optimize_delivery_route(selected_customers)
    
    return jsonify(optimal_route)

if __name__ == '__main__':
    app.run(debug=True) 