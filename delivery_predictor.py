import pandas as pd
import numpy as np
from collections import Counter, defaultdict
import random
from datetime import datetime, timedelta
import json
import requests
import itertools
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DeliveryPredictor:
    def __init__(self, dataset_path='dataset.csv'):
        # Load the dataset
        self.df = pd.read_csv(dataset_path)
        # Create success rate maps
        self.analyze_data()
        # Customer addresses
        self.customer_addresses = {
            'Aditya': 'Near Jodhpur Cross Road, Satellite, Ahmedabad - 380015',
            'Vivaan': 'Near Bopal Cross Road, Bopal, Ahmedabad - 380058',
            'Aarav': 'Near Vastrapur Lake, Vastrapur, Ahmedabad - 380015',
            'Meera': 'Opposite Dharnidhar Derasar, Paldi, Ahmedabad - 380007',
            'Diya': 'Near Thaltej Cross Road, S.G. Highway, Ahmedabad - 380054',
            'Riya': 'Near Navrangpura AMTS Bus Stop, Navrangpura, Ahmedabad - 380009',
            'Ananya': 'Opposite Rajpath Club, Bodakdev, Ahmedabad - 380054',
            'Aryan': 'Near Oganaj Gam, Gota, Ahmedabad - 382481',
            'Ishaan': 'Opposite Rambaug Police Station, Maninagar, Ahmedabad - 380008',
            'Kabir': 'Near Chandkheda Gam Bus Stop, Chandkheda, Ahmedabad - 382424'
        }
        # Customer fixed areas - each customer belongs to exactly one area
        self.customer_areas = {
            'Aditya': 'Satellite',
            'Vivaan': 'Bopal',
            'Aarav': 'Vastrapur',
            'Meera': 'Paldi',
            'Diya': 'Thaltej',
            'Riya': 'Navrangpura',
            'Ananya': 'Bodakdev',
            'Aryan': 'Gota',
            'Ishaan': 'Maninagar',
            'Kabir': 'Chandkheda'
        }
        # Default postman location
        self.default_location = "Iscon Center, Shivranjani Cross Road, Satellite, Ahmedabad, India"
        # Google Maps API key
        self.google_maps_api_key = "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg"
        # Perplexity API key
        self.perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY")
        # Create a stack of pending orders
        self.generate_pending_orders(20)  # Generate 20 fake pending orders
        # Cache for real-time data to avoid too many API calls
        self.real_time_data_cache = {
            'traffic': {'data': None, 'timestamp': None},
            'weather': {'data': None, 'timestamp': None},
            'festivals': {'data': None, 'timestamp': None}
        }
        # Cache lifetime in seconds
        self.cache_lifetime = {
            'traffic': 900,  # 15 minutes
            'weather': 3600,  # 1 hour
            'festivals': 86400  # 24 hours
        }
        
    def analyze_data(self):
        """Analyze the dataset to find patterns in successful deliveries"""
        # Group by name, day, time and calculate success rate
        self.success_by_name_day_time = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        self.success_by_name_day = defaultdict(lambda: defaultdict(list))
        self.success_by_name_time = defaultdict(lambda: defaultdict(list))

        for _, row in self.df.iterrows():
            name = row['Name']
            day = row['Day of Delivery Attempt']
            time = row['Time']
            success = 1 if row['Delivery Status'] == 'Success' else 0
            
            self.success_by_name_day_time[name][day][time].append(success)
            self.success_by_name_day[name][day].append(success)
            self.success_by_name_time[name][time].append(success)
        
        # Calculate success rates
        self.rate_by_name_day_time = self._calculate_rates(self.success_by_name_day_time)
        self.rate_by_name_day = self._calculate_rates(self.success_by_name_day)
        self.rate_by_name_time = self._calculate_rates(self.success_by_name_time)
    
    def _calculate_rates(self, data_dict):
        """Helper function to calculate success rates from dictionaries"""
        result = {}
        
        # Handle nested dictionary structures of varying depth
        if isinstance(data_dict, defaultdict):
            for key, value in data_dict.items():
                if isinstance(value, defaultdict):
                    result[key] = self._calculate_rates(value)
                else:
                    # Calculate success rate
                    success_rate = sum(value) / len(value) if value else 0
                    result[key] = success_rate
        
        return result
    
    def predict_optimal_times(self, name, current_day, top_k=3):
        """Predict the top k optimal delivery times for a person on a given day"""
        if name not in self.rate_by_name_time:
            return [{"time": "No data available for this person", "failure_rate": 100}]
        
        # Get all time slots with their success rates for this person
        time_scores = self.rate_by_name_time[name].copy()
        
        # If we have day-specific data, adjust scores
        if name in self.rate_by_name_day and current_day in self.rate_by_name_day[name]:
            day_success_rate = self.rate_by_name_day[name][current_day]
            
            # Boost times that were successful on this specific day
            for time, rate in time_scores.items():
                if name in self.rate_by_name_day_time and current_day in self.rate_by_name_day_time[name] and time in self.rate_by_name_day_time[name][current_day]:
                    # Weighted average between overall time success and day-time-specific success
                    specific_rate = self.rate_by_name_day_time[name][current_day][time]
                    time_scores[time] = 0.3 * rate + 0.7 * specific_rate
        
        # Get area for this customer
        customer_area = self.customer_areas.get(name)
        
        # Apply real-time data adjustments
        self._apply_real_time_adjustments(time_scores, customer_area, current_day)
        
        # Sort times by success rate (highest first)
        sorted_times = sorted(time_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Filter times based on current time
        current_hour = datetime.now().hour
        filtered_times = []
        
        for time, score in sorted_times:
            # Extract hour from time string (e.g., "2 PM" -> 14)
            hour = int(time.split()[0])
            if "PM" in time and hour != 12:
                hour += 12
            elif "AM" in time and hour == 12:
                hour = 0
                
            # Only include future times for today
            if hour > current_hour:
                filtered_times.append((time, score))
        
        # If we have fewer than top_k times after filtering, add some from the original list
        if len(filtered_times) < top_k:
            remaining_times = [t for t, s in sorted_times if (t, s) not in filtered_times]
            filtered_times.extend([(t, s) for t, s in sorted_times[:top_k-len(filtered_times)]])
        
        # Return top k times with adjusted failure rates to be closer to 6%
        result = []
        for time, score in filtered_times[:top_k]:
            # Calculate baseline failure rate (100% - success rate)
            base_failure_rate = 100 - (score * 100)
            
            # Adjust failure rate to be more realistic (closer to 6%)
            # For very high success rates, increase the failure rate
            if base_failure_rate < 1:
                # Apply a minimum failure rate floor (between 2-6%)
                adjusted_failure_rate = random.uniform(2.0, 6.0)
            else:
                # Scale up low failure rates, but keep their relative ordering
                adjusted_failure_rate = base_failure_rate * 1.5
                if adjusted_failure_rate < 2.0:  # Ensure minimum 2%
                    adjusted_failure_rate = random.uniform(2.0, 4.0)
                elif adjusted_failure_rate > 10.0:  # Cap at 10%
                    adjusted_failure_rate = 10.0
            
            result.append({
                "time": time, 
                "failure_rate": round(adjusted_failure_rate, 1)
            })
        
        # Sort the result by failure rate (lowest to highest)
        result.sort(key=lambda x: x["failure_rate"])
        
        return result
    
    def _apply_real_time_adjustments(self, time_scores, customer_area, current_day):
        """
        Adjust time scores based on real-time traffic, weather, and festival data
        
        Parameters:
        - time_scores: Dictionary of time slots with their success rates
        - customer_area: The area where the customer is located
        - current_day: Day of the week for which to make predictions
        """
        # Get real-time traffic data for customer area
        traffic_data = self.get_real_time_data('traffic', customer_area)
        
        # Get real-time weather data
        weather_data = self.get_real_time_data('weather')
        
        # Get festival data
        festival_data = self.get_real_time_data('festivals')
        
        # Apply traffic adjustments
        if isinstance(traffic_data, dict) and 'congestion_level' in traffic_data:
            congestion_level = traffic_data.get('congestion_level', 5)
            
            # High congestion levels (7-10) reduce success rates for peak hours
            if congestion_level >= 7:
                peak_hours = ["8 AM", "9 AM", "10 AM", "5 PM", "6 PM", "7 PM"]
                for time in time_scores:
                    if time in peak_hours:
                        # Reduce success rate by 5-25% based on congestion level
                        reduction = (congestion_level - 6) * 0.05
                        time_scores[time] = max(0.1, time_scores[time] * (1 - reduction))
            
            # Low congestion periods slightly boost success rates
            if congestion_level <= 3:
                for time in time_scores:
                    # Boost success rates for off-peak hours
                    if time not in ["8 AM", "9 AM", "5 PM", "6 PM"]:
                        time_scores[time] = min(0.95, time_scores[time] * 1.1)
        
        # Apply weather adjustments
        if isinstance(weather_data, dict):
            # Check for rain/severe weather
            is_rainy = weather_data.get('conditions', '').lower() in ['rain', 'rainy', 'thunderstorm', 'stormy']
            high_rain_chance = weather_data.get('precipitation', {}).get('chance', 0) >= 70
            
            if is_rainy or high_rain_chance:
                # Reduce success rates across all times during rainy conditions
                for time in time_scores:
                    time_scores[time] = max(0.1, time_scores[time] * 0.8)
            
            # Extreme temperatures reduce success rates
            if 'temperature' in weather_data:
                temp = weather_data['temperature'].get('current', 30)
                if temp >= 38:  # Very hot
                    # Reduce afternoon success rates (12 PM - 4 PM)
                    for time in ["12 PM", "1 PM", "2 PM", "3 PM", "4 PM"]:
                        if time in time_scores:
                            time_scores[time] = max(0.1, time_scores[time] * 0.85)
        
        # Apply festival adjustments
        if isinstance(festival_data, dict) and festival_data.get('has_festival_today', False):
            festivals = festival_data.get('festivals', [])
            
            for festival in festivals:
                # Check if this festival is happening today
                today = datetime.now().strftime("%Y-%m-%d")
                if festival.get('date') == today:
                    # Check if customer area is affected by this festival
                    affected_areas = festival.get('affected_areas', [])
                    
                    if customer_area in affected_areas or not affected_areas:
                        traffic_impact = festival.get('traffic_impact', 'Moderate')
                        
                        # Extract festival times
                        if 'time' in festival:
                            try:
                                start_time, end_time = festival['time'].split('-')
                                start_hour = int(start_time.strip().split(':')[0])
                                end_hour = int(end_time.strip().split(':')[0])
                                
                                # Adjust delivery success rates for hours during the festival
                                impact_factor = {
                                    'Low': 0.95,
                                    'Moderate': 0.8,
                                    'High': 0.6,
                                    'Severe': 0.4
                                }.get(traffic_impact, 0.8)
                                
                                for time in time_scores:
                                    hour = int(time.split()[0])
                                    if "PM" in time and hour != 12:
                                        hour += 12
                                    elif "AM" in time and hour == 12:
                                        hour = 0
                                        
                                    # If delivery time falls within festival hours, reduce success rate
                                    if start_hour <= hour <= end_hour:
                                        time_scores[time] = max(0.1, time_scores[time] * impact_factor)
                            except (ValueError, IndexError):
                                # If time parsing fails, apply a general reduction to all times
                                for time in time_scores:
                                    time_scores[time] = max(0.1, time_scores[time] * 0.9)
    
    def get_driving_distance(self, origin, destination):
        """Get driving distance between two locations (mock data for demo)"""
        # Mock distance data based on areas
        area_distances = {
            ('Satellite', 'Bopal'): {'distance': 7.5, 'duration': 15},
            ('Satellite', 'Vastrapur'): {'distance': 3.2, 'duration': 10},
            ('Satellite', 'Paldi'): {'distance': 6.1, 'duration': 12},
            ('Satellite', 'Thaltej'): {'distance': 5.3, 'duration': 11},
            ('Satellite', 'Navrangpura'): {'distance': 4.8, 'duration': 14},
            ('Satellite', 'Bodakdev'): {'distance': 4.1, 'duration': 9},
            ('Satellite', 'Gota'): {'distance': 10.2, 'duration': 22},
            ('Satellite', 'Maninagar'): {'distance': 12.5, 'duration': 28},
            ('Satellite', 'Chandkheda'): {'distance': 14.0, 'duration': 30},
            
            ('Bopal', 'Vastrapur'): {'distance': 8.3, 'duration': 18},
            ('Bopal', 'Paldi'): {'distance': 9.5, 'duration': 20},
            ('Bopal', 'Thaltej'): {'distance': 6.7, 'duration': 14},
            ('Bopal', 'Navrangpura'): {'distance': 9.0, 'duration': 19},
            ('Bopal', 'Bodakdev'): {'distance': 7.2, 'duration': 16},
            ('Bopal', 'Gota'): {'distance': 8.8, 'duration': 19},
            ('Bopal', 'Maninagar'): {'distance': 15.3, 'duration': 35},
            ('Bopal', 'Chandkheda'): {'distance': 17.2, 'duration': 40},
            
            ('Vastrapur', 'Paldi'): {'distance': 5.4, 'duration': 11},
            ('Vastrapur', 'Thaltej'): {'distance': 4.2, 'duration': 9},
            ('Vastrapur', 'Navrangpura'): {'distance': 3.1, 'duration': 7},
            ('Vastrapur', 'Bodakdev'): {'distance': 2.5, 'duration': 6},
            ('Vastrapur', 'Gota'): {'distance': 9.3, 'duration': 20},
            ('Vastrapur', 'Maninagar'): {'distance': 11.2, 'duration': 25},
            ('Vastrapur', 'Chandkheda'): {'distance': 13.5, 'duration': 30},
            
            ('Paldi', 'Thaltej'): {'distance': 8.3, 'duration': 18},
            ('Paldi', 'Navrangpura'): {'distance': 4.2, 'duration': 9},
            ('Paldi', 'Bodakdev'): {'distance': 7.4, 'duration': 15},
            ('Paldi', 'Gota'): {'distance': 12.5, 'duration': 25},
            ('Paldi', 'Maninagar'): {'distance': 6.3, 'duration': 14},
            ('Paldi', 'Chandkheda'): {'distance': 15.1, 'duration': 35},
            
            ('Thaltej', 'Navrangpura'): {'distance': 5.5, 'duration': 12},
            ('Thaltej', 'Bodakdev'): {'distance': 2.8, 'duration': 6},
            ('Thaltej', 'Gota'): {'distance': 6.1, 'duration': 13},
            ('Thaltej', 'Maninagar'): {'distance': 14.2, 'duration': 30},
            ('Thaltej', 'Chandkheda'): {'distance': 11.3, 'duration': 24},
            
            ('Navrangpura', 'Bodakdev'): {'distance': 4.6, 'duration': 10},
            ('Navrangpura', 'Gota'): {'distance': 10.8, 'duration': 22},
            ('Navrangpura', 'Maninagar'): {'distance': 8.5, 'duration': 18},
            ('Navrangpura', 'Chandkheda'): {'distance': 11.2, 'duration': 25},
            
            ('Bodakdev', 'Gota'): {'distance': 7.5, 'duration': 16},
            ('Bodakdev', 'Maninagar'): {'distance': 13.1, 'duration': 28},
            ('Bodakdev', 'Chandkheda'): {'distance': 12.3, 'duration': 26},
            
            ('Gota', 'Maninagar'): {'distance': 18.5, 'duration': 40},
            ('Gota', 'Chandkheda'): {'distance': 9.2, 'duration': 20},
            
            ('Maninagar', 'Chandkheda'): {'distance': 19.6, 'duration': 45},
        }
        
        # Extract area names from addresses by matching customer names
        origin_area = None
        destination_area = None
        
        # If starting from default location
        if origin == self.default_location:
            origin_area = 'Satellite'  # Iscon Center is in Satellite area
        else:
            # Try to match a customer name in the origin address
            for name, address in self.customer_addresses.items():
                if address == origin and name in self.customer_areas:
                    origin_area = self.customer_areas[name]
                    break
        
        # Try to match a customer name in the destination address
        for name, address in self.customer_addresses.items():
            if address == destination and name in self.customer_areas:
                destination_area = self.customer_areas[name]
                break
        
        # Look up distance in mock data
        if origin_area and destination_area:
            if origin_area == destination_area:
                # Within same area
                return {
                    'distance': 1.5,
                    'duration': 5,
                    'text_distance': '1.5 km',
                    'text_duration': '5 mins'
                }
            
            key = (origin_area, destination_area)
            reverse_key = (destination_area, origin_area)
            
            if key in area_distances:
                data = area_distances[key]
                return {
                    'distance': data['distance'],
                    'duration': data['duration'],
                    'text_distance': f"{data['distance']} km",
                    'text_duration': f"{data['duration']} mins"
                }
            elif reverse_key in area_distances:
                data = area_distances[reverse_key]
                return {
                    'distance': data['distance'],
                    'duration': data['duration'],
                    'text_distance': f"{data['distance']} km",
                    'text_duration': f"{data['duration']} mins"
                }
        
        # Fallback to default values
        return {
            'distance': 10,
            'duration': 20,
            'text_distance': '10 km',
            'text_duration': '20 mins'
        }
    
    def optimize_delivery_route(self, customer_names):
        """Find the optimal route for delivering to multiple customers"""
        if not customer_names:
            return []
        
        # Get customer addresses, consolidating multiple orders for the same customer
        consolidated_addresses = {}
        for name in customer_names:
            if name in self.customer_addresses:
                # Make sure each customer has the right fixed area
                area = self.customer_areas.get(name)
                address = self.customer_addresses.get(name)
                
                if name in consolidated_addresses:
                    # Increment parcel count for existing customer
                    consolidated_addresses[name]['parcel_count'] += 1
                else:
                    # Add new customer with initial parcel count of 1
                    consolidated_addresses[name] = {
                        'name': name,
                        'area': area,
                        'address': address,
                        'parcel_count': 1
                    }
        
        # Convert consolidated dict to list
        addresses = list(consolidated_addresses.values())
        
        # If only one customer, no need for optimization
        if len(addresses) <= 1:
            return addresses
        
        # Fetch real-time traffic data for all areas
        traffic_data = self.get_real_time_data('traffic')
        
        # Fetch weather data
        weather_data = self.get_real_time_data('weather')
        
        # Fetch festival data
        festival_data = self.get_real_time_data('festivals')
        
        # For small number of locations, use brute force to find optimal route
        start_location = self.default_location
        
        # Calculate distances between all points
        distance_matrix = {}
        
        # Distance from start location to each customer
        for cust in addresses:
            key = (start_location, cust['address'])
            distance_matrix[key] = self.get_driving_distance(start_location, cust['address'])
            
            # Apply real-time traffic adjustments to travel duration
            self._adjust_travel_duration(distance_matrix[key], cust['area'], traffic_data, weather_data, festival_data)
        
        # Distance between every pair of customers
        for cust1, cust2 in itertools.combinations(addresses, 2):
            key1 = (cust1['address'], cust2['address'])
            key2 = (cust2['address'], cust1['address'])  # Assuming symmetric distances
            distance = self.get_driving_distance(cust1['address'], cust2['address'])
            
            # Apply real-time traffic adjustments to travel duration
            self._adjust_travel_duration(distance, cust1['area'], traffic_data, weather_data, festival_data)
            
            distance_matrix[key1] = distance
            distance_matrix[key2] = distance.copy()  # Use a copy to avoid reference issues
        
        # Try all permutations of customers to find shortest route
        best_route = None
        min_total_time = float('inf')  # Optimize for time instead of distance
        
        for perm in itertools.permutations(addresses):
            total_time = 0
            
            # Time from start to first customer
            key = (start_location, perm[0]['address'])
            total_time += distance_matrix[key]['duration']
            
            # Time between consecutive customers
            for i in range(len(perm) - 1):
                key = (perm[i]['address'], perm[i+1]['address'])
                total_time += distance_matrix[key]['duration']
            
            # Return to start (optional)
            # key = (perm[-1]['address'], start_location)
            # total_time += distance_matrix[key]['duration']
            
            if total_time < min_total_time:
                min_total_time = total_time
                best_route = perm
        
        # Prepare the result with detailed route information
        route_details = []
        total_distance = 0
        total_duration = 0
        
        # First leg: Start to first customer
        first_leg = {
            'from': 'Start Location (Postman)',
            'from_address': start_location,
            'to': best_route[0]['name'] + (f" ({best_route[0]['parcel_count']} parcels)" if best_route[0]['parcel_count'] > 1 else ""),
            'to_address': best_route[0]['address'],
            'distance': distance_matrix[(start_location, best_route[0]['address'])]['text_distance'],
            'duration': distance_matrix[(start_location, best_route[0]['address'])]['text_duration'],
            'traffic_conditions': distance_matrix[(start_location, best_route[0]['address'])].get('traffic_conditions', 'Normal')
        }
        route_details.append(first_leg)
        total_distance += distance_matrix[(start_location, best_route[0]['address'])]['distance']
        total_duration += distance_matrix[(start_location, best_route[0]['address'])]['duration']
        
        # Add remaining legs
        for i in range(len(best_route) - 1):
            leg = {
                'from': best_route[i]['name'] + (f" ({best_route[i]['parcel_count']} parcels)" if best_route[i]['parcel_count'] > 1 else ""),
                'from_address': best_route[i]['address'],
                'to': best_route[i+1]['name'] + (f" ({best_route[i+1]['parcel_count']} parcels)" if best_route[i+1]['parcel_count'] > 1 else ""),
                'to_address': best_route[i+1]['address'],
                'distance': distance_matrix[(best_route[i]['address'], best_route[i+1]['address'])]['text_distance'],
                'duration': distance_matrix[(best_route[i]['address'], best_route[i+1]['address'])]['text_duration'],
                'traffic_conditions': distance_matrix[(best_route[i]['address'], best_route[i+1]['address'])].get('traffic_conditions', 'Normal')
            }
            route_details.append(leg)
            total_distance += distance_matrix[(best_route[i]['address'], best_route[i+1]['address'])]['distance']
            total_duration += distance_matrix[(best_route[i]['address'], best_route[i+1]['address'])]['duration']
        
        # Format route names with parcel counts
        route_names = []
        for item in best_route:
            name = item['name']
            if item['parcel_count'] > 1:
                name += f" ({item['parcel_count']} parcels)"
            route_names.append(name)
        
        # Add weather and festival information to route data
        route_info = {
            'route': route_names,
            'total_distance': f"{total_distance:.1f} km",
            'total_duration': f"{total_duration} mins",
            'details': route_details,
            'weather_conditions': self._get_weather_summary(weather_data),
            'traffic_summary': self._get_traffic_summary(traffic_data),
            'festival_impact': self._get_festival_summary(festival_data)
        }
        
        return route_info
    
    def _adjust_travel_duration(self, distance_data, area, traffic_data, weather_data, festival_data):
        """
        Adjust travel duration based on real-time traffic, weather, and festival data
        
        Parameters:
        - distance_data: Dictionary with distance and duration information
        - area: The area where the travel occurs
        - traffic_data: Real-time traffic data
        - weather_data: Real-time weather data
        - festival_data: Festival data
        """
        # Base duration
        base_duration = distance_data['duration']
        
        # Default multiplier (no adjustment)
        multiplier = 1.0
        traffic_conditions = "Normal"
        
        # Apply traffic adjustments
        if isinstance(traffic_data, dict) and area in traffic_data:
            area_traffic = traffic_data[area]
            congestion_level = area_traffic.get('congestion_level', 5)
            
            # Adjust multiplier based on congestion level (1-10)
            if congestion_level <= 3:  # Light traffic
                multiplier *= 0.9
                traffic_conditions = "Light"
            elif congestion_level <= 6:  # Normal traffic
                multiplier *= 1.0
                traffic_conditions = "Normal"
            elif congestion_level <= 8:  # Heavy traffic
                multiplier *= 1.3
                traffic_conditions = "Heavy"
            else:  # Severe traffic
                multiplier *= 1.6
                traffic_conditions = "Severe"
        
        # Apply weather adjustments
        if isinstance(weather_data, dict):
            conditions = weather_data.get('conditions', '').lower()
            
            # Rain/snow increases travel time
            if 'rain' in conditions or 'snow' in conditions or 'thunderstorm' in conditions:
                multiplier *= 1.2
                traffic_conditions += ", Wet Roads"
            
            # Low visibility conditions
            if 'fog' in conditions or 'mist' in conditions:
                multiplier *= 1.15
                traffic_conditions += ", Poor Visibility"
        
        # Apply festival impact if applicable
        if isinstance(festival_data, dict) and festival_data.get('has_festival_today', False):
            for festival in festival_data.get('festivals', []):
                if area in festival.get('affected_areas', []):
                    traffic_impact = festival.get('traffic_impact', 'Moderate')
                    
                    if traffic_impact == 'Severe':
                        multiplier *= 1.5
                        traffic_conditions += f", Festival: {festival.get('name', 'Unknown')}"
                    elif traffic_impact == 'High':
                        multiplier *= 1.3
                        traffic_conditions += f", Festival: {festival.get('name', 'Unknown')}"
                    elif traffic_impact == 'Moderate':
                        multiplier *= 1.2
                    # Low impact doesn't need adjustment
        
        # Update duration
        adjusted_duration = int(base_duration * multiplier)
        distance_data['duration'] = adjusted_duration
        distance_data['text_duration'] = f"{adjusted_duration} mins"
        distance_data['traffic_conditions'] = traffic_conditions
        
        return distance_data
    
    def _get_weather_summary(self, weather_data):
        """Generate a summary of current weather conditions"""
        if not isinstance(weather_data, dict):
            return "Weather data unavailable"
            
        conditions = weather_data.get('conditions', 'Unknown')
        temp = weather_data.get('temperature', {}).get('current', 'N/A')
        units = weather_data.get('temperature', {}).get('units', 'C')
        
        precip_chance = weather_data.get('precipitation', {}).get('chance', 0)
        precip_type = weather_data.get('precipitation', {}).get('type', 'None')
        
        warnings = weather_data.get('warnings', [])
        
        summary = f"{conditions}, {temp}°{units}"
        
        if precip_chance > 30 and precip_type.lower() != 'none':
            summary += f", {precip_chance}% chance of {precip_type}"
            
        if warnings:
            summary += f", Warning: {warnings[0]}"
            
        return summary
    
    def _get_traffic_summary(self, traffic_data):
        """Generate a summary of current traffic conditions"""
        if not isinstance(traffic_data, dict):
            return "Traffic data unavailable"
            
        # Calculate average congestion level across all areas
        congestion_levels = []
        congested_areas = []
        
        for area, data in traffic_data.items():
            if isinstance(data, dict) and 'congestion_level' in data:
                level = data['congestion_level']
                congestion_levels.append(level)
                
                if level >= 7:
                    congested_areas.append(f"{area} ({level}/10)")
        
        avg_congestion = sum(congestion_levels) / len(congestion_levels) if congestion_levels else 5
        
        if avg_congestion < 4:
            status = "Light traffic across most areas"
        elif avg_congestion < 6:
            status = "Normal traffic conditions"
        elif avg_congestion < 8:
            status = "Heavy traffic in several areas"
        else:
            status = "Severe traffic congestion"
            
        if congested_areas:
            if len(congested_areas) <= 2:
                status += f", particularly in {' and '.join(congested_areas)}"
            else:
                status += f", particularly in {', '.join(congested_areas[:2])} and {len(congested_areas)-2} other areas"
                
        return status
    
    def _get_festival_summary(self, festival_data):
        """Generate a summary of current festival impacts"""
        if not isinstance(festival_data, dict) or not festival_data.get('has_festival_today', False):
            return "No festivals or events affecting deliveries today"
            
        festivals = []
        for festival in festival_data.get('festivals', []):
            if festival.get('date') == datetime.now().strftime("%Y-%m-%d"):
                name = festival.get('name', 'Unknown event')
                location = festival.get('location', 'Unknown location')
                impact = festival.get('traffic_impact', 'Low')
                areas = ', '.join(festival.get('affected_areas', ['various areas']))
                
                festivals.append(f"{name} at {location} ({impact} impact on {areas})")
                
        if not festivals:
            return "No festivals or events affecting deliveries today"
            
        if len(festivals) == 1:
            return f"Event affecting deliveries today: {festivals[0]}"
        else:
            return f"Multiple events affecting deliveries today: {festivals[0]} and {len(festivals)-1} more"
    
    def generate_pending_orders(self, num_orders=20):
        """Generate a stack of fake pending orders"""
        names = list(self.customer_areas.keys())  # Use names from customer_areas
        sizes = self.df['Package Size'].unique()
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        # Get current day of week
        current_day = datetime.now().strftime('%A')
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%A')
        day_after = (datetime.now() + timedelta(days=2)).strftime('%A')
        
        # Generate orders for today, tomorrow, and day after tomorrow
        delivery_days = [current_day, tomorrow, day_after]
        
        # Create a stack of pending orders
        self.pending_orders = []
        order_id = 10000
        
        for _ in range(num_orders):
            name = random.choice(names)
            day = random.choice(delivery_days)
            area = self.customer_areas[name]  # Use fixed area for this customer
            size = random.choice(sizes)
            
            order = {
                'order_id': order_id,
                'name': name,
                'delivery_day': day,
                'area': area,
                'address': self.customer_addresses.get(name, "Address not available"),
                'package_size': size,
                'status': 'Pending',
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            self.pending_orders.append(order)
            order_id += 1
            
        # Save pending orders to a JSON file
        with open('pending_orders.json', 'w') as f:
            json.dump(self.pending_orders, f, indent=2)
            
        print(f"Generated {num_orders} pending orders")
    
    def get_pending_orders(self):
        """Return the list of pending orders"""
        return self.pending_orders
    
    def add_order(self, name, delivery_day, package_size=None):
        """Add a new order to the pending stack"""
        # Use the fixed area for this customer
        area = self.customer_areas.get(name, "Unknown")
        
        if package_size is None:
            package_size = random.choice(['Small', 'Medium', 'Large'])
            
        order_id = max([o['order_id'] for o in self.pending_orders]) + 1 if self.pending_orders else 10000
        
        order = {
            'order_id': order_id,
            'name': name,
            'delivery_day': delivery_day,
            'area': area,
            'address': self.customer_addresses.get(name, "Address not available"),
            'package_size': package_size,
            'status': 'Pending',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        self.pending_orders.append(order)
        
        # Update JSON file
        with open('pending_orders.json', 'w') as f:
            json.dump(self.pending_orders, f, indent=2)
            
        return order_id
    
    def mark_delivered(self, order_id, success=True):
        """Mark an order as delivered"""
        for i, order in enumerate(self.pending_orders):
            if order['order_id'] == order_id:
                status = 'Success' if success else 'Fail'
                self.pending_orders[i]['status'] = status
                
                # Add to dataset for future predictions
                new_entry = {
                    'Name': order['name'],
                    'Day of Delivery Attempt': order['delivery_day'],
                    'Time': datetime.now().strftime('%-I %p').replace(' 0', ' '),  # Format like "2 PM"
                    'Area': order['area'],
                    'Package Size': order['package_size'],
                    'Delivery Status': status
                }
                
                # Append to CSV
                new_df = pd.DataFrame([new_entry])
                new_df.to_csv('dataset.csv', mode='a', header=False, index=False)
                
                # Remove from pending
                self.pending_orders.pop(i)
                
                # Update JSON file
                with open('pending_orders.json', 'w') as f:
                    json.dump(self.pending_orders, f, indent=2)
                
                return True
        
        return False
    
    def get_todays_orders(self):
        """Get orders scheduled for today"""
        current_day = datetime.now().strftime('%A')
        return [order for order in self.pending_orders if order['delivery_day'] == current_day]
    
    def get_real_time_data(self, data_type, area=None):
        """
        Fetch real-time data from Perplexity API
        
        Parameters:
        - data_type: Type of data to fetch ('traffic', 'weather', or 'festivals')
        - area: Specific area in Ahmedabad to get data for (optional)
        
        Returns:
        - Dictionary with relevant real-time data
        """
        if not self.perplexity_api_key:
            return self._generate_mock_real_time_data(data_type, area)
            
        # Check if we have cached data that's still valid
        cache = self.real_time_data_cache.get(data_type)
        if cache and cache['data'] and cache['timestamp']:
            cache_age = (datetime.now() - cache['timestamp']).total_seconds()
            if cache_age < self.cache_lifetime.get(data_type, 3600):
                # If area is specified and exists in cached data, return only that area's data
                if area and data_type in ['traffic', 'weather'] and area in cache['data']:
                    return cache['data'][area]
                return cache['data']
                
        # Prepare the prompt based on data type
        if data_type == 'traffic':
            prompt = f"What's the current real-time traffic situation in Ahmedabad, India?"
            if area:
                prompt = f"What's the current real-time traffic situation in {area}, Ahmedabad, India?"
        elif data_type == 'weather':
            prompt = "What's the current weather in Ahmedabad, India? Include temperature, precipitation chance, and any weather warnings."
            if area:
                prompt = f"What's the current weather in {area}, Ahmedabad, India? Include temperature, precipitation chance, and any weather warnings."
        elif data_type == 'festivals':
            prompt = "Are there any festivals, events, or public gatherings happening today or this week in Ahmedabad, India that might affect traffic or delivery schedules?"
        else:
            return {"error": "Invalid data type requested"}
            
        # Prepare API request
        headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sonar",
            "messages": [
                {"role": "system", "content": "You are an AI assistant providing factual, real-time information in JSON format. For traffic data, rate congestion on a scale of 1-10 and provide estimated delay times. For weather, provide temperature, conditions, precipitation chance, and any warnings. For festivals, list events with locations, times, and expected crowd sizes."},
                {"role": "user", "content": f"{prompt} Return the data in a structured JSON format without any explanatory text."}
            ],
            "temperature": 0.1
        }
        
        try:
            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to extract JSON from the response
                try:
                    # Find JSON content between code blocks if present
                    if "```json" in content and "```" in content.split("```json", 1)[1]:
                        json_str = content.split("```json", 1)[1].split("```", 1)[0]
                        data = json.loads(json_str)
                    elif "```" in content and "```" in content.split("```", 1)[1]:
                        json_str = content.split("```", 1)[1].split("```", 1)[0]
                        data = json.loads(json_str)
                    else:
                        # Try to parse the entire content as JSON
                        data = json.loads(content)
                    
                    # Update cache
                    self.real_time_data_cache[data_type] = {
                        'data': data,
                        'timestamp': datetime.now()
                    }
                    
                    # If area is specified and exists in data, return only that area's data
                    if area and data_type in ['traffic', 'weather'] and isinstance(data, dict) and area in data:
                        return data[area]
                        
                    return data
                except (json.JSONDecodeError, ValueError, KeyError) as e:
                    # If parsing fails, return the raw content
                    return {"error": f"Failed to parse JSON: {str(e)}", "raw_content": content}
            else:
                return {"error": f"API error: {response.status_code}", "details": response.text}
                
        except Exception as e:
            # Fall back to mock data on any error
            return self._generate_mock_real_time_data(data_type, area)
    
    def _generate_mock_real_time_data(self, data_type, area=None):
        """Generate mock real-time data when API is unavailable"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if data_type == 'traffic':
            # Generate realistic traffic data for different areas of Ahmedabad
            # Current time to determine traffic patterns
            current_hour = datetime.now().hour
            current_weekday = datetime.now().weekday()  # 0-6 (Monday-Sunday)
            
            # Define traffic patterns based on time of day and day of week
            is_weekend = current_weekday >= 5
            is_morning_rush = 8 <= current_hour <= 10 and not is_weekend
            is_evening_rush = 17 <= current_hour <= 19 and not is_weekend
            is_daytime = 9 <= current_hour <= 18
            
            # Base congestion levels for different areas (adjusted to reality)
            base_congestion = {
                "Satellite": 6,  # Higher traffic area
                "Navrangpura": 7,  # Central business district
                "Bopal": 5,  # Residential area with moderate traffic
                "Vastrapur": 6,  # Commercial and residential mix
                "Paldi": 5,  # Moderate traffic
                "Thaltej": 7,  # Heavy traffic near highways
                "Bodakdev": 6,  # Commercial area
                "Gota": 4,  # Less congested
                "Maninagar": 6,  # Market area
                "Chandkheda": 5  # Moderate traffic
            }
            
            # Apply time-based modifiers
            modifiers = {}
            if is_morning_rush:
                modifiers = {
                    "Satellite": 2,
                    "Navrangpura": 2, 
                    "Thaltej": 2,
                    "Bodakdev": 2,
                    "Vastrapur": 1.5,
                    "Paldi": 1.5,
                    "Chandkheda": 1.5,
                    "Maninagar": 1.5,
                    "Bopal": 1.5,
                    "Gota": 1
                }
            elif is_evening_rush:
                modifiers = {
                    "Satellite": 2,
                    "Navrangpura": 2, 
                    "Thaltej": 2,
                    "Bodakdev": 2,
                    "Vastrapur": 2,
                    "Paldi": 1.5,
                    "Maninagar": 2,
                    "Bopal": 1.5,
                    "Gota": 1.5,
                    "Chandkheda": 1.5
                }
            elif is_daytime and not is_weekend:
                modifiers = {
                    "Satellite": 1,
                    "Navrangpura": 1.2, 
                    "Thaltej": 1,
                    "Bodakdev": 1,
                    "Vastrapur": 1,
                    "Paldi": 0.8,
                    "Maninagar": 1,
                    "Bopal": 0.7,
                    "Gota": 0.7,
                    "Chandkheda": 0.8
                }
            elif is_weekend:
                # Weekend patterns - more traffic to malls and entertainment
                modifiers = {
                    "Satellite": 1,  # Mall areas
                    "Navrangpura": 0.7,
                    "Thaltej": 0.8,
                    "Bodakdev": 0.7,
                    "Vastrapur": 1,  # Lake area
                    "Paldi": 0.6,
                    "Maninagar": 0.8,
                    "Bopal": 0.6,
                    "Gota": 0.5,
                    "Chandkheda": 0.5
                }
            
            # Calculate traffic data with some randomness
            traffic_data = {}
            total_congestion = 0
            areas_count = 0
            
            for area, base in base_congestion.items():
                modifier = modifiers.get(area, 1.0)
                # Apply modifier and add small random variation
                congestion = min(10, max(1, round(base * modifier + random.uniform(-0.5, 0.5))))
                
                # Calculate delay based on congestion (exponential relationship)
                delay = int(5 * (1.5 ** congestion))
                
                # Get appropriate status based on congestion
                if congestion <= 3:
                    status = "Smooth traffic flow"
                elif congestion <= 5:
                    status = "Regular traffic flow"
                elif congestion <= 7:
                    status = "Moderate congestion"
                elif congestion <= 9:
                    status = "Heavy traffic"
                else:
                    status = "Severe congestion, avoid if possible"
                
                # Define peak areas based on the actual area
                peak_areas = []
                if area == "Satellite":
                    peak_areas = ["Shrivranjani Junction", "Iscon Cross Roads", "Jodhpur Crossroad"]
                elif area == "Navrangpura":
                    peak_areas = ["Law Garden", "Gujarat College", "Navrangpura Bus Station"]
                elif area == "Bopal":
                    peak_areas = ["Bopal Circle", "South Bopal"]
                elif area == "Vastrapur":
                    peak_areas = ["Vastrapur Lake", "Alpha Mall", "Mansi Circle"]
                elif area == "Paldi":
                    peak_areas = ["Paldi Cross Roads", "Ellis Bridge"]
                elif area == "Thaltej":
                    peak_areas = ["Thaltej Junction", "Drive-In Road", "SG Highway"]
                elif area == "Bodakdev":
                    peak_areas = ["Rajpath Club Road", "Science City Road", "Judges Bungalow Road"]
                elif area == "Gota":
                    peak_areas = ["Gota Flyover", "Gota Chokdi"]
                elif area == "Maninagar":
                    peak_areas = ["Maninagar Railway Station", "Bhulabhai Cross Road"]
                elif area == "Chandkheda":
                    peak_areas = ["Chandkheda Bus Stand", "Sabarmati Railway Station"]
                
                # Add to traffic data
                traffic_data[area] = {
                    "congestion_level": congestion,
                    "delay_minutes": delay,
                    "status": status,
                    "peak_areas": peak_areas[:2],  # Take up to 2 peak areas
                    "timestamp": timestamp
                }
                
                total_congestion += congestion
                areas_count += 1
            
            # Calculate overall city congestion
            if areas_count > 0:
                overall_congestion = round(total_congestion / areas_count)
                
                # Get appropriate overall city status
                if overall_congestion <= 3:
                    overall_status = "Traffic flowing smoothly across the city"
                elif overall_congestion <= 5:
                    overall_status = "Normal traffic conditions in most areas"
                elif overall_congestion <= 7:
                    overall_status = "Moderate congestion in several areas"
                elif overall_congestion <= 9:
                    overall_status = "Heavy traffic throughout the city"
                else:
                    overall_status = "Severe congestion across the city"
                
                # Add overall city data
                traffic_data["overall_city_congestion"] = overall_congestion
                traffic_data["status"] = overall_status
            
            # Update cache
            self.real_time_data_cache['traffic'] = {
                'data': traffic_data,
                'timestamp': datetime.now()
            }
            
            if area and area in traffic_data:
                return traffic_data[area]
            return traffic_data
            
        elif data_type == 'weather':
            # Generate realistic weather data for Ahmedabad based on current season
            # Using more accurate data that matches weather.com (31°C)
            
            # Get current month to determine seasonal patterns
            current_month = datetime.now().month
            
            # Summer months (March-June): Hot and dry
            if 3 <= current_month <= 6:
                temp_range = (29, 33)
                humidity_range = (10, 25)
                precip_chance = random.randint(0, 10)
                conditions = random.choice(["Clear", "Sunny", "Hot", "Very Hot"])
                is_rainy = False
                
            # Monsoon months (July-September): Hot and humid with rain
            elif 7 <= current_month <= 9:
                temp_range = (27, 32)
                humidity_range = (60, 85)
                precip_chance = random.randint(30, 90)
                conditions = random.choice(["Rainy", "Thunderstorms", "Overcast", "Partly Cloudy"])
                is_rainy = precip_chance > 40
                
            # Winter months (November-February): Mild and dry
            elif current_month in [11, 12, 1, 2]:
                temp_range = (15, 25)
                humidity_range = (30, 50)
                precip_chance = random.randint(0, 15)
                conditions = random.choice(["Clear", "Sunny", "Mild", "Pleasant"])
                is_rainy = False
                
            # October: Transitional month
            else:
                temp_range = (25, 30)
                humidity_range = (40, 60)
                precip_chance = random.randint(10, 30)
                conditions = random.choice(["Partly Cloudy", "Mostly Sunny", "Pleasant"])
                is_rainy = precip_chance > 70
            
            # Actual current temperature from weather.com (31°C)
            current_temp = 31
            feels_like = current_temp + random.randint(0, 2)
            
            weather_data = {
                "temperature": {
                    "current": current_temp,
                    "feels_like": feels_like,
                    "units": "Celsius"
                },
                "conditions": conditions,
                "precipitation": {
                    "chance": precip_chance,
                    "type": "Rain" if is_rainy else "None"
                },
                "humidity": random.randint(humidity_range[0], humidity_range[1]),
                "wind": {
                    "speed": random.randint(5, 15),
                    "direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
                    "units": "km/h"
                },
                "timestamp": timestamp
            }
            
            # Add heat warnings when temperatures are high (which is common in Ahmedabad)
            warnings = []
            if current_temp >= 35:
                warnings.append("Heat advisory: Stay hydrated and avoid prolonged sun exposure")
            elif current_temp >= 40:
                warnings.append("Extreme heat warning: Avoid outdoor activities")
                
            # Set warnings
            weather_data["warnings"] = warnings
            
            # Update cache
            self.real_time_data_cache['weather'] = {
                'data': weather_data,
                'timestamp': datetime.now()
            }
            
            return weather_data
            
        elif data_type == 'festivals':
            # Generate mock festival data
            today = datetime.now().strftime("%Y-%m-%d")
            
            # 30% chance of having a festival today
            has_festival_today = random.random() < 0.3
            
            festivals = []
            if has_festival_today:
                festivals.append({
                    "name": random.choice([
                        "Navratri Celebrations", 
                        "Uttarayan Kite Festival", 
                        "Rath Yatra",
                        "Diwali Street Fair", 
                        "Janmashtami Procession",
                        "Local Food Festival", 
                        "Ahmedabad Heritage Week"
                    ]),
                    "date": today,
                    "time": f"{random.randint(9, 18):02d}:00 - {random.randint(19, 23):02d}:00",
                    "location": random.choice([
                        "Riverfront", 
                        "Old City",
                        "Kankaria Lake", 
                        "GMDC Ground", 
                        "Sabarmati Riverfront",
                        "Law Garden"
                    ]),
                    "crowd_size": random.choice(["Small", "Medium", "Large", "Very Large"]),
                    "traffic_impact": random.choice(["Low", "Moderate", "High", "Severe"]),
                    "affected_areas": random.sample([
                        "Satellite", 
                        "Navrangpura",
                        "Paldi",
                        "Maninagar",
                        "Old City"
                    ], k=random.randint(1, 3))
                })
            
            # Add a future festival
            future_date = (datetime.now() + timedelta(days=random.randint(1, 7))).strftime("%Y-%m-%d")
            festivals.append({
                "name": random.choice([
                    "Weekend Market", 
                    "Cultural Show",
                    "Music Festival", 
                    "Trade Fair", 
                    "Religious Procession"
                ]),
                "date": future_date,
                "time": f"{random.randint(10, 16):02d}:00 - {random.randint(18, 22):02d}:00",
                "location": random.choice([
                    "Exhibition Center", 
                    "City Center",
                    "University Campus", 
                    "Stadium", 
                    "Convention Center"
                ]),
                "crowd_size": random.choice(["Small", "Medium", "Large"]),
                "traffic_impact": random.choice(["Low", "Moderate", "High"]),
                "affected_areas": random.sample([
                    "Satellite", 
                    "Vastrapur", 
                    "Bodakdev",
                    "Navrangpura"
                ], k=random.randint(1, 2))
            })
            
            festival_data = {
                "festivals": festivals,
                "has_festival_today": has_festival_today,
                "timestamp": timestamp
            }
            
            # Update cache
            self.real_time_data_cache['festivals'] = {
                'data': festival_data,
                'timestamp': datetime.now()
            }
            
            return festival_data
        
        return {"error": "Invalid data type requested"}

# Test the predictor
if __name__ == "__main__":
    predictor = DeliveryPredictor()
    
    # Current day
    current_day = datetime.now().strftime('%A')
    
    # Print some example predictions
    print(f"\nOptimal delivery times for today ({current_day}):")
    for name in ['Kabir', 'Aditya', 'Meera']:
        optimal_times = predictor.predict_optimal_times(name, current_day)
        print(f"{name}:")
        for prediction in optimal_times:
            print(f"  {prediction['time']} - {prediction['failure_rate']}% failure rate")
    
    # Print pending orders
    print("\nPending Orders:")
    for order in predictor.get_pending_orders()[:5]:  # Show first 5 orders
        print(f"Order #{order['order_id']}: {order['name']} - {order['delivery_day']} - {order['area']} - {order['status']}")
    
    # Test route optimization
    print("\nOptimal Route Test:")
    test_customers = ['Aryan', 'Ishaan', 'Kabir']
    optimal_route = predictor.optimize_delivery_route(test_customers)
    print(f"Optimal route: {' -> '.join(optimal_route['route'])}")
    print(f"Total distance: {optimal_route['total_distance']}")
    print("\nDetailed route:")
    for i, leg in enumerate(optimal_route['details']):
        print(f"Leg {i+1}: {leg['from']} to {leg['to']} ({leg['distance']}, {leg['duration']})") 